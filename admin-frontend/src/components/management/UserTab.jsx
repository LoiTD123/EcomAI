import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { authAPI } from '../../services/api';

function UserTab({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const resp = await authAPI.listUsers();
      setUsers(resp.data);
      setCurrentPage(1); // Reset page on reload
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

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
        <h2 className="text-xl font-bold text-text-primary">Quản Lý Người Dùng & Phân Quyền</h2>
        <p className="text-xs text-text-secondary">Chỉ định quyền hạn và quản lý tài khoản thành viên trong hệ thống.</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-slate-200/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200/60 text-[10px] uppercase tracking-wider text-text-secondary">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Username</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Vai trò hiện tại</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6 text-center">Giao vai trò mới</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-text-secondary">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
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
                currentUsers.map(u => (
                  <tr key={u.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-text-muted">{u.id}</td>
                    <td className="py-4 px-6 font-semibold text-text-primary">{u.username}</td>
                    <td className="py-4 px-6 text-text-secondary font-mono text-xs">{u.email}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        u.role === 'admin' 
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : u.role === 'staff'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-indigo-50 text-indigo-600 border-indigo-200'
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
                            className="form-input bg-white/60 border border-slate-200/60 py-1 px-2 text-xs w-36 text-text-primary"
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

        {/* Pagination Controls */}
        {users.length > itemsPerPage && (
          <div className="flex justify-between items-center bg-slate-50 border-t border-slate-200/60 p-4">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary py-1.5 px-3 flex items-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" /> Trang trước
            </button>

            <span className="text-xs text-text-secondary">
              Trang <strong>{currentPage}</strong> / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage(prev => (currentPage < totalPages ? prev + 1 : prev))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary py-1.5 px-3 flex items-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trang sau <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserTab;
