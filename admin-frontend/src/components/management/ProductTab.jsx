import React, { useState, useEffect } from 'react';
import { Package, Plus, X, RefreshCw, Edit, Trash2, Upload, Search } from 'lucide-react';
import { productAPI } from '../../services/api';
import { formatPrice, resolveImageUrl } from '../../utils/format';

function ProductTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toString().includes(searchTerm) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    price: '',
    stock: '',
    product_type: 'BOOK',
    category_id: '1',
    description: '',
    imageUrl: '',
    author: '',
    publisher: '',
    publication_year: '',
    isbn: '',
    pages: '',
    brand: '',
    model: '',
    warranty_months: '',
    specifications: '',
    material: '',
    size: '',
    color: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const resp = await productAPI.list({ limit: 100 });
      setProducts(resp.data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    setProductForm(prev => ({ ...prev, name, slug }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const resp = await productAPI.uploadImage(formData);
      setProductForm(prev => ({ ...prev, imageUrl: resp.data.image_url }));
    } catch (err) {
      alert(err.response?.data?.error || 'Tải ảnh lên thất bại.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleEditClick = async (product) => {
    setLoading(true);
    try {
      const resp = await productAPI.get(product.id);
      const data = resp.data;
      
      let specificationsStr = '';
      if (data.product_type === 'ELECTRONICS' && data.details?.specifications) {
        specificationsStr = typeof data.details.specifications === 'object' 
          ? JSON.stringify(data.details.specifications, null, 2) 
          : data.details.specifications;
      }

      setProductForm({
        name: data.name,
        slug: data.slug,
        price: data.price.toString(),
        stock: data.stock.toString(),
        product_type: data.product_type,
        category_id: data.category === 'Sách' || data.product_type === 'BOOK' ? '1' : (data.category === 'Đồ Điện Tử' || data.product_type === 'ELECTRONICS' ? '2' : '3'),
        description: data.description || '',
        imageUrl: data.images?.length > 0 ? data.images[0].image_url : '',
        author: data.details?.author || '',
        publisher: data.details?.publisher || '',
        publication_year: data.details?.publication_year?.toString() || '',
        isbn: data.details?.isbn || '',
        pages: data.details?.pages?.toString() || '',
        brand: data.details?.brand || '',
        model: data.details?.model || '',
        warranty_months: data.details?.warranty_months?.toString() || '',
        specifications: specificationsStr,
        material: data.details?.material || '',
        size: data.details?.size || '',
        color: data.details?.color || ''
      });

      setEditingProductId(data.id);
      setEditMode(true);
      setShowAddProduct(true);
    } catch (err) {
      alert('Không thể tải chi tiết sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (productId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      return;
    }
    try {
      await productAPI.delete(productId);
      alert("Xóa sản phẩm thành công!");
      loadProducts();
    } catch (err) {
      alert(err.response?.data?.error || "Xóa sản phẩm thất bại.");
    }
  };

  const handleCancel = () => {
    setShowAddProduct(false);
    setEditMode(false);
    setEditingProductId(null);
    setProductForm({
      name: '', slug: '', price: '', stock: '', product_type: 'BOOK', category_id: '1',
      description: '', imageUrl: '', author: '', publisher: '', publication_year: '',
      isbn: '', pages: '', brand: '', model: '', warranty_months: '', specifications: '',
      material: '', size: '', color: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    let details = {};
    if (productForm.product_type === 'BOOK') {
      details = {
        author: productForm.author,
        publisher: productForm.publisher,
        publication_year: parseInt(productForm.publication_year) || new Date().getFullYear(),
        isbn: productForm.isbn,
        pages: parseInt(productForm.pages) || 0
      };
    } else if (productForm.product_type === 'ELECTRONICS') {
      let specs = {};
      try {
        specs = productForm.specifications ? JSON.parse(productForm.specifications) : {};
      } catch (err) {
        specs = { details: productForm.specifications };
      }
      details = {
        brand: productForm.brand,
        model: productForm.model,
        warranty_months: parseInt(productForm.warranty_months) || 0,
        specifications: specs
      };
    } else if (productForm.product_type === 'FASHION') {
      details = {
        brand: productForm.brand,
        material: productForm.material,
        size: productForm.size,
        color: productForm.color
      };
    }

    const images = productForm.imageUrl 
      ? [{ image_url: productForm.imageUrl, is_primary: true }]
      : [];

    const payload = {
      category_id: parseInt(productForm.category_id),
      name: productForm.name,
      slug: productForm.slug,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock),
      description: productForm.description,
      product_type: productForm.product_type,
      details,
      images
    };

    try {
      if (editMode) {
        await productAPI.update(editingProductId, payload);
        alert('Cập nhật sản phẩm thành công!');
      } else {
        await productAPI.create(payload);
        alert('Tạo sản phẩm thành công!');
      }
      handleCancel();
      loadProducts();
    } catch (err) {
      alert(err.response?.data?.error || (editMode ? 'Cập nhật sản phẩm thất bại.' : 'Tạo sản phẩm thất bại.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Quản Lý Sản Phẩm</h2>
          <p className="text-xs text-text-secondary">Xem và bổ sung các sản phẩm trong kho hệ thống.</p>
        </div>
        {!showAddProduct && (
          <button 
            onClick={() => setShowAddProduct(true)}
            className="btn btn-primary py-2.5"
          >
            <Plus className="h-4 w-4" />
            Thêm sản phẩm
          </button>
        )}
      </div>

      {showAddProduct ? (
        <div className="glass-card">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white">
              {editMode ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
            </h3>
            <button 
              onClick={handleCancel}
              className="text-text-secondary hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Loại sản phẩm</label>
                <select 
                  value={productForm.product_type}
                  disabled={editMode}
                  onChange={e => {
                    const type = e.target.value;
                    let catId = '1';
                    if (type === 'ELECTRONICS') catId = '2';
                    if (type === 'FASHION') catId = '3';
                    setProductForm(prev => ({ ...prev, product_type: type, category_id: catId }));
                  }}
                  className="form-input bg-black/40 border border-white/5 disabled:opacity-50"
                >
                  <option value="BOOK">Sách (BOOK)</option>
                  <option value="ELECTRONICS">Thiết bị điện tử (ELECTRONICS)</option>
                  <option value="FASHION">Thời trang (FASHION)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Danh mục (Category)</label>
                <select 
                  value={productForm.category_id}
                  onChange={e => setProductForm(prev => ({ ...prev, category_id: e.target.value }))}
                  className="form-input bg-black/40 border border-white/5"
                >
                  <option value="1">Sách (ID: 1)</option>
                  <option value="2">Đồ Điện Tử (ID: 2)</option>
                  <option value="3">Thời Trang (ID: 3)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Tên sản phẩm</label>
                <input 
                  type="text" required
                  value={productForm.name}
                  onChange={handleNameChange}
                  placeholder="Ví dụ: Lập trình Java cơ bản"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Đường dẫn slug</label>
                <input 
                  type="text" required
                  value={productForm.slug}
                  onChange={e => setProductForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="lap-trinh-java-co-ban"
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Giá bán (VND)</label>
                <input 
                  type="number" required min="0"
                  value={productForm.price}
                  onChange={e => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="150000"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số lượng trong kho</label>
                <input 
                  type="number" required min="0"
                  value={productForm.stock}
                  onChange={e => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="20"
                  className="form-input"
                />
              </div>
              
              <div className="form-group col-span-2 md:col-span-1">
                <label className="form-label">Hình ảnh sản phẩm</label>
                <div className="flex items-center gap-3">
                  <label className="btn btn-secondary py-2 px-3 text-xs flex items-center gap-2 cursor-pointer border border-white/10 bg-white/5 hover:bg-white/10">
                    <Upload className="h-4 w-4 text-indigo-400" />
                    Chọn ảnh
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {imageUploading && <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />}
                  {productForm.imageUrl && (
                    <div className="relative group h-10 w-10 border border-white/10 rounded overflow-hidden">
                      <img src={resolveImageUrl(productForm.imageUrl)} alt="Uploaded" className="h-full w-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setProductForm(prev => ({ ...prev, imageUrl: '' }))}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mô tả sản phẩm</label>
              <textarea 
                value={productForm.description}
                onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                rows="3"
                placeholder="Nhập mô tả chi tiết sản phẩm..."
                className="form-input"
              />
            </div>

            <div className="border-t border-white/5 pt-4">
              <h4 className="text-sm font-bold text-indigo-300 mb-4">Thông tin chi tiết đặc thù</h4>
              
              {productForm.product_type === 'BOOK' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Tác giả</label>
                    <input 
                      type="text" required
                      value={productForm.author}
                      onChange={e => setProductForm(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Nguyễn Văn A"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nhà xuất bản</label>
                    <input 
                      type="text" required
                      value={productForm.publisher}
                      onChange={e => setProductForm(prev => ({ ...prev, publisher: e.target.value }))}
                      placeholder="NXB Trẻ"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Năm xuất bản</label>
                    <input 
                      type="number" required
                      value={productForm.publication_year}
                      onChange={e => setProductForm(prev => ({ ...prev, publication_year: e.target.value }))}
                      placeholder="2023"
                      className="form-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="form-group">
                      <label className="form-label">Số trang</label>
                      <input 
                        type="number" required
                        value={productForm.pages}
                        onChange={e => setProductForm(prev => ({ ...prev, pages: e.target.value }))}
                        placeholder="240"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mã ISBN</label>
                      <input 
                        type="text"
                        value={productForm.isbn}
                        onChange={e => setProductForm(prev => ({ ...prev, isbn: e.target.value }))}
                        placeholder="978-604..."
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {productForm.product_type === 'ELECTRONICS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Thương hiệu (Brand)</label>
                    <input 
                      type="text" required
                      value={productForm.brand}
                      onChange={e => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Apple, Sony..."
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model</label>
                    <input 
                      type="text" required
                      value={productForm.model}
                      onChange={e => setProductForm(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="15 Pro, WH-1000XM5"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Thời hạn bảo hành (Tháng)</label>
                    <input 
                      type="number" required
                      value={productForm.warranty_months}
                      onChange={e => setProductForm(prev => ({ ...prev, warranty_months: e.target.value }))}
                      placeholder="12"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Thông số kỹ thuật (JSON string)</label>
                    <textarea 
                      value={productForm.specifications}
                      onChange={e => setProductForm(prev => ({ ...prev, specifications: e.target.value }))}
                      placeholder='Ví dụ: {"screen": "6.1 inch", "ram": "8GB"}'
                      rows="2"
                      className="form-input font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {productForm.product_type === 'FASHION' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="form-group">
                    <label className="form-label">Thương hiệu</label>
                    <input 
                      type="text" required
                      value={productForm.brand}
                      onChange={e => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Uniqlo"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chất liệu</label>
                    <input 
                      type="text" required
                      value={productForm.material}
                      onChange={e => setProductForm(prev => ({ ...prev, material: e.target.value }))}
                      placeholder="Cotton, Polyester"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Size</label>
                    <input 
                      type="text" required
                      value={productForm.size}
                      onChange={e => setProductForm(prev => ({ ...prev, size: e.target.value }))}
                      placeholder="M, L, XL"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Màu sắc</label>
                    <input 
                      type="text" required
                      value={productForm.color}
                      onChange={e => setProductForm(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="Đen, Trắng"
                      className="form-input"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button 
                type="button" 
                onClick={handleCancel}
                className="btn btn-secondary"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                Lưu sản phẩm
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Search bar */}
          <div className="glass p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full max-w-md">
              <input 
                type="text" 
                placeholder="Tìm kiếm sản phẩm theo tên, ID, danh mục..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="form-input pr-10"
              />
              <span className="absolute right-3 top-3 text-text-secondary">
                <Search className="h-5 w-5" />
              </span>
            </div>
            <span className="text-xs text-text-secondary">
              Hiển thị: <strong>{filteredProducts.length}</strong> / {products.length} sản phẩm
            </span>
          </div>

          <div className="glass rounded-2xl overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/30 border-b border-white/5 text-[10px] uppercase tracking-wider text-text-secondary">
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">Tên sản phẩm</th>
                    <th className="py-4 px-6">Loại</th>
                    <th className="py-4 px-6">Danh mục</th>
                    <th className="py-4 px-6 text-right">Giá</th>
                    <th className="py-4 px-6 text-right">Kho</th>
                    <th className="py-4 px-6 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-text-secondary">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-400 mb-2" />
                        Đang tải danh sách sản phẩm...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-text-secondary">
                        Không có sản phẩm nào khớp với từ khóa tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                         <td className="py-4 px-6 font-mono text-xs text-text-muted">{p.id}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              <img src={resolveImageUrl(p.image)} alt={p.name} className="h-8 w-8 rounded object-cover bg-black/40 border border-white/5" />
                            ) : (
                              <span className="text-xl">
                                {p.product_type === 'BOOK' ? '📚' : p.product_type === 'ELECTRONICS' ? '💻' : '👕'}
                              </span>
                            )}
                            <span className="font-semibold text-white">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-bold uppercase px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/20">
                            {p.product_type}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-text-secondary">{p.category}</td>
                        <td className="py-4 px-6 text-right font-semibold text-emerald-400">{formatPrice(p.price)}</td>
                        <td className="py-4 px-6 text-right text-text-secondary font-mono">{p.stock}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditClick(p)}
                              className="p-1.5 hover:bg-white/10 rounded text-indigo-400 hover:text-indigo-300 transition-colors"
                              title="Sửa sản phẩm"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(p.id)}
                              className="p-1.5 hover:bg-red-500/10 rounded text-red-400 hover:text-red-300 transition-colors"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 className="h-4 w-4" />
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
        </div>
      )}
    </div>
  );
}

export default ProductTab;
