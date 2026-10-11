"""Exam permissions.

Rules:
  - Admins/heads: full access.
  - Teachers: enter marks ONLY for exam subjects that match a SubjectAssignment
    they own. Can read their own class's report cards.
  - Class teachers: write class teacher comments for their own class.
  - Parents: read released report cards for their children only.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS

from academics.models import SubjectAssignment

ADMIN_ROLES = {"admin", "headteacher", "deputy"}
CLASS_TEACHER_ROLES = {"class_teacher", "teacher", "headteacher", "deputy", "admin"}


def user_teaches_exam_subject(user, exam_subject):
    """True if the user is assigned to teach this subject in any class of this grade."""
    return SubjectAssignment.objects.filter(
        teacher=user,
        subject=exam_subject.subject,
        class_room__grade_level_id=exam_subject.grade_level_id,
        class_room__academic_year=exam_subject.exam.academic_year,
    ).exists()


def user_is_class_teacher_of(user, class_room):
    return class_room.class_teacher_id == user.id


class CanManageExams(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ADMIN_ROLES
        )


class CanEnterMarks(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role != "parent"
        )

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        # obj is ExamSubject
        if request.user.role in ADMIN_ROLES:
            return True
        return user_teaches_exam_subject(request.user, obj)


class CanWriteClassComment(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in CLASS_TEACHER_ROLES
        )
