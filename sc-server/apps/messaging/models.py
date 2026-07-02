from django.db import models
from django.conf import settings

class Message(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_messages")
    subject = models.CharField(max_length=200, blank=True)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"From {self.sender.name} to {self.recipient.name}"

class SchoolMessage(models.Model):
    """Broadcast messages to groups."""
    SCOPE_CHOICES = (
        ("school", "All School"),
        ("grade", "Grade Level"),
        ("class", "Specific Class"),
        ("individual", "Individual Student/Parent"),
    )
    
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=200)
    body = models.TextField()
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default="school")
    
    target_grade = models.CharField(max_length=20, blank=True, null=True)
    target_class = models.ForeignKey("academics.ClassRoom", on_delete=models.SET_NULL, null=True, blank=True)
    student = models.ForeignKey("students.Student", on_delete=models.SET_NULL, null=True, blank=True, related_name="school_messages")
    
    recipient_type = models.CharField(max_length=50, default="all_parents")
    channel = models.CharField(max_length=50, default="announcement")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class MessageRead(models.Model):
    """Tracks per-user read status for broadcast school messages."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="message_reads")
    school_message = models.ForeignKey(SchoolMessage, on_delete=models.CASCADE, related_name="reads")
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "school_message")

    def __str__(self):
        return f"{self.user} read {self.school_message}"


class ParentReply(models.Model):
    message = models.ForeignKey(SchoolMessage, on_delete=models.CASCADE, related_name="replies")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="parent_replies")
    parent_name = models.CharField(max_length=200)
    body = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    read_by_staff = models.BooleanField(default=False)

    def __str__(self):
        return f"Reply from {self.parent_name} for message {self.message.id}"
