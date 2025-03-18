from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.db.base import Base
from app.models.pension_etf import (
    PensionETF,
    PensionETFContributionPlanStep,
    PensionETFContributionHistory
)
from app.models.pension_insurance import (
    PensionInsurance,
    PensionInsuranceContributionPlanStep,
    PensionInsuranceContributionHistory
)
from app.models.pension_company import (
    PensionCompany,
    PensionCompanyContributionPlanStep,
    PensionCompanyContributionHistory
)
from app.models.pension_state import (
    PensionState,
    PensionStateStatement
)
from app.models.household import HouseholdMember
from app.models.etf import ETF
from app.models.etf import ETFUpdate
from app.models.etf import ETFError
from app.models.task import TaskStatus
from app.models.settings import Settings
from app.models.exchange_rate import ExchangeRate
from app.models.update_tracking import DailyUpdateTracking
from app.core.config import settings

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def get_url():
    # First check if a URL was passed in the config
    url = config.get_main_option("sqlalchemy.url", None)
    if url:
        return url
    # Fall back to settings if no URL was provided
    return settings.DATABASE_URL


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
