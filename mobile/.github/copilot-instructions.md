# Budget Manager - AI Coding Agent Instructions

## Project Overview
Personal finance management app built with **React Native (Expo)** for iOS and Android.
- **Entry point**: [App.tsx](../App.tsx) - Mobile app with React Navigation and bottom tabs
- **Backend API**: `https://budman.roger.works/api`
- **Legacy web code**: [src/App.tsx](../src/App.tsx) exists but is **not used** - mobile uses root App.tsx

## Architecture Patterns

### Mobile-First Structure
- **Primary**: React Native (Expo) with native navigation and components
- **Navigation**: React Navigation v7 (Stack + Bottom Tabs)
- **Storage**: AsyncStorage for tokens (NOT localStorage)
- **Screens**: Located in [src/screens/](../src/screens/) (LoginScreen, DashboardScreen, etc.)
- **Shared layer**: [src/services/](../src/services/), [src/context/](../src/context/), [src/hooks/](../src/hooks/)

### Service Layer Structure
All backend communication lives in [src/services/](../src/services/). Pattern:
```typescript
// Services return typed responses and handle API-specific transformations
export const transactionService = {
  async getAll(filters?: TransactionFilters): Promise<Transaction[]> {
    const response = await api.get('/transactions', { params: filters });
    return response.data; // Some endpoints return .data.data, handle both
  }
}
```

**Key services:**
- [api.ts](../src/services/api.ts) - Axios instance with auth interceptor (uses AsyncStorage)
- [authService.ts](../src/services/authService.ts) - **Now uses AsyncStorage** (mobile-native)
- [aiService.ts](../src/services/aiService.ts) - AI chat, insights, and spending plan generation

### Authentication Flow
1. [AuthContext.tsx](../src/context/AuthContext.tsx) provides global auth state (async-aware)
2. Token stored via AsyncStorage (platform-native for mobile)
3. [api.ts](../src/services/api.ts) interceptor adds `Bearer ${token}` to all requests
4. [App.tsx](../App.tsx) conditionally renders Login vs Main tabs based on auth state

### Screen Components (React Native)
All screens use React Native components (`View`, `Text`, `TouchableOpacity`, etc.):
- **Login/Auth**: [LoginScreen.tsx](../src/screens/LoginScreen.tsx)
- **Main tabs**: Dashboard, Transactions, Budgets, Settings
- **Forms**: Modal-based with Picker component for selects
- **Styling**: StyleSheet API (not Tailwind) with color scheme matching web

### Custom Hooks Pattern
Hooks like [useTransactions.ts](../src/hooks/useTransactions.ts) provide:
- State management (loading, error, data)
- CRUD operations (create, update, delete)
- Automatic refetching via `useCallback` with filter dependencies
- Optimistic updates to local state

Example usage:
```typescript
const { transactions, loading, createTransaction, refetch } = useTransactions({ type: 'expense' });
```

## Development Workflows

### Running the Apps
```bash
# Mobile (Expo) - PRIMARY
npm start          # Opens Expo DevTools
npm run android    # Launch Android emulator
npm run ios        # Launch iOS simulator (requires Xcode on macOS)
npm run web        # Expo web fallback (hybrid mode)
```

### File Structure Conventions
- **Active mobile screens**: `src/screens/*.tsx` (React Native components)
- **Legacy web pages**: `src/pages/*.tsx` (React web - NOT USED)
- **Deprecated files**: Suffix with `-old.tsx` - DO NOT delete (kept for reference)
- **Shared**: services, context, hooks, utils work across environments

### Backend Response Handling
Backend inconsistently wraps responses. Services handle both:
```typescript
// Some endpoints: { data: [...] }
// Others: { success: true, data: {...} }
return response.data.data || response.data;
```

### TypeScript Patterns
- Strict mode enabled ([tsconfig.json](../tsconfig.json) extends expo/tsconfig.base)
- Explicit interfaces for all service DTOs (e.g., `CreateTransactionData`, `TransactionFilters`)
- User type defined in authService, NOT in separate types file

## Key Conventions

### Styling
- **React Native StyleSheet**: All mobile screens use `StyleSheet.create()`
- **Color scheme**: `#2563eb` (primary blue), `#10b981` (green/income), `#ef4444` (red/expense)
- **Layout**: flexbox-based with responsive padding/margins
- **Typography**: fontWeight as strings ('bold', '600'), not numbers

### Error Handling
Services throw errors; components handle them with `Alert.alert()` (native dialog):
```typescript
try {
  await transactionService.create(data);
} catch (error) {
  Alert.alert('Lỗi', 'Không thể lưu giao dịch');
}
```

### Date Formatting
Use [formatters.ts](../src/utils/formatters.ts) for consistent date/currency display:
- `formatCurrency(amount)` - Locale-aware currency (Vietnamese đ)
- `formatDate(dateString)` - Human-readable dates (dd/MM/yyyy)

### Forms & Modals
- Use `Modal` component with `transparent={true}` and overlay
- `Picker` from `@react-native-picker/picker` for dropdowns
- `TouchableOpacity` for buttons (NOT `<button>`)
- `TextInput` with `keyboardType` for numeric inputs

## External Dependencies

### Required Backend Endpoints
- `POST /auth/login` - Returns `{ token, user }`
- `GET /transactions`, `POST /transactions`, etc. - CRUD operations
- `POST /ai/chat` - Conversational AI (expects `{ message, conversationHistory }`)
- `POST /ai/plan` - Generate spending plan
- `GET /ai/plan/current` - Retrieve active plan

### Third-Party Packages
- **Expo SDK**: Navigation, AsyncStorage, build properties
- **React Navigation**: `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`
- **Axios**: HTTP client with interceptors
- **Picker**: `@react-native-picker/picker` for dropdowns
- **date-fns**: Date manipulation and formatting

## Common Pitfalls

1. **DO NOT use web-specific imports**: No `react-router-dom`, no `localStorage`, no `<div>/<button>`
2. **Response unwrapping**: Always handle both `response.data` and `response.data.data`
3. **Async storage**: All storage operations are async (`await AsyncStorage.getItem()`)
4. **Navigation**: Use `navigation.navigate()` / `navigation.replace()`, NOT React Router
5. **Budget period conversion**: Dashboard converts daily/weekly/yearly budgets to monthly (see `calculateMonthlyIncome`)

## Testing & Debugging
- No automated tests currently (only boilerplate setupTests.ts)
- Debug via React Native Debugger or Expo DevTools
- Backend diagnostics available at `https://budman.roger.works/api`

## iOS-Specific Notes
- Requires Xcode and iOS simulator on macOS
- Use `SafeAreaView` or padding for status bar clearance
- Test on physical device via Expo Go app for best experience
- Build with `eas build` for production (requires Expo account)
