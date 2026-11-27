# wird-dorar-proxy

Server-side proxy between the wird site (GitHub Pages, static) and the official
Dorar (الدرر السنية) encyclopedia API. Dorar's API terms forbid putting the access
token in client-side code, so the site calls this Worker and the Worker calls
Dorar with the token kept as a Worker secret.

## Endpoints
- `GET /dorar/feqhia?q=...&limit=3` — الموسوعة الفقهية search
- `GET /dorar/aqeeda?q=...&limit=3` — الموسوعة العقدية search

Responses are the upstream Dorar JSON, cached at most 24h (terms allow 24–48h
for performance caching only). CORS is limited to the site origin + localhost.

## Deploy (after Dorar approves the access request and emails the token)
1. `wrangler login` (or use the Cloudflare dashboard worker editor)
2. `wrangler deploy` from this directory
3. `wrangler secret put DORAR_TOKEN` — paste the token from Dorar's email

## Dorar terms honored
- token server-side only (Worker secret)
- site shows each result's full text unmodified + attribution + clickable url
- cache ≤ 24h, performance-only; no bulk download or full-DB storage
- 60 req/min upstream limit; personal-site traffic is far below it
