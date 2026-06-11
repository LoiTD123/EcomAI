import React, { useState } from 'react';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';

function AdminAuthPage({ onAuthSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const resp = await authAPI.login({ username, password });
      const loggedInUser = resp.data.user;
      
      // Enforce that only admin/staff can log in through the management portal
      if (loggedInUser.role !== 'admin' && loggedInUser.role !== 'staff') {
        throw new Error('Tài khoản không có quyền truy cập cổng quản trị.');
      }

      localStorage.setItem('access_token', resp.data.access);
      localStorage.setItem('refresh_token', resp.data.refresh);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      onAuthSuccess(loggedInUser);
    } catch (err) {
      setAuthError(
        err.message || 
        err.response?.data?.error || 
        'Đăng nhập thất bại.'
      );
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-6 min-h-[85vh]">
      <div className="glass-card w-full max-w-md border-red-500/10 shadow-red-950/20 shadow-2xl animate-fade-in">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3 text-red-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-amber-300 bg-clip-text text-transparent">
            Đăng Nhập Quản Trị
          </h2>
        </div>

        {authError && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-300 p-3 rounded-lg text-xs mb-4 text-center">
            {authError}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label text-red-400/80">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="form-input border-red-500/10 focus:border-red-500/40 focus:ring-red-500/10 bg-black/45" 
              placeholder="Nhập tên đăng nhập quản trị" 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label text-red-400/80">Mật mã (Password)</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="form-input border-red-500/10 focus:border-red-500/40 focus:ring-red-500/10 bg-black/45 pr-10" 
                placeholder="••••••••" 
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-text-secondary hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn w-full py-3 mt-2 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold uppercase text-xs shadow-lg shadow-red-500/10 hover:brightness-110">
            Xác thực truy cập
          </button>
        </form>
      </div>
    </main>
  );
}

export default AdminAuthPage;
