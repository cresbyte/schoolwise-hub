from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from apps.accounts.permissions import IsSchoolAdmin, IsStaff, IsStaffOrParent
from apps.accounts.models import UserRole
from .models import ClassRoom, Subject, SubjectAssignment, TimetableSlot, TermEvent
from .serializers import (
    ClassRoomSerializer, 
    SubjectSerializer, 
    SubjectAssignmentSerializer,
    TimetableSlotSerializer,
    TermEventSerializer,
)

class ClassRoomViewSet(viewsets.ModelViewSet):
    queryset = ClassRoom.objects.all().order_by('name')
    serializer_class = ClassRoomSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsStaff()]
        return [IsSchoolAdmin()]

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all().order_by('name')
    serializer_class = SubjectSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsStaff()]
        return [IsSchoolAdmin()]

    def get_queryset(self):
        queryset = Subject.objects.all().order_by('name')
        curriculum = self.request.query_params.get("curriculum")
        if curriculum:
            queryset = queryset.filter(curriculum=curriculum)
        return queryset

class SubjectAssignmentViewSet(viewsets.ModelViewSet):
    queryset = SubjectAssignment.objects.all()
    serializer_class = SubjectAssignmentSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsStaff()]
        return [IsSchoolAdmin()]

    def get_queryset(self):
        queryset = SubjectAssignment.objects.all()
        class_room_id = self.request.query_params.get("class_room") or self.request.query_params.get("classId")
        teacher_id = self.request.query_params.get("teacher") or self.request.query_params.get("teacherId")
        subject_id = self.request.query_params.get("subject") or self.request.query_params.get("subjectId")
        
        if class_room_id:
            queryset = queryset.filter(class_room_id=class_room_id)
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        return queryset

class TimetableSlotViewSet(viewsets.ModelViewSet):
    queryset = TimetableSlot.objects.all()
    serializer_class = TimetableSlotSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsStaffOrParent()]
        return [IsSchoolAdmin()]

    def get_queryset(self):
        queryset = TimetableSlot.objects.all()
        class_room_id = self.request.query_params.get("class_room") or self.request.query_params.get("classId")
        teacher_id = self.request.query_params.get("teacher") or self.request.query_params.get("teacherId")
        
        if class_room_id:
            queryset = queryset.filter(class_room_id=class_room_id)
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        return queryset

    @action(detail=False, methods=["POST"])
    def bulk_save(self, request):
        class_id = request.data.get("classId") or request.data.get("class_room")
        if not class_id:
            return Response({"error": "classId/class_room is required"}, status=400)
            
        slots_data = request.data.get("slots", [])
        
        from django.db import transaction
        with transaction.atomic():
            TimetableSlot.objects.filter(class_room_id=class_id).delete()
            created_slots = []
            for slot_data in slots_data:
                payload = {
                    "day": slot_data.get("day"),
                    "period_number": slot_data.get("periodNumber", slot_data.get("period_number")),
                    "start_time": slot_data.get("startTime", slot_data.get("start_time")),
                    "end_time": slot_data.get("endTime", slot_data.get("end_time")),
                    "is_break": slot_data.get("isBreak", slot_data.get("is_break", False)),
                    "break_name": slot_data.get("breakName", slot_data.get("break_name")),
                    "class_room": class_id,
                }
                
                # Relations
                teacher_key = slot_data.get("teacherId") or slot_data.get("teacher")
                if teacher_key:
                    payload["teacher"] = teacher_key
                subject_key = slot_data.get("subjectId") or slot_data.get("subject")
                if subject_key:
                    payload["subject"] = subject_key
                    
                serializer = self.get_serializer(data=payload)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                created_slots.append(serializer.instance)
                
        return Response(self.get_serializer(created_slots, many=True).data)

    @action(detail=False, methods=["POST"])
    def generate_auto(self, request):
        class_id = request.data.get("classId") or request.data.get("class_room") or request.query_params.get("classId") or request.query_params.get("class_room")
        if not class_id:
            return Response({"error": "classId/class_room is required"}, status=400)
            
        # Get the subject assignments for this class
        assignments = list(SubjectAssignment.objects.filter(class_room_id=class_id))
        if not assignments:
            return Response({"error": "No subject assignments found for this class. Assign teachers first."}, status=400)
            
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        
        # Standard Periods timings
        periods_times = [
            ("08:00", "08:40"),
            ("08:40", "09:20"),
            ("09:20", "10:00"),
            ("10:00", "10:30"),  # Tea Break (period 4)
            ("10:30", "11:10"),
            ("11:10", "11:50"),
            ("11:50", "12:30"),
            ("12:30", "13:30"),  # Lunch Break (period 8)
            ("13:30", "14:10"),
            ("14:10", "14:50"),
        ]
        
        from django.db import transaction
        with transaction.atomic():
            TimetableSlot.objects.filter(class_room_id=class_id).delete()
            created_slots = []
            assignment_index = 0
            
            for day in days:
                for idx, (start, end) in enumerate(periods_times):
                    period_num = idx + 1
                    
                    if period_num == 4:
                        slot = TimetableSlot.objects.create(
                            class_room_id=class_id,
                            day=day,
                            period_number=period_num,
                            start_time=start,
                            end_time=end,
                            is_break=True,
                            break_name="Tea Break"
                        )
                    elif period_num == 8:
                        slot = TimetableSlot.objects.create(
                            class_room_id=class_id,
                            day=day,
                            period_number=period_num,
                            start_time=start,
                            end_time=end,
                            is_break=True,
                            break_name="Lunch Break"
                        )
                    else:
                        assigned = assignments[assignment_index % len(assignments)]
                        assignment_index += 1
                        slot = TimetableSlot.objects.create(
                            class_room_id=class_id,
                            day=day,
                            period_number=period_num,
                            start_time=start,
                            end_time=end,
                            subject=assigned.subject,
                            teacher=assigned.teacher,
                            is_break=False
                        )
                    created_slots.append(slot)
                    
        return Response(self.get_serializer(created_slots, many=True).data)


class TermEventViewSet(viewsets.ModelViewSet):
    """CRUD for term events with approve/reject workflow."""
    queryset = TermEvent.objects.select_related("class_room", "exam", "created_by", "reviewed_by").all()
    serializer_class = TermEventSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["term", "year", "scope", "category", "approval_status"]
    search_fields = ["title"]
    ordering_fields = ["start_date", "created_at"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated(), IsStaffOrParent()]
        return [permissions.IsAuthenticated(), IsStaff()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.role == UserRole.PARENT:
            queryset = queryset.filter(visible_to_parents=True, approval_status="approved")

        class_id = self.request.query_params.get("class_room")
        if class_id:
            queryset = queryset.filter(class_room_id=class_id)

        grade = self.request.query_params.get("grade_level")
        if grade:
            queryset = queryset.filter(grade_level=grade)

        return queryset.order_by("start_date")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, approval_status="approved")

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        event = self.get_object()
        event.approval_status = "approved"
        event.reviewed_by = request.user
        event.rejection_reason = ""
        event.save()
        return Response(self.get_serializer(event).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        event = self.get_object()
        event.approval_status = "rejected"
        event.reviewed_by = request.user
        event.rejection_reason = request.data.get("reason", "")
        event.save()
        return Response(self.get_serializer(event).data)

