from __future__ import annotations
from sqlalchemy import String, Integer, Numeric, DateTime, Uuid, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base
from uuid import uuid4, UUID
from datetime import datetime, timezone

class Medicine(Base):
    __tablename__ = "medicine"

    user_id:Mapped[UUID] = mapped_column(ForeignKey("login.id"), nullable = False)
    id:Mapped[UUID] = mapped_column(Uuid, primary_key = True, default = uuid4)
    name:Mapped[str] = mapped_column(String, unique = False, nullable = False)
    generic_name:Mapped[str] = mapped_column(String, nullable = True)
    category:Mapped[str] = mapped_column(String, nullable = False)
    dosage_form:Mapped[str] = mapped_column(String, nullable = False)
    strength:Mapped[str] = mapped_column(String, nullable = True)
    stock_quantity:Mapped[int] = mapped_column(Integer, default = 0)
    reorder:Mapped[int] = mapped_column(Integer, default = 10)
    unit_price:Mapped[float] = mapped_column(Numeric, nullable = False)
    expiry_date:Mapped[datetime] = mapped_column(DateTime, nullable = False)
    manufacturer:Mapped[str] = mapped_column(String, nullable = True)
    created_at:Mapped[datetime] = mapped_column(DateTime, default = datetime.now(timezone.utc))