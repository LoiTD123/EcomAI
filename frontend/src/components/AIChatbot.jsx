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
                      <strong key={pIdx} className="font-semibold text-indigo-300 drop-shadow-[0_0_2px_rgba(99,102,241,0.2)]">
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
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0 shadow-[0_0_8px_#6366f1]" />
                    <span className="text-gray-200 text-xs md:text-sm leading-relaxed tracking-wide">
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
                    <span className="font-mono text-xs text-indigo-400 font-bold shrink-0 mt-0.5">
                      {num}.
                    </span>
                    <span className="text-gray-200 text-xs md:text-sm leading-relaxed tracking-wide">
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
                <p key={lIdx} className="text-gray-200 text-xs md:text-sm leading-relaxed tracking-wide mb-1">
                  {formatBold(line)}
                </p>
              );
            });
          };

          return (
            <div 
              key={idx} 
              className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-sm shadow-md transition-all duration-200 hover:shadow-lg ${
                chat.role === 'user' 
                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white self-end rounded-tr-none shadow-indigo-600/10' 
                  : 'bg-white/[0.03] backdrop-blur-md text-text-primary self-start rounded-tl-none border border-white/10'
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
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 text-text-secondary self-start rounded-2xl rounded-tl-none p-3.5 text-xs md:text-sm flex items-center gap-2.5 shadow-md">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
            <span className="font-medium tracking-wide">Đang phân tích và trả lời...</span>
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
