from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from core.models import Student, User
from .models import ClassRoom, Subject, SubjectAssignment, TimetableSlot, Enrollment, Promotion, PromotionBatch, PromotionStreamMapping, BellSchedule, BellPeriod
from school.models import GradeLevel, AcademicYear

STAFF_ROLES = [
    "teacher",
    "class_teacher",
    "headteacher",
    "deputy",
    "hod",
    "admin",
]


class ModelCleanMixin:
    """Run the model's clean() so rules live in one place."""

    def validate(self, attrs):
        attrs = super().validate(attrs)
        model = self.Meta.model
        instance = self.instance or model()
        for name, value in attrs.items():
            field = model._meta.get_field(name)
            if not field.many_to_many and not field.one_to_many:
                setattr(instance, name, value)
        try:
            instance.clean()
        except DjangoValidationError as exc:
            detail = exc.message_dict if hasattr(exc, "error_dict") else exc.messages
            raise serializers.ValidationError(detail)
        return attrs


class ClassRoomSerializer(ModelCleanMixin, serializers.ModelSerializer):
    gradeLevel = serializers.CharField(source="grade_level_id")
    gradeLevelOrder = serializers.IntegerField(
        source="grade_level.order", read_only=True
    )
    academicYear = serializers.PrimaryKeyRelatedField(
        source="academic_year",
        queryset=ClassRoom._meta.get_field("academic_year").related_model.objects.all(),
    )
    academicYearName = serializers.CharField(
        source="academic_year.name", read_only=True
    )
    classTeacherId = serializers.PrimaryKeyRelatedField(
        source="class_teacher",
        queryset=User.objects.filter(role__in=STAFF_ROLES),
        required=False,
        allow_null=True,
    )
    classTeacherName = serializers.CharField(
        source="class_teacher.name", read_only=True, default=None
    )
    studentCount = serializers.IntegerField(read_only=True)

    class Meta:
        model = ClassRoom
        fields = [
            "id",
            "name",
            "gradeLevel",
            "gradeLevelOrder",
            "stream",
            "capacity",
            "room",
            "academicYear",
            "academicYearName",
            "classTeacherId",
            "classTeacherName",
            "studentCount",
        ]
        read_only_fields = ["id", "name", "studentCount"]


# ============================================================================
# Subject
# ============================================================================


class SubjectSerializer(ModelCleanMixin, serializers.ModelSerializer):
    gradeLevels = serializers.SlugRelatedField(
        source="grade_levels",
        many=True,
        slug_field="name",
        queryset=GradeLevel.objects.all(),
        required=False,
    )
    isCore = serializers.BooleanField(source="is_core", required=False, default=True)
    learningArea = serializers.ChoiceField(
        source="learning_area",
        choices=Subject.LEARNING_AREA_CHOICES,
        required=False,
        allow_null=True,
        allow_blank=True,
    )
    gradingScale = serializers.JSONField(source="grading_scale", required=False)

    class Meta:
        model = Subject
        fields = [
            "id",
            "name",
            "code",
            "description",
            "gradeLevels",
            "isCore",
            "learningArea",
            "gradingScale",
        ]


# ============================================================================
# SubjectAssignment
# ============================================================================


class SubjectAssignmentSerializer(ModelCleanMixin, serializers.ModelSerializer):
    classId = serializers.PrimaryKeyRelatedField(
        source="class_room", queryset=ClassRoom.objects.all()
    )
    subjectId = serializers.PrimaryKeyRelatedField(
        source="subject", queryset=Subject.objects.all()
    )
    teacherId = serializers.PrimaryKeyRelatedField(
        source="teacher", queryset=User.objects.filter(role__in=STAFF_ROLES)
    )
    periodsPerWeek = serializers.IntegerField(
        source="periods_per_week", required=False, default=5, min_value=1
    )
    className = serializers.CharField(source="class_room.name", read_only=True)
    subjectName = serializers.CharField(source="subject.name", read_only=True)
    teacherName = serializers.CharField(source="teacher.name", read_only=True)

    class Meta:
        model = SubjectAssignment
        fields = [
            "id",
            "classId",
            "className",
            "subjectId",
            "subjectName",
            "teacherId",
            "teacherName",
            "periodsPerWeek",
        ]


# ============================================================================
# TimetableSlot
# ============================================================================


