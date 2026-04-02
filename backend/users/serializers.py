# serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    language = serializers.SerializerMethodField()

    """Used for viewing user profiles or returning data after login."""
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'date_joined', 'roles', 'language')
        read_only_fields = ('id', 'date_joined')

    def get_roles(self, obj):
        role = obj.get_role()
        
        # Helper to safely get role field
        def get_role_perm(field):
            return getattr(role, field) if role else False

        return {
            "can_create_blog": obj.can_create_blog(),
            "can_edit_blog": obj.can_edit_blog(),
            "can_delete_blog": obj.can_delete_blog(),
            "can_publish_blog": obj.can_publish_blog(),
            "can_manage_users": obj.can_manage_users(),
            "can_create_media": obj.can_manage_media(),
            "can_edit_media": obj.can_manage_media(),
            "can_delete_media": obj.can_manage_media(),
            "can_manage_media": obj.can_manage_media(),
            "can_manage_subscribers": obj.can_manage_subscribers(),
            "can_manage_contacts": obj.can_manage_contacts(),
            "can_manage_settings": obj.can_manage_settings(),
        }

    def get_language(self, obj):
        language = obj.get_language()
        return language.code if language else None

class RegisterSerializer(serializers.ModelSerializer):
    """Used specifically for creating a new user account."""
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        # We use the manager's create_user to ensure password hashing
        return User.objects.create_user(**validated_data)

    def to_representation(self, instance):
        # Return user data and tokens after registration
        refresh = RefreshToken.for_user(instance)
        return {
            'user': UserSerializer(instance).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
