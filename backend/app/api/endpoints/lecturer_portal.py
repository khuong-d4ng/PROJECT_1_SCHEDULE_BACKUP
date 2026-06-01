"""API dành cho Giảng viên đăng ký nguyện vọng giảng dạy."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app import models
from app.api.endpoints.auth import UserInfo

router = APIRouter()

# ---------- Schemas ----------

class SubjectItem(BaseModel):
    subject_id: int
    subject_code: str
    subject_name: str
    credits: int
    theory_hours: int
    practice_hours: int

class OpenListResponse(BaseModel):
    list_id: int
    list_name: str
    description: Optional[str]
    created_at: str
    subjects: List[SubjectItem]

class MyRegistrationItem(BaseModel):
    registration_id: int
    subject_id: int
    subject_code: str
    subject_name: str
    is_main_lecturer: bool

class RegisterSubjectItem(BaseModel):
    subject_id: int
    is_main_lecturer: bool = True

class RegisterRequest(BaseModel):
    list_id: int
    subjects: List[RegisterSubjectItem]

class ProfileUpdateRequest(BaseModel):
    email: Optional[str] = None
    receive_emails: Optional[bool] = None

# ---------- Endpoints ----------

@router.get("/open-lists", response_model=List[OpenListResponse])
def get_open_lists(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trả về các đợt đăng ký đang mở, kèm danh sách môn khả dụng."""
    lists = (
        db.query(models.RegistrationList)
        .filter(models.RegistrationList.is_open == True)
        .order_by(models.RegistrationList.created_at.desc())
        .all()
    )
    result = []
    for rlist in lists:
        subjects = []
        for rls in rlist.available_subjects:
            subj = rls.subject
            subjects.append(SubjectItem(
                subject_id=subj.subject_id,
                subject_code=subj.subject_code,
                subject_name=subj.subject_name,
                credits=subj.credits,
                theory_hours=subj.theory_hours,
                practice_hours=subj.practice_hours,
            ))
        result.append(OpenListResponse(
            list_id=rlist.list_id,
            list_name=rlist.list_name,
            description=rlist.description,
            created_at=str(rlist.created_at),
            subjects=subjects,
        ))
    return result


@router.get("/my-registrations", response_model=List[MyRegistrationItem])
def get_my_registrations(
    list_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lấy các môn mà GV hiện tại đã đăng ký trong 1 đợt."""
    if not current_user.lecturer_profile:
        raise HTTPException(status_code=400, detail="Tài khoản không liên kết với giảng viên")
    
    lecturer_id = current_user.lecturer_profile.lecturer_id
    regs = (
        db.query(models.LecturerRegistration)
        .join(models.Subject, models.LecturerRegistration.subject_id == models.Subject.subject_id)
        .filter(
            models.LecturerRegistration.list_id == list_id,
            models.LecturerRegistration.lecturer_id == lecturer_id,
        )
        .all()
    )
    return [
        MyRegistrationItem(
            registration_id=r.registration_id,
            subject_id=r.subject.subject_id,
            subject_code=r.subject.subject_code,
            subject_name=r.subject.subject_name,
            is_main_lecturer=r.is_main_lecturer,
        )
        for r in regs
    ]


@router.post("/register")
def register_subjects(
    req: RegisterRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """GV gửi nguyện vọng đăng ký môn dạy."""
    if not current_user.lecturer_profile:
        raise HTTPException(status_code=400, detail="Tài khoản không liên kết với giảng viên")
    
    lecturer_id = current_user.lecturer_profile.lecturer_id
    
    # Kiểm tra đợt đăng ký có đang mở không
    rlist = db.query(models.RegistrationList).filter(models.RegistrationList.list_id == req.list_id).first()
    if not rlist:
        raise HTTPException(status_code=404, detail="Không tìm thấy đợt đăng ký")
    if not rlist.is_open:
        raise HTTPException(status_code=400, detail="Đợt đăng ký này đã đóng")
    
    # Xóa các đăng ký cũ của GV này trong đợt này
    db.query(models.LecturerRegistration).filter(
        models.LecturerRegistration.list_id == req.list_id,
        models.LecturerRegistration.lecturer_id == lecturer_id,
    ).delete()
    
    # Thêm mới
    for item in req.subjects:
        db.add(models.LecturerRegistration(
            list_id=req.list_id,
            lecturer_id=lecturer_id,
            subject_id=item.subject_id,
            is_main_lecturer=item.is_main_lecturer,
            created_by_lecturer=True,
        ))
    
    db.commit()
    return {"message": f"Đã lưu {len(req.subjects)} nguyện vọng thành công!"}


@router.put("/profile", response_model=UserInfo)
def update_profile(
    req: ProfileUpdateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cập nhật email nhận thông báo và tùy chọn nhận email của giảng viên hiện tại."""
    email_val = req.email
    if email_val is not None:
        email_val = email_val.strip()
        if email_val == "":
            email_val = None
    
    # Check unique constraint if email_val is not None
    if email_val is not None:
        existing_email_user = db.query(models.User).filter(
            models.User.email == email_val,
            models.User.user_id != current_user.user_id
        ).first()
        if existing_email_user:
            raise HTTPException(status_code=400, detail="Email này đã được sử dụng bởi tài khoản khác")

    current_user.email = email_val

    # If email is empty (None), receive_emails MUST be False.
    if current_user.email is None:
        current_user.receive_emails = False
    elif req.receive_emails is not None:
        current_user.receive_emails = req.receive_emails

    db.commit()
    db.refresh(current_user)

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
