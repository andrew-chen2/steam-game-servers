const CACHE_TTL = 30;
const STEAM_API_BASE = "https://api.steampowered.com/IGameServersService/GetServerList/v1/";
const ALLOWED_ORIGIN = "*"; // Change as needed

const FIELDS = [
  "addr",
  "name",
  "appid",
  "players",
  "max_players",
  "map",
  "secure",
];

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

function clean(val) {
  return typeof val === "string" ? val.replace(CONTROL_CHARS, "").trim() : val;
}

function slim(servers) {
  return servers.map((s) => {
    const out = {};
    for (const f of FIELDS) {
      if (f in s) out[f] = clean(s[f]);
    }
    return out;
  });
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const incoming = new URL(request.url);
    const filter = incoming.searchParams.get("filter") ?? "";
    const limit  = Math.min(parseInt(incoming.searchParams.get("limit") ?? "5000", 10), 20000);

    const steamUrl = new URL(STEAM_API_BASE);
    steamUrl.searchParams.set("key", env.STEAM_API_KEY); //Cloudflare worker env
    steamUrl.searchParams.set("limit", String(limit));
    if (filter) steamUrl.searchParams.set("filter", filter);

    const cacheKey = new Request(
      `https://cache.internal/servers?filter=${encodeURIComponent(filter)}&limit=${limit}`
    );
    const cache = caches.default;

    // Cache
    let cached = await cache.match(cacheKey);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
      headers.set("X-Cache", "HIT");
      return new Response(cached.body, { status: cached.status, headers });
    }

    // Steam API
    let steamRes;
    try {
      steamRes = await fetch(steamUrl.toString());
    } catch (err) {
      return jsonResponse({ error: "Failed to reach Steam API", detail: err.message }, 502);
    }

    if (!steamRes.ok) {
      return jsonResponse(
        { error: "Steam API error", status: steamRes.status },
        502
      );
    }

    let body;
    try {
      body = await steamRes.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON from Steam API" }, 502);
    }

    const servers = body?.response?.servers ?? [];
    const slimmed = slim(servers);
    const payload = { servers: slimmed, count: slimmed.length, cached_at: Date.now() };

    // Write to cache
    const toCache = jsonResponse(payload, 200, {
      "Cache-Control": `public, max-age=${CACHE_TTL}`,
      "X-Cache": "MISS",
    });

    const ctx = globalThis.executionCtx;
    if (ctx?.waitUntil) {
      ctx.waitUntil(cache.put(cacheKey, toCache.clone()));
    } else {
      await cache.put(cacheKey, toCache.clone());
    }

    return toCache;
  },
};
