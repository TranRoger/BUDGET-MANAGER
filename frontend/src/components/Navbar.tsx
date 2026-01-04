import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFinanceMenu, setShowFinanceMenu] = useState(false);
  const [showManageMenu, setShowManageMenu] = useState(false);
  
  const financeMenuRef = useRef<HTMLDivElement>(null);
  const manageMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (financeMenuRef.current && !financeMenuRef.current.contains(event.target as Node)) {
        setShowFinanceMenu(false);
      }
      if (manageMenuRef.current && !manageMenuRef.current.contains(event.target as Node)) {
        setShowManageMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  const isInGroup = (paths: string[]) => paths.some(path => location.pathname === path);

  const navItemClass = (active: boolean) => `
    flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm
    transition-all duration-200 relative overflow-hidden
    ${active 
      ? 'bg-white/20 text-white shadow-lg' 
      : 'text-white/90 hover:bg-white/10 hover:text-white hover:-translate-y-0.5'
    }
  `;

  const dropdownItemClass = (active: boolean) => `
    flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50
    transition-colors border-b border-gray-100 last:border-0
    ${active ? 'bg-gray-100' : ''}
  `;

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 to-gray-800 shadow-2xl border-b border-white/10">
      <div className="max-w-full mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">💰</span>
            <span className="hidden md:block text-xl font-bold text-white">Budget Manager</span>
          </Link>
          
          {/* Nav Menu */}
          <div className="flex items-center gap-1 flex-1 justify-center flex-wrap">
            <Link to="/" className={navItemClass(isActive('/') || isActive('/dashboard'))}>
              <span className="text-lg">📊</span>
              <span className="hidden sm:inline">Tổng Quan</span>
            </Link>

            {/* Finance Dropdown */}
            <div className="relative" ref={financeMenuRef}>
              <button 
                onClick={() => setShowFinanceMenu(!showFinanceMenu)}
                className={navItemClass(isInGroup(['/transactions', '/budgets', '/debts', '/goals']))}
              >
                <span className="text-lg">💳</span>
                <span className="hidden sm:inline">Tài Chính</span>
                <span className={`text-xs transition-transform ${showFinanceMenu ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showFinanceMenu && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl min-w-[240px] overflow-hidden animate-slideDown">
                  <Link to="/transactions" className={dropdownItemClass(isActive('/transactions'))} onClick={() => setShowFinanceMenu(false)}>
                    <span className="text-2xl">💳</span>
                    <div>
                      <div className="font-semibold text-gray-900">Giao Dịch</div>
                      <div className="text-xs text-gray-500">Thu chi hàng ngày</div>
                    </div>
                  </Link>
                  <Link to="/budgets" className={dropdownItemClass(isActive('/budgets'))} onClick={() => setShowFinanceMenu(false)}>
                    <span className="text-2xl">💼</span>
                    <div>
                      <div className="font-semibold text-gray-900">Ngân Sách</div>
                      <div className="text-xs text-gray-500">Giới hạn chi tiêu</div>
                    </div>
                  </Link>
                  <Link to="/debts" className={dropdownItemClass(isActive('/debts'))} onClick={() => setShowFinanceMenu(false)}>
                    <span className="text-2xl">💸</span>
                    <div>
                      <div className="font-semibold text-gray-900">Công Nợ</div>
                      <div className="text-xs text-gray-500">Quản lý nợ vay</div>
                    </div>
                  </Link>
                  <Link to="/goals" className={dropdownItemClass(isActive('/goals'))} onClick={() => setShowFinanceMenu(false)}>
                    <span className="text-2xl">🎯</span>
                    <div>
                      <div className="font-semibold text-gray-900">Mục Tiêu</div>
                      <div className="text-xs text-gray-500">Tiết kiệm & đầu tư</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <Link to="/reports" className={navItemClass(isActive('/reports'))}>
              <span className="text-lg">📈</span>
              <span className="hidden sm:inline">Báo Cáo</span>
            </Link>

            {/* Manage Dropdown */}
            <div className="relative" ref={manageMenuRef}>
              <button 
                onClick={() => setShowManageMenu(!showManageMenu)}
                className={navItemClass(isInGroup(['/categories', '/settings', '/admin/users']))}
              >
                <span className="text-lg">⚙️</span>
                <span className="hidden sm:inline">Quản Lý</span>
                <span className={`text-xs transition-transform ${showManageMenu ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showManageMenu && (
                <div className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-2xl min-w-[240px] overflow-hidden animate-slideDown">
                  <Link to="/categories" className={dropdownItemClass(isActive('/categories'))} onClick={() => setShowManageMenu(false)}>
                    <span className="text-2xl">🏷️</span>
                    <div>
                      <div className="font-semibold text-gray-900">Danh Mục</div>
                      <div className="text-xs text-gray-500">Phân loại thu chi</div>
                    </div>
                  </Link>
                  <Link to="/settings" className={dropdownItemClass(isActive('/settings'))} onClick={() => setShowManageMenu(false)}>
                    <span className="text-2xl">⚙️</span>
                    <div>
                      <div className="font-semibold text-gray-900">Cài Đặt</div>
                      <div className="text-xs text-gray-500">Tùy chỉnh cá nhân</div>
                    </div>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin/users" className={`${dropdownItemClass(isActive('/admin/users'))} bg-amber-50 hover:bg-amber-100`} onClick={() => setShowManageMenu(false)}>
                      <span className="text-2xl">👥</span>
                      <div>
                        <div className="font-semibold text-gray-900">Quản Lý User</div>
                        <div className="text-xs text-gray-500">Chỉ Admin</div>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/15 hover:bg-white/25 transition-all duration-200 border border-white/20"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                {user?.username?.[0]?.toUpperCase() || '👤'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-bold text-white">{user?.username}</div>
                <div className="text-xs text-white/70">{user?.role === 'admin' ? 'Admin' : 'User'}</div>
              </div>
              <span className={`text-white text-xs transition-transform ${showUserMenu ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {showUserMenu && (
              <div className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-2xl min-w-[280px] overflow-hidden animate-slideDown">
                <div className="px-4 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl border-2 border-white/30">
                      {user?.username?.[0]?.toUpperCase() || '👤'}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{user?.username}</div>
                      <div className="text-sm opacity-90">{user?.email || 'user@example.com'}</div>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>
                    <span className="text-xl">⚙️</span>
                    <span className="font-semibold">Cài Đặt</span>
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 border-t border-gray-100 font-semibold">
                    <span className="text-xl">🚪</span>
                    <span>Đăng Xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
