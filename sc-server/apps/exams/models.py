from django.db import models
from django.conf import settings

class Exam(models.Model):
    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("upcoming", "Upcoming"),
        ("ongoing", "Ongoing"),
        ("completed", "Completed"),
        ("published", "Published"),
    )
    EXAM_TYPES = (
        ("opener", "Opener Exam"),
        ("midterm", "Mid-Term Exam"),
        ("endterm", "End-Term Exam"),
        ("mock", "Mock Exam"),
        ("assignment", "Assignment"),
    )

    name = models.CharField(max_length=200)
    term = models.IntegerField(default=1)
    year = models.IntegerField(default=2026)
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPES, default="endterm")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="upcoming")
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.year})"

class Mark(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="marks")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="marks")
    subject = models.ForeignKey("academics.Subject", on_delete=models.CASCADE)
    score = models.DecimalField(max_digits=5, decimal_places=2) # e.g. 85.50
    comment = models.CharField(max_length=255, blank=True)
    
    class Meta:
        unique_together = ("exam", "student", "subject")

    def __str__(self):
        return f"{self.student.first_name} {self.student.last_name} - {self.subject.name}: {self.score}"


class ClassTeacherComment(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="class_teacher_comments")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="class_teacher_comments")
    author = models.ForeignKey("staff.Staff", on_delete=models.SET_NULL, null=True, blank=True)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("exam", "student")

    def __str__(self):
        return f"Comment for {self.student} on {self.exam}"
