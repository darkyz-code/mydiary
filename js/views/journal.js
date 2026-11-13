'use strict';
/* Личные заметки v1.7 — hub, entries, questions, «О себе», letters to the future, joy jar, vent & release.
   Nothing here is used in reports or PDF. */
(function (H) {
  const { h, ui } = H;
  const D = () => H.JOURNAL_DATA || { prompts: [], about: [], daily: [], joy: [], letters: [], vent: [] };
  const MOODS = [
    { id: 'storm', name: 'Буря', c: '#8f7bff' }, { id: 'rain', name: 'Дождь', c: '#7fa6ff' }, { id: 'fog', name: 'Туман', c: '#b7bfcc' },
    { id: 'calm', name: 'Тихо', c: '#9fe6d0' }, { id: 'sun', name: 'Солнце', c: '#ffd59a' },
  ];
  const ST = () => { const s = H.store.get(); s.journal = s.journal || []; s.journalX = s.journalX || {}; const x = s.journalX; x.about = x.about || {}; x.letters = x.letters || []; x.joys = x.joys || []; return { s, J: s.journal, X: x }; };
  const preview = t => (t || '').replace(/\s+/g, ' ').trim().slice(0, 90);
  const words = t => ((t || '').trim().match(/\S+/g) || []).length;
  const stamp = ms => { const d = new Date(ms); return H.cap(H.weekday(H.iso(d))) + ', ' + H.fmtLongY(H.iso(d)) + ', ' + H.pad(d.getHours()) + ':' + H.pad(d.getMinutes()); };
  const dayNum = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  const pick = (arr, seed) => arr.length ? arr[((seed % arr.length) + arr.length) % arr.length] : '';
  // ---- rich text: a tiny, safe subset (bold, italic, paragraphs with alignment, line breaks)
  const ALIGN_OK = /^(left|center|right|justify)$/;
  function cleanHtml(html) {
    const box = document.createElement('div'); box.innerHTML = String(html || '');
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) return;
        if (n.nodeType !== 1) { n.remove(); return; }
        walk(n);
        const tag = n.tagName;
        const map = { B: 'b', STRONG: 'b', I: 'i', EM: 'i', BR: 'br', DIV: 'div', P: 'div' };
        let t = map[tag];
        if (!t && tag === 'SPAN') { const st = n.style || {}; if (/bold|[6-9]00/.test(st.fontWeight)) t = 'b'; else if (st.fontStyle === 'italic') t = 'i'; }
        if (!t) { n.replaceWith(...n.childNodes); return; }
        const el = document.createElement(t);
        if (t === 'div') { const al = (n.style && n.style.textAlign) || n.getAttribute('align') || ''; if (ALIGN_OK.test(al) && al !== 'left') el.style.textAlign = al; }
        el.append(...n.childNodes); n.replaceWith(el);
      });
    };
    walk(box);
    return box.innerHTML;
  }
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function textToHtml(text, align) {
    if (!text) return '';
    const lines = String(text).split('\n').map(l => l ? esc(l) : '<br>');
    const st = align && align !== 'left' && ALIGN_OK.test(align) ? ` style="text-align:${align}"` : '';
    return lines.map(l => `<div${st}>${l}</div>`).join('');
  }
  function htmlToText(el) {
    let out = '';
    const walk = (n, top) => n.childNodes.forEach(c => {
      if (c.nodeType === 3) out += c.nodeValue;
      else if (c.tagName === 'BR') out += '\n';
      else { const block = c.tagName === 'DIV' || c.tagName === 'P'; if (block && out && !out.endsWith('\n')) out += '\n'; walk(c); if (block && !out.endsWith('\n')) out += '\n'; }
    });
    walk(el, true);
    return out.replace(/\n+$/, '');
  }
  const allPrompts = () => D().prompts.flatMap(g => g.items.map(it => ({ ...it, g })));

  // ---------- release animations (burn / wind / tear) ----------
  function frozen(paper, title, text) {
    const r = paper.getBoundingClientRect();
    const f = h('div.jr-frozen', { style: { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: Math.min(r.height, innerHeight - r.top - 10) + 'px' } },
      title ? h('div.jf-title', title) : null, h('div.jf-text', text || ''));
    document.body.appendChild(f);
    paper.style.visibility = 'hidden';
    return f;
  }
  function release(paper, kind, title, text) {
    if (kind === 'burn' || kind === 'tear') return H.releasePaper(paper, kind, title, text);
    return new Promise(res => {
      const f = frozen(paper, title, text);
      const done = () => { f.remove(); res(); };
      if (document.documentElement.classList.contains('no-anim')) return done();
      if (kind === 'wind') {
        const tx = f.querySelector('.jf-text'); const src = tx.textContent; H.clear(tx);
        const chars = [...src].map(ch => ch === '\n' ? h('br') : h('span.jf-ch', ch === ' ' ? ' ' : ch));
        chars.forEach(c => tx.appendChild(c));
        const tt = f.querySelector('.jf-title'); if (tt) { const s2 = tt.textContent; H.clear(tt); [...s2].forEach(ch => tt.appendChild(h('span.jf-ch', ch === ' ' ? ' ' : ch))); }
        const all = f.querySelectorAll('.jf-ch'); const n = all.length;
        all.forEach((c, i) => {
          const d = (i / Math.max(1, n)) * 1400 + Math.random() * 500;
          const dx = 120 + Math.random() * 260, dy = -60 - Math.random() * 180, rot = (Math.random() - .5) * 120;
          c.animate([{ transform: 'none', opacity: 1, filter: 'blur(0)' }, { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 0, filter: 'blur(3px)' }], { duration: 1300 + Math.random() * 700, delay: d, easing: 'cubic-bezier(.4,.0,.7,.2)', fill: 'forwards' });
        });
        f.animate([{ background: 'rgba(255,255,255,.05)' }, { background: 'rgba(255,255,255,0)' }], { duration: 2600, fill: 'forwards' });
        setTimeout(done, 2900);
      } else if (kind === 'tear') {
        // shred into many chaotic, ragged pieces (voronoi cells with shared jagged edges)
        const W = f.offsetWidth, Hh = f.offsetHeight;
        const cx0 = W * (.3 + Math.random() * .4), cy0 = Hh * (.3 + Math.random() * .4);
        const N = Math.round(14 + Math.min(10, W * Hh / 60000));
        const seeds = [];
        for (let i = 0; i < N; i++) { const a2 = Math.random() * Math.PI * 2, r2 = Math.pow(Math.random(), .8) * Math.max(W, Hh) * .7; seeds.push([H.clamp(cx0 + Math.cos(a2) * r2, 4, W - 4), H.clamp(cy0 + Math.sin(a2) * r2 * .8, 4, Hh - 4)]); }
        const clip = (poly, s0, s1) => {   // keep the side of the bisector closer to s0
          const mx = (s0[0] + s1[0]) / 2, my = (s0[1] + s1[1]) / 2, nx = s1[0] - s0[0], ny = s1[1] - s0[1];
          const side = p2 => (p2[0] - mx) * nx + (p2[1] - my) * ny;
          const out = [];
          for (let i = 0; i < poly.length; i++) {
            const A = poly[i], B = poly[(i + 1) % poly.length], sa = side(A), sb = side(B);
            if (sa <= 0) out.push(A);
            if ((sa <= 0) !== (sb <= 0)) { const t2 = sa / (sa - sb); out.push([A[0] + (B[0] - A[0]) * t2, A[1] + (B[1] - A[1]) * t2]); }
          }
          return out;
        };
        const hash = (x, y) => { let hh = Math.imul(Math.round(x * 10) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(Math.round(y * 10), 0xc2b2ae35); hh ^= hh >>> 13; hh = Math.imul(hh, 0x27d4eb2d); return ((hh ^ (hh >>> 15)) >>> 0) / 4294967296; };
        const onBorder = (A, B) => (Math.abs(A[0]) < .5 && Math.abs(B[0]) < .5) || (Math.abs(A[0] - W) < .5 && Math.abs(B[0] - W) < .5) || (Math.abs(A[1]) < .5 && Math.abs(B[1]) < .5) || (Math.abs(A[1] - Hh) < .5 && Math.abs(B[1] - Hh) < .5);
        const ragEdge = (A, B) => {          // same jitter for both neighbours: computed in a canonical direction
          const flip = A[0] > B[0] || (A[0] === B[0] && A[1] > B[1]);
          const P0 = flip ? B : A, P1 = flip ? A : B;
          const L = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]); const n = Math.max(2, Math.round(L / 9));
          const nx = -(P1[1] - P0[1]) / (L || 1), ny = (P1[0] - P0[0]) / (L || 1);
          const pts = [];
          for (let i = 1; i < n; i++) { const t2 = i / n, j = (hash(P0[0] + P1[0] * 3 + i, P0[1] + P1[1] * 7 + i) - .5) * Math.min(14, L * .18); pts.push([P0[0] + (P1[0] - P0[0]) * t2 + nx * j, P0[1] + (P1[1] - P0[1]) * t2 + ny * j]); }
          return flip ? pts.reverse() : pts;
        };
        const cells = seeds.map((sd, i) => {
          let poly = [[0, 0], [W, 0], [W, Hh], [0, Hh]];
          seeds.forEach((o, j) => { if (j !== i && poly.length) poly = clip(poly, sd, o); });
          const rag = [];
          poly.forEach((A, k) => { const B = poly[(k + 1) % poly.length]; rag.push(A); if (!onBorder(A, B)) rag.push(...ragEdge(A, B)); });
          const cxp = H.avg(poly.map(p2 => p2[0])), cyp = H.avg(poly.map(p2 => p2[1]));
          return { rag, cx: cxp, cy: cyp };
        }).filter(c2 => c2.rag.length >= 3);
        const toCss = poly => 'polygon(' + poly.map(([x, y]) => `${(x / W * 100).toFixed(2)}% ${(y / Hh * 100).toFixed(2)}%`).join(',') + ')';
        const pieces = cells.map(c2 => { const pc = f.cloneNode(true); pc.classList.add('jf-piece'); pc.style.clipPath = toCss(c2.rag); pc.style.transformOrigin = `${c2.cx}px ${c2.cy}px`; document.body.appendChild(pc); return { el: pc, ...c2 }; });
        f.style.opacity = 0;
        const maxD = Math.hypot(W, Hh);
        pieces.forEach(pc => {
          const dx = pc.cx - cx0, dy = pc.cy - cy0, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
          const kick = 40 + Math.random() * 140, rot = (Math.random() - .5) * 260, fall = innerHeight * (.7 + Math.random() * .5);
          const delay = d / maxD * 380 + Math.random() * 90;
          pc.el.animate([
            { transform: 'none', filter: 'drop-shadow(0 0 0 rgba(255,255,255,0))' },
            { transform: `translate(${ux * 7}px, ${uy * 7}px) rotate(${rot * .03}deg)`, filter: 'drop-shadow(0 0 1.4px rgba(255,255,255,.6))', offset: .12 },
            { transform: `translate(${ux * kick}px, ${uy * kick * .6 - 30}px) rotate(${rot * .4}deg) scale(.96)`, filter: 'drop-shadow(0 0 1.4px rgba(255,255,255,.5))', offset: .42 },
            { transform: `translate(${ux * kick * 1.5}px, ${fall}px) rotate(${rot}deg) scale(.88)`, filter: 'drop-shadow(0 0 1px rgba(255,255,255,.25))', opacity: 0 },
          ], { duration: 1900 + Math.random() * 700, delay, easing: 'cubic-bezier(.35,0,.65,.55)', fill: 'forwards' });
        });
        setTimeout(() => { pieces.forEach(pc => pc.el.remove()); done(); }, 3100);
      } else {
        // burn: an uneven flame front driven by fractal noise, glowing edge, charring, embers and smoke
        const W = f.offsetWidth, Hh = f.offsetHeight, S2 = 3;
        const gw = Math.ceil(W / S2), gh = Math.ceil(Hh / S2);
        const lattice = (cells) => { const g = []; for (let i = 0; i <= cells + 1; i++) { g[i] = []; for (let j = 0; j <= cells + 1; j++) g[i][j] = Math.random(); } return g; };
        const octs = [[4, .5], [9, .3], [22, .2]].map(([c, w]) => ({ c, w, g: lattice(c) }));
        const sm = t2 => t2 * t2 * (3 - 2 * t2);
        const noise = (x, y) => octs.reduce((acc, o) => { const fx = x * o.c, fy = y * o.c, ix = Math.floor(fx), iy = Math.floor(fy), tx = sm(fx - ix), ty = sm(fy - iy); const a1 = o.g[ix][iy], b1 = o.g[ix + 1][iy], c1 = o.g[ix][iy + 1], d1 = o.g[ix + 1][iy + 1]; return acc + o.w * (a1 + (b1 - a1) * tx + (c1 - a1) * ty + (a1 - b1 - c1 + d1) * tx * ty); }, 0);
        const ign = [[Math.random() * .5 + .25, 1.05], [Math.random() < .5 ? -.05 : 1.05, .6 + Math.random() * .4]];
        const field = new Float32Array(gw * gh);
        let mn = 9, mx = -9;
        for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
          const u = x / gw, v = y / gh;
          const d = Math.min(...ign.map(([ix, iy], i) => Math.hypot((u - ix) * (W / Hh) * .55, v - iy) * (i ? 1.25 : 1)));
          const val = d * .72 + noise(u, v) * .36;
          field[y * gw + x] = val; if (val < mn) mn = val; if (val > mx) mx = val;
        }
        for (let i = 0; i < field.length; i++) field[i] = (field[i] - mn) / (mx - mn);
        const mc = document.createElement('canvas'); mc.width = gw; mc.height = gh; const mctx = mc.getContext('2d'); const mimg = mctx.createImageData(gw, gh);
        const gc = document.createElement('canvas'); gc.width = gw; gc.height = gh; gc.className = 'jf-glow'; const gctx = gc.getContext('2d'); const gimg = gctx.createImageData(gw, gh);
        f.appendChild(gc);
        const fr = f.getBoundingClientRect();
        const fx2 = h('div.jf-embers'); document.body.appendChild(fx2);
        const t0 = performance.now(), dur = 3200;
        const step = now => {
          const k = Math.min(1, (now - t0) / dur);
          const t = -.06 + k * 1.14;
          const md2 = mimg.data, gd = gimg.data;
          const edgeCells = [];
          for (let i = 0; i < field.length; i++) {
            const v = field[i] - t, o = i * 4;
            const ss = (e0, e1, x) => { const q = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return q * q * (3 - 2 * q); };
            md2[o] = md2[o + 1] = md2[o + 2] = 0; md2[o + 3] = 255 * ss(0, .007, v);
            // flame core → orange → char → paper
            const core = 1 - ss(.0, .012, v), orange = 1 - ss(.008, .03, v), chr = 1 - ss(.02, .095, v);
            let r = 40 + 215 * orange, g = 20 + 90 * orange + 120 * core, b = 10 + 20 * orange + 90 * core, a = Math.max(core, orange * .92, chr * .82) * 255 * ss(0, .002, v);
            if (v > .004 && v < .012 && Math.random() < .003) edgeCells.push(i);
            gd[o] = r; gd[o + 1] = g; gd[o + 2] = b; gd[o + 3] = a;
          }
          mctx.putImageData(mimg, 0, 0); gctx.putImageData(gimg, 0, 0);
          const url = `url(${mc.toDataURL()})`;
          f.style.webkitMaskImage = url; f.style.maskImage = url;
          edgeCells.slice(0, 6).forEach(i => {
            const ex = fr.left + (i % gw) * S2, ey = fr.top + Math.floor(i / gw) * S2;
            const e = h('i.jf-ember', { style: { left: ex + 'px', top: ey + 'px' } }); fx2.appendChild(e);
            e.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${(Math.random() - .5) * 50}px, ${-50 - Math.random() * 110}px) scale(.15)`, opacity: 0 }], { duration: 800 + Math.random() * 900, easing: 'ease-out', fill: 'forwards' }).onfinish = () => e.remove();
            if (Math.random() < .35) {
              const sm2 = h('i.jf-smoke', { style: { left: ex + 'px', top: ey + 'px' } }); fx2.appendChild(sm2);
              sm2.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: .35 }, { transform: `translate(${-50 + (Math.random() - .5) * 80}%, ${-260 - Math.random() * 200}%) scale(2.4)`, opacity: 0 }], { duration: 1800 + Math.random() * 1200, easing: 'ease-out', fill: 'forwards' }).onfinish = () => sm2.remove();
            }
          });
          if (k < 1) requestAnimationFrame(step); else setTimeout(() => { fx2.remove(); done(); }, 900);
        };
        requestAnimationFrame(step);
      }
    });
  }
  async function chooseRelease() {
    return new Promise(res => {
      let chosen = null;
      const opt = (id, ico, name, sub) => h('button.rel-opt', { onclick: () => { chosen = id; md.close(); } }, h('div.rel-ico.' + id, H.icon(ico, 22)), h('b', name), h('span', sub));
      const md = ui.modal('Как отпустить?', h('div.stack',
        h('p.muted', { style: { margin: 0 } }, 'Запись исчезнет насовсем. Выбери, как её отпустить:'),
        h('div.rel-grid', opt('burn', 'fire', 'Сжечь', 'медленно сгорит'), opt('wind', 'wind', 'Развеять', 'буквы улетят с ветром'), opt('tear', 'feather', 'Разорвать', 'на клочки — и в стороны'))),
        { onClose: () => res(chosen) });
    });
  }

  H.views.journal = function (root, params) {
    const M = document.documentElement.classList.contains('is-mobile');   // phone: focused writing, deck of questions
    const st = H.store.get().settings;
    let section = (params && params.section) || 'home';
    let cur = params && params.id ? params.id : null;
    const host = h('div.jr-body');
    const nav = h('div.jr-nav');
    const NAV = [['home', 'home', 'Главная'], ['entries', 'feather', 'Записи'], ['dreams', 'moon', 'Сны'], ['prompts', 'compass', 'Вопросы'], ['about', 'mind', 'О себе'], ['letters', 'clock', 'Письма в будущее'], ['joy', 'star', 'Банка радостей'], ['vent', 'wind', 'Выговориться']];
    const go = (sec, extra) => { section = sec; if (extra && 'id' in extra) cur = extra.id; render(); };
    let drawNav = () => { H.clear(nav); NAV.forEach(([id, ic, name]) => nav.appendChild(h('button.jr-nav-it' + (section === id ? '.on' : ''), { onclick: () => go(id) }, H.icon(ic, 16), h('span', name)))); };

    // empty pages left behind are removed automatically
    function sweep(keepId) {
      const s = H.store.get(); const before = (s.journal || []).length;
      s.journal = (s.journal || []).filter(e => e.id === keepId || (e.text || '').trim() || (e.title || '').trim());
      if (s.journal.length !== before) H.store.save();
    }
    function newEntry(prompt, promptId) {
      sweep(null);
      const { J } = ST(); const now = Date.now();
      const e = { id: H.uid(), created: now, updated: now, title: '', text: '', mood: null, prompt: prompt || null, promptId: promptId || null };
      J.unshift(e); H.store.save(); cur = e.id; section = 'entries'; render(true);
    }

    // ---------- DREAMS (read from the days, nothing is duplicated) ----------
    function dreams() {
      const TYPES = H.DREAMS.filter(x => x.id !== 'none');
      const tName = id => (H.DREAMS.find(x => x.id === id) || {}).name || id;
      const hasDream = d => d && d.sleep && (((d.sleep.dreamText || '').trim()) || (d.sleep.dreams || []).some(x => x !== 'none'));
      const collect = () => Object.keys(H.store.get().days || {}).sort().reverse().flatMap(k => ['day','evening'].map(period=>({...H.periods.read(H.store.get().days[k],period),_period:period}))).filter(hasDream);
      let filt = 'all', q = '';
      const wrap = h('div.dr-wrap');
      st.dreamPrivacy=st.dreamPrivacy||{};
      const privacyKey=(date,period='day')=>date+'|'+period;
      if(st.dreamBlur){collect().forEach(d=>{const key=privacyKey(d.date,d._period);if(st.dreamPrivacy[key]==null)st.dreamPrivacy[key]=true;});delete st.dreamBlur;H.store.save();}
      const isHidden=(date,period='day')=>st.dreamPrivacy[privacyKey(date,period)]??!!st.dreamBlur;
      function syncPrivacy(){document.querySelectorAll('[data-dream-key]').forEach(el=>{const key=el.dataset.dreamKey,hidden=st.dreamPrivacy[key]??!!st.dreamBlur;el.classList.toggle('private-text',hidden);el.setAttribute('aria-hidden',String(hidden));if(el.matches('textarea'))el.readOnly=hidden;});}
      function privacyButton(date,period='day'){const b=h('button.icon-btn.small',{title:isHidden(date,period)?'Показать этот сон':'Скрыть этот сон','aria-label':isHidden(date,period)?'Показать этот сон':'Скрыть этот сон',onclick:()=>{const key=privacyKey(date,period);st.dreamPrivacy[key]=!isHidden(date,period);H.store.save();b.title=st.dreamPrivacy[key]?'Показать этот сон':'Скрыть этот сон';b.setAttribute('aria-label',b.title);syncPrivacy();}},H.icon('eye',16));return b;}
      const feed = h('div.dr-feed'), statsHost = h('div'), chips = h('div.dr-chips');
      const sBox = h('div.jr-sbox.dr-sbox');
      const sInp = h('input.inp.jr-search', { placeholder: 'Найти в снах…', oninput: e => { q = e.target.value.trim().toLowerCase(); draw(); } });
      sBox.append(sInp);
      const sBtn = h('button.icon-btn.small', { title: 'Поиск', onclick: () => { const o = sBox.classList.toggle('open'); if (o) setTimeout(() => sInp.focus(), 60); else if (q) { sInp.value = ''; q = ''; draw(); } } }, H.icon('search', 16));

      function editor(date,period='day') {
        const d0 = H.periods.read(H.store.day(date),period) || {}; const s0 = d0.sleep || {};
        const sel = new Set((s0.dreams || []).filter(x => x !== 'none'));
        const row = h('div.chips', TYPES.map(t => ui.chip(t.name, sel.has(t.id), (e, c) => { if (sel.has(t.id)) sel.delete(t.id); else sel.add(t.id); c.classList.toggle('on', sel.has(t.id)); })));
        const ta = h('textarea.ta.dr-ta', { rows: 6, placeholder: 'Что снилось? Образы, люди, места, ощущения после пробуждения…' }); ta.value = s0.dreamText || '';ta.dataset.dreamKey=privacyKey(date,period);
        const save = () => {
          const d = H.periods.write(H.store.day(date,true),period); d.sleep = d.sleep || {};
          const txt = ta.value.replace(/\s+$/, '');
          if (sel.size) d.sleep.dreams = [...sel]; else delete d.sleep.dreams;
          if (txt.trim()) d.sleep.dreamText = txt; else delete d.sleep.dreamText;
          H.periods.touch(H.store.day(date,true),period,'sleep');H.store.touch(date, 'sleep'); H.game && H.game.onDayEdit && H.game.onDayEdit(date, 'sleep');
          md.close(); draw(); ui.toast && ui.toast('Сон сохранён');
        };
        const md = ui.modal(date === H.today() ? 'Сон за эту ночь' : 'Сон · ночь на ' + H.fmtLong(date),
          h('div.stack', h('div.row', h('div.muted', { style: { fontSize: '.86rem' } }, 'Каким был сон?'), privacyButton(date,period)), row, ta,
            h('div.muted', { style: { fontSize: '.8rem' } }, 'Сохранится в день ' + H.fmtLongY(date) + ' — в блок «Сон».')),
          { actions: [h('button.btn.primary', { onclick: save }, 'Сохранить')] });
        syncPrivacy();
        if (!isHidden(date,period)) setTimeout(() => ta.focus(), 120);
      }

      function stats(all) {
        H.clear(statsHost);
        const from = H.addDays(H.today(), -29);
        const last = all.filter(d => d.date >= from);
        if (!all.length) return;
        const cnt = {}; last.forEach(d => (d.sleep.dreams || []).forEach(t => { if (t !== 'none') cnt[t] = (cnt[t] || 0) + 1; }));
        const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
        const heavy = last.filter(d => (d.sleep.dreams || []).some(t => t === 'anxious' || t === 'nightmare'));
        const mins = arr => { const v = arr.map(d => H.metrics.sleepMinutes(d)).filter(x => x != null && x > 0); return v.length >= 2 ? v.reduce((a, b) => a + b, 0) / v.length : null; };
        const heavyAll = all.filter(d => (d.sleep.dreams || []).some(t => t === 'anxious' || t === 'nightmare'));
        const calmAll = Object.values(H.store.get().days || {}).filter(d => d.sleep && !(d.sleep.dreams || []).some(t => t === 'anxious' || t === 'nightmare'));
        const mh = mins(heavyAll), mc = mins(calmAll);
        const tile = (v, l) => h('div.dr-stat', h('b', v), h('span', l));
        statsHost.append(h('div.glass.card.dr-stats',
          h('div.dr-stats-t', 'За последние 30 дней'),
          h('div.dr-stat-row',
            tile(String(last.length), H.plural(last.length, 'ночь со сном', 'ночи со снами', 'ночей со снами')),
            tile(top.length ? tName(top[0][0]) : '—', 'чаще всего'),
            tile(String(heavy.length), 'тревожных и кошмаров')),
          top.length > 1 ? h('div.dr-bars', top.slice(0, 5).map(([id, n]) => h('div.dr-bar', h('span', tName(id)), h('i', h('em', { style: { width: Math.round(n / top[0][1] * 100) + '%' } })), h('b', String(n))))) : null,
          mh != null && mc != null ? h('div.dr-note', `В ночи с тревожными снами или кошмарами ты спишь в среднем ${H.fmtDur(Math.round(mh))}, в остальные — ${H.fmtDur(Math.round(mc))}.`) : null));
      }

      function card(d) {
        const s = d.sleep, types = (s.dreams || []).filter(x => x !== 'none'), txt = (s.dreamText || '').trim();
        const mins = H.metrics.sleepMinutes(d);
        const body = txt ? h('div.dr-text', txt) : h('div.dr-text.muted', 'без описания');body.dataset.dreamKey=privacyKey(d.date,d._period);body.classList.toggle('private-text',isHidden(d.date,d._period));body.setAttribute('aria-hidden',String(isHidden(d.date,d._period)));
        if (txt.length > 260) { body.classList.add('clamp'); body.onclick = () => body.classList.toggle('clamp'); }
        return h('div.glass.dr-card',
          h('div.dr-head',
            h('div', h('div.dr-date', 'Ночь на ' + H.fmtLong(d.date)), h('div.dr-sub', H.cap(H.weekday(d.date)) + (mins ? ' · сон ' + H.fmtDur(mins) : '') + (s.quality != null ? ' · качество ' + s.quality + '/10' : ''))),
            h('div', { style: { flex: 1 } }),
            privacyButton(d.date,d._period),h('button.icon-btn.small', { title: 'Изменить', onclick: () => editor(d.date,d._period) }, H.icon('feather', 15))),
          types.length ? h('div.dr-tags', types.map(t => h('span.dr-tag.t-' + t, tName(t)))) : null,
          body,
          h('button.dr-open', { onclick: () => H.go('day', { date: d.date }) }, 'открыть день ›'));
      }

      function draw() {
        const all = collect();
        stats(all);
        H.clear(chips);
        const present = new Set(all.flatMap(d => d.sleep.dreams || []));
        chips.append(h('button.jr-fchip' + (filt === 'all' ? '.on' : ''), { onclick: () => { filt = 'all'; draw(); } }, 'Все'));
        TYPES.filter(t => present.has(t.id)).forEach(t => chips.append(h('button.jr-fchip' + (filt === t.id ? '.on' : ''), { onclick: () => { filt = filt === t.id ? 'all' : t.id; draw(); } }, t.name)));
        chips.append(h('div', { style: { flex: 1 } }), sBtn);
        syncPrivacy();
        const items = all.filter(d => filt === 'all' || (d.sleep.dreams || []).includes(filt)).filter(d => !q || ((d.sleep.dreamText || '') + ' ' + (d.sleep.dreams || []).map(tName).join(' ')).toLowerCase().includes(q));
        H.clear(feed);
        if (!all.length) feed.append(h('div.glass.card.jr-empty', h('div', { style: { fontSize: '2rem' } }, '🌙'), h('b', 'Здесь будут твои сны'), h('p.muted', 'Записывай сон утром — кнопкой выше или в дне, в блоке «Сон». Все сны соберутся здесь лентой.')));
        else if (!items.length) feed.append(h('div.muted', { style: { textAlign: 'center', padding: '24px 0' } }, 'Ничего не нашлось'));
        else {
          let month = '';
          items.forEach(d => {
            const m = H.cap(new Date(d.date + 'T12:00').toLocaleString('ru', { month: 'long', year: 'numeric' }));
            if (m !== month) { month = m; feed.append(h('div.dr-month', m)); }
            feed.append(card(d));
          });
        }
      }

      const todayHas = hasDream(H.store.day(H.today()));
      wrap.append(
        h('div.dr-top',
          h('div', h('div.jr-kicker', 'Сны'), h('div.dr-h', 'Дневник снов'), h('div.muted', { style: { fontSize: '.86rem' } }, 'Все сны из твоих дней — в одном месте.')),
          h('button.btn.primary', { onclick: () => editor(H.today()) }, H.icon('moon', 15), todayHas ? 'Сон за эту ночь' : '+ Сон за эту ночь')),
        statsHost, chips, sBox, feed);
      draw();
      syncPrivacy();
      return wrap;
    }

    // ---------- HOME ----------
    function home() {
      const { J, X } = ST();
      const dq = pick(D().daily, dayNum());
      const todayEntry = J.find(e => e.prompt === dq && H.iso(new Date(e.created)) === H.today());
      const answeredToday = todayEntry && (todayEntry.text||'').trim() ? todayEntry : null;
      const aboutTotal = D().about.reduce((a, g) => a + g.items.length, 0), aboutDone = Object.keys(X.about).filter(k => (X.about[k].text || '').trim()).length;
      const sealed = X.letters.filter(l => l.open > H.today()).length, ready = X.letters.filter(l => l.open <= H.today() && !l.opened).length;
      const wordsTotal = J.reduce((a, e) => a + words(e.text), 0);
      const tile = (sec, ic, t, sub, extra) => h('button.jr-tile.' + sec, { onclick: () => go(sec) }, h('div.jt-glow'), H.gicon(ic, 20), h('b', t), h('span', sub), extra || null);
      return h('div.jr-home',
        h('div.jr-hero',
          h('div.jr-ink'),
          h('div', h('div.jr-kicker', 'Вопрос дня'), answeredToday ? h('div.jr-answered','Ты уже ответила сегодня') : null, h('div.jr-dq', dq),
            h('div.row', { style: { gap: '8px', marginTop: '14px' } },
              answeredToday ? h('button.btn', { onclick: () => { cur = answeredToday.id; go('entries'); } }, 'Открыть ответ') : h('button.btn.primary', { onclick: () => newEntry(dq) }, H.icon('feather', 15), 'Ответить')))),
        h('div.jr-tiles',
          tile('entries', 'feather', 'Все записи', J.length ? `${J.length} ${H.plural(J.length, 'запись', 'записи', 'записей')}` : 'пока пусто'),
          tile('joy', 'star', 'Банка радостей', X.joys.length ? `${X.joys.length} ${H.plural(X.joys.length, 'радость', 'радости', 'радостей')} внутри` : 'собирай маленькие хорошие моменты'),
          tile('letters', 'clock', 'Письма в будущее', ready ? `${ready} ${H.plural(ready, 'письмо можно', 'письма можно', 'писем можно')} открыть ✨` : sealed ? `${sealed} ${H.plural(sealed, 'письмо ждёт', 'письма ждут', 'писем ждут')} своего дня` : 'напиши себе через месяц или год'),
          tile('vent', 'wind', 'Выговориться', 'написать всё как есть — и отпустить'),
          tile('prompts', 'compass', 'Вопросы', `${allPrompts().length} вопросов в ${D().prompts.length} темах`),
          tile('about', 'mind', 'О себе', `${aboutDone} из ${aboutTotal} — твой портрет`, h('div.jt-prog', h('i', { style: { width: (aboutTotal ? aboutDone / aboutTotal * 100 : 0) + '%' } })))),
        null);
    }

    // ---------- ENTRIES ----------
    function entries(focus) {
      const { J } = ST();
      if(st.journalBlur){J.forEach(e=>{if(e.private==null)e.private=true;});delete st.journalBlur;H.store.save();}
      const hidden=e=>!!e.private;
      const privacy=(e,redraw)=>h('button.icon-btn.small',{title:hidden(e)?'Показать эту запись':'Скрыть эту запись','aria-label':hidden(e)?'Показать эту запись':'Скрыть эту запись',onclick:ev=>{ev.stopPropagation();e.private=!hidden(e);H.store.save();redraw();}},H.icon('eye',15));
      let q = '';
      const listHost = h('div.jr-list'), pageHost = h('div.jr-page-host');
      let gridEl = null, historyToggle=null;
      function setHistoryHidden(value){st.journalSideHidden=value;H.store.save();if(gridEl)gridEl.classList.toggle('side-hidden',value);if(historyToggle){historyToggle.setAttribute('aria-expanded',String(!value));historyToggle.title=value?'Открыть историю записей':'Свернуть историю записей';H.clear(historyToggle);historyToggle.append(H.h('span','История'));} }

      // folders: «Личные» and «Ответы на вопросы» are automatic, own folders can be added
      const folderBar = h('div.jr-folders');
      const FX = () => { const x = ST().X; x.folders = x.folders || []; return x.folders; };
      function drawFolders() {
        H.clear(folderBar);
        const fl = st.journalFolder || 'all';
        const chip = (id, name, extra) => h('button.jr-fchip' + (fl === id ? '.on' : ''), { onclick: () => { if (fl === id && extra) return extra(); st.journalFolder = id; H.store.save(); drawList(); } }, name, fl === id && extra ? h('span.jr-fedit', '✎') : null);
        folderBar.append(chip('all', 'Все'), chip('personal', 'Личные'), chip('answers', 'Ответы на вопросы'));
        FX().forEach(f => folderBar.append(chip(f.id, f.name, () => editFolder(f))));
        folderBar.append(h('button.jr-fchip.add', { title: 'Новая папка', onclick: () => newFolder() }, '+'));
      }
      function askName(title, val) {
        return new Promise(res => {
          const inp = h('input.inp', { value: val || '', placeholder: 'Например: Работа, Сны, Терапия' });
          const md = ui.modal(title, h('div.stack', inp), { onClose: () => res(null), actions: [h('button.btn.primary', { onclick: () => { const v = inp.value.trim(); if (!v) return; res(v); md.close(); } }, 'Готово')] });
          setTimeout(() => inp.focus(), 80);
          inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { const v = inp.value.trim(); if (v) { res(v); md.close(); } } });
        });
      }
      async function newFolder(forEntry) {
        const name = await askName('Новая папка'); if (!name) return null;
        const f = { id: 'f_' + H.uid(), name: name.slice(0, 40) }; FX().push(f);
        if (forEntry) forEntry.folder = f.id; else st.journalFolder = f.id;
        H.store.save(); drawList(); return f;
      }
      async function editFolder(f) {
        const md = ui.modal('Папка «' + f.name + '»', h('div.stack',
          h('button.btn', { onclick: async () => { md.close(); const n = await askName('Переименовать папку', f.name); if (n) { f.name = n.slice(0, 40); H.store.save(); render(); } } }, 'Переименовать'),
          h('button.btn.ghost', { style: { color: '#e5484d' }, onclick: async () => { md.close(); if (!await ui.confirm(`Удалить папку «${f.name}»? Записи из неё не удалятся — вернутся в «Личные» или «Ответы».`, 'Удалить папку', true)) return; const s2 = ST(); s2.X.folders = FX().filter(x => x.id !== f.id); s2.J.forEach(e => { if (e.folder === f.id) delete e.folder; }); st.journalFolder = 'all'; H.store.save(); render(); } }, 'Удалить папку')));
      }
      // small «папка» control in the editor
      function folderPick(e) {
        const name = () => { const f = FX().find(x => x.id === e.folder); return f ? f.name : (e.prompt ? 'Ответы на вопросы' : 'Личные'); };
        let pop = null;
        const done = () => { e.updated = Date.now(); H.store.save(); upd(); drawList(); pop && pop.close(); };
        const btn = h('button.jr-fpick', { title: 'Папка', onclick: () => {
          const list = h('div.jr-fmenu',
            h('div.jr-fmenu-t', 'Папка записи'),
            h('button' + (!e.folder ? '.on' : ''), { onclick: () => { delete e.folder; done(); } }, e.prompt ? 'Ответы на вопросы' : 'Личные'),
            FX().map(f => h('button' + (e.folder === f.id ? '.on' : ''), { onclick: () => { e.folder = f.id; done(); } }, f.name)),
            h('button.add', { onclick: async () => { pop && pop.close(); await newFolder(e); upd(); } }, '+ Новая папка'));
          pop = ui.popover(btn.getBoundingClientRect(), list);
        } }, H.icon('list', 13), h('span'));
        const upd = () => { btn.querySelector('span').textContent = name(); };
        upd();
        return btn;
      }
      const drawList = () => {
        H.clear(listHost);
        const all = J.slice().sort((a, b) => b.created - a.created);
        const ql = q.toLowerCase();
        const fl = st.journalFolder || 'all';
        const inFolder = e => fl === 'all' ? true : fl === 'personal' ? !e.prompt && !e.folder : fl === 'answers' ? !!e.prompt && !e.folder : e.folder === fl;
        drawFolders();
        const items = all.filter(inFolder).filter(e => !ql || (e.title + ' ' + e.text + ' ' + (e.prompt || '')).toLowerCase().includes(ql));
        if (!all.length) { listHost.appendChild(h('div.jr-empty', 'Здесь будут твои записи. Их видишь только ты.')); return; }
        if (!items.length) { listHost.appendChild(h('div.jr-empty', 'Ничего не найдено')); return; }
        let lastDay = '';
        const t0 = H.today(), y0 = H.addDays(t0, -1);
        items.forEach(e => {
          const d = new Date(e.created); const iso = H.iso(d);
          if (iso !== lastDay) { lastDay = iso; listHost.appendChild(h('div.jr-dayhead', iso === t0 ? 'Сегодня' : iso === y0 ? 'Вчера' : H.cap(H.weekday(iso)) + ', ' + H.fmtLong(iso) + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''))); }
          const m = MOODS.find(x => x.id === e.mood);
          listHost.appendChild(h('div.jr-item' + (e.id === cur ? '.on' : '') + (hidden(e) ? '.blur' : ''), {role:'button',tabindex:0,onkeydown:ev=>{if(ev.target===ev.currentTarget&&(ev.key==='Enter'||ev.key===' ')){ev.preventDefault();ev.currentTarget.click();}}, onclick: () => { const prev = cur; cur = e.id; if (prev !== e.id) sweep(e.id); if (M) { render(); return; } drawList(); drawPage(); } },
            m ? h('i.jr-mood-dot', { style: { background: m.c, boxShadow: `0 0 10px ${m.c}` } }) : h('i.jr-mood-dot.none'),
            h('div.jr-it-main', h('div.jr-it-t', e.title || (e.prompt ? e.prompt : preview(e.text).slice(0, 40)) || 'Новая запись'), h('div.jr-it-p', preview(e.text) || '…')),
            privacy(e,drawList),h('span.jr-time', H.pad(d.getHours()) + ':' + H.pad(d.getMinutes()))));
        });
      };
      const drawPage = (fc) => {
        H.clear(pageHost);
        const e = J.find(x => x.id === cur);
        if (!e) {
          pageHost.appendChild(h('div.jr-welcome', h('div.jr-ink'), h('h2', 'Выбери запись или начни новую'),
            h('div.row', { style: { justifyContent: 'center', gap: '8px' } }, h('button.btn.primary', { onclick: () => newEntry() }, H.icon('feather', 16), 'Новая запись'))));
          return;
        }
        const meta = h('span.jr-meta');
        const updMeta = () => { meta.textContent = `${e.updated !== e.created ? 'изменено ' + H.fmtStamp(e.updated) : 'создано ' + H.fmtStamp(e.created)}`; };
        const save = H.debounce(() => { e.updated = Date.now(); H.store.save(); updMeta(); drawList(); }, 500);
        const title = h('input.jr-title' + (e.title ? '' : '.hide'), { placeholder: '', value: e.title || '' });
        title.addEventListener('input', () => { e.title = title.value; save(); });
        title.addEventListener('blur', () => { if (!title.value.trim()) title.classList.add('hide'); });
        // rich page: bold / italic and alignment apply to the selected text (or the current paragraph)
        const ed = h('div.jr-text.jr-rich', { contenteditable: 'true', spellcheck: 'true', 'data-ph': e.prompt ? 'Пиши как есть…' : 'Что у тебя на душе?…' });
        ed.innerHTML = e.html ? cleanHtml(e.html) : textToHtml(e.text || '', e.align);
        const sync = () => { e.html = cleanHtml(ed.innerHTML); e.text = htmlToText(ed); if (!e.text.trim()) { e.html = ''; } ed.classList.toggle('is-empty', !e.text.trim()); save(); };
        ed.classList.toggle('is-empty', !(e.text || '').trim());
        ed.addEventListener('input', sync);
        ed.addEventListener('paste', ev => { ev.preventDefault(); const t = (ev.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
        ed.addEventListener('focus', () => { try { document.execCommand('defaultParagraphSeparator', false, 'div'); } catch (er) {} });
        const ICON = p => H.svg(`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">${p}</svg>`);
        const AL = [['justifyLeft', 'По левому краю', '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>'], ['justifyCenter', 'По центру', '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>'], ['justifyRight', 'По правому краю', '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>'], ['justifyFull', 'По ширине', '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>']];
        const cmdBtn = (cmd, ttl, inner) => {
          const b = h('button.jr-tool', { title: ttl, dataset: { cmd } }, inner);
          b.addEventListener('pointerdown', ev => ev.preventDefault());      // keep the selection inside the page
          b.addEventListener('mousedown', ev => ev.preventDefault());
          b.addEventListener('click', () => { if (document.activeElement !== ed) ed.focus(); document.execCommand(cmd, false, null); sync(); paint(); });
          return b;
        };
        const tools = h('div.jr-tools',
          h('button.jr-tool' + (e.title ? '.on' : ''), { title: 'Название записи', onclick: () => { title.classList.remove('hide'); title.focus(); } }, h('span.jr-tt', 'Аа')),
          h('i.jr-tsep'),
          cmdBtn('bold', 'Жирный', h('b.jr-tb', 'Ж')), cmdBtn('italic', 'Курсив', h('i.jr-ti', 'К')),
          h('i.jr-tsep'),
          AL.map(([cmd, ttl, p]) => cmdBtn(cmd, ttl, ICON(p))));
        const paint = () => {
          const inside = document.activeElement === ed;
          tools.querySelectorAll('[data-cmd]').forEach(b => { let on = false; try { on = inside && document.queryCommandState(b.dataset.cmd); } catch (er) {} b.classList.toggle('on', on); });
        };
        const onSel = () => { if (!ed.isConnected) { document.removeEventListener('selectionchange', onSel); return; } paint(); };
        document.addEventListener('selectionchange', onSel);
        const others = e.prompt ? J.filter(x => x.prompt === e.prompt && x.id !== e.id && (x.text || '').trim()).sort((a, b) => b.created - a.created) : [];
        const past = others.length ? h('details.jr-past', h('summary', `Прошлые ответы на этот вопрос · ${others.length}`), others.map(o => h('button.jr-past-it', { onclick: () => { cur = o.id; sweep(o.id); render(); } }, h('span.faint', H.fmtLongY(H.iso(new Date(o.created)))), h('span', preview(o.text))))) : null;
        const moods = h('div.jr-moods', h('span.faint', 'Погода внутри:'), MOODS.map(m => h('button.jr-mood' + (e.mood === m.id ? '.on' : ''), { title: m.name, style: { '--mc': m.c }, onclick: ev => { e.mood = e.mood === m.id ? null : m.id; ev.currentTarget.parentNode.querySelectorAll('.jr-mood').forEach((b, i) => b.classList.toggle('on', MOODS[i].id === e.mood)); save(); } }, h('i'), h('span', m.name))));
        const paper = h('div.jr-paper', h('div.jr-paper-top', moods, tools), e.prompt ? h('div.jr-q', '«' + e.prompt + '»') : null, past, title, ed);
        const finish=h('button.btn.primary.small.note-save',{title:'Сохранить и вернуться','aria-label':'Сохранить и вернуться',onclick:()=>{sync();e.updated=Date.now();H.store.persistNow();cur=null;go('home');}},'Сохранить');
        const privateView=()=>{[ed,title,...paper.querySelectorAll('.jr-q')].forEach(el=>{el.classList.toggle('private-text',hidden(e));el.setAttribute('aria-hidden',String(hidden(e)));});ed.contentEditable=String(!hidden(e));title.readOnly=hidden(e);};privateView();
        const eye=privacy(e,()=>{privateView();drawList();});
        const del = h('button.icon-btn.small.jr-del', { title: 'Удалить запись', onclick: async () => {
          if (!await ui.confirm('Удалить эту запись? Её нельзя будет вернуть.', 'Удалить', true)) return;
          const s2 = H.store.get(); s2.journal = s2.journal.filter(x => x.id !== e.id); H.store.save(); cur = null; ui.toast('Запись удалена'); render();
        } }, H.icon('trash', 15));
        const bar = h('div.jr-bar', finish,eye,meta, folderPick(e), h('div', { style: { flex: 1 } }), del,
          h('button.btn.small.jr-newbtn', { onclick: () => newEntry() }, H.icon('feather', 15), 'Новая'),
          h('button.icon-btn.small.jr-histbtn', { title: 'Показать историю записей', onclick: () => { setHistoryHidden(false); } }, H.icon('list', 15)));
        if (M) {   // phone: only the page — a back arrow and a quiet line of meta
          const back = h('button.jr-back', { onclick: () => { cur = null; sweep(null); render(); } }, H.icon('chevron', 18), h('span', 'Записи'));
          pageHost.append(h('div.jr-wbar', back, h('div', { style: { flex: 1 } }), folderPick(e),eye,finish,del), paper, h('div.jr-wmeta', meta));
        } else pageHost.append(bar, paper);
        updMeta();
        requestAnimationFrame(() => { if (fc && !hidden(e)) { ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } });
      };
      // search stays out of the way: a small magnifier, the field opens only when needed
      const search = h('input.inp.jr-search', { placeholder: 'Найти в записях', type: 'search' });
      search.addEventListener('input', () => { q = search.value; drawList(); });
      const sBox = h('div.jr-sbox', search);
      const sBtn = h('button.icon-btn.small', { title: 'Поиск по записям', onclick: () => { const open = !sBox.classList.contains('open'); sBox.classList.toggle('open', open); sBtn.classList.toggle('on', open); if (open) setTimeout(() => search.focus(), 60); else { search.value = ''; q = ''; drawList(); } } }, H.icon('search', 15));
      const side = h('div.glass.jr-side',
        h('div.row', { style: { gap: '8px', marginBottom: '10px' } },
          h('button.btn.primary.small', { style: { flex: 1 }, onclick: () => newEntry() }, H.icon('feather', 15), 'Новая запись'),
          sBtn,
          M ? null : h('button.icon-btn.small.jr-collapse', { title: 'Свернуть историю', onclick: () => { setHistoryHidden(true); } }, H.icon('chevron', 15)),
          null),
        sBox, folderBar, listHost);
      drawList(); if (!M || cur) drawPage(focus);
      if (M) return cur && J.find(x => x.id === cur) ? h('div.jr-writer', pageHost) : side;
      gridEl = h('div.jr-grid' + (st.journalSideHidden ? '.side-hidden' : ''), h('div.jr-main', pageHost), side);
      historyToggle=h('button.jr-history-toggle',{type:'button','aria-label':'История записей','aria-expanded':String(!st.journalSideHidden),title:st.journalSideHidden?'Открыть историю записей':'Свернуть историю записей',onclick:()=>setHistoryHidden(!st.journalSideHidden)},h('span','История'));
      return h('div.jr-history-shell',h('div.jr-history-control',historyToggle),gridEl);
    }

    // ---------- PROMPTS library ----------
    function prompts() {
      const { J } = ST();
      const cnt = {}, lastAt = {};
      J.forEach(e => { if (e.prompt && (e.text || '').trim()) { cnt[e.prompt] = (cnt[e.prompt] || 0) + 1; lastAt[e.prompt] = Math.max(lastAt[e.prompt] || 0, e.created); } });
      const answered = { has: q2 => !!cnt[q2] };
      const groups = D().prompts;
      let gid = groups[0] ? groups[0].id : null;
      const listHost = h('div');
      const draw = () => {
        H.clear(listHost);
        const g = groups.find(x => x.id === gid); if (!g) return;
        listHost.appendChild(h('div.jr-qgrid', g.items.map((it, i) => {
          const n = cnt[it.q] || 0;
          return h('button.jr-qcard', { style: { animationDelay: (i * 30) + 'ms' }, onclick: () => newEntry(it.q, it.id) },
            h('span.jq-n', String(i + 1).padStart(2, '0')), h('span.jq-t', it.q),
            n ? h('span.jq-cnt', { title: `Ты отвечала ${n} ${H.plural(n, 'раз', 'раза', 'раз')}, последний — ${H.fmtLong(H.iso(new Date(lastAt[it.q])))}` }, Array.from({ length: Math.min(n, 5) }, () => h('i')), n > 5 ? h('small', '+' + (n - 5)) : null) : null);
        })));
      };
      // phone: one question at a time — pick a topic or any, «другой вопрос» deals the next card
      function deck() {
        let topic = null, curQ = null; const seen = new Set();
        const wrap = h('div.jr-deckwrap');
        const pool = () => {
          const src = topic ? (groups.find(g => g.id === topic) || { items: [] }).items.map(it => ({ ...it, g: topic })) : allPrompts();
          const fresh = src.filter(p => !answered.has(p.q) || Date.now() - lastAt[p.q] > 14 * 86400000);
          return fresh.length ? fresh : src;
        };
        const deal = () => {
          const p = pool(); let c = p.filter(x => !seen.has(x.q)); if (!c.length) { seen.clear(); c = p; }
          curQ = c[Math.floor(Math.random() * c.length)] || null; if (curQ) seen.add(curQ.q); drawCard(true);
        };
        const card = h('div.jr-deck');
        const drawCard = anim => {
          H.clear(card);
          if (!curQ) { card.append(h('p.muted', 'Вопросов нет')); return; }
          const g = groups.find(x => x.items.some(it => it.q === curQ.q));
          const n = cnt[curQ.q] || 0;
          card.append(...[
            h('div.jd-kicker', g ? g.name : 'Вопрос'),
            h('div.jd-q', curQ.q),
            n ? h('div.jd-cnt', `Ты уже отвечала ${n} ${H.plural(n, 'раз', 'раза', 'раз')} — можно ещё`) : null,
            h('div.jd-actions',
              h('button.btn.primary', { onclick: () => newEntry(curQ.q, curQ.id) }, H.icon('feather', 15), 'Ответить'),
              h('button.btn.ghost', { onclick: deal }, H.icon('dice', 15), 'Другой вопрос'))].filter(Boolean));
          if (anim) { card.classList.remove('deal'); void card.offsetWidth; card.classList.add('deal'); }
        };
        const chips = h('div.jd-topics', [{ id: null, name: 'Любая тема', ic: 'sparkle' }].concat(groups).map(g => h('button.jr-gtab' + (g.id === topic ? '.on' : ''), { onclick: ev => { topic = g.id; chips.querySelectorAll('.jr-gtab').forEach(b => b.classList.remove('on')); ev.currentTarget.classList.add('on'); seen.clear(); deal(); } }, H.icon(g.ic, 14), g.name)));
        const allBox = h('details.jd-all', h('summary', 'Показать все вопросы'), listHost);
        allBox.addEventListener('toggle', () => { if (allBox.open) { gid = topic || (groups[0] && groups[0].id); draw(); } });
        deal();
        wrap.append(h('h2.jd-title', 'Вопрос для тебя'), card, h('div.jd-label', 'Другая тема'), chips, allBox);
        return wrap;
      }
      const tabs = h('div.jr-gtabs', groups.map(g => h('button.jr-gtab' + (g.id === gid ? '.on' : ''), { onclick: ev => { gid = g.id; tabs.querySelectorAll('.jr-gtab').forEach(b => b.classList.remove('on')); ev.currentTarget.classList.add('on'); draw(); } }, H.icon(g.ic, 14), g.name)));
      draw();
      const all = allPrompts().filter(p => !answered.has(p.q)).concat(allPrompts().filter(p => answered.has(p.q) && Date.now() - lastAt[p.q] > 14 * 86400000));
      return deck();
      return h('div.stack',
        h('div.jr-panel-head', h('div', h('h2', 'Вопросы, на которые хочется ответить'), h('p.muted', 'На любой вопрос можно отвечать снова в разные дни — точки под вопросом показывают, сколько раз ты на него уже отвечала.')),
          h('button.btn.primary', { onclick: () => { const p = all[Math.floor(Math.random() * all.length)] || allPrompts()[0]; if (p) newEntry(p.q, p.id); } }, H.icon('dice', 15), 'Случайный вопрос')),
        tabs, listHost);
    }

    // ---------- ABOUT ME (interview + portrait) ----------
    function about() {
      const { X } = ST(), themes=D().about;
      X.aboutDeck=X.aboutDeck||{};
      let mode='grid',theme=null,it=null,editing=false;
      const wrap=h('div');
      const answeredIn=g=>g.items.filter(q=>X.about[q.id]&&(X.about[q.id].text||'').trim()).length;
      const deal=()=>{const state=X.aboutDeck[theme.id]||(X.aboutDeck[theme.id]={});it=H.pickPortraitQuestion(theme.items,X.about,state);editing=false;mode='ask';H.store.save();draw();};
      function draw(){
        H.clear(wrap);
        if(mode==='grid'){
          const done=themes.reduce((n,g)=>n+answeredIn(g),0);
          wrap.append(h('div.jr-panel-head',h('div',h('h2','О себе'),h('p.muted','Выбери тему — вытянем один вопрос. Можно ответить, взять другой или остановиться.')),h('button.btn',{onclick:()=>{mode='portrait';draw();}},H.icon('card',15),`Мой портрет · ${done}`)),
            h('div.ab-grid',themes.map(g=>h('button.ab-card',{onclick:()=>{theme=g;deal();}},H.icon(g.ic,24),h('b',g.name),h('span',g.desc||''),h('small',`${answeredIn(g)} ${H.plural(answeredIn(g),'ответ','ответа','ответов')}`)))));
        }else if(mode==='ask'&&it){
          const ta=h('textarea.ab-text',{placeholder:'Можно коротко или длинно — как хочется.'});ta.value=(X.about[it.id]||{}).text||'';
          const saved=h('span.faint',{role:'status'},ta.value?'Ответ сохранён':'Сохраняется автоматически');
          const save=()=>{if((X.about[it.id]||{}).text===ta.value||(!X.about[it.id]&&!ta.value.trim()))return;X.about[it.id]={text:ta.value,updated:Date.now()};H.store.save();saved.textContent='Ответ сохранён';};
          const next=h('button.btn.primary',{disabled:!ta.value.trim(),onclick:()=>{save();if(editing){mode='portrait';draw();}else deal();}},editing?'Сохранить и вернуться':'Сохранить и вытянуть ещё');
          ta.addEventListener('input',()=>{save();next.disabled=!ta.value.trim();});
          wrap.append(h('div.ab-ask.ab-random-card',
            h('div.row',h('button.btn.small.ghost',{onclick:()=>{save();mode='grid';draw();}},'‹ Все темы'),h('span.faint',theme.name)),
            h('div.ab-q',it.q),it.hint?h('div.ab-hint',it.hint):null,
            !editing&&(X.about[it.id]||{}).text?h('p.faint','Ты уже отвечала на этот вопрос. Можно дополнить ответ.'):null,
            ta,saved,h('div.ab-card-actions',next,
              !editing?h('button.btn.ghost',{onclick:()=>{save();deal();}},H.icon('dice',15),'Другой вопрос'):null,
              h('button.btn.ghost',{onclick:()=>{save();H.store.persistNow();go('home');}},'Сохранить и выйти'))));
        }else{
          const blocks=themes.map(g=>({g,items:g.items.filter(q=>X.about[q.id]&&(X.about[q.id].text||'').trim())})).filter(b=>b.items.length);
          wrap.append(h('div.portrait',h('button.btn.small.ghost',{onclick:()=>{mode='grid';draw();}},'‹ К темам'),h('div.pt-hero',h('h2','Мой портрет'),h('p.muted',blocks.length?'Твои ответы по темам. Любой можно дополнить.':'Ответь на один вопрос — здесь появится начало твоего портрета.')),
            blocks.map(b=>h('div.pt-block',h('div.pt-theme',H.icon(b.g.ic,15),b.g.name),b.items.map(q=>h('div.pt-item',h('div.pt-q',q.q),h('div.pt-a',X.about[q.id].text.trim()),h('button.icon-btn.small.portrait-edit',{title:'Редактировать ответ','aria-label':'Редактировать ответ',onclick:()=>{theme=b.g;it=q;editing=true;mode='ask';draw();}},H.icon('pencil',16))))))));
        }
      }
      draw();return wrap;
    }


    // ---------- LETTERS ----------
    function letters() {
      const { X } = ST();
      const wrap = h('div');
      const draw = () => {
        H.clear(wrap);
        const t = H.today();
        const list = X.letters.slice().sort((a, b) => a.open < b.open ? -1 : 1);
        wrap.append(h('div.jr-panel-head', h('div', h('h2', 'Письма в будущее'), h('p.muted', 'Напиши себе — письмо запечатается и откроется только в выбранный день.')),
          h('button.btn.primary', { onclick: write }, H.icon('feather', 15), 'Написать письмо')),
          list.length ? h('div.lt-grid', list.map(l => {
            const can = l.open <= t; const left = H.diffDays(l.open, t);
            return h('div.lt-env' + (can ? '.ready' : '') + (l.opened ? '.opened' : ''), { onclick: () => can ? openLetter(l) : ui.toast(`Откроется ${H.fmtLongY(l.open)} — через ${left} ${H.plural(left, 'день', 'дня', 'дней')}`, '✉') },
              h('div.lt-flap'), h('div.lt-seal', can ? '✦' : H.icon('clock', 14)),
              h('div.lt-info', h('b', l.title || 'Письмо себе'), h('span', can ? (l.opened ? 'прочитано' : 'можно открыть') : `откроется через ${left} ${H.plural(left, 'день', 'дня', 'дней')}`), h('small', 'написано ' + H.fmtShort(l.written))));
          })) : h('div.jr-empty', 'Пока писем нет. Попробуй написать себе через месяц: что сейчас волнует, чего ждёшь, что хочешь себе пожелать.'));
      };
      const write = () => {
        const starter = pick(D().letters, Math.floor(Math.random() * 1000));
        const l = { id: H.uid(), title: '', text: starter ? starter + ' ' : '', written: H.today(), open: H.addDays(H.today(), 30), opened: false };
        const ta = h('textarea.jr-text.lt-ta'); ta.value = l.text;
        const presets = [[30, 'через месяц'], [90, 'через 3 месяца'], [182, 'через полгода'], [365, 'через год']];
        const dateInp = ui.input(l.open, v => l.open = v, { type: 'date' });
        const md = ui.modal('Письмо в будущее', h('div.stack',
          ui.input('', v => l.title = v, { placeholder: 'Название (необязательно)' }),
          ta,
          h('div.fsection-title', 'Когда открыть'),
          h('div.row.wrapr', { style: { gap: '8px' } }, presets.map(([d, n]) => ui.chip(n, d === 30, (e, c) => { l.open = H.addDays(H.today(), d); dateInp.value = l.open; c.parentNode.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); c.classList.add('on'); })), dateInp)),
          { wide: true, actions: [h('button.btn.primary', { onclick: () => { l.text = ta.value; if (!l.text.trim()) return ui.toast('Письмо пустое', 'ℹ'); if (l.open <= H.today()) return ui.toast('Выбери дату в будущем', 'ℹ'); X.letters.push(l); H.store.save(); md.close(); ui.toast('Письмо запечатано до ' + H.fmtLongY(l.open), '✉'); draw(); } }, 'Запечатать')] });
        setTimeout(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 100);
      };
      const openLetter = l => {
        l.opened = true; H.store.save();
        const body = h('div.lt-read', h('div.lt-paper', h('div.jr-date', 'Написано ' + H.fmtLongY(l.written)), l.title ? h('h3', l.title) : null, h('div.lt-text', l.text)));
        ui.modal('Письмо от себя', body, { wide: true, cls: 'letter-modal', actions: [h('button.btn.ghost.delete-accent', { onclick: async () => { if (await ui.confirm('Удалить это письмо?', 'Удалить', true)) { X.letters = X.letters.filter(x => x !== l); ST().X.letters = X.letters; H.store.get().journalX.letters = X.letters; H.store.save(); document.querySelectorAll('.modal-back').forEach(m => m.remove()); draw(); } } }, 'Удалить')], onClose: draw });
      };
      draw();
      return wrap;
    }

    // ---------- JOY JAR ----------
    function joy() {
      const { X } = ST();
      const wrap = h('div');
      let outId = null;               // the joy currently taken out (not shown inside)
      const COLS = ['#ffd59a', '#ffc2d6', '#a8e6ff', '#c8b6ff', '#b8f5a0', '#ffe3a8'];
      const colOf = j => { let x = 0; for (const ch of String(j.id)) x = (x * 31 + ch.charCodeAt(0)) >>> 0; return COLS[x % COLS.length]; };
      const slot = i => {             // packed from the bottom of the jar, slightly random but stable
        const per = [5, 6, 5, 6, 5, 6, 5, 6, 5, 6, 5, 4, 3];
        let row = 0, idx = i; while (row < per.length - 1 && idx >= per[row]) { idx -= per[row]; row++; }
        const n = per[row], rr = (i * 9301 + 49297) % 233280 / 233280;
        const x = 50 + (idx - (n - 1) / 2) * (row > 10 ? 11 : 12.5) + (rr - .5) * 4;
        const y = 89 - row * 6.1 - rr * 1.5;
        return { x, y, r: Math.round(rr * 90 - 45) };
      };
      const draw = () => {
        H.clear(wrap);
        const inJar = X.joys.filter(j => j.id !== outId);
        const n = X.joys.length;
        const glass = h('div.jj-glass2');
        inJar.slice(-66).forEach((j, i) => { const p2 = slot(i); glass.appendChild(h('i.jj-star2', { dataset: { id: j.id }, style: { left: p2.x + '%', top: p2.y + '%', '--c': colOf(j), '--r': p2.r + 'deg', animationDelay: (i % 9) * .35 + 's' }, title: '' })); });
        const jar = h('div.jj-jar2',
          H.svg(`<svg class="jj-svg" viewBox="0 0 300 380" width="300" height="380">
            <defs>
              <linearGradient id="jjg" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".18" stop-color="#fff" stop-opacity=".05"/><stop offset=".7" stop-color="#fff" stop-opacity=".03"/><stop offset="1" stop-color="#fff" stop-opacity=".14"/></linearGradient>
              <linearGradient id="jjc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9b48a"/><stop offset="1" stop-color="#9c7447"/></linearGradient>
              <radialGradient id="jjl" cx=".5" cy=".85" r=".6"><stop offset="0" stop-color="#ffdca0" stop-opacity=".22"/><stop offset="1" stop-color="#ffdca0" stop-opacity="0"/></radialGradient>
            </defs>
            <path d="M104 46h92v24c0 6 4 10 10 14 30 18 50 46 50 86v150c0 22-18 40-40 40H84c-22 0-40-18-40-40V170c0-40 20-68 50-86 6-4 10-8 10-14z" fill="url(#jjg)" stroke="rgba(255,255,255,.32)" stroke-width="1.6"/>
            <path d="M44 210v120c0 22 18 40 40 40h132c22 0 40-18 40-40V210" fill="url(#jjl)"/>
            <rect x="96" y="20" width="108" height="30" rx="9" fill="url(#jjc)"/><path d="M100 30h100M100 38h100" stroke="#7a5532" stroke-opacity=".35"/>
            <path d="M92 52c20 8 96 8 116 0" fill="none" stroke="#c9a36d" stroke-width="3" stroke-linecap="round"/><path d="M150 56c-6 10-14 14-22 14M150 56c6 10 14 14 22 14" fill="none" stroke="#c9a36d" stroke-width="2" stroke-linecap="round"/>
            <path d="M66 150c-6 30-6 140 0 180" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="7" stroke-linecap="round"/>
            <path d="M234 190c3 30 3 80 0 110" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="4" stroke-linecap="round"/>
          </svg>`), glass);
        const input = h('input.inp.jj-inp', { placeholder: 'Что сегодня порадовало?' });
        const add = () => {
          const v = input.value.trim(); if (!v) return;
          const j = { id: H.uid(), t: v, date: H.today() }; X.joys.push(j); H.store.save(); input.value = ''; draw();
          const st2 = wrap.querySelector(`.jj-star2[data-id="${j.id}"]`); if (st2) st2.animate([{ transform: 'translate(-50%,-50%) rotate(var(--r)) translateY(-240px) scale(.6)', opacity: 0 }, { opacity: 1, offset: .3 }, { transform: 'translate(-50%,-50%) rotate(var(--r))', opacity: 1 }], { duration: 1100, easing: 'cubic-bezier(.3,.7,.3,1.15)' });
        };
        input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
        const out = h('div.jj-out');
        const take = () => {
          if (!X.joys.length || outId) return;
          const pool = X.joys; const j = pool[Math.floor(Math.random() * pool.length)];
          const st2 = wrap.querySelector(`.jj-star2[data-id="${j.id}"]`);
          const showCard = () => {
            outId = j.id; draw();
            const card = h('div.jj-card2', { style: { '--jc': colOf(j) } }, h('span.jj-cd', H.fmtLongY(j.date)), h('div.jj-ct', j.t),
              h('div.row', { style: { gap: '8px', marginTop: '14px' } },
                h('button.btn.small', { onclick: () => back(card, j) }, H.icon('reset', 14), 'Вернуть в банку'),
                h('button.btn.small.ghost', { onclick: () => toss(card, j) }, 'Выкинуть')));
            const o = wrap.querySelector('.jj-out'); H.clear(o); o.appendChild(card);
          };
          if (st2) {
            const r = st2.getBoundingClientRect();
            const fly = h('i.jj-fly', { style: { left: r.left + r.width / 2 + 'px', top: r.top + r.height / 2 + 'px', '--c': st2.style.getPropertyValue('--c') } }); document.body.appendChild(fly);
            st2.style.opacity = 0;
            const tgt = out.getBoundingClientRect();
            const jr = wrap.querySelector('.jj-jar2').getBoundingClientRect(), sx = r.left + r.width / 2, sy = r.top + r.height / 2;
            const mx = jr.left + jr.width / 2 - sx, my = jr.top - 30 - sy, ex = tgt.left + 60 - sx, ey = tgt.top + 30 - sy;
            fly.animate([{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: `translate(-50%,-50%) translate(${mx}px, ${my}px) scale(1.5) rotate(120deg)`, offset: .5 }, { transform: `translate(-50%,-50%) translate(${ex}px, ${ey}px) scale(2.4) rotate(240deg)`, opacity: 0 }], { duration: 1300, easing: 'cubic-bezier(.45,0,.25,1)' }).onfinish = () => { fly.remove(); showCard(); };
          } else showCard();
        };
        const back = (card, j) => {
          card.classList.add('jj-leave');
          setTimeout(() => { outId = null; draw(); const st2 = wrap.querySelector(`.jj-star2[data-id="${j.id}"]`); if (st2) st2.animate([{ transform: 'translate(-50%,-50%) rotate(var(--r)) translateY(-260px) scale(1.6)', opacity: 0 }, { opacity: 1, offset: .35 }, { transform: 'translate(-50%,-50%) rotate(var(--r))', opacity: 1 }], { duration: 1200, easing: 'cubic-bezier(.3,.7,.3,1.15)' }); }, 650);
        };
        const toss = (card, j) => {
          card.classList.add('jj-toss');
          setTimeout(() => {
            X.joys = X.joys.filter(x => x !== j); H.store.get().journalX.joys = X.joys; H.store.save(); outId = null; card.remove();
            const n2 = X.joys.length, c2 = wrap.querySelector('.jj-count'); if (c2) c2.textContent = n2 ? `${n2} ${H.plural(n2, 'радость', 'радости', 'радостей')}` : 'банка ждёт первую радость';
            const tb = wrap.querySelector('.jj-take'); if (tb && !n2) tb.disabled = true;
          }, 1100);
        };
        wrap.append(h('div.jj2',
          h('div.jj-jar-wrap', jar, h('div.jj-count', n ? `${n} ${H.plural(n, 'радость', 'радости', 'радостей')}` : 'банка ждёт первую радость')),
          h('div.jj-side',
            h('h2', 'Банка радостей'),
            h('p.muted', 'Записывай маленькие хорошие моменты — даже в тяжёлые дни они бывают. А когда грустно — достань одну наугад.'),
            h('div.row', { style: { gap: '8px' } }, input, h('button.btn.primary', { onclick: add }, '+ В банку')),
            h('button.btn.jj-take', { style: { marginTop: '12px' }, disabled: !n || null, onclick: take }, H.icon('sparkle', 15), 'Достать радость'),
            out)));
      };
      draw();
      return wrap;
    }

    // ---------- VENT ----------
    function vent() {
      const starter = pick(D().vent, Math.floor(Math.random() * 1000));
      const ta = h('textarea.jr-text.vent-ta', { placeholder: 'Пиши всё, что хочется сказать. Это никто не увидит и это не сохранится.' });
      const hint=h('div.jr-q.vent-hint',starter?'«'+starter+'»':null);const paper=h('div.jr-paper.vent-paper',h('div.jr-date','Выговориться'),hint,ta);const dismiss=()=>hint.classList.add('dismissed');ta.addEventListener('input',dismiss,{once:true});setTimeout(dismiss,3000);
      const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.max(380, ta.scrollHeight) + 'px'; };
      ta.addEventListener('input', grow);
      const btn = (kind, ic, name) => h('button.btn.rel-btn.' + kind, { onclick: async () => { if (!ta.value.trim()) return ui.toast('Сначала напиши что-нибудь', 'ℹ'); await release(paper, kind, null, ta.value); ta.value = ''; paper.style.visibility = ''; grow(); ui.toast('Отпущено. Ты молодец, что выговорилась', '🕊'); } }, H.icon(ic, 16), name);
      setTimeout(() => { grow(); ta.focus(); }, 60);
      return h('div.stack',
        h('div.jr-panel-head', h('div', h('h2', 'Выговориться и отпустить'), h('p.muted', 'Напиши всё как есть — злость, обиду, страх. Потом выбери, как отпустить. Текст нигде не сохранится.'))),
        paper,
        h('div.row', { style: { gap: '10px', justifyContent: 'center' } }, btn('burn', 'fire', 'Сжечь'), btn('wind', 'wind', 'Развеять'), btn('tear', 'feather', 'Разорвать')),
        h('div.row', { style: { justifyContent: 'center' } }, h('button.btn.small.ghost', { onclick: () => { if (!ta.value.trim()) return; const { J } = ST(); const now = Date.now(); J.unshift({ id: H.uid(), created: now, updated: now, title: '', text: ta.value, mood: 'storm', prompt: starter || null }); H.store.save(); cur = J[0].id; go('entries'); } }, 'Нет, всё-таки сохранить в записи')));
    }

    let wrapEl = null;
    function render(focus) {
      sweep(section === 'entries' ? cur : null);
      drawNav(); H.clear(host);
      if (wrapEl) wrapEl.classList.toggle('jr-writing', M && section === 'entries' && !!cur && !!ST().J.find(x => x.id === cur));
      const sec = { home, entries, dreams, prompts, about, letters, joy, vent }[section] || home;
      const el = sec(focus);
      el.classList && el.classList.add('jr-enter');
      host.appendChild(el);
      const v = root.closest('.view'); if (v) v.scrollTop = 0;
    }
    // phone: one row of sections you can swipe; edges fade and an arrow shows there is more
    const navBox = M ? h('div.jr-navbox', nav, h('button.jr-navmore.l', { 'aria-label': 'Назад', onclick: () => nav.scrollBy({ left: -nav.clientWidth * .6, behavior: 'smooth' }) }, H.icon('chevron', 16)), h('button.jr-navmore.r', { 'aria-label': 'Ещё разделы', onclick: () => nav.scrollBy({ left: nav.clientWidth * .6, behavior: 'smooth' }) }, H.icon('chevron', 16))) : nav;
    const edges = () => { if (!M) return; navBox.classList.toggle('more-l', nav.scrollLeft > 4); navBox.classList.toggle('more-r', nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 4); };
    if (M) {
      nav.addEventListener('scroll', edges, { passive: true });
      const origDraw = drawNav;
      drawNav = () => { origDraw(); requestAnimationFrame(() => { const on = nav.querySelector('.on'); if (on && (on.offsetLeft < nav.scrollLeft || on.offsetLeft + on.offsetWidth > nav.scrollLeft + nav.clientWidth)) nav.scrollTo({ left: on.offsetLeft - 16, behavior: 'smooth' }); edges(); }); };
    }
    wrapEl = h('div.wrap.jr-wrap',
      h('div.view-head', h('div', h('h1', 'Личные заметки'), h('div.sub', 'Место, чтобы выговориться, подумать и узнать себя. Всё хранится только на этом iPhone и не попадает в отчёты.'))),
      navBox, host);
    render();
    root.appendChild(wrapEl);
    if (M) {
      requestAnimationFrame(edges);
      // first visit: a gentle nudge so it is obvious the row scrolls
      try { if (!localStorage.getItem('mydiary.navHint')) { localStorage.setItem('mydiary.navHint', '1'); setTimeout(() => { nav.scrollTo({ left: 70, behavior: 'smooth' }); setTimeout(() => nav.scrollTo({ left: 0, behavior: 'smooth' }), 650); }, 700); } } catch (e) {}
    }
  };
})(window.H);
