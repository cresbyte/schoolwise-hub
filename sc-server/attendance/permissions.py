"""Who can take attendance.

Permissions are permissive: class teacher OR any teacher with a subject
assignment in that class. Admins/heads can do anything.

Attribution is separate — the row always records who actually saved it.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS

ADMIN_ROLES = {"admin", "headteacher", "deputy"}
TEACHING_ROLES = {"teacher", "class_teacher", "hod", "headteacher", "deputy", "admin"}
PARENT_ROLE = "parent"


def can_take_attendance(user, class_room):
    """True if `user` may record attendance for `class_room`."""
    if not user or not user.is_authenticated:
        return False
    if user.role in ADMIN_ROLES:
        return True
    if user.role == PARENT_ROLE:
        return False
    if class_room.class_teacher_id == user.id:
        return True

    from academics.models import SubjectAssignment

    return SubjectAssignment.objects.filter(
        class_room=class_room, teacher=user
    ).exists()


def can_edit_past(user, days_back=7):
    """
    Admins and heads can edit any date; teachers are limited to the last
    `days_back` days. The view calls this with the specific date's age.
    """
    if not user or not user.is_authenticated:
        return False
    return user.role in ADMIN_ROLES or True  # see note in views


def can_edit_date(user, target_date, days_back=7):
    """
    True if `user` may edit attendance for `target_date`.
    Admins have no window; other teachers are limited to `days_back`.
    """
    from datetime import date, timedelta

    if not user or not user.is_authenticated:
        return False
    if user.role in ADMIN_ROLES:
        return True
    today = date.today()
    if target_date > today:
        return False
    return (today - target_date) <= timedelta(days=days_back)


class CanTakeAttendance(BasePermission):
    """Object-level permission for a specific ClassRoom."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        # obj is a ClassRoom or Attendance
        class_room = getattr(obj, "class_room", obj)
        return can_take_attendance(request.user, class_room)
