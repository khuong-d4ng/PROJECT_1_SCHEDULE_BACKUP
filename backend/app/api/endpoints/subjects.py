from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app import models, schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Subject])
def read_subjects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    subjects = db.query(models.Subject).offset(skip).limit(limit).all()
    return subjects

@router.post("/", response_model=schemas.Subject)
def create_subject(subject: schemas.SubjectCreate, db: Session = Depends(get_db)):
    db_subject = db.query(models.Subject).filter(models.Subject.subject_code == subject.subject_code).first()
    if db_subject:
        raise HTTPException(status_code=400, detail="Mã học phần đã tồn tại")
    
    new_subject = models.Subject(**subject.model_dump())
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    return new_subject

@router.put("/{subject_id}", response_model=schemas.Subject)
def update_subject(subject_id: int, subject: schemas.SubjectUpdate, db: Session = Depends(get_db)):
    db_subject = db.query(models.Subject).filter(models.Subject.subject_id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Không tìm thấy môn học")
    
    update_data = subject.model_dump(exclude_unset=True)
    
    # If subject_code is being changed, check if it already exists
    if "subject_code" in update_data and update_data["subject_code"] != db_subject.subject_code:
        existing = db.query(models.Subject).filter(models.Subject.subject_code == update_data["subject_code"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Mã học phần đã tồn tại")

    for key, value in update_data.items():
        setattr(db_subject, key, value)
    
    db.commit()
    db.refresh(db_subject)
    return db_subject
