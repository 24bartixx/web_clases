"""add is_admin to users

Revision ID: 0013_add_is_admin_to_users
Revises: 0012_replace_to_oauth_id_mail
Create Date: 2026-06-09
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# Identyfikatory migracji
revision: str = "0013_add_is_admin_to_users"
down_revision: Union[str, None] = "0012_replace_to_oauth_id_mail"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users", 
        sa.Column("is_admin", sa.Boolean(), server_default="false", nullable=False)
    )
    
    op.execute("UPDATE users SET is_admin = true WHERE email = 'kubszcz@gmail.com'")


def downgrade() -> None:
    op.drop_column("users", "is_admin")