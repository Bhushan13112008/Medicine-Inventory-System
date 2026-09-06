from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
from routers.login_router import login_router
from routers.medicine_router import medicine_router

app = FastAPI(
    title = "Login Page"
)

origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://*.vercel.app",
    "https://*.github.io",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(login_router)
app.include_router(medicine_router)