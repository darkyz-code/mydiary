'use strict';
(function (H) {
  const { h, ui } = H;

  H.views.day = function (root, params) {
    const date = (params && params.date) || H.today();
    const S = H.store.get();
    const period = params?.period || H.activePeriod || 'day'; H.activePeriod=period;
    const R = () => H.periods.read(S.days[date],period);                 // read (may be null)
    const W = () => H.periods.write(H.store.day(date, true),period);      // write (creates the day)
    const isToday = date === H.today();
    const stamps = {};
    let blockIndex = 0;

    // ---------- change handling ----------
    const saveInd = h('span.save-ind', h('span.sdot'), 'Сохранено');
    const refreshSideLater = H.debounce(() => refreshSide(), 120);
    function changed(block) {
      H.periods.touch(H.store.day(date,true),period,block);
      if(block==='vitals'){const all=S.days[date];S.profile.weightLog=(S.profile.weightLog||[]).filter(x=>x.date!==date);if(all.vitals.weight!=null)S.profile.weightLog.push({date,kg:all.vitals.weight});}
      H.store.touch(date, block);
      H.game.onDayEdit(date, block);
      const st = stamps[block];
      if (st) { st.textContent = 'изменено ' + H.fmtStamp(R().edited[block]); st.classList.remove('fresh'); void st.offsetWidth; st.classList.add('fresh'); }
      saveInd.classList.add('saving'); saveInd.lastChild.textContent = 'Сохраняю…';
      clearTimeout(saveInd._t);
      saveInd._t = setTimeout(() => { saveInd.classList.remove('saving'); saveInd.lastChild.textContent = 'Сохранено'; }, 700);
      updated.textContent = 'Последнее изменение: ' + H.fmtStamp(R().updatedAt);
      refreshSideLater();
    }

    function block(id, ...content) {
      const meta = H.BLOCKS.find(b => b.id === id);
      const d = R();
      const st = h('span.edited', d && d.edited && d.edited[id] ? 'изменено ' + H.fmtStamp(d.edited[id]) : (meta.optional ? 'по желанию' : 'не заполнено'));
      stamps[id] = st;
      const coll = S.settings.collapsed || (S.settings.collapsed = {});
      const collapsible = !!meta.optional;
      const body = h('div.block-body', h('div.block-inner', ...content));
      const sec = h('section.block.glass' + (collapsible ? '.collapsible' : '') + (collapsible && coll[id] !== false ? '.collapsed' : ''), { style: { animationDelay: (blockIndex++ * 45) + 'ms' }, dataset: { block: id } },
        h('div.block-head', {
          onclick: collapsible ? () => { const c = !sec.classList.contains('collapsed'); sec.classList.toggle('collapsed', c); coll[id] = c; H.store.save(); } : null,
        }, H.gicon(meta.ic, 18), h('h3', meta.name), st,
          d && d.edited && d.edited[id] ? h('button.reset-btn', { title: 'Сбросить раздел: '+(period==='day'?'день':'вечер'), onclick: e => { e.stopPropagation(); resetBlock(id, meta.name); } }, H.icon('reset', 15)) : null,
          collapsible ? h('span.chev', H.icon('chevron', 18)) : null),
        body);
      return sec;
    }
    async function resetBlock(id,name){
      if(!await ui.confirm('Сбросить раздел «'+name+'» за '+(period==='day'?'день':'вечер')+'? Отметки другой части дня сохранятся.','Сбросить'))return;
      H.periods.clear(H.store.day(date,true),period,id);H.store.save();H.go('day',{date,period});ui.toast('Раздел очищен');
    }
    async function clearDay(){
      if(!await ui.confirm('Сбросить все отметки за '+(period==='day'?'день':'вечер')+'? Отметки другой части дня сохранятся.','Сбросить',true))return;
      H.periods.clear(H.store.day(date,true),period);H.store.save();H.go('day',{date,period});
    }
    function srow(name, control, extra) { return h('div.srow', extra || {}, h('div.s-name', name), control); }

    // ---------- header ----------
    const ci = H.metrics.cycleInfo(date);
    const updated = h('span.faint', { style: { fontSize: '.78rem' } }, R() && R().updatedAt ? 'Последнее изменение: ' + H.fmtStamp(R().updatedAt) : '');
    const head = h('div.day-head',
      h('button.icon-btn', { onclick: () => H.go('home'), title: 'На главную' }, H.icon('home', 18)),
      h('button.icon-btn', { onclick: () => H.go('day', { date: H.addDays(date, -1) }), title: 'Предыдущий день' }, '‹'),
      h('div',
        h('h1', H.cap(H.weekday(date)) + ', ' + H.fmtLong(date)),
        h('div.dh-sub',
          isToday ? h('span.badge', 'Сегодня') : h('button.btn.small.ghost', { onclick: () => H.go('day', { date: H.today() }) }, 'К сегодняшнему дню'),
          ci && ci.phase !== 'late' ? h('span.badge', `🌸 День цикла ${ci.dayN}`) : null,
          saveInd, updated)),
      h('button.icon-btn', { onclick: () => H.go('day', { date: H.addDays(date, 1) }), title: 'Следующий день' }, '›'),
      h('div.grow', { style: { flex: 1 } }),
      R() && Object.keys(R().edited || {}).length ? h('button.btn.ghost.clear-day', { onclick: clearDay, title: 'Сбросить '+(period==='day'?'день':'вечер') }, H.icon('reset', 16), period==='day'?'Сбросить день':'Сбросить вечер') : null,
      h('button.btn', { onclick: () => H.go('calendar', { month: date.slice(0, 7) }) }, H.icon('calendar', 17), 'Календарь'),
      h('button.btn.primary', { onclick: rateDay }, H.icon('sparkle', 17), 'Оценить день'));

    // ---------- left column: silhouette + ring ----------
    const sideHost = h('div.day-left');
    function zoneLevels() {
      const out = {};
      const d = R(); if (!d) return out;
      for (const id in d.symptoms) {
        const sy = H.store.symptomById(id); if (!sy) continue;
        const v = Number(d.symptoms[id].score) || 0;
        if (v <= 0) continue;
        if (sy.z === 'body') continue;
        out[sy.z] = Math.max(out[sy.z] || 0, v);
      }
      if (d.cycle && d.cycle.pain) out.pelvis = Math.max(out.pelvis || 0, d.cycle.pain);
      return out;
    }
    function refreshSide() {
      H.clear(sideHost);
      const levels = zoneLevels();
      const sil = H.silhouette(S.settings.silhouette, levels, openZone);
      const bodyCount = R() ? Object.keys(R().symptoms || {}).filter(id => (H.store.symptomById(id) || {}).z === 'body').length : 0;
      sideHost.appendChild(h('div.glass.sil-card', sil,
        h('div.hint', 'Нажми на область тела, чтобы отметить, что беспокоит'),
        h('button.btn.small.whole-body', { onclick: e => openZone('body', e.currentTarget.getBoundingClientRect()) }, H.icon('body', 15), 'Всё тело' + (bodyCount ? ` · ${bodyCount}` : ''))));
      const wb = H.metrics.wellbeing(R());
      const filled = H.metrics.filledBlocks(R());
      const total = H.BLOCKS.filter(b => !S.settings.hiddenBlocks.includes(b.id)).length;
      sideHost.appendChild(h('div.glass.card', { style: { display: 'flex', gap: '16px', alignItems: 'center' } },
        ui.ring(wb, 96, 'из 100'),
        h('div', h('div', { style: { fontWeight: 650 } }, 'Самочувствие'),
          h('div.muted', { style: { fontSize: '.82rem', marginTop: '4px' } }, `Заполнено ${filled} из ${total}`),
          h('button.idx-how', { onclick: () => H.indexExplain(R()) }, 'Как считается ›'))));
    }

    // ---------- symptom rows (shared by body map & physical block) ----------
    const physRows = h('div.stack', { style: { gap: '4px' } });
    const extraRows = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } });
    const chipHost = h('div');
    function setSym(id, score) {
      const d = W();
      if (score == null) delete d.symptoms[id]; else d.symptoms[id] = { ...(d.symptoms[id] || {}), score };
      changed('physical');
    }
    function symRow(sy) {
      const cur = R() && R().symptoms[sy.id] ? R().symptoms[sy.id].score : null;
      const sl = ui.slider({ value: cur, onChange: v => { setSym(sy.id, v); if (v == null && !sy.base) renderExtra(); } });
      return srow(h('span', sy.name, !sy.base ? h('button.s-rm', { title: 'Убрать', onclick: () => { setSym(sy.id, null); renderExtra(); } }, '✕') : null), sl, { dataset: { sym: sy.id } });
    }
    let openZoneId = null;
    function renderExtra() {
      H.clear(extraRows); H.clear(chipHost);
      const d = R();
      const active = d ? Object.keys(d.symptoms) : [];
      const all = H.store.allSymptoms();
      // body-part picker: parts first, symptoms appear after choosing a part
      chipHost.appendChild(h('div.sub-title', 'Другие ощущения'));
      const zones = Object.keys(H.ZONES).filter(z => all.some(sy => !sy.base && sy.z === z && !sy.hidden));
      const pills = h('div.chips.zone-pills', zones.map(z => {
        const n = all.filter(sy => !sy.base && sy.z === z && active.includes(sy.id)).length;
        return ui.chip(H.ZONES[z] + (n ? ` · ${n}` : ''), openZoneId === z, () => { openZoneId = openZoneId === z ? null : z; renderExtra(); }, { cls: n ? 'has-sel' : '' });
      }).concat([ui.chip('+ своё ощущение', false, addCustomSymptom, { cls: 'add' })]));
      chipHost.appendChild(pills);
      if (openZoneId) {
        const items = all.filter(sy => !sy.base && sy.z === openZoneId && (!sy.hidden || active.includes(sy.id)));
        chipHost.appendChild(h('div.zone-panel', h('div.chips', items.map(sy => {
          const c = ui.chip(sy.name, active.includes(sy.id), () => {
            if (R() && R().symptoms[sy.id]) setSym(sy.id, null); else { const dd = W(); dd.symptoms[sy.id] = { score: 5 }; changed('physical'); }
            renderExtra();
          });
          if (sy.g === 'custom') { c.classList.add('is-custom'); c.appendChild(h('span.bub-rm', { title: 'Убрать из списка', onclick: ev => { ev.stopPropagation(); removeCustomSymptom(sy); } }, '✕')); }
          return c;
        }))));
      }
      // chosen sensations are pinned below with their own scale
      const extra = all.filter(sy => !sy.base && active.includes(sy.id));
      if (extra.length) { extraRows.appendChild(h('div.sub-title', 'Отмеченные ощущения')); extra.forEach(sy => extraRows.appendChild(symRow(sy))); }
      refreshSideLater();
    }
    function addSym(id, flash = true) {
      const d = W();
      if (!d.symptoms[id]) d.symptoms[id] = { score: 5 };
      changed('physical');
      const sy = H.store.symptomById(id);
      if (sy && sy.base) {
        const row = physRows.querySelector(`[data-sym="${id}"]`);
        if (row) { row.replaceWith(symRow(sy)); }
      } else renderExtra();
      if (flash) setTimeout(() => {
        const row = document.querySelector(`.srow[data-sym="${id}"]`);
        if (row) { row.scrollIntoView({ behavior: 'smooth', block: 'center' }); row.classList.add('flash'); }
      }, 60);
    }
    function addCustomEmotion(group) {
      let name = '', emo = H.EMOJI_PICK[0];
      const picks = h('div.emoji-pick', H.EMOJI_PICK.map((e, i) => h('button.ep' + (i === 0 ? '.on' : ''), { onclick: ev => { emo = e; picks.querySelectorAll('.ep').forEach(x => x.classList.remove('on')); ev.currentTarget.classList.add('on'); } }, e)));
      const gname = (H.EMO_GROUPS.find(g => g.id === group) || {}).name;
      const m = ui.modal('Своё состояние', h('div.stack',
        ui.field('Как называется', ui.input('', v => name = v, { placeholder: 'Например: ностальгия', autofocus: true })),
        ui.field('Картинка', picks),
        h('p.faint', { style: { fontSize: '.8rem', margin: 0 } }, `Состояние добавится в группу «${gname}» и будет доступно в любой день.`)), {
        actions: [h('button.btn.ghost', { onclick: () => m.close() }, 'Отмена'), h('button.btn.primary', {
          onclick: () => {
            if (!name.trim()) return;
            const ce = { id: 'ce_' + H.uid(), name: name.trim(), e: emo, g: group, v: group === 'pos' ? 1 : -1 };
            S.settings.customEmotions = (S.settings.customEmotions || []).concat(ce);
            H.store.syncCustomEmotions();
            const dd = W(); dd.emotions[ce.id] = { score: 5, note: '', noteOpen: false };
            changed('emotions'); m.close(); H.go('day', { date, period, focus: 'emotions' });
          },
        }, 'Добавить')],
      });
    }
    async function removeCustomEmotion(e) {
      if (!await ui.confirm(`Убрать «${e.name}» из списка состояний? В прошлых днях отметки останутся. Вернуть можно в «Настройки → Мои состояния и симптомы».`, 'Убрать')) return;
      const ce = (S.settings.customEmotions || []).find(x => x.id === e.id); if (ce) ce.hidden = true;
      const dd = R(); if (dd && dd.emotions && dd.emotions[e.id]) { delete dd.emotions[e.id]; changed('emotions'); }
      H.store.syncCustomEmotions(); H.store.save(); renderEmoRef && renderEmoRef();
    }
    async function removeCustomSymptom(sy) {
      if (!await ui.confirm(`Убрать «${sy.name}» из списка ощущений? В прошлых днях отметки останутся. Вернуть можно в «Настройки → Мои состояния и симптомы».`, 'Убрать')) return;
      const cs = S.settings.customSymptoms.find(x => x.id === sy.id); if (cs) cs.hidden = true;
      const dd = R(); if (dd && dd.symptoms && dd.symptoms[sy.id]) { delete dd.symptoms[sy.id]; changed('physical'); }
      H.store.save(); renderExtra();
    }
    function addCustomSymptom() {
      let name = '', z = 'body';
      const m = ui.modal('Свой симптом', h('div.stack',
        ui.field('Название', ui.input('', v => name = v, { placeholder: 'Например: шум в ушах', autofocus: true })),
        ui.field('Где ощущается', ui.segmented(Object.keys(H.ZONES).map(k => ({ id: k, name: H.ZONES[k], toggleOff: false })), z, v => z = v || 'body'))), {
        actions: [h('button.btn.ghost', { onclick: () => m.close() }, 'Отмена'), h('button.btn.primary', {
          onclick: () => {
            if (!name.trim()) return;
            const id = 'c_' + H.uid();
            S.settings.customSymptoms.push({ id, name: name.trim(), z });
            H.store.save(); m.close(); addSym(id);
          },
        }, 'Добавить')],
      });
    }
    function openZone(zone, rect) {
      const list = H.store.allSymptoms().filter(sy => sy.z === zone && (!sy.hidden || (R() && R().symptoms[sy.id])));
      const content = h('div');
      const draw = () => {
        H.clear(content);
        content.appendChild(h('h4', H.ZONES[zone]));
        const d = R();
        content.appendChild(h('div.chips', list.map(sy => ui.chip(sy.name, d && d.symptoms[sy.id], (e) => {
          if (R() && R().symptoms[sy.id]) { setSym(sy.id, null); if (sy.base) { const row = physRows.querySelector(`[data-sym="${sy.id}"]`); if (row) row.replaceWith(symRow(sy)); } else renderExtra(); }
          else addSym(sy.id, false);
          draw();
        }))));
        if (zone === 'pelvis' && !S.settings.hiddenBlocks.includes('cycle')) content.appendChild(h('p.faint', { style: { fontSize: '.78rem', marginTop: '10px' } }, 'Менструальную боль удобнее отметить в блоке «Цикл».'));
        content.appendChild(h('p.faint', { style: { fontSize: '.78rem', marginTop: '10px', marginBottom: 0 } }, 'Силу каждого симптома можно настроить шкалой в блоке «Физическое состояние».'));
      };
      draw();
      ui.popover(rect, content);
    }

    // ---------- blocks ----------
    const blocks = [];
    const hidden = S.settings.hiddenBlocks || [];

    // general
    if (!hidden.includes('general')) {
      blocks.push(block('general', H.dayCheckin(R, W, changed,period)));
    }

    // emotions
    let renderEmoRef = null;
    if (!hidden.includes('emotions')) {
      const rows = h('div.emo-rows');
      const bubblesEl = h('div.emo-groups');
      const emoMore = {};
      const renderEmo = renderEmoRef = (justId) => {
        H.clear(bubblesEl); H.clear(rows);
        const d = R();
        const sel = d ? d.emotions : {};
        let i = 0;
        H.EMO_GROUPS.forEach(g => {
          const wrap = h('div.bubbles');
          const all = H.EMOTIONS.filter(e => e.g === g.id && (!e.hidden || sel[e.id]));
          const hiddenRare = all.filter(e => e.rare && !sel[e.id]);
          const showAll = emoMore[g.id] || !hiddenRare.length;
          all.filter(e => showAll || !e.rare || sel[e.id]).forEach(e => {
            const b = ui.bubble(e.e, e.name, !!sel[e.id], () => {
              const dd = W();
              if (dd.emotions[e.id]) delete dd.emotions[e.id];
              else dd.emotions[e.id] = { score: 5, note: '', noteOpen: true };
              changed('emotions'); renderEmo(e.id);
            }, justId ? 0 : i++);
            if (justId) b.style.animation = 'none';
            if (e.custom) { b.classList.add('is-custom'); b.appendChild(h('span.bub-rm', { title: 'Убрать из списка', onclick: ev => { ev.stopPropagation(); removeCustomEmotion(e); } }, '✕')); }
            if (justId === e.id) b.classList.add('just');
            wrap.appendChild(b);
          });
          if (hiddenRare.length) wrap.appendChild(h('button.bubble.bubble-more', { onclick: () => { emoMore[g.id] = !emoMore[g.id]; renderEmo('__more'); } }, h('span.bubble-label', emoMore[g.id] ? 'свернуть' : `ещё ${hiddenRare.length}`)));
          wrap.appendChild(h('button.bubble.bubble-add', { onclick: () => addCustomEmotion(g.id) }, h('span.bubble-label', '+ своё')));
          bubblesEl.appendChild(h('div.emo-group.eg-' + g.id, h('div.eg-title', g.name), wrap));
        });
        Object.keys(sel).forEach(id => {
          const e = H.EMOTIONS.find(x => x.id === id); if (!e) return;
          const rec = sel[id];
          const area = h('div.note-area' + (rec.noteOpen ? '.open' : ''));
          const noteBtn = h('button.note-btn' + (rec.note ? '.has' : ''), {
            onclick: () => { rec.noteOpen = !rec.noteOpen; area.classList.toggle('open', rec.noteOpen); H.store.save(); if (rec.noteOpen) setTimeout(() => ta.focus(), 200); },
          }, rec.note ? 'Заметка' : '+ Описать');
          const ta = ui.textarea(rec.note, v => { rec.note = v; noteBtn.textContent = v ? 'Заметка' : '+ Описать'; noteBtn.classList.toggle('has', !!v); changed('emotions'); }, `Опиши подробнее, что ты чувствуешь (${e.name.toLowerCase()})… Необязательно.`, 2);
          area.appendChild(h('div.note-wrap', ta, h('button.note-x', { title: 'Скрыть поле', onclick: () => { rec.noteOpen = false; area.classList.remove('open'); H.store.save(); } }, '✕')));
          rows.appendChild(h('div.emo-row', { style: justId === id ? {} : { animation: 'none' } },
            h('div.er-top',
              h('div.er-name', h('span.e', e.e), e.name),
              ui.slider({ value: rec.score, min: 1, max: 10, allowClear: false, mode: e.v > 0 ? 'good' : 'bad', compact: true, onChange: v => { rec.score = v; changed('emotions'); } }),
              noteBtn),
            area));
        });
        if (!Object.keys(sel).length) rows.appendChild(h('p.faint', { style: { fontSize: '.85rem', margin: '4px 0 0' } }, 'Выбери одну или несколько эмоций — у каждой появится шкала силы от 1 до 10 и поле для заметки.'));
      };
      renderEmo();
      blocks.push(block('emotions', bubblesEl, rows));
    }

    // physical
    if (!hidden.includes('physical')) {
      H.SYMPTOMS.filter(sy => sy.base).forEach(sy => physRows.appendChild(symRow(sy)));
      renderExtra();
      blocks.push(block('physical', physRows, h('div', { style: { marginTop: '6px' } }, chipHost), extraRows));
    }

    // sleep
    if (!hidden.includes('sleep')) {
      const sv = k => R() && R().sleep ? R().sleep[k] : null;
      const totalV = h('div.v'), nightV = h('div.l');
      const total = h('div.sleep-total', totalV, nightV);
      const bar = h('div.sleep-line-host');
      const upd = () => {
        const night = H.metrics.sleepMinutes(R()), nap = H.metrics.napMinutes(R()), tot = H.metrics.totalSleep(R());
        totalV.textContent = tot == null ? '—' : H.fmtDur(tot);
        nightV.textContent = tot == null ? 'сон за сутки' : nap ? `ночью ${night != null ? H.fmtDur(night) : '—'} + днём ${H.fmtDur(nap)}` : 'ночной сон';
        totalV.classList.remove('pop-num'); void totalV.offsetWidth; totalV.classList.add('pop-num');
        H.sleepLine.render(bar, R() && R().sleep);
      };
      const setS = k => v => { const d = W(); if (v === '' || v == null) delete d.sleep[k]; else d.sleep[k] = v; changed('sleep'); upd(); };
      const napBox = h('div.nap-box' + (sv('napOn') ? '.open' : ''), h('div',
        h('div.sleep-row.two', ui.field('Уснула днём в', ui.input(sv('napStart') || '', setS('napStart'), { type: 'time' })), ui.field('Проснулась в', ui.input(sv('napEnd') || '', setS('napEnd'), { type: 'time' }))),
        srow('Качество дневного сна', ui.slider({ value: sv('napQuality'), mode: 'good', onChange: setS('napQuality') }))));
      const dreamSel = new Set(sv('dreams') || []);
      const dreamInput=ui.textarea(sv('dreamText'),setS('dreamText'),'Что снилось? Можно коротко — образы, ощущения, сюжет.',3);const dreamKey=date+'|'+period;const hiddenDream=()=>S.settings.dreamPrivacy?.[dreamKey]??!!S.settings.dreamBlur;const paintDream=()=>{dreamInput.classList.toggle('private-text',hiddenDream());dreamInput.readOnly=hiddenDream();dreamInput.setAttribute('aria-hidden',String(hiddenDream()));};paintDream();const dreamEye=h('button.icon-btn.small',{title:'Показать или скрыть этот сон',onclick:()=>{S.settings.dreamPrivacy=S.settings.dreamPrivacy||{};S.settings.dreamPrivacy[dreamKey]=!hiddenDream();H.store.save();paintDream();}},H.icon('eye',16));const dreamText=h('div.note-area'+(sv('dreamText')?'.open':''),h('div.note-wrap',dreamEye,dreamInput));
      blocks.push(block('sleep',
        h('div.sleep-row', ui.field('Уснула в', ui.input(sv('bed') || '', setS('bed'), { type: 'time' })), ui.field('Проснулась в', ui.input(sv('wake') || '', setS('wake'), { type: 'time' })), total),
        bar,
        h('div', { style: { marginTop: '12px' } },
          srow('Качество сна', ui.slider({ value: sv('quality'), mode: 'good', onChange: setS('quality') })),
          srow('Бодрость после пробуждения', ui.slider({ value: sv('wakeFeel'), mode: 'good', onChange: setS('wakeFeel') })),
          srow('Сколько засыпала', ui.segmented(H.LATENCY, sv('latency'), setS('latency'))),
          srow('Просыпалась ночью', ui.stepper(sv('wakeups'), setS('wakeups'), { max: 20, fmt: v => v + ' ' + H.plural(v, 'раз', 'раза', 'раз') }))),
        h('div.sub-title', 'Дневной сон'),
        ui.toggle(!!sv('napOn'), v => { const d = W(); d.sleep.napOn = v; if (!v) { delete d.sleep.napStart; delete d.sleep.napEnd; delete d.sleep.napQuality; delete d.sleep.nap; } changed('sleep'); napBox.classList.toggle('open', v); upd(); }, 'Был дневной сон'),
        napBox,
        h('div.sub-title', 'Сновидения'),
        h('div.chips', H.DREAMS.map(dr => ui.chip(dr.name, dreamSel.has(dr.id), (e, c) => {
          if (dreamSel.has(dr.id)) dreamSel.delete(dr.id); else { if (dr.id === 'none') dreamSel.clear(); else dreamSel.delete('none'); dreamSel.add(dr.id); }
          c.parentNode.querySelectorAll('.chip').forEach((x, i) => x.classList.toggle('on', dreamSel.has(H.DREAMS[i].id)));
          W().sleep.dreams = [...dreamSel]; changed('sleep');
        })), ui.chip('+ записать сон', false, () => dreamText.classList.toggle('open'), { cls: 'add' })),
        dreamText));
      setTimeout(upd, 0);
    }

    // cycle
    if (!hidden.includes('cycle')) {
      const cv = k => R() && R().cycle ? R().cycle[k] : null;
      const inner = h('div');
      const renderCycle = () => {
        H.clear(inner);
        const info = H.metrics.cycleInfo(date);
        if (info && info.phase !== 'late') {
          inner.appendChild(h('div.cycle-info',
            h('div', h('div.ci-day', String(info.dayN)), h('div.ci-l', 'день цикла')),
            h('div', h('div', { style: { fontWeight: 650 } }, H.cap(info.phaseName)),
              h('div.muted', { style: { fontSize: '.84rem' } }, info.toNext > 0 ? `Следующие месячные ожидаются ≈ ${H.fmtLong(info.next)} (через ${info.toNext} ${H.plural(info.toNext, 'день', 'дня', 'дней')}). Средний цикл: ${info.len} ${H.plural(info.len, 'день', 'дня', 'дней')}.` : `Средний цикл: ${info.len} дней.`))));
        } else {
          inner.appendChild(h('p.muted', { style: { fontSize: '.88rem' } }, 'Отметь первый день месячных (здесь или в карточке здоровья) — и приложение начнёт считать день цикла и предсказывать ПМС.'));
        }
        const period = !!cv('period');
        inner.appendChild(ui.toggle(period, v => { const d = W(); d.cycle.period = v; if (!v) { delete d.cycle.flow; } changed('cycle'); renderCycle(); refreshHeaderBadge(); }, 'Месячные сегодня'));
        if (period) {
          inner.appendChild(h('div.sub-title', 'Характер выделений'));
          inner.appendChild(ui.segmented(H.FLOW, cv('flow'), v => { W().cycle.flow = v; changed('cycle'); }));
          inner.appendChild(h('div', { style: { marginTop: '10px' } }, srow('Боль, спазмы', ui.slider({ value: cv('pain'), onChange: v => { const d = W(); if (v == null) delete d.cycle.pain; else d.cycle.pain = v; changed('cycle'); } }))));
        }
        const pms = !!cv('pms');
        inner.appendChild(ui.toggle(pms, v => { W().cycle.pms = v; changed('cycle'); renderCycle(); }, 'Есть ПМС-симптомы'));
        if (pms) {
          const sel = new Set(cv('pmsSymptoms') || []);
          inner.appendChild(h('div.chips', { style: { marginTop: '8px' } }, H.PMS.map(p => ui.chip(p.name, sel.has(p.id), (e, c) => {
            sel.has(p.id) ? sel.delete(p.id) : sel.add(p.id);
            c.classList.toggle('on'); W().cycle.pmsSymptoms = [...sel]; changed('cycle');
          }))));
        }
      };
      renderCycle();
      blocks.push(block('cycle', inner));
    }
    function refreshHeaderBadge() { /* cycle day badge refreshes on next open */ }

    // meds
    if (!hidden.includes('meds')) {
      const inner = h('div');
      const renderMeds = () => {
        H.clear(inner);
        const meds = H.metrics.activeMeds(date);
        if (!meds.length) inner.appendChild(h('p.muted', { style: { fontSize: '.88rem' } }, 'Добавь препараты, которые принимаешь, — потом каждый день останется только отмечать приём.'));
        meds.forEach(m => {
          const kind = H.MED_KINDS.find(k => k.id === m.kind) || H.MED_KINDS[4];
          const n = m.asNeeded ? 1 : (Number(m.times) || 1);
          const slots = m.asNeeded ? ['Принимала'] : (m.slots && m.slots.length === n ? m.slots : H.SLOT_NAMES[n]);
          const rec = R() && R().meds[m.id];
          const slotBtns = slots.map((sn, i) => {
            const on = !!(rec && rec.slots && rec.slots[i]);
            const b = h('button.slot' + (on ? '.on' : ''), h('span.chk', on ? '✓' : ''), sn);
            b.addEventListener('click', () => {
              const d = W();
              const r = d.meds[m.id] || (d.meds[m.id] = { slots: Array(n).fill(false), dose: m.dose });
              r.slots[i] = !r.slots[i]; r.dose = m.dose;
              b.classList.toggle('on', r.slots[i]); b.firstChild.textContent = r.slots[i] ? '✓' : '';
              changed('meds');
            });
            return b;
          });
          inner.appendChild(h('div.med-row',
            h('span.m-dot', { style: { background: kind.color } }),
            h('div', { style: { flex: 1 } }, h('div.m-name', m.name), h('div.m-dose', `${m.dose ? m.dose + ' мг' : 'доза не указана'} · ${m.asNeeded ? 'по необходимости' : n + ' ' + H.plural(n, 'раз', 'раза', 'раз') + ' в день'} · ${kind.name.toLowerCase()}`)),
            h('div.row', slotBtns)));
        });
        if (meds.some(m => m.kind === 'iron')) {
          inner.appendChild(h('div', { style: { marginTop: '6px' } }, ui.toggle(!!(R() && R().lifestyle && R().lifestyle.teaNearIron), v => { W().lifestyle.teaNearIron = v; changed('meds'); }, 'Чай, кофе или молочное были в пределах 2 часов от приёма железа')));
        }
        inner.appendChild(h('div.row', { style: { marginTop: '12px' } },
          h('button.btn.small', { onclick: () => H.medEditor(null, () => renderMeds()) }, '+ Добавить препарат'),
          h('button.btn.small.ghost', { onclick: () => H.go('profile', { tab: 'meds' }) }, 'Все препараты')));
      };
      renderMeds();
      blocks.push(block('meds', inner));
    }

    // lifestyle
    if (!hidden.includes('lifestyle')) {
      const lv = k => R() && R().lifestyle ? R().lifestyle[k] : null;
      const setL = k => v => { const d = W(); if (v == null) delete d.lifestyle[k]; else d.lifestyle[k] = v; changed('lifestyle'); };
      blocks.push(block('lifestyle',
        srow('Аппетит', ui.slider({ value: lv('appetite'), mode: 'neutral', onChange: setL('appetite'), labels: ['нет аппетита', 'очень сильный'] })),
        h('div', { style: { height: '10px' } }),
        srow('Вода', ui.stepper(lv('water'), setL('water'), { max: 30, fmt: v => v + ' ' + H.plural(v, 'стакан', 'стакана', 'стаканов') })),
        srow('Кофе, крепкий чай', ui.stepper(lv('caffeine'), setL('caffeine'), { max: 20, fmt: v => v + ' ' + H.plural(v, 'чашка', 'чашки', 'чашек') })),
        srow('Прогулка на улице', ui.stepper(lv('walk'), setL('walk'), { step: 10, max: 600, fmt: v => v ? v + ' мин' : 'не было' })),
        srow('Физическая активность', ui.segmented(H.ACTIVITY_LEVEL, lv('activity'), setL('activity'))),
        srow('Общение', ui.segmented(H.SOCIAL, lv('social'), setL('social'))),
        h('div', { style: { marginTop: '8px' } },
          ui.toggle(!!lv('ironFood'), setL('ironFood'), 'Ела продукты с железом (мясо, печень, рыба, бобовые)'),
          (() => {
            const detail = h('div.alc-detail' + (lv('alcohol') ? '.open' : ''), ui.field('Что и сколько', ui.input(lv('alcoholWhat') || '', v => { W().lifestyle.alcoholWhat = v; changed('lifestyle'); }, { placeholder: 'Например: бокал красного вина' })));
            return [ui.toggle(!!lv('alcohol'), v => { setL('alcohol')(v); detail.classList.toggle('open', v); }, 'Был алкоголь'), detail];
          })())));
    }

    // vitals
    if (!hidden.includes('vitals')) {
      const vv = k => R() && R().vitals ? R().vitals[k] : '';
      const setV = k => v => {
        const d = W(); if (v === '' || v == null) delete d.vitals[k]; else d.vitals[k] = Number(v);
        if (k === 'weight') {
          const log = S.profile.weightLog.filter(x => x.date !== date);
          if (v) log.push({ date, kg: Number(v) });
          S.profile.weightLog = log.sort((a, b) => a.date < b.date ? -1 : 1);
        }
        changed('vitals');
      };
      blocks.push(block('vitals', h('div.kv',
        ui.field('Пульс', ui.unitInput(vv('pulse'), setV('pulse'), 'уд/мин')),
        ui.field('Давление верхнее', ui.unitInput(vv('sys'), setV('sys'), 'мм')),
        ui.field('Давление нижнее', ui.unitInput(vv('dia'), setV('dia'), 'мм')),
        vv('temp') != null && vv('temp') !== '' ? ui.field('Температура', ui.unitInput(vv('temp'), setV('temp'), '°C')) : null,
        ui.field('Вес', ui.unitInput(vv('weight'), setV('weight'), 'кг'))),
        vv('temp') != null && vv('temp') !== '' ? null : h('div', { style: { marginTop: '10px' } }, ui.chip('+ температура', false, (e, c) => { const f = ui.field('Температура', ui.unitInput('', setV('temp'), '°C')); c.closest('.block').querySelector('.kv').insertBefore(f, c.closest('.block').querySelector('.kv').lastChild); c.remove(); setTimeout(() => { const i = f.querySelector('input'); i && i.focus(); }, 30); }, { cls: 'add' }))));
    }

    // texts
    if (!hidden.includes('photo')) {
      const grid = h('div.photo-grid');
      const fileIn = h('input', { type: 'file', accept: 'image/*', multiple: true, style: { display: 'none' } });
      const drawPhotos = () => {
        H.clear(grid);
        const ph = (R() && R().photos) || [];
        ph.forEach(p => {
          const img = h('img', { src: p.thumb, alt: '' });
          H.photos.load(p.id).then(full => { if (full) img.src = full; });
          grid.appendChild(h('div.photo', { onclick: () => H.photos.view(p, () => { const d = W(); d.photos = d.photos.filter(x => x.id !== p.id); H.photos.remove(p.id); changed('photo'); drawPhotos(); }) }, img));
        });
        grid.appendChild(h('button.photo-add', { onclick: () => fileIn.click() }, H.icon('camera', 22), h('span', ph.length ? 'Ещё фото' : 'Добавить фото дня')));
      };
      fileIn.addEventListener('change', async () => {
        for (const f of fileIn.files) {
          try {
            const rec = await H.photos.add(f);
            const d = W(); (d.photos || (d.photos = [])).push(rec); changed('photo');
          } catch (e) { ui.toast('Не удалось открыть фото', '⚠'); }
        }
        fileIn.value = ''; drawPhotos();
      });
      drawPhotos();
      blocks.push(block('photo', grid, fileIn, h('p.faint', { style: { fontSize: '.78rem', margin: '10px 0 0' } }, 'Фото хранятся только на этом iPhone. Маленькое превью появится в календаре.')));
    }
    if (!hidden.includes('complaints')) blocks.push(block('complaints', ui.textarea(R() && R().complaints, v => { W().complaints = v; changed('complaints'); }, 'Что беспокоит сегодня? Любые жалобы, даже мелкие — например, «к вечеру тяжесть в ногах», «тошнило после таблетки».', 3)));
    if (!hidden.includes('thoughts')) blocks.push(block('thoughts', ui.textarea(R() && R().thoughts, v => { W().thoughts = v; changed('thoughts'); }, 'Свободное место для мыслей. Это только для тебя — в PDF для врача мысли не попадут, если ты сама этого не выберешь.', 4)));
    if (!hidden.includes('activities')) {
      const sel = new Set((R() && R().activities) || []);
      blocks.push(block('activities',
        h('div.chips', { style: { marginBottom: '12px' } }, H.ACTIVITIES.map(a => ui.chip(a, sel.has(a), (e, c) => { sel.has(a) ? sel.delete(a) : sel.add(a); c.classList.toggle('on'); W().activities = [...sel]; changed('activities'); }))),
        ui.textarea(R() && R().activitiesText, v => { W().activitiesText = v; changed('activities'); }, 'Чем занималась сегодня — пару слов, без давления.', 2)));
    }

    // saved report
    const reportHost = h('div');
    function renderSavedReport() {
      H.clear(reportHost);
      const d = S.days[date];
      if (!d || !d.report) return;
      reportHost.appendChild(h('section.day-report',
        h('div.block-head', H.gicon('sparkle', 18), h('h3', 'Отчёт дня'), h('span.edited', 'составлен ' + H.fmtStamp(d.report.generatedAt))),
        h('p', { style: { margin: 0 } }, d.report.summary),
        h('div.row', { style: { marginTop: '12px' } }, h('button.btn.small', { onclick: rateDay }, 'Обновить и открыть'))));
    }

    function rateDay() {
      const d = S.days[date];
      if (!d || !Object.keys(d.edited || {}).length) { ui.toast('Сначала заполни хотя бы один раздел дня', 'ℹ'); return; }
      const r = H.report.dayReport(date);
      H.store.day(date,true).report = { generatedAt: Date.now(), summary: r.summary, index: r.index };
      H.store.save();
      H.game.award(`${date}:report`, 15, 'отчёт дня');
      renderSavedReport();
      showReport(r);
    }

    function auraBg(aura) {
      const pos = [[30, 30], [72, 34], [38, 74], [76, 70], [55, 50]];
      return aura.map(([c, w], i) => `radial-gradient(circle at ${pos[i % 5][0]}% ${pos[i % 5][1]}%, ${c} 0%, transparent ${Math.round(30 + w * 55)}%)`).join(', ') + ', radial-gradient(circle at 50% 50%, #4a4f5c, #24262d)';
    }
    function sphere(r) {
      const rev = r.aura.slice().reverse();
      return h('div.aura-sphere',
        h('div.as-glow', { style: { background: auraBg(r.aura) } }),
        h('div.as-ball',
          h('div.as-core', { style: { background: auraBg(r.aura) } }),
          h('div.as-core.b', { style: { background: auraBg(rev) } }),
          h('div.as-spec'),
          h('div.as-num', h('b', r.index == null ? '—' : String(r.index)), h('span', 'ресурс дня'))));
    }
    const CAT = { sleep: 'Сон', emo: 'Эмоции', body: 'Тело', med: 'Лечение', cycle: 'Цикл', life: 'Образ жизни', trend: 'Динамика' };
    function moodMap(r) {
      const W = 280, C = W / 2, Rr = 112;
      const P = a => [C + a.v * Rr, C - a.a * Rr];
      const today = r.map.today;
      const trail = r.map.trail.slice().sort((x, y) => x.dt < y.dt ? -1 : 1);
      const pts = trail.map(t => P(t.a)).concat(today ? [P(today)] : []);
      const path = pts.length > 1 ? 'M' + pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' L') : '';
      const col = r.aura[0] ? r.aura[0][0] : '#ffffff';
      const dots = trail.map((t, i) => { const [x, y] = P(t.a); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${3 + i * .35}" fill="#fff" fill-opacity="${.18 + i * .07}"><title>${H.fmtLong(t.dt)}</title></circle>`; }).join('');
      const [tx, ty] = today ? P(today) : [C, C];
      const el = H.svg(`<svg class="mood-map" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}">
        <defs>
          <radialGradient id="mq1" cx="1" cy="0" r="1"><stop offset="0" stop-color="#ffd36e" stop-opacity=".28"/><stop offset="1" stop-color="#ffd36e" stop-opacity="0"/></radialGradient>
          <radialGradient id="mq2" cx="1" cy="1" r="1"><stop offset="0" stop-color="#9fe6d0" stop-opacity=".24"/><stop offset="1" stop-color="#9fe6d0" stop-opacity="0"/></radialGradient>
          <radialGradient id="mq3" cx="0" cy="0" r="1"><stop offset="0" stop-color="#b48cff" stop-opacity=".26"/><stop offset="1" stop-color="#b48cff" stop-opacity="0"/></radialGradient>
          <radialGradient id="mq4" cx="0" cy="1" r="1"><stop offset="0" stop-color="#6f8fd8" stop-opacity=".26"/><stop offset="1" stop-color="#6f8fd8" stop-opacity="0"/></radialGradient>
          <radialGradient id="mdot"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${col}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>
          <clipPath id="mclip"><rect x="8" y="8" width="${W - 16}" height="${W - 16}" rx="26"/></clipPath>
        </defs>
        <g clip-path="url(#mclip)">
          <rect x="8" y="8" width="${W - 16}" height="${W - 16}" rx="26" fill="rgba(255,255,255,.03)"/>
          <rect x="${C}" y="8" width="${C - 8}" height="${C - 8}" fill="url(#mq1)"/><rect x="${C}" y="${C}" width="${C - 8}" height="${C - 8}" fill="url(#mq2)"/>
          <rect x="8" y="8" width="${C - 8}" height="${C - 8}" fill="url(#mq3)"/><rect x="8" y="${C}" width="${C - 8}" height="${C - 8}" fill="url(#mq4)"/>
        </g>
        <rect x="8" y="8" width="${W - 16}" height="${W - 16}" rx="26" fill="none" stroke="rgba(255,255,255,.08)"/>
        <path d="M${C} 22V${W - 22}M22 ${C}H${W - 22}" stroke="rgba(255,255,255,.09)" stroke-dasharray="2 5"/>
        <text x="${W - 22}" y="30" text-anchor="end" class="mm-q">Подъём</text><text x="${W - 22}" y="${W - 22}" text-anchor="end" class="mm-q">Безмятежность</text>
        <text x="22" y="30" class="mm-q">Напряжение</text><text x="22" y="${W - 22}" class="mm-q">Упадок</text>
        <text x="${W - 22}" y="${C - 6}" text-anchor="end" class="mm-ax">приятно →</text><text x="22" y="${C - 6}" class="mm-ax">← неприятно</text>
        <text x="${C + 6}" y="44" class="mm-ax">бодро</text><text x="${C + 6}" y="${W - 36}" class="mm-ax">вяло</text>
        ${path ? `<path d="${path}" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 4"/>` : ''}
        ${dots}
        ${today ? `<circle class="mm-halo" cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="26" fill="url(#mdot)" opacity=".7"/><circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="7" fill="#fff" stroke="${col}" stroke-width="3"><title>Сегодня</title></circle>` : `<text x="${C}" y="${C + 4}" text-anchor="middle" class="mm-ax">отметь эмоции</text>`}
      </svg>`);
      // hover: a ghost slowly walks the week's path — the passing of time
      if (pts.length > 1) {
        const NS = 'http://www.w3.org/2000/svg';
        let ghost = null;
        const segLen = pts.slice(1).reduce((a2, p2, i) => a2 + Math.hypot(p2[0] - pts[i][0], p2[1] - pts[i][1]), 0);
        const dur = Math.max(3.5, Math.min(9, pts.length * 1.1 + segLen / 120));
        el.addEventListener('mouseenter', () => {
          if (ghost) return;
          ghost = document.createElementNS(NS, 'g');
          ghost.setAttribute('class', 'mm-ghost');
          const c1 = document.createElementNS(NS, 'circle'); c1.setAttribute('r', '16'); c1.setAttribute('fill', 'url(#mdot)'); c1.setAttribute('opacity', '.55');
          const c2 = document.createElementNS(NS, 'circle'); c2.setAttribute('r', '4.5'); c2.setAttribute('fill', '#fff'); c2.setAttribute('opacity', '.85');
          ghost.append(c1, c2);
          const mo = document.createElementNS(NS, 'animateMotion');
          mo.setAttribute('dur', dur + 's'); mo.setAttribute('repeatCount', 'indefinite'); mo.setAttribute('path', path);
          mo.setAttribute('calcMode', 'paced');
          const fade = document.createElementNS(NS, 'animate');
          fade.setAttribute('attributeName', 'opacity'); fade.setAttribute('values', '0;1;1;1;0'); fade.setAttribute('keyTimes', '0;.08;.5;.9;1'); fade.setAttribute('dur', dur + 's'); fade.setAttribute('repeatCount', 'indefinite');
          ghost.append(mo, fade);
          el.appendChild(ghost);
          try { mo.beginElement(); fade.beginElement(); } catch (e) {}
        });
        el.addEventListener('mouseleave', () => { if (!ghost) return; const g = ghost; ghost = null; g.style.transition = 'opacity .8s'; g.style.opacity = 0; setTimeout(() => g.remove(), 800); });
      }
      return el;
    }
    function driverBars(r) {
      const list = r.drivers.filter(x => Math.abs(x.delta) >= .3).slice(0, 5);
      const personal = r.baseN >= 5;
      if (!list.length) return h('p.faint', { style: { fontSize: '.82rem', margin: 0 } }, personal ? 'Все сферы — примерно на твоём обычном уровне.' : 'Пока сравнивать не с чем.');
      const max = Math.max(4, ...list.map(x => Math.abs(x.delta)));
      return h('div.drv', list.map((x, i) => h('div.drv-row',
        h('span.drv-name', x.name),
        h('div.drv-track', h('i.drv-mid'), h('i.drv-bar.' + (x.delta >= 0 ? 'up' : 'down'), { style: { width: (Math.abs(x.delta) / max * 50) + '%', animationDelay: (i * 90) + 'ms' } })),
        h('b.drv-val', (x.delta > 0 ? '+' : x.delta < 0 ? '−' : '') + Math.abs(x.delta).toFixed(1).replace('.0', '').replace('.', ',')))),
        h('p.faint', { style: { fontSize: '.72rem', margin: '8px 0 0' } }, personal ? 'Сколько очков ресурса каждая сфера добавила или убрала по сравнению с твоей нормой за месяц.' : `Пока сравниваю со средним уровнем; через ${5 - r.baseN} ${H.plural(5 - r.baseN, 'день', 'дня', 'дней')} записей — с твоей личной нормой.`));
    }
    function insightCard(n) { return h('div.ins.ins-' + n.k, h('div.ins-dot'), h('div', h('div.ins-cat', CAT[n.cat] || ''), h('b', n.t), h('p', n.x))); }
    function sleepDigestCard(sd) {
      if (!sd) return null;
      return h('div.rep-sleep2',
        h('div.rs2-head', H.gicon('moon', 16, 'sm'),
          h('div', h('div.rs2-total', sd.total != null ? H.fmtDur(sd.total) : '—'), h('div.rs2-sub', [sd.night != null ? 'ночью ' + H.fmtDur(sd.night) : null, sd.nap ? 'днём ' + H.fmtDur(sd.nap) : null].filter(Boolean).join(' · ') || 'сон')),
          h('span.rchip', 'Сон: ' + sd.verdict)),
        sd.top.length ? h('div.rs2-list', sd.top.map(n => h('div.rs2-item.ins-' + n.k, h('i.ins-dot'), h('div', h('b', n.t), h('span', ' — ' + n.x))))) : null);
    }

    function showReport(r) {
      const body = h('div.rep',
        h('div.rep-hero',
          h('div.rep-orb', sphere(r), h('div.orb-name', h('span', 'Цвет дня'), h('b', r.auraName)), h('div.orb-hint', r.auraHint)),
          h('div.rep-head',
            h('div.faint', { style: { fontSize: '.78rem', letterSpacing: '.14em', textTransform: 'uppercase' } }, H.cap(H.weekday(date)) + ', ' + H.fmtLongY(date)),
            h('h2.rep-title', r.verdict.title),
            h('p.rep-text', r.verdict.text),
            h('div.rep-chips',
              r.pct != null ? h('span.rchip' + (r.pct >= 60 ? '.up' : r.pct <= 30 ? '.down' : ''), `лучше ${r.pct}% дней месяца`) : null,
              r.deltaNorm != null ? (Math.abs(r.deltaNorm) < 3 ? h('span.rchip', 'на уровне твоей нормы') : h('span.rchip' + (r.deltaNorm > 0 ? '.up' : '.down'), `${r.deltaNorm > 0 ? '+' : '−'}${Math.abs(r.deltaNorm)} к норме (${r.norm})`)) : null,
              h('span.rchip', H.icon('fire', 14), `${r.streak} ${H.plural(r.streak, 'день', 'дня', 'дней')} подряд`)),
            r.detail && r.detail.coverage < .55 ? h('p.faint', { style: { fontSize: '.76rem', marginTop: '10px' } }, 'Отмечено немного — ресурс посчитан приблизительно.') : null)),
        r.alerts.length ? h('div.alert-card', r.alerts.map(a => h('div', a))) : null,
        h('div.rep-two',
          h('div.rep-panel', h('div.rep-h', H.gicon('compass', 16, 'sm'), h('h4', 'Карта настроения')),
            h('div.mm-wrap', moodMap(r)),
            r.mood ? h('p.mm-cap', h('b', r.mood.name), ' — ', r.mood.desc, r.map.trail.length ? h('span.faint', ' · точки — прошлые 7 дней') : null) : null),
          h('div.rep-panel', h('div.rep-h', H.gicon('chart', 16, 'sm'), h('h4', 'Что повлияло')), driverBars(r),
            sleepDigestCard(r.sleep))),
        r.insights.length ? [h('div.rep-h', H.gicon('sparkle', 16, 'sm'), h('h4', 'Выводы')), h('div.ins-grid', r.insights.map(insightCard))] : null,
        h('div.rep-h', H.gicon('heart', 16, 'sm'), h('h4', 'На завтра')),
        h('div.rep-advice', r.advice.map(a => h('div.adv', a))),
        h('details.rep-facts', h('summary', 'Все отметки дня'), h('div.period-facts',H.periods.facts(S.days[date]).map(sec=>h('section',h('h4',sec.title),sec.items.length?h('ul',sec.items.map(item=>h('li',item))):h('p.faint','Не заполнено'))))),
        h('div.disclaimer', 'Итог составлен автоматически по твоим записям, без интернета. Это не диагноз и не замена консультации врача.'));
      ui.modal('Итог дня', body, { wide: true, cls: 'report-modal', actions: [h('button.btn.primary', { onclick: e => e.target.closest('.modal-back').querySelector('.modal-x').click() }, 'Готово')] });
    }

    renderSavedReport();
    refreshSide();
    if (params && params.focus) setTimeout(() => {
      const el = document.querySelector(`.block[data-block="${params.focus}"]`);
      if (!el) return;
      el.classList.remove('collapsed');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('focus-flash'); setTimeout(() => el.classList.remove('focus-flash'), 1800);
    }, 450);
    root.appendChild(h('div.wrap', head, H.periods.tabs(period,p=>H.go('day',{date,period:p})), h('div.day-grid', sideHost, h('div.day-blocks', blocks, reportHost))));
  };
})(window.H);
