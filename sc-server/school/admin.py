from django.contrib import admin

from .models import AcademicYear, CalendarEvent, GradeLevel, Term


class TermInline(admin.TabularInline):
    model = Term
    extra = 0
    readonly_fields = ("is_current",)


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ("name", "start_date", "end_date", "status")
    readonly_fields = ("status",)  # changed via the activate/close API actions
    inlines = [TermInline]


@admin.register(Term)
class TermAdmin(admin.ModelAdmin):
    list_display = ("__str__", "start_date", "end_date", "is_current")
    list_filter = ("academic_year",)
    readonly_fields = ("is_current",)


@admin.register(GradeLevel)
class GradeLevelAdmin(admin.ModelAdmin):
    list_display = ("name", "order", "is_final")


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "category",
        "scope",
        "start_date",
        "end_date",
        "term",
        "approval_status",
    )
    list_filter = ("academic_year", "term", "category", "approval_status")
    search_fields = ("title",)
