"""M-Pesa Daraja integration (STK push / Lipa na M-Pesa online).

Sandbox credentials are configured in settings.py. Move to env vars
before going live.
"""

import base64
import requests
from datetime import datetime
from decimal import Decimal

from django.conf import settings
from django.utils import timezone

from core.models import Student
from fees.models import Payment
from fees.services import record_payment


def _base_url():
    return getattr(settings, "MPESA_BASE_URL", "https://sandbox.safaricom.co.ke")


def _auth():
    """Get an OAuth access token from Safaricom."""
    consumer_key = settings.MPESA_CONSUMER_KEY
    consumer_secret = settings.MPESA_CONSUMER_SECRET
    url = f"{_base_url()}/oauth/v1/generate?grant_type=client_credentials"
    resp = requests.get(url, auth=(consumer_key, consumer_secret), timeout=15)
    resp.raise_for_status()
    return resp.json()["access_token"]


def _password_and_timestamp():
    shortcode = settings.MPESA_SHORTCODE
    passkey = settings.MPESA_PASSKEY
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    raw = f"{shortcode}{passkey}{ts}".encode()
    password = base64.b64encode(raw).decode()
    return password, ts


def initiate_stk_push(student, phone, amount, account_reference="Fees"):
    """
    Ask Safaricom to prompt the parent's phone for payment.

    Returns the raw Safaricom response (contains CheckoutRequestID).
    Raises on network/HTTP errors.
    """
    access_token = _auth()
    password, ts = _password_and_timestamp()

    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": ts,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(Decimal(amount)),  # Safaricom wants an integer
        "PartyA": phone,
        "PartyB": settings.MPESA_SHORTCODE,
        "PhoneNumber": phone,
        "CallBackURL": settings.MPESA_CALLBACK_URL,
        "AccountReference": account_reference,
        "TransactionDesc": f"School fees for {student.first_name}",
    }

    resp = requests.post(
        f"{_base_url()}/mpesa/stkpush/v1/processrequest",
        json=payload,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def save_pending_mpesa_payment(student, phone, amount, stk_response, charge_id=None):
    """
    Save a PENDING Payment row so we can match the callback later.

    charge_id: if set, the payment is being made specifically to cover an
    optional charge. The callback will auto opt-in the student when payment
    succeeds. Stored as "charge:<id>" in the notes field.
    """
    notes = f"charge:{charge_id}" if charge_id else ""
    return Payment.objects.create(
        student=student,
        amount=amount,
        method=Payment.Method.MPESA,
        reference="",
        paid_on=timezone.now().date(),
        status=Payment.Status.PENDING,
        mpesa_checkout_request_id=stk_response.get("CheckoutRequestID", ""),
        mpesa_merchant_request_id=stk_response.get("MerchantRequestID", ""),
        mpesa_phone=phone,
        notes=notes,
    )


def handle_callback(callback_body):
    """
    Process Safaricom's callback. Find the pending payment by CheckoutRequestID,
    set its status, store the receipt, recompute the student's balance.

    Safe to call multiple times — Safaricom retries callbacks.
    """
    stk = callback_body.get("Body", {}).get("stkCallback", {})
    checkout_id = stk.get("CheckoutRequestID", "")
    result_code = str(stk.get("ResultCode", ""))
    result_desc = stk.get("ResultDesc", "")

    payment = (
        Payment.objects.filter(mpesa_checkout_request_id=checkout_id)
        .order_by("-created_at")
        .first()
    )
    if not payment:
        return {"matched": False, "reason": "No pending payment for this checkout ID."}

    # Idempotency: if already successful, don't double-process
    if payment.status == Payment.Status.SUCCESS:
        return {"matched": True, "status": "already_processed"}

    payment.mpesa_result_code = result_code
    payment.mpesa_result_desc = result_desc
    payment.mpesa_raw_callback = callback_body

    if result_code == "0":
        # Success — extract receipt and amount from CallbackMetadata
        meta = {
            item["Name"]: item.get("Value")
            for item in stk.get("CallbackMetadata", {}).get("Item", [])
        }
        payment.mpesa_receipt_number = meta.get("MpesaReceiptNumber", "")
        payment.reference = meta.get("MpesaReceiptNumber", "")
        payment.amount = Decimal(str(meta.get("Amount") or payment.amount))
        payment.status = Payment.Status.SUCCESS
        payment.save()

        # If this payment was initiated to cover a specific optional charge,
        # opt the student in now (creates the invoice line) so the payment
        # allocates against it.
        if payment.notes and payment.notes.startswith("charge:"):
            try:
                charge_id = int(payment.notes.split(":", 1)[1])
                from fees.models import Charge, ChargeAssignment
                from fees.services import apply_charge_to_students
                charge = Charge.objects.get(pk=charge_id, is_optional=True,
                                            status=Charge.Status.ACTIVE)
                assignment, _ = ChargeAssignment.objects.get_or_create(
                    charge=charge,
                    student=payment.student,
                    defaults={"opted_in": True},
                )
                if not assignment.opted_in:
                    from django.utils import timezone as tz
                    assignment.opted_in = True
                    assignment.opted_in_at = tz.now()
                    assignment.save(update_fields=["opted_in", "opted_in_at"])
                # Apply creates the invoice line if not already there
                apply_charge_to_students(charge)
            except Exception:
                import logging
                logging.getLogger(__name__).exception(
                    "Failed to auto opt-in charge after M-Pesa payment %s", payment.id
                )

        # Allocate to invoices
        from fees.services import _allocate_payment, recompute_student_balance

        _allocate_payment(payment)
        recompute_student_balance(payment.student)
        return {"matched": True, "status": "success"}

    # Failed or cancelled
    payment.status = Payment.Status.FAILED
    payment.save()
    return {"matched": True, "status": "failed", "reason": result_desc}
