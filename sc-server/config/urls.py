from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("api/academics/", include("academics.urls")),
    path("api/attendance/", include("attendance.urls")),
    path("api/exams/", include("exams.urls")),
    path("api/messaging/", include("apps.messaging.urls")),
    path("api/fees/", include("fees.urls")),
    path("api/school/", include("school.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
