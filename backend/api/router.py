from fastapi import APIRouter

from api.routes import (
    position_api,
    simulation_api,
    simulation_history_api,
    stock_api,
    summary_api,
    transaction_api,
    user_api,
)

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

api_router.include_router(
    user_api.router,
    prefix="/users",
    tags=["users"],
)

api_router.include_router(
    position_api.router,
    prefix="/positions",
    tags=["positions"],
)

api_router.include_router(
    transaction_api.router,
    prefix="/transactions",
    tags=["transactions"],
)

api_router.include_router(
    summary_api.router,
    prefix="/summaries",
    tags=["summaries"],
)

api_router.include_router(
    simulation_history_api.router,
    prefix="/simulation-history",
    tags=["simulation-history"],
)
