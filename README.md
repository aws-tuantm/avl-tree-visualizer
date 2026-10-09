# AVL Tree Visualizer - Công Cụ Trực Quan Hóa Cấu Trúc Dữ Liệu Cây AVL

Ứng dụng web tương tác hiện đại giúp mô phỏng, học tập và phân tích cấu trúc dữ liệu **Cây Tự Cân Bằng AVL (Adelson-Velsky and Landis)** một cách sinh động, trực quan và chuẩn xác.

---

## 📌 Tổng Quan Dự Án

Cây AVL là một cây tìm kiếm nhị phân (BST) có khả năng **tự cân bằng**. Tại bất kỳ nút nào trên cây, độ chênh lệch chiều cao giữa cây con bên trái và cây con bên phải (gọi là **Hệ số cân bằng - Balance Factor**) không bao giờ vượt quá `±1`.

Dự án này được thiết kế nhằm mục đích giảng dạy và nghiên cứu giải thuật, cung cấp trải nghiệm mô phỏng chuyển động từng bước với hiệu ứng mượt mà, giúp người học dễ dàng nắm bắt nguyên lý quay cây và cân bằng dữ liệu.

---

## 🧠 Chi Tiết Thuật Toán Cây AVL (Algorithm In-Depth)

### 1. Hệ Số Cân Bằng (Balance Factor - BF)
Với mỗi nút $N$ trên cây:
$$\text{Height}(N) = 1 + \max(\text{Height}(Left), \text{Height}(Right))$$
$$BF(N) = \text{Height}(Left) - \text{Height}(Right)$$

- **Trạng thái cân bằng**: $BF(N) \in \{-1, 0, 1\}$.
- **Trạng thái mất cân bằng**: $|BF(N)| \ge 2$. Khi đó, cần kích hoạt phép xoay để khôi phục cấu trúc AVL.

---

### 2. Thuật Toán Chèn Nút (Insertion)
Quá trình chèn một phần tử $X$ vào cây AVL được thực hiện qua 3 giai đoạn:
1. **Chèn theo quy tắc BST**: Đi từ gốc xuống vị trí lá thích hợp ($X < Node \rightarrow$ sang trái, $X > Node \rightarrow$ sang phải).
2. **Cập nhật chiều cao (Backtracking)**: Lần ngược từ nút vừa chèn về lại nút gốc để cập nhật lại chiều cao của từng nút tổ tiên.
3. **Kiểm tra và Xoay**: Tại mỗi nút tổ tiên, tính $BF$. Nếu phát hiện $|BF| \ge 2$, xác định 1 trong 4 trường hợp lệch và thực hiện phép xoay tương ứng để cân bằng lại.

---

### 3. Thuật Toán Xóa Nút (Deletion)
1. **Xóa theo quy tắc BST**:
   - **Nút lá**: Xóa trực tiếp.
   - **Nút có 1 con**: Thay thế nút bị xóa bằng nút con duy nhất của nó.
   - **Nút có 2 con**: Tìm phần tử nhỏ nhất của cây con bên phải (**In-order Successor**) hoặc lớn nhất của cây con bên trái, sao chép giá trị vào nút hiện tại, sau đó xóa nút thế mạng.
2. **Tái cân bằng ngược về gốc**: Lần ngược từ vị trí bị xóa về gốc, cập nhật chiều cao và kiểm tra $BF$ tại mọi nút trên đường đi. *(Lưu ý: Thao tác xóa có thể yêu cầu nhiều phép xoay liên tiếp cho đến khi lên tới gốc).*

---

### 4. Chi Tiết 4 Phép Xoay Tự Cân Bằng (Rotations)

```
1. Phép Xoay Phải (Right Rotation - Lệch LL):
       z (BF = +2)                     y (BF = 0)
      / \                             /  \
     y   T3    -- Xoay Phải -->      x    z
    / \                             / \  / \
   x   T2                          T1 T2 T2 T3
  / \
 T1  T2

2. Phép Xoay Trái (Left Rotation - Lệch RR):
     z (BF = -2)                       y (BF = 0)
    / \                               /  \
   T1  y       -- Xoay Trái -->      z    x
      / \                           / \  / \
     T2  x                         T1 T2 T3 T4
        / \
       T3  T4
```

