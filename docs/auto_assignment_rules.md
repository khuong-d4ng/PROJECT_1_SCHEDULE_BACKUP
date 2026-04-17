# Auto-Assignment Engine Rules & Specifications
*Target Audience: AI Agent / Algorithmic Engine*

## 1. Context & Objective
This document outlines the Constraint Satisfaction Problem (CSP) for assigning **Lecturers** and **Schedule Slots (Days)** to a given set of **Timetable Rows (Class x Subject)**.
The objective is to fill the missing fields `morning_day`, `afternoon_day`, `main_lecturer_id`, and `prac_lecturer_id` without violating any **Hard Constraints** and maximizing the score of **Soft Constraints (Priorities)**.

## 2. Terminology & Data Structures
- **Row / Entry**: A single record in the timetable, representing 1 Class taking 1 Subject.
- **Slot**: A tuple of `(Shift, Day)`. Shift $\in$ `{Sáng, Chiều}`, Day $\in$ `{T2, T3, T4, T5, T6, T7}`.
- **Credit Weight (Trọng số)**: A subject's structural format expressed as `"a-b"` (e.g. `"2-1"`), where `a` is theory credits and `b` is practical credits.
- **Hours Calculation**: The time weight for a subject assigned to a lecturer relies on its credit weights:
  - **Main Lecturer (Lý thuyết)**: Allocated hours = `a * 15`.
  - **Practical Lecturer (Thực hành)**: Allocated hours = `b * 15`.

## 3. Hard Constraints (Must NOT Violate)
Any assignment violating these rules is completely invalid.
1. `C_CLASS_OVERLAP`: A single Class cannot have more than one Subject scheduled in the exact same Slot.
2. `C_LEC_OVERLAP`: A single Lecturer cannot be assigned to teach more than one Row (Class x Subject) in the exact same Slot. **This absolute rule applies to BOTH Main and Practical lecturers.**
3. `C_SHIFT_STRICT`: The assigned Day must strictly match the `fixed_shift` property of the Row. 
   - If `fixed_shift == 'Sáng'`, the slot MUST be `S-Ty` and placed in the `morning_day` column.
   - If `fixed_shift == 'Chiều'`, the slot MUST be `C-Ty` and placed in the `afternoon_day` column.
4. `C_MANUAL_EXEMPTION`: Custom or cross-department subjects (e.g. *Tiếng Anh 1, 2, 3, 4; Tư tưởng Hồ Chí Minh; Luật đại cương*) which are deliberately omitted from the database **MUST BE IGNORED** by the auto-assigner algorithm. The algorithm shall only process rows where Subjects exist in the internal DB mapping; allowing users to assign foreign subjects entirely manually.
5. `C_CAPABILITY_STRICT`: A Lecturer can only be assigned to a Row if they are explicitly registered to teach that Subject in the Preference Mapping.
6. `C_MAIN_LEC_MAX_SUBJECTS`: A Main Lecturer cannot be assigned to more than `3` **distinct** Subjects across all their assigned classes. (Note: Practical lecturers are exempt from this subject diversity limit).
7. `C_MAIN_LEC_MAX_CLASSES`: A Main Lecturer cannot be assigned to more than `10` Classes in total. (Note: Practical lecturers are exempt from this class count limit).

## 4. Soft Constraints (Optimization / Priorities)
These bounds are targets for the optimization engine. If absolute satisfaction is impossible, the engine should gracefully fallback and log violations instead of halting.

1. `O_FILL_FALLBACK`: **Highest Priority**. If a Row CANNOT be assigned any valid Main Lecturer due to hard constraints (e.g., all capable lecturers are busy or limits reached), the engine must leave the lecturer ID null and explicitly flag/label it as `"Hết giảng viên chính khả dụng"`. **It must NOT violate a hard constraint just to fill the cell.**
2. `O_TARGET_HOURS_160`: **Crucial Optimization Goal**. The algorithm must actively steer assignments so that Main Lecturers naturally gravitate as close to `160 hours` as possible. For instance, if Lecturer A (already possessing 160 hours) and Lecturer B ( possessing 0 hours) are both available for a slot, the system MUST prioritize Lecturer B to balance the workload. 
3. `O_MAX_HOURS_250`: A Lecturer should generally not exceed `250` accumulated hours total across the timetable.
4. `O_PRAC_CO_ASSIGN`: If a Subject has a Practical Lecturer defined in preferences, attempt to assign them parallel to the Main Lecturer for the same row. 
5. `O_SUBJECT_FATIGUE`: Avoid assigning the exact same Subject to the exact same Lecturer for more than `6` different Classes. (If unavoidable, emit a warning note to the summary report).
