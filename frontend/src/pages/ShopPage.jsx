import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Package } from 'lucide-react';
import { productAPI, aiAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

function ShopPage({ user, onProductClick }) {
  const [products, setProducts] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [typeFilter]);

  const loadProducts = async (isSearch = false) => {
    setLoadingProducts(true);
    try {
      const params = {};
      if (typeFilter) params.product_type = typeFilter;
      if (searchQuery && isSearch) {
        params.search = searchQuery;
        // Log search query to AI Service
        if (user) {
          aiAPI.logSearch(searchQuery).catch(() => {});
        }
      }
      const resp = await productAPI.list(params);
      setProducts(resp.data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts(true);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 animate-fade-in">
      {/* Search Bar & Filters */}
      <div className="glass p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
          <input 
            type="text" 
            placeholder="Tìm kiếm sách, đồ điện tử, thời trang..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input pr-10"
          />
          <button type="submit" className="absolute right-3 top-3 text-text-secondary hover:text-white">
            <Search className="h-5 w-5" />
          </button>
        </form>

        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setTypeFilter('')} 
            className={`btn flex-1 sm:flex-none py-2 px-4 text-xs ${typeFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Tất cả
          </button>
          <button 
            onClick={() => setTypeFilter('BOOK')} 
            className={`btn flex-1 sm:flex-none py-2 px-4 text-xs ${typeFilter === 'BOOK' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Sách
          </button>
          <button 
            onClick={() => setTypeFilter('ELECTRONICS')} 
            className={`btn flex-1 sm:flex-none py-2 px-4 text-xs ${typeFilter === 'ELECTRONICS' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Điện tử
          </button>
          <button 
            onClick={() => setTypeFilter('FASHION')} 
            className={`btn flex-1 sm:flex-none py-2 px-4 text-xs ${typeFilter === 'FASHION' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Thời trang
          </button>
        </div>
      </div>

      {/* Product Catalog Grid */}
      {loadingProducts ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card text-center py-20">
          <Package className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">Không tìm thấy sản phẩm nào trong kho.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map(product => (
            <ProductCard 
              key={product.id}
              product={product}
              onClick={onProductClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ShopPage;
