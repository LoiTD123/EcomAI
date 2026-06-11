import React, { useState } from 'react';
import { authAPI } from '../services/api';

function AuthPage({ onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [authError, setAuthError] = useState('');

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
        setUsername('');
        setPassword('');
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
        // Clear registration fields
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
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-md animate-fade-in">
        <h2 className="text-2xl font-bold mb-2 text-center bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
          {authMode === 'login' ? 'Chào mừng quay trở lại' : 'Tạo tài khoản mới'}
        </h2>
        <p className="text-text-secondary text-sm text-center mb-6">
          Hệ thống E-Commerce Microservices tích hợp AI Recommendations & RAG Chatbot
        </p>

        {authError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4 text-center">
            {authError}
          </div>
        )}

        <form onSubmit={handleAuthSubmit}>
          {authMode === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Họ</label>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>
              <div className="form-group">
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
                placeholder="email@viettel.com.vn" 
                required 
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="form-input" 
              placeholder="••••••••" 
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary w-full py-3 mt-2">
            {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-text-secondary">
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
