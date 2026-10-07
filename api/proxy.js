/**
 * Vercel Edge Function — Minimal API Proxy for Register/Login
 * ─────────────────────────────────────────────────────────────
 * This Vercel API ONLY handles the specific endpoints required by
 * panel-orignal.js (Register and Login). It does NOT load the 
 * main site (Cloudflare Workers handles the site).
 *
 * endpoints handled:
 *   - /api/webapi/Login
 *   - /api/webapi/Register
 */

export const config = { runtime: "edge" };

const API_ORIGIN = "https://api.shreewinapi.com";
const TARGET_ORIGIN = "https://shreewin13.com";

export default async function handler(request) {
  // 1. Handle CORS preflight from Cloudflare Worker site
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const url = new URL(request.url);

  // We only expect /api/webapi/Login and /api/webapi/Register to hit Vercel
  // Proxy them to the real API
  const targetUrl = new URL(url.pathname + url.search, API_ORIGIN);

  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("Host", new URL(API_ORIGIN).host);
  reqHeaders.set("Origin", TARGET_ORIGIN);
  reqHeaders.set("Referer", TARGET_ORIGIN + "/");

  // Remove Vercel headers
  for (const h of [
    "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto",
    "x-vercel-forwarded-for", "x-vercel-ip-country",
    "x-vercel-id", "x-vercel-deployment-url",
  ]) reqHeaders.delete(h);

  try {
    const upstreamResp = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: reqHeaders,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "manual",
    });

    const respHeaders = new Headers(upstreamResp.headers);
    // Allow CORS so panel.js can read the response
    respHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      headers: respHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ code: 1, msg: "Vercel Proxy Error: " + err.message }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
