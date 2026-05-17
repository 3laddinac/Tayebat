import { useState, FormEvent, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Loader2, Sparkles, AlertCircle, ChefHat, Info } from "lucide-react";

interface AIResponse {
  answer: string;
  error?: string;
}

const QUICK_TAGS = [
  { label: "الفراخ", query: "هل الفراخ مسموحة في نظام الطيبات؟" },
  { label: "الأرز الأبيض", query: "ما هو حكم الأرز الأبيض في الطيبات؟" },
  { label: "البيض", query: "هل البيض مسموح؟" },
  { label: "اللحمة الحمراء", query: "كيف نأكل اللحمة الحمراء في نظام الطيبات؟" },
];

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  const handleAskAI = async (text: string) => {
    if (!text.trim()) return;
    
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });

      if (!res.ok) {
        throw new Error("فشل الاتصال بالخادم");
      }

      const data: AIResponse = await res.json();
      if (data.error) throw new Error(data.error);

      setResponse(data.answer);
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

  useEffect(() => {
    if (response && responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [response]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc] selection:bg-amber-100" dir="rtl">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-amber-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-slate-100 rounded-full blur-3xl opacity-50" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto w-full relative z-10 transition-all duration-500">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200">
              <ChefHat className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
            ميزان الطيبات
          </h1>
          <p className="text-slate-500 mt-4 text-lg font-medium opacity-80 uppercase tracking-widest text-[13px]">
            الدليل الشامل لنظام الدكتور ضياء العوضي
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full relative"
        >
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute inset-0 bg-slate-900/5 blur-xl group-focus-within:bg-amber-500/10 transition-all duration-300 rounded-3xl" />
            <div className="relative flex items-center bg-white border border-slate-200 shadow-sm rounded-3xl p-2 transition-all duration-300 group-focus-within:border-slate-400 group-focus-within:shadow-xl group-focus-within:shadow-slate-200/50">
              <div className="pr-4 pointer-events-none">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="اسأل عن أي طعام... (مثلاً: هل الملوخية مسموحة؟)"
                className="w-full bg-transparent border-none focus:ring-0 text-xl py-4 px-2 placeholder:text-slate-300 text-slate-800 font-medium"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="ml-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-2xl px-6 py-4 flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-400" />
                )}
                <span>أسال</span>
              </button>
            </div>
          </form>

          {/* Quick Tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag.label}
                onClick={() => {
                  setQuery(tag.query);
                  handleAskAI(tag.query);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results Area */}
        <div className="w-full mt-12 space-y-6" ref={responseRef}>
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4"
              >
                <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse" />
                <div className="h-4 bg-slate-100 rounded-full w-1/2 animate-pulse" />
                <div className="h-4 bg-slate-100 rounded-full w-5/6 animate-pulse" />
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4 text-red-800"
              >
                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                <p className="font-bold">{error}</p>
              </motion.div>
            )}

            {response && (
              <motion.div
                key="response"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden"
              >
                <div className="p-1 bg-gradient-to-l from-slate-900 to-slate-800" />
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-6 opacity-30">
                    <Info className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-widest">نتيجة التحليل</span>
                  </div>
                  <div className="prose prose-slate max-w-none">
                    <div className="text-xl leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
                      {response}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="w-full max-w-3xl mx-auto p-8 text-center border-t border-slate-100 relative z-10">
        <p className="text-[11px] text-slate-400 font-bold leading-relaxed max-w-md mx-auto">
          تنبيه: هذا الموقع يستعرض نظام الطيبات من الناحية التوثيقية فقط، ولا يمثل استشارة طبية بديلة عن طبيبك المعالج.
        </p>
      </footer>
    </div>
  );
}
