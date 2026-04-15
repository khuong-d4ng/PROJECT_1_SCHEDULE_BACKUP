from app.core.database import SessionLocal
from app.models import Lecturer, Subject, LecturerRegistration

db = SessionLocal()
print(f"Tổng số giảng viên trong DB: {db.query(Lecturer).count()}")
print(f"Tổng số môn học trong DB: {db.query(Subject).count()}")
print(f"Tổng số đăng ký nguyện vọng: {db.query(LecturerRegistration).count()}")

# In ra 3 bản ghi đầu tiên môn học
print("Môn học tiêu biểu:")
for sub in db.query(Subject).limit(3).all():
    print(f"- {sub.subject_code} | {sub.subject_name}")

db.close()
