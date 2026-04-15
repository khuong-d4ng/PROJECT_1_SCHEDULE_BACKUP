from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.core.database import get_db

router = APIRouter()

@router.get("/sessions", response_model=List[schemas.SchedulingSessionSchema])
def get_sessions(db: Session = Depends(get_db)):
    return db.query(models.SchedulingSession).all()

@router.post("/sessions", response_model=schemas.SchedulingSessionSchema)
def create_session(session_in: schemas.SchedulingSessionCreate, db: Session = Depends(get_db)):
    new_session = models.SchedulingSession(**session_in.model_dump())
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.SchedulingSession).filter(models.SchedulingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"ok": True}

@router.put("/sessions/{session_id}", response_model=schemas.SchedulingSessionSchema)
def update_session(session_id: int, session_in: schemas.SchedulingSessionUpdate, db: Session = Depends(get_db)):
    session = db.query(models.SchedulingSession).filter(models.SchedulingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session_in.name is not None:
        session.name = session_in.name
    if session_in.registration_list_id is not None:
        session.registration_list_id = session_in.registration_list_id
        
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions/{session_id}/entries", response_model=List[schemas.SessionEntrySchema])
def get_session_entries(session_id: int, db: Session = Depends(get_db)):
    return db.query(models.SessionEntry).filter(models.SessionEntry.session_id == session_id).all()

@router.post("/sessions/{session_id}/entries", response_model=schemas.SessionEntrySchema)
def create_session_entry(session_id: int, entry_in: schemas.SessionEntryCreate, db: Session = Depends(get_db)):
    session = db.query(models.SchedulingSession).filter(models.SchedulingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    new_entry = models.SessionEntry(session_id=session_id, **entry_in.model_dump())
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.delete("/sessions/{session_id}/entries/{entry_id}")
def delete_session_entry(session_id: int, entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(models.SessionEntry).filter(models.SessionEntry.id == entry_id, models.SessionEntry.session_id == session_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}

@router.post("/sessions/{session_id}/generate")
def generate_timetable(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.SchedulingSession).filter(models.SchedulingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Clear existing rows for this session
    db.query(models.TimetableRow).filter(models.TimetableRow.session_id == session_id).delete()
    db.commit()
    
    entries = db.query(models.SessionEntry).filter(models.SessionEntry.session_id == session_id).all()
    
    row_index = 1
    for entry in entries:
        # Get subjects for this major + batch + semester
        batch_subjects = db.query(models.BatchSemesterSubject).filter(
            models.BatchSemesterSubject.major_code == entry.major_code,
            models.BatchSemesterSubject.batch_code == entry.batch_code,
            models.BatchSemesterSubject.semester_index == entry.semester_index
        ).all()
        
        for class_num in range(1, entry.num_classes + 1):
            class_name = f"{entry.major_code} {entry.batch_code}-{class_num:02d}"
            shift = "Sáng" if class_num % 2 != 0 else "Chiều"
            
            for bs in batch_subjects:
                subject = bs.subject
                room_type = "Phòng thường"
                if subject.practice_hours and (subject.theory_hours is None or subject.practice_hours > subject.theory_hours):
                    room_type = "Phòng máy"
                    
                new_row = models.TimetableRow(
                    session_id=session_id,
                    row_index=row_index,
                    class_name=class_name,
                    shift=shift,
                    subject_code=subject.subject_code,
                    subject_name=subject.subject_name,
                    credits=subject.credits,
                    theory_hours=subject.theory_hours,
                    practice_hours=subject.practice_hours,
                    room_type=room_type
                )
                db.add(new_row)
                row_index += 1
                
    db.commit()
    return {"message": "Bảng thời khóa biểu đã được tạo thành công", "rows_generated": row_index - 1}

@router.get("/sessions/{session_id}/rows", response_model=List[schemas.TimetableRowSchema])
def get_timetable_rows(session_id: int, db: Session = Depends(get_db)):
    return db.query(models.TimetableRow).filter(models.TimetableRow.session_id == session_id).order_by(models.TimetableRow.row_index).all()

@router.put("/rows/{row_id}", response_model=schemas.TimetableRowSchema)
def update_timetable_row(row_id: int, row_in: schemas.TimetableRowUpdate, db: Session = Depends(get_db)):
    row = db.query(models.TimetableRow).filter(models.TimetableRow.id == row_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Row not found")
        
    update_data = row_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(row, key, value)
        
    db.commit()
    db.refresh(row)
    return row

from app.core.scheduler import TimetableScheduler

@router.post("/sessions/{session_id}/auto-schedule")
def auto_schedule_timetable(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.SchedulingSession).filter(models.SchedulingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    scheduler = TimetableScheduler(db, session_id)
    scheduler.run()
    
    return {"message": "Tự động xếp lịch thành công"}
