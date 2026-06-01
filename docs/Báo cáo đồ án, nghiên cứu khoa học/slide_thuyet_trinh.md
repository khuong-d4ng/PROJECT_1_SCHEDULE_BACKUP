# NỘI DUNG VÀ BỐ CỤC SLIDE THUYẾT TRÌNH ĐỒ ÁN TỐT NGHIỆP
*(Tích hợp Kịch bản lời thoại thuyết trình trôi chảy, ngắn gọn dưới từng Slide)*

---

## SLIDE 1: TRANG BÌA (MỞ ĐẦU)
*   **Nội dung hiển thị (Text):**
    *   TRƯỜNG ĐẠI HỌC ĐẠI NAM
    *   KHOA CÔNG NGHỆ THÔNG TIN
    *   **ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC**
    *   **Đề tài:** *"Xây dựng hệ thống lập kế hoạch và phân công giảng dạy cho Khoa Công nghệ Thông tin – Trường Đại học Đại Nam"*
    *   **Sinh viên thực hiện:** Đặng Quốc Khương
    *   **Mã sinh viên:** *[Điền mã sinh viên của bạn]*
    *   **Lớp:** *[Điền tên lớp của bạn]*
    *   **Giảng viên hướng dẫn:** *[Điền tên Giảng viên hướng dẫn]*
*   **Gợi ý hình ảnh/Sơ đồ:**
    *   Logo Trường Đại học Đại Nam đặt trang trọng ở chính giữa phía trên.
    *   Hình ảnh nền tối, mang phong cách công nghệ nhẹ nhàng, hiện đại (Clean & Modern Technology).
*   **🎙️ Lời thoại thuyết trình (Script - 45 giây):**
    *   *"Kính chào thầy cô trong Hội đồng chấm đồ án tốt nghiệp! Em tên là Đặng Quốc Khương, sinh viên khóa... ngành Công nghệ thông tin. Hôm nay, em xin phép được trình bày báo cáo đồ án tốt nghiệp của mình với đề tài: **'Xây dựng hệ thống lập kế hoạch và phân công giảng dạy cho Khoa Công nghệ Thông tin – Trường Đại học Đại Nam'**, dưới sự hướng dẫn khoa học của thầy/cô...*
    *   *Sau đây, em xin phép đi vào nội dung chi tiết của đề tài."*

---

## SLIDE 2: LÝ DO CHỌN ĐỀ TÀI & MỤC TIÊU NGHIÊN CỨU
*   **Nội dung hiển thị (Text):**
    *   **Thực trạng nghiệp vụ truyền thống:**
        *   Thu thập nguyện vọng giảng dạy của giảng viên qua Email/Zalo rời rạc, khó tổng hợp.
        *   Xếp lịch thủ công bằng Excel mất nhiều ngày, dễ xảy ra sai sót, trùng ca/trùng phòng.
        *   Không thể phát hiện và cảnh báo xung đột (vượt chỉ tiêu, trùng buổi) theo thời gian thực.
    *   **Giải pháp đề xuất:** Xây dựng hệ thống số hóa quy trình thu thập nguyện vọng trực tuyến và không gian xếp lịch Workspace kéo thả trực quan kết hợp động cơ lập lịch tự động CSP.
    *   **Mục tiêu chính:**
        *   Xây dựng cơ sở dữ liệu tập trung quản lý giảng viên, học phần, khung chương trình đào tạo.
        *   Phát triển Lecturer Portal để giảng viên chủ động đăng ký nguyện vọng.
        *   Vận hành thuật toán CSP tự động xếp ca, gán giảng viên chính xác tuyệt đối.
*   **Gợi ý hình ảnh/Sơ đồ:**
    *   Sơ đồ đối chiếu dạng bảng so sánh song song giữa **"Quy trình cũ ( Excel thủ công - Rời rạc - Dễ sai sót )"** và **"Hệ thống mới ( Số hóa - Tự động hóa - Cảnh báo tức thời )"**.