| Loại Lệch | Điều Kiện Nhận Diện | Phép Xoay Xử Lý |
| :--- | :--- | :--- |
| **Left - Left (LL)** | $BF(Node) > 1$ và $BF(LeftChild) \ge 0$ | **Xoay Phải (Right Rotation)** tại Node |
| **Right - Right (RR)** | $BF(Node) < -1$ và $BF(RightChild) \le 0$ | **Xoay Trái (Left Rotation)** tại Node |
| **Left - Right (LR)** | $BF(Node) > 1$ và $BF(LeftChild) < 0$ | **Xoay Kép**: Xoay Trái tại con trái $\rightarrow$ Xoay Phải tại Node |
| **Right - Left (RL)** | $BF(Node) < -1$ và $BF(RightChild) > 0$ | **Xoay Kép**: Xoay Phải tại con phải $\rightarrow$ Xoay Trái tại Node |

---

### 5. Đánh Giá Độ Phức Tạp (Complexity Analysis)

| Thao Tác | Trường Hợp Tốt Nhất | Trường Hợp Trung Bình | Trường Hợp Xấu Nhất | Độ Phức Tạp Không Gian |
| :--- | :---: | :---: | :---: | :---: |
| **Tìm kiếm (Search)** | $O(1)$ | $O(\log n)$ | $O(\log n)$ | $O(1)$ |
| **Chèn (Insert)** | $O(1)$ | $O(\log n)$ | $O(\log n)$ | $O(\log n)$ (Stack) |
| **Xóa (Delete)** | $O(1)$ | $O(\log n)$ | $O(\log n)$ | $O(\log n)$ (Stack) |

> Nhờ khả năng duy trì chiều cao cây luôn ở mức xấp xỉ $\approx 1.44 \log_2 n$, Cây AVL đảm bảo hiệu năng tìm kiếm, chèn, xóa luôn ổn định ở mức $O(\log n)$, không bị suy biến thành danh sách liên kết $O(n)$ như BST thông thường.

---

## ✨ Tính Năng Nổi Bật

### 1. Trực Quan Hóa Động & Chuyển Động Mượt Mà
- **Tối ưu hóa DOM SVG**: Sử dụng cơ chế cập nhật tọa độ liên tục cho các Node và nhánh nối, loại bỏ hoàn toàn hiện tượng nhấp nháy hoặc vẽ lại toàn bộ khi xảy ra phép xoay cây.
- **Hiệu ứng trực quan**: Màu sắc thể hiện rõ ràng các trạng thái nút (Đang duyệt, Nút mất cân bằng, Nút đang xoay, Nút tìm thấy).

### 2. Bộ Điều Khiển Mô Phỏng Đa Chế Độ
- **Phát Lại (Replay)**: Cho phép tua lại toàn bộ diễn biến thao tác vừa thực hiện từ trạng thái ban đầu.
- **Chế Độ Từng Bước (Step-by-Step)**: Tạm dừng tại mỗi bước so sánh / xoay cây để quan sát chi tiết trước khi bấm **Bước Tiếp**.
- **Điều Chỉnh Tốc Độ (Speed Slider)**: Tùy chỉnh tốc độ chuyển động từ chậm (phân tích) đến nhanh (thao tác nhanh).

### 3. Giám Sát Chỉ Số Thời Gian Thực
- Hiển thị trực tiếp trên thanh điều khiển:
  - **Số lượng nút (Total Nodes)**.
  - **Chiều cao cây ($h$)**.
  - **Nút gốc hiện tại (Root)**.
  - **Hệ số cân bằng ($BF = h_{left} - h_{right}$)** và chiều cao ($h$) gắn liền trên từng nút.

### 4. Tương Tác Trực Tiếp Trên Nút (Node Context Menu)
- Nhấp chuột trực tiếp vào bất kỳ nút nào trên cây để mở menu thao tác nhanh:
  - **Xóa Nút**: Thực hiện xóa và tự động tái cân bằng cây ngay lập tức.
  - **Tìm Kiếm Nút**: Kích hoạt đường dẫn tìm kiếm từ gốc đến nút được chọn.
  - **Đưa Vào Ô Nhập**: Nạp giá trị nút vào thanh công cụ.

