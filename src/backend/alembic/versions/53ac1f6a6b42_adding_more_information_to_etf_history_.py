"""Adding more information to ETF History (dividends, stock splits, capital gains)

Revision ID: 53ac1f6a6b42
Revises: 86948fc38cbb
Create Date: 2025-02-16 21:49:26.313934

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '53ac1f6a6b42'
down_revision: Union[str, None] = '86948fc38cbb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns for corporate actions
    op.add_column('etf_prices', sa.Column('dividends', sa.Numeric(20, 6), nullable=True))
    op.add_column('etf_prices', sa.Column('stock_splits', sa.Numeric(10, 6), nullable=True))
    op.add_column('etf_prices', sa.Column('capital_gains', sa.Numeric(20, 6), nullable=True))


def downgrade() -> None:
    # Remove the columns in reverse order
    op.drop_column('etf_prices', 'capital_gains')
    op.drop_column('etf_prices', 'stock_splits')
    op.drop_column('etf_prices', 'dividends')
