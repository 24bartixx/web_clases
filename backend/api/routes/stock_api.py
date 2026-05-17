from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.stock_schema import StockRead
from services import stock_service

router = APIRouter()


@router.get("/", response_model=list[StockRead])
def get_stocks(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return stock_service.get_stocks(db, skip=skip, limit=limit)


@router.get("/{ticker}", response_model=StockRead)
def get_stock(
    ticker: str,
    db: Session = Depends(get_db),
):
    return stock_service.get_stock(db, ticker)
