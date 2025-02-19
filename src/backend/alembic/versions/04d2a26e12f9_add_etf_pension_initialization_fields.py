"""add_etf_pension_initialization_fields

Revision ID: 04d2a26e12f9
Revises: 62c7edbdd403
Create Date: 2025-02-19 21:29:04.327521

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import NUMERIC


# revision identifiers, used by Alembic.
revision: str = '04d2a26e12f9'
down_revision: Union[str, None] = '62c7edbdd403'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add initialization fields to pension_etf table
    op.add_column('pension_etf', sa.Column('existing_units', NUMERIC(20, 6), nullable=True))
    op.add_column('pension_etf', sa.Column('reference_date', sa.Date(), nullable=True))


def downgrade() -> None:
    # Remove initialization fields from pension_etf table
    op.drop_column('pension_etf', 'reference_date')
    op.drop_column('pension_etf', 'existing_units')
