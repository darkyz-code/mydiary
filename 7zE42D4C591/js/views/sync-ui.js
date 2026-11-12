'use strict';
/* Settings card: phone ⇄ computer sync. */
(function (H) {
  const { h, ui } = H;

  function when(ts) {
    if (!ts) return '';
    const d = new Date(ts), t = H.today(), iso = H.iso(d);
    const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    return iso === t ? 'сегодня в ' + hm : iso === H.addDays(t, -1) ? 'вчера в ' + hm : H.fmtShort(iso) + ' в ' + hm;
  }
  const field = (label, el, hint) => h('label.sy-field', h('span.sy-l', label), el, hint ? h('span.sy-hint', hint) : null);

  H.syncCard = function () {
    const host = h('div.glass.card.sync-card');
    let off = null;
    const draw = () => {
      if (off) { off(); off = null; }
      H.clear(host);
      host.append(h('div.card-title', H.gicon('cloud', 17, 'sm'), h('h3', 'Синхронизация телефона и компьютера')));
      const c = H.sync.config();
      if (!c) return drawSetup();
      const status = h('div.sy-status');
      let shown = false;
      const paint = () => {
        if (shown && !host.isConnected) { if (off) { off(); off = null; } return; }
        shown = true;
        const s = H.sync.state; H.clear(status);
        status.className = 'sy-status' + (s.busy ? ' busy' : s.error ? ' err' : ' ok');
        status.append(h('i.sy-dot'), h('span', s.busy ? 'Синхронизирую…' : s.error ? s.error : (H.sync.config() || {}).last ? 'Всё синхронизировано · ' + when((H.sync.config() || {}).last) : 'Ещё не синхронизировалось'));
      };
      off = H.sync.onState(paint); paint();
      host.append(
        h('p.muted.sy-p', 'Записи общие на всех твоих устройствах с этим кодом и паролем. Изменения отправляются сами через несколько секунд после правки, а свежие подтягиваются при открытии и раз в минуту. В облаке лежит только зашифрованная копия.'),
        status,
        h('div.row.wrapr', { style: { gap: '10px', marginTop: '12px' } },
          h('button.btn.small.primary', { onclick: async () => { const r = await H.sync.run('manual'); if (!r.error && !r.skipped) ui.toast(r.changedLocal ? 'Подтянуты изменения' : 'Всё уже совпадает'); } }, H.icon('reset', 15), 'Синхронизировать сейчас'),
          h('button.btn.small', { onclick: showCode }, H.icon('link', 15), 'Подключить другое устройство'),
          h('button.btn.small.ghost', { onclick: async () => {
            if (!await ui.confirm('Отключить синхронизацию на этом устройстве? Записи здесь останутся, просто перестанут обмениваться с другими устройствами.', 'Отключить')) return;
            H.sync.disconnect(); draw();
          } }, 'Отключить'),
          h('button.btn.small.ghost', { style: { color: '#ef8a8d' }, onclick: async () => {
            if (!await ui.confirm('Удалить зашифрованную копию из облака? Синхронизация отключится на всех устройствах. Записи на самих устройствах останутся.', 'Удалить из облака', true)) return;
            try { await H.sync.wipe(); ui.toast('Копия в облаке удалена'); } catch (e) { ui.toast(H.sync.errText(e), '⚠'); }
            draw();
          } }, 'Удалить копию из облака')));
    };

    function showCode() {
      const code = H.sync.makeCode();
      const box = h('textarea.ta.sy-code', { readonly: true, rows: 3 }); box.value = code;
      const copy = async () => { try { await navigator.clipboard.writeText(code); ui.toast('Код скопирован'); } catch (e) { box.select(); document.execCommand && document.execCommand('copy'); ui.toast('Код скопирован'); } };
      ui.modal('Подключить другое устройство', h('div.stack',
        h('ol.sy-steps',
          h('li', 'Скопируй код и отправь его себе, например в «Избранное» Telegram.'),
          h('li', 'На другом устройстве открой ', h('b', 'Настройки → Синхронизация'), ', вставь код и введи ', h('b', 'тот же пароль'), '.'),
          h('li', 'После подключения удали сообщение с кодом. Пароля в коде нет, но код — это ключ к твоему месту в облаке.')),
        box),
        { actions: [h('button.btn.primary', { onclick: copy }, 'Скопировать код')] });
    }

    function drawSetup() {
      if (!H.sync.available()) { host.append(h('p.muted.sy-p', 'Синхронизация появится, когда будет настроен сервер приложения.')); return; }
      const code = h('input.inp', { placeholder: 'MYDIARY-SYNC2:…', autocomplete: 'off', autocapitalize: 'off', spellcheck: false });
      const pass = h('input.inp', { type: 'password', placeholder: 'Пароль', autocomplete: 'new-password' });
      const pass2 = h('input.inp', { type: 'password', placeholder: 'Пароль ещё раз', autocomplete: 'new-password' });
      const msg = h('div.sy-msg');
      let mode = 'first';
      const modeHost = h('div');
      const btn = h('button.btn.primary', {});
      const drawMode = () => {
        H.clear(modeHost);
        if (mode === 'join') modeHost.append(field('Код с другого устройства', code, 'Его показывает устройство, где синхронизация уже включена: Настройки → Синхронизация → «Подключить другое устройство»'));
        modeHost.append(field(mode === 'join' ? 'Тот же пароль, что на другом устройстве' : 'Придумай пароль', pass, mode === 'join' ? null : 'Им шифруются записи. Он будет нужен на каждом твоём устройстве. Запиши его: восстановить пароль нельзя.'), pass2);
        btn.textContent = mode === 'join' ? 'Подключить' : 'Включить синхронизацию';
      };
      const seg = ui.segmented([{ id: 'first', name: 'Это первое устройство' }, { id: 'join', name: 'Уже включена на другом' }].map(x => ({ ...x, toggleOff: false })), mode, v => { mode = v; msg.textContent = ''; drawMode(); });
      btn.onclick = async () => {
        msg.textContent = ''; msg.className = 'sy-msg';
        const err = t => { msg.textContent = t; msg.classList.add('err'); };
        if (mode === 'join' && !H.sync.parseCode(code.value)) return err(code.value.trim() ? 'Код не распознан — скопируй его целиком' : 'Вставь код с другого устройства');
        if (pass.value.length < 6) return err('Пароль — минимум 6 символов');
        if (pass2.value !== pass.value) return err('Пароли не совпадают');
        const label = btn.textContent; btn.disabled = true; btn.textContent = 'Подключаю…';
        try {
          const res = await H.sync.connect({ code: mode === 'join' ? code.value : '', pass: pass.value });
          if (res.res && res.res.error) throw res.res.error;
          ui.toast(res.created ? 'Синхронизация включена' : `Готово · записи объединены (${res.remoteDays} ${H.plural(res.remoteDays, 'день', 'дня', 'дней')} из облака)`, '⟳');
          draw();
          if (res.created) showCode();
        } catch (e) {
          err(e.code === 'bad-password' ? 'Пароль не подходит: на другом устройстве задан другой пароль' : e.code === 'bad-key' ? 'Код не подходит — возьми свежий код с другого устройства' : H.sync.errText(e));
          btn.disabled = false; btn.textContent = label;
        }
      };
      drawMode();
      host.append(
        h('p.muted.sy-p', 'Записи станут общими для твоего телефона и компьютера. Перед отправкой всё шифруется твоим паролем — в облаке лежит только нечитаемая копия, её не может открыть никто, даже владелец сервера.'),
        h('div', { style: { marginBottom: '12px' } }, seg), modeHost, msg,
        h('div.row', { style: { marginTop: '6px' } }, btn));
    }
    draw();
    return host;
  };
})(window.H);
