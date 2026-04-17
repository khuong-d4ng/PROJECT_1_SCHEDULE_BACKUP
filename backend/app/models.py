from sqlalchemy import Boolean, Column, Integer, String, Date, ForeignKey, Enum, Float, Time
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base
from datetime import datetime

class RoleEnum(str, enum.Enum):
    ADMIN = "Admin"
    SCHEDULER = "Cán bộ xếp lịch"
    LECTURER = "Giảng viên"

class LecturerTypeEnum(str, enum.Enum):
    FULL_TIME = "Cơ hữu"
    VISITING = "Thỉnh giảng"

class SemesterStatusEnum(str, enum.Enum):
    DRAFT = "Draft"
    ACTIVE = "Active"
    CLOSED = "Closed"

class ScheduleStatusEnum(str, enum.Enum):
    PENDING = "Pending"
    ASSIGNED = "Assigned"

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.LECTURER, nullable=False)
    
    lecturer_profile = relationship("Lecturer", back_populates="user", uselist=False)

class Lecturer(Base):
    __tablename__ = "lecturers"
    lecturer_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True)
    full_name = Column(String(100), nullable=False)
    lecturer_code = Column(String(20), unique=True, nullable=False)
    type = Column(Enum(LecturerTypeEnum), default=LecturerTypeEnum.FULL_TIME)
    max_quota = Column(Integer, default=0) # Số tiết/buổi tối đa
    
    user = relationship("User", back_populates="lecturer_profile")
    registrations = relationship("LecturerRegistration", back_populates="lecturer")
    schedules = relationship("Schedule", back_populates="lecturer")

class Semester(Base):
    __tablename__ = "semesters"
    semester_id = Column(Integer, primary_key=True, index=True)
    semester_name = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(Enum(SemesterStatusEnum), default=SemesterStatusEnum.DRAFT)
    
    schedules = relationship("Schedule", back_populates="semester")
    registration_lists = relationship("RegistrationList", back_populates="semester")

class Subject(Base):
    __tablename__ = "subjects"
    subject_id = Column(Integer, primary_key=True, index=True)
    subject_code = Column(String(20), unique=True, nullable=False)
    subject_name = Column(String(200), nullable=False)
    credits = Column(Integer, nullable=False)
    theory_credits = Column(Integer, default=0)
    practice_credits = Column(Integer, default=0)
    theory_hours = Column(Integer, default=0)
    practice_hours = Column(Integer, default=0)
    
    equivalent_for = relationship("EquivalentSubject", foreign_keys="[EquivalentSubject.original_subject_id]", back_populates="original_subject")
    equivalents = relationship("EquivalentSubject", foreign_keys="[EquivalentSubject.equivalent_subject_id]", back_populates="equivalent_subject")
    
    registrations = relationship("LecturerRegistration", back_populates="subject")
    schedules = relationship("Schedule", back_populates="subject")

class EquivalentSubject(Base):
    __tablename__ = "equivalent_subjects"
    id = Column(Integer, primary_key=True, index=True)
    original_subject_id = Column(Integer, ForeignKey("subjects.subject_id"), nullable=False)
    equivalent_subject_id = Column(Integer, ForeignKey("subjects.subject_id"), nullable=False)
    
    original_subject = relationship("Subject", foreign_keys=[original_subject_id], back_populates="equivalent_for")
    equivalent_subject = relationship("Subject", foreign_keys=[equivalent_subject_id], back_populates="equivalents")

class Class(Base):
    __tablename__ = "classes"
    class_id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(50), nullable=False)
    major_id = Column(String(50), nullable=True) # Mở rộng
    
    schedules = relationship("Schedule", back_populates="class_")

class RegistrationList(Base):
    __tablename__ = "registration_lists"
    list_id = Column(Integer, primary_key=True, index=True)
    list_name = Column(String(200), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.semester_id"), nullable=False)
    description = Column(String(500), nullable=True)
    created_at = Column(Date, default=datetime.utcnow)
    
    semester = relationship("Semester", back_populates="registration_lists")
    registrations = relationship("LecturerRegistration", back_populates="registration_list", cascade="all, delete-orphan")

class LecturerRegistration(Base):
    __tablename__ = "lecturer_registrations"
    registration_id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("registration_lists.list_id", ondelete="CASCADE"), nullable=False)
    lecturer_id = Column(Integer, ForeignKey("lecturers.lecturer_id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"), nullable=False)
    is_main_lecturer = Column(Boolean, default=True) # True: Dạy chính, False: Dạy thực hành
    
    registration_list = relationship("RegistrationList", back_populates="registrations")
    lecturer = relationship("Lecturer", back_populates="registrations")
    subject = relationship("Subject", back_populates="registrations")

