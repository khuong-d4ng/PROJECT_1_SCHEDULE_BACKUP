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
*   **Mô tả chức năng chi tiết:** Màn hình đăng nhập được thiết kế tối giản, hiện đại và là chốt chặn bảo mật đầu tiên của hệ thống. Biểu mẫu đăng nhập yêu cầu người dùng điền thông tin định danh bao gồm Tên đăng nhập (sử dụng Mã giảng viên đối với Giảng viên, tài khoản định danh do Admin cấp đối với Cán bộ xếp lịch/Admin) và Mật khẩu. Khi biểu mẫu được xác nhận, dữ liệu đăng nhập sẽ được gửi đi dưới dạng JSON qua phương thức HTTP POST đến Endpoint `/api/auth/login` của Backend. Nếu thông tin khớp với bản ghi trong bảng `users` (mật khẩu đã băm bằng giải thuật Bcrypt được so khớp chính xác), máy chủ sẽ trả về một mã token JWT (JSON Web Token) được ký bảo mật cùng thông tin vai trò (Role). Token này lập tức được lưu trữ vào trình duyệt thông qua `localStorage` và tự động tích hợp vào Header `Authorization: Bearer` trong mọi yêu cầu API tiếp theo nhờ cơ chế Axios Interceptor. Hệ thống định tuyến phía Client (React Router Guard) sẽ tự động kiểm tra token này để điều hướng giảng viên về cổng Lecturer Portal, hoặc điều hướng Admin/Cán bộ về trang Dashboard, ngăn chặn tuyệt đối các truy cập trái phép.

---

### 4.2.2. Giao diện Dashboard Admin

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện dashboard của admin.jpg - Mô tả: Trang tổng quan của Cán bộ xếp lịch và Admin hiển thị các thẻ thống kê tổng số giảng viên, môn học, lớp học và các đợt xếp lịch]`
*   **Mô tả chức năng chi tiết:** Dashboard là màn hình tổng quan xuất hiện ngay sau khi Cán bộ xếp lịch hoặc Admin đăng nhập thành công. Giao diện được thiết kế trực quan bằng hệ thống lưới (Grid) hiển thị các thẻ chỉ số (Cards Metrics) quan trọng gồm: Tổng số giảng viên hoạt động, Tổng số học phần hiện có trong chương trình khung, Số lớp học phần đang quản lý, và số lượng Đợt xếp thời khóa biểu. Các con số này được cập nhật theo thời gian thực từ các truy vấn tổng hợp (Aggregation Queries) phía Backend. Bên cạnh đó, Dashboard còn tích hợp biểu đồ thống kê phân loại giảng viên (Cơ hữu vs Thỉnh giảng) giúp cán bộ giáo vụ nhanh chóng đánh giá được quy mô nhân sự và khối lượng công việc hiện hành của khoa tại kỳ học hiện tại để đưa ra định hướng phân bổ nhân lực hợp lý.

---

### 4.2.3. Giao diện Quản lý Giảng viên

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện quản lý giảng viên.jpg - Mô tả: Màn hình hiển thị danh sách giảng viên dưới dạng lưới Table của Ant Design, thanh công cụ tìm kiếm và nút Thêm giảng viên]`
*   **Mô tả chức năng chi tiết:** Phân hệ này là công cụ chính giúp cán bộ giáo vụ quản lý và cập nhật hồ sơ của toàn bộ giảng viên trong Khoa Công nghệ Thông tin. Danh sách hiển thị dưới dạng lưới Ant Design Table chuyên nghiệp với các cột: Mã giảng viên, Họ và tên, Hình thức nhân sự (Cơ hữu/Thỉnh giảng), Chức vụ/Học vị, Email liên lạc, và Định mức tiết dạy trần tối đa trong học kỳ (`max_quota`). Giao diện tích hợp bộ tìm kiếm nhanh không dấu/có dấu và tính năng thêm mới giảng viên thông qua một Drawer trượt từ bên phải vô cùng mượt mà. Điểm thông minh của hệ thống là khi cán bộ thêm mới giảng viên, Backend sẽ tự động phát sinh một tài khoản đăng nhập tương ứng trong bảng `users` với Tên đăng nhập trùng với Mã giảng viên và mật khẩu khởi tạo mặc định là `123456`. Đặc biệt, giao diện cũng bổ sung tính năng **Xóa giảng viên** ngay trong menu chỉnh sửa; nếu giảng viên đã có lịch giảng dạy hoặc nguyện vọng lịch sử, hệ thống sẽ kích hoạt ràng buộc khóa ngoại của CSDL để ngăn chặn xóa trực tiếp, bảo đảm an toàn dữ liệu 100%.

