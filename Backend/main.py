from fastapi import FastAPI
from core.database import Base, engine
from tables.Login import Login
from tables.Medicine import Medicine

Base.metadata.create_all(bind=engine)
app = FastAPI(title = "Medicine Inventory System")

@app.get("/")
def root():
    return {
        "message": "Medicine Inventory System API is Running!"
    }
