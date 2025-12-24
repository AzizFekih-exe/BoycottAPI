from app.extensions import db
from datetime import datetime
from enum import Enum

class ProofType(str, Enum):
    ARTICLE = 'article'
    DONATION = 'donation'
    SOCIAL_POST = 'social_post'
    STATEMENT = 'statement'

class ProofStatus(str, Enum):
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'

class Proof(db.Model):
    __tablename__ = 'proofs'
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.Enum(ProofType), nullable=False)
    source_url = db.Column(db.String(1000), nullable=False)
    description = db.Column(db.Text, nullable=False)
    evidence_date = db.Column(db.Date)
    weight = db.Column(db.Float, default=1.0)  # Scoring multiplier
    status = db.Column(db.Enum(ProofStatus), default=ProofStatus.PENDING, index=True)
    
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    company = db.relationship('Company', back_populates='proofs')
    product = db.relationship('Product', back_populates='proofs')
    creator = db.relationship('User', back_populates='proofs')
