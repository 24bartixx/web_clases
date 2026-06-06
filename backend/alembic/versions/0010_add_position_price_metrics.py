"""add position price metrics

Revision ID: 0010_position_price_metrics
Revises: 0009_remove_sim_current_balance
Create Date: 2026-06-06
"""

from alembic import op
import sqlalchemy as sa

revision = "0010_position_price_metrics"
down_revision = "0009_remove_sim_current_balance"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "positions",
        sa.Column("current_price", sa.Numeric(12, 2), nullable=True),
    )
    op.add_column(
        "positions",
        sa.Column("previous_price", sa.Numeric(12, 2), nullable=True),
    )
    op.add_column(
        "positions",
        sa.Column("price_change", sa.Numeric(12, 2), nullable=True),
    )
    op.add_column(
        "positions",
        sa.Column("price_change_percent", sa.Numeric(12, 4), nullable=True),
    )
    op.add_column(
        "positions",
        sa.Column("volume", sa.Numeric(20, 2), nullable=True),
    )


def downgrade():
    op.drop_column("positions", "volume")
    op.drop_column("positions", "price_change_percent")
    op.drop_column("positions", "price_change")
    op.drop_column("positions", "previous_price")
    op.drop_column("positions", "current_price")
