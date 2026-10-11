"""
Seed the school calendar with realistic events for testing.

    python manage.py seed_calendar_events
    python manage.py seed_calendar_events --wipe
    python manage.py seed_calendar_events --dry-run
    python manage.py seed_calendar_events --year 2027

Idempotent: matched on (title, start_date). Safe to re-run.

Events are derived from each academic year's dates and terms, so any year
you've configured gets a plausible set of events. Kenya-specific: uses
Kenyan public holidays, half-term breaks, and typical school rhythms.
"""

from datetime import date, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from school.models import AcademicYear, CalendarEvent, Term


# Kenyan public holidays (fixed dates). Non-fixed holidays like Eid
# aren't included — add them manually if the school follows the Islamic
# calendar.
KENYAN_HOLIDAYS = [
    (1, 1, "New Year's Day"),
    (5, 1, "Labour Day"),
    (6, 1, "Madaraka Day"),
    (10, 10, "Huduma Day"),
    (10, 20, "Mashujaa Day"),
    (12, 12, "Jamhuri Day"),
    (12, 25, "Christmas Day"),
    (12, 26, "Boxing Day"),
    # Variable dates (Good Friday, Easter Monday, Eid) are not seeded.
]


class Command(BaseCommand):
    help = "Seed calendar events for every academic year in the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--wipe", action="store_true",
            help="Delete all existing calendar events first.",
        )
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Print what would be created without writing.",
        )
        parser.add_argument(
            "--year", type=str,
            help="Only seed events for one academic year (by name).",
        )

    def handle(self, *args, **opts):
        dry_run = opts["dry_run"]

        years_qs = AcademicYear.objects.all()
        if opts["year"]:
            years_qs = years_qs.filter(name=opts["year"])
        years = list(years_qs)

        if not years:
            raise CommandError(
                "No academic years found. Run seed_school first."
            )

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — no changes will be saved."))

        if opts["wipe"] and not dry_run:
            count = CalendarEvent.objects.count()
            CalendarEvent.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {count} events."))

        total_created = 0
        total_skipped = 0

        for year in years:
            self.stdout.write(f"\n{year.name} ({year.start_date} → {year.end_date})")
            events = self._events_for_year(year)

            if dry_run:
                for e in events:
                    self.stdout.write(
                        f"  [{e['category']:9}] {e['start_date']} "
                        f"{'→ ' + str(e['end_date']) if e['end_date'] != e['start_date'] else ''}"
                        f"  {e['title']}"
                    )
                continue

            created, skipped = self._save_events(year, events)
            total_created += created
            total_skipped += skipped
            self.stdout.write(
                self.style.SUCCESS(f"  Created {created}, skipped {skipped}.")
            )

        if not dry_run:
            self.stdout.write("")
            self.stdout.write(self.style.SUCCESS(
                f"Done. Created {total_created}, skipped {total_skipped}. "
                f"Total events: {CalendarEvent.objects.count()}."
            ))

    # ---- event generation ------------------------------------------------

    def _events_for_year(self, year):
        """Build the full list of event dicts for one academic year."""
        events = []
        terms = list(year.terms.order_by("number"))

        # 1. Public holidays inside the academic year window
        for month, day, name in KENYAN_HOLIDAYS:
            d = self._clamp_to_year(year, month, day)
            if d:
                events.append({
                    "title": name,
                    "description": f"National public holiday — {name}.",
                    "category": "holiday",
                    "scope": "school",
                    "start_date": d,
                    "end_date": d,
                    "visible_to_parents": True,
                })

        # 2. Term openings and closings
        for term in terms:
            events.append({
                "title": f"Term {term.number} opening day",
                "description": "First day of term. Students report by 8:00 AM.",
                "category": "general" if hasattr(CalendarEvent, "EventCategory") and False else "activity",
                "scope": "school",
                "start_date": term.start_date,
                "end_date": term.start_date,
                "term_id": term.id,
                "visible_to_parents": True,
            })
            events.append({
                "title": f"Term {term.number} closing day",
                "description": "Last day of term. Students break for the holidays.",
                "category": "activity",
                "scope": "school",
                "start_date": term.end_date,
                "end_date": term.end_date,
                "term_id": term.id,
                "visible_to_parents": True,
            })

            # 3. Half-term break (midpoint of the term)
            total_days = (term.end_date - term.start_date).days
            if total_days >= 40:
                midpoint = term.start_date + timedelta(days=total_days // 2)
                # Move to Friday if it's not already a weekday break
                while midpoint.weekday() > 4:
                    midpoint -= timedelta(days=1)
                end = midpoint + timedelta(days=3)  # Fri-Mon
                events.append({
                    "title": f"Term {term.number} half-term break",
                    "description": "Short mid-term break. School closed.",
                    "category": "closure",
                    "scope": "school",
                    "start_date": midpoint,
                    "end_date": end,
                    "term_id": term.id,
                    "visible_to_parents": True,
                })

            # 4. End-of-term exams (last two weeks of term)
            exam_start = term.end_date - timedelta(days=14)
            while exam_start.weekday() > 4:
                exam_start -= timedelta(days=1)
            exam_end = term.end_date - timedelta(days=2)
            while exam_end.weekday() > 4:
                exam_end -= timedelta(days=1)
            if exam_start < exam_end:
                events.append({
                    "title": f"End of Term {term.number} exams",
                    "description": "End-of-term examinations. All students sit their papers.",
                    "category": "exam",
                    "scope": "school",
                    "start_date": exam_start,
                    "end_date": exam_end,
                    "term_id": term.id,
                    "visible_to_parents": True,
                })

        # 5. Opening day / closing day of the year
        events.append({
            "title": f"Academic year {year.name} opening",
            "description": "First day of the academic year.",
            "category": "activity",
            "scope": "school",
            "start_date": year.start_date,
            "end_date": year.start_date,
            "visible_to_parents": True,
        })
        events.append({
            "title": f"Academic year {year.name} closing",
            "description": "Last day of the academic year.",
            "category": "activity",
            "scope": "school",
            "start_date": year.end_date,
            "end_date": year.end_date,
            "visible_to_parents": True,
        })

        # 6. Parents' meetings (one per term, ~4 weeks in)
        for term in terms:
            meeting_date = term.start_date + timedelta(days=28)
            while meeting_date.weekday() > 4:
                meeting_date -= timedelta(days=1)
            if meeting_date <= term.end_date:
                events.append({
                    "title": f"Parents' meeting — Term {term.number}",
                    "description": "Parents meet class teachers to discuss progress.",
                    "category": "meeting",
                    "scope": "school",
                    "start_date": meeting_date,
                    "end_date": meeting_date,
                    "term_id": term.id,
                    "visible_to_parents": True,
                })

        # 7. Sports day (one per year, in the second term if it exists)
        if len(terms) >= 2:
            sports_date = terms[1].start_date + timedelta(days=42)
            while sports_date.weekday() > 4:
                sports_date -= timedelta(days=1)
            events.append({
                "title": "Annual sports day",
                "description": "Inter-house athletics. Parents welcome.",
                "category": "activity",
                "scope": "school",
                "start_date": sports_date,
                "end_date": sports_date,
                "term_id": terms[1].id,
                "visible_to_parents": True,
            })

        # 8. Prize-giving day at the end of the year
        prize_date = year.end_date - timedelta(days=3)
        while prize_date.weekday() > 4:
            prize_date -= timedelta(days=1)
        events.append({
            "title": "Prize-giving day",
            "description": "Awards for academic excellence and co-curricular achievement.",
            "category": "activity",
            "scope": "school",
            "start_date": prize_date,
            "end_date": prize_date,
            "visible_to_parents": True,
        })

        # 9. Mid-year staff meeting (before Term 2 opening)
        if len(terms) >= 2:
            staff_date = terms[1].start_date - timedelta(days=2)
            while staff_date.weekday() > 4:
                staff_date -= timedelta(days=1)
            events.append({
                "title": "Staff planning meeting",
                "description": "Staff meeting ahead of Term 2 opening.",
                "category": "meeting",
                "scope": "school",
                "start_date": staff_date,
                "end_date": staff_date,
                "term_id": terms[1].id,
                "visible_to_parents": False,
            })

        # Filter anything outside the year's window
        in_range = []
        for e in events:
            if e["start_date"] < year.start_date or e["end_date"] > year.end_date:
                # Clamp to the year window
                e["start_date"] = max(e["start_date"], year.start_date)
                e["end_date"] = min(e["end_date"], year.end_date)
                if e["start_date"] > e["end_date"]:
                    continue
            in_range.append(e)

        # Sort chronologically for readability
        in_range.sort(key=lambda e: e["start_date"])
        return in_range

    def _clamp_to_year(self, year, month, day):
        """Return a date in the year if it falls within [start_date, end_date], else None."""
        try:
            d = date(year.start_date.year, month, day)
        except ValueError:
            return None
        if year.start_date <= d <= year.end_date:
            return d
        # Try the following year (for events near year-end spilling over)
        try:
            d2 = date(year.start_date.year + 1, month, day)
        except ValueError:
            return None
        if year.start_date <= d2 <= year.end_date:
            return d2
        return None

    # ---- persistence -----------------------------------------------------

    def _save_events(self, year, events):
        created = 0
        skipped = 0
        with transaction.atomic():
            for e in events:
                term_id = e.pop("term_id", None)
                term = None
                if term_id:
                    term = Term.objects.filter(pk=term_id).first()

                _, was_created = CalendarEvent.objects.get_or_create(
                    title=e["title"],
                    start_date=e["start_date"],
                    academic_year=year,
                    defaults={
                        "description": e.get("description", ""),
                        "category": e["category"],
                        "scope": e["scope"],
                        "end_date": e["end_date"],
                        "term": term,
                        "visible_to_parents": e.get("visible_to_parents", False),
                        "approval_status": "approved",
                    },
                )
                if was_created:
                    created += 1
                else:
                    skipped += 1
        return created, skipped
