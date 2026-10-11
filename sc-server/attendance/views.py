from datetime import date

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from academics.models import ClassRoom, Enrollment
from core.permissions import IsStaff, IsStaffOrParent
from school.models import AcademicYear, Term

from attendance import services
from attendance.models import Attendance
from attendance.permissions import (
    CanTakeAttendance,
    can_edit_date,
    can_take_attendance,
)
from attendance.serializers import (
    AttendanceSerializer,
    BulkSaveSerializer,
    RosterEntrySerializer,
)


# ============================================================================
# Roster — who should be on the register
# ============================================================================


class RosterView(APIView):
    """
    GET /api/attendance/roster/?class_room=<id>&date=YYYY-MM-DD

    Returns the roster for a class on a day, merged with any saved attendance.
    """

    permission_classes = [IsStaff]

    def get(self, request):
        class_id = request.query_params.get("class_room")
        day_str = request.query_params.get("date")
        if not class_id or not day_str:
            raise ValidationError({"detail": "class_room and date are required."})

        try:
            class_room = ClassRoom.objects.get(pk=class_id)
        except ClassRoom.DoesNotExist:
            raise ValidationError({"detail": "Class not found."})

        try:
            year, month, d = map(int, day_str.split("-"))
            day = date(year, month, d)
        except (ValueError, AttributeError):
            raise ValidationError({"detail": "date must be YYYY-MM-DD."})

        roster = services.roster_with_attendance(class_room, day)

        return Response({
            "classRoom": {
                "id": class_room.id,
                "name": class_room.name,
                "gradeLevel": class_room.grade_level_id,
            },
            "date": day_str,
            "canEdit": can_take_attendance(request.user, class_room) and can_edit_date(request.user, day),
            "roster": RosterEntrySerializer(roster, many=True).data,
        })


# ============================================================================
# Bulk save — the main write path
# ============================================================================


class BulkSaveView(APIView):
    """
    POST /api/attendance/bulk-save/
    Body: { classRoom, date, records: [{studentId, status, reason?, notes?}] }

    Idempotent: re-saving the same grid updates rows in place.
    """

    permission_classes = [IsStaff]

    def post(self, request):
        body = BulkSaveSerializer(data=request.data)
        body.is_valid(raise_exception=True)

        class_room = body.validated_data["classRoom"]
        day = body.validated_data["date"]
        records = body.validated_data["records"]

        if not can_take_attendance(request.user, class_room):
            raise PermissionDenied("You do not take attendance for this class.")
        if not can_edit_date(request.user, day):
            raise PermissionDenied("You cannot edit attendance for this date.")

        # Verify every student is on the roster for that day
        roster_ids = {
            e.student_id for e in services.roster_for(class_room, day)
        }
        for r in records:
            if r["studentId"] not in roster_ids:
                raise ValidationError({
                    "detail": f"Student {r['studentId']} is not on "
                              f"{class_room.name}'s roster for {day}."
                })

        # Upsert
        academic_year = class_room.academic_year
        saved = []
        for r in records:
            obj, _created = Attendance.objects.update_or_create(
                student_id=r["studentId"],
                date=day,
                defaults={
                    "status": r["status"],
                    "reason": r.get("reason", ""),
                    "notes": r.get("notes", ""),
                    "class_room": class_room,
                    "academic_year": academic_year,
                    "recorded_by": request.user,   # overwritten only on create
                    "updated_by": request.user,    # always set on write
                },
            )
            saved.append(obj)

        return Response({
            "saved": len(saved),
            "records": AttendanceSerializer(saved, many=True).data,
        }, status=status.HTTP_200_OK)


# ============================================================================
# Attendance records — read-only list + single delete
# ============================================================================


class AttendanceViewSet(viewsets.ModelViewSet):
    """
    GET    /api/attendance/                       ?class_room= &student= &date_from= &date_to= &status=
    GET    /api/attendance/<id>/
    DELETE /api/attendance/<id>/                  admin only
    """

    serializer_class = AttendanceSerializer
    http_method_names = ["get", "delete", "head", "options"]

    def get_queryset(self):
        qs = Attendance.objects.select_related(
            "student", "class_room", "academic_year", "recorded_by"
        )
        params = self.request.query_params
        if class_id := params.get("class_room"):
            qs = qs.filter(class_room_id=class_id)
        if student_id := params.get("student"):
            qs = qs.filter(student_id=student_id)
        if status_val := params.get("status"):
            qs = qs.filter(status=status_val)
        if d := params.get("date"):
            qs = qs.filter(date=d)
        if df := params.get("date_from"):
            qs = qs.filter(date__gte=df)
        if dt := params.get("date_to"):
            qs = qs.filter(date__lte=dt)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsStaffOrParent()]
        return [IsStaff()]

    def perform_destroy(self, instance):
        if self.request.user.role not in ("admin", "headteacher", "deputy"):
            raise PermissionDenied("Only admins can delete attendance records.")
        instance.delete()


