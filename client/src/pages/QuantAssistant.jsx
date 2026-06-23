import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, RotateCcw, Atom } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAssistantChat } from "../../features/assistant/api.js";

const SUGGESTED_QUESTIONS = [
  "Which strategy has the highest Sharpe ratio?",
  "Which strategy has the lowest max drawdown?",
  "Which strategies are in the 'Validated' maturity stage?",
  "What should I research next based on my gaps?",
  "Which strategies perform best in Bull markets?",
  "Which strategy has the best profit factor?",
  "Which strategies are similar to each other?",
  "What changed in the lab this month?",
  "Which strategy is closest to being live-ready?",
  "What are the biggest risks in my current research?",
];

function Message({ role, content }) {
  const isAssistant = role === "assistant";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}
    >
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isAssistant ? "bg-cyan/15 border border-cyan/30" : "bg-white/10 border border-white/15"}`}>
        {isAssistant ? <Sparkles size={14} className="text-cyan" /> : <span className="text-xs font-display text-ink-secondary">You</span>}
      </div>
      <div className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-relaxed ${isAssistant ? "bg-panel border border-cyan/15 text-ink-primary" : "bg-white/8 border border-white/12 text-ink-primary text-right"}`}>
        {content.split("\n").map((line, i) => (
          <span key={i}>{line}{i < content.split("\n").length - 1 && <br />}</span>
        ))}
      </div>
    </motion.div>
  );
}

export default function QuantAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatMutation = useAssistantChat();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMessage = text || input.trim();
    if (!userMessage) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    try {
      const data = await chatMutation.mutateAsync({
        message: userMessage,
        conversationHistory: messages.slice(-10), // keep last 10 turns for context
      });
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: err?.response?.data?.message?.includes("GEMINI_API_KEY")
            ? "⚠️ GEMINI_API_KEY is not configured on the server. Add it to server/.env to enable the AI Quant Assistant."
            : `Error: ${err?.response?.data?.message || "Could not reach the assistant. Check your server connection."}`,
        },
      ]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const reset = () => {
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-cyan" />
            <h1 className="font-display text-xl font-semibold">AI Quant Assistant</h1>
          </div>
          <p className="text-ink-secondary text-sm mt-0.5">
            Ask anything about your strategies, backtests, portfolios, and research notes.
          </p>
        </div>
        {!isEmpty && (
          <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/10 text-ink-secondary hover:text-cyan text-xs">
            <RotateCcw size={13} /> New conversation
          </button>
        )}
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {isEmpty && (
          <div className="h-full flex flex-col items-center justify-center gap-6 py-8">
            <div className="w-16 h-16 rounded-full bg-cyan/10 border border-cyan/30 flex items-center justify-center">
              <Sparkles size={28} className="text-cyan" />
            </div>
            <div className="text-center">
              <h2 className="font-display text-lg font-semibold">Ask me anything about your lab</h2>
              <p className="text-sm text-ink-secondary mt-1 max-w-md">
                I have access to all your strategies, backtests, research notes, and portfolios. Ask questions and I'll answer from your actual data.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left px-4 py-3 rounded-lg glass-panel text-sm text-ink-secondary hover:text-cyan hover:border-cyan/30 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <Message key={i} role={msg.role} content={msg.content} />
          ))}
        </AnimatePresence>

        {chatMutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan/15 border border-cyan/30 flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-cyan animate-pulse" />
            </div>
            <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-xs text-ink-secondary">Analyzing your lab data...</span>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 flex gap-2 pt-3 border-t border-white/10">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your strategies, backtests, portfolios, or research..."
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/15 focus:border-cyan/40 outline-none text-sm placeholder:text-ink-faint"
          disabled={chatMutation.isPending}
        />
        <button
          type="submit"
          disabled={!input.trim() || chatMutation.isPending}
          className="px-4 py-3 rounded-xl bg-cyan text-void hover:shadow-glow transition-shadow disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
