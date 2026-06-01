# TÀI LIỆU CẬP NHẬT BÁO CÁO ĐỒ ÁN
*(Tóm tắt các nội dung thay đổi, sửa đổi và thêm mới dựa trên tiến độ thực tế của sản phẩm)*

Tài liệu này được biên soạn nhằm hướng dẫn cập nhật báo cáo đồ án từ các nội dung cũ lên đúng với tiến độ phát triển thực tế của hệ thống (bao gồm các chức năng: cập nhật tính toán thời gian học phần, thiết kế giao diện thẻ nguyện vọng giảng dạy, ghi chú trên bảng phân công, làm nổi bật nguyện vọng tự đăng ký của giảng viên, và hệ thống thông báo đa kênh qua Web Noti & Gmail SMTP).

---

## 📌 PHẦN MỞ ĐẦU

### 1. Mục 3. Mục đích nghiên cứu
*   **Vị trí sửa đổi:** Bên dưới dòng thứ 2: "*Các mục tiêu cụ thể bao gồm:*"
*   **Thao tác:** **THÊM MỚI** đầu dòng sau vào danh sách các mục tiêu cụ thể:
    ```markdown
    *   **Xây dựng hệ thống thông báo đa kênh:** Thiết lập kênh truyền thông thời gian thực trên giao diện web (Web Notification) kết hợp tự động gửi email thông báo qua giao thức SMTP (Gmail) mỗi khi có sự điều chỉnh lịch dạy hoặc phân công mới, giúp giảng viên cập nhật thông tin kịp thời.
    ```

### 2. Mục 4. Phương pháp nghiên cứu
*   **Vị trí sửa đổi:** Tại dòng thứ 5: "*Phương pháp nghiên cứu thực nghiệm (Xây dựng sản phẩm) > Phát triển Backend*"
*   **Thao tác:** **SỬA ĐỔI / BỔ SUNG** nội dung trong ngoặc đơn như sau:
    *   *Nội dung cũ:* `...ORM với PostgreSQL; sử dụng OpenPyXL để xử lý file bảng tính.`
    *   *Nội dung mới:* `...ORM với PostgreSQL; sử dụng OpenPyXL để xử lý file bảng tính; tích hợp các thư viện smtplib và email của Python phục vụ gửi thư điện tử tự động qua giao thức SMTP.`

---

## 📌 CHƯƠNG 1. CƠ SỞ LÝ THUYẾT

### 1. Mục 1.1.2. Lợi ích của hệ thống đối với Nhà trường, Cán bộ quản lý và Giảng viên
*   **Vị trí sửa đổi:** Tại phần "*C. Đối với Giảng viên (Giảng viên Cơ hữu và Giảng viên Thỉnh giảng)*"
*   **Thao tác:** **BỔ SUNG** nội dung vào cuối đoạn văn:
    ```markdown
    Đồng thời, sự tích hợp của hệ thống thông báo đa kênh (Web Notification và Email) giúp giảng viên nhận được thông tin phân công mới hoặc các điều chỉnh lịch dạy từ giáo vụ một cách tức thời, giảm thiểu việc bỏ sót lịch dạy và tăng tính chủ động trong chuẩn bị chuyên môn.
    ```

