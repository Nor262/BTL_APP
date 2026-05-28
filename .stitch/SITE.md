# Site Vision: Equipment Management System Mobile UI
Dự án này nhằm tái hiện toàn bộ giao diện di động của ứng dụng **Quản lý thiết bị (Equipment Management System)** lên nền tảng Stitch Cloud. Giao diện tối ưu hóa trải nghiệm di động của 3 nhóm đối tượng: Sinh viên (Borrower), Thủ kho (Storekeeper), và Quản trị viên (Admin).

## 1. Thiết bị Mục tiêu
- **Device Type:** MOBILE (390 x 844)
- **Design Mode:** Light Mode

## 2. Danh mục màn hình (Sitemap)
Dưới đây là danh sách 19 màn hình cần được vẽ trên Stitch Cloud:

- `[ ]` **1. login** - Đăng nhập ứng dụng
- `[ ]` **2. register** - Đăng ký tài khoản sinh viên
- `[ ]` **3. forgot-password** - Yêu cầu mã OTP khôi phục mật khẩu
- `[ ]` **4. reset-password** - Đặt mật khẩu mới
- `[ ]` **5. notifications** - Danh sách thông báo hệ thống
- `[ ]` **6. borrower-home** - Trang chủ dành cho Sinh viên (Borrower)
- `[ ]` **7. explore** - Danh sách thiết bị và tìm kiếm/lọc theo danh mục
- `[ ]` **8. scan** - Trình quét QR thiết bị của Sinh viên
- `[ ]` **9. my-loans** - Danh sách đơn mượn/trả của Sinh viên
- `[ ]` **10. equipment-detail** - Chi tiết thiết bị và Form đăng ký mượn cho Sinh viên
- `[ ]` **11. storekeeper-home** - Trang chủ dành cho Thủ kho (Storekeeper)
- `[ ]` **12. storekeeper-requests** - Danh sách đơn mượn/trả chờ duyệt
- `[ ]` **13. storekeeper-request-detail** - Chi tiết phê duyệt đơn mượn/trả
- `[ ]` **14. storekeeper-scan** - Trình quét QR mượn/trả của Thủ kho
- `[ ]` **15. admin-home** - Trang chủ Quản trị viên (Admin)
- `[ ]` **16. admin-categories** - Quản lý Danh mục (Chỉ Admin CRUD)
- `[ ]` **17. admin-locations** - Quản lý Vị trí kho (Chỉ Admin CRUD)
- `[ ]` **18. admin-suppliers** - Quản lý Nhà cung cấp (Chỉ Admin CRUD)
- `[ ]` **19. admin-equipment-detail** - Chi tiết thiết bị có nút Xóa & Sửa dành cho Admin

## 3. Lộ trình Triển khai (Roadmap)
1. **Khởi tạo:** Tạo dự án trên Stitch Cloud, đồng bộ Design System.
2. **Pha 1 (Auth & Common):** Tạo 5 màn hình đầu tiên (xác thực, thông báo).
3. **Pha 2 (Borrower App):** Tạo 5 màn hình tiếp theo dành cho người mượn và chi tiết thiết bị.
4. **Pha 3 (Storekeeper App):** Tạo 4 màn hình dành cho thủ kho phê duyệt và quét QR bàn giao.
5. **Pha 4 (Admin App):** Tạo 5 màn hình quản lý danh mục cấu hình và chi tiết thiết bị nâng cao cho admin.
