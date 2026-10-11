from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"academic-years", views.AcademicYearViewSet, basename="academic-year")
router.register(r"terms", views.TermViewSet, basename="term")
router.register(r"grade-levels", views.GradeLevelViewSet, basename="grade-level")
router.register(
    r"calendar-events", views.CalendarEventViewSet, basename="calendar-event"
)

urlpatterns = [
    path("current-period/", views.CurrentPeriodView.as_view(), name="current_period"),
    path("", include(router.urls)),
]
