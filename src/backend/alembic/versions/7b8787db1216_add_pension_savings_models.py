"""add_pension_savings_models

Revision ID: 7b8787db1216
Revises: 1e16863cb793
Create Date: 2025-03-31 17:06:13.432180

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '7b8787db1216'
down_revision: Union[str, None] = '1e16863cb793'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create CompoundingFrequency enum type
    op.execute("CREATE TYPE compoundingfrequency AS ENUM ('DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY')")
    
    # Skip creation of the enum since it already exists - use it directly in the table
    op.create_table('pension_savings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('member_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('start_date', sa.Date(), nullable=False),
    sa.Column('notes', sa.String(), nullable=True),
    sa.Column('pessimistic_rate', sa.Numeric(precision=4, scale=2), nullable=False, server_default='1.0'),
    sa.Column('realistic_rate', sa.Numeric(precision=4, scale=2), nullable=False, server_default='2.0'),
    sa.Column('optimistic_rate', sa.Numeric(precision=4, scale=2), nullable=False, server_default='3.0'),
    sa.Column('compounding_frequency', postgresql.ENUM('DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', name='compoundingfrequency', create_type=False), nullable=False, server_default='ANNUALLY'),
    sa.Column('status', postgresql.ENUM('ACTIVE', 'PAUSED', name='pensionstatus', create_type=False), nullable=False, server_default='ACTIVE'),
    sa.Column('paused_at', sa.Date(), nullable=True),
    sa.Column('resume_at', sa.Date(), nullable=True),
    sa.ForeignKeyConstraint(['member_id'], ['household_members.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pension_savings_id'), 'pension_savings', ['id'], unique=False)
    op.create_index(op.f('ix_pension_savings_member_id'), 'pension_savings', ['member_id'], unique=False)
    op.create_table('pension_savings_contribution_plan_steps',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('pension_savings_id', sa.Integer(), nullable=False),
    sa.Column('amount', sa.Numeric(precision=20, scale=2), nullable=False),
    sa.Column('frequency', postgresql.ENUM('MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY', 'ONE_TIME', name='contributionfrequency', create_type=False), nullable=False),
    sa.Column('start_date', sa.Date(), nullable=False),
    sa.Column('end_date', sa.Date(), nullable=True),
    sa.Column('note', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['pension_savings_id'], ['pension_savings.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pension_savings_contribution_plan_steps_id'), 'pension_savings_contribution_plan_steps', ['id'], unique=False)
    op.create_index(op.f('ix_pension_savings_contribution_plan_steps_pension_savings_id'), 'pension_savings_contribution_plan_steps', ['pension_savings_id'], unique=False)
    op.create_table('pension_savings_statements',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('pension_id', sa.Integer(), nullable=False),
    sa.Column('statement_date', sa.Date(), nullable=False),
    sa.Column('balance', sa.Numeric(precision=20, scale=2), nullable=False),
    sa.Column('note', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['pension_id'], ['pension_savings.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pension_savings_statements_id'), 'pension_savings_statements', ['id'], unique=False)
    op.create_index(op.f('ix_pension_savings_statements_pension_id'), 'pension_savings_statements', ['pension_id'], unique=False)
    op.create_index('ix_pension_savings_statements_pension_id_date', 'pension_savings_statements', ['pension_id', 'statement_date'], unique=False)


def downgrade() -> None:
    # Drop tables first
    op.drop_index('ix_pension_savings_statements_pension_id_date', table_name='pension_savings_statements')
    op.drop_index(op.f('ix_pension_savings_statements_pension_id'), table_name='pension_savings_statements')
    op.drop_index(op.f('ix_pension_savings_statements_id'), table_name='pension_savings_statements')
    op.drop_table('pension_savings_statements')
    op.drop_index(op.f('ix_pension_savings_contribution_plan_steps_pension_savings_id'), table_name='pension_savings_contribution_plan_steps')
    op.drop_index(op.f('ix_pension_savings_contribution_plan_steps_id'), table_name='pension_savings_contribution_plan_steps')
    op.drop_table('pension_savings_contribution_plan_steps')
    op.drop_index(op.f('ix_pension_savings_member_id'), table_name='pension_savings')
    op.drop_index(op.f('ix_pension_savings_id'), table_name='pension_savings')
    op.drop_table('pension_savings')
    
    # Drop the enum type
    op.execute("DROP TYPE compoundingfrequency")
