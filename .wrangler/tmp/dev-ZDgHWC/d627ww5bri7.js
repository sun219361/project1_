var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-6f5498/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/pages-v33l1c/bundledWorker-0.729669974781844.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var urls2 = /* @__PURE__ */ new Set();
function checkURL2(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls2.has(url.toString())) {
      urls2.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL2, "checkURL");
__name2(checkURL2, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL2(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});
var kt = Object.defineProperty;
var Je = /* @__PURE__ */ __name2((e) => {
  throw TypeError(e);
}, "Je");
var It = /* @__PURE__ */ __name2((e, t, r) => t in e ? kt(e, t, { enumerable: true, configurable: true, writable: true, value: r }) : e[t] = r, "It");
var h = /* @__PURE__ */ __name2((e, t, r) => It(e, typeof t != "symbol" ? t + "" : t, r), "h");
var _e = /* @__PURE__ */ __name2((e, t, r) => t.has(e) || Je("Cannot " + r), "_e");
var d = /* @__PURE__ */ __name2((e, t, r) => (_e(e, t, "read from private field"), r ? r.call(e) : t.get(e)), "d");
var g = /* @__PURE__ */ __name2((e, t, r) => t.has(e) ? Je("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), "g");
var m = /* @__PURE__ */ __name2((e, t, r, a) => (_e(e, t, "write to private field"), a ? a.call(e, r) : t.set(e, r), r), "m");
var b = /* @__PURE__ */ __name2((e, t, r) => (_e(e, t, "access private method"), r), "b");
var Fe = /* @__PURE__ */ __name2((e, t, r, a) => ({ set _(o) {
  m(e, t, o, r);
}, get _() {
  return d(e, t, a);
} }), "Fe");
var Ue = /* @__PURE__ */ __name2((e, t, r) => (a, o) => {
  let n = -1;
  return s(0);
  async function s(i) {
    if (i <= n) throw new Error("next() called multiple times");
    n = i;
    let l, c = false, p;
    if (e[i] ? (p = e[i][0][0], a.req.routeIndex = i) : p = i === e.length && o || void 0, p) try {
      l = await p(a, () => s(i + 1));
    } catch (u) {
      if (u instanceof Error && t) a.error = u, l = await t(u, a), c = true;
      else throw u;
    }
    else a.finalized === false && r && (l = await r(a));
    return l && (a.finalized === false || c) && (a.res = l), a;
  }
  __name(s, "s");
  __name2(s, "s");
}, "Ue");
var Ot = /* @__PURE__ */ Symbol();
var Tt = /* @__PURE__ */ __name2(async (e, t = /* @__PURE__ */ Object.create(null)) => {
  const { all: r = false, dot: a = false } = t, n = (e instanceof lt ? e.raw.headers : e.headers).get("Content-Type");
  return n != null && n.startsWith("multipart/form-data") || n != null && n.startsWith("application/x-www-form-urlencoded") ? jt(e, { all: r, dot: a }) : {};
}, "Tt");
async function jt(e, t) {
  const r = await e.formData();
  return r ? Et(r, t) : {};
}
__name(jt, "jt");
__name2(jt, "jt");
function Et(e, t) {
  const r = /* @__PURE__ */ Object.create(null);
  return e.forEach((a, o) => {
    t.all || o.endsWith("[]") ? Rt(r, o, a) : r[o] = a;
  }), t.dot && Object.entries(r).forEach(([a, o]) => {
    a.includes(".") && (Lt(r, a, o), delete r[a]);
  }), r;
}
__name(Et, "Et");
__name2(Et, "Et");
var Rt = /* @__PURE__ */ __name2((e, t, r) => {
  e[t] !== void 0 ? Array.isArray(e[t]) ? e[t].push(r) : e[t] = [e[t], r] : t.endsWith("[]") ? e[t] = [r] : e[t] = r;
}, "Rt");
var Lt = /* @__PURE__ */ __name2((e, t, r) => {
  if (/(?:^|\.)__proto__\./.test(t)) return;
  let a = e;
  const o = t.split(".");
  o.forEach((n, s) => {
    s === o.length - 1 ? a[n] = r : ((!a[n] || typeof a[n] != "object" || Array.isArray(a[n]) || a[n] instanceof File) && (a[n] = /* @__PURE__ */ Object.create(null)), a = a[n]);
  });
}, "Lt");
var at = /* @__PURE__ */ __name2((e) => {
  const t = e.split("/");
  return t[0] === "" && t.shift(), t;
}, "at");
var Nt = /* @__PURE__ */ __name2((e) => {
  const { groups: t, path: r } = Pt(e), a = at(r);
  return At(a, t);
}, "Nt");
var Pt = /* @__PURE__ */ __name2((e) => {
  const t = [];
  return e = e.replace(/\{[^}]+\}/g, (r, a) => {
    const o = `@${a}`;
    return t.push([o, r]), o;
  }), { groups: t, path: e };
}, "Pt");
var At = /* @__PURE__ */ __name2((e, t) => {
  for (let r = t.length - 1; r >= 0; r--) {
    const [a] = t[r];
    for (let o = e.length - 1; o >= 0; o--) if (e[o].includes(a)) {
      e[o] = e[o].replace(a, t[r][1]);
      break;
    }
  }
  return e;
}, "At");
var Re = {};
var zt = /* @__PURE__ */ __name2((e, t) => {
  if (e === "*") return "*";
  const r = e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (r) {
    const a = `${e}#${t}`;
    return Re[a] || (r[2] ? Re[a] = t && t[0] !== ":" && t[0] !== "*" ? [a, r[1], new RegExp(`^${r[2]}(?=/${t})`)] : [e, r[1], new RegExp(`^${r[2]}$`)] : Re[a] = [e, r[1], true]), Re[a];
  }
  return null;
}, "zt");
var Ke = /* @__PURE__ */ __name2((e, t) => {
  try {
    return t(e);
  } catch {
    return e.replace(/(?:%[0-9A-Fa-f]{2})+/g, (r) => {
      try {
        return t(r);
      } catch {
        return r;
      }
    });
  }
}, "Ke");
var Ct = /* @__PURE__ */ __name2((e) => Ke(e, decodeURI), "Ct");
var ot = /* @__PURE__ */ __name2((e) => {
  const t = e.url, r = t.indexOf("/", t.indexOf(":") + 4);
  let a = r;
  for (; a < t.length; a++) {
    const o = t.charCodeAt(a);
    if (o === 37) {
      const n = t.indexOf("?", a), s = t.indexOf("#", a), i = n === -1 ? s === -1 ? void 0 : s : s === -1 ? n : Math.min(n, s), l = t.slice(r, i);
      return Ct(l.includes("%25") ? l.replace(/%25/g, "%2525") : l);
    } else if (o === 63 || o === 35) break;
  }
  return t.slice(r, a);
}, "ot");
var Mt = /* @__PURE__ */ __name2((e) => {
  const t = ot(e);
  return t.length > 1 && t.at(-1) === "/" ? t.slice(0, -1) : t;
}, "Mt");
var se = /* @__PURE__ */ __name2((e, t, ...r) => (r.length && (t = se(t, ...r)), `${(e == null ? void 0 : e[0]) === "/" ? "" : "/"}${e}${t === "/" ? "" : `${(e == null ? void 0 : e.at(-1)) === "/" ? "" : "/"}${(t == null ? void 0 : t[0]) === "/" ? t.slice(1) : t}`}`), "se");
var nt = /* @__PURE__ */ __name2((e) => {
  if (e.charCodeAt(e.length - 1) !== 63 || !e.includes(":")) return null;
  const t = e.split("/"), r = [];
  let a = "";
  return t.forEach((o) => {
    if (o !== "" && !/\:/.test(o)) a += "/" + o;
    else if (/\:/.test(o)) if (/\?/.test(o)) {
      r.length === 0 && a === "" ? r.push("/") : r.push(a);
      const n = o.replace("?", "");
      a += "/" + n, r.push(a);
    } else a += "/" + o;
  }), r.filter((o, n, s) => s.indexOf(o) === n);
}, "nt");
var $e = /* @__PURE__ */ __name2((e) => /[%+]/.test(e) ? (e.indexOf("+") !== -1 && (e = e.replace(/\+/g, " ")), e.indexOf("%") !== -1 ? Ke(e, it) : e) : e, "$e");
var st = /* @__PURE__ */ __name2((e, t, r) => {
  let a;
  if (!r && t && !/[%+]/.test(t)) {
    let s = e.indexOf("?", 8);
    if (s === -1) return;
    for (e.startsWith(t, s + 1) || (s = e.indexOf(`&${t}`, s + 1)); s !== -1; ) {
      const i = e.charCodeAt(s + t.length + 1);
      if (i === 61) {
        const l = s + t.length + 2, c = e.indexOf("&", l);
        return $e(e.slice(l, c === -1 ? void 0 : c));
      } else if (i == 38 || isNaN(i)) return "";
      s = e.indexOf(`&${t}`, s + 1);
    }
    if (a = /[%+]/.test(e), !a) return;
  }
  const o = {};
  a ?? (a = /[%+]/.test(e));
  let n = e.indexOf("?", 8);
  for (; n !== -1; ) {
    const s = e.indexOf("&", n + 1);
    let i = e.indexOf("=", n);
    i > s && s !== -1 && (i = -1);
    let l = e.slice(n + 1, i === -1 ? s === -1 ? void 0 : s : i);
    if (a && (l = $e(l)), n = s, l === "") continue;
    let c;
    i === -1 ? c = "" : (c = e.slice(i + 1, s === -1 ? void 0 : s), a && (c = $e(c))), r ? (o[l] && Array.isArray(o[l]) || (o[l] = []), o[l].push(c)) : o[l] ?? (o[l] = c);
  }
  return t ? o[t] : o;
}, "st");
var Bt = st;
var _t = /* @__PURE__ */ __name2((e, t) => st(e, t, true), "_t");
var it = decodeURIComponent;
var We = /* @__PURE__ */ __name2((e) => Ke(e, it), "We");
var de;
var L;
var H;
var dt;
var ct;
var He;
var V;
var Xe;
var lt = (Xe = class {
  static {
    __name(this, "Xe");
  }
  static {
    __name2(this, "Xe");
  }
  constructor(e, t = "/", r = [[]]) {
    g(this, H);
    h(this, "raw");
    g(this, de);
    g(this, L);
    h(this, "routeIndex", 0);
    h(this, "path");
    h(this, "bodyCache", {});
    g(this, V, (e2) => {
      const { bodyCache: t2, raw: r2 } = this, a = t2[e2];
      if (a) return a;
      const o = Object.keys(t2)[0];
      return o ? t2[o].then((n) => (o === "json" && (n = JSON.stringify(n)), new Response(n)[e2]())) : t2[e2] = r2[e2]();
    });
    this.raw = e, this.path = t, m(this, L, r), m(this, de, {});
  }
  param(e) {
    return e ? b(this, H, dt).call(this, e) : b(this, H, ct).call(this);
  }
  query(e) {
    return Bt(this.url, e);
  }
  queries(e) {
    return _t(this.url, e);
  }
  header(e) {
    if (e) return this.raw.headers.get(e) ?? void 0;
    const t = {};
    return this.raw.headers.forEach((r, a) => {
      t[a] = r;
    }), t;
  }
  async parseBody(e) {
    return Tt(this, e);
  }
  json() {
    return d(this, V).call(this, "text").then((e) => JSON.parse(e));
  }
  text() {
    return d(this, V).call(this, "text");
  }
  arrayBuffer() {
    return d(this, V).call(this, "arrayBuffer");
  }
  blob() {
    return d(this, V).call(this, "blob");
  }
  formData() {
    return d(this, V).call(this, "formData");
  }
  addValidatedData(e, t) {
    d(this, de)[e] = t;
  }
  valid(e) {
    return d(this, de)[e];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [Ot]() {
    return d(this, L);
  }
  get matchedRoutes() {
    return d(this, L)[0].map(([[, e]]) => e);
  }
  get routePath() {
    return d(this, L)[0].map(([[, e]]) => e)[this.routeIndex].path;
  }
}, de = /* @__PURE__ */ new WeakMap(), L = /* @__PURE__ */ new WeakMap(), H = /* @__PURE__ */ new WeakSet(), dt = /* @__PURE__ */ __name2(function(e) {
  const t = d(this, L)[0][this.routeIndex][1][e], r = b(this, H, He).call(this, t);
  return r && /\%/.test(r) ? We(r) : r;
}, "dt"), ct = /* @__PURE__ */ __name2(function() {
  const e = {}, t = Object.keys(d(this, L)[0][this.routeIndex][1]);
  for (const r of t) {
    const a = b(this, H, He).call(this, d(this, L)[0][this.routeIndex][1][r]);
    a !== void 0 && (e[r] = /\%/.test(a) ? We(a) : a);
  }
  return e;
}, "ct"), He = /* @__PURE__ */ __name2(function(e) {
  return d(this, L)[1] ? d(this, L)[1][e] : e;
}, "He"), V = /* @__PURE__ */ new WeakMap(), Xe);
var $t = { Stringify: 1 };
var pt = /* @__PURE__ */ __name2(async (e, t, r, a, o) => {
  typeof e == "object" && !(e instanceof String) && (e instanceof Promise || (e = e.toString()), e instanceof Promise && (e = await e));
  const n = e.callbacks;
  return n != null && n.length ? (o ? o[0] += e : o = [e], Promise.all(n.map((i) => i({ phase: t, buffer: o, context: a }))).then((i) => Promise.all(i.filter(Boolean).map((l) => pt(l, t, false, a, o))).then(() => o[0]))) : Promise.resolve(e);
}, "pt");
var qt = "text/plain; charset=UTF-8";
var qe = /* @__PURE__ */ __name2((e, t) => ({ "Content-Type": e, ...t }), "qe");
var xe = /* @__PURE__ */ __name2((e, t) => new Response(e, t), "xe");
var ke;
var Ie;
var B;
var ce;
var _;
var j;
var Oe;
var pe;
var ue;
var X;
var Te;
var je;
var D;
var ie;
var Qe;
var Ht = (Qe = class {
  static {
    __name(this, "Qe");
  }
  static {
    __name2(this, "Qe");
  }
  constructor(e, t) {
    g(this, D);
    g(this, ke);
    g(this, Ie);
    h(this, "env", {});
    g(this, B);
    h(this, "finalized", false);
    h(this, "error");
    g(this, ce);
    g(this, _);
    g(this, j);
    g(this, Oe);
    g(this, pe);
    g(this, ue);
    g(this, X);
    g(this, Te);
    g(this, je);
    h(this, "render", (...e2) => (d(this, pe) ?? m(this, pe, (t2) => this.html(t2)), d(this, pe).call(this, ...e2)));
    h(this, "setLayout", (e2) => m(this, Oe, e2));
    h(this, "getLayout", () => d(this, Oe));
    h(this, "setRenderer", (e2) => {
      m(this, pe, e2);
    });
    h(this, "header", (e2, t2, r) => {
      this.finalized && m(this, j, xe(d(this, j).body, d(this, j)));
      const a = d(this, j) ? d(this, j).headers : d(this, X) ?? m(this, X, new Headers());
      t2 === void 0 ? a.delete(e2) : r != null && r.append ? a.append(e2, t2) : a.set(e2, t2);
    });
    h(this, "status", (e2) => {
      m(this, ce, e2);
    });
    h(this, "set", (e2, t2) => {
      d(this, B) ?? m(this, B, /* @__PURE__ */ new Map()), d(this, B).set(e2, t2);
    });
    h(this, "get", (e2) => d(this, B) ? d(this, B).get(e2) : void 0);
    h(this, "newResponse", (...e2) => b(this, D, ie).call(this, ...e2));
    h(this, "body", (e2, t2, r) => b(this, D, ie).call(this, e2, t2, r));
    h(this, "text", (e2, t2, r) => !d(this, X) && !d(this, ce) && !t2 && !r && !this.finalized ? new Response(e2) : b(this, D, ie).call(this, e2, t2, qe(qt, r)));
    h(this, "json", (e2, t2, r) => b(this, D, ie).call(this, JSON.stringify(e2), t2, qe("application/json", r)));
    h(this, "html", (e2, t2, r) => {
      const a = /* @__PURE__ */ __name2((o) => b(this, D, ie).call(this, o, t2, qe("text/html; charset=UTF-8", r)), "a");
      return typeof e2 == "object" ? pt(e2, $t.Stringify, false, {}).then(a) : a(e2);
    });
    h(this, "redirect", (e2, t2) => {
      const r = String(e2);
      return this.header("Location", /[^\x00-\xFF]/.test(r) ? encodeURI(r) : r), this.newResponse(null, t2 ?? 302);
    });
    h(this, "notFound", () => (d(this, ue) ?? m(this, ue, () => xe()), d(this, ue).call(this, this)));
    m(this, ke, e), t && (m(this, _, t.executionCtx), this.env = t.env, m(this, ue, t.notFoundHandler), m(this, je, t.path), m(this, Te, t.matchResult));
  }
  get req() {
    return d(this, Ie) ?? m(this, Ie, new lt(d(this, ke), d(this, je), d(this, Te))), d(this, Ie);
  }
  get event() {
    if (d(this, _) && "respondWith" in d(this, _)) return d(this, _);
    throw Error("This context has no FetchEvent");
  }
  get executionCtx() {
    if (d(this, _)) return d(this, _);
    throw Error("This context has no ExecutionContext");
  }
  get res() {
    return d(this, j) || m(this, j, xe(null, { headers: d(this, X) ?? m(this, X, new Headers()) }));
  }
  set res(e) {
    if (d(this, j) && e) {
      e = xe(e.body, e);
      for (const [t, r] of d(this, j).headers.entries()) if (t !== "content-type") if (t === "set-cookie") {
        const a = d(this, j).headers.getSetCookie();
        e.headers.delete("set-cookie");
        for (const o of a) e.headers.append("set-cookie", o);
      } else e.headers.set(t, r);
    }
    m(this, j, e), this.finalized = true;
  }
  get var() {
    return d(this, B) ? Object.fromEntries(d(this, B)) : {};
  }
}, ke = /* @__PURE__ */ new WeakMap(), Ie = /* @__PURE__ */ new WeakMap(), B = /* @__PURE__ */ new WeakMap(), ce = /* @__PURE__ */ new WeakMap(), _ = /* @__PURE__ */ new WeakMap(), j = /* @__PURE__ */ new WeakMap(), Oe = /* @__PURE__ */ new WeakMap(), pe = /* @__PURE__ */ new WeakMap(), ue = /* @__PURE__ */ new WeakMap(), X = /* @__PURE__ */ new WeakMap(), Te = /* @__PURE__ */ new WeakMap(), je = /* @__PURE__ */ new WeakMap(), D = /* @__PURE__ */ new WeakSet(), ie = /* @__PURE__ */ __name2(function(e, t, r) {
  const a = d(this, j) ? new Headers(d(this, j).headers) : d(this, X) ?? new Headers();
  if (typeof t == "object" && "headers" in t) {
    const n = t.headers instanceof Headers ? t.headers : new Headers(t.headers);
    for (const [s, i] of n) s.toLowerCase() === "set-cookie" ? a.append(s, i) : a.set(s, i);
  }
  if (r) for (const [n, s] of Object.entries(r)) if (typeof s == "string") a.set(n, s);
  else {
    a.delete(n);
    for (const i of s) a.append(n, i);
  }
  const o = typeof t == "number" ? t : (t == null ? void 0 : t.status) ?? d(this, ce);
  return xe(e, { status: o, headers: a });
}, "ie"), Qe);
var S = "ALL";
var Kt = "all";
var Vt = ["get", "post", "put", "delete", "options", "patch"];
var ut = "Can not add a route since the matcher is already built.";
var mt = class extends Error {
  static {
    __name(this, "mt");
  }
  static {
    __name2(this, "mt");
  }
};
var Dt = "__COMPOSED_HANDLER";
var Jt = /* @__PURE__ */ __name2((e) => e.text("404 Not Found", 404), "Jt");
var Ge = /* @__PURE__ */ __name2((e, t) => {
  if ("getResponse" in e) {
    const r = e.getResponse();
    return t.newResponse(r.body, r);
  }
  return console.error(e), t.text("Internal Server Error", 500);
}, "Ge");
var P;
var k;
var ft;
var A;
var G;
var Le;
var Ne;
var me;
var Ft = (me = class {
  static {
    __name(this, "me");
  }
  static {
    __name2(this, "me");
  }
  constructor(t = {}) {
    g(this, k);
    h(this, "get");
    h(this, "post");
    h(this, "put");
    h(this, "delete");
    h(this, "options");
    h(this, "patch");
    h(this, "all");
    h(this, "on");
    h(this, "use");
    h(this, "router");
    h(this, "getPath");
    h(this, "_basePath", "/");
    g(this, P, "/");
    h(this, "routes", []);
    g(this, A, Jt);
    h(this, "errorHandler", Ge);
    h(this, "onError", (t2) => (this.errorHandler = t2, this));
    h(this, "notFound", (t2) => (m(this, A, t2), this));
    h(this, "fetch", (t2, ...r) => b(this, k, Ne).call(this, t2, r[1], r[0], t2.method));
    h(this, "request", (t2, r, a2, o2) => t2 instanceof Request ? this.fetch(r ? new Request(t2, r) : t2, a2, o2) : (t2 = t2.toString(), this.fetch(new Request(/^https?:\/\//.test(t2) ? t2 : `http://localhost${se("/", t2)}`, r), a2, o2)));
    h(this, "fire", () => {
      addEventListener("fetch", (t2) => {
        t2.respondWith(b(this, k, Ne).call(this, t2.request, t2, void 0, t2.request.method));
      });
    });
    [...Vt, Kt].forEach((n) => {
      this[n] = (s, ...i) => (typeof s == "string" ? m(this, P, s) : b(this, k, G).call(this, n, d(this, P), s), i.forEach((l) => {
        b(this, k, G).call(this, n, d(this, P), l);
      }), this);
    }), this.on = (n, s, ...i) => {
      for (const l of [s].flat()) {
        m(this, P, l);
        for (const c of [n].flat()) i.map((p) => {
          b(this, k, G).call(this, c.toUpperCase(), d(this, P), p);
        });
      }
      return this;
    }, this.use = (n, ...s) => (typeof n == "string" ? m(this, P, n) : (m(this, P, "*"), s.unshift(n)), s.forEach((i) => {
      b(this, k, G).call(this, S, d(this, P), i);
    }), this);
    const { strict: a, ...o } = t;
    Object.assign(this, o), this.getPath = a ?? true ? t.getPath ?? ot : Mt;
  }
  route(t, r) {
    const a = this.basePath(t);
    return r.routes.map((o) => {
      var s;
      let n;
      r.errorHandler === Ge ? n = o.handler : (n = /* @__PURE__ */ __name2(async (i, l) => (await Ue([], r.errorHandler)(i, () => o.handler(i, l))).res, "n"), n[Dt] = o.handler), b(s = a, k, G).call(s, o.method, o.path, n);
    }), this;
  }
  basePath(t) {
    const r = b(this, k, ft).call(this);
    return r._basePath = se(this._basePath, t), r;
  }
  mount(t, r, a) {
    let o, n;
    a && (typeof a == "function" ? n = a : (n = a.optionHandler, a.replaceRequest === false ? o = /* @__PURE__ */ __name2((l) => l, "o") : o = a.replaceRequest));
    const s = n ? (l) => {
      const c = n(l);
      return Array.isArray(c) ? c : [c];
    } : (l) => {
      let c;
      try {
        c = l.executionCtx;
      } catch {
      }
      return [l.env, c];
    };
    o || (o = (() => {
      const l = se(this._basePath, t), c = l === "/" ? 0 : l.length;
      return (p) => {
        const u = new URL(p.url);
        return u.pathname = u.pathname.slice(c) || "/", new Request(u, p);
      };
    })());
    const i = /* @__PURE__ */ __name2(async (l, c) => {
      const p = await r(o(l.req.raw), ...s(l));
      if (p) return p;
      await c();
    }, "i");
    return b(this, k, G).call(this, S, se(t, "*"), i), this;
  }
}, P = /* @__PURE__ */ new WeakMap(), k = /* @__PURE__ */ new WeakSet(), ft = /* @__PURE__ */ __name2(function() {
  const t = new me({ router: this.router, getPath: this.getPath });
  return t.errorHandler = this.errorHandler, m(t, A, d(this, A)), t.routes = this.routes, t;
}, "ft"), A = /* @__PURE__ */ new WeakMap(), G = /* @__PURE__ */ __name2(function(t, r, a) {
  t = t.toUpperCase(), r = se(this._basePath, r);
  const o = { basePath: this._basePath, path: r, method: t, handler: a };
  this.router.add(t, r, [a, o]), this.routes.push(o);
}, "G"), Le = /* @__PURE__ */ __name2(function(t, r) {
  if (t instanceof Error) return this.errorHandler(t, r);
  throw t;
}, "Le"), Ne = /* @__PURE__ */ __name2(function(t, r, a, o) {
  if (o === "HEAD") return (async () => new Response(null, await b(this, k, Ne).call(this, t, r, a, "GET")))();
  const n = this.getPath(t, { env: a }), s = this.router.match(o, n), i = new Ht(t, { path: n, matchResult: s, env: a, executionCtx: r, notFoundHandler: d(this, A) });
  if (s[0].length === 1) {
    let c;
    try {
      c = s[0][0][0][0](i, async () => {
        i.res = await d(this, A).call(this, i);
      });
    } catch (p) {
      return b(this, k, Le).call(this, p, i);
    }
    return c instanceof Promise ? c.then((p) => p || (i.finalized ? i.res : d(this, A).call(this, i))).catch((p) => b(this, k, Le).call(this, p, i)) : c ?? d(this, A).call(this, i);
  }
  const l = Ue(s[0], this.errorHandler, d(this, A));
  return (async () => {
    try {
      const c = await l(i);
      if (!c.finalized) throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
      return c.res;
    } catch (c) {
      return b(this, k, Le).call(this, c, i);
    }
  })();
}, "Ne"), me);
var ht = [];
function Ut(e, t) {
  const r = this.buildAllMatchers(), a = /* @__PURE__ */ __name2(((o, n) => {
    const s = r[o] || r[S], i = s[2][n];
    if (i) return i;
    const l = n.match(s[0]);
    if (!l) return [[], ht];
    const c = l.indexOf("", 1);
    return [s[1][c], l];
  }), "a");
  return this.match = a, a(e, t);
}
__name(Ut, "Ut");
__name2(Ut, "Ut");
var Ae = "[^/]+";
var we = ".*";
var Se = "(?:|/.*)";
var le = /* @__PURE__ */ Symbol();
var Wt = new Set(".\\+*[^]$()");
function Gt(e, t) {
  return e.length === 1 ? t.length === 1 ? e < t ? -1 : 1 : -1 : t.length === 1 || e === we || e === Se ? 1 : t === we || t === Se ? -1 : e === Ae ? 1 : t === Ae ? -1 : e.length === t.length ? e < t ? -1 : 1 : t.length - e.length;
}
__name(Gt, "Gt");
__name2(Gt, "Gt");
var Q;
var Z;
var z;
var re;
var Yt = (re = class {
  static {
    __name(this, "re");
  }
  static {
    __name2(this, "re");
  }
  constructor() {
    g(this, Q);
    g(this, Z);
    g(this, z, /* @__PURE__ */ Object.create(null));
  }
  insert(t, r, a, o, n) {
    if (t.length === 0) {
      if (d(this, Q) !== void 0) throw le;
      if (n) return;
      m(this, Q, r);
      return;
    }
    const [s, ...i] = t, l = s === "*" ? i.length === 0 ? ["", "", we] : ["", "", Ae] : s === "/*" ? ["", "", Se] : s.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let c;
    if (l) {
      const p = l[1];
      let u = l[2] || Ae;
      if (p && l[2] && (u === ".*" || (u = u.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:"), /\((?!\?:)/.test(u)))) throw le;
      if (c = d(this, z)[u], !c) {
        if (Object.keys(d(this, z)).some((f) => f !== we && f !== Se)) throw le;
        if (n) return;
        c = d(this, z)[u] = new re(), p !== "" && m(c, Z, o.varIndex++);
      }
      !n && p !== "" && a.push([p, d(c, Z)]);
    } else if (c = d(this, z)[s], !c) {
      if (Object.keys(d(this, z)).some((p) => p.length > 1 && p !== we && p !== Se)) throw le;
      if (n) return;
      c = d(this, z)[s] = new re();
    }
    c.insert(i, r, a, o, n);
  }
  buildRegExpStr() {
    const r = Object.keys(d(this, z)).sort(Gt).map((a) => {
      const o = d(this, z)[a];
      return (typeof d(o, Z) == "number" ? `(${a})@${d(o, Z)}` : Wt.has(a) ? `\\${a}` : a) + o.buildRegExpStr();
    });
    return typeof d(this, Q) == "number" && r.unshift(`#${d(this, Q)}`), r.length === 0 ? "" : r.length === 1 ? r[0] : "(?:" + r.join("|") + ")";
  }
}, Q = /* @__PURE__ */ new WeakMap(), Z = /* @__PURE__ */ new WeakMap(), z = /* @__PURE__ */ new WeakMap(), re);
var ze;
var Ee;
var Ze;
var Xt = (Ze = class {
  static {
    __name(this, "Ze");
  }
  static {
    __name2(this, "Ze");
  }
  constructor() {
    g(this, ze, { varIndex: 0 });
    g(this, Ee, new Yt());
  }
  insert(e, t, r) {
    const a = [], o = [];
    for (let s = 0; ; ) {
      let i = false;
      if (e = e.replace(/\{[^}]+\}/g, (l) => {
        const c = `@\\${s}`;
        return o[s] = [c, l], s++, i = true, c;
      }), !i) break;
    }
    const n = e.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let s = o.length - 1; s >= 0; s--) {
      const [i] = o[s];
      for (let l = n.length - 1; l >= 0; l--) if (n[l].indexOf(i) !== -1) {
        n[l] = n[l].replace(i, o[s][1]);
        break;
      }
    }
    return d(this, Ee).insert(n, t, a, d(this, ze), r), a;
  }
  buildRegExp() {
    let e = d(this, Ee).buildRegExpStr();
    if (e === "") return [/^$/, [], []];
    let t = 0;
    const r = [], a = [];
    return e = e.replace(/#(\d+)|@(\d+)|\.\*\$/g, (o, n, s) => n !== void 0 ? (r[++t] = Number(n), "$()") : (s !== void 0 && (a[Number(s)] = ++t), "")), [new RegExp(`^${e}`), r, a];
  }
}, ze = /* @__PURE__ */ new WeakMap(), Ee = /* @__PURE__ */ new WeakMap(), Ze);
var Qt = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var Pe = /* @__PURE__ */ Object.create(null);
function gt(e) {
  return Pe[e] ?? (Pe[e] = new RegExp(e === "*" ? "" : `^${e.replace(/\/\*$|([.\\+*[^\]$()])/g, (t, r) => r ? `\\${r}` : "(?:|/.*)")}$`));
}
__name(gt, "gt");
__name2(gt, "gt");
function Zt() {
  Pe = /* @__PURE__ */ Object.create(null);
}
__name(Zt, "Zt");
__name2(Zt, "Zt");
function er(e) {
  var c;
  const t = new Xt(), r = [];
  if (e.length === 0) return Qt;
  const a = e.map((p) => [!/\*|\/:/.test(p[0]), ...p]).sort(([p, u], [f, x]) => p ? 1 : f ? -1 : u.length - x.length), o = /* @__PURE__ */ Object.create(null);
  for (let p = 0, u = -1, f = a.length; p < f; p++) {
    const [x, I, N] = a[p];
    x ? o[I] = [N.map(([R]) => [R, /* @__PURE__ */ Object.create(null)]), ht] : u++;
    let E;
    try {
      E = t.insert(I, u, x);
    } catch (R) {
      throw R === le ? new mt(I) : R;
    }
    x || (r[u] = N.map(([R, w]) => {
      const C = /* @__PURE__ */ Object.create(null);
      for (w -= 1; w >= 0; w--) {
        const [ge, Me] = E[w];
        C[ge] = Me;
      }
      return [R, C];
    }));
  }
  const [n, s, i] = t.buildRegExp();
  for (let p = 0, u = r.length; p < u; p++) for (let f = 0, x = r[p].length; f < x; f++) {
    const I = (c = r[p][f]) == null ? void 0 : c[1];
    if (!I) continue;
    const N = Object.keys(I);
    for (let E = 0, R = N.length; E < R; E++) I[N[E]] = i[I[N[E]]];
  }
  const l = [];
  for (const p in s) l[p] = r[s[p]];
  return [n, l, o];
}
__name(er, "er");
__name2(er, "er");
function ne(e, t) {
  if (e) {
    for (const r of Object.keys(e).sort((a, o) => o.length - a.length)) if (gt(r).test(t)) return [...e[r]];
  }
}
__name(ne, "ne");
__name2(ne, "ne");
var J;
var F;
var Ce;
var bt;
var et;
var tr = (et = class {
  static {
    __name(this, "et");
  }
  static {
    __name2(this, "et");
  }
  constructor() {
    g(this, Ce);
    h(this, "name", "RegExpRouter");
    g(this, J);
    g(this, F);
    h(this, "match", Ut);
    m(this, J, { [S]: /* @__PURE__ */ Object.create(null) }), m(this, F, { [S]: /* @__PURE__ */ Object.create(null) });
  }
  add(e, t, r) {
    var i;
    const a = d(this, J), o = d(this, F);
    if (!a || !o) throw new Error(ut);
    a[e] || [a, o].forEach((l) => {
      l[e] = /* @__PURE__ */ Object.create(null), Object.keys(l[S]).forEach((c) => {
        l[e][c] = [...l[S][c]];
      });
    }), t === "/*" && (t = "*");
    const n = (t.match(/\/:/g) || []).length;
    if (/\*$/.test(t)) {
      const l = gt(t);
      e === S ? Object.keys(a).forEach((c) => {
        var p;
        (p = a[c])[t] || (p[t] = ne(a[c], t) || ne(a[S], t) || []);
      }) : (i = a[e])[t] || (i[t] = ne(a[e], t) || ne(a[S], t) || []), Object.keys(a).forEach((c) => {
        (e === S || e === c) && Object.keys(a[c]).forEach((p) => {
          l.test(p) && a[c][p].push([r, n]);
        });
      }), Object.keys(o).forEach((c) => {
        (e === S || e === c) && Object.keys(o[c]).forEach((p) => l.test(p) && o[c][p].push([r, n]));
      });
      return;
    }
    const s = nt(t) || [t];
    for (let l = 0, c = s.length; l < c; l++) {
      const p = s[l];
      Object.keys(o).forEach((u) => {
        var f;
        (e === S || e === u) && ((f = o[u])[p] || (f[p] = [...ne(a[u], p) || ne(a[S], p) || []]), o[u][p].push([r, n - c + l + 1]));
      });
    }
  }
  buildAllMatchers() {
    const e = /* @__PURE__ */ Object.create(null);
    return Object.keys(d(this, F)).concat(Object.keys(d(this, J))).forEach((t) => {
      e[t] || (e[t] = b(this, Ce, bt).call(this, t));
    }), m(this, J, m(this, F, void 0)), Zt(), e;
  }
}, J = /* @__PURE__ */ new WeakMap(), F = /* @__PURE__ */ new WeakMap(), Ce = /* @__PURE__ */ new WeakSet(), bt = /* @__PURE__ */ __name2(function(e) {
  const t = [];
  let r = e === S;
  return [d(this, J), d(this, F)].forEach((a) => {
    const o = a[e] ? Object.keys(a[e]).map((n) => [n, a[e][n]]) : [];
    o.length !== 0 ? (r || (r = true), t.push(...o)) : e !== S && t.push(...Object.keys(a[S]).map((n) => [n, a[S][n]]));
  }), r ? er(t) : null;
}, "bt"), et);
var U;
var $;
var tt;
var rr = (tt = class {
  static {
    __name(this, "tt");
  }
  static {
    __name2(this, "tt");
  }
  constructor(e) {
    h(this, "name", "SmartRouter");
    g(this, U, []);
    g(this, $, []);
    m(this, U, e.routers);
  }
  add(e, t, r) {
    if (!d(this, $)) throw new Error(ut);
    d(this, $).push([e, t, r]);
  }
  match(e, t) {
    if (!d(this, $)) throw new Error("Fatal error");
    const r = d(this, U), a = d(this, $), o = r.length;
    let n = 0, s;
    for (; n < o; n++) {
      const i = r[n];
      try {
        for (let l = 0, c = a.length; l < c; l++) i.add(...a[l]);
        s = i.match(e, t);
      } catch (l) {
        if (l instanceof mt) continue;
        throw l;
      }
      this.match = i.match.bind(i), m(this, U, [i]), m(this, $, void 0);
      break;
    }
    if (n === o) throw new Error("Fatal error");
    return this.name = `SmartRouter + ${this.activeRouter.name}`, s;
  }
  get activeRouter() {
    if (d(this, $) || d(this, U).length !== 1) throw new Error("No active router has been determined yet.");
    return d(this, U)[0];
  }
}, U = /* @__PURE__ */ new WeakMap(), $ = /* @__PURE__ */ new WeakMap(), tt);
var ye = /* @__PURE__ */ Object.create(null);
var ar = /* @__PURE__ */ __name2((e) => {
  for (const t in e) return true;
  return false;
}, "ar");
var W;
var T;
var ee;
var fe;
var O;
var q;
var Y;
var he;
var or = (he = class {
  static {
    __name(this, "he");
  }
  static {
    __name2(this, "he");
  }
  constructor(t, r, a) {
    g(this, q);
    g(this, W);
    g(this, T);
    g(this, ee);
    g(this, fe, 0);
    g(this, O, ye);
    if (m(this, T, a || /* @__PURE__ */ Object.create(null)), m(this, W, []), t && r) {
      const o = /* @__PURE__ */ Object.create(null);
      o[t] = { handler: r, possibleKeys: [], score: 0 }, m(this, W, [o]);
    }
    m(this, ee, []);
  }
  insert(t, r, a) {
    m(this, fe, ++Fe(this, fe)._);
    let o = this;
    const n = Nt(r), s = [];
    for (let i = 0, l = n.length; i < l; i++) {
      const c = n[i], p = n[i + 1], u = zt(c, p), f = Array.isArray(u) ? u[0] : c;
      if (f in d(o, T)) {
        o = d(o, T)[f], u && s.push(u[1]);
        continue;
      }
      d(o, T)[f] = new he(), u && (d(o, ee).push(u), s.push(u[1])), o = d(o, T)[f];
    }
    return d(o, W).push({ [t]: { handler: a, possibleKeys: s.filter((i, l, c) => c.indexOf(i) === l), score: d(this, fe) } }), o;
  }
  search(t, r) {
    var p;
    const a = [];
    m(this, O, ye);
    let n = [this];
    const s = at(r), i = [], l = s.length;
    let c = null;
    for (let u = 0; u < l; u++) {
      const f = s[u], x = u === l - 1, I = [];
      for (let E = 0, R = n.length; E < R; E++) {
        const w = n[E], C = d(w, T)[f];
        C && (m(C, O, d(w, O)), x ? (d(C, T)["*"] && b(this, q, Y).call(this, a, d(C, T)["*"], t, d(w, O)), b(this, q, Y).call(this, a, C, t, d(w, O))) : I.push(C));
        for (let ge = 0, Me = d(w, ee).length; ge < Me; ge++) {
          const Ve = d(w, ee)[ge], K = d(w, O) === ye ? {} : { ...d(w, O) };
          if (Ve === "*") {
            const ae = d(w, T)["*"];
            ae && (b(this, q, Y).call(this, a, ae, t, d(w, O)), m(ae, O, K), I.push(ae));
            continue;
          }
          const [St, De, be] = Ve;
          if (!f && !(be instanceof RegExp)) continue;
          const M = d(w, T)[St];
          if (be instanceof RegExp) {
            if (c === null) {
              c = new Array(l);
              let oe = r[0] === "/" ? 1 : 0;
              for (let ve = 0; ve < l; ve++) c[ve] = oe, oe += s[ve].length + 1;
            }
            const ae = r.substring(c[u]), Be = be.exec(ae);
            if (Be) {
              if (K[De] = Be[0], b(this, q, Y).call(this, a, M, t, d(w, O), K), ar(d(M, T))) {
                m(M, O, K);
                const oe = ((p = Be[0].match(/\//)) == null ? void 0 : p.length) ?? 0;
                (i[oe] || (i[oe] = [])).push(M);
              }
              continue;
            }
          }
          (be === true || be.test(f)) && (K[De] = f, x ? (b(this, q, Y).call(this, a, M, t, K, d(w, O)), d(M, T)["*"] && b(this, q, Y).call(this, a, d(M, T)["*"], t, K, d(w, O))) : (m(M, O, K), I.push(M)));
        }
      }
      const N = i.shift();
      n = N ? I.concat(N) : I;
    }
    return a.length > 1 && a.sort((u, f) => u.score - f.score), [a.map(({ handler: u, params: f }) => [u, f])];
  }
}, W = /* @__PURE__ */ new WeakMap(), T = /* @__PURE__ */ new WeakMap(), ee = /* @__PURE__ */ new WeakMap(), fe = /* @__PURE__ */ new WeakMap(), O = /* @__PURE__ */ new WeakMap(), q = /* @__PURE__ */ new WeakSet(), Y = /* @__PURE__ */ __name2(function(t, r, a, o, n) {
  for (let s = 0, i = d(r, W).length; s < i; s++) {
    const l = d(r, W)[s], c = l[a] || l[S], p = {};
    if (c !== void 0 && (c.params = /* @__PURE__ */ Object.create(null), t.push(c), o !== ye || n && n !== ye)) for (let u = 0, f = c.possibleKeys.length; u < f; u++) {
      const x = c.possibleKeys[u], I = p[c.score];
      c.params[x] = n != null && n[x] && !I ? n[x] : o[x] ?? (n == null ? void 0 : n[x]), p[c.score] = true;
    }
  }
}, "Y"), he);
var te;
var rt;
var nr = (rt = class {
  static {
    __name(this, "rt");
  }
  static {
    __name2(this, "rt");
  }
  constructor() {
    h(this, "name", "TrieRouter");
    g(this, te);
    m(this, te, new or());
  }
  add(e, t, r) {
    const a = nt(t);
    if (a) {
      for (let o = 0, n = a.length; o < n; o++) d(this, te).insert(e, a[o], r);
      return;
    }
    d(this, te).insert(e, t, r);
  }
  match(e, t) {
    return d(this, te).search(e, t);
  }
}, te = /* @__PURE__ */ new WeakMap(), rt);
var vt = class extends Ft {
  static {
    __name(this, "vt");
  }
  static {
    __name2(this, "vt");
  }
  constructor(e = {}) {
    super(e), this.router = e.router ?? new rr({ routers: [new tr(), new nr()] });
  }
};
var sr = /* @__PURE__ */ __name2((e) => {
  const r = { ...{ origin: "*", allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"], allowHeaders: [], exposeHeaders: [] }, ...e }, a = ((n) => typeof n == "string" ? n === "*" ? r.credentials ? (s) => s || null : () => n : (s) => n === s ? s : null : typeof n == "function" ? n : (s) => n.includes(s) ? s : null)(r.origin), o = ((n) => typeof n == "function" ? n : Array.isArray(n) ? () => n : () => [])(r.allowMethods);
  return async function(s, i) {
    var p;
    function l(u, f) {
      s.res.headers.set(u, f);
    }
    __name(l, "l");
    __name2(l, "l");
    const c = await a(s.req.header("origin") || "", s);
    if (c && l("Access-Control-Allow-Origin", c), r.credentials && l("Access-Control-Allow-Credentials", "true"), (p = r.exposeHeaders) != null && p.length && l("Access-Control-Expose-Headers", r.exposeHeaders.join(",")), s.req.method === "OPTIONS") {
      (r.origin !== "*" || r.credentials) && l("Vary", "Origin"), r.maxAge != null && l("Access-Control-Max-Age", r.maxAge.toString());
      const u = await o(s.req.header("origin") || "", s);
      u.length && l("Access-Control-Allow-Methods", u.join(","));
      let f = r.allowHeaders;
      if (!(f != null && f.length)) {
        const x = s.req.header("Access-Control-Request-Headers");
        x && (f = x.split(/\s*,\s*/));
      }
      return f != null && f.length && (l("Access-Control-Allow-Headers", f.join(",")), s.res.headers.append("Vary", "Access-Control-Request-Headers")), s.res.headers.delete("Content-Length"), s.res.headers.delete("Content-Type"), new Response(null, { headers: s.res.headers, status: 204, statusText: "No Content" });
    }
    await i(), (r.origin !== "*" || r.credentials) && s.header("Vary", "Origin", { append: true });
  };
}, "sr");
var v = new vt();
v.use("/api/*", sr());
function xt(e) {
  let t = 5381;
  for (let r = 0; r < e.length; r++) t = (t << 5) + t ^ e.charCodeAt(r);
  return (t >>> 0).toString(36);
}
__name(xt, "xt");
__name2(xt, "xt");
async function y(e) {
  const r = (e.req.header("Authorization") || "").replace("Bearer ", "");
  if (!r) return null;
  const a = await e.env.KV.get(`session:${r}`);
  if (!a) return null;
  const o = await e.env.KV.get(`user:${a}`);
  return o ? JSON.parse(o) : null;
}
__name(y, "y");
__name2(y, "y");
v.post("/api/auth/register", async (e) => {
  const { userId: t, password: r, displayName: a, avatar: o } = await e.req.json();
  if (!t || !r || !a) return e.json({ error: "\uBAA8\uB4E0 \uD56D\uBAA9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694" }, 400);
  if (t.length < 3) return e.json({ error: "\uC544\uC774\uB514\uB294 3\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4" }, 400);
  if (r.length < 4) return e.json({ error: "\uBE44\uBC00\uBC88\uD638\uB294 4\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4" }, 400);
  if (!/^[a-z0-9_]+$/i.test(t)) return e.json({ error: "\uC544\uC774\uB514\uB294 \uC601\uBB38/\uC22B\uC790/\uBC11\uC904\uB9CC \uC0AC\uC6A9 \uAC00\uB2A5\uD569\uB2C8\uB2E4" }, 400);
  if (await e.env.KV.get(`user:${t.toLowerCase()}`)) return e.json({ error: "\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uC544\uC774\uB514\uC785\uB2C8\uB2E4" }, 409);
  const s = { userId: t.toLowerCase(), displayName: a, avatar: o || "\u{1F43B}", passwordHash: xt(r), createdAt: Date.now() };
  await e.env.KV.put(`user:${t.toLowerCase()}`, JSON.stringify(s));
  const i = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  return await e.env.KV.put(`session:${i}`, t.toLowerCase(), { expirationTtl: 86400 * 7 }), e.json({ success: true, token: i, userId: s.userId, displayName: a, avatar: s.avatar });
});
v.post("/api/auth/login", async (e) => {
  const { userId: t, password: r } = await e.req.json();
  if (!t || !r) return e.json({ error: "\uC544\uC774\uB514\uC640 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694" }, 400);
  const a = await e.env.KV.get(`user:${t.toLowerCase()}`);
  if (!a) return e.json({ error: "\uC874\uC7AC\uD558\uC9C0 \uC54A\uB294 \uC544\uC774\uB514\uC785\uB2C8\uB2E4" }, 404);
  const o = JSON.parse(a);
  if (o.passwordHash !== xt(r)) return e.json({ error: "\uBE44\uBC00\uBC88\uD638\uAC00 \uD2C0\uB838\uC2B5\uB2C8\uB2E4" }, 401);
  const n = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  return await e.env.KV.put(`session:${n}`, o.userId, { expirationTtl: 86400 * 7 }), e.json({ success: true, token: n, userId: o.userId, displayName: o.displayName, avatar: o.avatar });
});
v.get("/api/me", async (e) => {
  const t = await y(e);
  return t ? e.json({ userId: t.userId, displayName: t.displayName, avatar: t.avatar }) : e.json({ error: "Unauthorized" }, 401);
});
async function yt(e, t, r) {
  const [a, o] = await Promise.all([e.get(`friends:${t}`), e.get(`friends:${r}`)]), n = a ? JSON.parse(a) : [], s = o ? JSON.parse(o) : [];
  n.includes(r) || n.push(r), s.includes(t) || s.push(t), await Promise.all([e.put(`friends:${t}`, JSON.stringify(n)), e.put(`friends:${r}`, JSON.stringify(s))]);
}
__name(yt, "yt");
__name2(yt, "yt");
v.post("/api/friends/request", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const { targetUserId: r } = await e.req.json(), a = r == null ? void 0 : r.toLowerCase();
  if (!a || a === t.userId) return e.json({ error: "\uC798\uBABB\uB41C \uC694\uCCAD" }, 400);
  const [o, n, s, i] = await Promise.all([e.env.KV.get(`user:${a}`), e.env.KV.get(`friends:${t.userId}`), e.env.KV.get(`friend_req:${a}:${t.userId}`), e.env.KV.get(`friend_req:${t.userId}:${a}`)]);
  return o ? (n ? JSON.parse(n) : []).includes(a) ? e.json({ error: "\uC774\uBBF8 \uCE5C\uAD6C\uC785\uB2C8\uB2E4" }, 409) : s ? e.json({ error: "\uC774\uBBF8 \uCE5C\uAD6C \uC694\uCCAD\uC744 \uBCF4\uB0C8\uC2B5\uB2C8\uB2E4" }, 409) : i ? (await yt(e.env.KV, t.userId, a), await e.env.KV.delete(`friend_req:${t.userId}:${a}`), e.json({ success: true, auto_accepted: true })) : (await e.env.KV.put(`friend_req:${a}:${t.userId}`, JSON.stringify({ from: t.userId, fromName: t.displayName, fromAvatar: t.avatar, sentAt: Date.now() }), { expirationTtl: 86400 * 7 }), e.json({ success: true })) : e.json({ error: "\uC874\uC7AC\uD558\uC9C0 \uC54A\uB294 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4" }, 404);
});
v.post("/api/friends/accept", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const { fromUserId: r } = await e.req.json(), a = r == null ? void 0 : r.toLowerCase();
  return await Promise.all([yt(e.env.KV, t.userId, a), e.env.KV.delete(`friend_req:${t.userId}:${a}`)]), e.json({ success: true });
});
v.post("/api/friends/reject", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const { fromUserId: r } = await e.req.json();
  return await e.env.KV.delete(`friend_req:${t.userId}:${r == null ? void 0 : r.toLowerCase()}`), e.json({ success: true });
});
v.get("/api/friends/requests", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const r = await e.env.KV.list({ prefix: `friend_req:${t.userId}:` }), o = (await Promise.all(r.keys.map((n) => e.env.KV.get(n.name)))).filter(Boolean).map((n) => JSON.parse(n));
  return e.json({ requests: o });
});
v.get("/api/friends", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const [r, a, o] = await Promise.all([e.env.KV.get(`friends:${t.userId}`), e.env.KV.get(`loc_perm:${t.userId}`), e.env.KV.get(`view_perm:${t.userId}`)]), n = r ? JSON.parse(r) : [], s = a ? JSON.parse(a) : {}, i = o ? JSON.parse(o) : {};
  if (!n.length) return e.json({ friends: [] });
  const l = await Promise.all(n.map(async (c) => {
    const [p, u, f] = await Promise.all([e.env.KV.get(`user:${c}`), e.env.KV.get(`loc_perm:${c}`), i[c] !== false ? e.env.KV.get(`loc:${c}`) : Promise.resolve(null)]);
    if (!p) return null;
    const x = JSON.parse(p), N = (u ? JSON.parse(u) : {})[t.userId] !== false, E = i[c] !== false, R = N && E && f ? JSON.parse(f) : null;
    return { userId: x.userId, displayName: x.displayName, avatar: x.avatar, location: R, iShareWithFriend: s[c] !== false, iViewFriend: E };
  }));
  return e.json({ friends: l.filter(Boolean) });
});
v.post("/api/location", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const { lat: r, lng: a, accuracy: o } = await e.req.json();
  return !r || !a ? e.json({ error: "lat/lng required" }, 400) : (await e.env.KV.put(`loc:${t.userId}`, JSON.stringify({ lat: r, lng: a, accuracy: o || 20, updatedAt: Date.now() }), { expirationTtl: 3600 }), e.json({ success: true }));
});
v.post("/api/location/permission", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const { friendId: r, allow: a } = await e.req.json(), o = await e.env.KV.get(`loc_perm:${t.userId}`), n = o ? JSON.parse(o) : {};
  return n[r.toLowerCase()] = !!a, await e.env.KV.put(`loc_perm:${t.userId}`, JSON.stringify(n)), e.json({ success: true });
});
v.post("/api/location/view", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const { friendId: r, show: a } = await e.req.json(), o = await e.env.KV.get(`view_perm:${t.userId}`), n = o ? JSON.parse(o) : {};
  return n[r.toLowerCase()] = !!a, await e.env.KV.put(`view_perm:${t.userId}`, JSON.stringify(n)), e.json({ success: true });
});
v.get("/api/rooms", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const r = await e.env.KV.get(`rooms:${t.userId}`), a = r ? JSON.parse(r) : [];
  if (!a.length) return e.json({ rooms: [] });
  const n = (await Promise.all(a.map((s) => e.env.KV.get(`room:${s}`)))).filter(Boolean).map((s) => JSON.parse(s));
  return e.json({ rooms: n });
});
v.post("/api/rooms", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const { name: r, memberIds: a } = await e.req.json();
  if (!r || !Array.isArray(a)) return e.json({ error: "name and memberIds required" }, 400);
  const o = [.../* @__PURE__ */ new Set([t.userId, ...a.map((i) => i.toLowerCase())])], n = `grp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, s = { roomId: n, name: r, type: "group", members: o, createdBy: t.userId, createdAt: Date.now(), locShare: false };
  return await e.env.KV.put(`room:${n}`, JSON.stringify(s), { expirationTtl: 86400 * 30 }), await Promise.all(o.map(async (i) => {
    const l = await e.env.KV.get(`rooms:${i}`), c = l ? JSON.parse(l) : [];
    c.includes(n) || c.push(n), await e.env.KV.put(`rooms:${i}`, JSON.stringify(c));
  })), e.json({ success: true, room: s });
});
v.post("/api/rooms/dm", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const { targetUserId: r } = await e.req.json(), a = r == null ? void 0 : r.toLowerCase();
  if (!a) return e.json({ error: "targetUserId required" }, 400);
  const o = `dm_${[t.userId, a].sort().join("_")}`, n = await e.env.KV.get(`room:${o}`);
  if (n) return e.json({ success: true, room: JSON.parse(n) });
  const s = await e.env.KV.get(`user:${a}`);
  if (!s) return e.json({ error: "\uC874\uC7AC\uD558\uC9C0 \uC54A\uB294 \uC0AC\uC6A9\uC790\uC785\uB2C8\uB2E4" }, 404);
  const i = JSON.parse(s), l = { roomId: o, name: i.displayName, type: "dm", members: [t.userId, a], createdBy: t.userId, createdAt: Date.now(), locShare: false };
  return await e.env.KV.put(`room:${o}`, JSON.stringify(l), { expirationTtl: 86400 * 30 }), await Promise.all([t.userId, a].map(async (c) => {
    const p = await e.env.KV.get(`rooms:${c}`), u = p ? JSON.parse(p) : [];
    u.includes(o) || u.push(o), await e.env.KV.put(`rooms:${c}`, JSON.stringify(u));
  })), e.json({ success: true, room: l });
});
v.post("/api/rooms/:roomId/locshare", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const r = e.req.param("roomId"), { enabled: a } = await e.req.json(), o = await e.env.KV.get(`room:${r}`);
  if (!o) return e.json({ error: "Room not found" }, 404);
  const n = JSON.parse(o);
  return n.members.includes(t.userId) ? (n.locShare = !!a, await e.env.KV.put(`room:${r}`, JSON.stringify(n), { expirationTtl: 86400 * 30 }), e.json({ success: true, locShare: n.locShare })) : e.json({ error: "Not a member" }, 403);
});
v.get("/api/rooms/:roomId/locations", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const r = e.req.param("roomId"), a = await e.env.KV.get(`room:${r}`);
  if (!a) return e.json({ locations: [], locShare: false });
  const o = JSON.parse(a);
  if (!o.members.includes(t.userId)) return e.json({ error: "Not a member" }, 403);
  if (!o.locShare) return e.json({ locations: [], locShare: false });
  const n = await Promise.all(o.members.map(async (s) => {
    const [i, l] = await Promise.all([e.env.KV.get(`user:${s}`), e.env.KV.get(`loc:${s}`)]);
    if (!i || !l) return null;
    const c = JSON.parse(i), p = JSON.parse(l);
    return { userId: s, displayName: c.displayName, avatar: c.avatar, ...p };
  }));
  return e.json({ locations: n.filter(Boolean), locShare: true });
});
v.post("/api/rooms/:roomId/leave", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const r = e.req.param("roomId"), a = await e.env.KV.get(`rooms:${t.userId}`), o = a ? JSON.parse(a) : [];
  return await e.env.KV.put(`rooms:${t.userId}`, JSON.stringify(o.filter((n) => n !== r))), e.json({ success: true });
});
v.post("/api/chat", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const { roomId: r, message: a, type: o } = await e.req.json();
  if (!r || !a) return e.json({ error: "missing" }, 400);
  const n = await e.env.KV.get(`room:${r}`);
  if (!n) return e.json({ error: "Room not found" }, 404);
  if (!JSON.parse(n).members.includes(t.userId)) return e.json({ error: "Not a member" }, 403);
  const i = Date.now(), l = `${i}_${Math.random().toString(36).substr(2, 6)}`;
  return await e.env.KV.put(`chat:${r}:${l}`, JSON.stringify({ msgId: l, userId: t.userId, userName: t.displayName, avatar: t.avatar, message: a, type: o || "text", timestamp: i }), { expirationTtl: 86400 * 2 }), e.json({ success: true, msgId: l, timestamp: i });
});
v.get("/api/chat/:roomId", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const r = e.req.param("roomId"), a = await e.env.KV.get(`room:${r}`);
  if (!a) return e.json({ messages: [] });
  if (!JSON.parse(a).members.includes(t.userId)) return e.json({ error: "Not a member" }, 403);
  const n = Number(e.req.query("since") || "0"), i = (await e.env.KV.list({ prefix: `chat:${r}:` })).keys.filter((p) => {
    var f;
    return Number(((f = p.name.split(":")[2]) == null ? void 0 : f.split("_")[0]) || "0") > n;
  });
  if (!i.length) return e.json({ messages: [] });
  const c = (await Promise.all(i.map((p) => e.env.KV.get(p.name)))).filter(Boolean).map((p) => JSON.parse(p)).filter((p) => p.timestamp > n);
  return c.sort((p, u) => p.timestamp - u.timestamp), e.json({ messages: c.slice(-60) });
});
v.post("/api/sos", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const { lat: r, lng: a } = await e.req.json(), o = await e.env.KV.get(`friends:${t.userId}`), n = o ? JSON.parse(o) : [], s = Date.now(), i = `sos_${t.userId}_${s}`;
  return await e.env.KV.put(`sos:${i}`, JSON.stringify({ msgId: `${s}_sos`, userId: t.userId, userName: t.displayName, avatar: t.avatar, message: `\u{1F198} SOS! ${t.displayName}\uB2D8\uC774 \uAE34\uAE09 \uB3C4\uC6C0\uC744 \uC694\uCCAD\uD569\uB2C8\uB2E4!`, lat: r, lng: a, sosId: i, targets: [t.userId, ...n], timestamp: s, active: true, acknowledgedBy: [] }), { expirationTtl: 3600 }), e.json({ success: true, sosId: i });
});
v.post("/api/sos/acknowledge", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const { sosId: r } = await e.req.json();
  if (!r) return e.json({ error: "sosId required" }, 400);
  const a = await e.env.KV.get(`sos:${r}`);
  if (!a) return e.json({ error: "SOS not found" }, 404);
  const o = JSON.parse(a);
  return o.acknowledgedBy.includes(t.userId) || o.acknowledgedBy.push(t.userId), await e.env.KV.put(`sos:${r}`, JSON.stringify(o), { expirationTtl: 3600 }), e.json({ success: true, acknowledgedBy: o.acknowledgedBy });
});
v.post("/api/sos/dismiss", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const { sosId: r } = await e.req.json();
  if (!r) return e.json({ error: "sosId required" }, 400);
  const a = await e.env.KV.get(`sos:${r}`);
  if (!a) return e.json({ error: "SOS not found" }, 404);
  const o = JSON.parse(a);
  return o.userId !== t.userId ? e.json({ error: "Only sender can dismiss" }, 403) : (o.active = false, await e.env.KV.put(`sos:${r}`, JSON.stringify(o), { expirationTtl: 300 }), e.json({ success: true }));
});
v.get("/api/sos/check", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const r = Number(e.req.query("since") || "0"), o = (await e.env.KV.list({ prefix: "sos:sos_" })).keys.filter((i) => {
    const l = i.name.split("_");
    return Number(l[l.length - 1] || "0") > r;
  });
  if (!o.length) return e.json({ sos: [] });
  const s = (await Promise.all(o.map((i) => e.env.KV.get(i.name)))).filter(Boolean).map((i) => JSON.parse(i)).filter((i) => i.timestamp > r && Array.isArray(i.targets) && i.targets.includes(t.userId));
  return e.json({ sos: s });
});
v.post("/api/appointment", async (e) => {
  const t = await y(e);
  if (!t) return e.json({ error: "Unauthorized" }, 401);
  const { roomId: r, placeName: a, lat: o, lng: n } = await e.req.json();
  return await e.env.KV.put(`apt:${r}`, JSON.stringify({ placeName: a, lat: o, lng: n, setBy: t.displayName, setAt: Date.now() }), { expirationTtl: 86400 }), e.json({ success: true });
});
v.get("/api/appointment/:roomId", async (e) => {
  if (!await y(e)) return e.json({ error: "Unauthorized" }, 401);
  const r = await e.env.KV.get(`apt:${e.req.param("roomId")}`);
  return e.json({ appointment: r ? JSON.parse(r) : null });
});
v.get("/api/transit", async (e) => {
  const { sx: t, sy: r, ex: a, ey: o } = e.req.query(), n = e.env.ODSAY_API_KEY;
  if (!n || n === "demo" || n.startsWith("\uC5EC\uAE30\uC5D0")) return e.json({ demo: true, result: { path: [{ pathType: 1, info: { totalTime: 38, payment: 1400, busTransitCount: 0, subwayTransitCount: 1 }, subPath: [{ trafficType: 1, sectionTime: 38, lane: [{ name: "2\uD638\uC120", subwayCode: 2 }], startName: "\uCD9C\uBC1C\uC5ED", endName: "\uB3C4\uCC29\uC5ED" }] }, { pathType: 3, info: { totalTime: 52, payment: 1400, busTransitCount: 2, subwayTransitCount: 0 }, subPath: [{ trafficType: 2, sectionTime: 25, lane: [{ busNo: "147" }], startName: "\uC815\uB958\uC7A5", endName: "\uD658\uC2B9" }, { trafficType: 2, sectionTime: 27, lane: [{ busNo: "3412" }], startName: "\uD658\uC2B9", endName: "\uBAA9\uC801\uC9C0" }] }] } });
  try {
    const s = `https://api.odsay.com/v1/api/searchPubTransPathT?SX=${t}&SY=${r}&EX=${a}&EY=${o}&apiKey=${n}`, i = await fetch(s);
    return e.json(await i.json());
  } catch {
    return e.json({ error: "API error" }, 500);
  }
});
v.get("*", (e) => {
  const t = e.env.KAKAO_MAP_KEY || "";
  return e.html(ir(t));
});
function ir(e) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<title>\uBAA8\uC5EC\uBD10</title>
<link rel="manifest" href="/manifest.json"/>
<meta name="theme-color" content="#7c3aed"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
<style>
:root{
  --bg:#0a0a0f;--bg2:#12121a;--bg3:#1a1a26;
  --surface:#1e1e2e;--surface2:#252538;
  --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);
  --accent:#7c3aed;--accent2:#a855f7;--accent3:#c084fc;
  --pink:#ec4899;--green:#10b981;--red:#ef4444;--blue:#3b82f6;--yellow:#f59e0b;
  --text:#f1f1f5;--text2:#a0a0b8;--text3:#5a5a78;
  --radius:16px;--radius-sm:10px;--radius-xs:8px;
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased}
html,body{height:100%;overflow:hidden;background:var(--bg)}
body{font-family:'Pretendard',sans-serif;color:var(--text)}
input,textarea,button{font-family:inherit}
input{font-size:16px!important}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--surface2);border-radius:4px}

