from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app import models, schemas
from sqlalchemy import func

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
