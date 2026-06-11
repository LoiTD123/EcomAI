import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

function AIRecommendations({ aiRecommendations, onLoadRecommendations, onProductClick }) {
  return (
    <div className="glass-card flex-shrink-0">
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <h3 className="font-bold text-white text-sm">Gợi ý cá nhân hóa (Hybrid)</h3>
        </div>
        <button onClick={onLoadRecommendations} className="text-text-secondary hover:text-white p-1 rounded-lg" title="Làm mới">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {aiRecommendations.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-4">Tương tác thêm để kích hoạt thuật toán lai.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {aiRecommendations.map((rec, i) => (
            <div 
              key={rec.id} 
              onClick={() => onProductClick(rec.id)}
              className="glass p-2.5 rounded-xl flex items-center justify-between cursor-pointer hover:border-indigo-500/25 transition-all text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-text-muted">#{i+1}</span>
                <p className="text-white font-medium line-clamp-1">{rec.name}</p>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                {Math.round(rec.score * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AIRecommendations;
