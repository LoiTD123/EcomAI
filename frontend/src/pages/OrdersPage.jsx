import React from 'react';
import { Package } from 'lucide-react';
import { formatPrice } from '../utils/format';

function OrdersPage({ orders, onDetailClick }) {
  return (
    <div className="flex-grow flex flex-col gap-6 animate-fade-in">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
        Lịch sử đơn hàng
      </h2>
      {orders.length === 0 ? (
        <div className="glass-card text-center py-20">
          <Package className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">Bạn chưa thực hiện đơn đặt hàng nào.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map(order => (
            <div 
              key={order.order_id} 
              className="glass p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h4 className="font-bold text-white text-base">Đơn hàng #{order.order_id}</h4>
                  <span className="text-[10px] text-text-secondary bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">
                  Giá trị: <span className="text-emerald-400 font-bold">{formatPrice(order.total_amount)}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between border-t border-white/5 sm:border-0 pt-3 sm:pt-0">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  order.status === 'CONFIRMED' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                  order.status === 'SHIPPING' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                  {order.status}
                </span>
                <button 
                  onClick={() => onDetailClick(order.order_id)} 
                  className="btn btn-secondary py-1.5 px-3 text-xs"
                >
                  Chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
