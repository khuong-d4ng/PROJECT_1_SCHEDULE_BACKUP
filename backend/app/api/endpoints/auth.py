from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app import models

router = APIRouter()

# ---------- Schemas ----------

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserInfo(BaseModel):
    user_id: int
    username: str
    email: Optional[str] = None
    role: str
    receive_emails: bool = True
    lecturer_id: Optional[int] = None
    full_name: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo

# ---------- Endpoints ----------

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == req.username).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Tên đăng nhập hoặc mật khẩu không đúng")

    # Get linked lecturer profile if exists
    lecturer_id = None
    full_name = None
    if user.lecturer_profile:
        lecturer_id = user.lecturer_profile.lecturer_id
        full_name = user.lecturer_profile.full_name

    token = create_access_token(data={"sub": str(user.user_id)})

    return LoginResponse(
        access_token=token,
        user=UserInfo(
            user_id=user.user_id,
            username=user.username,
            email=user.email,
            role=user.role.value,
            receive_emails=user.receive_emails,
            lecturer_id=lecturer_id,
            full_name=full_name or user.username,
        )
    )

@router.get("/me", response_model=UserInfo)
def get_me(current_user: models.User = Depends(get_current_user)):
    lecturer_id = None
    full_name = None
    if current_user.lecturer_profile:
        lecturer_id = current_user.lecturer_profile.lecturer_id
        full_name = current_user.lecturer_profile.full_name
    return UserInfo(
        user_id=current_user.user_id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role.value,
        receive_emails=current_user.receive_emails,
        lecturer_id=lecturer_id,
        full_name=full_name or current_user.username,
    )

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Đổi mật khẩu của người dùng hiện tại."""
    # 1. Xác thực mật khẩu cũ
    if not verify_password(req.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu hiện tại không chính xác."
        )

    # 2. Kiểm tra độ dài mật khẩu mới
    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu mới phải chứa ít nhất 6 ký tự."
        )

    # 3. Cập nhật mật khẩu mới
    current_user.password_hash = hash_password(req.new_password)
    db.commit()

    return {"message": "Đổi mật khẩu thành công!"}

@router.post("/seed")
def seed_default_accounts(db: Session = Depends(get_db)):
    """Tạo tài khoản mặc định Admin + Cán bộ xếp lịch. Chỉ chạy khi chưa có user nào."""
    existing = db.query(models.User).count()
    if existing > 0:
        return {"message": f"Đã có {existing} tài khoản trong hệ thống. Bỏ qua seed."}

    accounts = [
        {"username": "admin", "email": "admin@system.local", "password": "admin123", "role": models.RoleEnum.ADMIN},
        {"username": "canbo", "email": "canbo@system.local", "password": "canbo123", "role": models.RoleEnum.SCHEDULER},
    ]
    created = []
    for acc in accounts:
        user = models.User(
            username=acc["username"],
            email=acc["email"],
            password_hash=hash_password(acc["password"]),
            role=acc["role"],
        )
        db.add(user)
        created.append(acc["username"])

    db.commit()
    return {"message": f"Đã tạo {len(created)} tài khoản: {', '.join(created)}"}
