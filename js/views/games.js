'use strict';
(function (H) {
  const { h, ui } = H;
  const S = () => H.store.get();
  const CARD = 136, GAP = 10;

  // ---------- art ----------
  function gemSvg(a, b, shape, size, uid) {
    const g = `gg${uid}`;
    const defs = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${a}" stop-opacity=".85"/></linearGradient>
      <linearGradient id="${g}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
    const line = 'stroke="#fff" stroke-opacity=".55" stroke-width="1" fill="none"';
    let body;
    if (shape === 0) body = `<path d="M30 34h40l14 16-34 38-34-38z" fill="url(#${g})"/><path d="M16 50h68M30 34l8 16 12 38 12-38 8-16M38 50l12-16 12 16" ${line}/><path d="M30 34h40l6 7H24z" fill="url(#${g}h)" opacity=".5"/>`;
    else if (shape === 1) body = `<path d="M50 10l18 22v38L50 92 32 70V32z" fill="url(#${g})"/><path d="M50 10v82M32 32l18 10 18-10M32 70l18-10 18 10" ${line}/><path d="M50 10l18 22-18 10-18-10z" fill="url(#${g}h)" opacity=".45"/>`;
    else if (shape === 2) body = `<ellipse cx="50" cy="54" rx="32" ry="30" fill="url(#${g})"/><ellipse cx="40" cy="42" rx="14" ry="8" fill="#fff" opacity=".55" transform="rotate(-25 40 42)"/><ellipse cx="50" cy="54" rx="32" ry="30" ${line}/>`;
    else if (shape === 3) body = `<path d="M24 86l8-44 12 10 4 34z" fill="url(#${g})"/><path d="M44 86l6-66 14 18-4 48z" fill="url(#${g})"/><path d="M58 86l6-40 14 14-6 26z" fill="url(#${g})"/><path d="M50 20l14 18M32 42l12 10M64 46l14 14" ${line}/><path d="M50 20l14 18-6 6-10-6z" fill="url(#${g}h)" opacity=".5"/>`;
    else body = `<path d="M50 88S16 66 16 40a17 17 0 0 1 34-6 17 17 0 0 1 34 6c0 26-34 48-34 48z" fill="url(#${g})"/><path d="M50 34v54M16 40h68M33 24l17 30 17-30" ${line}/><path d="M22 34a14 14 0 0 1 24-6l-8 10z" fill="url(#${g}h)" opacity=".6"/>`;
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}">${defs}${body}</svg>`;
  }
  let artId = 0;
  function itemArt(it, size = 72) {
    const id = ++artId;
    if (it.type === 'gem') return H.relics.relicSvg(it, size);
    if (it.type === 'accent') return H.svg(`<svg viewBox="0 0 100 100" width="${size}" height="${size}"><defs><radialGradient id="ac${id}" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${it.color}"/><stop offset="1" stop-color="${it.color}" stop-opacity=".55"/></radialGradient></defs><circle cx="50" cy="50" r="30" fill="url(#ac${id})"/><circle cx="50" cy="50" r="36" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/><circle cx="50" cy="50" r="42" fill="none" stroke="${it.color}" stroke-opacity=".35" stroke-width="1"/></svg>`);
    if (it.type === 'coupon') return H.svg(`<svg viewBox="0 0 100 100" width="${size}" height="${size}"><path d="M14 30h72v12a8 8 0 0 0 0 16v12H14V58a8 8 0 0 0 0-16z" fill="rgba(255,255,255,.08)" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/><path d="M38 30v40" stroke="#fff" stroke-opacity=".5" stroke-dasharray="3 4"/><path d="M60 40c3-6 12-6 12 1 0 6-12 13-12 13s-12-7-12-13c0-7 9-7 12-1z" fill="#ffc7dc" opacity=".9"/></svg>`);
    return h('div.cr-art', { style: { width: size + 'px', height: size + 'px' } }, H.svg(gemSvg('#e9f6ff', '#5f8fd8', 1, size * .78, id)), H.svg(gemSvg('#fff4fb', '#a07ad8', 1, size * .56, id + 'b')));
  }
  function caseArt(cs, size = 130) {
    return H.caseArt ? H.caseArt(cs, size) : H.svg(`<svg viewBox="0 0 140 120" width="${size}" height="${size * 120 / 140}">
      <defs><linearGradient id="cs${cs.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6fa"/><stop offset=".45" stop-color="#8d939e"/><stop offset=".55" stop-color="#5a606a"/><stop offset="1" stop-color="#d9dde3"/></linearGradient>
      <radialGradient id="cg${cs.id}"><stop offset="0" stop-color="${cs.color}" stop-opacity=".75"/><stop offset="1" stop-color="${cs.color}" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="70" cy="64" rx="64" ry="50" fill="url(#cg${cs.id})"/>
      <path d="M22 46l48-22 48 22v42l-48 22-48-22z" fill="#16181d" stroke="url(#cs${cs.id})" stroke-width="2.4"/>
      <path d="M22 46l48 22 48-22M70 68v42" stroke="url(#cs${cs.id})" stroke-width="1.6" fill="none"/>
      <path d="M70 34l12 16-12 14-12-14z" fill="${cs.color}" opacity=".9"/><path d="M70 34l12 16H58z" fill="#fff" opacity=".5"/>
      <path d="M30 52l34 16M106 52L76 66" stroke="#fff" stroke-opacity=".25"/>
    </svg>`);
  }
  function itemCard(it, extra = '') {
    const r = H.game.RAR[it.r];
    return h('div.loot' + extra, { style: { '--rc': r.color } }, h('div.loot-art', itemArt(it, 70)), h('div.loot-name', it.name), h('div.loot-r', r.name));
  }

  // ---------- sounds ----------
  let actx = null;
  function sound(kind, rarity) {
    if (S().settings.gameSound === false) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime;
      const blip = (f, at, d = .05, v = .05, type = 'triangle') => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + at + d);
        o.connect(g); g.connect(actx.destination); o.start(t + at); o.stop(t + at + d + .02);
      };
      if (kind === 'tick') blip(2200, 0, .03, .035);
      if (kind === 'win') {
        const idx = H.game.ORDER.indexOf(rarity);
        const notes = [[523, 659], [523, 659, 784], [587, 740, 880, 1175], [523, 659, 784, 1047, 1319], [440, 554, 659, 880, 1109, 1319, 1760]][idx];
        notes.forEach((f, i) => blip(f, i * .09, .5, .06, 'sine'));
      }
    } catch (e) {}
  }

  // ---------- case opening ----------
  function openCase(cs, onDone) {
    const g = S().game;
    if (cs.id === 'daily' && !H.game.dev()) { if (!H.game.canDaily()) { ui.toast(g.freeCase === H.today() ? 'Сегодняшний кейс уже открыт' : 'Заполни хотя бы 3 раздела дня', 'ℹ'); return; } g.freeCase = H.today(); }
    else if (!H.game.dev()) { if (g.crystals < cs.price) { ui.toast('Не хватает кристаллов', '◆'); return; } g.crystals -= cs.price; }
    H.store.save();
    const prize = H.game.roll(cs);
    const N = 58, WIN = 50;
    const items = Array.from({ length: N }, (_, i) => i === WIN ? prize : H.game.filler(cs));
    const strip = h('div.spin-strip', items.map(it => itemCard(it)));
    const view = h('div.spin-view', strip, h('div.spin-marker'));
    const result = h('div.spin-result');
    const md = ui.modal(cs.name, h('div', view, result), { wide: true, cls: 'case-modal' });
    requestAnimationFrame(() => {
      const W = view.clientWidth;
      const target = WIN * (CARD + GAP) + CARD / 2 + (Math.random() * 0.7 - 0.35) * CARD;
      strip.style.transform = 'translateX(0px)';
      void strip.offsetWidth;
      const dur = document.documentElement.classList.contains('no-anim') ? 0.01 : 6.8;
      strip.style.transition = `transform ${dur}s cubic-bezier(.1,.62,.08,1)`;
      strip.style.transform = `translateX(${W / 2 - target}px)`;
      let last = -1, raf;
      const loop = () => {
        const m = new DOMMatrixReadOnly(getComputedStyle(strip).transform);
        const center = W / 2 - m.m41;
        const idx = Math.floor(center / (CARD + GAP));
        if (idx !== last) { last = idx; sound('tick'); }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      strip.addEventListener('transitionend', () => {
        cancelAnimationFrame(raf);
        H.game.grant(prize);
        const r = H.game.RAR[prize.r];
        strip.children[WIN].classList.add('won');
        view.classList.add('done');
        sound('win', prize.r);
        H.clear(result);
        result.append(
          h('div.res-card', { style: { '--rc': r.color } },
            h('div.res-glow'), h('div.res-art', itemArt(prize, 120)),
            h('div', h('div.res-r', r.name), h('div.res-name', prize.name),
              h('div.faint', { style: { fontSize: '.84rem', marginTop: '6px' } },
                prize.type === 'accent' ? 'Новый цвет уже доступен в «Настройки → Цвет акцента».' :
                prize.type === 'coupon' ? `${prize.desc ? prize.desc + ' ' : ''}Купон лежит на «Витрине» и действует ${H.game.COUPON_DAYS} дней.` :
                prize.type === 'crystals' ? 'Кристаллы добавлены на баланс.' : 'Реликвия заняла место на витрине.'))),
          h('div.row', { style: { justifyContent: 'center', gap: '10px', marginTop: '16px' } },
            h('button.btn', { onclick: () => { md.close(); } }, 'Закрыть'),
            cs.id !== 'daily' || H.game.dev() ? h('button.btn.primary', { onclick: () => { md.close(); setTimeout(() => openCase(cs, onDone), 280); } }, H.game.dev() ? 'Ещё раз · бесплатно' : `Ещё раз · ${cs.price} ◆`) : null));
        onDone && onDone();
      }, { once: true });
    });
  }

  // ---------- breathing ----------
  function breathing(host) {
    const patterns = [
      { id: 'box', name: 'Квадрат 4-4-4-4', steps: [['Вдох', 4, 1], ['Пауза', 4, 1], ['Выдох', 4, 0], ['Пауза', 4, 0]] },
      { id: '478', name: '4-7-8 для сна', steps: [['Вдох', 4, 1], ['Задержка', 7, 1], ['Выдох', 8, 0]] },
      { id: 'calm', name: 'Спокойное 4-6', steps: [['Вдох', 4, 1], ['Выдох', 6, 0]] },
    ];
    let pat = patterns[0], timer = null, left = 0;
    const circle = h('div.breath-circle', h('div.breath-core'));
    const label = h('div.breath-label', 'Готова?');
    const sub = h('div.breath-sub', '1 минута · за полную сессию +10 кристаллов раз в день');
    const startBtn = h('button.btn.primary', { onclick: () => timer ? stop() : start() }, 'Начать');
    function stop(done) {
      clearTimeout(timer); timer = null; startBtn.textContent = 'Начать';
      circle.style.transition = 'transform 1.2s var(--ease)'; circle.style.transform = 'scale(.6)';
      label.textContent = done ? 'Отлично' : 'Готова?';
      if (done) H.game.award('breath:' + H.today(), 10, 'дыхание');
    }
    function start() {
      left = 60; startBtn.textContent = 'Стоп';
      let i = 0;
      const step = () => {
        if (left <= 0) return stop(true);
        const [name, sec, grow] = pat.steps[i % pat.steps.length];
        label.textContent = name; sub.textContent = `осталось ${left} с`;
        circle.style.transition = `transform ${sec}s ease-in-out`;
        circle.style.transform = grow ? 'scale(1)' : 'scale(.6)';
        left -= sec; i++;
        timer = setTimeout(step, sec * 1000);
      };
      step();
    }
    circle.style.transform = 'scale(.6)';
    host.appendChild(h('div.glass.card.breath',
      h('div.card-title', H.gicon('wind', 17, 'sm'), h('h3', 'Дыхание')),
      ui.segmented(patterns.map(p => ({ id: p.id, name: p.name, toggleOff: false })), pat.id, v => { pat = patterns.find(p => p.id === v); if (timer) stop(); }),
      h('div.breath-stage', circle, h('div.breath-text', label, sub)),
      h('div.row', { style: { justifyContent: 'center' } }, startBtn)));
    return () => clearTimeout(timer);
  }

  H.views.games = function (root, params) {
    let tab = (params && params.tab) || 'cases';
    const host = h('div');
    let cleanup = null;
    const bal = () => h('div.gem-chip', H.icon('gem', 18), h('b.gem-balance', String(S().game.crystals)), h('span', 'кристаллов'));
    const render = () => {
      if (cleanup) { cleanup(); cleanup = null; }
      H.clear(host);
      if (tab === 'cases') {
        const grid = h('div.case-grid');
        H.game.CASES.forEach((cs, i) => {
          const daily = cs.id === 'daily';
          const avail = H.game.dev() || (daily ? H.game.canDaily() : S().game.crystals >= cs.price);
          grid.appendChild(h('div.glass.case-card.sheen' + (avail ? '' : '.locked'), { style: { animation: `blockIn .6s ${i * 70}ms var(--ease) both` } },
            h('div.case-art', caseArt(cs)),
            h('h3', cs.name), h('p', cs.desc),
            h('div.case-foot',
              h('span.case-price', H.game.dev() ? 'режим разработчика' : daily ? (S().game.freeCase === H.today() ? 'открыт сегодня' : 'бесплатно') : [H.icon('gem', 15), ' ', String(cs.price)]),
              h('button.btn.small' + (avail ? '.primary' : ''), { onclick: () => openCase(cs, render) }, 'Открыть'))));
        });
        host.append(grid, h('div.glass.card', { style: { marginTop: '18px' } },
          h('div.card-title', H.gicon('star', 17, 'sm'), h('h3', 'Как заработать кристаллы')),
          h('div.earn-list',
            [['Каждый заполненный раздел дня', '+5'], ['Заполнено 8+ разделов за день', '+40'], ['Несколько дней подряд с записями', 'до +50'], ['Кнопка «Оценить день»', '+15'], ['Пройденный тест', '+25'], ['Дыхательная сессия', '+10'], ['Зайти в дневник', '+10 в день']].map(([a, b]) => h('div.stat', h('span.muted', a), h('b', b)))),
          h('p.faint', { style: { fontSize: '.78rem', margin: '10px 0 0' } }, 'Кристаллы нельзя купить — только заработать заботой о себе. Шансы в кейсах: обычный 55%, редкий 26%, эпический 12,5%, легендарный 5%, мифический 1,5% (в лунном кейсе обычных нет совсем: редкий ~27%, эпический ~42%, легендарный ~23%, мифический ~8%).')));
      }
      if (tab === 'collection') {
        const g = S().game;
        H.relics.showcase(host);
        const cps = H.game.coupons();
        const active = cps.filter(c => c.state === 'active').sort((a, b) => a.exp - b.exp);
        const archive = cps.filter(c => c.state !== 'active').sort((a, b) => (b.usedAt || b.exp) - (a.usedAt || a.exp));
        const accents = g.inventory.filter(x => (H.game.ITEMS[x.id] || {}).type === 'accent');
        const daysLeft = c => Math.max(0, Math.ceil((c.exp - Date.now()) / 86400000));
        host.append(
          h('div.grid2', { style: { marginTop: '18px', alignItems: 'start' } },
            h('div.glass.card', h('div.card-title', H.gicon('gift', 17, 'sm'), h('h3', 'Купоны заботы'), active.length ? h('span.badge', { style: { marginLeft: 'auto' } }, String(active.length)) : null),
              active.length ? active.map(c => {
                const it = H.game.ITEMS[c.id] || { name: 'Купон' }; const dl = daysLeft(c);
                return h('div.list-item.coupon-item', h('div.li-main', h('div.li-t', it.name), it.desc ? h('div.li-s', it.desc) : null, h('div.li-s' + (dl <= 3 ? '.burn' : ''), dl === 0 ? 'сгорает сегодня' : `действует ещё ${dl} ${H.plural(dl, 'день', 'дня', 'дней')}`)),
                  h('button.btn.small.primary', { onclick: () => { c.state = 'used'; c.usedAt = Date.now(); H.store.save(); ui.toast('Купон использован. Приятного отдыха!', '♡'); render(); } }, 'Использовать'),
                  h('button.icon-btn.small', { title: 'Убрать купон', onclick: async () => { if (await ui.confirm(`Убрать купон «${it.name}» без использования?`, 'Убрать')) { c.state = 'removed'; c.usedAt = Date.now(); H.store.save(); render(); } } }, '✕'));
              }) : h('p.muted', 'Купоны выпадают из «Кейса заботы» и ежедневного кейса. Каждый действует 30 дней.'),
              archive.length ? h('details.coupon-archive', h('summary', `Архив (${archive.length})`),
                archive.slice(0, 40).map(c => h('div.arch-item', h('span', (H.game.ITEMS[c.id] || {}).name || 'Купон'), h('span.faint', c.state === 'used' ? 'использован ' + H.fmtShort(H.iso(new Date(c.usedAt))) : c.state === 'expired' ? 'сгорел' : 'убран'))),
                h('button.btn.small.ghost', { style: { marginTop: '8px' }, onclick: async () => { if (await ui.confirm('Очистить архив купонов?', 'Очистить', true)) { g.coupons = g.coupons.filter(c => c.state === 'active'); H.store.save(); render(); } } }, 'Очистить архив')) : null),
            h('div.glass.card', h('div.card-title', H.gicon('sparkle', 17, 'sm'), h('h3', 'Цвета оформления')),
              h('p.muted', { style: { fontSize: '.84rem', margin: '0 0 12px' } }, `Собрано ${accents.length} из ${Object.values(H.game.ITEMS).filter(x => x.type === 'accent').length}. Выпадают из Кристального и Лунного кейсов (в лунном — чаще). Нажми на свой цвет, чтобы применить.`),
              h('div.acc-list', Object.values(H.game.ITEMS).filter(x => x.type === 'accent').sort((a, b) => H.game.ORDER.indexOf(a.r) - H.game.ORDER.indexOf(b.r)).map(it => {
                const own = accents.some(x => x.id === it.id); const rr = H.game.RAR[it.r];
                return h('button.acc-it' + (own ? '' : '.locked') + (S().settings.accent === it.color ? '.on' : ''), { disabled: !own || null, onclick: () => { S().settings.accent = it.color; H.applySettings(); H.store.save(); ui.toast('Цвет применён'); render(); } },
                  h('span.acc-sw', { style: { background: own ? it.color : 'transparent', '--c': it.color } }, own ? null : '?'), h('span.acc-t', h('b', own ? it.name.replace(/^Цвет «(.+)»$/, '$1') : '???'), h('small', { style: { color: rr.color } }, rr.name)));
              })))));
      }
      if (tab === 'ideas') H.spinners.ideasView(host);
      if (tab === 'food') H.spinners.foodView(host);
      if (tab === 'breath') cleanup = breathing(host);
    };
    render();
    root.appendChild(h('div.wrap',
      h('div.view-head', h('div', h('h1', 'Мини-игры'), h('div.sub', 'Кристаллы за заботу о себе, кейсы с реликвиями и бесплатные крутки'))),
      h('div.tabs-row', ui.segmented([{ id: 'cases', name: 'Кейсы' }, { id: 'collection', name: 'Витрина' }, { id: 'ideas', name: 'Чем заняться' }, { id: 'food', name: 'Что приготовить' }, { id: 'breath', name: 'Дыхание' }].map(x => ({ ...x, toggleOff: false })), tab, v => { tab = v; render(); })),
      host));
    return () => { if (cleanup) cleanup(); };
  };
  H.itemArt = itemArt;
})(window.H);
