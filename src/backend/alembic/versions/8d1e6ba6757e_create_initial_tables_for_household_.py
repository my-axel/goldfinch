"""Create initial tables for Household, Pension, ETFs

Revision ID: 8d1e6ba6757e
Revises: 
Create Date: 2025-02-13 21:28:01.681000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d1e6ba6757e'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('etfs',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('symbol', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('ter', sa.Float(), nullable=False),
    sa.Column('distribution_policy', sa.String(), nullable=False),
    sa.Column('replication_method', sa.String(), nullable=False),
    sa.Column('fund_size', sa.Float(), nullable=False),
    sa.Column('currency', sa.String(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('provider', sa.String(), nullable=False),
    sa.Column('inception_date', sa.Date(), nullable=False),
    sa.Column('domicile', sa.String(), nullable=False),
    sa.Column('extra_data', sa.JSON(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('household_members',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('first_name', sa.String(), nullable=False),
    sa.Column('last_name', sa.String(), nullable=False),
    sa.Column('birthday', sa.Date(), nullable=False),
    sa.Column('retirement_age_planned', sa.Integer(), nullable=False),
    sa.Column('retirement_age_possible', sa.Integer(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_household_members_id'), 'household_members', ['id'], unique=False)
    op.create_table('etf_prices',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('etf_id', sa.String(), nullable=False),
    sa.Column('date', sa.Date(), nullable=False),
    sa.Column('price', sa.Float(), nullable=False),
    sa.Column('currency', sa.String(), nullable=False),
    sa.ForeignKeyConstraint(['etf_id'], ['etfs.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('pensions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('type', sa.Enum('ETF_PLAN', 'INSURANCE', 'COMPANY', 'GOVERNMENT', 'OTHER', name='pensiontype'), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('member_id', sa.Integer(), nullable=False),
    sa.Column('start_date', sa.Date(), nullable=False),
    sa.Column('initial_capital', sa.Float(), nullable=False),
    sa.Column('current_value', sa.Float(), nullable=False),
    sa.Column('notes', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['member_id'], ['household_members.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pensions_id'), 'pensions', ['id'], unique=False)
    op.create_table('company_pensions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('employer', sa.String(), nullable=False),
    sa.Column('vesting_period', sa.Integer(), nullable=False),
    sa.Column('matching_percentage', sa.Float(), nullable=True),
    sa.Column('max_employer_contribution', sa.Float(), nullable=True),
    sa.ForeignKeyConstraint(['id'], ['pensions.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('etf_pensions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('etf_id', sa.String(), nullable=False),
    sa.ForeignKeyConstraint(['etf_id'], ['etfs.id'], ),
    sa.ForeignKeyConstraint(['id'], ['pensions.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('insurance_pensions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('provider', sa.String(), nullable=False),
    sa.Column('contract_number', sa.String(), nullable=False),
    sa.Column('guaranteed_interest', sa.Float(), nullable=False),
    sa.Column('expected_return', sa.Float(), nullable=False),
    sa.ForeignKeyConstraint(['id'], ['pensions.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('pension_contributions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('pension_id', sa.Integer(), nullable=False),
    sa.Column('date', sa.Date(), nullable=False),
    sa.Column('amount', sa.Float(), nullable=False),
    sa.Column('planned_amount', sa.Float(), nullable=False),
    sa.Column('is_manual_override', sa.Boolean(), nullable=True),
    sa.Column('note', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['pension_id'], ['pensions.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pension_contributions_id'), 'pension_contributions', ['id'], unique=False)
    op.create_table('etf_allocations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('contribution_id', sa.Integer(), nullable=False),
    sa.Column('etf_id', sa.String(), nullable=False),
    sa.Column('amount', sa.Float(), nullable=False),
    sa.Column('units_bought', sa.Float(), nullable=False),
    sa.ForeignKeyConstraint(['contribution_id'], ['pension_contributions.id'], ),
    sa.ForeignKeyConstraint(['etf_id'], ['etfs.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_etf_allocations_id'), 'etf_allocations', ['id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_etf_allocations_id'), table_name='etf_allocations')
    op.drop_table('etf_allocations')
    op.drop_index(op.f('ix_pension_contributions_id'), table_name='pension_contributions')
    op.drop_table('pension_contributions')
    op.drop_table('insurance_pensions')
    op.drop_table('etf_pensions')
    op.drop_table('company_pensions')
    op.drop_index(op.f('ix_pensions_id'), table_name='pensions')
    op.drop_table('pensions')
    op.drop_table('etf_prices')
    op.drop_index(op.f('ix_household_members_id'), table_name='household_members')
    op.drop_table('household_members')
    op.drop_table('etfs')
    # ### end Alembic commands ###
