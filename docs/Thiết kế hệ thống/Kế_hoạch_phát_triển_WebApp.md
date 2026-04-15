# Kế hoạch & Kiến trúc Xây dựng Hệ thống Quản lý và Phân công TKB (Đồ án tốt nghiệp thực tế)

Tài liệu này trình bày kế hoạch chi tiết từ con số 0 để xây dựng hệ thống webapp theo chuẩn đồ án tốt nghiệp có khả năng ứng dụng thực tiễn cao, bao gồm lựa chọn công nghệ, thiết kế CSDL và lộ trình phát triển.

## 1. Lựa chọn Công nghệ (Tech Stack)
Để đảm bảo hệ thống hiện đại, dễ bảo trì và có hiệu năng tốt khi ứng dụng vào thực tế, tech stack đề xuất như sau:

*   **Frontend (Ứng dụng Web hướng người dùng):**
    *   **Framework:** ReactJS (hoặc Next.js) + TypeScript. (Ưu điểm: Phổ biến, nhiều thư viện hỗ trợ giao diện kéo thả như `react-beautiful-dnd` hoặc `dnd-kit` cực kỳ quan trọng cho dự án này).
    *   **Styling:** Tailwind CSS + Ant Design / MUI (Tối ưu UI quản trị chuyên nghiệp).
    *   **Quản lý State:** Redux Toolkit / Zustand.
*   **Backend (Xử lý nghiệp vụ & Scheduling Logic):**
    *   **Framework:** Node.js (Express/NestJS) **hoặc** Python (FastAPI/Django). 
        *   *Khuyến nghị:* Mảng Tự động phân công nên dùng Python (FastAPI) vì hỗ trợ tốt các thư viện thuật toán, xử lý logic tối ưu toán học (nếu sau này mở rộng dùng Constraint Programming). Nếu code bằng Node.js thì dùng NestJS để đảm bảo kiến trúc chặt chẽ.
*   **Database (Cơ sở dữ liệu):**
    *   **Cơ sở dữ liệu chính:** PostgreSQL (Hệ quản trị CSDL quan hệ mạnh mẽ, xử lý tốt các ràng buộc phức tạp của TKB).
    *   **Cache (Tùy chọn cho Caching Session/Temporary TKB):** Redis.
*   **Khác:**
    *   **Xử lý Excel:** `xlsx` hoặc `openpyxl` (Python) để xử lý Import/Export.
    *   **Triển khai (Deployment):** Docker (để dễ dàng đóng gói), AWS EC2 / Vercel (Front) + Render/Railway (Back).

## 2. Thiết kế Cơ sở dữ liệu cốt lõi (Database Schema)
Dưới đây là các thực thể (Tables) lõi cần thiết để xây dựng hệ thống. Bản thiết kế hướng đến chuẩn hóa để lưu trữ và vận hành tốt thuật toán:

**1. Bảng `Users` (Người dùng & Phân quyền)**
- `user_id` (PK)
- `username`, `password_hash`, `email`
- `role` (Admin / Cán bộ xếp lịch / Giảng viên)
- `created_at`, `updated_at`

**2. Bảng `Lecturers` (Thông tin Giảng viên)**
- `lecturer_id` (PK)
- `user_id` (FK -> Users)
- `full_name`, `lecturer_code`
- `type` (Giảng viên cơ hữu / Thỉnh giảng / Chính / Thực hành...)
- `max_quota` (Số tiết/buổi chỉ tiêu tối đa trong kì)

**3. Bảng `Semesters` (Học kỳ)**
- `semester_id` (PK)
- `semester_name` (VD: HK1 2024-2025)
- `start_date`, `end_date`
- `status` (Draft / Active / Closed)

**4. Bảng `Subjects` (Môn học/Học phần)**
- `subject_id` (PK)
- `subject_code` (Mã học phần)
- `subject_name` (Tên môn học)
- `credits` (Số tín chỉ)
- `theory_hours` (Tiết lý thuyết), `practice_hours` (Tiết thực hành)

**5. Bảng `Equivalent_Subjects` (Môn tương đương để cấu hình đổi môn)**
- `id` (PK)
- `original_subject_id` (FK -> Subjects)
- `equivalent_subject_id` (FK -> Subjects)

**6. Bảng `Classes` (Lớp học)**
- `class_id` (PK)
- `class_name` (VD: CNTT 17-01)
- `major_id` (Chuyên ngành - mở rộng)

**7. Bảng `Lecturer_Registrations` (Nguyện vọng đăng ký của GV/Kỳ)**
- `registration_id` (PK)
- `semester_id` (FK -> Semesters)
- `lecturer_id` (FK -> Lecturers)
- `subject_id` (FK -> Subjects)
- `is_main_lecturer` (Boolean - Đăng ký dạy chính hay thực hành)

**8. Bảng `Schedules` (Khung Thời khóa biểu của Lớp/Kỳ - Chờ gán hoặc Đã gán GV)**
- `schedule_id` (PK)
- `semester_id` (FK -> Semesters)
- `class_id` (FK -> Classes)
- `subject_id` (FK -> Subjects)
- `day_of_week` (Thứ 2 -> Chủ Nhật)
- `shift` (Ca Sáng / Chiều / Tối)
- `room_type` (Phòng thường, Phòng máy...)
- `lecturer_id` (FK -> Lecturers, *Có thể NULL, khi tự động/qua thao tác kéo thả sẽ update field này*)
- `status` (Pending / Assigned)

