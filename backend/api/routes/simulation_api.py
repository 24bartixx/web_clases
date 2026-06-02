from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.auth import get_current_user
from db.database import get_db
from models.user import User
from schemas.simulation_schema import (
    SimulationCreate,
    SimulationDetailRead,
    SimulationRead,
    SimulationUpdate,
)
from services import simulation_service

router = APIRouter()


@router.get("/", response_model=list[SimulationRead])
def get_simulations(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return simulation_service.get_simulations(
        db,
        skip=skip,
        limit=limit,
        user_id=current_user.user_id,
    )


@router.post("/", response_model=SimulationDetailRead, status_code=status.HTTP_201_CREATED)
def create_simulation(
    simulation_data: SimulationCreate,
    db: Session = Depends(get_db),
):
    return simulation_service.create_simulation(db, simulation_data)


@router.get("/{simulation_id}", response_model=SimulationDetailRead)
def get_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
):
    return simulation_service.get_simulation_detail(db, simulation_id)


@router.patch("/{simulation_id}", response_model=SimulationRead)
def update_simulation(
    simulation_id: int,
    simulation_data: SimulationUpdate,
    db: Session = Depends(get_db),
):
    return simulation_service.update_simulation(db, simulation_id, simulation_data)


@router.delete("/{simulation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
):
    simulation_service.delete_simulation(db, simulation_id)
