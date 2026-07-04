from django.db import models

class School(models.Model):
    """
    Global school configuration. Usually only one record exists.
    """
    name = models.CharField(max_length=255)
    motto = models.CharField(max_length=500, blank=True)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to="school/logos/", null=True, blank=True)
    
    # Identity - additional
    registration_number = models.CharField(max_length=100, blank=True)
    knec_code = models.CharField(max_length=50, blank=True)
    nemis_code = models.CharField(max_length=50, blank=True)
    principal_name = models.CharField(max_length=200, blank=True)

    # Contact - additional
    postal_address = models.CharField(max_length=200, blank=True)
    physical_address = models.TextField(blank=True)
    county = models.CharField(max_length=100, blank=True)
    sub_county = models.CharField(max_length=100, blank=True)

    # School type & curriculum
    SCHOOL_TYPE_CHOICES = (
        ("day", "Day School"),
        ("boarding", "Boarding School"),
        ("both", "Day & Boarding"),
    )
    school_type = models.CharField(max_length=20, choices=SCHOOL_TYPE_CHOICES, default="day")
    
    # Academic Settings
    current_term = models.IntegerField(default=1)
    current_year = models.IntegerField(default=2026)
    term_start = models.DateField(null=True, blank=True)
    term_end = models.DateField(null=True, blank=True)
    # Expected values for academic_system: "CBC", "844", or "both"
    academic_system = models.CharField(max_length=20, default="CBC")
    # Report card comment templates (expected shape: {"excellent": str, "good": str, "average": str, "belowAverage": str})
    report_comment_templates = models.JSONField(default=dict, blank=True)
    
    # Finance Settings
    currency = models.CharField(max_length=10, default="KES")
    bank_name = models.CharField(max_length=100, blank=True)
    bank_branch = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    paybill_number = models.CharField(max_length=50, blank=True)
    mpesa_till = models.CharField(max_length=50, blank=True)
    enabled_payment_methods = models.JSONField(default=list, blank=True)  # e.g. ["mpesa", "bank", "cash"]

    # Notification sender identity (non-secret only)
    email_from_address = models.EmailField(blank=True)
    email_from_name = models.CharField(max_length=100, blank=True)
    sms_sender_id = models.CharField(max_length=20, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "School Profile"
