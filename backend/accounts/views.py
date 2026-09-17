"""
Authentication and User Management Views for SecureShare.
Strictly backend-enforced RBAC and audit logging.
"""
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Count
from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from audit.services import log_audit_event
from audit.models import AuditLog
from fileshare.models import SecureFile
from .models import UserProfile
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserProfileSerializer,
    AdminUserUpdateRoleSerializer,
    AdminUserCreateSerializer
)
from .permissions import IsAdmin

class RegisterView(views.APIView):
    """
    Public registration endpoint.
    All registered users unconditionally receive EMPLOYEE role.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            log_audit_event(
                action=AuditLog.Action.REGISTER,
                user=user,
                request=request,
                description=f"User '{user.username}' registered with EMPLOYEE role."
            )
            return Response(
                {
                    "message": "Registration successful. You can now log in.",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "role": user.profile.role
                    }
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(views.APIView):
    """
    User authentication endpoint.
    Returns DRF Token and role data on successful PBKDF2 authentication.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        # Check if user exists but inactive
        user_obj = User.objects.filter(username__iexact=username).first()
        if user_obj and not user_obj.is_active:
            log_audit_event(
                action=AuditLog.Action.LOGIN_FAILED,
                username_attempt=username,
                request=request,
                description=f"Login rejected: Account '{username}' is inactive.",
                status=AuditLog.Status.DENIED
            )
            return Response(
                {"error": "Account is inactive. Please contact your system administrator."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Authenticate via Django's secure PBKDF2 verification
        user = authenticate(request=request, username=username, password=password)

        if user is None:
            log_audit_event(
                action=AuditLog.Action.LOGIN_FAILED,
                username_attempt=username,
                request=request,
                description=f"Failed login attempt for username '{username}'.",
                status=AuditLog.Status.FAILED
            )
            return Response(
                {"error": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Retrieve or create auth token
        token, _ = Token.objects.get_or_create(user=user)

        # Ensure profile exists
        profile, _ = UserProfile.objects.get_or_create(user=user)

        log_audit_event(
            action=AuditLog.Action.LOGIN_SUCCESS,
            user=user,
            request=request,
            description=f"User '{user.username}' logged in successfully as {profile.role}."
        )

        return Response({
            "message": "Login successful.",
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "phone": profile.phone,
                "role": profile.role
            }
        }, status=status.HTTP_200_OK)


class LogoutView(views.APIView):
    """
    Terminates session and invalidates DRF Token.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        try:
            request.user.auth_token.delete()
        except Exception:
            pass

        log_audit_event(
            action=AuditLog.Action.LOGOUT,
            user=user,
            request=request,
            description=f"User '{user.username}' logged out."
        )
        return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)


class ProfileView(views.APIView):
    """
    Retrieves the authenticated user's profile and active role.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUserListView(views.APIView):
    """
    List all organizational users. Admin only.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        queryset = User.objects.all().select_related('profile').order_by('-date_joined')
        
        role_filter = request.query_params.get('role')
        if role_filter:
            queryset = queryset.filter(profile__role=role_filter)

        search_query = request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(username__icontains=search_query) | queryset.filter(email__icontains=search_query)

        serializer = UserProfileSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUserCreateView(views.APIView):
    """
    Create an organizational user with designated role. Admin only.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password']
        )
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.phone = data.get('phone', '')
        profile.role = data['role']
        profile.save()

        log_audit_event(
            action=AuditLog.Action.USER_CREATED,
            user=request.user,
            request=request,
            description=f"Admin '{request.user.username}' created user '{user.username}' with role {profile.role}."
        )

        return Response(
            {
                "message": f"User '{user.username}' created successfully.",
                "user": UserProfileSerializer(user).data
            },
            status=status.HTTP_201_CREATED
        )


class AdminUserRoleUpdateView(views.APIView):
    """
    Update a user's role. Admin only.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminUserUpdateRoleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_role = serializer.validated_data['role']
        profile, _ = UserProfile.objects.get_or_create(user=target_user)
        old_role = profile.role

        # Prevent demoting the last active ADMIN
        if old_role == UserProfile.Role.ADMIN and new_role != UserProfile.Role.ADMIN:
            admin_count = UserProfile.objects.filter(role=UserProfile.Role.ADMIN, user__is_active=True).count()
            if admin_count <= 1:
                return Response(
                    {"error": "Cannot change role: the system must have at least one active Administrator."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        profile.role = new_role
        profile.save()

        log_audit_event(
            action=AuditLog.Action.ROLE_CHANGED,
            user=request.user,
            request=request,
            description=f"Admin '{request.user.username}' updated '{target_user.username}' role from {old_role} to {new_role}."
        )

        return Response({
            "message": f"Role updated for '{target_user.username}' to {new_role}.",
            "user": UserProfileSerializer(target_user).data
        }, status=status.HTTP_200_OK)


class AdminUserStatusToggleView(views.APIView):
    """
    Activate or deactivate a user account. Admin only.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response({"error": "You cannot deactivate your own account."}, status=status.HTTP_400_BAD_REQUEST)

        target_user.is_active = not target_user.is_active
        target_user.save()

        status_text = "activated" if target_user.is_active else "deactivated"
        log_audit_event(
            action=AuditLog.Action.ROLE_CHANGED,
            user=request.user,
            request=request,
            description=f"Admin '{request.user.username}' {status_text} account for '{target_user.username}'."
        )

        return Response({
            "message": f"Account {status_text} successfully.",
            "is_active": target_user.is_active
        }, status=status.HTTP_200_OK)


class AdminUserDeleteView(views.APIView):
    """
    Permanently delete a user. Admin only.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def delete(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response({"error": "You cannot delete your own account."}, status=status.HTTP_400_BAD_REQUEST)

        username = target_user.username
        target_user.delete()

        log_audit_event(
            action=AuditLog.Action.USER_DELETED,
            user=request.user,
            request=request,
            description=f"Admin '{request.user.username}' deleted user '{username}'."
        )

        return Response({"message": f"User '{username}' deleted successfully."}, status=status.HTTP_200_OK)


class AdminStatsView(views.APIView):
    """
    Admin system dashboard overview metrics. Admin only.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        total_users = User.objects.count()
        role_counts = UserProfile.objects.values('role').annotate(count=Count('role'))
        
        counts = {'ADMIN': 0, 'MANAGER': 0, 'EMPLOYEE': 0}
        for r in role_counts:
            counts[r['role']] = r['count']

        total_files = SecureFile.objects.filter(status=SecureFile.Status.ACTIVE).count()
        security_events = AuditLog.objects.filter(
            action__in=[
                AuditLog.Action.FILE_ACCESS_DENIED,
                AuditLog.Action.LOGIN_FAILED,
                AuditLog.Action.ROLE_CHANGED,
                AuditLog.Action.USER_DELETED
            ]
        ).count()

        recent_activity = AuditLog.objects.all().order_by('-timestamp')[:5]
        from audit.serializers import AuditLogSerializer
        activity_data = AuditLogSerializer(recent_activity, many=True).data

        return Response({
            "total_users": total_users,
            "admin_count": counts['ADMIN'],
            "manager_count": counts['MANAGER'],
            "employee_count": counts['EMPLOYEE'],
            "total_files": total_files,
            "security_events": security_events,
            "recent_activity": activity_data
        }, status=status.HTTP_200_OK)
