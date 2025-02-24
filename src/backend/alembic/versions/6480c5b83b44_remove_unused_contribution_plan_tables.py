"""remove_unused_contribution_plan_tables

Revision ID: 6480c5b83b44
Revises: 8859fb76f733
Create Date: 2025-02-24 12:49:23.384820

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from typing import Sequence, Union



# revision identifiers, used by Alembic.
revision: str = '6480c5b83b44'
down_revision: Union[str, None] = '8859fb76f733'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First verify tables are empty (safety check)
    conn = op.get_bind()
    for table in ['pension_etf_contribution_plan', 
                  'pension_insurance_contribution_plan', 
                  'pension_company_contribution_plan']:
        result = conn.execute(sa.text(f"SELECT COUNT(*) FROM {table}")).scalar()
        if result > 0:
            raise Exception(f"Table {table} is not empty. Please verify data before dropping.")

    # Drop tables
    op.drop_table('pension_etf_contribution_plan')
    op.drop_table('pension_insurance_contribution_plan')
    op.drop_table('pension_company_contribution_plan')


def downgrade() -> None:
    # Recreate tables if we need to roll back
    op.create_table('pension_etf_contribution_plan',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pension_etf_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=20, scale=2), nullable=False),
        sa.Column('note', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['pension_etf_id'], ['pension_etf.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('pension_insurance_contribution_plan',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pension_insurance_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=20, scale=2), nullable=False),
        sa.Column('note', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['pension_insurance_id'], ['pension_insurance.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('pension_company_contribution_plan',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pension_company_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=20, scale=2), nullable=False),
        sa.Column('note', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['pension_company_id'], ['pension_company.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
