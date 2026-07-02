from django.db import models
from django.conf import settings

class Staff(models.Model):
    STATUS_CHOICES = (
        ("active", "Active"),
        ("on_leave", "On Leave"),
        ("inactive", "Inactive"),
        ("terminated", "Terminated"),
    )
    CONTRACT_CHOICES = (
        ("permanent", "Permanent"),
        ("tsc", "TSC"),
        ("bom", "BOM"),
        ("contract", "Contract"),
        ("intern", "Intern"),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name="staff_profile")
    staff_id = models.CharField(max_length=20, unique=True) # e.g. STF-011
    designation = models.CharField(max_length=100) # e.g. Mathematics Teacher
    specialization = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    contract_type = models.CharField(max_length=20, choices=CONTRACT_CHOICES, default="permanent")
    
    joining_date = models.DateField()
    id_number = models.CharField(max_length=50, unique=True)
    nssf_number = models.CharField(max_length=50, blank=True)
    nhif_number = models.CharField(max_length=50, blank=True)
    shif_number = models.CharField(max_length=50, blank=True)
    kra_pin = models.CharField(max_length=50, blank=True)
    
    photo = models.ImageField(upload_to="staff/photos/", null=True, blank=True)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.name} ({self.staff_id})"

    class Meta:
        verbose_name_plural = "Staff Members"
