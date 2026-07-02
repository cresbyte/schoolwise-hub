from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExamViewSet,
    MarkViewSet,
    ClassTeacherCommentViewSet,
    PerformanceReportView,
    SchoolPerformanceTrendView,
    KNEC7BestView,
)

router = DefaultRouter()
router.register(r"exams", ExamViewSet)
router.register(r"marks", MarkViewSet)
router.register(r"class-teacher-comments", ClassTeacherCommentViewSet, basename="class-teacher-comments")

urlpatterns = [
    path("performance/", PerformanceReportView.as_view(), name="performance-report"),
    path("performance/trend/", SchoolPerformanceTrendView.as_view(), name="performance-trend"),
    path("exams/knec7/", KNEC7BestView.as_view(), name="knec7-best"),
    path("", include(router.urls)),
]
