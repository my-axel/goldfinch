"""Add retirement age fields to household members

Revision ID: f8fddb65aaad
Revises: 3b4c63be367d
Create Date: 2025-02-13 13:06:07.532213

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f8fddb65aaad'
down_revision: Union[str, None] = '3b4c63be367d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # First add the columns as nullable
    op.add_column('household_members', sa.Column('retirement_age_planned', sa.Integer(), nullable=True))
    op.add_column('household_members', sa.Column('retirement_age_possible', sa.Integer(), nullable=True))
    
    # Update existing rows with default values
    op.execute("UPDATE household_members SET retirement_age_planned = 67 WHERE retirement_age_planned IS NULL")
    op.execute("UPDATE household_members SET retirement_age_possible = 62 WHERE retirement_age_possible IS NULL")
    
    # Now make the columns non-nullable
    op.alter_column('household_members', 'retirement_age_planned',
                    existing_type=sa.Integer(),
                    nullable=False)
    op.alter_column('household_members', 'retirement_age_possible',
                    existing_type=sa.Integer(),
                    nullable=False)

def downgrade() -> None:
    op.drop_column('household_members', 'retirement_age_possible')
    op.drop_column('household_members', 'retirement_age_planned')
