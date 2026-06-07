"""add simulation name

Revision ID: 0011_simulation_name
Revises: 0010_position_price_metrics
Create Date: 2026-06-07
"""

from alembic import op
import sqlalchemy as sa

revision = "0011_simulation_name"
down_revision = "0010_position_price_metrics"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "simulations",
        sa.Column("simulation_name", sa.String(length=255), nullable=True),
    )
    op.execute(
        """
        UPDATE simulations
        SET simulation_name = 'Simulation #' || simulation_id
        WHERE simulation_name IS NULL
        """
    )
    op.alter_column("simulations", "simulation_name", nullable=False)


def downgrade():
    op.drop_column("simulations", "simulation_name")
