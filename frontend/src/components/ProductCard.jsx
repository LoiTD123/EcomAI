import React from 'react';
import { formatPrice, resolveImageUrl } from '../utils/format';

function ProductCard({ product, onClick }) {
  return (
    <div 
      onClick={() => onClick(product.id)}
      className="glass-card flex flex-col justify-between cursor-pointer"
    >
      <div>
        <div className="h-44 w-full rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center overflow-hidden mb-4 relative">
          {product.image ? (
            <img src={resolveImageUrl(product.image)} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-5xl">
              {product.product_type === 'BOOK' ? '📚' : product.product_type === 'ELECTRONICS' ? '💻' : '👕'}
            </span>
          )}
          <span className="absolute top-2 right-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-50 rounded-md text-indigo-600 border border-indigo-200">
            {product.product_type}
          </span>
        </div>
        <h3 className="font-semibold text-text-primary text-base mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-xs text-text-secondary mb-3">{product.category}</p>
      </div>
      <div className="flex items-center justify-between mt-4 border-t border-slate-200/60 pt-4">
        <span className="text-lg font-bold text-emerald-600">{formatPrice(product.price)}</span>
        <span className="text-xs text-text-muted">Kho: {product.stock}</span>
      </div>
    </div>
  );
}

export default ProductCard;
