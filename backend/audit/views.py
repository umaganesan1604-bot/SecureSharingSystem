"""
Audit Views for SecureShare.
Only ADMIN users can view audit logs.
"""
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogListView(generics.ListAPIView):
    """
    List organizational audit logs.
    Strictly accessible only to ADMIN users.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        queryset = AuditLog.objects.all().select_related('user')
        
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        username = self.request.query_params.get('username')
        if username:
            queryset = queryset.filter(username_snapshot__icontains=username)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(description__icontains=search)

        return queryset[:200]  # Limit to 200 most recent for performance
