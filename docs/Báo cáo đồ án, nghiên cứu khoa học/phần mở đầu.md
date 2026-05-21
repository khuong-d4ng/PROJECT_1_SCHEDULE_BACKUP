# PHẦN MỞ ĐẦU

Trong bối cảnh chuyển đổi số đang diễn ra mạnh mẽ trên toàn cầu, việc ứng dụng công nghệ thông tin vào quản trị giáo dục đại học, đặc biệt là trong công tác tổ chức và quản lý đào tạo, ngày càng trở nên thiết yếu. Tại các trường đại học, việc lập kế hoạch giảng dạy và phân công thời khóa biểu cho giảng viên luôn là một trong những nhiệm vụ phức tạp, đòi hỏi nhiều thời gian và công sức của cán bộ giáo vụ. Bài toán xếp thời khóa biểu không chỉ đơn thuần là việc phân chia ca học mà còn phải giải quyết hàng loạt ràng buộc chồng chéo như: năng lực chuyên môn của giảng viên, nguyện vọng đăng ký dạy lý thuyết hoặc thực hành, định mức tiết dạy tối đa của từng người, tính chất đặc thù của môn học (phòng máy hay phòng thường), và tránh xung đột trùng lịch giữa các lớp học phần. 

Tại Khoa Công nghệ Thông tin – Trường Đại học Đại Nam, công tác này hiện nay phần lớn vẫn được thực hiện thủ công thông qua bảng tính Excel và liên lạc qua thư điện tử. Phương pháp truyền thống này bộc lộ nhiều hạn chế lớn như dễ xảy ra sai sót, khó kiểm soát xung đột lịch dạy theo thời gian thực, mất nhiều thời gian thu thập nguyện vọng của giảng viên và cực kỳ khó khăn khi cần điều chỉnh lịch học. Xuất phát từ thực tế đó, đề tài **"Xây dựng hệ thống lập kế hoạch và phân công giảng dạy cho Khoa Công nghệ Thông tin – Trường Đại học Đại Nam"** được thực hiện nhằm hiện đại hóa quy trình xếp thời khóa biểu của khoa. Bằng việc xây dựng một nền tảng không gian làm việc (Workspace) trực quan hỗ trợ kéo thả giảng viên kết hợp với động cơ thuật toán tự động giải quyết bài toán thỏa mãn ràng buộc (CSP), hệ thống hướng tới việc tự động hóa tối đa quy trình phân công lịch dạy, đảm bảo tính chính xác tuyệt đối và tối ưu hóa thời gian lập kế hoạch giảng dạy cho cán bộ giáo vụ.

---

### 1. Giới thiệu đề tài

Đề tài tập trung vào việc nghiên cứu, thiết kế và phát triển một ứng dụng web chuyên biệt phục vụ công tác lập kế hoạch và phân công giảng dạy tại Khoa Công nghệ Thông tin – Trường Đại học Đại Nam. Hệ thống được xây dựng như một giải pháp công nghệ toàn diện đóng vai trò cầu nối thông tin trực tuyến giữa Cán bộ quản lý giáo vụ khoa và Đội ngũ giảng viên. 

Hệ thống phân cấp người dùng rõ ràng thành ba nhóm tác nhân với các chức năng nghiệp vụ tương ứng:
*   **Quản trị viên (Admin):** Quản lý cấu hình tài khoản hệ thống và thực hiện nạp dữ liệu nền tảng ban đầu (Seed data).
*   **Cán bộ xếp lịch (Scheduler):** Quản lý danh mục cốt lõi (Giảng viên, Môn học, Lớp cố định, Khung chương trình đào tạo), tổ chức các đợt khảo sát nguyện vọng, vận hành không gian làm việc Workspace TKB, thực thi động cơ phân công tự động và kết xuất thời khóa biểu hoàn chỉnh ra file Excel.
*   **Giảng viên (Lecturer):** Đăng nhập vào Lecturer Portal cá nhân để đăng ký nguyện vọng giảng dạy (môn học, vai trò dạy lý thuyết hoặc thực hành) trực tiếp trên hệ thống theo từng học kỳ.

