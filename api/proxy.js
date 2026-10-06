// Vercel Edge Function — Reverse Proxy for shreewin.org
// Deploy on Vercel. All traffic is routed here via vercel.json rewrites.
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

  // 1. Handle CORS preflight
  // Handle CORS preflight
if (request.method === "OPTIONS") {
return new Response(null, {
status: 204,
@@ -23,48 +30,53 @@ export default async function handler(request) {
});
}

  // 2. Route /api/* directly to the API server, everything else to the target site
  const isApi = url.pathname.startsWith("/api/");
  const upstreamOrigin = isApi ? API_ORIGIN : TARGET_ORIGIN;
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

  // 3. Build request headers — spoof Origin/Referer/Host so the server accepts us
  // Forward headers, spoofing Origin/Referer/Host to match the real site
const reqHeaders = new Headers(request.headers);
reqHeaders.set("Host", new URL(upstreamOrigin).host);
if (reqHeaders.has("Origin"))  reqHeaders.set("Origin", TARGET_ORIGIN);
if (reqHeaders.has("Referer")) {
    reqHeaders.set(
      "Referer",
      reqHeaders.get("Referer").replace(url.origin, TARGET_ORIGIN)
    );
    reqHeaders.set("Referer", reqHeaders.get("Referer").replace(url.origin, TARGET_ORIGIN));
}
  // Remove Vercel/CF forwarding headers that may confuse the origin
reqHeaders.delete("x-forwarded-for");
reqHeaders.delete("x-forwarded-host");
reqHeaders.delete("x-forwarded-proto");
reqHeaders.delete("x-vercel-forwarded-for");
reqHeaders.delete("x-vercel-ip-country");

  // 4. Intercept POST body — force `domainurl` to the real site domain
  // For POST requests: parse body and force domainurl = shreewin.org
let body = ["GET", "HEAD"].includes(request.method) ? undefined : request.body;

if (request.method === "POST") {
try {
      const bodyText = await request.text();
      const json = JSON.parse(bodyText);
      if (json.domainurl !== undefined) {
        json.domainurl = TARGET_HOST;
      }
      const json = JSON.parse(await request.text());
      if (json.domainurl !== undefined) json.domainurl = TARGET_HOST;
body = JSON.stringify(json);
reqHeaders.set("Content-Type", "application/json");
      reqHeaders.delete("Content-Length"); // let Vercel recalculate length
    } catch (e) {
      // Not JSON — use raw body as-is
      try { body = await request.text(); } catch (_) { body = request.body; }
      reqHeaders.delete("Content-Length");
    } catch (_) {
      body = request.body;
}
}

  // 5. Proxy the request upstream
  // Fetch from upstream
let upstreamResp;
try {
upstreamResp = await fetch(targetUrl.toString(), {
@@ -77,63 +89,64 @@ export default async function handler(request) {
return new Response("Proxy error: " + err.message, { status: 502 });
}

  // 6. Handle redirects — rewrite Location header to point to our domain
  // Rewrite redirect Location headers
if ([301, 302, 303, 307, 308].includes(upstreamResp.status)) {
    const location = upstreamResp.headers.get("Location") || "";
    const rewritten = location
    const location = (upstreamResp.headers.get("Location") || "")
.replace(TARGET_ORIGIN, url.origin)
.replace(API_ORIGIN, url.origin);
return new Response(null, {
status: upstreamResp.status,
      headers: { Location: rewritten, "Access-Control-Allow-Origin": "*" },
      headers: { "Location": location, "Access-Control-Allow-Origin": "*" },
});
}

  // 7. Clean up response headers
  // Clean response headers
const respHeaders = new Headers(upstreamResp.headers);
  respHeaders.delete("x-frame-options");
  respHeaders.delete("content-security-policy");
  respHeaders.delete("content-security-policy-report-only");
  respHeaders.delete("strict-transport-security");
  respHeaders.delete("cross-origin-opener-policy");
  respHeaders.delete("cross-origin-embedder-policy");
  respHeaders.delete("cross-origin-resource-policy");
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

  // 9. Stream everything else (images, fonts, JSON, etc.) unchanged
  return new Response(upstreamResp.body, {
    status:  upstreamResp.status,
    headers: respHeaders,
  });
  // Stream everything else (images, fonts, JSON, etc.) unchanged
  return new Response(upstreamResp.body, { status: upstreamResp.status, headers: respHeaders });
}
