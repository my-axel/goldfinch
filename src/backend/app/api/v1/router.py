from fastapi import APIRouter
from app.api.v1.endpoints import household, pension, etf, exchange_rates

api_router = APIRouter()

api_router.include_router(
    household.router,
    prefix="/household",
    tags=["household"]
)
api_router.include_router(
    pension.router, 
    prefix="/pension", 
    tags=["pension"]
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