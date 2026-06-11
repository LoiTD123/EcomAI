import React, { useState, useEffect } from 'react';
import { Truck, X, MapPin, RefreshCw } from 'lucide-react';
import { shippingAPI } from '../../services/api';

function ShippingTab() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [shippingTrackingForm, setShippingTrackingForm] = useState({
    location: '',
    status: 'SHIPPING',
    description: ''
  });

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    setLoading(true);
    try {
      const resp = await shippingAPI.list();
      setShipments(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await shippingAPI.updateTracking({
        tracking_number: selectedShipment.tracking_number,
        location: shippingTrackingForm.location,
        status: shippingTrackingForm.status,
        description: shippingTrackingForm.description
      });
      alert('Cập nhật hành trình vận đơn thành công!');
      setSelectedShipment(null);
      loadShipments();
    } catch (err) {
      alert(err.response?.data?.error || 'Cập nhật thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteShipping = async (trackingNumber) => {
    if (!window.confirm('Bạn có chắc chắn xác nhận vận đơn này đã giao hàng và thu tiền COD thành công?')) return;
    setLoading(true);
    try {
      await shippingAPI.complete({ tracking_number: trackingNumber });
      alert('Đã xác nhận hoàn thành giao hàng!');
      loadShipments();
    } catch (err) {
      alert(err.response?.data?.error || 'Xác nhận hoàn thành giao hàng thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">Quản Lý Vận Chuyển</h2>
        <p className="text-xs text-text-secondary">Quản lý các vận đơn, cập nhật hành trình và xác nhận giao hàng COD.</p>
      </div>

      {selectedShipment ? (
        <div className="glass-card">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white">
              Cập Nhật Hành Trình Vận Đơn: {selectedShipment.tracking_number}
            </h3>
            <button 
              onClick={() => setSelectedShipment(null)}
              className="text-text-secondary hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6 bg-black/20 p-4 rounded-xl border border-white/5 text-sm space-y-2">
            <p className="text-white"><span className="text-text-secondary">Người nhận:</span> {selectedShipment.recipient_name} ({selectedShipment.recipient_phone})</p>
            <p className="text-white"><span className="text-text-secondary">Địa chỉ:</span> {selectedShipment.shipping_address}</p>
            <p className="text-white"><span className="text-text-secondary">Trạng thái hiện tại:</span> <span className="uppercase text-amber-400 font-bold">{selectedShipment.status}</span></p>
          </div>

          <form onSubmit={handleTrackingSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Vị trí hiện tại</label>
                <input 
                  type="text" required
                  value={shippingTrackingForm.location}
                  onChange={e => setShippingTrackingForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ví dụ: Kho trung chuyển Hà Nội, Bưu cục Quận 1..."
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Chọn trạng thái giao hàng</label>
                <select
                  value={shippingTrackingForm.status}
                  onChange={e => setShippingTrackingForm(prev => ({ ...prev, status: e.target.value }))}
                  className="form-input bg-black/40 border border-white/5"
                >
                  <option value="PROCESSING">PROCESSING (Đang xử lý gói hàng)</option>
                  <option value="SHIPPING">SHIPPING (Đang vận chuyển)</option>
                  <option value="DELIVERED">DELIVERED (Đã giao hàng và thu COD)</option>
                  <option value="CANCELLED">CANCELLED (Vận chuyển thất bại / Hủy)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mô tả hành động</label>
              <input 
                type="text"
                value={shippingTrackingForm.description}
                onChange={e => setShippingTrackingForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ví dụ: Đã rời kho phân loại đi đến bưu cục giao nhận."
                className="form-input"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button 
                type="button" 
                onClick={() => setSelectedShipment(null)}
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
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="glass-card text-center py-10 text-text-secondary">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-400 mb-2" />
              Đang tải danh sách vận đơn...
            </div>
          ) : shipments.length === 0 ? (
            <div className="glass-card text-center py-10 text-text-secondary">
              Không có vận đơn vận chuyển nào trong hệ thống.
            </div>
          ) : (
            shipments.map(s => (
              <div key={s.id} className="glass-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:scale-[1.002]">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white">{s.tracking_number}</span>
                    <span className="text-[10px] text-text-secondary bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">
                      Đơn: #{s.order_id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      s.status === 'DELIVERED'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : s.status === 'CANCELLED'
                        ? 'bg-red-500/10 text-red-300 border-red-500/20'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  
                  <p className="text-xs text-text-secondary">
                    Người nhận: <span className="text-white font-medium">{s.recipient_name}</span> ({s.recipient_phone}) — <span className="text-white/80">{s.shipping_address}</span>
                  </p>

                  {s.tracking_updates && s.tracking_updates.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10 w-fit">
                      <MapPin className="h-3 w-3" />
                      <span>
                        Mới nhất: <strong>{s.tracking_updates[s.tracking_updates.length - 1].location}</strong> ({s.tracking_updates[s.tracking_updates.length - 1].status}) — {s.tracking_updates[s.tracking_updates.length - 1].description}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                  <button
                    onClick={() => {
                      setSelectedShipment(s);
                      setShippingTrackingForm({
                        location: s.tracking_updates?.[s.tracking_updates.length - 1]?.location || '',
                        status: s.status,
                        description: ''
                      });
                    }}
                    className="btn btn-secondary flex-1 md:flex-none py-1.5 px-3 text-[10px] font-bold"
                  >
                    Cập nhật hành trình
                  </button>
                  {s.status !== 'DELIVERED' && s.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleCompleteShipping(s.tracking_number)}
                      className="btn btn-primary flex-1 md:flex-none py-1.5 px-3 text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500"
                    >
                      Giao thành công (COD)
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ShippingTab;
