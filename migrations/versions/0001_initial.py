from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # USERS
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("oauth_provider", sa.String(length=50)),
        sa.Column("oauth_subject", sa.String(length=255)),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    # COMPANIES
    op.create_table(
        "companies",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False, unique=True),
        sa.Column("website", sa.String(length=255)),
        sa.Column("country", sa.String(length=100)),
        sa.Column("risk_score", sa.Float, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    # PRODUCTS
    op.create_table(
        "products",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("serial_number", sa.String(length=255), nullable=False, unique=True),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("boycott_score", sa.Float, nullable=False, server_default="0"),
        sa.Column("boycott_status", sa.String(length=50), nullable=False),
        sa.Column("company_id", sa.Integer, sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    # PROOFS
    op.create_table(
        "proofs",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("company_id", sa.Integer, sa.ForeignKey("companies.id")),
        sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id")),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("source_url", sa.String(length=500)),
        sa.Column("weight", sa.Integer, nullable=False, server_default="1"),
        sa.Column("evidence_date", sa.Date),
        sa.Column("created_by", sa.Integer, sa.ForeignKey("users.id")),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    # SCAN HISTORY
    op.create_table(
        "scan_history",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id"), nullable=False),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id")),
        sa.Column("returned_score", sa.Float, nullable=False),
        sa.Column("returned_status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )


def downgrade():
    op.drop_table("scan_history")
    op.drop_table("proofs")
    op.drop_table("products")
    op.drop_table("companies")
    op.drop_table("users")
