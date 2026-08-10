from fastapi import APIRouter, Depends, HTTPException, status
from schemas.medicine_schema import MedicineRequest, MedicineResponse, MedicineUpdate
from sqlalchemy.orm import Session
from core.database import get_db
from tables.Medicine import Medicine
from typing import List
from uuid import UUID
from routers.login_router import get_current_user

medicine_router = APIRouter(prefix = "/medicine", tags = ["medicine"])

@medicine_router.post("/create_medicine",response_model = MedicineResponse, status_code = status.HTTP_201_CREATED)
def create_medicine(payload: MedicineRequest, db: Session = Depends(get_db),current_user = Depends(get_current_user)):
    medicine = db.query(Medicine).filter(
        Medicine.name.ilike(payload.name.strip()),
        Medicine.user_id == current_user.id
    ).first()
    
    if medicine:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Medicine data is already present in database"
        )
    
    # Create new medicine attached to current_user.id
    new_medicine = Medicine(**payload.model_dump(), user_id=current_user.id)
    db.add(new_medicine)
    db.commit()
    db.refresh(new_medicine)

    return new_medicine

@medicine_router.get("/medicines", response_model = List[MedicineResponse])
def get_all_medicines(
    name: str = None,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Medicine).filter(Medicine.user_id == current_user.id)
    if name:
        query = query.filter(Medicine.name.ilike(f"%{name.strip()}%"))
        
    return query.offset(skip).limit(limit).all()

@medicine_router.get("/medicines/{medicine_id}", response_model = MedicineResponse)
def get_by_id(medicine_id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    medicine = db.query(Medicine).filter(
        Medicine.id == medicine_id,
        Medicine.user_id == current_user.id
    ).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Medicine with id {medicine_id} not found in the database"
        )
    
    return medicine

@medicine_router.patch("/medicines/{medicine_id}", response_model = MedicineResponse)
def update_medicine(
    medicine_id: UUID,
    payload: MedicineUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user) 
):
    medicine = db.query(Medicine).filter(
        Medicine.id == medicine_id,
        Medicine.user_id == current_user.id
    ).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Medicine with id {medicine_id} not found"
        )

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(medicine, key, value)
    db.commit()
    db.refresh(medicine)

    return medicine

@medicine_router.delete("/medicines/{medicine_id}", status_code = status.HTTP_204_NO_CONTENT)
def delete_medicine(medicine_id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    medicine = db.query(Medicine).filter(
        Medicine.id == medicine_id,
        Medicine.user_id == current_user.id
    ).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Medicine with id {medicine_id} not found"
        )
    db.delete(medicine)
    db.commit()

    return None    