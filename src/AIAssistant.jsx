import { useState, useEffect, useRef, useCallback } from "react";
import { Minus, X, Send } from "lucide-react";
import chatbotRobot from "./assets/chatbot-robot.png";

const SUGGESTED_CHIPS = [
  "Show Kerala PSC jobs",
  "Jobs closing this week",
  "Am I eligible for TNPSC?",
  "What should I apply for?",
  "Show my saved jobs",
  "How many jobs?"
];

const QUICK_REPLIES = [
  "How to apply?",
  "Documents Required",
  "Salary Details",
  "Eligibility"
];

// Helper to format bot responses with markdown bold and clickable links
const renderMessage = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    // Bold formatting: split on **...**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      // Link formatting: split on URLs
      const urlMatch = part.match(/(https?:\/\/[^\s]+)/g);
      if (urlMatch) {
        const linkParts = part.split(/(https?:\/\/[^\s]+)/g);
        return linkParts.map((lp, k) => {
          if (lp.startsWith('http')) {
            // Trim trailing punctuation from link
            let cleanUrl = lp;
            let trailing = "";
            const match = cleanUrl.match(/[.,;:)\]]+$/);
            if (match) {
              trailing = match[0];
              cleanUrl = cleanUrl.slice(0, -trailing.length);
            }
            return (
              <span key={k}>
                <a
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600, wordBreak: 'break-all' }}
                >
                  {cleanUrl}
                </a>
                {trailing}
              </span>
            );
          }
          return lp;
        });
      }
      return part;
    });

    return (
      <div key={i} style={{ marginBottom: line.trim() ? '4px' : '8px' }}>
        {rendered}
      </div>
    );
  });
};

