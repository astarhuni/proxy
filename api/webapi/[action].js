// pages/api/webapi/[action].js
// Vercel API — Login aur Register proxy
//
// File path: vercel-api/pages/api/webapi/[action].js
// Deploy: cd vercel-api && npx vercel --prod

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin",          "*");
  res.setHeader("Access-Control-Allow-Methods",         "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers",         "*");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  res.setHeader("Access-Control-Max-Age",               "86400");

  if (req.method === "OPTIONS") return res.status(204).end();

  const { action } = req.query;
  if (!["Login", "Register"].includes(action))
    return res.status(404).json({ code: 1, msg: "Not found" });

  // Body parse
  let body = req.body;
  if (typeof body === "string") try { body = JSON.parse(body); } catch {}
  if (!body) body = {};

  // domainurl inject (force overwrite to prevent "Channel does not exist")
  body.domainurl = "shreewin55.com";

  const realIp =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    "";

  // Forward to shreewin55 backend
  let resp;
  try {
    resp = await fetch(`https://api.shreewinapi.com/api/webapi/${action}`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Accept":       "application/json, text/plain, */*",
        "Origin":       "https://shreewin55.com",
        "Referer":      "https://shreewin55.com/",
        "ar-origin":    req.headers["ar-origin"]  || "https://shree777.win",
        "ar-real-ip":   req.headers["ar-real-ip"] || realIp,
        "User-Agent":   req.headers["user-agent"] || "Mozilla/5.0",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return res.status(502).json({ code: 1, msg: "Proxy error: " + err.message });
  }

  const data = await resp.json();
  return res.status(200).json(data);
}
