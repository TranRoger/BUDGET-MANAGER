import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          💰 Quản Lý Ngân Sách
        </Link>
        
        <div className="navbar-menu">
          <Link to="/" className="navbar-item">Tổng Quan</Link>
          <Link to="/transactions" className="navbar-item">Giao Dịch</Link>
          <Link to="/budgets" className="navbar-item">Ngân Sách</Link>
          <Link to="/debts" className="navbar-item">Nợ</Link>
          <Link to="/goals" className="navbar-item">Mục Tiêu</Link>
          <Link to="/reports" className="navbar-item">Báo Cáo</Link>
          {user?.role === 'admin' && (
            <Link to="/admin/users" className="navbar-item navbar-item-admin">
              👑 Quản Lý User
            </Link>
          )}
        </div>

        <div className="navbar-user">
          <span className="navbar-username">
            {user?.role === 'admin' && '👑 '}
            {user?.name || 'User'}
          </span>
          <button onClick={handleLogout} className="navbar-logout">
            Đăng Xuất
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
