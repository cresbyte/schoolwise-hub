from decimal import Decimal

from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from academics.models import ClassRoom, Enrollment
from core.models import Student, User
from core.permissions import IsSchoolAdmin, IsStaff, IsStaffOrParent, IsAccountant
from fees import mpesa, services
from fees.models import (
    Charge,
    FeeStructure,
    Invoice,
    Payment,
)
from fees.serializers import (
    ChargeSerializer,
    FeeStructureSerializer,
    InvoiceSerializer,
    PaymentSerializer,
    StkPushResponseSerializer,
    PaymentStatusSerializer,
)
from school.models import AcademicYear, Term


# ============================================================================
# Fee structures
# ============================================================================


class FeeStructureViewSet(viewsets.ModelViewSet):
    """
    ?year=<id>  ?term=<id>  ?grade_level=<name>
    """

    queryset = FeeStructure.objects.select_related(
        "academic_year", "term", "grade_level"
    )
    serializer_class = FeeStructureSerializer

    def get_queryset(self):
        qs = super().get_queryset().prefetch_related("items")
        p = self.request.query_params
        if year := p.get("year"):
            qs = qs.filter(academic_year_id=year)
        if term := p.get("term"):
            qs = qs.filter(term_id=term)
        if grade := p.get("grade_level"):
            qs = qs.filter(grade_level_id=grade)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsStaff()]
        return [IsAccountant()]

    @action(detail=False, methods=["post"], url_path="copy-forward")
    def copy_forward(self, request):
        """
        Copy every fee structure from one year to another.
        Body: { fromYear: <id>, toYear: <id>, overwrite: false }
        """
        from_year_id = request.data.get("fromYear")
        to_year_id = request.data.get("toYear")
        overwrite = bool(request.data.get("overwrite", False))

        if not from_year_id or not to_year_id:
            raise ValidationError({"detail": "fromYear and toYear are required."})

        try:
            from_year = AcademicYear.objects.get(pk=from_year_id)
            to_year = AcademicYear.objects.get(pk=to_year_id)
        except AcademicYear.DoesNotExist:
            raise ValidationError({"detail": "Academic year not found."})

        if from_year.pk == to_year.pk:
            raise ValidationError({"detail": "Years must be different."})

        from_terms = {t.number: t for t in from_year.terms.all()}
        to_terms = {t.number: t for t in to_year.terms.all()}

        created = 0
        updated = 0
        skipped = 0
        errors = []

        for source in FeeStructure.objects.filter(
            academic_year=from_year
        ).prefetch_related("items"):
            target_term = to_terms.get(source.term.number)
            if not target_term:
                errors.append(
                    f"Term {source.term.number} has no match in {to_year.name}."
                )
                continue

            existing = FeeStructure.objects.filter(
                academic_year=to_year,
                term=target_term,
                grade_level=source.grade_level,
            ).first()

            if existing and not overwrite:
                skipped += 1
                continue

            if existing:
                existing.items.all().delete()
                target = existing
                updated += 1
            else:
                target = FeeStructure.objects.create(
                    academic_year=to_year,
                    term=target_term,
                    grade_level=source.grade_level,
                    status=FeeStructure.Status.DRAFT,
                )
                created += 1

            for item in source.items.all():
                from fees.models import FeeStructureItem
                FeeStructureItem.objects.create(
                    fee_structure=target,
                    name=item.name,
                    category=item.category,
                    amount=item.amount,
                    is_mandatory=item.is_mandatory,
                )

        return Response(
            {
                "created": created,
                "updated": updated,
                "skipped": skipped,
                "errors": errors[:10],
            }
        )


# ============================================================================
# Charges
# ============================================================================


