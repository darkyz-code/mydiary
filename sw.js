'use strict';
// offline cache for My Diary (iPhone). The version changes with every build so updates arrive.
const CACHE = 'mydiary-202611051208';
const FILES = ["./", "apple-touch-icon.png", "fonts/Inter-LICENSE.txt", "fonts/InterVariable.ttf", "icon-192.png", "icon-512.png", "icon.svg", "index.html", "js/app.js", "js/articles.js", "js/care-coupons.js", "js/caseart.js", "js/catalog.js", "js/charts.js", "js/components.js", "js/dishart.js", "js/game.js", "js/icons.js", "js/journal-data.js", "js/metrics.js", "js/mobile.js", "js/photos.js", "js/recipes-d1.js", "js/recipes-d2.js", "js/recipes-d3.js", "js/recipes.js", "js/relics.js", "js/report.js", "js/silhouette.js", "js/sleepline.js", "js/spinners.js", "js/store.js", "js/tests-data.js", "js/util.js", "js/views/analytics.js", "js/views/calendar.js", "js/views/day.js", "js/views/export.js", "js/views/games.js", "js/views/home.js", "js/views/journal.js", "js/views/library.js", "js/views/profile.js", "js/views/settings.js", "js/views/tests.js", "js/webapi.js", "manifest.webmanifest", "mobile.css", "silver.css", "styles.css"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(resp => { const copy = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return resp; }).catch(() => caches.match('./index.html'))));
});
