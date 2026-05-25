from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.summary_schema import SummaryCreate
from services import summary_service

router = APIRouter()


@router.get("/")
def get_summaries(
    simulation_id: int | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    if simulation_id is not None:
        return summary_service.get_summaries_by_simulation(db, simulation_id)
    return summary_service.get_summaries(db, skip=skip, limit=limit)


@router.get("/simulation/{simulation_id}")
def get_summaries_by_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
):
    return summary_service.get_summaries_by_simulation(db, simulation_id)


@router.get("/stock/{stock_id}/simulation/{simulation_id}")
def get_summaries_by_stock_simulation(
    stock_id: int,
    simulation_id: int,
    db: Session = Depends(get_db),
):
    return summary_service.get_summaries_by_stock_simulation(
        db,
        stock_id,
        simulation_id,
    )


@router.get("/stock/{stock_id}/date-range")
def get_summaries_by_stock_date_range(
    stock_id: int,
    start_date: datetime = Query(),
    end_date: datetime = Query(),
    db: Session = Depends(get_db),
):
    return summary_service.get_summaries_by_stock_date_range(
        db,
        stock_id,
        start_date,
        end_date,
    )


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_summary(
    summary_data: SummaryCreate,
    db: Session = Depends(get_db),
):
    return summary_service.create_summary(db, summary_data)


@router.get("/{summary_id}")
def get_summary(
    summary_id: int,
    db: Session = Depends(get_db),
):
    return summary_service.get_summary(db, summary_id)


@router.delete("/{summary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_summary(
    summary_id: int,
    db: Session = Depends(get_db),
):
    summary_service.delete_summary(db, summary_id)


@router.delete("/")
def delete_summaries(
    db: Session = Depends(get_db),
):
    return summary_service.delete_summaries(db)