class ChargeViewSet(viewsets.ModelViewSet):
    queryset = Charge.objects.prefetch_related("grade_levels", "classes").all()
    serializer_class = ChargeSerializer

    def get_permissions(self):
        # Parents need to be able to call opt-in / opt-out on their own children.
        if self.action in ("opt_in", "opt_out"):
            return [IsStaffOrParent()]
        if self.action in ("list", "retrieve"):
            return [IsStaff()]
        return [IsAccountant()]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        was_active = instance.status == Charge.Status.ACTIVE

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        charge = serializer.save()

        sync_result = None
        if was_active:
            sync_result = services.update_active_charge(charge, user=request.user)

        data = self.get_serializer(charge).data
        if sync_result:
            data["syncResult"] = sync_result
        return Response(data)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        charge = self.get_object()
        if charge.status != Charge.Status.DRAFT:
            raise ValidationError({"detail": "Only draft charges can be activated."})
        charge.status = Charge.Status.ACTIVE
        charge.save(update_fields=["status"])
        result = services.apply_charge_to_students(charge, user=request.user)
        return Response({"charge": ChargeSerializer(charge).data, **result})

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        charge = self.get_object()
        try:
            result = services.cancel_charge(
                charge,
                user=request.user,
                reason=request.data.get("reason", ""),
            )
        except ValueError as e:
            raise ValidationError({"detail": str(e)})
        return Response({"charge": ChargeSerializer(charge).data, **result})

    # ------------------------------------------------------------------
    # NEW: opt-in — now allows parents, and validates active status
    # ------------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="opt-in",
            permission_classes=[IsStaffOrParent])
    def opt_in(self, request, pk=None):
        """Parent (or staff) opts a student into an optional charge."""
        charge = self.get_object()
        if not charge.is_optional:
            raise ValidationError({"detail": "This charge is not optional."})
        if charge.status != Charge.Status.ACTIVE:
            raise ValidationError({"detail": "Charge is not active."})

        student_id = request.data.get("studentId")
        if not student_id:
            raise ValidationError({"detail": "studentId is required."})

        # Parents can only opt in their own children
        if request.user.role == "parent":
            if not request.user.children.filter(pk=student_id).exists():
                raise PermissionDenied("Not your child.")

        assignment, _ = charge.assignments.get_or_create(
            charge=charge,
            student_id=student_id,
            defaults={"opted_in": True},
        )
        assignment.opted_in = True
        assignment.opted_in_at = timezone.now()
        assignment.save(update_fields=["opted_in", "opted_in_at"])

        services.apply_charge_to_students(charge, user=request.user)
        return Response({"ok": True})

    # ------------------------------------------------------------------
    # NEW: opt-out — removes the invoice line or issues a credit
    # ------------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="opt-out",
            permission_classes=[IsStaffOrParent])
    def opt_out(self, request, pk=None):
        """Parent (or staff) opts a student out of an optional charge."""
        charge = self.get_object()
        student_id = request.data.get("studentId")
        if not student_id:
            raise ValidationError({"detail": "studentId is required."})

        if request.user.role == "parent":
            if not request.user.children.filter(pk=student_id).exists():
                raise PermissionDenied("Not your child.")

        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            raise ValidationError({"detail": "Student not found."})

        try:
            services.opt_out_charge(charge, student, user=request.user)
        except ValueError as e:
            raise ValidationError({"detail": str(e)})
        return Response({"ok": True})

    # ------------------------------------------------------------------
    # NEW: roster — who's on this charge, who opted in, who's paid
    # ------------------------------------------------------------------
    @action(detail=True, methods=["get"], url_path="roster")
    def roster(self, request, pk=None):
        """
        Who's on this charge, who opted in, who's paid.

        ?status=paid|partial|unpaid|not_applied|opted_in|opted_out
        """
        charge = self.get_object()
        data = services.charge_roster(charge)

        # Apply status filter in Python — payment_status is a derived property
        status_filter = request.query_params.get("status")
        if status_filter:
            if status_filter == "opted_in":
                data["students"] = [s for s in data["students"] if s["optedIn"]]
            elif status_filter == "opted_out":
                data["students"] = [s for s in data["students"] if not s["optedIn"]]
            else:
                data["students"] = [
                    s for s in data["students"]
                    if s["paymentStatus"] == status_filter
                ]

        return Response({
            "chargeId": charge.id,
            "chargeName": charge.name,
            "amount": str(charge.amount),
            "isOptional": charge.is_optional,
            "status": charge.status,
            "summary": {
                **{k: v for k, v in data["summary"].items()
                   if not isinstance(v, Decimal)},
                "totalValue": str(data["summary"]["totalValue"]),
                "totalCollected": str(data["summary"]["totalCollected"]),
            },
            "students": [
                {
                    **{k: v for k, v in s.items()
                       if k not in ("amountOwed", "amountPaid", "optedInAt", "appliedAt")},
                    "amountOwed": str(s["amountOwed"]),
                    "amountPaid": str(s["amountPaid"]),
                    "optedInAt": s["optedInAt"].isoformat() if s["optedInAt"] else None,
                    "appliedAt": s["appliedAt"].isoformat() if s["appliedAt"] else None,
                }
                for s in data["students"]
            ],
        })

    @action(detail=True, methods=["get"], url_path="preview")
    def preview(self, request, pk=None):
        """
        Preview the students this charge would apply to, and the total.
        """
        charge = self.get_object()
        students = services._resolve_charge_students(charge)
        count = students.count()
        total = count * charge.amount

        sample = [
            {
                "id": s.id,
                "name": f"{s.first_name} {s.last_name}".strip(),
                "admissionNumber": s.admission_number,
                "className": s.class_room.name if s.class_room else "",
            }
            for s in students.select_related("class_room")[:50]
        ]
        return Response(
            {
                "chargeId": charge.id,
                "chargeName": charge.name,
                "amount": str(charge.amount),
                "scope": charge.scope,
                "studentCount": count,
                "totalValue": str(total),
                "sample": sample,
                "hasMore": count > 50,
            }
        )


