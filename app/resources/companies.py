from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.company import Company
from app.models.user import UserRole
from app.schemas.company import CompanySchema, CompanyDetailSchema
from app.utils.decorators import role_required
from app.services.proof_search import ProofSearchService

blp = Blueprint('Companies', __name__, url_prefix='/companies', description='Company operations')

@blp.route('/')
class CompanyList(MethodView):
    @blp.response(200, CompanySchema(many=True))
    def get(self):
        """List all companies"""
        return Company.query.all()
    
    @jwt_required()
    @role_required(UserRole.CONTRIBUTOR, UserRole.MODERATOR, UserRole.ADMIN)
    @blp.arguments(CompanySchema)
    @blp.response(201, CompanySchema)
    def post(self, company_data):
        """Create a new company"""
        company = Company(**company_data)
        db.session.add(company)
        db.session.commit()
        
        # 🔹 trigger background search for this company
        ProofSearchService.search_async(company.id)
        
        return company

@blp.route('/<int:company_id>')
class CompanyDetail(MethodView):
    @blp.response(200, CompanyDetailSchema)
    def get(self, company_id):
        """Get company by ID with proofs and products"""
        company = Company.query.get_or_404(company_id)
        return company
    
    @jwt_required()
    @role_required(UserRole.MODERATOR, UserRole.ADMIN)
    @blp.arguments(CompanySchema)
    @blp.response(200, CompanySchema)
    def put(self, company_data, company_id):
        """Update a company"""
        company = Company.query.get_or_404(company_id)
        for key, value in company_data.items():
            setattr(company, key, value)
        db.session.commit()
        return company
    
    @jwt_required()
    @role_required(UserRole.ADMIN)
    def delete(self, company_id):
        """Delete a company"""
        company = Company.query.get_or_404(company_id)
        db.session.delete(company)
        db.session.commit()
        return '', 204
