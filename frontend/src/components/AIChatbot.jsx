import React, { useRef, useEffect } from 'react';
import { Sparkles, RefreshCw, Send } from 'lucide-react';

function AIChatbot({ 
  chatMessage, 
  setChatMessage, 
  chatHistory, 
  chatLoading, 
  onSendMessage,
  isWidget = false,
  onClose
}) {
  const chatEndRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  return (
    <div className={isWidget ? 'flex-1 flex flex-col overflow-hidden w-full bg-transparent p-0' : 'glass-card flex-1 flex flex-col h-[500px] lg:h-[580px] overflow-hidden'}>
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3.5 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 p-2 rounded-xl text-white shadow-[0_4px_15px_rgba(99,102,241,0.2)] animate-pulse">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-base tracking-wide">Trợ Lý Mua Sắm AI</h3>
            <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">Hỗ trợ trực tuyến 24/7</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Trợ lý AI</span>
          {isWidget && (
            <button 
              type="button"
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary text-xs font-bold bg-black/5 hover:bg-black/10 px-2 py-1 rounded-lg transition-all shrink-0 ml-1"
            >
              Ẩn
            </button>
          )}
        </div>
      </div>

      {chatHistory.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-[0_8px_25px_rgba(99,102,241,0.25)] mb-5 transform hover:scale-110 transition-transform duration-300">
            <Sparkles className="h-8 w-8 animate-pulse" />
          </div>
          <h4 className="text-text-primary font-bold text-lg md:text-xl mb-2.5 tracking-wide">Xin chào! Tôi có thể giúp gì cho bạn?</h4>
          <p className="text-xs text-text-secondary max-w-[340px] mb-8 leading-relaxed">
            Tôi là trợ lý AI cá nhân hóa có khả năng tìm kiếm sản phẩm, gợi ý thông minh dựa trên lịch sử mua sắm và giải đáp thắc mắc của bạn.
          </p>
          
          <div className="w-full max-w-[420px]">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-3 text-left">Gợi ý câu hỏi:</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { text: "Sách công nghệ hay nên đọc", icon: "📚" },
                { text: "Tìm điện thoại cấu hình cao", icon: "📱" },
                { text: "Gợi ý sản phẩm cho tôi", icon: "💡" },
                { text: "Sản phẩm nào đang hot?", icon: "🔥" }
              ].map((suggest, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setChatMessage(suggest.text)}
                  className="glass p-3.5 rounded-xl text-left text-[11px] text-text-secondary hover:text-text-primary border border-slate-200 hover:border-indigo-500/40 hover:bg-black/[0.02] transition-all flex items-center gap-2.5 group shadow-sm hover:shadow-md"
                >
                  <span className="text-base shrink-0 group-hover:scale-125 transition-transform duration-200">{suggest.icon}</span>
                  <span className="font-semibold line-clamp-1">{suggest.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Chat Message Window */
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4.5 mb-3">
          {chatHistory.map((chat, idx) => {
            // Custom local markdown-like parser for beautiful typography
            const renderFormattedMessage = (text) => {
              if (!text) return null;
              const lines = text.split('\n');
              return lines.map((line, lIdx) => {
                // Helper to parse and style **bold** text
                const formatBold = (str) => {
                  const parts = str.split('**');
                  return parts.map((part, pIdx) => {
                    if (pIdx % 2 === 1) {
                      return (
                        <strong key={pIdx} className="font-semibold text-indigo-600">
                          {part}
                        </strong>
                      );
                    }
                    return part;
                  });
                };

                // 1. Bullet list items (* or -)
                const bulletMatch = line.match(/^(\s*)[*-]\s+(.*)$/);
                if (bulletMatch) {
                  const indent = bulletMatch[1].length;
                  const content = bulletMatch[2];
                  return (
                    <div 
                      key={lIdx} 
                      className="flex items-start gap-2.5 my-1.5" 
                      style={{ paddingLeft: `${indent * 12 + 4}px` }}
                    >
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                      <span className="text-text-secondary text-xs md:text-sm leading-relaxed tracking-wide">
                        {formatBold(content)}
                      </span>
                    </div>
                  );
                }

                // 2. Numbered list items (e.g. 1., 2.)
                const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
                if (numMatch) {
                  const indent = numMatch[1].length;
                  const num = numMatch[2];
                  const content = numMatch[3];
                  return (
                    <div 
                      key={lIdx} 
                      className="flex items-start gap-2.5 my-1.5" 
                      style={{ paddingLeft: `${indent * 12 + 4}px` }}
                    >
                      <span className="font-mono text-xs text-indigo-600 font-bold shrink-0 mt-0.5">
                        {num}.
                      </span>
                      <span className="text-text-secondary text-xs md:text-sm leading-relaxed tracking-wide">
                        {formatBold(content)}
                      </span>
                    </div>
                  );
                }

                // 3. Empty lines (spacing)
                if (line.trim() === '') {
                  return <div key={lIdx} className="h-2" />;
                }

                // 4. Normal paragraph
                return (
                  <p key={lIdx} className="text-text-secondary text-xs md:text-sm leading-relaxed tracking-wide mb-1">
                    {formatBold(line)}
                  </p>
                );
              });
            };

            return (
              <div 
                key={idx} 
                className={`flex flex-col max-w-[85%] rounded-2xl p-3.5 text-sm shadow-sm transition-all duration-200 hover:shadow-md ${
                  chat.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white self-end rounded-tr-none border border-indigo-500/20' 
                    : 'bg-white/60 text-text-primary self-start rounded-tl-none border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.04)]'
                }`}
              >
                {chat.role === 'user' ? (
                  <p className="text-xs md:text-sm leading-relaxed tracking-wide">{chat.message}</p>
                ) : (
                  <div className="font-sans space-y-0.5">
                    {renderFormattedMessage(chat.message)}
                  </div>
                )}
              </div>
            );
          })}
          {chatLoading && (
            <div className="bg-white/60 border border-slate-200/80 text-text-secondary self-start rounded-2xl rounded-tl-none p-4 text-xs md:text-sm flex items-center gap-2.5 shadow-sm">
              <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
              <span className="font-semibold tracking-wide">Đang phân tích dữ liệu...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={onSendMessage} className="flex gap-2 border-t border-slate-200/60 pt-3">
        <input 
          type="text" 
          value={chatMessage}
          onChange={e => setChatMessage(e.target.value)}
          placeholder="Hỏi mua sách, đồ điện tử..."
          className="form-input py-2 px-3 text-xs flex-grow"
        />
        <button type="submit" className="btn btn-primary p-2">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

export default AIChatbot;
