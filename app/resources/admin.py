from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required
from marshmallow import Schema, fields

from app.extensions import db
from app.models.user import User, UserRole
from app.utils.decorators import role_required


blp = Blueprint(
    "Admin",
    __name__,
    url_prefix="/admin",
    description="Admin operations",
)


class UpdateRoleSchema(Schema):
    role = fields.Str(required=True)


class UserResponseSchema(Schema):
    id = fields.Int()
    email = fields.Email()
    display_name = fields.Str()
    role = fields.Str()


@blp.route("/users/<int:user_id>/role")
class UserRoleResource(MethodView):
    @jwt_required()
    @role_required(UserRole.ADMIN)
    @blp.arguments(UpdateRoleSchema)
    @blp.response(200, UserResponseSchema)
    def patch(self, data, user_id):
        """Change a user's role (ADMIN only)."""
        new_role_value = data["role"].upper()
        if new_role_value not in {r.value for r in UserRole}:
            abort(400, message=f"Invalid role: {new_role_value}")

        user = User.query.get_or_404(user_id)
        user.role = UserRole(new_role_value)
        db.session.commit()
        return {
            "id": user.id,
            "email": user.email,
            "display_name": user.display_name,
            "role": user.role.value,
        }
