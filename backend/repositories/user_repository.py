from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from models.user import User
from schemas.user_schema import UserCreate, UserUpdate

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.execute(select(User).order_by(User.user_id).offset(skip).limit(limit)).scalars().all()

def get_user_by_id(db: Session, user_id: int):
    return db.get(User, user_id)

def get_user_by_oauth_id(db: Session, oauth_id: str):
    statement = select(User).where(User.oauth_id == oauth_id)
    return db.scalars(statement).one_or_none()

def create_user(db: Session, user: UserCreate):
    user_db = User(
        email=user.email,          
        oauth_id=user.oauth_id,       
        first_name=user.first_name,
        last_name=user.last_name,
        picture=user.picture,
    )
    db.add(user_db)
    db.flush()
    return user_db

def update_user(db: Session, user_id: int, user: UserUpdate):
    user_db = db.get(User, user_id)
    
    if not user_db:
        return None

    if user.email is not None:
        user_db.email = user.email
    if user.oauth_id is not None:
        user_db.oauth_id = user.oauth_id
    if user.first_name is not None:
        user_db.first_name = user.first_name
    if user.last_name is not None:
        user_db.last_name = user.last_name
    if user.picture is not None:
        user_db.picture = user.picture

    db.flush()
    return user_db

def delete_user(db: Session, user_id: int):
    user = db.get(User, user_id)
    if user:
        db.delete(user)
        return True
    return False

def delete_users(db: Session):
    result = db.execute(delete(User))
    return result.rowcount or 0