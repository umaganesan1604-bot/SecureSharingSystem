from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'username',
            'action',
            'status',
            'file_id',
            'file_name',
            'ip_address',
            'description',
            'timestamp'
        ]
        read_only_fields = fields

    def get_username(self, obj):
        return obj.username_snapshot or (obj.user.username if obj.user else 'System/Anonymous')
