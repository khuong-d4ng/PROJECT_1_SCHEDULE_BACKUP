from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import pandas as pd
import io

from app.core.database import get_db
from app.core.security import hash_password
from app import models, schemas
from app.models import LecturerTypeEnum

router = APIRouter()

class LecturerCreateWithAccount(schemas.LecturerCreate):
    account_username: Optional[str] = None
    account_password: Optional[str] = None

@router.get("/", response_model=List[schemas.Lecturer])
def read_lecturers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Lecturer).offset(skip).limit(limit).all()

@router.get("/{lecturer_id}", response_model=schemas.Lecturer)
def read_lecturer(lecturer_id: int, db: Session = Depends(get_db)):
    db_lecturer = db.query(models.Lecturer).filter(models.Lecturer.lecturer_id == lecturer_id).first()
    if not db_lecturer:
        raise HTTPException(status_code=404, detail="Không tìm thấy giảng viên")
    return db_lecturer

@router.post("/", response_model=schemas.Lecturer)
def create_lecturer(lecturer: LecturerCreateWithAccount, db: Session = Depends(get_db)):
    db_lecturer = db.query(models.Lecturer).filter(models.Lecturer.lecturer_code == lecturer.lecturer_code).first()
    if db_lecturer:
        raise HTTPException(status_code=400, detail="Mã giảng viên đã tồn tại")
    
    # Create User account for the lecturer
    username = lecturer.account_username or lecturer.lecturer_code
    password = lecturer.account_password or "123456"
    
    existing_user = db.query(models.User).filter(models.User.username == username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail=f"Username '{username}' đã tồn tại")
    
    # Process email
    email_val = lecturer.email
    if email_val is not None:
        email_val = email_val.strip()
        if email_val == "":
            email_val = None

    if email_val is not None:
        existing_email = db.query(models.User).filter(models.User.email == email_val).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email này đã được sử dụng bởi tài khoản khác")

    user = models.User(
        username=username,
        email=email_val,
        password_hash=hash_password(password),
        role=models.RoleEnum.LECTURER,
        receive_emails=False if email_val is None else True,
    )
    db.add(user)
    db.flush()  # Get user_id
    
    lec_data = lecturer.model_dump(exclude={"account_username", "account_password", "email"})
    lec_data["user_id"] = user.user_id
    new_lecturer = models.Lecturer(**lec_data)
    db.add(new_lecturer)
    db.commit()
    db.refresh(new_lecturer)
    return new_lecturer

