from rest_framework import serializers
from .models import School


class SchoolSerializer(serializers.ModelSerializer):
    currentTerm = serializers.IntegerField(source="current_term", required=False)
    currentYear = serializers.IntegerField(source="current_year", required=False)
    termStartDate = serializers.DateField(source="term_start", required=False, allow_null=True)
    termEndDate = serializers.DateField(source="term_end", required=False, allow_null=True)
    academicSystem = serializers.CharField(source="academic_system", required=False)

    class Meta:
        model = School
        fields = [
            "id", "name", "motto", "address", "phone", "email", "website", "logo",
            "current_term", "current_year", "currentTerm", "currentYear",
            "term_start", "term_end", "termStartDate", "termEndDate",
            "academic_system", "academicSystem",
            "currency", "bank_name", "bank_branch", "account_number", "paybill_number",
            "updated_at",
        ]
