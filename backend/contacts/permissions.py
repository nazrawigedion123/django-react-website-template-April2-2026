# backend/contacts/permissions.py
from rest_framework import permissions



class CanManageContacts(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.can_manage_contacts()


class CanManageSubscribers(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.can_manage_subscribers()