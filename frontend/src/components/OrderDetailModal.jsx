import React from 'react';
import { X, Calendar, MapPin, CreditCard, Clipboard, Truck } from 'lucide-react';
import { formatPrice, resolveImageUrl } from '../utils/format';

function OrderDetailModal({ order, onClose }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in relative p-6">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-text-secondary hover:text-white btn btn-secondary p-1.5"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-xl font-bold text-white">Chi tiết đơn hàng #{order.order_id}</h3>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}>
              {order.status}
            </span>
          </div>
          <p className="text-xs text-text-secondary flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}
          </p>
        </div>

        {/* Section: Order items */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase text-indigo-300 tracking-wider mb-3 flex items-center gap-1.5">
            <Clipboard className="h-4 w-4" /> Danh sách sản phẩm
          </h4>
          <div className="flex flex-col gap-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="glass p-3 rounded-xl flex items-center justify-between gap-4">
                <div className="h-12 w-12 bg-black/40 border border-white/5 rounded-lg flex items-center justify-center text-xl overflow-hidden shrink-0">
                  {item.product?.image ? (
                    <img src={resolveImageUrl(item.product.image)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    item.product?.product_type === 'BOOK' ? '📚' : item.product?.product_type === 'ELECTRONICS' ? '💻' : '👕'
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <h5 className="font-semibold text-white text-xs line-clamp-1">{item.product?.name || `Sản phẩm ID ${item.product_id}`}</h5>
                  <p className="text-[10px] text-text-secondary mt-0.5">Số lượng: {item.quantity} x {formatPrice(item.price)}</p>
                </div>
                <span className="font-semibold text-emerald-400 text-xs shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-3">
            <span className="text-xs text-text-secondary font-medium">Tổng tiền thanh toán (COD):</span>
            <span className="text-lg font-bold text-emerald-400">{formatPrice(order.total_amount)}</span>
          </div>
        </div>

        {/* Section: Shipping Info */}
        {order.shipping ? (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
              <h4 className="text-xs font-bold uppercase text-indigo-300 tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Thông tin giao hàng
              </h4>
              <p className="text-xs text-white font-medium mb-1">{order.shipping.recipient_name}</p>
              <p className="text-xs text-text-secondary mb-1">SĐT: {order.shipping.recipient_phone}</p>
              <p className="text-xs text-text-secondary leading-relaxed">Địa chỉ: {order.shipping.shipping_address}</p>
            </div>
            
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
              <h4 className="text-xs font-bold uppercase text-indigo-300 tracking-wider mb-2 flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" /> Trạng thái vận đơn
              </h4>
              <p className="text-xs text-white font-medium mb-1">Mã vận đơn: <span className="font-mono text-xs text-indigo-400">{order.shipping.tracking_number}</span></p>
              <p className="text-xs text-text-secondary mb-1">Đơn vị: {order.shipping.carrier}</p>
              <p className="text-xs text-text-secondary">Trạng thái: <span className="uppercase text-amber-400 font-bold">{order.shipping.status}</span></p>
              
              {order.shipping.tracking_updates && order.shipping.tracking_updates.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-text-secondary">
                  <span className="text-white">Hành trình:</span> {order.shipping.tracking_updates[order.shipping.tracking_updates.length - 1].location} ({order.shipping.tracking_updates[order.shipping.tracking_updates.length - 1].description})
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/5 p-4 rounded-xl mb-6 text-center text-xs text-text-secondary">
            Đang cập nhật thông tin giao hàng...
          </div>
        )}

        {/* Section: Status history */}
        {order.history && order.history.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase text-indigo-300 tracking-wider mb-3">Lịch sử trạng thái</h4>
            <div className="flex flex-col gap-2 pl-2 border-l border-white/10">
              {order.history.map((hist, idx) => (
                <div key={idx} className="relative pl-4">
                  <div className="absolute left-[-13px] top-1 h-2 w-2 rounded-full bg-indigo-500" />
                  <p className="text-xs text-white font-medium">{hist.status}</p>
                  <p className="text-[10px] text-text-secondary">{new Date(hist.changed_at).toLocaleString('vi-VN')} {hist.comment ? `— ${hist.comment}` : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderDetailModal;