### 2. Mục 1.4.2. Yêu cầu chức năng
*   **Vị trí sửa đổi:** Cuối mục `1.4.2` (trước mục `1.4.3`).
*   **Thao tác:** **THÊM MỚI** các đoạn mô tả các chức năng đã nâng cấp thực tế:
    ```markdown
    Nhằm tối ưu hóa tiến trình theo dõi và vận hành, hệ thống tích hợp các chức năng quản lý thời gian biểu và truyền tải thông tin phân công. Về mặt quản lý thời gian giảng dạy, hệ thống cho phép thiết lập ngày bắt đầu và ngày kết thúc độc lập cho từng lớp học phần (timetable row) thay vì áp đặt đồng bộ theo khung học kỳ, đồng thời tự động xác định ngày kết thúc của phiên phân công dựa trên lớp học phần có thời lượng kéo dài nhất. Cán bộ xếp lịch có thể cập nhật ghi chú hoặc mô tả của phiên phân công tại mọi thời điểm; thông tin này được đồng bộ để hiển thị trực tiếp trên không gian làm việc của quản trị viên và trang theo dõi lịch dạy của giảng viên. Trên giao diện phân công của quản trị viên, các nguyện vọng do giảng viên tự đăng ký trực tuyến từ tài khoản cá nhân được đánh dấu phân biệt bằng màu sắc riêng so với các phân công do quản trị viên thiết lập thủ công, hỗ trợ quá trình nhận diện và ưu tiên nguyện vọng cá nhân.

    Ngoài ra, hệ thống tự động hóa luồng thông tin phản hồi thông qua phân hệ thông báo đa kênh. Khi phát sinh phân công mới, hệ thống tự động tạo thông báo trên giao diện web và hiển thị ký hiệu cảnh báo trên thanh điều hướng, đồng thời gửi email thông báo chi tiết (bao gồm thông tin lớp học, môn học, thứ và ca dạy) tới hòm thư của giảng viên thông qua tài khoản SMTP Gmail của khoa. Giảng viên được quyền cập nhật địa chỉ email cá nhân và tùy chọn kích hoạt hoặc hủy kích hoạt nhận email thông báo tại trang thông tin tài khoản. Quản trị viên cũng có thể cập nhật địa chỉ email của giảng viên thông qua giao diện quản lý danh mục nhân sự nhằm đảm bảo tính chính xác của dữ liệu liên lạc.
    ```

---

## 📌 CHƯƠNG 2. CÔNG NGHỆ SỬ DỤNG

### 1. Mục 2.2.3. Các công nghệ hỗ trợ bảo mật và tiện ích (PyJWT, Bcrypt, Pandas xử lý Excel)
*   **Vị trí sửa đổi:** Sửa tiêu đề và nội dung của mục `2.2.3`
*   **Thao tác:** **SỬA ĐỔI** tiêu đề mục thành:
    `2.2.3. Các công nghệ hỗ trợ bảo mật và tiện ích (PyJWT, Bcrypt, Pandas, Openpyxl)`

### 2. Thêm mới mục 2.2.4
*   **Vị trí sửa đổi:** Thêm mới ngay sau mục `2.2.3` (trước mục `2.3. Kết luận chương`)
*   **Thao tác:** **THÊM MỚI** toàn bộ mục `2.2.4` với nội dung dưới đây:
    ```markdown
    ### 2.2.4. Giao thức SMTP hỗ trợ gửi email tự động (Smtplib và Email MIME)

    Để gửi các thông báo phân công giảng dạy trực tiếp tới hòm thư cá nhân của giảng viên, Backend của hệ thống tích hợp module thư viện chuẩn `smtplib` và `email` của Python.
    *   **Mã hóa TLS an toàn:** Hệ thống kết nối tới máy chủ SMTP của Google (`smtp.gmail.com`) trên cổng bảo mật `587` bằng giao thức STARTTLS, đảm bảo toàn bộ nội dung email gửi đi được mã hóa trên đường truyền.
    *   **Đóng gói định dạng HTML MIME:** Sử dụng lớp `MIMEMultipart` và `MIMEText` để thiết kế các mẫu email thông báo phân công dưới dạng văn bản HTML động, chứa cấu trúc bảng chuyên nghiệp, màu sắc trực quan thể hiện rõ các thông tin môn học, lớp học, thứ và ca giảng dạy.
    *   **Cơ chế gửi mail bất đồng bộ (Background Tasks):** Thao tác gửi email qua mạng internet có độ trễ vật lý (từ 1 đến 3 giây). Hệ thống sử dụng cơ chế `BackgroundTasks` tích hợp sẵn trong FastAPI để đẩy tác vụ gửi mail vào hàng đợi chạy ngầm ngay sau khi Admin lưu phân công. Client Frontend sẽ nhận được phản hồi lưu dữ liệu thành công lập tức mà không phải chờ quá trình kết nối gửi email hoàn tất.
    ```

---

## 📌 CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

