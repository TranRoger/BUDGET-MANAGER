# Budget Manager Mobile - iOS App

React Native app được xây dựng với Expo và NativeWind (Tailwind CSS cho React Native).

## Yêu Cầu

- Node.js 18+
- npm hoặc yarn
- iOS Simulator (Xcode) hoặc thiết bị iOS
- Backend API đang chạy (xem thư mục `backend/`)

## Cài Đặt

```bash
cd mobile
npm install
```

## Chạy Ứng Dụng

### iOS Simulator
```bash
npm run ios
```

### Expo Go (Thiết bị thật)
```bash
npm start
# Quét QR code với Expo Go app
```

## Cấu Hình Backend URL

Mở file `src/services/api.ts` và thay đổi `API_URL`:

```typescript
const API_URL = __DEV__ 
  ? 'http://192.168.1.100:5000/api'  // Thay bằng IP máy chạy backend
  : 'https://your-production-api.com/api';
```

**Lưu ý**: Không sử dụng `localhost` vì thiết bị/simulator không thể truy cập. Sử dụng IP máy local.

## Cấu Trúc Dự Án

```
mobile/
├── src/
│   ├── screens/         # Màn hình chính
│   │   ├── DashboardScreen.tsx
│   │   ├── TransactionsScreen.tsx
│   │   ├── AIChatScreen.tsx
│   │   ├── BudgetsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/        # API services
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── transactionService.ts
│   │   ├── aiService.ts
│   │   └── budgetService.ts
│   ├── context/         # React Context
│   │   └── AuthContext.tsx
│   ├── navigation/      # Navigation config
│   │   └── AppNavigator.tsx
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── utils/           # Utilities
│   │   └── format.ts
│   └── constants/       # Constants
│       └── theme.ts
├── App.tsx              # Entry point
├── tailwind.config.js   # NativeWind config
└── package.json
```

## Tính Năng

- ✅ Dashboard với tổng quan tài chính
- ✅ Quản lý giao dịch (Thu/Chi)
- ✅ Trò chuyện với AI Assistant
- ✅ Quản lý ngân sách
- ✅ Cài đặt AI (API key, model)
- ✅ NativeWind (Tailwind CSS)
- ✅ TypeScript

## NativeWind (Tailwind CSS)

Sử dụng className như React web:

```tsx
<View className="flex-1 bg-gray-50 p-4">
  <Text className="text-xl font-bold text-blue-600">Hello</Text>
</View>
```

## Build Production

```bash
# Build cho iOS
eas build --platform ios

# Cần cài EAS CLI
npm install -g eas-cli
eas login
eas build:configure
```

## Troubleshooting

### Không kết nối được Backend
- Kiểm tra backend đang chạy: `http://localhost:5000/api/health`
- Thay `localhost` bằng IP máy trong `src/services/api.ts`
- Đảm bảo cùng mạng WiFi (nếu dùng thiết bị thật)

### Lỗi NativeWind
- Xóa cache: `npm start -- --clear`
- Rebuild: `rm -rf node_modules && npm install`

### Lỗi Dependencies
```bash
npx expo install --fix
```
