from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io
import re
import math

from app.core.database import get_db
from app import models, schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.TrainingProgramResponse])
def get_programs(db: Session = Depends(get_db)):
    return db.query(models.TrainingProgram).all()

@router.post("/", response_model=schemas.TrainingProgramResponse)
def create_program(payload: schemas.TrainingProgramCreate, db: Session = Depends(get_db)):
    db_prog = db.query(models.TrainingProgram).filter(models.TrainingProgram.program_code == payload.program_code).first()
    if db_prog:
        raise HTTPException(status_code=400, detail="Mã chương trình đã tồn tại")
    new_prog = models.TrainingProgram(**payload.model_dump())
    db.add(new_prog)
    db.commit()
    db.refresh(new_prog)
    return new_prog

@router.get("/{program_id}/curriculum", response_model=List[schemas.ProgramCurriculumItem])
def get_curriculum(program_id: int, db: Session = Depends(get_db)):
    curriculums = db.query(models.ProgramCurriculum).filter(models.ProgramCurriculum.program_id == program_id).all()
    results = []
    for c in curriculums:
        results.append(schemas.ProgramCurriculumItem(
            subject_id=c.subject_id,
            subject_code=c.subject.subject_code,
            subject_name=c.subject.subject_name,
            credits=c.subject.credits,
            theory_credits=c.subject.theory_credits,
            practice_credits=c.subject.practice_credits,
            semester_index=c.semester_index
        ))
    return results

@router.post("/{program_id}/import-excel")
async def import_curriculum(program_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    prog = db.query(models.TrainingProgram).filter(models.TrainingProgram.id == program_id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Không tìm thấy Khung chương trình")
        
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File phải là định dạng Excel")
        
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Mapping các môn
        new_subjects_added = 0
        curriculums_created = 0
        
        for index, row in df.iterrows():
            if len(row) < 6: continue
            
            sub_code = str(row.iloc[0]).strip()
            if pd.isna(row.iloc[0]) or not sub_code or str(row.iloc[0]) == 'nan':
                continue
                
            # Bỏ qua dòng Header nếu đọc dính (Dòng Header chứa chữ 'mã môn học')
            if 'mã môn' in sub_code.lower() or 'môn học' in sub_code.lower():
                continue
                
            sub_name = str(row.iloc[1]).strip()
            
            def safe_int(val):
                try:
                    if pd.isna(val): return 0
                    return int(float(str(val).strip()))
                except:
                    return 0
                    
            credits = safe_int(row.iloc[2])
            theory_c = safe_int(row.iloc[3])
            prac_c = safe_int(row.iloc[4])
            semester = safe_int(row.iloc[5])
            
            if not sub_name or credits == 0 or semester == 0:
                continue
                
            # Upsert Subject
            db_sub = db.query(models.Subject).filter(models.Subject.subject_code == sub_code).first()
            if not db_sub:
                db_sub = models.Subject(
                    subject_code=sub_code,
                    subject_name=sub_name,
                    credits=credits,
                    theory_credits=theory_c,
                    practice_credits=prac_c,
                    theory_hours=theory_c * 15,
                    practice_hours=prac_c * 15
                )
                db.add(db_sub)
                db.flush() # Để lấy ID tạm thời
                new_subjects_added += 1
                
            # Kiểm tra xem môn này đã có trong CTĐT chưa
            existing_mapping = db.query(models.ProgramCurriculum).filter(
                models.ProgramCurriculum.program_id == program_id,
                models.ProgramCurriculum.subject_id == db_sub.subject_id
            ).first()
            
            if not existing_mapping:
                db.add(models.ProgramCurriculum(
                    program_id=program_id,
                    semester_index=semester,
                    subject_id=db_sub.subject_id
                ))
                curriculums_created += 1
            else:
                # Nếu đã tồn tại nhưng khác học kỳ, cập nhật lại kỳ (Upsert mapping)
                if existing_mapping.semester_index != semester:
                    existing_mapping.semester_index = semester
            
        db.commit()
        return {
            "message": "Import thành công",
            "new_subjects": new_subjects_added,
            "curriculum_rows": curriculums_created
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi Import: {str(e)}")
