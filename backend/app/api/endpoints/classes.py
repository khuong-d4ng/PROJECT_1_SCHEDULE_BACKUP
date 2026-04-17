from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from typing import List, Optional

from app.core.database import get_db
from app import models, schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.ClassResponse])
def get_classes(
    department_major: Optional[str] = None,
    batch: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Class).options(joinedload(models.Class.program))
    if department_major:
        query = query.filter(models.Class.department_major == department_major)
    if batch:
        query = query.filter(models.Class.batch == batch)
    return query.all()

@router.post("/", response_model=schemas.ClassResponse)
def create_class(payload: schemas.ClassCreate, db: Session = Depends(get_db)):
    db_class = db.query(models.Class).filter(models.Class.class_name == payload.class_name).first()
    if db_class:
        raise HTTPException(status_code=400, detail="Tên lớp này đã tồn tại")
    
    new_class = models.Class(**payload.model_dump())
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return new_class

@router.put("/{class_id}/assign-program", response_model=schemas.ClassResponse)
def assign_program(class_id: int, program_id: Optional[int], db: Session = Depends(get_db)):
    db_class = db.query(models.Class).filter(models.Class.class_id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")
    
    if program_id is not None:
        prog = db.query(models.TrainingProgram).filter(models.TrainingProgram.id == program_id).first()
        if not prog:
            raise HTTPException(status_code=404, detail="Không tìm thấy khung chương trình")
            
    db_class.program_id = program_id
    db.commit()
    db.refresh(db_class)
    return db_class

@router.delete("/{class_id}")
def delete_class(class_id: int, db: Session = Depends(get_db)):
    db_class = db.query(models.Class).filter(models.Class.class_id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")
        
    db.delete(db_class)
    db.commit()
    return {"message": "Xóa lớp thành công"}