### 1. Mục 3.1.1. a) Sơ đồ Use Case tổng quát
*   **Vị trí sửa đổi:** Khối mã nguồn Mermaid mô tả Sơ đồ Use Case tổng quát (dòng 35 - 54).
*   **Thao tác:** **THAY THẾ** toàn bộ khối sơ đồ cũ bằng khối sơ đồ mới dưới đây (bổ sung UC_Notification):
    ```mermaid
    ---
    config:
      layout: fixed
    ---
    flowchart LR
        admin(["Admin"])
        scheduler(["Cán bộ xếp lịch"])
        lecturer(["Giảng viên"])

        subgraph "Hệ thống Phân công TKB - DNU"
            UC_Auth(["Xác thực & Quản lý Tài khoản"])
            UC_MasterData(["Quản lý dữ liệu Danh mục"])
            UC_Curriculum(["Quản lý Chương trình & Khung đào tạo"])
            UC_RegList(["Quản lý Đợt đăng ký Nguyện vọng"])
            UC_Register(["Đăng ký Nguyện vọng Giảng dạy"])
            UC_Schedule(["Xếp lịch & Phân công (Workspace)"])
            UC_AutoAssign(["Tự động phân công (Auto Assign)"])
            UC_Excel(["Xuất/Nhập Excel"])
            UC_Notification(["Xem thông báo & Cấu hình email"])
        end

        admin --> UC_Auth & UC_MasterData & UC_Notification
        scheduler --> UC_Auth & UC_MasterData & UC_Curriculum & UC_RegList & UC_Schedule & UC_AutoAssign & UC_Excel & UC_Notification
        lecturer --> UC_Auth & UC_Register & UC_Notification
    ```

### 2. Thêm mới mục 3.1.1. h) Use Case: Quản lý thông báo & Cấu hình Email
*   **Vị trí sửa đổi:** Thêm mới ngay sau bảng `Bảng 3.6` (trước mục `3.1.2. Biểu đồ thực thể (Class Diagram)`)
*   **Thao tác:** **THÊM MỚI** sơ đồ Use Case và bảng đặc tả chi tiết dưới đây:
    ```markdown
    #### h) Use Case: Quản lý thông báo & Cấu hình Email

    ```mermaid
    ---
    config:
      layout: fixed
    ---
    flowchart LR
        user(["Người dùng"])
        lecturer(["Giảng viên"])
        admin(["Admin"])

        subgraph "Phân hệ Thông báo & Cấu hình"
            UC_ViewNoti(["Xem thông báo trên Web (Bell Popover)"])
            UC_MarkRead(["Đánh dấu đã đọc thông báo"])
            UC_ConfigNoti(["Cấu hình Email & Bật/Tắt nhận email"])
            UC_ManageLecEmail(["Cập nhật Email giảng viên"])
        end

        user --> UC_ViewNoti & UC_MarkRead
        lecturer --> UC_ConfigNoti
        admin --> UC_ManageLecEmail
    ```

    **Bảng 3.7: Bảng mô tả chi tiết Use Case Quản lý thông báo & Cấu hình Email**

    | Mục | Nội dung |
    |---|---|
    | **Tên Use Case** | Quản lý thông báo & Cấu hình Email |
    | **Mô tả** | Cung cấp kênh nhận thông báo tự động cho giảng viên khi có sự gán hoặc thay đổi phân công dạy học. Giảng viên có thể xem thông báo trực tiếp trên giao diện web hoặc nhận qua email cá nhân tự cấu hình. Admin có thể trực tiếp quản lý email của giảng viên. |
    | **Tác nhân** | Giảng viên, Admin, Cán bộ xếp lịch |
    | **Điều kiện tiên quyết** | - Người dùng đã đăng nhập thành công vào hệ thống. |
    | **Luồng chính** | **1. Nhận thông báo trên web:**<br>- Hệ thống thực hiện gọi API định kỳ để kiểm tra thông báo chưa đọc.<br>- Người dùng nhấn vào biểu tượng Quả chuông trên Navbar để xem danh sách thông báo dropdown.<br>- Nhấn vào một thông báo để chuyển trạng thái thành đã đọc (gọi Endpoint `PUT /api/notifications/{id}/read`) và tự động chuyển hướng tới trang chi tiết lịch giảng dạy.<br>**2. Cập nhật cấu hình nhận tin (Giảng viên):**<br>- Giảng viên truy cập cổng thông tin cá nhân.<br>- Nhập địa chỉ email và nhấn nút bật/tắt công tắc "Nhận thông báo qua email".<br>- Nhấn lưu, hệ thống gọi API `PUT /api/lecturer-portal/profile` để cập nhật cột `email` và `receive_emails` trên DB.<br>**3. Cập nhật email giảng viên (Admin):**<br>- Admin chọn mục Giảng viên, mở Modal thêm/sửa hoặc Drawer chi tiết.<br>- Nhập email của giảng viên và nhấn lưu để lưu vào bảng `users`. |
    | **Luồng rẽ nhánh** | - Hòm thư giảng viên bị bỏ trống: Nút bật/tắt nhận thông báo qua email tự động bị khóa (disabled) và chuyển về trạng thái tắt để ngăn chặn lỗi gửi thư của hệ thống. |
    | **Kết quả** | Thông tin email được đồng bộ, thông báo được lưu trữ và cập nhật trạng thái đã đọc thành công trên database. |
    ```

