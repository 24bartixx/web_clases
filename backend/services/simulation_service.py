from datetime import date, datetime, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from models.enums import TransactionType
from models.position import Position
from models.simulation import Simulation
from models.simulation_history import SimulationHistory
from models.stock import Stock
from models.summary import Summary
from models.transaction import Transaction
from schemas.simulation_schema import (
    SimulationAdvanceTurn,
    SimulationCreate,
    SimulationUpdate,
)
from services import stock_service


def get_simulations(db: Session, skip: int = 0, limit: int = 100, user_id: int | None = None):
    statement = select(Simulation).options(selectinload(Simulation.history))

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
            selectinload(Simulation.history),
        )
        .where(Simulation.simulation_id == simulation_id)
    )

    simulation = db.scalars(statement).one_or_none()

    if simulation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation not found",
        )
    
    return _attach_trading_dates(simulation)


def create_simulation(db: Session, simulation_data: SimulationCreate, user_id: int):
    _validate_stock_ids(db, simulation_data.stock_ids)
    start_date = _replace_date(
        simulation_data.start_date,
        stock_service.get_trading_date_on_or_after(simulation_data.start_date.date()),
    )
    finish_date = None

    if simulation_data.finish_date is not None:
        finish_date = _replace_date(
            simulation_data.finish_date,
            stock_service.get_trading_date_on_or_before(simulation_data.finish_date.date()),
        )

        if finish_date < start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="finish_date must be on or after the first trading day of start_date.",
            )

    create_data = simulation_data.model_dump(
        exclude={"stock_ids"},
        exclude_unset=True,
        exclude_none=True,
    )

    create_data["start_date"] = start_date
    create_data["current_date"] = start_date
    if finish_date is not None:
        create_data["finish_date"] = finish_date
    create_data["user_id"] = user_id

    simulation = Simulation(
        **create_data
    )

    db.add(simulation)

    try:
        db.flush()
        simulation_id = simulation.simulation_id
        db.add(
            SimulationHistory(
                simulation_id=simulation_id,
                balance=simulation_data.initial_balance,
                profit_loss=0,
                available_funds=simulation_data.initial_balance,
                timestamp=start_date,
            )
        )

        for stock_id in simulation_data.stock_ids:
            db.add(
                Position(
                    simulation_id=simulation_id,
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

    return get_simulation_detail(db, simulation_id)


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


def advance_turn(
    db: Session,
    simulation_id: int,
    turn_data: SimulationAdvanceTurn,
):
    simulation = get_simulation(db, simulation_id)
    previous_date = simulation.current_date

    next_date = _replace_date(
        previous_date,
        stock_service.get_next_trading_date(previous_date.date(), turn_data.days),
    )
    if simulation.finish_date is not None and next_date > simulation.finish_date:
        next_date = _replace_date(
            simulation.finish_date,
            stock_service.get_trading_date_on_or_before(simulation.finish_date.date()),
        )

    if next_date <= previous_date:
        return get_simulation_detail(db, simulation_id)

    latest_history = _get_latest_simulation_history(db, simulation_id)
    available_funds = (
        latest_history.available_funds
        if latest_history is not None
        else simulation.initial_balance
    )
    _sync_positions_from_transactions(db, simulation_id, previous_date)
    opened_positions = _get_opened_positions(db, simulation_id)
    trading_dates = _get_advance_trading_dates(previous_date, next_date)

    if not trading_dates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No trading dates found between {previous_date.date()} and {next_date.date()}.",
        )

    position_prices = {
        position.position_id: _get_position_open_prices_by_date(
            db,
            position,
            previous_date.date(),
            trading_dates[-1],
        )
        for position in opened_positions
    }

    for trading_date in trading_dates:
        balance = available_funds

        for position in opened_positions:
            open_price = position_prices[position.position_id].get(trading_date)

            if open_price is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing open price for {position.stock.ticker} on {trading_date}.",
                )

            balance += open_price * position.amount

        profit_loss = balance - simulation.initial_balance

        db.add(
            SimulationHistory(
                simulation_id=simulation_id,
                balance=balance,
                profit_loss=profit_loss,
                available_funds=available_funds,
                timestamp=_replace_date(previous_date, trading_date),
            )
        )

    simulation.current_date = next_date
    simulation.updated_at = datetime.now()

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not advance simulation turn.",
        ) from exc

    return get_simulation_detail(db, simulation_id)


