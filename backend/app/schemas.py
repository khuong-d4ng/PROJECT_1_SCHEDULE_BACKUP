from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from enum import Enum

class RoleEnum(str, Enum):
    ADMIN = "Admin"
    SCHEDULER = "Cán bộ xếp lịch"
    LECTURER = "Giảng viên"

class LecturerTypeEnum(str, Enum):
    FULL_TIME = "Cơ hữu"
    VISITING = "Thỉnh giảng"

class SemesterStatusEnum(str, Enum):
    DRAFT = "Draft"
    ACTIVE = "Active"
    CLOSED = "Closed"

# --- Subject Schemas ---
class SubjectBase(BaseModel):
    subject_code: str
    subject_name: str
    credits: int
    theory_hours: int = 0
    practice_hours: int = 0

class SubjectCreate(SubjectBase):
    pass

class Subject(SubjectBase):
    subject_id: int

    class Config:
        from_attributes = True

# --- Lecturer Schemas ---
class LecturerBase(BaseModel):
    full_name: str
    lecturer_code: str
    type: LecturerTypeEnum = LecturerTypeEnum.FULL_TIME
    max_quota: int = 0

class LecturerCreate(LecturerBase):
    user_id: Optional[int] = None

class Lecturer(LecturerBase):
    lecturer_id: int
    user_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- Semester Schemas ---
class SemesterBase(BaseModel):
    semester_name: str
    start_date: date
    end_date: date
    status: SemesterStatusEnum = SemesterStatusEnum.DRAFT

class SemesterCreate(SemesterBase):
    pass

class Semester(SemesterBase):
    semester_id: int

    class Config:
        from_attributes = True

# --- Class Schemas ---
class ClassBase(BaseModel):
    class_name: str
    major_id: Optional[str] = None

class ClassCreate(ClassBase):
    pass

class ClassResponse(ClassBase):
    class_id: int

    class Config:
        from_attributes = True

# --- Registration List Schemas ---
class RegistrationListBase(BaseModel):
    list_name: str
    semester_id: int
    description: Optional[str] = None

class RegistrationListCreate(RegistrationListBase):
    pass

class RegistrationListResponse(RegistrationListBase):
    list_id: int
    created_at: date

    class Config:
        from_attributes = True

# --- Curriculum (Chương trình đào tạo) Schemas ---
class MajorSubjectItem(BaseModel):
    subject_id: int
    subject_code: str
    subject_name: str
    credits: int

    class Config:
        from_attributes = True

class MajorSubjectSavePayload(BaseModel):
    subject_ids: List[int]

# --- BatchSemesterSubject (Xếp môn vào kì theo khóa) Schemas ---
class BatchSemesterSubjectItem(BaseModel):
    subject_id: int
    subject_code: str
    subject_name: str
    credits: int

    class Config:
        from_attributes = True

class BatchSemesterSubjectSavePayload(BaseModel):
    major_code: str          # "CNTT"
    batch_code: str          # "19"
    semester_index: int      # 1..10
    subject_ids: List[int]   # Danh sách subject_id được gán