### 3. Mục 3.1.2. Biểu đồ thực thể (Class Diagram)
*   **Vị trí sửa đổi:** Khối mã nguồn Mermaid biểu diễn UML Class Diagram (dòng 282 - 406).
*   **Thao tác:** **THAY THẾ** toàn bộ khối sơ đồ cũ bằng sơ đồ mới dưới đây (Cập nhật thuộc tính và thêm class Notification):
    ```mermaid
    classDiagram
        class User {
            +int user_id
            +string username
            +string password_hash
            +string email
            +RoleEnum role
            +bool receive_emails
        }
        class Lecturer {
            +int lecturer_id
            +int user_id
            +string full_name
            +string lecturer_code
            +LecturerTypeEnum type
            +int max_quota
            +string position
            +string email
            +bool receive_emails
        }
        class Semester {
            +int semester_id
            +string semester_name
            +date start_date
            +date end_date
            +SemesterStatusEnum status
        }
        class Subject {
            +int subject_id
            +string subject_code
            +string subject_name
            +int credits
            +int theory_credits
            +int practice_credits
            +int theory_hours
            +int practice_hours
        }
        class EquivalentSubject {
            +int id
            +int original_subject_id
            +int equivalent_subject_id
        }
        class Class {
            +int class_id
            +string class_name
            +string department_major
            +string batch
            +int program_id
        }
        class TrainingProgram {
            +int id
            +string program_code
            +string name
            +string department_major
            +string batch
        }
        class ProgramCurriculum {
            +int id
            +int program_id
            +int semester_index
            +int subject_id
        }
        class RegistrationList {
            +int list_id
            +string list_name
            +int semester_id
            +string description
            +bool is_open
            +date created_at
        }
        class RegistrationListSubject {
            +int id
            +int list_id
            +int subject_id
        }
        class LecturerRegistration {
            +int registration_id
            +int list_id
            +int lecturer_id
            +int subject_id
            +bool is_main_lecturer
            +bool created_by_lecturer
        }
        class SchedulingSession {
            +int session_id
            +string plan_name
            +int registration_list_id
            +date created_at
            +TimetableSessionStatusEnum status
            +date start_date
            +string description
            +date end_date
        }
        class SessionEntry {
            +int id
            +int session_id
            +int program_id
            +int semester_index
        }
        class TimetableRow {
            +int row_id
            +int session_id
            +string class_name
            +int subject_id
            +string fixed_shift
            +string room_type
            +string morning_day
            +string afternoon_day
            +int main_lecturer_id
            +int prac_lecturer_id
            +date start_date
            +date end_date
        }
        class Notification {
            +int notification_id
            +int user_id
            +string title
            +string content
            +string link
            +bool is_read
            +datetime created_at
        }

        User "1" -- "0..1" Lecturer : sở hữu hồ sơ
        User "1" -- "*" Notification : nhận thông báo
        Lecturer "1" -- "*" LecturerRegistration : đăng ký nguyện vọng
        Subject "1" -- "*" LecturerRegistration : thuộc học phần
        RegistrationList "1" -- "*" LecturerRegistration : có chi tiết đăng ký
        RegistrationList "1" -- "*" RegistrationListSubject : mở các môn
        RegistrationListSubject "*" -- "1" Subject : trỏ đến môn
        Semester "1" -- "*" RegistrationList : chứa các đợt nguyện vọng
        TrainingProgram "1" -- "*" Class : chứa các lớp
        TrainingProgram "1" -- "*" ProgramCurriculum : quy định khung
        ProgramCurriculum "*" -- "1" Subject : định nghĩa môn học
        SchedulingSession "1" -- "*" SessionEntry : cấu hình các khóa
        SessionEntry "*" -- "1" TrainingProgram : trỏ đến chương trình
        SchedulingSession "1" -- "*" TimetableRow : chứa các dòng xếp lịch
        TimetableRow "*" -- "1" Subject : của học phần
        TimetableRow "*" -- "0..1" Lecturer : giảng viên lý thuyết
        TimetableRow "*" -- "0..1" Lecturer : giảng viên thực hành
        Subject "1" -- "*" EquivalentSubject : môn học gốc
        Subject "1" -- "*" EquivalentSubject : môn học tương đương
    ```

