# BUDGET MANAGER

Chào mừng bạn đến với dự án Budget Manager! Đây là một ứng dụng quản lý tài chính cá nhân giúp bạn theo dõi thu nhập, chi tiêu và lập ngân sách một cách hiệu quả. Ứng dụng này cũng tích hợp các tính năng AI để cung cấp những gợi ý và phân tích tài chính thông minh.

## Features

- **Income và Expense Tracking**: Dễ dàng ghi lại thu nhập và chi tiêu của bạn với các danh mục và thẻ.
- **Budget Management**: Đặt ngân sách cho các danh mục khác nhau và theo dõi chi tiêu của bạn so với chúng.
- **Reports and Analytics**: Tạo báo cáo để trực quan hóa dữ liệu tài chính của bạn và xác định các xu hướng.
- **AI Insights**: Nhận lời khuyên và phân tích tài chính cá nhân hóa được hỗ trợ bởi AI.
- **AI Chatbot**: Tương tác với chatbot được hỗ trợ bởi AI để nhận câu trả lời ngay lập tức cho các câu hỏi tài chính của bạn.
- **⚙️ User-Configurable AI Settings**: Mỗi người dùng có thể cấu hình API key riêng của Google AI và chọn model phù hợp (gemini-2.0-flash-exp, gemini-1.5-flash, gemini-1.5-pro).

## Architecture

The Budget Manager application is xây dựng dựa trên kiến trúc mô-đun để đảm bảo khả năng mở rộng và dễ bảo trì. Các thành phần chính bao gồm:

- **Frontend**: Giao diện thân thiện với người dùng được xây dựng bằng React.js để tương tác mượt mà.
- **Backend**: API RESTful phát triển bằng Node.js và Express.js để xử lý logic nghiệp vụ và dữ liệu.
- **Database**: Cơ sở dữ liệu PostgreSQL để lưu trữ dữ liệu người dùng một cách an toàn.
- **AI Module**: Dịch vụ hỗ trợ AI cung cấp những gợi ý và phân tích tài chính.
- **Deployment**: Được container hóa bằng Docker và Docker Compose để dễ dàng triển khai và mở rộng.

## Goals

Mục tiêu của dự án Budget Manager bao gồm:

- Người dùng cung cấp thu nhập và chi tiêu của họ, các khoản nợ và tài sản.
- Người dùng có thể thiết lập ngân sách cho các danh mục khác nhau.
- Cung cấp báo cáo và phân tích chi tiết về tình hình tài chính của người dùng
- Tích hợp AI để cung cấp lời khuyên tài chính cá nhân hóa.
- Tạo một chatbot AI để hỗ trợ người dùng trong việc quản lý tài chính.

## AI Service

Google AI Studio (Gemini API) được sử dụng để cung cấp các tính năng AI trong ứng dụng Budget Manager. Dịch vụ này bao gồm:    
- **AI Insights**: Sử dụng mô hình Gemini Pro để phân tích dữ liệu tài chính của người dùng và cung cấp các gợi ý cải thiện quản lý tài chính.    
- **AI Chatbot**: Tích hợp chatbot sử dụng mô hình ngôn ngữ tự nhiên để trả lời các câu hỏi tài chính của người dùng và cung cấp hỗ trợ tức thì
- **Function Calling**: AI có thể tự động thêm transactions, debts, và goals vào database khi người dùng nói chuyện
- **Smart Recommendations**: Phân tích thu nhập, nợ, và chi tiêu để đưa ra gợi ý tiết kiệm thông minh
- **⚙️ User-Specific API Keys**: Mỗi người dùng có thể cấu hình API key riêng, không chia sẻ quota với người khác. Xem [AI Settings Guide](AI-SETTINGS-GUIDE.md) để biết chi tiết.

### Supported AI Models

- **gemini-2.0-flash-exp** (Mặc định) - Nhanh nhất, phù hợp sử dụng hàng ngày
- **gemini-1.5-flash** - Cân bằng giữa tốc độ và chất lượng
- **gemini-1.5-pro** - Chất lượng cao nhất, phân tích sâu

