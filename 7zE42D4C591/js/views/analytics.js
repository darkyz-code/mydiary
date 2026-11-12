'use strict';
(function (H) {
  const { h, ui } = H;

  const PHASES = [
    { id: 'menstrual', name: 'Месячные' },
    { id: 'follicular', name: 'Фолликулярная' },
    { id: 'ovulation', name: 'Овуляция' },
    { id: 'luteal', name: 'Лютеиновая' },
    { id: 'pms', name: 'ПМС-окно' },
  ];

  H.views.analytics = function (root) {
    const S = H.store.get();
    let period = 30;
    let picked = (S.settings.chartPicked && S.settings.chartPicked.length ? S.settings.chartPicked : ['wellbeing', 'sleepiness', 'energy']).slice();
    let pickerOpen = false;
    const host = h('div.stack');

    function dates() {
      const t = H.today();
      if (period === 'all') {
        const keys = Object.keys(S.days).sort();
        return keys.length ? H.range(keys[0], t) : H.range(H.addDays(t, -29), t);
      }
      return H.range(H.addDays(t, -(period - 1)), t);
    }

    function render() {
      H.clear(host);
      const ds = dates();
      const filled = ds.filter(d => S.days[d] && Object.keys(S.days[d].edited || {}).length);

      // controls
      const scaleMetrics = H.metrics.METRICS.filter(m => !m.notScale);
      // symptoms that actually occur in this period
      const symIds = new Set();
      ds.forEach(d => Object.keys((S.days[d] && S.days[d].symptoms) || {}).forEach(id => symIds.add(id)));
      const known = new Set(scaleMetrics.map(m => m.id));
      const symMetrics = [...symIds].filter(id => !known.has(id)).map(id => { const sy = H.store.symptomById(id); return sy ? { id, name: sy.name } : null; }).filter(Boolean);
      const GROUPS = [
        { name: 'Главное', items: scaleMetrics.filter(m => ['wellbeing', 'overall', 'energy', 'stress'].includes(m.id)) },
        { name: 'Сферы самочувствия', items: scaleMetrics.filter(m => m.grp === 'dom') },
        { name: 'Эмоции', items: scaleMetrics.filter(m => m.grp === 'emo' || ['emoNeg', 'emoPos'].includes(m.id)) },
        { name: 'Тело', items: [...scaleMetrics.filter(m => ['sleepiness', 'weakness', 'dizziness', 'headache', 'fog', 'cyclePain'].includes(m.id)), ...symMetrics] },
        { name: 'Сон', items: scaleMetrics.filter(m => ['sleepQuality', 'wakeFeel'].includes(m.id) || m.grp === 'sleep') },
        { name: 'Забота о себе', items: scaleMetrics.filter(m => m.grp === 'care' || m.id === 'appetite') },
      ].filter(g => g.items.length);
      const allNames = {}; GROUPS.forEach(g => g.items.forEach(m => allNames[m.id] = m.name));
      const persist = () => { S.settings.chartPicked = picked.slice(); H.store.save(); };
      const pickedRow = h('div.chips', picked.map(id => ui.chip((allNames[id] || id) + '  ✕', true, () => { picked = picked.filter(x => x !== id); persist(); render(); })),
        h('button.chip.add', { onclick: () => { pickerOpen = !pickerOpen; render(); } }, pickerOpen ? 'Свернуть' : '+ Добавить показатель'));
      host.appendChild(h('div.glass.card',
        h('div.row.wrapr', { style: { gap: '16px', alignItems: 'flex-start' } },
          h('div', h('div.fsection-title', 'Период'), ui.segmented([{ id: 14, name: '14 дней', toggleOff: false }, { id: 30, name: '30 дней', toggleOff: false }, { id: 90, name: '90 дней', toggleOff: false }, { id: 'all', name: 'Всё время', toggleOff: false }], period, v => { period = v; render(); })),
          h('div', { style: { flex: 1 } }, h('div.fsection-title', `На графике (до 5)`), pickedRow)),
        pickerOpen ? h('div.metric-picker', GROUPS.map(g => h('div.mp-group', h('div.mp-title', g.name),
          h('div.chips', g.items.map(m => ui.chip(m.name, picked.includes(m.id), () => {
            if (picked.includes(m.id)) picked = picked.filter(x => x !== m.id);
            else { picked.push(m.id); if (picked.length > 5) picked.shift(); }
            persist(); render();
          })))))) : null));

      if (filled.length < 2) {
        host.appendChild(h('div.glass.card', ui.empty('leaf', 'Графики и связи появятся, когда в дневнике будет хотя бы несколько заполненных дней. Чем больше записей — тем точнее выводы.', h('button.btn.primary', { onclick: () => H.go('day', { date: H.today() }) }, 'Заполнить сегодня'))));
        return;
      }

      // bands for period days
      const bands = [];
      let open = null;
      ds.forEach(d => {
        const p = S.days[d] && S.days[d].cycle && S.days[d].cycle.period;
        if (p && !open) open = { from: d, to: d };
        else if (p && open) open.to = d;
        else if (!p && open) { bands.push(open); open = null; }
      });
      if (open) bands.push(open);

      const series = picked.map(id => ({ name: allNames[id] || (H.metrics.METRICS.find(m => m.id === id) || {}).name || id, values: H.metrics.seriesFor(id, ds) }));
      host.appendChild(h('div.glass.chart-card',
        h('div.card-title', H.gicon('chart', 17, 'sm'), h('h3', 'Динамика'), h('span.faint', { style: { marginLeft: 'auto', fontSize: '.78rem' } }, bands.length ? 'Розовые полосы — дни месячных · шкала 0–10' : 'Шкала 0–10')),
        series.length ? H.charts.lineChart({ dates: ds, series, bands, height: 280, legend: true }) : h('p.muted', 'Выбери показатели выше.')));

      // sleep chart
      const sleep = ds.map(d => { const m = H.metrics.totalSleep(S.days[d]); return m == null ? null : m / 60; });
      if (sleep.some(v => v != null)) {
        host.appendChild(h('div.glass.chart-card',
          h('div.card-title', H.gicon('moon', 17, 'sm'), h('h3', 'Сон, часы'), h('span.faint', { style: { marginLeft: 'auto', fontSize: '.78rem' } }, 'Ночь + дневной сон · зелёная зона 7–9 ч')),
          H.charts.barChart({ dates: ds, values: sleep, max: 12, target: [7, 9], name: 'Сон', fmt: v => H.fmtDur(v * 60), height: 190 })));
      }

      // correlations
      host.appendChild(h('div.glass.card', h('div.card-title', H.gicon('compass', 17, 'sm'), h('h3', 'Возможные связи')), correlations(ds)));

      // cycle phases
      const phaseCard = cyclePhases(ds);
      if (phaseCard) host.appendChild(phaseCard);

      // emotions frequency
      host.appendChild(emotionStats(ds));

      // med adherence
      const adh = adherenceCard(ds);
      if (adh) host.appendChild(adh);
    }

    function correlations(ds) {
      const ids = ['sleepHours', 'sleepQuality', 'sleepiness', 'energy', 'overall', 'weakness', 'dizziness', 'headache', 'fog', 'emoNeg', 'stress', 'water', 'caffeine', 'walk', 'appetite'];
      const series = {};
      ids.forEach(id => series[id] = H.metrics.seriesFor(id, ds));
      // derived: adherence and cycle-related
      series.adh = ds.map(d => H.metrics.adherence(S.days[d], d));
      series.pms = ds.map(d => { const c = H.metrics.cycleInfo(d); return c && c.phase !== 'late' && S.days[d] ? (c.pms || c.phase === 'menstrual' ? 1 : 0) : null; });
      series.prevSleep = ds.map((d, i) => i ? series.sleepHours[i - 1] : null);
      const name = id => ({ adh: 'приём лекарств', pms: 'ПМС и месячные', prevSleep: 'сон прошлой ночью' }[id] || (H.metrics.METRICS.find(m => m.id === id) || {}).name.toLowerCase());
      const pairs = [
        ['sleepHours', 'sleepiness'], ['sleepHours', 'energy'], ['sleepHours', 'emoNeg'], ['sleepHours', 'headache'], ['sleepQuality', 'sleepiness'],
        ['sleepiness', 'emoNeg'], ['sleepiness', 'fog'], ['weakness', 'emoNeg'], ['energy', 'emoNeg'], ['stress', 'sleepHours'], ['stress', 'headache'],
        ['water', 'headache'], ['water', 'dizziness'], ['caffeine', 'sleepHours'], ['caffeine', 'headache'], ['walk', 'emoNeg'], ['walk', 'energy'],
        ['adh', 'emoNeg'], ['adh', 'sleepiness'], ['pms', 'emoNeg'], ['pms', 'appetite'], ['pms', 'headache'], ['pms', 'weakness'], ['dizziness', 'weakness'],
      ];
      const found = [];
      pairs.forEach(([a, b]) => {
        const r = H.metrics.pearson(series[a], series[b]);
        if (r && Math.abs(r.r) >= 0.3) found.push({ a, b, ...r });
      });
      found.sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
      const list = h('div.stack', { style: { gap: '10px' } });
      if (!found.length) {
        list.appendChild(h('p.muted', { style: { fontSize: '.9rem' } }, 'Пока явных связей не видно. Для надёжных выводов нужно хотя бы 2–3 недели записей по одним и тем же показателям.'));
      }
      found.slice(0, 8).forEach(f => {
        const strength = Math.abs(f.r) >= 0.6 ? 'сильная' : Math.abs(f.r) >= 0.45 ? 'заметная' : 'слабая';
        const pos = f.r > 0;
        const text = `Когда ${phrase(f.a, true)}, ${phrase(f.b, pos)}`;
        list.appendChild(h('div.corr', h('div.c-ico', pos ? '↗' : '↘'), h('div', h('div.c-t', H.cap(text)), h('div.c-s', `Связь ${strength} · по ${f.n} ${H.plural(f.n, 'дню', 'дням', 'дням')}`))));
      });
      list.appendChild(h('p.faint', { style: { fontSize: '.76rem', margin: '6px 0 0' } }, 'Это совпадения в твоих данных, а не доказанная причина. Но они — хороший повод для вопроса врачу.'));
      return list;

      function phrase(id, up) {
        const n = name(id);
        if (id === 'pms') return up ? 'идут ПМС или месячные' : 'нет ПМС';
        if (id === 'adh') return up ? 'лекарства приняты полностью' : 'были пропуски лекарств';
        if (id === 'sleepHours' || id === 'prevSleep') return up ? 'сна больше' : 'сна меньше';
        if (id === 'water') return up ? 'воды больше' : 'воды меньше';
        if (id === 'caffeine') return up ? 'кофеина больше' : 'кофеина меньше';
        if (id === 'walk') return up ? 'прогулки дольше' : 'прогулки короче';
        return up ? `${n} выше` : `${n} ниже`;
      }
    }

    function cyclePhases(ds) {
      const by = {};
      PHASES.forEach(p => by[p.id] = []);
      ds.forEach(d => {
        if (!S.days[d]) return;
        const c = H.metrics.cycleInfo(d);
        if (!c || c.phase === 'late') return;
        by[c.pms ? 'pms' : c.phase].push(d);
      });
      const usedPhases = PHASES.filter(p => by[p.id].length);
      if (usedPhases.length < 2) return null;
      const rows = ['wellbeing', 'energy', 'sleepiness', 'weakness', 'headache', 'emoNeg', 'appetite'];
      const tbl = h('table.tbl', h('thead', h('tr', h('th', 'Показатель'), usedPhases.map(p => h('th', `${p.name} (${by[p.id].length} дн.)`)))),
        h('tbody', rows.map(id => {
          const m = H.metrics.METRICS.find(x => x.id === id);
          return h('tr', h('td', m.name), usedPhases.map(p => {
            const v = H.avg(H.metrics.seriesFor(id, by[p.id]));
            if (v == null) return h('td', '—');
            const col = m.good ? H.wellColor(v * 10, .25) : H.scoreColor(v, .22);
            return h('td', h('span.heat', { style: { background: col } }, String(H.round1(v))));
          }));
        })));
      return h('div.glass.card', h('div.card-title', H.gicon('flower', 17, 'sm'), h('h3', 'Самочувствие по фазам цикла'), h('span.faint', { style: { marginLeft: 'auto', fontSize: '.78rem' } }, 'Средние значения, шкала 0–10')), tbl);
    }

    function emotionStats(ds) {
      const cnt = {};
      ds.forEach(d => { const dd = S.days[d]; if (!dd) return; for (const id in dd.emotions) { (cnt[id] = cnt[id] || []).push(dd.emotions[id].score || 5); } });
      const list = Object.keys(cnt).map(id => ({ e: H.EMOTIONS.find(x => x.id === id), n: cnt[id].length, avg: H.avg(cnt[id]) })).filter(x => x.e).sort((a, b) => b.n - a.n).slice(0, 10);
      const max = list.length ? list[0].n : 1;
      return h('div.glass.card', h('div.card-title', H.gicon('mind', 17, 'sm'), h('h3', 'Частые эмоции')),
        list.length ? list.map(x => h('div.bar-row', h('span', x.e.e + ' ' + x.e.name), h('div.bar', h('i', { style: { width: (x.n / max * 100) + '%' } })), h('span.faint', `${x.n} дн. · ${H.round1(x.avg)}`))) : h('p.muted', 'Эмоции за этот период ещё не отмечены.'));
    }

    function adherenceCard(ds) {
      const meds = S.meds.filter(m => !m.asNeeded);
      if (!meds.length) return null;
      const rows = meds.map(m => {
        let need = 0, done = 0;
        ds.forEach(d => {
          if (d > H.today() || (m.start && d < m.start) || !S.days[d] || !Object.keys(S.days[d].edited || {}).length) return;
          const n = Number(m.times) || 1; need += n;
          const r = S.days[d].meds && S.days[d].meds[m.id]; if (r && r.slots) done += r.slots.filter(Boolean).length;
        });
        return { m, need, done };
      }).filter(x => x.need);
      if (!rows.length) return null;
      return h('div.glass.card', h('div.card-title', H.gicon('pill', 17, 'sm'), h('h3', 'Приём лекарств'), h('span.faint', { style: { marginLeft: 'auto', fontSize: '.78rem' } }, 'По дням с записями')),
        rows.map(x => h('div.bar-row', h('span', x.m.name), h('div.bar', h('i', { style: { width: (x.done / x.need * 100) + '%' } })), h('span.faint', Math.round(x.done / x.need * 100) + '%'))));
    }

    render();
    root.appendChild(h('div.wrap', h('div.view-head', h('div', h('h1', 'Аналитика и связи'), h('div.sub', 'Как меняется состояние и что может на него влиять'))), host));
  };
})(window.H);
