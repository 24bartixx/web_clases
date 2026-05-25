from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.simulation_history import SimulationHistory
from repositories import simulation_history_repository
from schemas.simulation_history_schema import SimulationHistoryCreate, SimulationHistoryUpdate


def get_history_entries(db: Session, skip: int = 0, limit: int = 100):
    statement = (
        select(SimulationHistory)
        .order_by(SimulationHistory.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return db.scalars(statement).all()


def get_history_by_simulation(db: Session, simulation_id: int):
    statement = (
        select(SimulationHistory)
        .where(SimulationHistory.simulation_id == simulation_id)
        .order_by(SimulationHistory.created_at.desc())
    )
    return db.scalars(statement).all()


def get_history_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 10):
    return simulation_history_repository.get_simulation_histories_by_user_id(
        db,
        user_id,
        skip=skip,
        limit=limit,
    )


def get_history_entry(db: Session, history_id: int):
    history_entry = db.get(SimulationHistory, history_id)
    if history_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation history entry not found",
        )
    return history_entry


def create_history_entry(db: Session, history_data: SimulationHistoryCreate):
    history_entry = SimulationHistory(**history_data.model_dump())
    db.add(history_entry)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create simulation history entry. Check related simulation_id.",
        ) from exc

    db.refresh(history_entry)
    return history_entry


def update_history_entry(
    db: Session,
    history_id: int,
    history_data: SimulationHistoryUpdate,
):
    history_entry = get_history_entry(db, history_id)
    history_entry.balance = history_data.balance
    history_entry.timestamp = history_data.timestamp

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update simulation history entry.",
        ) from exc

    db.refresh(history_entry)
    return history_entry


def update_history_entry_from_simulation(
    db: Session,
    history_id: int,
    simulation_id: int,
):
    get_history_entry(db, history_id)

    try:
        history_entry = simulation_history_repository.update_simulation_history_based_on_simulation_id(
            db,
            history_id,
            simulation_id,
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update simulation history entry. Check related simulation_id.",
        ) from exc

    db.refresh(history_entry)
    return history_entry


def delete_history_entry(db: Session, history_id: int):
    history_entry = get_history_entry(db, history_id)
    db.delete(history_entry)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete simulation history entry because related records exist.",
        ) from exc
