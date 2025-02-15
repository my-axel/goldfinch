"""Modifying ETFPension for total units

Revision ID: 19f6330dc222
Revises: a625067e65c9
Create Date: 2025-02-15 22:43:08.322257

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from decimal import Decimal

# revision identifiers, used by Alembic.
revision: str = '19f6330dc222'
down_revision: Union[str, None] = 'a625067e65c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # First add the column as nullable
    op.add_column('etf_pensions', sa.Column('total_units', sa.Numeric(precision=20, scale=6), nullable=True))
    
    # Update existing rows to have total_units = 0
    op.execute("UPDATE etf_pensions SET total_units = 0")
    
    # Now make it not nullable
    op.alter_column('etf_pensions', 'total_units',
                    existing_type=sa.Numeric(precision=20, scale=6),
                    nullable=False,
                    server_default=sa.text('0'))

def downgrade() -> None:
    op.drop_column('etf_pensions', 'total_units')