# ============================================================================
# Invoices
# ============================================================================


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ?student=<id>  ?year=<id>  ?term=<id>  ?status=<status>  ?class_room=<id>
    """

    serializer_class = InvoiceSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        qs = Invoice.objects.select_related(
            "student", "class_room", "academic_year", "term"
        ).prefetch_related("lines")
        p = self.request.query_params
        if getattr(self.request.user, "role", None) == "parent":
            qs = qs.filter(student__in=self.request.user.children.all())
        if s := p.get("student"):
            qs = qs.filter(student_id=s)
        if y := p.get("year"):
            qs = qs.filter(academic_year_id=y)
        if t := p.get("term"):
            qs = qs.filter(term_id=t)
        if st := p.get("status"):
            qs = qs.filter(status=st)
        if c := p.get("class_room"):
            qs = qs.filter(class_room_id=c)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsStaffOrParent()]
        return [IsAccountant()]

    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        """Generate invoices for every active enrollment in a year+term."""
        year_id = request.data.get("year")
        term_id = request.data.get("term")
        if not year_id or not term_id:
            raise ValidationError({"detail": "year and term are required."})
        try:
            year = AcademicYear.objects.get(pk=year_id)
            term = Term.objects.get(pk=term_id, academic_year=year)
        except (AcademicYear.DoesNotExist, Term.DoesNotExist):
            raise ValidationError({"detail": "Year or term not found."})

        result = services.generate_term_invoices(year, term, user=request.user)
        return Response(
            {
                "created": result["created"],
                "skipped": result["skipped"],
                "errors": result["errors"][:10],
            }
        )


# ============================================================================
# Payments
# ============================================================================


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ?student=<id>  ?method=<m>  ?status=<s>  ?from=<date>  ?to=<date>
    """

    serializer_class = PaymentSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        qs = Payment.objects.select_related("student", "recorded_by")
        p = self.request.query_params
        if s := p.get("student"):
            qs = qs.filter(student_id=s)
        if m := p.get("method"):
            qs = qs.filter(method=m)
        if st := p.get("status"):
            qs = qs.filter(status=st)
        if df := p.get("from"):
            qs = qs.filter(paid_on__gte=df)
        if dt := p.get("to"):
            qs = qs.filter(paid_on__lte=dt)
        return qs

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsStaffOrParent()]
        return [IsAccountant()]

    def create(self, request):
        """Record a manual payment (cash, bank, cheque)."""
        student_id = request.data.get("student")
        amount = request.data.get("amount")
        method = request.data.get("method", "cash")
        if not student_id or not amount:
            raise ValidationError({"detail": "student and amount are required."})
        try:
            student = Student.objects.get(pk=student_id)
            amount_dec = Decimal(str(amount))
        except (Student.DoesNotExist, ValueError):
            raise ValidationError({"detail": "Invalid student or amount."})

        payment = services.record_payment(
            student=student,
            amount=amount_dec,
            method=method,
            reference=request.data.get("reference", ""),
            paid_on=request.data.get("paid_on") or None,
            notes=request.data.get("notes", ""),
            user=request.user,
        )
        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


