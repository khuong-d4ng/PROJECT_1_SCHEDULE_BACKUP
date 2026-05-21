# CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

## 3.1. Thiết kế hệ thống

Hệ thống Quản lý Phân công Giảng dạy và Đăng ký Nguyện vọng trực tuyến được thiết kế theo mô hình kiến trúc Client-Server, trong đó phần Backend (API Server) và Frontend (Giao diện người dùng) được tách biệt hoàn toàn, giao tiếp với nhau thông qua giao thức RESTful API.

Hệ thống bao gồm ba nhóm tác nhân chính:

- **Quản trị viên (Admin):** Có toàn quyền quản lý hệ thống bao gồm tạo tài khoản người dùng, quản lý dữ liệu nền tảng (giảng viên, môn học, chương trình đào tạo, lớp học) và giám sát toàn bộ hoạt động.
- **Cán bộ xếp lịch (Scheduler):** Là người trực tiếp thao tác nghiệp vụ phân công, bao gồm tạo đợt đăng ký nguyện vọng, quản lý phiên bản phân công, thao tác kéo thả xếp lịch trên Workspace, chạy thuật toán tự động gán giảng viên, và xuất/nhập dữ liệu qua file Excel.
- **Giảng viên (Lecturer):** Đăng nhập vào cổng riêng (Lecturer Portal) để xem các đợt đăng ký đang mở, chọn các môn học mong muốn giảng dạy và gửi nguyện vọng về hệ thống.

> [Vị trí Hình 3.1: Sơ đồ kiến trúc tổng quan hệ thống — Gồm 3 tầng: Frontend (React + Vite), Backend (FastAPI), Database (PostgreSQL). Mũi tên thể hiện luồng giao tiếp REST API giữa Frontend ↔ Backend ↔ Database.]

---

### 3.1.1. Các biểu đồ Usecase (Use Case Diagram)

#### a) Sơ đồ Use Case tổng quát

> [Vị trí Hình 3.2: Sơ đồ Use Case tổng quát — Gồm 3 tác nhân (Admin, Cán bộ xếp lịch, Giảng viên) với các nhóm chức năng: Quản lý tài khoản, Quản lý dữ liệu nền, Quản lý đợt đăng ký, Xếp lịch & Phân công, Đăng ký nguyện vọng.]

Sơ đồ Use Case tổng quát mô tả toàn diện các chức năng chính trong hệ thống Quản lý Phân công Giảng dạy. Hệ thống bao gồm ba tác nhân chính: **Quản trị viên (Admin)**, **Cán bộ xếp lịch** và **Giảng viên**, mỗi tác nhân tương tác với hệ thống thông qua các chức năng riêng biệt phù hợp với vai trò của mình.

**Quản trị viên** có quyền quản lý tài khoản người dùng (tạo, sửa, xóa), quản lý toàn bộ dữ liệu danh mục nền tảng và giám sát hoạt động của hệ thống thông qua trang Tổng quan (Dashboard).

**Cán bộ xếp lịch** có thể thực hiện đầy đủ các nghiệp vụ quản lý dữ liệu (môn học, giảng viên, lớp, chương trình đào tạo), tạo và quản lý các đợt đăng ký nguyện vọng, thao tác phân công giảng viên trên Workspace kéo thả, chạy thuật toán tự động phân công, cũng như xuất/nhập dữ liệu từ file Excel.

**Giảng viên** sau khi đăng nhập có thể xem danh sách các đợt đăng ký đang được mở, chọn các môn học mong muốn giảng dạy (phân biệt vai trò Lý thuyết hoặc Thực hành), và gửi nguyện vọng về hệ thống.

Sơ đồ này giúp hình dung rõ ràng các luồng tương tác, phân quyền chức năng và làm cơ sở để phát triển hệ thống hiệu quả, hiện đại và thân thiện với người dùng.

---

#### b) Use Case: Quản lý Tài khoản và Xác thực

