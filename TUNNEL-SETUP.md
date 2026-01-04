# Hướng Dẫn Tunnel Domain vào Máy Local

## Tổng Quan

Ứng dụng đã được cấu hình nginx reverse proxy để có thể truy cập qua domain `https://budget.roger.works/`. Bạn cần tunnel domain này vào máy local để sử dụng.

## Kiến Trúc

```
Internet (budget.roger.works)
    ↓
Cloudflare Tunnel / Ngrok
    ↓
Nginx Proxy (localhost:80)
    ├─→ Frontend (container:3000)
    └─→ Backend API (container:5000)
```

## Khởi Động Ứng Dụng

```bash
# Start tất cả services (bao gồm nginx proxy)
docker-compose up -d

# Kiểm tra nginx đã chạy
docker-compose ps nginx

# Test nginx locally
curl http://localhost/health
# Expected: OK
```

## Các Phương Pháp Tunnel

### Phương Pháp 1: Cloudflare Tunnel (Khuyến Nghị)

**Ưu điểm:**
- ✅ Miễn phí
- ✅ HTTPS tự động
- ✅ Không cần mở port firewall
- ✅ DDoS protection
- ✅ Ổn định, production-ready

**Cách Setup:**

#### 1. Cài đặt cloudflared

**Linux:**
```bash
# Download
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# Install
sudo dpkg -i cloudflared-linux-amd64.deb

# Verify
cloudflared --version
```

**macOS:**
```bash
brew install cloudflared
```

#### 2. Login vào Cloudflare

```bash
cloudflared tunnel login
```
- Browser sẽ mở, chọn domain `roger.works`

#### 3. Tạo tunnel

```bash
# Create tunnel
cloudflared tunnel create budget-app

# Tunnel UUID sẽ được tạo ra (lưu lại)
```

#### 4. Cấu hình tunnel

Tạo file `~/.cloudflared/config.yml`:

```yaml
url: http://localhost:80
tunnel: <TUNNEL_UUID>
credentials-file: /home/roger/.cloudflared/<TUNNEL_UUID>.json
```

Thay `<TUNNEL_UUID>` bằng UUID từ bước 3.

#### 5. Tạo DNS record

```bash
cloudflared tunnel route dns budget-app budget.roger.works
```

#### 6. Chạy tunnel

```bash
# Foreground (test)
cloudflared tunnel run budget-app

# Background (production)
cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

#### 7. Kiểm tra

Truy cập: https://budget.roger.works

---

### Phương Pháp 2: Ngrok

**Ưu điểm:**
- ✅ Setup nhanh (1 lệnh)
- ✅ Có Web UI inspect requests

**Nhược điểm:**
- ⚠️ Free tier: URL ngẫu nhiên mỗi lần restart
- ⚠️ Cần trả phí để custom domain

**Cách Setup:**

#### 1. Cài đặt ngrok

```bash
# Linux
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# macOS
brew install ngrok
```

#### 2. Đăng ký account

- Truy cập: https://dashboard.ngrok.com/signup
- Lấy auth token

#### 3. Authenticate

```bash
ngrok config add-authtoken <YOUR_TOKEN>
```

#### 4. Chạy tunnel

**Free tier (URL ngẫu nhiên):**
```bash
ngrok http 80
```

**Paid tier (custom domain):**
```bash
ngrok http --domain=budget.roger.works 80
```

#### 5. Kiểm tra

Ngrok sẽ hiển thị URL, ví dụ:
```
Forwarding: https://abc123.ngrok.io -> http://localhost:80
```

---

### Phương Pháp 3: Localtunnel

**Ưu điểm:**
- ✅ Hoàn toàn miễn phí
- ✅ Không cần đăng ký

**Nhược điểm:**
- ⚠️ Không ổn định như Cloudflare
- ⚠️ Không custom domain

**Cách Setup:**

```bash
# Install
npm install -g localtunnel

# Run
lt --port 80 --subdomain budget-roger

# Access at:
# https://budget-roger.loca.lt
```

---

## Cấu Hình CORS (Nếu Cần)

Nếu gặp lỗi CORS khi dùng tunnel, cập nhật backend:

**File: `backend/server.js`**

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://budget.roger.works'
  ],
  credentials: true
}));
```

Restart backend:
```bash
docker-compose restart backend
```

## Troubleshooting

### Lỗi 502 Bad Gateway

**Nguyên nhân:** Nginx không connect được tới frontend/backend

**Giải pháp:**
```bash
# Check containers
docker-compose ps

# Check nginx logs
docker-compose logs nginx

# Check network
docker network inspect budget-manager_budget-manager-network
```

### Frontend không load

**Nguyên nhân:** REACT_APP_API_URL sai

**Giải pháp:**
```bash
# Rebuild frontend
docker-compose up -d --build frontend
```

### API calls fail

**Nguyên nhân:** Backend CORS hoặc routing

**Kiểm tra:**
```bash
# Test backend directly
curl http://localhost/api/health

# Check backend logs
docker-compose logs backend
```

### Cloudflare tunnel không connect

**Giải pháp:**
```bash
# Check tunnel status
cloudflared tunnel info budget-app

# Check cloudflared logs
sudo journalctl -u cloudflared -f

# Restart tunnel
sudo systemctl restart cloudflared
```

## Monitoring

### Check Nginx Access Logs

```bash
docker-compose logs -f nginx
```

### Check Real-time Requests

```bash
# Nginx access log
docker exec budget-manager-nginx tail -f /var/log/nginx/access.log

# Nginx error log
docker exec budget-manager-nginx tail -f /var/log/nginx/error.log
```

### Health Check

```bash
# Local
curl http://localhost/health

# Tunnel
curl https://budget.roger.works/health
```

## Bảo Mật

### 1. Rate Limiting (Nginx)

Thêm vào `nginx/nginx.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api {
    limit_req zone=api burst=20 nodelay;
    # ... existing config
}
```

### 2. Basic Auth (Nếu cần)

```bash
# Generate password file
docker exec -it budget-manager-nginx sh
apk add apache2-utils
htpasswd -c /etc/nginx/.htpasswd admin
exit
```

Update `nginx.conf`:
```nginx
location / {
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    # ... existing config
}
```

### 3. SSL/TLS

Cloudflare Tunnel tự động cung cấp HTTPS. Không cần cấu hình SSL manually.

## Production Checklist

- [ ] Cloudflare Tunnel đã cài đặt và running
- [ ] DNS record đã tạo (`budget.roger.works`)
- [ ] Tunnel service auto-start: `systemctl enable cloudflared`
- [ ] Nginx health check: `curl http://localhost/health`
- [ ] Frontend accessible: `https://budget.roger.works`
- [ ] API accessible: `https://budget.roger.works/api/health`
- [ ] CORS configured correctly
- [ ] Environment variables set properly
- [ ] Docker containers auto-restart: `restart: unless-stopped`

## Tắt Tunnel

### Cloudflare
```bash
sudo systemctl stop cloudflared
```

### Ngrok
```bash
# Ctrl+C trong terminal đang chạy ngrok
```

### Tắt tất cả services
```bash
docker-compose down
```

## Khởi động lại toàn bộ

```bash
# 1. Start Docker services
docker-compose up -d

# 2. Start Cloudflare tunnel
sudo systemctl start cloudflared

# 3. Verify
curl https://budget.roger.works/health
```

---

**Khuyến nghị:** Sử dụng **Cloudflare Tunnel** cho production vì ổn định, bảo mật và miễn phí.
