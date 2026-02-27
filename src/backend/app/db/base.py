from app.db.base_class import Base  # noqa
from app.models.household import HouseholdMember  # noqa
from app.models.pension_etf import PensionETF, PensionETFContributionPlanStep, PensionETFContributionHistory  # noqa
from app.models.pension_insurance import PensionInsurance, PensionInsuranceContributionPlanStep, PensionInsuranceContributionHistory  # noqa
from app.models.pension_company import PensionCompany, PensionCompanyContributionPlanStep, PensionCompanyContributionHistory  # noqa
from app.models.pension_state import PensionState, PensionStateStatement  # noqa
from app.models.pension_savings import PensionSavings, PensionSavingsStatement, PensionSavingsContributionPlanStep  # noqa
from app.models.etf import ETF  # noqa
from app.models.etf import ETFUpdate  # noqa
from app.models.etf import ETFError  # noqa
from app.models.task import TaskStatus  # noqa
from app.models.settings import Settings  # noqa
from app.models.exchange_rate import ExchangeRate  # noqa
from app.models.update_tracking import DailyUpdateTracking  # noqa
from app.models.retirement_gap import RetirementGapConfig  # noqa
from app.models.data_source import DataSourceConfig, ETFSourceSymbol  # noqa
# Import any other models here

# They need to be imported for SQLAlchemy to recognize them during Base.metadata.create_all() 