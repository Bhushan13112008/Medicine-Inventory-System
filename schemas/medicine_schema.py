from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class MedicineRequest(BaseModel):
    name: str
    generic_name: str | None = None
    category: str
    dosage_form: str
    strength: str | None = None
    stock_quantity: int
    reorder: int
    unit_price: float
    expiry_date: datetime
    manufacturer: str | None = None

class MedicineResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)

    id: UUID
    user_id: UUID
    name: str
    generic_name: str | None = None
    category: str
    dosage_form: str
    strength: str | None = None
    stock_quantity: int
    reorder: int
    unit_price: float
    expiry_date: datetime
    manufacturer: str | None = None
    created_at: datetime

class MedicineUpdate(BaseModel):
    name: str | None = None
    generic_name: str | None = None
    category: str | None = None
    dosage_form: str | None = None
    strength: str | None = None
    stock_quantity: int | None = None
    reorder: int | None = None
    unit_price: float | None = None
    expiry_date: datetime | None = None
    manufacturer: str | None = None