"""Adding exchange rates for all currencies to EUR

Revision ID: a7fdd1787696
Revises: 2eaaf780922b
Create Date: 2025-02-15 10:37:15.720323

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7fdd1787696'
down_revision: Union[str, None] = '2eaaf780922b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###
