"""
Cryptographic Service for SecureShare.
Implements Application-Level AES-256-GCM Envelope Encryption.

Architecture:
  Plaintext File
       ↓ (Encrypted with unique 256-bit Data Encryption Key - DEK)
  Encrypted Ciphertext (Stored in persistent media/encrypted_files/<uuid>.enc)
  
  DEK (256-bit)
       ↓ (Encrypted with 256-bit Key Encryption Key - KEK / Master Key)
  Encrypted DEK (Stored in database metadata)
  
  Every operation uses a distinct 96-bit (12 bytes) cryptographically secure Nonce.
  AES-GCM authenticates the entire payload; any bit-level tampering fails verification.
"""
import os
import base64
import logging
from typing import Tuple, Dict
from django.conf import settings
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

logger = logging.getLogger(__name__)

ENCRYPTION_VERSION = "AES-256-GCM-v1"
NONCE_LENGTH = 12  # 96-bit nonce recommended for AES-GCM
KEY_LENGTH = 32    # 256-bit key

class EncryptionError(Exception):
    """Base exception for cryptographic failures."""
    pass

class DecryptionAuthError(EncryptionError):
    """Raised when authentication tag verification fails due to tampering or wrong key."""
    pass

def get_master_key() -> bytes:
    """
    Retrieves and decodes the Key Encryption Key (KEK) from application settings.
    Ensures key is strictly 256 bits (32 bytes).
    """
    key_str = getattr(settings, 'ENCRYPTION_KEY', None)
    if not key_str:
        raise EncryptionError("Application master encryption key (ENCRYPTION_KEY) is not configured.")

    try:
        key_bytes = base64.b64decode(key_str)
    except Exception as e:
        raise EncryptionError(f"Invalid base64 encoding for master encryption key: {e}")

    if len(key_bytes) != KEY_LENGTH:
        raise EncryptionError(f"Master encryption key must be exactly 32 bytes (256 bits). Received {len(key_bytes)} bytes.")

    return key_bytes

def encrypt_payload(plaintext: bytes) -> Tuple[bytes, Dict[str, str]]:
    """
    Encrypts arbitrary bytes using AES-256-GCM envelope encryption.
    Returns:
        (ciphertext_bytes, metadata_dict)
    """
    if not isinstance(plaintext, bytes):
        raise TypeError("Plaintext data to encrypt must be bytes.")

    master_key = get_master_key()

    # 1. Generate a cryptographically random 256-bit Data Encryption Key (DEK)
    dek = os.urandom(KEY_LENGTH)

    # 2. Generate a unique 96-bit Nonce for file encryption
    file_nonce = os.urandom(NONCE_LENGTH)

    # 3. Encrypt the plaintext with DEK using AES-256-GCM
    # Note: AESGCM.encrypt appends the 16-byte (128-bit) authentication tag to the ciphertext
    aesgcm_dek = AESGCM(dek)
    ciphertext = aesgcm_dek.encrypt(file_nonce, plaintext, None)

    # 4. Generate a unique 96-bit Nonce for DEK wrapping (KEK)
    dek_nonce = os.urandom(NONCE_LENGTH)

    # 5. Encrypt the DEK with the Master Key (KEK)
    aesgcm_kek = AESGCM(master_key)
    encrypted_dek = aesgcm_kek.encrypt(dek_nonce, dek, None)

    metadata = {
        'encryption_version': ENCRYPTION_VERSION,
        'file_nonce': base64.b64encode(file_nonce).decode('utf-8'),
        'encrypted_dek': base64.b64encode(encrypted_dek).decode('utf-8'),
        'dek_nonce': base64.b64encode(dek_nonce).decode('utf-8'),
    }

    return ciphertext, metadata

def decrypt_payload(ciphertext: bytes, metadata: Dict[str, str], master_key_override: bytes = None) -> bytes:
    """
    Decrypts ciphertext using envelope encryption metadata and verifies AES-GCM authentication tag.
    Raises DecryptionAuthError if authentication tag fails (tampered or wrong key).
    """
    if not isinstance(ciphertext, bytes):
        raise TypeError("Ciphertext data must be bytes.")

    master_key = master_key_override or get_master_key()

    try:
        file_nonce = base64.b64decode(metadata['file_nonce'])
        encrypted_dek = base64.b64decode(metadata['encrypted_dek'])
        dek_nonce = base64.b64decode(metadata['dek_nonce'])
    except KeyError as ke:
        raise EncryptionError(f"Missing required encryption metadata field: {ke}")
    except Exception as e:
        raise EncryptionError(f"Malformed base64 in encryption metadata: {e}")

    # 1. Decrypt DEK using Master Key (KEK)
    try:
        aesgcm_kek = AESGCM(master_key)
        dek = aesgcm_kek.decrypt(dek_nonce, encrypted_dek, None)
    except InvalidTag:
        logger.warning("Failed to decrypt DEK: authentication tag mismatch or wrong KEK.")
        raise DecryptionAuthError("Failed to decrypt encryption key. Authentication tag mismatch or invalid key.")
    except Exception as e:
        raise EncryptionError(f"Unexpected error unwrapping DEK: {e}")

    # 2. Decrypt ciphertext using DEK
    try:
        aesgcm_dek = AESGCM(dek)
        plaintext = aesgcm_dek.decrypt(file_nonce, ciphertext, None)
        return plaintext
    except InvalidTag:
        logger.warning("Decryption failed: AES-256-GCM authentication tag mismatch (tampering detected).")
        raise DecryptionAuthError("Decryption failed: File authentication tag verification failed. Data may be tampered or corrupted.")
    except Exception as e:
        raise EncryptionError(f"Unexpected error during file decryption: {e}")

def encrypt_and_save_to_disk(uploaded_file, destination_path: str) -> Dict[str, str]:
    """
    Reads an uploaded file in memory/stream, encrypts it with AES-256-GCM,
    and writes ONLY the ciphertext to destination_path.
    Never persists the plaintext to disk.
    """
    plaintext_data = uploaded_file.read()
    ciphertext, metadata = encrypt_payload(plaintext_data)

    os.makedirs(os.path.dirname(destination_path), exist_ok=True)
    with open(destination_path, 'wb') as f:
        f.write(ciphertext)

    return metadata

def read_and_decrypt_from_disk(storage_path: str, metadata: Dict[str, str]) -> bytes:
    """
    Reads encrypted file from storage_path and returns decrypted plaintext bytes.
    """
    if not os.path.exists(storage_path):
        raise FileNotFoundError("The requested encrypted file was not found on the server.")

    with open(storage_path, 'rb') as f:
        ciphertext = f.read()

    return decrypt_payload(ciphertext, metadata)
