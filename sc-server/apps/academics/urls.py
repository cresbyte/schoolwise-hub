from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"terms", views.AcademicTermViewSet, basename="academic-terms")
router.register(r"classes", views.ClassRoomViewSet)
router.register(r"subjects", views.SubjectViewSet)
router.register(r"assignments", views.SubjectAssignmentViewSet)
router.register(r"timetable", views.TimetableSlotViewSet, basename="timetable")
router.register(r"term-events", views.TermEventViewSet, basename="term-events")

urlpatterns = [
    path("", include(router.urls)),
]
