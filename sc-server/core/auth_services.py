"""Password-reset codes and session revocation.

A reset works like this:
  1. request_reset_code(user)  -> makes a 6-digit code, emails it, stores only a hash
  2. reset_password_with_code  -> checks the code, sets the new password, logs the
     user out everywhere

Safety rules baked in:
  - codes expire after 5 minutes and work once
  - only the newest code is valid (asking for a new one kills the old one)
  - 5 wrong guesses kills the code
  - a 60 second wait between codes, and at most 5 codes per hour per user
    (these limits live in the database, so they hold across server workers)
"""

import logging
import secrets
import threading
from datetime import timedelta

from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from django.utils.crypto import constant_time_compare, salted_hmac

from .models import PasswordResetCode

log = logging.getLogger(__name__)

CODE_TTL = timedelta(minutes=5)
RESEND_COOLDOWN = timedelta(seconds=60)
MAX_CODES_PER_HOUR = 5
MAX_ATTEMPTS = 5


def _hash(code):
    return salted_hmac("password-reset-code", code).hexdigest()


def send_email_async(**kwargs):
    """Send an email in a background thread so the request doesn't wait for SMTP."""

    def _send():
        try:
            send_mail(**kwargs)
        except Exception:
            # No retries here. Log it so a failure is never silent.
            log.exception("Email failed to send to %s", kwargs.get("recipient_list"))

    threading.Thread(target=_send, daemon=True).start()


def request_reset_code(user):
    """Create a code and email it. Does nothing if the user is asking too often."""
    now = timezone.now()

    recent = PasswordResetCode.objects.filter(
        user=user, created_at__gte=now - timedelta(hours=1)
    )
    if recent.count() >= MAX_CODES_PER_HOUR:
        return
    last = recent.order_by("-created_at").first()
    if last and now - last.created_at < RESEND_COOLDOWN:
        return

    code = f"{secrets.randbelow(10**6):06d}"

    with transaction.atomic():
        # Any older unused code stops working
        PasswordResetCode.objects.filter(user=user, used_at__isnull=True).update(
            used_at=now
        )
        PasswordResetCode.objects.create(
            user=user, code_hash=_hash(code), expires_at=now + CODE_TTL
        )

    # Sent after the transaction, so we never email a code that wasn't saved
    send_email_async(
        subject="Your Shule Smart password reset code",
        message=(
            f"Hi {user.name},\n\n"
            f"Your password reset code is {code}\n\n"
            "It expires in 5 minutes and can be used once.\n"
            "If you didn't ask for this, ignore this email. "
            "Your password has not changed."
        ),
        from_email=None,  # uses DEFAULT_FROM_EMAIL
        recipient_list=[user.email],
    )


def reset_password_with_code(user, code, new_password):
    """Return True if the code was right and the password was changed."""
    now = timezone.now()

    with transaction.atomic():
        reset = (
            PasswordResetCode.objects.select_for_update()
            .filter(user=user, used_at__isnull=True, expires_at__gt=now)
            .order_by("-created_at")
            .first()
        )
        if reset is None or reset.attempts >= MAX_ATTEMPTS:
            return False

        if not constant_time_compare(reset.code_hash, _hash(code)):
            reset.attempts += 1
            reset.save(update_fields=["attempts"])
            return False

        reset.used_at = now
        reset.save(update_fields=["used_at"])
        user.set_password(new_password)
        user.save(update_fields=["password"])

    revoke_user_sessions(user)
    return True


def revoke_user_sessions(user):
    """Blacklist every refresh token the user has, so old logins stop working.

    Access tokens already issued still work until they expire, so keep
    ACCESS_TOKEN_LIFETIME short (15-60 minutes).
    """
    from rest_framework_simplejwt.token_blacklist.models import (
        BlacklistedToken,
        OutstandingToken,
    )

    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)
