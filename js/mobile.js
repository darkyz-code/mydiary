'use strict';
/* iPhone shell: bottom tab bar, «Ещё» sheet, quick check-in, weekly backup reminder. */
(function (H) {
  const { h, ui } = H;
  document.documentElement.classList.add('is-mobile');

  const TABS = [
    { id: 'home', ico: 'home', name: 'Главная' },
    { id: 'quick', ico: 'sun', name: 'Сегодня' },
    { id: 'calendar', ico: 'calendar', name: 'Календарь' },
    { id: 'journal', ico: 'feather', name: 'Заметки' },
    { id: 'more', ico: 'settings', name: 'Ещё' },
  ];
  const MORE = [
    { id: 'day', ico: 'clipboard', name: 'Полная анкета дня' },
    { id: 'analytics', ico: 'chart', name: 'Аналитика' },
    { id: 'profile', ico: 'card', name: 'Карточка здоровья' },
    { id: 'tests', ico: 'clipboard', name: 'Тесты' },
    { id: 'library', ico: 'book', name: 'Полезно знать' },
    { id: 'games', ico: 'gem', name: 'Мини-игры' },
    { id: 'export', ico: 'file', name: 'Выгрузка в PDF' },
    { id: 'settings', ico: 'settings', name: 'Настройки и перенос данных' },
  ];

  let cur = 'home';
  const bar = h('nav#mnav');
  function drawBar() {
    H.clear(bar);
    TABS.forEach(t => bar.appendChild(h('button.mn-it' + (cur === t.id || (t.id === 'more' && cur !== 'day' && MORE.some(m => m.id === cur)) || (t.id === 'quick' && cur === 'day') ? '.on' : ''), {
      onclick: () => { if (t.id === 'more') openMore(); else H.go(t.id, t.id === 'quick' ? { date: H.today() } : null); },
    }, H.icon(t.ico, 22), h('span', t.name))));
  }
  function openMore() {
    const sheet = h('div.msheet-back', { onclick: e => { if (e.target === sheet) close(); } },
      h('div.msheet.glass', h('div.ms-grip'),
        MORE.map(m => h('button.ms-it', { onclick: () => { close(); setTimeout(() => H.go(m.id, m.id === 'day' ? { date: H.today() } : null), 120); } }, H.gicon(m.ico, 18), h('span', m.name), H.icon('arrow', 16)))));
    const close = () => { sheet.classList.add('closing'); setTimeout(() => sheet.remove(), 260); };
    document.body.appendChild(sheet);
  }

  // follow navigation to highlight the tab and add phone-only bits
  const origGo = H.go;
  H.go = function (view, params) {
    cur = view;
    origGo(view, params);
    drawBar();
    const v = document.querySelector('.view'); if (v) v.scrollTop = 0;
    if (view === 'home') homeExtras();
  };

  // ---------- weekly reminder to save a copy ----------
  function homeExtras() {
    const st = H.store.get().settings;
    const last = st.lastExport;
    const days = Object.keys(H.store.get().days).length;
    if (!days) return;
    const due = !last || H.diffDays(H.today(), last) >= 7;
    if (!due) return;
    const host = document.querySelector('.home-cards'); if (!host) return;
    host.prepend(h('div.glass.tip-card.link.hot', { onclick: () => H.go('settings') }, H.gicon('file', 18),
      h('div', h('div.tc-t', last ? 'Пора сохранить копию дневника' : 'Сохрани первую копию дневника'),
        h('p', 'Записи живут только в этом iPhone. Раз в неделю сохраняй копию: «Ещё → Настройки → Сохранить копию» — в «Файлы» или себе в Telegram.'))));
  }

  // ---------- quick check-in (30 seconds) ----------
  H.views.quick = function (root) {
    const date = H.today();
    const S = H.store.get();
    const R = () => S.days[date];
    const W = () => H.store.day(date, true);
    const changed = block => { H.store.touch(date, block); H.game.onDayEdit(date, block); };
    const g = () => (R() && R().general) || {};

    const scale = (key, labels, values, icons) => {
      const row = h('div.q-scale');
      const draw = () => {
        H.clear(row);
        values.forEach((v, i) => row.appendChild(h('button.q-btn' + (g()[key] != null && Math.abs(g()[key] - v) <= 1 ? '.on' : ''), {
          onclick: () => { const d = W(); d.general = d.general || {}; d.general[key] = v; changed('general'); draw(); },
        }, h('span.q-ico', icons[i]), h('small', labels[i]))));
      };
      draw(); return row;
    };
    const faces = ['😣', '😕', '😐', '🙂', '😊'];
    const bat = ['🪫', '🔋', '🔋', '🔋', '⚡'];

    // sleep
    const sl = () => (R() && R().sleep) || {};
    const prev = S.days[H.addDays(date, -1)] && S.days[H.addDays(date, -1)].sleep;
    const tIn = (k, def) => { const i = h('input.inp.q-time', { type: 'time', value: sl()[k] || '' , placeholder: def }); i.addEventListener('change', () => { const d = W(); d.sleep = d.sleep || {}; if (i.value) d.sleep[k] = i.value; else delete d.sleep[k]; changed('sleep'); sum(); }); return i; };
    const sumEl = h('div.q-sleep-sum');
    const sum = () => { const m = H.metrics.totalSleep(R()); sumEl.textContent = m == null ? 'укажи, когда уснула и проснулась' : 'сон: ' + H.fmtDur(m); };
    const qual = h('div.q-scale.small');
    const drawQ = () => { H.clear(qual); [[3, 'плохо'], [6, 'так себе'], [9, 'хорошо']].forEach(([v, n]) => qual.appendChild(h('button.q-btn' + (sl().quality != null && Math.abs(sl().quality - v) <= 1 ? '.on' : ''), { onclick: () => { const d = W(); d.sleep = d.sleep || {}; d.sleep.quality = v; changed('sleep'); drawQ(); } }, h('small', n)))); };
    drawQ(); sum();

    // meds
    const medsHost = h('div.q-meds');
    const drawMeds = () => {
      H.clear(medsHost);
      const meds = H.metrics.activeMeds(date).filter(m => !m.asNeeded);
      if (!meds.length) { medsHost.appendChild(h('p.faint', { style: { margin: 0 } }, 'Препараты добавляются в «Ещё → Карточка здоровья».')); return; }
      meds.forEach(m => {
        const n = Number(m.times) || 1;
        for (let i = 0; i < n; i++) {
          const rec = R() && R().meds && R().meds[m.id];
          const on = !!(rec && rec.slots && rec.slots[i]);
          medsHost.appendChild(h('button.q-med' + (on ? '.on' : ''), { onclick: () => {
            const d = W(); d.meds = d.meds || {}; const r = d.meds[m.id] || (d.meds[m.id] = { slots: Array(n).fill(false), dose: m.dose });
            r.slots[i] = !r.slots[i]; r.dose = m.dose; changed('meds'); drawMeds();
          } }, h('span.qm-chk', on ? '✓' : ''), h('span', h('b', m.name), h('small', (m.slots && m.slots[i]) || `приём ${i + 1}`))));
        }
      });
    };
    drawMeds();

    // emotions (common ones)
    const COMMON = ['joy', 'calm', 'interest', 'grateful', 'cozy', 'relief', 'sad', 'apathy', 'anxiety', 'irritation', 'emotired', 'lonely'];
    const emoHost = h('div.chips.q-emo');
    const drawEmo = () => {
      H.clear(emoHost);
      COMMON.map(id => H.EMOTIONS.find(e => e.id === id)).filter(Boolean).forEach(e => {
        const on = !!(R() && R().emotions && R().emotions[e.id]);
        emoHost.appendChild(ui.chip(`${e.e} ${e.name}`, on, () => { const d = W(); d.emotions = d.emotions || {}; if (d.emotions[e.id]) delete d.emotions[e.id]; else d.emotions[e.id] = { score: 6, note: '' }; changed('emotions'); drawEmo(); }));
      });
    };
    drawEmo();

    const card = (title, ...kids) => h('div.glass.card.q-card', h('div.q-t', title), ...kids);
    root.appendChild(h('div.wrap.q-wrap',
      h('div.q-head', h('div.q-date', H.cap(H.weekday(date)) + ', ' + H.fmtLong(date)), h('h1', 'Как ты сегодня?'), h('p.muted', 'Быстрая отметка — полминуты. Подробнее можно в полной анкете.')),
      card('Самочувствие', scale('overall', ['тяжело', 'так себе', 'ровно', 'хорошо', 'отлично'], [2, 4, 6, 8, 10], faces)),
      card('Энергия', scale('energy', ['нет сил', 'мало', 'средне', 'есть', 'много'], [2, 4, 6, 8, 10], bat)),
      card('Сон', h('div.q-sleep', h('label', h('span', 'уснула'), tIn('bed', prev && prev.bed)), h('label', h('span', 'проснулась'), tIn('wake', prev && prev.wake))), sumEl, h('div.q-sub', 'как спалось'), qual),
      card('Таблетки', medsHost),
      card('Что чувствую', emoHost),
      h('div.q-actions',
        h('button.btn.primary.q-done', { onclick: () => { H.store.persistNow(); ui.toast('Записано ✓'); H.go('home'); } }, 'Готово'),
        h('button.btn', { onclick: () => H.go('day', { date }) }, 'Полная анкета'),
        R() && Object.keys(R().edited || {}).length ? h('button.btn.ghost', { onclick: () => H.go('day', { date, rate: true }) }, H.icon('sparkle', 15), 'Итог дня') : null)));
  };

  // open the day summary right away when asked from the quick screen
  const origDay = H.views.day;
  H.views.day = function (root, params) {
    const r = origDay(root, params);
    if (params && params.rate) setTimeout(() => { const b = [...document.querySelectorAll('.day-head .btn.primary')].find(x => /Оценить/.test(x.textContent)); b && b.click(); }, 250);
    return r;
  };

  function mount() {
    if (!document.getElementById('mnav')) document.body.appendChild(bar);
    drawBar();
    setTimeout(() => { if (document.querySelector('.home')) homeExtras(); }, 700);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  // register the offline cache
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})(window.H);
