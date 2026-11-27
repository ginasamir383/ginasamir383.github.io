/**
 * wird-tasmee3-proxy — Groq proxy for the wird site.
 *
 * Routes:
 *   POST /transcribe  → Groq Whisper word-level transcription (recitation)
 *   POST /answer      → Groq chat completion, grounded ONLY on the fatwa
 *                       entries the client retrieved from the licensed corpus.
 *   GET  /health      → {ok:true}
 *
 * Secrets (bound in the Cloudflare dashboard, never in code):
 *   GROQ_API_KEY — Groq API key
 *   PROXY_AUTH   — shared soft token the site sends as X-Wird-Auth
 *
 * Grounding rules for /answer (user's requirement):
 * - The model receives the question and the retrieved entries (title,
 *   question, answer) with numeric indexes. It NEVER receives URLs, so it
 *   cannot invent one.
 * - The model must answer only from the given entries and return
 *   {"answer": "...", "cite": <index>} or {"answer": "", "cite": -1} when
 *   the entries do not actually answer the question.
 * - The client maps the cited index back to the URL of the entry it
 *   retrieved, so the link shown always comes from the retrieval layer.
 */
const ALLOWED = ["https://ginasamir383.github.io", "http://localhost", "http://127.0.0.1"];

function corsHeaders(origin) {
  const ok = ALLOWED.some(a => origin === a || (origin && origin.startsWith(a + ":")));
  if (!ok) return null;
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOWED[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Wird-Auth",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  });
}

// Best-effort per-isolate throttle (per IP).
const hits = new Map();
function throttle(key, limit, windowMs) {
  const now = Date.now();
  let rec = hits.get(key);
  if (!rec || now - rec.t0 > windowMs) { rec = { n: 0, t0: now }; hits.set(key, rec); }
  rec.n++;
  if (hits.size > 5000) hits.clear();
  return rec.n <= limit;
}

const ANSWER_SYS =
  "أنت مساعد فتاوى داخل موقع وِرد. ستصلك فتاوى موثّقة مرقّمة (i من 0 إلى N) من موقع الشيخ عبد العزيز بن باز رحمه الله. " +
  "مهمتك: أجب عن سؤال المستخدم مستندًا فقط إلى نصوص هذه الفتاوى، دون إضافة أي معلومة أو حكم من خارجها ولو كنت تعرفه. " +
  "اكتب الجواب بالعربية في 2 إلى 5 جمل، بأسلوب واضح مباشر، يبدأ بالحكم مباشرة دون مقدمات ودون تنويهات ودون ذكر لكلمة فتوى أو مصدر. " +
  "اختر رقم الفتوى الواحدة الأنسب التي استندت إليها. " +
  "أخرج JSON فقط بهذا الشكل: {\"answer\":\"نص الجواب\",\"cite\":0}. " +
  "إذا كانت الفتاوى المعطاة لا تُجيب فعلًا عن السؤال، أخرج: {\"answer\":\"\",\"cite\":-1}.";

async function handleTranscribe(request, env, cors, ip) {
  if ((request.headers.get("X-Wird-Auth") || "") !== (env.PROXY_AUTH || "")) {
    return json({ error: "unauthorized" }, 401, cors);
  }
  if (!throttle("t:" + ip, 30, 600000)) return json({ error: "rate_limited" }, 429, cors);
  const len = +(request.headers.get("Content-Length") || 0);
  if (len > 30 * 1024 * 1024) return json({ error: "too_large" }, 413, cors);
  const ct = request.headers.get("Content-Type") || "";
  if (!ct.includes("multipart/form-data")) return json({ error: "expected multipart form" }, 400, cors);
  let inFd;
  try { inFd = await request.formData(); } catch (e) { return json({ error: "expected multipart form" }, 400, cors); }
  const out = new FormData();
  for (const k of ["file", "model", "language", "prompt"]) {
    const v = inFd.get(k);
    if (v !== null) out.append(k, v);
  }
  out.append("response_format", "verbose_json");
  out.append("timestamp_granularities[]", "word");
  let r;
  try {
    r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: "Bearer " + env.GROQ_API_KEY },
      body: out,
    });
  } catch (e) {
    return json({ error: "upstream_unreachable" }, 502, cors);
  }
  const text = await r.text();
  if (!r.ok) {
    let msg = "upstream_" + r.status;
    try { const j = JSON.parse(text); if (j && j.error && j.error.message) msg = j.error.message; } catch (e) {}
    return json({ error: msg }, r.status === 429 ? 429 : 502, cors);
  }
  return new Response(text, { status: 200, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
}

async function handleAnswer(request, env, cors, ip) {
  if ((request.headers.get("X-Wird-Auth") || "") !== (env.PROXY_AUTH || "")) {
    return json({ error: "unauthorized" }, 401, cors);
  }
  if (!throttle("a:" + ip, 20, 600000)) return json({ error: "rate_limited" }, 429, cors);
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "invalid_json" }, 400, cors); }
  const question = String((body && body.question) || "").slice(0, 500).trim();
  const entries = Array.isArray(body && body.entries) ? body.entries.slice(0, 5) : [];
  if (!question || !entries.length) return json({ error: "invalid_request" }, 422, cors);
  // URLs are deliberately NOT sent to the model: it can never emit one.
  const clean = entries.map((e, i) => ({
    i,
    title: String((e && e.t) || "").slice(0, 200),
    question: String((e && e.q) || "").slice(0, 600),
    answer: String((e && e.a) || "").slice(0, 4000),
  }));
  // Model availability differs per Groq account; try in order.
  const MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "allam-2-7b"];
  let r = null, text = "", lastErr = "";
  for (const model of MODELS) {
    const payload = {
      model,
      temperature: 0.2,
      max_tokens: 1200,
      reasoning_effort: "low",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ANSWER_SYS },
        { role: "user", content: JSON.stringify({ question, entries: clean }) },
      ],
    };
    try {
      r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: "Bearer " + env.GROQ_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      text = await r.text();
    } catch (e) {
      return json({ error: "upstream_unreachable" }, 502, cors);
    }
    if (r.ok) break;
    try { const j = JSON.parse(text); lastErr = (j && j.error && j.error.message) || ("upstream_" + r.status); } catch (e) { lastErr = "upstream_" + r.status; }
    if (!/model/.test(lastErr)) return json({ error: lastErr }, r.status === 429 ? 429 : 502, cors);
  }
  if (!r || !r.ok) return json({ error: lastErr || "no_model_available" }, 502, cors);
  let out = null;
  try {
    const j = JSON.parse(text);
    const content = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    const cite = parsed && typeof parsed.cite === "number" ? Math.trunc(parsed.cite) : -1;
    const answer = parsed && typeof parsed.answer === "string" ? parsed.answer.trim() : "";
    if (answer && cite >= 0 && cite < clean.length) out = { answer: answer.slice(0, 1500), cite };
  } catch (e) {}
  if (!out) return json({ error: "no_grounded_answer" }, 422, cors);
  return json(out, 200, cors);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (url.pathname === "/health") return json({ ok: true, service: "wird-tasmee3-proxy" }, 200, cors || {});
    if (!cors) return json({ error: "forbidden origin" }, 403, { "Content-Type": "application/json; charset=utf-8" });
    const ip = request.headers.get("CF-Connecting-IP") || "anon";
    if (url.pathname === "/transcribe" && request.method === "POST") return handleTranscribe(request, env, cors, ip);
    if (url.pathname === "/answer" && request.method === "POST") return handleAnswer(request, env, cors, ip);
    return json({ error: "not_found" }, 404, cors);
  },
};
