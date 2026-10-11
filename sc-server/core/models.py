from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    HEADTEACHER = "headteacher", "Head Teacher"
    DEPUTY = "deputy", "Deputy Principal"
    HOD = "hod", "Head of Department"
    CLASS_TEACHER = "class_teacher", "Class Teacher"
    TEACHER = "teacher", "Teacher"
    ACCOUNTANT = "accountant", "Accountant"
    STAFF = "staff", "Staff"
    PARENT = "parent", "Parent"


class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError("Phone number is required")
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)  # password=None means "no password yet"
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password, **extra_fields):
        extra_fields.setdefault("role", UserRole.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(phone, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Everyone who can log in: staff and parents. The phone number is the login.
    Parents are users with role "parent". Their children are in `user.children`.
    The role is included in the JWT token so the frontend can control access.
    """

    phone = models.CharField(max_length=15, unique=True)  # stored as 2547XXXXXXXX
    email = models.EmailField(blank=True, null=True)  # used to reset the password
    name = models.CharField(max_length=200)
    gender = models.CharField(
        max_length=10,
        choices=[("Male", "Male"), ("Female", "Female"), ("Other", "Other")],
        blank=True,
    )
    birth_date = models.DateField(null=True, blank=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.STAFF)

    # Staff specific fields
    staff_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    designation = models.CharField(max_length=100, blank=True, null=True)

    photo = models.ImageField(upload_to="users/photos/", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # Django admin access
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["name"]

    objects = UserManager()

    def __str__(self):
        return f"{self.name} ({self.role})"

    @property
    def is_school_admin(self):
        return self.role in [UserRole.ADMIN, UserRole.HEADTEACHER, UserRole.DEPUTY]


class ParentRelationship(models.Model):
    """Through model that links a parent User to a Student with a role label (father/mother)."""
    ROLE_CHOICES = (("father", "Father"), ("mother", "Mother"), ("guardian", "Guardian"))
    student = models.ForeignKey("Student", on_delete=models.CASCADE, related_name="parent_links")
    parent = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="child_links"
    )
    relationship = models.CharField(max_length=20, choices=ROLE_CHOICES, default="guardian")

    class Meta:
        unique_together = ("student", "parent")

    def __str__(self):
        return f"{self.parent.name} ({self.relationship}) → {self.student}"


class Student(models.Model):
    GENDER_CHOICES = (
        ("Male", "Male"),
        ("Female", "Female"),
    )
    STATUS_CHOICES = (
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("graduated", "Graduated"),
        ("transferred_out", "Transferred"),
    )

    id = models.CharField(max_length=50, primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    other_name = models.CharField(max_length=100, blank=True, null=True)
    admission_number = models.CharField(max_length=50, unique=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    photo = models.ImageField(upload_to="students/photos/", null=True, blank=True)

    # Academics
    grade_level = models.CharField(max_length=20)
    class_room = models.ForeignKey(
        "academics.ClassRoom",
        on_delete=models.SET_NULL,
        null=True,
        related_name="students",
    )
    admission_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    # Identifiers
    nemis_number = models.CharField(max_length=50, blank=True, null=True)
    birth_cert_number = models.CharField(max_length=50, blank=True, null=True)

    # Others
    home_location = models.CharField(max_length=255, blank=True, null=True)
    fee_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    health_info = models.TextField(blank=True)

    # Parents are User accounts with a relationship label via a through model.
    parents = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="ParentRelationship",
        related_name="children",
        limit_choices_to={"role": UserRole.PARENT},
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["first_name", "last_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.admission_number})"


class PasswordResetCode(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reset_codes"
    )
    code_hash = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    used_at = models.DateTimeField(null=True, blank=True)