Điểm cốt lõi của đề tài là việc thiết lập giao diện Workspace TKB động. Giao diện này tự động nhân chéo cấu hình đầu vào để sinh ra lưới thời khóa biểu nháp, cho phép cán bộ xếp lịch kéo thả giảng viên từ Pool nguyện vọng bên phải vào lưới phân công, tự động kiểm tra xung đột thời gian thực, hoặc chạy thuật toán phân công tự động (Auto-Assign) để điền lịch trong vài giây, mang lại trải nghiệm làm việc hiện đại và tin cậy.

---

### 2. Lí do chọn đề tài

Quyết định lựa chọn đề tài này xuất phát từ các yêu cầu nghiệp vụ cấp thiết và xu hướng công nghệ trong quản lý đào tạo hiện nay:

*   **Tính phức tạp và tốn thời gian của quy trình thủ công:** Việc phân công giảng dạy thủ công cho hàng chục lớp học phần với nhiều khóa sinh viên khác nhau tiêu tốn rất nhiều ngày làm việc của cán bộ giáo vụ. Mỗi khi có sự thay đổi về nhân sự hoặc nguyện vọng của giảng viên thỉnh giảng, giáo vụ phải rà soát thủ công toàn bộ thời khóa biểu, dễ dẫn đến hiện tượng xếp trùng lịch hoặc vượt định mức giờ dạy của giảng viên.
*   **Khó khăn trong việc thu thập và đối chiếu nguyện vọng:** Quy trình gửi danh sách môn học qua email/tin nhắn và nhận lại nguyện vọng đăng ký của giảng viên diễn ra rời rạc, thiếu tập trung. Cán bộ giáo vụ gặp khó khăn lớn trong việc thống kê ai đăng ký dạy môn gì, vai trò lý thuyết hay thực hành để đưa ra quyết định phân công tối ưu.
*   **Yêu cầu kiểm soát xung đột theo thời gian thực:** Giáo vụ khoa cần một công cụ thông minh cảnh báo ngay lập tức các vi phạm ràng buộc (ví dụ: giảng viên dạy quá 6 lớp trong một kỳ, giảng viên bị trùng ca dạy ở các lớp khác nhau) ngay tại màn hình xếp lịch, thay vì chỉ phát hiện ra lỗi sau khi thời khóa biểu đã được công bố.
*   **Tính tất yếu của ứng dụng thuật toán thông minh:** Bài toán xếp thời khóa biểu là một dạng điển hình của bài toán Thỏa mãn Ràng buộc (Constraint Satisfaction Problem - CSP) trong Khoa học máy tính. Việc áp dụng các giải thuật CSP (như Backtracking Search phối hợp Constraint Propagation) để tự động hóa quy trình phân bổ giảng viên và thời gian học là giải pháp công nghệ khoa học nhất, thay thế cho tư duy trực giác thủ công của con người.

Từ những lý do trên, việc phát triển hệ thống lập kế hoạch và phân công giảng dạy cho Khoa Công nghệ Thông tin là thực sự cần thiết, mang tính thực tiễn cao, giúp chuẩn hóa và tối ưu hóa quy trình nghiệp vụ nội bộ của Khoa tại Trường Đại học Đại Nam.

---

### 3. Mục đích nghiên cứu

Mục đích nghiên cứu chính của đề tài là xây dựng hoàn chỉnh và đưa vào vận hành thử nghiệm một hệ thống phần mềm hỗ trợ lập kế hoạch, thu thập nguyện vọng và tự động phân công giảng dạy đạt hiệu quả, chính xác và minh bạch.

