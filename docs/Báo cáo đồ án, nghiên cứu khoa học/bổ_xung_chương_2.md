# BỔ SUNG CHƯƠNG 2: MÔ HÌNH HÓA TOÁN HỌC BÀI TOÁN RÀNG BUỘC (CSP)

Để nâng cao tính học thuật và làm rõ cơ sở lý thuyết khoa học của Động cơ phân công tự động (CSP Solver), bài toán phân công giảng dạy được mô hình hóa chính thức dưới dạng một bài toán **Thỏa mãn ràng buộc (Constraint Satisfaction Problem - CSP)** theo các ký hiệu và mô tả toán học dưới đây.

---

## 1. Định nghĩa các Tập hợp và Tham số (Sets & Parameters)

Hệ thống lập lịch sử dụng các ký hiệu tập hợp để biểu diễn các thực thể tham gia trong quy trình nghiệp vụ của Khoa:

*   `L = {1, 2, ..., |L|}`: Tập hợp tất cả các Giảng viên khả dụng (bao gồm giảng viên cơ hữu và thỉnh giảng).
*   `C = {1, 2, ..., |C|}`: Tập hợp tất cả các Lớp học phần cần xếp lịch trong học kỳ.
*   `S = {1, 2, ..., |S|}`: Tập hợp tất cả các Học phần chuyên ngành của Khoa.
*   `T = {S-T2, S-T3, ..., C-T7}`: Tập hợp các ca học khả dụng trong tuần (trong đó ca bắt đầu bằng ký tự 'S' biểu thị ca Sáng, 'C' biểu thị ca Chiều; 'T2' đến 'T7' là Thứ 2 đến Thứ 7).
*   `R = {1, 2, ..., |R|}`: Tập hợp các dòng thời khóa biểu cần phân công gán lịch. Mỗi dòng `i ∈ R` mang các thuộc tính cố định được nạp từ cơ sở dữ liệu:
    *   `c_i ∈ C`: Lớp học phần tương ứng.
    *   `s_i ∈ S`: Học phần tương ứng cần giảng dạy.
    *   `shift_i ∈ {Sáng, Chiều}`: Ca học được chỉ định cố định trước của dòng.

### Các tham số định mức và năng lực:
*   `H_s = th_s + ph_s`: Tổng số tiết của học phần `s`, bao gồm số tiết lý thuyết (`th_s`) và số tiết thực hành (`ph_s`).
*   `P(l) ⊂ S`: Tập hợp các học phần mà giảng viên `l` đăng ký giảng dạy vai trò lý thuyết (Năng lực giảng dạy chính).
*   `P_prac(l) ⊂ S`: Tập hợp các học phần mà giảng viên `l` đăng ký giảng dạy vai trò thực hành.
*   `Hours(l)`: Tổng số giờ giảng dạy tích lũy hiện tại của giảng viên `l`.
*   `Count(l, s)`: Số lượng lớp học phần `s` đã gán cho giảng viên `l` làm giảng viên chính.

---

## 2. Định nghĩa Biến quyết định (Decision Variables)

Với mỗi dòng thời khóa biểu cần phân công `i ∈ R`, ta cần tìm giá trị cho bộ ba biến quyết định sau:
*   `x_i ∈ L`: Giảng viên chính được phân công giảng dạy lý thuyết (và thực hành nếu không tách ca).
*   `y_i ∈ L ∪ {∅}`: Giảng viên phụ trách thực hành (bằng `∅` nếu học phần không có giờ thực hành hoặc không phân giảng viên thực hành riêng).
*   `t_i ∈ T`: Ca học cụ thể được xếp lịch.

Để thuận tiện cho việc mô hình hóa các ràng buộc logic, ta định nghĩa các biến trạng thái nhị phân:

1. **Biến chỉ thị gán giảng viên chính (`v_i,l`):**
   ```text
   v[i, l] = 1 nếu giảng viên chính x[i] được gán bằng l; ngược lại v[i, l] = 0
   ```
   *(Biểu diễn toán học)*:
   $$
   v_{i, l} = \begin{cases} 1 & \text{nếu } x_i = l \\ 0 & \text{ngược lại} \end{cases}
   $$

2. **Biến chỉ thị gán giảng viên thực hành (`w_i,p`):**
   ```text
   w[i, p] = 1 nếu giảng viên thực hành y[i] được gán bằng p; ngược lại w[i, p] = 0
   ```
   *(Biểu diễn toán học)*:
   $$
   w_{i, p} = \begin{cases} 1 & \text{nếu } y_i = p \\ 0 & \text{ngược lại} \end{cases}
   $$

