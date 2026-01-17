from marshmallow import Schema, fields
from app.models.enums import ModerationStatus

class CompanySchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    country = fields.Str()
    website = fields.URL()
    risk_score = fields.Float(dump_only=True)
    status = fields.Enum(ModerationStatus, dump_only=True)
    created_at = fields.DateTime(dump_only=True)

class CompanyDetailSchema(CompanySchema):
    """Company schema with nested proofs and products (no nested company in products)"""
    proofs = fields.List(fields.Nested('ProofSchema'), dump_only=True)
    products = fields.List(fields.Nested('ProductSchema'), dump_only=True)
