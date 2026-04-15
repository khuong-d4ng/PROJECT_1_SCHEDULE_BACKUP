from app.core.database import SessionLocal
from app.models import Semester, SemesterStatusEnum
import datetime

db = SessionLocal()
s = db.query(Semester).first()
if not s:
    db.add(Semester(
        semester_id=1,
        semester_name='Kỳ 1 năm 2024', 
        start_date=datetime.date(2024,1,1), 
        end_date=datetime.date(2024,6,1), 
        status=SemesterStatusEnum.ACTIVE
    ))
    db.commit()
    print('Added default semester 1')
else:
    print('Semester already exists')
db.close()
