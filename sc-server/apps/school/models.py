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
    
    # Academic Settings
    current_term = models.IntegerField(default=1)
    current_year = models.IntegerField(default=2026)
    term_start = models.DateField(null=True, blank=True)
    term_end = models.DateField(null=True, blank=True)
    academic_system = models.CharField(max_length=20, default="CBC") # CBC or 8-4-4
    
    # Finance Settings
    currency = models.CharField(max_length=10, default="KES")
    bank_name = models.CharField(max_length=100, blank=True)
    bank_branch = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    paybill_number = models.CharField(max_length=50, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "School Profile"
