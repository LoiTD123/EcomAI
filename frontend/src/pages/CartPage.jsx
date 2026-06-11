import React, { useState } from 'react';
import { ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { orderAPI, aiAPI } from '../services/api';
import { formatPrice, resolveImageUrl } from '../utils/format';

function CartPage({ 
  user, 
  cartDetails, 
  onUpdateCartQty, 
  onRemoveCartItem, 
  onCheckoutSuccess, 
  setActiveTab 
}) {
  const [shippingAddress, setShippingAddress] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [orderingMessage, setOrderingMessage] = useState('');

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!shippingAddress || !recipientName || !recipientPhone) {
      alert('Vui lòng nhập đầy đủ thông tin giao hàng.');
      return;
    }
    try {
      setOrderingMessage('Đang xử lý đơn hàng của bạn...');
      const resp = await orderAPI.create({
        shipping_address: shippingAddress,
        recipient_name: recipientName,
        recipient_phone: recipientPhone
      });
      setOrderingMessage('');
      alert(`Đặt hàng thành công! Mã đơn hàng: ${resp.data.order_id}`);
      
      // Clear forms
      setShippingAddress('');
      setRecipientName('');
      setRecipientPhone('');

      // Log PURCHASE behaviors for all items in the cart
      cartDetails.forEach(item => {
        aiAPI.logBehavior({
          user_id: user.id,
          product_id: item.product_id,
          behavior_type: 'PURCHASE'
        }).catch(() => {});
      });

      // Notify App.jsx about success to reload cart, orders, recommendations and switch tab
      onCheckoutSuccess();

    } catch (err) {
      setOrderingMessage('');
      alert(err.response?.data?.error || 'Đặt hàng thất bại. Vui lòng kiểm tra lại tồn kho.');
    }
  };

  return (
    <div className="flex-grow flex flex-col gap-6 animate-fade-in">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
        Giỏ hàng của bạn
      </h2>
      {cartDetails.length === 0 ? (
        <div className="glass-card text-center py-20">
          <ShoppingBag className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary mb-6">Giỏ hàng của bạn đang rỗng.</p>
          <button onClick={() => setActiveTab('shop')} className="btn btn-primary">
            Mua sắm ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Cart Items list */}
          <div className="xl:col-span-8 flex flex-col gap-4">
            {cartDetails.map(item => (
              <div key={item.id} className="glass p-4 rounded-2xl flex items-center justify-between gap-4">
                <div className="h-16 w-16 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center text-2xl overflow-hidden shrink-0">
                  {item.product?.image ? (
                    <img src={resolveImageUrl(item.product.image)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    item.product?.product_type === 'BOOK' ? '📚' : item.product?.product_type === 'ELECTRONICS' ? '💻' : '👕'
                  )}
                </div>
                
                <div className="flex-grow min-w-0">
                  <h4 className="font-semibold text-white text-sm line-clamp-1">{item.product?.name}</h4>
                  <p className="text-xs text-emerald-400 font-semibold mt-0.5">{formatPrice(item.product?.price || 0)}</p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => onUpdateCartQty(item.id, item.quantity - 1)}
                    className="btn btn-secondary p-1 rounded-lg"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => onUpdateCartQty(item.id, item.quantity + 1)}
                    className="btn btn-secondary p-1 rounded-lg"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button 
                  onClick={() => onRemoveCartItem(item.id)}
                  className="btn btn-secondary p-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Order summary & Delivery info */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <div className="glass-card">
              <h3 className="font-bold text-white text-lg mb-4 border-b border-white/5 pb-2">
                Hóa đơn tạm tính
              </h3>
              <div className="flex items-center justify-between mb-3 text-sm text-text-secondary">
                <span>Tổng số lượng</span>
                <span className="text-white font-semibold">
                  {cartDetails.reduce((sum, i) => sum + i.quantity, 0)} sản phẩm
                </span>
              </div>
              <div className="flex items-center justify-between mb-6 text-base text-white font-bold">
                <span>Tổng cộng</span>
                <span className="text-emerald-400">
                  {formatPrice(cartDetails.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0))}
                </span>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="border-t border-white/5 pt-4">
                <h4 className="font-bold text-white text-sm mb-3">Thông tin giao hàng (COD)</h4>
                <div className="form-group">
                  <label className="form-label">Người nhận</label>
                  <input 
                    type="text" 
                    value={recipientName} 
                    onChange={e => setRecipientName(e.target.value)} 
                    className="form-input py-2 px-3 text-sm" 
                    placeholder="Nguyễn Văn A" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SĐT nhận hàng</label>
                  <input 
                    type="text" 
                    value={recipientPhone} 
                    onChange={e => setRecipientPhone(e.target.value)} 
                    className="form-input py-2 px-3 text-sm" 
                    placeholder="0987654321" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Địa chỉ</label>
                  <textarea 
                    value={shippingAddress} 
                    onChange={e => setShippingAddress(e.target.value)} 
                    className="form-input py-2 px-3 text-sm h-16 resize-none" 
                    placeholder="Số nhà, Tên đường, Quận/Huyện..." 
                    required 
                  />
                </div>

                {orderingMessage && (
                  <p className="text-xs text-indigo-300 text-center mb-3 animate-pulse">
                    {orderingMessage}
                  </p>
                )}

                <button type="submit" className="btn btn-primary w-full py-2.5 text-sm">
                  Xác nhận đặt hàng COD
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
