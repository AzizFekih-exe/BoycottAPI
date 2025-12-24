from app.extensions import db
from datetime import datetime

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    country = db.Column(db.String(100))
    website = db.Column(db.String(500))
    risk_score = db.Column(db.Float, default=0.0)  # 0-100
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    products = db.relationship('Product', back_populates='company', lazy='dynamic', cascade='all, delete-orphan')
    proofs = db.relationship('Proof', back_populates='company', lazy='dynamic', cascade='all, delete-orphan')
    
    def calculate_risk_score(self):
        """Calculate risk score based on approved proofs"""
        from app.services.scoring_engine import ScoringEngine
        self.risk_score = ScoringEngine.calculate_company_score(self)
        return self.risk_score
