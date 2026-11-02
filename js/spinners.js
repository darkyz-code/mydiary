'use strict';
/* Free spinners: "чем заняться" and "что приготовить" */
(function (H) {
  const { h, ui } = H;

  const IDEA_CATS = {
    rest: { name: 'Отдых', ic: 'moon' }, care: { name: 'Забота о себе', ic: 'heart' }, create: { name: 'Творчество', ic: 'feather' },
    move: { name: 'Движение', ic: 'bolt' }, social: { name: 'Общение', ic: 'mind' }, home: { name: 'Уют', ic: 'home' },
    new: { name: 'Что-то новое', ic: 'compass' }, mind: { name: 'Для головы', ic: 'book' },
  };
  // [text, category, energy 1..3]
  const IDEAS = [
    ['Полежать 15 минут под любимый альбом, ничего не делая', 'rest', 1], ['Посмотреть один эпизод уютного сериала', 'rest', 1], ['Подремать 20 минут', 'rest', 1],
    ['Завернуться в плед с горячим чаем', 'rest', 1], ['Послушать подкаст или аудиокнигу с закрытыми глазами', 'rest', 1], ['Посмотреть на облака или на огни из окна', 'rest', 1],
    ['Пересмотреть любимый фильм детства', 'rest', 1], ['Собрать пазл или раскраску-антистресс', 'rest', 2], ['Сделать «день без телефона» на час', 'rest', 1],
    ['Тёплый душ или ванна с пеной', 'care', 1], ['Сделать маску для лица', 'care', 1], ['Намазать руки кремом и сделать массаж ладоней', 'care', 1],
    ['Выпить большой стакан воды и съесть фрукт', 'care', 1], ['Заварить новый вкус чая', 'care', 1], ['Лечь спать на час раньше', 'care', 1],
    ['Сменить постельное бельё на свежее', 'care', 2], ['Приготовить себе красивый завтрак', 'care', 2], ['Сделать маникюр', 'care', 2],
    ['Записать 3 вещи, за которые себе благодарна', 'care', 1], ['Выключить уведомления на вечер', 'care', 1],
    ['Нарисовать что угодно за 10 минут', 'create', 1], ['Собрать мудборд настроения', 'create', 1], ['Написать короткое письмо себе через год', 'create', 1],
    ['Сделать плейлист под своё настроение', 'create', 1], ['Сфотографировать 5 красивых мелочей вокруг', 'create', 2], ['Придумать и записать маленький рассказ', 'create', 2],
    ['Испечь что-то простое', 'create', 2], ['Сделать коллаж из старых журналов', 'create', 2], ['Попробовать акварель по видеоуроку', 'create', 2],
    ['Перекрасить или украсить старую вещь', 'create', 3], ['Записать голосовую заметку с мыслями вслух', 'create', 1],
    ['Растяжка 10 минут под спокойную музыку', 'move', 1], ['Короткая прогулка вокруг дома', 'move', 1], ['Потанцевать под одну любимую песню', 'move', 1],
    ['Прогулка 30 минут при дневном свете', 'move', 2], ['Йога для начинающих по видео', 'move', 2], ['Дойти до кофейни пешком', 'move', 2],
    ['Покататься на велосипеде или самокате', 'move', 3], ['Сходить в бассейн', 'move', 3], ['Длинная прогулка по новому маршруту', 'move', 3],
    ['Написать подруге «думаю о тебе»', 'social', 1], ['Отправить смешной мем близкому человеку', 'social', 1], ['Позвонить маме или бабушке', 'social', 1],
    ['Позвать подругу на кофе', 'social', 2], ['Созвониться по видео с кем-то, кого давно не видела', 'social', 2], ['Поиграть с кем-нибудь в онлайн-игру', 'social', 2],
    ['Сходить в гости или позвать к себе', 'social', 3], ['Записаться с подругой на мастер-класс', 'social', 3],
    ['Зажечь свечу и приглушить свет', 'home', 1], ['Разобрать одну полку', 'home', 1], ['Поставить цветы или ветку в вазу', 'home', 1],
    ['Переставить что-то в комнате', 'home', 2], ['Навести порядок на рабочем столе компьютера', 'home', 1], ['Приготовить большую кастрюлю супа на несколько дней', 'home', 2],
    ['Постирать и красиво сложить любимые вещи', 'home', 2], ['Устроить генеральную уборку под музыку', 'home', 3],
    ['Попробовать блюдо новой кухни', 'new', 2], ['Сходить в музей или на выставку', 'new', 3], ['Выучить 10 слов на новом языке', 'new', 1],
    ['Посмотреть документальный фильм о космосе', 'new', 1], ['Заглянуть в магазин, где ещё не была', 'new', 2], ['Попробовать новую дорогу домой', 'new', 2],
    ['Найти и прочитать статью о том, что давно интересно', 'new', 1], ['Записаться на пробное занятие (танцы, керамика, вокал)', 'new', 3],
    ['Прочитать 10 страниц книги', 'mind', 1], ['Решить кроссворд или судоку', 'mind', 1], ['Медитация 5 минут', 'mind', 1],
    ['Дыхательная практика из «Мини-игр»', 'mind', 1], ['Написать в дневник, что сейчас чувствуешь', 'mind', 1], ['Составить список «маленьких радостей»', 'mind', 1],
    ['Спланировать что-то приятное на выходные', 'mind', 1], ['Пройти тест «Колесо баланса»', 'mind', 1], ['Посмотреть лекцию на интересную тему', 'mind', 2],
  ].map(([t, c, e], i) => ({ id: 'i' + i, t, c, e }));

  // ---------- reel (vertical slot) ----------
  // Items are blurred while spinning and stay hidden after the stop — only the prize is revealed.
  function reel(items, prize, render, onDone) {
    const N = 34, WIN = 30, CH = 92;
    const list = Array.from({ length: N }, (_, i) => i === WIN ? prize : items[Math.floor(Math.random() * items.length)]);
    const strip = h('div.reel-strip', list.map(it => h('div.reel-item', h('div.ri-wrap', render(it)))));
    const win = h('div.reel-win.spinning', strip, h('div.reel-mark'));
    requestAnimationFrame(() => {
      const H0 = win.clientHeight;
      const target = WIN * CH + CH / 2 - H0 / 2;
      strip.style.transform = 'translateY(0)'; void strip.offsetWidth;
      const dur = document.documentElement.classList.contains('no-anim') ? .01 : 3.6;
      strip.style.transition = `transform ${dur}s cubic-bezier(.12,.7,.1,1)`;
      strip.style.transform = `translateY(${-target}px)`;
      let last = -1, raf;
      const loop = () => { const m = new DOMMatrixReadOnly(getComputedStyle(strip).transform); const idx = Math.floor((-m.m42 + H0 / 2) / CH); if (idx !== last) { last = idx; tick(); } raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
      strip.addEventListener('transitionend', () => { cancelAnimationFrame(raf); win.classList.remove('spinning'); strip.children[WIN].classList.add('won'); win.classList.add('done'); onDone && onDone(); }, { once: true });
    });
    return win;
  }
  // closed reel shown before the first spin / after switching group
  function idleReel(text) {
    return h('div.reel-win.idle', h('div.reel-strip', [0, 1, 2].map(i => h('div.reel-item' + (i === 1 ? '.won' : ''), h('div.ri-wrap', H.gicon('dice', 18), h('div', h('div.ri-t', i === 1 ? text : '? ? ?'), h('div.ri-s', i === 1 ? 'нажми «Крутить»' : '· · ·')))))), h('div.reel-mark'));
  }
  let actx;
  function tick() {
    if (H.store.get().settings.gameSound === false) return;
    try { actx = actx || new AudioContext(); const o = actx.createOscillator(), g = actx.createGain(); o.type = 'triangle'; o.frequency.value = 1700; g.gain.setValueAtTime(.03, actx.currentTime); g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + .03); o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + .05); } catch (e) {}
  }
  const cap = t => h('div.faint', { style: { fontSize: '.72rem', letterSpacing: '.14em', textTransform: 'uppercase' } }, t);

  // ---------- ideas ----------
  function ideasView(host) {
    const G = () => { const g = H.store.get().game; g.ideaPlans = g.ideaPlans || []; return g; };
    let energy = 1, spinning = false, token = 0;
    const stage = h('div.spin-stage');
    const result = h('div.spin-res');
    const plansHost = h('div');
    const reset = () => { token++; spinning = false; H.clear(stage); H.clear(result); stage.appendChild(idleReel('Что выпадет?')); };
    const drawPlans = () => {
      H.clear(plansHost);
      const g = G();
      const open = g.ideaPlans.filter(p => !p.done);
      const done = g.ideaPlans.filter(p => p.done).slice(-20).reverse();
      if (!open.length && !done.length) return;
      plansHost.appendChild(h('div.idea-plans',
        h('div.sub-title', 'Мои планы'),
        open.length ? open.map(p => h('div.plan-item',
          h('button.plan-check', { title: 'Сделала', onclick: () => { p.done = true; p.doneAt = Date.now(); H.store.save(); H.game.award('idea:' + H.today(), 10, 'идея выполнена'); ui.toast('Отлично! Отмечено', '✓'); drawPlans(); } }),
          h('div.plan-main', h('div.plan-t', p.t), h('div.plan-s', (IDEA_CATS[p.c] || {}).name + ' · запланировано ' + H.fmtShort(p.date))),
          h('button.icon-btn.small', { title: 'Убрать', onclick: () => { g.ideaPlans = g.ideaPlans.filter(x => x !== p); H.store.save(); drawPlans(); } }, '✕'))) : h('p.muted', { style: { fontSize: '.84rem' } }, 'Всё запланированное выполнено.'),
        done.length ? h('details.coupon-archive', h('summary', `Сделано (${done.length})`), done.map(p => h('div.arch-item', h('span', p.t), h('span.faint', p.doneAt ? H.fmtShort(H.iso(new Date(p.doneAt))) : ''))),
          h('button.btn.small.ghost', { style: { marginTop: '8px' }, onclick: () => { g.ideaPlans = g.ideaPlans.filter(x => !x.done); H.store.save(); drawPlans(); } }, 'Очистить')) : null));
    };
    const spin = () => {
      if (spinning) return;
      spinning = true; const my = ++token;
      const pool = IDEAS.filter(x => x.e <= energy);
      const prize = pool[Math.floor(Math.random() * pool.length)];
      H.clear(stage); H.clear(result);
      stage.appendChild(reel(pool, prize, it => [H.gicon(IDEA_CATS[it.c].ic, 18), h('div', h('div.ri-t', it.t), h('div.ri-s', IDEA_CATS[it.c].name))], () => {
        if (my !== token) return;
        spinning = false;
        H.append(result, [h('div.res-idea.reveal', cap('Предложение'), h('div.res-idea-t', prize.t)),
          h('div.row', { style: { gap: '10px', justifyContent: 'center', flexWrap: 'wrap' } },
            h('button.btn', { onclick: spin }, H.icon('reset', 16), 'Другое'),
            h('button.btn', { onclick: () => { const g = G(); if (!g.ideaPlans.some(p => !p.done && p.t === prize.t)) g.ideaPlans.push({ id: H.uid(), t: prize.t, c: prize.c, date: H.today(), done: false }); H.store.save(); ui.toast('Добавлено в «Мои планы»', '✓'); drawPlans(); } }, H.icon('calendar', 16), 'Сделаю'),
            h('button.btn.primary', { onclick: () => { H.game.award('idea:' + H.today(), 10, 'идея выполнена'); ui.toast('Отлично! Отмечено', '✓'); } }, H.icon('check', 16), 'Сделала'))]);
      }));
    };
    reset(); drawPlans();
    host.appendChild(h('div.glass.card.spinner-card',
      h('div.card-title', H.gicon('dice', 17, 'sm'), h('h3', 'Чем заняться'), h('span.badge', { style: { marginLeft: 'auto' } }, 'бесплатно')),
      h('p.muted', { style: { fontSize: '.88rem' } }, 'Когда не знаешь, за что взяться, — пусть решит крутка. Выбери, сколько сейчас сил.'),
      h('div.row.wrapr', { style: { gap: '12px', margin: '6px 0 18px' } }, ui.segmented([{ id: 1, name: 'Почти нет сил' }, { id: 2, name: 'Немного есть' }, { id: 3, name: 'Есть энергия' }].map(x => ({ ...x, toggleOff: false })), energy, v => { energy = v; reset(); }),
        h('button.btn.primary', { onclick: spin }, H.icon('dice', 16), 'Крутить')),
      stage, result, plansHost,
      h('p.faint', { style: { fontSize: '.76rem', margin: '14px 0 0' } }, `В крутке ${IDEAS.length} идей. «Сделаю» — добавить в планы, «Сделала» — +10 кристаллов один раз в день.`)));
  }

  // ---------- food ----------
  function recipeModal(d) {
    const cat = H.FOOD.CATS.find(c => c.id === d.c);
    const body = h('div.recipe',
      h('div.recipe-hero',
        h('div.recipe-art', H.dishArt(d, 170)),
        h('div',
          h('div.row.wrapr', { style: { gap: '8px', marginBottom: '10px' } },
            h('span.badge', cat ? cat.name : ''), h('span.badge', H.icon('clock', 13), ` ~${d.t} мин`), d.serv ? h('span.badge', `${d.serv} ${H.plural(d.serv, 'порция', 'порции', 'порций')}`) : null, d.iron ? h('span.badge.iron', H.icon('drop', 13), ' богато железом') : null),
          d.serve ? h('p.recipe-serve', d.serve) : null,
          h('p.faint', { style: { fontSize: '.72rem', margin: '8px 0 0' } }, 'Иллюстрация нарисована приложением — это не фото.'))),
      d.parts.map(p => h('div.recipe-part',
        p.title ? h('h4', p.title) : null,
        h('div.recipe-cols',
          h('div', h('div.sub-title', 'Ингредиенты'), h('ul.ing', p.ing.map(x => h('li', x)))),
          h('div', h('div.sub-title', 'Как готовить'), h('ol.steps', p.st.map(x => h('li', x))))),
        p.tips && p.tips.length ? h('div.recipe-tips', h('div.sub-title', 'Тонкости'), p.tips.map(t => h('div.tip-line', H.icon('sparkle', 13), h('span', t)))) : null)),
      d.iron ? h('p.faint', { style: { fontSize: '.8rem', marginTop: '12px' } }, 'Чтобы железо из еды усвоилось лучше, добавь к блюду что-то с витамином C (овощи, зелень, цитрусовые) и не запивай чаем или кофе сразу.') : null);
    ui.modal(d.n, body, { wide: true, cls: 'recipe-modal' });
  }
  function foodView(host) {
    const dishes = H.FOOD.allDishes();
    const st = H.store.get().settings;
    st.foodSeen = st.foodSeen || [];
    let cat = 'main', spinning = false, token = 0;
    const stage = h('div.spin-stage');
    const result = h('div.spin-res');
    const book = h('div');
    const icon = it => it.c === 'dessert' ? 'star' : it.c === 'soup' ? 'drop' : it.c === 'breakfast' ? 'sun' : it.c === 'salad' ? 'leaf' : it.c === 'snack' ? 'sparkle' : 'fire';
    const reset = () => { token++; spinning = false; H.clear(stage); H.clear(result); stage.appendChild(idleReel('Что приготовим?')); };
    const drawBook = () => {
      H.clear(book);
      const seen = dishes.filter(d => st.foodSeen.includes(d.id));
      if (!seen.length) return;
      book.appendChild(h('details.dish-list', h('summary', `Моя книга рецептов — уже выпадало ${seen.length} из ${dishes.length}`),
        h('div.book-grid', seen.map(d => h('button.book-item', { onclick: () => recipeModal(d) }, H.dishArt(d, 54), h('span', d.n))))));
    };
    const spin = () => {
      if (spinning) return;
      spinning = true; const my = ++token;
      const pool = cat === 'any' ? dishes : dishes.filter(d => d.c === cat);
      const prize = pool[Math.floor(Math.random() * pool.length)];
      H.clear(stage); H.clear(result);
      stage.appendChild(reel(pool, prize, it => [H.gicon(icon(it), 18), h('div', h('div.ri-t', it.n), h('div.ri-s', `~${it.t} мин${it.iron ? ' · железо' : ''}`))], () => {
        if (my !== token) return;
        spinning = false;
        if (!st.foodSeen.includes(prize.id)) { st.foodSeen.push(prize.id); H.store.save(); }
        H.append(result, [h('button.res-dish.reveal', { onclick: () => recipeModal(prize) }, H.dishArt(prize, 96), h('div', { style: { flex: 1 } }, cap('Сегодня готовим'), h('div.res-idea-t', prize.n), h('div.ri-s', { style: { marginTop: '4px' } }, `~${prize.t} мин${prize.iron ? ' · богато железом' : ''} · нажми, чтобы открыть рецепт`)), H.icon('arrow', 22)),
          h('div.row', { style: { gap: '10px', justifyContent: 'center' } }, h('button.btn', { onclick: spin }, H.icon('reset', 16), 'Крутить ещё'), h('button.btn.primary', { onclick: () => recipeModal(prize) }, H.icon('book', 16), 'Рецепт'))]);
        drawBook();
      }));
    };
    reset(); drawBook();
    host.appendChild(h('div.glass.card.spinner-card',
      h('div.card-title', H.gicon('fire', 17, 'sm'), h('h3', 'Что приготовить'), h('span.badge', { style: { marginLeft: 'auto' } }, `${dishes.length} блюд · бесплатно`)),
      h('p.muted', { style: { fontSize: '.88rem' } }, 'Выбери категорию и крути сколько угодно. Что внутри — не видно, пока не выпадет. Выпавшие блюда собираются в твою книгу рецептов.'),
      h('div.row.wrapr', { style: { gap: '12px', margin: '6px 0 18px' } },
        ui.segmented(H.FOOD.CATS.map(c => ({ id: c.id, name: c.name, toggleOff: false })).concat([{ id: 'any', name: 'Любое', toggleOff: false }]), cat, v => { cat = v; reset(); }),
        h('button.btn.primary', { onclick: spin }, H.icon('dice', 16), 'Крутить')),
      stage, result, book));
  }

  H.spinners = { ideasView, foodView, recipeModal, IDEAS };
})(window.H);
