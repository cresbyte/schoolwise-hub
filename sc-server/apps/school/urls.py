from django.urls import path
from . import views

urlpatterns = [
    path("profile/", views.SchoolDetailView.as_view(), name="school-detail"),
]
