"""add_pension_status_management

Revision ID: 5aff8326ecec
Revises: 5e75fadd3095
Create Date: 2025-02-24 09:54:11.069473

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '5aff8326ecec'
down_revision: Union[str, None] = '5e75fadd3095'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the enum type
    pensionstatus = postgresql.ENUM('ACTIVE', 'PAUSED', name='pensionstatus')
    pensionstatus.create(op.get_bind(), checkfirst=True)

    # Add new columns
    op.add_column('pension_etf', sa.Column('status', sa.Enum('ACTIVE', 'PAUSED', name='pensionstatus'), nullable=False, server_default='ACTIVE'))
    op.add_column('pension_etf', sa.Column('paused_at', sa.Date(), nullable=True))
    op.add_column('pension_etf', sa.Column('resume_at', sa.Date(), nullable=True))


def downgrade() -> None:
    # Drop columns
    op.drop_column('pension_etf', 'resume_at')
    op.drop_column('pension_etf', 'paused_at')
    op.drop_column('pension_etf', 'status')

    # Drop the enum type
    pensionstatus = postgresql.ENUM('ACTIVE', 'PAUSED', name='pensionstatus')
    pensionstatus.drop(op.get_bind())
