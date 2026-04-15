# Báo cáo Tiến độ Phát triển Hệ thống Phân công TKB

Dựa trên tài liệu yêu cầu hệ thống (`docs/Thiết kế hệ thống`) và bản Kế hoạch triển khai gốc (`plan.md`), dưới đây là báo cáo đánh giá chi tiết những hạng mục đã hoàn thành tốt và các hạng mục còn dang dở cần (thực hiện tiếp / đập đi xây lại).

## 1. Các hạng mục ĐÃ HOÀN THÀNH (Đã kiểm chứng)

### Nhóm Quản trị Nền tảng (Master Data)
- **Quản lý Môn học (Subjects):** Đã xây dựng hoàn thiện các endpoint API và giao diện UI (Danh sách, thêm/sửa/xóa). 
- **Quản lý Giảng viên (Lecturers):** Đã hoàn thiện bao gồm quản lý mã GV, họ tên, loại giảng viên (cơ hữu/thỉnh giảng) và cấu hình giới hạn số tiết/kỳ (`max_quota`).
- **Quản lý Học kỳ (Semesters):** Đã có cơ sở dữ liệu và quản lý trạng thái Draft/Active/Closed thời gian bắt đầu, kết thúc.
- **Quản lý Chương trình đào tạo (Curriculum):** 
  - Giao diện quản trị danh mục môn học thuộc về từng Ngành (VD: CNTT, HTTT).
  - Tích hợp chuẩn hóa việc cấu hình khóa-kỳ-môn: Cấu hình Khóa (VD: K19) - Kì (VD: HK1) sẽ tự động áp dụng môn học cho toàn bộ các lớp thuộc Khóa-Ngành đó. Giao diện trực quan tích hợp 2 tab logic.

### Nhóm Đăng ký nguyện vọng (Registrations)
- **Tạo danh sách nguyện vọng theo kì:** Xây dựng mô hình `RegistrationList` chia đợt lấy nguyện vọng rõ ràng.
- **Import Excel Template:** Hoàn thiện luồng Upload File Excel (sử dụng `openpyxl`), với Preview (màn hình lưới xem trước dữ liệu có hợp lệ hay không) sau đó mới tiến hành Insert vào DB nhằm tránh rác dữ liệu. 
- **Quản lý chi tiết nguyện vọng:** Hiển thị và truy xuất các môn mà một GV đăng ký dạy (dạy chính / dạy thực hành).

### Hạ tầng và Kiến trúc
- **Kiến trúc App:** FastAPI backend với SQLAlchemy + Alembic (nếu có) ; Frontend React + Vite + TailwindCSS cấu hình proxy chuẩn, giao tiếp RESTful API thành công.
- **Database:** Xây dựng đầy đủ relation chặt chẽ bằng PostgreSQL/SQLite (Cascade delete, Relationship maping).

---

## 2. Các hạng mục CHƯA HOÀN THÀNH / CẦN LÀM LẠI KHẨN CẤP

> [!CAUTION] 
> Tính năng Quan trọng nhất của đồ án: **"Quản lý Bảng TKB và Phân công"** đang trong trạng thái bị reset (Rollback toàn bộ) để xây dựng lại theo flow sạch hơn.

### Nhóm Bảng TKB Trung tâm (Timetable Workspace)
- **Giao diện phân bổ Đợt xếp lịch:** Cần tạo tính năng cấu hình các đợt xếp TKB (chọn học kỳ, chọn nguyện vọng list, chọn các Khóa + Ngành tham gia). Hệ thống **hiện chưa có** khả năng tự gen ra list các Lớp + Môn trống gạch đầu dòng để gán GV.
- **Giao diện Quản trị Grid:** Cần một Table View lớn hỗ trợ sticky column chứa thông tin (Môn, Số tín chỉ, Loại phòng, Thứ, Ca, GV chính, GV thực hành).

### Nhóm Phân công (Scheduling)
- **Mảng Kéo Thả Thủ Công (Drag & Drop):** Cần tích hợp lại thư viện phân công thủ công (Kéo GV từ cột Pool sang cột Row Môn của bảng) cùng tính năng validate backend (Giới hạn rảnh giờ, chặn xung đột trùng lịch, quá giờ max quota). Hiện tại chưa hoạt động.
- **Mảng Thuật toán Tự động (Auto-Scheduling Engine):** Cần một hàm AI/Rules-base bằng Python để duyệt mảng và ưu tiên điền giảng viên tự động (vừa bị xóa, cần viết lại logic sạch sẽ hơn).

### Nhóm Tiện ích & Mở rộng
- **Export Excel Chuẩn Dạng In Ấn:** Chưa có tính năng Export Bảng TKB hoàn thiện ra dạng Xlsx theo mẫu của nhà trường.
- **Xác thực và Phân quyền (Auth & Roles):** Bảng `users` đã được chuẩn bị trong Database nhưng hiện tại hệ thống UI chưa có màn hình Login / Route Guard chặn quyền Cán Bộ vs Giảng Viên. Tất cả hiện đang chạy local bypass quyền. 
- **Chức năng môn tương đương:** DB đã thiết kế bảng `equivalent_subjects` nhưng chưa có code xử lý logic ở Controller và UI.

## 3. Tổng kết
Hệ thống **đã hoàn thành vững chắc tầm 50% khối lượng** (Toàn bộ mảng Dữ liệu Đào Tạo, Nền Tảng, Môi trường). Nhiệm vụ tối thượng tiếp theo là tập trung 100% tài nguyên để thiết kế một màn hình **Bảng TKB Trung tâm (Workspace)** siêu trực quan để đảm đương các logic kéo thả, phân công.
