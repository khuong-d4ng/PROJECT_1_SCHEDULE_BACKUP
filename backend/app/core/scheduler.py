from sqlalchemy.orm import Session
from typing import List, Dict, Set
from collections import defaultdict
from app import models

class TimetableScheduler:
    def __init__(self, db: Session, session_id: int):
        self.db = db
        self.session_id = session_id
        
        self.gv_slots: Dict[str, Set[str]] = defaultdict(set)
        self.gv_subjects: Dict[str, Set[str]] = defaultdict(set)
        self.gv_classes: Dict[str, Set[str]] = defaultdict(set)
        self.gv_hours: Dict[str, int] = defaultdict(int)

    def run(self):
        # 1. Lấy tất cả rows của session
        rows = self.db.query(models.TimetableRow).filter(
            models.TimetableRow.session_id == self.session_id,
        ).all()
        
        # Load trạng thái của các dòng ĐÃ CÓ GV để update tracker
        for row in rows:
            if row.lecturer_name and row.lecturer_name != "Hết GV chính khả dụng":
                gv = row.lecturer_name
                slot = row.day_morning if row.shift == "Sáng" else row.day_afternoon
                if slot:
                    self.gv_slots[gv].add(slot)
                if row.subject_name:
                    self.gv_subjects[gv].add(row.subject_name)
                if row.class_name:
                    self.gv_classes[gv].add(row.class_name)
                
                hours = (row.theory_hours or 0) + (row.practice_hours or 0)
                self.gv_hours[gv] += hours
        
        # Lấy file nguyện vọng để tra cứu mapping
        session_info = self.db.query(models.SchedulingSession).filter(models.SchedulingSession.id == self.session_id).first()
        if not session_info or not session_info.registration_list_id:
            return  # Không có datasource GV để duyệt
            
        registrations = self.db.query(
            models.LecturerRegistration,
            models.Subject.subject_name,
            models.Lecturer.lecturer_name
        ).join(models.Subject, models.LecturerRegistration.subject_id == models.Subject.subject_id)\
         .join(models.Lecturer, models.LecturerRegistration.lecturer_id == models.Lecturer.lecturer_id)\
         .filter(models.LecturerRegistration.list_id == session_info.registration_list_id)\
         .all()
        
        subject_to_lecturers = defaultdict(list)
        for reg, subj_name, lec_name in registrations:
            key = subj_name.strip().lower()
            if reg.is_main_lecturer:
                subject_to_lecturers[key].append(lec_name)
        
        # Filter again just rows that need scheduling
        unassigned_rows = [r for r in rows if r.lecturer_name is None or r.lecturer_name == "Hết GV chính khả dụng"]
        
        for row in unassigned_rows:
            class_name = row.class_name
            subject_name_key = row.subject_name.strip().lower()
            
            # Khớp tên môn để lấy list GV
            matched_gvs_str = None
            for k, val_list in subject_to_lecturers.items():
                if subject_name_key in k or k in subject_name_key:
                    matched_gvs_str = ";".join(val_list) # Combine all lecturers as string separated by ;
                    break
                    
            if not matched_gvs_str:
                row.lecturer_name = "Hết GV chính khả dụng"
                continue
                
            candidates = [gv.strip() for gv in matched_gvs_str.split(";") if gv.strip()]
            valid_candidates = []
            
            for gv in candidates:
                # Constraint 1: Max 3 môn
                if len(self.gv_subjects[gv]) >= 3 and row.subject_name not in self.gv_subjects[gv]:
                    continue
                # Constraint 2: Max 10 lớp
                if len(self.gv_classes[gv]) >= 10 and class_name not in self.gv_classes[gv]:
                    continue
                # Constraint 3: Max 250 tiết
                hours_will_add = (row.theory_hours or 0) + (row.practice_hours or 0)
                if self.gv_hours[gv] + hours_will_add > 250:
                    continue
                    
                valid_candidates.append(gv)
            
            if not valid_candidates:
                row.lecturer_name = "Hết GV chính khả dụng"
                continue
                
            # Ưu tiên GV: có ít tiết hơn đứng trước (Đặc biệt chưa đủ 160)
            valid_candidates.sort(key=lambda gv: (
                self.gv_hours[gv] >= 160, # False (0) đưa lên trước
                self.gv_hours[gv]         # Số tiết từ thấp lên cao
            ))
            
            assigned = False
            for gv in valid_candidates:
                slots_to_try = [f"S-T{day}" for day in range(2, 8)] if row.shift == "Sáng" else [f"C-T{day}" for day in range(2, 8)]
                
                # Môn đặc biệt cố định ngẫu nhiên (chưa implement full rule cho TA, temporarily ignore to fit slot)
                for slot in slots_to_try:
                    if self.is_class_busy(class_name, slot):
                        continue
                    if slot in self.gv_slots[gv]:
                        continue
                        
                    # OK, fit!
                    row.lecturer_name = gv
                    if row.shift == "Sáng":
                        row.day_morning = slot
                    else:
                        row.day_afternoon = slot
                        
                    self.gv_slots[gv].add(slot)
                    self.gv_subjects[gv].add(row.subject_name)
                    self.gv_classes[gv].add(class_name)
                    self.gv_hours[gv] += (row.theory_hours or 0) + (row.practice_hours or 0)
                    self.mark_class_busy(class_name, slot)
                    
                    assigned = True
                    break
                    
                if assigned:
                    break
            
            if not assigned:
                row.lecturer_name = "Hết GV chính khả dụng"
                
        self.db.commit()

    def is_class_busy(self, class_name: str, slot: str) -> bool:
        if not hasattr(self, "class_busy_cache"):
            self.class_busy_cache = defaultdict(set)
            existing_rows = self.db.query(models.TimetableRow).filter(models.TimetableRow.session_id == self.session_id).all()
            for r in existing_rows:
                if r.day_morning: self.class_busy_cache[r.class_name].add(r.day_morning)
                if r.day_afternoon: self.class_busy_cache[r.class_name].add(r.day_afternoon)
        return slot in self.class_busy_cache[class_name]
        
    def mark_class_busy(self, class_name: str, slot: str):
        if not hasattr(self, "class_busy_cache"):
            self.is_class_busy(class_name, slot)
        self.class_busy_cache[class_name].add(slot)
