from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import exc
from typing import List, Optional
from pydantic import BaseModel
import pandas as pd
import io
import re
from datetime import datetime

from app.core.database import get_db
from app import models, schemas
from app.models import Semester, SemesterStatusEnum
from fastapi.responses import Response

router = APIRouter()

# --- 1. API: QUẢN LÝ CÁC PHIÊN BẢN (REGISTRATION LISTS) ---

@router.get("/lists", response_model=List[schemas.RegistrationListResponse])
def get_registration_lists(db: Session = Depends(get_db)):
    return db.query(models.RegistrationList).order_by(models.RegistrationList.created_at.desc()).all()

@router.post("/lists", response_model=schemas.RegistrationListResponse)
def create_registration_list(list_data: schemas.RegistrationListCreate, db: Session = Depends(get_db)):
    db_list = models.RegistrationList(**list_data.model_dump())
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    return db_list

@router.delete("/lists/{list_id}")
def delete_registration_list(list_id: int, db: Session = Depends(get_db)):
    db_list = db.query(models.RegistrationList).filter(models.RegistrationList.list_id == list_id).first()
    if not db_list:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh sách")
    db.delete(db_list)
    db.commit()
    return {"message": "Đã xóa danh sách thành công"}


# --- 2. API: QUẢN LÝ DỮ LIỆU NGUYỆN VỌNG BÊN TRONG 1 LIST ---

class RegistrationResponseItem(BaseModel):
    id: int
    lecturer_id: int
    lecturer_name: str
    lecturer_code: str
    subject_id: int
    subject_name: str
    subject_code: str
    is_main_lecturer: bool

@router.get("/lists/{list_id}/detailed", response_model=List[RegistrationResponseItem])
def get_registrations_by_list(list_id: int, db: Session = Depends(get_db)):
    regs = db.query(models.LecturerRegistration)\
        .join(models.Subject, models.LecturerRegistration.subject_id == models.Subject.subject_id)\
        .join(models.Lecturer, models.LecturerRegistration.lecturer_id == models.Lecturer.lecturer_id)\
        .filter(models.LecturerRegistration.list_id == list_id)\
        .all()
        
    results = []
    for r in regs:
        results.append(RegistrationResponseItem(
            id=r.registration_id,
            lecturer_id=r.lecturer.lecturer_id,
            lecturer_name=r.lecturer.full_name,
            lecturer_code=r.lecturer.lecturer_code,
            subject_id=r.subject.subject_id,
            subject_name=r.subject.subject_name,
            subject_code=r.subject.subject_code,
            is_main_lecturer=r.is_main_lecturer
        ))
    return results

class RegistrationAssignmentItem(BaseModel):
    lecturer_id: int
    subject_id: int
    is_main_lecturer: bool

class BulkSavePayload(BaseModel):
    assignments: List[RegistrationAssignmentItem]

@router.post("/lists/{list_id}/save")
def save_registration_list(list_id: int, payload: BulkSavePayload, db: Session = Depends(get_db)):
    """ API nhắm tới việc nhận toàn bộ kết quả Drag & Drop từ Frontend để lưu thẳng xuống DB """
    db_list = db.query(models.RegistrationList).filter(models.RegistrationList.list_id == list_id).first()
    if not db_list:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên bản danh sách")
        
    try:
        # Xóa toàn bộ chi tiết cũ của List này
        db.query(models.LecturerRegistration).filter(models.LecturerRegistration.list_id == list_id).delete()
        
        # Tạo chèn toàn bộ chi tiết mới
        new_records = []
        for item in payload.assignments:
            new_records.append(models.LecturerRegistration(
                list_id=list_id,
                lecturer_id=item.lecturer_id,
                subject_id=item.subject_id,
                is_main_lecturer=item.is_main_lecturer
            ))
        db.add_all(new_records)
        db.commit()
        return {"message": f"Chốt danh sách thành công! (Lưu tổng cộng {len(new_records)} nguyện vọng)"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu bảng phân công: {str(e)}")

@router.get("/lists/{list_id}/export")
def export_registration_list(list_id: int, db: Session = Depends(get_db)):
    db_list = db.query(models.RegistrationList).filter(models.RegistrationList.list_id == list_id).first()
    if not db_list:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên bản danh sách")
        
    regs = db.query(models.LecturerRegistration).filter(models.LecturerRegistration.list_id == list_id).all()
    
    # Gom theo môn học, giống format file gốc
    subject_map: dict = {}  # subject_id -> { name, code, main: [], prac: [] }
    for r in regs:
        sid = r.subject_id
        if sid not in subject_map:
            subject_map[sid] = {
                "name": r.subject.subject_name,
                "code": r.subject.subject_code,
                "main": [],
                "prac": []
            }
        lec_str = f"{r.lecturer.full_name} - {r.lecturer.lecturer_code}"
        if r.is_main_lecturer:
            subject_map[sid]["main"].append(lec_str)
        else:
            subject_map[sid]["prac"].append(lec_str)
    
    rows = []
    for sid, info in subject_map.items():
        rows.append({
            "Tên học phần": info["name"],
            "Mã học phần": info["code"],
            "Giảng viên chính": "; ".join(info["main"]) if info["main"] else "",
            "Giảng viên thực hành": "; ".join(info["prac"]) if info["prac"] else ""
        })
    
    df = pd.DataFrame(rows, columns=["Tên học phần", "Mã học phần", "Giảng viên chính", "Giảng viên thực hành"])
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Phân công giảng dạy")
    
    output.seek(0)
    
    from fastapi.responses import StreamingResponse
    from urllib.parse import quote
    
    filename = f"PhanCong_Dot_{list_id}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"
        }
    )
    
