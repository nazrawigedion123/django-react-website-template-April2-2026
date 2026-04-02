# backend/gallery/permissions.py
from rest_framework import permissions



class CanManageMedia(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.can_manage_media()
