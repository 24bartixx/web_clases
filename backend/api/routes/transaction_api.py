from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.auth import get_current_user
from db.database import get_db
from models.user import User
from models.enums import TransactionType
from schemas.transaction_schema import TransactionCreate
from services import transaction_service

router = APIRouter()


@router.get("/")
def get_transactions(
    simulation_id: int | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if simulation_id is not None:
        return transaction_service.get_transactions_by_simulation(db, simulation_id, current_user.user_id)
    return transaction_service.get_transactions(db, skip=skip, limit=limit, user_id=current_user.user_id)


@router.get("/simulation/{simulation_id}")
def get_transactions_by_simulation(
    simulation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return transaction_service.get_transactions_by_simulation(db, simulation_id, current_user.user_id)


@router.get("/stock/{stock_id}/simulation/{simulation_id}")
def get_transactions_by_stock_simulation(
    stock_id: int,
    simulation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return transaction_service.get_transactions_by_stock_simulation(
        db,
        stock_id,
        simulation_id,
        current_user.user_id,
    )


@router.get("/type/{transaction_type}/simulation/{simulation_id}")
def get_transactions_by_type_simulation(
    transaction_type: TransactionType,
    simulation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return transaction_service.get_transactions_by_type_simulation(
        db,
        transaction_type,
        simulation_id,
        current_user.user_id,
    )


@router.get("/stock/{stock_id}/date-range")
def get_transactions_by_stock_date_range(
    stock_id: int,
    start_date: datetime = Query(),
    end_date: datetime = Query(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return transaction_service.get_transactions_by_stock_date_range(
        db,
        stock_id,
        start_date,
        end_date,
        current_user.user_id,
    )


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return transaction_service.create_transaction(db, transaction_data, current_user.user_id)


@router.get("/{transaction_id}")
def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return transaction_service.get_transaction(db, transaction_id, current_user.user_id)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transaction_service.delete_transaction(db, transaction_id, current_user.user_id)


@router.delete("/")
def delete_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return transaction_service.delete_transactions(db, current_user.user_id)
