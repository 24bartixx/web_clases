from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from models.position import Position
from schemas.position_schema import PostitionBase

def get_position_by_id(db: Session, position_id: int):
    return db.get(Position, position_id)

def get_position_by_stock_simulation_id(db: Session, stock_id: int, simulation_id: int):
    statement = select(Position).where(Position.stock_id == stock_id, Position.simulation_id == simulation_id)
    return db.scalars(statement).one_or_none()

def get_positions_by_simulation_id(db: Session, simulation_id: int):
    statement = select(Position).where(Position.simulation_id == simulation_id).order_by(Position.position_id)
    return db.scalars(statement).all()

def create_position(db: Session, position: Position):
    db.add(position)
    db.flush()
    return position

def update_position(db: Session, position: Position):
    position_db = db.get(Position, position.position_id)
    if not position_db:
        return None
    
    for field, value in position.dict(exclude_unset=True).items():
        if value is not None:
            setattr(position_db, field, value)

    db.flush()
    return position

def delete_position(db: Session, position_id: int):
    position = db.get(Position, position_id)
    if position:
        db.delete(position)
        return True
    return False

def delete_positions(db: Session):
    result = db.execute(delete(Position))
    return result.rowcount or 0