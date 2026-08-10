from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from uuid import UUID
from pydantic import EmailStr
from sqlalchemy.orm import Session
from core.database import get_db
from tables.Login import Login
from datetime import datetime, timedelta, timezone
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import random
from schemas.login_schema import LoginRequest, LoginResponse, RequestOTP, ReturnPasswordRequest, TokenResponse
from schemas.login_schema import Updatepassword, DeleteAccount, DeleteOTPRequest, CreateAccount
import os

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Login:
    token = credentials.credentials
    
    # Extract UUID from the "session_token_<uuid>" format generated during sign-in
    if token.startswith("session_token_"):
        user_id_str = token.replace("session_token_", "")
    else:
        user_id_str = token

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token format"
        )

    user = db.query(Login).filter(Login.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or session expired"
        )
        
    return user

login_router = APIRouter(prefix = "/login", tags = ["login"])

def send_email_smtp(to_email: str, subject: str, html_body: str):
    sender_email = os.getenv("MAIL_USERNAME")
    sender_password = os.getenv("MAIL_PASSWORD")
    if not sender_email or not sender_password:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email credentials are not configured in environment variables."
        )
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, msg.as_string())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )

@login_router.post("/sign-in", response_model=TokenResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Login).filter(Login.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if (payload.password != user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    return TokenResponse(
        access_token=f"session_token_{user.id}",
        token_type="bearer"
    )

@login_router.post("/sign_up", response_model = LoginResponse, status_code = status.HTTP_201_CREATED)
def create_user(payload: CreateAccount, db: Session = Depends(get_db)):
    existing_user = db.query(Login).filter(Login.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST, detail = "Email is already registered")

    new_user = Login(
        name = payload.name,
        email = payload.email,
        password = payload.password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@login_router.get("/read_one", response_model = LoginResponse)
def get_user(email: EmailStr, db: Session = Depends(get_db)):
    user = db.query(Login).filter(Login.email == email).first()
    if (not user):
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND, detail = "There is no record of the user in database"
        )

    return user

@login_router.post("/request-otp")
def request_otp(payload: RequestOTP, db: Session = Depends(get_db)):
    user = db.query(Login).filter(Login.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND, detail = "Email entered is incorrect or not signed up"
        )
    otp = f"{random.randint(100000, 999999)}"
    user.otp = otp
    now = datetime.now(timezone.utc)
    five_minutes = now + timedelta(minutes = 5)
    user.otp_timestamp = five_minutes
    db.commit()
    send_email_smtp(
        payload.email,
        "OTP Request for password reset",
        f"<p> OTP is <strong>{otp}</strong>. It is only valid for 5 minutes </p>"
    )

    return {"message": "OTP sent successfully to your email"}

@login_router.post("/forgot_password")
def update_password(payload: ReturnPasswordRequest, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    user = db.query(Login).filter(Login.email == payload.email).first()
    if not user:
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, detail = "User not found")
    if not user.otp or not user.otp_timestamp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No active OTP request found. Please request a new one."
        )
    otp_time = user.otp_timestamp
    if otp_time.tzinfo is None:
        otp_time = otp_time.replace(tzinfo=timezone.utc)
    if (user.otp == payload.otp and otp_time >= now):
        user.password = payload.new_password
        user.otp = None
        user.otp_timestamp = None
        db.commit()
        return {"message": "Your account password changed successfully!"}
    else:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST, detail = "OTP is incorrect or it is expired"
            )

@login_router.post("/reset-password")
def reset_password(payload: Updatepassword, db: Session = Depends(get_db)):
    user = db.query(Login).filter(Login.email == payload.email).first()
    if not user:
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, detail = "User not found or Incorrect email")
    if (user.password != payload.current_password):
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST, detail = "Entered Current password is incorrect")
    if ((payload.current_password.strip()).lower() == (payload.new_password.strip()).lower()):
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST, detail = "Enter new password except the current password"
            )
    user.password = payload.new_password
    db.commit()

    return {"message": "Your account password has been changed successfully"}

@login_router.post("/delete-otp-request")
def deleterequest(payload: DeleteOTPRequest, db: Session = Depends(get_db)):
    user = db.query(Login).filter(Login.email == payload.email).first()
    if not user:
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, detail = "User not found")
    otp = f"{random.randint(100000, 999999)}"
    user.otp = otp
    now = datetime.now(timezone.utc)
    user.otp_timestamp = now + timedelta(minutes=5)
    db.commit()
    send_email_smtp(
        payload.email,
        "OTP Request for account deletion",
        f"<p> OTP is <strong>{otp}</strong>. It is only valid for 5 minutes </p>"
    )

    return {"message": "OTP sent sucessfully on your Email"}

@login_router.post("/delete_account")
def delete_account(payload: DeleteAccount, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    user = db.query(Login).filter(Login.email == payload.email).first()
    if not user:
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, detail = "User not found")
    if not user.otp or not user.otp_timestamp:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST, detail = "No active OTP request found. Please request a new one."
        )
    otp_time = user.otp_timestamp
    if otp_time.tzinfo is None:
        otp_time = otp_time.replace(tzinfo=timezone.utc)
    if user.otp == payload.otp and otp_time >= now:
        db.delete(user)
        db.commit()
        return {"message": "Your account deletion is succesful"}
    else:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST, detail = "OTP is incorrect or it has expired"
        )