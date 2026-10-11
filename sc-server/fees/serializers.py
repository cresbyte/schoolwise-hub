from rest_framework import serializers

from fees.models import (
    Charge, ChargeAssignment, FeeStructure, FeeStructureItem,
    Invoice, InvoiceLine, Payment, PaymentAllocation,
)


class FeeStructureItemSerializer(serializers.ModelSerializer):
    categoryLabel = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = FeeStructureItem
        fields = ["id", "name", "category", "categoryLabel", "amount", "is_mandatory"]


class FeeStructureSerializer(serializers.ModelSerializer):
    items = FeeStructureItemSerializer(many=True, required=False)
    gradeLevel = serializers.CharField(source="grade_level_id")
    termNumber = serializers.IntegerField(source="term.number", read_only=True)
    termLabel = serializers.CharField(source="term.label", read_only=True)
    academicYearName = serializers.CharField(
        source="academic_year.name", read_only=True
    )
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = FeeStructure
        fields = [
            "id",
            "academic_year",
            "academicYearName",
            "term",
            "termNumber",
            "termLabel",
            "gradeLevel",
            "status",
            "items",
            "total",
        ]
        read_only_fields = ["status"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        structure = FeeStructure.objects.create(**validated_data)
        for item in items_data:
            FeeStructureItem.objects.create(fee_structure=structure, **item)
        return structure

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        # Update the parent fields
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()

        # Replace items if provided
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                FeeStructureItem.objects.create(fee_structure=instance, **item)

        return instance


class ChargeSerializer(serializers.ModelSerializer):
    gradeLevels = serializers.SlugRelatedField(
        source="grade_levels", many=True, slug_field="name",
        queryset=__import__("school.models", fromlist=["GradeLevel"]).GradeLevel.objects.all(),
        required=False,
    )
    classIds = serializers.PrimaryKeyRelatedField(
        source="classes", many=True,
        queryset=__import__("academics.models", fromlist=["ClassRoom"]).ClassRoom.objects.all(),
        required=False,
    )
    appliedCount = serializers.SerializerMethodField()

    class Meta:
        model = Charge
        fields = [
            "id", "name", "description", "amount",
            "academic_year", "term",
            "scope", "gradeLevels", "classIds",
            "is_optional", "due_date", "status",
            "appliedCount",
        ]
        read_only_fields = ["status"]

    def get_appliedCount(self, obj):
        return obj.assignments.filter(applied_at__isnull=False).count()


class InvoiceLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLine
        fields = ["id", "description", "amount", "due_date", "charge"]


class PaymentAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentAllocation
        fields = ["id", "invoice", "amount"]


class PaymentSerializer(serializers.ModelSerializer):
    methodLabel = serializers.CharField(source="get_method_display", read_only=True)
    statusLabel = serializers.CharField(source="get_status_display", read_only=True)
    studentName = serializers.SerializerMethodField()
    recordedByName = serializers.CharField(
        source="recorded_by.name", read_only=True, default=None,
    )

    class Meta:
        model = Payment
        fields = [
            "id", "student", "studentName",
            "amount", "method", "methodLabel",
            "reference", "paid_on", "status", "statusLabel",
            "mpesa_receipt_number", "mpesa_phone",
            "recordedByName", "notes",
            "created_at",
        ]

    def get_studentName(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()


class InvoiceSerializer(serializers.ModelSerializer):
    lines = InvoiceLineSerializer(many=True, read_only=True)
    studentName = serializers.SerializerMethodField()
    className = serializers.CharField(source="class_room.name", read_only=True, default=None)
    termNumber = serializers.IntegerField(source="term.number", read_only=True)
    termLabel = serializers.CharField(source="term.label", read_only=True)
    academicYearName = serializers.CharField(source="academic_year.name", read_only=True)
    balanceDue = serializers.SerializerMethodField()
    statusLabel = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id", "number", "student", "studentName",
            "className", "grade_level",
            "academic_year", "academicYearName",
            "term", "termNumber", "termLabel",
            "total", "paid_amount", "balanceDue",
            "issued_on", "due_on",
            "status", "statusLabel",
            "lines",
        ]

    def get_studentName(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()

    def get_balanceDue(self, obj):
        return obj.total - obj.paid_amount


class StkPushResponseSerializer(serializers.Serializer):
    """Response returned from POST /api/fees/mpesa/stk-push/."""

    checkoutRequestId = serializers.CharField()
    merchantRequestId = serializers.CharField(allow_blank=True)
    customerMessage = serializers.CharField(allow_blank=True)
    paymentId = serializers.IntegerField()


class PaymentStatusSerializer(serializers.Serializer):
    """Response returned from GET /api/fees/mpesa/status/<id>/."""

    status = serializers.CharField()
    amount = serializers.CharField()
    receipt = serializers.CharField(allow_blank=True)
    resultCode = serializers.CharField(allow_blank=True)
    resultDesc = serializers.CharField(allow_blank=True)
