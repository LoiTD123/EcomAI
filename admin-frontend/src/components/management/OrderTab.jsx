import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, RefreshCw } from 'lucide-react';
import { orderAPI, productAPI } from '../../services/api';
import { formatPrice } from '../../utils/format';
import OrderDetailModal from '../OrderDetailModal';

function OrderTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [orderStatusForm, setOrderStatusForm] = useState({
    status: 'CONFIRMED',
    comment: ''
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const resp = await orderAPI.list();
      setOrders(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrderDetails = async (orderId) => {
    try {
      const resp = await orderAPI.get(orderId);
      const orderData = resp.data;
      
      const populatedItems = await Promise.all(
        orderData.items.map(async (item) => {
          try {
            const prodResp = await productAPI.get(item.product_id);
            return {
              ...item,
              product: prodResp.data
            };
          } catch {
            return {
              ...item,
              product: { name: `Sản phẩm ID ${item.product_id}` }
            };
          }
        })
      );
      
      setSelectedOrderDetails({
        ...orderData,
        items: populatedItems
      });
    } catch (err) {
      alert('Không thể tải chi tiết đơn hàng.');
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await orderAPI.updateStatus(selectedOrder.order_id, orderStatusForm.status, orderStatusForm.comment);
      alert('Cập nhật trạng thái đơn hàng thành công!');
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Cập nhật trạng thái thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">Quản Lý Đơn Hàng</h2>
        <p className="text-xs text-text-secondary">Duyệt và cập nhật trạng thái đơn hàng của tất cả khách hàng.</p>
      </div>

      {selectedOrder ? (
        <div className="glass-card">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white">
              Cập Nhật Đơn Hàng #{selectedOrder.order_id}
            </h3>
            <button 
              onClick={() => setSelectedOrder(null)}
              className="text-text-secondary hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 text-sm bg-black/20 p-4 rounded-xl border border-white/5">
            <div>
              <p className="text-text-secondary text-xs uppercase tracking-wider">Tổng số tiền</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">{formatPrice(selectedOrder.total_amount)}</p>
            </div>
            <div>
              <p className="text-text-secondary text-xs uppercase tracking-wider">Trạng thái hiện tại</p>
              <p className="text-sm font-bold text-indigo-300 mt-1 uppercase">{selectedOrder.status}</p>
            </div>
          </div>

          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Chọn trạng thái mới</label>
              <select
                value={orderStatusForm.status}
                onChange={e => setOrderStatusForm(prev => ({ ...prev, status: e.target.value }))}
                className="form-input bg-black/40 border border-white/5"
              >
                <option value="PENDING">PENDING (Chờ xử lý)</option>
                <option value="CONFIRMED">CONFIRMED (Đã xác nhận / Đóng gói)</option>
                <option value="SHIPPING">SHIPPING (Đang giao hàng)</option>
                <option value="DELIVERED">DELIVERED (Giao thành công)</option>
                <option value="CANCELLED">CANCELLED (Hủy đơn hàng)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ghi chú (Comment)</label>
              <input 
                type="text"
                value={orderStatusForm.comment}
                onChange={e => setOrderStatusForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Nhập ghi chú hoặc lý do thay đổi trạng thái..."
                className="form-input"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button 
                type="button" 
                onClick={() => setSelectedOrder(null)}
                className="btn btn-secondary"
              >
                Quay lại
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
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/30 border-b border-white/5 text-[10px] uppercase tracking-wider text-text-secondary">
                  <th className="py-4 px-6">Đơn Hàng ID</th>
                  <th className="py-4 px-6">User ID</th>
                  <th className="py-4 px-6">Ngày đặt</th>
                  <th className="py-4 px-6 text-right">Tổng tiền</th>
                  <th className="py-4 px-6 text-center">Trạng thái</th>
                  <th className="py-4 px-6 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-text-secondary">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-400 mb-2" />
                      Đang tải danh sách đơn hàng...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-text-secondary">
                      Không có đơn đặt hàng nào trong hệ thống.
                    </td>
                  </tr>
                ) : (
                  orders.map(o => (
                    <tr key={o.order_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-mono text-sm font-semibold text-white">#{o.order_id}</td>
                      <td className="py-4 px-6 text-text-secondary font-mono text-xs">User: {o.user_id}</td>
                      <td className="py-4 px-6 text-text-secondary">
                        {new Date(o.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-emerald-400">{formatPrice(o.total_amount)}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          o.status === 'DELIVERED' 
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : o.status === 'CANCELLED'
                            ? 'bg-red-500/10 text-red-300 border-red-500/20'
                            : o.status === 'CONFIRMED'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            : o.status === 'SHIPPING'
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                            : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewOrderDetails(o.order_id)}
                            className="btn btn-primary py-1 px-3 text-[10px] font-bold"
                          >
                            Xem chi tiết
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedOrder(o);
                              setOrderStatusForm({ status: o.status, comment: '' });
                            }}
                            className="btn btn-secondary py-1 px-3 text-[10px] font-bold"
                          >
                            Cập nhật trạng thái
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <OrderDetailModal 
        order={selectedOrderDetails}
        onClose={() => setSelectedOrderDetails(null)}
      />
    </div>
  );
}

export default OrderTab;
