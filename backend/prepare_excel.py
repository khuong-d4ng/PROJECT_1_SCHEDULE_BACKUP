import pandas as pd
import math
import re
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import Subject, Lecturer, LecturerRegistration, Semester, SemesterStatusEnum, LecturerTypeEnum

# Cấu hình đường dẫn file
DS_GIANG_VIEN_FILE = r"d:\.PROJECT_1\1_data_excel\DS_GIẢNG_VIÊN.xlsx"
NGUYEN_VONG_FILE = r"d:\.PROJECT_1\1_data_excel\Nguyện vọng dạy của giảng viên.xlsx"

def clear_data(db: Session):
    print("Xóa dữ liệu cũ (nếu có)...")
    db.query(LecturerRegistration).delete()
    db.query(Subject).delete()
    # Không tạo/xóa giảng viên nếu đã có dữ liệu quan trọng, nhưng vì là seed nên ta xóa cho sạch
    db.query(Lecturer).delete()
    db.commit()

def parse_lecturers_string(s: str):
    if pd.isna(s) or not str(s).strip():
        return []
    
    # Split bằng phẩy hoặc chấm phẩy
    parts = re.split(r'[,;]', str(s))
    results = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        
        # Nhận diện định dạng Tên - Mã (vd: Nguyễn Văn A - DN001)
        if '-' in part:
            # Lấy phần tử cuối cùng sau dấu trừ làm MÃ (phòng trường hợp tên có dấu trừ)
            sub_parts = part.rsplit('-', 1) 
            name = sub_parts[0].strip()
            code = sub_parts[1].strip()
            results.append({"name": name, "code": code})
        else:
            results.append({"name": part, "code": None})
    return results

def run_import():
    db = SessionLocal()
    try:
        # 1. Tạo 1 Học kỳ mặc định nếu chưa có
        semester = db.query(Semester).first()
        if not semester:
            import datetime
            semester = Semester(
                semester_name="Học kỳ Tạm (Import)",
                start_date=datetime.date(2024, 1, 1),
                end_date=datetime.date(2024, 6, 1),
                status=SemesterStatusEnum.ACTIVE
            )
            db.add(semester)
            db.commit()
            db.refresh(semester)
        
        # 2. Xử lý Danh sách giảng viên
        print(f"Đọc file {DS_GIANG_VIEN_FILE}...")
        df_gv = pd.read_excel(DS_GIANG_VIEN_FILE)
        
        # Xóa khoản trắng thừa ở header
        df_gv.columns = [str(c).strip() for c in df_gv.columns]
        
        lecturers_dict = {} # Lưu lại MÃ -> Object Model
        lecturers_name_map = {} # Lưu lại TÊN -> MÃ để fallback
        
        for index, row in df_gv.iterrows():
            code = str(row.get('MA ĐINH DANH CU', '')).strip()
            name = str(row.get('HỌ VÀ TÊN', '')).strip()
            role = str(row.get('Chức vụ', '')).strip()
            
            if pd.isna(code) or not code or code == 'nan':
                continue
                
            l_type = LecturerTypeEnum.FULL_TIME
            if 'thực hành' in role.lower():
                l_type = LecturerTypeEnum.VISITING # Mượn tạm type VISITING xử lý logic, có thể đổi logic sau
                
            lecturer = Lecturer(
                lecturer_code=code,
                full_name=name,
                type=l_type,
                max_quota=0
            )
            db.add(lecturer)
            lecturers_dict[code] = lecturer
            # Chuẩn hóa tên thường để match
            lecturers_name_map[name.lower()] = code
            
        # Commit lần 1 để có ID
        db.commit()
        print(f"Đã nạp {len(lecturers_dict)} Giảng viên gốc.")
        
        # 3. Xử lý file Nguyện vọng
        print(f"Đọc file {NGUYEN_VONG_FILE}...")
        df_nv = pd.read_excel(NGUYEN_VONG_FILE)
        df_nv.columns = [str(c).strip() for c in df_nv.columns]
        
        temp_count = 1
        
        for index, row in df_nv.iterrows():
            subj_name = row.get('Tên học phần')
            if pd.isna(subj_name) or not str(subj_name).strip():
                continue
                
            subj_name = str(subj_name).strip()
            subj_code = row.get('Mã học phần')
            
            if pd.isna(subj_code) or not str(subj_code).strip() or str(subj_code).strip() == 'nan':
                subj_code = f"TEMP_X{temp_count:03d}"
                temp_count += 1
            else:
                subj_code = str(subj_code).strip()
                
            # Tạo Subject
            subject = db.query(Subject).filter(Subject.subject_code == subj_code).first()
            if not subject:
                subject = Subject(
                    subject_code=subj_code,
                    subject_name=subj_name,
                    credits=3, # Mặc định
                    theory_hours=30,
                    practice_hours=0
                )
                db.add(subject)
                db.flush() # Để lấy ID tạm thời
            
            main_lecturers_raw = row.get('Giảng viên chính')
            practice_lecturers_raw = row.get('Giảng viên thực hành')
            
            parsed_main = parse_lecturers_string(main_lecturers_raw)
            parsed_prac = parse_lecturers_string(practice_lecturers_raw)
            
            # Logic Map Giảng viên
            def map_and_register(parsed_list, is_main):
                for item in parsed_list:
                    matched_lecturer = None
                    # Nếu file có ghi Mã
                    if item['code'] and item['code'] in lecturers_dict:
                        matched_lecturer = lecturers_dict[item['code']]
                    else:
                        # Fallback dò bằng Tên
                        name_lower = item['name'].lower()
                        if name_lower in lecturers_name_map:
                            matched_lecturer = lecturers_dict[lecturers_name_map[name_lower]]
                    
                    if matched_lecturer:
                        # Ưu tiên nâng cấp chức vụ quy chuẩn 
                        # Nếu họ đang là 'thực hành' (trong DB cũ) mà giờ khai báo vào 'Giảng viên chính' 
                        # thì Update override profile
                        if is_main and matched_lecturer.type != LecturerTypeEnum.FULL_TIME:
                            matched_lecturer.type = LecturerTypeEnum.FULL_TIME
                            
                        # Tạo Registration (Kiểm tra xem tạo chưa tránh lỗi unique nếu có)
                        exist_reg = db.query(LecturerRegistration).filter(
                            LecturerRegistration.semester_id == semester.semester_id,
                            LecturerRegistration.lecturer_id == matched_lecturer.lecturer_id,
                            LecturerRegistration.subject_id == subject.subject_id,
                            LecturerRegistration.is_main_lecturer == is_main
                        ).first()
                        
                        if not exist_reg:
                            reg = LecturerRegistration(
                                semester_id=semester.semester_id,
                                lecturer_id=matched_lecturer.lecturer_id,
                                subject_id=subject.subject_id,
                                is_main_lecturer=is_main
                            )
                            db.add(reg)
                            
            map_and_register(parsed_main, True)
            map_and_register(parsed_prac, False)
        
        db.commit()
        print("Done! Đã import toàn bộ dữ liệu thành công.")
        
    except Exception as e:
        print(f"Có lỗi xảy ra, tiến hành ROLLBACK: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_import()
