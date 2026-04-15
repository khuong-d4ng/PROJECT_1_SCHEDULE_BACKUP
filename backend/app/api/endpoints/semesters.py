from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app import models, schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Semester])
def read_semesters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    semesters = db.query(models.Semester).offset(skip).limit(limit).all()
    return semesters

@router.post("/", response_model=schemas.Semester)
def create_semester(semester: schemas.SemesterCreate, db: Session = Depends(get_db)):
    db_semester = db.query(models.Semester).filter(models.Semester.semester_name == semester.semester_name).first()
    if db_semester:
        raise HTTPException(status_code=400, detail="Tên học kỳ đã tồn tại")
    
    new_semester = models.Semester(**semester.model_dump())
    db.add(new_semester)
    db.commit()
    db.refresh(new_semester)
    return new_semester
