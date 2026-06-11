import React, { useState, useEffect } from 'react';
import { authAPI, productAPI, cartAPI, orderAPI, aiAPI } from './services/api';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import ProductDetailModal from './components/ProductDetailModal';
import AIChatbot from './components/AIChatbot';
import AIRecommendations from './components/AIRecommendations';

// Pages
import AuthPage from './pages/AuthPage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';

function App() {
  // Authentication states
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  
  // Navigation states
  const [activeTab, setActiveTab] = useState('shop'); // 'shop', 'cart', 'orders'
  
  // Cart states
  const [cart, setCart] = useState({ items: [] });
  const [cartDetails, setCartDetails] = useState([]); // Cart items populated with product details

  // Order states
  const [orders, setOrders] = useState([]);

  // AI & Chatbot states
  const [chatSessionId] = useState(`session_${Math.random().toString(36).substring(2, 9)}`);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', message: 'Xin chào! Tôi là trợ lý mua sắm AI. Tôi có thể giúp bạn tìm kiếm sách, đồ điện tử hoặc quần áo thời trang. Bạn cần tư vấn gì hôm nay?' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Load cart & orders & recommendations on login
  useEffect(() => {
    if (user) {
      loadCart();
      loadOrders();
      loadAIRecommendations();
    }
  }, [user]);

  const handleLogout = () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      authAPI.logout(refresh).catch(() => {});
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setCart({ items: [] });
    setCartDetails([]);
    setOrders([]);
    setAiRecommendations([]);
  };

  const loadCart = async () => {
    try {
      const resp = await cartAPI.get();
      setCart(resp.data);
      populateCartDetails(resp.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const populateCartDetails = async (items) => {
    if (!items || items.length === 0) {
      setCartDetails([]);
      return;
    }
    try {
      const details = await Promise.all(
        items.map(async (item) => {
          try {
            const prodResp = await productAPI.get(item.product_id);
            return {
              ...item,
              product: prodResp.data
            };
          } catch {
            return {
              ...item,
              product: { name: `Sản phẩm ID ${item.product_id}`, price: 0 }
            };
          }
        })
      );
      setCartDetails(details);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = async (productId, quantity = 1) => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ.');
      return;
    }
    try {
      await cartAPI.add({ product_id: productId, quantity });
      loadCart();
      
      // Log behavior VIEW and ADD_TO_CART to AI Service
      aiAPI.logBehavior({
        user_id: user.id,
        product_id: productId,
        behavior_type: 'ADD_TO_CART'
      }).then(() => loadAIRecommendations()).catch(() => {});

    } catch (err) {
      alert(err.response?.data?.error || 'Không thể thêm vào giỏ hàng.');
    }
  };

  const handleUpdateCartQty = async (itemId, newQty) => {
    if (newQty < 1) return;
    try {
      await cartAPI.update(itemId, newQty);
      loadCart();
    } catch (err) {
      alert(err.response?.data?.error || 'Cập nhật số lượng thất bại.');
    }
  };

  const handleRemoveCartItem = async (itemId) => {
    try {
      await cartAPI.remove(itemId);
      loadCart();
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductClick = async (productId) => {
    try {
      const resp = await productAPI.get(productId);
      setSelectedProduct(resp.data);

      // Log behavior VIEW to AI Service
      if (user) {
        aiAPI.logBehavior({
          user_id: user.id,
          product_id: productId,
          behavior_type: 'VIEW'
        }).then(() => loadAIRecommendations()).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAIRecommendations = async () => {
    try {
      const resp = await aiAPI.recommend(5);
      setAiRecommendations(resp.data.results);
    } catch (err) {
      console.error(err);
    }
  };

  const loadOrders = async () => {
    try {
      const resp = await orderAPI.list();
      setOrders(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckoutSuccess = () => {
    loadCart();
    loadOrders();
    setActiveTab('orders');
    setTimeout(() => loadAIRecommendations(), 1500);
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', message: userMsg }]);
    setChatLoading(true);

    try {
      const resp = await aiAPI.chat({
        session_id: chatSessionId,
        message: userMsg,
        user_id: user?.id || null
      });
      
      setChatHistory(prev => [...prev, { role: 'model', message: resp.data.response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', message: 'Xin lỗi, tôi gặp sự cố kết nối với máy chủ AI.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        cartCount={cartDetails.reduce((sum, i) => sum + i.quantity, 0)} 
        onLogout={handleLogout} 
      />

      {!user ? (
        <AuthPage onAuthSuccess={setUser} />
      ) : (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Shop/Cart/Orders Panels (Columns 1 to 8) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Navigation for Mobile */}
            <div className="flex md:hidden items-center justify-between glass p-2 rounded-xl">
              <button 
                onClick={() => setActiveTab('shop')} 
                className={`btn flex-1 py-2 ${activeTab === 'shop' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Shop
              </button>
              <button 
                onClick={() => setActiveTab('cart')} 
                className={`btn flex-1 py-2 ${activeTab === 'cart' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Giỏ hàng
              </button>
              <button 
                onClick={() => setActiveTab('orders')} 
                className={`btn flex-1 py-2 ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Đơn hàng
              </button>
            </div>

            {activeTab === 'shop' && (
              <ShopPage user={user} onProductClick={handleProductClick} />
            )}

            {activeTab === 'cart' && (
              <CartPage 
                user={user}
                cartDetails={cartDetails}
                onUpdateCartQty={handleUpdateCartQty}
                onRemoveCartItem={handleRemoveCartItem}
                onCheckoutSuccess={handleCheckoutSuccess}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersPage 
                orders={orders} 
                onDetailClick={(orderId) => {
                  setActiveTab('shop');
                  handleProductClick(orderId);
                }} 
              />
            )}

          </div>

          {/* AI Panel: Chatbot RAG & Recommendations (Columns 9 to 12) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <AIChatbot 
              chatMessage={chatMessage}
              setChatMessage={setChatMessage}
              chatHistory={chatHistory}
              chatLoading={chatLoading}
              onSendMessage={handleSendChatMessage}
            />

            <AIRecommendations 
              aiRecommendations={aiRecommendations}
              onLoadRecommendations={loadAIRecommendations}
              onProductClick={handleProductClick}
            />
          </div>
        </main>
      )}

      <ProductDetailModal 
        selectedProduct={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <Footer />
    </div>
  );
}

export default App;
