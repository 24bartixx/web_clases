from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.position_schema import PositionUpdate, PostitionCreate
from services import position_service

router = APIRouter()


@router.get("/")
def get_positions(
    simulation_id: int | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    if simulation_id is not None:
        return position_service.get_positions_by_simulation(db, simulation_id)
    return position_service.get_positions(db, skip=skip, limit=limit)


@router.get("/simulation/{simulation_id}")
def get_positions_by_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
):
    return position_service.get_positions_by_simulation(db, simulation_id)


@router.get("/stock/{stock_id}/simulation/{simulation_id}")
def get_position_by_stock_simulation(
    stock_id: int,
    simulation_id: int,
    db: Session = Depends(get_db),
):
    return position_service.get_position_by_stock_simulation(db, stock_id, simulation_id)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_position(
    position_data: PostitionCreate,
    db: Session = Depends(get_db),
):
    return position_service.create_position(db, position_data)


@router.get("/{position_id}")
def get_position(
    position_id: int,
    db: Session = Depends(get_db),
):
    return position_service.get_position(db, position_id)


@router.patch("/{position_id}")
def update_position(
    position_id: int,
    position_data: PositionUpdate,
    db: Session = Depends(get_db),
):
    return position_service.update_position(db, position_id, position_data)


@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_position(
    position_id: int,
    db: Session = Depends(get_db),
):
    position_service.delete_position(db, position_id)


@router.delete("/")
def delete_positions(
    db: Session = Depends(get_db),
):
    return position_service.delete_positions(db)