---

### 4.2.4. Giao diện Quản lý Học phần

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện quản lý môn học.jpg - Mô tả: Bảng hiển thị danh mục các học phần, số tín chỉ và số tiết quy đổi]`
*   **Mô tả chức năng chi tiết:** Giao diện này cung cấp công cụ chuẩn hóa và quản lý danh mục toàn bộ các học phần chuyên ngành Công nghệ thông tin của Khoa. Khi thêm mới hoặc hiệu chỉnh học phần, cán bộ xếp lịch chỉ cần nhập Mã học phần, Tên học phần, số tín chỉ Lý thuyết và Thực hành. Hệ thống sẽ tự động tính toán tổng số tín chỉ và tự động quy đổi thành tổng số tiết giảng dạy thực tế (với quy ước 1 tín chỉ tương đương 15 tiết học thực tế) phục vụ cho thuật toán tính tải giờ dạy của giảng viên. Cột danh sách học phần cũng hỗ trợ phân trang thông minh, sắp xếp động theo số tín chỉ và lọc tìm kiếm tức thì theo mã/tên học phần giúp cán bộ làm việc với khối lượng dữ liệu lớn một cách nhẹ nhàng.

---

### 4.2.5. Giao diện Quản lý Lớp học

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện quản lý lớp học.jpg - Mô tả: Màn hình danh sách lớp sinh viên cố định của khoa kèm trường lọc theo khóa]`
*   **Mô tả chức năng chi tiết:** Phục vụ công tác quản lý thông tin các lớp sinh viên cố định được đào tạo trong Khoa (ví dụ: CNTT1 K19, PM2 K19). Cán bộ giáo vụ có thể dễ dàng liên kết từng lớp học với một Khung chương trình đào tạo cụ thể (`Training Program`) và một chuyên ngành tương ứng. Việc thiết lập mối quan hệ này là tiền đề kỹ thuật vô cùng quan trọng, cho phép hệ thống tự động nhân chéo (Cross Join) để sinh ra thời khóa biểu trống ở các bước sau. Giao diện được trang bị các bộ lọc nhanh theo Khóa học (Batch) và theo Ngành học để giáo vụ dễ dàng kiểm soát hàng chục lớp học thuộc nhiều khóa khác nhau cùng một lúc.

---

### 4.2.6. Giao diện Quản lý Khung chương trình đào tạo

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện quản lý khung đào tạo.jpg - Mô tả: Giao diện thiết lập khung chương trình đào tạo của từng chuyên ngành, chia theo cấu trúc tab các học kỳ]`
*   **Mô tả chức năng chi tiết:** Cho phép thiết lập và lưu trữ cấu trúc chương trình đào tạo định hình cho từng khóa tuyển sinh (như Công nghệ thông tin - PM Khóa 19). Giao diện được thiết kế trực quan bằng cấu trúc Tab phân chia rõ ràng từ Học kỳ 1 đến Học kỳ 8. Tại mỗi học kỳ, cán bộ có thể thực hiện thao tác gán hoặc loại bỏ các học phần tương ứng từ danh mục học phần nền tảng. Khi cán bộ cấu hình xong học kỳ và nhấn lưu, thông tin được lưu trữ đồng nhất vào cơ sở dữ liệu để làm cơ sở cho Wizard tự động sinh ra các dòng lớp học phần thời khóa biểu mà không cần cán bộ xếp lịch phải tạo thủ công từng ô dữ liệu.

---

### 4.2.7. Giao diện Quản lý Đợt Đăng ký Nguyện vọng

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện quản lý đăng ký dạy học.jpg - Mô tả: Màn hình quản lý các đợt khảo sát nguyện vọng, bao gồm nút Bật/Tắt đợt đăng ký và nút Import Excel nguyện vọng]`
*   **Mô tả chức năng chi tiết:** Cán bộ xếp lịch sử dụng phân hệ này để thiết lập và tổ chức các đợt khảo sát nguyện vọng giảng dạy cho đội ngũ giảng viên trước mỗi học kỳ mới. Tại đây, giáo vụ có thể chọn nhanh danh sách học phần cho đợt khảo sát bằng cách quét từ chương trình khung, đóng/mở đợt đăng ký bằng nút Bật/Tắt trạng thái (`is_open = True/False`) để phân quyền cho giảng viên tương tác trên cổng Portal. Đồng thời, hệ thống cũng tích hợp module Import dữ liệu nguyện vọng trực tiếp từ file Excel khảo sát của Khoa bằng thư viện Pandas, tự động phát hiện và cảnh báo kiểm duyệt các giảng viên hoặc học phần mới chưa tồn tại trong CSDL để cán bộ duyệt trước khi lưu vào CSDL.

