from marshmallow import Schema, fields
from app.models.proof import ProofType, ProofStatus

class ProofSchema(Schema):
    id = fields.Int(dump_only=True)
    type = fields.Enum(ProofType, required=True)
    source_url = fields.URL(required=True)
    description = fields.Str(required=True)
    evidence_date = fields.Date()
    weight = fields.Float(load_default=1.0)
    status = fields.Enum(ProofStatus, dump_only=True)
    company_id = fields.Int(required=True)
    product_id = fields.Int(allow_none=True)
    created_by = fields.Int(dump_only=True)
    created_at = fields.DateTime(dump_only=True)

class ProofApprovalSchema(Schema):
    status = fields.Enum(ProofStatus, required=True)
    weight = fields.Float()  # Optional: adjust weight during approval
