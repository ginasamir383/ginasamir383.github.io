/**
 * wird-dorar-proxy: server-side proxy between the wird site and the official
 * Dorar (الدرر السنية) encyclopedia API.
 *
 * Dorar API terms compliance:
 * - DORAR_TOKEN is a Worker secret, never shipped to the client (terms §6).
 * - Responses cached max 24h for performance only (terms: 24-48h allowed).
 * - The site displays each result's full text unmodified, with clear
 *   attribution to الدرر السنية and a clickable link (the url field).
 * - No bulk download, no re-aggregation, no full-DB storage.
 */
const SERVICES = new Set(["feqhia", "aqeeda"]);
const ALLOWED = ["https://ginasamir383.github.io", "http://localhost", "http://127.0.0.1"];
const CACHE_TTL_MS = 24 * 3600 * 1000; // 24h, within Dorar's 24-48h cache allowance

function corsHeaders(origin) {
  const ok = ALLOWED.some(a => origin === a || (origin && origin.startsWith(a + ":")));
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOWED[0],
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}
function json(body, status, cors) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const m = url.pathname.match(/^\/dorar\/([a-z]+)\/?$/);
    if (!m || !SERVICES.has(m[1])) return json({ error: "not_found" }, 404, cors);

    const q = (url.searchParams.get("q") || "").trim();
    if (q.length < 2 || q.length > 200) return json({ error: "invalid_request", message: "q must be 2-200 chars" }, 422, cors);
    const limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get("limit") || "3", 10) || 3));
    if (!env.DORAR_TOKEN) return json({ error: "token_missing", message: "Dorar access token not configured yet" }, 503, cors);

    const api = new URL("https://dorar.net/api/v1/" + m[1] + "/search");
    api.searchParams.set("q", q);
    api.searchParams.set("limit", String(limit));
    const key = new Request(api.toString());

    const cache = caches.default;
    const hit = await cache.match(key);
    if (hit) {
      const at = +(hit.headers.get("x-cached-at") || 0);
      if (Date.now() - at < CACHE_TTL_MS) {
        const h = new Headers(hit.headers);
        for (const [k, v] of Object.entries(cors)) h.set(k, v);
        return new Response(hit.body, { status: hit.status, headers: h });
      }
    }

    let r;
    try {
      r = await fetch(api, { headers: { Authorization: "Bearer " + env.DORAR_TOKEN } });
    } catch (e) {
      return json({ error: "upstream_unreachable" }, 502, cors);
    }
    const body = await r.text();
    if (r.ok) {
      const store = new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "x-cached-at": String(Date.now()) } });
      await cache.put(key, store);
    }
    return new Response(body, { status: r.status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
  },
};
