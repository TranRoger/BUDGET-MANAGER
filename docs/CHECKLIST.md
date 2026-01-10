# Budget Manager - Setup Checklist

## ✅ Checklist để khởi động dự án

### 1. Prerequisites
- [ ] Node.js 18+ đã cài đặt
- [ ] PostgreSQL 15+ đã cài đặt (nếu không dùng Docker)
- [ ] Docker & Docker Compose đã cài đặt (nếu dùng Docker)
- [ ] Git đã cài đặt
- [ ] Google Cloud account (cho AI features)

### 2. Google Cloud Setup (Bắt buộc cho AI)
- [ ] Tạo Google Cloud project
- [ ] Enable Vertex AI API
- [ ] Tạo service account
- [ ] Grant quyền `roles/aiplatform.user`
- [ ] Download service account key
- [ ] Tạo folder `credentials/`
- [ ] Copy key vào `credentials/service-account-key.json`

### 3. Backend Configuration
- [ ] `cd backend`
- [ ] Copy `.env.example` thành `.env`
- [ ] Cập nhật `GOOGLE_CLOUD_PROJECT_ID`
- [ ] Tạo JWT secret mới (random string)
- [ ] Cập nhật database credentials (nếu cần)
- [ ] `npm install` (nếu setup manual)

### 4. Frontend Configuration
- [ ] `cd frontend`
- [ ] Tạo file `.env`
- [ ] Thêm `REACT_APP_API_URL=http://localhost:5000/api`
- [ ] `npm install` (nếu setup manual)

### 5. Database Setup (Nếu không dùng Docker)
- [ ] `createdb budget_manager`
- [ ] `psql -d budget_manager -f database/schema.sql`
- [ ] `psql -d budget_manager -f database/seed.sql` (optional)

### 6. Khởi động ứng dụng

#### Option A: Docker
- [ ] `chmod +x start.sh`
- [ ] `./start.sh`
- [ ] Đợi containers khởi động
- [ ] Kiểm tra `docker-compose ps`

#### Option B: Manual
- [ ] `chmod +x setup-manual.sh`
- [ ] `./setup-manual.sh`
- [ ] Terminal 1: `cd backend && npm run dev`
- [ ] Terminal 2: `cd frontend && npm start`

### 7. Verification
- [ ] Frontend mở được: http://localhost:3000
- [ ] Backend API hoạt động: http://localhost:5000/api/health
- [ ] Database kết nối thành công
- [ ] Không có error trong console

### 8. Testing
- [ ] Test đăng ký user mới
- [ ] Test đăng nhập
- [ ] Test tạo transaction
- [ ] Test tạo budget
- [ ] Test AI features (nếu có credentials)

### 9. Development
- [ ] Đọc CONTRIBUTING.md
- [ ] Đọc API.md
- [ ] Setup Git
- [ ] Tạo `.gitignore` entries nếu cần
- [ ] Commit initial setup

### 10. Optional Enhancements
- [ ] Thêm UI library (Material-UI/Ant Design)
- [ ] Thêm React Router
- [ ] Thêm state management (Redux)
- [ ] Thêm charts library (Recharts/Chart.js)
- [ ] Thêm form validation (React Hook Form)
- [ ] Setup ESLint & Prettier
- [ ] Setup CI/CD
- [ ] Setup testing framework

## 🚨 Common Issues

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Database connection failed
```bash
# Check PostgreSQL is running
pg_isready

# Restart PostgreSQL
brew services restart postgresql  # macOS
sudo service postgresql restart   # Linux
```

### Docker issues
```bash
# Stop all containers
docker-compose down

# Remove volumes and restart
docker-compose down -v
docker-compose up --build
```

### Google Cloud authentication failed
- Verify credentials file path
- Check service account permissions
- Verify API is enabled
- Check project ID is correct

### npm install fails
```bash
# Clear cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📋 Quick Commands

### Docker Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build
```

### Development Commands
```bash
# Backend
cd backend
npm run dev        # Start with nodemon
npm test          # Run tests

# Frontend
cd frontend
npm start         # Start dev server
npm test          # Run tests
npm run build     # Production build
```

### Database Commands
```bash
# Connect to database
psql -d budget_manager

# Run migrations
psql -d budget_manager -f database/schema.sql

# Reset database
dropdb budget_manager
createdb budget_manager
psql -d budget_manager -f database/schema.sql
psql -d budget_manager -f database/seed.sql
```

## ✅ Setup Complete!

Khi tất cả checkboxes đã được đánh dấu, dự án của bạn đã sẵn sàng để phát triển!

**Next Steps:**
1. Đọc API documentation (API.md)
2. Xem project structure (PROJECT-SUMMARY.md)
3. Bắt đầu code!

Happy coding! 🎉
