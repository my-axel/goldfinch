from fastapi import APIRouter
from app.api.v1.endpoints import household, etf, exchange_rates, settings
from app.api.v1.endpoints.pension import router as pension_router
from app.api.v1.endpoints.pension_summaries import router as pension_summaries_router

api_router = APIRouter()

api_router.include_router(
    household.router,
    prefix="/household",
    tags=["household"]
)
api_router.include_router(
    pension_router,
    prefix="/pension",
    tags=["pension"]
)
api_router.include_router(
    pension_summaries_router,
    tags=["pension-summaries"]
)
api_router.include_router(
    etf.router, 
    prefix="/etf", 
    tags=["etf"]
) 
api_router.include_router(
    exchange_rates.router, 
    prefix="/exchange-rates", 
    tags=["exchange-rates"]
)
api_router.include_router(
    settings.router,
    prefix="/settings",
    tags=["settings"]
) 