import React, { useState } from 'react';
import { ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';

function AuthPage({ onAuthSuccess, onGoToAdmin }) {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        const resp = await authAPI.login({ username, password });
        localStorage.setItem('access_token', resp.data.access);
        localStorage.setItem('refresh_token', resp.data.refresh);
        localStorage.setItem('user', JSON.stringify(resp.data.user));
        onAuthSuccess(resp.data.user);
      } else {
        await authAPI.register({ 
          username, 
          email, 
          password, 
          first_name: firstName, 
          last_name: lastName 
        });
        setAuthMode('login');
        setAuthError('Đăng ký thành công! Hãy đăng nhập.');
        setEmail('');
        setFirstName('');
        setLastName('');
      }
    } catch (err) {
      setAuthError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'Có lỗi xảy ra, vui lòng thử lại.'
      );
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-6 min-h-[85vh]">
      <div className="glass-card w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3 text-indigo-400">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            {authMode === 'login' ? 'Đăng Nhập' : 'Đăng Ký'}
          </h2>
        </div>

        {authError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs mb-4 text-center">
            {authError}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group mb-0">
                <label className="form-label">Họ</label>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Tên</label>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="form-input" 
              placeholder="Tên đăng nhập" 
              required 
            />
          </div>

          {authMode === 'register' && (
            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="form-input" 
                placeholder="name@email.com" 
                required 
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="form-input pr-10" 
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

          <button type="submit" className="btn btn-primary w-full py-3 mt-2">
            {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-text-secondary">
          {authMode === 'login' ? (
            <>
              Chưa có tài khoản?{' '}
              <button 
                onClick={() => setAuthMode('register')} 
                className="text-indigo-400 hover:underline font-medium"
              >
                Đăng ký ngay
              </button>
            </>
          ) : (
            <>
              Đã có tài khoản?{' '}
              <button 
                onClick={() => setAuthMode('login')} 
                className="text-indigo-400 hover:underline font-medium"
              >
                Đăng nhập
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default AuthPage;
