from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app import models, schemas

router = APIRouter()

@router.get("/{major_code}", response_model=List[schemas.MajorSubjectItem])
def get_curriculum(major_code: str, db: Session = Depends(get_db)):
    """Lấy danh sách môn thuộc chương trình đào tạo của ngành"""
    major_subjects = db.query(models.MajorSubject)\
        .filter(models.MajorSubject.major_code == major_code.upper())\
        .all()
    
    results = []
    for ms in major_subjects:
        results.append(schemas.MajorSubjectItem(
            subject_id=ms.subject.subject_id,
            subject_code=ms.subject.subject_code,
            subject_name=ms.subject.subject_name,
            credits=ms.subject.credits,
        ))
    return results


@router.post("/{major_code}/save")
def save_curriculum(major_code: str, payload: schemas.MajorSubjectSavePayload, db: Session = Depends(get_db)):
    """Lưu (replace) toàn bộ danh sách môn cho ngành"""
    code = major_code.upper()
    
    try:
        # Xóa toàn bộ mapping cũ
        db.query(models.MajorSubject)\
            .filter(models.MajorSubject.major_code == code)\
            .delete()
        
        # Tạo mapping mới
        new_records = []
        for sid in payload.subject_ids:
            # Kiểm tra subject tồn tại
            subj = db.query(models.Subject).filter(models.Subject.subject_id == sid).first()
            if not subj:
                raise HTTPException(status_code=400, detail=f"Subject ID {sid} không tồn tại")
            new_records.append(models.MajorSubject(
                major_code=code,
                subject_id=sid,
            ))
        
        db.add_all(new_records)
        db.commit()
        return {"message": f"Đã lưu {len(new_records)} môn cho ngành {code}"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu: {str(e)}")
