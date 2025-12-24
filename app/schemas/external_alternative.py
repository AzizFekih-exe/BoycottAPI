from marshmallow import Schema, fields


class ExternalAlternativeSchema(Schema):
    name = fields.Str(required=True)
    brand = fields.Str(required=True)
    category = fields.Str(required=True)
    url = fields.Url(required=True)
    image = fields.Str(required=True)
