export const config = { runtime: "edge" };

const TARGET_HOST   = "shreewin.org";
const TARGET_ORIGIN = "https://shreewin.org";
const API_ORIGIN    = "https://api.shreewinapi.com";

// Static asset extensions — serve from CDN cache, never rewrite body
const STATIC_EXTS = /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp4|webp|json|map)(\?|$)/i;

export default async function handler(request) {
  const url = new URL(request.url);

  // 1. CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // 2. Determine upstream
  const isApi = url.pathname.startsWith("/api/");
  const upstreamOrigin = isApi ? API_ORIGIN : TARGET_ORIGIN;
  const targetUrl = new URL(url.pathname + url.search, upstreamOrigin);

  // 3. Build request headers
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("Host", new URL(upstreamOrigin).host);
  if (reqHeaders.has("Origin"))  reqHeaders.set("Origin", TARGET_ORIGIN);
  if (reqHeaders.has("Referer")) {
    reqHeaders.set("Referer", reqHeaders.get("Referer").replace(url.origin, TARGET_ORIGIN));
  }
  reqHeaders.delete("x-forwarded-for");
  reqHeaders.delete("x-real-ip");
  reqHeaders.delete("x-vercel-id");

  // 4. Fix `domainurl` in POST bodies (Login / Register only)
  let body = (request.method === "GET" || request.method === "HEAD") ? undefined : request.body;
  if (request.method === "POST" && (url.pathname.includes("/Login") || url.pathname.includes("/Register"))) {
    try {
      const text = await request.text();
      const json = JSON.parse(text);
      if (json.domainurl !== undefined) json.domainurl = TARGET_HOST;
      body = JSON.stringify(json);
      reqHeaders.set("Content-Type", "application/json");
      reqHeaders.delete("Content-Length");
    } catch (e) { /* not JSON */ }
  }

  // 5. Choose cache strategy:
  //    - static assets → use CDN cache (fast)
  //    - API / HTML    → no-store (always fresh)
  const isStatic = STATIC_EXTS.test(url.pathname);
  const cacheMode = isStatic ? "default" : "no-store";

  // 6. Fetch upstream
  const upstreamResp = await fetch(targetUrl.toString(), {
    method:   request.method,
    headers:  reqHeaders,
    body:     body,
    redirect: "manual",
    cache:    cacheMode,
  });

  // 7. Handle redirects
  if ([301, 302, 303, 307, 308].includes(upstreamResp.status)) {
    const loc = (upstreamResp.headers.get("Location") || "")
      .replace(TARGET_ORIGIN, url.origin)
      .replace(API_ORIGIN, url.origin);
    return new Response(null, {
      status: upstreamResp.status,
      headers: { Location: loc, "Access-Control-Allow-Origin": "*" },
    });
  }

  // 8. Build response headers
  const respHeaders = new Headers(upstreamResp.headers);
  respHeaders.delete("x-frame-options");
  respHeaders.delete("content-security-policy");
  respHeaders.delete("content-security-policy-report-only");
  respHeaders.delete("strict-transport-security");
  respHeaders.delete("cross-origin-opener-policy");
  respHeaders.delete("cross-origin-embedder-policy");
  respHeaders.delete("cross-origin-resource-policy");
  respHeaders.set("Access-Control-Allow-Origin", "*");
  respHeaders.set("Access-Control-Allow-Credentials", "true");

  // Rewrite Set-Cookie domains
  const cookies = respHeaders.getAll ? respHeaders.getAll("Set-Cookie") : [];
  if (cookies.length > 0) {
    respHeaders.delete("Set-Cookie");
    for (const cookie of cookies) {
      respHeaders.append("Set-Cookie",
        cookie
          .replace(/;\s*domain=[^;]*/gi, "; Domain=" + url.hostname)
          .replace(/;\s*samesite=[^;]*/gi, "; SameSite=None")
          .replace(/;\s*secure/gi, "") + "; Secure"
      );
    }
  }

  const contentType = respHeaders.get("Content-Type") || "";
  const isHtml = contentType.includes("text/html");

  // 9. Static assets: stream directly (NO body buffering — maximum speed)
  if (isStatic && !isHtml) {
    // Tell CDN to cache static assets for 1 hour
    if (!respHeaders.has("cache-control")) {
      respHeaders.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    }
    return new Response(upstreamResp.body, {
      status:  upstreamResp.status,
      headers: respHeaders,
    });
  }

  // 10. HTML pages: rewrite URLs so the browser stays on our proxy
  if (isHtml) {
    let text = await upstreamResp.text();

    text = text.split(API_ORIGIN).join(url.origin);
    text = text.split("api.shreewinapi.com").join(url.host);
    text = text.split(TARGET_ORIGIN).join(url.origin);
    text = text.split(TARGET_HOST).join(url.host);

    respHeaders.delete("content-encoding");
    respHeaders.delete("content-length");
    respHeaders.set("Cache-Control", "no-store");

    return new Response(text, {
      status:  upstreamResp.status,
      headers: respHeaders,
    });
  }

  // 11. Everything else (JSON API responses, etc.) — stream through
  return new Response(upstreamResp.body, {
    status:  upstreamResp.status,
    headers: respHeaders,
  });
}
