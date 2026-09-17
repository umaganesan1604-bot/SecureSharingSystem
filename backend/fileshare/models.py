import uuid
from django.db import models
from django.contrib.auth.models import User

class SecureFile(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        DELETED = 'DELETED', 'Deleted'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_files')
    original_filename = models.CharField(max_length=255)
    
    # Safe storage path on server - contains ONLY encrypted ciphertext
    storage_path = models.CharField(max_length=512)
    file_size = models.BigIntegerField(help_text="Original file size in bytes")
    content_type = models.CharField(max_length=100, default='application/octet-stream')
    
    # Envelope encryption metadata
    encryption_version = models.CharField(max_length=50, default='AES-256-GCM-v1')
    file_nonce = models.CharField(max_length=64, help_text="Base64 encoded 96-bit AES-GCM nonce")
    encrypted_dek = models.TextField(help_text="Base64 encoded Data Encryption Key encrypted by KEK")
    dek_nonce = models.CharField(max_length=64, help_text="Base64 encoded 96-bit KEK nonce")

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    uploaded_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.original_filename} (Owner: {self.owner.username})"

    @property
    def encryption_metadata(self) -> dict:
        return {
            'encryption_version': self.encryption_version,
            'file_nonce': self.file_nonce,
            'encrypted_dek': self.encrypted_dek,
            'dek_nonce': self.dek_nonce,
        }


class FileShare(models.Model):
    class Permission(models.TextChoices):
        VIEW = 'VIEW', 'View'
        DOWNLOAD = 'DOWNLOAD', 'Download'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        REVOKED = 'REVOKED', 'Revoked'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(SecureFile, on_delete=models.CASCADE, related_name='shares')
    shared_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shares_granted')
    shared_with = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shares_received')
    permission = models.CharField(max_length=20, choices=Permission.choices, default=Permission.DOWNLOAD)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['file', 'shared_with'],
                name='unique_active_file_share'
            )
        ]

    def __str__(self):
        return f"{self.file.original_filename} shared with {self.shared_with.username} ({self.permission}, {self.status})"