# ============================================================================
# Summaries
# ============================================================================


class ClassSummaryView(APIView):
    """
    GET /api/attendance/summary/class/<class_id>/?from=YYYY-MM-DD&to=YYYY-MM-DD
    """

    permission_classes = [IsStaff]

    def get(self, request, class_id):
        try:
            class_room = ClassRoom.objects.get(pk=class_id)
        except ClassRoom.DoesNotExist:
            raise ValidationError({"detail": "Class not found."})

        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")
        if not from_str or not to_str:
            raise ValidationError({"detail": "from and to are required."})

        try:
            from_d = date.fromisoformat(from_str)
            to_d = date.fromisoformat(to_str)
        except ValueError:
            raise ValidationError({"detail": "from/to must be YYYY-MM-DD."})

        data = services.class_summary(class_room, from_d, to_d)
        return Response({
            "classRoom": {"id": class_room.id, "name": class_room.name},
            "from": from_str,
            "to": to_str,
            "students": data,
        })


class DailySummaryView(APIView):
    """
    GET /api/attendance/summary/day/?date=YYYY-MM-DD&class_room=<id>
    """

    permission_classes = [IsStaff]

    def get(self, request):
        day_str = request.query_params.get("date")
        if not day_str:
            raise ValidationError({"detail": "date is required."})
        try:
            day = date.fromisoformat(day_str)
        except ValueError:
            raise ValidationError({"detail": "date must be YYYY-MM-DD."})

        class_id = request.query_params.get("class_room")
        class_room = None
        if class_id:
            class_room = ClassRoom.objects.filter(pk=class_id).first()

        data = services.daily_summary(day, class_room)
        return Response({"date": day_str, "classes": data})


class AtRiskView(APIView):
    """
    GET /api/attendance/at-risk/?year=<id>&term=<id>&threshold=0.8
    """

    permission_classes = [IsStaff]

    def get(self, request):
        year_id = request.query_params.get("year")
        if not year_id:
            year = AcademicYear.objects.filter(status="active").first()
            if not year:
                raise ValidationError({"detail": "No active academic year."})
        else:
            try:
                year = AcademicYear.objects.get(pk=year_id)
            except AcademicYear.DoesNotExist:
                raise ValidationError({"detail": "Academic year not found."})

        term = None
        if term_id := request.query_params.get("term"):
            term = Term.objects.filter(pk=term_id).first()

        threshold = float(request.query_params.get("threshold", 0.8))
        data = services.at_risk_students(year, term=term, threshold=threshold)
        return Response({
            "year": year.name,
            "threshold": threshold,
            "students": data,
        })


class StudentSummaryView(APIView):
    """
    GET /api/attendance/summary/student/<student_id>/?from=YYYY-MM-DD&to=YYYY-MM-DD
    """

    permission_classes = [IsStaffOrParent]

    def get(self, request, student_id):
        from core.models import Student
        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            raise ValidationError({"detail": "Student not found."})

        # Parents can only see their own children
        if request.user.role == "parent":
            if not request.user.children.filter(pk=student_id).exists():
                raise PermissionDenied("Not your child.")

        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")
        if not from_str or not to_str:
            raise ValidationError({"detail": "from and to are required."})

        try:
            from_d = date.fromisoformat(from_str)
            to_d = date.fromisoformat(to_str)
        except ValueError:
            raise ValidationError({"detail": "from/to must be YYYY-MM-DD."})

        summary = services.student_attendance_summary(student, from_d, to_d)
        records = Attendance.objects.filter(
            student=student, date__gte=from_d, date__lte=to_d
        ).order_by("-date")

        return Response({
            "student": {
                "id": student.id,
                "name": f"{student.first_name} {student.last_name}".strip(),
            },
            "from": from_str,
            "to": to_str,
            "summary": summary,
            "records": AttendanceSerializer(records, many=True).data,
        })
