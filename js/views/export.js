'use strict';
(function (H) {
  const { h, ui, esc } = H;
  const COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#6250d6'];

  function staticLine(dates, series, { yMin = 0, yMax = 10, height = 190, bands = [] } = {}) {
    const W = 720, Hh = height, m = { l: 30, r: 10, t: 10, b: 24 };
    const iw = W - m.l - m.r, ih = Hh - m.t - m.b, n = dates.length;
    const x = i => m.l + (n <= 1 ? iw / 2 : i / (n - 1) * iw);
    const y = v => m.t + ih - (v - yMin) / (yMax - yMin) * ih;
    let out = `<svg viewBox="0 0 ${W} ${Hh}" width="100%" xmlns="http://www.w3.org/2000/svg" style="font-family:inherit">`;
    const step = n > 1 ? iw / (n - 1) : iw;
    bands.forEach(b => { const i0 = dates.indexOf(b.from), i1 = dates.indexOf(b.to); if (i0 >= 0) out += `<rect x="${x(i0) - step / 2}" y="${m.t}" width="${(x(i1 < 0 ? i0 : i1) - x(i0)) + step}" height="${ih}" fill="#e0528a" opacity=".10"/>`; });
    for (let t = yMin; t <= yMax; t += (yMax - yMin) / 5) out += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}" stroke="#e6e3ee"/><text x="${m.l - 6}" y="${y(t) + 3}" font-size="9" fill="#888" text-anchor="end">${Math.round(t)}</text>`;
    const every = Math.ceil(n / 10);
    dates.forEach((d, i) => { if (i % every === 0) out += `<text x="${x(i)}" y="${Hh - 6}" font-size="9" fill="#888" text-anchor="middle">${H.fmtShort(d)}</text>`; });
    series.forEach((s, si) => {
      let d = '', st = false;
      s.values.forEach((v, i) => { if (v == null) { st = false; return; } d += (st ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1); st = true; });
      out += `<path d="${d}" fill="none" stroke="${COLORS[si]}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      s.values.forEach((v, i) => { if (v != null && (s.values[i - 1] == null && s.values[i + 1] == null)) out += `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${COLORS[si]}"/>`; });
    });
    out += '</svg>';
    out += `<div class="lg">${series.map((s, i) => `<span><i style="background:${COLORS[i]}"></i>${esc(s.name)}</span>`).join('')}${bands.length ? '<span><i style="background:#f3c4d6;height:8px"></i>месячные</span>' : ''}</div>`;
    return out;
  }
  function staticBars(dates, values, max = 12) {
    const W = 720, Hh = 150, m = { l: 30, r: 10, t: 8, b: 22 };
    const iw = W - m.l - m.r, ih = Hh - m.t - m.b, n = dates.length;
    const y = v => m.t + ih - v / max * ih;
    const bw = Math.max(2, Math.min(18, iw / n - 2));
    let out = `<svg viewBox="0 0 ${W} ${Hh}" width="100%" xmlns="http://www.w3.org/2000/svg">`;
    out += `<rect x="${m.l}" width="${iw}" y="${y(9)}" height="${y(7) - y(9)}" fill="#3cb478" opacity=".1"/>`;
    for (let t = 0; t <= max; t += 3) out += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}" stroke="#e6e3ee"/><text x="${m.l - 6}" y="${y(t) + 3}" font-size="9" fill="#888" text-anchor="end">${t}</text>`;
    const every = Math.ceil(n / 10);
    dates.forEach((d, i) => {
      const cx = m.l + (i + .5) * iw / n; const v = values[i];
      if (v) out += `<rect x="${cx - bw / 2}" y="${y(v)}" width="${bw}" height="${m.t + ih - y(v)}" rx="2" fill="#8b7cf6"/>`;
      if (i % every === 0) out += `<text x="${cx}" y="${Hh - 6}" font-size="9" fill="#888" text-anchor="middle">${H.fmtShort(d)}</text>`;
    });
    return out + '</svg>';
  }

  function buildReport(from, to, opt) {
    const S = H.store.get();
    const p = S.profile;
    const dates = H.range(from, to);
    const filled = dates.filter(d => S.days[d] && Object.keys(S.days[d].edited || {}).length);
    const avgOf = id => { const v = H.metrics.seriesFor(id, filled).filter(x => x != null); return v.length ? H.round1(H.avg(v)) : '—'; };
    const sec = [];

    // header
    const age = H.age(p.birth);
    sec.push(`<header><div class="logo">◆</div><div><h1>My Diary · дневник здоровья</h1><div class="sub">${p.name ? esc(p.name) + (age != null ? `, ${age} ${H.plural(age, 'год', 'года', 'лет')}` : '') + ' · ' : ''}период ${H.fmtNum(from)} — ${H.fmtNum(to)} · составлено ${H.fmtNum(H.today())}</div></div></header>`);

    if (opt.profile) {
      const lastW = (p.weightLog || []).slice(-1)[0];
      const rows = [
        ['Рост', p.height ? p.height + ' см' : ''], ['Вес', lastW ? `${lastW.kg} кг (${H.fmtNum(lastW.date)})` : ''],
        ['Группа крови', p.blood], ['Диагнозы', (p.conditions || []).join(', ')], ['Аллергии', (p.allergies || []).join(', ')],
        ['Средний цикл', p.cycleLength ? `${H.metrics.cycleLength()} дн., месячные ${p.periodLength} дн.` : ''], ['Заметки', p.notes],
      ].filter(r => r[1]);
      if (rows.length) sec.push(`<h2>Карточка здоровья</h2><table class="kv">${rows.map(r => `<tr><td>${r[0]}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>`);
    }

    if (opt.meds && S.meds.length) {
      sec.push('<h2>Препараты</h2><table><tr><th>Препарат</th><th>Доза</th><th>Схема</th><th>Период приёма</th><th>Принято за период</th></tr>' + S.meds.map(m => {
        let need = 0, done = 0;
        filled.forEach(d => { if (m.start && d < m.start) return; if (m.end && d > m.end) return; const n = Number(m.times) || 1; need += n; const r = S.days[d].meds && S.days[d].meds[m.id]; if (r && r.slots) done += r.slots.filter(Boolean).length; });
        const kind = (H.MED_KINDS.find(k => k.id === m.kind) || {}).name || '';
        const ch = (m.doseHistory || []).map(x => `${H.fmtNum(x.date)}: ${x.from || '?'}→${x.to} мг`).join('; ');
        return `<tr><td><b>${esc(m.name)}</b><br><span class="mut">${kind}${m.active === false ? ', сейчас не принимает' : ''}</span></td><td>${m.dose ? esc(m.dose) + ' мг' : '—'}${ch ? `<br><span class="mut">${esc(ch)}</span>` : ''}</td><td>${m.asNeeded ? 'по необходимости' : `${m.times} р/день (${esc((m.slots || []).join(', '))})`}</td><td>${m.start ? 'с ' + H.fmtNum(m.start) : ''}${m.end ? ' по ' + H.fmtNum(m.end) : ''}</td><td>${need && !m.asNeeded ? Math.round(done / need * 100) + '%' : '—'}</td></tr>`;
      }).join('') + '</table>');
    }

    if (opt.labs && S.labs.length) {
      sec.push('<h2>Анализы</h2><table><tr><th>Анализ</th><th>Норма</th><th>Результаты (по датам)</th></tr>' + S.labs.filter(l => (l.results || []).length).map(l => {
        const rs = l.results.slice().sort((a, b) => a.date < b.date ? -1 : 1);
        return `<tr><td><b>${esc(l.name)}</b></td><td>${l.min ?? ''}–${l.max ?? ''} ${esc(l.unit || '')}</td><td>${rs.map(r => { const st = H.labStatus(l, r.value); return `<span class="lab ${st ? st.c : ''}">${H.fmtNum(r.date)}: <b>${r.value}</b>${st && st.c !== 'status-ok' ? ' ' + (st.c === 'status-low' ? '↓' : '↑') : ''}</span>`; }).join(' ')}</td></tr>`;
      }).join('') + '</table>');
    }

    // summary
    if (opt.summary) {
      const sleeps = filled.map(d => H.metrics.totalSleep(S.days[d])).filter(x => x != null);
      const wb = filled.map(d => H.metrics.wellbeing(S.days[d])).filter(x => x != null);
      sec.push(`<h2>Сводка за период</h2><div class="cards">
        <div><b>${filled.length}</b><span>дней с записями из ${dates.length}</span></div>
        <div><b>${wb.length ? Math.round(H.avg(wb)) : '—'}</b><span>среднее самочувствие (из 100)</span></div>
        <div><b>${sleeps.length ? H.fmtDur(H.avg(sleeps)) : '—'}</b><span>средний сон</span></div>
        <div><b>${avgOf('sleepiness')}</b><span>средняя сонливость (0–10)</span></div>
        <div><b>${avgOf('energy')}</b><span>средняя энергия (0–10)</span></div>
        <div><b>${avgOf('emoNeg')}</b><span>тяжёлые эмоции, ср. макс. (0–10)</span></div></div>`);
      // symptoms frequency
      const sy = {};
      filled.forEach(d => { const dd = S.days[d]; for (const id in dd.symptoms) { const v = Number(dd.symptoms[id].score) || 0; if (v > 0) (sy[id] = sy[id] || []).push(v); } });
      const syl = Object.keys(sy).map(id => ({ s: H.store.symptomById(id), n: sy[id].length, a: H.avg(sy[id]), mx: Math.max(...sy[id]) })).filter(x => x.s).sort((a, b) => b.n - a.n);
      if (syl.length) sec.push('<h3>Симптомы</h3><table><tr><th>Симптом</th><th>Дней</th><th>Средняя сила</th><th>Максимум</th></tr>' + syl.map(x => `<tr><td>${esc(x.s.name)}</td><td>${x.n}</td><td>${H.round1(x.a)}</td><td>${x.mx}</td></tr>`).join('') + '</table>');
      const em = {};
      filled.forEach(d => { const dd = S.days[d]; for (const id in dd.emotions) (em[id] = em[id] || []).push(dd.emotions[id].score || 5); });
      const eml = Object.keys(em).map(id => ({ e: H.EMOTIONS.find(x => x.id === id), n: em[id].length, a: H.avg(em[id]) })).filter(x => x.e).sort((a, b) => b.n - a.n);
      if (eml.length) sec.push('<h3>Эмоции</h3><p>' + eml.map(x => `${esc(x.e.name)} — ${x.n} дн. (ср. ${H.round1(x.a)})`).join(' · ') + '</p>');
    }

    if (opt.charts && filled.length >= 2) {
      const bands = [];
      let open = null;
      dates.forEach(d => { const pp = S.days[d] && S.days[d].cycle && S.days[d].cycle.period; if (pp && !open) open = { from: d, to: d }; else if (pp) open.to = d; else if (open) { bands.push(open); open = null; } });
      if (open) bands.push(open);
      sec.push('<h2>Графики</h2><h3>Самочувствие, сонливость, энергия и тяжёлые эмоции (0–10)</h3>' + staticLine(dates, [
        { name: 'Самочувствие (индекс/10)', values: H.metrics.seriesFor('wellbeing', dates) },
        { name: 'Сонливость', values: H.metrics.seriesFor('sleepiness', dates) },
        { name: 'Энергия', values: H.metrics.seriesFor('energy', dates) },
        { name: 'Тяжёлые эмоции', values: H.metrics.seriesFor('emoNeg', dates) },
      ], { bands }));
      const sl = dates.map(d => { const m = H.metrics.totalSleep(S.days[d]); return m == null ? null : m / 60; });
      if (sl.some(v => v != null)) sec.push('<h3>Сон, часы (зелёная зона 7–9 ч)</h3>' + staticBars(dates, sl));
    }

    if (opt.table && filled.length) {
      sec.push('<h2>По дням</h2><table class="days"><tr><th>Дата</th><th>Цикл</th><th>Сон</th><th>Сам.</th><th>Сонл.</th><th>Энерг.</th><th>Эмоции</th><th>Симптомы (≥3)</th><th>Лекарства</th></tr>' + filled.map(d => {
        const dd = S.days[d];
        const ci = H.metrics.cycleInfo(d);
        const sl = H.metrics.totalSleep(dd);
        const w = H.metrics.wellbeing(dd);
        const emo = Object.keys(dd.emotions).map(id => ({ e: H.EMOTIONS.find(x => x.id === id), s: dd.emotions[id].score })).filter(x => x.e).sort((a, b) => b.s - a.s).slice(0, 4).map(x => `${x.e.name.toLowerCase()} ${x.s}`).join(', ');
        const syms = Object.keys(dd.symptoms).map(id => ({ s: H.store.symptomById(id), v: dd.symptoms[id].score })).filter(x => x.s && x.v >= 3 && x.s.id !== 'sleepiness').sort((a, b) => b.v - a.v).map(x => `${x.s.name.toLowerCase()} ${x.v}`).join(', ');
        const adh = H.metrics.adherence(dd, d);
        const cyc = dd.cycle && dd.cycle.period ? `<span class="per">м${ci ? ' д' + ci.dayN : ''}</span>` : ci && ci.phase !== 'late' ? 'д' + ci.dayN + (ci.pms ? ' ПМС' : '') : '';
        return `<tr><td>${H.fmtShort(d)}<br><span class="mut">${H.WD_SHORT[H.parse(d).getDay()]}</span></td><td>${cyc}</td><td>${sl != null ? H.fmtDur(sl).replace(' мин', 'м').replace(' ч', 'ч') : ''}</td><td>${w ?? ''}</td><td>${dd.symptoms.sleepiness ? dd.symptoms.sleepiness.score : ''}</td><td>${H.metrics.general(dd).energy ?? ''}</td><td>${esc(emo)}</td><td>${esc(syms)}</td><td>${adh == null ? '' : Math.round(adh * 100) + '%'}</td></tr>`;
      }).join('') + '</table><p class="mut">Сам. — индекс самочувствия 0–100; сонл., энерг. — по шкале 0–10; «м» — месячные, «д» — день цикла.</p>');
    }

    if (opt.complaints) {
      const list = filled.filter(d => (S.days[d].complaints || '').trim());
      if (list.length) sec.push('<h2>Жалобы</h2>' + list.map(d => `<div class="note"><b>${H.fmtLongY(d)}</b><p>${esc(S.days[d].complaints.trim()).replace(/\n/g, '<br>')}</p></div>`).join(''));
      const en = filled.filter(d => Object.values(S.days[d].emotions).some(e => (e.note || '').trim()));
      if (en.length) sec.push('<h3>Заметки к эмоциям</h3>' + en.map(d => `<div class="note"><b>${H.fmtLongY(d)}</b>${Object.keys(S.days[d].emotions).filter(id => (S.days[d].emotions[id].note || '').trim()).map(id => `<p><i>${esc((H.EMOTIONS.find(x => x.id === id) || {}).name || '')}:</i> ${esc(S.days[d].emotions[id].note.trim())}</p>`).join('')}</div>`).join(''));
    }
    if (opt.thoughts) {
      const list = filled.filter(d => (S.days[d].thoughts || '').trim() || (S.days[d].activitiesText || '').trim() || (S.days[d].activities || []).length);
      if (list.length) sec.push('<h2>Мысли и дела</h2>' + list.map(d => { const dd = S.days[d]; return `<div class="note"><b>${H.fmtLongY(d)}</b>${dd.thoughts ? `<p>${esc(dd.thoughts.trim()).replace(/\n/g, '<br>')}</p>` : ''}${(dd.activities || []).length || dd.activitiesText ? `<p class="mut">Занималась: ${esc([...(dd.activities || []), dd.activitiesText || ''].filter(Boolean).join(', '))}</p>` : ''}</div>`; }).join(''));
    }
    if (opt.reports) {
      const list = filled.filter(d => S.days[d].report);
      if (list.length) sec.push('<h2>Отчёты дней</h2>' + list.map(d => `<div class="note"><b>${H.fmtLongY(d)}</b><p>${esc(S.days[d].report.summary)}</p></div>`).join(''));
    }
    if (opt.tests) {
      const ts = S.tests.filter(t => t.date >= from && t.date <= to).sort((a, b) => a.ts - b.ts);
      if (ts.length) sec.push('<h2>Результаты тестов</h2><table><tr><th>Дата</th><th>Тест</th><th>Результат</th></tr>' + ts.map(t => {
        const T = H.TESTS.find(x => x.id === t.test); if (!T) return '';
        const lv = H.testLevel(T, t.score, t);
        const marked = T.custom ? T.qs.filter((q, i) => t.answers[i] > 0) : [];
        if (T.cat === 'fun' && T.kind !== 'bmi') return '';
        return `<tr><td>${H.fmtNum(t.date)}</td><td>${esc(T.name)}</td><td>${T.listOnly || T.kind ? (T.kind === 'bmi' ? `<b>${t.score}</b> — ` : '') : `<b>${t.score}</b> из ${T.max} — `}${esc(lv.name)}${marked.length ? `<br><span class="mut">${esc(marked.join('; '))}</span>` : ''}${t.test === 'phq9' && t.answers[8] > 0 ? '<br><b style="color:#c62828">Отмечены мысли о смерти/самоповреждении (вопрос 9)</b>' : ''}</td></tr>`;
      }).join('') + '</table>');
    }

    const css = `
      @page { size: A4; margin: 14mm; }
      body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1f1a33; font-size: 10.5pt; line-height: 1.45; margin: 0; }
      header { display: flex; gap: 14px; align-items: center; padding-bottom: 12px; border-bottom: 2px solid #8b7cf6; margin-bottom: 8px; }
      .logo { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg,#2b2e36,#0a0b0e); color: #d9d2ff; display: grid; place-items: center; font-size: 22px; }
      h1 { margin: 0; font-size: 19pt; } .sub { color: #6b6580; font-size: 9.5pt; }
      h2 { font-size: 13pt; margin: 18px 0 8px; color: #5b47c9; page-break-after: avoid; }
      h3 { font-size: 11pt; margin: 12px 0 6px; page-break-after: avoid; }
      table { width: 100%; border-collapse: collapse; font-size: 9pt; page-break-inside: auto; }
      tr { page-break-inside: avoid; }
      th { text-align: left; background: #f3effc; padding: 5px 6px; font-weight: 600; }
      td { padding: 5px 6px; border-bottom: 1px solid #ece8f4; vertical-align: top; }
      table.kv td:first-child { width: 160px; color: #6b6580; }
      table.days td { font-size: 8.5pt; }
      .mut { color: #8a849c; font-size: 8.5pt; }
      .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .cards div { background: #f6f3fd; border-radius: 10px; padding: 10px 12px; }
      .cards b { display: block; font-size: 15pt; } .cards span { color: #6b6580; font-size: 8.5pt; }
      .lg { display: flex; gap: 14px; font-size: 8.5pt; color: #555; margin: 2px 0 8px; flex-wrap: wrap; } .lg i { display: inline-block; width: 14px; height: 3px; border-radius: 2px; margin-right: 5px; vertical-align: middle; }
      .note { border-left: 3px solid #c9bffc; padding: 4px 10px; margin: 6px 0; page-break-inside: avoid; } .note p { margin: 3px 0; }
      .lab { display: inline-block; margin: 0 8px 2px 0; } .status-low { color: #2a5bd7; } .status-high { color: #c62828; }
      .per { color: #c2185b; font-weight: 600; }
      footer { margin-top: 22px; padding-top: 8px; border-top: 1px solid #ece8f4; color: #8a849c; font-size: 8pt; }
      svg text { font-family: 'Segoe UI', system-ui, sans-serif; }`;
    return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Отчёт</title><style>${css}</style></head><body>${sec.join('\n')}<footer>Отчёт сформирован приложением My Diary по записям пациентки. Шкалы симптомов — субъективная оценка от 0 до 10. Это не медицинское заключение.</footer></body></html>`;
  }

  H.views.export = function (root) {
    const t = H.today();
    let from = H.addDays(t, -13), to = t;
    const opt = { profile: true, meds: true, labs: true, summary: true, charts: true, table: true, complaints: true, tests: true, reports: false, thoughts: false };
    const fromI = ui.input(from, v => { from = v; info(); }, { type: 'date' });
    const toI = ui.input(to, v => { to = v; info(); }, { type: 'date' });
    const infoEl = h('div.muted', { style: { fontSize: '.88rem' } });
    const info = () => {
      if (!from || !to || from > to) { infoEl.textContent = 'Проверь даты периода'; return; }
      const S = H.store.get();
      const n = H.range(from, to).filter(d => S.days[d] && Object.keys(S.days[d].edited || {}).length).length;
      infoEl.textContent = `В периоде ${H.diffDays(to, from) + 1} ${H.plural(H.diffDays(to, from) + 1, 'день', 'дня', 'дней')}, из них с записями — ${n}.`;
    };
    info();
    const quick = ui.segmented([7, 14, 30, 90].map(n => ({ id: n, name: n + ' дней' })), 14, v => { if (!v) return; from = H.addDays(t, -(v - 1)); to = t; fromI.value = from; toI.value = to; info(); });
    const opts = [
      ['profile', 'Карточка здоровья', 'рост, вес, диагнозы, аллергии'],
      ['meds', 'Препараты', 'дозы, схема, изменения дозы и % приёма'],
      ['labs', 'Анализы', 'все результаты с нормами'],
      ['summary', 'Сводка', 'средние значения, частые симптомы и эмоции'],
      ['charts', 'Графики', 'самочувствие, сонливость, энергия, сон'],
      ['table', 'Таблица по дням', 'краткая строка на каждый день'],
      ['complaints', 'Жалобы и заметки к эмоциям', ''],
      ['tests', 'Результаты тестов', 'PHQ-9, GAD-7 и другие'],
      ['reports', 'Отчёты дней', 'тексты кнопки «Оценить день»'],
      ['thoughts', 'Мысли и дела', 'личное — по умолчанию выключено'],
    ];
    const btn = h('button.btn.primary', { onclick: async () => {
      if (!from || !to || from > to) return ui.toast('Проверь даты', '⚠');
      H.store.persistNow();
      const html = buildReport(from, to, opt);
      const name = `My Diary ${H.fmtNum(from)}–${H.fmtNum(to)}.pdf`;
      btn.disabled = true; btn.textContent = 'Создаю PDF…';
      try {
        if (H.store.hasApi) { if (await window.api.exportPdf(html, name)) ui.toast('PDF сохранён и открыт'); }
        else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
      } catch (e) { console.error(e); ui.toast('Не получилось создать PDF', '⚠'); }
      btn.disabled = false; btn.textContent = '📄 Создать PDF';
    } }, '📄 Создать PDF');

    root.appendChild(h('div.wrap',
      h('div.view-head', h('div', h('h1', 'Выгрузка в PDF'), h('div.sub', 'Аккуратный отчёт за выбранные дни — удобно показать врачу или распечатать'))),
      h('div.grid2', { style: { alignItems: 'start' } },
        h('div.glass.card.stack',
          h('div.card-title', H.gicon('calendar', 17, 'sm'), h('h3', 'Период')),
          quick,
          h('div.grid2', ui.field('С', fromI), ui.field('По', toI)),
          infoEl,
          h('div.row', btn, h('button.btn', { onclick: () => {
            const html = buildReport(from, to, opt);
            const frame = h('iframe', { style: { width: '100%', height: '70vh', border: '0', borderRadius: '12px', background: '#fff' } });
            ui.modal('Предпросмотр', frame, { wide: true });
            frame.srcdoc = html;
          } }, '👁 Предпросмотр'))),
        h('div.glass.card',
          h('div.card-title', H.gicon('list', 17, 'sm'), h('h3', 'Что включить')),
          opts.map(([k, n, d]) => h('div.set-row', h('div', h('div.sr-t', n), d ? h('div.sr-d', d) : null), ui.toggle(opt[k], v => opt[k] = v)))))));
  };
  H.buildReport = buildReport;
})(window.H);
