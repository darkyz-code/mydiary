'use strict';
(function (H) {
  const { h } = H;
  // state that survives navigation between the list and an article
  const S = { group: null, q: '', scroll: 0 };

  const plain = a => a._plain || (a._plain = a.html.replace(/<[^>]+>/g, ' ').replace(/\$\{[^}]+\}/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim());
  const norm = s => String(s || '').toLowerCase().replace(/ё/g, 'е');
  const minutes = a => Math.max(2, Math.ceil(plain(a).split(' ').length / 160));
  const groupOf = a => H.ARTICLE_GROUPS.find(g => g.id === a.group) || { name: a.tag, ic: a.ico };
  const readMap = () => { const st = H.store.get().settings; return st.libRead || (st.libRead = {}); };
  const isRead = id => !!readMap()[id];
  const markRead = id => { const m = readMap(); if (!m[id]) { m[id] = Date.now(); H.store.save(); } };
  const isFresh = a => !!groupOf(a).fresh;
  const open = (root, id) => { S.scroll = root.scrollTop; H.go('library', { article: id }); };

  function badges(a) {
    return h('div.lb-badges',
      h('span.lb-time', H.icon('clock', 13), minutes(a) + ' мин'),
      isRead(a.id) ? h('span.lb-read', H.icon('check', 13), 'прочитано') : (isFresh(a) ? h('span.lb-new', 'новое') : null));
  }

  function card(root, a, i) {
    return h('div.glass.lb-card.sheen' + (isRead(a.id) ? '.is-read' : ''), { style: { animationDelay: Math.min(i, 12) * 30 + 'ms' }, onclick: () => open(root, a.id), tabindex: 0,
      onkeydown: e => { if (e.key === 'Enter') open(root, a.id); } },
      h('div.lb-card-top', H.gicon(a.ico, 20, 'lg'), h('span.lb-ev.soft', a.tag)),
      a.ev ? h('div.lb-evline', a.ev) : null,
      h('h3', a.title), h('p', a.desc), badges(a));
  }

  /* ---------------- article reader ---------------- */
  function reader(root, a) {
    const g = groupOf(a);
    const list = H.ARTICLES;
    const idx = list.indexOf(a);
    const prev = list[(idx - 1 + list.length) % list.length];
    const next = list[(idx + 1) % list.length];
    const bar = h('div.rd-progress-fill');
    const top = h('div.rd-top', h('button.btn', { onclick: () => H.go('library') }, '← Все статьи'), h('div.rd-top-title', a.title), h('div.rd-progress', bar));
    const body = h('div.rd-body', { html: a.html });
    body.addEventListener('click', e => { const x = e.target.closest('[data-art]'); if (x && H.ARTICLES.some(z => z.id === x.dataset.art)) { e.preventDefault(); H.go('library', { article: x.dataset.art }); } });

    const related = list.filter(z => z.group === a.group && z.id !== a.id);
    const pool = related.length >= 3 ? related : related.concat(list.filter(z => z.group !== a.group && z.group === 'science' && z.id !== a.id));
    const start = Math.max(0, related.indexOf(next));
    const picks = pool.slice(start).concat(pool.slice(0, start)).filter(z => z.id !== a.id).slice(0, 3);

    const art = h('article.glass.rd-article',
      h('div.rd-meta', h('span.rd-group', H.icon(g.ic || a.ico, 15), g.name), h('span.rd-dot'), h('span', H.icon('clock', 14), minutes(a) + ' мин чтения'), a.ev ? h('span.rd-ev', a.ev) : null),
      h('h1.rd-title', a.title),
      h('p.rd-desc', a.desc),
      h('div.rd-sep'),
      body);

    const foot = h('div.rd-foot',
      picks.length ? h('div.rd-more', h('div.rd-more-h', 'Читать дальше'), h('div.rd-more-grid', picks.map((z, i) => h('div.glass.rd-mini.sheen', { onclick: () => H.go('library', { article: z.id }), style: { animationDelay: i * 50 + 'ms' } },
        H.gicon(z.ico, 16, 'sm'), h('div', h('b', z.title), h('span', minutes(z) + ' мин' + (z.ev ? ' · ' + z.ev : ''))))))) : null,
      h('div.rd-nav',
        h('button.btn.ghost.rd-navbtn', { onclick: () => H.go('library', { article: prev.id }) }, h('small', '← Предыдущая'), h('span', prev.title)),
        h('button.btn.ghost.rd-navbtn.right', { onclick: () => H.go('library', { article: next.id }) }, h('small', 'Следующая →'), h('span', next.title))));

    root.appendChild(h('div.wrap.rd-wrap',
      top,
      art, foot));

    const onScroll = () => {
      if (!root.isConnected) return;
      const max = root.scrollHeight - root.clientHeight;
      const p = max > 0 ? Math.min(1, root.scrollTop / max) : 1;
      bar.style.transform = `scaleX(${p})`;
      top.classList.toggle('scrolled', root.scrollTop > 260);
      if (p > 0.75) markRead(a.id);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    root.scrollTop = 0;
    requestAnimationFrame(onScroll);
    return () => root.removeEventListener('scroll', onScroll);
  }

  /* ---------------- list ---------------- */
  H.views.library = function (root, params) {
    if (params && params.article) {
      const a = H.ARTICLES.find(x => x.id === params.article);
      if (a) return reader(root, a);
    }

    const total = H.ARTICLES.length;
    const fresh = H.ARTICLES.filter(isFresh);
    const readCount = H.ARTICLES.filter(a => isRead(a.id)).length;
    const host = h('div.lb-host');
    const chips = h('div.lb-chips');
    const count = h('div.lb-count');

    // «статья дня» — rotates through the research group
    const dayN = Math.floor(Date.now() / 864e5);
    const pickPool = fresh.filter(a => !isRead(a.id)).length ? fresh.filter(a => !isRead(a.id)) : fresh;
    const feat = pickPool.length ? pickPool[dayN % pickPool.length] : null;
    const hero = feat ? h('div.glass.lb-hero.sheen', { onclick: () => open(root, feat.id) },
      h('div.lb-hero-glow'),
      h('div.lb-hero-txt',
        h('div.lb-kicker', H.icon('sparkle', 14), 'Исследование дня'),
        h('h2', feat.title), h('p', feat.desc),
        h('div.lb-hero-meta', badges(feat), feat.ev ? h('span.lb-ev', feat.ev) : null, h('span.lb-hero-go', 'Читать →'))),
      h('div.lb-hero-ico', H.icon(feat.ico, 54))) : null;

    const search = h('input.inp.lb-search', { type: 'search', placeholder: 'Поиск по статьям: сон, ферритин, тревога…', value: S.q,
      oninput: e => { S.q = e.target.value; draw(); } });

    const drawChips = () => {
      H.clear(chips);
      [{ id: null, name: 'Все темы', ic: 'book' }].concat(H.ARTICLE_GROUPS).forEach(g => {
        const n = g.id ? H.ARTICLES.filter(a => a.group === g.id).length : total;
        chips.appendChild(h('button.chip.lb-chip' + (S.group === g.id ? '.on' : ''), { onclick: () => { S.group = g.id; drawChips(); draw(); } },
          H.icon(g.ic, 15), g.name, h('span.lb-chip-n', String(n)), g.fresh ? h('i.lb-chip-new') : null));
      });
    };

    const draw = () => {
      H.clear(host);
      const q = norm(S.q.trim());
      if (q) {
        const words = q.split(/\s+/).filter(Boolean);
        const score = a => {
          const t = norm(a.title), d = norm(a.desc), b = norm(plain(a));
          let s = 0;
          for (const w of words) { if (!b.includes(w) && !t.includes(w) && !d.includes(w)) return 0; s += (t.includes(w) ? 5 : 0) + (d.includes(w) ? 2 : 0) + 1; }
          return s;
        };
        const res = H.ARTICLES.filter(a => !S.group || a.group === S.group).map(a => [a, score(a)]).filter(x => x[1] > 0).sort((x, y) => y[1] - x[1]).map(x => x[0]);
        count.textContent = res.length ? `Найдено: ${res.length} ${H.plural(res.length, 'статья', 'статьи', 'статей')}` : '';
        if (!res.length) { host.appendChild(h('div.glass.lb-empty', H.icon('compass', 26), h('p', 'Ничего не нашлось. Попробуй другое слово — например, «сон», «железо» или «эмоции».'))); return; }
        host.appendChild(h('div.lb-grid', res.map((a, i) => card(root, a, i))));
        return;
      }
      count.textContent = '';
      H.ARTICLE_GROUPS.filter(g => !S.group || g.id === S.group).forEach(g => {
        const list = H.ARTICLES.filter(a => a.group === g.id);
        if (!list.length) return;
        const read = list.filter(a => isRead(a.id)).length;
        host.appendChild(h('section.lb-sec' + (g.fresh ? '.is-fresh' : ''),
          h('div.lb-head', H.gicon(g.ic, 18),
            h('div.lb-head-txt', h('h2', g.name, g.fresh ? h('span.lb-new', 'новое') : null),
              h('div.sub', `${g.desc} · ${list.length} ${H.plural(list.length, 'статья', 'статьи', 'статей')}${read ? ` · прочитано ${read}` : ''}`))),
          h('div.lb-grid', list.map((a, i) => card(root, a, i)))));
      });
    };

    drawChips(); draw();
    root.appendChild(h('div.wrap.lb-wrap',
      h('div.view-head', h('div', h('h1', 'Полезно знать'),
        h('div.sub', `${total} ${H.plural(total, 'статья', 'статьи', 'статей')} · ${fresh.length} о научных исследованиях${readCount ? ` · прочитано ${readCount}` : ''}`))),
      hero,
      h('div.lb-tools', h('div.lb-search-wrap', h('svg.ic', { viewBox: '0 0 24 24', width: 17, height: 17, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, h('circle', { cx: 11, cy: 11, r: 6.5 }), h('path', { d: 'M16 16l4.5 4.5' })), search), count),
      chips,
      host));
    if (S.scroll) { const y = S.scroll; S.scroll = 0; requestAnimationFrame(() => { root.scrollTop = y; }); }
  };
})(window.H);
