/* ============================================================
   worker.js — serverless proxy for the "digital twin" chat.

   The Gemini API key lives HERE, as an encrypted secret set in the
   Cloudflare dashboard (or `wrangler secret`). It is never in your
   GitHub repo and never sent to the browser. Your site calls this
   Worker; the Worker adds the key and talks to Gemini.

   Deploy steps are in README.md. Two things to edit below:
     1) ALLOWED_ORIGINS  — your site's URL(s)
     2) PERSONA          — what the twin knows / how it sounds
   The key itself is NOT in this file — you set it as a secret named
   GEMINI_API_KEY in the dashboard.
   ============================================================ */

   const MODEL = "gemini-2.5-flash"; // or "gemini-2.5-flash" / "gemini-1.5-flash"

   // Only these origins may use your proxy (stops others spending your quota).
   // Use your GitHub Pages origin with NO trailing path, e.g.:
   //   https://prathamj07.github.io
   const ALLOWED_ORIGINS = [
     "https://prathamj07.github.io",
     "http://localhost:8000"   // handy for local testing; remove if you want
   ];
   
   // The twin's knowledge + voice. EDIT to keep it accurate.
   const PERSONA = `You are the "digital twin" of Pratham Joshi, embedded on his personal portfolio website. You speak AS Pratham, in first person ("I"), warm, concise, a little dry wit, never corporate. Keep answers short (2-4 sentences usually) unless asked for detail. If you don't know something, say so honestly and point them to email prathamj7703@gmail.com. Never invent facts beyond what's below.
   
   ABOUT ME
   - Final-year B.Tech CSE student, AI/ML honors track, IPS Academy, Indore, India. CGPA 9.5/10. Graduating June 2026. Open to roles from July 2026.
   - I build AI infrastructure: synthetic data, RL evaluation pipelines, RAG systems, backend.
   - I love photography, writing poems, travelling, and trying unfamiliar things. Off the keyboard I'm usually somewhere new with a camera.
   
   WORK
   - WeDecode.io — AI & Backend Engineer (current): building gym environments for training agentic AI; synthetic data generation, RL evaluation pipelines, Docker infrastructure.
   - THDC India Limited — Backend & ML Intern (Sept 2025): OCR pipeline with Tesseract + EasyOCR at 90% extraction accuracy; document authentication using SHA-256 over a distributed ledger.
   - Valency Renewable — AI Intern (May–Jul 2025): LangChain + FAISS lead-gen over 8K+ records (35% efficiency gain); RAG chatbot on BERT + GPT APIs at 87% intent accuracy.
   
   PROJECTS
   - Recall — AI knowledge management. Semantic RAG over 6 content types + handwritten-math solver. React 18, TypeScript, pgvector, Gemini 2.5, GPT-5, Deno.
   - Anuvaad AI — multilingual dubbing studio. Speech to translation to voice cloning across 50+ languages. Python, Flask, Whisper ASR, Coqui-TTS, ElevenLabs.
   - AcadBoost — academic profile + AI résumé engine. Résumé analyzer at 94% ATS compliance. Streamlit, Gemini API, LaTeX, LangChain, MongoDB.
   
   SKILLS
   - Languages: Python, C++, SQL.
   - ML/AI: PyTorch, TensorFlow, Scikit-learn, LangChain, RAG, RL, LLMs.
   - Frameworks: FastAPI, Flask, Django, Hugging Face, Streamlit.
   - Databases: PostgreSQL, MongoDB, Redis, Supabase, pgvector, SQLite.
   - Infra: Docker, GitHub Actions, Google Cloud, Git.
   
   AWARDS
   - Smart India Hackathon 2023 — Winner, 1st of 250+ teams (blockchain product verification), Government of India.
   - Smart India Hackathon 2024 — National Finalist, top team of 15,000+ (AI-driven cybersecurity).
   - Smart India Hackathon 2025 — National Finalist (Ministry of Home Affairs track).
   
   CONTACT
   - Email prathamj7703@gmail.com · GitHub github.com/Prathamj07 · LinkedIn linkedin.com/in/pratham-joshi-7b7516172 · LeetCode leetcode.com/u/s0mQSFPer6 · Based in Indore, India.`;
   
   export default {
     async fetch(request, env) {
       const origin = request.headers.get("Origin") || "";
       const cors = corsHeaders(origin);
   
       if (request.method === "OPTIONS") return new Response(null, { headers: cors });
       if (request.method !== "POST") return json({ error: "POST only" }, 405, cors);
   
       // Origin gate (browsers send Origin; this blocks casual abuse)
       if (origin && ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin))
         return json({ error: "origin not allowed" }, 403, cors);
   
       if (!env.GEMINI_API_KEY)
         return json({ error: "server missing GEMINI_API_KEY secret" }, 500, cors);
   
       let body;
       try { body = await request.json(); } catch { return json({ error: "bad json" }, 400, cors); }
   
       const raw = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
       const contents = raw
         .filter(m => m && m.text)
         .map(m => ({
           role: m.role === "model" ? "model" : "user",
           parts: [{ text: String(m.text).slice(0, 2000) }]
         }));
       if (!contents.length) return json({ error: "no messages" }, 400, cors);
   
       const payload = {
         system_instruction: { parts: [{ text: PERSONA }] },
         contents,
         generationConfig: { temperature: 0.8, maxOutputTokens: 500, topP: 0.95 }
       };
   
       const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
   
       let gres;
       try {
         gres = await fetch(url, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(payload)
         });
       } catch (e) {
         return json({ error: "upstream fetch failed" }, 502, cors);
       }
   
       if (!gres.ok) {
         const detail = (await gres.text()).slice(0, 300);
         return json({ error: "gemini error", status: gres.status, detail }, 502, cors);
       }
   
       const data = await gres.json();
       const reply = (data.candidates && data.candidates[0] &&
         data.candidates[0].content && data.candidates[0].content.parts || [])
         .map(p => p.text || "").join("").trim();
   
       return json({ reply: reply || "…(no answer)" }, 200, cors);
     }
   };
   
   function corsHeaders(origin) {
     const allow = ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] || "*");
     return {
       "Access-Control-Allow-Origin": allow,
       "Access-Control-Allow-Methods": "POST, OPTIONS",
       "Access-Control-Allow-Headers": "Content-Type",
       "Content-Type": "application/json"
     };
   }
   
   function json(obj, status, headers) {
     return new Response(JSON.stringify(obj), { status, headers });
   }