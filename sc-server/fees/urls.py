from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"structures", views.FeeStructureViewSet, basename="fee-structure")
router.register(r"charges", views.ChargeViewSet, basename="charge")
router.register(r"invoices", views.InvoiceViewSet, basename="invoice")
router.register(r"payments", views.PaymentViewSet, basename="payment")

urlpatterns = [
    path("mpesa/stk-push/", views.initiate_stk_push, name="mpesa_stk_push"),
    path("mpesa/callback/", views.mpesa_callback, name="mpesa_callback"),
    path(
        "mpesa/status/<str:checkout_request_id>/",
        views.check_payment_status,
        name="mpesa_status",
    ),
    path("outstanding/", views.OutstandingView.as_view(), name="fees-outstanding"),
    path("summary/", views.CollectionSummaryView.as_view(), name="fees-summary"),
    path(
        "students/<str:student_id>/summary/",
        views.StudentFeeSummaryView.as_view(),
        name="fees-student-summary",
    ),
    path(
        "students/<str:student_id>/statement/",
        views.StudentStatementView.as_view(),
        name="fees-student-statement",
    ),
    ##############
    path("dashboard/", views.FeesDashboardView.as_view(), name="fees-dashboard"),
    path(
        "collections-by-day/",
        views.CollectionsByDayView.as_view(),
        name="fees-collections-by-day",
    ),
    path(
        "outstanding-by-grade/",
        views.OutstandingByGradeView.as_view(),
        name="fees-outstanding-by-grade",
    ),
    path(
        "reconciliation/mpesa/<int:pk>/confirm/",
        views.ReconcileMpesaView.as_view(),
        name="fees-mpesa-confirm",
    ),
    path(
        "students/<str:student_id>/pending-charges/",
        views.StudentPendingChargesView.as_view(),
        name="fees-student-pending-charges",
    ),
    path("", include(router.urls)),
]
