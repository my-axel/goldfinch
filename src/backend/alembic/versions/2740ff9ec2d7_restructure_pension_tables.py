"""restructure_pension_tables

Revision ID: 2740ff9ec2d7
Revises: e84ae794aeb6
Create Date: 2025-02-17 12:59:43.516383

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import NUMERIC


# revision identifiers, used by Alembic.
revision: str = '2740ff9ec2d7'
down_revision: Union[str, None] = 'e84ae794aeb6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop old tables (no data migration needed)
    op.drop_table('contribution_steps')
    op.drop_table('etf_allocations')
    op.drop_table('pension_contributions')
    op.drop_table('etf_pensions')
    op.drop_table('insurance_pensions')
    op.drop_table('company_pensions')
    op.drop_table('pensions')

    # Create ETF pension tables
    op.create_table(
        'pension_etf',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('member_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('current_value', NUMERIC(20, 2), nullable=False, server_default='0'),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('etf_id', sa.String(), nullable=False),
        sa.Column('total_units', NUMERIC(20, 6), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['member_id'], ['household_members.id'], ),
        sa.ForeignKeyConstraint(['etf_id'], ['etfs.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'pension_etf_contribution_plan_steps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pension_etf_id', sa.Integer(), nullable=False),
        sa.Column('amount', NUMERIC(20, 2), nullable=False),
        sa.Column('frequency', sa.String(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['pension_etf_id'], ['pension_etf.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'pension_etf_contribution_plan',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pension_etf_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('amount', NUMERIC(20, 2), nullable=False),
        sa.Column('note', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['pension_etf_id'], ['pension_etf.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'pension_etf_contribution_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pension_etf_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('amount', NUMERIC(20, 2), nullable=False),
        sa.Column('is_manual', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('note', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['pension_etf_id'], ['pension_etf.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'pension_etf_allocation_plan',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pension_etf_contribution_plan_id', sa.Integer(), nullable=False),
        sa.Column('etf_id', sa.String(), nullable=False),
        sa.Column('amount', NUMERIC(20, 2), nullable=False),
        sa.Column('percentage', NUMERIC(5, 2), nullable=False),
        sa.ForeignKeyConstraint(['pension_etf_contribution_plan_id'], ['pension_etf_contribution_plan.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['etf_id'], ['etfs.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'pension_etf_allocation_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pension_etf_contribution_history_id', sa.Integer(), nullable=False),
        sa.Column('etf_id', sa.String(), nullable=False),
        sa.Column('amount', NUMERIC(20, 2), nullable=False),
        sa.Column('units', NUMERIC(20, 6), nullable=False),
        sa.Column('price_per_unit', NUMERIC(20, 6), nullable=False),
        sa.Column('percentage', NUMERIC(5, 2), nullable=False),
        sa.ForeignKeyConstraint(['pension_etf_contribution_history_id'], ['pension_etf_contribution_history.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['etf_id'], ['etfs.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create Insurance pension tables
    op.create_table(
        'pension_insurance',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('member_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('current_value', NUMERIC(20, 2), nullable=False, server_default='0'),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('contract_number', sa.String(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('guaranteed_interest', NUMERIC(10, 4), nullable=False),
        sa.Column('expected_return', NUMERIC(10, 4), nullable=False),
        sa.ForeignKeyConstraint(['member_id'], ['household_members.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'pension_insurance_contribution_plan_steps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pension_insurance_id', sa.Integer(), nullable=False),
        sa.Column('amount', NUMERIC(20, 2), nullable=False),
        sa.Column('frequency', sa.String(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['pension_insurance_id'], ['pension_insurance.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'pension_insurance_contribution_plan',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pension_insurance_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('amount', NUMERIC(20, 2), nullable=False),
        sa.Column('note', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['pension_insurance_id'], ['pension_insurance.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'pension_insurance_contribution_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pension_insurance_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('amount', NUMERIC(20, 2), nullable=False),
        sa.Column('is_manual', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('note', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['pension_insurance_id'], ['pension_insurance.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create Company pension tables
    op.create_table(
        'pension_company',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('member_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('current_value', NUMERIC(20, 2), nullable=False, server_default='0'),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('employer', sa.String(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('vesting_period', sa.Integer(), nullable=False),
        sa.Column('matching_percentage', NUMERIC(10, 4), nullable=True),
        sa.Column('max_employer_contribution', NUMERIC(20, 2), nullable=True),
        sa.ForeignKeyConstraint(['member_id'], ['household_members.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'pension_company_contribution_plan_steps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pension_company_id', sa.Integer(), nullable=False),
        sa.Column('amount', NUMERIC(20, 2), nullable=False),
        sa.Column('frequency', sa.String(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['pension_company_id'], ['pension_company.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'pension_company_contribution_plan',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pension_company_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('employee_amount', NUMERIC(20, 2), nullable=False),
        sa.Column('employer_amount', NUMERIC(20, 2), nullable=False),
        sa.Column('note', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['pension_company_id'], ['pension_company.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'pension_company_contribution_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pension_company_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('employee_amount', NUMERIC(20, 2), nullable=False),
        sa.Column('employer_amount', NUMERIC(20, 2), nullable=False),
        sa.Column('is_manual', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('note', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['pension_company_id'], ['pension_company.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indices
    op.create_index('idx_pension_etf_member', 'pension_etf', ['member_id'])
    op.create_index('idx_pension_etf_etf', 'pension_etf', ['etf_id'])
    op.create_index('idx_pension_insurance_member', 'pension_insurance', ['member_id'])
    op.create_index('idx_pension_company_member', 'pension_company', ['member_id'])
    op.create_index('idx_pension_company_employer', 'pension_company', ['employer'])



def downgrade() -> None:
    # Drop all new tables in reverse order
    op.drop_table('pension_company_contribution_history')
    op.drop_table('pension_company_contribution_plan')
    op.drop_table('pension_company_contribution_plan_steps')
    op.drop_table('pension_company')
    
    op.drop_table('pension_insurance_contribution_history')
    op.drop_table('pension_insurance_contribution_plan')
    op.drop_table('pension_insurance_contribution_plan_steps')
    op.drop_table('pension_insurance')
    
    op.drop_table('pension_etf_allocation_history')
    op.drop_table('pension_etf_allocation_plan')
    op.drop_table('pension_etf_contribution_history')
    op.drop_table('pension_etf_contribution_plan')
    op.drop_table('pension_etf_contribution_plan_steps')
    op.drop_table('pension_etf') 