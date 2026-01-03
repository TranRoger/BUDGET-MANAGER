# 🚀 QUICK START - Budget Manager

## Bắt đầu nhanh trong 3 bước!

### Bước 1: Chuẩn bị Google Cloud Credentials

```bash
# Tạo thư mục credentials
mkdir -p credentials

# Đặt file service-account-key.json vào đây
# (Download từ Google Cloud Console)
```

### Bước 2: Cấu hình môi trường

```bash
# Backend
cd backend
cp .env.example .env

# Chỉnh sửa backend/.env:
# - GOOGLE_CLOUD_PROJECT_ID=your-project-id
# - JWT_SECRET=random-strong-string-here
```

### Bước 3: Khởi động!

**Chọn 1 trong 2 cách:**

#### Cách 1: Docker (Dễ nhất)
```bash
./start.sh
```

#### Cách 2: Manual
```bash
./setup-manual.sh

# Sau đó mở 2 terminals:
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm start
```

### ✅ Xong!

Truy cập:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Database**: localhost:5432

---

## 📚 Đọc thêm

- **Chi tiết setup**: [SETUP.md](SETUP.md)
- **API docs**: [API.md](API.md)
- **Checklist đầy đủ**: [CHECKLIST.md](CHECKLIST.md)
- **Tổng quan dự án**: [PROJECT-SUMMARY.md](PROJECT-SUMMARY.md)

## ⚠️ Lưu ý quan trọng

1. **Node.js 18+** required
2. **PostgreSQL 15+** required (nếu không dùng Docker)
3. **Google Cloud credentials** cần thiết cho AI features
4. **Đổi JWT_SECRET** trong production

## 🆘 Gặp vấn đề?

Xem [CHECKLIST.md](CHECKLIST.md) phần "Common Issues"

Hoặc tạo issue trên GitHub!

---

**Happy Coding!** 🎉