/* \u2500\u2500 AUTH \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
#screen-auth{position:fixed;inset:0;z-index:100;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;overflow-y:auto;}
.auth-glow{position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%);pointer-events:none;}
.auth-logo{width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,var(--accent),var(--pink));display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px;box-shadow:0 8px 32px rgba(124,58,237,0.4);}
.auth-title{font-size:28px;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px}
.auth-sub{font-size:14px;color:var(--text2);margin-bottom:32px}
.auth-card{width:100%;max-width:380px;background:var(--surface);border:1px solid var(--border2);border-radius:24px;padding:28px;box-shadow:0 24px 64px rgba(0,0,0,0.5);}
.auth-tabs{display:flex;background:var(--bg2);border-radius:var(--radius-sm);padding:4px;margin-bottom:24px;gap:4px}
.auth-tab{flex:1;padding:9px;border:none;background:transparent;color:var(--text2);font-size:14px;font-weight:600;border-radius:8px;cursor:pointer;transition:all .2s}
.auth-tab.active{background:var(--accent);color:white;box-shadow:0 4px 12px rgba(124,58,237,0.4)}
.field{margin-bottom:14px}
.field label{display:block;font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px;letter-spacing:0.3px}
.field input{width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--radius-xs);padding:12px 14px;color:var(--text);font-size:15px;outline:none;transition:border-color .2s;}
.field input:focus{border-color:var(--accent)}
.field input::placeholder{color:var(--text3)}
.avatar-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:8px}
.avatar-btn{aspect-ratio:1;background:var(--bg2);border:2px solid transparent;border-radius:10px;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;}
.avatar-btn.selected{border-color:var(--accent);background:rgba(124,58,237,0.15)}
.btn-primary{width:100%;padding:14px;border:none;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 8px 24px rgba(124,58,237,0.35);margin-top:8px;}
.btn-primary:active{transform:scale(0.98)}
.auth-error{background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-xs);padding:10px 14px;font-size:13px;color:#fca5a5;margin-bottom:12px;display:none;}

/* \u2500\u2500 MAIN APP \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
#screen-main{position:fixed;inset:0;display:none;flex-direction:column;background:var(--bg);}
#screen-main.visible{display:flex}
.topbar{flex-shrink:0;padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between;background:var(--bg);border-bottom:1px solid var(--border);z-index:10;}
.topbar-logo{display:flex;align-items:center;gap:8px}
.topbar-logo-icon{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--pink));display:flex;align-items:center;justify-content:center;font-size:14px;}
.topbar-logo-text{font-size:18px;font-weight:800;letter-spacing:-0.5px}
.topbar-actions{display:flex;align-items:center;gap:8px}
.icon-btn{width:36px;height:36px;border-radius:10px;border:none;background:var(--surface);color:var(--text2);display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;transition:all .15s;position:relative;}
.icon-btn:active{background:var(--surface2)}
.icon-btn .badge{position:absolute;top:-3px;right:-3px;min-width:16px;height:16px;border-radius:8px;padding:0 3px;background:var(--red);font-size:9px;font-weight:700;color:white;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg);}
.tab-content{flex:1;overflow:hidden;position:relative}
.tab-pane{position:absolute;inset:0;overflow:hidden;display:none;flex-direction:column}
.tab-pane.active{display:flex}
.tabbar{flex-shrink:0;display:grid;grid-template-columns:repeat(4,1fr);background:var(--bg);border-top:1px solid var(--border);padding-bottom:env(safe-area-inset-bottom,0);}
.tab-btn{padding:10px 0 8px;border:none;background:transparent;display:flex;flex-direction:column;align-items:center;gap:3px;color:var(--text3);cursor:pointer;transition:color .2s;position:relative;}
.tab-btn i{font-size:20px;transition:transform .2s}
.tab-btn span{font-size:10px;font-weight:600;letter-spacing:0.3px}
.tab-btn.active{color:var(--accent2)}
.tab-btn.active i{transform:scale(1.1)}
.tab-btn .tbadge{position:absolute;top:8px;right:calc(50% - 18px);background:var(--red);color:white;font-size:9px;font-weight:700;min-width:16px;height:16px;border-radius:8px;padding:0 3px;display:none;align-items:center;justify-content:center;border:2px solid var(--bg);}

/* \u2500\u2500 \uC9C0\uB3C4 \uD0ED \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
#tab-map{background:var(--bg2)}
#kakaoMap{width:100%;height:100%}
.map-no-key{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--bg) 0%,var(--bg3) 100%);padding:24px;text-align:center;}
.map-no-key .icon{font-size:56px;margin-bottom:16px}
.map-no-key h3{font-size:18px;font-weight:700;color:var(--accent3);margin-bottom:8px}
.map-no-key p{font-size:13px;color:var(--text2);line-height:1.6;max-width:280px}
.map-overlay{position:absolute;inset:0;pointer-events:none;z-index:5}
.map-overlay *{pointer-events:auto}
.map-fab-group{position:absolute;right:14px;top:14px;display:flex;flex-direction:column;gap:8px}
.map-fab{width:44px;height:44px;border-radius:14px;border:none;background:rgba(18,18,26,0.88);backdrop-filter:blur(12px);border:1px solid var(--border2);color:var(--text);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.4);transition:all .15s;}
.map-fab:active{transform:scale(0.95)}
.map-fab.accent{background:rgba(124,58,237,0.88);color:white;border-color:rgba(124,58,237,0.5)}
.apt-chip{position:absolute;top:14px;left:14px;right:68px;background:rgba(18,18,26,0.92);backdrop-filter:blur(12px);border:1px solid var(--border2);border-radius:14px;padding:8px 12px;display:none;align-items:center;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,0.4);}
.apt-chip .label{font-size:11px;color:var(--text2)}
.apt-chip .name{font-size:13px;font-weight:700;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.apt-chip .chip-btn{flex-shrink:0;background:var(--accent);color:white;font-size:11px;font-weight:700;padding:4px 10px;border-radius:8px;border:none;cursor:pointer;}
.sos-fab{position:absolute;bottom:20px;right:14px;width:64px;height:64px;border-radius:20px;border:none;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;animation:sos-pulse 2s infinite;}
.sos-fab i{font-size:22px}
.sos-fab span{font-size:9px;font-weight:800;letter-spacing:1px}
@keyframes sos-pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4),0 8px 24px rgba(239,68,68,0.3)}50%{box-shadow:0 0 0 10px rgba(239,68,68,0),0 8px 24px rgba(239,68,68,0.2)}}
.member-bar{flex-shrink:0;background:var(--bg);border-top:1px solid var(--border);display:flex;gap:0;overflow-x:auto;padding:8px 14px;min-height:66px;align-items:center;}
.member-bar::-webkit-scrollbar{display:none}
.member-item{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:0 7px;}
.member-avatar{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid transparent;position:relative;}
.member-avatar.me{border-color:var(--accent)}
.member-avatar .online-dot{position:absolute;bottom:0;right:0;width:9px;height:9px;border-radius:50%;background:var(--green);border:2px solid var(--bg);}
.member-name{font-size:10px;font-weight:600;color:var(--text2);max-width:48px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* \u2500\u2500 SOS \uBC30\uB108 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.sos-banner{
  position:fixed;top:0;left:0;right:0;z-index:9990;
  background:linear-gradient(135deg,#dc2626,#991b1b);
  padding:14px 16px;
  display:flex;flex-direction:column;gap:8px;
  box-shadow:0 4px 24px rgba(239,68,68,0.6);
  animation:sos-flash 0.8s infinite alternate;
  transform:translateY(-100%);
  transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
  pointer-events:none;
}
.sos-banner.show{transform:translateY(0);pointer-events:auto}
.sos-banner-title{font-size:16px;font-weight:800;color:white;display:flex;align-items:center;gap:8px;}
.sos-banner-msg{font-size:13px;color:rgba(255,255,255,0.9)}
.sos-banner-btns{display:flex;gap:8px}
.sos-banner-btn{flex:1;padding:9px;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;}
.sos-banner-btn.ack{background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.4);}
.sos-banner-btn.dismiss{background:white;color:#dc2626;}
@keyframes sos-flash{from{background:linear-gradient(135deg,#dc2626,#991b1b)}to{background:linear-gradient(135deg,#ef4444,#b91c1c)}}

/* \u2500\u2500 \uCC44\uD305 \uD0ED \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
#tab-chat{background:var(--bg)}
.chat-header{flex-shrink:0;padding:10px 12px 0;background:var(--bg);border-bottom:1px solid var(--border);}
.chat-rooms-scroll{display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;align-items:center;}
.chat-rooms-scroll::-webkit-scrollbar{display:none}
.room-chip{flex-shrink:0;padding:7px 14px;border-radius:20px;border:1px solid var(--border2);background:var(--surface);color:var(--text2);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;display:flex;align-items:center;gap:5px;}
.room-chip.active{background:var(--accent);border-color:var(--accent);color:white}
.room-chip .chip-badge{background:var(--red);color:white;font-size:9px;font-weight:700;min-width:14px;height:14px;border-radius:7px;padding:0 3px;display:inline-flex;align-items:center;justify-content:center;}
.new-room-btn{flex-shrink:0;width:32px;height:32px;border-radius:50%;border:1px dashed var(--border2);background:transparent;color:var(--text3);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;align-self:center;}
.chat-room-info{display:flex;align-items:center;justify-content:space-between;padding:8px 4px 10px;}
.chat-room-name{font-size:14px;font-weight:700;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chat-room-actions{display:flex;gap:6px;align-items:center;flex-shrink:0}
/* \uCC44\uD305\uBC29 \uC704\uCE58 \uACF5\uC720 \uBC84\uD2BC */
.room-loc-toggle{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid var(--border2);background:var(--surface2);color:var(--text2);transition:all .2s;white-space:nowrap;}
.room-loc-toggle .loc-dot{width:8px;height:8px;border-radius:50%;background:var(--text3);transition:background .2s;}
.room-loc-toggle.on{background:rgba(16,185,129,0.12);border-color:rgba(16,185,129,0.4);color:#34d399;}
.room-loc-toggle.on .loc-dot{background:#10b981;box-shadow:0 0 6px #10b981;}
.leave-room-btn{width:28px;height:28px;border-radius:50%;border:none;background:transparent;color:var(--text3);font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color .15s;}
.leave-room-btn:hover{color:var(--red)}
.chat-msgs{flex:1;overflow-y:auto;padding:10px 14px;display:flex;flex-direction:column;gap:6px;overscroll-behavior:contain;}
.msg-row{display:flex;align-items:flex-end;gap:6px}
.msg-row.me{flex-direction:row-reverse}
.msg-avatar{width:28px;height:28px;border-radius:50%;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--surface2)}
.msg-body{max-width:70%;display:flex;flex-direction:column;gap:2px}
.msg-row.me .msg-body{align-items:flex-end}
.msg-sender{font-size:10px;color:var(--text2);font-weight:500;padding:0 4px}
.msg-bubble{padding:8px 12px;border-radius:4px 16px 16px 16px;font-size:14px;line-height:1.5;word-break:break-word;background:var(--surface);color:var(--text);}
.msg-row.me .msg-bubble{background:var(--accent);color:white;border-radius:16px 4px 16px 16px}
.msg-time{font-size:10px;color:var(--text3);padding:0 4px;flex-shrink:0}
.msg-system{text-align:center;font-size:11px;color:var(--text3);padding:3px 0}
.msg-sos .msg-bubble{background:rgba(239,68,68,0.15)!important;border:1px solid rgba(239,68,68,0.4)!important;color:#fca5a5!important;border-radius:12px!important;}
.chat-input-bar{flex-shrink:0;padding:10px 12px;background:var(--bg);border-top:1px solid var(--border);display:flex;gap:8px;align-items:center;}
.chat-input-bar input{flex:1;background:var(--surface);border:1px solid var(--border2);border-radius:20px;padding:10px 16px;color:var(--text);outline:none;font-size:14px;transition:border-color .2s;}
.chat-input-bar input:focus{border-color:var(--accent)}
.chat-input-bar input::placeholder{color:var(--text3)}
.send-btn{width:40px;height:40px;border-radius:50%;border:none;background:var(--accent);color:white;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;}
.send-btn:active{transform:scale(0.92)}
.loc-share-btn{width:36px;height:36px;border-radius:50%;border:none;background:var(--surface);color:var(--accent3);font-size:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}

/* \u2500\u2500 \uCC44\uD305\uBC29 \uC704\uCE58 \uD328\uB110 (\uBC14\uD140\uC2DC\uD2B8) \u2500\u2500\u2500\u2500 */
.room-loc-panel{position:absolute;bottom:0;left:0;right:0;z-index:40;background:var(--surface);border-radius:20px 20px 0 0;border-top:1px solid var(--border2);transform:translateY(100%);transition:transform .3s cubic-bezier(0.34,1.56,0.64,1);max-height:55%;}
.room-loc-panel.show{transform:translateY(0)}
.room-loc-drag{width:36px;height:4px;background:var(--border2);border-radius:2px;margin:10px auto 0;}
.room-loc-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 8px;}
.room-loc-title{font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px;}
.room-loc-close{background:none;border:none;color:var(--text2);font-size:13px;cursor:pointer;padding:4px 8px;border-radius:6px;font-weight:600;}
.room-loc-list{display:flex;flex-direction:column;gap:8px;overflow-y:auto;max-height:200px;padding:0 16px 16px;}
.room-loc-item{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg2);border-radius:12px;cursor:pointer;transition:background .15s;}
.room-loc-item:active{background:var(--bg3)}
.room-loc-avatar{font-size:22px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:var(--surface2);border-radius:50%;}
.room-loc-info{flex:1}
.room-loc-name{font-size:13px;font-weight:600}
.room-loc-time{font-size:11px;color:var(--text3);margin-top:2px}
.room-loc-arrow{color:var(--text3);font-size:11px}

