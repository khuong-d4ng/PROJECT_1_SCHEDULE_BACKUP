"""add_batch_to_session_entries

Revision ID: e2bc49d28f0b
Revises: 5dc409c28bcc
Create Date: 2026-06-01 12:41:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e2bc49d28f0b'
down_revision: Union[str, None] = '5dc409c28bcc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('session_entries', sa.Column('batch', sa.String(length=10), nullable=True))


def downgrade() -> None:
    op.drop_column('session_entries', 'batch')
