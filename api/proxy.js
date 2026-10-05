export const config = { runtime: "edge" };

export default async function handler(request) {
  const TARGET_HOST = "shreewin.org";
  const TARGET_ORIGIN = "https://shreewin.org";
  const API_ORIGIN = "https://api.shreewinapi.com";

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

  // 2. Determine upstream: /api/ paths → API server, everything else → site
  const isApi = url.pathname.startsWith("/api/");
  const upstreamOrigin = isApi ? API_ORIGIN : TARGET_ORIGIN;
  const targetUrl = new URL(url.pathname + url.search, upstreamOrigin);

  // 3. Forward headers, but make the server think it came from shreewin.org
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("Host", new URL(upstreamOrigin).host);
  if (reqHeaders.has("Origin")) reqHeaders.set("Origin", TARGET_ORIGIN);
  if (reqHeaders.has("Referer")) {
    reqHeaders.set(
      "Referer",
      reqHeaders.get("Referer").replace(url.origin, TARGET_ORIGIN)
    );
  }
  // Remove Vercel-injected headers that could expose us
  reqHeaders.delete("x-forwarded-for");
  reqHeaders.delete("x-real-ip");
  reqHeaders.delete("x-vercel-id");

  // 4. Intercept POST body — fix `domainurl` so the API accepts the channel
  let body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : request.body;

  if (request.method === "POST") {
    try {
      const bodyText = await request.text();
      const json = JSON.parse(bodyText);
      if (json.domainurl !== undefined) {
        json.domainurl = TARGET_HOST;
      }
      body = JSON.stringify(json);
      reqHeaders.set("Content-Type", "application/json");
      reqHeaders.delete("Content-Length"); // Let the server recalculate
    } catch (e) {
      // Not JSON — leave body as-is
      body = request.body;
    }
  }

  // 5. Proxy the request upstream
  const upstreamResp = await fetch(targetUrl.toString(), {
    method: request.method,
    headers: reqHeaders,
    body: body,
    redirect: "manual",
  });

  // 6. Handle 3xx redirects — rewrite Location header to stay on our domain
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

  // 7. Build response headers
  const respHeaders = new Headers(upstreamResp.headers);
  // Remove security headers that block proxying
  respHeaders.delete("x-frame-options");
  respHeaders.delete("content-security-policy");
  respHeaders.delete("content-security-policy-report-only");
  respHeaders.delete("strict-transport-security");
  respHeaders.delete("cross-origin-opener-policy");
  respHeaders.delete("cross-origin-embedder-policy");
  respHeaders.delete("cross-origin-resource-policy");
  respHeaders.set("Access-Control-Allow-Origin", "*");
  respHeaders.set("Access-Control-Allow-Credentials", "true");

  // Fix Set-Cookie domain so cookies work under the Vercel domain
  const cookies = respHeaders.getAll
    ? respHeaders.getAll("Set-Cookie")
    : [];
  if (cookies.length > 0) {
    respHeaders.delete("Set-Cookie");
    for (const cookie of cookies) {
      const rewritten = cookie
        .replace(/;\s*domain=[^;]*/gi, "; Domain=" + url.hostname)
        .replace(/;\s*samesite=[^;]*/gi, "; SameSite=None")
        .replace(/;\s*secure/gi, "")
        + "; Secure";
      respHeaders.append("Set-Cookie", rewritten);
    }
  }

  const contentType = respHeaders.get("Content-Type") || "";

  // 8. Rewrite HTML/JS bodies so the browser stays on our proxy domain
  if (
    contentType.includes("text/html") ||
    contentType.includes("javascript") ||
    contentType.includes("application/javascript")
  ) {
    let text = await upstreamResp.text();

    // Route API calls through our proxy
    text = text.split(API_ORIGIN).join(url.origin);
    text = text.split("api.shreewinapi.com").join(url.host);

    // Route site links through our proxy
    text = text.split(TARGET_ORIGIN).join(url.origin);
    text = text.split(TARGET_HOST).join(url.host);

    // Remove Content-Encoding (we decoded the body above)
    respHeaders.delete("content-encoding");
    // Set correct content length
    respHeaders.delete("content-length");

    return new Response(text, {
      status: upstreamResp.status,
      headers: respHeaders,
    });
  }

  // 9. Everything else (images, fonts, JSON) — stream through unmodified
  return new Response(upstreamResp.body, {
    status: upstreamResp.status,
    headers: respHeaders,
  });
}
