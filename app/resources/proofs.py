from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.proof import Proof, ProofStatus
from app.models.company import Company
from app.models.user import UserRole
from app.schemas.proof import ProofSchema, ProofApprovalSchema
from app.utils.decorators import role_required

blp = Blueprint('Proofs', __name__, url_prefix='/proofs', description='Proof operations')

@blp.route('/')
class ProofList(MethodView):
    @blp.response(200, ProofSchema(many=True))
    def get(self):
        """List all proofs"""
        # Optional filters via query params
        from flask import request
        company_id = request.args.get('company_id', type=int)
        status = request.args.get('status')
        
        query = Proof.query
        if company_id:
            query = query.filter_by(company_id=company_id)
        if status:
            query = query.filter_by(status=status)
        
        return query.all()
    
    @jwt_required()
    @role_required(UserRole.CONTRIBUTOR, UserRole.MODERATOR, UserRole.ADMIN)
    @blp.arguments(ProofSchema)
    @blp.response(201, ProofSchema)
    def post(self, proof_data):
        """Submit a new proof"""
        proof_data['created_by'] = get_jwt_identity()
        proof = Proof(**proof_data)
        db.session.add(proof)
        db.session.commit()
        return proof

@blp.route('/<int:proof_id>')
class ProofDetail(MethodView):
    @blp.response(200, ProofSchema)
    def get(self, proof_id):
        """Get proof by ID"""
        return Proof.query.get_or_404(proof_id)

@blp.route('/<int:proof_id>/approve')
class ProofApproval(MethodView):
    @jwt_required()
    @role_required(UserRole.MODERATOR, UserRole.ADMIN)
    @blp.arguments(ProofApprovalSchema)
    @blp.response(200, ProofSchema)
    def patch(self, approval_data, proof_id):
        """Approve or reject a proof"""
        proof = Proof.query.get_or_404(proof_id)
        
        # Update status
        proof.status = approval_data['status']
        
        # Optionally update weight
        if 'weight' in approval_data:
            proof.weight = approval_data['weight']
        
        db.session.commit()
        
        # Recalculate company score if approved/rejected
        if proof.status in [ProofStatus.APPROVED, ProofStatus.REJECTED]:
            proof.company.calculate_risk_score()
            # Update all products of this company
            for product in proof.company.products:
                product.update_boycott_status()
            db.session.commit()
        
        return proof
