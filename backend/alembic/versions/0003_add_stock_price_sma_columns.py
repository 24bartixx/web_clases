"""add stock price sma columns

Revision ID: 0003_add_stock_price_sma_columns
Revises: 0002_refactor_stock_metadata
Create Date: 2026-05-17
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_add_stock_price_sma_columns"
down_revision = "0002_refactor_stock_metadata"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "stock_prices",
        sa.Column(
            "sma20",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "stock_prices",
        sa.Column(
            "sma50",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "stock_prices",
        sa.Column(
            "sma200",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )
    op.alter_column("stock_prices", "sma20", server_default=None)
    op.alter_column("stock_prices", "sma50", server_default=None)
    op.alter_column("stock_prices", "sma200", server_default=None)


def downgrade():
    op.drop_column("stock_prices", "sma200")
    op.drop_column("stock_prices", "sma50")
    op.drop_column("stock_prices", "sma20")
