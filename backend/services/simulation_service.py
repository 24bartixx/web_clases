from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from models.position import Position
from models.simulation import Simulation
from models.stock import Stock
from models.transaction import Transaction
from schemas.simulation_schema import SimulationCreate, SimulationUpdate


def get_simulations(db: Session, skip: int = 0, limit: int = 100, user_id: int | None = None):
    statement = select(Simulation)

    if user_id is not None:
        statement = statement.where(Simulation.user_id == user_id)

    statement = statement.order_by(Simulation.simulation_id).offset(skip).limit(limit)
    return db.scalars(statement).all()


def get_simulation(db: Session, simulation_id: int):
    simulation = db.get(Simulation, simulation_id)
    if simulation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation not found",
        )
    return simulation


def get_simulation_detail(db: Session, simulation_id: int):
    statement = (
        select(Simulation)
        .options(
            selectinload(Simulation.positions).selectinload(Position.stock),
            selectinload(Simulation.transactions).selectinload(Transaction.stock),
        )
        .where(Simulation.simulation_id == simulation_id)
    )

    simulation = db.scalars(statement).one_or_none()

    if simulation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation not found",
        )
    
    return simulation


def create_simulation(db: Session, simulation_data: SimulationCreate):
    _validate_stock_ids(db, simulation_data.stock_ids)

    create_data = simulation_data.model_dump(
        exclude={"stock_ids"},
        exclude_unset=True,
        exclude_none=True,
    )

    create_data["current_balance"] = simulation_data.initial_balance
    create_data["current_date"] = simulation_data.start_date

    simulation = Simulation(
        **create_data
    )

    db.add(simulation)

    try:
        db.flush()
        for stock_id in simulation_data.stock_ids:
            db.add(
                Position(
                    simulation_id=simulation.simulation_id,
                    stock_id=stock_id,
                    amount=0,
                )
            )

        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create simulation or default positions. Check related ids.",
        ) from exc

    db.refresh(simulation)
    return simulation


def _validate_stock_ids(db: Session, stock_ids: list[int]):
    if not stock_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one stock_id is required.",
        )

    duplicate_stock_ids = sorted(
        stock_id for stock_id in set(stock_ids) if stock_ids.count(stock_id) > 1
    )

    if duplicate_stock_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Duplicate stock ids are not allowed: {duplicate_stock_ids}",
        )

    existing_stock_ids = set(
        db.scalars(
            select(Stock.stock_id).where(Stock.stock_id.in_(stock_ids))
        ).all()
    )

    missing_stock_ids = sorted(set(stock_ids) - existing_stock_ids)

    if missing_stock_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stocks not found for ids: {missing_stock_ids}",
        )


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
