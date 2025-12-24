from app.extensions import db
from datetime import datetime
from enum import Enum
from app.extensions import db


class UserRole(str, Enum):
    CONSUMER = 'CONSUMER'
    CONTRIBUTOR = 'CONTRIBUTOR'
    MODERATOR = 'MODERATOR'
    ADMIN = 'ADMIN'

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    display_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.Enum(UserRole), default=UserRole.CONSUMER, nullable=False)
    oauth_provider = db.Column(db.String(50), nullable=True)
    oauth_subject = db.Column(db.String(255), nullable=True)
    totp_secret = db.Column(db.String(32), nullable=True)
    is_2fa_enabled = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    proofs = db.relationship('Proof', back_populates='creator', lazy='dynamic')
    scan_history = db.relationship('ScanHistory', back_populates='user', lazy='dynamic')
    
    def has_role(self, *roles):
        return self.role in roles
