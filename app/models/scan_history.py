from app.extensions import db
from datetime import datetime

class ScanHistory(db.Model):
    __tablename__ = 'scan_history'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Anonymous allowed
    scanned_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    returned_score = db.Column(db.Float)
    returned_status = db.Column(db.String(50))
    
    # Relationships
    product = db.relationship('Product', back_populates='scan_history')
    user = db.relationship('User', back_populates='scan_history')
