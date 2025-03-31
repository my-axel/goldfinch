"""rename_date_to_contribution_date

Revision ID: 1e16863cb793
Revises: 94185ab6b930
Create Date: 2025-03-31 14:04:49.865416

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1e16863cb793'
down_revision: Union[str, None] = '94185ab6b930'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('pension_company_contribution_history', 'date', new_column_name='contribution_date')
    op.alter_column('pension_etf_contribution_history', 'date', new_column_name='contribution_date')
    op.alter_column('pension_insurance_contribution_history', 'date', new_column_name='contribution_date')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('pension_insurance_contribution_history', 'contribution_date', new_column_name='date')
    op.alter_column('pension_etf_contribution_history', 'contribution_date', new_column_name='date')
    op.alter_column('pension_company_contribution_history', 'contribution_date', new_column_name='date')
    # ### end Alembic commands ###
