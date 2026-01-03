import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

// Authentication disabled - single user mode
const Navbar: React.FC = () => {
  const { user } = useAuth();

  // Always show navbar in single user mode

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          💰 Budget Manager
        </Link>
        
        <div className="navbar-menu">
          <Link to="/" className="navbar-item">Dashboard</Link>
          <Link to="/transactions" className="navbar-item">Transactions</Link>
          <Link to="/budgets" className="navbar-item">Budgets</Link>
          <Link to="/reports" className="navbar-item">Reports</Link>
          <Link to="/ai-chat" className="navbar-item">AI Assistant</Link>
        </div>

        <div className="navbar-user">
          <span className="navbar-username">{user?.name || 'User'}</span>
          {/* Logout removed - single user mode */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
