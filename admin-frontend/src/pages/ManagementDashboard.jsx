import React, { useState } from 'react';
import { 
  Package, 
  ShoppingBag, 
  Truck, 
  Users, 
  LogOut, 
  ShieldAlert 
} from 'lucide-react';
import ProductTab from '../components/management/ProductTab';
import OrderTab from '../components/management/OrderTab';
import ShippingTab from '../components/management/ShippingTab';
import UserTab from '../components/management/UserTab';
import ProfileModal from '../components/ProfileModal';

function ManagementDashboard({ user, onLogout, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', 'shipping', 'users'
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen text-text-primary">
      {/* Header Quản Trị */}
      <header className="glass px-6 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-700 to-emerald-600 bg-clip-text text-transparent">
              Hệ Thống Quản Trị E-Com
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] text-text-secondary font-medium tracking-wider uppercase">
                Tài khoản: {user.username} • <span className="text-indigo-600 font-bold">{user.role}</span>
              </p>
              <button 
                onClick={() => setShowProfileModal(true)} 
                className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 px-1.5 py-0.5 rounded uppercase tracking-widest transition-colors bg-indigo-50"
              >
                Sửa Profile
              </button>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onLogout} 
          className="btn btn-secondary py-2 px-4 text-xs font-bold"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </header>

      {/* Layout Chính */}
      <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full">
        {/* Thanh Navigation Bên Trái */}
        <aside className="w-full lg:w-64 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`btn w-full justify-start py-3 px-4 ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Package className="h-5 w-5" />
            Sản phẩm
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`btn w-full justify-start py-3 px-4 ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <ShoppingBag className="h-5 w-5" />
            Đơn hàng
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`btn w-full justify-start py-3 px-4 ${activeTab === 'shipping' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Truck className="h-5 w-5" />
            Vận chuyển (Shipping)
          </button>
          
          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`btn w-full justify-start py-3 px-4 ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Users className="h-5 w-5" />
              Người dùng (Admin Only)
            </button>
          )}
        </aside>

        {/* Khung Hiển Thị Nội Dung */}
        <section className="flex-1 flex flex-col min-w-0">
          {activeTab === 'products' && <ProductTab />}
          {activeTab === 'orders' && <OrderTab />}
          {activeTab === 'shipping' && <ShippingTab />}
          {activeTab === 'users' && user.role === 'admin' && <UserTab currentUser={user} />}
        </section>
      </main>

      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        user={user} 
        onUpdateSuccess={onUpdateUser} 
      />
    </div>
  );
}

export default ManagementDashboard;
