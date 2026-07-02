from django.db import models

class Payroll(models.Model):
    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("pending", "Pending"),
        ("paid", "Paid"),
    )

    staff = models.ForeignKey("staff.Staff", on_delete=models.CASCADE, related_name="payroll_records")
    month = models.IntegerField()
    year = models.IntegerField()
    
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    payment_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.staff.user.name} - {self.month}/{self.year}"
