# KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

## KẾT LUẬN

Sau quá trình phân tích, thiết kế và triển khai, hệ thống Lập kế hoạch và phân công giảng dạy dành cho Khoa Công nghệ Thông tin Trường Đại học Đại Nam đã hoàn thiện và đưa vào vận hành thử nghiệm với nhiều kết quả tích cực. Hệ thống không chỉ đáp ứng đầy đủ các chức năng cốt lõi ban đầu đề ra, mà còn thể hiện được tính ứng dụng thực tiễn cao trong việc hỗ trợ tối ưu hóa quy trình nghiệp vụ phân công thời khóa biểu giảng dạy của Khoa.

Toàn bộ hệ thống được xây dựng với giao diện người dùng trực quan, thân thiện, phù hợp với nhu cầu của Cán bộ xếp lịch, Giảng viên và Quản trị viên (Admin). Giảng viên có thể truy cập Cổng thông tin (Lecturer Portal) để đăng ký nguyện vọng giảng dạy lý thuyết/thực hành theo từng học kỳ và thiết lập cấu hình cá nhân. Đối với Cán bộ xếp lịch, hệ thống hỗ trợ quản lý danh mục (giảng viên, học phần, lớp học, khung đào tạo) và tổ chức đợt khảo sát nguyện vọng. Đặc biệt, không gian xếp lịch kéo thả (Workspace Grid) giúp việc phân công học phần diễn ra nhanh chóng và khoa học. Ngoài ra, quản trị viên cũng dễ dàng quản lý tài khoản người dùng, phân quyền truy cập và giám sát hệ thống bảo mật, ổn định.

Một điểm nổi bật của hệ thống là tính bảo mật và hiệu quả quản trị nhờ cơ chế phân quyền dựa trên vai trò (RBAC). Hệ thống tích hợp thành công các tính năng nâng cao như: không gian phân công kéo thả sử dụng thư viện `@dnd-kit`, công cụ tự động xếp lịch dựa trên thuật toán Thỏa mãn Ràng buộc (CSP), cơ chế phát hiện và cảnh báo xung đột thời gian thực, cùng hệ thống gửi email thông báo tự động qua Gmail SMTP. Về mặt kỹ thuật, kiến trúc phân tách Backend-Frontend (FastAPI và React 19) kết hợp cơ sở dữ liệu PostgreSQL mang lại hiệu năng cao và khả năng mở rộng tốt. Nhìn chung, hệ thống đã chứng minh tính khả thi và hiệu quả vượt trội trong tự động hóa công tác lập kế hoạch giảng dạy của Khoa.

---

## HẠN CHẾ CỦA ĐỀ TÀI

Mặc dù đã đạt được những kết quả tích cực bước đầu và vận hành ổn định trong môi trường thực nghiệm, đề tài vẫn tồn tại một số hạn chế cần tiếp tục hoàn thiện trong tương lai:

1. **Quy mô dữ liệu thử nghiệm thực tế:** Đề tài mới dừng lại ở việc thử nghiệm và đánh giá hiệu năng thuật toán CSP trên bộ dữ liệu quy mô cấp Khoa (khoảng 30 giảng viên, 62 học phần và 7 lớp sinh viên cố định thuộc khóa K19). Hệ thống chưa được thử nghiệm tải thực tế trên quy mô toàn trường với hàng ngàn giảng viên và lớp học diễn ra đồng thời.
2. **Chưa tích hợp phân bổ phòng học vật lý chi tiết:** Hệ thống hiện tại mới chỉ giải quyết ràng buộc gán loại phòng yêu cầu (Phòng máy hoặc Phòng thường) trên lưới Workspace Grid mà chưa đi sâu vào việc tự động sắp xếp và tối ưu hóa vị trí phòng học vật lý cụ thể (như phòng 301, 302 tòa nhà GD1) để tránh xung đột sức chứa và cơ sở vật chất.
3. **Giới hạn về tính năng cộng tác đồng thời:** Do hiện tại hệ thống được đóng gói và vận hành chủ yếu trên môi trường local của người dùng độc lập, nên chưa hỗ trợ tính năng đồng bộ hóa thời gian thực (Real-time Collaboration) khi có nhiều cán bộ giáo vụ cùng đăng nhập và thao tác chỉnh sửa thời khóa biểu trên cùng một phiên làm việc.

