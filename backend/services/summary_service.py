from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from repositories import summary_repository
from schemas.summary_schema import SummaryCreate


def get_summaries(db: Session, skip: int = 0, limit: int = 100):
    return summary_repository.get_summaries(db, skip=skip, limit=limit)


def get_summaries_by_simulation(db: Session, simulation_id: int):
    return summary_repository.get_summaries_by_simulation_id(db, simulation_id)


def get_summaries_by_stock_simulation(db: Session, stock_id: int, simulation_id: int):
    return summary_repository.get_summaries_by_stock_simulation_id(
        db,
        stock_id,
        simulation_id,
    )


def get_summaries_by_stock_date_range(
    db: Session,
    stock_id: int,
    start_date: datetime,
    end_date: datetime,
):
    return summary_repository.get_summaries_by_stock_date_range(
        db,
        stock_id,
        start_date,
        end_date,
    )


def get_summary(db: Session, summary_id: int):
    summary = summary_repository.get_summary_by_id(db, summary_id)
    if summary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found")
    return summary


def create_summary(db: Session, summary_data: SummaryCreate):
    try:
        summary = summary_repository.create_summary(db, summary_data)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create summary. Check related simulation_id and stock_id.",
        ) from exc

    db.refresh(summary)
    return summary


def delete_summary(db: Session, summary_id: int):
    get_summary(db, summary_id)

    try:
        summary_repository.delete_summary(db, summary_id)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete summary because related records exist.",
        ) from exc


def delete_summaries(db: Session):
    try:
        deleted_count = summary_repository.delete_summaries(db)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete summaries because related records exist.",
        ) from exc

    return {"deleted_count": deleted_count}