## 3. Lộ trình phát triển hệ thống (Roadmap)

Dự án nên được chia thành 4 giai đoạn chính (tương ứng với thời gian đồ án kéo dài khoảng 3-4 tháng):

### Phase 1: Khởi tạo và Quản trị nền tảng cốt lõi (Tuần 1 - Tuần 3)
- **Mục tiêu:** Xây dựng khung hệ thống, CSDL và các tính năng quản lý cơ bản CRUD.
- **Công việc:**
  - Thiết kế chi tiết ERD và thiết lập PostgreSQL database.
  - Setup Architecture cho cả Backend và Frontend (Tạo Repo, cấu hình Linter, CI/CD cơ bản).
  - Hoàn thiện module xác thực Auth (Login/Role based cho Quản lý vs Giảng viên).
  - Hoàn thiện luồng API & UI các trang: Quản lý Giảng viên, Môn học, Lớp học, Học kỳ.
  - Tính năng đặc thù: Import/Export File Excel (Danh sách môn, danh sách giảng viên).

### Phase 2: Xây dựng Module Tổ chức và View Dashboard (Tuần 4 - Tuần 6)
- **Mục tiêu:** GV đăng ký được nguyện vọng và Hiển thị đầy đủ bảng kế hoạch tổng thể.
- **Công việc:**
  - Phát triển Front/Back form để Giảng viên/Admin tick chọn môn đăng ký dạy theo kỳ tương ứng. (Nên hỗ trợ cả import nguyện vọng bằng Excel).
  - Code cấu hình "Môn tương đương" và tiện ích "Đồng bộ môn học" (Ví dụ: Gán nhóm môn cho nhiều lớp chung khóa).
  - Dựng UI trang Bảng thông tin Môn học trung tâm: (Grid/Table view có thể chứa tới 1000+ rows, cần hỗ trợ Virtualized Table (render DOM động) để không lag, cột sticky để dễ tra cứu).

### Phase 3: Module Kéo Thả (Drag & Drop) & Xử lý Ràng buộc (Tuần 7 - Tuần 9)
- **Mục tiêu:** Quản trị viên lắp ghép TKB thủ công trực quan, có check logic.
- **Công việc:**
  - Tích hợp thư viện DnD (Drag n Drop) vào Bảng trung tâm.
  - **Kéo thả:** Thao tác kéo Tên GV từ Sidebar và "thả" vào row môn học. Update giao diện Realtime.
  - **Validation logic (Quan trọng):** Cả Backend/Frontend đồng thời kiểm tra ngay - Nếu GV bị thả vào môn có ca học xung đột với môn GV đó đã nhận => Báo lôi trực quan trên UI/Toast Message. Cập nhật nhãn trạng thái Giảng viên (Đang Rảnh/ Đang Bận) tại Sidebar tức thì.

### Phase 4: Thuật toán Tự động Phân công (Auto-Scheduling) & Vận hành (Tuần 10 - Tuần 12)
- **Mục tiêu:** Biến flow thuật toán trong bản yêu cầu thành Code Engine thực và Nghiệm thu.
- **Công việc:**
  - Chuyển hóa Logic Loop sang code. Thiết lập bộ đếm (Priority Queue) chấm điểm ưu tiên GV (VD: GV chính môn đó: +10 điểm, GV thiếu KPI: +5 điểm...).
  - Xây dựng Scheduler API chạy luồng background, tự gán list `Schedules`, trả kết quả thành công và tỷ lệ % môn đã lấp đầy.
  - Tính năng Export TKB hoàn thiện kết xuất ra file Excel chuẩn định dạng in ấn.
  - Unit Test chức năng tạo rule xếp lịch. Đóng gói Container bằng Docker. Deploy lên Cloud Server để chạy demo đồ án.

## 4. Đặc điểm "Ăn điểm" (Thực tiễn hóa Đồ án Tốt nghiệp)
Để hội đồng đánh giá cao tính "Thực tiễn":
1. **Dữ liệu lớn (Big Data Rendering):** Phải nạp dữ liệu thật (Ví dụ 1 học kỳ có 500 môn và ~100 giảng viên). Web phải render mượt, không đơ lag khi load hoặc khi kéo thả (Áp dụng kỹ thuật Virtual Window/Pagination/Debounce).
2. **Quản lý Cạnh tranh (Concurrency):** Các Validation báo trùng giờ không được chỉ rào phía Frontend, Backend phải bắt cứng để tránh request gọi tới cùng một lúc gán 1 ông thầy vào 2 môn trùng lịch.
3. **Cơ chế Rollback & Bán Tự động:** Mô hình phân công ngoài đời rất phức tạp, auto 100% là rất khó. Khi engine Auto-scheduling chạy và tự động xếp được 90% môn, 10% còn lại bị báo khuyết (do thiếu GV hoặc GV hết buổi rảnh). Màn hình phải cho phép TKB lưu lại 90% đó, In đậm màu đỏ 10% còn lại để Cán bộ dùng nút Kéo Thả nhét thủ công GV vào. Đây là Flow "Nửa tự động có can thiệp của con người" rất thực tế.
