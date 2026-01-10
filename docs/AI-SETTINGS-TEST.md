# Quick Test Guide - AI Settings Feature

## Prerequisites
- ✅ All Docker containers running (backend, frontend, postgres)
- ✅ User account created (e.g., demo@example.com)
- ✅ Browser ready at http://localhost:3000

## Test Steps

### 1. Access Settings Page

1. Login at http://localhost:3000/login
2. Click **⚙️ Cài Đặt** in navigation bar
3. **Expected:** Settings page loads with empty form

### 2. Get Google AI API Key

1. Open new tab: https://aistudio.google.com/app/apikey
2. Login with Google account
3. Click **"Get API key"** or **"Create API key"**
4. Copy the API key (starts with `AIzaSy...`)

### 3. Configure Settings

1. Paste API key into **"Google AI API Key"** field
2. Click 👁️ icon to verify key is pasted correctly
3. Select a model from dropdown:
   - `gemini-2.0-flash-exp` (recommended)
   - `gemini-1.5-flash`
   - `gemini-1.5-pro`
4. Click **"Kiểm Tra Kết Nối"** button
5. **Expected:** Green success message "API key hợp lệ và hoạt động tốt!"

### 4. Save Settings

1. Click **"Lưu Cài Đặt"** button
2. **Expected:** Green success message "Đã cập nhật cài đặt AI"
3. Refresh page
4. **Expected:** Form still shows your API key (masked) and selected model

### 5. Test AI Features

1. Navigate to **📊 Tổng Quan** (Dashboard)
2. Scroll to "Kế Hoạch Chi Tiêu Thông Minh"
3. Enter:
   - Thu nhập hàng tháng: `10000000`
   - Ngày mục tiêu: (select a future date)
   - Ghi chú: `Test plan`
4. Click **"Tạo Kế Hoạch"** button
5. **Expected:** Plan generated successfully using YOUR API key

### 6. Verify User-Specific API Key

#### Test with Multiple Users

**User 1:**
1. Login as demo@example.com
2. Configure API key A
3. Generate plan → Should use API key A

**User 2:**
1. Login as admin@budget.com
2. Configure API key B
3. Generate plan → Should use API key B

**Expected:** Each user uses their own API key independently

## Backend Verification

### Check Database

```bash
docker exec -it budget-manager-db psql -U budget -d budget_db -c "SELECT email, ai_model, LENGTH(ai_api_key) as key_length FROM users;"
```

**Expected Output:**
```
      email        |      ai_model       | key_length
-------------------+---------------------+-----------
 demo@example.com  | gemini-2.0-flash-exp|     39
 admin@budget.com  | gemini-1.5-flash    |     39
```

### Check Backend Logs

```bash
docker-compose logs backend | grep "ai_api_key\|ai_model"
```

**Expected:** No plain API keys in logs (security check)

## Error Handling Tests

### Test Invalid API Key

1. Go to Settings
2. Enter invalid key: `invalid-key-123`
3. Click **"Kiểm Tra Kết Nối"**
4. **Expected:** Red error message

### Test Empty API Key

1. Clear API key field
2. Try to generate plan on Dashboard
3. **Expected:** Error message "No API key configured. Please set your API key in Settings."

### Test Quota Exceeded

1. Make 1,500+ requests in one day (for gemini-2.0-flash-exp)
2. **Expected:** Error from Google AI about quota

## API Endpoint Tests

### GET /api/auth/settings

```bash
# Get JWT token first (login)
TOKEN="your-jwt-token"

curl -X GET http://localhost:5000/api/auth/settings \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "aiApiKey": "AIzaSy...",
  "aiModel": "gemini-2.0-flash-exp"
}
```

### PUT /api/auth/settings

```bash
TOKEN="your-jwt-token"

curl -X PUT http://localhost:5000/api/auth/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "aiApiKey": "AIzaSyNewKey...",
    "aiModel": "gemini-1.5-flash"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Đã cập nhật cài đặt AI"
}
```

### POST /api/auth/test-ai-key

```bash
TOKEN="your-jwt-token"

curl -X POST http://localhost:5000/api/auth/test-ai-key \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "aiApiKey": "AIzaSy...",
    "aiModel": "gemini-2.0-flash-exp"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "API key hợp lệ và hoạt động tốt!"
}
```

**Expected Response (Fail):**
```json
{
  "message": "API key không hợp lệ hoặc có lỗi: ..."
}
```

## Checklist

- [ ] Settings page loads correctly
- [ ] API key input shows/hides with 👁️ button
- [ ] Model dropdown shows 3 options
- [ ] Test connection validates API key
- [ ] Save settings updates database
- [ ] Settings persist after refresh
- [ ] Dashboard generates plan with user's API key
- [ ] Different users use different API keys
- [ ] Invalid API key shows error
- [ ] Empty API key shows error
- [ ] Backend logs don't expose API keys
- [ ] GET /api/auth/settings works
- [ ] PUT /api/auth/settings works
- [ ] POST /api/auth/test-ai-key works

## Troubleshooting

### Settings page shows blank

**Check:**
```bash
docker-compose logs frontend | grep Settings
```

**Fix:** Rebuild frontend
```bash
docker-compose restart frontend
```

### Test connection always fails

**Check backend logs:**
```bash
docker-compose logs backend --tail 50
```

**Common issues:**
- API key format wrong
- Network blocked to Google AI servers
- Google AI API not enabled for account

### Plans still use system API key

**Check aiService.js:**
```bash
docker exec -it budget-manager-backend cat /app/services/aiService.js | grep getUserAIConfig
```

**Expected:** Should see `getUserAIConfig` function calls

**Fix:** Restart backend
```bash
docker-compose restart backend
```

## Success Criteria

✅ All checklist items pass  
✅ No errors in browser console  
✅ No errors in backend logs  
✅ Each user has independent AI quota  
✅ System works without system API key  
✅ Fallback to system key works if user hasn't configured

---

**Test Date:** _______  
**Tester:** _______  
**Result:** ⬜ Pass  ⬜ Fail  
**Notes:** _______
