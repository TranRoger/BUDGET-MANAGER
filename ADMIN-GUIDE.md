# 👑 Hướng Dẫn Quản Lý Admin

## Thông Tin Tài Khoản Admin Mặc Định

**Email:** `admin@budget.com`  
**Mật khẩu:** `admin123`

⚠️ **QUAN TRỌNG:** Đổi mật khẩu admin ngay sau khi triển khai production!

## Tính Năng Admin

### 1. Đăng Nhập Hệ Thống
- Truy cập: `http://localhost:3000/login`
- Nhập email và mật khẩu admin
- Sau khi đăng nhập, biểu tượng 👑 sẽ hiện bên cạnh tên của bạn

### 2. Quản Lý User
- Truy cập: Nhấn vào **"👑 Quản Lý User"** trên thanh điều hướng (chỉ hiện với admin)
- URL: `http://localhost:3000/admin/users`

#### Tạo User Mới
1. Nhấn nút **"➕ Tạo User Mới"**
2. Điền thông tin:
   - Email (bắt buộc)
   - Tên (bắt buộc)
   - Mật khẩu (tối thiểu 6 ký tự)
   - Role: User hoặc Admin
3. Nhấn **"➕ Tạo User"**

#### Chỉnh Sửa User
1. Nhấn nút **✏️** bên cạnh user muốn chỉnh sửa
2. Cập nhật thông tin (mật khẩu để trống nếu không đổi)
3. Nhấn **"💾 Lưu Thay Đổi"**

#### Xóa User
1. Nhấn nút **🗑️** bên cạnh user muốn xóa
2. Xác nhận xóa trong hộp thoại
3. **Lưu ý:** Không thể tự xóa tài khoản đang đăng nhập

## Phân Quyền

### Admin
- ✅ Tạo, sửa, xóa users
- ✅ Quản lý toàn bộ dữ liệu ngân sách
- ✅ Truy cập trang quản lý admin

### User
- ✅ Quản lý dữ liệu ngân sách cá nhân
- ❌ Không thể tạo tài khoản mới
- ❌ Không thể truy cập trang quản lý user

## Bảo Mật

### Thay Đổi Mật Khẩu Admin
1. Đăng nhập với tài khoản admin
2. Vào **"👑 Quản Lý User"**
3. Nhấn **✏️** bên cạnh tài khoản admin
4. Nhập mật khẩu mới
5. Nhấn **"💾 Lưu Thay Đổi"**

### Đăng Ký Công Khai Đã BỊ TẮT
- Người dùng không thể tự đăng ký
- Chỉ admin mới có thể tạo tài khoản mới
- Trang đăng ký đã bị xóa khỏi hệ thống

## Migration Database

File migration đã được chạy tự động: `database/add-roles.sql`

Nếu cần chạy lại thủ công:
```bash
docker exec -i budget-manager-db psql -U postgres -d budget_manager < database/add-roles.sql
```

## Kiểm Tra Hệ Thống

### 1. Kiểm tra tài khoản admin có tồn tại
```sql
docker exec -it budget-manager-db psql -U postgres -d budget_manager -c "SELECT id, email, name, role FROM users WHERE role='admin';"
```

### 2. Xem danh sách tất cả users
```sql
docker exec -it budget-manager-db psql -U postgres -d budget_manager -c "SELECT id, email, name, role, created_at FROM users;"
```

## Troubleshooting

### Lỗi 403 khi truy cập trang admin
- Đảm bảo đang đăng nhập với tài khoản admin
- Kiểm tra role trong database
- Đăng xuất và đăng nhập lại

### Không thể tạo user mới
- Kiểm tra email đã tồn tại chưa
- Đảm bảo mật khẩu có ít nhất 6 ký tự
- Kiểm tra logs backend: `docker logs budget-manager-backend`

### Link "Quản Lý User" không hiện
- Đảm bảo tài khoản có role = 'admin'
- Refresh lại trang
- Kiểm tra JWT token có chứa role:
  ```javascript
  console.log(JSON.parse(atob(localStorage.getItem('token').split('.')[1])))
  ```

## API Endpoints (Admin Only)

### GET /api/auth/admin/users
Lấy danh sách tất cả users

### POST /api/auth/admin/users
Tạo user mới
```json
{
  "email": "user@example.com",
  "name": "Nguyễn Văn A",
  "password": "password123",
  "role": "user"
}
```

### PUT /api/auth/admin/users/:id
Cập nhật user
```json
{
  "email": "newemail@example.com",
  "name": "Tên Mới",
  "password": "newpassword",
  "role": "admin"
}
```

### DELETE /api/auth/admin/users/:id
Xóa user (không thể tự xóa)
