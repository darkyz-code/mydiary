'use strict';
// offline cache for My Diary (iPhone). The version changes with every build so updates arrive.
const CACHE = 'mydiary-20261112-earned-accents-v1';
const FILES = ["./", "apple-touch-icon.png", "fonts/Inter-LICENSE.txt", "fonts/InterVariable.ttf", "icon-192.png", "icon-512.png", "icon.svg", "index.html", "js/app.js", "js/articles.js", "js/care-coupons.js", "js/caseart.js", "js/catalog.js", "js/charts.js", "js/components.js", "js/config.js", "js/game.js", "js/icons.js", "js/journal-data.js", "js/metrics.js", "js/mobile.js", "js/photos.js", "js/relics.js", "js/reminders.js", "js/report.js", "js/silhouette.js", "js/sleepline.js", "js/store.js", "js/sync.js", "js/tests-data.js", "js/util.js", "js/views/analytics.js", "js/views/calendar.js", "js/views/day.js", "js/views/export.js", "js/views/games.js", "js/views/home.js", "js/views/journal.js", "js/views/library.js", "js/views/profile.js", "js/views/settings.js", "js/views/sync-ui.js", "js/views/tests.js", "js/webapi.js", "manifest.webmanifest", "mobile.css", "silver.css", "styles.css"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;   // GitHub sync & reminders go straight to the network
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(resp => { const copy = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return resp; }).catch(() => caches.match('./index.html'))));
});

// ---------- medication reminders
// the server sends only the time; medicine names are taken from the diary stored on this phone
function readDiary() {
  return new Promise(res => {
    try {
      const r = indexedDB.open('mydiary', 1);
      r.onupgradeneeded = () => { try { r.result.createObjectStore('kv'); } catch (e) {} };
      r.onerror = () => res(null);
      r.onsuccess = () => { try { const g = r.result.transaction('kv').objectStore('kv').get('data'); g.onsuccess = () => { try { res(JSON.parse(g.result)); } catch (e) { res(null); } }; g.onerror = () => res(null); } catch (e) { res(null); } };
    } catch (e) { res(null); }
  });
}
const SLOTS = { 1: ['Утро'], 2: ['Утро', 'Вечер'], 3: ['Утро', 'День', 'Вечер'], 4: ['Утро', 'День', 'Вечер', 'Ночь'] };
const DEF = { 'утро': '09:00', 'день': '14:00', 'обед': '13:00', 'вечер': '21:00', 'ночь': '23:00', 'перед сном': '23:00' };
function slotTime(name, i, n) { const k = String(name || '').trim().toLowerCase(); if (/^\d{1,2}:\d{2}$/.test(k)) return k.padStart(5, '0'); if (DEF[k]) return DEF[k]; return ({ 1: ['09:00'], 2: ['09:00', '21:00'], 3: ['09:00', '14:00', '21:00'], 4: ['08:00', '13:00', '18:00', '23:00'] }[n] || ['09:00'])[i] || '09:00'; }
function today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
async function medText(t) {
  const data = await readDiary(); if (!data) return null;
  const names = !(data.settings && data.settings.remind && data.settings.remind.names === false);
  const date = today(); const hit = []; let slot = '';
  (data.meds || []).forEach(m => {
    if (m.active === false || m.asNeeded || m.noRemind === true || (m.start && m.start > date) || (m.end && m.end < date)) return;
    const n = Number(m.times) || 1; const sl = m.slots && m.slots.length === n ? m.slots : SLOTS[n] || ['Утро'];
    sl.forEach((sn, i) => { if (((m.remind && m.remind[i]) || slotTime(sn, i, n)) === t) { hit.push(m.name + (m.dose ? ' ' + m.dose + ' ' + (m.unit || 'мг') : '')); slot = sn; } });
  });
  if (!hit.length) return null;
  return names ? hit.join(', ') : '';
}
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (er) { d = { title: 'My Diary', body: e.data ? e.data.text() : '' }; }
  // short and plain: the title says what to do, the body lists the medicines (iOS adds the app name and icon itself)
  const isMed = d.kind === 'med' || d.tag === 'test';
  const title = d.tag === 'test' ? 'Пора выпить таблетки 💊' : d.kind === 'med' ? (d.again ? 'Не забудь выпить таблетки 💊' : 'Пора выпить таблетки 💊') : (d.title || 'My Diary');
  e.waitUntil((isMed ? medText(d.t).catch(() => null) : Promise.resolve(null)).then(body =>
    self.registration.showNotification(title, { body: d.tag === 'test' ? (body || 'Так будут выглядеть напоминания') : (body != null ? body : (isMed ? '' : d.body || '')), icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag || 'mydiary', renotify: true, data: { url: d.url || './?view=quick' } })));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './?view=quick', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) { c.postMessage({ type: 'open', view: 'quick' }); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