> [Vị trí Hình 3.3: Sơ đồ Use Case quản lý tài khoản — Gồm 3 tác nhân. Các use case: Đăng nhập, Đăng xuất, Xem thông tin cá nhân, Tạo tài khoản giảng viên (Admin), Seed tài khoản mặc định (Admin).]

**Bảng 3.1: Bảng mô tả Use Case Quản lý Tài khoản**

| Mục | Nội dung |
|---|---|
| **Tên Use Case** | Quản lý Tài khoản và Xác thực |
| **Mô tả** | Cho phép người dùng (Admin, Cán bộ, Giảng viên) đăng nhập vào hệ thống bằng tài khoản và mật khẩu; xem thông tin cá nhân; đăng xuất. Quản trị viên có thể tạo tài khoản cho giảng viên mới khi thêm giảng viên vào hệ thống, cũng như tạo các tài khoản mặc định (seed). |
| **Tác nhân** | Quản trị viên (Admin), Cán bộ xếp lịch, Giảng viên |
| **Điều kiện tiên quyết** | - Hệ thống đã hoạt động và kết nối CSDL. |
|  | - Tài khoản đã tồn tại trong hệ thống (với đăng nhập). |
| **Luồng chính** | 1. Người dùng truy cập giao diện đăng nhập. |
|  | 2. Nhập tên đăng nhập và mật khẩu, nhấn "Đăng nhập". |
|  | 3. Hệ thống xác thực thông tin qua API `/auth/login`, so khớp mật khẩu đã băm (bcrypt). |
|  | 4. Nếu hợp lệ, hệ thống tạo JWT Token (PyJWT, thuật toán HS256) và trả về thông tin người dùng kèm vai trò (role). |
|  | 5. Frontend lưu token vào localStorage, điều hướng đến giao diện phù hợp với vai trò. |
|  | 6. Admin có thể tạo tài khoản cho giảng viên mới khi thêm giảng viên (mặc định username = mã giảng viên, password = 123456). |
| **Luồng rẽ nhánh** | - Thông tin đăng nhập sai → Hiển thị thông báo lỗi "Tên đăng nhập hoặc mật khẩu không đúng". |
|  | - Token hết hạn (30 phút) → Yêu cầu đăng nhập lại. |
| **Kết quả** | - Người dùng đăng nhập thành công, được phân quyền theo vai trò (Admin/Cán bộ/Giảng viên). |
|  | - Giao diện hiển thị đúng các chức năng tương ứng với quyền hạn. |

---

#### c) Use Case: Quản lý Giảng viên

> [Vị trí Hình 3.4: Sơ đồ Use Case quản lý giảng viên — Tác nhân: Admin, Cán bộ. Các use case: Xem danh sách, Thêm giảng viên (kèm tạo tài khoản), Sửa thông tin, Xóa, Tìm kiếm/Lọc, Import từ Excel, Xem hồ sơ chi tiết.]

**Bảng 3.2: Bảng mô tả Use Case Quản lý Giảng viên**

