# backend/blogs/permissions.py
from rest_framework import permissions

class CanCreateBlog(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.can_create_blog()
class IsAuthorAndCanEditBlog(permissions.BasePermission):
    def has_permission(self, request, view,obj):
        return request.user.can_edit_blog() and request.user == obj.author

class CanEditBlog(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.can_edit_blog()

class CanDeleteBlog(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.can_delete_blog()

class CanPublishBlog(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.can_publish_blog()
