from rest_framework import serializers
from .models import School


class SchoolSerializer(serializers.ModelSerializer):
    currentTerm = serializers.IntegerField(source="current_term", required=False)
    currentYear = serializers.IntegerField(source="current_year", required=False)
    termStartDate = serializers.DateField(source="term_start", required=False, allow_null=True)
    termEndDate = serializers.DateField(source="term_end", required=False, allow_null=True)
    academicSystem = serializers.CharField(source="academic_system", required=False)

    registrationNumber = serializers.CharField(source="registration_number", required=False, allow_blank=True)
    knecCode = serializers.CharField(source="knec_code", required=False, allow_blank=True)
    nemisCode = serializers.CharField(source="nemis_code", required=False, allow_blank=True)
    principalName = serializers.CharField(source="principal_name", required=False, allow_blank=True)
    postalAddress = serializers.CharField(source="postal_address", required=False, allow_blank=True)
    physicalAddress = serializers.CharField(source="physical_address", required=False, allow_blank=True)
    county = serializers.CharField(required=False, allow_blank=True)
    subCounty = serializers.CharField(source="sub_county", required=False, allow_blank=True)
    schoolType = serializers.ChoiceField(source="school_type", choices=School.SCHOOL_TYPE_CHOICES, required=False)
    mpesaTill = serializers.CharField(source="mpesa_till", required=False, allow_blank=True)
    enabledPaymentMethods = serializers.JSONField(source="enabled_payment_methods", required=False)
    emailFromAddress = serializers.EmailField(source="email_from_address", required=False, allow_blank=True)
    emailFromName = serializers.CharField(source="email_from_name", required=False, allow_blank=True)
    smsSenderId = serializers.CharField(source="sms_sender_id", required=False, allow_blank=True)
    reportCommentTemplates = serializers.JSONField(source="report_comment_templates", required=False)

    class Meta:
        model = School
        fields = [
            "id", "name", "motto", "address", "phone", "email", "website", "logo",
            "current_term", "current_year", "currentTerm", "currentYear",
            "term_start", "term_end", "termStartDate", "termEndDate",
            "academic_system", "academicSystem",
            "currency", "bank_name", "bank_branch", "account_number", "paybill_number",
            "updated_at",
            "registrationNumber", "knecCode", "nemisCode", "principalName",
            "postalAddress", "physicalAddress", "county", "subCounty", "schoolType",
            "mpesaTill", "enabledPaymentMethods", "emailFromAddress", "emailFromName",
            "smsSenderId", "reportCommentTemplates"
        ]
