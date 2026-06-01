from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import hash_password, require_role, get_current_user
from app import models

router = APIRouter()

# ---------- Schemas ----------
class UserCreateSchema(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    role: models.RoleEnum

class UserUpdateSchema(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    email: Optional[str] = None
    role: Optional[models.RoleEnum] = None
    receive_emails: Optional[bool] = None

class LecturerInfo(BaseModel):
    lecturer_id: int
    lecturer_code: str
    full_name: str

    class Config:
        from_attributes = True

class UserResponseSchema(BaseModel):
    user_id: int
    username: str
    email: Optional[str] = None
    role: models.RoleEnum
    receive_emails: bool
    lecturer_profile: Optional[LecturerInfo] = None

    class Config:
        from_attributes = True

# ---------- Endpoints ----------

@router.get("/", response_model=List[UserResponseSchema], dependencies=[Depends(require_role("Admin"))])
def get_users(db: Session = Depends(get_db)):
    """Lấy danh sách tất cả tài khoản trong hệ thống."""
    return db.query(models.User).order_by(models.User.user_id.desc()).all()

@router.post("/", response_model=UserResponseSchema, dependencies=[Depends(require_role("Admin"))])
def create_user(payload: UserCreateSchema, db: Session = Depends(get_db)):
    """Tạo mới tài khoản người dùng."""
    # Check duplicate username
    existing_user = db.query(models.User).filter(models.User.username == payload.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên đăng nhập đã tồn tại trong hệ thống."
        )

    # Check duplicate email if provided
    if payload.email:
        existing_email = db.query(models.User).filter(models.User.email == payload.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email đã được đăng ký bởi tài khoản khác."
            )

    new_user = models.User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        receive_emails=True
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lưu tài khoản: {str(e)}"
        )

@router.put("/{user_id}", response_model=UserResponseSchema, dependencies=[Depends(require_role("Admin"))])
def update_user(user_id: int, payload: UserUpdateSchema, db: Session = Depends(get_db)):
    """Cập nhật thông tin tài khoản người dùng."""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tài khoản không tồn tại."
        )

    # Check duplicate username
    if payload.username and payload.username != user.username:
        existing = db.query(models.User).filter(models.User.username == payload.username).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tên đăng nhập đã tồn tại."
            )
        user.username = payload.username

    # Check duplicate email
    if payload.email is not None and payload.email != user.email:
        if payload.email:
            existing = db.query(models.User).filter(models.User.email == payload.email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email đã được đăng ký."
                )
        user.email = payload.email

    if payload.password:
        user.password_hash = hash_password(payload.password)

    if payload.role is not None:
        user.role = payload.role

    if payload.receive_emails is not None:
        user.receive_emails = payload.receive_emails

    try:
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi cập nhật: {str(e)}"
        )

@router.delete("/{user_id}", dependencies=[Depends(require_role("Admin"))])
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Xóa tài khoản người dùng."""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tài khoản không tồn tại."
        )

    if user.user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn không thể tự xóa tài khoản của chính mình."
        )

    # If user has a linked lecturer profile, handle it nicely
    if user.lecturer_profile:
        # Check if they have registrations or timetables, if yes restrict delete
        lecturer = user.lecturer_profile
        if len(lecturer.registrations) > 0 or len(lecturer.schedules) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tài khoản giảng viên này đã có đăng ký nguyện vọng hoặc lịch giảng dạy lịch sử. Không thể xóa trực tiếp."
            )
        # Otherwise, delete lecturer profile first to avoid foreign key violations
        db.delete(lecturer)

    try:
        db.delete(user)
        db.commit()
        return {"message": "Đã xóa tài khoản thành công."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi xóa tài khoản: {str(e)}"
        )
