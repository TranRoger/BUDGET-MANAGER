# 🚀 Hướng Dẫn Đăng Nhập và Sử Dụng Hệ Thống

## 1️⃣ Đăng Nhập Lần Đầu

### Truy cập ứng dụng
```
http://localhost:3000
```

Bạn sẽ tự động được chuyển đến trang đăng nhập.

### Thông tin đăng nhập Admin mặc định

**Email:** `admin@budget.com`  
**Mật khẩu:** `admin123`

> ⚠️ **QUAN TRỌNG:** Đổi mật khẩu admin ngay sau lần đăng nhập đầu tiên!

## 2️⃣ Sau Khi Đăng Nhập Thành Công

### Bạn sẽ thấy:
- ✅ Icon 👑 bên cạnh tên của bạn trong navbar (chứng tỏ bạn là admin)
- ✅ Menu "👑 Quản Lý User" trên thanh điều hướng
- ✅ Trang Dashboard với dữ liệu tài chính của bạn
- ✅ Kế hoạch chi tiêu cũ sẽ tự động được load (nếu có)

### Nếu không thấy nút "Quản Lý User":
1. Kiểm tra xem có icon 👑 bên cạnh tên không
2. Làm mới trang (F5)
3. Đăng xuất và đăng nhập lại

## 3️⃣ Tạo User Mới (Dành Cho Admin)

1. Nhấn vào **"👑 Quản Lý User"** trên navbar
2. Nhấn nút **"➕ Tạo User Mới"**
3. Điền thông tin:
   - **Email:** email@example.com
   - **Tên:** Nguyễn Văn A
   - **Mật Khẩu:** Tối thiểu 6 ký tự
   - **Role:** Chọn `User` hoặc `Admin`
4. Nhấn **"➕ Tạo User"**

## 4️⃣ Đổi Mật Khẩu Admin

1. Vào **"👑 Quản Lý User"**
2. Tìm tài khoản `admin@budget.com`
3. Nhấn nút **✏️** (Chỉnh sửa)
4. Nhập mật khẩu mới (để trống các field khác nếu không muốn thay đổi)
5. Nhấn **"💾 Lưu Thay Đổi"**

## 5️⃣ Quản Lý Kế Hoạch Chi Tiêu

### Nếu chưa có kế hoạch:
1. Trên trang Dashboard, điền:
   - **Thu nhập hàng tháng:** Số tiền VNĐ
   - **Kế hoạch đến ngày:** Chọn ngày kết thúc
   - **Ghi chú:** (Optional) Mô tả mục tiêu của bạn
2. Nhấn **"✨ Tạo Kế Hoạch Mới"**
3. AI sẽ phân tích dữ liệu và tạo kế hoạch chi tiết

### Nếu đã có kế hoạch:
- Kế hoạch cũ sẽ tự động hiển thị khi bạn đăng nhập
- Nhấn **"🔄 Cập Nhật Kế Hoạch"** để điều chỉnh
- Nhập yêu cầu cập nhật (VD: "Tăng ngân sách ăn uống lên 20%")
- AI sẽ cập nhật kế hoạch dựa trên ngữ cảnh cũ

## 6️⃣ Các Tính Năng Khác

### Quản lý giao dịch
- **Menu "Giao Dịch"** → Thêm, sửa, xóa các giao dịch
- Phân loại theo: Thu nhập, Chi tiêu, Tiết kiệm

### Ngân sách
- **Menu "Ngân Sách"** → Tạo và theo dõi ngân sách theo danh mục
- Cảnh báo khi vượt ngưỡng

### Báo cáo
- **Menu "Báo Cáo"** → Xem biểu đồ chi tiêu theo thời gian
- Phân tích xu hướng

## 🔒 Bảo Mật

### Phân quyền:
- **Admin:** Quản lý users, truy cập tất cả tính năng
- **User:** Chỉ quản lý dữ liệu cá nhân, không thể tạo user mới

### Đăng ký công khai đã bị TẮT:
- Người dùng không thể tự đăng ký
- Chỉ admin mới có thể tạo tài khoản

### Token JWT:
- Hết hạn sau 24 giờ
- Tự động đăng xuất khi token hết hạn

## ❓ Troubleshooting

### Không load được kế hoạch cũ?
✅ Giờ đã fix! Hệ thống authentication mới sẽ:
- Tự động load plan khi đăng nhập
- Gắn plan với user ID từ JWT token

### Không thấy nút "Quản Lý User"?
- Đảm bảo đăng nhập với tài khoản admin
- Refresh trang (F5)
- Kiểm tra xem có icon 👑 bên cạnh tên không

### Lỗi 401 khi gọi API?
- Token có thể đã hết hạn → Đăng xuất và đăng nhập lại
- Xóa localStorage và đăng nhập lại

### Quên mật khẩu admin?
Chạy lệnh này để reset:
```bash
docker exec -it budget-manager-db psql -U postgres -d budget_manager -c "UPDATE users SET password = '\$2b\$10\$kGz9s1q3vX7QH9KJlH8LIeJ3Y7rF8J2LqH8kL9vX8H9KJlH8LIeJ3Y' WHERE email = 'admin@budget.com';"
```
Mật khẩu mới sẽ là: `admin123`

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra logs:
```bash
# Backend logs
docker logs budget-manager-backend --tail 50

# Frontend logs  
docker logs budget-manager-frontend --tail 50

# Database logs
docker logs budget-manager-db --tail 50
```