/* \u2500\u2500 \uCC44\uD305\uBC29 \uB9CC\uB4E4\uAE30 \uD328\uB110 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.create-room-panel{position:absolute;inset:0;background:var(--bg);z-index:20;display:none;flex-direction:column;}
.create-room-panel.show{display:flex}
.create-room-header{padding:16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;}
.create-room-header h3{font-size:16px;font-weight:700;flex:1}
.create-room-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px;}
.create-room-footer{padding:14px 16px;border-top:1px solid var(--border);}
.member-select-list{display:flex;flex-direction:column;gap:4px}
.member-select-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;background:var(--surface);border:1px solid transparent;transition:all .15s;}
.member-select-item.selected{border-color:var(--accent);background:rgba(124,58,237,0.1);}
.member-select-check{width:20px;height:20px;border-radius:50%;border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:11px;transition:all .15s;}
.member-select-item.selected .member-select-check{background:var(--accent);border-color:var(--accent);color:white;}

/* \u2500\u2500 \uC57D\uC18D \uD0ED \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
#tab-appt{background:var(--bg);overflow-y:auto}
.appt-scroll{padding:16px;display:flex;flex-direction:column;gap:12px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:18px;}
.card-title{font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:6px;}
.card-title i{color:var(--accent3)}
.search-row{display:flex;gap:8px;margin-bottom:8px}
.search-input{flex:1;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--radius-xs);padding:10px 14px;color:var(--text);font-size:14px;outline:none;transition:border-color .2s;}
.search-input:focus{border-color:var(--accent)}
.search-input::placeholder{color:var(--text3)}
.search-btn{padding:10px 16px;border:none;border-radius:var(--radius-xs);background:var(--accent);color:white;font-size:13px;font-weight:700;cursor:pointer;flex-shrink:0;}
.place-results{display:none;border:1px solid var(--border);border-radius:var(--radius-xs);overflow:hidden;margin-bottom:8px}
.place-item{padding:11px 14px;border-bottom:1px solid var(--border);cursor:pointer;background:var(--surface);transition:background .15s;}
.place-item:last-child{border-bottom:none}
.place-item:active{background:var(--surface2)}
.place-item .pname{font-size:14px;font-weight:600;color:var(--text)}
.place-item .paddr{font-size:12px;color:var(--text2);margin-top:1px}
.selected-place{background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.3);border-radius:var(--radius-xs);padding:10px 14px;margin-bottom:10px;display:none;}
.selected-place .sp-label{font-size:11px;color:var(--accent3);font-weight:600}
.selected-place .sp-name{font-size:14px;font-weight:700;color:var(--text);margin-top:2px}
.selected-place .sp-addr{font-size:12px;color:var(--text2)}
.btn-accent{width:100%;padding:12px;border:none;border-radius:var(--radius-xs);background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(124,58,237,0.3);transition:all .15s;}
.btn-accent:active{transform:scale(0.98)}
.btn-secondary{width:100%;padding:12px;border:1px solid var(--border2);border-radius:var(--radius-xs);background:var(--surface2);color:var(--text);font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;}
.current-apt-card{background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.1));border:1px solid rgba(124,58,237,0.3);border-radius:20px;padding:18px;display:none;}
.current-apt-label{font-size:11px;color:var(--accent3);font-weight:600;margin-bottom:4px}
.current-apt-name{font-size:20px;font-weight:800;color:var(--text);margin-bottom:12px}
.apt-btn-row{display:flex;gap:8px}
.apt-btn{flex:1;padding:10px;border:none;border-radius:var(--radius-xs);font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;}
.apt-btn.primary{background:var(--accent);color:white}
.apt-btn.ghost{background:var(--surface2);color:var(--text2);border:1px solid var(--border2)}
.midpoint-result{display:none;margin-top:10px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:var(--radius-xs);padding:12px;}
.midpoint-result .mp-label{font-size:11px;color:#34d399;font-weight:600}
.midpoint-result .mp-name{font-size:14px;font-weight:700;color:var(--text);margin:4px 0 10px}
.transit-panel{display:none;margin-top:12px}
.transit-route{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:8px;border-left:3px solid var(--accent);}
.transit-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.transit-time{font-size:22px;font-weight:800;color:var(--text)}
.transit-tag{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(124,58,237,0.15);color:var(--accent3);}
.transit-steps{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:8px}
.step-chip{font-size:11px;font-weight:700;padding:3px 8px;border-radius:8px;display:flex;align-items:center;gap:3px;}
.step-chip.subway{background:rgba(59,130,246,0.15);color:#60a5fa}
.step-chip.bus{background:rgba(16,185,129,0.15);color:#34d399}
.transit-meta{font-size:11px;color:var(--text2);display:flex;gap:10px}
.transit-demo-note{background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:var(--radius-xs);padding:10px;font-size:12px;color:#fbbf24;margin-bottom:10px;}
.spinner{width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin:20px auto}
@keyframes spin{to{transform:rotate(360deg)}}

/* \u2500\u2500 \uCE5C\uAD6C \uD0ED \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
#tab-friends{background:var(--bg);overflow-y:auto}
.friends-scroll{padding:16px;display:flex;flex-direction:column;gap:12px}
.add-friend-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:18px;}
.friend-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);}
.friend-item:last-child{border-bottom:none}
.friend-avatar{width:46px;height:46px;border-radius:50%;font-size:22px;display:flex;align-items:center;justify-content:center;background:var(--surface2);flex-shrink:0;}
.friend-info{flex:1;min-width:0}
.friend-name{font-size:15px;font-weight:700;color:var(--text)}
.friend-id{font-size:12px;color:var(--text2);margin-top:1px}
.friend-status{font-size:11px;margin-top:3px;display:flex;align-items:center;gap:4px}
.friend-status .dot{width:7px;height:7px;border-radius:50%;background:var(--text3)}
.friend-status .dot.online{background:var(--green)}
.friend-actions{display:flex;gap:6px;flex-shrink:0}
.f-btn{padding:7px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:none;transition:all .15s;}
.f-btn.accept{background:var(--accent);color:white}
.f-btn.reject{background:var(--surface2);color:var(--text2);border:1px solid var(--border2)}
.f-btn.chat{background:var(--surface2);color:var(--accent3);border:1px solid rgba(124,58,237,0.3)}
.f-btn:active{transform:scale(0.95)}
.perm-row{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;font-size:12px;color:var(--text2);background:var(--bg2);border-radius:8px;margin-bottom:4px;}
.perm-label{display:flex;align-items:center;gap:6px;font-weight:500;}
.toggle-sw{width:44px;height:24px;border-radius:12px;background:var(--surface2);border:1px solid var(--border2);cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;}
.toggle-sw.on{background:var(--accent);border-color:var(--accent);}
.toggle-sw::after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:white;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,0.3);}
.toggle-sw.on::after{left:23px;}
.perm-expand{padding:8px 4px 4px;border-top:1px solid var(--border);margin-top:6px;display:none;}
.perm-expand.show{display:block;}
.req-badge{background:var(--red);color:white;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;margin-left:6px;}
.section-label{font-size:12px;font-weight:700;color:var(--text2);letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px}
.empty-state{text-align:center;padding:32px 0;color:var(--text3)}
.empty-state .e-icon{font-size:36px;margin-bottom:8px}
.empty-state p{font-size:13px}

/* \u2500\u2500 \uD1A0\uC2A4\uD2B8 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.toast{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-80px);z-index:9999;background:var(--surface);color:var(--text);padding:11px 20px;border-radius:20px;font-size:13px;font-weight:600;box-shadow:0 8px 32px rgba(0,0,0,0.5);border:1px solid var(--border2);transition:transform .3s cubic-bezier(0.34,1.56,0.64,1);white-space:nowrap;max-width:90vw;}
.toast.show{transform:translateX(-50%) translateY(0)}
.toast.success{border-color:rgba(16,185,129,0.4);color:#34d399}
.toast.error{border-color:rgba(239,68,68,0.4);color:#fca5a5}
.toast.sos{background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.5);color:#fca5a5}

/* \u2500\u2500 \uBAA8\uB2EC \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200;display:none;align-items:flex-end;backdrop-filter:blur(4px);}
.modal-overlay.show{display:flex}
.modal-sheet{width:100%;background:var(--surface);border-radius:24px 24px 0 0;padding:24px;border-top:1px solid var(--border2);animation:sheetUp .25s ease-out;}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.modal-handle{width:36px;height:4px;background:var(--border2);border-radius:2px;margin:0 auto 20px}
/* \uC9C0\uB3C4 \uB9D0\uD48D\uC120 */
.msg-bubble-map{position:relative;background:#7c3aed;color:white;padding:6px 10px;border-radius:12px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,0.45);max-width:160px;word-break:break-all;white-space:normal;line-height:1.3;}
</style>
</head>
<body>

<!-- SOS \uBC30\uB108 -->
<div class="sos-banner" id="sos-banner">
  <div class="sos-banner-title"><i class="fas fa-exclamation-triangle"></i><span id="sos-banner-title-text">SOS \uAE34\uAE09 \uC54C\uB9BC</span></div>
  <div class="sos-banner-msg" id="sos-banner-msg"></div>
  <div class="sos-banner-btns">
    <button class="sos-banner-btn ack" id="sos-ack-btn">\u2705 \uD655\uC778\uD588\uC5B4\uC694</button>
    <button class="sos-banner-btn dismiss" id="sos-dismiss-btn" style="display:none">\u{1F7E2} SOS \uC885\uB8CC</button>
  </div>
</div>

<!-- \u2550\u2550 AUTH \u2550\u2550 -->
<div id="screen-auth">
  <div class="auth-glow"></div>
  <div class="auth-logo">\u{1F4CD}</div>
  <h1 class="auth-title">\uBAA8\uC5EC\uBD10</h1>
  <p class="auth-sub">\uCE5C\uAD6C\uB4E4\uACFC \uC2E4\uC2DC\uAC04 \uC704\uCE58 \uACF5\uC720</p>
  <div class="auth-card">
    <div class="auth-tabs">
      <button class="auth-tab active" onclick="switchAuthTab('login')">\uB85C\uADF8\uC778</button>
      <button class="auth-tab" onclick="switchAuthTab('register')">\uD68C\uC6D0\uAC00\uC785</button>
    </div>
    <div id="auth-error" class="auth-error"></div>
    <form id="form-login" onsubmit="doLogin();return false;">
      <div class="field"><label>\uC544\uC774\uB514</label><input id="login-id" type="text" placeholder="\uC544\uC774\uB514 \uC785\uB825" autocomplete="username"/></div>
      <div class="field"><label>\uBE44\uBC00\uBC88\uD638</label><input id="login-pw" type="password" placeholder="\uBE44\uBC00\uBC88\uD638 \uC785\uB825" autocomplete="current-password"/></div>
      <button type="submit" class="btn-primary">\uB85C\uADF8\uC778</button>
    </form>
    <form id="form-register" style="display:none" onsubmit="doRegister();return false;">
      <div class="field"><label>\uC544\uC774\uB514</label><input id="reg-id" type="text" placeholder="my_id123 (\uC601\uBB38/\uC22B\uC790/\uBC11\uC904, 3\uC790\u2191)" autocomplete="username"/></div>
      <div class="field"><label>\uBE44\uBC00\uBC88\uD638</label><input id="reg-pw" type="password" placeholder="\uBE44\uBC00\uBC88\uD638 (4\uC790 \uC774\uC0C1)" autocomplete="new-password"/></div>
      <div class="field"><label>\uB2C9\uB124\uC784</label><input id="reg-name" type="text" placeholder="\uCE5C\uAD6C\uB4E4\uC5D0\uAC8C \uBCF4\uC5EC\uC9C8 \uC774\uB984" maxlength="10"/></div>
      <div class="field"><label>\uC544\uBC14\uD0C0</label><div class="avatar-grid" id="avatar-grid"></div></div>
      <button type="submit" class="btn-primary">\uAC00\uC785\uD558\uAE30</button>
    </form>
  </div>
</div>

<!-- \u2550\u2550 MAIN APP \u2550\u2550 -->
<div id="screen-main">
  <div class="topbar">
    <div class="topbar-logo">
      <div class="topbar-logo-icon">\u{1F4CD}</div>
      <span class="topbar-logo-text">\uBAA8\uC5EC\uBD10</span>
    </div>
    <div class="topbar-actions">
      <button class="icon-btn" id="loc-share-toggle" onclick="toggleGlobalLoc()" title="\uB0B4 \uC704\uCE58 \uACF5\uC720">
        <i class="fas fa-broadcast-tower"></i>
        <span class="badge" id="loc-share-badge" style="display:none;background:var(--green);font-size:8px">ON</span>
      </button>
      <button class="icon-btn" onclick="switchTab('friends')" title="\uCE5C\uAD6C \uC694\uCCAD">
        <i class="fas fa-user-friends"></i>
        <span class="badge" id="req-badge" style="display:none"></span>
      </button>
      <button class="icon-btn" onclick="showProfileModal()" title="\uD504\uB85C\uD544">
        <span id="my-avatar-btn" style="font-size:18px">\u{1F43B}</span>
      </button>
    </div>
  </div>

  <div class="tab-content">
    <!-- \uC9C0\uB3C4 -->
    <div class="tab-pane active" id="tab-map">
      <div style="flex:1;position:relative">
        <div id="kakaoMap"></div>
        <div class="map-overlay">
          <div class="apt-chip" id="apt-chip">
            <span style="font-size:16px">\u{1F4CC}</span>
            <div style="flex:1;min-width:0"><div class="label">\uC57D\uC18D\uC7A5\uC18C</div><div class="name" id="apt-chip-name"></div></div>
            <button class="chip-btn" onclick="goToApptTab()">\uAE38\uCC3E\uAE30</button>
          </div>
          <div class="map-fab-group">
            <button class="map-fab" onclick="centerMe()" title="\uB0B4 \uC704\uCE58"><i class="fas fa-crosshairs"></i></button>
            <button class="map-fab" onclick="centerAll()" title="\uC804\uCCB4 \uBCF4\uAE30"><i class="fas fa-expand-arrows-alt" style="font-size:14px"></i></button>
          </div>
          <button class="sos-fab" onclick="sendSOS()"><i class="fas fa-exclamation"></i><span>SOS</span></button>
        </div>
      </div>
      <div class="member-bar" id="member-bar">
        <div style="color:var(--text3);font-size:12px;width:100%;text-align:center">\uCE5C\uAD6C\uB97C \uCD94\uAC00\uD558\uBA74 \uC5EC\uAE30\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4</div>
      </div>
    </div>

    <!-- \uCC44\uD305 -->
    <div class="tab-pane" id="tab-chat">
      <!-- \uCC44\uD305\uBC29 \uB9CC\uB4E4\uAE30 \uD328\uB110 -->
      <div class="create-room-panel" id="create-room-panel">
        <div class="create-room-header">
          <button onclick="closeCreateRoom()" style="background:none;border:none;color:var(--text2);font-size:16px;cursor:pointer;padding:4px"><i class="fas fa-arrow-left"></i></button>
          <h3>\uC0C8 \uCC44\uD305\uBC29</h3>
        </div>
        <div class="create-room-body">
          <div class="field"><label>\uCC44\uD305\uBC29 \uC774\uB984 (\uADF8\uB8F9\uC6A9)</label><input id="new-room-name" type="text" placeholder="\uC608) \uC5EC\uB984 \uC5EC\uD589 \uACC4\uD68D" maxlength="20"/></div>
          <div>
            <div class="section-label">\uCE5C\uAD6C \uC120\uD0DD (1\uBA85 = 1:1 \uCC44\uD305)</div>
            <div class="member-select-list" id="member-select-list"></div>
          </div>
        </div>
        <div class="create-room-footer">
          <button class="btn-accent" onclick="createRoom()">\uCC44\uD305\uBC29 \uB9CC\uB4E4\uAE30</button>
        </div>
      </div>

      <div class="chat-header">
        <div style="display:flex;align-items:center;gap:6px">
          <div class="chat-rooms-scroll" id="chat-room-select"></div>
          <button class="new-room-btn" onclick="openCreateRoom()" title="\uC0C8 \uCC44\uD305\uBC29"><i class="fas fa-plus"></i></button>
        </div>
        <div class="chat-room-info">
          <div class="chat-room-name" id="chat-room-name">\uCC44\uD305\uBC29\uC744 \uC120\uD0DD\uD558\uC138\uC694</div>
          <div class="chat-room-actions">
            <button class="room-loc-toggle" id="room-loc-btn" onclick="toggleRoomLocShare()" style="display:none">
              <div class="loc-dot"></div><span id="room-loc-btn-text">\uC704\uCE58 \uACF5\uC720</span>
            </button>
          </div>
        </div>
      </div>
      <div class="chat-msgs" id="chat-msgs"><div class="empty-state" style="margin:auto"><div class="e-icon">\u{1F4AC}</div><p>\uCC44\uD305\uBC29\uC744 \uC120\uD0DD\uD558\uAC70\uB098<br/>\uC0C8\uB85C \uB9CC\uB4E4\uC5B4\uBCF4\uC138\uC694</p></div></div>
      <div class="chat-input-bar">
        <button class="loc-share-btn" onclick="shareMyLocInChat()" title="\uB0B4 \uC704\uCE58 \uACF5\uC720"><i class="fas fa-map-marker-alt"></i></button>
        <input id="chat-input" type="text" placeholder="\uBA54\uC2DC\uC9C0 \uC785\uB825..." maxlength="200" disabled/>
        <button class="send-btn" onclick="sendChat()"><i class="fas fa-paper-plane"></i></button>
      </div>
      <!-- \uCC44\uD305\uBC29 \uC704\uCE58 \uACF5\uC720 \uBC14\uD140\uC2DC\uD2B8 \uD328\uB110 -->
      <div class="room-loc-panel" id="room-loc-panel">
        <div class="room-loc-drag"></div>
        <div class="room-loc-header">
          <div class="room-loc-title">\u{1F4CD} \uCC44\uD305\uBC29 \uBA64\uBC84 \uC704\uCE58</div>
          <button class="room-loc-close" onclick="closeRoomLocPanel()">\uB2EB\uAE30</button>
        </div>
        <div class="room-loc-list" id="room-loc-list"></div>
      </div>
    </div>

    <!-- \uC57D\uC18D -->
    <div class="tab-pane" id="tab-appt">
      <div class="appt-scroll">
        <div class="current-apt-card" id="cur-apt-card">
          <div class="current-apt-label">\u{1F4CC} \uD604\uC7AC \uC57D\uC18D\uC7A5\uC18C</div>
          <div class="current-apt-name" id="cur-apt-name"></div>
          <div class="apt-btn-row">
            <button class="apt-btn primary" onclick="openTransit()"><i class="fas fa-subway"></i> \uAE38\uCC3E\uAE30</button>
            <button class="apt-btn ghost" onclick="focusApt()"><i class="fas fa-map"></i> \uC9C0\uB3C4</button>
          </div>
        </div>
        <div class="card">
          <div class="card-title"><i class="fas fa-map-pin"></i> \uC57D\uC18D\uC7A5\uC18C \uC9C0\uC815</div>
          <div class="search-row">
            <input class="search-input" id="place-input" type="text" placeholder="\uC7A5\uC18C \uAC80\uC0C9 (\uAC15\uB0A8\uC5ED, \uD64D\uB300\uC785\uAD6C...)"/>
            <button class="search-btn" onclick="searchPlace()">\uAC80\uC0C9</button>
          </div>
          <div class="place-results" id="place-results"></div>
          <div class="selected-place" id="selected-place">
            <div class="sp-label">\uC120\uD0DD\uB41C \uC7A5\uC18C</div>
            <div class="sp-name" id="sp-name"></div>
            <div class="sp-addr" id="sp-addr"></div>
          </div>
          <button class="btn-accent" onclick="setAppointment()">\u{1F4CC} \uC57D\uC18D\uC7A5\uC18C\uB85C \uC9C0\uC815</button>
        </div>
        <div class="card">
          <div class="card-title"><i class="fas fa-bullseye"></i> \uC911\uAC04 \uC9C0\uC810 \uCC3E\uAE30</div>
          <p style="font-size:13px;color:var(--text2);margin-bottom:12px;line-height:1.6">\uCE5C\uAD6C\uB4E4 \uC704\uCE58 \uAE30\uBC18 \uC911\uAC04 \uC9C0\uC810\uC744 \uACC4\uC0B0\uD569\uB2C8\uB2E4</p>
          <button class="btn-secondary" onclick="findMidpoint()">\u{1F3AF} \uC911\uAC04 \uC9C0\uC810 \uACC4\uC0B0\uD558\uAE30</button>
          <div class="midpoint-result" id="midpoint-result">
            <div class="mp-label">\uACC4\uC0B0\uB41C \uC911\uAC04 \uC9C0\uC810</div>
            <div class="mp-name" id="mp-name"></div>
            <button class="btn-accent" onclick="setMidpointAsApt()" style="margin-top:4px">\uC774 \uC7A5\uC18C\uB97C \uC57D\uC18D\uC7A5\uC18C\uB85C \uC9C0\uC815</button>
          </div>
        </div>
        <div class="card transit-panel" id="transit-panel">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div class="card-title" style="margin-bottom:0"><i class="fas fa-train"></i> \uB300\uC911\uAD50\uD1B5 \uAE38\uCC3E\uAE30</div>
            <button onclick="closeTransit()" style="background:none;border:none;color:var(--text2);font-size:13px;cursor:pointer">\uB2EB\uAE30</button>
          </div>
          <div class="spinner" id="transit-spinner" style="display:none"></div>
          <div id="transit-results"></div>
        </div>
      </div>
    </div>

    <!-- \uCE5C\uAD6C -->
    <div class="tab-pane" id="tab-friends">
      <div class="friends-scroll">
        <div class="add-friend-card">
          <div class="card-title"><i class="fas fa-user-plus"></i> \uCE5C\uAD6C \uCD94\uAC00</div>
          <div class="search-row">
            <input class="search-input" id="friend-id-input" type="text" placeholder="\uCE5C\uAD6C \uC544\uC774\uB514 \uC785\uB825"/>
            <button class="search-btn" onclick="sendFriendReq()">\uC694\uCCAD</button>
          </div>
        </div>
        <div id="req-section" style="display:none">
          <div class="section-label">\uBC1B\uC740 \uCE5C\uAD6C \uC694\uCCAD <span class="req-badge" id="req-count-badge"></span></div>
          <div class="card"><div id="req-list"></div></div>
        </div>
        <div>
          <div class="section-label">\uCE5C\uAD6C \uBAA9\uB85D</div>
          <div class="card"><div id="friend-list"><div class="empty-state"><div class="e-icon">\u{1F465}</div><p>\uC544\uC9C1 \uCE5C\uAD6C\uAC00 \uC5C6\uC5B4\uC694</p></div></div></div>
        </div>
      </div>
    </div>
  </div>

  <div class="tabbar">
    <button class="tab-btn active" id="tbtn-map" onclick="switchTab('map')"><i class="fas fa-map-marked-alt"></i><span>\uC9C0\uB3C4</span></button>
    <button class="tab-btn" id="tbtn-chat" onclick="switchTab('chat')"><i class="fas fa-comment-dots"></i><span>\uCC44\uD305</span><span class="tbadge" id="chat-tbadge"></span></button>
    <button class="tab-btn" id="tbtn-appt" onclick="switchTab('appt')"><i class="fas fa-map-pin"></i><span>\uC57D\uC18D</span></button>
    <button class="tab-btn" id="tbtn-friends" onclick="switchTab('friends')"><i class="fas fa-user-friends"></i><span>\uCE5C\uAD6C</span><span class="tbadge" id="friends-tbadge"></span></button>
  </div>
</div>

<!-- \uD504\uB85C\uD544 \uBAA8\uB2EC -->
<div class="modal-overlay" id="profile-modal" onclick="closeProfileModal(event)">
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
      <div id="profile-avatar" style="font-size:44px;width:64px;height:64px;display:flex;align-items:center;justify-content:center;background:var(--surface2);border-radius:50%"></div>
      <div><div id="profile-name" style="font-size:20px;font-weight:800"></div><div id="profile-id" style="font-size:13px;color:var(--text2);margin-top:2px"></div></div>
    </div>
    <div style="margin-bottom:16px">
      <div style="font-size:12px;color:var(--text2);font-weight:600;margin-bottom:8px">\uC704\uCE58 \uACF5\uC720 \uC804\uCCB4 \uC124\uC815</div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg2);border-radius:10px;">
        <span style="font-size:14px;color:var(--text)"><i class="fas fa-broadcast-tower" style="color:var(--accent3);margin-right:8px"></i>\uB0B4 \uC704\uCE58 \uACF5\uC720 \uC911</span>
        <div class="toggle-sw" id="global-loc-toggle" onclick="toggleGlobalLoc()"></div>
      </div>
    </div>
    <button onclick="doLogout()" style="width:100%;padding:13px;border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-sm);background:rgba(239,68,68,0.1);color:#fca5a5;font-size:14px;font-weight:700;cursor:pointer">\uB85C\uADF8\uC544\uC6C3</button>
  </div>
