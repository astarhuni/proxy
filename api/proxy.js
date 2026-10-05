// Vercel Edge Function — Reverse Proxy for shreewin.org
// All traffic is routed here via vercel.json rewrites.

export const config = { runtime: "edge" };

const TARGET_HOST   = "shreewin.org";
const TARGET_ORIGIN = "https://shreewin.org";
const API_ORIGIN    = "https://api.shreewinapi.com";

// Static files served directly from your GitHub repo (always latest version)
const GITHUB_RAW = "https://raw.githubusercontent.com/astarhuni/proxy/main";
const STATIC_FILES = {
  "/panel.js": `${GITHUB_RAW}/panel.js`,
  "/logo.png": `${GITHUB_RAW}/logo.png`,
};

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

  // Serve static files (panel.js, logo.png) directly from GitHub
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

  // For POST requests: parse body and force domainurl = shreewin.org
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
  for (const h of [
    "x-frame-options",
    "content-security-policy",
    "content-security-policy-report-only",
    "strict-transport-security",
    "cross-origin-opener-policy",
    "cross-origin-embedder-policy",
    "cross-origin-resource-policy",
  ]) respHeaders.delete(h);
  respHeaders.set("Access-Control-Allow-Origin", "*");

  const contentType = respHeaders.get("Content-Type") || "";

  // Rewrite HTML: fix URLs + inject panel.js before </body>
  if (contentType.includes("text/html")) {
    let html = await upstreamResp.text();

    html = html.split(API_ORIGIN).join(url.origin);
    html = html.split("api.shreewinapi.com").join(url.host);
    html = html.split(TARGET_ORIGIN).join(url.origin);
    html = html.split(TARGET_HOST).join(url.host);

    // Inject panel.js at end of <body>
    const injection = `
  <!-- Proxy injection -->
  <script src="/panel.js"></script>
`;
    html = html.replace("</body>", injection + "</body>");

    return new Response(html, { status: upstreamResp.status, headers: respHeaders });
  }

  // Rewrite JS files: fix any hardcoded URLs
  if (contentType.includes("javascript") || contentType.includes("application/javascript")) {
    let js = await upstreamResp.text();

    js = js.split(API_ORIGIN).join(url.origin);
    js = js.split("api.shreewinapi.com").join(url.host);
    js = js.split(TARGET_ORIGIN).join(url.origin);
    js = js.split(TARGET_HOST).join(url.host);

    respHeaders.set("Content-Type", "application/javascript; charset=utf-8");
    return new Response(js, { status: upstreamResp.status, headers: respHeaders });
  }

  // Stream everything else (images, fonts, JSON, etc.) unchanged
  return new Response(upstreamResp.body, { status: upstreamResp.status, headers: respHeaders });
}