# ============================================================================
# Summaries
# ============================================================================


class OutstandingView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        year_id = request.query_params.get("year")
        class_id = request.query_params.get("class_room")
        year = AcademicYear.objects.filter(pk=year_id).first() if year_id else None
        class_room = ClassRoom.objects.filter(pk=class_id).first() if class_id else None
        rows = services.students_with_balance(year, class_room)
        return Response(
            [
                {
                    "studentId": r["student"].id,
                    "studentName": f"{r['student'].first_name} {r['student'].last_name}".strip(),
                    "admissionNumber": r["student"].admission_number,
                    "className": (
                        r["student"].class_room.name if r["student"].class_room else ""
                    ),
                    "balance": str(r["balance"]),
                    "daysOverdue": r["days_overdue"],
                }
                for r in rows
            ]
        )


class CollectionSummaryView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        year_id = request.query_params.get("year")
        term_id = request.query_params.get("term")
        year = AcademicYear.objects.filter(pk=year_id).first() if year_id else None
        term = Term.objects.filter(pk=term_id).first() if term_id else None
        if not year:
            return Response({})
        return Response(services.collection_summary(year, term))


class StudentFeeSummaryView(APIView):
    """GET /api/fees/students/<id>/summary/"""

    permission_classes = [IsStaffOrParent]

    def get(self, request, student_id):
        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            raise ValidationError({"detail": "Student not found."})

        if request.user.role == "parent":
            if not request.user.children.filter(pk=student_id).exists():
                raise PermissionDenied("Not your child.")

        return Response(services.student_fee_summary(student))


class StudentStatementView(APIView):
    """GET /api/fees/students/<id>/statement/"""

    permission_classes = [IsStaffOrParent]

    def get(self, request, student_id):
        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            raise ValidationError({"detail": "Student not found."})

        if request.user.role == "parent":
            if not request.user.children.filter(pk=student_id).exists():
                raise PermissionDenied("Not your child.")

        entries = services.student_statement(student)
        serialized = [
            {
                "type": e["type"],
                "date": e["date"].isoformat(),
                "description": e["description"],
                "debit": str(e["debit"]) if e["debit"] is not None else None,
                "credit": str(e["credit"]) if e["credit"] is not None else None,
                "balance": str(e["balance"]),
                "reference": e["reference"],
                "details": _stringify_details(e["details"]),
            }
            for e in entries
        ]
        return Response(
            {
                "student": {
                    "id": student.id,
                    "name": f"{student.first_name} {student.last_name}".strip(),
                    "admissionNumber": student.admission_number,
                    "className": student.class_room.name if student.class_room else "",
                },
                "balance": str(student.fee_balance),
                "entries": serialized,
            }
        )


# ----------------------------------------------------------------------------
# NEW: Parent-facing pending opt-in charges
# ----------------------------------------------------------------------------
class StudentPendingChargesView(APIView):
    """
    GET /api/fees/students/<student_id>/pending-charges/

    Returns active optional charges for which this student either has no
    assignment or has opted_in=False — i.e. charges awaiting a parent decision.
    """
    permission_classes = [IsStaffOrParent]

    def get(self, request, student_id):
        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            raise ValidationError({"detail": "Student not found."})

        if request.user.role == "parent":
            if not request.user.children.filter(pk=student_id).exists():
                raise PermissionDenied("Not your child.")

        # Active optional charges for the student's current academic year
        active_enrollment = (
            Enrollment.objects
            .filter(student=student, status=Enrollment.Status.ACTIVE)
            .select_related("academic_year")
            .first()
        )
        year = active_enrollment.academic_year if active_enrollment else None

        charges = Charge.objects.filter(
            status=Charge.Status.ACTIVE,
            is_optional=True,
        )
        if year:
            charges = charges.filter(academic_year=year)

        pending = []
        for charge in charges:
            if not services._charge_applies_to(charge, student):
                continue
            assignment = charge.assignments.filter(
                charge=charge, student=student,
            ).first()
            if assignment and assignment.opted_in:
                continue  # already opted in
            pending.append({
                "id": charge.id,
                "name": charge.name,
                "description": charge.description,
                "amount": str(charge.amount),
                "dueDate": charge.due_date.isoformat(),
                "optedIn": False,
                "hasAssignment": assignment is not None,
            })

        return Response({
            "studentId": student.id,
            "studentName": f"{student.first_name} {student.last_name}".strip(),
            "pendingCharges": pending,
        })


