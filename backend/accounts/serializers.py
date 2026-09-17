"""
Serializers for accounts and authentication in SecureShare.
"""
import re
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import UserProfile

PHONE_REGEX = re.compile(r'^\+?[0-9\s\-\(\)]{7,20}$')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text="Minimum 8 characters"
    )
    phone = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=20
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'phone']

    def validate_username(self, value):
        if not re.match(r'^[a-zA-Z0-9_.-]+$', value):
            raise serializers.ValidationError(
                "Username may only contain letters, numbers, dots, hyphens, and underscores."
            )
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value.lower()

    def validate_phone(self, value):
        if value and not PHONE_REGEX.match(value.strip()):
            raise serializers.ValidationError("Please provide a valid phone number format.")
        return value.strip() if value else ''

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        if not any(char.isalpha() for char in value):
            raise serializers.ValidationError("Password must contain at least one letter.")
        # Also run Django built-in validators
        validate_password(value)
        return value

    def create(self, validated_data):
        phone = validated_data.pop('phone', '')
        password = validated_data.pop('password')
        
        # Explicitly enforce EMPLOYEE role on public registration
        # Any client-supplied role in initial_data is strictly ignored
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=password
        )

        # Profile is created by post_save signal, now update phone and ensure EMPLOYEE role
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.phone = phone
        profile.role = UserProfile.Role.EMPLOYEE  # MANDATORY SECURITY RULE
        profile.save()

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True, 
        write_only=True, 
        style={'input_type': 'password'}
    )


class UserProfileSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='profile.phone', read_only=True)
    role = serializers.CharField(source='profile.role', read_only=True)
    created_at = serializers.DateTimeField(source='profile.created_at', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'username', 'email', 'phone', 'role', 'is_active', 'created_at']


class AdminUserUpdateRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=UserProfile.Role.choices, required=True)

    def validate_role(self, value):
        if value not in UserProfile.Role.values:
            raise serializers.ValidationError(f"Invalid role: {value}. Allowed: {UserProfile.Role.values}")
        return value


class AdminUserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True, default='')
    role = serializers.ChoiceField(choices=UserProfile.Role.choices, default=UserProfile.Role.EMPLOYEE)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value.lower()

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters.")
        return value
