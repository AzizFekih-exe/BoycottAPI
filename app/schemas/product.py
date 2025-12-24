from marshmallow import Schema, fields

from app.models.product import BoycottStatus
from app.schemas.company import CompanyDetailSchema
from app.schemas.proof import ProofSchema
from app.schemas.external_alternative import ExternalAlternativeSchema


class ProductSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    serial_number = fields.Str(required=True)
    category = fields.Str(required=True)
    boycott_score = fields.Float(dump_only=True)
    boycott_status = fields.Enum(BoycottStatus, dump_only=True)
    company_id = fields.Int(required=True, load_only=True)
    created_at = fields.DateTime(dump_only=True)


class ProductWithCompanySchema(ProductSchema):
    """Product schema with nested company (no products to avoid circular ref)"""

    company = fields.Nested("CompanySchema", dump_only=True)


class ProductScanRequestSchema(Schema):
    serial_number = fields.Str(required=True)


class ProductScanResponseSchema(Schema):
    product = fields.Nested(ProductWithCompanySchema, required=True)
    company = fields.Nested(CompanyDetailSchema, required=True)
    key_proofs = fields.List(fields.Nested(ProofSchema), required=True)
    local_alternatives = fields.List(fields.Nested(ProductSchema), required=True)
    external_alternatives = fields.List(
        fields.Nested(ExternalAlternativeSchema),
        required=True,
    )
