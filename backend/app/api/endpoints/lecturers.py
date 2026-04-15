from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
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
