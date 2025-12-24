from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from marshmallow import Schema, fields

from app.extensions import db
from app.models.user import User, UserRole


blp = Blueprint(
    "Auth",
    __name__,
    url_prefix="/auth",
    description="Authentication operations",
)


# Schemas for auth

class LoginSchema(Schema):
    email = fields.Email(required=True)
    display_name = fields.Str(required=True)


class TokenSchema(Schema):
    access_token = fields.Str(required=True)
    user_id = fields.Int(required=True)
    role = fields.Str(required=True)


@blp.route("/login")
class Login(MethodView):
    @blp.arguments(LoginSchema)
    @blp.response(200, TokenSchema)
    def post(self, login_data):
        """
        Mock login - creates or gets user and returns JWT token.

        In production this would validate OAuth tokens instead of accepting
        arbitrary email/display_name.
        """
        email = login_data["email"]
        display_name = login_data["display_name"]

        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                email=email,
                display_name=display_name,
                role=UserRole.CONTRIBUTOR,  # Default role
                oauth_provider="mock",
                oauth_subject=email,
            )
            db.session.add(user)
            db.session.commit()

        # Identity is user.id; role is added as an extra claim
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"role": user.role.value},
        )

        return {
            "access_token": access_token,
            "user_id": user.id,
            "role": user.role.value,
        }


@blp.route("/me")
class UserProfile(MethodView):
    @jwt_required()
    def get(self):
        """Get current user profile."""
        from app.schemas.user import UserSchema

        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        return UserSchema().dump(user)
