'use strict';
(function (H) {
  const S = () => H.store.get();

  function sleepMinutes(d) {
    if (!d || !d.sleep) return null;
    const b = H.timeToMin(d.sleep.bed), w = H.timeToMin(d.sleep.wake);
    if (b === null || w === null) return null;
    let m = w - b; if (m <= 0) m += 1440;
    return m;
  }
  function napMinutes(d) {
    if (!d || !d.sleep) return null;
    const s = d.sleep;
    if (s.napOn === false) return 0;
    const a = H.timeToMin(s.napStart), e = H.timeToMin(s.napEnd);
    if (a !== null && e !== null) { let m = e - a; if (m <= 0) m += 1440; return m; }
    if (s.nap != null && !isNaN(Number(s.nap)) && s.napOn !== false) return Number(s.nap); // older versions stored minutes
    return null;
  }
  function totalSleep(d) {
    const m = sleepMinutes(d), n = napMinutes(d);
    if (m === null && !n) return null;
    return (m || 0) + (n || 0);
  }

  // ---------- cycle ----------
  function periodStarts() {
    const days = S().days;
    const starts = Object.keys(days).filter(k => days[k].cycle && days[k].cycle.period && !(days[H.addDays(k, -1)] && days[H.addDays(k, -1)].cycle && days[H.addDays(k, -1)].cycle.period)).sort();
    const lp = S().profile.lastPeriod;
    if (lp && !starts.some(s => Math.abs(H.diffDays(s, lp)) < 4)) starts.push(lp);
    return starts.sort();
  }
  // learns the cycle from marked periods; falls back to the range from the health card
  function cycleStats() {
    const st = periodStarts();
    const diffs = [];
    for (let i = 1; i < st.length; i++) { const d = H.diffDays(st[i], st[i - 1]); if (d >= 18 && d <= 60) diffs.push(d); }
    const p = S().profile;
    const pMin = Number(p.cycleLength) || 28, pMax = Math.max(pMin, Number(p.cycleMax) || pMin);
    const recent = diffs.slice(-6);
    if (recent.length >= 2) {
      const avg = H.avg(recent);
      const sd = Math.sqrt(H.avg(recent.map(x => (x - avg) ** 2)));
      const min = Math.min(...recent), max = Math.max(...recent);
      return { avg: Math.round(avg), min: Math.max(18, Math.min(min, Math.round(avg - sd))), max: Math.max(max, Math.round(avg + sd)), learned: true, count: recent.length, sd };
    }
    if (recent.length === 1) {
      const d = recent[0];
      return { avg: Math.round((d + (pMin + pMax) / 2) / 2), min: Math.min(d, pMin), max: Math.max(d, pMax), learned: true, count: 1 };
    }
    return { avg: Math.round((pMin + pMax) / 2), min: pMin, max: pMax, learned: false, count: 0 };
  }
  function cycleLength() { return cycleStats().avg; }
  function cycleInfo(date) {
    const st = periodStarts().filter(s => s <= date);
    if (!st.length) return null;
    const start = st[st.length - 1];
    const cs = cycleStats();
    const len = cs.avg;
    const plen = Number(S().profile.periodLength) || 5;
    const dayN = H.diffDays(date, start) + 1;
    const next = H.addDays(start, len);
    const nextMin = H.addDays(start, cs.min), nextMax = H.addDays(start, cs.max);
    const toNext = H.diffDays(next, date);
    const ov = len - 14;
    let phase, phaseName;
    if (dayN > cs.max + 7) { phase = 'late'; phaseName = 'задержка или нет данных'; }
    else if (dayN <= plen) { phase = 'menstrual'; phaseName = 'менструация'; }
    else if (dayN < ov - 1) { phase = 'follicular'; phaseName = 'фолликулярная фаза'; }
    else if (dayN <= ov + 1) { phase = 'ovulation'; phaseName = 'около овуляции'; }
    else { phase = 'luteal'; phaseName = 'лютеиновая фаза'; }
    const pms = phase === 'luteal' && toNext <= 7 && toNext >= 0;
    if (pms) phaseName = 'ПМС-окно (перед месячными)';
    const late = date > nextMax && dayN <= cs.max + 30 ? H.diffDays(date, nextMax) : 0;
    return { start, dayN, len, plen, next, nextMin, nextMax, toNext, phase, phaseName, pms, stats: cs, late };
  }
  // forecast for a calendar day: likely period, possible start window, ovulation, PMS window
  function forecast(date) {
    const out = { pred: false, possible: false, ovu: false, fertile: false, pms: false };
    if (date <= H.today()) return out;
    const st = periodStarts();
    const last = st[st.length - 1];
    if (!last) return out;
    const cs = cycleStats(); const len = cs.avg; const plen = Number(S().profile.periodLength) || 5;
    if (H.diffDays(H.today(), last) > cs.max + 14) return out; // too old to extrapolate
    if (date >= last && date < H.addDays(last, plen)) out.pred = true; // rest of the current period
    for (let k = 1; k <= 4; k++) {
      const ps = H.addDays(last, len * k);
      if (date >= ps && date < H.addDays(ps, plen)) out.pred = true;
      const wMin = H.addDays(last, cs.min * k), wMax = H.addDays(last, cs.max * k);
      if (date >= wMin && date <= wMax) out.possible = true;
      const prev = H.addDays(last, len * (k - 1));
      const ov = H.addDays(prev, len - 14);
      if (date === ov) out.ovu = true;
      if (date >= H.addDays(ov, -4) && date <= H.addDays(ov, 1)) out.fertile = true;
      if (date >= H.addDays(ps, -6) && date < ps) out.pms = true;
    }
    return out;
  }
  function isPredictedPeriod(date) { return forecast(date).pred; }

  // ---------- meds ----------
  function activeMeds(date) {
    return S().meds.filter(m => m.active !== false && (!m.start || m.start <= date) && (!m.end || m.end >= date));
  }
  function adherence(d, date) {
    const meds = activeMeds(date).filter(m => !m.asNeeded);
    if (!meds.length) return null;
    let need = 0, done = 0;
    meds.forEach(m => {
      const n = Number(m.times) || 1; need += n;
      const rec = d && d.meds && d.meds[m.id];
      if (rec && rec.slots) done += rec.slots.filter(Boolean).length;
    });
    return need ? done / need : null;
  }

  // ---------- emotions / wellbeing ----------
  function emoSplit(d) {
    const pos = [], neg = [];
    if (!d) return { pos, neg };
    for (const id in d.emotions) {
      const e = H.EMOTIONS.find(x => x.id === id); if (!e) continue;
      const sc = Number(d.emotions[id].score) || 5;
      if (e.v === 0) continue;
      (e.v > 0 ? pos : neg).push(sc);
    }
    return { pos, neg };
  }
  // Wellbeing index: six life domains (0..10), weighted, with a soft pull towards the weakest one
  const TENSE = () => H.EMOTIONS.filter(e => e.g === 'tense').map(e => e.id);
  function wellbeingDetail(d) {
    if (!d) return null;
    const g = d.general || {}, sy = d.symptoms || {}, sl = d.sleep || {};
    const dom = {};
    const wavg = arr => { const v = arr.filter(x => x[0] != null && !isNaN(x[0])); if (!v.length) return null; const w = v.reduce((a, x) => a + x[1], 0); return v.reduce((a, x) => a + x[0] * x[1], 0) / w; };
    // mood: overall rating + balance of pleasant vs heavy emotions (heavy ones weigh a bit more)
    let P = 0, N = 0, Z = 0;
    for (const id in d.emotions || {}) { const e = H.EMOTIONS.find(x => x.id === id); if (!e) continue; const sc = Number(d.emotions[id].score) || 5; if (e.v === 0) Z += sc; else if (e.v > 0) P += sc; else N += sc; }
    // «нейтрально» sits a little above the middle: an even, okay day
    const emoBal = (P + N + Z) ? H.clamp(5 + 5 * (P - 1.15 * N + .3 * Z) / Math.max(P + N + Z, 8), 0, 10) : null;
    dom.mood = wavg([[g.overall, 1], [emoBal, 1]]);
    // energy: energy rating, sleepiness, weakness, brain fog
    const sv = id => sy[id] ? Number(sy[id].score) : null;
    dom.energy = wavg([[g.energy, 1.5], [sv('sleepiness') != null ? 10 - sv('sleepiness') : null, 1], [sv('weakness') != null ? 10 - sv('weakness') : null, 1], [sv('fog') != null ? 10 - sv('fog') : null, .7]]);
    // body: other sensations — the strongest counts most, the rest add up
    const other = Object.keys(sy).filter(k => !['sleepiness', 'weakness', 'fog'].includes(k)).map(k => Number(sy[k].score) || 0).filter(x => x > 0);
    if (d.cycle && d.cycle.pain) other.push(Number(d.cycle.pain));
    if (other.length) { other.sort((a, b) => b - a); dom.body = H.clamp(10 - other[0] * .7 - other.slice(1).reduce((a, x) => a + x, 0) * .22, 0, 10); }
    else if (d.edited && d.edited.physical) dom.body = 10;
    // sleep: duration over the day (night + nap), quality, how rested, interruptions
    const night = sleepMinutes(d), nap = napMinutes(d) || 0;
    let dur = null;
    if (night != null) { const hrs = (night + Math.min(nap, 90)) / 60; dur = hrs >= 7 && hrs <= 9 ? 10 : hrs < 7 ? H.clamp(10 - (7 - hrs) * 2.4, 0, 10) : H.clamp(10 - (hrs - 9) * 1.6, 2, 10); }
    let pen = 0;
    if (sl.wakeups > 1) pen += Math.min(2, (sl.wakeups - 1) * .5);
    if (sl.latency === 'l') pen += .8; if (sl.latency === 'xl') pen += 1.6;
    if (nap > 150) pen += .8;
    const sBase = wavg([[dur, 1.3], [sl.quality, 1], [sl.wakeFeel, 1], [sl.napQuality != null && nap ? sl.napQuality : null, .3]]);
    dom.sleep = sBase == null ? null : H.clamp(sBase - pen, 0, 10);
    // calm: stress + tension emotions
    const tense = TENSE().map(id => d.emotions && d.emotions[id] ? Number(d.emotions[id].score) || 5 : null).filter(x => x != null);
    dom.calm = wavg([[g.stress != null ? 10 - g.stress : null, 1], [tense.length ? 10 - Math.max(...tense) : null, 1]]);
    // care: medicines taken
    const adh = adherence(d, d.date);
    dom.care = adh == null ? null : adh * 10;
    const W = { mood: 2, energy: 1.5, body: 1.2, sleep: 1.2, calm: 1, care: .5 };
    const present = Object.keys(W).filter(k => dom[k] != null);
    if (!present.some(k => k !== 'care')) return null;
    // the index is the weighted average of the areas that ARE marked — leaving something out does not lower it
    const mean = present.reduce((a, k) => a + dom[k] * W[k], 0) / present.reduce((a, k) => a + W[k], 0);
    let index = mean * 10;
    // one clearly bad area (below 4/10) pulls the day down a little, up to −10
    const minD = Math.min(...present.map(k => dom[k]));
    if (minD < 4 && present.length > 1) index -= (4 - minD) * 2.5;
    // only one area known: a light step toward the middle, so a single tap does not decide the whole day
    const areas = present.filter(k => k !== 'care').length;
    if (areas === 1) index = 50 + (index - 50) * .85;
    const coverage = present.reduce((a, k) => a + W[k], 0) / Object.values(W).reduce((a, b) => a + b, 0);
    return { index: H.clamp(Math.round(index), 0, 100), domains: dom, coverage, present, areas };
  }
  function wellbeing(d) { const x = wellbeingDetail(d); return x ? x.index : null; }
  // circumplex: where the day sits on pleasant↔unpleasant (v) and calm↔activated (a)
  function affect(d) {
    if (!d) return null;
    let sv = 0, sa = 0, w = 0;
    const g = d.general || {}, sy = d.symptoms || {};
    for (const id in d.emotions || {}) {
      const m = H.emoModel(H.EMOTIONS.find(x => x.id === id)); if (!m) continue;
      const k = (Number(d.emotions[id].score) || 5) / 10;
      sv += m.v * k * 1.4; sa += m.a * k * 1.4; w += k * 1.4;
    }
    if (g.overall != null) { sv += (g.overall - 5) / 5; w += 1; }
    if (g.energy != null) { sa += (g.energy - 5) / 5 * .8; w += .8; }
    if (g.stress != null) { sa += (g.stress - 5) / 5 * .6; sv -= (g.stress - 5) / 5 * .3; w += .6; }
    if (sy.sleepiness) { sa -= Number(sy.sleepiness.score) / 10 * .5; w += .4; }
    if (!w) return null;
    return { v: H.clamp(sv / w, -1, 1), a: H.clamp(sa / w, -1, 1), w };
  }
  // personal baseline: means of index and domains over previous N days
  function baseline(date, n = 30) {
    const ds = H.range(H.addDays(date, -n), H.addDays(date, -1));
    const rows = ds.map(dt => wellbeingDetail(S().days[dt])).filter(Boolean);
    if (rows.length < 5) return { n: rows.length };
    const dom = {};
    ['mood', 'energy', 'body', 'sleep', 'calm', 'care'].forEach(k => { const v = rows.map(r => r.domains[k]).filter(x => x != null); dom[k] = v.length >= 4 ? H.avg(v) : null; });
    const idx = rows.map(r => r.index);
    const mean = H.avg(idx);
    const sd = Math.sqrt(H.avg(idx.map(x => (x - mean) ** 2))) || 1;
    return { n: rows.length, mean, sd, idx, dom };
  }

  function filledBlocks(d) {
    if (!d) return 0;
    const b = new Set(Object.keys(d.edited || {}));
    return b.size;
  }

  // ---------- metric catalogue for charts & correlations ----------
  function domVal(d, k) { const x = wellbeingDetail(d); return x && x.domains[k] != null ? Math.round(x.domains[k] * 10) / 10 : null; }
  function emoVal(id) { return d => { if (!d || !d.emotions) return null; if (d.emotions[id]) return Number(d.emotions[id].score) || 5; return d.edited && d.edited.emotions ? 0 : null; }; }
  function symVal(id) { return d => d && d.symptoms && d.symptoms[id] ? Number(d.symptoms[id].score) : null; }
  const METRICS = [
    { id: 'wellbeing', name: 'Самочувствие (индекс)', get: d => { const w = wellbeing(d); return w == null ? null : w / 10; }, good: true },
    { id: 'overall', name: 'Оценка дня', get: d => d && d.general && d.general.overall != null ? d.general.overall : null, good: true },
    { id: 'energy', name: 'Энергия', get: d => d && d.general && d.general.energy != null ? d.general.energy : null, good: true },
    { id: 'stress', name: 'Стресс', get: d => d && d.general && d.general.stress != null ? d.general.stress : null },
    { id: 'sleepiness', name: 'Сонливость', get: symVal('sleepiness') },
    { id: 'weakness', name: 'Слабость', get: symVal('weakness') },
    { id: 'dizziness', name: 'Головокружение', get: symVal('dizziness') },
    { id: 'headache', name: 'Головная боль', get: symVal('headache') },
    { id: 'fog', name: 'Туман в голове', get: symVal('fog') },
    { id: 'emoNeg', name: 'Тяжёлые эмоции', get: d => { const { neg } = emoSplit(d); return neg.length ? Math.max(...neg) : (d && Object.keys(d.emotions || {}).length ? 0 : null); } },
    { id: 'emoPos', name: 'Приятные эмоции', get: d => { const { pos } = emoSplit(d); return pos.length ? Math.max(...pos) : (d && Object.keys(d.emotions || {}).length ? 0 : null); }, good: true },
    { id: 'sleepHours', name: 'Сон, часы', get: d => { const m = sleepMinutes(d); return m == null ? null : m / 60; }, unit: 'ч', notScale: true, good: true },
    { id: 'totalSleep', name: 'Сон за сутки, часы', get: d => { const m = totalSleep(d); return m == null ? null : m / 60; }, unit: 'ч', notScale: true, good: true },
    { id: 'napMin', name: 'Дневной сон, мин', get: d => napMinutes(d), notScale: true },
    { id: 'wakeFeel', name: 'Бодрость после пробуждения', get: d => d && d.sleep && d.sleep.wakeFeel != null ? d.sleep.wakeFeel : null, good: true },
    { id: 'sleepQuality', name: 'Качество сна', get: d => d && d.sleep && d.sleep.quality != null ? d.sleep.quality : null, good: true },
    { id: 'wakeups', name: 'Пробуждения ночью', get: d => d && d.sleep && d.sleep.wakeups != null ? Math.min(10, d.sleep.wakeups) : null, grp: 'sleep' },
    { id: 'dom_mood', name: 'Сфера: настроение', get: d => domVal(d, 'mood'), good: true, grp: 'dom' },
    { id: 'dom_energy', name: 'Сфера: энергия', get: d => domVal(d, 'energy'), good: true, grp: 'dom' },
    { id: 'dom_body', name: 'Сфера: тело', get: d => domVal(d, 'body'), good: true, grp: 'dom' },
    { id: 'dom_sleep', name: 'Сфера: сон', get: d => domVal(d, 'sleep'), good: true, grp: 'dom' },
    { id: 'dom_calm', name: 'Сфера: спокойствие', get: d => domVal(d, 'calm'), good: true, grp: 'dom' },
    { id: 'adherence', name: 'Приём лекарств', get: d => { const a = d ? adherence(d, d.date) : null; return a == null ? null : Math.round(a * 100) / 10; }, good: true, grp: 'care' },
    { id: 'emo_anxiety', name: 'Тревога', get: emoVal('anxiety'), grp: 'emo' },
    { id: 'emo_apathy', name: 'Апатия', get: emoVal('apathy'), grp: 'emo' },
    { id: 'emo_sad', name: 'Грусть', get: emoVal('sad'), grp: 'emo' },
    { id: 'emo_irritation', name: 'Раздражение', get: emoVal('irritation'), grp: 'emo' },
    { id: 'emo_emotired', name: 'Эмоциональная усталость', get: emoVal('emotired'), grp: 'emo' },
    { id: 'emo_joy', name: 'Радость', get: emoVal('joy'), good: true, grp: 'emo' },
    { id: 'emo_calm', name: 'Спокойствие (эмоция)', get: emoVal('calm'), good: true, grp: 'emo' },
    { id: 'cyclePain', name: 'Боль при месячных', get: d => d && d.cycle && d.cycle.pain != null ? Number(d.cycle.pain) : null, grp: 'body' },
    { id: 'appetite', name: 'Аппетит', get: d => d && d.lifestyle && d.lifestyle.appetite != null ? d.lifestyle.appetite : null },
    { id: 'water', name: 'Вода, стаканы', get: d => d && d.lifestyle && d.lifestyle.water != null ? d.lifestyle.water : null, notScale: true },
    { id: 'caffeine', name: 'Кофеин, чашки', get: d => d && d.lifestyle && d.lifestyle.caffeine != null ? d.lifestyle.caffeine : null, notScale: true },
    { id: 'walk', name: 'Прогулка, мин', get: d => d && d.lifestyle && d.lifestyle.walk != null ? d.lifestyle.walk : null, notScale: true },
  ];
  // treat "not marked" symptoms as 0 on days where the physical block was edited
  function metricValue(m, d) {
    let v = m.get(d);
    if (v == null && m.def0 && d && d.edited && d.edited.physical) v = 0;
    return v;
  }
  function seriesFor(metricId, dates) {
    const m = METRICS.find(x => x.id === metricId) || { get: symVal(metricId), def0: true };
    return dates.map(dt => metricValue(m, S().days[dt]));
  }

  function pearson(xs, ys) {
    const pts = [];
    for (let i = 0; i < xs.length; i++) if (xs[i] != null && ys[i] != null) pts.push([xs[i], ys[i]]);
    const n = pts.length;
    if (n < 6) return null;
    const mx = H.avg(pts.map(p => p[0])), my = H.avg(pts.map(p => p[1]));
    let sxy = 0, sxx = 0, syy = 0;
    for (const [x, y] of pts) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
    if (sxx === 0 || syy === 0) return null;
    return { r: sxy / Math.sqrt(sxx * syy), n };
  }

  Object.assign(H, { metrics: { affect, baseline, wellbeingDetail, sleepMinutes, napMinutes, totalSleep, periodStarts, cycleStats, cycleLength, cycleInfo, isPredictedPeriod, forecast, activeMeds, adherence, emoSplit, wellbeing, filledBlocks, METRICS, metricValue, seriesFor, pearson } });
})(window.H);

