"""
Script: Tạo nhanh tài khoản User cho tất cả Giảng viên hiện tại trong DB.
- username = lecturer_code
- password = 123456
- role = Giảng viên
- Liên kết user_id vào bảng Lecturer

Chạy: python -m scripts.seed_lecturers
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app import models

def main():
    db = SessionLocal()
    try:
        lecturers = db.query(models.Lecturer).all()
        if not lecturers:
            print("Không có giảng viên nào trong DB.")
            return

        created = 0
        skipped = 0
        default_password = hash_password("123456")

        for lec in lecturers:
            # Skip if lecturer already has a user account
            if lec.user_id is not None:
                skipped += 1
                continue

            # Check if username already exists
            existing = db.query(models.User).filter(models.User.username == lec.lecturer_code).first()
            if existing:
                # Link existing user to lecturer
                lec.user_id = existing.user_id
                skipped += 1
                continue

            # Create new user
            user = models.User(
                username=lec.lecturer_code,
                email=None,
                password_hash=default_password,
                role=models.RoleEnum.LECTURER,
                receive_emails=False,
            )
            db.add(user)
            db.flush()  # Get the user_id

            # Link user to lecturer
            lec.user_id = user.user_id
            created += 1

        # Also seed admin + canbo if not exist
        admin_created = 0
        for acc in [
            {"username": "admin", "email": "admin@system.local", "password": "admin123", "role": models.RoleEnum.ADMIN},
            {"username": "canbo", "email": "canbo@system.local", "password": "canbo123", "role": models.RoleEnum.SCHEDULER},
        ]:
            existing = db.query(models.User).filter(models.User.username == acc["username"]).first()
            if not existing:
                user = models.User(
                    username=acc["username"],
                    email=acc["email"],
                    password_hash=hash_password(acc["password"]),
                    role=acc["role"],
                )
                db.add(user)
                admin_created += 1

        db.commit()
        print("[OK] Hoan tat seed!")
        print(f"   - Tai khoan GV moi: {created}")
        print(f"   - GV da co tai khoan (bo qua): {skipped}")
        print(f"   - Tai khoan admin/canbo moi: {admin_created}")
        print(f"   - Mat khau mac dinh GV: 123456")
        print(f"   - Admin: admin/admin123, Can bo: canbo/canbo123")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Loi: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
