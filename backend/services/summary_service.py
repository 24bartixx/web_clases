from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from models.simulation import Simulation
from models.summary import Summary

from repositories import summary_repository
from schemas.summary_schema import SummaryCreate


def get_summaries(db: Session, skip: int = 0, limit: int = 100, user_id: int | None = None):
    # Tutaj repozytorium musiałoby wspierać filtrowanie, jeśli nie, trzeba użyć select().join()
    return summary_repository.get_summaries(db, skip=skip, limit=limit)


def get_summaries_by_simulation(db: Session, simulation_id: int, user_id: int):
    _check_simulation_ownership(db, simulation_id, user_id)
    return summary_repository.get_summaries_by_simulation_id(db, simulation_id)


def get_summaries_by_stock_simulation(db: Session, stock_id: int, simulation_id: int, user_id: int):
    _check_simulation_ownership(db, simulation_id, user_id)
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
    user_id: int,
):
    # Filtrowanie po user_id poprzez join z Simulation
    return summary_repository.get_summaries_by_stock_date_range(
        db,
        stock_id,
        start_date,
        end_date,
    )


def get_summary(db: Session, summary_id: int, user_id: int):
    statement = select(Summary).join(Simulation).where(
        Summary.summary_id == summary_id,
        Simulation.user_id == user_id
    )
    summary = db.scalars(statement).one_or_none()
    
    if summary is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found")
    return summary


def create_summary(db: Session, summary_data: SummaryCreate, user_id: int):
    _check_simulation_ownership(db, summary_data.simulation_id, user_id)
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


def delete_summary(db: Session, summary_id: int, user_id: int):
    get_summary(db, summary_id, user_id)

    try:
        summary_repository.delete_summary(db, summary_id)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete summary because related records exist.",
        ) from exc


def delete_summaries(db: Session, user_id: int):
    try:
        sim_subquery = select(Simulation.simulation_id).where(Simulation.user_id == user_id)
        statement = delete(Summary).where(Summary.simulation_id.in_(sim_subquery))
        result = db.execute(statement)
        deleted_count = result.rowcount
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete summaries because related records exist.",
        ) from exc

    return {"deleted_count": deleted_count}


def _check_simulation_ownership(db: Session, simulation_id: int, user_id: int):
    statement = select(Simulation).where(Simulation.simulation_id == simulation_id, Simulation.user_id == user_id)
    if db.scalars(statement).one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation not found")