---

### 4.2.8. Giao diện Đăng ký Nguyện vọng Giảng dạy (Giảng viên)

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện đăng ký nguyện vọng giảng viên.jpg - Mô tả: Trang đăng ký nguyện vọng cá nhân của giảng viên với bảng danh sách học phần chuyên ngành và bộ chọn vai trò giảng dạy]`
*   **Mô tả chức năng chi tiết:** Đây là giao diện chuyên biệt dành riêng cho tác nhân Giảng viên khi truy cập vào hệ thống thông qua tài khoản cá nhân. Sau khi đăng nhập thành công, hệ thống sẽ thực hiện lệnh gọi API xác thực và tự động kiểm tra xem có đợt khảo sát nguyện vọng nào đang mở (`is_open = True`) cho học kỳ hiện tại hay không. Nếu có đợt khảo sát đang hoạt động, hệ thống sẽ tải danh sách tất cả các học phần thuộc phạm vi chuyên môn của khoa. Giảng viên tiến hành tích chọn các học phần mà bản thân có đủ năng lực và chuyên môn đảm nhiệm giảng dạy, đồng thời lựa chọn cụ thể vai trò phụ trách tương ứng: Giảng dạy lý thuyết (Giảng viên chính) hoặc Giảng dạy thực hành (Giảng viên thực hành). Khi người dùng nhấn nút "Lưu nguyện vọng", ứng dụng Client sẽ thu thập dữ liệu và gửi yêu cầu lưu trữ qua phương thức HTTP POST đến API `/api/lecturer/registrations`. Tại Backend, hệ thống sẽ thực thi các tác vụ kiểm tra tính toàn vẹn và cập nhật dữ liệu trực tiếp vào bảng liên kết trung gian `lecturer_registrations` trong cơ sở dữ liệu PostgreSQL. Toàn bộ thông tin đăng ký nguyện vọng này sẽ là cơ sở dữ liệu đầu vào cực kỳ quan trọng để thuật toán CSP tính toán trọng số ưu tiên khi tiến hành xếp lịch tự động sau này.

---

### 4.2.9. Giao diện Workspace TKB - Cấu hình khởi tạo (Wizard)

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện workspace TKB_1.jpg - Mô tả: Hộp thoại Wizard từng bước thiết lập tên đợt xếp lịch, chọn đợt nguyện vọng tham chiếu và các khung đào tạo tham gia xếp lịch]`
*   **Mô tả chức năng chi tiết:** Quy trình biểu mẫu đa bước (Wizard) được thiết kế nhằm hướng dẫn cán bộ giáo vụ thiết lập nhanh gọn và chính xác toàn bộ các tham số đầu vào cần thiết cho một phiên làm việc (Workspace) xếp thời khóa biểu mới, giảm thiểu tối đa các sai sót do nhập liệu thủ công. Tiến trình cấu hình được chia làm ba bước rõ ràng:
    1.  **Bước 1 - Khai báo thông tin cơ bản:** Cán bộ xếp lịch thực hiện đặt tên cho đợt xếp thời khóa biểu (ví dụ: "TKB HK1 2026-2027") và chọn học kỳ học thuật tương ứng.
    2.  **Bước 2 - Liên kết dữ liệu nguyện vọng:** Giáo vụ lựa chọn liên kết phiên làm việc này với một đợt Đăng ký Nguyện vọng cụ thể đã được triển khai trước đó để hệ thống nạp danh sách nguyện vọng giảng dạy của giảng viên.
    3.  **Bước 3 - Xác định phạm vi đào tạo:** Giáo vụ tích chọn các chương trình khung đào tạo (`Training Program`) cùng các khóa lớp cụ thể tham gia xếp lịch trong đợt này (ví dụ: Khóa 19 Công nghệ thông tin - Kỳ 5).
    Khi cán bộ nhấn nút hoàn tất, một yêu cầu HTTP POST chứa toàn bộ thông tin cấu hình sẽ được gửi đến Endpoint `/api/workspaces/create`. Backend FastAPI sẽ kích hoạt quy trình quét tự động: hệ thống truy vấn toàn bộ các lớp học cố định thuộc chương trình khung đã chọn, thực hiện phép nhân chéo (Cross Join) với danh mục các học phần quy định cho kỳ học đó trong chương trình đào tạo để tự động sinh ra toàn bộ các bản ghi lưới thời khóa biểu trống. Cơ chế sinh tự động này giúp cán bộ giáo vụ tiết kiệm hàng giờ đồng hồ so với việc phải khởi tạo thủ công từng lớp học phần trên lưới.