*   **🎙️ Lời thoại thuyết trình (Script - 60 giây):**
    *   *"Thưa thầy cô, việc phân công chuyên môn và xếp lịch giảng dạy tại khoa CNTT Đại học Đại Nam trước đây hoàn toàn dựa trên Excel thủ công. Nghiệp vụ này gặp 3 vấn đề lớn: Thứ nhất là thu thập nguyện vọng giảng viên qua Zalo/Email rất phân tán và khó tổng hợp; Thứ hai là xếp lịch thủ công cực kỳ tốn thời gian, dễ trùng ca trùng buổi; Thứ ba là không có cơ chế tự động cảnh báo khi giảng viên bị dạy quá định mức.*
    *   *Để giải quyết triệt để vấn đề này, em đề xuất giải pháp **Số hóa quy trình khảo sát nguyện vọng** kết hợp xây dựng **Workspace xếp lịch kéo thả trực quan** và **Động cơ phân công tự động**.*
    *   *Mục tiêu cốt lõi của đề tài là xây dựng hệ thống quản lý dữ liệu tập trung, cung cấp cổng đăng ký cho giảng viên và vận hành thuật toán CSP tự động lập thời khóa biểu chính xác 100%."*

---

## SLIDE 3: CƠ SỞ LÝ THUYẾT & CÔNG NGHỆ SỬ DỤNG
*   **Nội dung hiển thị (Text):**
    *   **Kiến trúc hệ thống:** Mô hình 3 lớp (Three-tier Architecture) phân tách rõ ràng Backend & Frontend.
    *   **Phân hệ Frontend (Máy trạm):**
        *   React v19 (Single Page Application), TypeScript (Kiểm soát chặt chẽ kiểu dữ liệu).
        *   Ant Design (antd) v6 (Lưới dữ liệu Table, Form, Drawer).
        *   TailwindCSS v4 (Tối ưu hóa Styling), `@dnd-kit` (Tương tác kéo thả mượt mà 60 FPS).
    *   **Phân hệ Backend (Máy chủ dịch vụ) & CSDL:**
        *   FastAPI (Python 3.10) bất đồng bộ (async/await) hiệu năng cao.
        *   SQLAlchemy (ORM) tương tác CSDL an toàn, tránh tấn công SQL Injection.
        *   PostgreSQL 15 (Hệ quản trị CSDL quan hệ bền vững, chịu tải cao).
    *   **Bảo mật & Tiện ích:** PyJWT (Xác thực Token), Bcrypt (Băm bảo mật mật khẩu), OpenPyXL & Pandas (Nhập/xuất file Excel).
*   **Gợi ý hình ảnh/Sơ đồ:**
    *   Sơ đồ khối thể hiện luồng giao tiếp dữ liệu: `[React SPA Client (TypeScript)]` $\longleftrightarrow$ *(RESTful APIs / JSON)* $\longleftrightarrow$ `[FastAPI API Server]` $\longleftrightarrow$ *(SQLAlchemy ORM)* $\longleftrightarrow$ `[PostgreSQL Database]`.
*   **🎙️ Lời thoại thuyết trình (Script - 45 giây):**
    *   *"Về mặt công nghệ, hệ thống được thiết kế theo kiến trúc 3 lớp hiện đại, bảo đảm tính độc lập và bảo mật.*
    *   *Phía máy trạm Frontend, em sử dụng **React 19** kết hợp **TypeScript** và giao diện **Ant Design v6**. Trải nghiệm kéo thả mượt mà trên trình duyệt được vận hành bởi thư viện chuyên dụng **dnd-kit**.*
    *   *Phía máy chủ Backend, em lựa chọn **FastAPI** trên nền tảng Python 3.10 để tối ưu tốc độ phản hồi bất đồng bộ, đi cùng cơ sở dữ liệu mạnh mẽ **PostgreSQL 15** thông qua bộ chuyển đổi ORM **SQLAlchemy** giúp chống lại các cuộc tấn công SQL Injection.*
    *   *Hệ thống cũng sử dụng các thư viện bảo mật PyJWT, mã hóa Bcrypt và dịch vụ gửi Gmail SMTP tự động."*

---

