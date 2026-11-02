'use strict';
(function (H) {
  const { h } = H;
  const NS = 'http://www.w3.org/2000/svg';
  // validated categorical order (dataviz reference palette), light / dark steps
  // app palette (lavender, peach, mint, sky, rose, gold) — validated for CVD separation in light and dark
  const SERIES = ['#8f7af2', '#d8703f', '#21a67d', '#3f8fe0', '#d6588e', '#ad862a'];
  function seriesColor(i) { return SERIES[i % SERIES.length]; }
  let gid = 0;
  // monotone cubic path through points (no overshoot)
  function smooth(pts) {
    if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
    if (pts.length === 2) return `M${pts[0][0]},${pts[0][1]}L${pts[1][0]},${pts[1][1]}`;
    const n = pts.length, dx = [], dy = [], m = [], t = [];
    for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; dy[i] = pts[i + 1][1] - pts[i][1]; m[i] = dy[i] / (dx[i] || 1); }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (let i = 0; i < n - 1; i++) { if (m[i] === 0) { t[i] = t[i + 1] = 0; continue; } const a = t[i] / m[i], b = t[i + 1] / m[i], q = a * a + b * b; if (q > 9) { const k = 3 / Math.sqrt(q); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; } }
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) { const h3 = dx[i] / 3; d += `C${(pts[i][0] + h3).toFixed(1)},${(pts[i][1] + t[i] * h3).toFixed(1)} ${(pts[i + 1][0] - h3).toFixed(1)},${(pts[i + 1][1] - t[i + 1] * h3).toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`; }
    return d;
  }
  function s(tag, attrs) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }

  // opts: {dates, series:[{name, values, color}], yMin, yMax, height, bands:[{from,to}], unit, yTicks}
  function lineChart(opts) {
    const wrap = h('div.chart');
    const height = opts.height || 260;
    const draw = () => {
      H.clear(wrap);
      const W = Math.max(320, wrap.clientWidth || 700), Hh = height;
      const m = { l: 34, r: 34, t: 14, b: 28 };
      const iw = W - m.l - m.r, ih = Hh - m.t - m.b;
      const n = opts.dates.length;
      const x = i => m.l + (n <= 1 ? iw / 2 : i / (n - 1) * iw);
      const y0 = opts.yMin ?? 0, y1 = opts.yMax ?? 10;
      const y = v => m.t + ih - (v - y0) / (y1 - y0) * ih;
      const svgEl = s('svg', { viewBox: `0 0 ${W} ${Hh}`, height: Hh });
      // bands (e.g. period days)
      (opts.bands || []).forEach(b => {
        const i0 = opts.dates.indexOf(b.from), i1 = opts.dates.indexOf(b.to);
        if (i0 < 0) return;
        const step = n > 1 ? iw / (n - 1) : iw;
        svgEl.appendChild(s('rect', { x: x(i0) - step / 2, y: m.t, width: Math.max(step, (x(i1 < 0 ? i0 : i1) - x(i0)) + step), height: ih, fill: b.color || 'rgba(255,110,160,.09)', rx: 10 }));
      });
      // grid
      const g = s('g', { class: 'grid' }), ax = s('g', { class: 'axis' });
      const ticks = opts.yTicks || [0, 2, 4, 6, 8, 10];
      ticks.forEach(t => {
        g.appendChild(s('line', { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t) }));
        const tx = s('text', { x: m.l - 8, y: y(t) + 4, 'text-anchor': 'end' }); tx.textContent = t; ax.appendChild(tx);
      });
      const every = Math.ceil(n / Math.max(2, Math.floor(iw / 70)));
      opts.dates.forEach((d, i) => {
        if (i % every !== 0 && i !== n - 1) return;
        const tx = s('text', { x: x(i), y: Hh - 8, 'text-anchor': 'middle' }); tx.textContent = H.fmtShort(d); ax.appendChild(tx);
      });
      svgEl.appendChild(g); svgEl.appendChild(ax);
      // lines: smooth curves with a soft glow and a fading area under them
      const defs = s('defs', {}); svgEl.appendChild(defs);
      const dotsLayer = s('g', {});
      opts.series.forEach((se, si) => {
        const col = se.color || seriesColor(si);
        const id = 'cg' + (++gid);
        const lg = s('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
        lg.appendChild(s('stop', { offset: 0, 'stop-color': col, 'stop-opacity': si === 0 ? .26 : .1 }));
        lg.appendChild(s('stop', { offset: 1, 'stop-color': col, 'stop-opacity': 0 }));
        defs.appendChild(lg);
        // split into runs of consecutive values
        const runs = []; let run = [];
        se.values.forEach((v, i) => { if (v == null) { if (run.length) runs.push(run); run = []; } else run.push([x(i), y(v), i]); });
        if (run.length) runs.push(run);
        runs.forEach(r => {
          if (r.length > 1) {
            const d = smooth(r);
            svgEl.appendChild(s('path', { d: d + `L${r[r.length - 1][0].toFixed(1)},${m.t + ih}L${r[0][0].toFixed(1)},${m.t + ih}Z`, fill: `url(#${id})`, class: 'ca' }));
            const p = s('path', { d, fill: 'none', stroke: col, 'stroke-width': 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', class: 'cl', style: `color:${col}` });
            svgEl.appendChild(p);
            if (!document.documentElement.classList.contains('no-anim')) {
              const len = 3000; p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
              p.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.22,.8,.24,1)';
              requestAnimationFrame(() => requestAnimationFrame(() => { p.style.strokeDashoffset = 0; }));
              setTimeout(() => { p.style.strokeDasharray = ''; }, 1700);
            }
          }
          r.forEach(([px, py], k) => { const lonely = r.length === 1; if (lonely || n <= 31) dotsLayer.appendChild(s('circle', { cx: px, cy: py, r: lonely ? 3.4 : 2.3, fill: col, class: 'cdot', style: `color:${col}` })); });
        });
        // direct label at the last value (≤4 series)
        if (opts.series.length <= 4) {
          let li = -1; se.values.forEach((v, i) => { if (v != null) li = i; });
          if (li >= 0) { const v = se.values[li]; const tx = s('text', { x: x(li) + 8, y: y(v) + 4, class: 'dlabel' }); tx.textContent = H.round1(v); svgEl.appendChild(tx); }
        }
      });
      svgEl.appendChild(dotsLayer);
      // hover markers
      const hov = s('g', { class: 'hov', opacity: 0 });
      const hovDots = opts.series.map((se, si) => { const c = s('circle', { r: 5, fill: se.color || seriesColor(si), stroke: 'var(--surface-solid)', 'stroke-width': 2 }); hov.appendChild(c); return c; });
      svgEl.appendChild(hov);
      // crosshair & tooltip
      const cross = s('line', { class: 'crosshair', y1: m.t, y2: m.t + ih, x1: 0, x2: 0, opacity: 0 });
      svgEl.appendChild(cross);
      const tip = h('div.chart-tip', { style: { display: 'none' } });
      const hit = s('rect', { x: m.l, y: m.t, width: iw, height: ih, fill: 'transparent' });
      hit.addEventListener('mousemove', e => {
        const r = svgEl.getBoundingClientRect();
        const px = (e.clientX - r.left) * (W / r.width);
        const i = H.clamp(Math.round((px - m.l) / (iw / Math.max(1, n - 1))), 0, n - 1);
        cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('opacity', 1);
        hov.setAttribute('opacity', 1);
        opts.series.forEach((se, si) => { const v = se.values[i]; const c = hovDots[si]; if (v == null) c.setAttribute('opacity', 0); else { c.setAttribute('opacity', 1); c.setAttribute('cx', x(i)); c.setAttribute('cy', y(v)); } });
        H.clear(tip);
        tip.appendChild(h('div.tt-d', H.cap(H.weekday(opts.dates[i]).slice(0, 2)) + ', ' + H.fmtLong(opts.dates[i])));
        opts.series.forEach((se, si) => {
          const v = se.values[i];
          tip.appendChild(h('div.tt-r', h('span', h('i.sw', { style: { background: se.color || seriesColor(si) } }), ' ', se.name), h('b', v == null ? '—' : String(H.round1(v)) + (se.unit ? ' ' + se.unit : ''))));
        });
        tip.style.display = 'block';
        const tx = x(i) / W * r.width;
        tip.style.left = (tx + 14 + 170 > r.width ? tx - 184 : tx + 14) + 'px';
        tip.style.top = '10px';
      });
      hit.addEventListener('mouseleave', () => { tip.style.display = 'none'; cross.setAttribute('opacity', 0); hov.setAttribute('opacity', 0); });
      svgEl.appendChild(hit);
      wrap.appendChild(svgEl); wrap.appendChild(tip);
      if (opts.series.length > 1 || opts.legend) {
        wrap.appendChild(h('div.chart-legend', opts.series.map((se, si) => h('span', h('i', { style: { background: se.color || seriesColor(si) } }), se.name))));
      }
    };
    requestAnimationFrame(draw);
    const ro = new ResizeObserver(H.debounce(draw, 120));
    setTimeout(() => ro.observe(wrap), 50);
    return wrap;
  }

  // simple vertical bars: {dates, values, color, height, unit, target:[lo,hi]}
  function barChart(opts) {
    const wrap = h('div.chart');
    const height = opts.height || 180;
    const draw = () => {
      H.clear(wrap);
      const W = Math.max(320, wrap.clientWidth || 700), Hh = height;
      const m = { l: 34, r: 10, t: 10, b: 26 };
      const iw = W - m.l - m.r, ih = Hh - m.t - m.b;
      const n = opts.dates.length;
      const max = opts.max || Math.max(10, ...opts.values.filter(v => v != null));
      const y = v => m.t + ih - v / max * ih;
      const bw = Math.max(3, Math.min(26, iw / n - 2));
      const svgEl = s('svg', { viewBox: `0 0 ${W} ${Hh}`, height: Hh });
      const ax = s('g', { class: 'axis' }), g = s('g', { class: 'grid' });
      const step = max > 10 ? Math.ceil(max / 4) : 2;
      for (let t = 0; t <= max; t += step) {
        g.appendChild(s('line', { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t) }));
        const tx = s('text', { x: m.l - 8, y: y(t) + 4, 'text-anchor': 'end' }); tx.textContent = t; ax.appendChild(tx);
      }
      if (opts.target) svgEl.appendChild(s('rect', { x: m.l, width: iw, y: y(opts.target[1]), height: y(opts.target[0]) - y(opts.target[1]), fill: 'rgba(33,166,125,.09)', rx: 8 }));
      const bid = 'bg' + (++gid), bcol = opts.color || SERIES[0];
      const bdefs = s('defs', {}); const blg = s('linearGradient', { id: bid, x1: 0, y1: 0, x2: 0, y2: 1 });
      blg.appendChild(s('stop', { offset: 0, 'stop-color': bcol, 'stop-opacity': .95 })); blg.appendChild(s('stop', { offset: 1, 'stop-color': bcol, 'stop-opacity': .35 }));
      bdefs.appendChild(blg); svgEl.appendChild(bdefs);
      svgEl.appendChild(g); svgEl.appendChild(ax);
      const every = Math.ceil(n / Math.max(2, Math.floor(iw / 70)));
      const tip = h('div.chart-tip', { style: { display: 'none' } });
      opts.dates.forEach((d, i) => {
        const cx = m.l + (i + .5) * iw / n;
        const v = opts.values[i];
        if (v != null && v > 0) {
          const r = s('rect', { x: cx - bw / 2, y: y(v), width: bw, height: Math.max(2, m.t + ih - y(v)), rx: Math.min(5, bw / 2), fill: `url(#${bid})`, class: 'bar' });
          r.style.transformOrigin = `${cx}px ${m.t + ih}px`;
          r.style.animation = `barUp .8s ${i * 12}ms cubic-bezier(.34,1.56,.64,1) both`;
          svgEl.appendChild(r);
        }
        const hit = s('rect', { x: cx - iw / n / 2, y: m.t, width: iw / n, height: ih, fill: 'transparent' });
        hit.addEventListener('mouseenter', () => {
          H.clear(tip);
          tip.appendChild(h('div.tt-d', H.fmtLong(d)));
          tip.appendChild(h('div.tt-r', h('span', opts.name || ''), h('b', v == null ? '—' : (opts.fmt ? opts.fmt(v) : H.round1(v) + (opts.unit || '')))));
          tip.style.display = 'block';
          const rr = svgEl.getBoundingClientRect();
          const tx = cx / W * rr.width;
          tip.style.left = (tx + 12 + 160 > rr.width ? tx - 172 : tx + 12) + 'px'; tip.style.top = '6px';
        });
        hit.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
        svgEl.appendChild(hit);
        if (i % every === 0) { const tx = s('text', { x: cx, y: Hh - 6, 'text-anchor': 'middle' }); tx.textContent = H.fmtShort(d); ax.appendChild(tx); }
      });
      wrap.appendChild(svgEl); wrap.appendChild(tip);
    };
    requestAnimationFrame(draw);
    const ro = new ResizeObserver(H.debounce(draw, 120));
    setTimeout(() => ro.observe(wrap), 50);
    return wrap;
  }

  function sparkline(values, { min, max, lo, hi, color } = {}) {
    const W = 220, Hh = 40;
    const vals = values.filter(v => v != null);
    if (vals.length < 1) return h('div');
    let mn = Math.min(...vals), mx = Math.max(...vals);
    if (min != null) mn = Math.min(mn, min);
    if (max != null) mx = Math.max(mx, max);
    if (lo != null && !isNaN(lo)) mn = Math.min(mn, lo);
    const pad = (mx - mn) * .15 || 1;
    const y = v => Hh - 4 - (v - (mn - pad)) / ((mx + pad) - (mn - pad)) * (Hh - 8);
    const x = i => vals.length === 1 ? W / 2 : 4 + i / (vals.length - 1) * (W - 8);
    let band = '';
    if (lo != null && hi != null && !isNaN(lo) && !isNaN(hi)) { const top = Math.max(0, y(Math.min(hi, mx + pad))); band = `<rect x="0" width="${W}" y="${top}" height="${Math.max(1, y(lo) - top)}" fill="rgba(60,180,120,.12)"/>`; }
    const d = vals.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1)).join('');
    const c = color || 'var(--accent)';
    return H.svg(`<svg class="spark" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none">${band}<path d="${d}" fill="none" stroke="${c}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>${vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="2" fill="${c}"/>`).join('')}</svg>`);
  }

  // inject keyframes once
  const st = document.createElement('style');
  st.textContent = '@keyframes barUp { from { transform: scaleY(0); } }';
  document.head.appendChild(st);

  H.charts = { lineChart, barChart, sparkline, seriesColor };
})(window.H);
