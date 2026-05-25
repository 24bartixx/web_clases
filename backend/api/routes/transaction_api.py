from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from db.database import get_db
from models.enums import TransactionType
from schemas.transaction_schema import TransactionCreate
from services import transaction_service

router = APIRouter()


@router.get("/")
def get_transactions(
    simulation_id: int | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    if simulation_id is not None:
        return transaction_service.get_transactions_by_simulation(db, simulation_id)
    return transaction_service.get_transactions(db, skip=skip, limit=limit)


@router.get("/simulation/{simulation_id}")
def get_transactions_by_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
):
    return transaction_service.get_transactions_by_simulation(db, simulation_id)


@router.get("/stock/{stock_id}/simulation/{simulation_id}")
def get_transactions_by_stock_simulation(
    stock_id: int,
    simulation_id: int,
    db: Session = Depends(get_db),
):
    return transaction_service.get_transactions_by_stock_simulation(
        db,
        stock_id,
        simulation_id,
    )


@router.get("/type/{transaction_type}/simulation/{simulation_id}")
def get_transactions_by_type_simulation(
    transaction_type: TransactionType,
    simulation_id: int,
    db: Session = Depends(get_db),
):
    return transaction_service.get_transactions_by_type_simulation(
        db,
        transaction_type,
        simulation_id,
    )


@router.get("/stock/{stock_id}/date-range")
def get_transactions_by_stock_date_range(
    stock_id: int,
    start_date: datetime = Query(),
    end_date: datetime = Query(),
    db: Session = Depends(get_db),
):
    return transaction_service.get_transactions_by_stock_date_range(
        db,
        stock_id,
        start_date,
        end_date,
    )


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction_data: TransactionCreate,
    db: Session = Depends(get_db),
):
    return transaction_service.create_transaction(db, transaction_data)


@router.get("/{transaction_id}")
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
):
    return transaction_service.get_transaction(db, transaction_id)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
):
    transaction_service.delete_transaction(db, transaction_id)


@router.delete("/")
def delete_transactions(
    db: Session = Depends(get_db),
):
    return transaction_service.delete_transactions(db)
