from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeeStructureViewSet, PaymentViewSet, FeeLevyViewSet, FeeInvoiceView, FeeSummaryView

router = DefaultRouter()
router.register(r"structures", FeeStructureViewSet, basename="fee-structures")
router.register(r"payments", PaymentViewSet, basename="payments")
router.register(r"levies", FeeLevyViewSet, basename="levies")

urlpatterns = [
    path("invoices/current/", FeeInvoiceView.as_view(), name="fee-invoice"),
    path("summary/", FeeSummaryView.as_view(), name="fee-summary"),
    path("", include(router.urls)),
]
