'use strict';
(function (H) {
  const { h, ui } = H;
  const S = () => H.store.get();

  function tagInput(list, onChange, placeholder) {
    const box = h('div.tag-input');
    const inp = h('input', { placeholder });
    const draw = () => {
      box.querySelectorAll('.tag').forEach(t => t.remove());
      list.forEach((t, i) => box.insertBefore(h('span.tag', t, h('button', { onclick: () => { list.splice(i, 1); onChange(list); draw(); }, title: 'Удалить' }, '✕')), inp));
    };
    inp.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ',') && inp.value.trim()) { e.preventDefault(); list.push(inp.value.trim()); inp.value = ''; onChange(list); draw(); }
      if (e.key === 'Backspace' && !inp.value && list.length) { list.pop(); onChange(list); draw(); }
    });
    inp.addEventListener('blur', () => { if (inp.value.trim()) { list.push(inp.value.trim()); inp.value = ''; onChange(list); draw(); } });
    box.appendChild(inp); draw();
    return box;
  }

  // ---------- medication editor (also used from the day screen) ----------
  H.medEditor = function (med, onSave) {
    const isNew = !med;
    const m = med ? JSON.parse(JSON.stringify(med)) : { id: H.uid(), name: '', dose: '', unit: 'мг', times: 1, slots: ['Утро'], kind: 'antidepressant', start: H.today(), active: true, notes: '', doseHistory: [], asNeeded: false };
    const slotsHost = h('div.row.wrapr');
    const drawSlots = () => {
      H.clear(slotsHost);
      if (m.asNeeded) { slotsHost.appendChild(h('span.faint', 'По необходимости — без расписания')); return; }
      const n = Number(m.times) || 1;
      if (!m.slots || m.slots.length !== n) m.slots = H.SLOT_NAMES[n].slice();
      if (!Array.isArray(m.remind)) m.remind = [];
      m.slots.forEach((sn, i) => { if (!m.remind[i]) m.remind[i] = H.defaultSlotTime(sn, i, n); });
      m.remind.length = n;
      const eds = h('div.slot-eds');
      m.slots.forEach((sn, i) => eds.appendChild(h('div.slot-ed',
        h('input.inp', { value: sn, 'aria-label': 'Название приёма', oninput: e => m.slots[i] = e.target.value || H.SLOT_NAMES[n][i] }),
        h('input.inp.slot-time', { type: 'time', value: m.remind[i] || '', 'aria-label': 'Время', onchange: e => { m.remind[i] = e.target.value; }, oninput: e => { m.remind[i] = e.target.value; } }))));
      slotsHost.appendChild(eds);
      slotsHost.appendChild(ui.toggle(m.noRemind !== true, v => { m.noRemind = !v; }, 'напоминать об этом препарате'));
    };
    drawSlots();
    const body = h('div.stack',
      ui.field('Название препарата', ui.input(m.name, v => m.name = v, { placeholder: 'Например: Сертралин' })),
      h('div.grid2',
        ui.field('Дозировка (на один приём)', ui.unitInput(m.dose, v => m.dose = v, 'мг', { placeholder: '50' })),
        ui.field('Тип', h('div.chips.kind-chips', H.MED_KINDS.map(k => ui.chip(k.name, m.kind === k.id, (e, c) => { m.kind = k.id; c.parentNode.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); c.classList.add('on'); }))))),
      ui.field('Сколько раз в день', h('div.row', ui.segmented([1, 2, 3, 4].map(n => ({ id: n, name: n + ' ' + H.plural(n, 'раз', 'раза', 'раз'), toggleOff: false })), Number(m.times), v => { m.times = v; m.asNeeded = false; drawSlots(); }),
        ui.toggle(!!m.asNeeded, v => { m.asNeeded = v; drawSlots(); }, 'по необходимости'))),
      ui.field('Приёмы и время', slotsHost, 'Название можно поменять, например «после завтрака». По времени приходят напоминания на телефон.'),
      h('div.grid2',
        ui.field('Начало приёма', ui.input(m.start, v => m.start = v, { type: 'date' })),
        ui.field('Окончание (если известно)', ui.input(m.end || '', v => m.end = v, { type: 'date' }))),
      ui.field('Заметки', ui.textarea(m.notes, v => m.notes = v, 'Например: принимать после еды, назначил психиатр 10.09', 2)),
      !isNew ? ui.toggle(m.active !== false, v => m.active = v, 'Принимаю сейчас') : null);
    const md = ui.modal(isNew ? 'Новый препарат' : 'Препарат', body, {
      actions: [
        !isNew ? h('button.btn.ghost', { style: { marginRight: 'auto', color: '#e5484d' }, onclick: async () => { if (await ui.confirm(`Удалить «${m.name}» из списка? Отметки приёма в прошлых днях сохранятся в дневнике, но без названия.`, 'Удалить', true)) { const s = S(); s.meds = s.meds.filter(x => x.id !== m.id); H.store.save(); md.close(); onSave && onSave(); } } }, 'Удалить') : null,
        h('button.btn.ghost', { onclick: () => md.close() }, 'Отмена'),
        h('button.btn.primary', {
          onclick: () => {
            if (!m.name.trim()) { ui.toast('Укажи название', 'ℹ'); return; }
            const okDate = x => !x || (/^\d{4}-\d{2}-\d{2}$/.test(x) && x >= '2000-01-01' && x <= '2100-12-31');
            if (!m.start || !okDate(m.start)) { ui.toast('Проверь дату начала приёма', '⚠'); return; }
            if (m.end && !okDate(m.end)) { ui.toast('Проверь дату окончания', '⚠'); return; }
            if (m.end && m.end < m.start) { ui.toast('Окончание раньше начала — проверь даты', '⚠'); return; }
            if (m.start > H.today() && !m._futureOk) {
              ui.confirm(`Приём начнётся ${H.fmtLongY(m.start)}. До этого дня препарат не будет появляться в дневнике — это нормально. Сохранить?`, 'Сохранить').then(ok => { if (ok) { m._futureOk = true; saveNow(); } });
              return;
            }
            saveNow();
          },
        }, 'Сохранить'),
      ],
    });
    function saveNow() {
            delete m._futureOk;
            const s = S();
            const old = s.meds.find(x => x.id === m.id);
            if (old && String(old.dose) !== String(m.dose)) {
              m.doseHistory = (m.doseHistory || []).concat([{ date: H.today(), from: old.dose, to: m.dose }]);
              ui.toast(`Изменение дозы записано: ${old.dose || '?'} → ${m.dose} мг`);
            }
            if (old) Object.assign(old, m); else if (!s.meds.some(x => x.id === m.id)) s.meds.push(m);
            H.store.save(); md.close(); onSave && onSave();
            if (m.start > H.today()) ui.toast('Препарат появится в дневнике с ' + H.fmtLong(m.start), '');
    }
  };

  // ---------- lab editor ----------
  function labStatus(l, v) {
    if (v == null || v === '') return null;
    v = Number(v);
    if (l.min != null && l.min !== '' && v < Number(l.min)) return { c: 'status-low', t: 'ниже нормы' };
    if (l.max != null && l.max !== '' && v > Number(l.max)) return { c: 'status-high', t: 'выше нормы' };
    return { c: 'status-ok', t: 'в норме' };
  }
  function openLab(lab, onDone) {
    const l = lab;
    const resHost = h('div');
    const chartHost = h('div');
    let nd = H.today(), nv = '';
    const drawRes = () => {
      H.clear(resHost); H.clear(chartHost);
      const rs = (l.results || []).slice().sort((a, b) => a.date < b.date ? -1 : 1);
      if (rs.length >= 2) chartHost.appendChild(H.charts.sparkline(rs.map(r => Number(r.value)), { lo: Number(l.min), hi: Number(l.max) }));
      rs.slice().reverse().forEach(r => {
        const st = labStatus(l, r.value);
        resHost.appendChild(h('div.list-item',
          h('div.li-main', h('div.li-t', `${r.value} ${l.unit || ''}`), h('div.li-s', H.fmtLongY(r.date))),
          st ? h('span.' + st.c, { style: { fontSize: '.84rem', fontWeight: 600 } }, st.t) : null,
          h('button.icon-btn', { title: 'Удалить', onclick: () => { l.results = l.results.filter(x => x.id !== r.id); H.store.save(); drawRes(); } }, '✕')));
      });
      if (!rs.length) resHost.appendChild(h('p.faint', 'Пока нет результатов.'));
    };
    drawRes();
    const preset = H.LAB_PRESETS.find(p => p.key === l.key);
    const body = h('div.stack',
      preset && preset.note ? h('div.note', { style: { padding: '12px 14px', borderRadius: '14px', background: 'rgba(var(--accent-rgb),.12)', fontSize: '.88rem' } }, preset.note) : null,
      h('div.grid3',
        ui.field('Название', ui.input(l.name, v => { l.name = v; H.store.save(); })),
        ui.field('Норма от', ui.input(l.min, v => { l.min = v; H.store.save(); drawRes(); }, { type: 'number', step: 'any' })),
        ui.field('Норма до', ui.input(l.max, v => { l.max = v; H.store.save(); drawRes(); }, { type: 'number', step: 'any' }))),
      h('p.faint', { style: { fontSize: '.76rem', margin: 0 } }, 'Нормы различаются между лабораториями — лучше переписать их со своего бланка.'),
      h('div.hr'),
      h('div.fsection-title', 'Добавить результат'),
      h('div.row',
        ui.input(nd, v => nd = v, { type: 'date', style: 'max-width:180px' }),
        h('div', { style: { flex: 1 } }, ui.unitInput('', v => nv = v, l.unit || '', { placeholder: 'Значение' })),
        h('button.btn.primary', {
          onclick: e => {
            if (nv === '' || isNaN(Number(nv))) { ui.toast('Введи число', 'ℹ'); return; }
            l.results = l.results || []; l.results.push({ id: H.uid(), date: nd, value: Number(nv) }); H.store.save();
            e.target.closest('.row').querySelector('.unit-inp input').value = ''; nv = '';
            drawRes(); ui.toast('Результат добавлен');
          },
        }, 'Добавить')),
      chartHost,
      resHost,
      h('div.hr'),
      ui.field('Напомнить пересдать через', ui.segmented([{ id: 0, name: 'Не напоминать' }, { id: 4, name: '4 нед.' }, { id: 8, name: '8 нед.' }, { id: 12, name: '12 нед.' }, { id: 26, name: '6 мес.' }].map(x => ({ ...x, toggleOff: false })), Number(l.recheckWeeks) || 0, v => { l.recheckWeeks = v; H.store.save(); }), 'Напоминание появится на главном экране. Срок пересдачи лучше уточнить у врача.'));
    ui.modal(l.name, body, {
      wide: true,
      actions: [
        h('button.btn.ghost', { style: { marginRight: 'auto', color: '#e5484d' }, onclick: async e => { if (await ui.confirm(`Удалить «${l.name}» со всеми результатами?`, 'Удалить', true)) { const s = S(); s.labs = s.labs.filter(x => x.id !== l.id); H.store.save(); document.querySelectorAll('.modal-back').forEach(m => m.remove()); onDone && onDone(); } } }, 'Удалить анализ'),
        h('button.btn.primary', { onclick: e => { e.target.closest('.modal-back').querySelector('.modal-x').click(); } }, 'Готово'),
      ],
      onClose: () => onDone && onDone(),
    });
  }
  function addLab(onDone) {
    const s = S();
    const used = new Set(s.labs.map(l => l.key));
    const list = h('div.chips', H.LAB_PRESETS.filter(p => !used.has(p.key)).map(p => ui.chip(p.name, false, () => {
      const l = { id: H.uid(), key: p.key, name: p.name, unit: p.unit, min: p.min, max: p.max, recheckWeeks: 0, results: [] };
      s.labs.push(l); H.store.save(); md.close(); openLab(l, onDone);
    })));
    let cn = '', cu = '';
    const md = ui.modal('Добавить анализ', h('div.stack',
      h('div.fsection-title', 'Частые анализы'), list,
      h('div.hr'),
      h('div.fsection-title', 'Или свой'),
      h('div.row', ui.input('', v => cn = v, { placeholder: 'Название' }), ui.input('', v => cu = v, { placeholder: 'Единицы', style: 'max-width:140px' }),
        h('button.btn.primary', { onclick: () => { if (!cn.trim()) return; const l = { id: H.uid(), key: 'c_' + H.uid(), name: cn.trim(), unit: cu, min: '', max: '', results: [] }; s.labs.push(l); H.store.save(); md.close(); openLab(l, onDone); } }, 'Создать'))), { wide: true });
  }

  function planEditor(plan, onDone) {
    const s = S();
    s.labPlans = s.labPlans || [];
    const isNew = !plan;
    const pl = plan ? { ...plan, names: [...plan.names] } : { id: H.uid(), date: H.addDays(H.today(), 7), names: [], note: '', done: false };
    const names = new Set(pl.names);
    const known = [...new Set([...s.labs.map(l => l.name), ...H.LAB_PRESETS.map(p => p.name)])];
    const chipsHost = h('div.chips');
    const drawChips = () => {
      H.clear(chipsHost);
      [...known, ...[...names].filter(n => !known.includes(n))].forEach(n => chipsHost.appendChild(ui.chip(n, names.has(n), (e, c) => { names.has(n) ? names.delete(n) : names.add(n); c.classList.toggle('on'); })));
    };
    drawChips();
    let custom = '';
    const cInp = ui.input('', v => custom = v, { placeholder: 'Например: витамин B12, ТТГ, общий анализ мочи' });
    const addCustom = () => { const n = custom.trim(); if (!n) return; names.add(n); custom = ''; cInp.value = ''; drawChips(); };
    const md = ui.modal(isNew ? 'Запланировать анализ' : 'План анализа', h('div.stack',
      h('div.fsection-title', 'Что сдаёшь'), chipsHost,
      h('div.row', cInp, h('button.btn', { onclick: addCustom }, '+ Своё')),
      h('div.grid2',
        ui.field('Дата', ui.input(pl.date, v => pl.date = v, { type: 'date' })),
        ui.field('Заметка', ui.input(pl.note, v => pl.note = v, { placeholder: 'Лаборатория, натощак, время…' }))),
      h('p.faint', { style: { fontSize: '.78rem', margin: 0 } }, 'Дата появится в календаре, а за день до неё на главном экране будет напоминание.')),
      { wide: true, actions: [
        !isNew ? h('button.btn.ghost', { style: { marginRight: 'auto', color: '#e5484d' }, onclick: () => { s.labPlans = s.labPlans.filter(x => x.id !== pl.id); H.store.save(); md.close(); onDone && onDone(); } }, 'Удалить') : null,
        h('button.btn.primary', { onclick: () => {
          if (custom.trim()) addCustom();
          if (!names.size) { ui.toast('Выбери хотя бы один анализ', 'ℹ'); return; }
          if (!pl.date) { ui.toast('Укажи дату', 'ℹ'); return; }
          pl.names = [...names];
          const i = s.labPlans.findIndex(x => x.id === pl.id);
          if (i >= 0) s.labPlans[i] = pl; else s.labPlans.push(pl);
          H.store.save(); md.close(); onDone && onDone();
          ui.toast('Анализ запланирован на ' + H.fmtLong(pl.date), '');
        } }, isNew ? 'Запланировать' : 'Сохранить')] });
  }

  function doctorEditor(doc, onSave) {
    const isNew = !doc;
    const d = doc ? { ...doc } : { id: H.uid(), name: '', spec: '', contact: '', nextVisit: '', notes: '' };
    const md = ui.modal(isNew ? 'Новый врач' : 'Врач', h('div.stack',
      h('div.grid2', ui.field('Имя', ui.input(d.name, v => d.name = v, { placeholder: 'Анна Сергеевна' })), ui.field('Специальность', ui.input(d.spec, v => d.spec = v, { placeholder: 'Психиатр, терапевт, гинеколог…' }))),
      h('div.grid2', ui.field('Контакты', ui.input(d.contact, v => d.contact = v, { placeholder: 'Телефон, клиника' })), ui.field('Следующий визит', ui.input(d.nextVisit, v => d.nextVisit = v, { type: 'date' }))),
      ui.field('Заметки и вопросы к врачу', ui.textarea(d.notes, v => d.notes = v, 'Что спросить на приёме…', 3))), {
      actions: [
        !isNew ? h('button.btn.ghost', { style: { marginRight: 'auto', color: '#e5484d' }, onclick: () => { const s = S(); s.profile.doctors = s.profile.doctors.filter(x => x.id !== d.id); H.store.save(); md.close(); onSave(); } }, 'Удалить') : null,
        h('button.btn.ghost', { onclick: () => md.close() }, 'Отмена'),
        h('button.btn.primary', { onclick: () => { const s = S(); const o = s.profile.doctors.find(x => x.id === d.id); if (o) Object.assign(o, d); else s.profile.doctors.push(d); H.store.save(); md.close(); onSave(); } }, 'Сохранить')],
    });
  }

  H.views.profile = function (root, params) {
    const s = S();
    let tab = (params && params.tab) || 'about';
    const host = h('div');
    const p = s.profile;
    const sv = () => H.store.save();

    function about() {
      const wl = p.weightLog || [];
      const lastW = wl.length ? wl[wl.length - 1] : null;
      const bmi = lastW && p.height ? (lastW.kg / Math.pow(Number(p.height) / 100, 2)) : null;
      let wDate = H.today(), wVal = '';
      const wHost = h('div');
      const drawW = () => {
        H.clear(wHost);
        const log = p.weightLog || [];
        if (log.length >= 2) wHost.appendChild(H.charts.sparkline(log.map(x => x.kg)));
        log.slice(-6).reverse().forEach(x => wHost.appendChild(h('div.stat', { style: { padding: '4px 0' } }, h('span.muted', H.fmtLongY(x.date)), h('b', x.kg + ' кг'))));
      };
      drawW();
      return h('div.grid2', { style: { alignItems: 'start' } },
        h('div.glass.card.stack',
          h('div.card-title', H.gicon('user', 17, 'sm'), h('h3', 'Обо мне')),
          h('div.grid2', ui.field('Имя', ui.input(p.name, v => { p.name = v; sv(); }, { placeholder: 'Как к тебе обращаться' })), ui.field('Дата рождения', ui.input(p.birth, v => { p.birth = v; sv(); }, { type: 'date' }))),
          h('div.grid2', ui.field('Рост', ui.unitInput(p.height, v => { p.height = v; sv(); }, 'см')), ui.field('Группа крови', (() => { const sel = h('select.inp', ['', 'I (0) Rh+', 'I (0) Rh−', 'II (A) Rh+', 'II (A) Rh−', 'III (B) Rh+', 'III (B) Rh−', 'IV (AB) Rh+', 'IV (AB) Rh−'].map(o => h('option', { value: o }, o || 'не знаю'))); sel.value = p.blood || ''; sel.onchange = () => { p.blood = sel.value; sv(); }; return sel; })())),
          ui.field('Диагнозы и хронические состояния', tagInput(p.conditions, v => { p.conditions = v; sv(); }, 'Напиши и нажми Enter'), 'Например: латентный дефицит железа, депрессия'),
          ui.field('Аллергии и непереносимость', tagInput(p.allergies, v => { p.allergies = v; sv(); }, 'Напиши и нажми Enter')),
          ui.field('Заметки о здоровье', ui.textarea(p.notes, v => { p.notes = v; sv(); }, 'Операции, наследственность, важные события…', 3))),
        h('div.stack',
          h('div.glass.card.stack',
            h('div.card-title', H.gicon('scale', 17, 'sm'), h('h3', 'Вес'), lastW ? h('span.badge', { style: { marginLeft: 'auto' } }, lastW.kg + ' кг' + (bmi ? ` · ИМТ ${H.round1(bmi)}` : '')) : null),
            h('div.row.wrapr.w-row', ui.input(wDate, v => wDate = v, { type: 'date' }), ui.unitInput('', v => wVal = v, 'кг'),
              h('button.btn.primary', { onclick: e => { if (!wVal) return; p.weightLog = (p.weightLog || []).filter(x => x.date !== wDate).concat([{ date: wDate, kg: Number(wVal) }]).sort((a, b) => a.date < b.date ? -1 : 1); sv(); e.target.closest('.row').querySelector('.unit-inp input').value = ''; wVal = ''; drawW(); } }, 'Записать')),
            wHost),
          h('div.glass.card.stack',
            h('div.card-title', H.gicon('flower', 17, 'sm'), h('h3', 'Цикл')),
            ui.field('Длина цикла, примерно', h('div.row', h('span.faint', 'от'), ui.unitInput(p.cycleLength, v => { p.cycleLength = Number(v) || 28; if ((Number(p.cycleMax) || 0) < p.cycleLength) p.cycleMax = p.cycleLength; sv(); }, 'дн.'), h('span.faint', 'до'), ui.unitInput(p.cycleMax || p.cycleLength, v => { p.cycleMax = Number(v) || p.cycleLength; sv(); }, 'дн.')), 'Например, от 28 до 30 дней. Если не знаешь точно — укажи примерно.'),
            ui.field('Длительность месячных', ui.unitInput(p.periodLength, v => { p.periodLength = Number(v) || 5; sv(); }, 'дн.')),
            (() => { const cs = H.metrics.cycleStats(); return cs.learned ? h('div.note', { style: { padding: '10px 14px', borderRadius: '14px', background: 'rgba(var(--accent-rgb),.12)', fontSize: '.84rem' } }, `По твоим отметкам: средний цикл ${cs.avg} дн., колебания ${cs.min}–${cs.max} дн. Прогноз в календаре учитывает это автоматически.`) : null; })(),
            ui.field('Первый день последних месячных', ui.input(p.lastPeriod, v => { p.lastPeriod = v; sv(); }, { type: 'date' }), 'Нужно один раз для старта. Дальше приложение само считает по отметкам «Месячные сегодня» и уточняет длину цикла.'))));
    }

    function meds() {
      const list = h('div');
      const draw = () => {
        H.clear(list);
        if (!s.meds.length) list.appendChild(ui.empty('pill', 'Список препаратов пуст. Добавь то, что принимаешь, — с дозировкой и расписанием.'));
        s.meds.slice().sort((a, b) => (b.active !== false) - (a.active !== false)).forEach(m => {
          const k = H.MED_KINDS.find(x => x.id === m.kind) || H.MED_KINDS[4];
          list.appendChild(h('div.list-item', { style: { opacity: m.active === false ? .55 : 1 } },
            h('span.m-dot', { style: { width: '12px', height: '12px', borderRadius: '50%', background: k.color } }),
            h('div.li-main',
              h('div.li-t', m.name + (m.dose ? ` · ${m.dose} мг` : '')),
              h('div.li-s', [k.name, m.asNeeded ? 'по необходимости' : `${m.times} ${H.plural(Number(m.times), 'раз', 'раза', 'раз')} в день (${(m.slots || []).map((sn, i) => sn.toLowerCase() + (m.remind && m.remind[i] && m.noRemind !== true ? ' ' + m.remind[i] : '')).join(', ')})`, m.start ? 'с ' + H.fmtLongY(m.start) : '', m.active === false ? 'не принимаю' : ''].filter(Boolean).join(' · ')),
              (m.doseHistory || []).length ? h('div.li-s', 'Изменения дозы: ' + m.doseHistory.map(x => `${H.fmtShort(x.date)}: ${x.from || '?'} → ${x.to} мг`).join('; ')) : null,
              m.notes ? h('div.li-s.faint', m.notes) : null),
            h('button.btn.small', { onclick: () => H.medEditor(m, draw) }, 'Изменить')));
        });
      };
      draw();
      return h('div.glass.card', h('div.card-title', H.gicon('pill', 17, 'sm'), h('h3', 'Мои препараты'), h('button.btn.small.primary', { style: { marginLeft: 'auto' }, onclick: () => H.medEditor(null, draw) }, '+ Добавить')), list,
        h('p.faint', { style: { fontSize: '.78rem', marginTop: '10px' } }, 'Если врач меняет дозу — просто измени её здесь: приложение запомнит дату изменения, а в прошлых днях сохранится прежняя доза.'));
    }

    function labs() {
      const grid = h('div.lab-grid');
      const draw = () => {
        H.clear(grid);
        if (!s.labs.length) { grid.appendChild(h('div', { style: { gridColumn: '1/-1' } }, ui.empty('flask', 'Здесь будут твои анализы: ферритин, гемоглобин, витамины и любые другие — с историей и графиком.'))); }
        s.labs.forEach(l => {
          const rs = (l.results || []).slice().sort((a, b) => a.date < b.date ? -1 : 1);
          const last = rs[rs.length - 1];
          const st = last ? labStatus(l, last.value) : null;
          const due = last && l.recheckWeeks ? H.addDays(last.date, l.recheckWeeks * 7) : null;
          grid.appendChild(h('div.glass.lab-card.sheen', { onclick: () => openLab(l, draw) },
            h('div.row', h('div.lc-name', l.name), st ? h('span.' + st.c, { style: { marginLeft: 'auto', fontSize: '.78rem', fontWeight: 650 } }, st.t) : null),
            h('div.lc-val', last ? String(last.value) : '—', h('small', l.unit || '')),
            h('div.lc-meta', last ? `от ${H.fmtLongY(last.date)} · норма ${l.min ?? '?'}–${l.max ?? '?'}` : 'нет результатов'),
            due ? h('div.lc-meta', { style: { color: due <= H.today() ? '#e5484d' : undefined } }, '⏰ пересдать ' + H.fmtLong(due)) : null,
            rs.length >= 2 ? H.charts.sparkline(rs.map(r => Number(r.value)), { lo: Number(l.min), hi: Number(l.max) }) : null));
        });
      };
      draw();
      const plansHost = h('div.plan-list');
      const drawPlans = () => {
        H.clear(plansHost);
        const t = H.today();
        const list = (s.labPlans || []).slice().sort((a, b) => (a.done - b.done) || (a.date < b.date ? -1 : 1));
        if (!list.length) { plansHost.appendChild(h('p.muted', { style: { margin: 0, fontSize: '.85rem' } }, 'Запланируй анализы, которые хочешь сдать, — с датой. Они отметятся в календаре, а накануне появится напоминание.')); return; }
        list.forEach(pl => {
          const dd = H.diffDays(pl.date, t);
          const when = pl.done ? 'сдан' : dd === 0 ? 'сегодня' : dd === 1 ? 'завтра' : dd < 0 ? 'дата прошла' : 'через ' + dd + ' ' + H.plural(dd, 'день', 'дня', 'дней');
          plansHost.appendChild(h('div.plan-item' + (pl.done ? '.done' : '') + (!pl.done && dd <= 1 ? '.soon' : ''),
            h('button.plan-check' + (pl.done ? '.on' : ''), { title: pl.done ? 'Вернуть в план' : 'Отметить как сданный', onclick: () => { pl.done = !pl.done; H.store.save(); drawPlans(); } }, pl.done ? H.icon('check', 13) : null),
            h('div.plan-main', { onclick: () => planEditor(pl, drawPlans) },
              h('div.plan-t', pl.names.join(', ')),
              h('div.plan-s', H.cap(H.fmtLong(pl.date)) + ' · ' + when + (pl.note ? ' · ' + pl.note : ''))),
            h('span.plan-badge', H.fmtShort(pl.date))));
        });
      };
      drawPlans();
      const planCard = h('div.glass.card', { style: { marginBottom: '16px' } },
        h('div.card-title', H.gicon('calendar', 17, 'sm'), h('h3', 'Планирую сдать'), h('button.btn.small.primary', { style: { marginLeft: 'auto' }, onclick: () => planEditor(null, drawPlans) }, '+ Запланировать')),
        plansHost);
      return h('div', planCard, h('div.glass.card', h('div.card-title', H.gicon('flask', 17, 'sm'), h('h3', 'Мои анализы'), h('button.btn.small.primary', { style: { marginLeft: 'auto' }, onclick: () => addLab(draw) }, '+ Добавить анализ')), grid));
    }

    function doctors() {
      const list = h('div');
      const draw = () => {
        H.clear(list);
        if (!p.doctors.length) list.appendChild(ui.empty('doctor', 'Добавь своих врачей — с контактами, датой следующего визита и вопросами, которые хочешь задать.'));
        p.doctors.forEach(d => list.appendChild(h('div.list-item',
          h('div.li-main', h('div.li-t', (d.spec ? d.spec + ' — ' : '') + (d.name || 'без имени')), h('div.li-s', [d.contact, d.nextVisit ? 'визит ' + H.fmtLongY(d.nextVisit) : ''].filter(Boolean).join(' · ')), d.notes ? h('div.li-s.faint', d.notes) : null),
          h('button.btn.small', { onclick: () => doctorEditor(d, draw) }, 'Изменить'))));
      };
      draw();
      return h('div.glass.card', h('div.card-title', H.gicon('doctor', 17, 'sm'), h('h3', 'Мои врачи'), h('button.btn.small.primary', { style: { marginLeft: 'auto' }, onclick: () => doctorEditor(null, draw) }, '+ Добавить')), list);
    }

    function render() {
      H.clear(host);
      host.appendChild({ about, meds, labs, doctors }[tab]());
    }
    render();
    root.appendChild(h('div.wrap',
      h('div.view-head', h('div', h('h1', 'Карточка здоровья'), h('div.sub', 'Всё важное о тебе в одном месте — удобно показать врачу'))),
      h('div.tabs-row', ui.segmented([{ id: 'about', name: 'Обо мне' }, { id: 'meds', name: 'Препараты' }, { id: 'labs', name: 'Анализы' }, { id: 'doctors', name: 'Врачи' }].map(x => ({ ...x, toggleOff: false })), tab, v => { tab = v; render(); })),
      host));
  };
  H.labStatus = labStatus;
})(window.H);
