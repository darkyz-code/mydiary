'use strict';
(function (H) {
  const { h } = H;
  const NAV = [
    { id: 'home', ico: 'home', name: 'Главная' },
    { id: 'day', ico: 'sun', name: 'Сегодня' },
    { id: 'calendar', ico: 'calendar', name: 'Календарь' },
    { id: 'analytics', ico: 'chart', name: 'Аналитика' },
    'sep',
    { id: 'profile', ico: 'card', name: 'Карточка здоровья' },
    { id: 'tests', ico: 'clipboard', name: 'Тесты' },
    { id: 'journal', ico: 'feather', name: 'Личные заметки' },
    { id: 'library', ico: 'book', name: 'Полезно знать' },
    { id: 'games', ico: 'gem', name: 'Отдых' },
    { id: 'export', ico: 'file', name: 'Выгрузка в PDF' },
    'sep',
    { id: 'settings', ico: 'settings', name: 'Настройки' },
  ];
  let current = null, cleanup = null, currentParams = null;

  function applySettings() {
    const st = H.store.get().settings;
    const accents = H.availableAccents();
    const currentAccent = String(st.accent || '').toLowerCase();
    const allowedAccent = accents.includes(currentAccent) ? currentAccent : H.ACCENTS[0];
    if (st.accent !== allowedAccent) { st.accent = allowedAccent; H.store.save(); }
    const html = document.documentElement;
    html.dataset.theme = st.theme;
    const rgb = H.hexToRgb(st.accent);
    const [hh, ss, ll] = H.rgbToHsl(rgb);
    html.style.setProperty('--accent', st.accent);
    html.style.setProperty('--accent-rgb', rgb.join(','));
    html.style.setProperty('--accent-2', `hsl(${(hh + 38) % 360}, ${Math.min(90, ss + 5)}%, ${Math.min(72, ll + 6)}%)`);
    html.style.setProperty('--on-accent', ll > 76 ? '#14161b' : '#fff');
    html.style.setProperty('--glass-k', (st.glass / 100).toFixed(2));
    html.style.setProperty('--fs', st.fontScale || 1);
    html.classList.toggle('no-anim', !st.animations);
    html.classList.toggle('pin-side', !!st.pinSidebar);
  }

  function buildSidebar() {
    const sb = document.getElementById('sidebar');
    H.clear(sb);
    sb.appendChild(h('div.side-brand', h('img', { src: 'icon.svg', alt: '' }), h('div', h('b', 'My Diary'), h('span', H.cap(H.weekday(H.today())) + ', ' + H.fmtLong(H.today())))));
    NAV.forEach(n => {
      if (n === 'sep') return sb.appendChild(h('div.nav-sep'));
      sb.appendChild(h('button.nav-item' + (current === n.id ? '.on' : ''), { dataset: { nav: n.id }, onclick: () => { H.go(n.id, n.id === 'day' ? { date: H.today() } : null); closeSide(); } }, h('span.ni-ico', H.icon(n.ico, 19)), n.name));
    });
    sb.appendChild(h('div.side-foot', 'Данные хранятся только на этом iPhone. '));
  }
  let sideTimer = null;
  function openSide() { clearTimeout(sideTimer); document.getElementById('sidebar').classList.add('open'); }
  function closeSide() { clearTimeout(sideTimer); sideTimer = setTimeout(() => document.getElementById('sidebar').classList.remove('open'), 280); }

  function go(view, params) {
    if (!H.views[view]) view = 'home';
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    document.querySelectorAll('.popover, .cal-tip').forEach(p => p.remove());
    current = view; currentParams = params || null;
    const host = document.getElementById('views');
    const el = h('div.view.enter');
    // Keep the balance inside the scrolling page, preserving its listeners.
    const balance = document.getElementById('gem-badge');
    if (balance && document.documentElement.classList.contains('is-mobile')) el.appendChild(balance);
    H.clear(host).appendChild(el);
    try {
      const r = H.views[view](el, params || {});
      if (typeof r === 'function') cleanup = r;
    } catch (e) {
      console.error(e);
      el.appendChild(h('div.glass.card', h('h3', 'Что-то пошло не так'), h('p.muted', String(e && e.message || e)), h('button.btn', { onclick: () => go('home') }, 'На главную')));
    }
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('on', b.dataset.nav === view && (view !== 'day' || (params && params.date === H.today()))));
  }

  async function init() {
    await H.store.load();
    const st0 = H.store.get().settings;
    if (!st0.themeChosen) { // one-time move of older installs to the new silver look
      st0.themeChosen = true; st0.theme = 'silver'; st0.accent = '#c8ced8'; if (st0.silhouette === 'line') st0.silhouette = 'chrome'; H.store.save();
    }
    buildScene();
    applySettings();
    buildSidebar();
    const badge = document.getElementById('gem-badge');
    const drawBadge = () => { H.clear(badge); badge.append(H.icon('gem', 15), h('b.gem-balance', String(H.store.get().game.crystals))); };
    drawBadge(); H.store.onChange(() => { const b = badge.querySelector('b'); if (b) b.textContent = H.store.get().game.crystals; });
    badge.addEventListener('click', () => H.go('games'));
    const handle = document.getElementById('side-handle');
    const sb = document.getElementById('sidebar');
    const arrow = handle.querySelector('.arrow');
    arrow.addEventListener('mouseenter', openSide);
    arrow.addEventListener('click', openSide);
    sb.addEventListener('mouseenter', openSide);
    sb.addEventListener('mouseleave', closeSide);
    arrow.addEventListener('mouseleave', e => { if (!sb.contains(e.relatedTarget)) closeSide(); });

    if (window.api) {
      document.getElementById('w-min').onclick = () => window.api.win.minimize();
      document.getElementById('w-max').onclick = () => window.api.win.maximize();
      document.getElementById('w-close').onclick = async () => {
        H.store.persistNow();
        if (H.sync && H.sync.config() && H.sync.dirty()) { document.body.classList.add('closing-sync'); await Promise.race([H.sync.run('close'), new Promise(r => setTimeout(r, 7000))]); }
        window.api.win.close();
      };
      document.getElementById('titlebar').addEventListener('dblclick', e => { if (!e.target.closest('.win-ctrls')) window.api.win.maximize(); });
      window.api.win.onState(st => { if ('fullscreen' in st) document.documentElement.classList.toggle('is-fullscreen', st.fullscreen); });
    } else {
      document.querySelector('.win-ctrls').style.display = 'none';
    }

    // keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.target.matches('input, textarea')) return;
      if (e.ctrlKey && e.key.toLowerCase() === 't') { go('day', { date: H.today() }); e.preventDefault(); }
      if (current === 'day' && currentParams && currentParams.date && !document.querySelector('.modal-back')) {
        if (e.key === 'ArrowLeft' && e.altKey) go('day', { date: H.addDays(currentParams.date, -1) });
        if (e.key === 'ArrowRight' && e.altKey) go('day', { date: H.addDays(currentParams.date, 1) });
      }
    });

    // follow the computer clock: when the date changes, refresh the home screen and sidebar
    let lastDate = H.today();
    setInterval(() => {
      const t = H.today();
      if (t !== lastDate) { lastDate = t; buildSidebar(); if (current === 'home') go('home'); }
    }, 30000);

    const start = new URLSearchParams(location.search).get('view');
    go(start || 'home', start === 'day' ? { date: H.today() } : null);
    setTimeout(() => H.game.login(), 1500);
    if (H.sync) H.sync.start();
  }

  // decorative background for the silver theme: flowing silver hairlines with travelling glints
  function buildScene() {
    const bg = document.getElementById('bg');
    if (bg.querySelector('.silver-bg')) return;
    let l1 = '', l2 = '', glints = '', sharp = '';
    for (let i = 0; i < 9; i++) {
      const o = i * 17;
      const d = `M-200,${190 + o} C360,${-40 + o * 1.3} 900,${700 + o * .5} 1800,${340 + o * .9}`;
      l1 += `<path d="${d}" stroke-opacity="${(0.10 + (i % 3) * 0.05).toFixed(2)}"/>`;
      if (i === 3 || i === 7) glints += `<path class="glint" d="${d}" style="animation-delay:${-i * 2.3}s;animation-duration:${16 + i}s"/>`;
    }
    for (let i = 0; i < 6; i++) {
      const o = i * 20;
      const d = `M-200,${920 - o} C520,${650 - o} 1060,${1030 - o * .4} 1800,${560 - o * .8}`;
      l2 += `<path d="${d}" stroke-opacity="${(0.08 + (i % 3) * 0.05).toFixed(2)}"/>`;
      if (i === 2) glints += `<path class="glint" d="${d}" style="animation-delay:-7s;animation-duration:19s"/>`;
    }
    [[1200, 0, 1480, 1000], [140, 1000, 400, 0], [1400, 0, 1580, 560]].forEach(([x1, y1, x2, y2]) => {
      sharp += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    });
    const svgScene = `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lnG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa3b2"/><stop offset=".45" stop-color="#f3f5f9"/><stop offset=".55" stop-color="#e6dcf2"/><stop offset=".62" stop-color="#d6f0f8"/><stop offset="1" stop-color="#8f98a6"/></linearGradient>
        <linearGradient id="shG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      </defs>
      <g class="drift1"><g fill="none" stroke="url(#lnG)" stroke-width=".6">${l1}</g><g fill="none" stroke="#fff" stroke-width=".8" stroke-linecap="round">${glints}</g></g>
      <g class="drift2" fill="none" stroke="url(#lnG)" stroke-width=".6">${l2}</g>
      <g class="drift3" stroke="url(#shG)" stroke-width=".6">${sharp}</g>
    </svg>`;
    bg.insertBefore(h('div.silver-bg', h('div.scene', { html: svgScene }), h('div.irid')), bg.firstChild);
  }

  function refresh() { if (current && !document.querySelector('.modal-back')) H.go(current, currentParams); }
  Object.assign(H, { go, applySettings, refresh });
  window.addEventListener('DOMContentLoaded', init);
})(window.H);
