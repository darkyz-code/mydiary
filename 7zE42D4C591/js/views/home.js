'use strict';
(function (H) {
  const { h, ui } = H;
  H.views = H.views || {};

  H.views.home = function (root) {
    const s = H.store.get();
    const t = H.today();
    const hr = new Date().getHours();
    const greet = hr < 5 ? 'Доброй ночи' : hr < 12 ? 'Доброе утро' : hr < 18 ? 'Добрый день' : 'Добрый вечер';
    const name = s.profile.name ? ', ' + s.profile.name : '';
    const d = s.days[t];
    const filled = H.metrics.filledBlocks(d);
    const totalBlocks = H.BLOCKS.filter(b => !s.settings.hiddenBlocks.includes(b.id)).length;

    const clock = h('div.home-clock');
    const tickClock = () => { const n = new Date(); clock.textContent = `${H.pad(n.getHours())}:${H.pad(n.getMinutes())}`; };
    tickClock();
    const timer = setInterval(() => { if (!document.body.contains(clock)) return clearInterval(timer); tickClock(); }, 10000);

    const todayTile = h('button.tile.glass.sheen', { onclick: () => H.go('day', { date: t }) }, h('span.streak'),
      H.gicon('sun', 30, 'xl'), h('div.t-arrow', H.icon('arrow', 20)),
      h('div.t-title', 'Сегодня'),
      h('div.t-sub', filled ? `Заполнено ${filled} из ${totalBlocks} разделов` : 'Ещё не заполнено — начнём?'));
    const calTile = h('button.tile.glass.sheen', { onclick: () => H.go('calendar') }, h('span.streak'),
      H.gicon('calendar', 30, 'xl'), h('div.t-arrow', H.icon('arrow', 20)),
      h('div.t-title', 'Календарь'),
      h('div.t-sub', `${H.cap(H.MONTHS[new Date().getMonth()])} · ${Object.keys(s.days).length} ${H.plural(Object.keys(s.days).length, 'день', 'дня', 'дней')} в дневнике`));

    // mini stats
    const minis = [];
    const ci = H.metrics.cycleInfo(t);
    if (ci && ci.phase !== 'late') minis.push(mini('flower', `День цикла ${ci.dayN}`, ci.phaseName, () => H.go('calendar')));
    const meds = H.metrics.activeMeds(t).filter(m => !m.asNeeded);
    if (meds.length) {
      const need = meds.reduce((a, m) => a + (Number(m.times) || 1), 0);
      const done = meds.reduce((a, m) => a + ((d && d.meds && d.meds[m.id] && d.meds[m.id].slots) ? d.meds[m.id].slots.filter(Boolean).length : 0), 0);
      minis.push(mini('pill', `Таблетки ${done}/${need}`, done >= need ? 'всё принято' : 'отметь приём', () => H.go('day', { date: t, focus: 'meds' })));
    }
    const sl = H.metrics.totalSleep(d), napM = H.metrics.napMinutes(d);
    minis.push(mini('moon', sl != null ? H.fmtDur(sl) : 'Сон', sl != null ? (napM ? 'сон с дневным' : 'сон этой ночью') : 'отметить сон', () => H.go('day', { date: t, focus: 'sleep' })));
    const wb = H.metrics.wellbeing(d);
    minis.push(mini('sparkle', wb != null ? `${wb} из 100` : 'Самочувствие', wb != null ? 'самочувствие сегодня' : 'как ты сегодня?', () => H.go('day', { date: t, focus: 'general' })));

    // week widget: calendar week Mon → Sun, arrows to browse, period / plans shown in colour
    let wOff = 0;
    const weekCard = h('div.glass.tip-card.week-card');
    const drawWeek = () => {
      H.clear(weekCard);
      const dow = (H.parse(t).getDay() + 6) % 7;
      const mon = H.addDays(t, -dow + wOff * 7), sun = H.addDays(mon, 6);
      const week = h('div.week-dots');
      const wvals = [];
      let anyPer = false, anyPred = false, anyLab = false;
      for (let i = 0; i < 7; i++) {
        const dt = H.addDays(mon, i);
        const dd = s.days[dt];
        const w = dt <= t ? H.metrics.wellbeing(dd) : null;
        if (w != null) wvals.push(w);
        const per = !!(dd && dd.cycle && dd.cycle.period);
        const fc = H.metrics.forecast(dt);
        const pred = !per && (fc.pred || fc.possible) && dt >= t;
        const labs = (s.labPlans || []).filter(p => p.date === dt && !p.done);
        anyPer = anyPer || per; anyPred = anyPred || pred; anyLab = anyLab || !!labs.length;
        const tip = [H.cap(H.weekday(dt)) + ', ' + H.fmtLong(dt), w != null ? `самочувствие ${w}/100` : null, per ? 'месячные' : pred ? 'ожидаются месячные' : null, labs.length ? 'анализ: ' + labs.map(p => p.names.join(', ')).join('; ') : null].filter(Boolean).join(' · ');
        week.appendChild(h('div.wd' + (dt === t ? '.today' : '') + (dt > t ? '.future' : '') + (per ? '.per' : '') + (pred ? '.pred' : ''), { onclick: () => H.go('day', { date: dt }), title: tip },
          h('div.dot', { style: w != null ? { background: H.wellColor(w), borderColor: 'transparent' } : {} }, w != null ? String(w) : '', labs.length ? h('i.wd-lab', H.icon('flask', 9)) : null),
          h('span', H.WD_SHORT[H.parse(dt).getDay()]), h('small', String(H.parse(dt).getDate()))));
      }
      const avg = wvals.length ? Math.round(H.avg(wvals)) : null;
      const label = wOff === 0 ? 'Эта неделя' : wOff === -1 ? 'Прошлая неделя' : wOff === 1 ? 'Следующая неделя' : `${H.fmtShort(mon)} – ${H.fmtShort(sun)}`;
      weekCard.append(H.gicon('chart', 18), h('div', { style: { flex: 1 } },
        h('div.tc-t.wk-head', h('span', label), avg != null ? h('span.wk-avg', `в среднем ${avg}`) : null,
          h('span.wk-nav', h('button.wk-arr', { title: 'Предыдущая неделя', onclick: e => { e.stopPropagation(); wOff--; drawWeek(); } }, '‹'),
            wOff !== 0 ? h('button.wk-today', { onclick: e => { e.stopPropagation(); wOff = 0; drawWeek(); } }, 'сейчас') : null,
            h('button.wk-arr', { title: 'Следующая неделя', onclick: e => { e.stopPropagation(); wOff++; drawWeek(); } }, '›'))),
        week,
        anyPer || anyPred || anyLab ? h('div.wk-legend', anyPer ? h('span', h('i.l-per'), 'месячные') : null, anyPred ? h('span', h('i.l-pred'), 'прогноз') : null, anyLab ? h('span', h('i.l-lab'), 'анализ') : null) : null));
    };
    drawWeek();

    const tips = H.report.homeTips();
    const cards = h('div.home-cards',
      tips.filter(tp => tp.hot).map(tp => h('div.glass.tip-card.link.hot', { onclick: () => H.go(tp.go[0], tp.go[1]) }, H.gicon(tp.ico, 18), h('div', h('div.tc-t', tp.t), h('p', tp.d)))),
      h('div.glass.tip-card', H.gicon('heart', 18), h('div', h('div.tc-t', 'Совет дня'), h('p', H.report.tipOfDay()))),
      weekCard,
      tips.filter(tp => !tp.hot).map(tp => h('div.glass.tip-card' + (tp.go ? '.link' : ''), { onclick: tp.go ? () => H.go(tp.go[0], tp.go[1] ? { date: t, ...tp.go[1] } : null) : null }, H.gicon(tp.ico, 18), h('div', h('div.tc-t', tp.t), h('p', tp.d)))));

    root.appendChild(h('div.home',
      h('div.home-greet', greet + name),
      h('div.home-date', H.fmtLong(t)),
      h('div.home-wd', H.cap(H.weekday(t)) + ', ' + new Date().getFullYear()),
      clock,
      h('div.home-tiles', todayTile, calTile),
      minis.length ? h('div.home-strip', minis) : null,
      cards));
  };

  function mini(ico, v, l, go) { return h('div.glass.mini.link', { onclick: go }, H.gicon(ico, 17), h('div', h('div.m-v', v), h('div.m-l', l)), h('span.m-go', H.icon('arrow', 14))); }
})(window.H);
