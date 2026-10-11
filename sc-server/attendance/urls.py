from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"", views.AttendanceViewSet, basename="attendance")

urlpatterns = [
    path("roster/", views.RosterView.as_view(), name="attendance-roster"),
    path("bulk-save/", views.BulkSaveView.as_view(), name="attendance-bulk-save"),
    path(
        "summary/class/<str:class_id>/",
        views.ClassSummaryView.as_view(),
        name="attendance-class-summary",
    ),
    path(
        "summary/day/", views.DailySummaryView.as_view(), name="attendance-day-summary"
    ),
    path(
        "summary/student/<str:student_id>/",
        views.StudentSummaryView.as_view(),
        name="attendance-student-summary",
    ),
    path("at-risk/", views.AtRiskView.as_view(), name="attendance-at-risk"),
    path("", include(router.urls)),
]
