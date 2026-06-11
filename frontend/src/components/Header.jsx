import React from 'react';
import { ShoppingBag, Compass, Package, LogOut, Sparkles } from 'lucide-react';

function Header({ user, activeTab, setActiveTab, cartCount, onLogout, onEditProfile }) {
  return (
    <header className="glass rounded-none sticky top-0 z-40 border-b border-slate-200/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-tr from-indigo-500 to-emerald-400 p-2.5 rounded-xl text-white shadow-glow animate-pulse">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-indigo-700 to-emerald-600 bg-clip-text text-transparent">
            Cửa Hàng EcomAI
          </h1>
          <p className="text-[10px] text-text-secondary uppercase tracking-widest">Hệ thống mua sắm thông minh</p>
        </div>
      </div>

      {user && (
        <nav className="hidden md:flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('shop')} 
            className={`btn ${activeTab === 'shop' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Compass className="h-4 w-4" /> Cửa hàng
          </button>
          <button 
            onClick={() => setActiveTab('cart')} 
            className={`btn ${activeTab === 'cart' ? 'btn-primary' : 'btn-secondary'} relative`}
          >
            <ShoppingBag className="h-4 w-4" /> Giỏ hàng
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Package className="h-4 w-4" /> Đơn hàng
          </button>
          <button 
            onClick={() => setActiveTab('ai')} 
            className={`btn ${activeTab === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Sparkles className="h-4 w-4 text-emerald-600" /> Gợi ý AI
          </button>
        </nav>
      )}

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">@{user.username}</p>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-200">
                {user.role}
              </span>
            </div>
            <div 
              onClick={onEditProfile}
              className="bg-slate-100 h-10 w-10 rounded-full flex items-center justify-center border border-slate-200 text-emerald-600 font-bold cursor-pointer hover:border-emerald-600 transition-colors"
              title="Sửa thông tin cá nhân"
            >
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <button onClick={onLogout} className="btn btn-secondary p-2.5 text-red-600 hover:text-red-700" title="Đăng xuất">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="text-xs text-text-secondary">Vui lòng đăng nhập</span>
        )}
      </div>
    </header>
  );
}

export default Header;
