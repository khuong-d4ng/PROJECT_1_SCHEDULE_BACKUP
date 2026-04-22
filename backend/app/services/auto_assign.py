"""
Auto-Assignment Engine v1.0
===========================
Constraint Satisfaction Problem (CSP) solver for timetable lecturer assignment.

Supports 2 scoring strategies:
  - Strategy A (Saturation): Fill one lecturer to 160h before moving to next.
  - Strategy B (Load Balancing): Spread hours evenly across all lecturers.

References: docs/auto_assignment_rules.md
"""

from sqlalchemy.orm import Session
from app import models
from collections import defaultdict
from dataclasses import dataclass, field
from typing import List, Dict, Set, Optional, Tuple

# Available day slots
DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7']

TARGET_HOURS = 160
SOFT_MAX_HOURS = 250
MAX_DISTINCT_SUBJECTS_MAIN = 3
MAX_CLASSES_MAIN = 10
MAX_SAME_SUBJECT_CLASSES = 6


@dataclass
class AssignmentResult:
    assigned_count: int = 0
    unassigned_count: int = 0
    warnings: List[str] = field(default_factory=list)
    slot_assigned_count: int = 0


class AutoAssigner:
    def __init__(self, session_id: int, db: Session, strategy: str = "A"):
        self.session_id = session_id
        self.db = db
        self.strategy = strategy  # "A" = Saturation, "B" = Load Balancing

        # Will be populated by _load_data()
        self.rows: List[models.TimetableRow] = []
        self.preference_map: Dict[int, Dict[str, Set[int]]] = {}  # subject_id -> {"main": {lec_ids}, "prac": {lec_ids}}
        self.subject_cache: Dict[int, models.Subject] = {}

        # Tracking state (mutable during assignment)
        self.lec_hours: Dict[int, float] = defaultdict(float)  # lecturer_id -> total hours assigned
        self.lec_subjects: Dict[int, Set[int]] = defaultdict(set)  # main lec -> set of distinct subject_ids
        self.lec_classes: Dict[int, Set[str]] = defaultdict(set)   # main lec -> set of class_names
        self.lec_subject_class_count: Dict[int, Dict[int, int]] = defaultdict(lambda: defaultdict(int))  # lec -> subj -> count
        
        # Slot occupancy tracking
        self.class_slots: Dict[str, Set[str]] = defaultdict(set)  # class_name -> set of occupied slots ("S-T2", etc.)
        self.lec_slots: Dict[int, Set[str]] = defaultdict(set)    # lecturer_id -> set of occupied slots

    def run(self) -> AssignmentResult:
        self._load_data()
        result = AssignmentResult()

        # Process rows that need assignment (no main_lecturer_id yet)
        unassigned_rows = [r for r in self.rows if r.main_lecturer_id is None]
        
        for row in unassigned_rows:
            success = self._assign_row(row, result)
            if success:
                result.assigned_count += 1
            else:
                result.unassigned_count += 1

        self.db.commit()
        return result

    def _load_data(self):
        """Load all necessary data from DB into memory."""
        # Load rows
        self.rows = self.db.query(models.TimetableRow).filter(
            models.TimetableRow.session_id == self.session_id
        ).all()

        # Cache subjects
        subject_ids = {r.subject_id for r in self.rows if r.subject_id}
        if subject_ids:
            subjects = self.db.query(models.Subject).filter(
                models.Subject.subject_id.in_(subject_ids)
            ).all()
            self.subject_cache = {s.subject_id: s for s in subjects}

        # Load preference mapping from the session's registration_list
        session = self.db.query(models.SchedulingSession).filter(
            models.SchedulingSession.session_id == self.session_id
        ).first()

        if session and session.registration_list_id:
            regs = self.db.query(models.LecturerRegistration).filter(
                models.LecturerRegistration.list_id == session.registration_list_id
            ).all()
            for reg in regs:
                sid = reg.subject_id
                lid = reg.lecturer_id
                if sid not in self.preference_map:
                    self.preference_map[sid] = {"main": set(), "prac": set()}
                if reg.is_main_lecturer:
                    self.preference_map[sid]["main"].add(lid)
                else:
                    self.preference_map[sid]["prac"].add(lid)

        # Pre-populate tracking from already-assigned rows
        for r in self.rows:
            subj = self.subject_cache.get(r.subject_id)
            if not subj:
                continue
            th = subj.theory_hours or 0
            ph = subj.practice_hours or 0

            slot = r.morning_day or r.afternoon_day
            if slot:
                self.class_slots[r.class_name].add(slot)

            if r.main_lecturer_id:
                mid = r.main_lecturer_id
                if r.prac_lecturer_id:
                    self.lec_hours[mid] += th
                    self.lec_hours[r.prac_lecturer_id] += ph
                else:
                    self.lec_hours[mid] += th + ph
                
                self.lec_subjects[mid].add(r.subject_id)
                self.lec_classes[mid].add(r.class_name)
                self.lec_subject_class_count[mid][r.subject_id] += 1

                if slot:
                    self.lec_slots[mid].add(slot)
                if r.prac_lecturer_id and slot:
                    self.lec_slots[r.prac_lecturer_id].add(slot)

    def _assign_row(self, row: models.TimetableRow, result: AssignmentResult) -> bool:
        """Try to assign a lecturer + slot to a single row. Returns True if successful."""
        subj = self.subject_cache.get(row.subject_id)
        if not subj:
            return False

        # C_MANUAL_EXEMPTION: Skip if subject has no preference mapping
        if row.subject_id not in self.preference_map:
            result.warnings.append(
                f"⚠️ Môn {subj.subject_code} ({subj.subject_name}) không có GV đăng ký nguyện vọng - bỏ qua"
            )
            return False

        # Determine available slots based on fixed_shift
        fixed = row.fixed_shift
        if not fixed:
            result.warnings.append(
                f"⚠️ {row.class_name} - {subj.subject_code}: Chưa chọn Buổi Cố Định - bỏ qua"
            )
            return False

        if fixed == 'Sáng':
            candidate_slots = [f"S-{d}" for d in DAYS]
        else:
            candidate_slots = [f"C-{d}" for d in DAYS]

        # Get candidate main lecturers (C_CAPABILITY_STRICT)
        main_candidates = list(self.preference_map[row.subject_id].get("main", set()))
        prac_candidates = list(self.preference_map[row.subject_id].get("prac", set()))

        th = subj.theory_hours or 0
        ph = subj.practice_hours or 0
        has_prac_candidates = len(prac_candidates) > 0

        # Try each slot, find best (slot, lecturer) combo
        best_combo: Optional[Tuple[str, int, Optional[int]]] = None
        best_score = -999999

        for slot in candidate_slots:
            # C_CLASS_OVERLAP: Check if this class already has something in this slot
            if slot in self.class_slots[row.class_name]:
                continue

            for lec_id in main_candidates:
                # --- HARD CONSTRAINT CHECKS ---
                # C_LEC_OVERLAP
                if slot in self.lec_slots[lec_id]:
                    continue
                # C_MAIN_LEC_MAX_SUBJECTS
                future_subjects = self.lec_subjects[lec_id] | {row.subject_id}
                if len(future_subjects) > MAX_DISTINCT_SUBJECTS_MAIN:
                    continue
                # C_MAIN_LEC_MAX_CLASSES
                future_classes = self.lec_classes[lec_id] | {row.class_name}
                if len(future_classes) > MAX_CLASSES_MAIN:
                    continue

                # --- SCORE (Soft Constraints) ---
                score = self._score_lecturer(lec_id, row.subject_id, th, ph, has_prac_candidates)

                # Find best prac lecturer for this slot (if applicable)
                prac_id = None
                if has_prac_candidates:
                    prac_id = self._find_best_prac(prac_candidates, slot, ph)

                if score > best_score:
                    best_score = score
                    best_combo = (slot, lec_id, prac_id)

        if best_combo is None:
            # O_FILL_FALLBACK
            result.warnings.append(
                f"❌ {row.class_name} - {subj.subject_code} ({subj.subject_name}): "
                f"Hết giảng viên chính khả dụng"
            )
            return False

        # --- APPLY ASSIGNMENT ---
        slot, main_id, prac_id = best_combo
        
        # Set slot
        if fixed == 'Sáng':
            row.morning_day = slot
        else:
            row.afternoon_day = slot
        result.slot_assigned_count += 1

        # Set lecturers
        row.main_lecturer_id = main_id
        row.prac_lecturer_id = prac_id  # May be None

        # Update tracking
        self.class_slots[row.class_name].add(slot)
        self.lec_slots[main_id].add(slot)
        self.lec_subjects[main_id].add(row.subject_id)
        self.lec_classes[main_id].add(row.class_name)
        self.lec_subject_class_count[main_id][row.subject_id] += 1

        if prac_id:
            self.lec_hours[main_id] += th
            self.lec_hours[prac_id] += ph
            self.lec_slots[prac_id].add(slot)
        else:
            # Main lecturer takes all hours
            self.lec_hours[main_id] += th + ph

        # O_SUBJECT_FATIGUE warning
        if self.lec_subject_class_count[main_id][row.subject_id] > MAX_SAME_SUBJECT_CLASSES:
            lec = self.db.query(models.Lecturer).filter(models.Lecturer.lecturer_id == main_id).first()
            result.warnings.append(
                f"⚠️ GV {lec.full_name if lec else main_id} đã dạy môn {subj.subject_code} "
                f"cho {self.lec_subject_class_count[main_id][row.subject_id]} lớp (> {MAX_SAME_SUBJECT_CLASSES})"
            )

        # O_MAX_HOURS_250 warning
        if self.lec_hours[main_id] > SOFT_MAX_HOURS:
            lec = self.db.query(models.Lecturer).filter(models.Lecturer.lecturer_id == main_id).first()
            result.warnings.append(
                f"⚠️ GV {lec.full_name if lec else main_id} đã vượt {SOFT_MAX_HOURS} tiết "
                f"(hiện tại: {self.lec_hours[main_id]} tiết)"
            )

        return True

    def _score_lecturer(self, lec_id: int, subject_id: int, 
                        theory_h: int, prac_h: int, has_prac: bool) -> float:
        """Score a lecturer candidate. Higher = better."""
        current_hours = self.lec_hours[lec_id]
        hours_to_add = theory_h if has_prac else (theory_h + prac_h)
        projected = current_hours + hours_to_add

        score = 0.0

        if self.strategy == "A":
            # === SATURATION STRATEGY ===
            # Prefer lecturers who are closest to (but below) 160.
            # Once one hits 160, heavily penalize to move to next lecturer.
            if current_hours >= TARGET_HOURS:
                score -= 5000  # Strongly discourage assigning more
            else:
                # Prefer the one closest to 160 (from below) to fill them up first
                score += current_hours  # Higher current = closer to 160 = better
        else:
            # === LOAD BALANCING STRATEGY ===
            # Prefer lecturers with fewest hours (spread evenly)
            score -= current_hours  # Lower current = better

        # O_MAX_HOURS_250: Penalize if projected exceeds soft max
        if projected > SOFT_MAX_HOURS:
            score -= 10000

        # O_SUBJECT_FATIGUE: Penalize if already teaching this subject to many classes
        fatigue_count = self.lec_subject_class_count[lec_id].get(subject_id, 0)
        if fatigue_count >= MAX_SAME_SUBJECT_CLASSES:
            score -= 2000

        return score

    def _find_best_prac(self, prac_candidates: List[int], slot: str, prac_hours: int) -> Optional[int]:
        """Find the best practical lecturer for a given slot."""
        best_id = None
        best_score = -999999

        for pid in prac_candidates:
            # C_LEC_OVERLAP
            if slot in self.lec_slots[pid]:
                continue

            current = self.lec_hours[pid]
            projected = current + prac_hours

            score = 0.0
            if self.strategy == "A":
                if current >= TARGET_HOURS:
                    score -= 5000
                else:
                    score += current
            else:
                score -= current

            if projected > SOFT_MAX_HOURS:
                score -= 10000

            if score > best_score:
                best_score = score
                best_id = pid

        return best_id
