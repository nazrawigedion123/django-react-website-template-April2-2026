# backend/users/models.py
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password) # Handles hashing
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = [] # Email is required by default

    def __str__(self):
        return self.email
    
    def get_role(self):
        try:
            return self.role_profile
        except (AttributeError, UserRoles.DoesNotExist):
            pass
        roles = getattr(self, "roles", None)
        return roles.first() if roles is not None else None

    def get_language(self):
        profile = self.profile.first()
        return profile.language if profile else None

    def can_create_blog(self):
        if self.is_superuser:
            return True
        role = self.get_role()
        return role.can_create_blog if role else False
    
    def can_edit_blog(self):
        if self.is_superuser:
            return True
        role = self.get_role()
        return role.can_edit_blog if role else False
    
    def can_delete_blog(self):
        if self.is_superuser:
            return True
        role = self.get_role()
        return role.can_delete_blog if role else False
    
    def can_publish_blog(self):
        if self.is_superuser:
            return True
        role = self.get_role()
        return role.can_publish_blog if role else False
    
    def can_manage_users(self):
        if self.is_superuser:
            return True
        role = self.get_role()
        return role.can_manage_users if role else False
    
    def can_manage_media(self):
        if self.is_superuser:
            return True
        role = self.get_role()
        return role.can_manage_media if role else False
    
    def can_manage_subscribers(self):
        if self.is_superuser:
            return True
        role = self.get_role()
        return role.can_manage_subscribers if role else False
    
    def can_manage_contacts(self):
        if self.is_superuser:
            return True
        role = self.get_role()
        return role.can_manage_contacts if role else False
    
    def can_manage_settings(self):
        if self.is_superuser:
            return True
        role = self.get_role()
        return role.can_manage_settings if role else False

    def can_manage_media(self):
        if self.is_superuser:
            return True
        role = self.get_role()
        if role is None:
            return False
        return role.can_create_media or role.can_edit_media or role.can_delete_media

        

class Profile(models.Model):
    user = models.ForeignKey(User,related_name='profile',unique=True, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    language = models.ForeignKey('languages.Language', on_delete=models.CASCADE)
    # Add other church-specific fields like 'membership_date'
    def __str__(self):
        return self.user.email

class UserRoles(models.Model):

    user = models.ForeignKey(User,related_name='roles', on_delete=models.CASCADE)
    can_create_blog=models.BooleanField(default=False)
    can_edit_blog=models.BooleanField(default=False)
    can_delete_blog=models.BooleanField(default=False)
    can_publish_blog=models.BooleanField(default=False)

    # can_create_event=models.BooleanField(default=False)
    # can_edit_event=models.BooleanField(default=False)
    # can_delete_event=models.BooleanField(default=False)

    # can_create_sermon=models.BooleanField(default=False)
    # can_edit_sermon=models.BooleanField(default=False)
    # can_delete_sermon=models.BooleanField(default=False)

    can_manage_users=models.BooleanField(default=False)

    can_create_media=models.BooleanField(default=False)
    can_edit_media=models.BooleanField(default=False)
    can_delete_media=models.BooleanField(default=False)

    can_manage_subscribers=models.BooleanField(default=False)
    can_manage_contacts=models.BooleanField(default=False)

    can_manage_settings=models.BooleanField(default=False)
    def __str__(self):
        return self.user.email +"'s role"
