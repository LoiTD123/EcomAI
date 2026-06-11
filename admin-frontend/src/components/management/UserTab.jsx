import React, { useState, useEffect } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { authAPI } from '../../services/api';

function UserTab({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const resp = await authAPI.listUsers();
      setUsers(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, username, newRole) => {
    if (!window.confirm(`Bạn có chắc chắn muốn thay đổi vai trò của người dùng "${username}" thành "${newRole}"?`)) return;
    setLoading(true);
    try {
      await authAPI.updateUserRole(userId, newRole);
      alert('Thay đổi vai trò người dùng thành công!');
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Không thể cập nhật vai trò người dùng.');
      loadUsers();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">Quản Lý Người Dùng & Phân Quyền</h2>
        <p className="text-xs text-text-secondary">Chỉ định quyền hạn và quản lý tài khoản thành viên trong hệ thống.</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/30 border-b border-white/5 text-[10px] uppercase tracking-wider text-text-secondary">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Username</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Vai trò hiện tại</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6 text-center">Giao vai trò mới</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-text-secondary">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-400 mb-2" />
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-text-secondary">
                    Không tìm thấy tài khoản người dùng nào.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-text-muted">{u.id}</td>
                    <td className="py-4 px-6 font-semibold text-white">{u.username}</td>
                    <td className="py-4 px-6 text-text-secondary font-mono text-xs">{u.email}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        u.role === 'admin' 
                          ? 'bg-red-500/10 text-red-300 border-red-500/20'
                          : u.role === 'staff'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`h-2 w-2 rounded-full inline-block mr-2 ${u.is_active ? 'bg-emerald-500' : 'bg-text-muted'}`} />
                      <span className="text-xs text-text-secondary">{u.is_active ? 'Đang hoạt động' : 'Bị khóa'}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {u.id === currentUser.id ? (
                        <span className="text-[10px] text-text-muted font-bold uppercase">Tài khoản của bạn</span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <select 
                            defaultValue={u.role}
                            onChange={e => handleRoleChange(u.id, u.username, e.target.value)}
                            className="form-input bg-black/40 border border-white/5 py-1 px-2 text-xs w-36"
                          >
                            <option value="customer">customer (Khách)</option>
                            <option value="staff">staff (Nhân viên)</option>
                            <option value="admin">admin (Quản trị)</option>
                          </select>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserTab;
