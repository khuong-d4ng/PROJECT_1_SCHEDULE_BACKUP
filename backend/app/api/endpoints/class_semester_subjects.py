from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app import models, schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.BatchSemesterSubjectItem])
def get_semester_subjects(
    major_code: str = Query(..., description="Mã ngành, VD: CNTT"),
    batch_code: str = Query(..., description="Mã khóa, VD: 19"),
    semester_index: int = Query(..., description="Số thứ tự kì, 1-10"),
    db: Session = Depends(get_db)
):
    """Lấy danh sách môn đang gắn vào kì X của khóa Y ngành Z"""
    records = db.query(models.BatchSemesterSubject)\
        .filter(
            models.BatchSemesterSubject.major_code == major_code.upper(),
            models.BatchSemesterSubject.batch_code == batch_code,
            models.BatchSemesterSubject.semester_index == semester_index,
        ).all()
    
    results = []
    for r in records:
        results.append(schemas.BatchSemesterSubjectItem(
            subject_id=r.subject.subject_id,
            subject_code=r.subject.subject_code,
            subject_name=r.subject.subject_name,
            credits=r.subject.credits,
        ))
    return results


@router.get("/used", response_model=List[int])
def get_used_subject_ids(
    major_code: str = Query(..., description="Mã ngành, VD: CNTT"),
    batch_code: str = Query(..., description="Mã khóa, VD: 19"),
    exclude_semester: int = Query(None, description="Kì cần loại trừ"),
    db: Session = Depends(get_db)
):
    """Lấy tất cả subject_id đã dùng ở mọi kì của khóa (trừ kì exclude_semester)"""
    query = db.query(models.BatchSemesterSubject.subject_id)\
        .filter(
            models.BatchSemesterSubject.major_code == major_code.upper(),
            models.BatchSemesterSubject.batch_code == batch_code,
        )
    
    if exclude_semester is not None:
        query = query.filter(models.BatchSemesterSubject.semester_index != exclude_semester)
    
    results = query.all()
    return [r[0] for r in results]


@router.post("/save")
def save_semester_subjects(
    payload: schemas.BatchSemesterSubjectSavePayload,
    db: Session = Depends(get_db)
):
    """Lưu (replace) toàn bộ môn cho 1 bộ (major_code, batch_code, semester_index)"""
    major = payload.major_code.upper()
    try:
        # Xóa mapping cũ
        db.query(models.BatchSemesterSubject)\
            .filter(
                models.BatchSemesterSubject.major_code == major,
                models.BatchSemesterSubject.batch_code == payload.batch_code,
                models.BatchSemesterSubject.semester_index == payload.semester_index,
            ).delete()
        
        # Tạo mapping mới
        new_records = []
        for sid in payload.subject_ids:
            new_records.append(models.BatchSemesterSubject(
                major_code=major,
                batch_code=payload.batch_code,
                semester_index=payload.semester_index,
                subject_id=sid,
            ))
        
        db.add_all(new_records)
        db.commit()
        return {
            "message": f"Đã lưu {len(new_records)} môn cho ngành {major} khóa {payload.batch_code} kì {payload.semester_index}"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu: {str(e)}")
