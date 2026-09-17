"""
Audit Logging Service for SecureShare.
Ensures comprehensive security event capture without leaking passwords or encryption keys.
"""
import logging
from typing import Optional
from django.contrib.auth.models import User
from .models import AuditLog

logger = logging.getLogger(__name__)

def get_client_ip(request) -> Optional[str]:
    """Extract client IP safely from request headers."""
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def log_audit_event(
    action: str,
    user: Optional[User] = None,
    username_attempt: Optional[str] = None,
    request = None,
    file_id: Optional[str] = None,
    file_name: Optional[str] = None,
    description: str = '',
    status: str = AuditLog.Status.SUCCESS,
    ip_address: Optional[str] = None
) -> Optional[AuditLog]:
    """
    Safely creates an AuditLog record.
    Never raises an exception to the caller.
    """
    try:
        if request and not ip_address:
            ip_address = get_client_ip(request)

        username = None
        if user and user.is_authenticated:
            username = user.username
        elif username_attempt:
            username = username_attempt

        log = AuditLog.objects.create(
            user=user if (user and user.is_authenticated) else None,
            username_snapshot=username,
            action=action,
            status=status,
            file_id=str(file_id) if file_id else None,
            file_name=file_name,
            ip_address=ip_address,
            description=description
        )
        return log
    except Exception as e:
        logger.error(f"Failed to record audit event [{action}]: {e}", exc_info=True)
        return None
