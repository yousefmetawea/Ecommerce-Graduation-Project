import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchAllProducts } from "../services/products";
import { fetchCategories } from "../services/categories";
import { matchLocalIntent, askAI } from "../services/chatbot";

const MAX_AI_CALLS = 8;

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiCallsUsed, setAiCallsUsed] = useState(0);

  // Product & category cache (loaded once on first open)
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState(null);
  const dataLoaded = useRef(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load products & categories once on first open
  const loadData = useCallback(async () => {
    if (dataLoaded.current) return;
    dataLoaded.current = true;
    try {
      const [prods, cats] = await Promise.all([
        fetchAllProducts(),
        fetchCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.warn("ChatWidget: failed to load product data", err);
      setProducts([]);
      setCategories([]);
    }
  }, []);

  function handleOpen() {
    setIsOpen(true);
    loadData();
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text: "أهلاً بيك في سوق! 👋 اسألني عن أي منتج أو سعر أو كاتيجوري وهساعدك.",
          timestamp: Date.now(),
          products: [],
        },
      ]);
    }
  }

  async function handleSend(e) {
    e?.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput("");

    const userMsg = { role: "user", text: question, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    // Wait for data to be loaded
    if (!products || !categories) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "ثانية واحدة، بحمّل بيانات المنتجات...",
          timestamp: Date.now(),
          products: [],
        },
      ]);
      return;
    }

    setLoading(true);

    // Layer 1: Local intent matching
    const localResult = matchLocalIntent(question, products, categories);

    if (localResult) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: localResult.text,
          timestamp: Date.now(),
          products: localResult.products || [],
        },
      ]);
      setLoading(false);
      return;
    }

    // Layer 2: AI call
    if (aiCallsUsed >= MAX_AI_CALLS) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "وصلت لحد الأسئلة الذكية في الجلسة دي. جرب تصفح المتجر مباشرة أو ارجع تاني بعدين. 🙏",
          timestamp: Date.now(),
          products: [],
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const aiReply = await askAI(question, products, messages);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: aiReply,
          timestamp: Date.now(),
          products: [],
        },
      ]);
      setAiCallsUsed((c) => c + 1);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "معلش، مش قادر أرد دلوقتي. جرب تصفح المتجر أو اسأل سؤال أبسط.",
          timestamp: Date.now(),
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const money = (n) => `$${Number(n).toFixed(2)}`;

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          className="chat-fab"
          onClick={handleOpen}
          aria-label="Open product assistant chat"
        >
          💬
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-header-icon">🛒</span>
              <div>
                <strong>Ask about our products</strong>
                <small>
                  {aiCallsUsed < MAX_AI_CALLS
                    ? `${MAX_AI_CALLS - aiCallsUsed} AI questions remaining`
                    : "AI limit reached"}
                </small>
              </div>
            </div>
            <button
              className="chat-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-msg ${
                  msg.role === "user" ? "chat-msg-user" : "chat-msg-bot"
                }`}
              >
                <div className="chat-bubble">
                  <p>{msg.text}</p>
                  {/* Product cards */}
                  {msg.products?.length > 0 && (
                    <div className="chat-products">
                      {msg.products.map((p) => (
                        <Link
                          to={`/product/${p.id}`}
                          key={p.id}
                          className="chat-product-card"
                          onClick={() => setIsOpen(false)}
                        >
                          {p.images?.[0] && (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="chat-product-img"
                            />
                          )}
                          <div className="chat-product-info">
                            <strong>{p.name}</strong>
                            <span>{money(p.price)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="chat-msg chat-msg-bot">
                <div className="chat-bubble chat-typing">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chat-input-bar" onSubmit={handleSend}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اسأل عن منتج..."
              disabled={loading}
              maxLength={300}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
