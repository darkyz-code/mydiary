'use strict';
/* Medication reminders.
   The schedule comes from the medication card (each dose slot has a time). On the iPhone the
   reminder times (only the times — no medicine names) go to the app's server, which delivers Web Push
   notifications even when the app is closed; the phone itself writes the medicine names into the
   notification (service worker reads the diary on the device). Marking a dose as taken tells the server, so a
   repeat reminder is not sent. */
(function (H) {
  const { h, ui } = H;
  const LS = 'mydiary.push';           // this device only: {id, secret, on}
  const ls = {
    get() { try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(LS, JSON.stringify(v)); } catch (e) {} },
  };
  const DEF = { 'утро': '09:00', 'день': '14:00', 'обед': '13:00', 'вечер': '21:00', 'ночь': '23:00', 'перед сном': '23:00' };
  H.defaultSlotTime = function (name, i, n) {
    const k = String(name || '').trim().toLowerCase();
    if (/^\d{1,2}:\d{2}$/.test(k)) return k.padStart(5, '0');
    if (DEF[k]) return DEF[k];
    return ({ 1: ['09:00'], 2: ['09:00', '21:00'], 3: ['09:00', '14:00', '21:00'], 4: ['08:00', '13:00', '18:00', '23:00'] }[n] || ['09:00'])[i] || '09:00';
  };
  const S = () => H.store.get();
  const opts = () => Object.assign({ names: true, again: 30 }, S().settings.remind || {});

  // ---------- schedule built from the medication card
  function medsOn(date) {
    return (S().meds || []).filter(m => m.active !== false && !m.asNeeded && m.noRemind !== true && (!m.start || m.start <= date) && (!m.end || m.end >= date));
  }
  function slotsOf(m) {
    const n = Number(m.times) || 1;
    const names = m.slots && m.slots.length === n ? m.slots : H.SLOT_NAMES[n];
    return names.map((sn, i) => ({ name: sn, i, t: (m.remind && m.remind[i]) || H.defaultSlotTime(sn, i, n) }));
  }
  function groups(date = H.today()) {
    const g = {};
    medsOn(date).forEach(m => slotsOf(m).forEach(s => { (g[s.t] = g[s.t] || { t: s.t, slot: s.name, meds: [] }).meds.push({ m, i: s.i }); }));
    return Object.values(g).sort((a, b) => a.t < b.t ? -1 : 1);
  }
  const doseText = m => m.dose ? ` ${m.dose} ${m.unit || 'мг'}` : '';
  function items() {
    const o = opts();
    return groups().map(gr => ({
      t: gr.t,
      title: 'Пора принять таблетки',
      body: o.names ? gr.meds.map(x => x.m.name + doseText(x.m)).join(', ') + ' · ' + String(gr.slot).toLowerCase() : 'Приём: ' + String(gr.slot).toLowerCase() + ' · отметь в дневнике',
    }));
  }
  function doneTimes(date = H.today()) {
    const d = S().days[date];
    return groups(date).filter(gr => gr.meds.every(x => d && d.meds && d.meds[x.m.id] && d.meds[x.m.id].slots && d.meds[x.m.id].slots[x.i])).map(gr => gr.t);
  }

  // ---------- push (iPhone home-screen app)
  const URL_ = () => (H.SERVER_URL || '').replace(/\/$/, '');
  const isPhone = () => document.documentElement.classList.contains('is-mobile');
  const supported = () => !!(URL_() && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window);
  const standalone = () => !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches));
  const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(18)), b => b.toString(16).padStart(2, '0')).join('');
  const unb64u = s => { const t = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)); return Uint8Array.from(t, c => c.charCodeAt(0)); };
  async function post(path, body) {
    const r = await fetch(URL_() + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) { const e = new Error(j.error || 'http ' + r.status); e.status = r.status; throw e; }
    return j;
  }
  async function subscription(create) {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub && create) {
      const { key } = await (await fetch(URL_() + '/key')).json();
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: unb64u(key) });
    }
    return sub;
  }
  let lastSent = '';
  async function push(force) {
    const me = ls.get(); if (!me || !me.on || !supported()) return;
    const sub = await subscription(false); if (!sub) return;
    const o = opts();
    const payload = { id: me.id, secret: me.secret, sub: sub.toJSON(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone, items: groups().map(g => ({ t: g.t })), again: o.again };   // only times leave the phone
    const sig = JSON.stringify([payload.sub.endpoint, payload.tz, payload.items, payload.again]);
    if (!force && sig === lastSent) return;
    await post('/sub', payload); lastSent = sig;
  }
  let lastDone = '';
  async function sendDone() {
    const me = ls.get(); if (!me || !me.on || !supported()) return;
    const t = doneTimes(); const sig = H.today() + JSON.stringify(t);
    if (sig === lastDone) return;
    await post('/done', { id: me.id, secret: me.secret, t }); lastDone = sig;
  }
  async function enable() {
    if (!supported()) throw new Error('unsupported');
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { const e = new Error('denied'); e.code = 'denied'; throw e; }
    await subscription(true);
    const me = ls.get() || { id: rid(), secret: rid() };
    me.on = true; ls.set(me);
    await push(true); await sendDone().catch(() => {});
  }
  async function disable() {
    const me = ls.get(); if (!me) return;
    me.on = false; ls.set(me);
    try { await post('/off', { id: me.id, secret: me.secret }); } catch (e) {}
    try { const sub = await subscription(false); if (sub) await sub.unsubscribe(); } catch (e) {}
    ls.set({ id: rid(), secret: rid(), on: false });
  }
  const isOn = () => !!(ls.get() && ls.get().on);

  // keep the server's copy current: on start, after medication changes, after marking doses
  let t1 = null;
  function start() {
    if (!supported()) return;
    if (isOn()) setTimeout(() => push(true).catch(e => console.warn('push', e)), 2500);
    H.store.onChange(() => { if (!isOn()) return; clearTimeout(t1); t1 = setTimeout(() => { push().catch(() => {}); sendDone().catch(() => {}); }, 2500); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && isOn()) push(true).catch(() => {}); });
    navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'open' && H.go) H.go('quick', { date: H.today() }); });
  }

  // ---------- settings card
  H.remindCard = function () {
    const host = h('div.glass.card.remind-card');
    const draw = () => {
      H.clear(host);
      host.append(h('div.card-title', H.gicon('bell', 17, 'sm'), h('h3', 'Напоминания о таблетках')));
      const gr = groups();
      const list = gr.length ? h('div.rm-list', gr.map(g => h('div.rm-row', h('span.rm-time', g.t), h('div.rm-main', h('div.rm-t', g.meds.map(x => x.m.name).join(', ')), h('div.rm-s', String(g.slot)))))) : h('p.faint', { style: { fontSize: '.86rem' } }, 'Пока нечего напоминать: добавь препараты в карточке здоровья.');
      const editLink = h('button.btn.small.ghost', { onclick: () => H.go('profile', { tab: 'meds' }) }, H.icon('clock',15), 'Изменить время — в карточке препаратов');
      if (!isPhone()) { // computer
        host.append(h('p.muted.sy-p', 'Напоминания приходят на iPhone — включи их там: «Ещё → Настройки». Время каждого приёма задаётся в карточке препарата и с синхронизацией одинаковое на всех устройствах.'), list, h('div.row', { style: { marginTop: '10px' } }, editLink));
        return;
      }
      if (!standalone()) { host.append(h('p.muted.sy-p', 'Уведомления работают, когда My Diary открыт с экрана «Домой» (как приложение), а не во вкладке Safari.'), list); return; }
      if (!supported()) { host.append(h('p.muted.sy-p', 'На этом iPhone уведомления недоступны — нужна iOS 16.4 или новее.'), list); return; }
      const o = opts();
      const msg = h('div.sy-msg');
      const on = isOn();
      const tog = ui.toggle(on, async v => {
        msg.textContent = ''; msg.className = 'sy-msg';
        try { if (v) { await enable(); ui.toast('Напоминания включены', '🔔'); } else { await disable(); ui.toast('Напоминания выключены'); } }
        catch (e) { msg.classList.add('err'); msg.textContent = e.code === 'denied' ? 'Уведомления запрещены. Разреши их: Настройки iPhone → Уведомления → My Diary.' : 'Не получилось связаться с сервером напоминаний. Проверь интернет и попробуй ещё раз.'; }
        draw();
      }, 'Присылать уведомления');
      host.append(h('p.muted.sy-p', 'В нужное время на телефон придёт уведомление, даже если приложение закрыто. Нажми на него — откроется «Сегодня», где можно отметить приём.'), tog, msg, list);
      if (on) {
        const st = S().settings; st.remind = st.remind || {};
        host.append(h('div.reminder-options',
          h('div.hr'),
          ui.toggle(o.names, v => { st.remind.names = v; H.store.save(); push(true).catch(() => {}); }, 'Писать названия препаратов в уведомлении'),
          ui.field('Напомнить ещё раз, если не отмечено', ui.segmented([{ id: 0, name: 'Нет' }, { id: 15, name: '15 мин' }, { id: 30, name: '30 мин' }, { id: 60, name: '1 час' }].map(x => ({ ...x, toggleOff: false })), o.again, v => { st.remind.again = v; H.store.save(); push(true).catch(() => {}); })),
          h('div.row.wrapr', { style: { gap: '10px', marginTop: '8px' } },
            h('button.btn.small', { onclick: async () => { try { const me = ls.get(); const r = await post('/test', { id: me.id, secret: me.secret }); ui.toast(r.ok ? 'Отправлено — уведомление придёт через пару секунд' : 'Сервер не смог отправить уведомление', r.ok ? '🔔' : '⚠'); } catch (e) { ui.toast('Нет связи с сервером напоминаний', '⚠'); } } }, H.icon('bell', 15), 'Проверить уведомление'),
            editLink)));
      } else host.append(h('div.row', { style: { marginTop: '10px' } }, editLink));
    };
    draw();
    return host;
  };

  H.reminders = { groups, items, doneTimes, enable, disable, isOn, push, start };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 500)); else setTimeout(start, 500);
})(window.H);
