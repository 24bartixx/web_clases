from fastapi import APIRouter

from api.routes import simulation_api, stock_api

api_router = APIRouter()

api_router.include_router(
    simulation_api.router,
    prefix="/simulation",
    tags=["simulation"],
)

api_router.include_router(
    stock_api.router,
    prefix="/stocks",
    tags=["stocks"],
)
