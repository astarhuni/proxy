// Vercel Edge Function — Reverse Proxy for shreewin.org
// Deploy on Vercel. All traffic is routed here via vercel.json rewrites.

export const config = { runtime: "edge" };

const TARGET_HOST   = "shreewin.org";
const TARGET_ORIGIN = "https://shreewin.org";
const API_ORIGIN    = "https://api.shreewinapi.com";

export default async function handler(request) {
  const url = new URL(request.url);

  // 1. Handle CORS preflight
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

  // 2. Route /api/* directly to the API server, everything else to the target site
  const isApi = url.pathname.startsWith("/api/");
  const upstreamOrigin = isApi ? API_ORIGIN : TARGET_ORIGIN;
  const targetUrl = new URL(url.pathname + url.search, upstreamOrigin);

  // 3. Build request headers — spoof Origin/Referer/Host so the server accepts us
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("Host", new URL(upstreamOrigin).host);
  if (reqHeaders.has("Origin"))  reqHeaders.set("Origin", TARGET_ORIGIN);
  if (reqHeaders.has("Referer")) {
    reqHeaders.set(
      "Referer",
      reqHeaders.get("Referer").replace(url.origin, TARGET_ORIGIN)
    );
  }
  // Remove Vercel/CF forwarding headers that may confuse the origin
  reqHeaders.delete("x-forwarded-for");
  reqHeaders.delete("x-forwarded-host");
  reqHeaders.delete("x-forwarded-proto");
  reqHeaders.delete("x-vercel-forwarded-for");
  reqHeaders.delete("x-vercel-ip-country");

  // 4. Intercept POST body — force `domainurl` to the real site domain
  let body = ["GET", "HEAD"].includes(request.method) ? undefined : request.body;

  if (request.method === "POST") {
    try {
      const bodyText = await request.text();
      const json = JSON.parse(bodyText);
      if (json.domainurl !== undefined) {
        json.domainurl = TARGET_HOST;
      }
      body = JSON.stringify(json);
      reqHeaders.set("Content-Type", "application/json");
      reqHeaders.delete("Content-Length"); // let Vercel recalculate length
    } catch (e) {
      // Not JSON — use raw body as-is
      try { body = await request.text(); } catch (_) { body = request.body; }
    }
  }

  // 5. Proxy the request upstream
  let upstreamResp;
  try {
    upstreamResp = await fetch(targetUrl.toString(), {
      method:   request.method,
      headers:  reqHeaders,
      body:     body,
      redirect: "manual",
    });
  } catch (err) {
    return new Response("Proxy error: " + err.message, { status: 502 });
  }

  // 6. Handle redirects — rewrite Location header to point to our domain
  if ([301, 302, 303, 307, 308].includes(upstreamResp.status)) {
    const location = upstreamResp.headers.get("Location") || "";
    const rewritten = location
      .replace(TARGET_ORIGIN, url.origin)
      .replace(API_ORIGIN, url.origin);
    return new Response(null, {
      status: upstreamResp.status,
      headers: { Location: rewritten, "Access-Control-Allow-Origin": "*" },
    });
  }

  // 7. Clean up response headers
  const respHeaders = new Headers(upstreamResp.headers);
  respHeaders.delete("x-frame-options");
  respHeaders.delete("content-security-policy");
  respHeaders.delete("content-security-policy-report-only");
  respHeaders.delete("strict-transport-security");
  respHeaders.delete("cross-origin-opener-policy");
  respHeaders.delete("cross-origin-embedder-policy");
  respHeaders.delete("cross-origin-resource-policy");
  respHeaders.set("Access-Control-Allow-Origin", "*");

  // 8. Rewrite HTML and JS so browser URLs stay on the Vercel domain
  const contentType = respHeaders.get("Content-Type") || "";
  if (
    contentType.includes("text/html") ||
    contentType.includes("javascript") ||
    contentType.includes("application/javascript")
  ) {
    let text = await upstreamResp.text();

    // API references → our proxy
    text = text.split(API_ORIGIN).join(url.origin);
    text = text.split("api.shreewinapi.com").join(url.host);

    // Site references → our proxy
    text = text.split(TARGET_ORIGIN).join(url.origin);
    text = text.split(TARGET_HOST).join(url.host);

    // Remove any old Cloudflare worker URLs that may still exist
    text = text.split("shree00-win.wakeuptorealityok.workers.dev").join(url.host);

    // Force Content-Type correct for JS files
    if (contentType.includes("javascript")) {
      respHeaders.set("Content-Type", "application/javascript; charset=utf-8");
    }

    return new Response(text, {
      status:  upstreamResp.status,
      headers: respHeaders,
    });
  }

  // 9. Stream everything else (images, fonts, JSON, etc.) unchanged
  return new Response(upstreamResp.body, {
    status:  upstreamResp.status,
    headers: respHeaders,
  });
}