class Schedule(Base):
    __tablename__ = "schedules"
    schedule_id = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.semester_id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.class_id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"), nullable=False)
    day_of_week = Column(Integer, nullable=False) # 2 -> 8 (CN)
    shift = Column(String(20), nullable=False) # Sáng, Chiều, Tối
    room_type = Column(String(50), nullable=True) # Phòng thường, phòng máy...
    lecturer_id = Column(Integer, ForeignKey("lecturers.lecturer_id"), nullable=True)
    status = Column(Enum(ScheduleStatusEnum), default=ScheduleStatusEnum.PENDING)
    
    semester = relationship("Semester", back_populates="schedules")
    class_ = relationship("Class", back_populates="schedules")
    subject = relationship("Subject", back_populates="schedules")
    lecturer = relationship("Lecturer", back_populates="schedules")

class MajorSubject(Base):
    """Chương trình đào tạo: gán danh sách môn cho từng ngành"""
    __tablename__ = "major_subjects"
    id = Column(Integer, primary_key=True, index=True)
    major_code = Column(String(20), nullable=False, index=True)  # "CNTT", "HTTT", "KHMT"
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"), nullable=False)
    
    subject = relationship("Subject")

class BatchSemesterSubject(Base):
    """Xếp môn vào từng kì cho từng khóa (áp dụng chung cho tất cả lớp trong khóa)"""
    __tablename__ = "batch_semester_subjects"
    id = Column(Integer, primary_key=True, index=True)
    major_code = Column(String(20), nullable=False, index=True)    # "CNTT", "HTTT", "KHMT"
    batch_code = Column(String(10), nullable=False, index=True)    # "19"
    semester_index = Column(Integer, nullable=False)                # 1..10
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"), nullable=False)
    
    subject = relationship("Subject")

class TimetableSessionStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    DONE = "DONE"

class SchedulingSession(Base):
    __tablename__ = "scheduling_sessions"
    session_id = Column(Integer, primary_key=True, index=True)
    plan_name = Column(String(200), nullable=False)
    registration_list_id = Column(Integer, ForeignKey("registration_lists.list_id"), nullable=True)
    created_at = Column(Date, default=datetime.utcnow)
    status = Column(Enum(TimetableSessionStatusEnum), default=TimetableSessionStatusEnum.DRAFT)
    
    entries = relationship("SessionEntry", back_populates="session", cascade="all, delete-orphan")
    timetable_rows = relationship("TimetableRow", back_populates="session", cascade="all, delete-orphan")

class SessionEntry(Base):
    """Cấu hình các block (Ngành, Khóa, Kì) đã chọn để gen TKB"""
    __tablename__ = "session_entries"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("scheduling_sessions.session_id", ondelete="CASCADE"), nullable=False)
    major_code = Column(String(20), nullable=False)
    batch_code = Column(String(10), nullable=False)
    semester_index = Column(Integer, nullable=False)
    
    session = relationship("SchedulingSession", back_populates="entries")

class TimetableRow(Base):
    """Tương đương 1 Row của file Excel hiển thị trên Frontend"""
    __tablename__ = "timetable_rows"
    row_id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("scheduling_sessions.session_id", ondelete="CASCADE"), nullable=False)
    
    class_name = Column(String(50), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"), nullable=False)
    
    fixed_shift = Column(String(50), nullable=True) # Sáng / Chiều
    room_type = Column(String(50), nullable=True)   # Phòng thường, Phòng máy
    
    # Lịch & Phân công
    morning_day = Column(String(50), nullable=True)   # VD: S-T2
    afternoon_day = Column(String(50), nullable=True) # VD: C-T2
    
    main_lecturer_id = Column(Integer, ForeignKey("lecturers.lecturer_id"), nullable=True)
    prac_lecturer_id = Column(Integer, ForeignKey("lecturers.lecturer_id"), nullable=True)

    session = relationship("SchedulingSession", back_populates="timetable_rows")
    subject = relationship("Subject")
    main_lecturer = relationship("Lecturer", foreign_keys=[main_lecturer_id])
    prac_lecturer = relationship("Lecturer", foreign_keys=[prac_lecturer_id])
