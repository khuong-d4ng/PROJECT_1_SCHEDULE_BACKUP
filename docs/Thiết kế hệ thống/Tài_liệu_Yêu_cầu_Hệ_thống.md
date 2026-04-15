# Tài liệu Yêu cầu Thiết kế Hệ thống Quản lý và Phân công Thời khóa biểu

## 1. Tổng quan
Hệ thống được thiết kế nhằm mục đích quản lý và hỗ trợ tự động hóa trong quá trình phân công giảng viên và xếp lịch thời khóa biểu (TKB) dựa trên chương trình đào tạo và thông tin giảng viên. Hệ thống cho phép thao tác thủ công (kéo thả) kết hợp với các luồng thuật toán phân công tự động, giải quyết bài toán về ràng buộc thời gian và tối ưu hóa việc phân công giảng viên trong từng học kỳ.

## 2. Các chức năng chính của hệ thống

### 2.1. Quản lý thông tin nền tảng
* **Trang xem thông tin giảng viên:** Xem thông tin chi tiết, hồ sơ và thời gian biểu của các giảng viên.
* **Trang xem thông tin chương trình đào tạo:** Quản lý danh sách, thông tin chi tiết cấu trúc chương trình đào tạo.
* **Trang tạo học kỳ:** Khởi tạo một học kỳ mới trên hệ thống để bắt đầu cấu hình cho việc phân công xếp lịch.
* **Import/Export dữ liệu chương trình đào tạo:** 
  * Import chương trình đào tạo (danh sách học phần) hàng loạt từ định dạng file Excel.
  * Export dữ liệu chương trình đào tạo từ hệ thống thành file Excel.
* **Đồng bộ hóa cấu hình lớp học:** Cho phép đồng bộ các môn học để tiết kiệm thời gian gán thủ công. (Ví dụ: khi chọn các môn A, B, C, D cho 1 lớp như CNTT17-01 ở học kỳ xác định và bấm "đồng bộ", hệ thống sẽ đồng thời gán chính xác nhóm 4 môn này cho tất cả các lớp khác trong cùng khóa 17).
* **Quản lý Môn tương đương:** Hệ thống hỗ trợ thiết lập quy đổi các môn học thay thế/tương đương (Ví dụ: sinh viên học lại môn A nhưng mã môn này không còn được giảng dạy, hệ thống có thể quy đổi sang môn A1 khác có cùng số lượng tín chỉ tương đương thay thế).

### 2.2. Giao diện và Dashboard hiển thị
* **Hiển thị đầy đủ thông tin môn học từng kỳ:** Cung cấp 1 bảng ở vi trí trung tâm giao diện hiển thị tất cả các dữ liệu đã lấy từ file Excel (STT, Mã học phần, Tên lớp, Tên môn, Số tín chỉ, Lý thuyết, Thực hành,...). Có cơ chế thanh cuộn ngang/dọc (kéo trượt trái/phải) để xem toàn bộ thông tin đầy đủ.

### 2.3. Xếp lịch và Phân công giảng viên (Thủ công)
* **Chức năng xếp lịch dạy giảng viên:** Cung cấp giao diện tương tác trực quan (kéo-thả). Người dùng thao tác kéo tên giảng viên từ phần sidebar (dashboard danh sách giảng viên) thả vào từng môn học tương ứng trên bảng hiển thị chính để tiến hành phân công. 
  * _Ràng buộc logic tự động:_ Trong trường hợp giảng viên đã được kéo gán vào một môn X học vào "Chiều Thứ 2", giảng viên đó sẽ tự động bị ẩn đi hoặc không khả dụng trong vùng thời gian "Chiều Thứ 2" của học kỳ đó (hiển thị trạng thái "BẬN") nhằm chống xung đột lịch dạy.
* **Chức năng tạo thời khóa biểu (Layout TKB):** Cung cấp giao diện tạo TKB bằng cách kéo thả thông tin các môn vào lưới thời khóa biểu trống ở những kỳ học đã xác định từ trước. Dữ liệu tham khảo dựa dâm cấu trúc chương trình đào tạo (Mã môn, Tên môn, Tín chỉ) và danh sách lóp.

