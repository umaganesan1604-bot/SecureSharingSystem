from django.db import models
from django.contrib.auth.models import User

class AuditLog(models.Model):
    class Action(models.TextChoices):
        REGISTER = 'REGISTER', 'User Registered'
        LOGIN_SUCCESS = 'LOGIN_SUCCESS', 'Login Successful'
        LOGIN_FAILED = 'LOGIN_FAILED', 'Login Failed'
        LOGOUT = 'LOGOUT', 'User Logged Out'
        FILE_UPLOAD = 'FILE_UPLOAD', 'File Uploaded'
        FILE_VIEW = 'FILE_VIEW', 'File Viewed'
        FILE_DOWNLOAD = 'FILE_DOWNLOAD', 'File Downloaded'
        FILE_SHARE = 'FILE_SHARE', 'File Shared'
        FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED', 'File Access Denied'
        FILE_DELETE = 'FILE_DELETE', 'File Deleted'
        ROLE_CHANGED = 'ROLE_CHANGED', 'User Role Changed'
        USER_CREATED = 'USER_CREATED', 'User Created'
        USER_DELETED = 'USER_DELETED', 'User Deleted'
        SHARE_REVOKED = 'SHARE_REVOKED', 'File Share Revoked'

    class Status(models.TextChoices):
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'
        DENIED = 'DENIED', 'Denied'

    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='audit_logs'
    )
    username_snapshot = models.CharField(max_length=150, blank=True, null=True)
    action = models.CharField(max_length=50, choices=Action.choices, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUCCESS, db_index=True)
    
    file_id = models.CharField(max_length=100, blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True, null=True)
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
        ]

    def __str__(self):
        actor = self.username_snapshot or (self.user.username if self.user else 'Anonymous')
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {actor} - {self.action} ({self.status})"