## SLIDE 4: MÔ HÌNH HÓA BÀI TOÁN CSP XẾP LỊCH TỰ ĐỘNG
*   **Nội dung hiển thị (Text):**
    *   **Constraint Satisfaction Problem (CSP):** Ứng dụng để tự động hóa việc xếp ca và phân công giảng viên.
    *   **1. Biến (Variables) cần tìm giá trị:**
        *   Mã giảng viên chính (`main_lecturer_id`), Giảng viên thực hành (`prac_lecturer_id`).
        *   Buổi học (`morning_day` / `afternoon_day`) cho từng lớp học phần.
    *   **2. Miền giá trị (Domains):**
        *   *Giảng viên:* Bể giảng viên có nguyện vọng và đủ năng lực dạy học phần đó.
        *   *Buổi học:* Các buổi học khả dụng từ Thứ 2 đến Thứ 7 phù hợp với ca cố định (Sáng/Chiều).
    *   **3. Thuật toán giải quyết:** Sử dụng thuật toán Quay lui (Backtracking Search) kết hợp kiểm tra ràng buộc sớm và cắt tỉa nhánh cận để tìm phương án tối ưu.
*   **Gợi ý hình ảnh/Sơ đồ:**
    *   Sơ đồ cấu trúc mô hình hóa CSP: Động cơ CSP Solver kết nối 3 nhánh chính: Biến (Variables) $\rightarrow$ Miền giá trị (Domains) $\rightarrow$ Ràng buộc (Constraints).
*   **🎙️ Lời thoại thuyết trình (Script - 60 giây):**
    *   *"Thưa thầy cô, điểm nhấn kỹ thuật quan trọng nhất của đồ án là việc giải quyết bài toán phân công chuyên môn tự động bằng mô hình **CSP (Constraint Satisfaction Problem)**.*
    *   *Bài toán được mô hình hóa gồm 3 thành phần: Thứ nhất, **Biến số** cần tìm giá trị là ca học và ID giảng viên chính, giảng viên thực hành cho mỗi lớp học phần. Thứ hai, **Miền giá trị** là danh sách giảng viên đăng ký nguyện vọng cùng với các buổi học từ Thứ 2 đến Thứ 7 phù hợp ca sáng/chiều cố định.*
    *   *Và thành phần thứ ba là các **Ràng buộc** được lập trình chặt chẽ để kiểm tra tính hợp lệ. Động cơ lập lịch của hệ thống sử dụng thuật toán duyệt và tính điểm Heuristic thông minh để tự động hóa công việc này chỉ trong vài giây."*

---

## SLIDE 5: QUY CHẾ RÀNG BUỘC PHÂN CÔNG CHUYÊN MÔN
*   **Nội dung hiển thị (Text):**
    *   **Ràng buộc cứng (Hard Constraints) - Bắt buộc 100% thỏa mãn:**
        *   `C_CLASS_OVERLAP` & `C_LEC_OVERLAP`: Không trùng lịch học của Lớp và lịch dạy của Giảng viên (bao gồm cả dạy Lý thuyết & Thực hành).
        *   `C_SHIFT_STRICT`: Đúng ca cố định (Sáng ký hiệu bằng `S-T*`, Chiều ký hiệu bằng `C-T*`).
        *   `C_CAPABILITY_STRICT`: Giảng viên chỉ dạy học phần có đăng ký trong đợt khảo sát nguyện vọng.
        *   `C_LIMIT`: Giảng viên chính $\le$ 3 học phần khác nhau và $\le$ 10 lớp học phần tối đa trong kỳ.
    *   **Ràng buộc mềm (Soft Constraints) & Điểm số tối ưu:**
        *   `O_TARGET_HOURS_160`: Hướng giảng viên cơ hữu đạt mốc chỉ tiêu chuẩn 160 tiết.
        *   `O_MAX_HOURS_250`: Cảnh báo và phạt nặng điểm nếu vượt quá mốc 250 tiết.
        *   `O_SUBJECT_FATIGUE`: Tránh phân công một giảng viên dạy cùng 1 học phần quá 6 lớp học.
        *   **Cơ chế Fallback:** Để trống giảng viên và báo nhãn *"Hết giảng viên chính khả dụng"* nếu vi phạm ràng buộc cứng.
