from django.contrib import admin
from .models import *
from django.contrib.auth.admin import UserAdmin

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("phone", "name", "role", "is_active", "is_staff")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("phone", "name", "email")
    ordering = ("name",)

    fieldsets = (
        (None, {"fields": ("phone", "password")}),
        ("Personal info", {"fields": ("name", "email")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Other", {"fields": ("role",)}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "phone",
                    "name",
                    "email",
                    "role",
                    "password1",
                    "password2",
                    "is_active",
                    "is_staff",
                ),
            },
        ),
    )


admin.site.register(Student)
