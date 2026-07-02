from django.db import models

class Attendance(models.Model):
    STATUS_CHOICES = (
        ("present", "Present"),
        ("absent", "Absent"),
        ("late", "Late"),
        ("excused", "Excused"),
    )

    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="attendance_records")
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="present")
    remarks = models.CharField(max_length=255, blank=True)
    
    taken_by = models.ForeignKey("staff.Staff", on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "date")
        verbose_name_plural = "Attendance"

    def __str__(self):
        return f"{self.student.name} - {self.date}: {self.status}"
