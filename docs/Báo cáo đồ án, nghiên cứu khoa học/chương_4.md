# CHƯƠNG 4. KẾT QUẢ THỰC NGHIỆM VÀ ĐÁNH GIÁ

## 4.1. Môi trường phát triển và triển khai hệ thống

### 4.1.1. Môi trường phần cứng và hệ điều hành

Hệ thống lập kế hoạch và phân công giảng dạy cho Khoa Công nghệ Thông tin – Trường Đại học Đại Nam được phát triển, cài đặt thử nghiệm và nghiệm thu cục bộ trên máy tính cá nhân của tác giả. Cấu hình phần cứng chi tiết của máy chủ thử nghiệm (Local Host) bao gồm các thông số kỹ thuật sau:

*   **Bộ vi xử lý (CPU):** AMD Ryzen 7 5800H (Kiến trúc Zen 3, 8 nhân vật lý, 16 luồng xử lý, xung nhịp cơ bản 3.2 GHz, hỗ trợ Turbo Boost lên đến 4.4 GHz, bộ nhớ đệm L3 Cache 16MB).
*   **Card xử lý đồ họa (GPU):** NVIDIA GeForce RTX 3060 Laptop GPU (Bộ nhớ chuyên dụng 6GB GDDR6).
*   **Bộ nhớ trong (RAM):** 16GB DDR4, xung nhịp Bus 3600 MHz chạy chế độ kênh đôi (Dual-channel).
*   **Thiết bị lưu trữ (SSD):** 512GB NVMe PCIe Gen3 x4 SSD (Tốc độ đọc/ghi dữ liệu tuần tự đạt mức 3000MB/s).
*   **Hệ điều hành sử dụng:** Microsoft Windows 11 Home 64-bit (Đã cài đặt đầy đủ môi trường thực thi dịch vụ).

---

### 4.1.2. Môi trường phần mềm và các thư viện cốt lõi

Kiến trúc phân tách rõ ràng giữa máy trạm (Client App) và máy chủ dịch vụ (API Server) được hiện thực hóa thông qua việc thiết lập đồng bộ các môi trường phần mềm và thư viện lập trình dưới đây:

#### a) Môi trường phía Máy chủ dịch vụ (Backend API Server)
*   **Ngôn ngữ lập trình:** Python phiên bản 3.10.x.
*   **Bộ khung ứng dụng (Framework):** FastAPI v0.109.2 (Hỗ trợ xây dựng các Endpoint RESTful API bất đồng bộ theo đặc tả OpenAPI).
*   **Trình chủ Web Server:** Uvicorn v0.27.1 (Trình chủ ASGI hiệu năng cao tích hợp Event Loop bất đồng bộ).
*   **Trình ánh xạ quan hệ cơ sở dữ liệu (ORM):** SQLAlchemy v2.0.25 (Quản lý các kết nối, giao dịch CSDL và thực thi các câu lệnh truy vấn hướng đối tượng).
*   **Quản lý cấu hình cấu trúc:** Pydantic Settings v2.1.0 (Đọc và ánh xạ cấu hình từ các biến môi trường hệ thống).
*   **Mã hóa bảo mật thông tin:** Bcrypt v4.1.2 (Sử dụng giải thuật băm mật khẩu một chiều bảo vệ tài khoản) và PyJWT v2.8.0 (Quản lý mã hóa, giải mã định danh và cấp phát JWT token).
*   **Xử lý bảng tính dữ liệu:** OpenPyXL v3.1.2 (Đọc dữ liệu nguyện vọng và kết xuất thời khóa biểu ra tệp tin định dạng Excel XLSX).

