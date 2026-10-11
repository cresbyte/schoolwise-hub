from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"", views.ExamViewSet, basename="exam")
router.register(r"exam-subjects", views.ExamSubjectViewSet, basename="exam-subject")
router.register(r"comments", views.ExamCommentViewSet, basename="exam-comment")

urlpatterns = [
    path("my-grading/", views.MyGradingView.as_view(), name="my-grading"),
    path("", include(router.urls)),
]
