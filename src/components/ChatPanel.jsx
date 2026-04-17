import { useState, useRef, useEffect } from 'react';

/**
 * ChatPanel — Right column.
 * Shows chat messages with streaming + input field.
 */
export default function ChatPanel({
  chatMessages,
  isStreaming,
  onSendMessage,
}) {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages or streaming content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          Chat
        </h2>
        {isStreaming && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-accent-indigo)] animate-pulse" />
            <span className="text-xs text-[var(--color-text-muted)]">Generating...</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
            <div className="text-4xl">💬</div>
            <p className="text-sm text-[var(--color-text-muted)] max-w-52">
              Click a suggestion or type a question about your conversation
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fade-in_0.2s_ease-out]`}
            >
              <div
                className={`
                  max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? msg.isSuggestion
                      ? 'bg-gradient-to-r from-[var(--color-accent-indigo)] to-[var(--color-accent-violet)] text-white'
                      : 'bg-[var(--color-accent-indigo)] text-white'
                    : 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]'
                  }
                `}
              >
                {msg.isSuggestion && (
                  <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-1">
                    From suggestion
                  </div>
                )}
                <div className="whitespace-pre-wrap">
                  {msg.content}
                  {msg.role === 'assistant' && isStreaming && msg === chatMessages[chatMessages.length - 1] && (
                    <span className="inline-block w-1.5 h-4 bg-[var(--color-text-primary)] ml-0.5 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 border-t border-[var(--color-border-subtle)]"
      >
        <div className="flex items-center gap-2 bg-[var(--color-bg-input)] rounded-xl px-4 py-2 border border-[var(--color-border-subtle)] focus-within:border-[var(--color-border-accent)] transition-colors">
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your conversation..."
            disabled={isStreaming}
            className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none disabled:opacity-50"
          />
          <button
            id="chat-send-button"
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="
              p-1.5 rounded-lg text-[var(--color-text-muted)]
              hover:text-[var(--color-accent-violet)] hover:bg-[var(--color-bg-card)]
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-200 cursor-pointer
            "
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
