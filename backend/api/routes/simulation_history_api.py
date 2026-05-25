from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.simulation_history_schema import (
    SimulationHistoryCreate,
    SimulationHistoryUpdate,
)
from services import simulation_history_service

router = APIRouter()


@router.get("/")
def get_history_entries(
    simulation_id: int | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    if simulation_id is not None:
        return simulation_history_service.get_history_by_simulation(db, simulation_id)
    return simulation_history_service.get_history_entries(db, skip=skip, limit=limit)


@router.get("/user/{user_id}")
def get_history_by_user(
    user_id: int,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return simulation_history_service.get_history_by_user(
        db,
        user_id,
        skip=skip,
        limit=limit,
    )


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_history_entry(
    history_data: SimulationHistoryCreate,
    db: Session = Depends(get_db),
):
    return simulation_history_service.create_history_entry(db, history_data)


@router.get("/{history_id}")
def get_history_entry(
    history_id: int,
    db: Session = Depends(get_db),
):
    return simulation_history_service.get_history_entry(db, history_id)


@router.patch("/{history_id}")
def update_history_entry(
    history_id: int,
    history_data: SimulationHistoryUpdate,
    db: Session = Depends(get_db),
):
    return simulation_history_service.update_history_entry(db, history_id, history_data)


@router.patch("/{history_id}/simulation/{simulation_id}")
def update_history_entry_from_simulation(
    history_id: int,
    simulation_id: int,
    db: Session = Depends(get_db),
):
    return simulation_history_service.update_history_entry_from_simulation(
        db,
        history_id,
        simulation_id,
    )


@router.delete("/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history_entry(
    history_id: int,
    db: Session = Depends(get_db),
):
    simulation_history_service.delete_history_entry(db, history_id)
