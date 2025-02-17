from fastapi import APIRouter
from app.api.v1.endpoints import household, etf, exchange_rates
from app.api.v1.endpoints.pension import router as pension_router

api_router = APIRouter()

api_router.include_router(
    household.router,
    prefix="/household",
    tags=["household"]
)
api_router.include_router(
    pension_router,
    tags=["pension"]  # prefix is already set in the pension router
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