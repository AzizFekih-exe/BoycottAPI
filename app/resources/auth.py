from datetime import timedelta
import base64
import io

from flask import jsonify, url_for
from flask.views import MethodView
from flask_smorest import Blueprint
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from marshmallow import Schema, fields
import pyotp
import qrcode

from app.extensions import db
from app.models.user import User, UserRole
from app import oauth

blp = Blueprint(
    "Auth",
    __name__,
    url_prefix="/auth",
    description="Google OAuth2 login, JWT issuance, and 2FA (TOTP) operations.",
)


class TokenSchema(Schema):
    access_token = fields.Str(required=False)  # optional when 2FA pending
    user_id = fields.Int(required=True)
    role = fields.Str(required=True)
    requires_2fa = fields.Bool(required=False)
    temp_token = fields.Str(required=False)


class TwoFASchema(Schema):
    code = fields.Str(required=True)


# ---------- Google OAuth2 login ----------


@blp.route("/google/login")
class GoogleLogin(MethodView):
    def get(self):
        redirect_uri = url_for("Auth.GoogleCallback", _external=True)
        return oauth.google.authorize_redirect(redirect_uri)


@blp.route("/google/callback")
class GoogleCallback(MethodView):
    @blp.response(200, TokenSchema)
    def get(self):
        # 1) Exchange code for tokens (includes id_token + access_token)
        token = oauth.google.authorize_access_token()

        # 2) Use the access token to fetch userinfo
        resp = oauth.google.get("https://openidconnect.googleapis.com/v1/userinfo")
        user_info = resp.json()

        email = user_info.get("email")
        sub = user_info.get("sub")
        name = user_info.get("name")

        if not email or not sub:
            return jsonify({"message": "Google login failed"}), 400

        user = User.query.filter_by(oauth_provider="google", oauth_subject=sub).first()
        if not user:
            user = User(
                email=email,
                display_name=name or email,
                role=UserRole.CONTRIBUTOR,
                oauth_provider="google",
                oauth_subject=sub,
            )
            db.session.add(user)
            db.session.commit()

        # If 2FA is enabled, issue a short-lived temp token
        if user.is_2fa_enabled and user.totp_secret:
            temp_token = create_access_token(
                identity=str(user.id),
                additional_claims={"role": user.role.value, "type": "2fa_pending"},
                expires_delta=timedelta(minutes=5),
            )
            return {
                "requires_2fa": True,
                "temp_token": temp_token,
                "user_id": user.id,
                "role": user.role.value,
            }

        # Otherwise issue full JWT (not necessarily fresh)
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"role": user.role.value},
        )
        return {
            "access_token": access_token,
            "user_id": user.id,
            "role": user.role.value,
        }


# ---------- 2FA setup & verify ----------


@blp.route("/2fa/setup")
class TwoFASetup(MethodView):
    @jwt_required()
    def post(self):
        """
        Initialize TOTP secret and return otpauth URL and QR code (base64).
        Call this once, then scan in Google Authenticator.
        """
        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)

        # Disallow setup if 2FA is already enabled
        if user.is_2fa_enabled and user.totp_secret:
            return {"message": "2FA is already enabled"}, 400

        if not user.totp_secret:
            secret = pyotp.random_base32()
            user.totp_secret = secret
            db.session.commit()
        else:
            secret = user.totp_secret

        issuer = "BoycottAPI"
        otpauth_url = pyotp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name=issuer,
        )

        buffer = io.BytesIO()
        qrcode.make(otpauth_url).save(buffer, format="PNG")
        qrcode_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return {
            "otpauth_url": otpauth_url,
            "qrcode_base64": qrcode_b64,
        }


@blp.route("/2fa/verify")
class TwoFAVerify(MethodView):
    @jwt_required()
    @blp.arguments(TwoFASchema)
    def post(self, body):
        """
        Verify a TOTP code. If called with a temp 2fa_pending token,
        returns a full access token.
        """
        user_id = get_jwt_identity()
        claims = get_jwt()
        code = body["code"]

        user = User.query.get_or_404(user_id)

        if not user.totp_secret:
            return {"message": "2FA not initialized"}, 400

        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(code):
            return {"message": "Invalid or expired code"}, 400

        user.is_2fa_enabled = True
        db.session.commit()

        # If called with the temp 2FA token, issue a fresh access token
        if claims.get("type") == "2fa_pending":
            access_token = create_access_token(
                identity=str(user.id),
                additional_claims={"role": user.role.value},
                fresh=True,  # <--- this is what enables "fresh-only" endpoints
            )
            return {
                "access_token": access_token,
                "user_id": user.id,
                "role": user.role.value,
            }

        return {"message": "2FA enabled"}, 200


# ---------- /me endpoint ----------


@blp.route("/me")
class UserProfile(MethodView):
    @jwt_required()
    def get(self):
        """Get current user profile."""
        from app.schemas.user import UserSchema

        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        return UserSchema().dump(user)
