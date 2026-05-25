from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from models.user import User
from schemas.user_schema import UserBase, UserUpdate

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.execute(select(User).order_by(User.user_id).offset(skip).limit(limit)).scalars().all()

def get_user_by_id(db: Session, user_id: int):
    return db.get(User, user_id)

def get_user_by_google_id(db: Session, google_id: str):
    statement = select(User).where(User.google_id == google_id)
    return db.scalars(statement).one_or_none()

def create_user(db: Session, user: UserBase):
    user = User(**user.dict())
    db.add(user)
    db.flush()
    return user

def update_user(db: Session, user: UserUpdate):
    user_db = db.get(User, user.user_id)
    
    if not user_db:
        return None

    for field, value in user.dict(exclude_unset=True).items():
        if value is not None:
            setattr(user_db, field, value)

    db.flush()
    return user

def delete_user(db: Session, user_id: int):
    user = db.get(User, user_id)
    if user:
        db.delete(user)
        return True
    return False

def delete_users(db: Session):
    result = db.execute(delete(User))
    return result.rowcount or 0