Các mục tiêu cụ thể bao gồm:
*   **Xây dựng cơ sở dữ liệu tập trung:** Thiết kế và chuẩn hóa cấu trúc dữ liệu lưu trữ thông tin giảng viên, môn học, lớp học cố định, khung chương trình đào tạo, nguyện vọng giảng dạy và kết quả phân công thời khóa biểu trên hệ quản trị cơ sở dữ liệu PostgreSQL.
*   **Số hóa quy trình đăng ký nguyện vọng:** Phát triển cổng thông tin Lecturer Portal trực tuyến để giảng viên chủ động khai báo năng lực và đăng ký môn dạy trong đợt khảo sát, đảm bảo tính công bằng và minh bạch dữ liệu.
*   **Hiện thực hóa thuật toán phân công tự động (Auto-Assign Engine):** Nghiên cứu và lập trình thuật toán CSP phía Backend để tự động xếp slot thời gian và gán giảng viên cho toàn bộ lưới thời khóa biểu trống, đảm bảo thỏa mãn 100% các ràng buộc cứng và tối ưu hóa các ràng buộc mềm chỉ trong vài giây.
*   **Phát triển giao diện Workspace tương tác trực quan:** Xây dựng màn hình lưới thời khóa biểu Workspace động hỗ trợ kéo thả giảng viên mượt mà, đồng thời tích hợp hệ thống cảnh báo xung đột thời gian thực (đỏ/vàng) giúp giáo vụ dễ dàng điều chỉnh lịch dạy bằng tay.
*   **Hỗ trợ xuất nhập dữ liệu tiêu chuẩn:** Cung cấp tính năng kết xuất thời khóa biểu chính thức ra tệp tin định dạng Excel XLSX tương thích hoàn toàn với biểu mẫu in ấn của Nhà trường.

---

### 4. Phương pháp nghiên cứu

Để thực hiện đề tài này, các phương pháp nghiên cứu sau đây đã được áp dụng đồng bộ:

*   **Phương pháp nghiên cứu lý thuyết:**
    *   Tìm hiểu về lý thuyết đồ thị, giải thuật thỏa mãn ràng buộc (CSP), thuật toán quay lui (Backtracking), kỹ thuật lan truyền ràng buộc (Constraint Propagation) và heuristics chọn biến/chọn giá trị (MRV, LCV).
    *   Nghiên cứu kiến trúc phần mềm ba tầng (Three-tier Architecture), mô hình RESTful API, giao tiếp dữ liệu phi trạng thái và cơ chế bảo mật xác thực dựa trên Token JWT.
*   **Phương pháp nghiên cứu thực nghiệm (Xây dựng sản phẩm):**
    *   **Phát triển Backend:** Sử dụng Python kết hợp với FastAPI để xây dựng hệ thống API hiệu năng cao; sử dụng SQLAlchemy làm cầu nối tương tác dữ liệu ORM với PostgreSQL; sử dụng OpenPyXL để xử lý file bảng tính.
    *   **Phát triển Frontend:** Sử dụng React v19, TypeScript, công cụ Vite để xây dựng SPA Client; thiết kế giao diện đáp ứng nhanh bằng TailwindCSS v4; xây dựng lưới dữ liệu động bằng Ant Design v6; lập trình kéo thả bằng bộ thư viện `@dnd-kit`.
*   **Phương pháp kiểm thử và phân tích kết quả:**
    *   Thiết lập môi trường kiểm thử cục bộ (Localhost) chạy các dịch vụ song song.
    *   Nạp bộ dữ liệu mẫu có kiểm soát cấp khoa bao gồm 30 giảng viên, 62 môn học, 7 lớp cố định khóa K19 để chạy thử nghiệm.
    *   Đo lường thời gian thực thi thuật toán Auto-Assign, đánh giá độ chính xác của các cảnh báo xung đột hiển thị trên lưới giao diện, so sánh hiệu quả giữa quy trình phân công tự động và quy trình xếp tay truyền thống.

---

### 5. Phạm vi nghiên cứu

