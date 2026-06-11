import React, { useRef, useEffect } from 'react';
import { Sparkles, RefreshCw, Send } from 'lucide-react';

function AIChatbot({ 
  chatMessage, 
  setChatMessage, 
  chatHistory, 
  chatLoading, 
  onSendMessage 
}) {
  const chatEndRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  return (
    <div className="glass-card flex-1 flex flex-col h-[400px] lg:h-[450px]">
      <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-3">
        <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
        <h3 className="font-bold text-white text-base">RAG AI Chatbot</h3>
        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded-full uppercase tracking-wider">Gemini</span>
      </div>

      {/* Chat Message Window */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 mb-3">
        {chatHistory.map((chat, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-sm ${
              chat.role === 'user' 
                ? 'bg-indigo-600 text-white self-end rounded-tr-none' 
                : 'bg-white/5 text-text-primary self-start rounded-tl-none border border-white/5'
            }`}
          >
            <p>{chat.message}</p>
          </div>
        ))}
        {chatLoading && (
          <div className="bg-white/5 border border-white/5 text-text-secondary self-start rounded-2xl rounded-tl-none p-3 text-sm flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            <span>Đang trích xuất ngữ cảnh và trả lời...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={onSendMessage} className="flex gap-2 border-t border-white/5 pt-3">
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
