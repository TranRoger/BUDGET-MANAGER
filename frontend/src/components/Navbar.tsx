import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFinanceMenu, setShowFinanceMenu] = useState(false);
  const [showManageMenu, setShowManageMenu] = useState(false);
  
  const financeMenuRef = useRef<HTMLDivElement>(null);
  const manageMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (financeMenuRef.current && !financeMenuRef.current.contains(event.target as Node)) {
        setShowFinanceMenu(false);
      }
      if (manageMenuRef.current && !manageMenuRef.current.contains(event.target as Node)) {
        setShowManageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isInGroup = (paths: string[]) => {
    return paths.some(path => location.pathname === path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">💰</span>
          <span className="brand-text">Budget Manager</span>
        </Link>
        
        <div className="navbar-menu">
          <Link 
            to="/" 
            className={`navbar-item ${isActive('/') || isActive('/dashboard') ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Tổng Quan</span>
          </Link>

          {/* Finance Dropdown */}
          <div className="navbar-dropdown" ref={financeMenuRef}>
            <button 
              className={`navbar-item dropdown-trigger ${isInGroup(['/transactions', '/budgets', '/debts', '/goals']) ? 'active' : ''}`}
              onClick={() => setShowFinanceMenu(!showFinanceMenu)}
            >
              <span className="nav-icon">💳</span>
              <span className="nav-text">Tài Chính</span>
              <span className={`dropdown-arrow ${showFinanceMenu ? 'open' : ''}`}>▼</span>
            </button>
            {showFinanceMenu && (
              <div className="dropdown-menu">
                <Link 
                  to="/transactions" 
                  className={`dropdown-item ${isActive('/transactions') ? 'active' : ''}`}
                  onClick={() => setShowFinanceMenu(false)}
                >
                  <span className="dropdown-icon">💳</span>
                  <div className="dropdown-item-content">
                    <span className="dropdown-item-title">Giao Dịch</span>
                    <span className="dropdown-item-desc">Thu chi hàng ngày</span>
                  </div>
                </Link>
                <Link 
                  to="/budgets" 
                  className={`dropdown-item ${isActive('/budgets') ? 'active' : ''}`}
                  onClick={() => setShowFinanceMenu(false)}
                >
                  <span className="dropdown-icon">💼</span>
                  <div className="dropdown-item-content">
                    <span className="dropdown-item-title">Ngân Sách</span>
                    <span className="dropdown-item-desc">Giới hạn chi tiêu</span>
                  </div>
                </Link>
                <Link 
                  to="/debts" 
                  className={`dropdown-item ${isActive('/debts') ? 'active' : ''}`}
                  onClick={() => setShowFinanceMenu(false)}
                >
                  <span className="dropdown-icon">💸</span>
                  <div className="dropdown-item-content">
                    <span className="dropdown-item-title">Công Nợ</span>
                    <span className="dropdown-item-desc">Quản lý nợ vay</span>
                  </div>
                </Link>
                <Link 
                  to="/goals" 
                  className={`dropdown-item ${isActive('/goals') ? 'active' : ''}`}
                  onClick={() => setShowFinanceMenu(false)}
                >
                  <span className="dropdown-icon">🎯</span>
                  <div className="dropdown-item-content">
                    <span className="dropdown-item-title">Mục Tiêu</span>
                    <span className="dropdown-item-desc">Tiết kiệm & đầu tư</span>
                  </div>
                </Link>
              </div>
            )}
          </div>

          <Link 
            to="/reports" 
            className={`navbar-item ${isActive('/reports') ? 'active' : ''}`}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Báo Cáo</span>
          </Link>

          {/* Manage Dropdown */}
          <div className="navbar-dropdown" ref={manageMenuRef}>
            <button 
              className={`navbar-item dropdown-trigger ${isInGroup(['/categories', '/settings', '/admin/users']) ? 'active' : ''}`}
              onClick={() => setShowManageMenu(!showManageMenu)}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Quản Lý</span>
              <span className={`dropdown-arrow ${showManageMenu ? 'open' : ''}`}>▼</span>
            </button>
            {showManageMenu && (
              <div className="dropdown-menu">
                <Link 
                  to="/categories" 
                  className={`dropdown-item ${isActive('/categories') ? 'active' : ''}`}
                  onClick={() => setShowManageMenu(false)}
                >
                  <span className="dropdown-icon">🏷️</span>
                  <div className="dropdown-item-content">
                    <span className="dropdown-item-title">Danh Mục</span>
                    <span className="dropdown-item-desc">Phân loại thu chi</span>
                  </div>
                </Link>
                <Link 
                  to="/settings" 
                  className={`dropdown-item ${isActive('/settings') ? 'active' : ''}`}
                  onClick={() => setShowManageMenu(false)}
                >
                  <span className="dropdown-icon">⚙️</span>
                  <div className="dropdown-item-content">
                    <span className="dropdown-item-title">Cài Đặt</span>
                    <span className="dropdown-item-desc">API & tùy chỉnh</span>
                  </div>
                </Link>
                {user?.role === 'admin' && (
                  <Link 
                    to="/admin/users" 
                    className={`dropdown-item admin ${isActive('/admin/users') ? 'active' : ''}`}
                    onClick={() => setShowManageMenu(false)}
                  >
                    <span className="dropdown-icon">👑</span>
                    <div className="dropdown-item-content">
                      <span className="dropdown-item-title">Quản Lý User</span>
                      <span className="dropdown-item-desc">Dành cho Admin</span>
                    </div>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="navbar-user">
          <div className="user-dropdown">
            <button 
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                {user?.role === 'admin' ? '👑' : '👤'}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name || 'User'}</span>
                <span className="user-role">{user?.role === 'admin' ? 'Admin' : 'User'}</span>
              </div>
              <span className={`dropdown-arrow ${showUserMenu ? 'open' : ''}`}>▼</span>
            </button>
            
            {showUserMenu && (
              <div className="user-menu">
                <div className="user-menu-header">
                  <div className="user-menu-avatar">
                    {user?.role === 'admin' ? '👑' : '👤'}
                  </div>
                  <div className="user-menu-info">
                    <div className="user-menu-name">{user?.name}</div>
                    <div className="user-menu-email">{user?.email}</div>
                  </div>
                </div>
                <div className="user-menu-divider"></div>
                <button onClick={handleLogout} className="user-menu-item logout">
                  <span className="menu-item-icon">🚪</span>
                  <span>Đăng Xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
