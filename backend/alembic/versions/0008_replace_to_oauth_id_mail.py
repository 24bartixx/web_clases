"""migracja na oauth id i email

Revision ID: 0008_replace_to_oauth_id_mail
Revises: 0007_add_simulation_current_date
Create Date: 2026-06-05
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0008_replace_to_oauth_id_mail"
down_revision: Union[str, None] = "0007_add_simulation_current_date"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email", sa.String(), nullable=True))
    op.add_column("users", sa.Column("oauth_id", sa.String(), nullable=True))
    
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_oauth_id"), "users", ["oauth_id"], unique=True)

    op.execute("UPDATE users SET oauth_id = 'GOOGLE_' || google_id WHERE google_id IS NOT NULL")
    op.execute("UPDATE users SET email = oauth_id || '@placeholder.com' WHERE email IS NULL")
    op.alter_column("users", "email", nullable=False)
    op.drop_constraint("users_google_id_key", "users", type_="unique")
    op.drop_column("users", "google_id")


def downgrade() -> None:
    op.add_column("users", sa.Column("google_id", sa.String(), nullable=True))
    op.create_unique_constraint("users_google_id_key", "users", ["google_id"])
    
    op.execute("UPDATE users SET google_id = REPLACE(oauth_id, 'GOOGLE_', '') WHERE oauth_id LIKE 'GOOGLE_%'")
    op.drop_index(op.f("ix_users_oauth_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_column("users", "oauth_id")
    op.drop_column("users", "email")