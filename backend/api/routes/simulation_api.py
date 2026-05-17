from fastapi import APIRouter

from services import simulation_service

router = APIRouter()


@router.get("/")
def get_simulation():
    return simulation_service.get_simulation()
