from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.proof import Proof, ProofStatus
from app.models.company import Company
from app.models.user import UserRole
from app.schemas.proof import ProofSchema, ProofApprovalSchema
from app.utils.decorators import role_required

import json
from datetime import datetime
from pathlib import Path

blp = Blueprint('Proofs', __name__, url_prefix='/proofs', description='Proof operations')


@blp.route('/')
class ProofList(MethodView):
    @blp.response(200, ProofSchema(many=True))
    def get(self):
        """List all proofs (optionally filtered by company_id and status)."""
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
        """Submit a new proof."""
        proof_data["created_by"] = get_jwt_identity()
        proof = Proof(**proof_data)
        db.session.add(proof)
        db.session.commit()
        return proof


@blp.route("/<int:proof_id>")
class ProofDetail(MethodView):
    @blp.response(200, ProofSchema)
    def get(self, proof_id):
        """Get proof by ID."""
        return Proof.query.get_or_404(proof_id)


# ---- JSON logging for approvals/rejections ----

LOG_DIR = Path("var") / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)


def append_proof_log(proof, moderator_id: int):
    entry = {
        "proof_id": proof.id,
        "company_id": proof.company_id,
        "product_id": proof.product_id,
        "status": proof.status.value,
        "weight": proof.weight,
        "moderator_id": moderator_id,
        "created_by": proof.created_by,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

    filename = (
        "accepted_proofs.json"
        if proof.status == ProofStatus.APPROVED
        else "rejected_proofs.json"
    )
    log_path = LOG_DIR / filename

    try:
        if log_path.exists():
            with log_path.open("r", encoding="utf-8") as f:
                data = json.load(f)
        else:
            data = []

        data.append(entry)

        with log_path.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception:
        # Fail silently so logging never breaks the API
        pass


@blp.route("/<int:proof_id>/approve")
class ProofApproval(MethodView):
    @jwt_required()
    @role_required(UserRole.MODERATOR, UserRole.ADMIN)
    @blp.arguments(ProofApprovalSchema)
    @blp.response(200, ProofSchema)
    def patch(self, approval_data, proof_id):
        """Approve or reject a proof."""
        proof = Proof.query.get_or_404(proof_id)

        # Update status
        proof.status = approval_data["status"]

        # Optionally update weight
        if "weight" in approval_data:
            proof.weight = approval_data["weight"]

        db.session.commit()

        # Recalculate company score if approved/rejected
        if proof.status in [ProofStatus.APPROVED, ProofStatus.REJECTED]:
            proof.company.calculate_risk_score()

            # Update all products of this company
            for product in proof.company.products:
                product.update_boycott_status()

            db.session.commit()

            # Log to JSON (accepted_proofs.json or rejected_proofs.json)
            moderator_id = get_jwt_identity()
            append_proof_log(proof, moderator_id)

        return proof


# ---- Convenience endpoint for pending proofs ----

@blp.route("/pending")
class PendingProofs(MethodView):
    @jwt_required()
    @role_required(UserRole.MODERATOR, UserRole.ADMIN)
    @blp.response(200, ProofSchema(many=True))
    def get(self):
        """List pending proofs for review."""
        return Proof.query.filter_by(status=ProofStatus.PENDING).all()
