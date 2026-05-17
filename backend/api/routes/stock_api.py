from fastapi import APIRouter

from services import stock_service

router = APIRouter()


@router.get("/")
def get_stocks():
    return stock_service.get_stocks()


@router.get("/{symbol}")
def get_stock(symbol: str):
    return stock_service.get_stock(symbol)
