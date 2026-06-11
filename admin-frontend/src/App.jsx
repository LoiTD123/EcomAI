import React, { useState } from 'react';
import { authAPI } from './services/api';
import ManagementDashboard from './pages/ManagementDashboard';
import AdminAuthPage from './pages/AdminAuthPage';
import Footer from './components/Footer';

function App() {
  // Authentication states
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  const handleLogout = () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      authAPI.logout(refresh).catch(() => {});
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {!user ? (
        <AdminAuthPage onAuthSuccess={setUser} />
      ) : (
        <ManagementDashboard user={user} onLogout={handleLogout} onUpdateUser={setUser} />
      )}
      <Footer />
    </div>
  );
}

export default App;