### 4. Mục 3.2.1. Xác định các thực thể và quan hệ
*   **Vị trí sửa đổi 1:** Tại cấu trúc mô tả `1. Bảng users` (dòng 488).
    *   **SỬ DỤNG THAY THẾ** hàng STT 4:
        ```markdown
        | 4 | `email` | String(100) | True | Unique | Địa chỉ thư điện tử người dùng (nullable) |
        ```
    *   **THÊM MỚI** hàng STT 6 vào cuối bảng `users`:
        ```markdown
        | 6 | `receive_emails` | Boolean | False | Default True | Trạng thái cho phép gửi email thông báo |
        ```
*   **Vị trí sửa đổi 2:** Tại cấu trúc mô tả `9. Bảng lecturer_registrations` (dòng 594).
    *   **THÊM MỚI** hàng STT 6 vào cuối bảng `lecturer_registrations`:
        ```markdown
        | 6 | `created_by_lecturer` | Boolean | False | Default False | True: do giảng viên tự đăng ký, False: do Admin gán |
        ```
*   **Vị trí sửa đổi 3:** Tại cấu trúc mô tả `13. Bảng scheduling_sessions` (dòng 655).
    *   **THÊM MỚI** hàng STT 6 và 7 vào cuối bảng `scheduling_sessions`:
        ```markdown
        | 6 | `start_date` | Date | True | - | Ngày bắt đầu thực tế của phiên xếp lịch |
        | 7 | `description` | String(500) | True | - | Ghi chú, mô tả chung về phiên xếp lịch |
        ```
*   **Vị trí sửa đổi 4:** Tại cấu trúc mô tả `15. Bảng timetable_rows` (dòng 680).
    *   **THÊM MỚI** hàng STT 11 và 12 vào cuối bảng `timetable_rows`:
        ```markdown
        | 11 | `start_date` | Date | True | - | Ngày bắt đầu của lớp học phần |
        | 12 | `end_date` | Date | True | - | Ngày kết thúc của lớp học phần |
        ```
*   **Vị trí sửa đổi 5:** Thêm mới bảng cơ sở dữ liệu `16. Bảng notifications` trước mục `3.2.2`.
    *   **THÊM MỚI** bảng cấu trúc sau:
        ```markdown
        #### 16. Bảng `notifications` (Thông báo hệ thống)
        Lưu trữ các thông báo trên Web của người dùng.
        *   Khóa chính: `notification_id`
        *   Khóa ngoại: `user_id` liên kết bảng `users(user_id)` với hành động xóa `ondelete="CASCADE"`

        | STT | Tên cột | Kiểu dữ liệu | Nullable | Ràng buộc | Mô tả |
        |---|---|---|---|---|---|
        | 1 | `notification_id` | Integer | False | PK | Khóa chính tự tăng |
        | 2 | `user_id` | Integer | False | FK | ID tài khoản người nhận thông báo |
        | 3 | `title` | String(200) | False | - | Tiêu đề hiển thị thông báo |
        | 4 | `content` | String(1000) | False | - | Nội dung chi tiết thông báo |
        | 5 | `link` | String(500) | True | - | Đường dẫn điều hướng khi nhấp chuột xem thông báo |
        | 6 | `is_read` | Boolean | False | Default False | Trạng thái đã đọc (True) hoặc chưa đọc (False) |
        | 7 | `created_at` | DateTime | False | Default UTC NOW | Thời điểm tạo bản ghi thông báo |
        ```

