from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.company import Company
from app.models.user import UserRole
from app.utils.decorators import role_required
from marshmallow import Schema, fields

blp = Blueprint('Scores', __name__, url_prefix='/scores', description='Score operations')

class ScoreResponseSchema(Schema):
    company_id = fields.Int()
    company_name = fields.Str()
    old_score = fields.Float()
    new_score = fields.Float()
    affected_products = fields.Int()

@blp.route('/recompute/<int:company_id>')
class RecomputeScore(MethodView):
    @jwt_required()
    @role_required(UserRole.MODERATOR, UserRole.ADMIN)
    @blp.response(200, ScoreResponseSchema)
    def post(self, company_id):
        """Recalculate company and product scores"""
        company = Company.query.get_or_404(company_id)
        
        old_score = company.risk_score
        new_score = company.calculate_risk_score()
        
        # Update all products
        affected_count = 0
        for product in company.products:
            product.update_boycott_status()
            affected_count += 1
        
        db.session.commit()
        
        return {
            'company_id': company.id,
            'company_name': company.name,
            'old_score': old_score,
            'new_score': new_score,
            'affected_products': affected_count
        }
