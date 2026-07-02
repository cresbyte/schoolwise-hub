from django.db import models
from django.conf import settings

class Student(models.Model):
    GENDER_CHOICES = (
        ("Male", "Male"),
        ("Female", "Female"),
    )
    BOARDING_CHOICES = (
        ("day", "Day Scholar"),
        ("boarding", "Boarding"),
    )
    STATUS_CHOICES = (
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("graduated", "Graduated"),
        ("transferred_out", "Transferred"),
    )
    CURRICULUM_CHOICES = (
        ("CBC", "CBC"),
        ("844", "8-4-4"),
    )

    id = models.CharField(max_length=50, primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    other_name = models.CharField(max_length=100, blank=True, null=True)
    admission_number = models.CharField(max_length=50, unique=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    
    # Academics
    grade_level = models.CharField(max_length=20)
    class_room = models.ForeignKey("academics.ClassRoom", on_delete=models.SET_NULL, null=True, related_name="students")
    curriculum = models.CharField(max_length=10, choices=CURRICULUM_CHOICES, default="CBC")
    admission_date = models.DateField(null=True, blank=True)
    
    # Status
    boarding_status = models.CharField(max_length=20, choices=BOARDING_CHOICES, default="day")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    
    # Identifiers
    nemis_number = models.CharField(max_length=50, blank=True, null=True)
    birth_cert_number = models.CharField(max_length=50, blank=True, null=True)
    
    # Parent/Guardian Details (as specified in mock data)
    father_name = models.CharField(max_length=200, blank=True, null=True)
    father_phone = models.CharField(max_length=20, blank=True, null=True)
    father_email = models.EmailField(blank=True, null=True)
    father_id_number = models.CharField(max_length=50, blank=True, null=True)
    father_occupation = models.CharField(max_length=100, blank=True, null=True)
    
    mother_name = models.CharField(max_length=200, blank=True, null=True)
    mother_phone = models.CharField(max_length=20, blank=True, null=True)
    mother_occupation = models.CharField(max_length=100, blank=True, null=True)
    
    primary_contact_name = models.CharField(max_length=200, blank=True, null=True)
    primary_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Others
    home_location = models.CharField(max_length=255, blank=True, null=True)
    fee_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    photo = models.ImageField(upload_to="students/photos/", null=True, blank=True)
    health_info = models.TextField(blank=True)
    
    # System Links
    guardians = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="children", limit_choices_to={"role": "parent"}, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.admission_number})"

    class Meta:
        ordering = ["first_name", "last_name"]
