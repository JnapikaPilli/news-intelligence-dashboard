from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import jwt, JWTError
import os

from api.schemas import TokenResponse

router = APIRouter()

SECRET_KEY  = os.getenv("JWT_SECRET", "change-me-in-production")
ALGORITHM   = "HS256"
EXPIRE_MINS = 60 * 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

DEMO_USER = {
    "username": os.getenv("DEMO_USER", "admin"),
    "password": os.getenv("DEMO_PASS", "newslens123"),
}


def _create_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MINS)
    return jwt.encode({"sub": username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload  = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    if form.username != DEMO_USER["username"] or form.password != DEMO_USER["password"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(access_token=_create_token(form.username))


@router.get("/me")
async def me(current_user: str = Depends(get_current_user)):
    return {"username": current_user}
