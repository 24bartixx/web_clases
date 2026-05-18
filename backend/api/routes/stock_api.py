from datetime import date
from threading import Lock

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from fastapi.exceptions import HTTPException
from sqlalchemy.orm import Session

from db.database import SessionLocal, get_db
from schemas.stock_schema import StockPriceRead, StockRead, StockScrapeRequest
from services import stock_service

router = APIRouter()
scraping_lock = Lock()


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


@router.get("/{ticker}/prices", response_model=list[StockPriceRead])
def get_stock_prices(
    ticker: str,
    start: date | None = Query(default=None),
    finish: date | None = Query(default=None),
    interval: str = Query(default="1d"),
    db: Session = Depends(get_db),
):
    return stock_service.get_stock_prices(
        db,
        ticker,
        start=start,
        finish=finish,
        interval=interval,
    )


@router.post("/scrape", status_code=status.HTTP_202_ACCEPTED)
def scrap_stock_data(
    background_tasks: BackgroundTasks,
    scrape_data: StockScrapeRequest | None = None,
):
    if not scraping_lock.acquire(blocking=False):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Stock scraping is already running",
        )

    background_tasks.add_task(_run_stock_scraping, scrape_data.limit if scrape_data else None)
    return {"detail": "Stock scraping started"}


def _run_stock_scraping(limit: int | None = None):
    db = SessionLocal()
    try:
        stock_service.scrap_stock_data(db, limit=limit)
    finally:
        db.close()
        scraping_lock.release()
