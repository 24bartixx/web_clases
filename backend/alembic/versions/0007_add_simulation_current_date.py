"""add simulation current date

Revision ID: 0007_add_simulation_current_date
Revises: 0006_remove_sim_round_fields
Create Date: 2026-05-28
"""

from alembic import op
import sqlalchemy as sa

revision = "0007_add_simulation_current_date"
down_revision = "0006_remove_sim_round_fields"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("simulations", sa.Column("current_date", sa.DateTime()))
    op.execute('UPDATE simulations SET "current_date" = start_date')
    op.alter_column("simulations", "current_date", nullable=False)


def downgrade():
    op.drop_column("simulations", "current_date")
