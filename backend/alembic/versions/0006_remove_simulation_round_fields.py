"""remove simulation round fields

Revision ID: 0006_remove_sim_round_fields
Revises: 0005_drop_stock_prices
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0006_remove_sim_round_fields"
down_revision = "0005_drop_stock_prices"
branch_labels = None
depends_on = None


ROUND_TYPE_VALUES = (
    "second",
    "minute",
    "hour",
    "four_hours",
    "day",
    "week",
    "month",
    "year",
)


def upgrade():
    op.drop_column("simulations", "round_value")
    op.drop_column("simulations", "round_type")
    op.drop_column("simulations", "has_rounds")

    bind = op.get_bind()
    sa.Enum(name="round_type").drop(bind, checkfirst=True)


def downgrade():
    round_type = postgresql.ENUM(
        *ROUND_TYPE_VALUES,
        name="round_type",
        create_type=False,
    )
    round_type.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "simulations",
        sa.Column(
            "has_rounds",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column("simulations", sa.Column("round_type", round_type))
    op.add_column("simulations", sa.Column("round_value", sa.Integer()))
