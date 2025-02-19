from app.db.base_class import Base

# Import all models here for SQLAlchemy to recognize them
from app.models.pension_etf import PensionETF, PensionETFContributionPlanStep, PensionETFContributionPlan, PensionETFContributionHistory, PensionETFAllocationPlan, PensionETFAllocationHistory  # noqa
from app.models.pension_insurance import PensionInsurance, PensionInsuranceContributionPlanStep, PensionInsuranceContributionPlan, PensionInsuranceContributionHistory  # noqa
from app.models.pension_company import PensionCompany, PensionCompanyContributionPlanStep, PensionCompanyContributionPlan, PensionCompanyContributionHistory  # noqa
from app.models.etf import ETF, ETFPrice  # noqa
from app.models.household import HouseholdMember  # noqa
from app.models.exchange_rate import ExchangeRate  # noqa
from app.models.task import TaskStatus  # noqa
# Import any other models here

# They need to be imported for SQLAlchemy to recognize them during Base.metadata.create_all() 