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
from app.models import Semester, SemesterStatusEnum, RegistrationListSubject
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

@router.put("/lists/{list_id}/toggle-open")
def toggle_open(list_id: int, db: Session = Depends(get_db)):
    """Cán bộ bật/tắt trạng thái mở đăng ký cho GV."""
    db_list = db.query(models.RegistrationList).filter(models.RegistrationList.list_id == list_id).first()
    if not db_list:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh sách")
    db_list.is_open = not db_list.is_open
    db.commit()
    db.refresh(db_list)
    status = "mở" if db_list.is_open else "đóng"
    return {"message": f"Đã {status} đợt đăng ký", "is_open": db_list.is_open}

class SetSubjectsRequest(BaseModel):
    subject_ids: List[int]

@router.put("/lists/{list_id}/set-subjects")
def set_list_subjects(list_id: int, req: SetSubjectsRequest, db: Session = Depends(get_db)):
    """Gán danh sách môn học khả dụng cho 1 đợt đăng ký."""
    db_list = db.query(models.RegistrationList).filter(models.RegistrationList.list_id == list_id).first()
    if not db_list:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh sách")
    
    # Xóa cũ, thêm mới
    db.query(models.RegistrationListSubject).filter(models.RegistrationListSubject.list_id == list_id).delete()
    for sid in req.subject_ids:
        db.add(models.RegistrationListSubject(list_id=list_id, subject_id=sid))
    db.commit()
    return {"message": f"Đã gán {len(req.subject_ids)} môn cho đợt đăng ký"}

@router.get("/lists/{list_id}/subjects")
def get_list_subjects(list_id: int, db: Session = Depends(get_db)):
    """Lấy danh sách môn khả dụng của 1 đợt đăng ký."""
    items = (
        db.query(models.RegistrationListSubject)
        .filter(models.RegistrationListSubject.list_id == list_id)
        .all()
    )
    return [
        {
            "subject_id": i.subject.subject_id,
            "subject_code": i.subject.subject_code,
            "subject_name": i.subject.subject_name,
        }
        for i in items
    ]

class CurriculumSubjectQuery(BaseModel):
    """Mỗi item: 1 program_id + danh sách semester_index."""
    program_id: int
    semester_indices: List[int]

class CurriculumSubjectRequest(BaseModel):
    selections: List[CurriculumSubjectQuery]

@router.post("/curriculum-subjects")
def get_curriculum_subjects(req: CurriculumSubjectRequest, db: Session = Depends(get_db)):
    """Lấy danh sách môn từ curriculum theo program_id + semester_index.
    Dùng cho wizard chọn môn khi tạo đợt đăng ký."""
    subject_ids = set()
    subjects = []
    
    for sel in req.selections:
        rows = (
            db.query(models.ProgramCurriculum)
            .filter(
                models.ProgramCurriculum.program_id == sel.program_id,
                models.ProgramCurriculum.semester_index.in_(sel.semester_indices),
            )
            .all()
        )
        for row in rows:
            if row.subject_id not in subject_ids:
                subject_ids.add(row.subject_id)
                subj = row.subject
                subjects.append({
                    "subject_id": subj.subject_id,
                    "subject_code": subj.subject_code,
                    "subject_name": subj.subject_name,
                    "credits": subj.credits,
                    "program_name": row.program.name if row.program else "",
                    "semester_index": row.semester_index,
                })
    return subjects

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
    created_by_lecturer: bool = False

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
            is_main_lecturer=r.is_main_lecturer,
            created_by_lecturer=r.created_by_lecturer
        ))
    return results

class RegistrationAssignmentItem(BaseModel):
    lecturer_id: int
    subject_id: int
    is_main_lecturer: bool
    created_by_lecturer: bool = False

class BulkSavePayload(BaseModel):
    assignments: List[RegistrationAssignmentItem]

