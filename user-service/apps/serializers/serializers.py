from rest_framework import serializers
import re

class RegisterRequestSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, min_length=5)
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(max_length=255, min_length=8)
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate_username(self, value):
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError("Username can only contain alphanumeric characters and underscores.")
        return value

    def validate_password(self, value):
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not any(char.islower() for char in value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        if not any(char in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for char in value):
            raise serializers.ValidationError("Password must contain at least one special character.")
        return value

class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=255)

class RefreshRequestSerializer(serializers.Serializer):
    refresh = serializers.CharField(max_length=512)

class UserResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.SerializerMethodField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()

    def get_role(self, obj):
        return obj.role.name if obj.role else 'customer'

class ProfileUpdateRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    password = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)

    def validate_password(self, value):
        if not value:
            return None
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not any(char.islower() for char in value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        if not any(char in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for char in value):
            raise serializers.ValidationError("Password must contain at least one special character.")
        return value