3. **Biến chỉ thị gán ca học (`u_i,t`):**
   ```text
   u[i, t] = 1 nếu ca học t[i] được xếp bằng t; ngược lại u[i, t] = 0
   ```
   *(Biểu diễn toán học)*:
   $$
   u_{i, t} = \begin{cases} 1 & \text{nếu } t_i = t \\ 0 & \text{ngược lại} \end{cases}
   $$

---

## 3. Hệ thống các Ràng buộc Cứng (Hard Constraints)

Ràng buộc cứng là các điều kiện bắt buộc 100% phải thỏa mãn để đảm bảo thời khóa biểu không xảy ra xung đột vật lý và tuân thủ các quy định nghiệp vụ cốt lõi của nhà trường.

### 3.1. Tránh trùng lịch học của Lớp học phần (`C_CLASS_OVERLAP`)
Một lớp học phần `c` tại một ca học `t` chỉ được phép học tối đa một học phần:
```text
Tổng số ca học trùng của lớp c tại ca t phải <= 1
```
*(Biểu diễn toán học)*:
$$
\forall t \in T, \forall c \in C: \sum_{i \in R \mid c_i = c} u_{i, t} \le 1
$$

### 3.2. Tránh trùng lịch giảng dạy của Giảng viên (`C_LEC_OVERLAP`)
Một giảng viên `l` tại một ca học `t` không thể thực hiện đồng thời hai nhiệm vụ giảng dạy (cho cả vai trò chính và thực hành):
```text
Tổng số nhiệm vụ dạy (chính + thực hành) của giảng viên l tại ca t phải <= 1
```
*(Biểu diễn toán học)*:
$$
\forall t \in T, \forall l \in L: \sum_{i \in R} u_{i, t} \cdot (v_{i, l} + w_{i, l}) \le 1
$$

### 3.3. Tuân thủ buổi cố định của dòng lịch học (`C_SHIFT_STRICT`)
Ca học được xếp phải thuộc đúng buổi sáng hoặc chiều đã cấu hình trước của dòng thời khóa biểu:
```text
Nếu ca học t được xếp cho dòng i thì buổi của ca t phải khớp với shift_i
```
*(Biểu diễn toán học)*:
$$
\forall i \in R: u_{i, t} = 1 \implies \text{Session}(t) = shift_i
$$
Trong đó:
$$
\text{Session}(t) = \begin{cases} \text{Sáng} & \text{nếu } t \in \{\text{S-T2}, \dots, \text{S-T7}\} \\ \text{Chiều} & \text{nếu } t \in \{\text{C-T2}, \dots, \text{C-T7}\} \end{cases}
$$

### 3.4. Phân công đúng chuyên môn đăng ký nguyện vọng (`C_CAPABILITY_STRICT`)
Giảng viên chỉ được phân công nếu học phần nằm trong danh mục đăng ký dạy đã phê duyệt:
```text
Giảng viên chính x[i] phải thuộc tập đăng ký dạy chính P(l)
Giảng viên thực hành y[i] phải thuộc tập đăng ký dạy thực hành P_prac(p)
```
*(Biểu diễn toán học)*:
$$
\forall i \in R: v_{i, l} = 1 \implies s_i \in P(l)
$$
$$
\forall i \in R: w_{i, p} = 1 \implies s_i \in P_{\text{prac}}(p)
$$

### 3.5. Giới hạn số học phần khác nhau của giảng viên chính (`C_MAIN_LEC_MAX_SUBJECTS`)
Một giảng viên chính `l` không được phép phụ trách giảng dạy quá `3` học phần chuyên ngành khác nhau trong cùng một học kỳ để đảm bảo sự tập trung chuyên môn sâu:
```text
Số lượng phần tử trong tập học phần được dạy của giảng viên l phải <= 3
```
*(Biểu diễn toán học)*:
$$
\forall l \in L: \left| \bigcup_{i \in R \mid v_{i, l} = 1} \{s_i\} \right| \le 3
$$

### 3.6. Giới hạn tổng số lớp giảng dạy của giảng viên chính (`C_MAIN_LEC_MAX_CLASSES`)
Giảng viên chính `l` không được phép gán vượt quá `10` lớp học phần trong cùng học kỳ để tránh quá tải tải giảng:
```text
Tổng số lớp được gán dạy chính của giảng viên l phải <= 10
```
*(Biểu diễn toán học)*:
$$
\forall l \in L: \sum_{i \in R} v_{i, l} \le 10
$$