</div>

<div class="toast" id="toast"></div>

<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${e}&libraries=services"><\/script>
<script>
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  SERVICE WORKER \uB4F1\uB85D
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js').catch(()=>{})
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  STATE
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
const S = {
  token:null, userId:null, displayName:null, avatar:null,
  lat:null, lng:null,
  map:null, myMarker:null, friendMarkers:{},
  chatBubbleOverlays:{}, chatBubbleTimers:{},
  aptMarker:null, appointment:null,
  friends:[], pendingReqs:[],
  rooms:[], currentRoom:null, currentRoomName:'',
  currentRoomData:null,
  lastChatTs:0, lastSOSTs:0,
  selectedPlace:null, midpointData:null,
  pollTimer:null, locTimer:null,
  unreadChat:0, roomUnread:{},
  activeSOS:null,
  globalLocShare:true,
  locPanelOpen:false,
  MCOLORS:['#7c3aed','#ec4899','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'],
  // \uC131\uB2A5: \uB9C8\uC9C0\uB9C9 \uD3F4\uB9C1 \uACB0\uACFC \uD574\uC2DC (\uBCC0\uACBD \uC5C6\uC73C\uBA74 UI \uAC31\uC2E0 \uC2A4\uD0B5)
  _friendsHash:'', _roomsHash:'', _reqHash:'',
}
const AVATARS=['\u{1F43B}','\u{1F98A}','\u{1F431}','\u{1F436}','\u{1F438}','\u{1F427}','\u{1F428}','\u{1F981}','\u{1F42F}','\u{1F43A}','\u{1F984}','\u{1F43C}']

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  AUTH
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function initAuth(){
  const saved=localStorage.getItem('meetup_auth')
  if(saved){try{const d=JSON.parse(saved);S.token=d.token;S.userId=d.userId;S.displayName=d.displayName;S.avatar=d.avatar;S.globalLocShare=localStorage.getItem('meetup_loc_share')!=='false';startApp();return}catch(e){localStorage.removeItem('meetup_auth')}}
  renderAvatarGrid()
}
function renderAvatarGrid(){
  window._selAvatar=AVATARS[0]
  document.getElementById('avatar-grid').innerHTML=AVATARS.map((a,i)=>'<button class="avatar-btn'+(i===0?' selected':'')+'" onclick="selectAvatar(''+a+'',this)">'+a+'</button>').join('')
}
function selectAvatar(a,el){window._selAvatar=a;document.querySelectorAll('.avatar-btn').forEach(b=>b.classList.remove('selected'));el.classList.add('selected')}
function switchAuthTab(tab){document.getElementById('form-login').style.display=tab==='login'?'block':'none';document.getElementById('form-register').style.display=tab==='register'?'block':'none';document.querySelectorAll('.auth-tab').forEach((b,i)=>b.classList.toggle('active',(i===0&&tab==='login')||(i===1&&tab==='register')));document.getElementById('auth-error').style.display='none'}
function showAuthError(msg){const el=document.getElementById('auth-error');el.textContent=msg;el.style.display='block'}
async function doLogin(){
  const userId=document.getElementById('login-id').value.trim()
  const password=document.getElementById('login-pw').value
  if(!userId||!password){showAuthError('\uC544\uC774\uB514\uC640 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694');return}
  try{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,password})});const d=await r.json();if(!r.ok){showAuthError(d.error||'\uB85C\uADF8\uC778 \uC2E4\uD328');return}saveAuth(d);startApp()}catch(e){showAuthError('\uC11C\uBC84 \uC5F0\uACB0 \uC2E4\uD328')}
}
async function doRegister(){
  const userId=document.getElementById('reg-id').value.trim()
  const password=document.getElementById('reg-pw').value
  const displayName=document.getElementById('reg-name').value.trim()
  const avatar=window._selAvatar||AVATARS[0]
  if(!userId||!password||!displayName){showAuthError('\uBAA8\uB4E0 \uD56D\uBAA9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694');return}
  try{const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,password,displayName,avatar})});const d=await r.json();if(!r.ok){showAuthError(d.error||'\uD68C\uC6D0\uAC00\uC785 \uC2E4\uD328');return}saveAuth(d);startApp()}catch(e){showAuthError('\uC11C\uBC84 \uC5F0\uACB0 \uC2E4\uD328')}
}
function saveAuth(d){S.token=d.token;S.userId=d.userId;S.displayName=d.displayName;S.avatar=d.avatar;localStorage.setItem('meetup_auth',JSON.stringify({token:d.token,userId:d.userId,displayName:d.displayName,avatar:d.avatar}))}
function doLogout(){
  if(!confirm('\uB85C\uADF8\uC544\uC6C3 \uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?'))return
  clearInterval(S.pollTimer);clearInterval(S.locTimer)
  if('serviceWorker' in navigator)navigator.serviceWorker.ready.then(r=>{if(r.active)r.active.postMessage({type:'LOGOUT'})}).catch(()=>{})
  localStorage.removeItem('meetup_auth');location.reload()
}
function api(path,opts={}){return fetch(path,{...opts,headers:{'Authorization':'Bearer '+S.token,'Content-Type':'application/json',...(opts.headers||{})}})}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  \uC571 \uC2DC\uC791 & \uD3F4\uB9C1 (\uC131\uB2A5 \uCD5C\uC801\uD654)
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function startApp(){
  document.getElementById('screen-auth').style.display='none'
  document.getElementById('screen-main').classList.add('visible')
  document.getElementById('my-avatar-btn').textContent=S.avatar||'\u{1F43B}'
  document.getElementById('profile-avatar').textContent=S.avatar||'\u{1F43B}'
  document.getElementById('profile-name').textContent=S.displayName
  document.getElementById('profile-id').textContent='@'+S.userId
  updateLocShareUI()
  initMap()
  getLocation()
  Promise.all([fetchFriends(), fetchFriendRequests(), fetchRooms()])
  if('serviceWorker' in navigator)navigator.serviceWorker.ready.then(r=>{if(r.active)r.active.postMessage({type:'INIT_LOC',token:S.token,userId:S.userId})}).catch(()=>{})
  // \uC704\uCE58 \uC5C5\uB85C\uB4DC: 30\uCD08 (\uC804\uC5ED \uACF5\uC720 ON\uC77C \uB54C\uB9CC)
  S.locTimer=setInterval(()=>{if(S.globalLocShare)uploadLocation()},30000)
  // \uD3F4\uB9C1: \uC0AC\uC774\uD074 \uAE30\uBC18\uC73C\uB85C API \uD638\uCD9C \uBD84\uC0B0
  // cycle=0: chat(\uD604\uC7AC\uBC29)
  // cycle%3: friends(9\uCD08)
  // cycle%5: SOS(15\uCD08)
  // cycle%7: friendReqs(21\uCD08)
  // cycle%10: rooms(30\uCD08)
  // locPanel: panel \uC5F4\uB9B0 \uACBD\uC6B0\uB9CC cycle%2(6\uCD08)
  let cycle=0
  S.pollTimer=setInterval(()=>{
    cycle=(cycle+1)%120
    if(S.currentRoom)fetchChat()
    if(cycle%3===0)fetchFriends()
    if(cycle%5===0)fetchSOSCheck()
    if(cycle%7===0)fetchFriendRequests()
    if(cycle%10===0)fetchRooms()
    if(S.locPanelOpen&&cycle%2===0)fetchRoomLocations()
  },3000)
}