| Mục | Nội dung |
|---|---|
| **Tên Use Case** | Quản lý Giảng viên |
| **Mô tả** | Use case này mô tả các chức năng quản lý thông tin giảng viên trong hệ thống, bao gồm: xem danh sách, thêm mới (kèm tự động tạo tài khoản), chỉnh sửa hồ sơ, xóa, tìm kiếm/lọc theo loại (Cơ hữu/Thỉnh giảng), import hàng loạt từ file Excel, và xem hồ sơ chi tiết qua Drawer. |
| **Tác nhân** | Quản trị viên (Admin), Cán bộ xếp lịch |
| **Điều kiện tiên quyết** | - Người dùng đã đăng nhập với vai trò Admin hoặc Cán bộ. |
| **Luồng chính** | 1. Người dùng truy cập trang "Giảng viên" từ thanh điều hướng. |
|  | 2. Hệ thống hiển thị danh sách giảng viên dạng bảng (tên, mã, loại, chức vụ). |
|  | 3. Người dùng có thể: |
|  |    - **Thêm mới**: Nhập họ tên, mã GV, loại hình, chức vụ → hệ thống tự tạo tài khoản đăng nhập (username = mã GV, password mặc định = 123456). |
|  |    - **Sửa**: Mở Drawer hồ sơ, chỉnh sửa các trường thông tin, nhấn Lưu. |
|  |    - **Xóa**: Xác nhận xóa giảng viên khỏi hệ thống. |
|  |    - **Import Excel**: Tải lên file Excel chứa danh sách giảng viên, hệ thống tự động phân tích và thêm vào CSDL. |
|  |    - **Tìm kiếm/Lọc**: Lọc theo loại Cơ hữu hoặc Thỉnh giảng, tìm kiếm theo tên hoặc mã. |
| **Luồng rẽ nhánh** | - Mã giảng viên đã tồn tại → Thông báo lỗi trùng lặp. |
|  | - File Excel sai định dạng → Thông báo lỗi. |
| **Kết quả** | - Danh sách giảng viên được quản lý đầy đủ và chính xác. |
|  | - Mỗi giảng viên mới được tự động tạo tài khoản đăng nhập. |

---

#### d) Use Case: Quản lý Môn học

> [Vị trí Hình 3.5: Sơ đồ Use Case quản lý môn học — Tác nhân: Admin, Cán bộ. Các use case: Xem danh sách, Thêm môn học, Sửa thông tin, Xóa, Tìm kiếm.]

**Bảng 3.3: Bảng mô tả Use Case Quản lý Môn học**

| Mục | Nội dung |
|---|---|
| **Tên Use Case** | Quản lý Môn học |
| **Mô tả** | Cho phép quản lý danh mục môn học trong hệ thống, bao gồm: xem danh sách, thêm mới, chỉnh sửa thông tin (mã môn, tên môn, số tín chỉ, số tiết lý thuyết, số tiết thực hành), xóa và tìm kiếm. |
| **Tác nhân** | Quản trị viên (Admin), Cán bộ xếp lịch |
| **Điều kiện tiên quyết** | - Người dùng đã đăng nhập với vai trò Admin hoặc Cán bộ. |
| **Luồng chính** | 1. Người dùng truy cập trang "Môn học". |
|  | 2. Hệ thống hiển thị danh sách môn học dạng bảng (mã, tên, TC, tiết LT, tiết TH). |
|  | 3. Người dùng có thể thêm mới, sửa, xóa hoặc tìm kiếm môn học. |
|  | 4. Khi thêm/sửa, hệ thống kiểm tra tính hợp lệ và lưu vào CSDL. |
| **Luồng rẽ nhánh** | - Mã môn học trùng → Thông báo lỗi. |
|  | - Thiếu thông tin bắt buộc → Hiển thị cảnh báo validate. |
| **Kết quả** | - Danh sách môn học được quản lý chính xác, phục vụ cho các chức năng phân công và xếp lịch. |

---

#### e) Use Case: Quản lý Chương trình Đào tạo & Khung chương trình

> [Vị trí Hình 3.6: Sơ đồ Use Case quản lý Chương trình Đào tạo — Tác nhân: Admin, Cán bộ. Các use case: Tạo chương trình, Xem khung CT, Gán môn vào kỳ, Sửa/Xóa, Import khung CT từ Excel.]

**Bảng 3.4: Bảng mô tả Use Case Quản lý Chương trình Đào tạo**

