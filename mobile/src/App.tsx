import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ChatBubble from './components/ChatBubble';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import SpendingLimits from './pages/SpendingLimits';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Debts from './pages/Debts';
import Goals from './pages/Goals';
import AdminUsers from './pages/AdminUsers';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/budgets" element={<Budgets />} />
                    <Route path="/spending-limits" element={<SpendingLimits />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/debts" element={<Debts />} />
                    <Route path="/goals" element={<Goals />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                  <ChatBubble />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
