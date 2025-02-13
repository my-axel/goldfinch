from fastapi import APIRouter
from app.api.v1.endpoints import household, pensions, etfs

api_router = APIRouter()

api_router.include_router(
    household.router,
    prefix="/household",
    tags=["household"]
)
api_router.include_router(
    pensions.router, 
    prefix="/pensions", 
    tags=["pensions"]
)
api_router.include_router(
    etfs.router, 
    prefix="/etfs", 
    tags=["etfs"]
) 