@router.put("/{lecturer_id}", response_model=schemas.Lecturer)
def update_lecturer(lecturer_id: int, lecturer: schemas.LecturerUpdate, db: Session = Depends(get_db)):
    db_lecturer = db.query(models.Lecturer).filter(models.Lecturer.lecturer_id == lecturer_id).first()
    if not db_lecturer:
        raise HTTPException(status_code=404, detail="Không tìm thấy giảng viên")
    
    update_data = lecturer.model_dump(exclude_unset=True)
    
    if "lecturer_code" in update_data and update_data["lecturer_code"] != db_lecturer.lecturer_code:
        existing = db.query(models.Lecturer).filter(models.Lecturer.lecturer_code == update_data["lecturer_code"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Mã giảng viên đã tồn tại")

    if "email" in update_data:
        email_val = update_data.pop("email")
        if email_val is not None:
            email_val = email_val.strip()
            if email_val == "":
                email_val = None
        
        if email_val is not None:
            existing_email = db.query(models.User).filter(
                models.User.email == email_val,
                models.User.user_id != db_lecturer.user_id
            ).first()
            if existing_email:
                raise HTTPException(status_code=400, detail="Email này đã được sử dụng bởi tài khoản khác")
        
        if db_lecturer.user:
            db_lecturer.user.email = email_val
            # If email is empty, disable email notifications
            if email_val is None:
                db_lecturer.user.receive_emails = False

    for key, value in update_data.items():
        setattr(db_lecturer, key, value)
        
    db.commit()
    db.refresh(db_lecturer)
    return db_lecturer

@router.delete("/{lecturer_id}")
def delete_lecturer(lecturer_id: int, db: Session = Depends(get_db)):
    db_lecturer = db.query(models.Lecturer).filter(models.Lecturer.lecturer_id == lecturer_id).first()
    if not db_lecturer:
        raise HTTPException(status_code=404, detail="Không tìm thấy giảng viên")
    
    user_id = db_lecturer.user_id
    try:
        db.delete(db_lecturer)
        if user_id:
            db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
            if db_user:
                db.delete(db_user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Không thể xóa giảng viên này vì đã có dữ liệu liên kết (nguyện vọng đăng ký hoặc lịch giảng dạy)."
        )
    return {"message": "Xóa giảng viên thành công"}

# --- Thêm mới chức năng Import Web ---

class LecturerImportItem(schemas.LecturerBase):
    pass

@router.post("/import/preview", response_model=List[LecturerImportItem])
async def preview_lecturers_import(file: UploadFile = File(...)):
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Vui lòng tải lên file định dạng Excel (.xlsx)")
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        # Ensure column headers are clean
        df.columns = [str(c).strip() for c in df.columns]
        
        preview_data = []
        for index, row in df.iterrows():
            code = str(row.get('MA ĐINH DANH CU', '')).strip()
            name = str(row.get('HỌ VÀ TÊN', '')).strip()
            role = str(row.get('Chức vụ', '')).strip()
            
            if pd.isna(code) or not code or code == 'nan':
                continue
                
            l_type = LecturerTypeEnum.FULL_TIME
            if 'thực hành' in role.lower():
                l_type = LecturerTypeEnum.VISITING
                
            preview_data.append(LecturerImportItem(
                lecturer_code=code,
                full_name=name,
                type=l_type,
                position=role if role != 'nan' else None,
                max_quota=0
            ))
        return preview_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý file: {str(e)}")

@router.post("/import/commit")
def commit_lecturers_import(items: List[LecturerImportItem], db: Session = Depends(get_db)):
    try:
        codes = [item.lecturer_code for item in items]
        # Xóa các giảng viên cũ để nạp đè lại (Theo tính chất Import)
        db.query(models.Lecturer).filter(models.Lecturer.lecturer_code.in_(codes)).delete(synchronize_session=False)
        
        new_records = []
        for item in items:
            new_records.append(models.Lecturer(**item.model_dump()))
            
        db.add_all(new_records)
        db.commit() # Thực hiện trong 1 Transaction duy nhất
        return {"message": f"Đã Import và ghi đè {len(items)} giảng viên thành công!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi cơ sở dữ liệu: {str(e)}")


# --- Lecturer Profile APIs ---

@router.get("/{lecturer_id}/registrations", response_model=List[schemas.LecturerRegistrationItem])
def get_lecturer_registrations(lecturer_id: int, list_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Lấy danh sách các môn đã được phân công cho giảng viên từ bảng nguyện vọng giảng dạy."""
    query = (
        db.query(
            models.LecturerRegistration,
            models.Subject,
            models.RegistrationList
        )
        .join(models.Subject, models.LecturerRegistration.subject_id == models.Subject.subject_id)
        .join(models.RegistrationList, models.LecturerRegistration.list_id == models.RegistrationList.list_id)
        .filter(models.LecturerRegistration.lecturer_id == lecturer_id)
    )
    if list_id:
        query = query.filter(models.LecturerRegistration.list_id == list_id)
    
    results = query.all()
    items = []
    for reg, subj, rlist in results:
        items.append(schemas.LecturerRegistrationItem(
            subject_id=subj.subject_id,
            subject_code=subj.subject_code,
            subject_name=subj.subject_name,
            credits=subj.credits,
            is_main_lecturer=reg.is_main_lecturer,
            list_id=rlist.list_id,
            list_name=rlist.list_name,
        ))
    return items


@router.get("/{lecturer_id}/timetable-info", response_model=schemas.LecturerTimetableInfoResponse)
def get_lecturer_timetable_info(lecturer_id: int, session_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Lấy thông tin lịch dạy chi tiết của giảng viên từ các TKB (timetable_rows)."""
    from sqlalchemy import or_
    
    # 1. Tìm tất cả sessions mà GV tham gia
    session_subq = (
        db.query(models.TimetableRow.session_id)
        .filter(
            or_(
                models.TimetableRow.main_lecturer_id == lecturer_id,
                models.TimetableRow.prac_lecturer_id == lecturer_id
            )
        )
        .distinct()
        .subquery()
    )
    sessions = (
        db.query(models.SchedulingSession)
        .filter(models.SchedulingSession.session_id.in_(session_subq))
        .all()
    )
    session_items = [
        schemas.LecturerTimetableSessionItem(
            session_id=s.session_id, plan_name=s.plan_name, status=s.status.value, description=s.description
        )
        for s in sessions
    ]
    
    # 2. Lấy rows chi tiết
    rows_query = (
        db.query(models.TimetableRow, models.Subject, models.SchedulingSession)
        .join(models.Subject, models.TimetableRow.subject_id == models.Subject.subject_id)
        .join(models.SchedulingSession, models.TimetableRow.session_id == models.SchedulingSession.session_id)
        .filter(
            or_(
                models.TimetableRow.main_lecturer_id == lecturer_id,
                models.TimetableRow.prac_lecturer_id == lecturer_id
            )
        )
    )
    if session_id and session_id != "all":
        try:
            sess_id_int = int(session_id)
            rows_query = rows_query.filter(models.TimetableRow.session_id == sess_id_int)
        except ValueError:
            pass
    
    raw_rows = rows_query.all()
    
    row_items = []
    slots_set = set()
    class_names = set()
    subject_ids = set()
    total_hours = 0
    
    for tr, subj, sess in raw_rows:
        # Xác định role (LT hay TH)
        role = "LT" if tr.main_lecturer_id == lecturer_id else "TH"
        hours = subj.theory_hours if role == "LT" else subj.practice_hours
        total_hours += hours
        class_names.add(tr.class_name)
        subject_ids.add(subj.subject_id)
        
        # Thu thập slots
        if tr.morning_day:
            day_num = tr.morning_day.replace("S-T", "")
            slots_set.add(f"Sáng T{day_num}")
        if tr.afternoon_day:
            day_num = tr.afternoon_day.replace("C-T", "")
            slots_set.add(f"Chiều T{day_num}")
        
        row_items.append(schemas.LecturerTimetableRowItem(
            row_id=tr.row_id,
            session_id=sess.session_id,
            plan_name=sess.plan_name,
            class_name=tr.class_name,
            subject_code=subj.subject_code,
            subject_name=subj.subject_name,
            theory_hours=subj.theory_hours,
            practice_hours=subj.practice_hours,
            fixed_shift=tr.fixed_shift,
            morning_day=tr.morning_day,
            afternoon_day=tr.afternoon_day,
            role=role,
            start_date=tr.start_date,
            end_date=tr.end_date,
        ))
    
    # Sắp xếp slots theo thứ tự tuần
    day_order = {"T2": 2, "T3": 3, "T4": 4, "T5": 5, "T6": 6, "T7": 7}
    sorted_slots = sorted(
        slots_set,
        key=lambda s: (day_order.get(s.split(" ")[1], 99), 0 if "Sáng" in s else 1)
    )
    
    summary = schemas.LecturerTimetableSummary(
        total_classes=len(class_names),
        total_subjects=len(subject_ids),
        total_hours=total_hours,
        slots=sorted_slots,
    )
    
    return schemas.LecturerTimetableInfoResponse(
        sessions=session_items,
        rows=row_items,
        summary=summary,
    )