class TimetableSlotSerializer(ModelCleanMixin, serializers.ModelSerializer):
    classId = serializers.PrimaryKeyRelatedField(
        source="class_room", queryset=ClassRoom.objects.all()
    )
    subjectId = serializers.PrimaryKeyRelatedField(
        source="subject",
        queryset=Subject.objects.all(),
        required=False,
        allow_null=True,
    )
    teacherId = serializers.PrimaryKeyRelatedField(
        source="teacher",
        queryset=User.objects.filter(role__in=STAFF_ROLES),
        required=False,
        allow_null=True,
    )
    periodNumber = serializers.IntegerField(source="period_number", min_value=1)
    startTime = serializers.TimeField(source="start_time", format="%H:%M")
    endTime = serializers.TimeField(source="end_time", format="%H:%M")
    isBreak = serializers.BooleanField(source="is_break", required=False, default=False)
    breakName = serializers.CharField(
        source="break_name", required=False, allow_null=True, allow_blank=True
    )
    className = serializers.CharField(source="class_room.name", read_only=True)
    subjectName = serializers.CharField(
        source="subject.name", read_only=True, default=None
    )
    teacherName = serializers.CharField(
        source="teacher.name", read_only=True, default=None
    )

    class Meta:
        model = TimetableSlot
        fields = [
            "id",
            "classId",
            "className",
            "day",
            "periodNumber",
            "startTime",
            "endTime",
            "subjectId",
            "subjectName",
            "teacherId",
            "teacherName",
            "isBreak",
            "breakName",
        ]
        # DRF auto-builds "unique set" validators from the model's
        # UniqueConstraints. They fire before bulk-save deletes the old rows
        # (so every re-save fails) and force `teacherId` to be present on
        # breaks. validate() below does the same checks properly instead.
        validators = []

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if self.context.get("bulk"):
            # bulk-save replaces the whole class and checks the full payload itself
            return attrs

        inst = self.instance
        pick = lambda key: attrs.get(key, getattr(inst, key, None))
        class_room, day = pick("class_room"), pick("day")
        period, teacher = pick("period_number"), pick("teacher")
        others = TimetableSlot.objects.exclude(pk=inst.pk) if inst else TimetableSlot.objects.all()

        if others.filter(class_room=class_room, day=day, period_number=period).exists():
            raise serializers.ValidationError(
                "This class already has a slot at that day and period."
            )
        if teacher and not pick("is_break"):
            clash = (
                others.filter(teacher=teacher, day=day, period_number=period, is_break=False)
                .select_related("class_room")
                .first()
            )
            if clash:
                raise serializers.ValidationError(
                    f"{teacher.name} is already teaching {clash.class_room.name} "
                    f"on {day}, period {period}."
                )
        return attrs


class EnrollmentSerializer(ModelCleanMixin, serializers.ModelSerializer):
    """
    Read: returns both IDs and human labels, so the frontend never has to
    do a second lookup just to show "Grade 4 East, 2026".

    Write: accepts `student`, `classId`, `academicYear` (PKs), plus the dates
    and status. `academicYear` is optional on create — if omitted, it is
    inferred from the class's academic year.
    """


    classId = serializers.PrimaryKeyRelatedField(
        source="class_room",
        queryset=ClassRoom.objects.all(),
    )
    studentId = serializers.PrimaryKeyRelatedField(
    source="student",
    queryset=Student.objects.all(),
)
    academicYear = serializers.PrimaryKeyRelatedField(
        source="academic_year",
        queryset=AcademicYear.objects.all(),
        required=False,
    )
    studentName = serializers.SerializerMethodField()
    className = serializers.CharField(source="class_room.name", read_only=True)
    gradeLevel = serializers.CharField(
        source="class_room.grade_level_id", read_only=True
    )
    academicYearName = serializers.CharField(
        source="academic_year.name", read_only=True
    )

    enrolledOn = serializers.DateField(source="enrolled_on")
    leftOn = serializers.DateField(source="left_on", required=False, allow_null=True)

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "studentId",
            "studentName",
            "classId",
            "className",
            "gradeLevel",
            "academicYear",
            "academicYearName",
            "enrolledOn",
            "leftOn",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_studentName(self, obj):
        s = obj.student
        return f"{s.first_name} {s.last_name}".strip()

    def validate(self, attrs):
        # If academic_year isn't provided, infer it from the class.
        if self.instance is None and "academic_year" not in attrs:
            class_room = attrs.get("class_room")
            if class_room is not None:
                attrs["academic_year"] = class_room.academic_year
        return super().validate(attrs)



