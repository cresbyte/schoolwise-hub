from rest_framework import serializers
from .models import SchoolMessage, ParentReply, MessageRead


class ParentReplySerializer(serializers.ModelSerializer):
    messageId = serializers.IntegerField(source="message_id", read_only=True)
    studentId = serializers.IntegerField(source="student_id", read_only=True)
    parentName = serializers.CharField(source="parent_name")
    sentAt = serializers.DateTimeField(source="sent_at", read_only=True)
    readByStaff = serializers.BooleanField(source="read_by_staff", read_only=True)

    class Meta:
        model = ParentReply
        fields = [
            "id", "message", "messageId", "student", "studentId",
            "parentName", "parent_name", "body", "sentAt", "readByStaff",
        ]
        read_only_fields = ["sent_at", "read_by_staff"]


class SchoolMessageSerializer(serializers.ModelSerializer):
    senderName = serializers.SerializerMethodField()
    targetClassId = serializers.PrimaryKeyRelatedField(source="target_class", read_only=True)
    targetClassName = serializers.CharField(source="target_class.name", read_only=True)
    studentId = serializers.PrimaryKeyRelatedField(source="student", read_only=True)
    studentName = serializers.SerializerMethodField()
    recipientType = serializers.CharField(source="recipient_type", required=False, default="all_parents")
    targetGrade = serializers.CharField(source="target_grade", required=False, allow_blank=True, allow_null=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    replies = ParentReplySerializer(many=True, read_only=True)
    # status is injected by the view on a per-request basis
    status = serializers.SerializerMethodField()
    readCount = serializers.IntegerField(source="reads.count", read_only=True)

    class Meta:
        model = SchoolMessage
        fields = [
            "id", "sender", "senderName",
            "title", "body", "scope",
            "target_grade", "targetGrade",
            "target_class", "targetClassId", "targetClassName",
            "student", "studentId", "studentName",
            "recipient_type", "recipientType",
            "channel",
            "createdAt", "replies", "status", "readCount",
        ]
        read_only_fields = ["sender", "created_at"]

    def get_senderName(self, obj):
        if obj.sender:
            return obj.sender.name or obj.sender.email
        return "School"

    def get_studentName(self, obj):
        if obj.student:
            return f"{obj.student.first_name} {obj.student.last_name}"
        return None

    def get_status(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            if MessageRead.objects.filter(user=request.user, school_message=obj).exists():
                return "read"
        return "sent"