#### b) Môi trường phía Máy trạm (Frontend Client)
*   **Thư viện giao diện cốt lõi:** React v19.2.4 kết hợp với ngôn ngữ lập trình TypeScript để kiểm soát chặt chẽ kiểu dữ liệu đầu vào.
*   **Công cụ biên dịch và đóng gói:** Vite v8.0.4 (Tối ưu hóa tốc độ tải lại Hot Module Replacement trong quá trình phát triển).
*   **Thư viện thành phần giao diện (UI Components Library):** Ant Design (antd) v6.3.5 (Cung cấp các khối thành phần lưới dữ liệu Table, Drawer, Form, Modal, Popconfirm, Notification).
*   **Bộ khung thiết kế giao diện (Styling Framework):** TailwindCSS v4.2.2 (Sử dụng cơ chế biên dịch trực tiếp thông qua `@tailwindcss/vite` để tối ưu hóa kích thước tệp tin CSS).
*   **Động cơ hỗ trợ tương tác kéo thả:** Hệ thư viện chuyên dụng `@dnd-kit/core` v6.3.1, `@dnd-kit/sortable` v10.0.0 và `@dnd-kit/utilities` v3.2.2.
*   **Thư viện truyền tải dữ liệu HTTP:** Axios v1.14.0 (Quản lý các Interceptors để tự động đính kèm Token xác thực vào Header API).
*   **Quản lý điều hướng Client-side:** React Router DOM v6.30.3.

#### c) Hệ quản trị Cơ sở dữ liệu (Database Layer)
*   **Hệ quản trị CSDL quan hệ:** PostgreSQL phiên bản 15.x-alpine.
*   **Công cụ quản lý di cư CSDL (Database Migrations):** Alembic v1.13.1 (Tự động phát sinh cấu trúc bảng vật lý trong CSDL PostgreSQL dựa trên sự thay đổi của các Model khai báo trong mã nguồn).

---

### 4.1.3. Hướng dẫn cài đặt và chạy hệ thống

Quy trình thiết lập và khởi chạy toàn bộ các thành phần của hệ thống dưới môi trường phát triển cục bộ (Localhost) được tiến hành tuần tự theo 3 bước chính dưới đây:

#### Bước 1: Khởi động hệ quản trị cơ sở dữ liệu PostgreSQL
Hệ thống sử dụng Docker để cô lập dịch vụ cơ sở dữ liệu, đảm bảo tính nhất quán của cấu hình PostgreSQL mà không gây ảnh hưởng đến hệ điều hành gốc của máy chủ. Cán bộ mở cửa sổ lệnh terminal tại thư mục gốc của dự án và chạy câu lệnh:
```powershell
docker-compose up -d
```
Docker sẽ tự động tải xuống hình ảnh (Image) `postgres:15-alpine` và khởi động container `scheduling_postgres` hoạt động ngầm (Detached mode) trên cổng dịch vụ `5433` (được ánh xạ từ cổng mặc định `5432` bên trong container). Dữ liệu được lưu trữ bền vững thông qua phân vùng `postgres_data`.

