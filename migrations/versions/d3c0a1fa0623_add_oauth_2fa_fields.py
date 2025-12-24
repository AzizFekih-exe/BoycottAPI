from alembic import op
import sqlalchemy as sa

revision = "d3c0a1fa0623"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("totp_secret", sa.String(length=32), nullable=True))
        batch_op.add_column(
            sa.Column(
                "is_2fa_enabled",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            )
        )


def downgrade():
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("is_2fa_enabled")
        batch_op.drop_column("totp_secret")