---

## HƯỚNG PHÁT TRIỂN TRONG TƯƠNG LAI

Tuy nhiên, để tiếp tục nâng cao chất lượng trải nghiệm người dùng, mở rộng quy mô ứng dụng cũng như tăng cường tính hoàn thiện của hệ thống, cần triển khai thêm một số hướng phát triển quan trọng trong thời gian tới:

1. **Xây dựng Module Quản lý Phòng học vật lý:** Nghiên cứu và tích hợp thêm tính năng quản lý chi tiết danh sách phòng học vật lý của Nhà trường, bao gồm các thông số về sức chứa (capacity), trang thiết bị chuyên dụng (phòng máy tính, phòng thực hành mạng, phòng học lý thuyết thường). Trên cơ sở đó, nâng cấp thuật toán để tự động kiểm tra và phân phối phòng học vật lý cho từng lớp học phần, giải quyết triệt để xung đột phòng học trên phạm vi toàn Khoa hoặc toàn Trường.
2. **Nâng cấp và tối ưu hóa thuật toán CSP:** Nghiên cứu nâng cấp giải thuật Thỏa mãn Ràng buộc (CSP) bằng cách áp dụng các phương pháp nâng cao như phân rã bài toán lớn thành các bài toán con (Problem Decomposition), cải tiến các heuristic chọn biến (MRV - Minimum Remaining Values) và chọn trị (LCV - Least Constraining Value), kết hợp kỹ thuật cắt tỉa nhánh cận để hệ thống có thể xử lý mượt mà và tối ưu hơn khi quy mô dữ liệu tăng lên cấp trường với hàng ngàn giảng viên, lớp học phần diễn ra đồng thời.
3. **Đẩy mạnh các kênh thông tin và tích hợp nâng cao:** Mở rộng tính năng thông báo tự động. Bên cạnh thông báo cục bộ và gửi thư qua Gmail SMTP hiện tại, việc tích hợp thêm các dịch vụ thông báo qua ứng dụng tin nhắn phổ biến (như Zalo OA, Telegram Bot) hoặc gửi tin nhắn SMS trực tiếp sẽ giúp giảng viên nhận thông tin phân công, lịch dạy thay đổi hay nhắc nhở hạn đăng ký nguyện vọng một cách tức thời và thuận tiện nhất. Đồng thời, nghiên cứu tích hợp khả năng đồng bộ lịch giảng dạy cá nhân với Google Calendar hay Microsoft Outlook của giảng viên.
4. **Bảo mật, lưu vết hệ thống và triển khai cộng tác thời gian thực:** Nâng cao công tác bảo mật và khả năng cộng tác ở mức cao nhất. Tiến hành bổ sung các biện pháp như xác thực hai yếu tố (2FA), mã hóa dữ liệu nhạy cảm của người dùng và xây dựng hệ thống ghi nhật ký hoạt động chi tiết (Audit Log). Ngoài ra, triển khai hệ thống lên môi trường đám mây (Cloud Deployment) sử dụng WebSockets sẽ hỗ trợ làm việc cộng tác trực tuyến thời gian thực (Real-time Collaboration), cho phép nhiều cán bộ giáo vụ có thể đồng thời thao tác phân công trên cùng một phiên thời khóa biểu mà không gây ra xung đột ghi đè dữ liệu.

Tóm lại, hệ thống đã và đang phát huy tốt vai trò là công cụ công nghệ hiệu quả, giúp nâng cao năng suất và chất lượng công tác quản lý đào tạo. Sự phát triển bền vững và liên tục cải tiến của hệ thống sẽ là nền tảng quan trọng trong việc thúc đẩy mạnh mẽ quá trình chuyển đổi số trong giáo dục đại học nói chung và tại Trường Đại học Đại Nam nói riêng.