#### Bước 2: Cấu hình và khởi động Backend API Server
Cán bộ điều hướng terminal vào thư mục [backend](file:///d:/.PROJECT_1/backend) và tiến hành kích hoạt môi trường ảo Python cô lập:
```powershell
cd backend
.venv\Scripts\activate
```
Sau khi môi trường ảo được kích hoạt thành công (dấu hiệu nhận biết là dòng chữ `(.venv)` xuất hiện ở đầu dòng lệnh), tiến hành cài đặt toàn bộ các thư viện bổ trợ quy định trong tệp tin [requirements.txt](file:///d:/.PROJECT_1/backend/requirements.txt):
```powershell
pip install -r requirements.txt
```
Sau khi quá trình tải và cài đặt thư viện kết thúc thành công, cán bộ chạy lệnh khởi động máy chủ Web Server Uvicorn:
```powershell
uvicorn app.main:app --reload
```
Lệnh `--reload` cho phép máy chủ tự động khởi động lại mỗi khi phát hiện thay đổi trong mã nguồn. API Backend sẽ hoạt động ổn định tại cổng dịch vụ `http://127.0.0.1:8000/api`.

#### Bước 3: Cài đặt thư viện và khởi chạy ứng dụng Client Frontend
Cán bộ mở cửa sổ terminal mới, di chuyển đến thư mục [frontend](file:///d:/.PROJECT_1/frontend) và tiến hành cài đặt các gói thư viện Node.js cần thiết:
```powershell
cd frontend
npm install
```
Sau khi quá trình thiết lập thư viện JavaScript hoàn tất, cán bộ chạy lệnh khởi động máy chủ Vite dev server:
```powershell
npm run dev
```
Hệ thống sẽ biên dịch mã nguồn TypeScript trong vài giây và mở ra một máy chủ ảo hoạt động tại cổng truyền tải `http://localhost:5173`. Người dùng sử dụng các trình duyệt web phổ biến (như Google Chrome, Microsoft Edge, Brave) truy cập vào địa chỉ trên để bắt đầu tương tác với giao diện hệ thống.

---

## 4.2. Kết quả thực nghiệm xây dựng giao diện

Dưới đây trình bày chi tiết kết quả thực hiện xây dựng hệ thống giao diện thực tế của ứng dụng, được cấu trúc theo phân quyền tác nhân sử dụng và quy trình nghiệp vụ xếp lịch chuyên môn:

### 4.2.1. Giao diện Đăng nhập

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện đăng nhập.jpg - Mô tả: Trang đăng nhập hệ thống với thiết kế biểu mẫu nhập Tên đăng nhập và Mật khẩu căn giữa, nền tối]`
*   **Mô tả chức năng chi tiết:** Màn hình đăng nhập là chốt chặn bảo mật đầu tiên của hệ thống. Giao diện bao gồm tiêu đề "Đăng nhập", trường nhập Tên đăng nhập (sử dụng Mã giảng viên đối với Giảng viên, tài khoản định danh đối với Cán bộ xếp lịch/Admin) và Mật khẩu. Trình duyệt sẽ gửi dữ liệu đăng nhập dạng JSON đến Endpoint Backend. Nếu đúng thông tin, hệ thống trả về JWT Token chứa thông tin vai trò người dùng và lưu trữ vào `localStorage`. Các Route Guard sẽ tự động kiểm tra sự tồn tại của Token này để quyết định quyền điều hướng hoặc chặn truy cập của người dùng.

---

### 4.2.2. Giao diện Dashboard Admin

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện dashboard của admin.jpg - Mô tả: Trang tổng quan của Cán bộ xếp lịch và Admin hiển thị các thẻ thống kê tổng số giảng viên, môn học, lớp học và các đợt xếp lịch]`
*   **Mô tả chức năng chi tiết:** Sau khi xác thực thành công với vai trò Cán bộ xếp lịch hoặc Admin, hệ thống điều hướng người dùng tới trang Dashboard. Giao diện hiển thị các chỉ số thống kê tổng quan (Metrics) bao gồm: tổng số giảng viên thuộc khoa, tổng số môn học, số lớp học phần đang quản lý và số lượng phiên thời khóa biểu đang ở trạng thái nháp (Draft) hoặc đã duyệt (Done). Dashboard giúp cán bộ giáo vụ nhanh chóng nắm bắt quy mô dữ liệu nghiệp vụ của khoa tại thời điểm hiện tại.

---

### 4.2.3. Giao diện Quản lý Giảng viên

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện quản lý giảng viên.jpg - Mô tả: Màn hình hiển thị danh sách giảng viên dưới dạng lưới Table của Ant Design, thanh công cụ tìm kiếm và nút Thêm giảng viên]`
*   **Mô tả chức năng chi tiết:** Cho phép cán bộ giáo vụ quản lý hồ sơ giảng dạy của đội ngũ giảng viên trong Khoa. Danh sách hiển thị đầy đủ thông tin: Mã giảng viên, Họ và tên, Hình thức nhân sự (Cơ hữu/Thỉnh giảng), Chức vụ/Học vị và Định mức tiết dạy tối đa (`max_quota`). Giáo vụ có thể thêm mới giảng viên thông qua một Drawer trượt từ bên phải màn hình. Khi lưu giảng viên mới, Backend sẽ tự động phát sinh một tài khoản đăng nhập tương ứng trong bảng `users` với Tên đăng nhập trùng với Mã giảng viên và mật khẩu mặc định được thiết lập là `123456`.

---

### 4.2.4. Giao diện Quản lý Môn học

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện quản lý môn học.jpg - Mô tả: Bảng hiển thị danh mục các học phần, số tín chỉ và số tiết quy đổi]`
*   **Mô tả chức năng chi tiết:** Cung cấp giao diện quản lý danh mục học phần chuyên ngành của Khoa. Khi thêm mới hoặc chỉnh sửa môn học, cán bộ giáo vụ chỉ cần nhập số tín chỉ lý thuyết và thực hành, hệ thống sẽ tự động tính toán tổng số tiết học tương ứng (1 tín chỉ quy đổi bằng 15 tiết học thực tế) phục vụ tính tải giảng dạy cho giảng viên. Giao diện hỗ trợ tìm kiếm nhanh theo mã môn hoặc tên môn.

---

### 4.2.5. Giao diện Quản lý Lớp học

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện quản lý lớp học.jpg - Mô tả: Màn hình danh sách lớp sinh viên cố định của khoa kèm trường lọc theo khóa]`
*   **Mô tả chức năng chi tiết:** Quản lý thông tin của các lớp sinh viên cố định thuộc khoa CNTT. Cán bộ giáo vụ có thể gán từng lớp học vào một Khung chương trình đào tạo cụ thể (`Training Program`) để làm cơ sở cho hệ thống tự động sinh ra các dòng lớp học phần tương ứng khi xếp lịch. Giao diện hỗ trợ bộ lọc tiện lợi theo khóa học (Batch - ví dụ: Khóa 19) và theo ngành học.

---

### 4.2.6. Giao diện Quản lý Khung chương trình đào tạo

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện quản lý khung đào tạo.jpg - Mô tả: Giao diện thiết lập khung chương trình đào tạo của từng chuyên ngành, chia theo cấu trúc tab các học kỳ]`
*   **Mô tả chức năng chi tiết:** Là nơi thiết lập khung chương trình học áp dụng cho từng khóa tuyển sinh (ví dụ: Công nghệ thông tin - PM Khóa 19). Giao diện được tổ chức trực quan theo các tab từ Kỳ học 1 đến Kỳ học 8. Tại mỗi kỳ học, cán bộ xếp lịch có thể gán hoặc loại bỏ các môn học tương ứng từ danh mục môn học cốt lõi. Đây là cấu trúc dữ liệu nền tảng giúp hệ thống tự động nhân chéo (Cross Join) sinh dữ liệu TKB trống mà không cần cán bộ phải tạo thủ công từng lớp học phần.

