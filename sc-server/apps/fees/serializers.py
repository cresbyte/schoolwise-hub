from rest_framework import serializers
from .models import FeeStructure, Payment, FeeLevy, LevyPayment


class FeeStructureSerializer(serializers.ModelSerializer):
    gradeLevel = serializers.CharField(source="grade_level")
    totalAmount = serializers.DecimalField(source="total_amount", max_digits=12, decimal_places=2)
    isActive = serializers.BooleanField(source="is_active", required=False, default=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = FeeStructure
        fields = [
            "id", "name", "grade_level", "gradeLevel", "year", "term",
            "total_amount", "totalAmount", "breakdown", "is_active", "isActive",
            "createdAt",
        ]


class PaymentSerializer(serializers.ModelSerializer):
    studentId = serializers.IntegerField(source="student_id", read_only=True)
    studentName = serializers.SerializerMethodField()
    referenceNumber = serializers.CharField(source="reference_number")
    receivedBy = serializers.CharField(source="received_by.user.name", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    paidAt = serializers.DateField(source="date")

    class Meta:
        model = Payment
        fields = [
            "id", "student", "studentId", "studentName",
            "amount", "method", "reference_number", "referenceNumber",
            "date", "paidAt", "received_by", "receivedBy", "createdAt",
        ]

    def get_studentName(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"


class LevyPaymentSerializer(serializers.ModelSerializer):
    levyId = serializers.IntegerField(source="levy_id", read_only=True)
    studentId = serializers.IntegerField(source="student_id", read_only=True)
    receiptNumber = serializers.CharField(source="receipt_number", allow_blank=True)
    paidAt = serializers.DateTimeField(source="paid_at", read_only=True)

    class Meta:
        model = LevyPayment
        fields = [
            "id", "levy", "levyId", "student", "studentId",
            "amount", "receipt_number", "receiptNumber", "paidAt",
        ]


class FeeLevySerializer(serializers.ModelSerializer):
    dueDate = serializers.DateField(source="due_date")
    issuedDate = serializers.DateField(source="issued_date", read_only=True)
    issuedBy = serializers.CharField(source="issued_by", required=False, allow_blank=True)
    classRoomId = serializers.PrimaryKeyRelatedField(
        source="class_room",
        queryset=__import__("apps.academics.models", fromlist=["ClassRoom"]).ClassRoom.objects.all(),
        required=False,
        allow_null=True,
    )
    gradeLevel = serializers.CharField(source="grade_level", required=False, allow_blank=True)
    academicYear = serializers.IntegerField(source="academic_year", required=False)
    studentIds = serializers.JSONField(source="student_ids", required=False, default=list)

    # Per-student paid status (injected at serialization time from context)
    paid = serializers.SerializerMethodField()
    paidAt = serializers.SerializerMethodField()
    receiptNumber = serializers.SerializerMethodField()

    class Meta:
        model = FeeLevy
        fields = [
            "id", "title", "description", "amount", "category", "scope",
            "class_room", "classRoomId", "grade_level", "gradeLevel",
            "student_ids", "studentIds", "academic_year", "academicYear",
            "term", "due_date", "dueDate", "issued_date", "issuedDate",
            "issued_by", "issuedBy", "status",
            "paid", "paidAt", "receiptNumber",
        ]

    def get_paid(self, obj):
        payment = self._get_payment(obj)
        return payment is not None

    def get_paidAt(self, obj):
        payment = self._get_payment(obj)
        return payment.paid_at.isoformat() if payment else None

    def get_receiptNumber(self, obj):
        payment = self._get_payment(obj)
        return payment.receipt_number if payment else ""

    def _get_payment(self, obj):
        payments_by_levy = self.context.get("payments_by_levy", {})
        return payments_by_levy.get(obj.id)
