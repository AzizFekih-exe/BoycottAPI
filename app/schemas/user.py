from marshmallow import Schema, fields
from app.models.user import UserRole

class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    email = fields.Email(required=True)
    display_name = fields.Str(required=True)
    role = fields.Enum(UserRole, dump_only=True)
    oauth_provider = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    is_2fa_enabled = fields.Boolean(dump_only=True)
