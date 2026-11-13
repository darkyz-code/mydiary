'use strict';
(function (H) {
  const { h, ui } = H;

  H.views.calendar = function (root, params) {
    const S = H.store.get();
    let ym = (params && params.month) || H.today().slice(0, 7);
    const t = H.today();
    const gridHost = h('div');
    const title = h('h2');
    const statsHost = h('div.stat-list');
    let tipEl = null;
    let markMode = false;
    const cycleHost = h('div');

    function cellFor(dt, other) {
      const d = S.days[dt];
      const w = H.metrics.wellbeing(d);
      const cls = ['cal-cell'];
      if (other) cls.push('other');
      if (dt === t) cls.push('today');
      if (dt > t) cls.push('future');
      const marks = [];
      const fc = H.metrics.forecast(dt);
      const isPer = !!(d && d.cycle && d.cycle.period);
      if (isPer) cls.push('is-period');
      else if (fc.pred) cls.push('is-pred');
      if (!isPer && !fc.pred && fc.possible) cls.push('is-possible');
      if (!isPer && !fc.pred && !fc.possible && fc.fertile) cls.push('is-fertile');
      if (fc.ovu) marks.push(h('i.mk.ovu', { title: 'Вероятная овуляция' }));
      if ((d && d.cycle && d.cycle.pms) || (!isPer && fc.pms)) marks.push(h('i.mk.pms', { title: d && d.cycle && d.cycle.pms ? 'ПМС' : 'Ожидаемое ПМС-окно' }));
      const plans = (S.labPlans || []).filter(p => p.date === dt && !p.done);
      if (plans.length) { cls.push('has-lab'); marks.push(h('span.mk-lab', { title: 'Анализ: ' + plans.map(p => p.names.join(', ')).join('; ') }, H.icon('flask', 12))); }
      if (d) {
        const adh = H.metrics.adherence(d, dt);
        if (adh != null && adh < 1 && dt <= t && Object.keys(d.edited || {}).length) marks.push(h('i.mk.miss', { title: 'Не все таблетки отмечены' }));
        const sl = H.metrics.sleepMinutes(d);
        if (sl != null && sl < 360) marks.push(h('i.mk.lowsleep', { title: 'Сон меньше 6 часов' }));
        if ((d.thoughts || '').trim() || (d.complaints || '').trim()) marks.push(h('i.mk.note', { title: 'Есть записи' }));
      }
      const thumb = d && d.photos && d.photos[0] ? d.photos[0].thumb : null;
      const c = h('div.' + cls.join('.'), { onclick: () => {
          if (markMode) { togglePeriod(dt); return; }
          H.go('day', { date: dt });
        } },
        thumb ? h('div.cd-photo', { style: { backgroundImage: `url(${thumb})` } }) : null,
        w != null ? h('div.cd-fill', { style: { background: H.wellColor(w) } }) : null,
        isPer ? h('span.cd-drop', H.icon('drop', 13)) : fc.pred ? h('span.cd-drop.pred', H.icon('drop', 13)) : null,
        h('span.cd-n', String(H.parse(dt).getDate())),
        w != null ? h('span.cd-idx', String(w)) : null,
        h('div.cd-marks', marks));
      c.addEventListener('mouseenter', e => showTip(e, dt, d, w));
      c.addEventListener('mouseleave', hideTip);
      return c;
    }
    function togglePeriod(dt) {
      const d = H.store.day(dt, true);
      d.cycle.period = !d.cycle.period;
      if (!d.cycle.period) delete d.cycle.flow;
      H.store.touch(dt, 'cycle');
      render();
    }
    function renderCycle() {
      H.clear(cycleHost);
      const info = H.metrics.cycleInfo(t);
      const len = H.metrics.cycleLength();
      const rows = [];
      if (info && info.phase !== 'late') {
        rows.push(h('div.cyc-big', h('div.cyc-n', String(info.dayN)), h('div', h('div.cyc-t', 'день цикла'), h('div.cyc-p', H.cap(info.phaseName)))));
        const cs = info.stats;
        rows.push(h('div.stat', h('span.muted', 'Следующие месячные'), h('b', `≈ ${H.fmtLong(info.next)}`)));
        if (info.nextMin !== info.nextMax) rows.push(h('div.stat', h('span.muted', 'Вероятное окно'), h('b', `${H.fmtShort(info.nextMin)} – ${H.fmtShort(info.nextMax)}`)));
        rows.push(h('div.stat', h('span.muted', 'Осталось'), h('b', info.late ? `задержка ${info.late} ${H.plural(info.late, 'день', 'дня', 'дней')}` : info.toNext > 0 ? `≈ ${info.toNext} ${H.plural(info.toNext, 'день', 'дня', 'дней')}` : 'могут начаться')));
        rows.push(h('div.stat', h('span.muted', 'Длина цикла'), h('b', cs.min === cs.max ? `${cs.avg} дн.` : `${cs.min}–${cs.max} дн.`)));
        rows.push(h('p.faint', { style: { fontSize: '.76rem', margin: '4px 0 0' } }, cs.learned ? `Прогноз по ${cs.count + 1} отмеченным циклам — с каждым месяцем точнее.` : 'Пока прогноз по длине цикла из карточки здоровья. Отмечай месячные — и он начнёт подстраиваться под тебя.'));
      } else if (info && info.phase === 'late') {
        rows.push(h('p.muted', { style: { fontSize: '.86rem' } }, `Последние отмеченные месячные — ${H.fmtLong(info.start)}. Если они уже были после этого, отметь их в календаре.`));
      } else {
        rows.push(h('p.muted', { style: { fontSize: '.86rem' } }, 'Отметь дни месячных прямо в календаре — приложение посчитает день цикла и покажет прогноз.'));
      }
      const btn = h('button.btn.small' + (markMode ? '.primary' : ''), { onclick: () => { markMode = !markMode; render(); } }, H.icon('drop', 15), markMode ? 'Готово' : 'Отметить месячные');
      rows.push(h('div', { style: { marginTop: '10px' } }, btn));
      if (markMode) rows.push(h('p.faint', { style: { fontSize: '.78rem', margin: '8px 0 0' } }, 'Нажимай на дни, когда были месячные. Повторное нажатие снимает отметку.'));
      cycleHost.append(h('div.stat-list', ...rows));
    }
    function showTip(e, dt, d, w) {
      hideTip();
      if (markMode) return;
      const lines = [h('b', H.cap(H.weekday(dt)) + ', ' + H.fmtLong(dt))];
      const fc = H.metrics.forecast(dt);
      if (fc.pred) lines.push(h('div', { style: { color: '#e0528a' } }, 'Ожидаются месячные'));
      else if (fc.possible) lines.push(h('div', { style: { color: '#e0528a' } }, 'Месячные могут начаться'));
      if (fc.ovu) lines.push(h('div', { style: { color: '#9d8cf6' } }, 'Вероятная овуляция'));
      else if (fc.fertile) lines.push(h('div.faint', 'Фертильное окно (прогноз)'));
      if (fc.pms && !fc.pred) lines.push(h('div', { style: { color: '#e0a03a' } }, 'Ожидаемое ПМС-окно'));
      (S.labPlans || []).filter(p => p.date === dt).forEach(p => lines.push(h('div.tip-lab', H.icon('flask', 13), (p.done ? 'Сдан: ' : 'Сдать: ') + p.names.join(', '))));
      if (!d || !Object.keys(d.edited || {}).length) lines.push(h('div.faint', dt > t ? 'Будущий день' : 'Нет записей'));
      else {
        if (w != null) lines.push(h('div', `Самочувствие: ${w}/100`));
        const sl = H.metrics.sleepMinutes(d); const nap = H.metrics.napMinutes(d); if (sl != null || nap) lines.push(h('div', 'Сон: ' + H.fmtDur((sl || 0) + (nap || 0)) + (nap ? ` (днём ${H.fmtDur(nap)})` : '')));
        const top = Object.keys(d.emotions || {}).map(id => ({ e: H.EMOTIONS.find(x => x.id === id), s: d.emotions[id].score })).filter(x => x.e).sort((a, b) => b.s - a.s).slice(0, 3);
        if (top.length) lines.push(h('div', top.map(x => x.e.e + ' ' + x.e.name.toLowerCase()).join(', ')));
        const sy = Object.keys(d.symptoms || {}).map(id => ({ s: H.store.symptomById(id), v: d.symptoms[id].score })).filter(x => x.s && x.v >= 5).sort((a, b) => b.v - a.v).slice(0, 3);
        if (sy.length) lines.push(h('div', sy.map(x => `${x.s.name.toLowerCase()} ${x.v}`).join(', ')));
        lines.push(h('div.faint', { style: { marginTop: '4px' } }, 'Изменено ' + H.fmtStamp(d.updatedAt)));
      }
      tipEl = h('div.cal-tip.glass', lines);
      document.body.appendChild(tipEl);
      const r = e.currentTarget.getBoundingClientRect();
      tipEl.style.maxWidth = Math.max(0,innerWidth-24)+'px';
      tipEl.style.maxHeight = Math.max(0,innerHeight-24)+'px';
      tipEl.style.overflowY = 'auto';
      const box = tipEl.getBoundingClientRect();
      let x = r.right + 10; if (x + box.width > innerWidth-12) x = r.left-box.width-10;
      tipEl.style.left = H.clamp(x,12,Math.max(12,innerWidth-box.width-12))+'px';
      tipEl.style.top = H.clamp(r.top,12,Math.max(12,innerHeight-box.height-12))+'px';
    }
    function hideTip() { if (tipEl) { tipEl.remove(); tipEl = null; } }

    function render() {
      hideTip();
      H.clear(gridHost);
      const [y, m] = ym.split('-').map(Number);
      title.textContent = H.cap(H.MONTHS[m - 1]) + ' ' + y;
      const first = new Date(y, m - 1, 1);
      const shift = (first.getDay() + 6) % 7; // monday first
      const start = H.addDays(H.iso(first), -shift);
      const grid = h('div.cal-grid', ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(w => h('div.cal-wd', w)));
      const lastDay = new Date(y, m, 0).getDate();
      const cells = Math.ceil((shift + lastDay) / 7) * 7;
      for (let i = 0; i < cells; i++) {
        const dt = H.addDays(start, i);
        const c = cellFor(dt, H.parse(dt).getMonth() !== m - 1);
        c.style.animationDelay = (i * 10) + 'ms';
        grid.appendChild(c);
      }
      grid.classList.toggle('mark-mode', markMode);
      gridHost.appendChild(grid);
      renderStats(y, m, lastDay);
      renderCycle();
    }
    function renderStats(y, m, lastDay) {
      H.clear(statsHost);
      const dates = H.range(`${y}-${H.pad(m)}-01`, `${y}-${H.pad(m)}-${H.pad(lastDay)}`);
      const filled = dates.filter(d => S.days[d] && Object.keys(S.days[d].edited || {}).length);
      const wbs = filled.map(d => H.metrics.wellbeing(S.days[d])).filter(x => x != null);
      const sleeps = filled.map(d => H.metrics.sleepMinutes(S.days[d])).filter(x => x != null);
      const sleepy = H.metrics.seriesFor('sleepiness', filled).filter(x => x != null);
      const period = dates.filter(d => S.days[d] && S.days[d].cycle && S.days[d].cycle.period).length;
      const stat = (l, v) => h('div.stat', h('span.muted', l), h('b', v));
      statsHost.append(
        stat('Дней с записями', `${filled.length} из ${lastDay}`),
        stat('Среднее самочувствие', wbs.length ? Math.round(H.avg(wbs)) + ' / 100' : '—'),
        stat('Средний сон', sleeps.length ? H.fmtDur(H.avg(sleeps)) : '—'),
        stat('Средняя сонливость', sleepy.length ? H.round1(H.avg(sleepy)) + ' / 10' : '—'),
        stat('Дней месячных', period ? String(period) : '—'));
    }
    const move = k => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + k, 1); ym = `${d.getFullYear()}-${H.pad(d.getMonth() + 1)}`; render(); };

    const cal = h('div.glass.cal',
      h('div.cal-head',
        h('button.icon-btn', { onclick: () => move(-1), title: 'Предыдущий месяц' }, '‹'),
        title,
        h('button.icon-btn', { onclick: () => move(1), title: 'Следующий месяц' }, '›'),
        h('div', { style: { flex: 1 } }),
        h('button.btn.small', { onclick: () => { ym = t.slice(0, 7); render(); } }, 'Текущий месяц'),
        h('button.btn.small.primary', { onclick: () => H.go('day', { date: t }) }, 'Открыть сегодня')),
      gridHost);

    const side = h('div.stack',
      h('div.glass.card', h('div.card-title', H.gicon('flower', 17, 'sm'), h('h3', 'Цикл')), cycleHost),
      h('div.glass.card', h('div.card-title', H.gicon('chart', 17, 'sm'), h('h3', 'Месяц в цифрах')), statsHost),
      h('div.glass.card', h('div.card-title', H.gicon('target', 17, 'sm'), h('h3', 'Обозначения')),
        h('div.legend',
          h('div', h('div.muted', { style: { fontSize: '.8rem', marginBottom: '6px' } }, 'Полоска внизу дня — общее самочувствие'), h('div.lg-scale'), h('div.row', { style: { justifyContent: 'space-between', fontSize: '.72rem' } }, h('span', 'тяжело'), h('span', 'хорошо'))),
          h('div.lg', h('i.lg-cell.is-period'), 'Месячные'),
          h('div.lg', h('i.lg-cell.is-pred'), 'Ожидаемые месячные'),
          h('div.lg', h('i.lg-cell.is-possible'), 'Могут начаться (окно прогноза)'),
          h('div.lg', h('i.lg-cell.is-fertile'), 'Фертильное окно (прогноз)'),
          h('div.lg', h('i.mk.ovu'), 'Вероятная овуляция'),
          h('div.lg', h('i.mk.pms'), 'ПМС или ожидаемое ПМС-окно'),
          h('div.lg', h('i.mk.lowsleep'), 'Сон меньше 6 часов'),
          h('div.lg', h('i.mk.miss'), 'Не все таблетки отмечены'),
          h('div.lg', h('i.mk.note'), 'Есть жалобы или мысли'),
          h('div.lg', h('span.mk-lab', H.icon('flask', 12)), 'Запланирован анализ'))));

    render();
    root.appendChild(h('div.wrap',
      h('div.view-head', h('div', h('h1', 'Календарь'), h('div.sub', 'Нажми на любой день, чтобы открыть или дополнить его'))),
      h('div.cal-wrap', cal, side)));
    return () => hideTip();
  };
})(window.H);
