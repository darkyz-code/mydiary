'use strict';
/* Crystals economy + case loot tables */
(function (H) {
  const RAR = {
    common: { name: 'Обычный', color: '#b8c0cc', w: 55 },
    rare: { name: 'Редкий', color: '#4b8bff', w: 26 },
    epic: { name: 'Эпический', color: '#a35bff', w: 12.5 },
    legendary: { name: 'Легендарный', color: '#f0b545', w: 5 },
    mythic: { name: 'Мифический', color: '#ff4f7b', w: 1.5 },
  };
  const ORDER = ['common', 'rare', 'epic', 'legendary', 'mythic'];

  // relics: crystals [id, name, rarity, colorA, colorB, shape, lore]
  const GEMS = [
    ['quartz', 'Горный хрусталь', 'common', '#ffffff', '#b4bfd1', 'brilliant', 'Чистый, как утро после долгого сна. Говорят, проясняет мысли.'],
    ['moon', 'Лунный камень', 'common', '#f2f5ff', '#9fb2d8', 'cab:moon', 'Светится мягче всего в полнолуние. Бережёт тихие сны.'],
    ['rose', 'Розовый кварц', 'common', '#ffe3ec', '#e08aa8', 'oval', 'Камень нежности к себе. Тёплый, даже когда вокруг холодно.'],
    ['smoky', 'Дымчатый кварц', 'common', '#e2d6c8', '#5e5249', 'prism', 'Забирает тревогу, как туман — очертания города.'],
    ['citrine', 'Цитрин рассвета', 'common', '#fff3c2', '#e39a12', 'pear', 'Хранит первый луч утра. Рядом с ним легче проснуться.'],
    ['amethyst', 'Аметистовая друза', 'rare', '#efdcff', '#7b46c9', 'cluster', 'Хранитель спокойствия. Её клали у изголовья от беспокойных мыслей.'],
    ['labra', 'Лабрадорит', 'rare', '#7d8ea8', '#161c28', 'cab:labra', 'В его глубине — северное сияние. Видно только под правильным углом.'],
    ['emerald', 'Изумруд тихого сада', 'rare', '#c4ffe2', '#0d7a50', 'emerald', 'Пахнет мокрой травой после дождя. Успокаивает взгляд и сердце.'],
    ['aqua', 'Аквамарин', 'rare', '#e6fbff', '#38afd6', 'princess', 'Кусочек моря, который поместился в ладони. Смывает всё лишнее.'],
    ['opal', 'Чёрный опал', 'epic', '#3a5596', '#080c1c', 'cab:opal', 'Каждый оттенок — отдельное настроение. И все они настоящие.'],
    ['sapphire', 'Звёздный сапфир', 'epic', '#7d9cff', '#14257a', 'cab:star', 'Внутри прячется шестилучевая звезда. Освещает дорогу домой.'],
    ['tourm', 'Арбузный турмалин', 'epic', '#ff9ec4', '#c2185b', 'prism:melon', 'Розовое сердце в зелёной кожуре. Напоминает, что мягкость живёт внутри.'],
    ['ruby', 'Кровавая луна', 'legendary', '#ff8a9c', '#8e0a2a', 'round', 'Появляется раз в несколько лет. Говорят, исполняет одно тихое желание.'],
    ['midnight', 'Кристалл полуночи', 'legendary', '#8d9bff', '#0d1030', 'octa:night', 'Выращен в темноте собора. Светит только тем, кто долго шёл через ночь.'],
    ['alex', 'Александрит', 'legendary', '#d29bff', '#5a1f7a', 'marquise:shift', 'Днём — зелёный, ночью — фиолетовый. Умеет меняться и оставаться собой.'],
    ['heart', 'Сердце звезды', 'mythic', '#fff2f8', '#ff6fa8', 'heart:prism', 'Осколок звезды, огранённый в форме сердца. Светится, когда ты себя бережёшь.'],
  ];
  // relics: artifacts [id, name, rarity, art, color, lore]
  const ARTIFACTS = [
    ['candle', 'Свеча хранительницы', 'common', 'candle', '#ffc874', 'Её пламя не гаснет на сквозняке. Зажигают, когда нужно немного тепла.'],
    ['feather', 'Серебряное перо', 'common', 'feather', '#b9c8e6', 'Упало с крыла ночной птицы. Пишет только правду о себе.'],
    ['bell', 'Колокольчик ясного утра', 'common', 'bell', '#9fd8ff', 'Звенит тихо, только для тебя. Возвращает в «здесь и сейчас».'],
    ['key', 'Ключ от тихой комнаты', 'rare', 'key', '#b9a6ff', 'Открывает место, где можно ничего не делать — и это нормально.'],
    ['mirror', 'Зеркало ясности', 'rare', 'mirror', '#9fd4ff', 'Показывает тебя без чужих оценок. Только свет и очертания.'],
    ['pendant', 'Лунный медальон', 'rare', 'pendant', '#dfe8ff', 'Меняет форму вместе с луной и напоминает: всё циклично.'],
    ['compass', 'Компас внутреннего севера', 'rare', 'compass', '#6fffc8', 'Стрелка указывает не на север, а туда, где тебе спокойно.'],
    ['vial', 'Флакон звёздной росы', 'rare', 'vial', '#8fb0ff', 'Роса, собранная со звёзд перед рассветом. Одна капля — и усталость отступает.'],
    ['hourglass', 'Песочные часы терпения', 'epic', 'hourglass', '#ffd48a', 'Песок в них течёт ровно так быстро, как нужно именно тебе.'],
    ['lantern', 'Фонарь проводника', 'epic', 'lantern', '#8affc9', 'Светит на один шаг вперёд. Этого всегда достаточно.'],
    ['rosec', 'Хрустальная роза', 'epic', 'rose', '#ffb3cf', 'Не вянет. Выросла из слёз, которые однажды стали легче.'],
    ['butterfly', 'Брошь «Ночной мотылёк»', 'epic', 'butterfly', '#5f9dff', 'Серебряные крылья, усыпанные инеем. Напоминает: перемены — это красиво.'],
    ['chalice', 'Чаша тихой воды', 'epic', 'chalice', '#8ff0ff', 'Вода в ней никогда не волнуется. Глоток тишины в шумный день.'],
    ['ring', 'Кольцо обещания себе', 'legendary', 'ring', '#9db8ff', 'Надевают, когда дают себе слово быть бережнее.'],
    ['grimoire', 'Гримуар снов', 'legendary', 'book', '#b58aff', 'Каждую ночь в нём появляется новая страница. Ни одна не повторяется.'],
    ['orb', 'Небесная сфера', 'legendary', 'orb', '#8f7bff', 'Внутри вращается целое небо. Все твои звёзды на своих местах.'],
    ['crown', 'Корона полуночи', 'mythic', 'crown:silver', '#c9d2ff', 'Принадлежит той, кто пережила самую длинную ночь и встретила рассвет.'],
    ['star', 'Упавшая звезда', 'mythic', 'star', '#ffe9a0', 'Её поймали ладонями в августе. До сих пор тёплая.'],
    ['phoenix', 'Перо феникса', 'mythic', 'phoenix', '#ff8a4a', 'Горит, но не сгорает. Достаётся тем, кто поднимался снова и снова.'],
  ];
  const ACCENT_ITEMS = [
    ['acc_rosegold', 'Цвет «Розовое золото»', 'rare', '#e7b4a6'],
    ['acc_sapphire', 'Цвет «Холодный сапфир»', 'rare', '#7aa2ff'],
    ['acc_pearl', 'Цвет «Перламутр»', 'epic', '#e9e2f7'],
    ['acc_emerald', 'Цвет «Изумрудный хром»', 'epic', '#5fd3b0'],
    ['acc_lavender', 'Цвет «Лавандовый туман»', 'rare', '#b9a6ff'],
    ['acc_bloodmoon', 'Цвет «Кровавая луна»', 'legendary', '#d4566e'],
    ['acc_peach', 'Цвет «Персиковый закат»', 'rare', '#f2a585'],
    ['acc_champagne', 'Цвет «Шампань»', 'rare', '#e6cf96'],
    ['acc_ocean', 'Цвет «Глубокий океан»', 'epic', '#4f8fe0'],
    ['acc_cherry', 'Цвет «Вишнёвый цвет»', 'epic', '#f08fb4'],
    ['acc_aurora', 'Цвет «Северное сияние»', 'legendary', '#6fe3c1'],
    ['acc_amethyst', 'Цвет «Звёздный аметист»', 'mythic', '#a678ff'],
  ];
  const COUPONS = [
    ['c_nothing', 'Купон: 20 минут ничегонеделания', 'common'],
    ['c_tea', 'Купон: любимый кофе или чай', 'common'],
    ['c_bath', 'Купон: ванна или долгий тёплый душ', 'common'],
    ['c_walk', 'Купон: прогулка под любимую музыку', 'common'],
    ['c_series', 'Купон: серия сериала без чувства вины', 'common'],
    ['c_sleep', 'Купон: лечь спать пораньше', 'rare'],
    ['c_call', 'Купон: позвонить близкому человеку', 'rare'],
    ['c_flowers', 'Купон: купить себе цветы', 'epic'],
    ['c_day', 'Купон: день для себя', 'legendary'],
  ];
  const ITEMS = {};
  GEMS.forEach(([id, name, r, a, b, shape, lore]) => ITEMS['g_' + id] = { id: 'g_' + id, type: 'gem', relic: true, name, r, a, b, shape, lore });
  ARTIFACTS.forEach(([id, name, r, art, color, lore]) => ITEMS['a_' + id] = { id: 'a_' + id, type: 'gem', relic: true, name, r, art, color, lore });
  ACCENT_ITEMS.forEach(([id, name, r, color]) => ITEMS[id] = { id, type: 'accent', name, r, color });
  (H.CARE_COUPONS && H.CARE_COUPONS.length ? H.CARE_COUPONS : COUPONS).forEach(([id, name, r, desc]) => ITEMS[id] = { id, type: 'coupon', name, r, desc });
  [['cr_20', 20, 'common'], ['cr_50', 50, 'rare'], ['cr_120', 120, 'epic'], ['cr_300', 300, 'legendary']].forEach(([id, n, r]) => ITEMS[id] = { id, type: 'crystals', name: `+${n} кристаллов`, r, n });

  const CASES = [
    { id: 'daily', name: 'Ежедневный кейс', price: 0, desc: 'Бесплатно раз в день, когда заполнено хотя бы 3 раздела дня.', pool: ['gem', 'crystals', 'coupon'], boost: 0, color: '#9fe6ff' },
    { id: 'care', name: 'Кейс заботы', price: 40, desc: 'Только забота о себе: купоны на приятные, тёплые и немного особенные дела.', pool: ['coupon'], boost: 0, color: '#ffc7dc' },
    { id: 'crystal', name: 'Кристальный кейс', price: 60, desc: 'Реликвии для витрины и новые цвета оформления.', pool: ['gem', 'accent', 'crystals'], weights: { gem: 6, accent: 4, crystals: 1 }, boost: 0, color: '#d9e2f2' },
    { id: 'gothic', name: 'Лунный кейс', price: 150, desc: 'Премиальный: только редкие и выше. Эпические, легендарные и мифические реликвии выпадают в разы чаще.', pool: ['gem', 'accent'], weights: { gem: 7, accent: 4 }, boost: 2, minR: 'rare', color: '#b9a6ff' },
  ];

  const G = () => H.store.get().game;

  function rollRarity(boost, minR) {
    const prof = boost === 2 ? [0, 1, 3.2, 4.5, 5] : boost ? [0.35, 1.1, 2.2, 2.8, 3.2] : [1, 1, 1, 1, 1];
    const minI = minR ? ORDER.indexOf(minR) : 0;
    const w = ORDER.map((r, i) => i < minI ? 0 : RAR[r].w * prof[i]);
    let x = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < ORDER.length; i++) { if ((x -= w[i]) <= 0) return ORDER[i]; }
    return 'common';
  }
  function poolItems(cs, type) { return Object.values(ITEMS).filter(it => it.type === type); }
  function roll(cs) {
    for (let tries = 0; tries < 30; tries++) {
      const r = rollRarity(cs.boost, cs.minR);
      const weights = cs.weights || Object.fromEntries(cs.pool.map(p => [p, 1]));
      let types = cs.pool.filter(p => poolItems(cs, p).some(it => it.r === r));
      if (!types.length) continue;
      let tot = types.reduce((a, t) => a + (weights[t] || 1), 0), x = Math.random() * tot, type = types[0];
      for (const t of types) { if ((x -= (weights[t] || 1)) <= 0) { type = t; break; } }
      const list = poolItems(cs, type).filter(it => it.r === r);
      return list[Math.floor(Math.random() * list.length)];
    }
    return ITEMS.cr_20;
  }
  // random filler for the spinning strip (not the prize)
  function filler(cs) { return roll(cs); }

  let pending = 0, pendTimer = null;
  function award(key, amount, label) {
    const g = G();
    if (g.earned[key]) return false;
    g.earned[key] = Date.now();
    g.crystals += amount;
    H.store.save();
    pending += amount;
    clearTimeout(pendTimer);
    pendTimer = setTimeout(() => { H.ui.toast(`+${pending} ${H.plural(pending, 'кристалл', 'кристалла', 'кристаллов')}${label ? ' · ' + label : ''}`, '◆'); pending = 0; }, 700);
    document.querySelectorAll('.gem-balance').forEach(el => el.textContent = g.crystals);
    return true;
  }
  function onDayEdit(date, block) {
    if (date > H.today()) return;
    award(`${date}:${block}`, 5);
    const d = H.store.get().days[date];
    const n = H.metrics.filledBlocks(d);
    if (n >= 8) award(`${date}:full`, 40, 'день заполнен');
    if (n === 1) {
      // streak: consecutive filled days ending today
      let k = 0, dt = date;
      while (H.metrics.filledBlocks(H.store.get().days[dt]) > 0 && k < 60) { k++; dt = H.addDays(dt, -1); }
      if (k >= 3) award(`streak:${date}`, Math.min(50, k * 5), `${k} ${H.plural(k, 'день', 'дня', 'дней')} подряд`);
    }
  }
  const dev = () => !!H.store.get().settings.devMode;
  function canDaily() {
    const g = G();
    if (dev()) return true;
    return g.freeCase !== H.today() && H.metrics.filledBlocks(H.store.get().days[H.today()]) >= 3;
  }
  function grant(item) {
    const g = G();
    g.opened = (g.opened || 0) + 1;
    if (item.type === 'crystals') { g.crystals += item.n; }
    else if (item.type === 'coupon') {
      g.coupons = g.coupons || [];
      const now = Date.now();
      g.coupons.push({ uid: H.uid(), id: item.id, got: now, exp: now + COUPON_DAYS * 86400000, state: 'active' });
    }
    else {
      const inv = g.inventory.find(x => x.id === item.id);
      if (inv) inv.count++; else g.inventory.push({ id: item.id, count: 1, ts: Date.now(), used: 0 });
      if (item.type === 'accent') {
        const st = H.store.get().settings;
        st.unlockedAccents = st.unlockedAccents || [];
        if (!st.unlockedAccents.includes(item.color)) st.unlockedAccents.push(item.color);
      }
    }
    H.store.save();
  }
  const COUPON_DAYS = 30;
  // coupons: individual, expire after 30 days, used/expired ones go to the archive
  function coupons() {
    const g = G();
    g.coupons = g.coupons || [];
    // migrate old stacked coupons from inventory
    const old = g.inventory.filter(x => (ITEMS[x.id] || {}).type === 'coupon');
    if (old.length) {
      const now = Date.now();
      old.forEach(x => { for (let i = 0; i < x.count; i++) g.coupons.push({ uid: H.uid(), id: x.id, got: x.ts || now, exp: now + COUPON_DAYS * 86400000, state: i < (x.used || 0) ? 'used' : 'active', usedAt: i < (x.used || 0) ? now : undefined }); });
      g.inventory = g.inventory.filter(x => (ITEMS[x.id] || {}).type !== 'coupon');
      H.store.save();
    }
    let ch = false;
    g.coupons.forEach(c => { if (c.state === 'active' && c.exp < Date.now()) { c.state = 'expired'; ch = true; } });
    if (ch) H.store.save();
    return g.coupons;
  }
  function login() { award('login:' + H.today(), 10, 'за визит'); }

  H.game = { coupons, COUPON_DAYS, dev, RAR, ORDER, ITEMS, CASES, GEMS, ARTIFACTS, roll, filler, award, onDayEdit, canDaily, grant, login };
})(window.H);
