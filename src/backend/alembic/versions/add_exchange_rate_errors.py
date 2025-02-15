"""Add exchange rate errors table

Revision ID: add_exchange_rate_errors
Revises: 19f6330dc222
Create Date: 2024-03-21

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_exchange_rate_errors'
down_revision: Union[str, None] = '19f6330dc222'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'exchange_rate_errors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('source_currency', sa.String(), nullable=False),
        sa.Column('target_currency', sa.String(), nullable=False, server_default='EUR'),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('resolved', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('context', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('source_currency', 'target_currency', 'date', name='uix_exchange_rate_error')
    )
    
    # Add index for quick lookups of unresolved errors
    op.create_index(
        'ix_exchange_rate_errors_resolved',
        'exchange_rate_errors',
        ['resolved']
    )

def downgrade() -> None:
    op.drop_index('ix_exchange_rate_errors_resolved')
    op.drop_table('exchange_rate_errors') 