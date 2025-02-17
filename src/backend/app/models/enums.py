from enum import Enum

class ContributionFrequency(str, Enum):
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    SEMI_ANNUALLY = "SEMI_ANNUALLY"
    ANNUALLY = "ANNUALLY"
    ONE_TIME = "ONE_TIME"

class ContributionStatus(str, Enum):
    PLANNED = "PLANNED"
    REALIZED = "REALIZED"
    SKIPPED = "SKIPPED"
    MODIFIED = "MODIFIED"

class PensionType(str, Enum):
    ETF_PLAN = "ETF_PLAN"
    INSURANCE = "INSURANCE"
    COMPANY = "COMPANY"
    GOVERNMENT = "GOVERNMENT"
    OTHER = "OTHER" 