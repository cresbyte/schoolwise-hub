from rest_framework.permissions import BasePermission
from .models import UserRole

ADMIN_ROLES = [UserRole.ADMIN, UserRole.HEADTEACHER, UserRole.DEPUTY]
SENIOR_ROLES = [UserRole.ADMIN, UserRole.HEADTEACHER, UserRole.DEPUTY, UserRole.HOD]
STAFF_ROLES = [
    UserRole.ADMIN, 
    UserRole.HEADTEACHER, 
    UserRole.DEPUTY, 
    UserRole.HOD, 
    UserRole.CLASS_TEACHER, 
    UserRole.ACCOUNTANT,
    UserRole.STAFF
]

class IsSchoolAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ADMIN_ROLES

class IsSeniorStaff(BasePermission):
    """admin, headteacher, deputy, hod"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in SENIOR_ROLES

class IsStaff(BasePermission):
    """Any staff member (not parent)"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in STAFF_ROLES

class IsParent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.PARENT

class IsStaffOrParent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role in STAFF_ROLES or request.user.role == UserRole.PARENT
        )

class IsAccountant(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == UserRole.ACCOUNTANT or 
            request.user.role in ADMIN_ROLES
        )
