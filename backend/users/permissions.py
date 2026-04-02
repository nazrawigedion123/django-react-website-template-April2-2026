# backend/users/permissions.py
from rest_framework import permissions

class CanManageSettings(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.can_manage_settings()

class CanManageUsers(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.can_manage_users()

