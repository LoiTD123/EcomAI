import React, { useState, useEffect } from 'react';
import { authAPI, productAPI, cartAPI, orderAPI, aiAPI } from './services/api';
import { Sparkles } from 'lucide-react';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import ProductDetailModal from './components/ProductDetailModal';
import OrderDetailModal from './components/OrderDetailModal';
import AIChatbot from './components/AIChatbot';
import AIRecommendations from './components/AIRecommendations';
import ProfileModal from './components/ProfileModal';

// Pages
import AuthPage from './pages/AuthPage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';

function App() {
  // Authentication states
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Navigation states
  const [activeTab, setActiveTab] = useState('shop'); // 'shop', 'cart', 'orders'
  
  // Cart states
  const [cart, setCart] = useState({ items: [] });
  const [cartDetails, setCartDetails] = useState([]); // Cart items populated with product details

  // Order states
  const [orders, setOrders] = useState([]);

  // AI & Chatbot states
  const [chatSessionId, setChatSessionId] = useState(`session_${Math.random().toString(36).substring(2, 9)}`);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', message: 'Xin chào! Tôi là trợ lý mua sắm AI. Tôi có thể giúp bạn tìm kiếm sách, đồ điện tử hoặc quần áo thời trang. Bạn cần tư vấn gì hôm nay?' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Load cart & orders & recommendations on login
  useEffect(() => {
    if (user) {
      loadCart();
      loadOrders();
      loadAIRecommendations();
    }
  }, [user]);

  // Hide chatbot when switching tabs
  useEffect(() => {
    setIsChatOpen(false);
  }, [activeTab]);

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
    // Reset chat history and chatbot widget state
    setChatHistory([
      { role: 'model', message: 'Xin chào! Tôi là trợ lý mua sắm AI. Tôi có thể giúp bạn tìm kiếm sách, đồ điện tử hoặc quần áo thời trang. Bạn cần tư vấn gì hôm nay?' }
    ]);
    setChatSessionId(`session_${Math.random().toString(36).substring(2, 9)}`);
    setIsChatOpen(false);
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
      alert('Đã thêm sản phẩm vào giỏ hàng thành công!');
      setSelectedProduct(null);
      
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
      const resp = await aiAPI.recommend(8);
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

  const handleViewOrderDetails = async (orderId) => {
    try {
      const resp = await orderAPI.get(orderId);
      const orderData = resp.data;
      
      const populatedItems = await Promise.all(
        orderData.items.map(async (item) => {
          try {
            const prodResp = await productAPI.get(item.product_id);
            return {
              ...item,
              product: prodResp.data
            };
          } catch {
            return {
              ...item,
              product: { name: `Sản phẩm ID ${item.product_id}` }
            };
          }
        })
      );
      
      setSelectedOrderDetails({
        ...orderData,
        items: populatedItems
      });
    } catch (err) {
      alert('Không thể tải chi tiết đơn hàng.');
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
      {!user ? (
        <>
          <Header 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            cartCount={0} 
            onLogout={handleLogout} 
            onEditProfile={() => setShowProfileModal(true)}
          />
          <AuthPage onAuthSuccess={setUser} />
        </>
      ) : (
        <>
          <Header 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            cartCount={cartDetails.reduce((sum, i) => sum + i.quantity, 0)} 
            onLogout={handleLogout} 
            onEditProfile={() => setShowProfileModal(true)}
          />
          <main className="flex-1 p-6">
            {/* Navigation for Mobile */}
            <div className="flex md:hidden items-center justify-between glass p-2 rounded-xl mb-6 gap-1 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('shop')} 
                className={`btn flex-1 py-2 text-xs ${activeTab === 'shop' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Shop
              </button>
              <button 
                onClick={() => setActiveTab('cart')} 
                className={`btn flex-1 py-2 text-xs ${activeTab === 'cart' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Giỏ hàng
              </button>
              <button 
                onClick={() => setActiveTab('orders')} 
                className={`btn flex-1 py-2 text-xs ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Đơn hàng
              </button>
              <button 
                onClick={() => setActiveTab('ai')} 
                className={`btn flex-1 py-2 text-xs ${activeTab === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Gợi ý AI
              </button>
            </div>

            <div className="w-full">
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
                  onDetailClick={handleViewOrderDetails} 
                />
              )}

              {activeTab === 'ai' && (
                <div className="w-full">
                  <AIRecommendations 
                    aiRecommendations={aiRecommendations}
                    onLoadRecommendations={loadAIRecommendations}
                    onProductClick={handleProductClick}
                  />
                </div>
              )}
            </div>
          </main>

          {/* Floating AI Chatbot Widget */}
          {user && (
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
              {isChatOpen && (
                <div className="w-[520px] max-w-[calc(100vw-2rem)] h-[640px] glass border border-slate-200/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
                  <div className="flex-1 flex flex-col p-3.5 bg-white/90 backdrop-blur-xl overflow-hidden">
                    <AIChatbot 
                      chatMessage={chatMessage}
                      setChatMessage={setChatMessage}
                      chatHistory={chatHistory}
                      chatLoading={chatLoading}
                      onSendMessage={handleSendChatMessage}
                      isWidget={true}
                      onClose={() => setIsChatOpen(false)}
                    />
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 text-white flex items-center justify-center shadow-[0_8px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.5)] hover:scale-110 active:scale-95 transition-all border border-white/10 ${!isChatOpen ? 'animate-bounce' : ''}`}
                title="Trò chuyện với AI"
              >
                <Sparkles className="h-6 w-6" />
              </button>
            </div>
          )}
        </>
      )}

      <ProductDetailModal 
        selectedProduct={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <OrderDetailModal 
        order={selectedOrderDetails}
        onClose={() => setSelectedOrderDetails(null)}
      />

      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        user={user} 
        onUpdateSuccess={setUser} 
      />

      <Footer />
    </div>
  );
}

export default App;