def _get_advance_trading_dates(previous_date: datetime, next_date: datetime):
    trading_dates = stock_service.get_trading_dates(
        previous_date.date(),
        next_date.date(),
    )
    return [
        trading_date
        for trading_date in trading_dates
        if previous_date.date() < trading_date <= next_date.date()
    ]


def _get_opened_positions(db: Session, simulation_id: int):
    statement = (
        select(Position)
        .options(selectinload(Position.stock))
        .where(
            Position.simulation_id == simulation_id,
            Position.amount > 0,
        )
        .order_by(Position.position_id)
    )
    return db.scalars(statement).all()


def _sync_positions_from_transactions(
    db: Session,
    simulation_id: int,
    current_date: datetime,
):
    positions = db.scalars(
        select(Position).where(Position.simulation_id == simulation_id)
    ).all()
    positions_by_stock_id = {position.stock_id: position for position in positions}

    for position in positions:
        position.amount = Decimal("0")

    transactions = db.scalars(
        select(Transaction)
        .where(
            Transaction.simulation_id == simulation_id,
            Transaction.transaction_time <= current_date,
        )
        .order_by(Transaction.transaction_time, Transaction.transaction_id)
    ).all()

    for transaction in transactions:
        position = positions_by_stock_id.get(transaction.stock_id)
        if position is None:
            continue

        if transaction.transaction_type == TransactionType.buy:
            position.amount += transaction.amount
        else:
            position.amount -= transaction.amount


def _get_latest_simulation_history(db: Session, simulation_id: int):
    statement = (
        select(SimulationHistory)
        .where(SimulationHistory.simulation_id == simulation_id)
        .order_by(SimulationHistory.timestamp.desc(), SimulationHistory.history_id.desc())
    )
    return db.scalars(statement).first()


def _get_position_open_prices_by_date(
    db: Session,
    position: Position,
    start_date: date,
    finish_date: date,
):
    if position.stock is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock not found for position {position.position_id}.",
        )

    start_day = stock_service.get_trading_date_on_or_before(start_date)
    finish_day = stock_service.get_trading_date_on_or_after(finish_date)

    prices = stock_service.get_stock_prices(
        db,
        position.stock.ticker,
        start=start_day,
        finish=finish_day + timedelta(days=1),
        interval="1d",
    )
    return {
        price["price_date"].date(): Decimal(str(price["open"]))
        for price in prices
    }


def _replace_date(date_time: datetime, trading_date):
    return date_time.replace(
        year=trading_date.year,
        month=trading_date.month,
        day=trading_date.day,
    )


def _attach_trading_dates(simulation: Simulation):
    simulation.trading_dates = stock_service.get_trading_dates(
        simulation.start_date.date(),
        simulation.finish_date.date(),
    )
    return simulation


def delete_simulation(db: Session, simulation_id: int):
    simulation = get_simulation(db, simulation_id)

    _delete_simulation_related_records(db, simulation_id)

    db.delete(simulation)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete simulation because related records exist.",
        ) from exc


def delete_simulations(db: Session):
    try:
        _delete_simulation_related_records(db)
        result = db.execute(delete(Simulation))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete simulations because related records exist.",
        ) from exc

    return {"deleted_count": result.rowcount or 0}


def _delete_simulation_related_records(
    db: Session,
    simulation_id: int | None = None,
):
    for model in (SimulationHistory, Summary, Transaction, Position):
        statement = delete(model)

        if simulation_id is not None:
            statement = statement.where(model.simulation_id == simulation_id)

        db.execute(statement)