| Mục | Nội dung |
|---|---|
| **Tên Use Case** | Quản lý Chương trình Đào tạo & Khung chương trình |
| **Mô tả** | Cho phép tạo và quản lý các Khung Chương trình Đào tạo (VD: "CNTT - PM K19"), mỗi khung gắn với một Ngành và Khóa cụ thể. Trong mỗi khung, người dùng có thể gán các môn học vào từng học kỳ (semester_index từ 1 đến 8+), tạo thành bản đồ curriculum hoàn chỉnh. Dữ liệu này là nền tảng để hệ thống tự động lọc và gợi ý danh sách môn học khi tạo đợt đăng ký nguyện vọng. |
| **Tác nhân** | Quản trị viên (Admin), Cán bộ xếp lịch |
| **Điều kiện tiên quyết** | - Người dùng đã đăng nhập với vai trò Admin hoặc Cán bộ. |
|  | - Danh sách Môn học đã tồn tại trong hệ thống. |
| **Luồng chính** | 1. Người dùng truy cập trang "Chương trình Đào tạo". |
|  | 2. Tạo mới chương trình: nhập Mã CT, Tên, Ngành, Khóa. |
|  | 3. Mở chi tiết 1 chương trình → xem Khung CT theo từng kỳ. |
|  | 4. Gán môn học vào kỳ bằng cách chọn từ danh sách Môn học. |
|  | 5. Import khung CT từ file Excel nếu có sẵn dữ liệu. |
| **Kết quả** | - Khung chương trình được xây dựng hoàn chỉnh, phục vụ cho việc tự động lọc môn học theo kỳ khi tạo đợt đăng ký. |

---

#### f) Use Case: Quản lý Đợt đăng ký Nguyện vọng

> [Vị trí Hình 3.7: Sơ đồ Use Case quản lý Đợt đăng ký — Tác nhân: Cán bộ, Giảng viên. Các use case phía Cán bộ: Tạo đợt mới (kèm chọn môn từ khung CT hoặc thủ công), Mở/Đóng đăng ký, Xem nguyện vọng GV, Import/Export Excel. Phía Giảng viên: Xem đợt đang mở, Chọn môn, Gửi nguyện vọng.]

**Bảng 3.5: Bảng mô tả Use Case Quản lý Đợt đăng ký Nguyện vọng**

| Mục | Nội dung |
|---|---|
| **Tên Use Case** | Quản lý Đợt đăng ký Nguyện vọng |
| **Mô tả** | Use case này mô tả quy trình tạo và quản lý các đợt đăng ký nguyện vọng giảng dạy. Cán bộ tạo đợt mới kèm theo việc chọn danh sách môn học (theo khung chương trình đào tạo hoặc chọn thủ công), sau đó mở đợt để Giảng viên đăng ký. Giảng viên xem danh sách các đợt đang mở trên Cổng Giảng viên, chọn các môn mong muốn (phân biệt vai trò Lý thuyết hoặc Thực hành) và gửi nguyện vọng. |
| **Tác nhân** | Cán bộ xếp lịch, Giảng viên |
| **Điều kiện tiên quyết** | - Cán bộ đã đăng nhập. |
|  | - Danh sách môn học và khung chương trình đã có trong hệ thống. |
|  | - Giảng viên đã có tài khoản. |
| **Luồng chính** | **Phía Cán bộ:** |
|  | 1. Truy cập trang "Nguyện vọng Giảng dạy". |
|  | 2. Nhấn "Tạo Nháp mới" → Wizard mở ra: nhập tên đợt, chọn tab "Khung CT" hoặc "Thủ công" để cấu hình danh sách môn. |
|  | 3. Nếu chọn "Khung CT": chọn các chương trình đào tạo → chọn các kỳ → hệ thống tự lấy danh sách môn tương ứng từ bảng curriculum. |
|  | 4. Nhấn "Tạo và Lưu môn" → hệ thống tạo đợt đăng ký và gán môn. |
|  | 5. Nhấn "Mở đăng ký" để giảng viên có thể nhìn thấy đợt này. |
|  | **Phía Giảng viên:** |
|  | 1. Đăng nhập → vào trang "Đăng ký Nguyện vọng". |
|  | 2. Xem danh sách các đợt đang mở (dạng card). |
|  | 3. Chọn 1 đợt → xem danh sách môn học khả dụng. |
|  | 4. Tích chọn các môn mong muốn, chọn vai trò (Lý thuyết / Thực hành). |
|  | 5. Nhấn "Lưu nguyện vọng". |
| **Luồng rẽ nhánh** | - Đợt đã đóng → Giảng viên không thể chỉnh sửa nguyện vọng. |
|  | - Không có khung CT nào → Cán bộ sử dụng tab "Thủ công" để chọn môn. |
| **Kết quả** | - Đợt đăng ký được tạo với danh sách môn chính xác. |
|  | - Nguyện vọng giảng viên được lưu vào CSDL, sẵn sàng phục vụ cho quy trình phân công. |

