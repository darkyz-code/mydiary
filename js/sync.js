'use strict';
/* Phone ⇄ computer sync.
   The whole diary is encrypted on the device (PBKDF2 → AES-GCM, password known only to the user)
   and stored only as ciphertext on the app's own server (see worker.js). Each device keeps a compact
   "base" (hashes of what was last synced), which allows a three-way merge: changes made on both
   devices since the last sync are combined field by field; deletions propagate. */
(function (H) {
  const KEY = 'mydiary.sync2';         // connection settings (account, key, password) — never part of the diary data or backups
  const BASE = 'mydiary.syncBase';     // hash tree of the last synced state
  const FILE = 'diary.enc';
  const ITER = 210000;
  // per-device settings that should not travel between phone and computer
  const DEVICE_ONLY = ['fontScale', 'glass', 'pinSidebar', 'collapsed', 'lastExport', 'devMode', 'devUnlocked', 'syncLast', 'journalSideHidden', 'journalFolder'];

  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };
  const cfg = () => ls.get(KEY);

  // ---------- helpers
  const te = new TextEncoder(), td = new TextDecoder();
  function b64(bytes) { let s = ''; const CH = 0x8000; for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH)); return btoa(s); }
  function unb64(str) { const s = atob(str.replace(/\s+/g, '')); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; }
  function stable(v) {
    if (v === undefined) return 'u';
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  }
  function cyrb53(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  const hash = v => v === undefined ? '-' : cyrb53(stable(v));
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const isIdArr = v => Array.isArray(v) && v.length > 0 && v.every(x => isObj(x) && x.id != null);
  const empty = v => v === null || v === '' || (Array.isArray(v) && !v.length) || (isObj(v) && !Object.keys(v).length);
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));

  // ---------- hash tree of a state (what both sides agreed on at the last sync)
  function tree(v, depth = 0) {
    const n = { h: hash(v) };
    if (depth > 6) return n;
    if (isObj(v)) { n.k = {}; for (const k in v) if (v[k] !== undefined) n.k[k] = tree(v[k], depth + 1); }
    else if (isIdArr(v)) { n.a = 1; n.k = {}; v.forEach(x => { n.k['#' + x.id] = tree(x, depth + 1); }); }
    return n;
  }

  // ---------- three-way merge. `newer` decides true conflicts (same field changed on both devices).
  function merge3(base, L, R, newer) {
    const hL = hash(L), hR = hash(R), hB = base ? base.h : undefined;
    if (hL === hR) return L;
    if (hB !== undefined) { if (hL === hB) return R; if (hR === hB) return L; }
    if (isObj(L) && isObj(R)) {
      const out = {}; const keys = new Set([...Object.keys(L), ...Object.keys(R)]);
      keys.forEach(k => { const v = merge3(base && base.k ? base.k[k] : undefined, L[k], R[k], newer); if (v !== undefined) out[k] = v; });
      return out;
    }
    if ((isIdArr(L) || (Array.isArray(L) && !L.length)) && (isIdArr(R) || (Array.isArray(R) && !R.length)) && (isIdArr(L) || isIdArr(R))) {
      const mL = new Map(L.map(x => [String(x.id), x])), mR = new Map(R.map(x => [String(x.id), x]));
      const order = L.map(x => String(x.id)); R.forEach(x => { if (!mL.has(String(x.id))) order.push(String(x.id)); });
      const out = [];
      order.forEach(id => { const v = merge3(base && base.k ? base.k['#' + id] : undefined, mL.get(id), mR.get(id), newer); if (v !== undefined) out.push(v); });
      return out;
    }
    if (L === undefined) return R;       // removed on one side, edited on the other — keep the data
    if (R === undefined) return L;
    if (empty(L) && !empty(R)) return R; // a blank field never overwrites a filled one
    if (empty(R) && !empty(L)) return L;
    return newer === 'remote' ? R : L;
  }

  // ---------- explicit deletions ("clear the day"): a tombstone beats any copy that is older than it
  const TOMB_DAYS = 90;
  function tombstones(...objs) {
    const t = {};
    objs.forEach(o => { if (o && o._del) for (const k in o._del) t[k] = Math.max(t[k] || 0, o._del[k] || 0); });
    const cut = Date.now() - TOMB_DAYS * 86400000;
    for (const k in t) if (t[k] < cut) delete t[k];
    return t;
  }
  function applyTomb(obj, t) {
    if (!obj || !obj.days) return false;
    let changed = false;
    for (const k in t) {
      if (!k.startsWith('days:')) continue;
      const d = obj.days[k.slice(5)];
      if (d && (d.updatedAt || d.createdAt || 0) <= t[k]) { delete obj.days[k.slice(5)]; changed = true; }
    }
    return changed;
  }
  H.syncForget = function (date) { const s = H.store.get(); s._del = s._del || {}; s._del['days:' + date] = Date.now(); };

  // ---------- what is synced
  function strip(data) {
    const d = clone(data);
    if (d.settings) DEVICE_ONLY.forEach(k => delete d.settings[k]);
    delete d._syncMod;
    return d;
  }
  function restore(merged, local) {
    const d = clone(merged);
    d.settings = d.settings || {};
    DEVICE_ONLY.forEach(k => { if (local.settings && local.settings[k] !== undefined) d.settings[k] = local.settings[k]; });
    d._syncMod = local._syncMod;
    return d;
  }

  // ---------- encryption
  async function keyFor(pass, salt) {
    const base = await crypto.subtle.importKey('raw', te.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function gzip(bytes, inverse) {
    if (typeof CompressionStream === 'undefined') return null;
    const s = new Blob([bytes]).stream().pipeThrough(inverse ? new DecompressionStream('gzip') : new CompressionStream('gzip'));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  let keyCache = null; // {pass, salt, key}
  async function encrypt(obj, pass) {
    let salt;
    if (keyCache && keyCache.pass === pass) salt = keyCache.salt; else { salt = crypto.getRandomValues(new Uint8Array(16)); keyCache = { pass, salt, key: await keyFor(pass, salt) }; }
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const raw = te.encode(JSON.stringify(obj));
    const z = await gzip(raw);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, keyCache.key, z || raw));
    return JSON.stringify({ app: 'mydiary', v: 1, kdf: 'PBKDF2-SHA256', it: ITER, salt: b64(salt), iv: b64(iv), z: !!z, at: Date.now(), ct: b64(ct) });
  }
  async function decrypt(text, pass) {
    const f = JSON.parse(text);
    if (f.app !== 'mydiary') throw new Error('not-diary');
    const salt = unb64(f.salt);
    let key;
    if (keyCache && keyCache.pass === pass && b64(keyCache.salt) === f.salt) key = keyCache.key;
    else { key = await keyFor(pass, salt); keyCache = { pass, salt, key }; }
    let pt;
    try { pt = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(f.iv) }, key, unb64(f.ct))); }
    catch (e) { const er = new Error('bad-password'); er.code = 'bad-password'; throw er; }
    if (f.z) pt = await gzip(pt, true);
    return { obj: JSON.parse(td.decode(pt)), at: f.at || 0 };
  }

  // ---------- storage on the user's reminder/sync server, in small pieces
  const CHUNK = 9000;
  const SRV = () => (H.SERVER_URL || '').replace(/\/$/, '');
  const rid = (n = 24) => b64(crypto.getRandomValues(new Uint8Array(n))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  async function call(path, body) {
    let last;
    for (let attempt = 0; attempt < 3; attempt++) {
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const tm = ctl ? setTimeout(() => ctl.abort(), 15000) : null;
      try {
        const r = await fetch(SRV() + path, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined });
        const j = await r.json().catch(() => ({}));
        if (r.status === 409) { const e = new Error('conflict'); e.code = 'conflict'; e.ver = j.ver; throw e; }
        if (r.status === 403 || r.status === 400 && j.error === 'auth') { const e = new Error('auth'); e.code = 'bad-key'; throw e; }
        if (r.status === 429) { const e = new Error('full'); e.code = 'full'; throw e; }
        if (!r.ok) { const e = new Error('http ' + r.status); e.code = r.status >= 500 ? 'network' : 'server'; throw e; }
        return j;
      } catch (e) {
        last = e; if (e.code && e.code !== 'network') throw e;
        await new Promise(r => setTimeout(r, 700 * (attempt + 1)));
      } finally { if (tm) clearTimeout(tm); }
    }
    const e = new Error('network'); e.code = 'network'; e.cause = last; throw e;
  }
  const head = c => call('/s/head', { a: c.acct, k: c.key });
  async function readRemote(c, h) {
    if (!h.ver) return null;
    let text = '';
    for (let i = 0; i < h.parts; i++) text += (await call('/s/get', { a: c.acct, k: c.key, ver: h.ver, i })).d;
    return text;
  }
  async function writeRemote(c, text, base) {
    const up = rid(18), parts = Math.max(1, Math.ceil(text.length / CHUNK));
    for (let i = 0; i < parts; i++) await call('/s/put', { a: c.acct, k: c.key, up, i, d: text.slice(i * CHUNK, (i + 1) * CHUNK) });
    await call('/s/commit', { a: c.acct, k: c.key, base: base || null, up, parts, size: text.length });
    return up;
  }

  // ---------- state & status
  const state = { busy: false, last: null, error: null, listeners: new Set(), pending: false };
  const notify = () => state.listeners.forEach(fn => { try { fn(state); } catch (e) {} });
  const MSG = {
    'bad-password': 'Пароль не подходит к данным в облаке',
    'bad-key': 'Код подключения не подходит — возьми новый с другого устройства',
    'full': 'Сервер синхронизации заполнен — напиши его хозяйке',
    'server': 'Сервер синхронизации ответил ошибкой — попробую позже',
    'network': 'Нет связи с сервером — проверь интернет или включи ВПН; попробую ещё раз сама',
    'not-diary': 'В облаке лежит не дневник',
    'no-server': 'Синхронизация ещё не настроена в этой версии приложения',
  };
  const errText = e => (e && e.code === 'bad-code' ? 'Код не распознан — скопируй его целиком' : null) || MSG[e && e.code] || (e && /fetch|network|Failed/i.test(e.message) ? MSG.network : 'Не получилось: ' + (e && e.message || e));

  // ---------- the sync itself
  async function run(reason) {
    const c = cfg();
    if (!c || !c.acct || !c.key || !c.pass || !SRV()) return { skipped: true };
    if (state.busy) { state.pending = true; return { skipped: true }; }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { state.error = MSG.network; notify(); return { offline: true }; }
    state.busy = true; state.error = null; notify();
    let result = { changedLocal: false, uploaded: false };
    try {
      H.store.persistNow && H.store.persistNow();
      for (let attempt = 0; attempt < 3; attempt++) {
        const data = H.store.get();
        const local = strip(data);
        const base = ls.get(BASE + ':' + c.acct);
        const hd = await head(c);
        let merged, remoteHash = null;
        if (!hd.ver) merged = local;                                   // nothing in the cloud yet
        else if (base && cfg().ver === hd.ver) { merged = local; remoteHash = base.h; }   // cloud unchanged since our last sync
        else {
          const { obj: remote, at } = await decrypt(await readRemote(c, hd), c.pass);
          remoteHash = hash(remote);
          const t = tombstones(local, remote);
          applyTomb(local, t); applyTomb(remote, t);
          merged = merge3(base, local, remote, (data._syncMod || 0) >= at ? 'local' : 'remote');
          merged._del = t; if (!Object.keys(t).length) delete merged._del;
        }
        const hM = hash(merged);
        let ver = hd.ver;
        if (!hd.ver || hM !== remoteHash) {
          try { ver = await writeRemote(c, await encrypt(merged, c.pass), hd.ver); result.uploaded = true; }
          catch (e) { if (e.code === 'conflict' && attempt < 2) continue; throw e; }
        }
        if (hM !== hash(local)) { applyLocal(restore(merged, data)); result.changedLocal = true; }
        if (!ls.set(BASE + ':' + c.acct, tree(merged))) ls.set(BASE + ':' + c.acct, null);
        ls.set(KEY, { ...cfg(), ver });
        break;
      }
      state.last = Date.now(); ls.set(KEY, { ...cfg(), last: state.last });
    } catch (e) {
      console.warn('sync', reason, e); state.error = errText(e); result.error = e;
    } finally {
      state.busy = false; notify();
      if (state.pending) { state.pending = false; setTimeout(() => run('pending'), 1500); }
    }
    return result;
  }

  let applying = false;
  function applyLocal(obj) {
    applying = true;
    try {
      H.store.replace(obj);
      H.store.syncCustomEmotions && H.store.syncCustomEmotions();
      H.applySettings && H.applySettings();
    } finally { applying = false; }
    // refresh the screen unless she is typing right now
    const ae = document.activeElement;
    const typing = ae && (ae.tagName === 'TEXTAREA' || (ae.tagName === 'INPUT' && !/button|checkbox|radio|range/.test(ae.type)));
    if (!typing && H.refresh) H.refresh();
    if (H.ui && H.ui.toast) H.ui.toast('Подтянуты изменения с другого устройства', '⟳');
  }

  // ---------- automatic triggers
  let timer = null;
  function schedule(ms = 4000) { clearTimeout(timer); timer = setTimeout(() => { timer = null; run('auto'); }, ms); }
  function start() {
    if (!H.store || !H.store.onChange) return;
    H.store.onChange(() => { if (applying) return; const d = H.store.get(); d._syncMod = Date.now(); if (cfg()) schedule(); });
    if (cfg()) setTimeout(() => run('open'), 1800);
    document.addEventListener('visibilitychange', () => { if (!cfg()) return; if (document.visibilityState === 'hidden') { if (timer) { clearTimeout(timer); timer = null; run('hide'); } } else schedule(1500); });
    window.addEventListener('online', () => { if (cfg()) schedule(1000); });
    setInterval(() => { if (cfg() && document.visibilityState !== 'hidden') run('interval'); }, 60 * 1000);   // a quiet check is one tiny request
  }

  // ---------- connecting a device
  const CODE_PREFIX = 'MYDIARY-SYNC2:';
  function makeCode() { const c = cfg(); if (!c) return ''; return CODE_PREFIX + b64(te.encode(JSON.stringify({ a: c.acct, k: c.key }))).replace(/=+$/, ''); }
  function parseCode(code) {
    const s = String(code || '').replace(/\s+/g, '');
    if (!s.startsWith(CODE_PREFIX)) return null;
    try { const p = s.slice(CODE_PREFIX.length); const o = JSON.parse(td.decode(unb64(p + '==='.slice((p.length + 3) % 4)))); return o.a && o.k ? { acct: o.a, key: o.k } : null; } catch (e) { return null; }
  }
  // first device: code empty → new cloud space; other devices: code from the first one
  async function connect({ code, pass }) {
    if (!SRV()) { const e = new Error('no-server'); e.code = 'no-server'; throw e; }
    if (!pass || pass.length < 6) throw new Error('Пароль — минимум 6 символов');
    let c;
    if (code && String(code).trim()) { const p = parseCode(code); if (!p) { const e = new Error('code'); e.code = 'bad-code'; throw e; } c = { ...p, pass }; }
    else c = { acct: rid(18), key: rid(24), pass };
    const hd = await head(c);
    let remoteDays = null;
    if (hd.ver) { const d = await decrypt(await readRemote(c, hd), pass); remoteDays = Object.keys(d.obj.days || {}).length; }
    ls.set(BASE + ':' + c.acct, null);           // first sync on this device: everything is merged, nothing is lost
    ls.set(KEY, { ...c, since: Date.now(), ver: null });
    const res = await run('connect');
    return { remoteDays, res, created: !hd.ver };
  }
  function disconnect() { const c = cfg(); if (c) ls.set(BASE + ':' + c.acct, null); ls.set(KEY, null); state.last = null; state.error = null; notify(); }
  async function wipe() { const c = cfg(); if (!c) return; await call('/s/delete', { a: c.acct, k: c.key }); disconnect(); }

  H.sync = {
    run, start, connect, wipe, available: () => !!SRV(), dirty: () => !!timer || state.busy, disconnect, makeCode, parseCode, errText,
    config: () => { const c = cfg(); return c ? { last: c.last || null, since: c.since } : null; },
    state, onState: fn => { state.listeners.add(fn); return () => state.listeners.delete(fn); },
    _t: { merge3, tree, hash, strip, restore, encrypt, decrypt },
  };
})(window.H);
