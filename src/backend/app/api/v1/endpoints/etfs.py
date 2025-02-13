from fastapi import APIRouter

router = APIRouter()

@router.get("")
@router.get("/")
async def get_etfs():
    return {"message": "This will return ETFs"} 