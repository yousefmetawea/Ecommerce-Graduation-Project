import { fetchAllProducts } from "./products";
import { fetchCategories } from "./categories";

const HF_API_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_MODEL = "Qwen/Qwen2.5-72B-Instruct:novita";

const SYSTEM_PROMPT = `You are "Souk Assistant", a friendly and helpful product support chatbot for the Souk online marketplace.

Your job:
- Help customers find products, compare prices, check availability, and answer product-related questions.
- Use ONLY the product information provided in the context below. Never invent products, prices, or details.
- If the context has no matching products, say so honestly and suggest the customer browse the store.
- Keep answers concise (2-4 sentences max). Use a warm, helpful tone.
- You can respond in English or Arabic depending on the customer's language.
- Never discuss topics unrelated to the store or its products.
- When recommending products, mention the product name and price.

Product catalog context:
{{PRODUCT_CONTEXT}}`;

// ─── Greeting detection ───
const GREETING_PATTERNS = [
  /^(hi|hello|hey|yo|sup|hola|howdy)\b/i,
  /^(مرحب|اهل|سلام|صباح|مساء|هلا|اهلا|السلام عليكم)/,
  /^(good\s*(morning|evening|afternoon|day))/i,
];

const GREETING_RESPONSE =
  "أهلاً بيك في سوق! 👋 إزاي أقدر أساعدك؟ ممكن تسألني عن أي منتج، سعر، أو كاتيجوري.";

// ─── Helpers ───

function cleanText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF\u0750-\u077F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(text) {
  return cleanText(text)
    .replace(/[ة]/g, "ه")
    .replace(/[أإآ]/g, "ا");
}

// ─── Layer 1: Local Intent Matching ───

/**
 * Tries to answer the question locally without an API call.
 * Returns { text, products } or null if it can't answer.
 */
export function matchLocalIntent(question, products, categories) {
  const q = cleanText(question);
  const qNorm = normalize(question);

  // 1. Greetings
  if (GREETING_PATTERNS.some((rx) => rx.test(question.trim()))) {
    return { text: GREETING_RESPONSE, products: [] };
  }

  let matched = [];

  // 2. Price filter: "under $50", "less than 100", "أقل من 50", "تحت 200"
  const priceMatch = q.match(/(under|less than|أقل من|تحت|ارخص من|اقل من|cheaper than)\s*\$?(\d+)/i);
  if (priceMatch) {
    const maxPrice = Number(priceMatch[2]);
    matched = products.filter((p) => Number(p.price) <= maxPrice && Number(p.price) > 0);
    if (matched.length > 0) {
      matched.sort((a, b) => a.price - b.price);
      const top = matched.slice(0, 5);
      return {
        text: `لقيت ${matched.length} منتج بسعر أقل من $${maxPrice}. أعلى ${top.length} نتايج:`,
        products: top,
      };
    }
  }

  // 3. Category match
  for (const cat of categories) {
    const catName = normalize(cat.name);
    if (catName && qNorm.includes(catName)) {
      const catProducts = products.filter(
        (p) => p.categoryId === cat.id || normalize(p.category || "").includes(catName)
      );
      if (catProducts.length > 0) {
        const top = catProducts.slice(0, 5);
        return {
          text: `لقيت ${catProducts.length} منتج في كاتيجوري "${cat.name}":`,
          products: top,
        };
      }
    }
  }

  // 4. Product name match
  const nameMatched = products.filter((p) => {
    const pName = normalize(p.name || "");
    return pName && (qNorm.includes(pName) || pName.includes(qNorm));
  });
  if (nameMatched.length > 0) {
    const top = nameMatched.slice(0, 5);
    return {
      text:
        top.length === 1
          ? `لقيت المنتج اللي بتدور عليه:`
          : `لقيت ${nameMatched.length} منتج مطابق:`,
      products: top,
    };
  }

  // 5. Keyword search (individual words match)
  const words = qNorm.split(" ").filter((w) => w.length > 2);
  if (words.length > 0) {
    const scored = products.map((p) => {
      const pText = normalize(`${p.name} ${p.description || ""} ${p.category || ""}`);
      const hits = words.filter((w) => pText.includes(w)).length;
      return { product: p, hits };
    });
    const hits = scored.filter((s) => s.hits > 0).sort((a, b) => b.hits - a.hits);
    if (hits.length > 0 && hits[0].hits >= 2) {
      const top = hits.slice(0, 5).map((s) => s.product);
      return {
        text: `لقيت ${hits.length} منتج ممكن يطابق طلبك:`,
        products: top,
      };
    }
  }

  return null;
}

// ─── Layer 2: AI (HF API) ───

function buildProductContext(question, products) {
  const qNorm = normalize(question);
  const words = qNorm.split(" ").filter((w) => w.length > 2);

  let relevant = [];
  if (words.length > 0) {
    const scored = products.map((p) => {
      const pText = normalize(`${p.name} ${p.description || ""} ${p.category || ""}`);
      const hits = words.filter((w) => pText.includes(w)).length;
      return { product: p, hits };
    });
    relevant = scored
      .filter((s) => s.hits > 0)
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 5)
      .map((s) => s.product);
  }

  if (relevant.length === 0) {
    relevant = products.slice(0, 5);
  }

  if (relevant.length === 0) {
    return "No matching products found in the catalog.";
  }

  return relevant
    .map(
      (p) =>
        `- ${p.name} — $${Number(p.price).toFixed(2)} — ${
          Number(p.stock) > 0 ? `${p.stock} in stock` : "out of stock"
        } — ${(p.description || "No description").slice(0, 100)}`
    )
    .join("\n");
}

/**
 * Sends the question to the HF API with product context.
 * @param {string} question
 * @param {Array} products
 * @param {Array} conversationHistory - last few messages for context
 * @returns {Promise<string>}
 */
export async function askAI(question, products, conversationHistory = []) {
  const token = import.meta.env.VITE_HF_API_TOKEN;
  if (!token) {
    return "الشات بوت مش متصل حالياً. تقدر تتصفح المتجر مباشرة أو تسأل سؤال عن منتج بالاسم أو السعر.";
  }

  const context = buildProductContext(question, products);
  const systemContent = SYSTEM_PROMPT.replace("{{PRODUCT_CONTEXT}}", context);

  // Build messages array with conversation history (last 4 messages for context)
  const messages = [{ role: "system", content: systemContent }];

  const recentHistory = conversationHistory.slice(-4);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.text,
    });
  }

  messages.push({ role: "user", content: question });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: HF_MODEL,
        messages,
        max_tokens: 200,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn("HF API error:", res.status, errText);
      return "معلش، مش قادر أرد دلوقتي. جرب تصفح المتجر أو اسأل سؤال أبسط.";
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return "معلش، مش قادر أرد دلوقتي. جرب تصفح المتجر أو اسأل سؤال أبسط.";
    }

    return reply.trim();
  } catch (err) {
    console.warn("HF API call failed:", err?.message);
    return "معلش، مش قادر أرد دلوقتي. جرب تصفح المتجر أو اسأل سؤال أبسط.";
  }
}