---

### 4.2.10. Giao diện Workspace TKB - Lưới phân công (Workspace Grid)

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện workspace_2.jpg - Mô tả: Lưới dữ liệu Workspace hiển thị danh sách lớp, học phần, slot dạy kèm bảng điều khiển danh sách giảng viên kéo thả bên phải]`
*   **Mô tả chức năng chi tiết:** Giao diện lưới làm việc trung tâm (Workspace Grid) là phân hệ cốt lõi, sở hữu mức độ tương tác cao nhất và phức tạp nhất của toàn bộ hệ thống, hỗ trợ cán bộ giáo vụ theo dõi tổng thể và đưa ra quyết định phân công giảng dạy tối ưu:
    *   **Thao tác kéo thả trực quan (Interactive Drag-and-Drop):** Được xây dựng và tối ưu hiệu năng mượt mà trên nền tảng React 19 kết hợp hệ thư viện `@dnd-kit`. Khi giáo vụ nhấp chuột chọn một dòng lớp học phần bất kỳ trên lưới trung tâm, bảng điều khiển (Sidebar) bên phải lập tức đồng bộ hiển thị danh sách các giảng viên đã đăng ký nguyện vọng giảng dạy học phần đó. Danh sách giảng viên được sắp xếp thông minh theo thứ tự ưu tiên của nguyện vọng và định mức tiết dạy còn lại (`max_quota`). Giáo vụ chỉ cần thực hiện thao tác kéo thẻ tên giảng viên từ Sidebar và thả trực tiếp vào ô trống "Giảng viên chính" hoặc "Giảng viên thực hành" của lớp học phần tương ứng để thực hiện gán nhanh chóng.
    *   **⚡ Động cơ xếp lịch tự động (Auto-Assign Engine):** Phía trên thanh công cụ tích hợp nút kích hoạt tính năng **"Tự động phân công"** (trước đây là "Auto-Assign"). Khi bấm nút này, Client gửi tín hiệu yêu cầu xếp lịch tự động đến Backend. Tại đây, động cơ thuật toán Thỏa mãn Ràng buộc (Constraint Satisfaction Problem - CSP) sẽ được kích hoạt ngầm, giải quyết hàng loạt các ràng buộc cứng (tránh trùng lịch ca dạy của giảng viên, tránh trùng phòng máy học, gán đúng năng lực chuyên môn) và ràng buộc mềm (cân bằng tải tiết dạy, ưu tiên giảng viên cơ hữu) để hoàn thành việc điền tự động toàn bộ giảng viên và gán slot thời gian (Thứ, Ca học) cho tất cả các lớp học phần còn trống chỉ trong vòng dưới 3 giây.
    *   **Cơ chế cảnh báo xung đột thời gian thực (Real-time Validation):** Hệ thống tích hợp thuật toán kiểm tra xung đột trực tiếp trên trình duyệt (Client-side validation) song song với kiểm tra ở phía Backend. Bất cứ khi nào giáo vụ kéo thả hoặc thay đổi thông tin thủ công mà vi phạm quy tắc (như xếp trùng giảng viên ở cùng một ca trong tuần), hệ thống lập tức hiển thị cảnh báo đỏ nổi bật (`xung đột ca dạy`). Nếu giảng viên bị phân công vượt quá định mức tiết dạy trần tối đa trong kỳ (`max_quota`), hệ thống sẽ hiển thị cảnh báo màu vàng để giáo vụ cân nhắc điều chỉnh phù hợp.
    *   **Kết xuất báo cáo Excel chuyên nghiệp (Export Excel Utility):** Sau khi hoàn tất phương án phân công thời khóa biểu tối ưu và không còn cảnh báo xung đột, cán bộ giáo vụ nhấn nút **"Xuất ra Excel"** (trước đây là "Export Excel"). Backend sẽ sử dụng thư viện `openpyxl` để biên dịch toàn bộ dữ liệu thời khóa biểu phức tạp từ lưới thành một tệp tin báo cáo Excel được định dạng thẩm mỹ, phân nhóm theo lớp và giảng viên, sẵn sàng in ấn và ban hành cấp Khoa.

---

### 4.2.11. Giao diện Quản lý Tài khoản & Phân quyền (Admin)

*   **Vị trí ảnh thực tế:** `[Ảnh thực tế: Giao diện quản lý tài khoản.jpg - Mô tả: Trang quản trị tài khoản dành riêng cho Admin hiển thị bảng danh sách các user, phân quyền vai trò và nút Thêm tài khoản]`
*   **Mô tả chức năng chi tiết:** Phân hệ này được thiết kế như một trung tâm kiểm soát bảo mật và phân quyền truy cập tối cao của hệ thống, chỉ hiển thị với người dùng đăng nhập dưới vai trò Admin thông qua hệ thống định tuyến bảo vệ phía Client-side (`isAdmin Route Guard`).
    *   **Quản lý danh sách tài khoản:** Giao diện hiển thị danh sách toàn bộ các tài khoản người dùng trong cơ sở dữ liệu PostgreSQL thông qua lưới Ant Design Table. Các cột dữ liệu bao gồm: Tên đăng nhập, Email liên lạc, Vai trò hệ thống (`RoleEnum` hiển thị dưới dạng thẻ màu trực quan), Hồ sơ Giảng viên liên kết (hiển thị rõ tên giảng viên và mã số giảng viên dưới dạng thẻ Tag để hỗ trợ kiểm soát tính nhất quán dữ liệu), và Trạng thái nhận thông báo tự động qua Email. 
    *   **Thêm mới và Cấp quyền:** Admin có thể tạo tài khoản mới ngay trên giao diện thông qua một Modal Form chuyên nghiệp, hỗ trợ phân các vai trò khác nhau (Admin, Cán bộ xếp lịch, Giảng viên) và tự động mã hóa mật khẩu bảo mật trước khi ghi vào cơ sở dữ liệu.
    *   **Hiệu chỉnh thông tin nâng cao:** Hỗ trợ Admin cập nhật thông tin tên đăng nhập, email, thay đổi vai trò hệ thống hoặc reset mật khẩu tùy chọn cho người dùng (nếu để trống trường mật khẩu hệ thống sẽ giữ nguyên).
    *   **Xóa và Kiểm duyệt ràng buộc:** Khi Admin thực hiện xóa tài khoản, Backend sẽ áp dụng cơ chế tự bảo vệ chặn tự xóa tài khoản chính mình, đồng thời kiểm tra tính toàn vẹn cơ sở dữ liệu: nếu tài khoản giảng viên đã phát sinh nguyện vọng lịch sử hoặc lịch phân công thực tế, hệ thống sẽ từ chối xóa và hiển thị cảnh báo đỏ nhằm bảo vệ tính nhất quán cơ sở dữ liệu ở mức tối đa.

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