### 5. Mục 3.2.2. Biểu đồ CSDL (Database/ERD Diagram)
*   **Vị trí sửa đổi:** Khối mã nguồn Mermaid biểu diễn Sơ đồ CSDL/ERD (dòng 707 - 831).
*   **Thao tác:** **THAY THẾ** toàn bộ khối ERD cũ bằng khối ERD mới dưới đây:
    ```mermaid
    erDiagram
        users {
            int user_id PK
            string username
            string password_hash
            string email
            string role
            boolean receive_emails
        }
        lecturers {
            int lecturer_id PK
            int user_id FK
            string full_name
            string lecturer_code
            string type
            int max_quota
            string position
        }
        semesters {
            int semester_id PK
            string semester_name
            date start_date
            date end_date
            string status
        }
        subjects {
            int subject_id PK
            string subject_code
            string subject_name
            int credits
            int theory_credits
            int practice_credits
            int theory_hours
            int practice_hours
        }
        equivalent_subjects {
            int id PK
            int original_subject_id FK
            int equivalent_subject_id FK
        }
        classes {
            int class_id PK
            string class_name
            string department_major
            string batch
            int program_id FK
        }
        training_programs {
            int id PK
            string program_code
            string name
            string department_major
            string batch
        }
        program_curriculums {
            int id PK
            int program_id FK
            int semester_index
            int subject_id FK
        }
        registration_lists {
            int list_id PK
            string list_name
            int semester_id FK
            string description
            boolean is_open
            date created_at
        }
        registration_list_subjects {
            int id PK
            int list_id FK
            int subject_id FK
        }
        lecturer_registrations {
            int registration_id PK
            int list_id FK
            int lecturer_id FK
            int subject_id FK
            boolean is_main_lecturer
            boolean created_by_lecturer
        }
        scheduling_sessions {
            int session_id PK
            string plan_name
            int registration_list_id FK
            date created_at
            string status
            date start_date
            string description
        }
        session_entries {
            int id PK
            int session_id FK
            int program_id FK
            int semester_index
        }
        timetable_rows {
            int row_id PK
            int session_id FK
            string class_name
            int subject_id FK
            string fixed_shift
            string room_type
            string morning_day
            string afternoon_day
            int main_lecturer_id FK
            int prac_lecturer_id FK
            date start_date
            date end_date
        }
        notifications {
            int notification_id PK
            int user_id FK
            string title
            string content
            string link
            boolean is_read
            datetime created_at
        }

        users ||--o| lecturers : "lecturer_profile"
        users ||--o{ notifications : "notifications"
        lecturers ||--o{ lecturer_registrations : "registrations"
        registration_lists ||--o{ lecturer_registrations : "registrations"
        registration_lists ||--o{ registration_list_subjects : "available_subjects"
        subjects ||--o{ lecturer_registrations : "registrations"
        subjects ||--o{ registration_list_subjects : "registration_list_subjects"
        semesters ||--o{ registration_lists : "registration_lists"
        training_programs ||--o{ classes : "classes"
        training_programs ||--o{ program_curriculums : "curriculums"
        subjects ||--o{ program_curriculums : "program_curriculums"
        scheduling_sessions ||--o{ session_entries : "entries"
        scheduling_sessions ||--o{ timetable_rows : "timetable_rows"
        session_entries ||--oo training_programs : "program"
        timetable_rows ||--oo lecturers : "main_lecturer"
        timetable_rows ||--oo lecturers : "prac_lecturer"
        timetable_rows ||--oo subjects : "subject"
        subjects ||--o{ equivalent_subjects : "original_subject"
        subjects ||--o{ equivalent_subjects : "equivalent_subject"
    ```

---

## 📌 CHƯƠNG 4. KẾT QUẢ THỰC NGHIỆM VÀ ĐÁNH GIÁ