class StreamMappingSerializer(serializers.ModelSerializer):
    fromStream = serializers.CharField(source="from_stream")
    fromClass = serializers.CharField(
        source="from_class.name", read_only=True, default=None
    )
    fromClassId = serializers.CharField(source="from_class_id", read_only=True)
    fromStudentCount = serializers.IntegerField(source="from_student_count")
    toStream = serializers.CharField(source="to_stream", allow_blank=True)
    toClass = serializers.CharField(
        source="to_class.name", read_only=True, default=None
    )
    toClassId = serializers.CharField(source="to_class_id", read_only=True)

    class Meta:
        model = PromotionStreamMapping
        fields = [
            "id",
            "fromStream",
            "fromClass",
            "fromClassId",
            "fromStudentCount",
            "toStream",
            "toClass",
            "toClassId",
        ]


class PromotionSerializer(serializers.ModelSerializer):
    studentId = serializers.CharField(source="student_id", read_only=True)
    studentName = serializers.SerializerMethodField()
    fromClass = serializers.CharField(source="from_class")
    fromGrade = serializers.CharField(source="from_grade")
    toClass = serializers.CharField(source="to_class")
    toClassId = serializers.CharField(source="to_class_ref_id", read_only=True)
    toGrade = serializers.CharField(source="to_grade")
    appliedAt = serializers.DateTimeField(source="applied_at", read_only=True)

    class Meta:
        model = Promotion
        fields = [
            "id",
            "studentId",
            "studentName",
            "fromClass",
            "fromGrade",
            "toClass",
            "toClassId",
            "toGrade",
            "outcome",
            "reason",
            "appliedAt",
        ]

    def get_studentName(self, obj):
        s = obj.student
        return f"{s.first_name} {s.last_name}".strip()


class PromotionBatchSerializer(serializers.ModelSerializer):
    fromYearId = serializers.CharField(source="from_year_id", read_only=True)
    fromYearName = serializers.CharField(source="from_year.name", read_only=True)
    toYearId = serializers.CharField(source="to_year_id", read_only=True)
    toYearName = serializers.CharField(source="to_year.name", read_only=True)
    fromGrade = serializers.CharField(source="from_grade")
    toGrade = serializers.CharField(source="to_grade")
    studentCount = serializers.IntegerField(source="student_count")
    promotedCount = serializers.IntegerField(source="promoted_count")
    repeatedCount = serializers.IntegerField(source="repeated_count")
    graduatedCount = serializers.IntegerField(source="graduated_count")
    skippedCount = serializers.IntegerField(source="skipped_count")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    executedAt = serializers.DateTimeField(source="executed_at", read_only=True)
    undoneAt = serializers.DateTimeField(source="undone_at", read_only=True)
    createdByName = serializers.CharField(
        source="created_by.name", read_only=True, default=None
    )
    executedByName = serializers.CharField(
        source="executed_by.name", read_only=True, default=None
    )
    canUndo = serializers.BooleanField(source="can_undo", read_only=True)

    class Meta:
        model = PromotionBatch
        fields = [
            "id",
            "fromYearId",
            "fromYearName",
            "toYearId",
            "toYearName",
            "fromGrade",
            "toGrade",
            "status",
            "studentCount",
            "promotedCount",
            "repeatedCount",
            "graduatedCount",
            "skippedCount",
            "createdAt",
            "createdByName",
            "executedAt",
            "executedByName",
            "undoneAt",
            "canUndo",
        ]


class PromotionBatchDetailSerializer(PromotionBatchSerializer):
    streamMappings = StreamMappingSerializer(
        source="stream_mappings", many=True, read_only=True
    )
    students = PromotionSerializer(many=True, read_only=True)

    class Meta(PromotionBatchSerializer.Meta):
        fields = PromotionBatchSerializer.Meta.fields + ["streamMappings", "students"]


# ============================================================================
# Bell schedule
# ============================================================================


class BellPeriodSerializer(serializers.ModelSerializer):
    periodNumber = serializers.IntegerField(source="period_number", min_value=1)
    startTime = serializers.TimeField(source="start_time", format="%H:%M")
    endTime = serializers.TimeField(source="end_time", format="%H:%M")
    isBreak = serializers.BooleanField(source="is_break", required=False, default=False)
    breakName = serializers.CharField(
        source="break_name", required=False, allow_null=True, allow_blank=True
    )

    class Meta:
        model = BellPeriod
        fields = ["periodNumber", "startTime", "endTime", "isBreak", "breakName"]


