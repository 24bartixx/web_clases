"""remove simulation current balance

Revision ID: 0009_remove_sim_current_balance
Revises: 0008_sim_history_financials
Create Date: 2026-06-06
"""

from alembic import op
import sqlalchemy as sa

revision = "0009_remove_sim_current_balance"
down_revision = "0008_sim_history_financials"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        INSERT INTO simulation_history (
            simulation_id,
            balance,
            profit_loss,
            available_funds,
            timestamp
        )
        SELECT
            simulation_id,
            current_balance,
            current_balance - initial_balance,
            current_balance,
            current_date
        FROM simulations
        WHERE NOT EXISTS (
            SELECT 1
            FROM simulation_history
            WHERE simulation_history.simulation_id = simulations.simulation_id
        )
        """
    )
    op.drop_column("simulations", "current_balance")


def downgrade():
    op.add_column(
        "simulations",
        sa.Column(
            "current_balance",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )
    op.execute(
        """
        UPDATE simulations
        SET current_balance = latest_history.balance
        FROM (
            SELECT DISTINCT ON (simulation_id)
                simulation_id,
                balance
            FROM simulation_history
            ORDER BY simulation_id, timestamp DESC, history_id DESC
        ) AS latest_history
        WHERE latest_history.simulation_id = simulations.simulation_id
        """
    )
    op.alter_column("simulations", "current_balance", server_default=None)
