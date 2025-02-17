from fastapi import APIRouter
from . import base, etf, insurance, company

router = APIRouter(prefix="/pension")

# Include sub-routers
router.include_router(base.router)  # Base routes without prefix
router.include_router(etf.router, prefix="/etf")
router.include_router(insurance.router, prefix="/insurance")
router.include_router(company.router, prefix="/company") 