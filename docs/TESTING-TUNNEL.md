# Testing Tunnel Setup

## Đã sửa gì?

### 1. Sửa fallback URL trong api.ts
```typescript
// TRƯỚC:
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// SAU:
const API_URL = process.env.REACT_APP_API_URL || '/api';
```

Bây giờ ngay cả khi environment variable không được set, API vẫn sẽ dùng relative path `/api` thay vì hardcode `http://localhost:5000/api`.

### 2. Rebuild frontend hoàn toàn
```bash
docker-compose down frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

Webpack đã compile lại với code mới.

## Kiểm tra trên Local

### 1. Test API health
```bash
curl http://localhost/api/health
```

Kết quả mong đợi:
```json
{"status":"ok"}
```

### 2. Mở browser
```
http://localhost
```

### 3. Mở Developer Tools → Network tab

### 4. Login với tài khoản demo
- Username: `demo`
- Password: `admin123`

### 5. Kiểm tra Network tab
Tất cả các API calls nên đi tới:
- ✅ `http://localhost/api/auth/login`
- ✅ `http://localhost/api/transactions`
- ✅ `http://localhost/api/budgets`

KHÔNG nên thấy:
- ❌ `http://localhost:5000/api/...`

## Kiểm tra qua Tunnel Domain

**Sau khi setup Cloudflare Tunnel:**

### 1. Mở browser
```
https://budget.roger.works
```

### 2. Mở Developer Tools → Network tab

### 3. Login với tài khoản demo

### 4. Kiểm tra Network tab
Tất cả các API calls nên đi tới:
- ✅ `https://budget.roger.works/api/auth/login`
- ✅ `https://budget.roger.works/api/transactions`
- ✅ `https://budget.roger.works/api/budgets`

KHÔNG nên thấy:
- ❌ `http://localhost:5000/api/...`
- ❌ `http://localhost/api/...`

### 5. Kiểm tra CORS headers
Trong Response Headers của API calls, nên thấy:
```
Access-Control-Allow-Origin: https://budget.roger.works
Access-Control-Allow-Credentials: true
```

## Các vấn đề có thể gặp

### Vẫn thấy localhost:5000

**Nguyên nhân:** Browser cache

**Giải pháp:**
1. Mở Devtools
2. Right-click vào Reload button
3. Chọn "Empty Cache and Hard Reload"
4. Hoặc dùng Incognito/Private mode

### CORS errors

**Nguyên nhân:** Domain chưa được thêm vào allowedOrigins

**Giải pháp:** Kiểm tra `backend/config/security.js`:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost',
  'https://budget.roger.works',  // ← Phải có dòng này
  'http://budget.roger.works'
];
```

### 502 Bad Gateway

**Nguyên nhân:** Nginx không connect được tới backend/frontend

**Giải pháp:**
```bash
# Kiểm tra logs
docker-compose logs nginx
docker-compose logs backend
docker-compose logs frontend

# Restart tất cả services
docker-compose restart
```

## Setup Cloudflare Tunnel

Xem hướng dẫn chi tiết trong [TUNNEL-SETUP.md](./TUNNEL-SETUP.md)

### Quick start:

```bash
# 1. Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# 2. Login
cloudflared tunnel login

# 3. Create tunnel
cloudflared tunnel create budget-app

# 4. Configure tunnel
nano ~/.cloudflared/config.yml
```

Paste config:
```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/roger/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: budget.roger.works
    service: http://localhost:80
  - service: http_status:404
```

```bash
# 5. Route DNS
cloudflared tunnel route dns budget-app budget.roger.works

# 6. Start tunnel
cloudflared tunnel run budget-app
```

## Monitoring

### Kiểm tra logs real-time
```bash
# All services
docker-compose logs -f

# Chỉ nginx
docker-compose logs -f nginx

# Chỉ backend
docker-compose logs -f backend

# Chỉ frontend
docker-compose logs -f frontend
```

### Kiểm tra health
```bash
# Nginx health
curl http://localhost/health

# Backend health
curl http://localhost/api/health

# Frontend (HTML response)
curl http://localhost/
```

### Kiểm tra Docker stats
```bash
docker stats budget-manager-nginx budget-manager-backend budget-manager-frontend
```

## Kiểm tra AI features

1. Login vào app
2. Vào trang **AI Chat**
3. Click "Cài đặt AI"
4. Nhập API key (Gemini hoặc OpenAI)
5. Chọn model
6. Thử chat hoặc "Tạo kế hoạch chi tiêu"

Kiểm tra Network tab để đảm bảo:
- POST `/api/ai/chat` → 200 OK
- POST `/api/ai/generate-budget-plan` → 200 OK

## Success Criteria

✅ App accessible qua http://localhost
✅ App accessible qua https://budget.roger.works (sau khi setup tunnel)
✅ Tất cả API calls dùng relative path `/api`
✅ Không có hardcoded `localhost:5000`
✅ CORS headers đúng
✅ Login thành công
✅ AI features hoạt động
✅ Không có CORS errors trong console
✅ Nginx proxy routes correctly
