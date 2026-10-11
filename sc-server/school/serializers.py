import copy

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from . import services
from .models import AcademicYear, CalendarEvent, EventScope, GradeLevel, Term


class ModelCleanMixin:
    """Run the model's clean() during validation so each rule lives in one place."""

    def validate(self, attrs):
        attrs = super().validate(attrs)
        model = self.Meta.model
        instance = copy.copy(self.instance) if self.instance else model()
        for name, value in attrs.items():
            if not model._meta.get_field(name).many_to_many:
                setattr(instance, name, value)
        try:
            instance.clean()
        except DjangoValidationError as exc:
            detail = exc.message_dict if hasattr(exc, "error_dict") else exc.messages
            raise serializers.ValidationError(detail)
        return attrs


class TermSerializer(ModelCleanMixin, serializers.ModelSerializer):
    academic_year_name = serializers.CharField(
        source="academic_year.name", read_only=True
    )
    label = serializers.CharField(read_only=True)

    class Meta:
        model = Term
        fields = [
            "id",
            "academic_year",
            "academic_year_name",
            "number",
            "label",
            "start_date",
            "end_date",
            "is_current",
        ]
        read_only_fields = ["is_current"]  # use POST terms/{id}/set-current/


class AcademicYearSerializer(ModelCleanMixin, serializers.ModelSerializer):
    terms = TermSerializer(many=True, read_only=True)

    class Meta:
        model = AcademicYear
        fields = ["id", "name", "start_date", "end_date", "status", "terms"]
        read_only_fields = ["status"]  # use POST academic-years/{id}/activate|close/


class GradeLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeLevel
        fields = ["id", "name", "order", "is_final"]


class CalendarEventSerializer(ModelCleanMixin, serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source="created_by.name", read_only=True, default=None
    )
    academic_year_name = serializers.CharField(
        source="academic_year.name", read_only=True
    )

    class Meta:
        model = CalendarEvent
        fields = [
            "id",
            "title",
            "description",
            "category",
            "scope",
            "grade_levels",
            "start_date",
            "end_date",
            "academic_year",
            "academic_year_name",
            "term",
            "visible_to_parents",
            "approval_status",
            "rejection_reason",
            "created_by",
            "created_by_name",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "approval_status",
            "rejection_reason",
            "created_by",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        # Both are inferred from the dates when omitted. Send term=null explicitly
        # for a holiday/break that should not belong to any term.
        extra_kwargs = {"academic_year": {"required": False}}

    def validate(self, attrs):
        creating = self.instance is None
        start = attrs.get("start_date") or getattr(self.instance, "start_date", None)
        end = attrs.get("end_date") or getattr(self.instance, "end_date", None)

        if creating and "academic_year" not in attrs:
            year = services.find_year_for_date(start)
            if not year:
                raise serializers.ValidationError(
                    {
                        "start_date": "No academic year covers this date. Create one first."
                    }
                )
            attrs["academic_year"] = year
        if creating and "term" not in attrs:
            attrs["term"] = services.find_term_for_range(start, end)

        scope = attrs.get("scope") or getattr(self.instance, "scope", EventScope.SCHOOL)
        if "grade_levels" in attrs:
            grades = attrs["grade_levels"]
        else:
            grades = list(self.instance.grade_levels.all()) if self.instance else []
        if scope == EventScope.GRADE and not grades:
            raise serializers.ValidationError(
                {"grade_levels": "Select at least one grade level."}
            )
        if scope == EventScope.SCHOOL and grades:
            raise serializers.ValidationError(
                {"grade_levels": "School-wide events cannot target specific grades."}
            )
        return super().validate(attrs)


class RejectEventSerializer(serializers.Serializer):
    reason = serializers.CharField()
