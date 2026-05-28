from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.simulation import Simulation
from schemas.simulation_schema import SimulationCreate, SimulationUpdate


def get_simulations(db: Session, skip: int = 0, limit: int = 100):
    statement = (
        select(Simulation)
        .order_by(Simulation.simulation_id)
        .offset(skip)
        .limit(limit)
    )
    return db.scalars(statement).all()


def get_simulation(db: Session, simulation_id: int):
    simulation = db.get(Simulation, simulation_id)
    if simulation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation not found",
        )
    return simulation


def create_simulation(db: Session, simulation_data: SimulationCreate):
    create_data = simulation_data.model_dump(exclude_unset=True, exclude_none=True)
    create_data["current_balance"] = simulation_data.initial_balance
    create_data["current_date"] = simulation_data.start_date

    simulation = Simulation(
        **create_data
    )
    db.add(simulation)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create simulation. Check related ids, such as user_id.",
        ) from exc

    db.refresh(simulation)
    return simulation


def update_simulation(
    db: Session,
    simulation_id: int,
    simulation_data: SimulationUpdate,
):
    simulation = get_simulation(db, simulation_id)
    update_data = simulation_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(simulation, field, value)

    simulation.updated_at = datetime.now()

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update simulation. Check related ids, such as user_id.",
        ) from exc

    db.refresh(simulation)
    return simulation


def delete_simulation(db: Session, simulation_id: int):
    simulation = get_simulation(db, simulation_id)
    db.delete(simulation)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete simulation because related records exist.",
        ) from exc
