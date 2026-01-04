import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';

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
      const response = await fetch('/api/auth/admin/users', {
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
      const response = await fetch('/api/auth/admin/users', {
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

      const response = await fetch(`/api/auth/admin/users/${editingUser.id}`, {
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
      const response = await fetch(`/api/auth/admin/users/${id}`, {
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
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">Đang tải...</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">👥 Quản Lý Người Dùng</h1>
        {!showCreateForm && !editingUser && (
          <button 
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold"
            onClick={() => setShowCreateForm(true)}
          >
            ➕ Tạo Người Dùng Mới
          </button>
        )}
      </div>

      {(showCreateForm || editingUser) && (
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{editingUser ? '✏️ Sửa Người Dùng' : '➕ Tạo Người Dùng Mới'}</h2>
          <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Tên <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu {editingUser && '(để trống nếu không thay đổi)'}
                {!editingUser && <span className="text-red-500">*</span>}
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required={!editingUser}
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button 
                type="submit" 
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold"
              >
                {editingUser ? '💾 Cập Nhật' : '✨ Tạo Mới'}
              </button>
              <button 
                type="button" 
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all"
                onClick={cancelEdit}
              >
                ✕ Hủy
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">📋 Danh Sách Người Dùng</h2>
        {users.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Chưa có người dùng nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tên</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Vai Trò</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ngày Tạo</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{user.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{user.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={() => startEdit(user)}
                        >
                          ✏️
                        </button>
                        <button
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
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
