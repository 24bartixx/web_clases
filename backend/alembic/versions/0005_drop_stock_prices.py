"""drop stock prices table

Revision ID: 0005_drop_stock_prices
Revises: 0004_remove_stock_price_sma
Create Date: 2026-05-19
"""

from alembic import op
import sqlalchemy as sa

revision = "0005_drop_stock_prices"
down_revision = "0004_remove_stock_price_sma"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table("stock_prices")
    op.drop_column("stocks", "website")
    op.drop_column("stocks", "currency")
    op.drop_column("stocks", "country")
    op.drop_column("stocks", "description")


def downgrade():
    stock_data_interval = sa.Enum(
        "daily",
        "weekly",
        "monthly",
        name="stock_data_interval",
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
    op.add_column("stocks", sa.Column("description", sa.Text()))
    op.add_column("stocks", sa.Column("country", sa.String(length=80)))
    op.add_column("stocks", sa.Column("currency", sa.String(length=10)))
    op.add_column("stocks", sa.Column("website", sa.String(length=512)))
