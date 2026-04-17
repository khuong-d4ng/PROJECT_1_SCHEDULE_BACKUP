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
    theory_credits: int = 0
    practice_credits: int = 0
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

# --- Import Excel Schemas ---
class MissingSubjectItem(BaseModel):
    subject_code: str
    subject_name: str
    credits: int = 3
    theory_hours: int = 0
    practice_hours: int = 0

class MissingLecturerItem(BaseModel):
    lecturer_code: str
    full_name: str
    type: str = "Cơ hữu"

class DirectAssignmentItem(BaseModel):
    subject_code: str
    lecturer_code: str
    is_main_lecturer: bool

class ImportAnalyzeResponse(BaseModel):
    missing_subjects: List[MissingSubjectItem]
    missing_lecturers: List[MissingLecturerItem]
    assignments: List[DirectAssignmentItem]

class ImportResolveRequest(BaseModel):
    resolved_subjects: List[MissingSubjectItem]
    resolved_lecturers: List[MissingLecturerItem]

# --- Timetables Schemas ---
class SessionEntryConfig(BaseModel):
    major_code: str
    batch_code: str
    semester_index: int

class TimetableSessionCreate(BaseModel):
    plan_name: str
    registration_list_id: Optional[int] = None
    entries: List[SessionEntryConfig]

class TimetableSessionResponse(BaseModel):
    session_id: int
    plan_name: str
    registration_list_id: Optional[int]
    status: str
    created_at: date

    class Config:
        from_attributes = True

class TimetableRowResponse(BaseModel):
    row_id: int
    class_name: str
    subject_id: int
    subject_code: str
    subject_name: str
    credits: int
    theory_hours: int
    practice_hours: int
    fixed_shift: Optional[str]
    room_type: Optional[str]
    morning_day: Optional[str]
    afternoon_day: Optional[str]
    main_lecturer_id: Optional[int]
    prac_lecturer_id: Optional[int]
    main_lecturer_name: Optional[str]
    prac_lecturer_name: Optional[str]

    class Config:
        from_attributes = True

class TimetableRowUpdate(BaseModel):
    fixed_shift: Optional[str] = None
    room_type: Optional[str] = None
    morning_day: Optional[str] = None
    afternoon_day: Optional[str] = None
    main_lecturer_id: Optional[int] = None
    prac_lecturer_id: Optional[int] = None