class BellScheduleSerializer(serializers.ModelSerializer):
    gradeLevels = serializers.SlugRelatedField(
        source="grade_levels",
        many=True,
        slug_field="name",
        queryset=GradeLevel.objects.all(),
        required=False,
    )
    isDefault = serializers.BooleanField(source="is_default", required=False, default=False)
    periods = BellPeriodSerializer(many=True)
    lessonsPerDay = serializers.SerializerMethodField()
    dayEnds = serializers.SerializerMethodField()

    class Meta:
        model = BellSchedule
        fields = [
            "id", "name", "gradeLevels", "isDefault",
            "periods", "lessonsPerDay", "dayEnds",
        ]

    # ---- read helpers -----------------------------------------------------
    def get_lessonsPerDay(self, obj):
        return sum(1 for p in obj.periods.all() if not p.is_break)

    def get_dayEnds(self, obj):
        periods = list(obj.periods.all())
        return periods[-1].end_time.strftime("%H:%M") if periods else None

    # ---- validation -------------------------------------------------------
    def validate_periods(self, periods):
        if not periods:
            raise serializers.ValidationError("Add at least one period.")
        numbers = [p["period_number"] for p in periods]
        if len(numbers) != len(set(numbers)):
            raise serializers.ValidationError("Period numbers must be unique.")
        ordered = sorted(periods, key=lambda p: p["period_number"])
        if all(p.get("is_break") for p in ordered):
            raise serializers.ValidationError("A school day needs at least one lesson.")
        for p in ordered:
            if p["end_time"] <= p["start_time"]:
                raise serializers.ValidationError(
                    f"Period {p['period_number']}: end time must be after start time."
                )
            if p.get("is_break") and not (p.get("break_name") or "").strip():
                raise serializers.ValidationError(
                    f"Period {p['period_number']}: give the break a name."
                )
        for a, b in zip(ordered, ordered[1:]):
            if b["start_time"] < a["end_time"]:
                raise serializers.ValidationError(
                    f"Periods {a['period_number']} and {b['period_number']} overlap."
                )
        return ordered

    def validate(self, attrs):
        attrs = super().validate(attrs)
        others = BellSchedule.objects.all()
        if self.instance:
            others = others.exclude(pk=self.instance.pk)

        # A grade follows exactly one schedule.
        grades = {g.name for g in attrs.get("grade_levels", [])}
        if grades:
            for other in others.prefetch_related("grade_levels"):
                clash = grades & {g.name for g in other.grade_levels.all()}
                if clash:
                    raise serializers.ValidationError({
                        "gradeLevels": f"{', '.join(sorted(clash))} already follows "
                                       f"'{other.name}'. Remove it there first."
                    })

        # Same period number = same clock time in every schedule, so a teacher
        # can't be double-booked across classes on different schedules.
        existing = {}
        for p in BellPeriod.objects.filter(schedule__in=others).select_related("schedule"):
            existing.setdefault(p.period_number, p)
        for p in attrs.get("periods", []):
            ref = existing.get(p["period_number"])
            if ref and (
                ref.start_time != p["start_time"]
                or ref.end_time != p["end_time"]
                or ref.is_break != p.get("is_break", False)
            ):
                raise serializers.ValidationError({
                    "periods": f"Period {ref.period_number} is "
                               f"{ref.start_time:%H:%M}-{ref.end_time:%H:%M}"
                               f"{' (break)' if ref.is_break else ''} in "
                               f"'{ref.schedule.name}'. Use the same time here so teachers "
                               f"aren't double-booked; a shorter day should end earlier, "
                               f"not shift the periods."
                })
        return attrs

    # ---- writes -----------------------------------------------------------
    def _single_default(self, schedule):
        if schedule.is_default:
            BellSchedule.objects.exclude(pk=schedule.pk).update(is_default=False)

    @transaction.atomic
    def create(self, validated_data):
        periods = validated_data.pop("periods")
        grades = validated_data.pop("grade_levels", [])
        schedule = BellSchedule.objects.create(**validated_data)
        schedule.grade_levels.set(grades)
        BellPeriod.objects.bulk_create(
            [BellPeriod(schedule=schedule, **p) for p in periods]
        )
        self._single_default(schedule)
        return schedule

    @transaction.atomic
    def update(self, instance, validated_data):
        periods = validated_data.pop("periods", None)
        grades = validated_data.pop("grade_levels", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if grades is not None:
            instance.grade_levels.set(grades)
        if periods is not None:
            instance.periods.all().delete()
            BellPeriod.objects.bulk_create(
                [BellPeriod(schedule=instance, **p) for p in periods]
            )
        self._single_default(instance)
        return instance
