from .models import AuditLog

def log_action(user, action, module, description=""):
    """
    Reusable utility for audit logging.
    """
    AuditLog.objects.create(
        user=user,
        action=action,
        module=module,
        description=description
    )
