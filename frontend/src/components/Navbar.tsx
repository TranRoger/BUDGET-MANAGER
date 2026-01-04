import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">💰</span>
          <span className="brand-text">Quản Lý Ngân Sách</span>
        </Link>
        
        <div className="navbar-menu">
          <Link 
            to="/" 
            className={`navbar-item ${isActive('/') || isActive('/dashboard') ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Tổng Quan</span>
          </Link>
          <Link 
            to="/transactions" 
            className={`navbar-item ${isActive('/transactions') ? 'active' : ''}`}
          >
            <span className="nav-icon">💳</span>
            <span className="nav-text">Giao Dịch</span>
          </Link>
          <Link 
            to="/budgets" 
            className={`navbar-item ${isActive('/budgets') ? 'active' : ''}`}
          >
            <span className="nav-icon">💼</span>
            <span className="nav-text">Ngân Sách</span>
          </Link>
          <Link 
            to="/debts" 
            className={`navbar-item ${isActive('/debts') ? 'active' : ''}`}
          >
            <span className="nav-icon">💸</span>
            <span className="nav-text">Nợ</span>
          </Link>
          <Link 
            to="/goals" 
            className={`navbar-item ${isActive('/goals') ? 'active' : ''}`}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-text">Mục Tiêu</span>
          </Link>
          <Link 
            to="/reports" 
            className={`navbar-item ${isActive('/reports') ? 'active' : ''}`}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Báo Cáo</span>
          </Link>
          <Link 
            to="/settings" 
            className={`navbar-item ${isActive('/settings') ? 'active' : ''}`}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Cài Đặt</span>
          </Link>
          {user?.role === 'admin' && (
            <Link 
              to="/admin/users" 
              className={`navbar-item navbar-item-admin ${isActive('/admin/users') ? 'active' : ''}`}
            >
              <span className="nav-icon">👑</span>
              <span className="nav-text">Quản Lý User</span>
            </Link>
          )}
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
