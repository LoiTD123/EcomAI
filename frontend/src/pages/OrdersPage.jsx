import React, { useState } from 'react';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrice } from '../utils/format';

function OrdersPage({ orders, onDetailClick }) {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;
  const totalPages = Math.ceil(orders.length / limit);
  const startIndex = (currentPage - 1) * limit;
  const paginatedOrders = orders.slice(startIndex, startIndex + limit);

  return (
    <div className="flex-grow flex flex-col justify-between min-h-[450px] animate-fade-in">
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Lịch sử đơn hàng
        </h2>
        {orders.length === 0 ? (
          <div className="glass-card text-center py-20">
            <Package className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">Bạn chưa thực hiện đơn đặt hàng nào.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {paginatedOrders.map(order => (
              <div 
                key={order.order_id} 
                className="glass p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <h4 className="font-bold text-text-primary text-base">Đơn hàng #{order.order_id}</h4>
                    <span className="text-[10px] text-text-secondary bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Giá trị: <span className="text-emerald-600 font-bold">{formatPrice(order.total_amount)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between border-t border-slate-200/60 sm:border-0 pt-3 sm:pt-0">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    order.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    order.status === 'CONFIRMED' ? 'bg-violet-50 text-violet-600 border-violet-200' :
                    order.status === 'SHIPPING' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    order.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-200' :
                    'bg-slate-100 text-slate-500 border-slate-200'
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

      {/* Pagination Controls */}
      {orders.length > limit && (
        <div className="flex justify-between items-center glass p-4 rounded-xl mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary py-2 px-4 flex items-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" /> Trang trước
          </button>

          <span className="text-sm text-text-secondary">
            Trang <strong>{currentPage}</strong> / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => (currentPage < totalPages ? prev + 1 : prev))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary py-2 px-4 flex items-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trang sau <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
