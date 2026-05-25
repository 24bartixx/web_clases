from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from models.user import User

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.execute(select(User).order_by(User.id).offset(skip).limit(limit)).scalars().all()

def get_user_by_id(db: Session, user_id: int):
    return db.get(User, user_id)

def get_user_by_google_id(db: Session, google_id: str):
    statement = select(User).where(User.google_id == google_id)
    return db.scalars(statement).one_or_none()

def create_user(db: Session, google_id: str, name: str, surname: str | None, email: str, picture: str | None):
    user = User(
        google_id=google_id,
        name=name,
        surname=surname,
        email=email,
        picture=picture,
    )
    db.add(user)
    db.flush()
    return user

def delete_users(db: Session):
    result = db.execute(delete(User))
    return result.rowcount or 0