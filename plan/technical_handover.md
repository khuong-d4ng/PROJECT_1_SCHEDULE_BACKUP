# Tài liệu Chuyến giao Kỹ thuật (Technical Handover Document)

Tài liệu này được biên soạn dành cho nhà phát triển mới tiếp nhận dự án **"Hệ thống Quản lý và Phân công Thời Khóa Biểu (TKB)"**. Mục đích là cung cấp bức tranh toàn cảnh về mặt kỹ thuật, kiến trúc thư mục, các công nghệ sử dụng và bảng dữ liệu chuyên môn để bạn có thể nắm bắt và code ngay lập tức.

---

## 1. Stack Công nghệ Tổng quan (Tech Stack)

Dự án phát triển theo mô hình Frontend - Backend tách biệt hoàn toàn qua chuẩn RESTful API.

### Môi trường phát triển:
- **Ngôn ngữ:** Python (Backend) và TypeScript/JavaScript (Frontend).
- **Package Manager:** `npm` (Front) và `pip`/`venv` (Back).

### Backend
Thư mục gốc: `d:\.PROJECT_1\backend`

- **Framework lõi:** `FastAPI` (Python). Lý do: Cực kỳ nhanh, hỗ trợ async/await, tự động gen Document API (Swagger UI).
- **Core ORM:** `SQLAlchemy` để giao tiếp với database, tạo cầu nối ánh xạ Object (Model) sang Table SQL.
- **Data Validation:** `Pydantic` (Khai báo các schema request/response ép kiểu type hints rất mạnh mẽ).
- **Thư viện ngoài:** 
  - `openpyxl`: Module không thể thiếu dùng để đọc, parse file Excel (danh sách nguyện vọng, master data).
  - `python-multipart`: Giúp xử lý upload file qua request form-data.
- **Database:** Hiện tại cấu hình database chuẩn Relational (Relational DB, mặc định qua `DATABASE_URL` trong config).

### Frontend
Thư mục gốc: `d:\.PROJECT_1\frontend`

- **Framework lõi:** `React` v18 kết hợp build tool **`Vite`** (chạy server local port `5173`).
- **Styling UI:** 
  - `Tailwind CSS`: Utility-first CSS class để tạo layout siêu nhanh.
  - `Ant Design (Antd)`: UI Library dùng cho toàn bộ hệ thống (Table, Modal, Form, Button, Message). Form của Ant Design quản lý state rất tốt.
- **Routing:** `react-router-dom` v6.
- **Call API:** `axios` cấu hình baseURL sẵn (proxy `/api` redirect sang port 8000 của FastAPI).

---

## 2. Thiết kế Cơ sở Dữ liệu Cốt lõi (Database Schema Map)

Cấu trúc Entity Relationship (Lược đồ ER) được thiết kế xoay quanh tính chất ràng buộc lẫn nhau giữa Giảng viên, Môn học và Kì vọng phân công. Các Models nằm ở `app/models.py`.

### 2.1 Nhóm Quản trị Nền Tảng
- `users`: Quản lý tài khoản đăng nhập (Chưa Auth hoàn thiện nhưng Schema chuẩn bị trước).
- `lecturers`: Hồ sơ Giảng viên, phân cấp cơ hữu/thỉnh giảng, có `max_quota` giới hạn nhận lớp.
- `subjects`: Danh mục toàn bộ Môn học. Có lưu số tín chỉ, tiết thực hành/lý thuyết.
- `semesters`: Quản lý Học kỳ (Start Date, End Date, Status).

### 2.2 Nhóm Chương Trình Đào Tạo
Nhóm này làm nhiệm vụ quy chuẩn môn học cho các Lớp thuộc một Khóa. Nghĩa là chúng ta không gán Môn thủ công cho từng lớp, mà gán Môn cho (Ngành + Khóa + Kỳ).
- `major_subjects`: Gán danh sách môn mà một Ngành sẽ học.
- `batch_semester_subjects`: Mapping (Khóa K19 + Kì 1 + Ngành CNTT -> Học Môn Toán CC).

### 2.3 Nhóm Đăng ký Nguyện vọng Dạy
- `registration_lists`: Tạo "chiến dịch" thu thập file Excel nguyện vọng.
- `lecturer_registrations`: Lưu thông tin Giảng Viên `X` muốn nhận dạy Môn `Y` (với tư cách dạy lý thuyết hay thực hành). Bảng này là nguyên liệu sống còn để Thuật toán ở Phase sau đọc và xếp lịch.