---

### 4.2.7. Giao diện Quản lý Đợt Đăng ký Nguyện vọng

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện quản lý đăng ký dạy học.jpg - Mô tả: Màn hình quản lý các đợt khảo sát nguyện vọng, bao gồm nút Bật/Tắt đợt đăng ký và nút Import Excel nguyện vọng]`
*   **Mô tả chức năng chi tiết:** Cán bộ xếp lịch sử dụng giao diện này để lập đợt khảo sát nguyện vọng giảng dạy cho từng học kỳ cụ thể. Giáo vụ có thể chọn nhanh danh sách môn học của đợt bằng Wizard quét từ khung chương trình đào tạo, đóng/mở đợt khảo sát bằng cách nhấn nút Bật/Tắt (`is_open = True/False`) để mở quyền đăng ký cho giảng viên, hoặc thực hiện import danh sách nguyện vọng trực tiếp từ tệp tin Excel khảo sát của khoa.

---

### 4.2.8. Giao diện Đăng ký Nguyện vọng Giảng dạy (Giảng viên)

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện đăng ký dạy.jpg - Mô tả: Giao diện Lecturer Portal hiển thị danh sách các môn học được đăng ký trong đợt khảo sát đang mở]`
*   **Mô tả chức năng chi tiết:** Khi giảng viên đăng nhập portal cá nhân, hệ thống tự động kiểm tra đợt khảo sát đang mở của học kỳ hiện tại. Giảng viên tiến hành tích chọn các môn học mình có đủ năng lực giảng dạy và chọn vai trò phụ trách tương ứng: Giảng dạy lý thuyết (Giảng viên chính) hoặc Giảng dạy thực hành (Giảng viên thực hành). Khi lưu nguyện vọng, hệ thống ghi nhận trực tiếp vào bảng trung gian `lecturer_registrations` để làm cơ sở tính điểm ưu tiên cho thuật toán xếp lịch tự động.

---

