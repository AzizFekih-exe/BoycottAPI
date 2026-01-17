from app.extensions import db
from datetime import datetime
from enum import Enum
from app.models.enums import ModerationStatus

class BoycottStatus(str, Enum):
    BOYCOTT = 'BOYCOTT'
    NO_TANGIBLE_PROOF = 'NO_TANGIBLE_PROOF'

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    serial_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    category = db.Column(db.String(100), nullable=False, index=True)
    boycott_score = db.Column(db.Float, default=0.0)  # 0-100
    boycott_status = db.Column(db.Enum(BoycottStatus), default=BoycottStatus.NO_TANGIBLE_PROOF)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    status = db.Column(db.Enum(ModerationStatus), default=ModerationStatus.APPROVED, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    company = db.relationship('Company', back_populates='products')
    proofs = db.relationship('Proof', back_populates='product', lazy='dynamic')
    scan_history = db.relationship('ScanHistory', back_populates='product', lazy='dynamic', cascade='all, delete-orphan')
    
    def update_boycott_status(self):
        """Update product score and status based on company score"""
        from app.services.scoring_engine import ScoringEngine
        self.boycott_score = ScoringEngine.calculate_product_score(self)
        self.boycott_status = (
            BoycottStatus.BOYCOTT
            if self.boycott_score >= 50
            else BoycottStatus.NO_TANGIBLE_PROOF
        )