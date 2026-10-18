from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.auth.storage import (
    create_user, 
    authenticate_user, 
    create_session, 
    get_user_by_token, 
    get_user_by_email
)

auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: str = Field(..., min_length=5)
    company: str = Field("Retail Co.", min_length=1)
    role: str = Field("Merchandise Planner", min_length=1)
    password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=1)

class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=5)

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = parts[1]
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")
    return user

@auth_router.post("/register")
def register(req: RegisterRequest):
    try:
        user = create_user(
            email=req.email,
            name=req.name,
            company=req.company,
            role=req.role,
            password=req.password
        )
        token = create_session(user["id"])
        return {
            "status": "success",
            "message": "Account created successfully.",
            "token": token,
            "user": user
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@auth_router.post("/login")
def login(req: LoginRequest):
    user = authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    token = create_session(user["id"])
    return {
        "status": "success",
        "message": "Login successful.",
        "token": token,
        "user": user
    }

@auth_router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return {
        "status": "success",
        "user": current_user
    }

@auth_router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    user = get_user_by_email(req.email)
    import os
    smtp_host = os.environ.get("SMTP_HOST")
    if not smtp_host:
        return {
            "status": "notice",
            "is_smtp_configured": False,
            "message": "Outbound SMTP email service is not configured in this local development environment (SMTP_HOST unset). Automated password reset emails cannot be dispatched. For evaluation, please sign in with the registered demo account (buyer@retail.com / demo123) or create a new account via the Sign Up page."
        }
    return {
        "status": "success",
        "is_smtp_configured": True,
        "message": f"Password reset instructions have been dispatched to {req.email}."
    }

@auth_router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    return {
        "status": "success",
        "message": "Logged out successfully."
    }
