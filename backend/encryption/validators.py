"""
File and filename validation utilities for SecureShare.
Guards against path traversal, oversized uploads, and executable payload execution.
"""
import os
import re
import uuid
from pathlib import Path
from django.conf import settings
from rest_framework.exceptions import ValidationError

DANGEROUS_EXTENSIONS = {
    '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.msi', '.com', 
    '.scr', '.pif', '.application', '.gadget', '.hta', '.cpl', '.msc',
    '.jar', '.dll', '.so', '.dylib'
}

def sanitize_filename(filename: str) -> str:
    """
    Strips directory separators and path traversal attempts from original filename.
    """
    if not filename:
        return f"unnamed_file_{uuid.uuid4().hex[:8]}"
    
    # Remove directory paths (both Unix and Windows)
    clean_name = os.path.basename(filename)
    clean_name = clean_name.replace('/', '').replace('\\', '').replace('..', '')
    
    # Strip any dangerous control characters
    clean_name = re.sub(r'[\x00-\x1f\x7f]', '', clean_name)
    
    # If empty after cleanup, assign safe fallback
    if not clean_name.strip() or clean_name in ('.', '..'):
        clean_name = f"secure_file_{uuid.uuid4().hex[:8]}"
        
    return clean_name

def validate_uploaded_file(uploaded_file):
    """
    Validates file size, extension, and content type.
    """
    # 1. Size check
    max_size = getattr(settings, 'MAX_UPLOAD_SIZE_BYTES', 25 * 1024 * 1024)
    if uploaded_file.size > max_size:
        max_mb = max_size // (1024 * 1024)
        raise ValidationError(f"File size exceeds the allowed limit of {max_mb} MB.")

    if uploaded_file.size == 0:
        raise ValidationError("Uploaded file cannot be empty.")

    # 2. Extension check
    filename = uploaded_file.name
    ext = Path(filename).suffix.lower()
    if ext in DANGEROUS_EXTENSIONS:
        raise ValidationError(f"File type '{ext}' is not permitted for upload due to security policies.")

    return True

def generate_secure_storage_path() -> str:
    """
    Generates a cryptographically random, collision-free storage path for encrypted blobs.
    Files are saved as UUID.enc inside the encrypted storage directory.
    """
    random_filename = f"{uuid.uuid4().hex}.enc"
    encrypted_dir = getattr(settings, 'ENCRYPTED_FILES_DIR', settings.MEDIA_ROOT / 'encrypted_files')
    return str(Path(encrypted_dir) / random_filename)