# --- 3. API: IMPORT TỪ EXCEL CHO 1 LIST ---

class RegistrationPreviewItem(BaseModel):
    subject_name: str
    subject_code: str
    main_lecturers_text: str
    practice_lecturers_text: str

@router.post("/import/preview", response_model=List[RegistrationPreviewItem])
async def preview_registrations_import(file: UploadFile = File(...)):
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Vui lòng tải lên file định dạng Excel")
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        df.columns = [str(c).strip() for c in df.columns]
        
        preview_data = []
        temp_count = 1
        
        for index, row in df.iterrows():
            subj_name = str(row.get('Tên học phần', '')).strip()
            if not subj_name or subj_name == 'nan':
                continue
                
            subj_code = str(row.get('Mã học phần', '')).strip()
            if not subj_code or subj_code == 'nan':
                subj_code = f"TEMP_X{temp_count:03d}"
                temp_count += 1
                
            main_lec = str(row.get('Giảng viên chính', '')).strip()
            prac_lec = str(row.get('Giảng viên thực hành', '')).strip()
            
            preview_data.append(RegistrationPreviewItem(
                subject_name=subj_name,
                subject_code=subj_code,
                main_lecturers_text=main_lec if main_lec != 'nan' else '',
                practice_lecturers_text=prac_lec if prac_lec != 'nan' else ''
            ))
            
        return preview_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi phân tích file: {str(e)}")

def extract_lecturer_codes(text: str) -> List[str]:
    if not text: return []
    parts = re.split(r'[,;]', text)
    codes = []
    for part in parts:
        part = part.strip()
        if '-' in part:
            code = part.rsplit('-', 1)[1].strip()
            if code: codes.append(code)
    return list(set(codes))

@router.post("/lists/{list_id}/import-commit")
def commit_registrations_import(list_id: int, items: List[RegistrationPreviewItem], db: Session = Depends(get_db)):
    db_list = db.query(models.RegistrationList).filter(models.RegistrationList.list_id == list_id).first()
    if not db_list:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh sách (list_id)")
        
    try:
        # Xóa các nguyện vọng cũ của chính danh sách này
        db.query(models.LecturerRegistration).filter(
            models.LecturerRegistration.list_id == list_id
        ).delete()
        
        all_lecturers = db.query(models.Lecturer).all()
        lec_dict = {l.lecturer_code: l.lecturer_id for l in all_lecturers}
        
        imported_count = 0
        
        for item in items:
            subject = db.query(models.Subject).filter(models.Subject.subject_code == item.subject_code).first()
            if not subject:
                subject = models.Subject(
                    subject_code=item.subject_code,
                    subject_name=item.subject_name,
                    credits=3,
                    theory_hours=30
                )
                db.add(subject)
                db.flush()
                
            main_codes = extract_lecturer_codes(item.main_lecturers_text)
            prac_codes = extract_lecturer_codes(item.practice_lecturers_text)
            
            for code in main_codes:
                if code in lec_dict:
                    reg = models.LecturerRegistration(
                        list_id=list_id,
                        lecturer_id=lec_dict[code],
                        subject_id=subject.subject_id,
                        is_main_lecturer=True
                    )
                    db.add(reg)
                    imported_count += 1
            
            for code in prac_codes:
                if code in lec_dict:
                    reg = models.LecturerRegistration(
                        list_id=list_id,
                        lecturer_id=lec_dict[code],
                        subject_id=subject.subject_id,
                        is_main_lecturer=False
                    )
                    db.add(reg)
                    imported_count += 1
                    
        db.commit()
        return {"message": f"Thành công! Đã đẩy {imported_count} mục nguyện vọng vào Danh sách."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi Transaction CSDL: {str(e)}")