function toggleGlobalLoc(){
  S.globalLocShare=!S.globalLocShare
  localStorage.setItem('meetup_loc_share',S.globalLocShare)
  updateLocShareUI()
  showToast(S.globalLocShare?'\u{1F4E1} \uC704\uCE58 \uACF5\uC720 \uCF1C\uC9D0':'\u{1F515} \uC704\uCE58 \uACF5\uC720 \uAEBC\uC9D0',S.globalLocShare?'success':'info')
  if(S.globalLocShare)uploadLocation()
}
function updateLocShareUI(){const t=document.getElementById('global-loc-toggle');const b=document.getElementById('loc-share-badge');if(t)t.classList.toggle('on',S.globalLocShare);if(b)b.style.display=S.globalLocShare?'flex':'none'}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  \uC704\uCE58
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function getLocation(){
  if(!navigator.geolocation)return
  navigator.geolocation.getCurrentPosition(pos=>{
    S.lat=pos.coords.latitude;S.lng=pos.coords.longitude
    updateMyMarker(S.lat,S.lng)
    if(S.globalLocShare)uploadLocation()
  },{enableHighAccuracy:true,timeout:8000,maximumAge:20000})
}
async function uploadLocation(){
  if(!S.token||!S.lat||!S.globalLocShare)return
  try{
    await api('/api/location',{method:'POST',body:JSON.stringify({lat:S.lat,lng:S.lng,accuracy:20})})
    if('serviceWorker' in navigator)navigator.serviceWorker.ready.then(r=>{if(r.active)r.active.postMessage({type:'UPDATE_LOC',lat:S.lat,lng:S.lng,accuracy:20})}).catch(()=>{})
  }catch(e){}
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  \uC9C0\uB3C4
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function initMap(){
  const el=document.getElementById('kakaoMap')
  if(typeof kakao==='undefined'||!kakao.maps){
    el.innerHTML='<div class="map-no-key"><div class="icon">\u{1F5FA}\uFE0F</div><h3>\uCE74\uCE74\uC624\uB9F5 API \uD0A4 \uD544\uC694</h3><p>\uCE74\uCE74\uC624 \uAC1C\uBC1C\uC790 \uCF58\uC194\uC5D0\uC11C JavaScript \uC571 \uD0A4\uB97C \uBC1C\uAE09\uBC1B\uC544 Cloudflare \uC2DC\uD06C\uB9BF\uC5D0 \uB4F1\uB85D\uD574\uC8FC\uC138\uC694</p></div>'
    return
  }
  S.map=new kakao.maps.Map(el,{center:new kakao.maps.LatLng(37.5665,126.9780),level:6})
  kakao.maps.event.addListener(S.map,'click',e=>{const l=e.latLng;S.selectedPlace={name:'\uC9C0\uB3C4\uC5D0\uC11C \uC120\uD0DD\uD55C \uC704\uCE58',lat:l.getLat(),lng:l.getLng(),address:''};showSelectedPlace()})
}
function getColor(uid){let h=0;for(let i=0;i<uid.length;i++)h=(h*31+uid.charCodeAt(i))%S.MCOLORS.length;return S.MCOLORS[h]}
function makeOverlayEl(avatar,name,color,isMe){
  const d=document.createElement('div');d.style.cssText='display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer'
  d.innerHTML='<div style="width:44px;height:44px;border-radius:50%;background:'+color+';display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid '+(isMe?'#a855f7':'white')+';box-shadow:0 4px 14px rgba(0,0,0,0.5);">'+avatar+'</div><div style="background:rgba(10,10,15,0.85);color:white;font-size:10px;font-weight:700;padding:2px 7px;border-radius:7px;white-space:nowrap;backdrop-filter:blur(4px);">'+name+'</div>'
  return d
}
function updateMyMarker(lat,lng){
  if(!S.map||typeof kakao==='undefined')return
  const pos=new kakao.maps.LatLng(lat,lng)
  if(S.myMarker){S.myMarker.setPosition(pos)}
  else{S.myMarker=new kakao.maps.CustomOverlay({position:pos,content:makeOverlayEl(S.avatar||'\u{1F43B}',S.displayName||'\uB098','#7c3aed',true),yAnchor:1.3});S.myMarker.setMap(S.map)}
}
function updateFriendMarker(f){
  if(!S.map||typeof kakao==='undefined')return
  if(!f.location||!f.iViewFriend){if(S.friendMarkers[f.userId]){S.friendMarkers[f.userId].setMap(null);delete S.friendMarkers[f.userId]}return}
  const pos=new kakao.maps.LatLng(f.location.lat,f.location.lng)
  if(S.friendMarkers[f.userId]){S.friendMarkers[f.userId].setPosition(pos)}
  else{const ov=new kakao.maps.CustomOverlay({position:pos,content:makeOverlayEl(f.avatar||'\u{1F43B}',f.displayName,getColor(f.userId),false),yAnchor:1.3});ov.setMap(S.map);S.friendMarkers[f.userId]=ov}
}
function showMapBubble(uid,text,lat,lng){
  if(!S.map||typeof kakao==='undefined')return
  const el=document.createElement('div');el.className='msg-bubble-map';el.style.background=uid===S.userId?'#7c3aed':getColor(uid);el.textContent=text.length>26?text.slice(0,26)+'\u2026':text
  if(S.chatBubbleOverlays[uid])S.chatBubbleOverlays[uid].setMap(null)
  clearTimeout(S.chatBubbleTimers[uid])
  const ov=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(lat,lng),content:el,yAnchor:2.2,zIndex:10});ov.setMap(S.map);S.chatBubbleOverlays[uid]=ov
  S.chatBubbleTimers[uid]=setTimeout(()=>{ov.setMap(null);delete S.chatBubbleOverlays[uid]},5000)
}
function centerMe(){if(S.map&&S.lat)S.map.setCenter(new kakao.maps.LatLng(S.lat,S.lng))}
function centerAll(){
  if(!S.map||typeof kakao==='undefined')return
  const b=new kakao.maps.LatLngBounds()
  if(S.lat)b.extend(new kakao.maps.LatLng(S.lat,S.lng))
  Object.values(S.friendMarkers).forEach(m=>b.extend(m.getPosition()))
  try{S.map.setBounds(b)}catch(e){}
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  \uBA64\uBC84\uBC14
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function renderMemberBar(){
  const bar=document.getElementById('member-bar')
  if(!S.friends.length){bar.innerHTML='<div style="color:var(--text3);font-size:12px;width:100%;text-align:center">\uCE5C\uAD6C\uB97C \uCD94\uAC00\uD558\uBA74 \uC5EC\uAE30\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4</div>';return}
  let html='<div class="member-item" onclick="centerMe()"><div class="member-avatar me">'+esc(S.avatar||'\u{1F43B}')+'<div class="online-dot"></div></div><div class="member-name">\uB098</div></div>'
  for(const f of S.friends){
    const isOnline=f.location&&(Date.now()-f.location.updatedAt)<120000
    html+='<div class="member-item" onclick="focusFriend(''+esc(f.userId)+'')"><div class="member-avatar" style="border-color:'+(isOnline?getColor(f.userId):'transparent')+'">'+esc(f.avatar||'\u{1F43B}')+(isOnline?'<div class="online-dot"></div>':'')+'</div><div class="member-name">'+esc(f.displayName)+'</div></div>'
  }
  bar.innerHTML=html
}
function focusFriend(uid){const f=S.friends.find(x=>x.userId===uid);if(f?.location&&S.map&&typeof kakao!=='undefined'){S.map.setCenter(new kakao.maps.LatLng(f.location.lat,f.location.lng));S.map.setLevel(4);switchTab('map')}}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  \uCE5C\uAD6C (\uC131\uB2A5: \uD574\uC2DC \uBE44\uAD50\uB85C \uBD88\uD544\uC694 \uB80C\uB354\uB9C1 \uBC29\uC9C0)
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
async function fetchFriends(){
  if(!S.token)return
  try{
    const r=await api('/api/friends');const d=await r.json()
    const hash=JSON.stringify(d.friends||[])
    if(hash===S._friendsHash)return  // \uBCC0\uACBD \uC5C6\uC73C\uBA74 \uC2A4\uD0B5
    S._friendsHash=hash
    S.friends=d.friends||[]
    for(const f of S.friends)updateFriendMarker(f)
    renderMemberBar();renderFriendList()
  }catch(e){}
}
async function fetchFriendRequests(){
  if(!S.token)return
  try{
    const r=await api('/api/friends/requests');const d=await r.json()
    const hash=JSON.stringify(d.requests||[])
    if(hash===S._reqHash)return
    S._reqHash=hash
    S.pendingReqs=d.requests||[]
    const cnt=S.pendingReqs.length
    const rb=document.getElementById('req-badge');const tb=document.getElementById('friends-tbadge')
    rb.style.display=cnt?'flex':'none';if(cnt)rb.textContent=cnt
    tb.style.display=cnt?'flex':'none';tb.textContent=cnt
    document.getElementById('req-section').style.display=cnt?'block':'none'
    document.getElementById('req-count-badge').textContent=cnt
    document.getElementById('req-list').innerHTML=S.pendingReqs.map(req=>'<div class="friend-item"><div class="friend-avatar">'+esc(req.fromAvatar||'\u{1F43B}')+'</div><div class="friend-info"><div class="friend-name">'+esc(req.fromName)+'</div><div class="friend-id">@'+esc(req.from)+'</div></div><div class="friend-actions"><button class="f-btn accept" onclick="acceptReq(''+esc(req.from)+'')">\uC218\uB77D</button><button class="f-btn reject" onclick="rejectReq(''+esc(req.from)+'')">\uAC70\uC808</button></div></div>').join('')
  }catch(e){}
}
function renderFriendList(){
  const el=document.getElementById('friend-list')
  if(!S.friends.length){el.innerHTML='<div class="empty-state"><div class="e-icon">\u{1F465}</div><p>\uC544\uC9C1 \uCE5C\uAD6C\uAC00 \uC5C6\uC5B4\uC694<br/>\uCE5C\uAD6C \uC544\uC774\uB514\uB85C \uC694\uCCAD\uC744 \uBCF4\uB0B4\uBCF4\uC138\uC694!</p></div>';return}
  el.innerHTML=S.friends.map(f=>{
    const isOnline=f.location&&(Date.now()-f.location.updatedAt)<120000
    const locStr=isOnline?'\u{1F7E2} \uC704\uCE58 \uACF5\uC720 \uC911 ('+Math.floor((Date.now()-f.location.updatedAt)/60000)+'\uBD84 \uC804)':'\u26AB \uC704\uCE58 \uC5C6\uC74C'
    const uid=f.userId
    return '<div class="friend-item"><div class="friend-avatar">'+esc(f.avatar||'\u{1F43B}')+'</div><div class="friend-info"><div class="friend-name">'+esc(f.displayName)+'</div><div class="friend-id">@'+esc(uid)+'</div><div class="friend-status"><span class="dot'+(isOnline?' online':'')+'"></span>'+locStr+'</div></div><div class="friend-actions"><button class="f-btn chat" onclick="openDM(''+uid+'',''+esc(f.displayName)+'',''+esc(f.avatar||'\u{1F43B}')+'')">\u{1F4AC}</button><button class="f-btn reject" onclick="togglePermExpand(''+uid+'')" title="\uAD8C\uD55C">\u2699\uFE0F</button></div></div><div class="perm-expand" id="perm-'+uid+'"><div class="perm-row"><span class="perm-label">\u{1F4E1} \uC774 \uCE5C\uAD6C\uC5D0\uAC8C \uB0B4 \uC704\uCE58 \uACF5\uC720</span><div class="toggle-sw '+(f.iShareWithFriend!==false?'on':'')+'" id="share-sw-'+uid+'" onclick="toggleSharePerm(''+uid+'')"></div></div><div class="perm-row"><span class="perm-label">\u{1F441}\uFE0F \uC774 \uCE5C\uAD6C \uC704\uCE58 \uC9C0\uB3C4\uC5D0 \uD45C\uC2DC</span><div class="toggle-sw '+(f.iViewFriend!==false?'on':'')+'" id="view-sw-'+uid+'" onclick="toggleViewPerm(''+uid+'')"></div></div></div>'
  }).join('<div style="height:1px;background:var(--border)"></div>')
}
function togglePermExpand(uid){document.getElementById('perm-'+uid)?.classList.toggle('show')}
async function toggleSharePerm(uid){const sw=document.getElementById('share-sw-'+uid);const on=sw.classList.contains('on');sw.classList.toggle('on');await api('/api/location/permission',{method:'POST',body:JSON.stringify({friendId:uid,allow:!on})});showToast((!on?'\u{1F4E1} ':'\u{1F515} ')+esc(S.friends.find(f=>f.userId===uid)?.displayName||uid)+(!on?' \uC704\uCE58 \uACF5\uAC1C':' \uC704\uCE58 \uCC28\uB2E8'),'info')}
async function toggleViewPerm(uid){const sw=document.getElementById('view-sw-'+uid);const on=sw.classList.contains('on');sw.classList.toggle('on');await api('/api/location/view',{method:'POST',body:JSON.stringify({friendId:uid,show:!on})});const f=S.friends.find(x=>x.userId===uid);if(f){f.iViewFriend=!on;updateFriendMarker(f)};showToast((!on?'\u{1F441}\uFE0F ':'\u{1F648} ')+esc(S.friends.find(f=>f.userId===uid)?.displayName||uid)+(!on?' \uD45C\uC2DC':' \uC228\uAE40'),'info')}
async function sendFriendReq(){
  const tid=document.getElementById('friend-id-input').value.trim().toLowerCase()
  if(!tid){showToast('\uC544\uC774\uB514\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694','error');return}
  try{const r=await api('/api/friends/request',{method:'POST',body:JSON.stringify({targetUserId:tid})});const d=await r.json();if(!r.ok){showToast(d.error||'\uC694\uCCAD \uC2E4\uD328','error');return}document.getElementById('friend-id-input').value='';showToast(d.auto_accepted?'\u{1F389} \uCE5C\uAD6C \uCD94\uAC00 \uC644\uB8CC!':'\u{1F4E8} \uCE5C\uAD6C \uC694\uCCAD \uC804\uC1A1!','success');if(d.auto_accepted)fetchFriends()}catch(e){showToast('\uC694\uCCAD \uC2E4\uD328','error')}
}
async function acceptReq(fromId){try{await api('/api/friends/accept',{method:'POST',body:JSON.stringify({fromUserId:fromId})});showToast('\u{1F389} \uCE5C\uAD6C \uC218\uB77D!','success');S._reqHash='';S._friendsHash='';fetchFriends();fetchFriendRequests()}catch(e){}}
async function rejectReq(fromId){try{await api('/api/friends/reject',{method:'POST',body:JSON.stringify({fromUserId:fromId})});S._reqHash='';fetchFriendRequests()}catch(e){}}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  \uCC44\uD305\uBC29 (\uC131\uB2A5: \uD574\uC2DC \uBE44\uAD50)
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
async function fetchRooms(){
  if(!S.token)return
  try{
    const r=await api('/api/rooms');const d=await r.json()
    const hash=JSON.stringify(d.rooms||[])
    if(hash===S._roomsHash)return
    S._roomsHash=hash
    S.rooms=d.rooms||[]
    renderChatRooms()
  }catch(e){}
}

function renderChatRooms(){
  const sel=document.getElementById('chat-room-select')
  if(!S.rooms.length){sel.innerHTML='<div style="color:var(--text3);font-size:12px;padding:8px 4px">\uCC44\uD305\uBC29\uC774 \uC5C6\uC5B4\uC694. + \uBC84\uD2BC\uC73C\uB85C \uB9CC\uB4E4\uC5B4\uBCF4\uC138\uC694!</div>';return}
  sel.innerHTML=S.rooms.map(rm=>{
    const isActive=S.currentRoom===rm.roomId
    const unread=S.roomUnread[rm.roomId]||0
    const icon=rm.type==='dm'?'':'\u{1F465} '
    return '<div class="room-chip'+(isActive?' active':'')+'" data-room="'+rm.roomId+'" data-name="'+esc(rm.name)+'">'+icon+esc(rm.name)+(unread?'<span class="chip-badge">'+unread+'</span>':'')+'</div>'
  }).join('')
}

function selectRoom(roomId,roomName){
  S.currentRoom=roomId;S.currentRoomName=roomName||roomId;S.lastChatTs=0
  S.currentRoomData=S.rooms.find(r=>r.roomId===roomId)||null
  S.roomUnread[roomId]=0
  document.querySelectorAll('.room-chip').forEach(c=>c.classList.toggle('active',c.dataset.room===roomId))
  document.getElementById('chat-room-name').textContent=S.currentRoomName
  document.getElementById('chat-msgs').innerHTML=''
  document.getElementById('chat-input').disabled=false
  document.getElementById('chat-input').placeholder='\uBA54\uC2DC\uC9C0 \uC785\uB825...'
  updateRoomLocBtn()
  fetchChat()
  closeRoomLocPanel()
}

function updateRoomLocBtn(){
  const btn=document.getElementById('room-loc-btn')
  if(!S.currentRoomData){btn.style.display='none';return}
  btn.style.display='flex'
  const active=S.currentRoomData.locShare
  btn.classList.toggle('on',active)
  document.getElementById('room-loc-btn-text').textContent=active?'\uC704\uCE58\uACF5\uC720 ON':'\uC704\uCE58\uACF5\uC720 OFF'
}

async function toggleRoomLocShare(){
  if(!S.currentRoom||!S.currentRoomData)return
  const newState=!S.currentRoomData.locShare
  try{
    const r=await api('/api/rooms/'+S.currentRoom+'/locshare',{method:'POST',body:JSON.stringify({enabled:newState})})
    const d=await r.json()
    S.currentRoomData.locShare=d.locShare
    const rm=S.rooms.find(r=>r.roomId===S.currentRoom);if(rm)rm.locShare=d.locShare
    S._roomsHash=''  // \uAC15\uC81C \uC0C8\uB85C\uACE0\uCE68
    updateRoomLocBtn()
    showToast(d.locShare?'\u{1F4CD} \uC704\uCE58 \uACF5\uC720 \uCF1C\uC9D0 \u2014 \uBA64\uBC84 \uC704\uCE58\uAC00 \uACF5\uC720\uB429\uB2C8\uB2E4':'\u{1F515} \uC704\uCE58 \uACF5\uC720 \uAEBC\uC9D0',d.locShare?'success':'info')
    if(d.locShare){fetchRoomLocations();showRoomLocPanel()}else{closeRoomLocPanel()}
  }catch(e){showToast('\uC124\uC815 \uC2E4\uD328','error')}
}

async function fetchRoomLocations(){
  if(!S.currentRoom||!S.currentRoomData?.locShare)return
  try{
    const r=await api('/api/rooms/'+S.currentRoom+'/locations')
    const d=await r.json()
    if(!d.locShare){closeRoomLocPanel();return}
    renderRoomLocPanel(d.locations||[])
  }catch(e){}
}

function showRoomLocPanel(){S.locPanelOpen=true;document.getElementById('room-loc-panel').classList.add('show')}
function closeRoomLocPanel(){S.locPanelOpen=false;document.getElementById('room-loc-panel').classList.remove('show')}

function renderRoomLocPanel(locs){
  const el=document.getElementById('room-loc-list')
  if(!locs.length){el.innerHTML='<div style="color:var(--text3);font-size:12px;text-align:center;padding:16px">\uC544\uC9C1 \uC704\uCE58 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4<br/><small style="font-size:11px">\uB0B4 \uC704\uCE58 \uACF5\uC720\uB97C \uCF1C\uB450\uBA74 \uC790\uB3D9\uC73C\uB85C \uD45C\uC2DC\uB429\uB2C8\uB2E4</small></div>';return}
  el.innerHTML=locs.map(l=>{
    const ago=Math.floor((Date.now()-l.updatedAt)/1000)
    const agoStr=ago<60?ago+'\uCD08 \uC804':Math.floor(ago/60)+'\uBD84 \uC804'
    const isMe=l.userId===S.userId
    return '<div class="room-loc-item" onclick="focusLocOnMap('+l.lat+','+l.lng+')"><div class="room-loc-avatar">'+esc(l.avatar||'\u{1F43B}')+'</div><div class="room-loc-info"><div class="room-loc-name">'+esc(l.displayName)+(isMe?' (\uB098)':'')+'</div><div class="room-loc-time">'+agoStr+'</div></div><i class="fas fa-chevron-right room-loc-arrow"></i></div>'
  }).join('')
}

function focusLocOnMap(lat,lng){switchTab('map');setTimeout(()=>{if(S.map&&typeof kakao!=='undefined'){S.map.setCenter(new kakao.maps.LatLng(lat,lng));S.map.setLevel(4)}},100)}

// 1:1 \uCC44\uD305 (DM)
async function openDM(uid,name,avatar){
  try{
    const r=await api('/api/rooms/dm',{method:'POST',body:JSON.stringify({targetUserId:uid})})
    const d=await r.json()
    if(!r.ok){showToast('\uCC44\uD305 \uC5F4\uAE30 \uC2E4\uD328','error');return}
    if(!S.rooms.find(r=>r.roomId===d.room.roomId)){S.rooms.unshift(d.room);S._roomsHash='';renderChatRooms()}
    switchTab('chat')
    setTimeout(()=>selectRoom(d.room.roomId,name),100)
  }catch(e){showToast('\uC624\uB958 \uBC1C\uC0DD','error')}
}

function openCreateRoom(){
  const list=document.getElementById('member-select-list')
  list.innerHTML=S.friends.map(f=>'<div class="member-select-item" data-uid="'+f.userId+'" onclick="toggleMemberSelect(this)"><div class="member-select-check"></div><span style="font-size:18px">'+esc(f.avatar||'\u{1F43B}')+'</span><div><div style="font-size:14px;font-weight:600">'+esc(f.displayName)+'</div><div style="font-size:12px;color:var(--text2)">@'+esc(f.userId)+'</div></div></div>').join('')
  document.getElementById('create-room-panel').classList.add('show')
}
function closeCreateRoom(){document.getElementById('create-room-panel').classList.remove('show')}
function toggleMemberSelect(el){el.classList.toggle('selected')}

async function createRoom(){
  const name=document.getElementById('new-room-name').value.trim()
  const selected=[...document.querySelectorAll('.member-select-item.selected')].map(el=>el.dataset.uid)
  if(!selected.length){showToast('\uCE5C\uAD6C\uB97C 1\uBA85 \uC774\uC0C1 \uC120\uD0DD\uD574\uC8FC\uC138\uC694','error');return}
  if(selected.length===1&&!name){
    const f=S.friends.find(x=>x.userId===selected[0])
    if(f){closeCreateRoom();openDM(f.userId,f.displayName,f.avatar||'\u{1F43B}');return}
  }
  if(!name){showToast('\uCC44\uD305\uBC29 \uC774\uB984\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694','error');return}
  try{
    const r=await api('/api/rooms',{method:'POST',body:JSON.stringify({name,memberIds:selected})})
    const d=await r.json()
    if(!r.ok){showToast('\uC0DD\uC131 \uC2E4\uD328','error');return}
    closeCreateRoom();document.getElementById('new-room-name').value=''
    S.rooms.unshift(d.room);S._roomsHash='';renderChatRooms()
    showToast('\u{1F4AC} \uCC44\uD305\uBC29 "'+esc(name)+'" \uC0DD\uC131!','success')
    setTimeout(()=>selectRoom(d.room.roomId,d.room.name),200)
  }catch(e){showToast('\uC0DD\uC131 \uC2E4\uD328','error')}
}

async function leaveRoom(roomId){
  if(!roomId||!confirm('\uCC44\uD305\uBC29\uC5D0\uC11C \uB098\uAC00\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?'))return
  try{
    await api('/api/rooms/'+roomId+'/leave',{method:'POST'})
    S.rooms=S.rooms.filter(r=>r.roomId!==roomId);S._roomsHash=''
    renderChatRooms()
    if(S.currentRoom===roomId){S.currentRoom=null;S.currentRoomData=null;document.getElementById('chat-room-name').textContent='\uCC44\uD305\uBC29\uC744 \uC120\uD0DD\uD558\uC138\uC694';document.getElementById('chat-msgs').innerHTML='<div class="empty-state" style="margin:auto"><div class="e-icon">\u{1F4AC}</div><p>\uCC44\uD305\uBC29\uC744 \uC120\uD0DD\uD558\uAC70\uB098<br/>\uC0C8\uB85C \uB9CC\uB4E4\uC5B4\uBCF4\uC138\uC694</p></div>';document.getElementById('chat-input').disabled=true;document.getElementById('room-loc-btn').style.display='none';closeRoomLocPanel()}
    showToast('\uCC44\uD305\uBC29 \uB098\uAC00\uAE30 \uC644\uB8CC','info')
  }catch(e){showToast('\uC2E4\uD328','error')}
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  \uCC44\uD305 \uBA54\uC2DC\uC9C0 (DocumentFragment \uCD5C\uC801\uD654)
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
async function fetchChat(){
  if(!S.token||!S.currentRoom)return
  const roomId=S.currentRoom
  try{
    const r=await api('/api/chat/'+roomId+'?since='+S.lastChatTs)
    if(!r.ok)return
    const d=await r.json()
    const msgs=d.messages||[]
    if(!msgs.length)return
    const container=document.getElementById('chat-msgs')
    const isAtBottom=container.scrollHeight-container.scrollTop-container.clientHeight<60
    const frag=document.createDocumentFragment()
    let hasNew=false
    for(const m of msgs){
      if(m.timestamp>S.lastChatTs){
        S.lastChatTs=Math.max(S.lastChatTs,m.timestamp);hasNew=true
        frag.appendChild(buildMsgEl(m))
      }
    }
    if(hasNew){
      // \uCD08\uAE30 \uB85C\uB4DC \uC2DC empty-state \uC81C\uAC70
      const empty=container.querySelector('.empty-state')
      if(empty)empty.remove()
      container.appendChild(frag)
      if(isAtBottom)container.scrollTop=container.scrollHeight
      const activeTab=document.querySelector('.tab-btn.active')?.id
      if(activeTab!=='tbtn-chat'||S.currentRoom!==roomId){
        S.unreadChat++;S.roomUnread[roomId]=(S.roomUnread[roomId]||0)+1
        const b=document.getElementById('chat-tbadge');b.style.display='flex';b.textContent=S.unreadChat>9?'9+':S.unreadChat
        renderChatRooms()
      }
    }
  }catch(e){}
}

function buildMsgEl(m){
  const isMe=m.userId===S.userId
  const isSys=m.type==='system'
  const isSOS=m.type==='sos'
  const t=new Date(m.timestamp).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})
  const div=document.createElement('div')
  if(isSys){div.className='msg-system';div.textContent=m.message;return div}
  if(!isSOS&&m.type!=='location'){
    if(isMe&&S.lat&&S.lng)showMapBubble(m.userId,m.message,S.lat,S.lng)
    else{const fr=S.friends.find(f=>f.userId===m.userId);if(fr?.location)showMapBubble(m.userId,m.message,fr.location.lat,fr.location.lng)}
  }
  div.className=isSOS?'msg-row msg-sos':isMe?'msg-row me':'msg-row'
  div.innerHTML=(isMe?'':'<div class="msg-avatar">'+esc(m.avatar||'\u{1F43B}')+'</div>')
    +'<div class="msg-body">'+(isMe?'':'<div class="msg-sender">'+esc(m.userName)+'</div>')
    +'<div style="display:flex;align-items:flex-end;gap:4px'+(isMe?';flex-direction:row-reverse':'')+'"><div class="msg-bubble">'+esc(m.message)+'</div><div class="msg-time">'+t+'</div></div></div>'
  return div
}

