from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from . import views
from .password_reset import PasswordResetConfirmView, PasswordResetRequestView

router = DefaultRouter()
router.register(r"students", views.StudentViewSet)
router.register(r"staff", views.StaffViewSet, basename="staff")

urlpatterns = [
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path(
        "auth/password-reset/request/",
        PasswordResetRequestView.as_view(),
        name="password_reset_request",
    ),
    path(
        "auth/password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    path("auth/me/", views.MeView.as_view(), name="me"),
    path(
        "auth/change-password/",
        views.ChangePasswordView.as_view(),
        name="change_password",
    ),
    path("auth/users/", views.UserListCreateView.as_view(), name="user_list"),
    path("auth/users/<int:pk>/", views.UserDetailView.as_view(), name="user_detail"),
    path(
        "auth/parents/lookup/", views.ParentLookupView.as_view(), name="parent_lookup"
    ),
    path(
        "portal/children/",
        views.PortalChildrenView.as_view(),
        name="portal-children",
    ),
    ######
    path("auth/users/", views.UserListCreateView.as_view(), name="user_list"),
    path("auth/users/<int:pk>/", views.UserDetailView.as_view(), name="user_detail"),
    path(
        "auth/users/<int:pk>/set-password/",
        views.UserSetPasswordView.as_view(),
        name="user_set_password",
    ),
    path(
        "auth/users/<int:pk>/toggle-active/",
        views.UserToggleActiveView.as_view(),
        name="user_toggle_active",
    ),
    path(
        "auth/users/<int:pk>/children/",
        views.ParentChildrenView.as_view(),
        name="parent_children",
    ),
    path("", include(router.urls)),
]
