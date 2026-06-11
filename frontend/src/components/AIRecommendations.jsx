import React, { useState } from 'react';
import { Sparkles, RefreshCw, ShoppingBag, Eye } from 'lucide-react';
import { formatPrice, resolveImageUrl } from '../utils/format';

function AIRecommendations({ aiRecommendations, onLoadRecommendations, onProductClick }) {
  const [selectedType, setSelectedType] = useState('ALL');

  // Filter recommendations based on tab type
  const filteredRecs = selectedType === 'ALL'
    ? aiRecommendations
    : aiRecommendations.filter(rec => rec.product_type === selectedType);

  // Helper for Rank style
  const getRankStyle = (index) => {
    if (index === 0) return { badge: "👑 Top 1", style: "from-amber-500 to-yellow-400 text-black shadow-amber-500/20" };
    if (index === 1) return { badge: "⭐ Top 2", style: "from-slate-300 to-slate-100 text-black shadow-slate-300/20" };
    if (index === 2) return { badge: "⚡ Top 3", style: "from-amber-700 to-orange-500 text-white shadow-amber-700/20" };
    return { badge: `#${index + 1}`, style: "from-slate-100 to-slate-200 text-slate-800 border border-slate-200" };
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Upper header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-500 to-emerald-400 p-2.5 rounded-2xl text-white shadow-[0_4px_20px_rgba(99,102,241,0.25)] animate-pulse">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Gợi Ý Mua Sắm Cá Nhân Hóa</h2>
          </div>
        </div>
        
        <button 
          onClick={onLoadRecommendations} 
          className="btn btn-secondary flex items-center gap-2 self-start sm:self-auto hover:rotate-180 duration-500"
          title="Làm mới đề xuất"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Làm mới gợi ý</span>
        </button>
      </div>

      {/* Product Type Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 overflow-x-auto pb-4">
        {[
          { key: 'ALL', label: 'Tất cả gợi ý', icon: '✨' },
          { key: 'BOOK', label: 'Sách', icon: '📚' },
          { key: 'ELECTRONICS', label: 'Điện tử', icon: '💻' },
          { key: 'FASHION', label: 'Thời trang', icon: '👕' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedType(tab.key)}
            className={`btn py-2 px-4 rounded-xl flex items-center gap-2 transition-all ${
              selectedType === tab.key
                ? 'btn-primary shadow-[0_4px_15px_rgba(99,102,241,0.25)]'
                : 'btn-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="font-semibold text-xs md:text-sm">{tab.label}</span>
            {aiRecommendations.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                selectedType === tab.key ? 'bg-white/20 text-white' : 'bg-black/5 text-text-secondary'
              }`}>
                {tab.key === 'ALL' 
                  ? aiRecommendations.length 
                  : aiRecommendations.filter(r => r.product_type === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid view of recommended products */}
      {filteredRecs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center glass-card">
          <div className="h-16 w-16 rounded-full bg-black/[0.02] border border-slate-200/60 flex items-center justify-center text-text-muted mb-4">
            <Sparkles className="h-7 w-7 text-gray-500 animate-pulse" />
          </div>
          <h3 className="text-text-primary font-bold text-base mb-1.5">Không tìm thấy sản phẩm gợi ý</h3>
          <p className="text-xs text-text-secondary max-w-[320px] leading-relaxed">
            {selectedType === 'ALL'
              ? 'Hãy tương tác xem sản phẩm hoặc mua sắm thêm để kích hoạt hệ thống đề xuất AI cá nhân hóa.'
              : `Chưa có gợi ý nào cho danh mục này. Hãy xem thêm các sản phẩm cùng nhóm ở trang Cửa hàng.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecs.map((rec) => {
            // Find overall index in original array to assign Top Rank
            const originalIndex = aiRecommendations.findIndex(r => r.id === rec.id);
            const rank = getRankStyle(originalIndex);
            const matchPercent = Math.round(rec.score * 100);

            // Get product image
            const imageUrl = rec.image ? resolveImageUrl(rec.image) : null;

            return (
              <div 
                key={rec.id}
                onClick={() => onProductClick(rec.id)}
                className="group glass-card flex flex-col justify-between cursor-pointer border border-slate-200/60 hover:border-indigo-500/35 hover:shadow-[0_8px_30px_rgba(99,102,241,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                {/* Score and Rank Floating Badges */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg bg-gradient-to-r shadow-md ${rank.style}`}>
                    {rank.badge}
                  </span>
                </div>
                
                <div className="absolute top-3 right-3 z-10">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 backdrop-blur-md shadow-sm">
                    {matchPercent}% khớp
                  </span>
                </div>

                <div>
                  {/* Image Container */}
                  <div className="h-48 w-full rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center overflow-hidden mb-4 relative group-hover:bg-slate-200/50 transition-colors">
                    {imageUrl ? (
                      <img src={imageUrl} alt={rec.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
                        {rec.product_type === 'BOOK' ? '📚' : rec.product_type === 'ELECTRONICS' ? '💻' : '👕'}
                      </span>
                    )}
                  </div>

                  {/* Metadata and Title */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-indigo-50 text-indigo-600 rounded border border-indigo-200">
                      {rec.product_type}
                    </span>
                    <span className="text-xs text-text-muted">{rec.category || 'Chưa phân loại'}</span>
                  </div>
                  
                  <h3 className="font-bold text-text-primary text-base mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {rec.name}
                  </h3>
                  
                  <p className="text-xs text-text-secondary line-clamp-2 mb-4 h-8 leading-relaxed">
                    {rec.description || 'Không có mô tả sản phẩm cho sản phẩm này.'}
                  </p>
                </div>

                {/* Score bar & Price control */}
                <div className="mt-2 border-t border-slate-200/60 pt-4">
                  {/* Progress bar representing confidence score */}
                  <div className="flex items-center justify-between text-[10px] text-text-muted mb-1.5">
                    <span>Mức độ phù hợp</span>
                    <span className="font-semibold text-text-primary">{matchPercent}%</span>
                  </div>
                  <div className="w-full bg-black/[0.04] rounded-full h-1 mb-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-1 rounded-full"
                      style={{ width: `${Math.max(5, matchPercent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-emerald-600">
                      {rec.price ? formatPrice(rec.price) : 'Liên hệ'}
                    </span>
                    
                    <button className="h-8 w-8 rounded-lg bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 text-indigo-600 hover:text-white flex items-center justify-center transition-all duration-200">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AIRecommendations;