### 5. Kho Mẫu Thử & Sinh Số Ngẫu Nhiên
- Menu **Mẫu thử** tích hợp sẵn các ca mất cân bằng kinh điển (`LL`, `RR`, `LR`, `RL`), cây cân bằng 7 nút, cây lớn 10 nút và nút tạo 6 số ngẫu nhiên.

### 6. Không Gian Làm Việc Đa Hướng (Pan & Zoom)
- **Kéo thả tự do (Pan)**: Nhấp giữ chuột trái bất kỳ đâu trên nền canvas để kéo di chuyển toàn bộ cây khi cây phát triển lớn và nhiều nhánh.
- **Phóng to / Thu nhỏ (Zoom)**: Dùng con lăn chuột để zoom mượt mà theo tâm trỏ chuột, hoặc dùng cụm nút `+` / `-` và nút `100%` để căn giữa tức thì.
- **Hỗ trợ cảm ứng**: Thao tác kéo ngón tay và chụm mở (pinch-to-zoom) trên màn hình cảm ứng hoặc touchpad.

### 7. Nhật Ký Chi Tiết & Mini-Tree So Sánh
- Bảng giải thích chi tiết các bước thực thi (Thuật toán duyệt, phát hiện mất cân bằng, loại phép xoay áp dụng: `LL`, `RR`, `LR`, `RL`).
- Sơ đồ thu nhỏ (**Mini-Tree**) đối chiếu trạng thái cây **Trước** và **Sau** khi xoay / biến đổi.

---

## 🛠️ Công Nghệ Sử Dụng

- **Ngôn ngữ**: HTML5, CSS3, JavaScript (ES6+ Module Pattern).
- **Đồ họa**: Scalable Vector Graphics (SVG) kết hợp CSS Keyframes & Cubic-Bezier Transitions.
- **Typography & Icons**: Google Fonts (Mulish), Remix Icon System.
- **Kiến trúc**: Hướng đối tượng (OOP) tách biệt rõ ràng giữa Core Data Structure (`AVLTree`, `AVLNode`) và Rendering Engine (`ui.js`, `avl-main.js`).

---

## 📂 Cấu Trúc Thư Mục

```
.
├── css/
│   └── style.css         # Hệ thống giao diện, theme phẳng, hoạt ảnh CSS
├── js/
│   ├── avl-tree.js       # Cấu trúc dữ liệu Cây AVL & Logic toán học (Insert, Delete, Rotate)
│   ├── avl-main.js       # Bộ điều phối sự kiện, hàng đợi mô phỏng (Animation Pipeline)
│   ├── ui.js             # Bộ dựng hình SVG DOM (Persistent Rendering Engine)
│   ├── tree.js           # Cấu trúc Cây BST cơ sở
│   ├── main.js           # Bộ xử lý BST
│   └── app.js            # Điểm khởi tạo ứng dụng
├── index.html            # Giao diện chính của ứng dụng
└── README.md             # Tài liệu dự án
```

---

## 🚀 Hướng Dẫn Sử Dụng

### 1. Khởi Chạy Ứng Dụng
Không cần cài đặt môi trường phức tạp hay máy chủ backend:
1. Tải hoặc clone mã nguồn về máy tính.
2. Mở tệp `index.html` bằng bất kỳ trình duyệt web hiện đại nào (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).

### 2. Các Thao Tác Cơ Bản
- **Chọn Mẫu Thử**: Bấm nút **Mẫu thử** để chọn nhanh các kịch bản xoay cây hoặc sinh số ngẫu nhiên.
- **Chèn nút (Insert)**: Nhập một số hoặc chuỗi số phân tách bằng dấu phẩy/khoảng trắng (ví dụ: `10, 20, 30, 15, 25`) rồi nhấn **Thêm**.
- **Xóa nút (Delete)**: Nhập giá trị cần xóa và nhấn **Xóa**, hoặc nhấp trực tiếp vào nút trên màn hình chọn **Xóa nút này**.
- **Tìm kiếm (Search)**: Nhập giá trị cần tìm và nhấn **Tìm Kiếm** để xem quá trình duyệt từ gốc.
- **Làm mới (Reset)**: Nhấn **Làm mới** để đưa cây về trạng thái rỗng.