> [!NOTE] 
> Bạn hoàn toàn có thể sử dụng UI tài liệu API Swagger ở link `http://127.0.0.1:8000/docs` khi chạy backend để test mapping DB trực tiếp mà không cần dùng Postman.

---

## 3. Kiến trúc Cấu trúc Thư mục (Directory Structure)

### 3.1 Backend Architecture (`backend/app`)
Ứng dụng áp dụng thiết kế **N-Tier (N-lớp)**:
- `main.py`: Entry point khởi tạo FastAPI server, cấu hình CORS (cho port frontend).
- `models.py`: Nơi định nghĩa toàn bộ SQLAlchemy classes (Bảng DB thực).
- `schemas.py`: Nơi định nghĩa Pydantic classes (Dữ liệu gửi từ Frontend lên, Response trả về). 
- `core/`:
  - `database.py`: Quản lý Connection / Session kết nối SQLAlchemy.
  - `config.py`: Load biến môi trường (ENV).
- `api/`:
  - `api_router.py`: File tổng gom tất cả các Sub-Route về 1 nơi.
  - `endpoints/`: Nơi chứa Controller của từng cụm nghiệp vụ (VD: `subjects.py`, `registrations.py`,... Các hàm def route sẽ nhận Request và ghi xuống DB tại đây). Thường kết hợp `Depends(get_db)`.

### 3.2 Frontend Architecture (`frontend/src`)
- `App.tsx`: Routing chính và Layout Sidebar.
- `pages/`: Component trang to bự được map trực tiếp với Route (Vd: `SubjectsPage.tsx`, `RegistrationsPage.tsx`).
- Tích hợp chuẩn React-hooks (`useState`, `useEffect`) để gọi các Endpoint axios và render bằng Table/List Antd. File React tương đối "Fat component" - gom gọn logic xử lý ngay trong page. 

---

## 4. Hướng dẫn Môi trường Dành cho Developer Mới

### Khởi động Local Server để làm việc:

1. **Khởi động Backend (FastAPI)**
   - Mở terminal vào thư mục: `cd backend`
   - Active môi trường ảo Python: `.\venv\Scripts\activate` (Nếu đang dùng Windows).
   - Chạy lệnh `uvicorn app.main:app --reload`
   - Test kết nối: Truy cập `http://127.0.0.1:8000/docs` phải hiển thị ra trang Swagger.

2. **Khởi động Frontend (React)**
   - Mở terminal mới, vào thư mục: `cd frontend`
   - Gõ lệnh cài gói (nếu lấy code mới về): `npm install`
   - Khởi động dev server: `npm run dev`
   - Frontend sẽ chạy ở `http://localhost:5173/` (Vite Proxy tự động xử lý route `/api/*` để tránh lỗi CORS).

---

## 5. Cảnh báo và Đặc điểm Cần Lưu ý (Gotchas)

> [!WARNING]
> Mảng **Xếp Lịch và Kéo Thả (Timetable Workspace)** hiện tại chưa có mặt trong codebase do đã được "đập đi làm mới". Việc của bạn trong giai đoạn sắp tới là thiết kế lại Bảng `TimetableRow` và dựng thuật toán nhét vào API.

1. **Xử lý Excel:** Chú ý logic `import_excel_preview` trong `registrations.py`. Logic này không lưu thẳng vào DB mà trả về dạng list-preview cho người dùng rà soát trước. Để tránh memory leak, code sử dụng parse in-memory. 
2. **State Management UI:** Đồ án hiện chưa dùng Redux. Toàn bộ state được lưu Local qua Hook (nên cẩn thận tránh Props Drilling khi tách Component). Việc sử dụng `<Form form={form}>` của Antd trên Modal cần chú ý gắn `forceRender` (nếu có popup tĩnh) hoặc cẩn trrọng khi Unmount component.
3. **Delete Cascade:** Trong `models.py`, các liên kết khóa ngoại sử dụng `cascade="all, delete-orphan"` khá nhiều để dễ rọn dẹp dữ liệu cha-con. Cẩn thận khi viết lệnh DB delete.

*Chúc code vui vẻ!*
