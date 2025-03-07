"""Add inflation rate to settings

Revision ID: 37dc91afc559
Revises: d9fcb5ff43df
Create Date: 2025-02-27 20:48:53.579921

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '37dc91afc559'
down_revision: Union[str, None] = 'd9fcb5ff43df'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add column with server_default to handle existing rows
    op.add_column('settings', sa.Column('inflation_rate', sa.Numeric(precision=10, scale=4), 
                                      nullable=False, server_default='2.0'))
    # Remove server_default after column is added
    op.alter_column('settings', 'inflation_rate', 
                    server_default=None)


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('settings', 'inflation_rate')
    # ### end Alembic commands ###
