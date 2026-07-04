from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
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
        user.set_password(password)
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
    Custom user model using phone as the unique identifier.
    Roles map exactly to frontend UserRole type.
    JWT tokens include role so frontend RBAC works without extra calls.
    """
    phone = models.CharField(max_length=15, unique=True)
    email = models.EmailField(blank=True, null=True)
    name = models.CharField(max_length=200) # Full name
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    gender = models.CharField(max_length=10, choices=[("Male", "Male"), ("Female", "Female"), ("Other", "Other")], blank=True)
    birth_date = models.DateField(null=True, blank=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.STAFF)
    photo = models.ImageField(upload_to="users/photos/", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)   # Django admin access
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Links to other models (to be added as we implement other apps)
    # student_ids (for parents) will be managed via M2M or Reverse Relation

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["name"]

    objects = UserManager()

    class Meta:
        db_table = "accounts_user"
        verbose_name = "User"

    def __str__(self):
        return f"{self.name} ({self.role})"

    @property
    def is_school_admin(self):
        return self.role in [UserRole.ADMIN, UserRole.HEADTEACHER, UserRole.DEPUTY]
