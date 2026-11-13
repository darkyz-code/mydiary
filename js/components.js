'use strict';
(function (H) {
  const { h } = H;

  // ---------- slider: hairline track, small thumb, value shown on the right ----------
  // opts: {min, max, value, onChange(v), mode:'bad'|'good'|'neutral', allowClear, compact, labels:[left,right]}
  function slider(opts) {
    const min = opts.min ?? 0, max = opts.max ?? 10;
    let value = opts.value ?? null;
    const fill = h('div.sl-fill');
    const thumb = h('div.sl-thumb');
    const ticks = h('div.sl-ticks', Array.from({ length: max - min + 1 }, (_, i) => h('span' + ((i + min) % 5 === 0 ? '.major' : ''), { dataset: { v: i + min }, style: { left: (i / (max - min) * 100) + '%' } })));
    const track = h('div.sl-track', h('div.sl-line'), ticks, fill, thumb);
    const val = h('div.sl-val');
    const clearBtn = opts.allowClear !== false ? h('button.sl-clear', { title: 'Сбросить', onclick: (e) => { e.stopPropagation(); set(null, true); } }, '×') : null;
    const root = h('div.slider' + (opts.compact ? '.compact' : ''), { tabindex: 0, role: 'slider', 'aria-valuemin': min, 'aria-valuemax': max },
      track, h('div.sl-side', clearBtn, val),
      opts.labels ? h('div.sl-labels', h('span', opts.labels[0]), h('span', opts.labels[1])) : null);

    function color(v) {
      if (opts.mode === 'good') return H.wellColor(v * 10);
      if (opts.mode === 'neutral') return 'var(--accent)';
      return H.scoreColor(v);
    }
    function render(pop) {
      const empty = value === null;
      root.classList.toggle('is-empty', empty);
      const pct = empty ? 0 : (value - min) / (max - min) * 100;
      fill.style.width = pct + '%';
      thumb.style.left = pct + '%';
      val.innerHTML = empty ? '<span class="sl-dash">—</span>' : `<b>${value}</b><small>/${max}</small>`;
      root.style.setProperty('--sl-color', empty ? 'transparent' : color(value));
      root.setAttribute('aria-valuenow', empty ? '' : value);
      ticks.querySelectorAll('span').forEach(s => s.classList.toggle('on', !empty && Number(s.dataset.v) <= value));
      if (pop) { val.classList.remove('pop'); void val.offsetWidth; val.classList.add('pop'); }
    }
    function set(v, fire) {
      if (v !== null) v = H.clamp(Math.round(v), min, max);
      if (v === value) return;
      value = v; render(true);
      if (fire && opts.onChange) opts.onChange(value);
    }
    function fromEvent(e) {
      const r = track.getBoundingClientRect();
      return min + H.clamp((e.clientX - r.left) / r.width, 0, 1) * (max - min);
    }
    let dragging = false;
    track.addEventListener('pointerdown', e => {
      dragging = true; track.setPointerCapture(e.pointerId); root.classList.add('drag');
      set(fromEvent(e), true);
    });
    track.addEventListener('pointermove', e => { if (dragging) set(fromEvent(e), true); });
    const end = () => { dragging = false; root.classList.remove('drag'); };
    track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
    root.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set((value ?? min - 1) + 1, true); e.preventDefault(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set((value ?? min + 1) - 1, true); e.preventDefault(); }
      if (e.key === 'Delete' || e.key === 'Backspace') set(null, true);
    });
    render(false);
    root.setValue = v => { value = v; render(false); };
    return root;
  }

  // ---------- chips & bubbles ----------
  function chip(label, active, onClick, extra = {}) {
    const c = h('button.chip' + (active ? '.on' : '') + (extra.cls ? '.' + extra.cls : ''), {
      onclick: e => { onClick && onClick(e, c); },
      title: extra.title,
      style: extra.style,
    }, extra.emoji ? h('span.chip-emoji', extra.emoji) : null, h('span', label));
    return c;
  }
  function bubble(emoji, label, active, onClick, i = 0) {
    const b = h('button.bubble' + (active ? '.on' : ''), { style: { animationDelay: (i * 22) + 'ms' }, onclick: e => onClick && onClick(e, b) },
      h('span.bubble-emoji', emoji), h('span.bubble-label', label));
    return b;
  }

  function toggle(value, onChange, label) {
    const t = h('button.toggle' + (value ? '.on' : ''), { role: 'switch', 'aria-checked': String(!!value) }, h('span.knob'));
    t.addEventListener('click', () => {
      value = !value; t.classList.toggle('on', value); t.setAttribute('aria-checked', String(value));
      onChange && onChange(value);
    });
    return label ? h('label.toggle-row', h('span', label), t) : t;
  }

  function stepper(value, onChange, { step = 1, min = 0, max = 99, unit = '', fmt } = {}) {
    let v = value ?? null;
    const out = h('span.st-val');
    const show = () => { out.textContent = v === null ? 'не отмечено' : (fmt ? fmt(v) : v + (unit ? ' ' + unit : '')); out.classList.toggle('none', v === null); out.classList.remove('pop'); void out.offsetWidth; out.classList.add('pop'); };
    // below the minimum the value becomes "не отмечено" (null)
    const change = d => {
      if (v === null) { if (d < 0) return; v = min; }
      else if (d < 0 && v <= min) v = null;
      else v = H.clamp(v + d, min, max);
      show(); onChange && onChange(v);
    };
    show();
    return h('div.stepper', h('button.st-btn', { onclick: () => change(-step), 'aria-label': 'меньше' }, '−'), out, h('button.st-btn', { onclick: () => change(step), 'aria-label': 'больше' }, '+'));
  }

  function segmented(options, value, onChange) {
    const root = h('div.segmented');
    const ind = h('div.seg-ind');
    root.appendChild(ind);
    const btns = options.map(o => {
      const b = h('button.seg' + (o.id === value ? '.on' : ''), { onclick: () => { value = value === o.id && o.toggleOff !== false ? null : o.id; upd(); onChange && onChange(value); } }, o.name);
      root.appendChild(b); return b;
    });
    function upd() {
      btns.forEach((b, i) => b.classList.toggle('on', options[i].id === value));
      const i = options.findIndex(o => o.id === value);
      if (i < 0) { ind.style.opacity = 0; return; }
      requestAnimationFrame(() => {
        const b = btns[i];
        ind.style.opacity = 1; ind.style.width = b.offsetWidth + 'px'; ind.style.height = b.offsetHeight + 'px'; ind.style.bottom = 'auto'; ind.style.transform = `translate(${b.offsetLeft - 4}px, ${b.offsetTop - 4}px)`;
      });
    }
    setTimeout(upd, 0);
    return root;
  }

  function textarea(value, onInput, placeholder, rows = 3) {
    const t = h('textarea.ta', { placeholder, rows });
    t.value = value || '';
    const fit = () => { t.style.height = 'auto'; t.style.height = Math.max(t.scrollHeight + 2, rows * 22 + 22) + 'px'; };
    t.addEventListener('input', () => { fit(); onInput && onInput(t.value); });
    setTimeout(fit, 0);
    return t;
  }

  // ---------- liquid-glass date picker (replaces the native one) ----------
  const MN = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  function dateInput(value, onInput, attrs = {}) {
    let val = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
    const txt = h('span.dp-txt');
    const clr = h('span.dp-clr', { title: 'Очистить', onclick: e => { e.preventDefault(); e.stopPropagation(); set(''); onInput && onInput(''); } }, '✕');
    const btn = h('button.inp.dp' + (attrs.cls ? '.' + attrs.cls : ''), { type: 'button', style: attrs.style || null, onclick: e => { e.preventDefault(); open(); } }, H.icon('calendar', 15), txt, clr);
    const show = () => { txt.textContent = val ? H.fmtLongY(val) : (attrs.placeholder || 'выбрать дату'); btn.classList.toggle('is-empty', !val); };
    const set = v => { val = v || ''; show(); };
    Object.defineProperty(btn, 'value', { get: () => val, set: v => set(v) });
    show();
    let pop = null;
    function open() {
      if (pop) return;
      const base = val || attrs.min || H.today();
      let y = +base.slice(0, 4), m = +base.slice(5, 7) - 1, mode = 'days';
      const body = h('div.dp-pop');
      const draw = () => {
        H.clear(body);
        const head = h('div.dp-head',
          h('button.dp-nav', { type: 'button', onclick: () => { if (mode === 'days') { m--; if (m < 0) { m = 11; y--; } } else y--; draw(); } }, '‹'),
          h('button.dp-title', { type: 'button', onclick: () => { mode = mode === 'days' ? 'months' : 'days'; draw(); } }, mode === 'days' ? `${MN[m]} ${y}` : String(y)),
          h('button.dp-nav', { type: 'button', onclick: () => { if (mode === 'days') { m++; if (m > 11) { m = 0; y++; } } else y++; draw(); } }, '›'));
        body.appendChild(head);
        if (mode === 'months') {
          body.appendChild(h('div.dp-months', MN.map((n, i) => h('button.dp-m' + (i === m ? '.on' : ''), { type: 'button', onclick: () => { m = i; mode = 'days'; draw(); } }, n.slice(0, 3)))));
        } else {
          body.appendChild(h('div.dp-wd', ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(x => h('span', x))));
          const first = new Date(y, m, 1), off = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
          const grid = h('div.dp-grid');
          for (let i = 0; i < off; i++) grid.appendChild(h('span'));
          const t = H.today();
          for (let dd = 1; dd <= days; dd++) {
            const iso = `${y}-${H.pad(m + 1)}-${H.pad(dd)}`;
            const dis = (attrs.min && iso < attrs.min) || (attrs.max && iso > attrs.max);
            grid.appendChild(h('button.dp-d' + (iso === val ? '.on' : '') + (iso === t ? '.today' : '') + (dis ? '.dis' : ''), { type: 'button', disabled: dis || null, onclick: () => { set(iso); onInput && onInput(iso); close(); } }, String(dd)));
          }
          body.appendChild(grid);
        }
        body.appendChild(h('div.dp-foot',
          h('button.btn.small.ghost', { type: 'button', onclick: () => { set(''); onInput && onInput(''); close(); } }, 'Очистить'),
          h('button.btn.small', { type: 'button', onclick: () => { const t = H.today(); set(t); onInput && onInput(t); close(); } }, 'Сегодня')));
      };
      draw();
      pop = h('div.dp-layer.glass', body);
      document.body.appendChild(pop);
      const r = btn.getBoundingClientRect(), pr = pop.getBoundingClientRect();
      let x = Math.min(r.left, innerWidth - pr.width - 12), yy = r.bottom + 8;
      if (yy + pr.height > innerHeight - 10) yy = r.top - pr.height - 8;
      pop.style.left = Math.max(10, x) + 'px'; pop.style.top = Math.max(10, yy) + 'px';
      const outside = e => { if (!pop.contains(e.target) && !btn.contains(e.target)) close(); };
      const esc = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
      setTimeout(() => { document.addEventListener('pointerdown', outside, true); document.addEventListener('keydown', esc, true); }, 0);
      function close() { if (!pop) return; const p0 = pop; pop = null; p0.classList.add('closing'); setTimeout(() => p0.remove(), 220); document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', esc, true); }
      open.close = close;
    }
    return btn;
  }

  function input(value, onInput, attrs = {}) {
    if (attrs.type === 'date') { const { type, ...rest } = attrs; return dateInput(value, onInput, rest); }
    const i = h('input.inp', attrs);
    i.value = value ?? '';
    i.addEventListener('input', () => onInput && onInput(i.value));
    return i;
  }
  // number input with fixed unit suffix (e.g. мг)
  // numeric field without spinner arrows; can always be emptied (× button)
  function unitInput(value, onInput, unit, attrs = {}) {
    const wrap = h('div.unit-inp');
    const i = h('input.inp', { type: 'text', inputmode: 'decimal', autocomplete: 'off', ...attrs });
    i.value = value ?? '';
    const x = h('button.inp-clear', { type: 'button', title: 'Очистить', onclick: () => { i.value = ''; sync(); onInput && onInput(''); i.focus(); } }, '×');
    const sync = () => wrap.classList.toggle('has', i.value !== '');
    i.addEventListener('input', () => {
      const clean = i.value.replace(',', '.').replace(/[^0-9.\-]/g, '');
      if (clean !== i.value.replace(',', '.')) i.value = clean;
      sync();
      onInput && onInput(clean === '' || isNaN(Number(clean)) ? '' : clean);
    });
    sync();
    wrap.append(i, x, h('span.unit', unit));
    return wrap;
  }

  // ---------- ring gauge ----------
  function ring(value, size = 120, label = '') {
    const r = size / 2 - 9, c = 2 * Math.PI * r;
    const v = value == null ? 0 : value;
    const col = value == null ? 'var(--text-3)' : H.wellColor(v);
    const svgEl = H.svg(`<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke="${col}" stroke-dasharray="${c}" stroke-dashoffset="${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>`);
    const wrap = h('div.ring-wrap', { style: { width: size + 'px', height: size + 'px' } }, svgEl,
      h('div.ring-center', h('div.ring-val', value == null ? '—' : String(value)), h('div.ring-lbl', label)));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const fg = svgEl.querySelector('.ring-fg'); fg.style.strokeDashoffset = c * (1 - v / 100);
    }));
    return wrap;
  }

  // ---------- modal ----------
  function modal(title, content, { wide = false, actions = null, onClose = null, cls = '' } = {}) {
    const close = () => {
      back.classList.add('closing');
      setTimeout(() => back.remove(), 260);
      document.removeEventListener('keydown', esc);
      onClose && onClose();
    };
    const esc = e => { if (e.key === 'Escape') close(); };
    const box = h('div.modal.glass' + (wide ? '.wide' : '') + (cls ? '.' + cls : ''),
      h('div.modal-head', h('h3', title), h('button.icon-btn.modal-x', { onclick: close, 'aria-label': 'Закрыть' }, '✕')),
      h('div.modal-body', content),
      actions ? h('div.modal-actions', actions) : null);
    const back = h('div.modal-back', { onclick: e => { if (e.target === back) close(); } }, box);
    document.body.appendChild(back);
    document.addEventListener('keydown', esc);
    return { close, box, body: box.querySelector('.modal-body') };
  }
  function confirm(text, okText = 'Да', danger = false) {
    return new Promise(res => {
      let done = false;
      const m = modal('Подтверждение', h('p.muted', text), {
        actions: [
          h('button.btn.ghost', { onclick: () => { done = true; m.close(); res(false); } }, 'Отмена'),
          h('button.btn' + (danger ? '.danger' : '.primary'), { onclick: () => { done = true; m.close(); res(true); } }, okText),
        ],
        onClose: () => { if (!done) res(false); },
      });
    });
  }

  function toast(text, icon = '✓') {
    let host = document.getElementById('toasts');
    if (!host) { host = h('div#toasts'); document.body.appendChild(host); }
    const t = h('div.toast.glass', h('span.toast-ico', icon), h('span', text));
    host.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 2600);
  }

  function popover(anchorRect, content, onClose) {
    const close = () => { pop.classList.add('closing'); setTimeout(() => pop.remove(), 200); document.removeEventListener('pointerdown', outside, true); onClose && onClose(); };
    const outside = e => { if (!pop.contains(e.target)) close(); };
    const pop = h('div.popover.glass', content);
    document.body.appendChild(pop);
    const viewport = window.visualViewport;
    const left = viewport ? viewport.offsetLeft : 0, top = viewport ? viewport.offsetTop : 0;
    const width = viewport ? viewport.width : innerWidth, height = viewport ? viewport.height : innerHeight;
    pop.style.maxWidth = Math.max(0,width-24)+'px';
    pop.style.maxHeight = Math.max(0,height-24)+'px';
    pop.style.overflowY = 'auto';
    const pr = pop.getBoundingClientRect();
    let x = anchorRect.right + 14, y = anchorRect.top + anchorRect.height / 2 - pr.height / 2;
    if (x + pr.width > left + width - 12) x = anchorRect.left - pr.width - 14;
    x = H.clamp(x, left+12, Math.max(left+12,left+width-pr.width-12));
    y = H.clamp(y, top+12, Math.max(top+12,top+height-pr.height-12));
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
    setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
    return { close, el: pop };
  }

  function section(title, ...kids) { return h('div.fsection', h('div.fsection-title', title), ...kids); }
  function field(label, control, hint) { return h('label.field', h('span.field-label', label), control, hint ? h('span.field-hint', hint) : null); }
  function empty(icon, text, action) { return h('div.empty', h('div.empty-ico', H.ICONS && H.ICONS[icon] ? H.gicon(icon, 26, 'xl') : icon), h('p', text), action || null); }

  // ---------- global micro-interactions: sheen follows the pointer, ripples on press ----------
  document.addEventListener('pointermove', e => {
    const t = e.target.closest && e.target.closest('.sheen, .btn, .chip, .bubble, .tile, .glass-btn');
    if (!t) return;
    const r = t.getBoundingClientRect();
    t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    t.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
  document.addEventListener('pointerdown', e => {
    const t = e.target.closest && e.target.closest('.btn, .chip, .bubble, .tile, .glass-btn, .cal-cell, .nav-item');
    if (!t || document.documentElement.classList.contains('no-anim')) return;
    const r = t.getBoundingClientRect();
    const s = Math.max(r.width, r.height) * 2;
    const rp = h('span.ripple', { style: { width: s + 'px', height: s + 'px', left: (e.clientX - r.left - s / 2) + 'px', top: (e.clientY - r.top - s / 2) + 'px' } });
    t.appendChild(rp);
    setTimeout(() => rp.remove(), 650);
  });

  Object.assign(H, { ui: { dateInput, slider, chip, bubble, toggle, stepper, segmented, textarea, input, unitInput, ring, modal, confirm, toast, popover, section, field, empty } });
})(window.H);
