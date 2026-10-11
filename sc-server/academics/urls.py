from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"classes", views.ClassRoomViewSet, basename="classroom")
router.register(r"subjects", views.SubjectViewSet, basename="subject")
router.register(r"assignments", views.SubjectAssignmentViewSet, basename="assignment")
router.register(r"timetable", views.TimetableSlotViewSet, basename="timetable")
router.register(r"enrollments", views.EnrollmentViewSet, basename="enrollment")
router.register(r"promotions", views.PromotionViewSet, basename="promotion")
router.register(
    r"promotion-batches", views.PromotionBatchViewSet, basename="promotion-batch"
)
router.register(
    r"bell-schedules", views.BellScheduleViewSet, basename="bell-schedule"
)
urlpatterns = [
    path("", include(router.urls)),
]
