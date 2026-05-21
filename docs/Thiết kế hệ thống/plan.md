# Kế hoạch triển khai hệ thống phân công thời khóa biểu

## 1) Bài toán và mục tiêu
Xây dựng web app quản lý dữ liệu học kỳ, môn học, lớp học, giảng viên; hỗ trợ phân công thủ công (kéo-thả) và tự động (rules-based scheduling), có import/export Excel theo đúng định dạng đã mô tả trong tài liệu.

## 2) Phạm vi thực hiện (MVP -> mở rộng)
- MVP bắt buộc:
  - Quản lý danh mục nền tảng: giảng viên, môn học, lớp, học kỳ.
  - Import/Export Excel cho danh sách môn và kết quả TKB.
  - Đăng ký nguyện vọng giảng dạy theo học kỳ (nhập tay + import mẫu Excel).
  - Bảng TKB trung tâm hiển thị đầy đủ cột thông tin như mẫu.
  - Phân công thủ công có kiểm tra trùng lịch giảng viên.
  - Tự động phân công theo rules ưu tiên + ràng buộc slot.
  - Lưu kết quả TKB vào CSDL theo từng học kỳ.
- Mở rộng sau MVP:
  - Đồng bộ hóa cấu hình môn giữa các lớp cùng khóa.
  - Môn tương đương.
  - Cơ chế bán tự động (auto 1 phần + đánh dấu phần còn thiếu để chỉnh tay).

## 3) Kiến trúc kỹ thuật đề xuất
- Frontend: React + TypeScript + UI library (Antd/MUI) + dnd-kit.
- Backend API: FastAPI (ưu tiên cho engine scheduling) hoặc NestJS.
- DB: PostgreSQL; Redis (tùy chọn cho cache/session scheduling).
- Tệp Excel: openpyxl/xlsx để import/export theo template cố định.
- Triển khai: Docker hóa toàn bộ stack.

## 4) Thiết kế module
1. Auth & Role (Admin/Cán bộ xếp lịch/Giảng viên).
2. Master Data: Giảng viên, Môn học, Lớp, Học kỳ.
3. Registration: Nguyện vọng giảng dạy theo kỳ.
4. Timetable Workspace:
   - Grid dữ liệu TKB (lọc theo kỳ/lớp/buổi).
   - Kéo-thả gán giảng viên.
   - Validation trùng lịch theo ca/ngày.
5. Auto-Scheduling Engine:
   - Tính điểm ưu tiên giảng viên theo rule.
   - Kiểm tra năng lực môn + khả dụng ca/buổi + slot lớp.
   - Gán và cập nhật trạng thái khả dụng theo vòng lặp.
6. Import/Export Excel:
   - Import danh sách nguyện vọng từ file mẫu.
   - Export TKB hoàn chỉnh đúng cấu trúc cột yêu cầu.

## 5) Quy tắc nghiệp vụ cốt lõi
- Một giảng viên không được dạy trùng slot thời gian.
- Chỉ gán giảng viên cho môn nằm trong danh sách đăng ký/ngành năng lực.
- Ưu tiên theo thứ tự: giảng viên chính của môn -> giảng viên thiếu chỉ tiêu/KPI -> giảng viên đang ít môn hơn.
- Nếu không còn giảng viên phù hợp, giữ môn ở trạng thái chưa phân công để xử lý thủ công.
- Mọi kiểm tra ràng buộc phải được enforce ở backend (không chỉ frontend).

## 6) Lộ trình triển khai chi tiết
### Giai đoạn A - Nền tảng dữ liệu & API
- Dựng schema DB cốt lõi: users, lecturers, semesters, subjects, classes, registrations, schedules, equivalent_subjects.
- Tạo API CRUD + phân quyền.
- Viết migration + seed mẫu.

### Giai đoạn B - Giao diện quản trị & dashboard
- Màn hình quản trị dữ liệu nền.
- Màn hình bảng TKB trung tâm (có cuộn ngang/dọc, lọc theo kỳ/lớp).
- Import danh sách môn/nguyện vọng bằng Excel.

### Giai đoạn C - Phân công thủ công
- Sidebar danh sách giảng viên + trạng thái rảnh/bận.
- Kéo-thả gán giảng viên vào môn.
- Validate realtime + backend transaction để chặn race condition.

### Giai đoạn D - Tự động phân công
- Xây scheduler service chạy theo học kỳ/lớp.
- Trả về thống kê: tổng môn, đã gán, chưa gán, lý do chưa gán.
- Cho phép lưu kết quả tạm và chỉnh tay phần còn thiếu.

### Giai đoạn E - Hoàn thiện & nghiệm thu
- Export TKB chuẩn Excel.
- Kiểm thử tích hợp và tải dữ liệu lớn.
- Docker compose + tài liệu chạy local/demo.

## 7) Danh sách TODO thực thi
1. Chuẩn hóa yêu cầu và chốt schema dữ liệu + mapping Excel.
2. Khởi tạo project frontend/backend và cấu hình môi trường.
3. Xây DB migration + seed dữ liệu mẫu.
4. Xây API CRUD và phân quyền.
5. Xây module import nguyện vọng từ Excel.
6. Xây giao diện bảng TKB và lọc dữ liệu.
7. Xây kéo-thả phân công thủ công + kiểm tra xung đột.
8. Xây engine auto-scheduling theo rule.
9. Xây export TKB ra Excel đúng format.
10. Viết test, tối ưu hiệu năng, đóng gói Docker và nghiệm thu.

## 8) Tiêu chí hoàn thành
- Có thể nhập dữ liệu đầu vào theo mẫu và tạo được TKB cho kỳ chọn.
- Hệ thống chặn được trùng lịch giảng viên cả UI lẫn backend.
- Chạy auto-scheduling cho ra kết quả lưu DB + cho phép chỉnh tay phần còn thiếu.
- Export được file Excel đúng định dạng cột như tài liệu mẫu.
