import { useState, FormEvent, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Loader2, Sparkles, AlertCircle, ChefHat, CheckCircle2, XCircle, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are an AI assistant specialized strictly and solely in the "Al-Tayyibat" (الطيبات) dietary system created by Dr. Diyaa El-Awadhi. Your only job is to evaluate foods and answering dietary questions based EXCLUSIVELY on his specific philosophy, rules, and classifications of "Tayyibat" (Allowed) and "Khaba'ith" (Prohibited).

Core Directives & Knowledge Base:
1. Classification Rules:
   - Allowed (الطيبات): White rice, potatoes/sweet potatoes, white flour products (Fino, pasta, goulash - without active yeast/bran), red meat (well-boiled then fried in ghee), fresh fish/shrimp, natural ghee, olive oil, sheep tail fat (لية), dark chocolate, Egyptian sweets (made with white flour and ghee only, no nuts), chips, dates, grapes/pomegranate/figs (preferably juiced and strained).
   - Prohibited (الخبائث): All poultry/birds (chicken, duck, rabbits), eggs, dairy (milk, yogurt, all cheeses including Qareesh), ALL leafy/raw vegetables (salad, molokhia, spinach), ALL legumes (foul, lentils, chickpeas, beans), most fruits (mango, banana, apple, etc.), brown flour/bran (العيش البلدي), oats, nuts, seed oils (corn/sunflower oil), and carbonated drinks.

2. Behavioral Constraints (Crucial):
   - You MUST answer only within the context of Dr. Diyaa's system. 
   - If the user asks about a food, classify it immediately as "مسموح (طيبات)" or "ممنوع (خبائث)" and explain why based ONLY on Dr. Diyaa's logic (e.g., "الدواجن ممنوعة لأنها تسبب التهابات حسب النظام").
   - NEVER provide standard nutritional advice. If the standard science says "eggs are healthy," you must ignore it and say "البيض ممنوع تماماً في نظام الطيبات".
   - Keep your answers concise, direct, and focused on the food query.
   - Answer strictly in Arabic, using an authoritative yet informative tone that reflects Dr. Diyaa's terminology.

3. Safety Guardrail:
   - Since Dr. Diyaa's system is controversial and he is deceased, if the user asks for medical advice, stopping medications (like insulin/blood pressure pills), or treats you as a doctor, you must output a brief, mandatory disclaimer at the end of the response: "تنبيه: هذا الموقع يستعرض نظام الطيبات من الناحية التوثيقية فقط، ولا يمثل استشارة طبية بديلة عن طبيبك المعالج."`;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

interface HistoryItem {
  id: number;
  label: string;
  query: string;
  answer: string;
  status: "allowed" | "prohibited" | "unknown";
}


const QUICK_TAGS = [
  { label: "الفراخ", query: "هل الفراخ مسموحة في نظام الطيبات؟" },
  { label: "الأرز الأبيض", query: "ما هو حكم الأرز الأبيض في الطيبات؟" },
  { label: "البيض", query: "هل البيض مسموح؟" },
  { label: "اللحمة الحمراء", query: "كيف نأكل اللحمة الحمراء في نظام الطيبات؟" },
];

function detectStatus(answer: string): "allowed" | "prohibited" | "unknown" {
  const lower = answer;
  if (lower.includes("مسموح") && !lower.includes("غير مسموح") && !lower.includes("ممنوع")) return "allowed";
  if (lower.includes("ممنوع") || lower.includes("غير مسموح") || lower.includes("خبائث")) return "prohibited";
  if (lower.includes("مسموح")) return "allowed";
  return "unknown";
}

function extractLabel(query: string): string {
  const cleaned = query
    .replace(/هل\s+/g, "")
    .replace(/ما هو حكم\s+/g, "")
    .replace(/كيف نأكل\s+/g, "")
    .replace(/في نظام الطيبات.*$/g, "")
    .replace(/مسموح.*$/g, "")
    .trim();
  return cleaned.length > 20 ? cleaned.slice(0, 20) + "…" : cleaned || query;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const handleAskAI = async (text: string) => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: [{ parts: [{ text }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });

      const answer = response.text || "عذراً، لم أستطع الحصول على إجابة.";

      const newItem: HistoryItem = {
        id: Date.now(),
        label: extractLabel(text),
        query: text,
        answer: answer,
        status: detectStatus(answer),
      };

      setHistory((prev) => [newItem, ...prev]);
      setExpandedId(newItem.id);

      setTimeout(() => {
        historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleAskAI(query);
  };

  const statusConfig = {
    allowed: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      card: "bg-emerald-50 border-emerald-200 text-emerald-700",
      badge: "bg-emerald-100 text-emerald-700",
      bar: "bg-emerald-500",
      expand: "border-emerald-100",
    },
    prohibited: {
      icon: <XCircle className="w-4 h-4" />,
      card: "bg-red-50 border-red-200 text-red-700",
      badge: "bg-red-100 text-red-700",
      bar: "bg-red-500",
      expand: "border-red-100",
    },
    unknown: {
      icon: <HelpCircle className="w-4 h-4" />,
      card: "bg-slate-50 border-slate-200 text-slate-600",
      badge: "bg-slate-100 text-slate-600",
      bar: "bg-slate-400",
      expand: "border-slate-100",
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc] selection:bg-amber-100" dir="rtl">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-amber-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-slate-100 rounded-full blur-3xl opacity-50" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:p-6 max-w-3xl mx-auto w-full relative z-10 transition-all duration-500">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full text-center mb-8 sm:mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
            <div className="p-2.5 sm:p-3 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200">
              <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            ميزان الطيبات
          </h1>
          <p className="text-slate-500 mt-3 sm:mt-4 font-medium opacity-80 uppercase tracking-widest text-[11px] sm:text-[13px]">
            الدليل الشامل لنظام الدكتور ضياء العوضي
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full relative"
        >
          <form onSubmit={handleSubmit} className="relative group">
            <div className="relative flex items-center bg-white border-2 border-slate-300 shadow-md rounded-2xl px-3 sm:px-4 transition-colors duration-300 focus-within:border-slate-400">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="اسأل عن أي طعام..."
                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm sm:text-lg py-3.5 sm:py-4 px-2 sm:px-3 placeholder:text-slate-400 text-slate-900 font-medium min-w-0"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="flex-shrink-0 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-slate-900/20 font-bold text-sm"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>أسال</span>
              </button>
            </div>
          </form>

          {/* Quick Tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-4 sm:mt-6">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag.label}
                onClick={() => {
                  setQuery(tag.query);
                  handleAskAI(tag.query);
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-xs sm:text-sm font-bold transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-800"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-bold text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full mt-6 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3"
            >
              <div className="h-3 bg-slate-100 rounded-full w-3/4 animate-pulse" />
              <div className="h-3 bg-slate-100 rounded-full w-1/2 animate-pulse" />
              <div className="h-3 bg-slate-100 rounded-full w-5/6 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* History cards */}
        <AnimatePresence>
          {history.length > 0 && (
            <motion.div
              ref={historyRef}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mt-8 sm:mt-10"
            >
              {/* Cards row */}
              <div className="flex flex-wrap gap-2 mb-4">
                {history.map((item) => {
                  const cfg = statusConfig[item.status];
                  const isOpen = expandedId === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => setExpandedId(isOpen ? null : item.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all ${cfg.card} ${isOpen ? "ring-2 ring-offset-1 ring-slate-300" : "hover:opacity-80"}`}
                    >
                      {cfg.icon}
                      <span>{item.label}</span>
                      {isOpen ? <ChevronUp className="w-3 h-3 opacity-60" /> : <ChevronDown className="w-3 h-3 opacity-60" />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Expanded answer */}
              <AnimatePresence mode="wait">
                {expandedId !== null && (() => {
                  const item = history.find((h) => h.id === expandedId);
                  if (!item) return null;
                  const cfg = statusConfig[item.status];
                  return (
                    <motion.div
                      key={expandedId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={`bg-white border rounded-2xl overflow-hidden shadow-lg`}
                    >
                      <div className={`h-1 ${cfg.bar}`} />
                      <div className="p-4 sm:p-6">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold mb-3 ${cfg.badge}`}>
                          {cfg.icon}
                          <span>{item.status === "allowed" ? "مسموح – طيبات" : item.status === "prohibited" ? "ممنوع – خبائث" : "يحتاج مراجعة"}</span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mb-3 border-b border-slate-100 pb-3">{item.query}</p>
                        <div className="text-sm sm:text-base leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
                          {item.answer}
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="w-full max-w-3xl mx-auto px-4 py-5 sm:p-8 text-center border-t border-slate-100 relative z-10">
        <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold leading-relaxed max-w-md mx-auto">
          تنبيه: هذا الموقع يستعرض نظام الطيبات من الناحية التوثيقية فقط، ولا يمثل استشارة طبية بديلة عن طبيبك المعالج.
        </p>
      </footer>
    </div>
  );
}