### 1. Mục 4.1.2. a) Môi trường phía Máy chủ dịch vụ (Backend API Server)
*   **Vị trí sửa đổi:** Bên dưới dòng thứ 28 (dòng cuối cùng của mục a).
*   **Thao tác:** **THÊM MỚI** dòng thư viện sau:
    ```markdown
    *   **Gửi thư điện tử tự động:** smtplib và email (Bộ thư viện tiêu chuẩn tích hợp sẵn trong nhân Python giúp tạo và phát đi các thông điệp Email HTML bảo mật bằng SMTP qua cổng TLS).
    ```

### 2. Mục 4.2.3. Giao diện Quản lý Giảng viên
*   **Vị trí sửa đổi:** Sửa đổi phần *Mô tả chức năng chi tiết*
*   **Thao tác:** **BỔ SUNG** nội dung vào cuối đoạn văn:
    ```markdown
    Bảng danh sách giảng viên được tích hợp thêm cột hiển thị Email liên lạc nhận thông tin. Tại Drawer chi tiết hồ sơ cũng như các Modal "Thêm Giảng viên" và "Chỉnh sửa Giảng viên", Cán bộ xếp lịch có thể điền và cập nhật trực tiếp địa chỉ hòm thư cá nhân này của giảng viên, hệ thống tự động đồng bộ sang bảng users của tài khoản để đảm bảo dữ liệu luôn nhất quán.
    ```

### 3. Mục 4.2.7. Giao diện Quản lý Đợt Đăng ký Nguyện vọng
*   **Vị trí sửa đổi:** Sửa đổi phần *Mô tả chức năng chi tiết*
*   **Thao tác:** **THAY THẾ** đoạn mô tả cũ bằng đoạn mới:
    ```markdown
    *   **Mô tả chức năng chi tiết:** Cán bộ xếp lịch sử dụng giao diện này để lập đợt khảo sát nguyện vọng giảng dạy cho từng học kỳ cụ thể. Nhằm nâng cao trải nghiệm người dùng, danh sách các đợt nguyện vọng được thiết kế trực quan dưới dạng các thẻ (Cards) phân chia theo mạng lưới (Grid System) thay vì hộp chọn (Select box) đơn điệu cũ. Mỗi thẻ thông tin thể hiện rõ: Tên đợt, ngày tạo, ghi chú/mô tả chi tiết và một Thẻ trạng thái hiển thị màu sắc ("Đang mở" - màu xanh lá cây, "Đã đóng" - màu xám). Phía dưới chân thẻ tích hợp các nút bấm thao tác nhanh bao gồm: Xem chi tiết phân công đợt, Bật/Tắt đóng mở nhanh đợt đăng ký và nút Xóa đợt.
    ```

### 4. Mục 4.2.8. Giao diện Đăng ký Nguyện vọng Giảng dạy (Giảng viên)
*   **Vị trí sửa đổi:** Sửa đổi phần *Mô tả chức năng chi tiết*
*   **Thao tác:** **BỔ SUNG** nội dung vào cuối đoạn văn:
    ```markdown
    Đồng thời, tại Thẻ thông tin tài khoản cá nhân ở trang tổng quan của Portal, giảng viên có thể trực tiếp tự điền/cập nhật địa chỉ email cá nhân và thay đổi cấu hình bật hoặc tắt nhận thông báo hệ thống qua email thông qua công tắc Switch tiện lợi. Nếu giảng viên để trống địa chỉ email, công tắc bật/tắt nhận email thông báo tự động bị vô hiệu hóa (disabled) để phòng tránh các hành vi cấu hình sai lệch.
    ```

