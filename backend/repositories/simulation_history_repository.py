from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from models.simulation_history import SimulationHistory
from models.simulation import Simulation, SimulationHistoryUpdate

def get_simulation_histories_by_user_id(db: Session, user_id: int, skip: int = 0, limit: int = 10):
    statement = (
        select(SimulationHistory)
        .join(Simulation, Simulation.simulation_id == SimulationHistory.simulation_id)
        .where(Simulation.user_id == user_id)
        .order_by(SimulationHistory.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return db.scalars(statement).all()

def get_simulation_history_by_history_id(db: Session, history_id: int):
    return db.get(SimulationHistory, history_id)

def create_simulation_history(db: Session, simulation_history: SimulationHistory):
    db.add(simulation_history)
    db.flush()
    return simulation_history

def update_simulation_history(db: Session, simulation_history: SimulationHistoryUpdate):
    simulation_history_db = db.get(SimulationHistory, simulation_history.simulation_history_id)
    if not simulation_history_db:
        return None
    
    for field, value in simulation_history.dict(exclude_unset=True).items():
        if value is not None:
            setattr(simulation_history_db, field, value)

    db.flush()
    return simulation_history

def update_simulation_history_based_on_simulation_id(db: Session, history_id: int, simulation_id: int):
    simulation_history: SimulationHistory = db.get(SimulationHistory, history_id)
    simulation: Simulation = db.get(Simulation, simulation_id)

    simulation_history.balance = simulation.current_balance
    simulation_history.timestamp = simulation.updated_at

    db.flush()
    return simulation_history

def delete_simulation_history(db: Session, history_id: int):
    simulation_history = db.get(SimulationHistory, history_id)
    if simulation_history:
        db.delete(simulation_history)
        return True
    return False