*   **Gợi ý hình ảnh/Sơ đồ:**
    *   Bảng phân chia dạng 2 cột: Cột bên trái màu đỏ thể hiện các **"Ràng buộc cứng (Quyết định tính hợp lệ)"**; Cột bên phải màu xanh thể hiện các **"Ràng buộc mềm (Quyết định tính tối ưu)"**.
*   **🎙️ Lời thoại thuyết trình (Script - 60 giây):**
    *   *"Các ràng buộc trong hệ thống được em phân loại thành hai nhóm chính để xử lý.*
    *   *Nhóm **Ràng buộc cứng** bắt buộc phải thỏa mãn 100% bao gồm: Tránh trùng lịch dạy/học của cả giảng viên và lớp học; tuyệt đối tuân thủ ca học cố định sáng hoặc chiều; phân công đúng năng lực chuyên môn giảng viên đã đăng ký; và giới hạn một giảng viên chính không dạy quá 3 môn và 10 lớp trong kỳ.*
    *   *Nhóm **Ràng buộc mềm** dùng để chấm điểm tối ưu hóa khối lượng công việc: Ưu tiên giúp giảng viên cơ hữu đạt định mức chuẩn 160 tiết; phạt nặng điểm nếu ai đó vượt ngưỡng quá tải 250 tiết; và giảm bớt việc xếp một giáo viên dạy cùng 1 môn quá 6 lớp để tránh quá tải tâm lý.*
    *   *Nếu xảy ra xung đột không thể thỏa mãn ràng buộc cứng, hệ thống sẽ kích hoạt cơ chế Fallback, để trống và đưa ra cảnh báo 'Hết giảng viên chính khả dụng' thay vì xếp đại, giúp cán bộ xếp lịch dễ dàng nhận biết."*

---

## SLIDE 6: PHÂN TÍCH & THIẾT KẾ HỆ THỐNG (USE CASE)
*   **Nội dung hiển thị (Text):**
    *   **Hệ thống phân quyền chi tiết cho 3 tác nhân (Actors):**
    *   **1. Quản trị viên (Admin):**
        *   Thực hiện xác thực và quản lý tài khoản người dùng (`User`).
        *   Cấp quyền truy cập và khởi tạo dữ liệu mặc định ban đầu.
    *   **2. Cán bộ xếp lịch (Scheduler):**
        *   Quản lý danh mục (Giảng viên, Học phần, Lớp cố định, Khung chương trình đào tạo).
        *   Tổ chức đợt khảo sát nguyện vọng; Vận hành Workspace kéo thả và động cơ CSP Auto-Assign.
        *   Quản lý thông báo; Nhập/xuất dữ liệu Excel chuẩn hóa.
    *   **3. Giảng viên (Lecturer):**
        *   Đăng nhập cổng Lecturer Portal, đăng ký nguyện vọng giảng dạy (Vai trò LT/TH).
        *   Cập nhật email cá nhân và cấu hình nhận thông báo qua Email.
*   **Gợi ý hình ảnh/Sơ đồ:**
    *   Sơ đồ Use Case tổng quát vẽ bằng Mermaid: 3 tác nhân ở ngoài, subgraph hệ thống ở trong kết nối đến các use case: Xác thực, Quản lý danh mục, Khung chương trình, Đợt khảo sát, Đăng ký nguyện vọng, Workspace xếp lịch, Auto-Assign CSP, và Xuất nhập Excel.
*   **🎙️ Lời thoại thuyết trình (Script - 45 giây):**
    *   *"Hệ thống được thiết kế phân quyền rất chi tiết và khép kín cho 3 nhóm tác nhân.*
    *   *Nhóm **Admin** chịu trách nhiệm bảo mật hệ thống, cấp tài khoản và khởi tạo dữ liệu nguồn.*
    *   *Nhóm **Cán bộ xếp lịch (Scheduler)** là người nắm quyền quản trị nghiệp vụ: Thiết lập danh mục giảng viên, lớp, chương trình đào tạo; tạo các đợt khảo sát nguyện vọng; sử dụng không gian làm việc Workspace xếp lịch thủ công hoặc kích hoạt nút tự động Auto-Assign; và cuối cùng là xuất bản dữ liệu ra Excel.*
    *   *Nhóm **Giảng viên (Lecturer)** sẽ tương tác trực tiếp với cổng thông tin Lecturer Portal để đăng ký nguyện vọng dạy lý thuyết hay thực hành cho từng môn, đồng thời cấu hình nhận thông báo giảng dạy tự động."*