export default function AIAssistant({ userEmail }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hi! I'm GovNotify AI Assistant 🤖. Ask me anything about jobs, eligibility, or deadlines in English, हिन्दी, ಕನ್ನಡ, தமிழ், తెలుగు, or മലയാളം!"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typewriterTimeoutRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, messages, isLoading, isTyping, scrollToBottom]);

  // Clean up any ongoing typewriter animation when unmounted
  useEffect(() => {
    return () => {
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = useCallback(async (customText) => {
    const textToSend = (customText !== undefined ? customText : input).trim();
    if (!textToSend || isLoading || isTyping) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: textToSend
    };

    // Build multi-turn history payload (exclude current msg, up to last 6 turns)
    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/ai-assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: userEmail || "",
          message: textToSend,
          history: historyPayload
        })
      });

      const data = await response.json();
      const replyText = data && data.reply ? data.reply : "I'm offline right now. Try: 'Show Kerala jobs' or 'Closing this week'.";

      setIsLoading(false);
      setIsTyping(true);

      // Start typewriter effect into an empty bot bubble
      const botMsgId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: "bot",
          text: ""
        }
      ]);

      let currIdx = 0;
      const step = Math.max(3, Math.ceil(replyText.length / 80));

      const typeNextChunk = () => {
        currIdx += step;
        if (currIdx >= replyText.length) {
          currIdx = replyText.length;
          setMessages((prev) =>
            prev.map((m) => (m.id === botMsgId ? { ...m, text: replyText } : m))
          );
          setIsTyping(false);
          scrollToBottom();
          return;
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, text: replyText.slice(0, currIdx) } : m))
        );
        scrollToBottom();
        typewriterTimeoutRef.current = setTimeout(typeNextChunk, 16);
      };

      typewriterTimeoutRef.current = setTimeout(typeNextChunk, 16);

    } catch {
      setIsLoading(false);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "I'm offline right now. Try: 'Show Kerala jobs' or 'Closing this week'."
        }
      ]);
    }
  }, [input, isLoading, isTyping, messages, userEmail, scrollToBottom]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <style>{`
        /* ================= Floating Robot Button ================= */
        .ai-floating-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: floatBob 2.5s ease-in-out infinite;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .ai-floating-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 32px rgba(16, 185, 129, 0.65);
        }
        @keyframes floatBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .ai-robot-container {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ai-robot-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          display: block;
        }
        .ai-robot-svg {
          animation: robotHeadTilt 3s ease-in-out infinite;
        }
        @keyframes robotHeadTilt {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-5deg); }
        }
        .ai-eye-left, .ai-eye-right {
          animation: blink 4s infinite;
          transform-origin: 32px 30px;
        }
        @keyframes blink {
          0%, 45%, 55%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.1); }
        }
        .ai-robot-antenna {
          animation: antennaPulse 2s ease-in-out infinite;
        }
        @keyframes antennaPulse {
          0%, 100% { fill: #fbbf24; }
          50% { fill: #ef4444; }
        }
        .ai-online-dot {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 12px;
          height: 12px;
          background: #22c55e;
          border: 2px solid #fff;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }

        /* ================= Smooth Chat Panel ================= */
        .ai-chat-panel {
          position: fixed;
          bottom: 100px;
          right: 24px;
          width: 400px;
          height: 600px;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 9998;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 600px) {
          .ai-chat-panel {
            bottom: 0;
            right: 0;
            left: 0;
            width: 100vw;
            max-width: 100vw;
            height: 100dvh;
            height: 100vh;
            border-radius: 0;
            z-index: 10001;
          }
          .ai-floating-btn {
            bottom: 16px;
            right: 16px;
            width: 54px;
            height: 54px;
          }
          .ai-robot-container {
            width: 100%;
            height: 100%;
          }
        }

        /* Header */
        .ai-header {
          background: #0f172a;
          color: #ffffff;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }
        .ai-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ai-header-title {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.2;
          margin-bottom: 2px;
        }
        .ai-header-status {
          font-size: 11.5px;
          color: #34d399;
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 600;
        }
        .ai-header-pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 8px #34d399;
          display: inline-block;
          animation: pulseDot 2s infinite ease-in-out;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .ai-header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ai-hdr-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #cbd5e1;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ai-hdr-btn:hover {
          background: rgba(255, 255, 255, 0.22);
          color: #ffffff;
        }

        /* Message Stream */
        .ai-chat-body {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #f8fafc;
        }
        .chat-msg {
          display: flex;
          gap: 8px;
          align-items: flex-end;
          width: 100%;
        }
        .chat-msg.user {
          justify-content: flex-end;
        }
        .chat-msg.bot {
          justify-content: flex-start;
        }
        .ai-bot-avatar-mini {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-bottom: 2px;
        }
        .ai-msg-bubble {
          max-width: 82%;
          padding: 11px 15px;
          font-size: 13.5px;
          line-height: 1.5;
          word-break: break-word;
        }
        .ai-msg-bubble.user {
          background: #10b981;
          color: #ffffff;
          border-radius: 16px 16px 3px 16px;
          box-shadow: 0 3px 10px rgba(16, 185, 129, 0.28);
          font-weight: 500;
        }
        .ai-msg-bubble.bot {
          background: #f1f5f9;
          color: #0f172a;
          border-radius: 16px 16px 16px 3px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
        }

        /* Typing Indicator with Animated Dots */
        .typing-dots {
          display: inline-flex;
          align-items: center;
        }
        .typing-dots span {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
          margin: 0 2px;
          animation: typingBounce 1.4s infinite ease-in-out both;
        }
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        /* Quick Reply Action Buttons */
        .ai-quick-bar {
          padding: 8px 12px 4px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          flex-shrink: 0;
        }
        .ai-quick-bar::-webkit-scrollbar {
          display: none;
        }
        .ai-quick-chip {
          background: #ffffff;
          color: #047857;
          border: 1.5px solid #10b981;
          border-radius: 14px;
          padding: 5px 11px;
          font-size: 11.5px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.16s ease;
          flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(16, 185, 129, 0.1);
        }
        .ai-quick-chip:hover:not(:disabled) {
          background: #10b981;
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
        }
        .ai-quick-chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Suggested Chips */
        .ai-chips-bar {
          padding: 6px 12px 6px;
          background: #ffffff;
          border-top: 1px solid #f1f5f9;
          display: flex;
          gap: 7px;
          overflow-x: auto;
          scrollbar-width: none;
          flex-shrink: 0;
        }
        .ai-chips-bar::-webkit-scrollbar {
          display: none;
        }
        .ai-chip {
          background: #f8fafc;
          color: #334155;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 6px 12px;
          font-size: 11.5px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.18s ease;
          flex-shrink: 0;
        }
        .ai-chip:hover {
          background: #10b981;
          color: #ffffff;
          border-color: #10b981;
          transform: translateY(-1px);
        }

        /* Input Bar */
        .ai-input-bar {
          padding: 10px 14px 14px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 8px;
          align-items: center;
          flex-shrink: 0;
        }
        .ai-input-field {
          flex: 1;
          border: 1.5px solid #cbd5e1;
          border-radius: 24px;
          padding: 10px 16px;
          font-size: 13.5px;
          outline: none;
          color: #0f172a;
          background: #ffffff;
          transition: border-color 0.18s ease;
        }
        .ai-input-field:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
        .ai-send-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #10b981;
          color: #ffffff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s ease;
          flex-shrink: 0;
          box-shadow: 0 3px 10px rgba(16, 185, 129, 0.3);
        }
        .ai-send-btn:hover:not(:disabled) {
          background: #059669;
          transform: scale(1.05);
        }
        .ai-send-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          opacity: 0.65;
          box-shadow: none;
        }
      `}</style>

      {/* Floating Robot Button */}
      <button 
        className="ai-floating-btn"
        onClick={() => setOpen(!open)}
        aria-label="Open AI Assistant"
      >
        <div className="ai-robot-container">
          <img
            src={chatbotRobot}
            alt="AI Assistant"
            className="ai-robot-img"
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
          />
          <span className="ai-online-dot"></span>
        </div>
      </button>

      {/* Smooth Chat Panel */}
      {open && (
        <div className="ai-chat-panel">
          {/* Header */}
          <div className="ai-header">
            <div className="ai-header-left">
              <svg viewBox="0 0 64 64" width="28" height="28">
                <circle cx="32" cy="8" r="3" fill="#fbbf24" />
                <line x1="32" y1="11" x2="32" y2="18" stroke="#fbbf24" strokeWidth="2" />
                <rect x="14" y="18" width="36" height="28" rx="8" fill="#10b981" />
                <circle cx="24" cy="30" r="3" fill="#fff" />
                <circle cx="40" cy="30" r="3" fill="#fff" />
                <rect x="26" y="38" width="12" height="2" rx="1" fill="#065f46" />
              </svg>
              <div>
                <div className="ai-header-title">GovNotify AI Assistant</div>
                <div className="ai-header-status">
                  <span className="ai-header-pulse" />
                  <span>● Online</span>
                </div>
              </div>
            </div>
            <div className="ai-header-actions">
              <button
                className="ai-hdr-btn"
                onClick={() => setOpen(false)}
                title="Minimize (−)"
                aria-label="Minimize"
              >
                <Minus size={16} />
              </button>
              <button
                className="ai-hdr-btn"
                onClick={() => setOpen(false)}
                title="Close (×)"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="ai-chat-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-msg ${msg.sender === "user" ? "user" : "bot"}`}
              >
                {msg.sender === "bot" && (
                  <div className="ai-bot-avatar-mini" title="GovNotify AI">
                    <svg viewBox="0 0 64 64" width="16" height="16">
                      <rect x="14" y="18" width="36" height="28" rx="8" fill="#ffffff" />
                      <circle cx="24" cy="30" r="3" fill="#10b981" />
                      <circle cx="40" cy="30" r="3" fill="#10b981" />
                      <rect x="26" y="38" width="12" height="2" rx="1" fill="#10b981" />
                    </svg>
                  </div>
                )}
                <div
                  className={`ai-msg-bubble ${
                    msg.sender === "user" ? "user" : "bot"
                  }`}
                >
                  {msg.sender === "user" ? (
                    <div>{msg.text}</div>
                  ) : (
                    <div>{renderMessage(msg.text)}</div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chat-msg bot typing">
                <div className="ai-bot-avatar-mini">
                  <svg viewBox="0 0 64 64" width="16" height="16">
                    <rect x="14" y="18" width="36" height="28" rx="8" fill="#ffffff" />
                    <circle cx="24" cy="30" r="3" fill="#10b981" />
                    <circle cx="40" cy="30" r="3" fill="#10b981" />
                  </svg>
                </div>
                <div className="ai-msg-bubble bot" style={{ display: 'flex', alignItems: 'center', padding: '10px 14px' }}>
                  <div className="typing-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <small style={{ color: '#64748b', marginLeft: '8px', fontWeight: 600 }}>Thinking...</small>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Action Buttons */}
          <div className="ai-quick-bar">
            {QUICK_REPLIES.map((reply, idx) => (
              <button
                key={idx}
                className="ai-quick-chip"
                onClick={() => handleSend(reply)}
                disabled={isLoading || isTyping}
              >
                ⚡ {reply}
              </button>
            ))}
          </div>

          {/* Suggested Chips Bar */}
          <div className="ai-chips-bar">
            {SUGGESTED_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                className="ai-chip"
                onClick={() => handleSend(chip)}
                disabled={isLoading || isTyping}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="ai-input-bar">
            <input
              ref={inputRef}
              type="text"
              className="ai-input-field"
              placeholder="Ask about jobs, eligibility, deadlines..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isTyping}
            />
            <button
              className="ai-send-btn"
              onClick={() => handleSend()}
              disabled={isLoading || isTyping || !input.trim()}
              title="Send message"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
