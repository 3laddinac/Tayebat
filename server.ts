import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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

async function startServer() {
  const app = express();
  const PORT = 5000;

  app.use(express.json());

  // Gemini API client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API route for asking the AI
  app.post("/api/ask", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: query }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
        },
      });

      const text = response.text || "عذراً، لم أستطع الحصول على إجابة.";
      res.json({ answer: text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "حدث خطأ أثناء معالجة طلبك." });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