*   **Đối tượng nghiên cứu:** 
    *   Các giải thuật tối ưu hóa xếp lịch học và phân công giảng sự dựa trên mô hình bài toán thỏa mãn ràng buộc (CSP).
    *   Các mẫu thiết kế phần mềm (Design Patterns) áp dụng trong việc xây dựng API bất đồng bộ và kiến trúc giao diện tương tác kéo thả phía Client.
    *   Luồng nghiệp vụ thu thập nguyện vọng trực tuyến và phân quyền người dùng (Role-Based Access Control - RBAC).
*   **Phạm vi áp dụng:** Đề tài được thiết kế đặc thù theo quy chế đào tạo tín chỉ, phân bổ phòng máy/phòng thường và chính sách phân công giảng sự riêng biệt của Khoa Công nghệ Thông tin thuộc Trường Đại học Đại Nam.
*   **Giới hạn đề tài:**
    *   Hệ thống tập trung tối ưu hóa bài toán phân công thời khóa biểu chuyên môn ở quy mô cấp Khoa (Khoa CNTT), không bao gồm việc điều phối lịch học đại cương toàn trường hay phân bổ chi tiết số phòng học vật lý cụ thể (ví dụ: Phòng 301, 402).
    *   Hệ thống không quản lý quá trình học tập, thi cử, điểm số hay đánh giá rèn luyện của sinh viên mà chỉ phục vụ giai đoạn chuẩn bị kế hoạch giảng dạy và phân công lịch dạy cho Giảng viên.

---

### 6. Kết cấu của đồ án

Nội dung báo cáo đồ án ngoài Phần mở đầu, Kết luận, Tài liệu tham khảo và Phụ lục được kết cấu thành 4 chương chính như sau:

*   **Phần mở đầu:** Giới thiệu tổng quan về đề tài, lý do chọn đề tài, mục đích nghiên cứu, phương pháp nghiên cứu, phạm vi và kết cấu của đồ án.
*   **Chương 1 - Cơ sở lý thuyết:** Trình bày tổng quan về bài toán xếp thời khóa biểu và phân công giảng dạy, phân tích chi tiết các hệ thống ràng buộc nghiệp vụ thực tế của khoa, nghiên cứu lý thuyết mô hình hóa bài toán Thỏa mãn Ràng buộc (CSP) và các thuật toán giải quyết CSP.
*   **Chương 2 - Công nghệ sử dụng:** Giới thiệu chi tiết về hệ công nghệ phát triển ứng dụng bao gồm Python, FastAPI, SQLAlchemy ở phía Backend; React 19, Vite, Ant Design v6, TailwindCSS v4, `@dnd-kit` ở phía Frontend; và Docker, PostgreSQL ở tầng dữ liệu.
*   **Chương 3 - Phân tích và thiết kế hệ thống:** Đặc tả các luồng nghiệp vụ chi tiết của 3 nhóm tác nhân thông qua các sơ đồ Use Case và bảng đặc tả Use Case chi tiết; thiết kế cấu trúc dữ liệu qua Class Diagram; thể hiện luồng xử lý qua Activity Diagram và thiết kế CSDL quan hệ vật lý qua ERD Diagram.
*   **Chương 4 - Kết quả thực nghiệm và đánh giá:** Báo cáo chi tiết cấu hình phần cứng/phần mềm chạy thực tế tại máy local của tác giả, hướng dẫn cài đặt khởi chạy dự án, giới thiệu giao diện 10 màn hình chức năng cốt lõi kèm mô tả hoạt động, đánh giá các thông số thực nghiệm (dữ liệu test 30 giảng viên, 62 môn, 7 lớp K19; thời gian chạy thuật toán CSP dưới 3 giây, độ chính xác 100%), phân tích ưu nhược điểm và định hướng phát triển tương lai.
*   **Kết luận:** Đánh giá tổng hợp các kết quả đạt được của đồ án so với mục tiêu nghiên cứu ban đầu và rút ra bài học kinh nghiệm.