@router.post("/lists/{list_id}/save")
def save_registration_list(list_id: int, payload: BulkSavePayload, db: Session = Depends(get_db)):
    """ API nhắm tới việc nhận toàn bộ kết quả Drag & Drop từ Frontend để lưu thẳng xuống DB """
    db_list = db.query(models.RegistrationList).filter(models.RegistrationList.list_id == list_id).first()
    if not db_list:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên bản danh sách")
        
    try:
        # Lấy danh sách phân công cũ để so sánh
        old_assignments = db.query(models.LecturerRegistration).filter(
            models.LecturerRegistration.list_id == list_id
        ).all()
        old_assigned = {(r.lecturer_id, r.subject_id) for r in old_assignments}

        # Xóa toàn bộ chi tiết cũ của List này
        db.query(models.LecturerRegistration).filter(models.LecturerRegistration.list_id == list_id).delete()
        
        # Tạo chèn toàn bộ chi tiết mới
        new_records = []
        newly_assigned_lecturers = set()

        for item in payload.assignments:
            new_records.append(models.LecturerRegistration(
                list_id=list_id,
                lecturer_id=item.lecturer_id,
                subject_id=item.subject_id,
                is_main_lecturer=item.is_main_lecturer,
                created_by_lecturer=item.created_by_lecturer
            ))
            
            # Nếu được phân công bởi Admin và chưa từng được phân công môn này ở đợt này trước đó
            if not item.created_by_lecturer and (item.lecturer_id, item.subject_id) not in old_assigned:
                newly_assigned_lecturers.add(item.lecturer_id)

        db.add_all(new_records)

        # Tạo thông báo cho các giảng viên mới được phân công
        if newly_assigned_lecturers:
            lecturers = db.query(models.Lecturer).filter(
                models.Lecturer.lecturer_id.in_(newly_assigned_lecturers)
            ).all()
            
            for lecturer in lecturers:
                if lecturer.user_id:
                    new_noti = models.Notification(
                        user_id=lecturer.user_id,
                        title="Phân công giảng dạy mới",
                        content=f"Bạn đã được quản trị viên phân công dạy môn mới ở bảng phân công {db_list.list_name}, bấm vào để xem chi tiết.",
                        link="/my-registrations",
                        is_read=False
                    )
                    db.add(new_noti)

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

@router.post("/import-analyze", response_model=schemas.ImportAnalyzeResponse)
async def analyze_import(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Vui lòng tải lên file định dạng Excel")
        
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        missing_subjects = {}
        missing_lecturers = {}
        assignments = []
        
        all_subjects = {s.subject_code: s for s in db.query(models.Subject).all()}
        all_lecturers = {l.lecturer_code: l for l in db.query(models.Lecturer).all()}
        
        for index, row in df.iterrows():
            if len(row) < 4: continue
                
            subj_name = str(row.iloc[0]).strip() if pd.notnull(row.iloc[0]) else ""
            subj_code = str(row.iloc[1]).strip() if pd.notnull(row.iloc[1]) else ""
            
            if not subj_code or subj_code == 'nan':
                continue
                
            if subj_code not in all_subjects and subj_code not in missing_subjects:
                missing_subjects[subj_code] = schemas.MissingSubjectItem(
                    subject_code=subj_code, subject_name=subj_name
                )
                
            main_lec_text = str(row.iloc[2]).strip() if pd.notnull(row.iloc[2]) else ""
            prac_lec_text = str(row.iloc[3]).strip() if pd.notnull(row.iloc[3]) else ""
            
            def parse_lecturers(text_data, is_main):
                if not text_data or text_data == 'nan': return
                parts = re.split(r'[,;]', text_data)
                for part in parts:
                    part = part.strip()
                    if '-' in part:
                        name, code = part.rsplit('-', 1)
                        name = name.strip()
                        code = code.strip()
                        if code:
                            if code not in all_lecturers and code not in missing_lecturers:
                                missing_lecturers[code] = schemas.MissingLecturerItem(
                                    lecturer_code=code, full_name=name
                                )
                            assignments.append(schemas.DirectAssignmentItem(
                                subject_code=subj_code,
                                lecturer_code=code,
                                is_main_lecturer=is_main
                            ))
                            
            parse_lecturers(main_lec_text, True)
            parse_lecturers(prac_lec_text, False)
            
        return schemas.ImportAnalyzeResponse(
            missing_subjects=list(missing_subjects.values()),
            missing_lecturers=list(missing_lecturers.values()),
            assignments=assignments
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi phân tích file: {str(e)}")

@router.post("/import-resolve")
def resolve_import(payload: schemas.ImportResolveRequest, db: Session = Depends(get_db)):
    try:
        # Create missing subjects
        for s in payload.resolved_subjects:
            exist = db.query(models.Subject).filter(models.Subject.subject_code == s.subject_code).first()
            if not exist:
                new_subj = models.Subject(
                    subject_code=s.subject_code,
                    subject_name=s.subject_name,
                    credits=s.credits,
                    theory_hours=s.theory_hours,
                    practice_hours=s.practice_hours
                )
                db.add(new_subj)
                
        # Create missing lecturers
        for l in payload.resolved_lecturers:
            exist = db.query(models.Lecturer).filter(models.Lecturer.lecturer_code == l.lecturer_code).first()
            if not exist:
                lec_type = models.LecturerTypeEnum.FULL_TIME if l.type == "Cơ hữu" else models.LecturerTypeEnum.VISITING
                new_lec = models.Lecturer(
                    full_name=l.full_name,
                    lecturer_code=l.lecturer_code,
                    type=lec_type
                )
                db.add(new_lec)
                
        db.commit()
        return {"message": "Đã thêm dữ liệu mới thành công"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi thêm dữ liệu: {str(e)}")