---

## 4. Hệ thống các Ràng buộc Mềm và Tiêu chí tối ưu (Soft Constraints & Heuristics)

Các ràng buộc mềm không làm vô hiệu hóa thời khóa biểu nhưng được động cơ sử dụng làm tiêu chí để đánh giá và lựa chọn phương án phân công tốt nhất. Điểm số Heuristic của phương án gán được tối đa hóa để đạt trạng thái tối ưu.

Tổng số giờ giảng dạy tích lũy của giảng viên `l` được tính toán động theo công thức:
```text
Hours(l) = Tổng số giờ lý thuyết + Tổng số giờ thực hành được phân công
```
*(Biểu diễn toán học)*:
$$
Hours(l) = \sum_{i \in R} v_{i, l} \cdot \left[ th_{s_i} + \left(1 - \sum_{p \in L} w_{i, p}\right) \cdot ph_{s_i} \right] + \sum_{i \in R} w_{i, l} \cdot ph_{s_i}
$$

Mục tiêu của thuật toán là tìm cách gán giảng viên sao cho tổng điểm đánh giá của toàn bộ lịch biểu đạt giá trị lớn nhất:
$$
\text{Maximize} \sum_{i \in R} \text{Score}(x_i, y_i, t_i)
$$

### 4.1. Điểm số Heuristic theo Chiến lược gán (`Score_strat`)
*   **Chiến lược A - Bão hòa (Saturation)**: Ưu tiên gán dồn giờ dạy cho từng giảng viên cơ hữu để họ đạt định mức chuẩn `160` tiết trước. Nếu đã đạt mốc chuẩn, họ sẽ bị phạt để ưu tiên người chưa đạt:
    *(Biểu diễn toán học)*:
    $$
    \text{Score}_{\text{strat}}(l) = \begin{cases} Hours(l) & \text{nếu } Hours(l) < 160 \\ -5000 & \text{nếu } Hours(l) \ge 160 \end{cases}
    $$
*   **Chiến lược B - Cân bằng tải (Load Balancing)**: Ưu tiên phân phối đều giờ dạy cho toàn bộ giảng viên, chọn người có số giờ tích lũy thấp nhất:
    *(Biểu diễn toán học)*:
    $$
    \text{Score}_{\text{strat}}(l) = -Hours(l)
    $$

### 4.2. Hình phạt tránh vượt quá trần giờ giảng tối đa (`O_MAX_HOURS_250`)
Để bảo vệ chất lượng giảng dạy, hệ thống áp đặt trần mềm giờ giảng là `250` tiết. Nếu việc gán thêm giờ cho giảng viên `l` làm tổng giờ dự kiến vượt quá `250`, hệ thống sẽ phạt cực nặng:
*(Biểu diễn toán học)*:
$$
\text{Penalty}_{\text{overload}}(l, s_i) = \begin{cases} -10000 & \text{nếu } Hours(l) + \Delta Hours > 250 \\ 0 & \text{ngược lại} \end{cases}
$$
*(Trong đó `Δ Hours` là số tiết giảng dạy mới được cộng thêm của học phần `s_i`)*.

### 4.3. Hình phạt mệt mỏi bài giảng trùng lặp (`O_SUBJECT_FATIGUE`)
Một giảng viên chính không nên phụ trách quá `6` lớp học của cùng một học phần `s_i` nhằm tránh mệt mỏi bài giảng. Nếu vượt quá, điểm số của phương án gán sẽ bị trừ:
*(Biểu diễn toán học)*:
$$
\text{Penalty}_{\text{fatigue}}(l, s_i) = \begin{cases} -2000 & \text{nếu } Count(l, s_i) \ge 6 \\ 0 & \text{ngược lại} \end{cases}
$$

### 4.4. Cơ chế dự phòng để trống có cảnh báo (`O_FILL_FALLBACK`)
Nếu đối với dòng `i ∈ R`, không tồn tại bất kỳ giảng viên chính nào thỏa mãn tất cả các ràng buộc cứng `3.1` đến `3.6`, động cơ phân công sẽ kích hoạt cơ chế dự phòng:
```text
Giảng viên chính x[i] = Trống
Giảng viên thực hành y[i] = Trống
```
Phương án gán này sẽ không bị dừng chạy mà được trả về giao diện giáo vụ kèm nhãn cảnh báo *"Hết giảng viên chính khả dụng"* để xử lý thủ công, đảm bảo tính liên tục của thuật toán.
