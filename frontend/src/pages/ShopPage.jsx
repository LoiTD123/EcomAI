import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { productAPI, aiAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

function ShopPage({ user, onProductClick }) {
  const [products, setProducts] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, activeSearchQuery]);

  useEffect(() => {
    loadProducts();
  }, [typeFilter, currentPage, activeSearchQuery]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const params = {
        limit: 9,
        page: currentPage
      };
      if (typeFilter) params.product_type = typeFilter;
      if (activeSearchQuery) params.search = activeSearchQuery;

      const resp = await productAPI.list(params);
      setProducts(resp.data.results);
      setTotalCount(resp.data.count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearchQuery(searchQuery);
    if (user && searchQuery) {
      aiAPI.logSearch(searchQuery).catch(() => {});
    }
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard 
                key={product.id}
                product={product}
                onClick={onProductClick}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalCount > 9 && (
            <div className="flex justify-between items-center glass p-4 rounded-xl mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary py-2 px-4 flex items-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" /> Trang trước
              </button>

              <span className="text-sm text-text-secondary">
                Trang <strong>{currentPage}</strong> / {Math.ceil(totalCount / 9)}
              </span>

              <button
                onClick={() => setCurrentPage(prev => (currentPage * 9 < totalCount ? prev + 1 : prev))}
                disabled={currentPage * 9 >= totalCount}
                className="btn btn-secondary py-2 px-4 flex items-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trang sau <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ShopPage;
