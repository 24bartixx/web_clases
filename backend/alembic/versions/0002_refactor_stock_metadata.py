"""refactor stock metadata

Revision ID: 0002_refactor_stock_metadata
Revises: 0001_create_initial_schema
Create Date: 2026-05-17
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_refactor_stock_metadata"
down_revision = "0001_create_initial_schema"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("stocks", sa.Column("description", sa.Text()))
    op.add_column("stocks", sa.Column("sector", sa.String(length=120)))
    op.add_column("stocks", sa.Column("industry", sa.String(length=120)))
    op.add_column("stocks", sa.Column("country", sa.String(length=80)))
    op.add_column("stocks", sa.Column("currency", sa.String(length=10)))
    op.add_column("stocks", sa.Column("website", sa.String(length=512)))
    op.drop_column("stocks", "sector_id")
    op.drop_table("sectors")


def downgrade():
    op.create_table(
        "sectors",
        sa.Column("sector_id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=60)),
    )
    op.add_column("stocks", sa.Column("sector_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_stocks_sector_id_sectors",
        "stocks",
        "sectors",
        ["sector_id"],
        ["sector_id"],
        deferrable=True,
        initially="IMMEDIATE",
    )
    op.drop_column("stocks", "website")
    op.drop_column("stocks", "currency")
    op.drop_column("stocks", "country")
    op.drop_column("stocks", "industry")
    op.drop_column("stocks", "sector")
    op.drop_column("stocks", "description")
