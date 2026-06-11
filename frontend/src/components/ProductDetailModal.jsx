import React from 'react';
import { X } from 'lucide-react';
import { formatPrice, resolveImageUrl } from '../utils/format';

function ProductDetailModal({ selectedProduct, onClose, onAddToCart }) {
  if (!selectedProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-text-secondary hover:text-white btn btn-secondary p-1.5"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Image Column */}
          <div className="h-64 md:h-full min-h-[200px] rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden relative">
            {selectedProduct.images && selectedProduct.images.length > 0 ? (
              <img src={resolveImageUrl(selectedProduct.images[0].image_url)} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-7xl">
                {selectedProduct.product_type === 'BOOK' ? '📚' : selectedProduct.product_type === 'ELECTRONICS' ? '💻' : '👕'}
              </span>
            )}
            <span className="absolute top-3 left-3 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md font-bold">
              {selectedProduct.product_type}
            </span>
          </div>

          {/* Details Column */}
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">{selectedProduct.name}</h3>
              <span className="text-xs text-text-secondary uppercase tracking-widest">{selectedProduct.category}</span>
              
              <div className="text-2xl font-bold text-emerald-400 my-4">{formatPrice(selectedProduct.price)}</div>
              
              {selectedProduct.description && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase text-text-secondary tracking-wide mb-1.5">Mô tả</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">{selectedProduct.description}</p>
                </div>
              )}

              {/* Specific Attributes */}
              <div className="bg-white/5 border border-white/5 p-4 rounded-xl mb-6">
                <h4 className="text-xs font-bold uppercase text-indigo-300 tracking-wide mb-2">Thông số chi tiết</h4>
                
                {selectedProduct.product_type === 'BOOK' && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                    <div>Tác giả: <span className="text-white font-medium">{selectedProduct.details?.author || 'N/A'}</span></div>
                    <div>NXB: <span className="text-white font-medium">{selectedProduct.details?.publisher || 'N/A'}</span></div>
                    <div>Năm xuất bản: <span className="text-white font-medium">{selectedProduct.details?.publication_year || 'N/A'}</span></div>
                    <div>Số trang: <span className="text-white font-medium">{selectedProduct.details?.pages ? `${selectedProduct.details.pages} trang` : 'N/A'}</span></div>
                  </div>
                )}

                {selectedProduct.product_type === 'ELECTRONICS' && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                    <div>Thương hiệu: <span className="text-white font-medium">{selectedProduct.details?.brand || 'N/A'}</span></div>
                    <div>Model: <span className="text-white font-medium">{selectedProduct.details?.model || 'N/A'}</span></div>
                    <div>Bảo hành: <span className="text-white font-medium">{selectedProduct.details?.warranty_months ? `${selectedProduct.details.warranty_months} tháng` : 'N/A'}</span></div>
                    {selectedProduct.details?.specifications && (
                      <div className="col-span-2 mt-1 border-t border-white/5 pt-1">
                        <div>Thông số kỹ thuật:</div>
                        {Object.entries(selectedProduct.details.specifications).map(([k, v]) => (
                          <div key={k} className="pl-2 mt-0.5 text-white">{k}: {String(v)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedProduct.product_type === 'FASHION' && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                    <div>Thương hiệu: <span className="text-white font-medium">{selectedProduct.details?.brand || 'N/A'}</span></div>
                    <div>Chất liệu: <span className="text-white font-medium">{selectedProduct.details?.material || 'N/A'}</span></div>
                    <div>Kích cỡ: <span className="text-white font-medium">{selectedProduct.details?.size || 'N/A'}</span></div>
                    <div>Màu sắc: <span className="text-white font-medium">{selectedProduct.details?.color || 'N/A'}</span></div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-xs text-text-secondary">Số lượng còn lại: {selectedProduct.stock}</span>
              <button 
                onClick={() => onAddToCart(selectedProduct.id, 1)}
                className="btn btn-primary"
                disabled={selectedProduct.stock <= 0}
              >
                {selectedProduct.stock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailModal;