### 2.4. Tính năng thu thập nguyện vọng đăng ký dạy
* **Lấy danh sách các môn từng giảng viên muốn đăng ký nhận dạy:**
  * Giảng viên hoặc cán bộ xếp lịch sẽ đăng ký các nguyện vọng môn học mong muốn được dạy vào một học kỳ xác định.
  * *Nguồn cung cấp dữ liệu:* Hệ thống cho phép (1) Nhập liệu trực tiếp ngay trên hệ thống web HOẶC (2) Import tự động từ một tệp Excel mẫu do nhà trường quy định (gồm các cột Tên học phần, Giảng viên chính, Giảng viên thực hành).
  * *Lưu trữ:* Dữ liệu sau khi xác nhận theo từng kỳ sẽ được kết xuất tạm vào dạng Session đối với phiên làm việc hiện tại, hoặc Lưu thẳng vào Hệ quản trị CSDL gắn liền nhãn với "kì đã được chọn".

### 2.5. Luồng xử lý Tự động phân công thời khóa biểu (Auto-Scheduling)
Ngoài chế độ kéo thả thủ công, hệ thống hỗ trợ Module tự động xếp lịch dựa trên luật (Rules-based scheduling):
* **Đầu vào (Inputs):** 
  * Khung thời khóa biểu của kỳ học xác định (chưa xếp người dạy).
  * Danh sách nguyện vọng các môn mà tất cả giảng viên đã đăng ký.
* **Luồng xử lý thuật toán (Processing Logic Loop):** 
  1. **Khởi tạo thông tin tĩnh (Session/Cache):** Tạo bộ nhớ tạm thời về tình trạng hiện tại của tất cả các giảng viên trong lượt quy hoạch phân công này. (Bao gồm dữ liệu: Tên giảng viên, Phân loại giảng viên, Tên nhóm môn mà họ đăng ký được dạy, Tổng số buổi khả dụng của họ, Số buổi đã/đang có trong kỳ, và số môn đang được gán).
  2. **Trượt qua từng môn:** Hệ thống lựa chọn ngẫu nhiên/tuần tự 1 môn học đang còn trống trong Thời khóa biểu.
  3. **Ưu tiên chọn 1 Giảng viên tốt nhất:** Thuật toán duyệt danh sách giảng viên khả dụng để tìm ra 1 người dựa trên độ ưu tiên Rules như: Giảng viên chính của môn đó -> Ưu tiên giảng viên chưa đạt đủ số tiết chỉ tiêu KPI -> Ưu tiên giảng viên nào đang bị phân công dạy quá ít -> v.v.
  4. **Đối chiếu ràng buộc (Check constraints):** Hệ thống lấy môn học trống và kiểm tra với Giảng viên (i) vừa lọt Top đầu Priority.
     * *Kiểm tra năng lực môn:* Tên môn học đó có tồn tại trong danh sách môn đăng ký của giảng viên (i) hay không? 
       -> _Nếu Không:_ Bỏ qua Giảng viên (i), vòng lại Bước 3 lấy người khác ở Top 2.
     * *Kiểm tra khả năng về ca học:* Môn học đó (Ví dụ: cố định ca Chiều) có nằm trong danh sách các ca 'Chiều' còn khả dụng của Giảng viên (i) không? 
       -> _Nếu Không_ (tức là giảng viên (i) hết buổi chiều rảnh): Vòng lại Bước 3.
     * *Kiểm tra tính trùng lặp theo số lượng buổi:* Đếm số buổi Chiều khả dụng (ví dụ thứ 2, 3, 5) của lớp này đã có môn học nào khác chiếm/xung đột vào slot chưa? 
       -> _Nếu Hết slot:_ Vòng lại Bước 3. 
       -> _Nếu Còn slot:_ Chuyển sang Gán slot.
  5. **Gán (Assign) & Cập nhật tráng thái:** Tiến hành gán chính thức giảng viên (i) này cho môn học đó vào chính vị trí slot còn trống. Ngay sau đó, tiến hành trừ bớt buổi này ra khỏi bộ đếm danh sách "các buổi khả dụng" của giảng viên (i). Tiếp tục quy trình phân duyệt đến khi không còn môn học trống.
* **Đầu ra thành phần (Outputs):**
  * (Bắt buộc) Thời khóa biểu đã hoàn chỉnh việc phân bổ. Kết quả sẽ được lưu và đổ vào Hệ thống cơ sở dữ liệu làm 1 bộ hồ sơ chuẩn (Record TKB).
  * (Tính năng phụ) Cho phép Nút Export xuất mảng dữ liệu định dạng đó ra bằng tệp Excel hoàn chỉnh báo cáo có chứa các cột thông tin (Tên Lớp, Buổi, Mã HP, Tên HP, Số tín chỉ, TC Lý thuyết/Thực Hành, Giảng viên chính/Thực hành, Loại Phòng học, ca học từng Thứ trong Tuần).
