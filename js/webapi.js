'use strict';
/* Web (iPhone) replacement for the desktop bridge: data in IndexedDB on the phone, files via the share sheet. */
(function () {
  const DB = 'mydiary', ST = 'kv';
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(ST); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const tx = (mode, fn) => db().then(d => new Promise((res, rej) => { const t = d.transaction(ST, mode); const s = t.objectStore(ST); const out = fn(s); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); }));
  const get = k => db().then(d => new Promise((res, rej) => { const r = d.transaction(ST).objectStore(ST).get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const put = (k, v) => tx('readwrite', s => s.put(v, k));
  const del = k => tx('readwrite', s => s.delete(k));
  const keys = () => db().then(d => new Promise((res, rej) => { const r = d.transaction(ST).objectStore(ST).getAllKeys(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const today = () => { const t = new Date(), p = n => String(n).padStart(2, '0'); return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`; };
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

  async function shareOrDownload(name, blob) {
    const file = new File([blob], name, { type: blob.type });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return true; } } catch (e) { if (e && e.name === 'AbortError') return false; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    return true;
  }
  function pickFile(accept) {
    return new Promise(res => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.style.display = 'none';
      i.onchange = () => { const f = i.files && i.files[0]; i.remove(); res(f || null); };
      document.body.appendChild(i); i.click();
    });
  }

  window.api = {
    isWeb: true,
    async load() {
      let raw = null;
      try { raw = await get('data'); } catch (e) {}
      if (!raw) { try { raw = localStorage.getItem('healthDiary'); } catch (e) {} }
      try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    },
    async save(obj) {
      const s = JSON.stringify(obj);
      await put('data', s);
      // one rolling backup per day, keep the last 14
      try {
        const k = 'backup:' + today();
        if (!(await get(k))) {
          await put(k, s);
          const bs = (await keys()).filter(x => String(x).startsWith('backup:')).sort();
          for (const old of bs.slice(0, Math.max(0, bs.length - 14))) await del(old);
        }
      } catch (e) {}
      return true;
    },
    openFolder() {},
    async exportBackup(obj) {
      const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
      const ok = await shareOrDownload(`MyDiary-backup-${today()}.json`, blob);
      if (ok) { try { obj.settings.lastExport = today(); } catch (e) {} }
      return ok;
    },
    async importBackup() {
      const f = await pickFile('.json,application/json,text/plain');
      if (!f) return null;
      try { return JSON.parse(await f.text()); } catch (e) { return {}; }
    },
    async exportPdf(html, fileName) {
      // iPhone: print sheet → «Сохранить в Файлы» as PDF
      const fr = document.createElement('iframe');
      fr.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0';
      document.body.appendChild(fr);
      fr.srcdoc = html;
      await new Promise(r => fr.onload = r);
      try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { await shareOrDownload((fileName || 'MyDiary') + '.html', new Blob([html], { type: 'text/html' })); }
      setTimeout(() => fr.remove(), 60000);
      return true;
    },
    photoSave: (id, dataUrl) => put('photo:' + id, dataUrl),
    photoLoad: id => get('photo:' + id),
    photoRemove: id => del('photo:' + id),
    win: { minimize() {}, maximize() {}, close() {}, isMaximized: async () => false, fullscreen() {}, onState() {} },
  };
})();
