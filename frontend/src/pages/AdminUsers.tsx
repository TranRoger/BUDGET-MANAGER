import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import './AdminUsers.css';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 403) {
        alert('Bạn không có quyền truy cập trang này');
        navigate('/');
        return;
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể tạo người dùng');
      }

      alert('Đã tạo người dùng thành công');
      setShowCreateForm(false);
      setFormData({ email: '', password: '', name: '', role: 'user' });
      fetchUsers();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('token');
      const updateData: any = {
        email: formData.email,
        name: formData.name,
        role: formData.role
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`http://localhost:5000/api/auth/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể cập nhật người dùng');
      }

      alert('Đã cập nhật người dùng thành công');
      setEditingUser(null);
      setFormData({ email: '', password: '', name: '', role: 'user' });
      fetchUsers();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/auth/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Không thể xóa người dùng');
      }

      alert('Đã xóa người dùng');
      fetchUsers();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setShowCreateForm(false);
    setFormData({ email: '', password: '', name: '', role: 'user' });
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="admin-users">
      <div className="page-header">
        <h1 className="page-title">👥 Quản Lý Người Dùng</h1>
        {!showCreateForm && !editingUser && (
          <button className="btn-create" onClick={() => setShowCreateForm(true)}>
            ➕ Tạo Người Dùng Mới
          </button>
        )}
      </div>

      {(showCreateForm || editingUser) && (
        <Card className="user-form-card">
          <h2>{editingUser ? '✏️ Sửa Người Dùng' : '➕ Tạo Người Dùng Mới'}</h2>
          <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="user-form">
            <div className="form-group">
              <label htmlFor="email">Email <span className="required">*</span></label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">Tên <span className="required">*</span></label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Mật khẩu {editingUser && '(để trống nếu không thay đổi)'}
                {!editingUser && <span className="required">*</span>}
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Vai trò <span className="required">*</span></label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-buttons">
              <button type="submit" className="btn-submit">
                {editingUser ? '💾 Cập Nhật' : '✨ Tạo Mới'}
              </button>
              <button type="button" className="btn-cancel" onClick={cancelEdit}>
                Hủy
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card className="users-list-card">
        <h2>📋 Danh Sách Người Dùng</h2>
        {users.length === 0 ? (
          <p className="empty-text">Chưa có người dùng nào</p>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Tên</th>
                  <th>Vai Trò</th>
                  <th>Ngày Tạo</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.name}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => startEdit(user)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminUsers;
