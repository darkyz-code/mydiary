'use strict';
/* Drawn dish illustrations (offline, no photos): vessel + food built from the dish's palette */
(function (H) {
  let uidN = 0;
  const FALLBACK = {
    main: { vessel: 'plate', colors: ['#c98a4b', '#f1e3c4', '#5c8f3e'] },
    soup: { vessel: 'bowl', colors: ['#d98b3a', '#f3e7cf', '#4e8a3c'] },
    salad: { vessel: 'bowl', colors: ['#7fb85a', '#e64b3c', '#f4f0e6', '#2f6b2a'] },
    breakfast: { vessel: 'plate', colors: ['#f2c46b', '#fff3d6', '#c0392b'] },
    dessert: { vessel: 'plate', colors: ['#5a3220', '#f3e3c9', '#c2185b'] },
    snack: { vessel: 'board', colors: ['#e9c46a', '#7fb85a', '#e76f51'] },
  };
  function rng(seed) { let x = 0; for (const c of String(seed)) x = (x * 31 + c.charCodeAt(0)) >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = f < 0 ? 0 : 255, p = Math.abs(f);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  // organic blob path around cx,cy
  function blob(R, cx, cy, r, pts = 7, jit = .28) {
    const p = [];
    for (let i = 0; i < pts; i++) { const a = i / pts * Math.PI * 2; const rr = r * (1 - jit / 2 + R() * jit); p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    let d = '';
    for (let i = 0; i < pts; i++) {
      const p0 = p[(i - 1 + pts) % pts], p1 = p[i], p2 = p[(i + 1) % pts], p3 = p[(i + 2) % pts];
      if (i === 0) d += `M${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + 'Z';
  }
  function pieces(R, cols, cx, cy, spread, n, size, id) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()) * spread;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      const c = cols[i % cols.length], r = size * (.6 + R() * .7);
      s += `<path d="${blob(R, x, y, r, 6, .45)}" fill="url(#g${id}_${i % cols.length})"/>`;
    }
    return s;
  }
  function herbs(R, col, cx, cy, spread, n) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()) * spread, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, rot = R() * 180;
      s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(2 + R() * 2.4).toFixed(1)}" ry="${(1 + R()).toFixed(1)}" transform="rotate(${rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${col}" opacity=".9"/>`;
    }
    return s;
  }
  function grads(id, cols) {
    return cols.map((c, i) => `<radialGradient id="g${id}_${i}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${shade(c, .28)}"/><stop offset=".6" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -.25)}"/></radialGradient>`).join('');
  }

  function art(dish, size = 150) {
    const id = 'da' + (++uidN);
    const look = dish.look || FALLBACK[dish.c] || FALLBACK.main;
    const cols = (look.colors && look.colors.length ? look.colors : FALLBACK.main.colors).slice(0, 4);
    const R = rng(dish.id || dish.n);
    const herb = cols.find(c => { const n = parseInt(c.slice(1), 16), g = (n >> 8) & 255, r = n >> 16; return g > r * 1.15; }) || '#5c8f3e';
    const food = cols.filter(c => c !== herb);
    const all = food.length ? food : cols;
    const defs = `<defs>${grads(id, all)}
      <radialGradient id="pl${id}" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#e9ecf2"/><stop offset="1" stop-color="#c9ced8"/></radialGradient>
      <radialGradient id="bw${id}" cx=".5" cy=".45" r=".6"><stop offset=".55" stop-color="#2a2d35"/><stop offset="1" stop-color="#4a4f5c"/></radialGradient>
      <linearGradient id="wd${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c79a63"/><stop offset="1" stop-color="#8e6236"/></linearGradient>
      <filter id="sh${id}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".45"/></filter>
      <filter id="fs${id}"><feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="#000" flood-opacity=".3"/></filter>
    </defs>`;
    let body = '';
    const v = dish.look2 ? 'plate' : (look.vessel || 'plate');
    if (v === 'bowl' || v === 'mug') {
      body += `<circle cx="80" cy="82" r="64" fill="#e8ebf1" filter="url(#sh${id})"/><circle cx="80" cy="82" r="64" fill="url(#pl${id})"/>`;
      body += `<circle cx="80" cy="82" r="52" fill="${shade(all[0], -.2)}"/><circle cx="80" cy="82" r="50" fill="url(#g${id}_0)"/>`;
      body += `<ellipse cx="66" cy="66" rx="20" ry="8" fill="#fff" opacity=".18" transform="rotate(-25 66 66)"/>`;
      body += `<g filter="url(#fs${id})">${pieces(R, all.slice(1).length ? all.slice(1) : all, 80, 84, 30, 9, 6, id).replace(/url\(#g(\w+)_(\d)\)/g, (m, a, b) => `url(#g${a}_${Math.min(+b + 1, all.length - 1)})`)}</g>`;
      body += herbs(R, herb, 80, 84, 34, 14);
      if (v === 'mug') body = body.replace('<circle cx="80" cy="82" r="64"', '<rect x="128" y="70" width="22" height="26" rx="12" fill="none" stroke="#dfe3ea" stroke-width="7"/><circle cx="80" cy="82" r="64"');
    } else if (v === 'glass') {
      body += `<g filter="url(#sh${id})"><path d="M44 30h72l-8 104a10 10 0 0 1-10 9H62a10 10 0 0 1-10-9z" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.55)" stroke-width="2"/></g>`;
      const layers = all.length;
      for (let i = 0; i < layers; i++) {
        const y0 = 50 + i * (88 / layers), y1 = 50 + (i + 1) * (88 / layers);
        body += `<path d="M${46 + (y0 - 30) * .11},${y0}h${72 - (y0 - 30) * .22}l${-(y1 - y0) * .11},${y1 - y0}h${-(72 - (y1 - 30) * .22)}z" fill="url(#g${id}_${i})"/>`;
      }
      body += herbs(R, herb, 80, 46, 14, 8) + `<path d="M50 34l4 96" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>`;
    } else if (v === 'board') {
      body += `<g filter="url(#sh${id})"><rect x="16" y="34" width="128" height="96" rx="16" fill="url(#wd${id})"/><rect x="138" y="70" width="16" height="22" rx="8" fill="#8e6236"/></g>`;
      body += `<path d="M24 52h112M24 76h112M24 100h112" stroke="#6d4a26" stroke-opacity=".25"/>`;
      for (let i = 0; i < 3; i++) {
        const x = 30 + i * 36, y = 52 + (i % 2) * 14;
        body += `<g filter="url(#fs${id})"><rect x="${x}" y="${y}" width="32" height="44" rx="8" fill="#e3c08a"/><path d="${blob(R, x + 16, y + 20, 13, 7, .35)}" fill="url(#g${id}_${i % all.length})"/></g>`;
        body += herbs(R, herb, x + 16, y + 20, 10, 4);
      }
    } else if (v === 'pan') {
      body += `<g filter="url(#sh${id})"><rect x="118" y="74" width="40" height="12" rx="6" fill="#2b2e35"/><circle cx="74" cy="80" r="62" fill="#2b2e35"/></g><circle cx="74" cy="80" r="54" fill="url(#bw${id})"/>`;
      body += `<path d="${blob(R, 74, 80, 44, 9, .18)}" fill="url(#g${id}_0)"/>`;
      body += `<g filter="url(#fs${id})">${pieces(R, all.slice(1).length ? all.slice(1) : all, 74, 80, 28, 8, 7, id)}</g>` + herbs(R, herb, 74, 80, 34, 12);
    } else {
      // plate
      body += `<circle cx="80" cy="82" r="66" fill="#e8ebf1" filter="url(#sh${id})"/><circle cx="80" cy="82" r="66" fill="url(#pl${id})"/><circle cx="80" cy="82" r="50" fill="none" stroke="#cfd4dd" stroke-opacity=".7"/>`;
      if (dish.look2) {
        const sc = (dish.look2.colors || []).filter(c => c !== herb);
        const sid = id + 's';
        body += `<defs>${grads(sid, sc.length ? sc : ['#f1e3c4'])}</defs>`;
        body += `<path d="${blob(R, 58, 88, 30, 9, .2)}" fill="url(#g${sid}_0)" filter="url(#fs${id})"/>`;
        body += `<g filter="url(#fs${id})">${pieces(R, sc.length ? sc : ['#f1e3c4'], 58, 88, 16, 6, 6, sid)}</g>`;
        body += `<path d="${blob(R, 98, 76, 22, 8, .22)}" fill="${shade(all[0], -.1)}" opacity=".8"/>`;
        body += `<g filter="url(#fs${id})">${pieces(R, all, 100, 74, 14, 5, 11, id)}</g>`;
        body += herbs(R, herb, 86, 80, 34, 12);
      } else if (dish.c === 'dessert') {
        body += `<path d="${blob(R, 80, 80, 30, 6, .12)}" fill="url(#g${id}_0)" filter="url(#fs${id})"/>`;
        body += `<path d="${blob(R, 80, 72, 18, 7, .25)}" fill="url(#g${id}_${Math.min(1, all.length - 1)})" opacity=".9"/>`;
        body += pieces(R, all.slice(-1), 80, 82, 40, 5, 4, id).replace(/_\d\)/g, `_${all.length - 1})`);
        body += herbs(R, herb, 80, 70, 8, 3);
      } else {
        body += `<path d="${blob(R, 80, 82, 40, 9, .22)}" fill="url(#g${id}_0)" filter="url(#fs${id})"/>`;
        body += `<g filter="url(#fs${id})">${pieces(R, all, 80, 82, 26, 8, 9, id)}</g>`;
        body += herbs(R, herb, 80, 82, 34, 12);
      }
    }
    body += `<ellipse cx="58" cy="44" rx="22" ry="7" fill="#fff" opacity=".22" transform="rotate(-30 58 44)"/>`;
    return H.svg(`<svg class="dish-art" viewBox="0 0 160 160" width="${size}" height="${size}">${defs}${body}</svg>`);
  }
  H.dishArt = art;
})(window.H);