---

## SLIDE 7: KẾT QUẢ THỰC NGHIỆM: CỔNG LECTURER PORTAL & THÔNG BÁO ĐA KÊNH
*   **Nội dung hiển thị (Text):**
    *   **Số hóa khảo sát nguyện vọng:**
        *   Giảng viên chủ động tích chọn học phần đăng ký dạy Lý thuyết hoặc Thực hành trực tuyến.
        *   Lưu trữ tập trung và hiển thị trực quan lịch sử giảng dạy qua các học kỳ.
    *   **Hệ thống thông báo đa kênh khép kín:**
        *   *Web Notification (Local):* Biểu tượng quả chuông với chấm đỏ thông báo tức thời trên navbar khi được cán bộ gán lịch dạy mới.
        *   *Gmail SMTP Service:* Tự động gửi thư điện tử thông báo chi tiết lịch dạy (Thời gian, lớp học, học phần) đến email cá nhân của giảng viên.
        *   *Quyền riêng tư:* Cho phép giảng viên bật/tắt nhận thông báo từ hệ thống hoặc thay đổi email nhận tin trực tiếp.
*   **Gợi ý hình ảnh/Sơ đồ:**
    *   Ảnh giao diện thực tế của **Lecturer Portal** đăng ký nguyện vọng.
    *   Ảnh chụp màn hình **Web Notification** và **Email thông báo thực tế gửi đến Gmail** của giảng viên.
*   **🎙️ Lời thoại thuyết trình (Script - 60 giây):**
    *   *"Bây giờ, em xin phép giới thiệu các kết quả thực nghiệm thực tế mà hệ thống đã hoàn thiện.*
    *   *Đầu tiên là phân hệ **Lecturer Portal**. Giảng viên đăng nhập bằng tài khoản cá nhân, tích chọn đăng ký dạy chính hay dạy thực hành cho các môn học một cách trực tuyến. Mọi dữ liệu này ngay lập tức được lưu trữ tập trung vào cơ sở dữ liệu.*
    *   *Tiếp theo là **Hệ thống thông báo đa kênh khép kín**. Ngay khi cán bộ xếp lịch tiến hành phân công trên Workspace, giảng viên sẽ nhận được 2 kênh thông báo cùng lúc: Một thông báo quả chuông màu đỏ hiển thị tức thời ngay trên giao diện Web khi họ đang online; đồng thời, dịch vụ gửi thư tự động qua giao thức SMTP sẽ gửi một email chi tiết lịch dạy về hòm thư Gmail cá nhân của giảng viên. Giảng viên cũng có toàn quyền quản trị quyền riêng tư như bật/tắt nhận email hoặc thay đổi địa chỉ email trực tiếp."*

---

## SLIDE 8: KẾT QUẢ THỰC NGHIỆM: WORKSPACE TKB TƯƠNG TÁC KÉO THẢ & AUTO-ASSIGN
*   **Nội dung hiển thị (Text):**
    *   **Workspace TKB - Không gian làm việc thông minh:**
        *   Tự động sinh lưới thời khóa biểu nháp bằng cách nhân chéo chương trình khung và lớp cố định.
        *   Thao tác kéo thả gán giảng viên từ Pool nguyện vọng vào lưới cực kỳ mượt mà nhờ `@dnd-kit`.
    *   **Cảnh báo xung đột thời gian thực (Real-time Conflict Checker):**
        *   Cảnh báo đỏ nổi bật ngay trên ô phân công nếu giảng viên bị trùng lịch dạy ở lớp khác trong cùng ca học.
        *   Cảnh báo vàng nếu giảng viên vượt quá chỉ tiêu số tiết hoặc dạy một học phần quá 6 lớp.
    *   **Động cơ Tự động phân công (Auto-Assign Button):**
        *   Bấm nút kích hoạt thuật toán CSP chạy ngầm để điền ca học và giảng viên tối ưu nhất cho toàn bộ các lớp học phần trống chỉ trong vài giây.
