'use strict';
(function (H) {
  const { h, ui } = H;
  H.views.settings = function (root) {
    const S = H.store.get();
    const st = S.settings;
    let taps = 0, tapT = null;
    const apply = () => { H.applySettings(); H.store.save(); };
    const page = h('div.stack');

    // themes
    const themeGrid = h('div.theme-grid');
    const drawThemes = () => {
      H.clear(themeGrid);
      H.THEMES.forEach(t => {
        const [a, b, c] = t.sw;
        const dark = ['night', 'aurora', 'silver'].includes(t.id);
        themeGrid.appendChild(h('button.theme-card' + (st.theme === t.id ? '.on' : ''), { onclick: () => { st.theme = t.id; st.themeChosen = true; if (t.id === 'silver' && st.silhouette === 'line') st.silhouette = 'chrome'; apply(); drawThemes(); drawSw(); drawSil(); } },
          h('div.tp', { style: { background: a } },
            t.id === 'silver' ? h('div.tp-silver') : t.id !== 'minimal' ? [h('div.b', { style: { width: '80px', height: '80px', left: '-10px', top: '-20px', background: b } }), h('div.b', { style: { width: '70px', height: '70px', right: '-6px', top: '10px', background: c } })] : null,
            h('div.g', { style: { background: t.id === 'minimal' ? '#fff' : dark ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.5)', borderColor: t.id === 'minimal' ? '#e4e4e0' : undefined } })),
          h('div.tn', h('b', t.name), h('span', t.desc)),
          h('div.chk', '✓')));
      });
    };
    drawThemes();

    // accents
    const sw = h('div.swatches');
    const drawSw = () => {
      H.clear(sw);
      H.availableAccents().forEach(c => sw.appendChild(h('button.swatch' + (st.accent === c ? '.on' : ''), { style: { background: c }, title: c, onclick: () => { st.accent = c; apply(); drawSw(); } })));
    };
    drawSw();

    // silhouettes
    const sil = h('div.sil-grid');
    const drawSil = () => {
      H.clear(sil);
      H.SILHOUETTES.forEach(s => sil.appendChild(h('button.sil-opt' + (st.silhouette === s.id ? '.on' : ''), { onclick: () => { st.silhouette = s.id; H.store.save(); drawSil(); } }, H.silhouettePreview(s.id), s.name)));
    };
    drawSil();

    page.appendChild(h('div.glass.card',
      h('div.card-title', H.gicon('sparkle', 17, 'sm'), h('h3', 'Оформление')),
      h('div.fsection', h('div.fsection-title', 'Стиль'), themeGrid),
      h('div.fsection', h('div.fsection-title', 'Цвет акцента'), sw),
      h('div.fsection.sil-section', h('div.fsection-title', 'Силуэт на экране дня'), sil),
      h('div.set-row', h('div', h('div.sr-t', 'Сила эффекта стекла'), h('div.sr-d', 'Размытие и прозрачность панелей')), ui.slider({ value: Math.round(st.glass / 10), min: 0, max: 10, mode: 'neutral', allowClear: false, onChange: v => { st.glass = v * 10; apply(); } })),
      h('div.set-row', h('div', h('div.sr-t', 'Размер текста')), ui.segmented([{ id: 0.92, name: 'Мельче' }, { id: 1, name: 'Обычный' }, { id: 1.08, name: 'Крупнее' }, { id: 1.16, name: 'Крупный' }].map(x => ({ ...x, toggleOff: false })), st.fontScale, v => { st.fontScale = v; apply(); })),
      h('div.set-row', h('div', h('div.sr-t', 'Анимации'), h('div.sr-d', 'Плавные переходы, всплывающие пузырьки и отклик кнопок')), ui.toggle(st.animations, v => { st.animations = v; apply(); })),
      h('div.set-row', h('div', h('div.sr-t', 'Звуки в разделе «Отдых»')), ui.toggle(st.gameSound !== false, v => { st.gameSound = v; H.store.save(); })),
      h('div.set-row', h('div', h('div.sr-t', 'Закрепить боковую панель'), h('div.sr-d', 'Меню разделов будет всегда видно слева')), ui.toggle(st.pinSidebar, v => { st.pinSidebar = v; apply(); }))));

    // diary blocks
    const blocks = h('div');
    H.BLOCKS.forEach(b => blocks.appendChild(h('div.set-row', h('div.sr-t.row', H.gicon(b.ic, 15, 'sm'), b.name), ui.toggle(!st.hiddenBlocks.includes(b.id), v => {
      st.hiddenBlocks = v ? st.hiddenBlocks.filter(x => x !== b.id) : st.hiddenBlocks.concat(b.id); H.store.save();
    }))));
    const custom = h('div');
    const drawCustom = () => {
      H.clear(custom);
      const ems = st.customEmotions || [], sys = st.customSymptoms || [];
      if (!ems.length && !sys.length) { custom.appendChild(h('p.faint', { style: { fontSize: '.85rem' } }, 'Своё состояние добавляется на экране дня кнопкой «+ своё» в эмоциях, своё ощущение — в «Физическом состоянии» → «+ своё ощущение».')); return; }
      const row = (name, sub, hiddenNow, onToggle, onDelete) => h('div.set-row' + (hiddenNow ? '.is-hidden' : ''),
        h('div.sr-t', name, h('span.faint', { style: { fontWeight: 400, marginLeft: '8px', fontSize: '.8rem' } }, sub + (hiddenNow ? ' · скрыто' : ''))),
        h('div.row', { style: { gap: '6px' } },
          h('button.btn.small.ghost', { onclick: onToggle }, hiddenNow ? 'Вернуть' : 'Скрыть'),
          h('button.icon-btn.small', { title: 'Удалить навсегда', onclick: onDelete }, '✕')));
      if (ems.length) custom.appendChild(h('div.fsection-title', 'Эмоциональные состояния'));
      ems.forEach(e => custom.appendChild(row(`${e.e} ${e.name}`, (H.EMO_GROUPS.find(g => g.id === e.g) || {}).name || '', !!e.hidden,
        () => { e.hidden = !e.hidden; H.store.syncCustomEmotions(); H.store.save(); drawCustom(); },
        async () => { if (await ui.confirm(`Удалить «${e.name}» навсегда? В прошлых днях эта отметка перестанет показываться.`, 'Удалить', true)) { st.customEmotions = ems.filter(x => x.id !== e.id); const i = H.EMOTIONS.findIndex(x => x.id === e.id); if (i >= 0) H.EMOTIONS.splice(i, 1); H.store.save(); drawCustom(); } })));
      if (sys.length) custom.appendChild(h('div.fsection-title', { style: { marginTop: '12px' } }, 'Ощущения'));
      sys.forEach(sy => custom.appendChild(row(sy.name, H.ZONES[sy.z] || '', !!sy.hidden,
        () => { sy.hidden = !sy.hidden; H.store.save(); drawCustom(); },
        async () => { if (await ui.confirm(`Удалить «${sy.name}» навсегда? Прошлые отметки останутся без названия.`, 'Удалить', true)) { st.customSymptoms = sys.filter(x => x.id !== sy.id); H.store.save(); drawCustom(); } })));
    };
    drawCustom();
    page.appendChild(h('div.grid2', { style: { alignItems: 'start' } },
      h('div.glass.card', h('div.card-title', H.gicon('clipboard', 17, 'sm'), h('h3', 'Разделы дневника')), h('p.faint', { style: { fontSize: '.84rem' } }, 'Выключи то, что не нужно, — дневник станет короче. Данные не удаляются.'), blocks),
      h('div.stack',
        h('div.glass.card', h('div.card-title', H.gicon('body', 17, 'sm'), h('h3', 'Мои состояния и симптомы')), custom),
        h('div.glass.card', h('div.card-title', H.gicon('file', 17, 'sm'), h('h3', 'Данные')),
          h('p.muted', { style: { fontSize: '.88rem' } }, H.sync && H.sync.config() ? 'Записи хранятся на этом iPhone, а для синхронизации — ещё и в облаке, только в зашифрованном виде. Каждый день автоматически делается резервная копия (последние 30 дней).' : 'Все записи хранятся только на этом iPhone и никуда не отправляются. Каждый день автоматически делается резервная копия (последние 30 дней).'),
          h('div.row.wrapr', { style: { gap: '10px' } },
            h('button.btn.small', { onclick: async () => { if (!H.store.hasApi) return ui.toast('Доступно в приложении', 'ℹ'); H.store.persistNow(); if (await window.api.exportBackup(H.store.get())) ui.toast('Копия сохранена'); } }, H.icon('file', 15), 'Сохранить копию'),
            h('button.btn.small', { onclick: async () => {
              if (!H.store.hasApi) return ui.toast('Доступно в приложении', 'ℹ');
              const obj = await window.api.importBackup(); if (!obj) return;
              if (!obj.days || !obj.settings) return ui.toast('Это не похоже на копию дневника', '⚠');
              if (await ui.confirm(`Загрузить копию? В ней ${Object.keys(obj.days).length} дней. Текущие данные будут заменены.`, 'Загрузить')) { H.store.replace(obj); H.applySettings(); ui.toast('Копия загружена'); H.go('home'); }
            } }, H.icon('reset', 15), 'Загрузить копию'),
            null),
          h('div.hr'),
          h('button.btn.small.ghost', { style: { color: '#e5484d' }, onclick: async () => {
            if (!await ui.confirm('Удалить ВСЕ записи, карточку здоровья, анализы и настройки? Это нельзя отменить (кроме восстановления из резервной копии).', 'Удалить всё', true)) return;
            if (!await ui.confirm('Точно удалить? Подтверди ещё раз.', 'Да, удалить', true)) return;
            H.store.reset(); H.applySettings(); ui.toast('Данные удалены'); H.go('home');
          } }, 'Удалить все данные')),
        H.syncCard ? H.syncCard() : null,
        H.remindCard ? H.remindCard() : null,
        h('div.glass.card', h('div.card-title', H.gicon('heart', 17, 'sm'), h('h3', 'О приложении')),
          h('p.muted', { style: { fontSize: '.88rem', margin: 0, userSelect: 'none' }, onclick: () => { taps++; clearTimeout(tapT); tapT = setTimeout(() => taps = 0, 1500); if (taps >= 5) { taps = 0; st.devUnlocked = true; H.store.save(); ui.toast('Режим разработчика открыт', '⚙'); H.go('settings'); } } }, 'My Diary, версия 1.10.6. Записи хранятся на устройстве; интернет нужен только для синхронизации и напоминаний. Советы и отчёты составляются автоматически по твоим записям и не заменяют консультацию врача.'),
          st.devUnlocked ? h('div.dev-box',
            h('div.fsection-title', { style: { marginTop: '14px' } }, 'Режим разработчика'),
            ui.toggle(!!st.devMode, v => { st.devMode = v; H.store.save(); }, 'Бесплатные кейсы без ограничений'),
            h('div.row.wrapr', { style: { gap: '8px', marginTop: '10px' } },
              h('button.btn.small', { onclick: () => { H.store.get().game.crystals += 1000; H.store.save(); document.querySelectorAll('.gem-balance').forEach(el => el.textContent = H.store.get().game.crystals); ui.toast('+1000 кристаллов', '◆'); } }, '+1000 кристаллов'),
              h('button.btn.small.ghost', { onclick: () => { st.devUnlocked = false; st.devMode = false; H.store.save(); H.go('settings'); } }, 'Скрыть режим'))) : null))));

    root.appendChild(h('div.wrap', h('div.view-head', h('div', h('h1', 'Настройки'), h('div.sub', 'Внешний вид, разделы дневника и данные'))), page));
  };
})(window.H);
