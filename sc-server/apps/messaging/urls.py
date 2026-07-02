from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SchoolMessageViewSet, ParentReplyViewSet

router = DefaultRouter()
router.register(r"school-messages", SchoolMessageViewSet, basename="school-messages")
router.register(r"replies", ParentReplyViewSet, basename="parent-replies")

urlpatterns = [
    path("", include(router.urls)),
]
