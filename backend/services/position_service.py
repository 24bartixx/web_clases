from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.position import Position
from repositories import position_repository
from schemas.position_schema import PositionUpdate, PostitionCreate


def get_positions(db: Session, skip: int = 0, limit: int = 100):
    statement = select(Position).order_by(Position.position_id).offset(skip).limit(limit)
    return db.scalars(statement).all()


def get_positions_by_simulation(db: Session, simulation_id: int):
    return position_repository.get_positions_by_simulation_id(db, simulation_id)


def get_position_by_stock_simulation(db: Session, stock_id: int, simulation_id: int):
    position = position_repository.get_position_by_stock_simulation_id(
        db,
        stock_id,
        simulation_id,
    )
    if position is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found")
    return position


def get_position(db: Session, position_id: int):
    position = db.get(Position, position_id)
    if position is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found")
    return position


def create_position(db: Session, position_data: PostitionCreate):
    position = Position(**position_data.model_dump())
    db.add(position)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create position. Check related simulation_id and stock_id.",
        ) from exc

    db.refresh(position)
    return position


def update_position(db: Session, position_id: int, position_data: PositionUpdate):
    position = get_position(db, position_id)
    position.amount = position_data.amount

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update position.",
        ) from exc

    db.refresh(position)
    return position


def delete_position(db: Session, position_id: int):
    position = get_position(db, position_id)
    db.delete(position)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete position because related records exist.",
        ) from exc


def delete_positions(db: Session):
    try:
        deleted_count = position_repository.delete_positions(db)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete positions because related records exist.",
        ) from exc

    return {"deleted_count": deleted_count}
