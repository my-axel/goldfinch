from fastapi import APIRouter

router = APIRouter()

@router.get("")
@router.get("/")
async def get_pensions():
    return {"message": "This will return pensions"} 