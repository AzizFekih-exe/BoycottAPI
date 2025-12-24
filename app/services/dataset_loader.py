# app/services/dataset_loader.py
from pathlib import Path
import csv
from app.extensions import db
from app.models.company import Company
from app.models.product import Product
from app.models.proof import Proof, ProofType, ProofStatus
from app.services.scoring_engine import ScoringEngine

DATA_PATH = Path(__file__).resolve().parent.parent / "external_data" / "brands.csv"

class DatasetLoader:
    @staticmethod
    def import_companies_and_products():
        rows = 0
        created_companies = 0
        created_products = 0

        with open(DATA_PATH, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows += 1

                brand_name = row.get("name")
                description = row.get("description") or "Imported boycott evidence from dataset"
                website = row.get("website") or None
                category = (row.get("categories") or "UNKNOWN").split(",")[0].strip()
                status = row.get("status")  # e.g. avoid/support
                reasons = row.get("reasons")  # e.g. operations_in_israel, operations_in_settlements

                if not brand_name:
                    continue

                # Treat brand as company name for now
                company_name = brand_name

                company = Company.query.filter_by(name=company_name).first()
                if not company:
                    company = Company(
                        name=company_name,
                        country=None,
                        website=website,
                    )
                    db.session.add(company)
                    db.session.flush()
                    created_companies += 1

                product = Product.query.filter_by(
                    name=brand_name, company_id=company.id
                ).first()
                if not product:
                    product = Product(
                        name=brand_name,
                        serial_number=f"EXT-{company.id}-{brand_name[:8]}",
                        category=category or "UNKNOWN",
                        company_id=company.id,
                    )
                    db.session.add(product)
                    created_products += 1

                proof_text = f"{description}\n\nStatus: {status}, Reasons: {reasons}"

                # 🔹 Avoid inserting duplicate proofs for the same company + source + description
                existing = Proof.query.filter_by(
                    company_id=company.id,
                    source_url="https://github.com/TechForPalestine/boycott-israeli-consumer-goods-dataset",
                    description=proof_text,
                ).first()

                if not existing:
                    proof = Proof(
                        type=ProofType.ARTICLE,
                        source_url="https://github.com/TechForPalestine/boycott-israeli-consumer-goods-dataset",
                        description=proof_text,
                        weight=2.0,
                        status=ProofStatus.APPROVED,
                        company_id=company.id,
                        created_by=1,
                    )
                    db.session.add(proof)


        db.session.commit()
        print("Processed rows:", rows)
        print("Created companies:", created_companies)
        print("Created products:", created_products)
        
        for company in Company.query.all():
            company.calculate_risk_score()
            for product in company.products:
                product.update_boycott_status()
        db.session.commit()