## Quick Start

### Option 1: Using Docker (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd BUDGET-MANAGER

# 2. Get Google AI Studio API Key
# Visit: https://aistudio.google.com/app/apikey
# Create API Key and copy it

# 3. Configure environment
cd backend
cp .env.example .env
# Edit .env and add: GOOGLE_AI_API_KEY=your-api-key-here

# 4. Run the setup script
./start.sh
```

### Option 2: Manual Setup

```bash
# 1. Get Google AI Studio API Key from https://aistudio.google.com/app/apikey

# 2. Run the manual setup script
./setup-manual.sh

# 3. Configure backend/.env with GOOGLE_AI_API_KEY

# 4. Start backend (in one terminal)
cd backend
npm run dev

# 5. Start frontend (in another terminal)
cd frontend
npm start
```

### Access the Application

- **I Settings Guide](AI-SETTINGS-GUIDE.md) - **NEW!** Configure your own Google AI API key
- [AI Settings Implementation](AI-SETTINGS-IMPLEMENTATION.md) - Technical documentation
- [AI Settings Test](AI-SETTINGS-TEST.md) - Testing guide
- [AFrontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

## Documentation

- [Setup Guide](SETUP.md) - Detailed setup instructions
- [API Reference](API.md) - Complete API documentation
- [Contributing](CONTRIBUTING.md) - Contribution guidelines
- [Backend README](backend/README.md) - Backend documentation
- [Frontend README](frontend/README.md) - Frontend documentation

## Project Structure

```
BUDGET-MANAGER/
├── backend/              # Node.js/Express API
│   ├── config/          # Database configuration
│   ├── middleware/      # Authentication middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic & AI service
│   └── server.js        # Entry point
├── frontend/            # React TypeScript app
│   ├── public/          # Static assets
│   └── src/
│       ├── components/  # React components
│       ├── services/    # API services
│       └── App.tsx      # Main app component
├── database/            # Database schemas
│   ├── schema.sql       # Database schema
│   └── seed.sql         # Sample data
├── credentials/         # Google Cloud credentials (git-ignored)
├── docker-compose.yml   # Docker configuration
├── start.sh            # Quick start script
└── setup-manual.sh     # Manual setup script
```

## Technologies Used

### Backend
- Node.js & Express.js
- PostgreSQL
- JWT Authentication
- Google Cloud Vertex AI (Gemini Pro)

### Frontend
- React 19 with TypeScript
- Axios for API calls
- React Router for navigation

### DevOps
- Docker & Docker Compose
- PostgreSQL Container

## Environment Variables

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budget_manager
DB_USER=postgres
DB_PASSWORD=your_password
PORT=5000
JWT_SECRET=your_jwt_secret
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json
VERTEX_AI_LOCATION=us-central1
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please create an issue in the repository.

---

## 🎉 Frontend Status: HOÀN THÀNH

### ✅ Frontend đã được triển khai đầy đủ với:

- **27 TypeScript files** - Components, Pages, Services, Hooks
- **12 CSS files** - Professional styling
- **6 complete pages** - Login, Register, Dashboard, Transactions, Budgets, Reports, AI Chat
- **7 API services** - Full integration với backend
- **Responsive design** - Mobile & Desktop
- **Modern UI/UX** - Gradient design, animations, color-coding

### 🚀 Quick Test Frontend

```bash
# Test frontend ngay
./test-frontend.sh

# Hoặc manual
cd frontend
npm install
npm start
```

### 📚 Documentation

- [FRONTEND-SUMMARY.md](FRONTEND-SUMMARY.md) - Tổng quan frontend
- [FRONTEND-COMPLETE.md](FRONTEND-COMPLETE.md) - Chi tiết implementation
- [frontend/FRONTEND-README.md](frontend/FRONTEND-README.md) - Hướng dẫn frontend

---

Made with ❤️ for better financial management