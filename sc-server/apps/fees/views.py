from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from apps.accounts.permissions import IsStaff, IsStaffOrParent, IsSchoolAdmin
from apps.accounts.models import UserRole
from apps.students.models import Student
from .models import FeeStructure, Payment, FeeLevy, LevyPayment
from .serializers import FeeStructureSerializer, PaymentSerializer, FeeLevySerializer, LevyPaymentSerializer


class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.select_related("created_by", "previous_version").all().order_by("-year", "-term")
    serializer_class = FeeStructureSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["grade_level", "year", "term", "is_active"]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "print", "revise", "bulk_setup"]:
            return [permissions.IsAuthenticated(), IsStaffOrParent()]
        return [permissions.IsAuthenticated(), IsStaff()]

    def perform_create(self, serializer):
        """Set created_by when creating a new fee structure."""
        serializer.save(created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        """
        Override PUT/PATCH to prevent direct modification of total_amount/breakdown.
        Non-financial fields (name) are still allowed via PATCH.
        """
        instance = self.get_object()
        if "total_amount" in request.data or "totalAmount" in request.data or "breakdown" in request.data:
            return Response(
                {"detail": "Direct modification of totalAmount/breakdown is not allowed. Use the /revise/ endpoint to create a new version."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="revise")
    def revise(self, request, pk=None):
        """
        Creates a new version of this fee structure rather than mutating the
        existing one, so there's always a full history of what a given term's
        fees used to be and who changed them. The old version is deactivated,
        not deleted — existing invoices/reports that reference it by ID still
        resolve correctly.
        """
        old = self.get_object()
        total_amount = request.data.get("totalAmount") or request.data.get("total_amount")
        breakdown = request.data.get("breakdown")

        if not total_amount:
            return Response(
                {"detail": "totalAmount is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        new = FeeStructure.objects.create(
            name=request.data.get("name", old.name),
            grade_level=old.grade_level,
            year=old.year,
            term=old.term,
            total_amount=total_amount,
            breakdown=breakdown or old.breakdown,
            version=old.version + 1,
            previous_version=old,
            created_by=request.user,
            is_active=True,
        )
        old.is_active = False
        old.save(update_fields=["is_active"])

        # Note: applyRetroactively flag is acknowledged but not implemented per task spec
        # This is a placeholder for future implementation
        apply_retroactively = request.data.get("applyRetroactively", False)
        # IMPORTANT: default is False. A fee structure change must NOT silently
        # alter balances for students already invoiced this term unless a staff
        # member explicitly opts into that via this flag.

        return Response(FeeStructureSerializer(new).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="bulk-setup")
    def bulk_setup(self, request):
        """
        Create or revise multiple fee structures at once for a full year setup.
        Payload: {"year": 2026, "structures": [{"gradeLevel": "Grade 4", "term": 1, "totalAmount": 15000, "breakdown": {...}}, ...]}
        """
        year = request.data.get("year")
        structures_data = request.data.get("structures", [])

        if not year:
            return Response({"detail": "year is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not structures_data:
            return Response({"detail": "structures array is required."}, status=status.HTTP_400_BAD_REQUEST)

        created_structures = []
        for struct_data in structures_data:
            grade_level = struct_data.get("gradeLevel") or struct_data.get("grade_level")
            term = struct_data.get("term")
            total_amount = struct_data.get("totalAmount") or struct_data.get("total_amount")
            breakdown = struct_data.get("breakdown", {})

            if not all([grade_level, term, total_amount]):
                continue

            # Check if an active structure exists for this grade/term/year
            existing = FeeStructure.objects.filter(
                grade_level=grade_level,
                year=year,
                term=term,
                is_active=True
            ).first()

            if existing:
                # Create a new version
                new = FeeStructure.objects.create(
                    name=f"Term {term} {year} {grade_level}",
                    grade_level=grade_level,
                    year=year,
                    term=term,
                    total_amount=total_amount,
                    breakdown=breakdown,
                    version=existing.version + 1,
                    previous_version=existing,
                    created_by=request.user,
                    is_active=True,
                )
                existing.is_active = False
                existing.save(update_fields=["is_active"])
                created_structures.append(new)
            else:
                # Create new structure
                struct = FeeStructure.objects.create(
                    name=f"Term {term} {year} {grade_level}",
                    grade_level=grade_level,
                    year=year,
                    term=term,
                    total_amount=total_amount,
                    breakdown=breakdown,
                    version=1,
                    created_by=request.user,
                    is_active=True,
                )
                created_structures.append(struct)

        return Response(FeeStructureSerializer(created_structures, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="print")
    def print_data(self, request):
        """
        Get fee structures for printing by grade level and year.
        Query params: gradeLevel (required), year (required), term (optional)
        """
        grade_level = request.query_params.get("gradeLevel") or request.query_params.get("grade_level")
        year = request.query_params.get("year")
        term = request.query_params.get("term")

        if not grade_level or not year:
            return Response(
                {"detail": "gradeLevel and year are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = FeeStructure.objects.filter(
            grade_level=grade_level,
            year=int(year),
            is_active=True
        ).order_by("term")

        if term:
            queryset = queryset.filter(term=int(term))

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


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
