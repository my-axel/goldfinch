from app.db.base_class import Base

# Import all models here for SQLAlchemy to recognize them
from app.models.pension import BasePension, ETFPension, InsurancePension, CompanyPension, PensionContribution, ETFAllocation  # noqa
from app.models.etf import ETF, ETFPrice  # noqa
from app.models.household import HouseholdMember  # noqa
from app.models.exchange_rate import ExchangeRate  # noqa
# Import any other models here

# They need to be imported for SQLAlchemy to recognize them during Base.metadata.create_all() 