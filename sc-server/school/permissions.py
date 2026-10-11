from rest_framework.permissions import SAFE_METHODS, BasePermission

from core.models import UserRole

from .models import ApprovalStatus


def is_parent(user):
    return getattr(user, "role", None) == UserRole.PARENT


class IsSchoolAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_school_admin)


class IsSchoolAdminOrReadOnly(BasePermission):
    """Everyone logged in can read; only school admins can write."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return request.method in SAFE_METHODS or user.is_school_admin


class CalendarEventPermission(BasePermission):
    """
    Read: any logged-in user (the queryset narrows what they see).
    Create: any non-parent.
    Edit/delete: school admins, or the creator while the event is not yet approved.
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return not is_parent(user)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        if user.is_school_admin:
            return True
        return (
            obj.created_by_id == user.id
            and obj.approval_status != ApprovalStatus.APPROVED
        )