*   **Gợi ý hình ảnh/Sơ đồ:**
    *   Ảnh giao diện thực tế của **Workspace TKB** khi đang gán lịch, hiển thị rõ cột giảng viên kéo thả bên phải và ô cảnh báo xung đột (màu đỏ).
*   **🎙️ Lời thoại thuyết trình (Script - 75 giây):**
    *   *"Và đây là giao diện **Workspace xếp lịch - Trái tim của toàn hệ thống** dành cho cán bộ.*
    *   *Cán bộ có thể thực hiện xếp lịch bán tự động bằng cách kéo giảng viên từ danh sách nguyện vọng bên phải và thả vào lưới thời khóa biểu bên trái rất mượt mà. Trong quá trình kéo thả, bộ kiểm tra xung đột thời gian thực (Real-time Conflict Checker) sẽ chạy liên tục: Nếu giảng viên bị trùng lịch ở bất kỳ lớp nào khác tại cùng ca học đó, ô phân công sẽ đổi sang màu đỏ cảnh báo ngay lập tức. Nếu giảng viên bị vượt quá hạn mức giờ dạy chuẩn, ô phân công sẽ hiển thị màu vàng để nhắc nhở.*
    *   *Đặc biệt, hệ thống cung cấp nút bấm **Auto-Assign**. Khi cán bộ bấm nút này, động cơ thuật toán CSP sẽ chạy ngầm, tự động tính toán, tìm kiếm slot trống phù hợp, phân bổ ca học và gán giảng viên lý tưởng nhất cho toàn bộ các lớp học phần còn trống trên lưới thời khóa biểu chỉ trong một nốt nhạc, tiết kiệm hàng chục giờ làm việc thủ công."*

---

## SLIDE 9: ĐÁNH GIÁ KẾT QUẢ THỰC NGHIỆM & HIỆU NĂNG THUẬT TOÁN
*   **Nội dung hiển thị (Text):**
    *   **Quy mô bộ dữ liệu kiểm thử cấp Khoa (Khoa CNTT - Đại học Đại Nam):**
        *   **30 Giảng viên** (Đa dạng giữa hình thức Cơ hữu và Thỉnh giảng).
        *   **62 Học phần** chuyên ngành Công nghệ thông tin.
        *   **7 Lớp sinh viên cố định** khóa K19 đang tham gia xếp lịch.
    *   **Hiệu năng vượt trội:**
        *   Thời gian chạy thuật toán CSP Auto-Assign để phân ca và gán giảng viên tối ưu cho toàn bộ lưới: **Dưới 3 giây** trên cấu hình Ryzen 7 5800H máy local của tác giả.
    *   **Độ chính xác và hiệu quả:**
        *   Đạt tỷ lệ gán chính xác **100%**, đảm bảo tuyệt đối không xảy ra trùng ca giảng dạy hoặc sai chuyên môn giảng viên.
        *   Tối ưu hóa tối đa chỉ tiêu giờ giảng 160 tiết cho giảng viên cơ hữu.
*   **Gợi ý hình ảnh/Sơ đồ:**
    *   Biểu đồ tròn/thanh thể hiện tỷ lệ **100% ràng buộc cứng được thỏa mãn**.
    *   Biểu đồ thời gian xử lý: **"Lập lịch thủ công (3-5 ngày)"** đối chiếu với **"CSP Auto-Assign (Dưới 3 giây)"**.
