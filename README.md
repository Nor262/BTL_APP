# Equipment Management System - Mobile App

Ứng dụng di động quản lý thiết bị dành cho người mượn (đăng ký mượn, xem lịch bận) và thủ kho (quét QR, Check-in/Check-out, báo cáo hư hỏng).

## 🚀 Tính năng chính

- **Quét mã QR**: Quét mã thiết bị để mượn hoặc tra cứu thông tin nhanh.
- **Calendar View**: Xem lịch bận của từng thiết bị trực quan, tránh đặt trùng ngày.
- **Báo cáo hư hỏng kèm ảnh**: Chụp ảnh tình trạng thiết bị trực tiếp từ camera khi bàn giao/nhận lại.
- **Haptic Feedback**: Phản hồi rung khi quét mã thành công hoặc có thông báo quan trọng.
- **Quản lý yêu cầu**: Theo dõi trạng thái các đơn mượn cá nhân.

## 🛠 Tech Stack

- **Framework**: [Expo](https://expo.dev/) (v54) / React Native
- **Router**: Expo Router (File-based navigation)
- **Styling**: NativeWind (Tailwind CSS v4)
- **State Management**: Zustand
- **UI Components**: @ant-design/react-native, expo-symbols
- **Data Fetching**: Axios

## 📋 Yêu cầu hệ thống

- **Node.js**: v20 hoặc mới hơn
- **Expo Go App**: Cài đặt trên điện thoại (Android/iOS) để test nhanh.

## 🛠 Hướng dẫn cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd frontendApp
```

### 2. Cài đặt dependency
```bash
npm install
```

### 3. Thiết lập biến môi trường
Tạo file `.env` hoặc cấu hình biến:
```bash
# URL của Backend API (Sử dụng IP LAN nếu test trên thiết bị thật)
EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3000/v1
```
*Ghi chú: Ứng dụng có cơ chế tự động phát hiện IP máy chủ (Debugger Host) nếu bạn không cấu hình biến này.*

### 4. Chạy ứng dụng
```bash
npm run dev
```

### 5. Kết nối thiết bị
- Quét mã QR hiện trên terminal bằng ứng dụng **Expo Go** (Android) hoặc **Camera** (iOS).
- Đảm bảo điện thoại và máy tính cùng kết nối vào một mạng Wi-Fi.

## 📂 Cấu trúc thư mục chính

```
app/
├── (tabs)/         # Các màn hình chính (Trang chủ, Khám phá)
├── equipment/      # Chi tiết thiết bị & Đăng ký mượn (Calendar)
├── scan.tsx        # Màn hình quét mã QR & Check-in/Check-out
├── login.tsx       # Đăng nhập
└── my-loans.tsx    # Lịch sử mượn cá nhân
components/
└── ui/             # Các UI components dùng chung (Button, Badge, etc.)
src/
├── api/            # Cấu hình Axios Client
├── constants/      # Cấu hình IP, màu sắc hệ thống
└── store/          # Zustand Auth Store
```

## 📜 Lưu ý
Mặc định ứng dụng sẽ kết nối tới `http://localhost:3000/v1`. Nếu chạy trên emulator Android, có thể cần đổi sang `http://10.0.2.2:3000/v1` hoặc IP thực tế của máy tính.
