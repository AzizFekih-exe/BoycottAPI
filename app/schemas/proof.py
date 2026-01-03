from marshmallow import Schema, fields, validates, ValidationError
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

    @validates("description")
    def validate_description(self, value: str):
        lowered = value.lower()
        # Very simple XSS guard; you can extend with more patterns if needed
        if "<script" in lowered or "</script" in lowered:
            raise ValidationError("HTML/JS tags are not allowed in description.")


class ProofApprovalSchema(Schema):
    status = fields.Enum(ProofStatus, required=True)
    weight = fields.Float()  # Optional: adjust weight during approval
