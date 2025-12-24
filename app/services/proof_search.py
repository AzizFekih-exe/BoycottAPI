import os
import requests
from threading import Thread
from app.extensions import db
from app.models.company import Company
from app.models.proof import Proof, ProofType, ProofStatus

BOYCOTT_API_BASE = "https://api.boycottisraeli.biz/v1"  # example external API
# If the API needs a key:
BOYCOTT_API_KEY = os.getenv("BOYCOTT_API_KEY")

class ProofSearchService:
    @staticmethod
    def search_async(company_id: int) -> None:
        """Fire-and-forget background search."""
        Thread(target=ProofSearchService._search_proofs, args=(company_id,)).start()

    @staticmethod
    def _search_proofs(company_id: int) -> None:
        """Call external boycott API, create PENDING proofs."""
        from app import create_app
        app = create_app()
        with app.app_context():
            company = Company.query.get(company_id)
            if not company:
                return

            try:
                headers = {}
                if BOYCOTT_API_KEY:
                    headers["Authorization"] = f"Bearer {BOYCOTT_API_KEY}"

                params = {"q": company.name}
                resp = requests.get(
                    f"{BOYCOTT_API_BASE}/search",
                    params=params,
                    headers=headers,
                    timeout=10,
                )
                resp.raise_for_status()
            except Exception:
                # In a course project, you can log and silently fail
                return

            data = resp.json()
            results = data.get("results", [])  # adapt to real API schema

            for item in results[:5]:
                # Map external fields to your Proof model
                proof = Proof(
                    type=ProofType.ARTICLE,
                    source_url=item.get("url"),
                    description=item.get("summary") or item.get("title") or "External boycott evidence",
                    evidence_date=None,
                    weight=1.0,
                    status=ProofStatus.PENDING,
                    company_id=company.id,
                    created_by=1,  # system user or special "SYSTEM" account
                )
                db.session.add(proof)

            db.session.commit()
