from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from apps.accounts.permissions import IsStaff, IsStaffOrParent
from apps.accounts.models import UserRole
from apps.students.models import Student
from .models import FeeStructure, Payment, FeeLevy, LevyPayment
from .serializers import FeeStructureSerializer, PaymentSerializer, FeeLevySerializer, LevyPaymentSerializer


class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.all().order_by("-year", "-term")
    serializer_class = FeeStructureSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["grade_level", "year", "term", "is_active"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated(), IsStaffOrParent()]
        return [permissions.IsAuthenticated(), IsStaff()]


class FeeInvoiceView(APIView):
    """
    Derive a student's current invoice from FeeStructure by their grade level.
    GET /api/fees/invoices/current/?student=<id>
    """
    permission_classes = [permissions.IsAuthenticated, IsStaffOrParent]

    def get(self, request):
        student_id = request.query_params.get("student")
        if not student_id:
            return Response({"detail": "student query param required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        # Parents can only view their own children
        if request.user.role == UserRole.PARENT:
            if not student.guardians.filter(id=request.user.id).exists():
                return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        fee_structure = FeeStructure.objects.filter(
            grade_level=student.grade_level, is_active=True
        ).order_by("-year", "-term").first()

        if not fee_structure:
            return Response({"items": [], "balance": 0, "totalAmount": 0, "breakdown": {}})

        # Total paid by student
        total_paid = Payment.objects.filter(student=student).aggregate(s=Sum("amount"))["s"] or 0

        breakdown = fee_structure.breakdown if isinstance(fee_structure.breakdown, dict) else {}
        items = [{"label": k, "amount": v} for k, v in breakdown.items()]
        balance = float(fee_structure.total_amount) - float(total_paid)

        return Response({
            "feeStructureId": fee_structure.id,
            "gradeLevel": fee_structure.grade_level,
            "term": fee_structure.term,
            "year": fee_structure.year,
            "totalAmount": float(fee_structure.total_amount),
            "totalPaid": float(total_paid),
            "balance": balance,
            "breakdown": breakdown,
            "items": items,
        })


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("student", "received_by__user").all().order_by("-date")
    serializer_class = PaymentSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["student", "method"]
    ordering_fields = ["date", "amount"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated(), IsStaffOrParent()]
        return [permissions.IsAuthenticated(), IsStaff()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.role == UserRole.PARENT:
            children = Student.objects.filter(guardians=user)
            queryset = queryset.filter(student__in=children)

        student_id = self.request.query_params.get("studentId") or self.request.query_params.get("student")
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        return queryset


class FeeLevyViewSet(viewsets.ModelViewSet):
    queryset = FeeLevy.objects.all().order_by("-due_date")
    serializer_class = FeeLevySerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["scope", "category", "status", "term", "academic_year"]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "pay"]:
            return [permissions.IsAuthenticated(), IsStaffOrParent()]
        return [permissions.IsAuthenticated(), IsStaff()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        student_id = self.request.query_params.get("student")
        if student_id:
            if user.role == UserRole.PARENT:
                # Verify the parent owns this student
                if not Student.objects.filter(id=student_id, guardians=user).exists():
                    return FeeLevy.objects.none()
            try:
                student = Student.objects.get(id=student_id)
            except Student.DoesNotExist:
                return FeeLevy.objects.none()

            queryset = queryset.filter(
                Q(scope="all") |
                Q(scope="grade", grade_level=student.grade_level) |
                Q(scope="class", class_room=student.class_room) |
                Q(scope="individual", student_ids__contains=str(student_id))
            ).filter(status="active")

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        student_id = self.request.query_params.get("student")
        if student_id:
            # Pre-fetch levy payments for this student and pass as a lookup dict
            payments = LevyPayment.objects.filter(student_id=student_id)
            context["payments_by_levy"] = {p.levy_id: p for p in payments}
        return context

    @action(detail=False, methods=["post"], url_path="pay")
    def pay(self, request):
        """Record a levy payment."""
        levy_id = request.data.get("levyId")
        student_id = request.data.get("studentId")
        amount = request.data.get("amount")
        receipt_number = request.data.get("receiptNumber", "")

        if not all([levy_id, student_id, amount]):
            return Response({"detail": "levyId, studentId, and amount are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            levy = FeeLevy.objects.get(id=levy_id)
            student = Student.objects.get(id=student_id)
        except (FeeLevy.DoesNotExist, Student.DoesNotExist) as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        lp, created = LevyPayment.objects.update_or_create(
            levy=levy,
            student=student,
            defaults={"amount": amount, "receipt_number": receipt_number},
        )
        return Response(LevyPaymentSerializer(lp).data, status=status.HTTP_200_OK)


class FeeSummaryView(APIView):
    """
    Aggregate fee collection statistics.
    GET /api/fees/summary/
    """
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def get(self, request):
        students = Student.objects.all()
        total_students = students.count()

        # Sum up total invoiced from active fee structures
        active_structures = FeeStructure.objects.filter(is_active=True)
        grade_amounts = {fs.grade_level: float(fs.total_amount) for fs in active_structures}

        total_invoiced = 0.0
        for student in students:
            total_invoiced += grade_amounts.get(student.grade_level, 0)

        total_collected = float(Payment.objects.aggregate(s=Sum("amount"))["s"] or 0)
        collection_rate = round((total_collected / total_invoiced * 100), 1) if total_invoiced else 0

        return Response({
            "totalInvoiced": total_invoiced,
            "totalCollected": total_collected,
            "collectionRate": collection_rate,
            "totalStudents": total_students,
        })
