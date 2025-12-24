from app.models.proof import ProofStatus

class ScoringEngine:
    # Base weights for proof types
    PROOF_TYPE_WEIGHTS = {
        'donation': 30,
        'statement': 25,
        'article': 20,   # increased so 1 strong article (weight=2) => 50
        'social_post': 10,
    }

    @classmethod
    def calculate_company_score(cls, company):
        """Calculate company risk score from approved proofs"""
        approved_proofs = company.proofs.filter_by(status=ProofStatus.APPROVED).all()
        if not approved_proofs:
            return 0.0

        total_score = 0.0
        for proof in approved_proofs:
            base_weight = cls.PROOF_TYPE_WEIGHTS.get(proof.type.value, 10)

            # optional: boost based on reasons in description
            desc = (proof.description or "").lower()
            if "operations_in_settlements" in desc:
                base_weight *= 2
            elif "operations_in_israel" in desc:
                base_weight *= 1.5

            total_score += base_weight * proof.weight

        return min(total_score, 100.0)

    @classmethod
    def calculate_product_score(cls, product):
        """Product inherits company score for now"""
        return product.company.risk_score