*   **🎙️ Lời thoại thuyết trình (Script - 60 giây):**
    *   *"Để chứng minh tính khả thi, em đã tiến hành chạy thử nghiệm hệ thống với bộ dữ liệu thực tế tại Khoa CNTT - Trường Đại học Đại Nam.*
    *   *Bộ dữ liệu bao gồm thông tin của **30 giảng viên** cơ hữu và thỉnh giảng, **62 học phần** chuyên ngành và **7 lớp sinh viên cố định** đang học tập.*
    *   *Kết quả thực nghiệm cho thấy hiệu năng vượt trội: Thời gian thuật toán giải quyết trọn vẹn toàn bộ lưới phân công chỉ mất **chưa đầy 3 giây** trên máy tính cá nhân Ryzen 7. Độ chính xác đạt tỷ lệ tuyệt đối **100%** đối với tất cả các ràng buộc cứng. Hệ thống cũng phân phối giờ dạy tối ưu bám sát mốc tiêu chuẩn 160 tiết cho các thầy cô cơ hữu. So với quy trình cũ mất từ 3 đến 5 ngày xếp bằng tay, đây là một bước nhảy vọt về năng suất."*

---

## SLIDE 10: KẾT LUẬN & HƯỚNG PHÁT TRIỂN TƯƠNG LAI
*   **Nội dung hiển thị (Text):**
    *   **Kết quả đạt được (Ưu điểm):**
        *   Số hóa và tự động hóa thành công quy trình lập kế hoạch và phân công giảng dạy.
        *   Giải quyết triệt để xung đột lịch học/dạy của khoa thông qua các ràng buộc chặt chẽ.
        *   Giao diện Workspace kéo thả hiện đại, cơ chế thông báo Web + Email Gmail SMTP khép kín.
    *   **Hạn chế hiện tại:** Chưa tích hợp module quản lý phòng học vật lý chi tiết, chưa thử nghiệm quy mô toàn trường.
    *   **Hướng phát triển trong tương lai:**
        *   **Module Phòng học vật lý:** Tự động phát hiện xung đột phòng học dựa trên sức chứa (Capacity) và thiết bị phòng máy.
        *   **Tối ưu thuật toán CSP:** Áp dụng phân rã bài toán để xử lý mượt mà dữ liệu quy mô siêu lớn khi nâng cấp lên cấp trường.
        *   **Triển khai Cloud & WebSockets:** Hỗ trợ tính năng cộng tác trực tuyến thời gian thực (Real-time Collaboration) cho nhiều cán bộ cùng xếp lịch.
*   **Gợi ý hình ảnh/Sơ đồ:**
    *   Sơ đồ ba mũi tên định hướng tương lai: **Phòng học vật lý** $\longrightarrow$ **Thuật toán quy mô lớn** $\longrightarrow$ **Cloud cộng tác thời gian thực**.
*   **🎙️ Lời thoại thuyết trình (Script - 60 giây):**
    *   *"Em xin phép đi đến phần kết luận. Đồ án đã hoàn thành toàn bộ mục tiêu đề ra khi số hóa quy trình thu thập nguyện vọng, xây dựng không gian Workspace kéo thả tiện lợi và vận hành công cụ phân công tự động CSP chuẩn xác, giải quyết triệt để vấn đề trùng ca trùng lịch.*
    *   *Tuy nhiên, hệ thống vẫn còn một số hạn chế như chưa quản lý chi tiết phòng học vật lý và chưa áp dụng thử nghiệm quy mô cấp trường.*
    *   *Hướng phát triển tiếp theo của em là: Thứ nhất, xây dựng thêm **Module Quản lý phòng học vật lý** để tự động gán phòng thường và phòng máy dựa trên sức chứa; Thứ hai, **nâng cấp thuật toán** bằng phương pháp phân rã để giải quyết bài toán lập lịch quy mô toàn trường; Thứ ba, ứng dụng công nghệ **WebSockets và Cloud** để hỗ trợ tính năng nhiều cán bộ cùng tương tác xếp lịch thời gian thực.*
    *   *Trên đây là toàn bộ phần trình bày đồ án tốt nghiệp của em. Em xin chân thành cảm ơn Quý thầy cô trong Hội đồng đã dành thời gian lắng nghe và rất mong nhận được những ý kiến đóng góp, câu hỏi từ phía thầy cô để đề tài của em ngày càng hoàn thiện hơn!"*