async function sendChat(){
  const input=document.getElementById('chat-input')
  const msg=input.value.trim();if(!msg||!S.currentRoom)return
  input.value=''
  try{await api('/api/chat',{method:'POST',body:JSON.stringify({roomId:S.currentRoom,message:msg})});fetchChat()}catch(e){showToast('\uC804\uC1A1 \uC2E4\uD328','error')}
}
async function shareMyLocInChat(){
  if(!S.lat){showToast('\uC704\uCE58\uB97C \uAC00\uC838\uC624\uB294 \uC911...','info');return}
  if(!S.currentRoom){showToast('\uCC44\uD305\uBC29\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694','info');return}
  const msg='\u{1F4CD} \uB0B4 \uD604\uC7AC \uC704\uCE58 https://map.kakao.com/link/map/'+encodeURIComponent(S.displayName)+','+S.lat+','+S.lng
  try{await api('/api/chat',{method:'POST',body:JSON.stringify({roomId:S.currentRoom,message:msg,type:'location'})});fetchChat()}catch(e){}
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  SOS
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
async function sendSOS(){
  if(!confirm('\u{1F198} SOS\uB97C \uBAA8\uB4E0 \uCE5C\uAD6C\uC5D0\uAC8C \uBCF4\uB0B4\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?'))return
  try{
    const r=await api('/api/sos',{method:'POST',body:JSON.stringify({lat:S.lat,lng:S.lng})})
    const d=await r.json()
    showToast('\u{1F198} SOS \uC804\uC1A1 \uC644\uB8CC!','sos')
    S.activeSOS={sosId:d.sosId,fromUserId:S.userId,fromName:S.displayName,isMe:true}
    showSOSBanner(S.displayName+'\uB2D8(\uB098)\uC758 SOS\uAC00 \uBC1C\uC2E0\uB418\uC5C8\uC2B5\uB2C8\uB2E4','\uB0B4 SOS \uD65C\uC131 \uC911',true)
  }catch(e){showToast('SOS \uC804\uC1A1 \uC2E4\uD328','error')}
}
function showSOSBanner(msg,title,isMe){
  document.getElementById('sos-banner-title-text').textContent='\u{1F198} '+(title||'SOS \uAE34\uAE09 \uC54C\uB9BC')
  document.getElementById('sos-banner-msg').textContent=msg
  document.getElementById('sos-ack-btn').style.display=isMe?'none':'flex'
  document.getElementById('sos-dismiss-btn').style.display=isMe?'flex':'none'
  document.getElementById('sos-banner').classList.add('show')
  document.getElementById('screen-main').style.paddingTop='100px'
  if(navigator.vibrate)navigator.vibrate([400,150,400,150,400,150,800])
  if(Notification.permission==='granted'&&!isMe)new Notification('\u{1F198} SOS \uAE34\uAE09 \uC54C\uB9BC',{body:msg,icon:'/icon-192.png',tag:'sos',requireInteraction:true})
  startTitleBlink('\u{1F198} SOS!')
}
function hideSOSBanner(){document.getElementById('sos-banner').classList.remove('show');document.getElementById('screen-main').style.paddingTop='';S.activeSOS=null;stopTitleBlink()}
let _titleTimer=null,_origTitle='\uBAA8\uC5EC\uBD10'
function startTitleBlink(msg){stopTitleBlink();let on=true;_titleTimer=setInterval(()=>{document.title=on?msg:_origTitle;on=!on},800)}
function stopTitleBlink(){if(_titleTimer){clearInterval(_titleTimer);_titleTimer=null};document.title=_origTitle}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('sos-ack-btn').addEventListener('click',async()=>{
    if(!S.activeSOS)return
    await api('/api/sos/acknowledge',{method:'POST',body:JSON.stringify({sosId:S.activeSOS.sosId})})
    showToast('\u2705 SOS \uD655\uC778 \uC644\uB8CC','success');hideSOSBanner()
  })
  document.getElementById('sos-dismiss-btn').addEventListener('click',async()=>{
    if(!S.activeSOS)return
    await api('/api/sos/dismiss',{method:'POST',body:JSON.stringify({sosId:S.activeSOS.sosId})})
    showToast('\u{1F7E2} SOS \uC885\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4','success');hideSOSBanner()
  })
})

