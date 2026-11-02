// Sleep timeline: real clock axis, adaptive window, labelled segments
(function (H) {
  const h = H.h;
  const hm = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return H.pad(Math.floor(m / 60)) + ':' + H.pad(m % 60); };
  // positions in minutes from 18:00 of the previous evening
  function segs(sl) {
    const out = [];
    if (!sl) return out;
    const b = H.timeToMin(sl.bed), w = H.timeToMin(sl.wake);
    if (b != null && w != null) {
      let dur = w - b; if (dur <= 0) dur += 1440;
      const start = b >= 18 * 60 ? b - 18 * 60 : b + 6 * 60;
      out.push({ kind: 'night', start, dur, from: sl.bed, to: sl.wake });
    }
    if (sl.napOn !== false) {
      const a = H.timeToMin(sl.napStart), e = H.timeToMin(sl.napEnd);
      if (a != null && e != null) {
        let dur = e - a; if (dur <= 0) dur += 1440;
        out.push({ kind: 'nap', start: a + 6 * 60, dur, from: sl.napStart, to: sl.napEnd });
      }
    }
    return out;
  }
  function render(host, sl, opts = {}) {
    H.clear(host);
    const ss = segs(sl);
    let lo, hi;
    if (!ss.length) { lo = 3 * 60; hi = 17 * 60; }          // 21:00 → 11:00 default
    else {
      lo = Math.min(...ss.map(s => s.start)) - 60; hi = Math.max(...ss.map(s => s.start + s.dur)) + 60;
      lo = Math.floor(lo / 60) * 60; hi = Math.ceil(hi / 60) * 60;
      if (hi - lo < 10 * 60) { const c = (lo + hi) / 2; lo = Math.floor((c - 300) / 60) * 60; hi = lo + 600; }
      lo = Math.max(lo, 0);
    }
    const span = hi - lo;
    const pct = m => ((m - lo) / span * 100);
    const step = span <= 12 * 60 ? 60 : span <= 20 * 60 ? 120 : 180;
    const track = h('div.sl-track2');
    const axis = h('div.sl-axis');
    for (let m = Math.ceil(lo / step) * step; m <= hi; m += step) {
      const clock = (m + 18 * 60) % 1440;
      const isMid = clock === 0;
      track.appendChild(h('i.sl-tick' + (isMid ? '.mid' : ''), { style: { left: pct(m) + '%' } }));
      axis.appendChild(h('span' + (isMid ? '.mid' : ''), { style: { left: pct(m) + '%' } }, isMid ? '00:00' : hm(clock).replace(/^0(\d):00$/, '$1:00')));
    }
    // day boundary hint
    if (lo < 6 * 60 && hi > 6 * 60) track.appendChild(h('span.sl-daylbl', { style: { left: pct(6 * 60) + '%' } }, opts.dayLabel || 'этот день'));
    ss.forEach(s => {
      const w = s.dur / span * 100;
      const seg = h('div.sl-seg.' + s.kind, { style: { left: pct(s.start) + '%', width: w + '%' }, title: `${s.kind === 'nap' ? 'Дневной сон' : 'Ночной сон'}: ${s.from}–${s.to} · ${H.fmtDur(s.dur)}` });
      track.appendChild(seg);
    });
    const legend = h('div.sl-legend',
      ss.length ? ss.map(s => h('span', h('i.' + s.kind), `${s.kind === 'nap' ? 'днём' : 'ночью'} ${H.fmtDur(s.dur)}`)) : h('span.faint', 'Укажи время, когда уснула и проснулась, — здесь появится шкала сна'));
    host.appendChild(h('div.sl-wrap' + (opts.compact ? '.compact' : ''), track, axis, opts.noLegend ? null : legend));
    return host;
  }
  H.sleepLine = { render, segs };
})(window.H);