/* «Как считается индекс» — plain-language breakdown of today's number */
(function (H) {
  const NAMES = { mood: ['Настроение', 'оценка самочувствия и баланс приятных / тяжёлых эмоций'], energy: ['Энергия', 'оценка энергии, сонливость, слабость, туман в голове'], body: ['Тело', 'отмеченные симптомы: сильнее всех весит самый выраженный'], sleep: ['Сон', 'длительность (лучше всего 7–9 ч), качество, как проснулась, пробуждения'], calm: ['Спокойствие', 'стресс и тревожные эмоции'], care: ['Забота', 'отмеченные таблетки'] };
  const W = { mood: 2, energy: 1.5, body: 1.2, sleep: 1.2, calm: 1, care: .5 };
  H.indexExplain = function (d) {
    const { h, ui } = H;
    const x = d ? H.metrics.wellbeingDetail(d) : null;
    const rows = Object.keys(NAMES).map(k => {
      const v = x && x.domains[k] != null ? Math.round(x.domains[k] * 10) : null;
      return h('div.ix-row' + (v == null ? '.off' : ''), h('div.ix-main', h('b', NAMES[k][0]), h('span', NAMES[k][1])), h('div.ix-val', v == null ? 'не отмечено' : String(v)), h('div.ix-bar', h('i', { style: { width: (v || 0) + '%', background: v == null ? 'transparent' : H.wellColor(v) } })));
    });
    ui.modal('Как считается индекс', h('div.stack',
      x ? h('p', { style: { margin: 0 } }, `Сегодня — ${x.index} из 100, по ${x.areas} ${H.plural(x.areas, 'сфере', 'сферам', 'сферам')}.`) : h('p.muted', { style: { margin: 0 } }, 'Пока нечего считать — отметь хотя бы самочувствие.'),
      h('div.ix-list', rows),
      h('div.ix-rules',
        h('p', h('b', 'Считается только то, что ты отметила. '), 'Неотмеченные сферы не тянут индекс вниз: если отметила три пункта и все хорошие — индекс будет высоким. Каждая новая отметка его уточняет.'),
        h('p', 'Индекс — это среднее по сферам с весами: настроение ×2, энергия ×1,5, тело и сон ×1,2, спокойствие ×1, таблетки ×0,5. 100 — всё отлично, 50 — ровно, ниже 30 — тяжёлый день.'),
        h('p', 'Если какая-то сфера совсем плохая (ниже 40), день чуть снижается — максимум на 10, чтобы она не потерялась в среднем. Если отмечена всего одна сфера, индекс немного осторожнее.'),
        h('p.faint', 'Это ориентир по твоим собственным отметкам, а не медицинская оценка. Лучше всего он работает, когда сравниваешь дни между собой.'))),
      { actions: [h('button.btn.primary', { onclick: e => e.target.closest('.modal-back').querySelector('.modal-x').click() }, 'Понятно')] });
  };
})(window.H);