### 4.2.9. Giao diện Workspace TKB - Cấu hình khởi tạo (Wizard)

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện workspace TKB_1.jpg - Mô tả: Hộp thoại Wizard từng bước thiết lập tên đợt xếp lịch, chọn đợt nguyện vọng tham chiếu và các khung đào tạo tham gia xếp lịch]`
*   **Mô tả chức năng chi tiết:** Quy trình Wizard hướng dẫn cán bộ giáo vụ thiết lập nhanh đầu vào cho phiên xếp lịch mới. Giáo vụ đặt tên đợt (ví dụ: TKB HK1 2026-2027), chọn liên kết với đợt Đăng ký Nguyện vọng tương ứng, và cấu hình các chương trình khung kèm học kỳ cần chạy lịch (ví dụ: CNTT Khóa 19 Kỳ 5). Khi nhấn xác nhận, hệ thống tự động quét các lớp học cố định thuộc khung đó, nhân với danh mục môn học của kỳ tương ứng để sinh tự động toàn bộ lưới thời khóa biểu trống.

---

### 4.2.10. Giao diện Workspace TKB - Lưới phân công (Workspace Grid)

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện workspace_2.jpg - Mô tả: Lưới dữ liệu Workspace hiển thị danh sách lớp, môn học, slot dạy kèm bảng điều khiển danh sách giảng viên kéo thả bên phải]`
*   **Mô tả chức năng chi tiết:** Giao diện lưới làm việc trung tâm có tính tương tác cao nhất hệ thống.
    *   **Thao tác kéo thả:** Cán bộ xếp lịch nhấp chuột vào một dòng học phần trên lưới, cột danh sách giảng viên đăng ký hợp lệ ở bên phải sẽ hiển thị các giảng viên có nguyện vọng dạy môn đó kèm theo định mức tiết dạy. Giáo vụ kéo thả thẻ tên giảng viên trực tiếp vào ô "Giảng viên chính" hoặc "Giảng viên thực hành".
    *   **⚡ Auto-Assign (Xếp tự động):** Khi bấm nút Auto-Assign, Backend sẽ kích hoạt động cơ thuật toán CSP chạy ngầm để tính toán phương án gán slot thời gian (Thứ, Ca học) và phân công giảng viên tối ưu nhất cho toàn bộ các lớp trống trên lưới chỉ trong vài giây.
    *   **Cảnh báo xung đột thời gian thực:** Giao diện hiển thị trực quan các cảnh báo màu đỏ nếu giáo vụ cố tình xếp trùng lịch giảng viên tại cùng một ca, hoặc cảnh báo màu vàng khi giảng viên vượt định mức giờ dạy cho phép.
    *   **Xuất Excel:** Khi hài lòng với phương án phân công, cán bộ bấm nút "Export Excel" để hệ thống kết xuất toàn bộ lưới phân công thành tệp tin Excel hoàn thiện của khoa.

---

## 4.3. Đánh giá kết quả thực nghiệm và hướng phát triển

### 4.3.1. Đánh giá ưu điểm hệ thống

Trải qua quá trình vận hành thử nghiệm thực tế với bộ dữ liệu mẫu có kiểm soát, hệ thống lập kế hoạch và phân công giảng dạy cho Khoa Công nghệ Thông tin – Trường Đại học Đại Nam đã đạt được những kết quả thực nghiệm xuất sắc:

*   **Quy mô bộ dữ liệu thử nghiệm:** Hệ thống đã thực hiện kiểm thử thành công trên bộ dữ liệu bao gồm: **30 giảng viên** (phân loại đa dạng giữa cơ hữu và thỉnh giảng), **62 môn học** chuyên ngành CNTT và **7 lớp học cố định** thuộc cùng một khóa học **K19** đang tham gia xếp lịch.
*   **Hiệu năng thuật toán xếp lịch tự động (Auto-Assign):** Động cơ thuật toán Thỏa mãn Ràng buộc (Constraint Satisfaction Problem - CSP) tích hợp phía Backend hoạt động cực kỳ hiệu quả. Thời gian trung bình để thuật toán tính toán, phân bổ lớp, phân công giảng viên chính/thực hành và gán slot thời gian tối ưu cho toàn bộ lưới thời khóa biểu đạt hiệu suất vượt trội: **dưới 3 giây** trên cấu hình máy tính cá nhân của tác giả.
*   **Độ chính xác và thỏa mãn ràng buộc:** Trong môi trường thử nghiệm có kiểm soát, hệ thống đạt tỷ lệ gán chính xác **100%**, đảm bảo tuyệt đối không xảy ra bất kỳ xung đột lịch dạy nào đối với các ràng buộc cứng (như giảng viên bị trùng lịch dạy tại cùng một buổi học, gán sai chuyên môn đào tạo). Hệ thống cũng đáp ứng tối đa các ràng buộc mềm như phân bổ đều tải giảng dạy và ưu tiên giảng viên cơ hữu.
*   **Trải nghiệm tương tác và độ tin cậy:** Giao diện Workspace được tối ưu hóa tốt cho cảm giác kéo thả trơn tru nhờ thư viện `@dnd-kit`. Cơ chế phát hiện xung đột và cảnh báo trực tiếp bằng màu sắc giúp giáo vụ kiểm soát hoàn toàn chất lượng thời khóa biểu, loại bỏ hoàn toàn các lỗi tính toán thủ công thường gặp.