---

#### g) Use Case: Xếp lịch & Phân công Giảng dạy

> [Vị trí Hình 3.8: Sơ đồ Use Case xếp lịch & phân công — Tác nhân: Cán bộ. Các use case: Tạo phiên TKB, Cấu hình đợt (chọn CT + kỳ), Kéo thả gán GV vào môn, Chạy Auto Assignment, Xem cảnh báo xung đột, Lưu phiên, Export Excel.]

**Bảng 3.6: Bảng mô tả Use Case Xếp lịch & Phân công Giảng dạy**

| Mục | Nội dung |
|---|---|
| **Tên Use Case** | Xếp lịch & Phân công Giảng dạy (Timetable Workspace) |
| **Mô tả** | Use case cốt lõi của hệ thống. Cán bộ tạo các phiên xếp lịch (Scheduling Session), cấu hình chương trình + kỳ để hệ thống tự sinh danh sách các dòng TKB (mỗi dòng = 1 lớp × 1 môn). Trên giao diện Workspace, cán bộ kéo thả (drag & drop) thẻ giảng viên vào từng dòng để phân công, hoặc sử dụng thuật toán tự động (Auto Assignment) dựa trên nguyện vọng đã đăng ký. Hệ thống cung cấp cảnh báo xung đột (trùng lịch, vượt giờ chuẩn) trong thời gian thực. |
| **Tác nhân** | Cán bộ xếp lịch |
| **Điều kiện tiên quyết** | - Đã có dữ liệu chương trình đào tạo, môn học, lớp, giảng viên. |
|  | - Đã có đợt đăng ký nguyện vọng (cho Auto Assignment). |
| **Luồng chính** | 1. Cán bộ truy cập "Workspace TKB". |
|  | 2. Tạo phiên TKB mới: nhập tên, chọn các chương trình + kỳ, liên kết đợt đăng ký nguyện vọng (tùy chọn). |
|  | 3. Hệ thống sinh bảng TKB: mỗi dòng gồm Lớp, Môn, Buổi cố định, Loại phòng, GV chính, GV thực hành. |
|  | 4. Cán bộ có thể: |
|  |    - **Kéo thả**: Kéo thẻ giảng viên từ danh sách bên phải thả vào cột GV chính hoặc GV TH. |
|  |    - **Auto Assignment**: Nhấn nút tự động → hệ thống chạy thuật toán CSP, gán giảng viên dựa trên nguyện vọng và ràng buộc. Có 2 chiến lược: Bão hòa (ưu tiên lấp đầy 160 tiết/GV) hoặc Cân bằng tải (phân đều). |
|  |    - **Chỉnh sửa inline**: Sửa buổi cố định, loại phòng, thứ dạy trực tiếp trên bảng. |
|  | 5. Lưu phiên bản hoặc Export ra file Excel. |
| **Luồng rẽ nhánh** | - GV đã bận buổi đó → Hiển thị cảnh báo xung đột. |
|  | - GV vượt quá 250 tiết → Cảnh báo mềm (soft constraint). |
|  | - Không có GV nào đăng ký môn đó → Bỏ qua dòng, ghi nhận cảnh báo. |
| **Kết quả** | - Bảng phân công giảng dạy hoàn chỉnh, có thể lưu nhiều phiên bản. |
|  | - Danh sách cảnh báo xung đột được hiển thị rõ ràng. |
|  | - Xuất file Excel để gửi cho các bộ phận liên quan. |

