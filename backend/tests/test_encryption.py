"""
Tests for AES-256-GCM Envelope Encryption and Key Management.
Covers:
  - TEST 6: Tamper with ciphertext -> AES-GCM tag authentication failure
  - TEST 7: Inspect persistent uploaded file -> binary ciphertext, never plaintext
  - Round trip encrypt/decrypt
  - Wrong Master Key fails decryption
  - Nonce is randomly generated per operation
"""
import os
import secrets
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from encryption.services import (
    encrypt_payload,
    decrypt_payload,
    encrypt_and_save_to_disk,
    read_and_decrypt_from_disk,
    DecryptionAuthError,
    get_master_key
)
from encryption.validators import generate_secure_storage_path

class EncryptionTests(TestCase):
    def test_round_trip_encryption_decryption(self):
        """Plaintext is properly encrypted and decrypted back to exact original bytes."""
        original_data = b"Enterprise sensitive document content with confidential financial projections."
        ciphertext, metadata = encrypt_payload(original_data)

        # Ciphertext must differ from original data
        self.assertNotEqual(ciphertext, original_data)
        self.assertNotIn(original_data, ciphertext)

        # Decryption returns original bytes
        decrypted_data = decrypt_payload(ciphertext, metadata)
        self.assertEqual(decrypted_data, original_data)

    def test_nonce_uniqueness(self):
        """Consecutive encryptions of identical plaintext produce distinct nonces and ciphertexts."""
        data = b"Static payload that should have different ciphertexts."
        c1, meta1 = encrypt_payload(data)
        c2, meta2 = encrypt_payload(data)

        self.assertNotEqual(meta1['file_nonce'], meta2['file_nonce'])
        self.assertNotEqual(meta1['dek_nonce'], meta2['dek_nonce'])
        self.assertNotEqual(c1, c2)

    def test_scenario_6_tampered_ciphertext_fails_aes_gcm_auth(self):
        """
        TEST 6: Modify encrypted ciphertext.
        Expected: AES-GCM authentication/decryption failure.
        """
        original_data = b"Authentic organizational invoice and payment instructions."
        ciphertext, metadata = encrypt_payload(original_data)

        # Tamper with the ciphertext (flip a byte)
        tampered_bytearray = bytearray(ciphertext)
        tampered_bytearray[0] = tampered_bytearray[0] ^ 0xFF
        tampered_ciphertext = bytes(tampered_bytearray)

        # Attempting decryption must raise DecryptionAuthError
        with self.assertRaises(DecryptionAuthError):
            decrypt_payload(tampered_ciphertext, metadata)

    def test_wrong_master_key_fails_decryption(self):
        """Attempting decryption with an incorrect master key fails."""
        data = b"Secret internal strategic document."
        ciphertext, metadata = encrypt_payload(data)

        wrong_kek = secrets.token_bytes(32)
        with self.assertRaises(DecryptionAuthError):
            decrypt_payload(ciphertext, metadata, master_key_override=wrong_kek)

    def test_scenario_7_persistent_file_is_encrypted_not_plaintext(self):
        """
        TEST 7: Inspect persistent uploaded file.
        Expected: Stored content is encrypted ciphertext, not plaintext.
        """
        raw_text = b"CONFIDENTIAL_PAYROLL_DATA_DO_NOT_EXPOSE_AS_PLAINTEXT"
        upload_file = SimpleUploadedFile("payroll.txt", raw_text, content_type="text/plain")
        
        storage_path = generate_secure_storage_path()
        try:
            metadata = encrypt_and_save_to_disk(upload_file, storage_path)

            # Inspect persistent file on disk
            self.assertTrue(os.path.exists(storage_path))
            with open(storage_path, 'rb') as f:
                disk_content = f.read()

            # The persistent file on disk MUST NOT contain the plaintext
            self.assertNotEqual(disk_content, raw_text)
            self.assertNotIn(raw_text, disk_content)
            self.assertNotIn(b"CONFIDENTIAL_PAYROLL_DATA", disk_content)

            # Decrypt from disk to ensure integrity
            restored = read_and_decrypt_from_disk(storage_path, metadata)
            self.assertEqual(restored, raw_text)
        finally:
            if os.path.exists(storage_path):
                os.remove(storage_path)
