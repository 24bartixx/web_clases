from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from models.summary import Summary
from schemas.summary_schema import SummaryCreate

def get_summary_by_id(db: Session, summary_id: int):
    return db.get(Summary, summary_id)

def get_summaries_by_simulation_id(db: Session, simulation_id: int):
    statement = select(Summary).where(Summary.simulation_id == simulation_id).order_by(Summary.summary_id)
    return db.scalars(statement).all()

def get_summaries_by_stock_simulation_id(db: Session, stock_id: int, simulation_id: int):
    statement = select(Summary).where(Summary.stock_id == stock_id, Summary.simulation_id == simulation_id).order_by(Summary.summary_id)
    return db.scalars(statement).all()

def get_summaries_by_stock_date_range(db: Session, stock_id: int, start_date: datetime, end_date: datetime):
    statement = select(Summary).where(
        Summary.stock_id == stock_id,
        Summary.summary_time >= start_date,
        Summary.summary_time <= end_date
    ).order_by(Summary.summary_id)
    return db.scalars(statement).all()

def create_summary(db: Session, summary: SummaryCreate):
    summary = Summary(**summary.dict())
    db.add(summary)
    db.flush()
    return summary

def delete_summary(db: Session, summary_id: int):
    summary = db.get(Summary, summary_id)
    if summary:
        db.delete(summary)
        return True
    return False

def delete_summaries(db: Session):
    result = db.execute(delete(Summary))
    return result.rowcount or 0