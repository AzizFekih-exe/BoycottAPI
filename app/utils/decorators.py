# app/utils/decorators.py

from functools import wraps

from flask_jwt_extended import verify_jwt_in_request, get_jwt
from flask_smorest import abort

from app.models.user import UserRole


def role_required(*allowed_roles: UserRole):
    """
    Require the current user to have one of the given roles.

    Usage:
        @jwt_required()
        @role_required(UserRole.MODERATOR, UserRole.ADMIN)
        def post(...):
            ...
    """
    allowed_values = {r.value if isinstance(r, UserRole) else str(r) for r in allowed_roles}

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Ensure JWT is present and valid
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get("role")

            if role not in allowed_values:
                abort(
                    403,
                    message="You do not have permission to perform this action.",
                )

            return fn(*args, **kwargs)

        return wrapper

    return decorator
