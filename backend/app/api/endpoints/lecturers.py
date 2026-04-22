from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
import io

from app.core.database import get_db
from app import models, schemas
from app.models import LecturerTypeEnum

router = APIRouter()

@router.get("/", response_model=List[schemas.Lecturer])
def read_lecturers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Lecturer).offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.Lecturer)
def create_lecturer(lecturer: schemas.LecturerCreate, db: Session = Depends(get_db)):
    db_lecturer = db.query(models.Lecturer).filter(models.Lecturer.lecturer_code == lecturer.lecturer_code).first()
    if db_lecturer:
        raise HTTPException(status_code=400, detail="Mã giảng viên đã tồn tại")
    
    new_lecturer = models.Lecturer(**lecturer.model_dump())
    db.add(new_lecturer)
    db.commit()
    db.refresh(new_lecturer)
    return new_lecturer

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
def get_lecturer_timetable_info(lecturer_id: int, session_id: Optional[int] = None, db: Session = Depends(get_db)):
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
            session_id=s.session_id, plan_name=s.plan_name, status=s.status.value
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
    if session_id:
        rows_query = rows_query.filter(models.TimetableRow.session_id == session_id)
    
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
