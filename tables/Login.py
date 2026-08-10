from __future__ import annotations
from sqlalchemy import String, Uuid, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base
from uuid import uuid4, UUID
from datetime import datetime
from typing import Optional

class Login(Base):
    __tablename__ = "login"

    id:Mapped[UUID] = mapped_column(Uuid, primary_key = True, default = uuid4)
    name:Mapped[str] = mapped_column(String, nullable = False)
    email:Mapped[str] = mapped_column(String, unique = True, nullable = False)
    password:Mapped[str] = mapped_column(String, nullable = False)
    otp:Mapped[Optional[str]] = mapped_column(String, nullable = True, default = None)
    otp_timestamp:Mapped[Optional[datetime]] = mapped_column(DateTime(timezone = True), nullable = True, default = None)