def _stringify_details(details):
    """Recursively convert Decimals and dates inside a dict to JSON-safe values."""
    if isinstance(details, dict):
        return {k: _stringify_details(v) for k, v in details.items()}
    if isinstance(details, list):
        return [_stringify_details(v) for v in details]
    if isinstance(details, Decimal):
        return str(details)
    if hasattr(details, "isoformat"):
        return details.isoformat()
    return details


# ============================================================================
# M-Pesa
# ============================================================================


@api_view(["POST"])
@permission_classes([IsStaffOrParent])
def initiate_stk_push(request):
    """Parent (or bursar) initiates an M-Pesa STK push for a student.

    Optional body field: chargeId — if provided, the payment is being made
    specifically to cover an optional charge. On M-Pesa success, the student
    is automatically opted in and an invoice line is created.
    """
    student_id = request.data.get("studentId")
    phone = request.data.get("phone")
    amount = request.data.get("amount")
    charge_id = request.data.get("chargeId")  # optional
    if not student_id or not phone or not amount:
        raise ValidationError({"detail": "studentId, phone and amount are required."})

    try:
        student = Student.objects.get(pk=student_id)
    except Student.DoesNotExist:
        raise ValidationError({"detail": "Student not found."})

    if request.user.role == "parent":
        if not request.user.children.filter(pk=student_id).exists():
            raise PermissionDenied("Not your child.")

    # Validate the charge if provided
    if charge_id:
        try:
            charge = Charge.objects.get(pk=charge_id, is_optional=True,
                                        status=Charge.Status.ACTIVE)
        except Charge.DoesNotExist:
            raise ValidationError({"detail": "Charge not found or not available."})
        # Ensure this charge actually applies to this student
        from fees import services as fee_services
        if not fee_services._charge_applies_to(charge, student):
            raise ValidationError({"detail": "This charge does not apply to this student."})

    phone_clean = phone.replace(" ", "").replace("+", "")
    if phone_clean.startswith("0"):
        phone_clean = "254" + phone_clean[1:]

    try:
        stk_response = mpesa.initiate_stk_push(
            student=student,
            phone=phone_clean,
            amount=Decimal(str(amount)),
            account_reference=f"Fees-{student.admission_number}",
        )
    except Exception as e:
        raise ValidationError({"detail": f"M-Pesa error: {e}"})

    payment = mpesa.save_pending_mpesa_payment(
        student=student,
        phone=phone_clean,
        amount=Decimal(str(amount)),
        stk_response=stk_response,
        charge_id=charge_id,
    )

    return Response(
        StkPushResponseSerializer(
            {
                "checkoutRequestId": stk_response.get("CheckoutRequestID"),
                "merchantRequestId": stk_response.get("MerchantRequestID", ""),
                "customerMessage": stk_response.get("CustomerMessage", ""),
                "paymentId": payment.id,
            }
        ).data
    )



@api_view(["POST"])
@permission_classes([AllowAny])
def mpesa_callback(request):
    """
    Safaricom's callback. Unauthenticated by design — Safaricom calls it.
    Return 200 even on errors, so Safaricom doesn't retry endlessly.
    """
    try:
        result = mpesa.handle_callback(request.data)
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("M-Pesa callback error: %s", e)
        result = {"matched": False, "error": str(e)}
    return Response(result)