---

### 4.3.2. Nhược điểm và hạn chế

Bên cạnh những ưu điểm đạt được, hệ thống vẫn tồn tại một số điểm hạn chế cần được cải thiện trong các phiên bản tiếp theo:

*   **Quy mô kiểm thử thực tế:** Mặc dù hoạt động hoàn hảo trên bộ dữ liệu thử nghiệm cấp khoa (30 giảng viên, 62 môn học, 7 lớp K19), hệ thống chưa có dữ liệu thử nghiệm thực tế trên quy mô toàn trường (với hàng nghìn giảng viên và lớp học phần diễn ra đồng thời).
*   **Giới hạn về phân bổ phòng học:** Hệ thống hiện tại mới chỉ gán loại phòng yêu cầu (Phòng máy/Phòng thường) trên lưới Workspace mà chưa tích hợp module quản lý và phân phối vị trí phòng học vật lý chi tiết (ví dụ: Phòng 301, 302 tòa nhà GD1).
*   **Tính năng cộng tác đồng thời:** Hệ thống vận hành độc lập trên môi trường local của người dùng. Chưa hỗ trợ tính năng đồng bộ hóa thời gian thực (Real-time Collaboration) nếu có nhiều cán bộ giáo vụ cùng đăng nhập và thao tác chỉnh sửa trên cùng một phiên xếp lịch thời khóa biểu.

---

### 4.3.3. Hướng phát triển trong tương lai

Để hoàn thiện và nâng cao giá trị thực tiễn của đề tài, các hướng nghiên cứu và phát triển tiếp theo của hệ thống bao gồm:

1.  **Xây dựng Module Quản lý Phòng học vật lý:** Tự động phát hiện và kiểm soát xung đột phòng học vật lý dựa trên sức chứa (Capacity) và thiết bị phòng máy của Nhà trường.
2.  **Tối ưu hóa thuật toán CSP:** Nâng cấp cấu trúc lưu trữ và giải thuật CSP, áp dụng phương pháp phân rã bài toán (Problem Decomposition) để có thể xử lý mượt mà dữ liệu quy mô siêu lớn khi áp dụng cho cấp trường.
3.  **Triển khai trên nền tảng điện toán đám mây (Cloud Deployment):** Đóng gói hệ thống bằng Docker Production Multi-stage Build, triển khai lên hệ thống máy chủ Cloud kết hợp WebSockets để hỗ trợ làm việc cộng tác thời gian thực giữa nhiều cán bộ xếp lịch.

---

## 4.4. Kết luận chương

Chương 4 đã trình bày chi tiết kết quả thực nghiệm xây dựng và đánh giá hệ thống lập kế hoạch và phân công giảng dạy cho Khoa Công nghệ Thông tin – Trường Đại học Đại Nam. Thông qua các đặc tả kỹ lưỡng về môi trường phát triển local dựa trên cấu hình phần cứng Ryzen 7 5800H của tác giả và các bộ công cụ lập trình hiện đại như FastAPI và React 19, hệ thống đã chứng minh được tính ổn định và khả năng đáp ứng tốt các yêu cầu nghiệp vụ thực tiễn. 

Kết quả thử nghiệm thực tế trên mẫu dữ liệu 30 giảng viên, 62 môn học, 7 lớp K19 với thời gian chạy thuật toán CSP dưới 3 giây và độ chính xác thỏa mãn ràng buộc đạt 100% đã xác thực tính đúng đắn và hiệu quả vượt trội của giải pháp đề xuất. Đây là tiền đề quan trọng giúp thay thế hoàn toàn quy trình xếp lịch thủ công phức tạp bằng một quy trình tự động hóa thông minh, chính xác, tiết kiệm tối đa thời gian cho cán bộ quản lý giáo vụ của Khoa Công nghệ Thông tin.
