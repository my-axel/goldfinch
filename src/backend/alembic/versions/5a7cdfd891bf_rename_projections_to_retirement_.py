"""rename_projections_to_retirement_projections

Revision ID: 5a7cdfd891bf
Revises: 9ba22f8c3527
Create Date: 2025-03-04 16:41:36.355032

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a7cdfd891bf'
down_revision: Union[str, None] = '9ba22f8c3527'
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
