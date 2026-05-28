# Design System: Equipment Management System
**Project Title:** Equipment Management System - Mobile UI

## 1. Visual Theme & Atmosphere
Giao diện được thiết kế theo phong cách thiết kế phẳng hiện đại (Modern Flat Design), tối giản nhưng năng động và trực quan. Sử dụng tông màu đỏ đậm làm chủ đạo tạo điểm nhấn thương hiệu mạnh mẽ, kết hợp với các khoảng trắng (whitespace) thoáng đãng, mang lại cảm giác chuyên nghiệp, dễ sử dụng cho cả sinh viên, thủ kho và quản trị viên.

## 2. Color Palette & Roles
* **Primary Red (#CC0D00):** Màu chủ đạo của thương hiệu. Sử dụng cho các hành động chính (Primary Buttons), nút thêm mới, tiêu đề quan trọng, biểu tượng chỉ thị và các trạng thái nổi bật.
* **Secondary Blue (#007AFF):** Màu phụ trợ. Sử dụng cho các badge trạng thái "Có sẵn", các đường liên kết phụ, lịch biểu và các hành động thứ cấp.
* **Accent Slate (#0F172A):** Màu tối dùng cho text chính, các tiêu đề lớn và màu sắc của thanh điều hướng để tạo chiều sâu cứng cáp.
* **Muted Gray (#64748B):** Màu xám trung tính cho text mô tả, placeholder, các biểu tượng phụ và đường viền ngăn cách.
* **Light Gray Base (#F8FAFC):** Màu nền chính cho toàn bộ màn hình hoặc các section phụ, tạo sự tách biệt nhẹ nhàng với các container màu trắng tinh khiết.
* **Status Colors:**
  - **Success Green (#16A34A / bg-green-100 / text-green-700):** Trạng thái "Đã duyệt", "Hoàn thành".
  - **Warning Orange (#D97706 / bg-amber-100 / text-amber-700):** Trạng thái "Chờ duyệt", "Bảo trì".
  - **Danger Red (#DC2626 / bg-red-100 / text-red-700):** Trạng thái "Quá hạn", "Từ chối", nút "Xóa".

## 3. Typography Rules
* **Font Family:** Sử dụng font Sans-Serif hiện đại (như Inter, Roboto hoặc Outfit).
* **Headers:** Chữ rất đậm (`font-bold`), màu sắc Accent Slate (`#0F172A`), kích thước từ `text-lg` (18px) đến `text-2xl` (24px) tùy cấp độ màn hình.
* **Body:** Chữ thường hoặc vừa (`font-normal` / `font-medium`), màu Slate hoặc Muted Gray, kích thước `text-sm` (14px) hoặc `text-base` (16px).
* **Badges/Captions:** Chữ rất nhỏ (`text-[10px]` hoặc `text-xs`), in hoa hoàn toàn (`uppercase`) và viết đậm (`font-bold`) để dễ đọc trên thiết bị di động.

## 4. Component Stylings
* **Buttons:**
  - *Primary Button:* Bo góc tròn mềm mại (`rounded-xl`), background màu đỏ đậm `#CC0D00`, text màu trắng, viết đậm (`font-bold`).
  - *Secondary/Outline Button:* Bo góc `rounded-xl`, background xám nhạt `#F1F5F9` hoặc viền đỏ với nền trong suốt, text màu xám sẫm hoặc màu chủ đạo.
  - *Danger Button:* Bo góc `rounded-xl`, background đỏ tươi `#DC2626` hoặc `#EF4444`, text màu trắng.
* **Cards/Containers:**
  - Bo góc hào phóng (`rounded-2xl` hoặc 16px).
  - Background trắng tinh khiết (`#FFFFFF`).
  - Bóng đổ cực kỳ nhẹ nhàng (`shadow-sm` hoặc `border border-gray-100`), tạo cảm giác phẳng nhưng vẫn có lớp nổi bật nhẹ.
* **Inputs/Forms:**
  - Bo góc `rounded-xl` (12px).
  - Background trắng hoặc xám cực nhạt `#F8FAFC`, có viền xám rất mỏng `#E2E8F0`.
  - Có icon chỉ thị ở góc trái (Feather Icons như `mail`, `lock`, `user`).
* **Modals/Popups:**
  - Bo góc cực lớn ở phần trên (`rounded-t-[30px]`) cho các dạng Bottom Sheet, hoặc bo góc tròn hoàn toàn cho modal giữa màn hình.
  - Phủ nền đen mờ phía sau (`bg-black/40`).

## 5. Layout Principles
* **Whitespace:** Khoảng cách lề biên chuẩn là `px-6` (24px), khoảng cách giữa các khối container là `mb-4` hoặc `mb-6`.
* **Rhythm:** Thiết kế theo cấu trúc dọc gọn gàng, tiêu đề luôn được căn lề trái rõ ràng kèm theo nút quay lại ở góc trên bên trái.
* **Mobile Optimization:** Mọi nút bấm tương tác phải cao tối thiểu 44px (thường là 48px - 54px cho nút lớn) để thao tác bằng một tay dễ dàng khi người dùng di chuyển trong kho.
