import React, { useState, useEffect } from 'react';
import { X, RefreshCw, User, Mail, Lock, Shield } from 'lucide-react';
import { authAPI } from '../services/api';

function ProfileModal({ isOpen, onClose, user, onUpdateSuccess }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: '',
    last_name: '',
    password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await authAPI.profile();
      const profile = resp.data;
      setFormData({
        username: profile.username,
        email: profile.email,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        password: '',
        confirm_password: ''
      });
    } catch (err) {
      setError('Không thể tải thông tin tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password && formData.password !== formData.confirm_password) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const resp = await authAPI.updateProfile(payload);
      
      // Update local storage and app state
      const updatedUser = {
        ...user,
        email: resp.data.email,
        username: resp.data.username
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      if (onUpdateSuccess) {
        onUpdateSuccess(updatedUser);
      }
      
      alert('Cập nhật thông tin cá nhân thành công!');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.email?.[0] || 'Cập nhật thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-md animate-fade-in relative border border-white/10 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Thông Tin Cá Nhân</h3>
            <p className="text-xs text-text-secondary">Chỉnh sửa hồ sơ tài khoản của bạn.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-text-secondary">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-400 mb-2" />
            Đang tải thông tin...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs text-center">
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label flex items-center gap-1.5 text-text-secondary">
                <Shield className="h-3.5 w-3.5" /> Username (Không thể đổi)
              </label>
              <input 
                type="text" 
                value={formData.username}
                disabled 
                className="form-input bg-black/40 border border-white/5 opacity-55 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Họ</label>
                <input 
                  type="text" required
                  value={formData.last_name}
                  onChange={e => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tên</label>
                <input 
                  type="text" required
                  value={formData.first_name}
                  onChange={e => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label flex items-center gap-1.5 text-text-secondary">
                <Mail className="h-3.5 w-3.5" /> Email
              </label>
              <input 
                type="email" required
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="border-t border-white/5 pt-4">
              <h4 className="text-xs font-bold text-indigo-300 mb-3 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Đổi mật khẩu (Bỏ trống nếu giữ nguyên)
              </h4>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="form-group">
                  <label className="form-label">Mật khẩu mới</label>
                  <input 
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Mật khẩu ít nhất 8 ký tự, có chữ hoa, thường, số, ký tự đặc biệt"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Xác nhận mật khẩu mới</label>
                  <input 
                    type="password"
                    value={formData.confirm_password}
                    onChange={e => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                    placeholder="Nhập lại mật khẩu mới"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button 
                type="button" 
                onClick={onClose}
                className="btn btn-secondary"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                Cập nhật
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProfileModal;
