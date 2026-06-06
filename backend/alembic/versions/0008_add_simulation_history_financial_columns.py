"""add simulation history financial columns

Revision ID: 0008_sim_history_financials
Revises: 0007_add_simulation_current_date
Create Date: 2026-06-05
"""

from alembic import op
import sqlalchemy as sa

revision = "0008_sim_history_financials"
down_revision = "0007_add_simulation_current_date"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "simulation_history",
        sa.Column(
            "profit_loss",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "simulation_history",
        sa.Column(
            "available_funds",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )


def downgrade():
    op.drop_column("simulation_history", "available_funds")
    op.drop_column("simulation_history", "profit_loss")
