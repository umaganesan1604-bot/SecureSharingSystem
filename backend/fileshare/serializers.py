from rest_framework import serializers
from django.contrib.auth.models import User
from .models import SecureFile, FileShare

class FileShareSerializer(serializers.ModelSerializer):
    shared_by_username = serializers.CharField(source='shared_by.username', read_only=True)
    shared_with_username = serializers.CharField(source='shared_with.username', read_only=True)
    shared_with_email = serializers.CharField(source='shared_with.email', read_only=True)

    class Meta:
        model = FileShare
        fields = [
            'id',
            'file',
            'shared_by_username',
            'shared_with_username',
            'shared_with_email',
            'permission',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'file', 'shared_by_username', 'shared_with_username', 'shared_with_email', 'status', 'created_at', 'updated_at']


class SecureFileSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    is_owner = serializers.SerializerMethodField()
    active_shares = serializers.SerializerMethodField()
    user_permission = serializers.SerializerMethodField()

    class Meta:
        model = SecureFile
        fields = [
            'id',
            'original_filename',
            'file_size',
            'content_type',
            'encryption_version',
            'status',
            'uploaded_at',
            'owner_username',
            'owner_email',
            'is_owner',
            'user_permission',
            'active_shares'
        ]
        read_only_fields = fields

    def get_is_owner(self, obj) -> bool:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.owner_id == request.user.id

    def get_user_permission(self, obj) -> str:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 'NONE'
        if obj.owner_id == request.user.id or (request.user.is_superuser or getattr(request.user.profile, 'role', None) == 'ADMIN'):
            return 'OWNER'
        # Check active share
        share = obj.shares.filter(shared_with=request.user, status=FileShare.Status.ACTIVE).first()
        if share:
            return share.permission
        return 'NONE'

    def get_active_shares(self, obj):
        request = self.context.get('request')
        # Only owner or admin can see all active shares list
        if not request or not request.user.is_authenticated:
            return []
        is_admin = request.user.is_superuser or getattr(request.user.profile, 'role', None) == 'ADMIN'
        if obj.owner_id == request.user.id or is_admin:
            active_qs = obj.shares.filter(status=FileShare.Status.ACTIVE).select_related('shared_with', 'shared_by')
            return FileShareSerializer(active_qs, many=True).data
        return []


class FileShareCreateSerializer(serializers.Serializer):
    recipient = serializers.CharField(required=True, help_text="Username or email of recipient")
    permission = serializers.ChoiceField(
        choices=FileShare.Permission.choices, 
        default=FileShare.Permission.DOWNLOAD
    )

    def validate_recipient(self, value):
        user = User.objects.filter(username__iexact=value).first() or User.objects.filter(email__iexact=value).first()
        if not user:
            raise serializers.ValidationError(f"User with username or email '{value}' does not exist.")
        if not user.is_active:
            raise serializers.ValidationError("Cannot share files with an inactive user account.")
        return user
