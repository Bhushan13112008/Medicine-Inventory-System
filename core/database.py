from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from core.config import settings
from sqlalchemy import MetaData
from typing import Generator

engine = create_engine(
    url = settings.DATABASE_URL,
    echo = True,
    future = True
)

SessionLocal = sessionmaker(
    autoflush = False,
    autocommit = False,
    bind = engine
)

class Base(DeclarativeBase):
    pass

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()