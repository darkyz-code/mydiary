'use strict';
/* Day report v1.7 — resource index vs personal norm, mood map, drivers and a large rule base of conclusions */
(function (H) {
  const M = () => H.metrics;
  const S = () => H.store.get();
  const DOM_NAMES = { mood: 'Настроение', energy: 'Энергия', body: 'Тело', sleep: 'Сон', calm: 'Спокойствие', care: 'Забота о себе' };
  const lastDays = (date, n) => H.range(H.addDays(date, -n), H.addDays(date, -1));
  const day = dt => S().days[dt];
  const sc = (d, id) => d && d.symptoms && d.symptoms[id] ? Number(d.symptoms[id].score) : null;
  const emo = (d, id) => d && d.emotions && d.emotions[id] ? (Number(d.emotions[id].score) || 5) : null;
  const pl = (n, a, b, c) => `${n} ${H.plural(n, a, b, c)}`;
  const toAbs = m => m == null ? null : (m < 12 * 60 ? m + 1440 : m);   // bedtime on a continuous evening scale

  // ---------- sleep context ----------
  function sleepCtx(date) {
    const d = day(date); if (!d) return null;
    const sl = d.sleep || {};
    const night = M().sleepMinutes(d), nap = M().napMinutes(d) || 0, total = M().totalSleep(d);
    if (night == null && !nap && sl.quality == null && sl.wakeFeel == null && !(sl.dreams || []).length) return null;
    const wk = lastDays(date, 7);
    const tots = wk.map(dt => M().totalSleep(day(dt))).filter(x => x != null);
    const nights = wk.map(dt => M().sleepMinutes(day(dt))).filter(x => x != null);
    const beds = wk.map(dt => toAbs(H.timeToMin(day(dt) && day(dt).sleep && day(dt).sleep.bed))).filter(x => x != null);
    const bed = toAbs(H.timeToMin(sl.bed)), wake = H.timeToMin(sl.wake);
    const napEnd = H.timeToMin(sl.napEnd), napStart = H.timeToMin(sl.napStart);
    const bedMean = beds.length >= 3 ? H.avg(beds) : null;
    const bedSd = beds.length >= 4 ? Math.sqrt(H.avg(beds.map(b => (b - bedMean) ** 2))) : null;
    const anxDreams = wk.filter(dt => ((day(dt) && day(dt).sleep && day(dt).sleep.dreams) || []).some(x => x === 'anxious' || x === 'nightmare')).length;
    return {
      night, nap, total, sl, bed, wake, napStart, napEnd,
      avgTot: tots.length >= 3 ? H.avg(tots) : null, avgNight: nights.length >= 3 ? H.avg(nights) : null,
      debt: tots.length >= 3 ? tots.reduce((a, m) => a + Math.max(0, 7.5 * 60 - m), 0) : null,
      bedMean, bedSd, anxDreams,
      inverted: bed != null && bed >= 1440 + 5 * 60 && bed <= 1440 + 14 * 60,   // fell asleep between 05:00 and 14:00
    };
  }

  // ---------- context for rules ----------
  function context(date) {
    const d = day(date);
    const det = M().wellbeingDetail(d);
    const base = M().baseline(date, 30);
    const prev = lastDays(date, 7).map(dt => ({ dt, d: day(dt), w: M().wellbeing(day(dt)) }));
    const g = d.general || {};
    const emos = Object.keys(d.emotions || {}).map(id => ({ e: H.EMOTIONS.find(x => x.id === id), score: Number(d.emotions[id].score) || 5, note: d.emotions[id].note })).filter(x => x.e).sort((a, b) => b.score - a.score);
    const pos = emos.filter(x => x.e.v > 0), neg = emos.filter(x => x.e.v < 0);
    const meds = M().activeMeds(date);
    const missed = [];
    meds.filter(m => !m.asNeeded).forEach(m => { const rec = d.meds && d.meds[m.id]; const taken = rec && rec.slots ? rec.slots.filter(Boolean).length : 0; if (taken < (Number(m.times) || 1)) missed.push(m); });
    const labs = S().labs || [];
    const lastLab = key => { const l = labs.find(x => x.key === key); if (!l) return null; const r = (l.results || []).slice().sort((a, b) => a.date < b.date ? -1 : 1).pop(); return r ? { ...r, unit: l.unit, v: Number(r.value) } : null; };
    const streakOf = (pred, max = 30) => { let k = 0; for (let i = 0; i < max; i++) { const x = day(H.addDays(date, -i)); if (x && pred(x)) k++; else break; } return k; };
    return {
      date, d, g, det, base, prev, emos, pos, neg, meds, missed, lastLab, streakOf,
      idx: det ? det.index : null, ci: M().cycleInfo(date), sleep: sleepCtx(date), aff: M().affect(d),
      life: (d.edited || {}).lifestyle ? (d.lifestyle || {}) : { teaNearIron: (d.lifestyle || {}).teaNearIron },
      pSum: pos.reduce((a, x) => a + x.score, 0), nSum: neg.reduce((a, x) => a + x.score, 0),
    };
  }

  // personal "with vs without" comparison over history, e.g. walk days vs other days
  function compare(date, pred, n = 45) {
    const ds = H.range(H.addDays(date, -n), H.addDays(date, -1));
    const yes = [], no = [];
    ds.forEach(dt => { const x = day(dt); const w = M().wellbeing(x); if (w == null) return; (pred(x, dt) ? yes : no).push(w); });
    if (yes.length < 4 || no.length < 4) return null;
    return Math.round(H.avg(yes) - H.avg(no));
  }

  // ---------- RULES ----------
  // Each rule: cat, test(c) → payload or falsy. payload: { k: good|warn|info|alert, t, x, p (priority 1..10) }
  const R = [];
  const rule = (cat, fn) => R.push({ cat, fn });

  // --- SLEEP ---
  rule('sleep', c => c.sleep && c.sleep.inverted && { k: 'warn', p: 9, t: 'Режим сбился', x: `Основной сон начался ${c.sleep.sl.bed} — уже днём. Так бывает после бессонной ночи или при сдвинутом ритме. Сон в светлое время обычно хуже восстанавливает. Мягко возвращаться помогают утренний свет, подъём в одно время и короткий дневной сон вместо долгого.` });
  rule('sleep', c => c.sleep && c.sleep.night != null && c.sleep.night < 5 * 60 && { k: 'warn', p: 8, t: 'Очень короткая ночь', x: `Ночью всего ${H.fmtDur(c.sleep.night)}. После такой ночи сонливость, раздражительность и «туман» почти неизбежны — это эффект недосыпа, а не ты «плохо стараешься».` });
  rule('sleep', c => c.sleep && c.sleep.night != null && c.sleep.night >= 5 * 60 && c.sleep.night < 6.5 * 60 && !(c.sleep.total >= 7 * 60) && { k: 'info', p: 5, t: 'Сна меньше нормы', x: `${H.fmtDur(c.sleep.total || c.sleep.night)} за сутки — ниже 7 часов, которые обычно нужны взрослым.` });
  rule('sleep', c => c.sleep && c.sleep.night != null && c.sleep.night < 6.5 * 60 && c.sleep.nap >= 30 && c.sleep.total >= 7 * 60 && { k: 'info', p: 5, t: 'Днём добрала сон', x: `Ночью ${H.fmtDur(c.sleep.night)}, но дневной сон дотянул сутки до ${H.fmtDur(c.sleep.total)}. Хорошо как разовая мера; если так часто — ночной сон стоит беречь.` });
  rule('sleep', c => c.sleep && c.sleep.total != null && c.sleep.total > 10 * 60 && { k: 'warn', p: 7, t: 'Очень много сна', x: `За сутки ${H.fmtDur(c.sleep.total)}. ${c.g.energy != null && c.g.energy <= 4 || sc(c.d, 'sleepiness') >= 6 ? 'И при этом бодрости нет — ' : ''}Если потребность во сне так выросла и держится, это стоит обсудить с врачом: так проявляются и нехватка железа, и депрессия, и действие некоторых препаратов.` });
  rule('sleep', c => c.sleep && c.sleep.nap > 90 && { k: 'warn', p: 6, t: 'Длинный дневной сон', x: `Днём ${H.fmtDur(c.sleep.nap)}. Сон дольше 1,5 часа уходит в глубокие фазы — после него часто тяжелее проснуться и сложнее уснуть ночью. Лучше 20–40 минут.` });
  rule('sleep', c => c.sleep && c.sleep.nap > 0 && c.sleep.nap <= 40 && { k: 'good', p: 3, t: 'Удачный дневной сон', x: `${H.fmtDur(c.sleep.nap)} — короткий сон, который обычно бодрит и не мешает ночному.` });
  rule('sleep', c => c.sleep && c.sleep.nap && c.sleep.napEnd != null && c.sleep.napEnd >= 18 * 60 && { k: 'info', p: 5, t: 'Поздний дневной сон', x: `Проснулась днём в ${c.sleep.sl.napEnd}. Сон ближе к вечеру «съедает» давление сна, и ночью уснуть сложнее. По возможности заканчивай дневной сон до 16–17 часов.` });
  rule('sleep', c => {
    if (!c.sleep || !c.sleep.nap) return null;
    const nx = day(H.addDays(c.date, 1)); const lat = nx && nx.sleep && nx.sleep.latency;
    const prevNapLate = lastDays(c.date, 10).filter(dt => { const x = day(dt); const n2 = M().napMinutes(x); const nxt = day(H.addDays(dt, 1)); return n2 > 45 && nxt && nxt.sleep && ['l', 'xl'].includes(nxt.sleep.latency); }).length;
    return prevNapLate >= 2 && { k: 'info', p: 6, t: 'Похоже, дневной сон мешает ночному', x: `Уже ${pl(prevNapLate, 'раз', 'раза', 'раз')} за 10 дней после долгого дневного сна ты потом долго засыпала. Попробуй ограничить его 30 минутами.` };
  });
  rule('sleep', c => c.sleep && (c.sleep.sl.wakeFeel != null && c.sleep.sl.wakeFeel <= 3 || sc(c.d, 'sleepiness') >= 7) && c.sleep.total != null && c.sleep.total >= 7 * 60 && { k: 'warn', p: 8, t: 'Сон не восстанавливает', x: 'Спала достаточно, а бодрости нет. Значит, дело не в количестве сна. Это важный сигнал для врача: так часто проявляется нехватка железа, а ещё бывает побочным эффектом антидепрессантов.' });
  rule('sleep', c => c.sleep && c.sleep.sl.wakeFeel >= 7 && c.sleep.total >= 6.5 * 60 && { k: 'good', p: 4, t: 'Проснулась отдохнувшей', x: 'Бодрость после пробуждения хорошая — сон сработал.' });
  rule('sleep', c => c.sleep && ['l', 'xl'].includes(c.sleep.sl.latency) && { k: 'info', p: c.sleep.sl.latency === 'xl' ? 6 : 4, t: 'Долго засыпала', x: c.g.stress >= 6 || c.neg.some(x => ['anxiety', 'fear', 'overwhelmed'].includes(x.e.id)) ? 'И день был напряжённым — тревога часто мешает уснуть. Перед сном помогает «выгрузить» мысли на бумагу (раздел «Личные заметки») и 4-7-8 дыхание.' : 'Помогают постоянное время отбоя, меньше экранов и кофеина вечером. Если не спится 20+ минут — лучше встать и вернуться, когда захочется спать.' });
  rule('sleep', c => c.sleep && c.sleep.sl.wakeups >= 3 && { k: 'warn', p: 6, t: 'Прерывистая ночь', x: `Просыпалась ${pl(c.sleep.sl.wakeups, 'раз', 'раза', 'раз')}. Даже при нормальной длине сна дробная ночь даёт усталость. Если так часто — стоит рассказать врачу.` });
  rule('sleep', c => c.sleep && c.sleep.bed != null && c.sleep.bedMean != null && !c.sleep.inverted && Math.abs(c.sleep.bed - c.sleep.bedMean) >= 90 && { k: 'info', p: 4, t: c.sleep.bed > c.sleep.bedMean ? 'Легла позже обычного' : 'Легла раньше обычного', x: `Примерно на ${H.fmtDur(Math.abs(c.sleep.bed - c.sleep.bedMean))} ${c.sleep.bed > c.sleep.bedMean ? 'позже' : 'раньше'}, чем в среднем за неделю.` });
  rule('sleep', c => c.sleep && c.sleep.bedSd != null && c.sleep.bedSd >= 100 && { k: 'info', p: 5, t: 'Плавающий режим', x: `Время отбоя за неделю гуляет в среднем на ±${H.fmtDur(c.sleep.bedSd)}. Для мозга это похоже на маленький джетлаг — ровный отбой часто даёт больше энергии, чем лишний час сна.` });
  rule('sleep', c => c.sleep && c.sleep.bedSd != null && c.sleep.bedSd <= 40 && { k: 'good', p: 3, t: 'Ровный режим', x: 'Всю неделю ложишься примерно в одно время — это одна из самых сильных опор для настроения.' });
  rule('sleep', c => c.sleep && c.sleep.debt != null && c.sleep.debt >= 6 * 60 && { k: 'warn', p: 6, t: 'Накопился недосып', x: `За неделю не хватает около ${H.fmtDur(c.sleep.debt)} до 7,5 часа в сутки. Его не обязательно «отсыпать» за раз — лучше пару ночей лечь пораньше.` });
  rule('sleep', c => c.sleep && c.sleep.anxDreams >= 3 && { k: 'info', p: 5, t: 'Тревожные сны повторяются', x: `Тревожные сны или кошмары — ${pl(c.sleep.anxDreams, 'ночь', 'ночи', 'ночей')} за неделю. Это бывает при стрессе и на фоне некоторых антидепрессантов (особенно если препарат принимается вечером). Стоит сказать врачу.` });
  rule('sleep', c => c.sleep && c.sleep.avgTot != null && c.sleep.total != null && c.sleep.total - c.sleep.avgTot >= 90 && !c.sleep.inverted && { k: 'info', p: 3, t: 'Отсыпалась', x: `Сна на ${H.fmtDur(c.sleep.total - c.sleep.avgTot)} больше, чем обычно за неделю — организм добирал своё.` });
  rule('sleep', c => c.sleep && c.sleep.total >= 7 * 60 && c.sleep.total <= 9 * 60 && !c.sleep.inverted && (c.sleep.sl.quality == null || c.sleep.sl.quality >= 6) && { k: 'good', p: 3, t: 'Хороший сон', x: `${H.fmtDur(c.sleep.total)} — в здоровом диапазоне.` });

  // --- EMOTIONS ---
  rule('emo', c => c.pSum >= 8 && c.nSum >= 8 && { k: 'info', p: 6, t: 'Смешанный день', x: `Были и ${c.pos[0].e.name.toLowerCase()}, и ${c.neg[0].e.name.toLowerCase()}. Это нормально: разные чувства могут жить рядом, одно не отменяет другое.` });
  rule('emo', c => c.pSum && c.pSum > c.nSum * 1.5 && !(c.pSum >= 8 && c.nSum >= 8) && { k: 'good', p: 5, t: 'Приятного было больше', x: `Сильнее всего — ${c.pos.slice(0, 2).map(x => x.e.name.toLowerCase()).join(' и ')}. Запомни, что этому помогло.` });
  rule('emo', c => c.nSum && c.nSum > c.pSum * 1.5 && !(c.pSum >= 8 && c.nSum >= 8) && { k: 'warn', p: 6, t: 'Тяжёлые чувства перевешивали', x: `Сильнее всего — ${c.neg.slice(0, 2).map(x => x.e.name.toLowerCase()).join(' и ')}. Ты их заметила и назвала — уже это немного снижает их силу (это показано в исследованиях про «называние чувств»).` });
  rule('emo', c => { const k = c.streakOf(x => ['apathy', 'depressed', 'empty', 'sad', 'emotired'].some(id => emo(x, id) >= 6)); return k >= 4 && { k: 'alert', p: 10, t: `Тяжёлое настроение ${pl(k, 'день', 'дня', 'дней')} подряд`, x: 'Это уже не «плохой день», а период. Расскажи врачу — можно пройти PHQ-9 в «Тестах», чтобы показать динамику. Если появляются мысли о смерти или о том, чтобы навредить себе, — скажи врачу сразу, при сильных мыслях звони 112.' }; });
  rule('emo', c => emo(c.d, 'anxiety') >= 6 && c.sleep && c.sleep.total != null && c.sleep.total < 6.5 * 60 && { k: 'info', p: 7, t: 'Тревога и недосып подпитывают друг друга', x: 'После короткой ночи миндалина (центр тревоги) реагирует заметно сильнее — исследования Мэттью Уокера это хорошо показали. Сегодняшняя тревога может быть частично «недосыпной».' });
  rule('emo', c => emo(c.d, 'anxiety') >= 7 && !(c.sleep && c.sleep.total < 6.5 * 60) && { k: 'warn', p: 6, t: 'Сильная тревога', x: 'Помогает «заземление»: назови 5 вещей, которые видишь, 4 — которые слышишь, 3 — которые можешь потрогать. И медленный выдох длиннее вдоха.' });
  rule('emo', c => (emo(c.d, 'irritation') >= 5 || emo(c.d, 'anger') >= 5 || emo(c.d, 'tearful') >= 5 || emo(c.d, 'swings') >= 5) && c.ci && (c.ci.pms || c.ci.phase === 'luteal') && { k: 'info', p: 6, t: 'Похоже на ПМС', x: 'Раздражительность, слёзы и перепады во второй половине цикла связаны с гормональными колебаниями — это не «характер». Если ПМС сильно мешает жить, у гинеколога есть способы помочь.' });
  rule('emo', c => emo(c.d, 'lonely') >= 6 && { k: 'info', p: 6, t: 'Одиночество', x: 'Даже короткий контакт работает: сообщение подруге, голосовое, разговор с продавцом в кофейне. Гарвардское исследование взрослой жизни показало, что тёплые связи — самый сильный предсказатель благополучия.' });
  rule('emo', c => emo(c.d, 'guilt') >= 6 && { k: 'info', p: 5, t: 'Много вины', x: 'Попробуй сказать себе то, что сказала бы подруге в такой же ситуации. Самосострадание — не слабость: в исследованиях оно связано с большей устойчивостью и меньшей тревогой.' });
  rule('emo', c => (emo(c.d, 'overwhelmed') >= 6 || emo(c.d, 'emotired') >= 6) && c.g.stress >= 6 && { k: 'warn', p: 7, t: 'Признаки перегрузки', x: 'Напряжение высокое и сил на него мало. Выбери сегодня одно важное дело, остальное — перенеси. Это не лень, а распределение ресурса.' });
  rule('emo', c => c.emos.length >= 5 && { k: 'good', p: 3, t: 'Ты хорошо различаешь чувства', x: `Отмечено ${pl(c.emos.length, 'состояние', 'состояния', 'состояний')}. Умение тонко различать эмоции связано с лучшей саморегуляцией.` });
  rule('emo', c => { const k = c.streakOf(x => { const a = M().affect(x); return a && a.v > .25; }); return k >= 3 && { k: 'good', p: 5, t: `${pl(k, 'день', 'дня', 'дней')} подряд в плюсе`, x: 'Настроение держится в приятной зоне уже несколько дней. Заметь, что сейчас помогает — сон, люди, движение, лечение.' }; });
  rule('emo', c => (emo(c.d, 'calm') >= 6 || emo(c.d, 'peace') >= 6) && c.g.stress != null && c.g.stress <= 3 && { k: 'good', p: 4, t: 'Спокойный день', x: 'Напряжение низкое и внутри тихо. Такие дни — хорошее время восстановиться.' });

  // --- BODY ---
  rule('body', c => { const f = c.lastLab('ferritin'); return (sc(c.d, 'sleepiness') >= 6 || sc(c.d, 'weakness') >= 6 || c.g.energy != null && c.g.energy <= 3) && f && f.v < 30 && { k: 'info', p: 7, t: 'Усталость и железо', x: `Последний ферритин — ${f.value} ${f.unit || ''}. При таких запасах усталость и сонливость ожидаемы даже без анемии; в исследовании Вердона (BMJ, 2003) восполнение железа уменьшало усталость у женщин с низким ферритином. Важно продолжать лечение и пересдать анализ в срок.` }; });
  rule('body', c => { const f = c.lastLab('ferritin'); return c.g.energy != null && c.g.energy <= 3 && !f && { k: 'info', p: 5, t: 'Очень мало энергии', x: 'Если такое длится несколько дней — стоит проверить ферритин, гемоглобин и ТТГ. Можно запланировать анализ в «Карточке здоровья».' }; });
  rule('body', c => sc(c.d, 'dizziness') >= 6 && { k: 'warn', p: 7, t: 'Выраженное головокружение', x: 'Вставай медленно, пей воду, не пропускай еду. При обмороке — скорая; если головокружение частое — к врачу (проверить гемоглобин и давление).' });
  rule('body', c => sc(c.d, 'headache') >= 6 && ((c.life.water != null && c.life.water <= 3) || c.life.caffeine >= 4 || (c.sleep && c.sleep.total < 6.5 * 60)) && { k: 'info', p: 6, t: 'Головная боль — вероятные причины', x: [c.life.water != null && c.life.water <= 3 ? 'мало воды' : null, c.life.caffeine >= 4 ? 'много кофеина' : null, c.sleep && c.sleep.total < 6.5 * 60 ? 'короткий сон' : null].filter(Boolean).join(', ').replace(/^./, m => m.toUpperCase()) + ' — частые триггеры. Если боль необычно сильная, внезапная или с онемением, нарушением речи — сразу скорая.' });
  rule('body', c => { const strong = Object.keys(c.d.symptoms || {}).map(id => ({ s: H.store.symptomById(id), v: sc(c.d, id) })).filter(x => x.s && x.v >= 6 && !['sleepiness', 'weakness', 'dizziness', 'headache'].includes(x.s.id)); return strong.length && { k: 'warn', p: 5, t: 'Тело просило внимания', x: `${strong.map(x => x.s.name.toLowerCase()).join(', ')} — выражено заметно. Если держится — запиши для врача, PDF-выгрузка в этом поможет.` }; });
  rule('body', c => (c.d.edited || {}).physical && !Object.keys(c.d.symptoms || {}).some(id => sc(c.d, id) >= 4) && { k: 'good', p: 3, t: 'Тело не беспокоило', x: 'Сильных неприятных ощущений не отмечено.' });
  rule('body', c => { const v = (c.d.edited || {}).vitals ? c.d.vitals || {} : {}; return v.pulse >= 110 && { k: 'warn', p: 7, t: 'Высокий пульс', x: `Пульс ${v.pulse} в покое — много. Он повышается при тревоге, кофеине, нехватке железа и на фоне некоторых препаратов. Если держится или есть одышка, слабость, боль — к врачу.` }; });

  // --- MEDS ---
  rule('med', c => c.missed.length && { k: 'warn', p: 7, t: 'Пропущен приём', x: `Не отмечено: ${c.missed.map(m => m.name).join(', ')}.${c.missed.some(m => /велак|венлаф|velax|venlaf|паксил|парокс/i.test(m.name)) ? ' Этот препарат чувствителен к пропускам: возможны головокружение и «разбитость». Не удваивай дозу сама — уточни у врача, как быть.' : ''}` });
  rule('med', c => { const reg = c.meds.filter(m => !m.asNeeded); if (!reg.length || c.missed.length) return null; const k = c.streakOf(x => M().adherence(x, x.date) === 1, 60); return k >= 7 ? { k: 'good', p: 4, t: `${pl(k, 'день', 'дня', 'дней')} без пропусков`, x: 'Ровный приём — главное условие, чтобы лечение работало.' } : (c.d.edited || {}).meds ? { k: 'good', p: 2, t: 'Все лекарства приняты', x: 'Регулярный приём — основа лечения.' } : null; });
  rule('med', c => { const ad = c.meds.find(m => m.kind === 'antidepressant' && m.start); if (!ad) return null; const w = Math.floor(H.diffDays(c.date, ad.start) / 7); return w >= 0 && w < 6 && { k: 'info', p: 5, t: `${ad.name}: ${w ? pl(w, 'неделя', 'недели', 'недель') : 'первые дни'} приёма`, x: 'Антидепрессантам обычно нужно 2–6 недель, чтобы заметно подействовать, а побочные эффекты (сонливость, тошнота, яркие сны) чаще всего в начале и потом стихают. Отмечай их — так врачу проще решить, что делать.' }; });
  rule('med', c => { const m = c.meds.find(x => (x.doseHistory || []).some(h2 => h2.date && H.diffDays(c.date, h2.date) >= 0 && H.diffDays(c.date, h2.date) <= 14)); return m && { k: 'info', p: 5, t: 'Недавно менялась доза', x: `${m.name}: доза менялась меньше двух недель назад. Перемены в самочувствии сейчас могут быть с этим связаны — это ценно отмечать.` }; });
  rule('med', c => c.life.teaNearIron && { k: 'info', p: 5, t: 'Чай рядом с железом', x: 'Чай, кофе и молочное снижают всасывание железа — лучше разнести хотя бы на 2 часа.' });

  // --- CYCLE ---
  rule('cycle', c => c.ci && c.ci.phase === 'menstrual' && (c.g.energy != null && c.g.energy <= 4 || sc(c.d, 'weakness') >= 5) && { k: 'info', p: 5, t: 'Месячные забирают силы', x: 'Во время месячных упадок энергии ожидаем, особенно при низком железе. Сегодня можно меньше требовать от себя.' });
  rule('cycle', c => c.d.cycle && ['heavy', 'vheavy'].includes(c.d.cycle.flow) && { k: 'warn', p: 6, t: 'Обильные месячные', x: 'Обильная кровопотеря — одна из главных причин нехватки железа. Если месячные регулярно такие — обязательно скажи гинекологу.' });
  rule('cycle', c => { if (!c.ci || !(c.ci.phase === 'luteal' || c.ci.pms) || c.idx == null) return null; const diff = compare(c.date, (x, dt) => { const ci = M().cycleInfo(dt); return ci && (ci.phase === 'luteal' || ci.pms); }, 120); return diff != null && diff <= -6 && { k: 'info', p: 6, t: 'Твой цикл влияет на самочувствие', x: `По твоим записям во второй половине цикла ресурс в среднем на ${-diff} ниже. Сейчас как раз эта фаза — часть сегодняшней тяжести может быть циклической и временной.` }; });
  rule('cycle', c => c.ci && c.ci.pms && !c.neg.length && { k: 'info', p: 2, t: 'ПМС-окно', x: 'По прогнозу сейчас ПМС-окно. Если что-то покажется острее обычного — помни про это.' });

  // --- LIFESTYLE (personal comparisons) ---
  rule('life', c => { if (!(c.life.walk >= 20)) return null; const diff = compare(c.date, x => x.lifestyle && x.lifestyle.walk >= 20); return diff != null && diff >= 5 ? { k: 'good', p: 6, t: 'Прогулки тебе помогают', x: `По твоим записям в дни с прогулкой ресурс в среднем на ${diff} выше. Сегодня прогулка была — отлично.` } : { k: 'good', p: 2, t: 'Была прогулка', x: 'Движение и дневной свет — одни из самых доказанных способов поддержать настроение.' }; });
  rule('life', c => { if (!(c.d.edited || {}).lifestyle || c.life.walk) return null; const diff = compare(c.date, x => x.lifestyle && x.lifestyle.walk >= 20); return diff != null && diff >= 6 && { k: 'info', p: 4, t: 'Без прогулки', x: `В дни с прогулкой твой ресурс в среднем на ${diff} выше. Даже 15 минут завтра могут дать разницу.` }; });
  rule('life', c => c.life.caffeine >= 4 && ((c.sleep && ['l', 'xl'].includes(c.sleep.sl.latency)) || emo(c.d, 'anxiety') >= 5) && { k: 'info', p: 5, t: 'Кофеин', x: `${pl(c.life.caffeine, 'чашка', 'чашки', 'чашек')} — немало, а кофеин усиливает тревогу и мешает уснуть ещё 6–8 часов после чашки. Попробуй последнюю — до 14:00.` });
  rule('life', c => c.life.alcohol && { k: 'info', p: 4, t: 'Алкоголь', x: 'Алкоголь ухудшает качество сна и на следующий день может усиливать тревогу и подавленность; с антидепрессантами его лучше избегать — уточни у врача.' });
  rule('life', c => c.life.water != null && c.life.water <= 3 && !(sc(c.d, 'headache') >= 6) && { k: 'info', p: 3, t: 'Мало воды', x: 'Лёгкое обезвоживание само по себе снижает концентрацию и даёт усталость.' });
  rule('life', c => { if (!c.sleep || c.sleep.total == null || c.idx == null) return null; const diff = compare(c.date, x => { const t = M().totalSleep(x); return t != null && t >= 7 * 60; }); return diff != null && diff >= 6 && c.sleep.total < 7 * 60 && { k: 'info', p: 5, t: 'Тебе особенно важен сон', x: `В дни, когда ты спишь 7+ часов, твой ресурс в среднем на ${diff} выше. Сегодня сна было меньше.` }; });

  // --- TRENDS ---
  rule('trend', c => { if (c.idx == null || !c.base.mean) return null; const z = (c.idx - c.base.mean) / c.base.sd; return Math.abs(z) >= 1 && { k: z > 0 ? 'good' : 'warn', p: 6, t: z > 0 ? 'Заметно лучше твоей нормы' : 'Заметно ниже твоей нормы', x: `Твой обычный уровень за месяц — около ${Math.round(c.base.mean)}, сегодня ${c.idx}.` }; });
  rule('trend', c => { const w = [H.addDays(c.date, -2), H.addDays(c.date, -1)].map(dt => M().wellbeing(day(dt))); if (c.idx == null || w.some(x => x == null)) return null; return w[0] > w[1] && w[1] > c.idx && w[0] - c.idx >= 12 && { k: 'warn', p: 6, t: 'Третий день вниз', x: `Ресурс снижается: ${w[0]} → ${w[1]} → ${c.idx}. Посмотри, что изменилось за эти дни — сон, лекарства, нагрузка, цикл.` }; });
  rule('trend', c => { const w = [H.addDays(c.date, -2), H.addDays(c.date, -1)].map(dt => M().wellbeing(day(dt))); if (c.idx == null || w.some(x => x == null)) return null; return w[0] < w[1] && w[1] < c.idx && c.idx - w[0] >= 12 && { k: 'good', p: 6, t: 'Третий день вверх', x: `Ресурс растёт: ${w[0]} → ${w[1]} → ${c.idx}.` }; });
  rule('trend', c => { const y = M().wellbeing(day(H.addDays(c.date, -1))); return c.idx != null && y != null && y < 40 && c.idx - y >= 15 && { k: 'good', p: 5, t: 'Восстановление', x: `Вчера было тяжело (${y}), сегодня заметно легче (${c.idx}).` }; });
  rule('trend', c => { if (c.idx == null || !c.base.idx || c.base.n < 14) return null; const max = Math.max(...c.base.idx); return c.idx > max && { k: 'good', p: 7, t: 'Лучший день за месяц', x: 'Выше, чем любой день за последние 30. Запиши, что сегодня было особенным.' }; });

  // ---------- percentile & drivers ----------
  function percentile(base, idx) {
    if (idx == null || !base.idx || base.idx.length < 7) return null;
    return Math.round(base.idx.filter(x => x < idx).length / base.idx.length * 100);
  }
  function drivers(det, base) {
    if (!det) return [];
    const W = { mood: 2, energy: 1.5, body: 1.2, sleep: 1.2, calm: 1, care: .5 };
    const totW = det.present.reduce((a, k) => a + W[k], 0);
    return det.present.map(k => {
      const ref = base.dom && base.dom[k] != null ? base.dom[k] : 6;
      return { k, name: DOM_NAMES[k], v: det.domains[k], ref, delta: Math.round((det.domains[k] - ref) * W[k] / totW * 10 * 10) / 10, personal: !!(base.dom && base.dom[k] != null) };
    }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }

  // ---------- mood map words ----------
  function moodWords(a, c) {
    if (!a) return null;
    const { v, a: ar } = a;
    if (c && c.pSum >= 6 && c.nSum >= 6 && Math.abs(v) < .3) return { q: 'mixed', name: 'Смешанные чувства', desc: 'и приятное, и тяжёлое одновременно' };
    const q = Math.abs(v) < .15 && Math.abs(ar) < .15 ? 'center' : v >= 0 ? (ar >= 0 ? 'up' : 'calm') : (ar >= 0 ? 'tense' : 'low');
    const QN = { up: 'Подъём', calm: 'Безмятежность', tense: 'Напряжение', low: 'Упадок', center: 'Ровно' };
    const strength = Math.hypot(v, ar);
    const adv = strength > .65 ? 'ярко' : strength > .35 ? 'заметно' : 'слегка';
    const desc = { up: `${adv} приятно и бодро`, calm: `${adv} приятно и спокойно`, tense: `${adv} неприятно и взвинченно`, low: `${adv} тяжело и без сил`, center: 'без сильных эмоций' }[q];
    return { q, name: QN[q], desc };
  }

  // ---------- aura from the actual emotions ----------
  function aura(c) {
    const items = c.emos.slice(0, 5).map(x => ({ m: H.emoModel(x.e), w: x.score }));
    if (!items.length) {
      const a = c.aff; const v = a ? a.v : (c.idx != null ? (c.idx - 50) / 50 : 0);
      const base = v > .2 ? ['#ffd9a8', '#ffc2d6'] : v < -.2 ? ['#8fb3ff', '#8c8f99'] : ['#d6dbe6', '#a8e6ff'];
      return { colors: [[base[0], 1], [base[1], .6]], name: v > .2 ? 'Тёплый жемчуг' : v < -.2 ? 'Холодный сапфир' : 'Лунный опал', hint: 'Отметь эмоции — и цвет дня соберётся из них.' };
    }
    const tot = items.reduce((a, x) => a + x.w, 0);
    const colors = items.map(x => [x.m.c, x.w / tot]);
    const first = items[0].m, second = items.find(x => x.m.n !== first.n);
    const name = second && second.w / items[0].w > .45 ? `${first.n} с отблеском ${second.m.g}` : first.n;
    return { colors, name, hint: `Собран из ${pl(items.length, 'чувства', 'чувств', 'чувств')}: ${items.slice(0, 3).map(x => c.emos.find(e => H.emoModel(e.e).c === x.m.c).e.name.toLowerCase()).join(', ')}.` };
  }

  // ---------- verdict ----------
  function verdict(c, pct) {
    const idx = c.idx, mw = moodWords(c.aff, c);
    if (idx == null) return { title: 'Пока мало данных', text: 'Отметь самочувствие, эмоции или сон — и итог станет содержательным.' };
    const dm = c.det.domains, pres = c.det.present;
    const best = pres.slice().sort((a, b) => dm[b] - dm[a])[0], worst = pres.slice().sort((a, b) => dm[a] - dm[b])[0];
    const T = [
      [idx >= 80, ['Светлый день', 'День в полную силу', 'Хороший, наполненный день']],
      [idx >= 66, ['Ровный, добрый день', 'Устойчивый день', 'Неплохой день']],
      [idx >= 52, ['День с переменной облачностью', 'Средний день — и это нормально', 'День «и так, и так»']],
      [idx >= 38, ['Непростой день', 'День на сниженном заряде', 'Тяжеловатый день']],
      [true, ['Очень тяжёлый день', 'День на пределе', 'День, когда нужно беречь себя']],
    ];
    const pool = T.find(x => x[0])[1];
    const title = pool[H.parse(c.date).getDate() % pool.length];
    const parts = [];
    if (mw) parts.push(mw.q === 'mixed' ? 'Внутри было и приятное, и тяжёлое.' : mw.q === 'center' ? 'Эмоционально — ровно, без сильных всплесков.' : `Эмоционально — ${mw.desc}.`);
    if (best && dm[best] >= 7) parts.push(`Опорой было: ${DOM_NAMES[best].toLowerCase()}.`);
    if (worst && dm[worst] < 5 && worst !== best) parts.push(`Больше всего просело: ${DOM_NAMES[worst].toLowerCase()}.`);
    if (pct != null) parts.push(pct >= 70 ? `Это лучше, чем ${pct}% твоих дней за месяц.` : pct <= 30 ? `Это ниже, чем ${100 - pct}% твоих дней за месяц — завтра может быть легче.` : 'Для тебя это обычный уровень.');
    return { title, text: parts.join(' '), best, worst };
  }

  // ---------- sleep digest (short!) ----------
  function sleepDigest(c, sleepInsights) {
    const s = c.sleep; if (!s) return null;
    let verdictS;
    if (s.inverted) verdictS = 'сбитый режим';
    else if (s.total == null) verdictS = 'время сна не отмечено';
    else if (s.total < 6 * 60) verdictS = 'мало';
    else if (s.total < 7 * 60) verdictS = 'чуть меньше нормы';
    else if (s.total <= 9.5 * 60) verdictS = (s.sl.wakeFeel != null && s.sl.wakeFeel <= 3) ? 'достаточно, но не восстановил' : 'в норме';
    else verdictS = 'больше нормы';
    const short = x => { const m = x.match(/^[^.!?]*[.!?]/); return m ? m[0] : x; };
    return { total: s.total, night: s.night, nap: s.nap, verdict: verdictS, top: sleepInsights.slice(0, 3).map(n => ({ ...n, x: short(n.x) })) };
  }

  function sleepAnalysis(date) { return sleepCtx(date); }

  // ---------- main ----------
  function dayReport(date) {
    const d = day(date); if (!d) return null;
    const c = context(date);
    const pct = percentile(c.base, c.idx);
    const all = [];
    R.forEach(r => { try { const x = r.fn(c); if (x) all.push({ ...x, cat: r.cat }); } catch (e) { /* a rule must never break the report */ } });
    all.sort((a, b) => b.p - a.p);
    const sleepIns = all.filter(x => x.cat === 'sleep');
    const other = all.filter(x => x.cat !== 'sleep');
    const alerts = other.filter(x => x.k === 'alert');
    // keep the top conclusions, max 2 per category, max 6 total
    const per = {}, insights = [];
    other.filter(x => x.k !== 'alert').forEach(x => { per[x.cat] = (per[x.cat] || 0) + 1; if (per[x.cat] <= 2 && insights.length < 6) insights.push(x); });
    // advice: derived from the strongest warnings, short and concrete
    const advice = [];
    const has = t => all.some(x => x.t.startsWith(t));
    if (has('Режим сбился') || has('Плавающий режим')) advice.push('Завтра — подъём в одно и то же время и 10–15 минут дневного света в первый час после пробуждения.');
    if (has('Длинный дневной сон') || has('Поздний дневной сон')) advice.push('Если захочется спать днём — поставь будильник на 25 минут и закончи до 16–17 часов.');
    if (has('Сон не восстанавливает') || has('Усталость и железо')) advice.push('Запиши в заметки для врача: «сплю достаточно, а сил нет» — это важная деталь.');
    if (has('Пропущен приём')) advice.push('Поставь напоминание на время таблеток — например, будильник с названием препарата.');
    if (has('Сильная тревога') || has('Тревога и недосып')) advice.push('3 минуты дыхания 4-6 в разделе «Отдых → Дыхание» перед сном.');
    if (has('Одиночество')) advice.push('Напиши сегодня одному человеку — просто «привет, вспомнила о тебе».');
    if (has('Признаки перегрузки')) advice.push('Выбери одно дело на завтра, остальное — в список «потом».');
    if (has('Тяжёлые чувства') || has('Очень тяжёлый')) advice.push('Сделай одну маленькую бережную вещь: тёплый душ, плед, любимый чай — или выговорись в «Личных заметках».');
    if (!advice.length) advice.push(c.idx != null && c.idx >= 66 ? 'Запиши в заметки, что сегодня помогло, — это твой личный рецепт хорошего дня.' : 'Продолжай отмечать состояние — с каждой неделей выводы становятся точнее и персональнее.');
    // facts (collapsed)
    const sections = [];
    if (c.emos.length) sections.push({ title: 'Эмоции', items: c.emos.map(x => `${x.e.e} ${x.e.name} — ${x.score}/10${x.note ? `: «${String(x.note).trim().slice(0, 140)}»` : ''}`) });
    const syms = Object.keys(d.symptoms || {}).map(id => ({ s: H.store.symptomById(id), v: sc(d, id) })).filter(x => x.s && x.v > 0).sort((a, b) => b.v - a.v);
    if (syms.length) sections.push({ title: 'Ощущения', items: syms.map(x => `${x.s.name} — ${x.v}/10`) });
    if (c.ci && c.ci.phase !== 'late') sections.push({ title: 'Цикл', items: [`День цикла ${c.ci.dayN}, ${c.ci.phaseName}`] });
    const medItems = c.meds.filter(m => !m.asNeeded).map(m => { const rec = d.meds && d.meds[m.id]; const taken = rec && rec.slots ? rec.slots.filter(Boolean).length : 0; return `${m.name} ${m.dose || ''} мг — ${taken} из ${Number(m.times) || 1}`; });
    if (medItems.length) sections.push({ title: 'Лекарства', items: medItems });
    if (d.complaints && d.complaints.trim()) sections.push({ title: 'Жалобы', items: [d.complaints.trim()] });
    // streak
    let k = 0, dt = date; while (M().filledBlocks(day(dt)) > 0 && k < 365) { k++; dt = H.addDays(dt, -1); }
    const v = verdict(c, pct);
    const au = aura(c);
    const map = { today: c.aff, trail: c.prev.map(p => ({ dt: p.dt, a: M().affect(p.d) })).filter(x => x.a) };
    const out = {
      date, index: c.idx, detail: c.det, pct, norm: c.base.mean != null ? Math.round(c.base.mean) : null, baseN: c.base.n,
      deltaNorm: c.base.mean != null && c.idx != null ? Math.round(c.idx - c.base.mean) : null,
      verdict: v, insights, alerts: alerts.map(a => a.t + '. ' + a.x), advice: advice.slice(0, 3), sections, streak: k,
      drivers: drivers(c.det, c.base), mood: moodWords(c.aff, c), map, aura: au.colors, auraName: au.name, auraHint: au.hint,
      sleep: sleepDigest(c, sleepIns),
    };
    out.summary = `${v.title}. ${v.text}`;
    return out;
  }

  function homeTips() {
    const s = S(); const t = H.today();
    const tips = [];
    const last7 = H.range(H.addDays(t, -7), H.addDays(t, -1));
    const sleeps = last7.map(dt => M().sleepMinutes(s.days[dt])).filter(x => x != null);
    if (sleeps.length >= 3 && H.avg(sleeps) < 6.8 * 60) tips.push({ go: ['day', { focus: 'sleep' }], ico: 'moon', t: 'Сна в последние дни мало', d: `В среднем ${H.fmtDur(H.avg(sleeps))} за ночь. Попробуй сдвинуть отбой на 30 минут раньше.` });
    const sl = M().seriesFor('sleepiness', last7).filter(x => x != null);
    if (sl.filter(x => x >= 7).length >= 3) tips.push({ go: ['library', { article: 'sleepiness' }], ico: 'moon', t: 'Сонливость держится', d: 'Несколько дней подряд сонливость 7+ из 10. Стоит рассказать врачу — может понадобиться скорректировать лечение.' });
    // labs
    s.labs.forEach(l => {
      const rs = (l.results || []).slice().sort((a, b) => a.date < b.date ? -1 : 1);
      const last = rs[rs.length - 1];
      if (last && l.recheckWeeks) {
        const due = H.addDays(last.date, l.recheckWeeks * 7);
        if (due <= H.addDays(t, 7)) tips.push({ go: ['profile', { tab: 'labs' }], ico: 'flask', t: `Пора пересдать: ${l.name}`, d: due <= t ? `Срок пересдачи наступил ${H.fmtLong(due)}.` : `Пересдать ${H.fmtLong(due)}.` });
      }
      if (l.key === 'ferritin' && last && Number(last.value) < 30) tips.push({ go: ['profile', { tab: 'labs' }], ico: 'drop', t: 'Ферритин ниже 30', d: `Последний результат — ${last.value} ${l.unit}. Важно следовать схеме врача и пересдать анализ через назначенный срок.` });
    });
    // planned labs
    (s.labPlans || []).filter(p => !p.done).sort((a, b) => a.date < b.date ? -1 : 1).forEach(p => {
      const names = p.names.join(', ');
      const dd = H.diffDays(p.date, t);
      if (dd === 1) tips.unshift({ go: ['profile', { tab: 'labs' }], ico: 'flask', hot: true, t: `Завтра сдача анализа: ${names}`, d: 'Если сдаёшь натощак — последний приём пищи за 8–12 часов, утром только вода. Уточни в лаборатории, нужно ли пропустить утренние препараты.' + (p.note ? ' Заметка: ' + p.note + '.' : '') });
      else if (dd === 0) tips.unshift({ go: ['profile', { tab: 'labs' }], ico: 'flask', hot: true, t: `Сегодня анализ: ${names}`, d: (p.note ? p.note + ' ' : '') + 'Когда придёт результат — внеси его в карточку, и я покажу динамику.' });
      else if (dd < 0 && dd >= -14) tips.push({ go: ['profile', { tab: 'labs' }], ico: 'flask', t: `Анализ ${H.fmtLong(p.date)}: ${names}`, d: 'Сдала? Отметь это и внеси результат — или перенеси дату.' });
    });
    // tests
    const onAD = s.meds.some(m => m.kind === 'antidepressant' && m.active !== false);
    const lastPhq = s.tests.filter(x => x.test === 'phq9').sort((a, b) => a.date < b.date ? 1 : -1)[0];
    if (onAD && (!lastPhq || H.diffDays(t, lastPhq.date) >= 14)) tips.push({ go: ['tests'], ico: 'clipboard', t: 'Можно пройти PHQ-9', d: 'На фоне лечения полезно раз в 2 недели проходить тест — так врачу проще оценить, помогает ли препарат.' });
    // doctor visits
    (s.profile.doctors || []).forEach(dc => {
      if (dc.nextVisit && dc.nextVisit >= t && H.diffDays(dc.nextVisit, t) <= 7) tips.push({ go: ['profile', { tab: 'doctors' }], ico: 'doctor', t: `Визит: ${dc.spec || dc.name}`, d: `${H.cap(H.fmtLong(dc.nextVisit))}. Выгрузи PDF за последние недели, чтобы взять с собой.` });
    });
    const ci = M().cycleInfo(t);
    if (ci && !ci.late && ci.phase !== 'late' && ci.phase !== 'menstrual' && t >= H.addDays(ci.nextMin, -2) && t <= ci.nextMax)
      tips.push({ go: ['calendar'], ico: 'drop', t: 'Месячные могут начаться скоро', d: `По прогнозу — около ${H.fmtLong(ci.next)}${ci.nextMin !== ci.nextMax ? ` (окно ${H.fmtShort(ci.nextMin)}–${H.fmtShort(ci.nextMax)})` : ''}. Отметь в календаре, когда начнутся.` });
    if (ci && ci.late) tips.push({ go: ['calendar'], ico: 'drop', t: 'Месячные позже прогноза', d: `Задержка около ${ci.late} ${H.plural(ci.late, 'дня', 'дней', 'дней')} от самого позднего ожидаемого дня. Если они уже были — отметь в календаре.` });
    if (ci && ci.phase === 'luteal' && ci.toNext > 0 && ci.toNext <= 9 && !ci.pms) tips.push({ go: ['calendar'], ico: 'flower', t: 'Скоро ПМС-окно', d: `Примерно через ${ci.toNext - 7 > 0 ? ci.toNext - 7 : 1} ${H.plural(Math.max(1, ci.toNext - 7), 'день', 'дня', 'дней')}. Будь к себе мягче в эти дни.` });
    return tips;
  }

  function tipOfDay() {
    const n = Math.floor(Date.now() / 86400000);
    return H.TIPS[n % H.TIPS.length];
  }

  H.report = { dayReport, sleepAnalysis, homeTips, tipOfDay, DOM_NAMES };
})(window.H);
