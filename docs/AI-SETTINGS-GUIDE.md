# Hướng Dẫn Cài Đặt API Key Google AI

## Tổng Quan

Ứng dụng cho phép mỗi người dùng cấu hình API key riêng của Google AI để sử dụng các tính năng AI như:
- 🤖 Trợ lý AI tư vấn tài chính
- 📊 Tạo kế hoạch chi tiêu thông minh
- 💡 Phân tích và đề xuất cải thiện tài chính

## Lợi Ích

✅ **Miễn phí**: Mỗi người dùng có quota riêng (không chia sẻ)  
✅ **Linh hoạt**: Tự chọn model phù hợp với nhu cầu  
✅ **Bảo mật**: API key được lưu riêng cho từng tài khoản  
✅ **Không phụ thuộc**: Không cần chờ admin cung cấp

## Cách Lấy API Key

### Bước 1: Truy cập Google AI Studio
1. Mở trình duyệt và truy cập: https://aistudio.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google của bạn

### Bước 2: Tạo API Key
1. Nhấn nút **"Get API key"** hoặc **"Create API key"**
2. Chọn Google Cloud Project (hoặc tạo mới nếu chưa có)
3. Sao chép API key (dạng `AIzaSy...`)
4. ⚠️ **LƯU Ý**: Giữ API key bí mật, không chia sẻ

### Bước 3: Cấu hình trong Ứng dụng
1. Đăng nhập vào ứng dụng Quản Lý Ngân Sách
2. Nhấn vào menu **⚙️ Cài Đặt**
3. Dán API key vào ô **"Google AI API Key"**
4. Chọn model phù hợp (xem bảng so sánh bên dưới)
5. Nhấn **"Kiểm Tra Kết Nối"** để xác thực
6. Nếu thành công, nhấn **"Lưu Cài Đặt"**

## So Sánh Các Model

| Model | Tốc Độ | Chất Lượng | Phù Hợp Cho |
|-------|--------|------------|-------------|
| **gemini-2.0-flash-exp** | ⚡⚡⚡ Rất nhanh | ⭐⭐⭐ Tốt | Sử dụng hàng ngày, phân tích nhanh |
| **gemini-1.5-flash** | ⚡⚡ Nhanh | ⭐⭐⭐⭐ Rất tốt | Cân bằng giữa tốc độ và chất lượng |
| **gemini-1.5-pro** | ⚡ Trung bình | ⭐⭐⭐⭐⭐ Xuất sắc | Phân tích sâu, kế hoạch phức tạp |

### Khuyến Nghị

- **Người dùng thông thường**: `gemini-2.0-flash-exp` (mặc định)
- **Cần phân tích chi tiết**: `gemini-1.5-flash`
- **Tài chính phức tạp**: `gemini-1.5-pro`

## Quota và Giới Hạn

### Free Tier (Miễn phí)

Google AI cung cấp quota miễn phí hào phóng:

- **Gemini 2.0 Flash**: 1,500 requests/ngày, 1 triệu tokens/ngày
- **Gemini 1.5 Flash**: 1,500 requests/ngày, 1 triệu tokens/ngày
- **Gemini 1.5 Pro**: 50 requests/ngày, 32,000 tokens/ngày

### Lưu Ý
- Quota được reset hàng ngày
- Nếu vượt quota, cần chờ đến ngày hôm sau
- Có thể nâng cấp lên plan trả phí nếu cần quota cao hơn

## Bảo Mật

### Cách Ứng dụng Bảo Vệ API Key

✅ API key được lưu trong database với quyền truy cập hạn chế  
✅ Chỉ chủ sở hữu tài khoản mới xem/chỉnh sửa được  
✅ Không hiển thị trong log hoặc response API  
✅ Truyền qua HTTPS khi gửi từ client lên server

### Khuyến Nghị Bảo Mật

⚠️ **KHÔNG** chia sẻ API key cho người khác  
⚠️ **KHÔNG** commit API key vào Git  
⚠️ **NÊN** xóa API key cũ nếu không dùng nữa  
⚠️ **NÊN** tạo API key mới nếu nghi ngờ bị lộ

### Nếu API Key Bị Lộ

1. Truy cập https://aistudio.google.com/app/apikey
2. Nhấn **"Delete"** để xóa key cũ
3. Tạo key mới
4. Cập nhật lại trong ứng dụng

## Xử Lý Lỗi

### "API key không hợp lệ hoặc có lỗi"

**Nguyên nhân:**
- API key sai định dạng
- API key đã bị xóa/vô hiệu hóa
- Không có quyền truy cập Google AI API

**Giải pháp:**
1. Kiểm tra lại API key (phải bắt đầu bằng `AIzaSy`)
2. Tạo key mới từ Google AI Studio
3. Đảm bảo tài khoản Google đã kích hoạt Google AI

### "Vượt quá giới hạn quota"

**Nguyên nhân:**
- Đã sử dụng hết quota miễn phí trong ngày

**Giải pháp:**
1. Chờ đến ngày hôm sau (quota tự động reset)
2. Sử dụng model nhẹ hơn (gemini-2.0-flash-exp)
3. Giảm số lượng request
4. Nâng cấp lên plan trả phí

### "No API key configured"

**Nguyên nhân:**
- Chưa cấu hình API key trong Settings
- Admin chưa cấu hình system API key

**Giải pháp:**
1. Vào menu ⚙️ **Cài Đặt**
2. Nhập API key của bạn
3. Lưu cài đặt

## Fallback (Dự phòng)

### System Default API Key

Nếu bạn chưa cấu hình API key riêng, hệ thống sẽ:
1. Sử dụng API key mặc định của admin (nếu có)
2. Hiển thị thông báo yêu cầu cấu hình API key riêng

### Khi Nào Nên Dùng API Key Riêng?

✅ Muốn có quota riêng (không chia sẻ với người khác)  
✅ Cần sử dụng model Pro (admin có thể chỉ cung cấp Flash)  
✅ Muốn kiểm soát chi phí (nếu dùng plan trả phí)  
✅ Admin chưa cấu hình system key

## Câu Hỏi Thường Gặp

### Q: API key có hết hạn không?
**A:** Không, nhưng bạn có thể vô hiệu hóa/xóa nó bất cứ lúc nào.

### Q: Có thể dùng nhiều API key cho cùng 1 tài khoản không?
**A:** Không, mỗi tài khoản chỉ lưu 1 API key. Nếu nhập key mới, key cũ sẽ bị ghi đè.

### Q: API key có được mã hóa không?
**A:** Hiện tại lưu plain text trong database. Kế hoạch tương lai sẽ mã hóa.

### Q: Tôi có thể xem API key của người khác không?
**A:** Không, mỗi người chỉ xem được API key của chính mình.

### Q: Nếu tôi xóa API key thì sao?
**A:** Hệ thống sẽ fallback về system default key (nếu admin đã cấu hình).

### Q: Google AI có miễn phí mãi mãi không?
**A:** Google cung cấp free tier hào phóng nhưng có thể thay đổi trong tương lai.

### Q: Tôi có thể dùng API key của OpenAI không?
**A:** Không, hiện tại chỉ hỗ trợ Google AI (Gemini).

## Tài Liệu Tham Khảo

- [Google AI Studio](https://aistudio.google.com/app/apikey)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Pricing & Quota](https://ai.google.dev/pricing)

## Liên Hệ Hỗ Trợ

Nếu gặp vấn đề, vui lòng liên hệ:
- Email: admin@budget-manager.com
- GitHub Issues: [Link to repo]

---

**Cập nhật lần cuối:** 04/01/2026  
**Phiên bản:** 1.0
