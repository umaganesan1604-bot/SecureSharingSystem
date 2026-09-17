"""
Role-Based Access Control (RBAC) Permission Classes for SecureShare.
All permissions are strictly verified server-side.
"""
from rest_framework.permissions import BasePermission
from .models import UserProfile

class IsAdmin(BasePermission):
    """Allows access only to authenticated users with ADMIN role or superusers."""
    message = "Admin privilege required to perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, 'profile', None)
        return bool(profile and profile.role == UserProfile.Role.ADMIN)

class IsManager(BasePermission):
    """Allows access only to authenticated users with MANAGER role."""
    message = "Manager privilege required to perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        profile = getattr(request.user, 'profile', None)
        return bool(profile and profile.role == UserProfile.Role.MANAGER)

class IsEmployee(BasePermission):
    """Allows access only to authenticated users with EMPLOYEE role."""
    message = "Employee role required to perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        profile = getattr(request.user, 'profile', None)
        return bool(profile and profile.role == UserProfile.Role.EMPLOYEE)

class IsAdminOrManager(BasePermission):
    """Allows access to users with ADMIN or MANAGER role."""
    message = "Admin or Manager privilege required to perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, 'profile', None)
        return bool(profile and profile.role in (UserProfile.Role.ADMIN, UserProfile.Role.MANAGER))
