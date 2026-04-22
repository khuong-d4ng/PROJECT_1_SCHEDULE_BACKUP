from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app import models, schemas
from app.services.auto_assign import AutoAssigner
from sqlalchemy import func
import pandas as pd
import io

router = APIRouter()

@router.get("/", response_model=List[schemas.TimetableSessionResponse])
def get_timetable_sessions(db: Session = Depends(get_db)):
    return db.query(models.SchedulingSession).order_by(models.SchedulingSession.created_at.desc()).all()

@router.post("/generate", response_model=schemas.TimetableSessionResponse)
def generate_timetable(payload: schemas.TimetableSessionCreate, db: Session = Depends(get_db)):
    try:
        # Create Session
        new_session = models.SchedulingSession(
            plan_name=payload.plan_name,
            registration_list_id=payload.registration_list_id,
            status=models.TimetableSessionStatusEnum.ACTIVE
        )
        db.add(new_session)
        db.flush()
        
        # Insert Entries (Configs)
        for entry in payload.entries:
            db.add(models.SessionEntry(
                session_id=new_session.session_id,
                program_id=entry.program_id,
                semester_index=entry.semester_index
            ))
            
        # Core Auto-Gen Logic
        generated_rows = 0
        for entry in payload.entries:
            # Lấy tất cả Môn học của (Chương trình + Kỳ)
            curriculums = db.query(models.ProgramCurriculum).filter(
                models.ProgramCurriculum.program_id == entry.program_id,
                models.ProgramCurriculum.semester_index == entry.semester_index
            ).all()
            
            if not curriculums:
                continue
                
            subject_ids = [c.subject_id for c in curriculums]
            
            # Lấy tất cả Lớp thuộc Chương trình đó
            classes = db.query(models.Class).filter(
                models.Class.program_id == entry.program_id
            ).all()
            
            # Nhân chéo: Lớp x Môn
            for c in classes:
                for subj_id in subject_ids:
                    # Tạo TimetableRow (Đổ trắng các thông tin rải lệnh)
                    row = models.TimetableRow(
                        session_id=new_session.session_id,
                        class_name=c.class_name,
                        subject_id=subj_id
                    )
                    db.add(row)
                    generated_rows += 1
                    
        db.commit()
        return new_session
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/rows", response_model=List[schemas.TimetableRowResponse])
def get_timetable_rows(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.SchedulingSession).filter(models.SchedulingSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Không tìm thấy Đợt TKB")
        
    rows = db.query(models.TimetableRow).filter(models.TimetableRow.session_id == session_id).all()
    
    # Map additional fields manually for the response
    result = []
    for r in rows:
        subject = r.subject
        main_lec = r.main_lecturer
        prac_lec = r.prac_lecturer
        
        result.append(schemas.TimetableRowResponse(
            row_id=r.row_id,
            class_name=r.class_name,
            subject_id=r.subject_id,
            subject_code=subject.subject_code if subject else "",
            subject_name=subject.subject_name if subject else "",
            credits=subject.credits if subject else 0,
            theory_hours=subject.theory_hours if subject else 0,
            practice_hours=subject.practice_hours if subject else 0,
            fixed_shift=r.fixed_shift,
            room_type=r.room_type,
            morning_day=r.morning_day,
            afternoon_day=r.afternoon_day,
            main_lecturer_id=r.main_lecturer_id,
            prac_lecturer_id=r.prac_lecturer_id,
            main_lecturer_name=main_lec.full_name if main_lec else None,
            prac_lecturer_name=prac_lec.full_name if prac_lec else None
        ))
        
    return result

@router.put("/rows/{row_id}", response_model=schemas.TimetableRowResponse)
def update_timetable_row(row_id: int, payload: schemas.TimetableRowUpdate, db: Session = Depends(get_db)):
    row = db.query(models.TimetableRow).filter(models.TimetableRow.row_id == row_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Không tìm thấy dòng TKB")
        
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(row, key, value)
        
    db.commit()
    db.refresh(row)
    
    subject = row.subject
    main_lec = row.main_lecturer
    prac_lec = row.prac_lecturer
    
    return schemas.TimetableRowResponse(
        row_id=row.row_id,
        class_name=row.class_name,
        subject_id=row.subject_id,
        subject_code=subject.subject_code if subject else "",
        subject_name=subject.subject_name if subject else "",
        credits=subject.credits if subject else 0,
        theory_hours=subject.theory_hours if subject else 0,
        practice_hours=subject.practice_hours if subject else 0,
        fixed_shift=row.fixed_shift,
        room_type=row.room_type,
        morning_day=row.morning_day,
        afternoon_day=row.afternoon_day,
        main_lecturer_id=row.main_lecturer_id,
        prac_lecturer_id=row.prac_lecturer_id,
        main_lecturer_name=main_lec.full_name if main_lec else None,
        prac_lecturer_name=prac_lec.full_name if prac_lec else None
    )

@router.get("/{session_id}/stats")
def get_session_stats(session_id: int, db: Session = Depends(get_db)):
    """Trả về thống kê chi tiết của mỗi GV trong 1 session TKB."""
    rows = db.query(models.TimetableRow).filter(
        models.TimetableRow.session_id == session_id
    ).all()
    
    # Per-lecturer tracking
    from collections import defaultdict
    lec_data: dict = defaultdict(lambda: {
        "hours": 0, "subjects": set(), "classes": set(), "slots": set()
    })
    
    for r in rows:
        subject = r.subject
        if not subject:
            continue
            
        theory_h = subject.theory_hours or 0
        practice_h = subject.practice_hours or 0
        slot = r.morning_day or r.afternoon_day
        
        main_id = r.main_lecturer_id
        prac_id = r.prac_lecturer_id
        
        if main_id:
            d = lec_data[main_id]
            d["subjects"].add(r.subject_id)
            d["classes"].add(r.class_name)
            if slot:
                d["slots"].add(slot)
            if prac_id:
                d["hours"] += theory_h
                pd = lec_data[prac_id]
                pd["hours"] += practice_h
                pd["subjects"].add(r.subject_id)
                pd["classes"].add(r.class_name)
                if slot:
                    pd["slots"].add(slot)
            else:
                d["hours"] += theory_h + practice_h
    
    # Convert sets to counts for JSON serialization
    result = {}
    for lid, d in lec_data.items():
        result[str(lid)] = {
            "hours": d["hours"],
            "subjects": len(d["subjects"]),
            "classes": len(d["classes"]),
            "slots": len(d["slots"])
        }
    
    return result

@router.get("/{session_id}/preference-map")
def get_preference_map(session_id: int, db: Session = Depends(get_db)):
    """Trả về mapping: subject_id -> {main: [lec_ids], prac: [lec_ids]} từ registration list của session."""
    session = db.query(models.SchedulingSession).filter(
        models.SchedulingSession.session_id == session_id
    ).first()
    if not session or not session.registration_list_id:
        return {}
    
    regs = db.query(models.LecturerRegistration).filter(
        models.LecturerRegistration.list_id == session.registration_list_id
    ).all()
    
    from collections import defaultdict
    pref_map: dict = defaultdict(lambda: {"main": [], "prac": []})
    
    for reg in regs:
        key = "main" if reg.is_main_lecturer else "prac"
        sid = str(reg.subject_id)
        lid = reg.lecturer_id
        if lid not in pref_map[sid][key]:
            pref_map[sid][key].append(lid)
    
    return dict(pref_map)

@router.delete("/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.SchedulingSession).filter(
        models.SchedulingSession.session_id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Không tìm thấy Đợt TKB")
    db.delete(session)
    db.commit()
    return {"message": "Đã xóa Đợt TKB thành công"}

@router.post("/{session_id}/auto-assign", response_model=schemas.AutoAssignResult)
def auto_assign(session_id: int, strategy: str = "A", db: Session = Depends(get_db)):
    """Chạy thuật toán phân công tự động. strategy='A' (Bão hòa) hoặc 'B' (San đều)."""
    session = db.query(models.SchedulingSession).filter(
        models.SchedulingSession.session_id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Không tìm thấy Đợt TKB")
    
    if strategy not in ("A", "B"):
        raise HTTPException(status_code=400, detail="Strategy phải là 'A' hoặc 'B'")
    
    try:
        engine = AutoAssigner(session_id, db, strategy=strategy)
        result = engine.run()
        return schemas.AutoAssignResult(
            assigned_count=result.assigned_count,
            unassigned_count=result.unassigned_count,
            slot_assigned_count=result.slot_assigned_count,
            warnings=result.warnings
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi Auto-Assign: {str(e)}")

@router.get("/{session_id}/export-excel")
def export_timetable_excel(session_id: int, db: Session = Depends(get_db)):
    """Xuất file Excel TKB."""
    session_obj = db.query(models.SchedulingSession).filter(
        models.SchedulingSession.session_id == session_id
    ).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy Đợt TKB")
    
    rows = db.query(models.TimetableRow).filter(
        models.TimetableRow.session_id == session_id
    ).all()
    
    data = []
    for r in rows:
        subj = r.subject
        main_lec = r.main_lecturer
        prac_lec = r.prac_lecturer
        data.append({
            "Tên Lớp": r.class_name,
            "Buổi CĐ": r.fixed_shift or "",
            "Mã Môn": subj.subject_code if subj else "",
            "Tên Học Phần": subj.subject_name if subj else "",
            "Số TC": subj.credits if subj else 0,
            "Tiết LT": subj.theory_hours if subj else 0,
            "Tiết TH": subj.practice_hours if subj else 0,
            "GV Chính": main_lec.full_name if main_lec else "",
            "GV Thực Hành": prac_lec.full_name if prac_lec else "",
            "Loại Phòng": r.room_type or "",
            "Thứ-Sáng": r.morning_day or "",
            "Thứ-Chiều": r.afternoon_day or ""
        })
    
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="TKB")
    output.seek(0)
    
    from fastapi.responses import StreamingResponse
    from urllib.parse import quote
    filename = f"TKB_{session_obj.plan_name}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"}
    )