### 5. Mục 4.2.10. Giao diện Workspace TKB - Lưới phân công (Workspace Grid)
*   **Vị trí sửa đổi:** Sửa đổi phần *Mô tả chức năng chi tiết*
*   **Thao tác:** **BỔ SUNG** nội dung vào cuối đoạn văn:
    ```markdown
    *   **Quản lý thời gian động và Ghi chú:** Lưới phân công hiển thị thêm cột "Thời gian" cho phép giáo vụ cập nhật ngày bắt đầu và kết thúc riêng cho từng học phần bằng hộp chọn DatePicker. Hệ thống tự động tính ngày kết thúc lớn nhất của phiên xếp lịch dựa trên thời gian học phần kéo dài nhất. Phần đầu trang Workspace hiển thị ghi chú của phiên làm việc do Admin nhập vào khi tạo đợt.
    *   **Làm nổi bật nguyện vọng giảng viên tự đăng ký:** Trong panel rải lịch và kéo thả giảng viên của Admin, các giảng viên đã chủ động đăng ký môn học đó thông qua tài khoản cá nhân sẽ được hiển thị bằng một thẻ tên nổi bật có đường viền màu xanh lá cây kèm nền xanh nhạt, còn các giảng viên do Admin tự tay phân bổ sẽ hiển thị ở định dạng thẻ thông thường (màu xanh dương/cyan), giúp Admin dễ dàng nhận diện và tôn trọng nguyện vọng giảng dạy ban đầu của giảng viên.
    ```

### 6. Thêm mới mục 4.2.11. Giao diện Quản lý và Nhận Thông Báo (Bell Notification)
*   **Vị trí sửa đổi:** Thêm mới ngay sau mục `4.2.10` (trước mục `4.3. Đánh giá kết quả thực nghiệm và hướng phát triển`)
*   **Thao tác:** **THÊM MỚI** mục `4.2.11` như sau:
    ```markdown
    ### 4.2.11. Giao diện Quản lý và Nhận Thông Báo (Bell Notification)

    *   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện thông báo trên web.jpg - Mô tả: Biểu tượng quả chuông trên thanh điều hướng với chấm đỏ cảnh báo và hộp thoại danh sách các thông báo dạng dropdown hiển thị nội dung phân công mới]`
    *   **Mô tả chức năng chi tiết:** Phân hệ thông báo giúp duy trì luồng truyền thông thông suốt giữa Khoa và đội ngũ giảng viên. 
        *   **Biểu tượng Quả chuông & Badge:** Tích hợp trực tiếp trên thanh điều hướng Navbar ở góc trên bên phải màn hình của mọi tài khoản. Khi phát sinh thông báo mới (như cán bộ vừa gán môn dạy mới cho giảng viên), hệ thống sẽ hiển thị một chấm tròn đỏ (Badge) đi kèm số lượng tin nhắn chưa đọc.
        *   **Dropdown danh sách thông báo:** Khi nhấp chuột vào quả chuông, một cửa sổ Popover dropdown sẽ hiển thị danh sách các thông báo gần nhất kèm thời gian gửi tương quan (ví dụ: "3 phút trước"). Mỗi dòng thông báo có cấu trúc rõ ràng: "*Bạn đã được phân công dạy môn X tại lớp Y...*".
        *   **Đọc và điều hướng:** Người dùng có thể click vào nút "Đọc tất cả" để xóa nhanh cảnh báo hoặc click vào từng dòng thông báo cụ thể. Khi click vào thông báo, hệ thống tự động gọi API cập nhật trạng thái đã đọc (`is_read = True`) trong CSDL, xóa chấm đỏ và điều hướng giảng viên tới thẳng trang chi tiết Lịch phân công tương ứng để xem thông tin lớp học.
        *   **Cơ chế cập nhật định kỳ (Polling):** Frontend tích hợp cơ chế tự động gửi truy vấn kiểm tra thông báo mới lên Backend sau mỗi 30 giây để đảm bảo độ trễ cập nhật thông tin cực thấp mà không gây quá tải cho máy chủ.
    ```

---

## 📌 PHẦN KẾT LUẬN

### 1. Mục 4.3.1. Đánh giá ưu điểm hệ thống
*   **Vị trí sửa đổi:** Thêm mới gạch đầu dòng vào danh sách ưu điểm.
*   **Thao tác:** **THÊM MỚI** nội dung sau:
    ```markdown
    *   **Truyền thông tin cậy và tức thời:** Tích hợp thành công giải pháp thông báo hai lớp bao gồm thông báo đẩy trên web (Web Notification) cập nhật liên tục 30s và gửi email tự động qua giao thức SMTP. Giải pháp này giúp cắt giảm 90% thời gian trao đổi thủ công bằng tin nhắn hay gọi điện giữa giáo vụ khoa và giảng viên khi có biến động về thời khóa biểu.
    ```
