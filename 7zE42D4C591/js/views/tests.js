'use strict';
/* Tests view (v1.7): grouped test list, questionnaire runner, rich result pages for every kind,
   history with re-openable results. Data lives in tests-data.js. */
(function (H) {
  const { h, ui } = H;
  const S = () => H.store.get();
  const fmt = v => String(v).replace('.', ',');
  const pl = (n, a, b, c) => `${n} ${H.plural(n, a, b, c)}`;

  // ---------- small building blocks ----------
  function safetyCard() {
    return h('div.alert-card',
      h('b', 'Ты отметила мысли о смерти или о том, чтобы причинить себе вред.'),
      h('p', { style: { margin: '8px 0 0' } }, 'Это важно, и с этим не нужно оставаться одной. Пожалуйста, расскажи об этом своему врачу как можно скорее — или близкому человеку, которому доверяешь. Если такие мысли становятся сильными или появляется план — сразу звони в экстренную службу (112 работает во многих странах) или на линию психологической помощи своей страны.'),
      h('p', { style: { margin: '8px 0 0' } }, 'Если ты принимаешь антидепрессант и такие мысли появились или усилились после начала приёма или изменения дозы — врачу особенно важно узнать об этом сразу, не дожидаясь планового визита. Такие мысли — часть состояния, а не правда о тебе, и они проходят при правильной помощи.'));
  }
  const sec = (ico, title, ...kids) => h('section.tr-sec', h('div.tr-sec-h', H.gicon(ico, 15, 'sm'), h('h4', title)), ...kids);
  const paras = arr => (Array.isArray(arr) ? arr : [arr]).filter(Boolean).map(t => h('p', t));
  const list = arr => h('ul.tr-list', (arr || []).map(t => h('li', t)));
  const disclaimer = t => h('div.disclaimer', t);
  const fill = hue => hue == null ? {} : { '--hue': hue };

  function bar(name, pct, { hue, right, sub, mark } = {}) {
    return h('div.tr-bar',
      h('div.tr-bar-top', h('span.tr-bar-n', name), h('span.tr-bar-v', right != null ? right : Math.round(pct) + '%')),
      h('div.tr-bar-track', h('i', { style: { width: H.clamp(pct, 0, 100) + '%', ...fill(hue) } }), mark != null ? h('b.tr-bar-mark', { style: { left: H.clamp(mark, 0, 100) + '%' }, title: 'Твоё среднее' }) : null),
      sub ? h('div.tr-bar-sub', sub) : null);
  }
  function poleBar(dim, pct, sub) {
    return h('div.tr-pole',
      h('div.tr-pole-top', h('b', dim.name), h('span.tr-bar-v', Math.round(pct) + '%')),
      h('div.tr-pole-track', { style: fill(dim.hue) }, h('i', { style: { width: H.clamp(pct, 0, 100) + '%' } }), h('em', { style: { left: H.clamp(pct, 0, 100) + '%' } })),
      h('div.tr-pole-ends', h('span', dim.poles[0]), h('span', dim.poles[1])),
      sub ? h('p.tr-pole-sub', sub) : null);
  }
  const cols = items => h('div.tr-cols', items.filter(x => x && x[2] && (Array.isArray(x[2]) ? x[2].length : true)).map(([ico, title, body]) =>
    h('div.tr-col', h('div.tr-col-h', H.icon(ico, 15), h('b', title)), Array.isArray(body) ? list(body) : h('p', body))));
  const hero = (...kids) => h('div.tr-hero', ...kids);
  const kicker = t => h('div.tr-kicker', t);

  // ---------- history helpers ----------
  const histOf = t => S().tests.filter(x => x.test === t.id).sort((a, b) => (a.ts || 0) - (b.ts || 0));
  function prevOf(rec, hist) {
    const i = hist.findIndex(x => x.id === rec.id);
    if (i > 0) return hist[i - 1];
    if (i < 0 && hist.length) return hist[hist.length - 1];
    return null;
  }
  const trackable = t => !t.listOnly && t.kind !== 'type' && (t.kind !== 'profile' || t.mode === 'total');

  function label(t, rec) {
    if (!rec) return '';
    if (t.kind === 'type') return H.testLevel(t, 0, rec).name;
    if (t.kind === 'profile') {
      const n = H.testLevel(t, rec.score, rec).name;
      return t.mode === 'total' ? `${fmt(rec.score)} из 5 — ${n.toLowerCase()}` : n;
    }
    if (t.kind === 'bmi') return `${fmt(rec.score)} — ${H.testLevel(t, rec.score).name.toLowerCase()}`;
    if (t.listOnly) return `${(rec.answers || []).filter(v => v > 0).length} отмечено`;
    return `${rec.score} — ${H.testLevel(t, rec.score).name.toLowerCase()}`;
  }
  function save(test, rec) {
    const full = { id: H.uid(), test: test.id, date: H.today(), ts: Date.now(), ...rec };
    S().tests.push(full);
    H.store.save();
    H.game.award(`test:${test.id}:${H.today()}`, 25, 'тест');
    return full;
  }

  function deltaChip(t, rec, prev) {
    if (!prev || typeof prev.score !== 'number') return null;
    const d = H.round1(rec.score - prev.score);
    if (d === 0) return h('span.tr-delta', `как в прошлый раз (${H.fmtLong(prev.date)})`);
    const better = t.higherBetter ? d > 0 : d < 0;
    return h('span.tr-delta' + (better ? '.good' : '.bad'), `${d > 0 ? '+' : '−'}${fmt(Math.abs(d))} к прошлому разу (${H.fmtLong(prev.date)}: ${fmt(prev.score)})`);
  }
  function trackSec(t, rec, prev, hist) {
    const tr = t.track; if (!tr) return null;
    const when = tr.every === 14 ? 'через 2 недели' : tr.every === 30 ? 'примерно через месяц' : `через ${pl(tr.every, 'день', 'дня', 'дней')}`;
    const out = [`Чтобы видеть динамику, повтори тест ${when}. Один результат — это снимок одного периода; три-четыре замера уже показывают тенденцию.`];
    if (prev && tr.mcid) {
      const d = rec.score - prev.score, better = t.higherBetter ? d > 0 : d < 0;
      out.push(Math.abs(d) >= tr.mcid
        ? `По сравнению с прошлым разом изменение заметное (на ${pl(Math.abs(d), 'балл', 'балла', 'баллов')}) — ${better ? 'и в хорошую сторону. Это стоит отметить для себя и для врача.' : 'в сторону ухудшения. Это повод рассказать врачу, не дожидаясь планового приёма.'}`
        : 'По сравнению с прошлым разом изменение небольшое — такие колебания бывают от недели к неделе.');
    } else if (tr.mcid) out.push(`Для этого опросника заметным обычно считают изменение на ${pl(tr.mcid, 'балл', 'балла', 'баллов')} и больше.`);
    if (tr.response && hist.length > 1) {
      const first = hist[0];
      if (first && first.id !== rec.id && first.score >= 10 && rec.score <= first.score / 2) {
        out.push(`По сравнению с первым результатом (${first.score} — ${H.fmtLongY(first.date)}) балл снизился вдвое или больше. Врачи называют такую динамику ответом на лечение — хорошая новость, которой стоит поделиться на приёме.`);
        if (rec.score < 5) out.push('Балл ниже 5 — уровень, который при устойчивом сохранении называют ремиссией. Решение о дальнейшей схеме лечения в любом случае принимает врач.');
      }
    }
    if (t.cat === 'med') out.push('Все результаты сохраняются в истории теста и попадают в PDF-отчёт для врача.');
    return sec('calendar', 'Как отслеживать', paras(out));
  }

  // ---------- result: scored questionnaires ----------
  function scoredResult(t, rec, hist) {
    const a = rec.answers || [];
    const sc = rec.score;
    const lv = H.testLevel(t, sc);
    const li = t.levels.indexOf(lv);
    const from = li > 0 ? Math.floor(t.levels[li - 1].to) + 1 : 0;
    const prev = prevOf(rec, hist);
    const itemMax = Math.max(...t.opts.map(o => o.v));
    const optText = v => (t.opts.find(o => o.v === v) || {}).t || '';
    const pct = H.clamp(sc / t.max * 100, 0, 100);
    const qName = i => (t.short && t.short[i]) || t.qs[i];
    const marked = a.map((v, i) => ({ i, v })).filter(x => x.v > 0);

    // hero
    const gauge = t.listOnly ? null : h('div.gauge.tr-gauge', { style: t.higherBetter ? { background: 'linear-gradient(90deg, hsl(0,65%,58%), hsl(35,75%,58%), hsl(70,60%,55%), hsl(140,55%,55%))' } : {} },
      t.levels.slice(0, -1).map(l => h('span.gt', { style: { left: ((l.to + .5) / t.max * 100) + '%' } })),
      h('i.gm', { style: { left: '0%' }, dataset: { pct } }));
    const top = hero(
      kicker('Твой результат'),
      h('div.tr-hero-row',
        h('div.result-score', t.listOnly ? String(marked.length) : String(sc)),
        h('div.tr-hero-txt',
          h('div.muted', t.listOnly ? `${H.plural(marked.length, 'пункт отмечен', 'пункта отмечено', 'пунктов отмечено')} из ${t.qs.length}` : `из ${t.max} · диапазон ${from}–${Math.floor(lv.to)}`),
          h('h3', lv.soft || lv.name))),
      gauge,
      h('div.tr-hero-foot', !t.listOnly ? h('span.tr-tag', lv.name) : null, deltaChip(t, rec, prev)));

    // stand-out items
    let picks = t.higherBetter
      ? a.map((v, i) => ({ i, v })).filter(x => x.v <= 2).sort((x, y) => x.v - y.v || x.i - y.i)
      : marked.slice().sort((x, y) => y.v - x.v || x.i - y.i);
    if (!t.custom) picks = picks.slice(0, 4);
    const pillCls = v => { const r = t.higherBetter ? 1 - v / itemMax : v / itemMax; return r >= .66 ? '.hi' : r >= .34 ? '.md' : '.lo'; };
    const stood = sec('eye', t.listOnly ? 'Что обсудить с врачом' : t.custom ? 'Что совпало' : t.higherBetter ? 'Что сейчас тянет вниз' : 'Что выделилось',
      picks.length
        ? [!t.custom ? h('p.muted', t.higherBetter ? 'Пункты с самыми низкими ответами — то, на что стоит обратить внимание в первую очередь:' : 'Пункты, на которые ты ответила выше всего, и то, с чем они обычно связаны:') : null,
          h('div.tr-items', picks.map(x => h('div.tr-item',
            h('div.tr-item-h', h('b', t.custom ? t.qs[x.i] : qName(x.i)), h('span.tr-pill' + pillCls(x.v), optText(x.v).toLowerCase())),
            !t.custom && t.short ? h('div.tr-item-q', t.qs[x.i]) : null,
            t.notes && t.notes[x.i] ? h('p', t.notes[x.i]) : null)))]
        : h('p.muted', t.higherBetter ? 'Все пункты на хорошем уровне — ни один не тянет вниз.' : 'Ни один пункт не отмечен — ответы ровные и низкие.'));

    // clusters
    const clusters = t.clusters && marked.length ? sec('chart', 'Где сильнее', h('p.muted', 'Те же ответы, сгруппированные по сферам: так видно, что сейчас звучит громче.'),
      t.clusters.map(c => { const s = c.idx.reduce((acc, i) => acc + (a[i] || 0), 0), m = c.idx.length * itemMax; return bar(c.name, s / m * 100, { right: `${s} из ${m}` }); })) : null;

    const ins = [...(t.insights ? t.insights(a, sc, hist) : [])];
    const urgent = (t.urgent || []).filter(i => a[i] === 2);

    return [
      top,
      t.safety != null && a[t.safety] > 0 ? safetyCard() : null,
      urgent.length ? h('div.alert-card', h('b', 'Важно: '), `ты отметила «${urgent.map(i => t.qs[i].toLowerCase()).join('», «')}» как частое или сильное. Если это мучительно, усиливается или сочетается с жаром, сильным беспокойством и скованностью мышц — свяжись с врачом сразу, не дожидаясь планового визита.`) : null,
      sec('mind', 'Что это значит', paras(lv.more || lv.t), t.cat === 'med' ? h('p.tr-soft', t.custom ? 'Это не диагноз. Список помогает собрать наблюдения для врача; связан ли симптом с препаратом или с нехваткой железа и что с ним делать, решает врач.' : 'Это не диагноз. Опросник помогает заметить, насколько выражены симптомы, и следить за динамикой; оценку состояния делает врач, учитывая разговор, осмотр и анализы.') : null),
      stood,
      clusters,
      ins.length ? sec('sparkle', 'Наблюдения', paras(ins)) : null,
      lv.steps ? sec('check', 'Что можно сделать', list(lv.steps)) : null,
      (t.context || []).map(c => sec(c.ico, c.title, h('p', c.t))),
      t.advice ? sec('flask', 'Какие анализы обсудить', h('p', t.advice)) : null,
      trackSec(t, rec, prev, hist),
      disclaimer((t.cat === 'med' ? 'Результат теста — не диагноз. Диагноз ставит только врач после осмотра и, при необходимости, анализов. ' : '') + t.source),
    ];
  }

  // ---------- result: forced-choice types ----------
  function typeResult(t, rec) {
    const a = rec.answers || [];
    const keys = Object.keys(t.types);
    const cnt = {}; keys.forEach(k => cnt[k] = 0); a.forEach(v => { if (v in cnt) cnt[v]++; });
    const total = a.filter(v => v in cnt).length || 1;
    const main = t.types[rec.type] ? rec.type : keys.slice().sort((x, y) => cnt[y] - cnt[x])[0];
    const ranked = keys.slice().sort((x, y) => (y === main) - (x === main) || cnt[y] - cnt[x]);
    const tp = t.types[main], sKey = ranked[1], second = t.types[sKey];
    const blend = cnt[sKey] > 0 && cnt[sKey] >= cnt[main] - 1;
    const clear = cnt[main] / total >= .7;
    return [
      hero(kicker(clear ? 'Похоже, ты' : 'Скорее всего, ты'),
        h('div.tr-name', tp.name), tp.tag ? h('div.tr-motto', tp.tag) : null,
        h('div.tr-hero-foot', blend ? h('span.tr-tag', `с оттенком: ${second.name.toLowerCase()}`) : h('span.tr-tag', `${Math.round(cnt[main] / total * 100)}% ответов`))),
      sec('chart', 'Как распределились ответы', keys.map(k => bar(t.types[k].name, cnt[k] / total * 100))),
      sec('mind', 'Как это проявляется', paras(tp.more || tp.t)),
      blend ? sec('sparkle', 'Смешанный тип', h('p', `Главная нота — ${tp.mix || tp.name.toLowerCase()}, но почти так же заметно звучит и ${second.mix || second.name.toLowerCase()} (${second.name.toLowerCase()}). Чистые типы встречаются редко, так что советы для второго типа тебе тоже могут подойти:`), list((second.tips || [second.t]).slice(0, 2))) : null,
      cols([['star', 'Сильные стороны', tp.strengths], ['eye', 'На что обратить внимание', tp.watch], ['check', 'Что попробовать', tp.tips || tp.t]]),
      t.note ? sec('pulse', 'Связь со здоровьем', h('p', t.note)) : null,
      disclaimer(t.source),
    ];
  }

  // ---------- result: profiles ----------
  function quadSvg(d) {
    const W = 230, pad = 18, s = W - pad * 2;
    const x = pad + d.avo / 100 * s, y = pad + (1 - d.anx / 100) * s;
    const q = (tx, ty, label) => `<text x="${tx}" y="${ty}" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity=".62">${label}</text>`;
    return H.svg(`<svg viewBox="0 0 ${W} ${W + 14}" width="230" class="tr-quad">
      <rect x="${pad}" y="${pad}" width="${s}" height="${s}" rx="14" fill="currentColor" fill-opacity=".035" stroke="currentColor" stroke-opacity=".14"/>
      <rect x="${pad}" y="${pad + s / 2}" width="${s / 2}" height="${s / 2}" rx="0" fill="hsl(150,50%,60%)" fill-opacity=".09"/>
      <line x1="${pad + s / 2}" y1="${pad}" x2="${pad + s / 2}" y2="${pad + s}" stroke="currentColor" stroke-opacity=".18" stroke-dasharray="3 4"/>
      <line x1="${pad}" y1="${pad + s / 2}" x2="${pad + s}" y2="${pad + s / 2}" stroke="currentColor" stroke-opacity=".18" stroke-dasharray="3 4"/>
      ${q(pad + s / 4, pad + 18, 'тревожный')}${q(pad + s * .75, pad + 18, 'тревожно-')}${q(pad + s * .75, pad + 30, 'избегающий')}
      ${q(pad + s / 4, pad + s - 10, 'надёжный')}${q(pad + s * .75, pad + s - 10, 'избегающий')}
      <circle cx="${x}" cy="${y}" r="17" style="fill: rgba(var(--accent-rgb), .22)"/>
      <circle cx="${x}" cy="${y}" r="6.5" fill="currentColor" style="stroke: var(--surface-solid)" stroke-width="2.5"/>
      <text x="${pad + s / 2}" y="${W + 8}" text-anchor="middle" font-size="9.5" fill="currentColor" fill-opacity=".5">дистанция в близости →</text>
      <text x="6" y="${pad + s / 2}" text-anchor="middle" font-size="9.5" fill="currentColor" fill-opacity=".5" transform="rotate(-90 6 ${pad + s / 2})">тревога в близости →</text>
    </svg>`);
  }

  function profileResult(t, rec, hist) {
    const keys = t.order || Object.keys(t.dims);
    const d = rec.dims || H.testProfile(t, rec.answers || []).dims;
    const ranked = keys.slice().sort((x, y) => d[y] - d[x]);
    const D = k => t.dims[k];
    const tier = H.testTier;

    if (t.mode === 'top') {
      const A = D(ranked[0]), B = D(ranked[1]), C = D(ranked[2]), low = D(ranked[ranked.length - 1]);
      const close = d[ranked[0]] - d[ranked[1]] <= 6;
      const isArch = !!A.strengths;
      const chips = [h('span.tr-tag', `${isArch ? 'второй голос' : 'второй язык'}: ${B.name}`), h('span.tr-tag', `третий: ${C.name}`)];
      const top = hero(kicker(isArch ? (close ? 'Почти поровну в тебе звучат' : 'Ярче всего в тебе звучит') : (close ? 'Твои главные языки заботы' : 'Твой главный язык заботы')),
        h('div.tr-name', close ? `${A.name} и ${B.name}` : A.name),
        A.motto ? h('div.tr-motto', `«${A.motto}»`) : null,
        h('div.tr-hero-foot', close ? chips[1] : chips));
      const bars = sec('chart', isArch ? 'Все двенадцать архетипов' : 'Все языки', h('p.muted', isArch ? 'У каждого человека звучат все архетипы — просто с разной громкостью. Вот как они распределились у тебя сейчас.' : 'У каждого человека есть все пять — разница в том, какие звучат громче.'),
        ranked.map(k => bar(D(k).name, d[k], { hue: D(k).hue })));
      if (isArch) {
        const blend = [`Твой главный сюжет — ${A.name}: он даёт тебе ${A.gives}. Рядом звучит ${B.name} — это ${B.gives}.`, `Вместе это похоже на человека, который ${A.does} и при этом ${B.does}.` + (d[ranked[1]] - d[ranked[2]] <= 8 ? ` Почти так же громко звучит ${C.name} — ещё и ${C.gives}.` : '')];
        const lc = x => x.charAt(0).toLowerCase() + x.slice(1);
        if (A.shadow && B.helps) blend.push(`В трудные периоды стоит присматриваться к тени главного архетипа — например, ${lc(A.shadow[0])}. Здесь может выручить второй голос. Совет от архетипа «${B.name}»: ${lc(B.helps[0])}.`);
        return [top,
          sec('crown', `Как может проявляться «${A.name}»`, paras(A.t)),
          cols([['star', 'Сильные стороны', A.strengths], ['moon', 'Теневая сторона', A.shadow], ['check', 'Что помогает', A.helps]]),
          sec('sparkle', 'Твоё сочетание', paras(blend)),
          sec('feather', `Второй голос: ${B.name}`, h('p', B.t[0]), h('p.muted', 'Сильные стороны: ' + B.strengths.map(s => s.toLowerCase()).join(', ') + '.')),
          sec('moon', 'Что сейчас звучит тише', h('p', `Тише всего у тебя сейчас звучит ${low.name}.`), h('p', low.low)),
          bars,
          sec('mind', 'Как читать результат', h('p', 'Архетипы — не ящики, в которые нужно себя уложить, а язык для разговора с собой. Они описывают внутренние сюжеты и мотивы, которые сейчас звучат громче. Результат меняется вместе с жизнью и состоянием: в трудный период на первый план часто выходят другие архетипы, чем в спокойный. Интересно пройти тест ещё раз через несколько месяцев и сравнить.')),
          disclaimer(t.source)];
      }
      return [top,
        sec('heart', `Твой главный язык: ${A.name.toLowerCase()}`, h('p', A.t)),
        cols([['user', 'Как попросить об этом', A.ask], ['gift', 'Как ты, вероятно, даришь заботу', A.give], ['eye', 'На что обратить внимание', A.watch]]),
        sec('feather', `Второй язык: ${B.name.toLowerCase()}`, h('p', B.t), close ? h('p.muted', 'Первые два языка у тебя почти равны — тебе одинаково важны оба.') : null),
        sec('moon', 'Что для тебя менее важно', h('p', `Слабее всего звучит язык «${low.name.toLowerCase()}». Это не значит, что он тебе не нужен, — просто через него до тебя труднее «достучаться», и ты можешь недооценивать, когда кто-то проявляет любовь именно так.`)),
        bars,
        t.note ? sec('sparkle', 'Идея для разговора', h('p', t.note)) : null,
        disclaimer(t.source)];
    }

    if (t.mode === 'traits') {
      const pron = keys.slice().sort((x, y) => Math.abs(d[y] - 50) - Math.abs(d[x] - 50)).filter(k => Math.abs(d[k] - 50) >= 12).slice(0, 3);
      const tiers = {}; keys.forEach(k => tiers[k] = tier(d[k]));
      const phr = pron.map(k => D(k).p[tiers[k] === 'mid' ? (d[k] >= 50 ? 'high' : 'low') : tiers[k]]);
      const head = pron.length
        ? 'Похоже, ты — человек, который ' + (phr.length > 1 ? phr.slice(0, -1).join(', ') + ' и ' + phr[phr.length - 1] : phr[0]) + '.'
        : 'Твой профиль довольно ровный: все пять черт около середины. Это значит гибкость — ты можешь проявляться по-разному в зависимости от ситуации и людей.';
      const combos = (t.combos || []).filter(c => Object.keys(c.when).every(k => tiers[k] === c.when[k])).map(c => c.t);
      const tips = keys.filter(k => tiers[k] !== 'mid').map(k => `${D(k).name}: ${D(k).tips[tiers[k]].charAt(0).toLowerCase() + D(k).tips[tiers[k]].slice(1)}`);
      return [
        hero(kicker('Твой портрет'), h('div.tr-lead', head),
          h('div.tr-hero-foot', keys.map(k => h('span.tr-tag', `${D(k).short || D(k).name} ${d[k]}%`)))),
        sec('chart', 'Пять черт', h('p.muted', 'У каждой черты нет «хорошего» и «плохого» полюса — у обоих свои сильные стороны.'), keys.map(k => poleBar(D(k), d[k], D(k)[tiers[k]]))),
        sec('sparkle', 'Как черты сочетаются', combos.length ? paras(combos) : h('p', 'Ярких «перекосов» между чертами нет — они уравновешивают друг друга. Обычно это значит, что ты умеешь подстраиваться под разные ситуации.')),
        tips.length ? sec('check', 'Как опираться на свои особенности', list(tips)) : null,
        t.note ? sec('pulse', 'Важно про чувствительность', h('p', t.note)) : null,
        disclaimer(t.source)];
    }

    if (t.mode === 'quad') {
      const key = t.styles[rec.type] ? rec.type : H.testAttachStyle(d);
      const st = t.styles[key];
      return [
        hero(h('div.tr-quad-row', quadSvg(d),
          h('div', kicker('Похоже, у тебя'), h('div.tr-name', st.name), h('p', st.t)))),
        sec('chart', 'Две оси близости', keys.map(k => poleBar(D(k), d[k], D(k)[tier(d[k])]))),
        cols([['star', 'Сильные стороны', st.strengths], ['check', 'Что может помочь', st.helps]]),
        sec('mind', 'Важно помнить', h('p', t.note)),
        disclaimer(t.source)];
    }

    if (t.mode === 'centered') {
      const mean = keys.reduce((s, k) => s + d[k], 0) / keys.length;
      const top3 = ranked.slice(0, 3), bottom = ranked.slice(-2);
      const pos = new Set(ranked.slice(0, 5).filter(k => d[k] > mean));
      const tens = (t.tensions || []).filter(([x, y]) => pos.has(x) && pos.has(y));
      const flat = d[ranked[0]] - d[ranked[ranked.length - 1]] <= 15;
      return [
        hero(kicker('Для тебя важнее всего'), h('div.tr-name.sm', top3.map(k => D(k).name).join(' · ')),
          flat ? h('p.muted', 'Твои ценности довольно близки по важности — тебе многое значимо одновременно. Ниже — те, что всё же чуть впереди.') : null),
        sec('compass', 'Главные ценности', h('div.tr-items', top3.map(k => h('div.tr-item', { style: fill(D(k).hue) }, h('div.tr-item-h', h('b', D(k).name), h('span.tr-pill.lo', d[k] > mean ? `выше твоего среднего на ${Math.round(d[k] - mean)}` : 'около среднего')), h('p', D(k).t + ' ' + D(k).life))))),
        sec('moon', 'Что сейчас менее важно', h('p', `${bottom.map(k => D(k).name).join(' и ')} — эти ценности реже определяют твои решения. Это не «плохие» ценности и не недостаток: просто сейчас другие для тебя весомее.`)),
        tens.length ? sec('sparkle', 'Где может быть внутреннее напряжение', h('p.muted', 'По теории Шварца некоторые ценности тянут в разные стороны. Когда обе важны, решения даются труднее — и это нормально.'), paras(tens.map(x => x[2]))) : null,
        sec('chart', 'Все ценности', h('p.muted', 'Вертикальная отметка — твоё среднее. Важнее не абсолютные проценты, а то, что выше и ниже него.'), ranked.map(k => bar(D(k).name, d[k], { hue: D(k).hue, mark: mean }))),
        sec('check', 'Вопрос для размышления', h('p', 'Сколько места главные ценности занимают в твоей обычной неделе? Если какой-то из них почти нет, это может объяснять часть усталости или неудовлетворённости. Маленький шаг в её сторону часто даёт больше сил, чем кажется.'), list(top3.map(k => D(k).tip))),
        disclaimer(t.source)];
    }

    // total (self-compassion)
    const b = t.bands.find(x => rec.score <= x.to) || t.bands[t.bands.length - 1];
    const prev = prevOf(rec, hist);
    const weakest = keys.slice().sort((x, y) => d[x] - d[y])[0];
    const pct = (rec.score - 1) / 4 * 100;
    return [
      hero(kicker('Твой результат'),
        h('div.tr-hero-row', h('div.result-score', fmt(rec.score)), h('div.tr-hero-txt', h('div.muted', 'из 5 · среднее по 12 утверждениям'), h('h3', b.soft))),
        h('div.gauge.tr-gauge', { style: { background: 'linear-gradient(90deg, hsl(0,60%,60%), hsl(35,70%,60%), hsl(80,55%,58%), hsl(140,50%,58%))' } },
          [2.5, 3.5].map(v => h('span.gt', { style: { left: ((v - 1) / 4 * 100) + '%' } })), h('i.gm', { style: { left: '0%' }, dataset: { pct } })),
        h('div.tr-hero-foot', h('span.tr-tag', b.name), deltaChip({ higherBetter: true }, rec, prev))),
      sec('mind', 'Что это значит', paras(b.t)),
      sec('chart', 'Три стороны самосострадания', h('p.muted', 'Каждая шкала — пара «поддерживающая сторона против трудной». Чем правее, тем больше поддержки.'), keys.map(k => poleBar(D(k), d[k], D(k)[tier(d[k])]))),
      sec('check', 'Что можно попробовать', h('p', `Сильнее всего сейчас проседает «${D(weakest).name.toLowerCase()}». ${D(weakest).tip}`), list(t.practices)),
      sec('pulse', 'Связь с настроением', h('p', t.note)),
      trackSec({ ...t, higherBetter: true }, rec, prev, hist),
      disclaimer(t.source)];
  }

  // ---------- result: balance wheel ----------
  function wheelSvg(areas, vals, size = 300) {
    const N = areas.length, R = size * .36, c = size / 2;
    const pt = (i, v) => { const a = -Math.PI / 2 + (i + .5) * 2 * Math.PI / N; return [c + Math.cos(a) * R * v / 10, c + Math.sin(a) * R * v / 10]; };
    let svg = `<svg viewBox="-46 -14 ${size + 92} ${size + 28}" width="${size + 60}" class="wheel">`;
    for (let i = 0; i < N; i++) {
      const a0 = -Math.PI / 2 + i * 2 * Math.PI / N, a1 = a0 + 2 * Math.PI / N, r = R * (vals[i] || 0) / 10;
      const col = `hsl(${(i * 360 / N + 200) % 360}, 60%, 70%)`;
      svg += `<path d="M${c},${c} L${c + Math.cos(a0) * R},${c + Math.sin(a0) * R} A${R},${R} 0 0 1 ${c + Math.cos(a1) * R},${c + Math.sin(a1) * R} Z" fill="currentColor" fill-opacity=".04" stroke="currentColor" stroke-opacity=".12"/>`;
      if (r > 0) svg += `<path d="M${c},${c} L${c + Math.cos(a0) * r},${c + Math.sin(a0) * r} A${r},${r} 0 0 1 ${c + Math.cos(a1) * r},${c + Math.sin(a1) * r} Z" fill="${col}" fill-opacity=".55" stroke="${col}"/>`;
      const [lx, ly] = pt(i, 12.4);
      svg += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity=".75">${areas[i]}</text>`;
    }
    return H.svg(svg + '</svg>');
  }
  function wheelResult(t, rec, hist) {
    const vals = rec.answers || [];
    const lv = H.testLevel(t, rec.score);
    const pairs = t.areas.map((a, i) => ({ a, v: vals[i] || 0, i }));
    const mx = Math.max(...pairs.map(p => p.v)), mn = Math.min(...pairs.map(p => p.v));
    const spread = mx - mn;
    const low = pairs.filter(p => p.v < mx).sort((x, y) => x.v - y.v).slice(0, 3);
    const high = pairs.filter(p => p.v > mn).sort((x, y) => y.v - x.v).slice(0, 2);
    const prev = prevOf(rec, hist);
    let change = null;
    if (prev && prev.answers && prev.answers.length === vals.length) {
      const ch = pairs.map(p => ({ ...p, d: p.v - prev.answers[p.i] })).filter(p => p.d !== 0).sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).slice(0, 3);
      if (ch.length) change = sec('reset', 'Что изменилось с прошлого раза', h('p', `По сравнению с ${H.fmtLong(prev.date)}: ` + ch.map(p => `${p.a.toLowerCase()} ${p.d > 0 ? '+' : '−'}${Math.abs(p.d)}`).join(', ') + '.'));
    }
    return [
      hero(h('div.tr-wheel-row', wheelSvg(t.areas, vals, 250),
        h('div', kicker('Твоё колесо сейчас'), h('div.tr-name.sm', lv.name), h('p', lv.t),
          h('div.tr-hero-foot', h('span.tr-tag', `в среднем ${fmt(H.round1(rec.score / t.areas.length))} из 10`), deltaChip(t, rec, prev))))),
      spread === 0 ? sec('target', 'Все сферы на одном уровне', h('p', `Ты оценила все сферы одинаково — на ${mx} из 10. Так бывает, когда трудно отделить одно от другого или когда всё ощущается «примерно так себе». Попробуй спросить себя: если бы можно было добавить один балл только одной сфере, какую бы ты выбрала? Это и есть подсказка, с чего начать.`)) : null,
      high.length ? sec('star', 'Твои опоры', h('p', `Сильнее всего сейчас: ${high.map(p => `${p.a.toLowerCase()} (${p.v})`).join(' и ')}. Это ресурсы, на которые можно опереться. Подумай, как они могут поддержать слабые сферы — например, через друзей добавить отдыха, а через хобби — радости.`)) : null,
      low.length ? sec('target', 'Куда направить внимание', h('div.tr-items', low.map(p => h('div.tr-item', h('div.tr-item-h', h('b', p.a), h('span.tr-pill' + (p.v <= 3 ? '.hi' : p.v <= 6 ? '.md' : '.lo'), `${p.v} из 10`)), h('p', (t.areaTips || {})[p.a] || ''))))) : null,
      sec('mind', 'Как читать колесо', h('p', lv.more || ''), spread === 0 ? null : spread >= 5 ? h('p', `Разница между самой сильной и самой слабой сферой — ${pl(spread, 'балл', 'балла', 'баллов')}. Колесо с большим перекосом «едет» тяжело, поэтому даже +1 в слабой сфере часто ощущается сильнее, чем +1 в сильной.`) : h('p', 'Сферы довольно ровные — перекосов, которые сильно мешали бы, нет.'), h('p.muted', 'Какое одно маленькое действие на этой неделе могло бы добавить хотя бы один балл самой низкой сфере?')),
      change,
      disclaimer(t.source)];
  }

  // ---------- result: BMI ----------
  function bmiParts(t, bmi, hgtCm) {
    const lv = H.testLevel(t, bmi);
    const hm = Number(hgtCm) / 100;
    const pct = H.clamp((bmi - 14) / (40 - 14) * 100, 0, 100);
    const lo = Math.round(18.5 * hm * hm * 10) / 10, hi = Math.round(24.9 * hm * hm * 10) / 10;
    return [
      h('div.row', { style: { alignItems: 'flex-end', gap: '14px', marginTop: '18px' } }, h('div.result-score', fmt(bmi)), h('div.muted', { style: { paddingBottom: '6px' } }, 'кг/м²')),
      h('h3', { style: { margin: '10px 0 4px' } }, lv.name),
      h('div.gauge.bmi-gauge', h('i.gm', { style: { left: pct + '%' } })),
      h('div.row', { style: { justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--text-3)' } }, h('span', '14'), h('span', '18,5'), h('span', '25'), h('span', '30'), h('span', '40')),
      h('p', { style: { marginTop: '10px' } }, lv.t),
      paras(lv.more),
      hm ? h('p.muted', { style: { fontSize: '.88rem' } }, `При твоём росте нормальный по ИМТ диапазон веса — примерно ${fmt(lo)}–${fmt(hi)} кг.`) : null,
    ];
  }

  function resultView(t, rec, hist) {
    hist = hist || histOf(t);
    if (t.kind === 'type') return typeResult(t, rec);
    if (t.kind === 'profile') return profileResult(t, rec, hist);
    if (t.kind === 'wheel') return wheelResult(t, rec, hist);
    if (t.kind === 'bmi') return [bmiParts(t, rec.score, (rec.answers || [])[0]), disclaimer(t.source)];
    return scoredResult(t, rec, hist);
  }
  function animateGauges(root) {
    root.querySelectorAll('.tr-gauge .gm').forEach(gm => setTimeout(() => { gm.style.left = gm.dataset.pct + '%'; }, 80));
  }
  function openResult(t, rec) {
    const body = h('div.tr', resultView(t, rec, histOf(t)));
    ui.modal(`${t.name} · ${H.fmtLongY(rec.date)}`, body, { wide: true, cls: 'tr-modal' });
    animateGauges(body);
  }

  // ---------- questionnaire runner (scored, type, profile) ----------
  function questions(test) {
    if (test.kind === 'type') return test.qs.map(q => ({ q: q.q, opts: q.o.map(([t, v]) => ({ t, v })) }));
    if (test.kind === 'profile') return test.items.map(it => ({ q: it.t, opts: test.opts, scale: true }));
    return test.qs.map(q => ({ q, opts: test.opts }));
  }
  function buildRecord(test, answers) {
    if (test.kind === 'type') {
      const keys = Object.keys(test.types), cnt = {};
      keys.forEach(k => cnt[k] = 0); answers.forEach(a => cnt[a]++);
      return { answers, type: keys.slice().sort((a, b) => cnt[b] - cnt[a])[0], score: 0 };
    }
    if (test.kind === 'profile') {
      const P = H.testProfile(test, answers);
      if (test.mode === 'total') return { answers, dims: P.dims, score: Math.round(P.total * 10) / 10, type: P.ranked[0] };
      if (test.mode === 'quad') return { answers, dims: P.dims, score: 0, type: H.testAttachStyle(P.dims) };
      return { answers, dims: P.dims, score: P.dims[P.ranked[0]], type: P.ranked[0] };
    }
    return { answers, score: H.testScore(test, answers) };
  }

  function runTest(test, onDone) {
    if (test.kind === 'bmi') return runBmi(test, onDone);
    if (test.kind === 'wheel') return runWheel(test, onDone);
    const qs = questions(test);
    const answers = Array(qs.length).fill(null);
    let i = 0, busy = false;
    const body = h('div');
    const onKey = e => {
      if (i >= qs.length || busy || e.ctrlKey || e.altKey || e.metaKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= qs[i].opts.length) pick(qs[i].opts[n - 1].v, body.querySelectorAll('.q-opt')[n - 1]);
    };
    const md = ui.modal(test.name, body, { wide: true, cls: 'tr-modal', onClose: () => document.removeEventListener('keydown', onKey) });
    document.addEventListener('keydown', onKey);
    const pick = (v, btn) => {
      if (busy) return; busy = true;
      answers[i] = v; if (btn) btn.classList.add('on');
      setTimeout(() => { i++; busy = false; draw(); }, 220);
    };
    const draw = () => {
      H.clear(body);
      if (i >= qs.length) return result();
      const q = qs[i];
      H.append(body, [
        h('div.q-progress', h('i', { style: { width: (i / qs.length * 100) + '%' } })),
        h('div.q-head', `${test.head} · вопрос ${i + 1} из ${qs.length}`),
        h('div.q-text', q.q),
        h('div.q-opts' + (q.scale ? '.q-scale' : ''), q.opts.map((o, k) => h('button.q-opt' + (answers[i] === o.v ? '.on' : ''), { style: { animationDelay: (k * 40) + 'ms' }, onclick: e => pick(o.v, e.currentTarget) },
          q.scale ? [h('b', String(k + 1)), h('span', o.t)] : o.t))),
        h('div.row.q-foot', i > 0 ? h('button.btn.ghost.small', { onclick: () => { i--; draw(); } }, '← Назад') : h('span'),
          h('span.q-hint', `можно отвечать клавишами 1–${q.opts.length}`))]);
    };
    const result = () => {
      document.removeEventListener('keydown', onKey);
      const rec = save(test, buildRecord(test, answers));
      body.classList.add('tr');
      H.append(body, [resultView(test, rec, histOf(test)),
        h('div.tr-actions',
          h('button.btn.ghost', { onclick: () => { md.close(); setTimeout(() => runTest(test, onDone), 280); } }, 'Пройти ещё раз'),
          h('button.btn.primary', { onclick: () => md.close() }, 'Готово'))]);
      if (md.body) md.body.scrollTop = 0;
      animateGauges(body);
      onDone && onDone();
    };
    draw();
  }

  // ---------- BMI ----------
  function runBmi(test, onDone) {
    const p = S().profile;
    let hgt = p.height || '', wgt = (p.weightLog || []).slice(-1)[0]?.kg || '';
    const out = h('div');
    const calc = () => {
      H.clear(out);
      const hm = Number(hgt) / 100, w = Number(wgt);
      if (!hm || !w || hm < 1 || hm > 2.3 || w < 25 || w > 300) { out.appendChild(h('p.faint', 'Введи рост в сантиметрах и вес в килограммах.')); return null; }
      const bmi = Math.round(w / (hm * hm) * 10) / 10;
      H.append(out, bmiParts(test, bmi, hgt));
      return bmi;
    };
    const body = h('div',
      h('div.grid2', ui.field('Рост', ui.unitInput(hgt, v => { hgt = v; calc(); }, 'см')), ui.field('Вес', ui.unitInput(wgt, v => { wgt = v; calc(); }, 'кг'))),
      out, h('div.disclaimer', test.source));
    calc();
    const md = ui.modal(test.name, body, {
      wide: true, actions: [h('button.btn.ghost', { onclick: () => md.close() }, 'Закрыть'), h('button.btn.primary', {
        onclick: () => { const b = calc(); if (!b) return; save(test, { score: b, answers: [Number(hgt), Number(wgt)] }); if (!p.height) p.height = hgt; ui.toast('Результат сохранён'); md.close(); onDone && onDone(); },
      }, 'Сохранить результат')],
    });
  }

  // ---------- balance wheel ----------
  function runWheel(test, onDone) {
    const vals = test.areas.map(() => 5);
    const pic = h('div.wheel-host');
    const redraw = () => { H.clear(pic); pic.appendChild(wheelSvg(test.areas, vals)); };
    redraw();
    const body = h('div.wheel-wrap',
      h('div', test.areas.map((a, i) => h('div.srow', h('div.s-name', a), ui.slider({ value: 5, allowClear: false, mode: 'good', onChange: v => { vals[i] = v; redraw(); } })))),
      pic);
    const md = ui.modal(test.name, body, {
      wide: true, actions: [h('button.btn.ghost', { onclick: () => md.close() }, 'Закрыть'), h('button.btn.primary', {
        onclick: () => {
          const rec = save(test, { score: vals.reduce((a, b) => a + b, 0), answers: vals.slice() });
          md.close(); setTimeout(() => openResult(test, rec), 260); onDone && onDone();
        },
      }, 'Готово')],
    });
  }

  // ---------- list view ----------
  function metaOf(t) {
    if (t.kind === 'bmi') return 'калькулятор · 1 мин';
    if (t.kind === 'wheel') return `${t.areas.length} сфер · ${t.mins || 2} мин`;
    const n = t.kind === 'profile' ? t.items.length : t.qs.length;
    return `${pl(n, 'вопрос', 'вопроса', 'вопросов')} · ~${t.mins || Math.max(1, Math.round(n / 4))} мин`;
  }
  function card(t, k, redraw) {
    const hist = histOf(t);
    const last = hist[hist.length - 1];
    return h('div.glass.test-card.sheen', { style: { animation: `blockIn .6s ${k * 50}ms var(--ease) both` } },
      h('div.tc-top', H.gicon(t.ico, 22, 'lg'), h('div.tc-tags', t.isNew && !last ? h('span.tc-badge.new', 'новое') : null, h('span.tc-badge', metaOf(t)))),
      h('h3', t.name), h('p', t.desc),
      last ? h('div.tc-last', h('span.muted', `${H.fmtLong(last.date)}: `), h('b', label(t, last))) : null,
      hist.length >= 2 && trackable(t) ? H.charts.sparkline(hist.map(x => x.score)) : null,
      h('div.tc-foot',
        h('button.btn.primary.small', { onclick: () => runTest(t, redraw) }, last ? 'Пройти снова' : (t.kind === 'bmi' ? 'Рассчитать' : 'Пройти тест')),
        last ? h('button.btn.ghost.small', { onclick: () => openResult(t, last) }, 'Результат') : null,
        hist.length ? h('button.btn.ghost.small', { onclick: () => history(t, hist, redraw) }, `История (${hist.length})`) : null));
  }

  H.views.tests = function (root) {
    const wrap = h('div');
    const groups = H.TEST_GROUPS || [{ id: 'all', name: 'Все тесты', ico: 'clipboard', sub: '' }];
    const groupOf = t => t.group || (t.cat === 'med' ? 'mood' : 'self');
    const draw = () => {
      H.clear(wrap);
      groups.forEach(g => {
        const tests = H.TESTS.filter(t => g.id === 'all' || groupOf(t) === g.id);
        if (!tests.length) return;
        const grid = h('div.test-grid');
        tests.forEach((t, k) => grid.appendChild(card(t, k, draw)));
        wrap.append(h('div.test-sec.tg-head', { id: 'tg-' + g.id }, H.gicon(g.ico, 18), h('div', h('h2', g.name, h('span.tg-count', String(tests.length))), h('div.sub', g.sub))), grid);
      });
    };
    draw();
    const done = S().tests.length;
    root.appendChild(h('div.wrap',
      h('div.view-head', h('div', h('h1', 'Тесты'), h('div.sub', `За каждый пройденный тест +25 кристаллов (один раз в день на тест)${done ? ` · пройдено: ${done}` : ''}`))),
      h('div.tg-nav', groups.map(g => ui.chip(g.name, false, () => { const el = wrap.querySelector('#tg-' + g.id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }))),
      wrap,
      h('p.faint', { style: { fontSize: '.8rem', marginTop: '22px', maxWidth: '760px' } }, 'Тесты помогают заметить проблему, лучше понять себя и отслеживать динамику, но не ставят диагноз и не навешивают ярлыков. Если результат тебя беспокоит — покажи его врачу.')));
  };

  // ---------- history ----------
  function history(t, hist, onChange) {
    const listEl = h('div');
    const drawL = () => {
      H.clear(listEl);
      hist.slice().reverse().forEach(x => {
        listEl.appendChild(h('div.list-item.tr-hist', { onclick: () => openResult(t, x), title: 'Открыть результат' },
          h('div.li-main', h('div.li-t', label(t, x)), h('div.li-s', H.fmtLongY(x.date))),
          h('span.tr-open', 'открыть'),
          h('button.icon-btn', { title: 'Удалить', onclick: async e => { e.stopPropagation(); if (await ui.confirm('Удалить этот результат?', 'Удалить', true)) { const s = S(); s.tests = s.tests.filter(y => y.id !== x.id); hist.splice(hist.indexOf(x), 1); H.store.save(); drawL(); onChange(); } } }, H.icon('x', 16))));
      });
    };
    drawL();
    let chart = null;
    if (hist.length >= 2) {
      if (t.kind === 'profile' && t.mode === 'total') chart = H.charts.lineChart({ dates: hist.map(x => x.date), series: [{ name: 'Самосострадание', values: hist.map(x => x.score) }], yMin: 1, yMax: 5, yTicks: [1, 2, 3, 4, 5], height: 180 });
      else if (t.kind === 'profile' && (t.order || Object.keys(t.dims)).length <= 5) {
        const keys = t.order || Object.keys(t.dims);
        chart = H.charts.lineChart({ dates: hist.map(x => x.date), series: keys.map(k => ({ name: t.dims[k].name, color: `hsl(${t.dims[k].hue}, 60%, 66%)`, values: hist.map(x => x.dims ? x.dims[k] : null), unit: '%' })), yMin: 0, yMax: 100, yTicks: [0, 50, 100], height: 200 });
      } else if (trackable(t)) chart = H.charts.lineChart({ dates: hist.map(x => x.date), series: [{ name: t.kind === 'bmi' ? 'ИМТ' : 'Балл', values: hist.map(x => x.score) }], yMin: 0, yMax: t.max, yTicks: [0, Math.round(t.max / 2), t.max], height: 180 });
    }
    ui.modal('История: ' + t.name, h('div', chart ? h('div', { style: { marginBottom: '14px' } }, chart) : null, h('p.faint', { style: { fontSize: '.8rem', margin: '0 0 8px' } }, 'Нажми на результат, чтобы открыть его подробно.'), listEl), { wide: true });
  }

  H.testLabel = label;
  H.testResultView = resultView;
})(window.H);
