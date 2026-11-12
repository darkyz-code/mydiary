'use strict';
/* Shared helpers. Everything lives on the global H namespace. */
window.H = window.H || {};

(function (H) {
  // ---------- DOM ----------
  // h('div.card.big#id', {onclick, style:{}, html:'..'}, child, [children], 'text')
  function h(sel, props, ...kids) {
    if (props && (typeof props !== 'object' || props instanceof Node || Array.isArray(props))) { kids.unshift(props); props = null; }
    const m = sel.match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i);
    const tag = (m && m[1]) || 'div';
    const node = /^(svg|path|circle|rect|line|g|text|ellipse|polyline|polygon|defs|linearGradient|radialGradient|stop|clipPath|filter|feGaussianBlur|tspan|mask)$/.test(tag)
      ? document.createElementNS('http://www.w3.org/2000/svg', tag)
      : document.createElement(tag);
    if (m && m[2]) {
      m[2].replace(/([.#])([\w-]+)/g, (_, t, v) => { if (t === '.') node.classList.add(v); else node.id = v; });
    }
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v === undefined || v === null || v === false) continue;
        if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'style' && typeof v === 'object') { for (const sk in v) { if (sk.startsWith('--')) node.style.setProperty(sk, v[sk]); else node.style[sk] = v[sk]; } }
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'class') v.split(/\s+/).filter(Boolean).forEach(c => node.classList.add(c));
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else if (k === 'value' && 'value' in node) node.value = v;
        else if (k === 'checked') node.checked = !!v;
        else node.setAttribute(k, v === true ? '' : v);
      }
    }
    append(node, kids);
    return node;
  }
  function append(node, kids) {
    for (const k of kids) {
      if (k === null || k === undefined || k === false) continue;
      if (Array.isArray(k)) append(node, k);
      else if (k instanceof Node) node.appendChild(k);
      else node.appendChild(document.createTextNode(String(k)));
    }
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }
  function svg(str) { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstChild; }

  // ---------- dates ----------
  const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  const WD_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  const pad = n => String(n).padStart(2, '0');
  function iso(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
  function today() { return iso(new Date()); }
  function addDays(s, n) { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function diffDays(a, b) { return Math.round((parse(a) - parse(b)) / 86400000); } // a - b
  function range(from, to) { const out = []; let c = from; while (c <= to) { out.push(c); c = addDays(c, 1); } return out; }
  function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
  function fmtLong(s) { const d = parse(s); return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`; }
  function fmtLongY(s) { const d = parse(s); return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`; }
  function fmtShort(s) { const d = parse(s); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`; }
  function fmtNum(s) { const d = parse(s); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`; }
  function weekday(s) { return WEEKDAYS[parse(s).getDay()]; }
  function fmtStamp(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const t = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (iso(d) === today()) return `сегодня в ${t}`;
    if (iso(d) === addDays(today(), -1)) return `вчера в ${t}`;
    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${t}`;
  }
  function timeToMin(t) { if (!t) return null; const [hh, mm] = t.split(':').map(Number); return hh * 60 + mm; }
  function fmtDur(min) {
    if (min === null || min === undefined || isNaN(min)) return '—';
    min = Math.round(min);
    if (min < 60) return `${min} мин`;
    const hh = Math.floor(min / 60), mm = min % 60;
    return mm ? `${hh} ч ${mm} мин` : `${hh} ч`;
  }
  function plural(n, one, few, many) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  }
  function age(birth) {
    if (!birth) return null;
    const b = parse(birth), n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
  }

  // ---------- misc ----------
  function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  function avg(arr) { const v = arr.filter(x => typeof x === 'number' && !isNaN(x)); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; }
  function round1(x) { return x === null || x === undefined ? null : Math.round(x * 10) / 10; }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // colors
  function hexToRgb(hex) {
    let x = hex.replace('#', '');
    if (x.length === 3) x = x.split('').map(c => c + c).join('');
    const n = parseInt(x, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let hh = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) hh = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) hh = (b - r) / d + 2;
      else hh = (r - g) / d + 4;
      hh *= 60;
    }
    return [hh, s * 100, l * 100];
  }
  // score 0..10 -> colour from calm to intense, tinted
  function scoreColor(v, alpha = 1) {
    const t = clamp(v / 10, 0, 1);
    const hue = 150 - t * 150; // green -> red
    return `hsla(${hue}, 70%, ${52 - t * 6}%, ${alpha})`;
  }
  function wellColor(idx, alpha = 1) { // 0..100 wellbeing, high is good
    const t = clamp(idx / 100, 0, 1);
    const hue = t * 140; // red -> green
    return `hsla(${hue}, 65%, ${55 - Math.abs(t - .5) * 6}%, ${alpha})`;
  }

  Object.assign(H, {
    h, append, clear, svg, iso, parse, today, addDays, diffDays, range, cap, fmtLong, fmtLongY, fmtShort, fmtNum,
    weekday, fmtStamp, timeToMin, fmtDur, plural, age, uid, clamp, debounce, avg, round1, esc, hexToRgb, rgbToHsl,
    scoreColor, wellColor, pad, MONTHS, MONTHS_GEN, MONTHS_SHORT, WEEKDAYS, WD_SHORT,
  });
})(window.H);
