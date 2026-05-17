"""create initial schema

Revision ID: 0001_create_initial_schema
Revises:
Create Date: 2026-05-17
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_create_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    round_type = postgresql.ENUM(
        "second",
        "minute",
        "hour",
        "four_hours",
        "day",
        "week",
        "month",
        "year",
        name="round_type",
        create_type=False,
    )
    transaction_type = postgresql.ENUM(
        "buy", "sell", name="transaction_type", create_type=False
    )
    stock_data_interval = postgresql.ENUM(
        "daily",
        "weekly",
        "monthly",
        name="stock_data_interval",
        create_type=False,
    )

    bind = op.get_bind()
    round_type.create(bind, checkfirst=True)
    transaction_type.create(bind, checkfirst=True)
    stock_data_interval.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("user_id", sa.Integer(), primary_key=True),
        sa.Column("google_id", sa.String(), unique=True),
        sa.Column("first_name", sa.String(length=255), nullable=False),
        sa.Column("last_name", sa.String(length=255), nullable=False),
        sa.Column("picture", sa.String()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "sectors",
        sa.Column("sector_id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=60)),
    )

    op.create_table(
        "simulations",
        sa.Column("simulation_id", sa.Integer(), primary_key=True),
        sa.Column("initial_balance", sa.Numeric(12, 2), nullable=False),
        sa.Column("current_balance", sa.Numeric(12, 2), nullable=False),
        sa.Column("start_date", sa.DateTime(), nullable=False),
        sa.Column("finish_date", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("has_rounds", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("round_type", round_type),
        sa.Column("round_value", sa.Integer()),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("finished_at", sa.DateTime()),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.user_id"],
            deferrable=True,
            initially="IMMEDIATE",
        ),
    )

    op.create_table(
        "stocks",
        sa.Column("stock_id", sa.Integer(), primary_key=True),
        sa.Column("ticker", sa.String(length=10), nullable=False, unique=True),
        sa.Column("company_name", sa.String(length=255)),
        sa.Column("sector_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["sector_id"],
            ["sectors.sector_id"],
            deferrable=True,
            initially="IMMEDIATE",
        ),
    )

    op.create_table(
        "stock_prices",
        sa.Column("stock_prices_id", sa.Integer(), primary_key=True),
        sa.Column("interval", stock_data_interval, nullable=False),
        sa.Column("open", sa.Numeric(12, 2), nullable=False),
        sa.Column("high", sa.Numeric(12, 2), nullable=False),
        sa.Column("low", sa.Numeric(12, 2), nullable=False),
        sa.Column("close", sa.Numeric(12, 2), nullable=False),
        sa.Column("volume", sa.Numeric(12, 2), nullable=False),
        sa.Column("dividend_amount", sa.Numeric(12, 2)),
        sa.Column("price_date", sa.DateTime(), nullable=False),
        sa.Column("stock_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["stock_id"],
            ["stocks.stock_id"],
            deferrable=True,
            initially="IMMEDIATE",
        ),
    )

    op.create_table(
        "positions",
        sa.Column("position_id", sa.Integer(), primary_key=True),
        sa.Column("simulation_id", sa.Integer(), nullable=False),
        sa.Column("stock_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(
            ["simulation_id"],
            ["simulations.simulation_id"],
            deferrable=True,
            initially="IMMEDIATE",
        ),
        sa.ForeignKeyConstraint(
            ["stock_id"],
            ["stocks.stock_id"],
            deferrable=True,
            initially="IMMEDIATE",
        ),
    )

    op.create_table(
        "transactions",
        sa.Column("transaction_id", sa.Integer(), primary_key=True),
        sa.Column("transaction_time", sa.DateTime(), nullable=False),
        sa.Column("transaction_type", transaction_type, nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("stock_id", sa.Integer(), nullable=False),
        sa.Column("simulation_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(
            ["stock_id"],
            ["stocks.stock_id"],
            deferrable=True,
            initially="IMMEDIATE",
        ),
        sa.ForeignKeyConstraint(
            ["simulation_id"],
            ["simulations.simulation_id"],
            deferrable=True,
            initially="IMMEDIATE",
        ),
    )

    op.create_table(
        "simulation_history",
        sa.Column("history_id", sa.Integer(), primary_key=True),
        sa.Column("simulation_id", sa.Integer(), nullable=False),
        sa.Column("balance", sa.Numeric(12, 2), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(
            ["simulation_id"],
            ["simulations.simulation_id"],
            deferrable=True,
            initially="IMMEDIATE",
        ),
    )

    op.create_table(
        "summaries",
        sa.Column("summary_id", sa.Integer(), primary_key=True),
        sa.Column("income", sa.Numeric(12, 0), nullable=False),
        sa.Column("transactions", sa.Integer(), nullable=False),
        sa.Column("final_balance", sa.Numeric(12, 2), nullable=False),
        sa.Column("stock_id", sa.Integer()),
        sa.Column("simulation_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(
            ["stock_id"],
            ["stocks.stock_id"],
            deferrable=True,
            initially="IMMEDIATE",
        ),
        sa.ForeignKeyConstraint(
            ["simulation_id"],
            ["simulations.simulation_id"],
            deferrable=True,
            initially="IMMEDIATE",
        ),
    )


def downgrade():
    op.drop_table("summaries")
    op.drop_table("simulation_history")
    op.drop_table("transactions")
    op.drop_table("positions")
    op.drop_table("stock_prices")
    op.drop_table("stocks")
    op.drop_table("simulations")
    op.drop_table("sectors")
    op.drop_table("users")

    bind = op.get_bind()
    sa.Enum(name="stock_data_interval").drop(bind, checkfirst=True)
    sa.Enum(name="transaction_type").drop(bind, checkfirst=True)
    sa.Enum(name="round_type").drop(bind, checkfirst=True)