@api_view(["GET"])
@permission_classes([IsStaffOrParent])
def check_payment_status(request, checkout_request_id):
    """Poll the status of an STK push. The parent portal calls this."""
    payment = (
        Payment.objects.filter(mpesa_checkout_request_id=checkout_request_id)
        .select_related("student")
        .first()
    )
    if not payment:
        raise ValidationError({"detail": "Payment not found."})

    if request.user.role == "parent":
        if not request.user.children.filter(pk=payment.student_id).exists():
            raise PermissionDenied("Not your child.")

    return Response(
        PaymentStatusSerializer(
            {
                "status": payment.status,
                "amount": str(payment.amount),
                "receipt": payment.mpesa_receipt_number or "",
                "resultCode": payment.mpesa_result_code or "",
                "resultDesc": payment.mpesa_result_desc or "",
            }
        ).data
    )


# ============================================================================
# Dashboards & analytics
# ============================================================================


from datetime import date, timedelta
from django.db.models import Count, Sum, Q


class FeesDashboardView(APIView):
    """GET /api/fees/dashboard/?year=<id>&term=<id>"""

    permission_classes = [IsStaff]

    def get(self, request):
        year_id = request.query_params.get("year")
        term_id = request.query_params.get("term")
        if not year_id:
            return Response({})

        qs = Invoice.objects.filter(academic_year_id=year_id).exclude(
            status=Invoice.Status.VOID
        )
        if term_id:
            qs = qs.filter(term_id=term_id)

        totals = qs.aggregate(
            invoiced=Sum("total"),
            paid=Sum("paid_amount"),
        )
        invoiced = totals["invoiced"] or 0
        paid = totals["paid"] or 0
        return Response(
            {
                "totalInvoiced": str(invoiced),
                "totalCollected": str(paid),
                "outstanding": str(invoiced - paid),
                "collectionRate": float(paid / invoiced) if invoiced else 0,
                "invoiceCount": qs.count(),
            }
        )


class CollectionsByDayView(APIView):
    """GET /api/fees/collections-by-day/?from=YYYY-MM-DD&to=YYYY-MM-DD"""

    permission_classes = [IsStaff]

    def get(self, request):
        df = request.query_params.get("from")
        dt = request.query_params.get("to")
        qs = Payment.objects.filter(status=Payment.Status.SUCCESS)
        if df:
            qs = qs.filter(paid_on__gte=df)
        if dt:
            qs = qs.filter(paid_on__lte=dt)
        rows = qs.values("paid_on").annotate(amount=Sum("amount")).order_by("paid_on")
        return Response(
            [{"date": str(r["paid_on"]), "amount": str(r["amount"] or 0)} for r in rows]
        )


class OutstandingByGradeView(APIView):
    """GET /api/fees/outstanding-by-grade/?year=<id>"""

    permission_classes = [IsStaff]

    def get(self, request):
        year_id = request.query_params.get("year")
        if not year_id:
            return Response([])

        rows = (
            Invoice.objects.filter(academic_year_id=year_id)
            .exclude(status=Invoice.Status.VOID)
            .values("grade_level")
            .annotate(
                balance=Sum("total") - Sum("paid_amount"),
                studentCount=Count("student", distinct=True),
            )
            .order_by("grade_level")
        )
        return Response(
            [
                {
                    "gradeLevel": r["grade_level"],
                    "balance": str(r["balance"] or 0),
                    "studentCount": r["studentCount"],
                }
                for r in rows
                if r["balance"] and r["balance"] > 0
            ]
        )


class ReconcileMpesaView(APIView):
    """POST /api/fees/reconciliation/mpesa/<id>/confirm/"""

    permission_classes = [IsStaff]

    def post(self, request, pk):
        from fees.models import Payment
        from fees.services import _allocate_payment, recompute_student_balance
        from decimal import Decimal as D

        try:
            payment = Payment.objects.get(pk=pk, method=Payment.Method.MPESA)
        except Payment.DoesNotExist:
            return Response({"detail": "Payment not found."}, status=404)

        receipt = (request.data.get("receipt") or "").strip()
        amount = request.data.get("amount")
        if not receipt:
            return Response({"detail": "receipt is required."}, status=400)

        payment.mpesa_receipt_number = receipt
        payment.reference = receipt
        if amount:
            payment.amount = D(str(amount))
        payment.status = Payment.Status.SUCCESS
        payment.save()

        _allocate_payment(payment)
        recompute_student_balance(payment.student)
        return Response({"detail": "Confirmed.", "paymentId": payment.id})