async function fetchSOSCheck(){
  if(!S.token)return
  try{
    const r=await api('/api/sos/check?since='+S.lastSOSTs)
    const d=await r.json()
    for(const s of (d.sos||[])){
      if(s.timestamp>S.lastSOSTs){
        S.lastSOSTs=Math.max(S.lastSOSTs,s.timestamp)
        if(s.userId!==S.userId&&s.active!==false&&(!S.activeSOS||S.activeSOS.sosId!==s.sosId)){
          S.activeSOS={sosId:s.sosId,fromUserId:s.userId,fromName:s.userName,isMe:false}
          showSOSBanner(s.message,s.userName+'\uB2D8\uC758 SOS!',false)
        }
        if(S.activeSOS&&S.activeSOS.sosId===s.sosId&&s.active===false){hideSOSBanner();showToast('\u{1F7E2} SOS\uAC00 \uC885\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4','info')}
      }
    }
  }catch(e){}
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  \uC57D\uC18D\uC7A5\uC18C
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
async function searchPlace(){
  const kw=document.getElementById('place-input').value.trim()
  if(!kw)return
  if(typeof kakao==='undefined'||!kakao.maps){showToast('\uCE74\uCE74\uC624\uB9F5 API \uD0A4 \uD544\uC694','error');return}
  const ps=new kakao.maps.services.Places()
  ps.keywordSearch(kw,(result,status)=>{
    if(status!==kakao.maps.services.Status.OK){showToast('\uAC80\uC0C9 \uACB0\uACFC \uC5C6\uC74C','info');return}
    window._plRes=result
    const el=document.getElementById('place-results');el.style.display='block'
    el.innerHTML=result.slice(0,5).map((p,i)=>'<div class="place-item" onclick="selectPlace('+i+')"><div class="pname">'+esc(p.place_name)+'</div><div class="paddr">'+esc(p.address_name)+'</div></div>').join('')
  },{location:S.lat?new kakao.maps.LatLng(S.lat,S.lng):undefined})
}
function selectPlace(i){const p=window._plRes[i];S.selectedPlace={name:p.place_name,lat:parseFloat(p.y),lng:parseFloat(p.x),address:p.address_name};document.getElementById('place-results').style.display='none';showSelectedPlace()}
function showSelectedPlace(){if(!S.selectedPlace)return;const el=document.getElementById('selected-place');el.style.display='block';document.getElementById('sp-name').textContent=S.selectedPlace.name;document.getElementById('sp-addr').textContent=S.selectedPlace.address||S.selectedPlace.lat.toFixed(5)+', '+S.selectedPlace.lng.toFixed(5)}
async function setAppointment(){
  if(!S.selectedPlace){showToast('\uC7A5\uC18C\uB97C \uBA3C\uC800 \uC120\uD0DD\uD574\uC8FC\uC138\uC694','error');return}
  const roomId='apt_'+[S.userId,...S.friends.map(f=>f.userId)].sort().join('_')
  try{await api('/api/appointment',{method:'POST',body:JSON.stringify({roomId,placeName:S.selectedPlace.name,lat:S.selectedPlace.lat,lng:S.selectedPlace.lng})});showToast('\u{1F4CC} \uC57D\uC18D\uC7A5\uC18C \uC9C0\uC815 \uC644\uB8CC!','success');await fetchAppointment()}catch(e){showToast('\uC9C0\uC815 \uC2E4\uD328','error')}
}
async function fetchAppointment(){
  if(!S.token||!S.friends.length)return
  const roomId='apt_'+[S.userId,...S.friends.map(f=>f.userId)].sort().join('_')
  try{const r=await api('/api/appointment/'+roomId);const d=await r.json();S.appointment=d.appointment;if(d.appointment)updateAptUI(d.appointment)}catch(e){}
}
function updateAptUI(apt){
  document.getElementById('apt-chip').style.display='flex'
  document.getElementById('apt-chip-name').textContent=apt.placeName
  document.getElementById('cur-apt-card').style.display='block'
  document.getElementById('cur-apt-name').textContent=apt.placeName
  if(S.map&&typeof kakao!=='undefined'){
    if(S.aptMarker)S.aptMarker.setMap(null)
    const el=document.createElement('div');el.style.cssText='background:linear-gradient(135deg,#ef4444,#dc2626);color:white;padding:5px 11px;border-radius:11px;font-size:12px;font-weight:700;box-shadow:0 4px 16px rgba(239,68,68,0.5);white-space:nowrap';el.textContent='\u{1F4CC} '+apt.placeName
    S.aptMarker=new kakao.maps.CustomOverlay({position:new kakao.maps.LatLng(apt.lat,apt.lng),content:el,yAnchor:1.6});S.aptMarker.setMap(S.map)
  }
}
function focusApt(){if(!S.appointment||!S.map||typeof kakao==='undefined')return;S.map.setCenter(new kakao.maps.LatLng(S.appointment.lat,S.appointment.lng));S.map.setLevel(4);switchTab('map')}
function goToApptTab(){switchTab('appt');openTransit()}
async function findMidpoint(){
  if(!S.lat){showToast('\uB0B4 \uC704\uCE58\uB97C \uBA3C\uC800 \uAC00\uC838\uC640\uC8FC\uC138\uC694','info');return}
  const locs=[{lat:S.lat,lng:S.lng},...S.friends.filter(f=>f.location).map(f=>f.location)]
  if(locs.length<2){showToast('\uCE5C\uAD6C\uC758 \uC704\uCE58 \uC815\uBCF4\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4','info');return}
  const midLat=locs.reduce((s,l)=>s+l.lat,0)/locs.length
  const midLng=locs.reduce((s,l)=>s+l.lng,0)/locs.length
  let name=midLat.toFixed(4)+', '+midLng.toFixed(4)
  if(typeof kakao!=='undefined'&&kakao.maps){
    const geo=new kakao.maps.services.Geocoder()
    geo.coord2Address(midLng,midLat,(res,st)=>{if(st===kakao.maps.services.Status.OK&&res[0])name=res[0].address.address_name;S.midpointData={name,lat:midLat,lng:midLng};document.getElementById('midpoint-result').style.display='block';document.getElementById('mp-name').textContent=name})
  } else {S.midpointData={name,lat:midLat,lng:midLng};document.getElementById('midpoint-result').style.display='block';document.getElementById('mp-name').textContent=name}
}
function setMidpointAsApt(){if(!S.midpointData)return;S.selectedPlace={name:S.midpointData.name,lat:S.midpointData.lat,lng:S.midpointData.lng,address:''};showSelectedPlace();setAppointment()}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  \uB300\uC911\uAD50\uD1B5
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
async function openTransit(){
  if(!S.appointment){showToast('\uC57D\uC18D\uC7A5\uC18C\uB97C \uBA3C\uC800 \uC9C0\uC815\uD574\uC8FC\uC138\uC694','info');return}
  if(!S.lat){showToast('\uB0B4 \uC704\uCE58\uB97C \uAC00\uC838\uC624\uB294 \uC911\uC785\uB2C8\uB2E4','info');return}
  const panel=document.getElementById('transit-panel');panel.style.display='block'
  document.getElementById('transit-spinner').style.display='block'
  document.getElementById('transit-results').innerHTML=''
  try{const r=await api('/api/transit?sx='+S.lng+'&sy='+S.lat+'&ex='+S.appointment.lng+'&ey='+S.appointment.lat);const d=await r.json();document.getElementById('transit-spinner').style.display='none';renderTransit(d)}catch(e){document.getElementById('transit-spinner').style.display='none';document.getElementById('transit-results').innerHTML='<p style="color:var(--text2);text-align:center;padding:16px;font-size:13px">\uC870\uD68C \uC2E4\uD328</p>'}
}
function closeTransit(){document.getElementById('transit-panel').style.display='none'}
function renderTransit(data){
  const el=document.getElementById('transit-results');let html=''
  if(data.demo)html+='<div class="transit-demo-note">\u26A0\uFE0F \uB370\uBAA8 \uB370\uC774\uD130 \u2014 ODsay API \uD0A4 \uC124\uC815 \uC2DC \uC2E4\uC81C \uACBD\uB85C \uC870\uD68C</div>'
  const paths=(data.result?.path||[]).slice(0,3)
  if(!paths.length){el.innerHTML='<p style="color:var(--text2);text-align:center;padding:16px;font-size:13px">\uACBD\uB85C \uC5C6\uC74C</p>';return}
  const typeMap={1:'\uC9C0\uD558\uCCA0',2:'\uBC84\uC2A4+\uC9C0\uD558\uCCA0',3:'\uBC84\uC2A4'}
  html+=paths.map(p=>{
    const info=p.info
    const steps=(p.subPath||[]).filter(sp=>sp.trafficType!==3).map(sp=>{const isS=sp.trafficType===1;const name=isS?(sp.lane?.[0]?.name||'\uC9C0\uD558\uCCA0'):(sp.lane?.[0]?.busNo||'\uBC84\uC2A4');return '<div class="step-chip '+(isS?'subway':'bus')+'">'+(isS?'\u{1F687}':'\u{1F68C}')+' '+name+'</div>'}).join('<span style="color:var(--text3);font-size:11px">\u25B8</span>')
    return '<div class="transit-route"><div class="transit-top"><div class="transit-time">'+info.totalTime+'<span style="font-size:13px;font-weight:500;color:var(--text2)">\uBD84</span></div><div class="transit-tag">'+(typeMap[p.pathType]||'\uB300\uC911\uAD50\uD1B5')+'</div></div><div class="transit-steps">'+steps+'</div><div class="transit-meta"><span>\u{1F4B0} '+((info.payment||0).toLocaleString())+'\uC6D0</span><span>\u{1F687} '+info.subwayTransitCount+'\uD68C</span><span>\u{1F68C} '+info.busTransitCount+'\uD68C</span></div></div>'
  }).join('')
  el.innerHTML=html
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  UI \uC720\uD2F8
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function switchTab(tab){
  ['map','chat','appt','friends'].forEach(t=>{document.getElementById('tab-'+t).classList.toggle('active',t===tab);document.getElementById('tbtn-'+t).classList.toggle('active',t===tab)})
  if(tab==='chat'){S.unreadChat=0;const b=document.getElementById('chat-tbadge');b.style.display='none';setTimeout(()=>{const m=document.getElementById('chat-msgs');m.scrollTop=m.scrollHeight},100)}
  if(tab==='map'&&S.map&&typeof kakao!=='undefined')kakao.maps.event.trigger(S.map,'resize')
  if(tab==='friends'){S._reqHash='';S._friendsHash='';fetchFriends();fetchFriendRequests()}
}
let _toastTimer=null
function showToast(msg,type='info'){const el=document.getElementById('toast');el.className='toast show'+(type?' '+type:'');el.textContent=msg;clearTimeout(_toastTimer);_toastTimer=setTimeout(()=>{el.className='toast'},3000)}
function showProfileModal(){document.getElementById('profile-modal').classList.add('show')}
function closeProfileModal(e){if(e.target===document.getElementById('profile-modal'))document.getElementById('profile-modal').classList.remove('show')}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  DOM Ready
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('chat-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()}})
  document.getElementById('place-input').addEventListener('keydown',e=>{if(e.key==='Enter')searchPlace()})
  document.getElementById('friend-id-input').addEventListener('keydown',e=>{if(e.key==='Enter')sendFriendReq()})
  document.getElementById('chat-room-select').addEventListener('click',e=>{
    const chip=e.target.closest('.room-chip')
    if(chip&&chip.dataset.room)selectRoom(chip.dataset.room,chip.dataset.name||chip.dataset.room)
  })
  initAuth()
  if(Notification.permission==='default')Notification.requestPermission()
})
<\/script>
</body>
</html>`;
}
__name(ir, "ir");
__name2(ir, "ir");
var Ye = new vt();
var lr = Object.assign({ "/src/index.tsx": v });
var wt = false;
for (const [, e] of Object.entries(lr)) e && (Ye.all("*", (t) => {
  let r;
  try {
    r = t.executionCtx;
  } catch {
  }
  return e.fetch(t.req.raw, t.env, r);
}), Ye.notFound((t) => {
  let r;
  try {
    r = t.executionCtx;
  } catch {
  }
  return e.fetch(t.req.raw, t.env, r);
}), wt = true);
if (!wt) throw new Error("Can't import modules from ['/src/index.ts','/src/index.tsx','/app/server.ts']");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = Ye;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// node_modules/wrangler/templates/pages-dev-util.ts
function isRoutingRuleMatch(pathname, routingRule) {
  if (!pathname) {
    throw new Error("Pathname is undefined.");
  }
  if (!routingRule) {
    throw new Error("Routing rule is undefined.");
  }
  const ruleRegExp = transformRoutingRuleToRegExp(routingRule);
  return pathname.match(ruleRegExp) !== null;
}
__name(isRoutingRuleMatch, "isRoutingRuleMatch");
function transformRoutingRuleToRegExp(rule) {
  let transformedRule;
  if (rule === "/" || rule === "/*") {
    transformedRule = rule;
  } else if (rule.endsWith("/*")) {
    transformedRule = `${rule.substring(0, rule.length - 2)}(/*)?`;
  } else if (rule.endsWith("/")) {
    transformedRule = `${rule.substring(0, rule.length - 1)}(/)?`;
  } else if (rule.endsWith("*")) {
    transformedRule = rule;
  } else {
    transformedRule = `${rule}(/)?`;
  }
  transformedRule = `^${transformedRule.replaceAll(/\./g, "\\.").replaceAll(/\*/g, ".*")}$`;
  return new RegExp(transformedRule);
}
__name(transformRoutingRuleToRegExp, "transformRoutingRuleToRegExp");

// .wrangler/tmp/pages-v33l1c/d627ww5bri7.js
var define_ROUTES_default = { version: 1, include: ["/*"], exclude: ["/static/*", "/icon-*.png", "/manifest.json", "/.well-known/*"] };
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = middleware_loader_entry_default;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-6f5498/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = pages_dev_pipeline_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-6f5498/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=d627ww5bri7.js.map
