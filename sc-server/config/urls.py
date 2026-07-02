from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/school/", include("apps.school.urls")),
    path("api/academics/", include("apps.academics.urls")),
    path("api/students/", include("apps.students.urls")),
    path("api/staff/", include("apps.staff.urls")),
    path("api/attendance/", include("apps.attendance.urls")),
    path("api/academics/", include("apps.exams.urls")),
    path("api/fees/", include("apps.fees.urls")),
    path("api/messaging/", include("apps.messaging.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
