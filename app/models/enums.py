from enum import Enum

class ModerationStatus(str, Enum):
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'

class ProofType(str, Enum):
    ARTICLE = 'article'
    DONATION = 'donation'
    SOCIAL_POST = 'social_post'
    STATEMENT = 'statement'
