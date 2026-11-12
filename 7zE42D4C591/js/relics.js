'use strict';
/* Relic artwork v1.7 — faceted gems, precious artifacts, rarity auras — and the immersive showcase */
(function (H) {
  const { h } = H;
  let n = 0;

  // ---------- colour + geometry helpers ----------
  const hex = c => { c = String(c || '#ffffff').replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); return [0, 2, 4].map(k => parseInt(c.substr(k, 2), 16) || 0); };
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, k) => v + (B[k] - v) * t)); };
  const lt = (c, t) => mix(c, '#ffffff', t), dk = (c, t) => mix(c, '#000000', t);
  const hash = k => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const f1 = v => (+v).toFixed(1);
  const pathOf = p => 'M' + p.map(q => f1(q[0]) + ' ' + f1(q[1])).join('L') + 'Z';
  const RLV = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };

  // four-point twinkle
  function spark(x, y, r, col = '#fff', d = 0, cls = 'rl-tw') {
    x = +x; y = +y; r = +r;
    const k = r * .14;
    return `<g class="${cls}" style="animation-delay:${d}s"><path d="M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z" fill="${col}"/><circle cx="${x}" cy="${y}" r="${f1(r * .22)}" fill="#fff"/></g>`;
  }

  // ---------- shared defs ----------
  function defs(i, c) {
    const L = lt(c, .6), D = dk(c, .45), DD = dk(c, .78);
    const chrome = `<stop offset="0" stop-color="#ffffff"/><stop offset=".2" stop-color="#d7dce4"/><stop offset=".42" stop-color="#737a87"/><stop offset=".52" stop-color="#3f4550"/><stop offset=".68" stop-color="#eef1f6"/><stop offset=".84" stop-color="#9aa1ad"/><stop offset="1" stop-color="#f4f6fa"/>`;
    const gold = `<stop offset="0" stop-color="#fffbe6"/><stop offset=".2" stop-color="#f7d98a"/><stop offset=".42" stop-color="#b47c25"/><stop offset=".52" stop-color="#6e4612"/><stop offset=".68" stop-color="#ffe7a3"/><stop offset=".84" stop-color="#c8913a"/><stop offset="1" stop-color="#fff3c8"/>`;
    return `<defs>
      <linearGradient id="ch${i}" x1="0" y1="0" x2="1" y2="1">${chrome}</linearGradient>
      <linearGradient id="chv${i}" x1="0" y1="0" x2="0" y2="1">${chrome}</linearGradient>
      <linearGradient id="chh${i}" x1="0" y1="0" x2="1" y2="0">${chrome}</linearGradient>
      <linearGradient id="au${i}" x1="0" y1="0" x2="1" y2="1">${gold}</linearGradient>
      <linearGradient id="auv${i}" x1="0" y1="0" x2="0" y2="1">${gold}</linearGradient>
      <linearGradient id="auh${i}" x1="0" y1="0" x2="1" y2="0">${gold}</linearGradient>
      <radialGradient id="k${i}" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".22" stop-color="${L}"/><stop offset=".58" stop-color="${c}"/><stop offset="1" stop-color="${D}"/></radialGradient>
      <radialGradient id="g${i}"><stop offset="0" stop-color="${c}" stop-opacity=".95"/><stop offset=".35" stop-color="${c}" stop-opacity=".4"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>
      <radialGradient id="gw${i}"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".25" stop-color="${L}" stop-opacity=".8"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>
      <radialGradient id="en${i}" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="${mix(DD, '#3a3f55', .4)}"/><stop offset="1" stop-color="#05060a"/></radialGradient>
      <linearGradient id="gl${i}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".16" stop-color="#fff" stop-opacity=".08"/><stop offset=".5" stop-color="${c}" stop-opacity=".08"/><stop offset=".82" stop-color="#fff" stop-opacity=".05"/><stop offset=".93" stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>
      <linearGradient id="ir${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd6f5"/><stop offset=".25" stop-color="#c6f1ff"/><stop offset=".5" stop-color="#fff4c4"/><stop offset=".75" stop-color="#d9c8ff"/><stop offset="1" stop-color="#ffd6f5"/></linearGradient>
      <radialGradient id="pe${i}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#f1ecf6"/><stop offset=".8" stop-color="#cdd3e6"/><stop offset="1" stop-color="#9aa0b8"/></radialGradient>
      <radialGradient id="ry${i}" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${L}" stop-opacity=".9"/><stop offset=".55" stop-color="${c}" stop-opacity=".22"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>
      <filter id="b${i}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.4"/></filter>
      <filter id="bb${i}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>`;
  }
  function ctx(i, c, gold) {
    return {
      i, c, L: lt(c, .6), D: dk(c, .45), DD: dk(c, .78),
      M: `url(#${gold ? 'au' : 'ch'}${i})`, MV: `url(#${gold ? 'auv' : 'chv'}${i})`, MH: `url(#${gold ? 'auh' : 'chh'}${i})`,
      A: `url(#${gold ? 'ch' : 'au'}${i})`, AV: `url(#${gold ? 'chv' : 'auv'}${i})`, AH: `url(#${gold ? 'chh' : 'auh'}${i})`,
      CH: `url(#ch${i})`, CHV: `url(#chv${i})`, CHH: `url(#chh${i})`, AU: `url(#au${i})`, AUV: `url(#auv${i})`, AUH: `url(#auh${i})`,
      K: `url(#k${i})`, G: `url(#g${i})`, GW: `url(#gw${i})`, EN: `url(#en${i})`, GL: `url(#gl${i})`, IR: `url(#ir${i})`, PE: `url(#pe${i})`,
      B: `url(#b${i})`, BB: `url(#bb${i})`,
    };
  }

  // ---------- faceted gem engine ----------
  function radialCut(fn, cx, cy, N, ts = .44, ss = .72) {
    const at = (t, s) => { const q = fn(t); return [cx + q[0] * s, cy + q[1] * s]; };
    const T = [], S = [], Ga = [], Gb = [];
    for (let k = 0; k < N; k++) { const a = (k + .5) / N, b = (k + 1) / N; T.push(at(a, ts)); S.push(at(b, ss)); Ga.push(at(a, 1)); Gb.push(at(b, 1)); }
    const F = [T.slice()];
    for (let k = 0; k < N; k++) {
      const j = (k + 1) % N, p = (k + N - 1) % N;
      F.push([T[k], T[j], S[k]]);
      F.push([T[k], S[p], Ga[k], S[k]]);
      F.push([S[k], Ga[k], Gb[k]]); F.push([S[k], Gb[k], Ga[j]]);
    }
    const out = []; for (let k = 0; k < N * 8; k++) out.push(at(k / (N * 8), 1));
    return { out, F, table: T };
  }
  const CUTS = {
    round: () => radialCut(t => { const a = t * Math.PI * 2; return [36 * Math.sin(a), -36 * Math.cos(a)]; }, 50, 50, 8),
    oval: () => radialCut(t => { const a = t * Math.PI * 2; return [29 * Math.sin(a), -37 * Math.cos(a)]; }, 50, 50, 8),
    heart: () => radialCut(t => { const a = t * Math.PI * 2, s = Math.sin(a); return [2.25 * 16 * s * s * s, -2.25 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))]; }, 50, 46, 12, .42, .7),
    pear: () => radialCut(t => { const a = t * Math.PI * 2; return [38 * Math.sin(a) * Math.sin(a / 2), -37 * Math.cos(a)]; }, 50, 52, 8, .42, .7),
    marquise: () => radialCut(t => { const a = t * Math.PI * 2, y = -38 * Math.cos(a), R = 42.1, d = 18.1; return [Math.sign(Math.sin(a)) * Math.max(0, Math.sqrt(R * R - y * y) - d), y]; }, 50, 50, 8, .4, .7),
    princess: () => radialCut(t => { const a = t * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), r = 38 / (Math.abs(s) + Math.abs(c)); return [r * s, -r * c]; }, 50, 50, 8, .45, .72),
    emerald: () => {
      const O = [[-15, -36], [15, -36], [26, -25], [26, 25], [15, 36], [-15, 36], [-26, 25], [-26, -25]];
      const ring = s => O.map(q => [50 + q[0] * s, 50 + q[1] * s]);
      const R = [ring(1), ring(.8), ring(.6), ring(.42)], F = [];
      for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) { const j = (k + 1) % 8; F.push([R[r][k], R[r][j], R[r + 1][j], R[r + 1][k]]); }
      F.push(R[3]);
      return { out: R[0], F, table: R[3] };
    },
    brilliant: () => {
      const out = [[30, 22], [70, 22], [88, 40], [50, 91], [12, 40]];
      const F = [
        [[12, 40], [30, 22], [21, 40]], [[21, 40], [30, 22], [37, 40]], [[30, 22], [43, 22], [37, 40]], [[37, 40], [43, 22], [50, 40]],
        [[43, 22], [57, 22], [50, 40]], [[50, 40], [57, 22], [63, 40]], [[57, 22], [70, 22], [63, 40]], [[63, 40], [70, 22], [79, 40]], [[79, 40], [70, 22], [88, 40]],
        [[12, 40], [21, 40], [33, 62]], [[12, 40], [33, 62], [50, 91]], [[21, 40], [37, 40], [50, 91], [33, 62]], [[37, 40], [50, 40], [50, 91]],
        [[50, 40], [63, 40], [50, 91]], [[63, 40], [79, 40], [67, 62], [50, 91]], [[79, 40], [88, 40], [67, 62]], [[67, 62], [88, 40], [50, 91]],
      ];
      return { out, F, table: [[30, 22], [70, 22]] };
    },
  };

  function shadeFacets(F, a, b, seed) {
    let s = '';
    F.forEach((p, k) => {
      let cx = 0, cy = 0; p.forEach(q => { cx += q[0]; cy += q[1]; }); cx /= p.length; cy /= p.length;
      const hv = hash(k * 3.1 + seed);
      const v = (-(cx - 50) * .55 - (cy - 50) * .85) / 38 + (hv - .5) * 1.25;
      const d = pathOf(p);
      if (hv > .86) s += `<path d="${d}" fill="${lt(a, .35)}" fill-opacity=".55"/>`;
      else if (hv < .1) s += `<path d="${d}" fill="${dk(b, .35)}" fill-opacity=".6"/>`;
      if (v > 0) s += `<path d="${d}" fill="#fff" fill-opacity="${Math.min(.6, v * .42).toFixed(2)}"/>`;
      else s += `<path d="${d}" fill="${dk(b, .6)}" fill-opacity="${Math.min(.55, -v * .38).toFixed(2)}"/>`;
    });
    s += `<path d="${F.map(pathOf).join('')}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width=".55" stroke-linejoin="round"/>`;
    return s;
  }

  // gem body; uid must be unique per svg
  const seedOf = v => typeof v === 'number' ? v : String(v).split('').reduce((acc, ch, k) => acc + ch.charCodeAt(0) * (k + 1), 0);
  function gemBody(uid, a, b, shapeSpec, lvl = 1, seed) {
    seed = seedOf(seed == null ? shapeSpec : seed) % 997;
    let [shape, fx] = String(shapeSpec).split(':');
    shape = ({ 0: 'brilliant', 1: 'prism', 2: 'cab', 3: 'cluster' })[shape] || shape;
    const u = 'q' + uid;
    const gd = `<defs>
      <linearGradient id="${u}b" x1=".1" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="${lt(a, .25)}"/><stop offset=".45" stop-color="${b}"/><stop offset=".75" stop-color="${dk(b, .3)}"/><stop offset="1" stop-color="${a}"/></linearGradient>
      <linearGradient id="${u}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lt(a, .2)}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${dk(b, .35)}"/></linearGradient>
      <radialGradient id="${u}i" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".4" stop-color="${lt(a, .4)}" stop-opacity=".35"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${u}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".4" stop-color="#fff" stop-opacity=".15"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".45"/></linearGradient>
      <radialGradient id="${u}c" cx=".4" cy=".34" r=".72"><stop offset="0" stop-color="${lt(a, .7)}"/><stop offset=".35" stop-color="${a}"/><stop offset=".78" stop-color="${b}"/><stop offset="1" stop-color="${dk(b, .55)}"/></radialGradient>
      <filter id="${u}f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>
      <filter id="${u}g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".7"/></filter>
    </defs>`;
    const fire = (pts) => pts.map(([x, y], k) => spark(x, y, 2.6 + k % 2, ['#ffd1f0', '#c8f4ff', '#fff3c4', '#d4ffe0'][k % 4], -(k * .9), 'rl-tw rl-fire')).join('');

    if (CUTS[shape]) {
      const cut = CUTS[shape]();
      const outD = pathOf(cut.out);
      let s = gd + `<path d="${outD}" fill="url(#${u}b)"/>`;
      s += `<path d="${pathOf(cut.table)}" fill="url(#${u}i)" opacity=".9"/>`;
      s += `<ellipse cx="50" cy="52" rx="22" ry="22" fill="url(#${u}i)"/>`;
      s += shadeFacets(cut.F, a, b, seed);
      if (fx === 'shift') s += `<path d="${outD}" fill="#3dd6a0" class="rl-shift" opacity="0"/>`;
      if (fx === 'prism') s += `<path d="${outD}" fill="url(#${u}p)" class="rl-pulse" opacity=".3"/><defs><linearGradient id="${u}p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ad9"/><stop offset=".3" stop-color="#7ad7ff"/><stop offset=".6" stop-color="#fff07a"/><stop offset="1" stop-color="#b47aff"/></linearGradient></defs>`;
      s += `<path d="${outD}" fill="none" stroke="${dk(b, .5)}" stroke-opacity=".7" stroke-width="1.6" stroke-linejoin="round"/>`;
      s += `<path d="${outD}" fill="none" stroke="url(#${u}r)" stroke-width=".9" stroke-linejoin="round"/>`;
      const cand = cut.F.slice(1).map(p => { let x = 0, y = 0; p.forEach(q => { x += q[0]; y += q[1]; }); return [x / p.length, y / p.length]; });
      const pick = [0, 1, 2, 3].slice(0, 1 + Math.min(3, lvl)).map(k => cand[Math.floor(hash(k * 7 + seed) * cand.length)]);
      s += fire(pick.map(p => [+f1(p[0]), +f1(p[1])]));
      return s;
    }
    if (shape === 'cab') {
      let fxs = '';
      const clip = `<clipPath id="${u}k"><ellipse cx="50" cy="51" rx="25" ry="30"/></clipPath>`;
      if (fx === 'opal') {
        const cols = ['#3dffc5', '#ff4fd0', '#3f8cff', '#ffd23f', '#7dff4a', '#b46bff', '#ff7a3d', '#35e0ff'];
        let bl = ''; for (let k = 0; k < 54; k++) { const x = 26 + hash(k + 1) * 48, y = 22 + hash(k + 9) * 58; bl += `<path d="M${f1(x)} ${f1(y)}l${f1(2 + hash(k + 3) * 4)} ${f1(-1 - hash(k + 4) * 3)} ${f1(1 + hash(k + 5) * 3)} ${f1(3 + hash(k + 6) * 3)} ${f1(-3 - hash(k + 7) * 3)} ${f1(1 + hash(k + 8) * 2)}z" fill="${cols[k % cols.length]}" opacity="${f1(.55 + hash(k + 2) * .45)}"/>`; }
        fxs = `<g clip-path="url(#${u}k)"><g class="rl-swirl" style="transform-origin:50px 51px"><g filter="url(#${u}g)">${bl}</g></g><ellipse cx="50" cy="51" rx="25" ry="30" fill="url(#${u}i)" opacity=".5"/></g>`;
      } else if (fx === 'labra') {
        let st = ''; for (let k = 0; k < 14; k++) st += `M20 ${f1(30 + k * 4.4)}l60 -22`;
        fxs = `<g clip-path="url(#${u}k)"><g class="rl-flash" filter="url(#${u}f)"><ellipse cx="44" cy="52" rx="22" ry="9" transform="rotate(-32 44 52)" fill="#2ad4ff" opacity=".9"/><ellipse cx="58" cy="66" rx="16" ry="6" transform="rotate(-32 58 66)" fill="#3f6bff" opacity=".85"/><ellipse cx="40" cy="34" rx="10" ry="4" transform="rotate(-32 40 34)" fill="#9dff6a" opacity=".75"/><ellipse cx="64" cy="44" rx="7" ry="3" transform="rotate(-32 64 44)" fill="#ffc94a" opacity=".85"/></g><path d="${st}" stroke="#fff" stroke-opacity=".07" stroke-width=".6"/></g>`;
      } else if (fx === 'moon') {
        fxs = `<g clip-path="url(#${u}k)"><ellipse class="rl-sheen" cx="46" cy="44" rx="20" ry="13" fill="#bfe2ff" opacity=".85" filter="url(#${u}f)"/><ellipse class="rl-sheen" style="animation-delay:-3s" cx="56" cy="62" rx="12" ry="8" fill="#d7c8ff" opacity=".5" filter="url(#${u}f)"/></g>`;
      } else if (fx === 'star') {
        fxs = `<g clip-path="url(#${u}k)"><g class="rl-starfx" filter="url(#${u}g)" stroke="#fff" stroke-linecap="round"><path d="M47 14V82M18 30l58 34M76 30 18 64" stroke-width="1.3" stroke-opacity=".8" transform="translate(0 2)"/></g><circle cx="47" cy="49" r="7" fill="#fff" opacity=".7" filter="url(#${u}f)"/></g>`;
      } else if (fx === 'blood') {
        fxs = `<g clip-path="url(#${u}k)"><circle cx="50" cy="51" r="16" fill="#ff3d5a" opacity=".55" filter="url(#${u}f)" class="rl-pulse"/></g>`;
      }
      const met = lvl >= 3 ? 'au' : 'ch';
      const beads = Array.from({ length: 30 }, (_, k) => { const t = k / 30 * Math.PI * 2; return `<circle cx="${f1(50 + 31 * Math.sin(t))}" cy="${f1(51 - 36 * Math.cos(t))}" r="1.3" fill="url(#${met}${uid})"/>`; }).join('');
      const prongs = [40, 140, 220, 320].map(r => `<path d="M50 17.5c2 0 3 2 2.4 4.6L50 26l-2.4-3.9c-.6-2.6.4-4.6 2.4-4.6z" fill="url(#${met}v${uid})" transform="rotate(${r} 50 51) " />`).join('');
      const bezel = `<ellipse cx="50" cy="51" rx="29" ry="34" fill="url(#${met}v${uid})"/><ellipse cx="50" cy="51" rx="29" ry="34" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".5"/>${beads}<ellipse cx="50" cy="51" rx="26.4" ry="31.4" fill="#121318"/>`;
      return gd + `${clip}${bezel}
        <ellipse cx="50" cy="51" rx="25" ry="30" fill="url(#${u}c)"/>
        <ellipse cx="56" cy="64" rx="13" ry="10" fill="${lt(a, .5)}" opacity=".55" filter="url(#${u}f)"/>
        ${fxs}
        <path d="M30 40c2-11 10-17 20-17 5 0 9 2 12 4-10-1-22 4-28 15z" fill="#fff" opacity=".7" filter="url(#${u}g)"/>
        <ellipse cx="41" cy="33" rx="5" ry="2.6" transform="rotate(-35 41 33)" fill="#fff" opacity=".95"/>
        <path d="M70 60c-2 9-9 16-18 18" stroke="#fff" stroke-opacity=".45" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        <ellipse cx="50" cy="51" rx="25" ry="30" fill="none" stroke="${dk(b, .55)}" stroke-opacity=".7" stroke-width="1.2"/>${prongs}`;
    }
    if (shape === 'prism' || shape === 'cluster' || shape === 'druse') {
      const prism = (k, op = 1) => `<g opacity="${op}">
        <path d="M35 36 44 40V88L35 84z" fill="url(#${u}v)"/><path d="M44 40H56V88H44z" fill="url(#${u}v)"/><path d="M56 40 65 36V84L56 88z" fill="url(#${u}v)"/>
        <path d="M35 36 44 40V88L35 84z" fill="#fff" opacity=".32"/><path d="M56 40 65 36V84L56 88z" fill="${dk(b, .5)}" opacity=".45"/>
        <path d="M35 36 50 12 44 40z" fill="#fff" opacity=".7"/><path d="M44 40 50 12 56 40z" fill="${lt(a, .3)}" opacity=".9"/><path d="M56 40 50 12 65 36z" fill="${b}" opacity=".95"/><path d="M56 40 50 12 65 36z" fill="${dk(b, .4)}" opacity=".35"/>
        <path d="M44 46 50 30 56 46" stroke="#fff" stroke-opacity=".35" stroke-width=".7" fill="none"/>
        <path d="M44 58h12M44 70h12" stroke="#fff" stroke-opacity=".12" stroke-width=".6"/>
        <ellipse cx="50" cy="60" rx="5" ry="16" fill="url(#${u}i)"/>
        <path d="M35 36 50 12 65 36M35 36 44 40 56 40 65 36M44 40V88M56 40V88M35 36V84M65 36V84" stroke="#fff" stroke-opacity=".55" stroke-width=".6" fill="none" stroke-linejoin="round"/>
        <path d="M37 40v40" stroke="#fff" stroke-opacity=".8" stroke-width=".9"/>
      </g>`;
      if (shape === 'prism') {
        const melon = fx === 'melon' ? `<defs><linearGradient id="${u}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".42" stop-color="${lt(a, .25)}"/><stop offset=".5" stop-color="#fff8f2"/><stop offset=".58" stop-color="#9fe8b8"/><stop offset="1" stop-color="#1e9a6a"/></linearGradient></defs>` : '';
        let body = prism(0);
        if (fx === 'melon') body = body.split(`url(#${u}v)`).join(`url(#${u}m)`);
        return gd + melon + `<g transform="translate(50 92) scale(1.12) translate(-50 -88)">${body}</g>` + fire([[44, 30], [52, 64]]);
      }
      // cluster on a rock base
      const P = (x, y, r, s) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s}) translate(-50 -88)">${prism(0)}</g>`;
      return gd + `<ellipse cx="50" cy="86" rx="34" ry="9" fill="#1a1c22"/><path d="M18 86c4-8 14-12 22-10 6-6 18-6 24 0 8-2 16 2 20 10-8 6-58 6-66 0z" fill="#2b2f38"/><path d="M22 84c8-4 14-4 18-2M56 78c6-2 12 0 16 4" stroke="#fff" stroke-opacity=".18" fill="none"/>
        ${P(30, 84, -28, .55)}${P(70, 84, 26, .6)}${P(40, 84, -12, .78)}${P(62, 86, 12, .7)}${P(51, 86, 2, .92)}
        <circle cx="26" cy="84" r="1" fill="#fff" opacity=".7"/><circle cx="74" cy="86" r=".8" fill="#fff" opacity=".6"/>` + fire([[46, 22], [64, 46]]);
    }
    if (shape === 'octa') {
      const A = [50, 8], Bt = [50, 94], L = [13, 50], R = [87, 46], F = [44, 59], Bk = [57, 39];
      const stars = fx === 'night' ? Array.from({ length: 16 }, (_, k) => `<circle cx="${f1(30 + hash(k + 2) * 40)}" cy="${f1(26 + hash(k + 8) * 50)}" r="${f1(.4 + hash(k + 4) * .9)}" fill="#fff" opacity="${f1(.4 + hash(k + 6) * .6)}"/>`).join('') : '';
      const clip = `<clipPath id="${u}k"><path d="${pathOf([A, L, Bt, R])}"/></clipPath>`;
      return gd + clip + `<path d="${pathOf([A, L, Bt, R])}" fill="url(#${u}b)"/>
        <g clip-path="url(#${u}k)">${stars}<circle cx="50" cy="52" r="16" fill="url(#${u}i)"/>${fx === 'night' ? `<path d="M56 38a14 14 0 1 0 0 26 11 11 0 1 1 0-26z" fill="#e8ecff" opacity=".9" filter="url(#${u}g)" class="rl-pulse"/>` : ''}</g>
        <path d="M${A}L${Bk}L${L}M${Bk}L${R}M${Bk}L${Bt}" stroke="#fff" stroke-opacity=".22" stroke-width=".6" fill="none"/>
        <path d="${pathOf([A, L, F])}" fill="#fff" opacity=".28"/><path d="${pathOf([A, F, R])}" fill="#fff" opacity=".1"/>
        <path d="${pathOf([Bt, L, F])}" fill="${dk(b, .5)}" opacity=".25"/><path d="${pathOf([Bt, F, R])}" fill="${dk(b, .6)}" opacity=".5"/>
        <path d="M${A}L${F}L${Bt}M${L}L${F}L${R}" stroke="#fff" stroke-opacity=".7" stroke-width=".7" fill="none"/>
        <path d="${pathOf([A, L, Bt, R])}" fill="none" stroke="url(#${u}r)" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M48 14 20 48" stroke="#fff" stroke-opacity=".8" stroke-width="1" stroke-linecap="round"/>` + fire([[34, 40], [62, 54], [48, 76]]);
    }
    return gemBody(uid, a, b, 'round', lvl, seed);
  }

  // ---------- artifacts ----------
  function featherArt(o, phoenix) {
    const P0 = [30, 90], C = [36, 44], P2 = [78, 9];
    const q = t => [(1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * C[0] + t * t * P2[0], (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * C[1] + t * t * P2[1]];
    const dq = t => { const x = 2 * (1 - t) * (C[0] - P0[0]) + 2 * t * (P2[0] - C[0]), y = 2 * (1 - t) * (C[1] - P0[1]) + 2 * t * (P2[1] - C[1]); const l = Math.hypot(x, y); return [x / l, y / l]; };
    const w = t => 17 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(.97, (t - .2) / .84))), .62);
    const u = 'fe' + o.i;
    let barbs = '', edgeL = [], edgeR = [];
    for (let k = 0; k <= 46; k++) {
      const t = .2 + .8 * k / 46, p = q(t), d = dq(t), nx = -d[1], ny = d[0];
      [[1, 1], [-1, .72]].forEach(([sd, sc]) => {
        const gap = (sd === 1 && t > .5 && t < .54) || (sd === -1 && t > .36 && t < .39) ? .55 : 1;
        const W = w(t) * sc * gap;
        const ex = p[0] + nx * W * sd + d[0] * W * .62, ey = p[1] + ny * W * sd + d[1] * W * .62;
        const cx = p[0] + nx * W * .55 * sd + d[0] * W * .1, cy = p[1] + ny * W * .55 * sd + d[1] * W * .1;
        barbs += `M${f1(p[0])} ${f1(p[1])}Q${f1(cx)} ${f1(cy)} ${f1(ex)} ${f1(ey)}`;
        (sd === 1 ? edgeL : edgeR).push([ex, ey]);
      });
    }
    const spine = []; for (let k = 0; k <= 20; k++) spine.push(q(.2 + .8 * k / 20));
    const vane = 'M' + [...edgeL, ...spine.slice().reverse().slice(0, 1), ...edgeR.slice().reverse()].map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z';
    const shaft = 'M' + Array.from({ length: 21 }, (_, k) => q(k / 20)).map(p => f1(p[0]) + ' ' + f1(p[1])).join('L');
    let fluff = ''; for (let k = 0; k < 9; k++) { const t = .14 + k * .008, p = q(t), sd = k % 2 ? 1 : -1, d = dq(t); fluff += `M${f1(p[0])} ${f1(p[1])}q${f1(-d[1] * 6 * sd - 2)} ${f1(d[0] * 6 * sd + 1)} ${f1(-d[1] * 9 * sd - 4)} ${f1(d[0] * 8 * sd + 4)}`; }
    const gA = phoenix ? ['#fff6c8', '#ffb43c', '#ff5a36', '#c21d5a'] : ['#ffffff', '#dfe6f2', '#9fb0cc', o.c];
    const tip = q(.97);
    let embers = '';
    if (phoenix) for (let k = 0; k < 9; k++) embers += `<circle class="rl-ember" style="animation-delay:${f1(-k * .55)}s" cx="${f1(30 + hash(k) * 48)}" cy="${f1(40 + hash(k + 3) * 40)}" r="${f1(.8 + hash(k + 5) * 1.2)}" fill="${k % 2 ? '#ffd27a' : '#ff7a4a'}"/>`;
    return `<defs><linearGradient id="${u}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${gA[0]}"/><stop offset=".35" stop-color="${gA[1]}"/><stop offset=".7" stop-color="${gA[2]}"/><stop offset="1" stop-color="${gA[3]}"/></linearGradient></defs>
      ${phoenix ? `<path d="${vane}" fill="#ff6a2a" opacity=".55" filter="${o.BB}" class="rl-pulse"/>` : ''}
      <path d="${vane}" fill="url(#${u})" opacity="${phoenix ? .85 : .5}"/>
      <path d="${barbs}" stroke="url(#${u})" stroke-width=".7" fill="none"/>
      <path d="${barbs}" stroke="#fff" stroke-opacity="${phoenix ? .35 : .55}" stroke-width=".3" fill="none"/>
      ${phoenix ? `<path d="${vane}" fill="url(#ir${o.i})" opacity=".18"/>` : `<path d="${vane}" fill="url(#ir${o.i})" opacity=".22"/>`}
      <path d="${fluff}" stroke="${phoenix ? '#ffc58a' : '#e9eef7'}" stroke-opacity=".7" stroke-width=".5" fill="none"/>
      <path d="${shaft}" stroke="${phoenix ? o.AU : o.M}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      <path d="${shaft}" stroke="#fff" stroke-opacity=".75" stroke-width=".5" fill="none"/>
      <path d="M30 90 25 97l1.6-8.4c.8-1.6 2.6-2.2 3.4-1.6z" fill="${phoenix ? o.AU : o.A}"/><path d="M29.5 89.6l-3.6 6.4" stroke="#000" stroke-opacity=".4" stroke-width=".4"/>
      <circle cx="${f1(tip[0])}" cy="${f1(tip[1])}" r="9" fill="${o.G}"/>
      ${embers}`;
  }

  const ART = {
    candle: o => `
      <ellipse cx="50" cy="24" rx="20" ry="24" fill="${o.G}" class="flick"/>
      <ellipse cx="50" cy="91" rx="20" ry="3.5" fill="#000" opacity=".35" filter="${o.B}"/>
      <path d="M32 88c0-3 8-5 18-5s18 2 18 5-8 4-18 4-18-1-18-4z" fill="${o.M}"/>
      <path d="M44 86l2-8h8l2 8z" fill="${o.MH}"/><ellipse cx="50" cy="78" rx="6" ry="2.4" fill="${o.M}"/>
      <path d="M40 76c0-3 5-5 10-5s10 2 10 5-5 4-10 4-10-1-10-4z" fill="${o.MH}"/>
      <path d="M26 74c0-4 11-7 24-7s24 3 24 7-11 6-24 6-24-2-24-6z" fill="${o.M}"/>
      <path d="M28 73c4 3 12 4 22 4s18-1 22-4" stroke="#fff" stroke-opacity=".6" stroke-width=".7" fill="none"/>
      <path d="M72 70c6-2 10 2 9 6s-6 6-9 3" stroke="${o.M}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <defs><linearGradient id="wx${o.i}" x1="0" x2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset=".35" stop-color="#f7efe0"/><stop offset=".8" stop-color="#d9c9ab"/><stop offset="1" stop-color="#bba786"/></linearGradient></defs>
      <path d="M40 38c3-2 17-2 20 0v32H40z" fill="url(#wx${o.i})"/>
      <path d="M40 38c0 4 1 9 2 12 1 3 3 2 3-1v-7c1 4 2 6 3 5 1-1 0-5 1-9 3 1 6 1 11 0v-2c-3-2-17-2-20 0z" fill="#fffef9"/>
      <path d="M57 40c1 6 0 14 1 18 0 2 2 2 2 0V40z" fill="#fffef9" opacity=".9"/>
      <path d="M42 42v26" stroke="#fff" stroke-width="1.4" opacity=".8"/>
      <ellipse cx="50" cy="38" rx="10" ry="2" fill="#fffef9"/>
      <path d="M50 38v-6" stroke="#2a2420" stroke-width="1"/>
      <g class="flick"><path d="M50 8c7 9 9 15 0 24-9-9-7-15 0-24z" fill="${o.c}" opacity=".85" filter="${o.B}"/>
      <path d="M50 11c5 7 6 12 0 20-6-8-5-13 0-20z" fill="#ffe7b0"/><path d="M50 18c3 4 3 8 0 12-3-4-3-8 0-12z" fill="#fff"/>
      <ellipse cx="50" cy="30" rx="2" ry="1.4" fill="#7ab8ff" opacity=".8"/></g>`,
    feather: o => featherArt(o, false),
    phoenix: o => featherArt(o, true),
    bell: o => `
      <ellipse cx="50" cy="90" rx="22" ry="3" fill="#000" opacity=".35" filter="${o.B}"/>
      <path d="M50 14c-5 0-8 3-8 6h16c0-3-3-6-8-6z" fill="${o.M}"/><circle cx="50" cy="12" r="4" fill="none" stroke="${o.M}" stroke-width="2.2"/>
      <path d="M33 72c0-20 2-38 17-41 15 3 17 21 17 41 0 4 6 6 10 8H23c4-2 10-4 10-8z" fill="${o.MH}"/>
      <path d="M38 70c0-18 2-32 9-36" stroke="#fff" stroke-opacity=".85" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M33 64c10 3 24 3 34 0M34 58c10 3 22 3 32 0" stroke="${o.A}" stroke-width="1.6" fill="none"/>
      ${[38, 44, 50, 56, 62].map((x, k) => `<circle cx="${x}" cy="${61.3 + (k === 2 ? .7 : k % 4 ? .5 : 0)}" r="1.4" fill="${o.K}"/>`).join('')}
      <ellipse cx="50" cy="80" rx="27" ry="4" fill="${o.M}"/><ellipse cx="50" cy="80" rx="22" ry="2.4" fill="#16181d"/>
      <circle cx="50" cy="84" r="4.4" fill="${o.K}"/><circle cx="48.6" cy="82.6" r="1.3" fill="#fff"/>
      <path d="M50 20c-6-8-18-10-20-4s8 8 20 4zM50 20c6-8 18-10 20-4s-8 8-20 4z" fill="${o.K}"/>
      <path d="M50 20c-4 4-8 10-12 14M50 20c4 4 8 10 12 14" stroke="${o.c}" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M33 16c4 0 10 2 14 4M67 16c-4 0-10 2-14 4" stroke="#fff" stroke-opacity=".7" stroke-width=".8" fill="none"/>
      <circle cx="50" cy="20" r="3" fill="${o.K}" stroke="#fff" stroke-opacity=".5" stroke-width=".5"/>`,
    key: o => `<g transform="rotate(-38 50 52)">
      <circle cx="50" cy="24" r="17" fill="none" stroke="${o.M}" stroke-width="5"/>
      <circle cx="50" cy="24" r="17" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".6"/>
      ${[0, 90, 180, 270].map(r => `<path d="M50 24c-2-6-1-11 0-13 1 2 2 7 0 13z" fill="${o.A}" transform="rotate(${r} 50 24)"/>`).join('')}
      ${[45, 135, 225, 315].map(r => `<circle cx="50" cy="5.5" r="2.4" fill="${o.M}" transform="rotate(${r} 50 24)"/>`).join('')}
      <circle cx="50" cy="24" r="7" fill="${o.K}"/><circle cx="50" cy="24" r="7" fill="none" stroke="${o.A}" stroke-width="1.4"/><circle cx="47.6" cy="21.6" r="2" fill="#fff" opacity=".9"/>
      <rect x="44" y="40" width="12" height="4" rx="1.5" fill="${o.M}"/><rect x="45" y="45" width="10" height="3" rx="1.5" fill="${o.A}"/>
      <rect x="47" y="47" width="6" height="44" rx="2" fill="${o.MH}"/>
      <path d="M48.3 48v42" stroke="#fff" stroke-opacity=".7" stroke-width=".7"/>
      <rect x="45.5" y="62" width="9" height="3" rx="1.5" fill="${o.A}"/>
      <path d="M53 74h12v4h-4v4h4v6H53z" fill="${o.M}"/><path d="M53 74h12" stroke="#fff" stroke-opacity=".6" stroke-width=".6"/>
    </g>`,
    mirror: o => `
      <defs><radialGradient id="mr${o.i}" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="${lt(o.c, .55)}"/><stop offset=".35" stop-color="${mix(o.c, '#2a3550', .5)}"/><stop offset=".8" stop-color="#121725"/><stop offset="1" stop-color="${o.D}"/></radialGradient>
      <clipPath id="mc${o.i}"><ellipse cx="50" cy="40" rx="19" ry="24"/></clipPath></defs>
      <ellipse cx="50" cy="40" rx="25" ry="30" fill="${o.M}"/>
      ${Array.from({ length: 26 }, (_, k) => { const a = k / 26 * Math.PI * 2; return `<circle cx="${f1(50 + 27.4 * Math.sin(a))}" cy="${f1(40 - 32.4 * Math.cos(a))}" r="1.5" fill="${o.A}"/>`; }).join('')}
      <ellipse cx="50" cy="40" rx="21.5" ry="26.5" fill="none" stroke="${o.A}" stroke-width="1"/>
      <ellipse cx="50" cy="40" rx="19" ry="24" fill="url(#mr${o.i})"/>
      <g clip-path="url(#mc${o.i})"><path d="M26 44 58 10l6 5-36 38z" fill="#fff" opacity=".28"/><path d="M34 58 66 22l3 3-34 36z" fill="#fff" opacity=".16"/><circle cx="58" cy="48" r="9" fill="${o.c}" opacity=".35" filter="${o.B}" class="rl-pulse"/></g>
      <path d="M36 28c3-6 9-9 14-9" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>
      <path d="M50 2c-3 4-8 4-10 2 0 4 4 6 10 6s10-2 10-6c-2 2-7 2-10-2z" fill="${o.A}"/><circle cx="50" cy="6" r="2.4" fill="${o.K}"/>
      <path d="M44 70h12l-2 5h-8z" fill="${o.A}"/>
      <rect x="46" y="74" width="8" height="18" rx="3" fill="${o.MH}"/>
      ${[77, 81, 85, 89].map(y => `<path d="M46 ${y + 2}l8 -3" stroke="#000" stroke-opacity=".25" stroke-width="1"/>`).join('')}
      <path d="M50 92c-3 0-4 2-4 3 0 2 2 4 4 4s4-2 4-4c0-1-1-3-4-3z" fill="${o.K}"/>`,
    pendant: o => `
      ${Array.from({ length: 13 }, (_, k) => { const t = k / 12; const x = 18 + t * 32, y = 2 + Math.sin(t * Math.PI / 2) * 24 - t * t * 2; return `<circle cx="${f1(x)}" cy="${f1(y)}" r="1.3" fill="${o.M}"/><circle cx="${f1(100 - x)}" cy="${f1(y)}" r="1.3" fill="${o.M}"/>`; }).join('')}
      <path d="M46 24a4 4 0 0 1 8 0v6h-8z" fill="${o.M}"/><circle cx="50" cy="24" r="1.6" fill="#16181d"/>
      <circle cx="50" cy="58" r="28" fill="${o.M}"/>
      ${Array.from({ length: 24 }, (_, k) => `<path d="M50 28.6l1.6 3h-3.2z" fill="${o.A}" transform="rotate(${k * 15} 50 58)"/>`).join('')}
      <circle cx="50" cy="58" r="23.5" fill="${o.A}"/><circle cx="50" cy="58" r="21.5" fill="${o.EN}"/>
      ${Array.from({ length: 12 }, (_, k) => `<circle cx="${f1(34 + hash(k + 21) * 30)}" cy="${f1(44 + hash(k + 33) * 28)}" r="${f1(.3 + hash(k) * .7)}" fill="#fff" opacity=".8"/>`).join('')}
      <circle cx="54" cy="56" r="12" fill="${o.c}" opacity=".5" filter="${o.BB}" class="rl-pulse"/>
      <path d="M58 44a14 14 0 1 0 0 26 11 11 0 1 1 0-26z" fill="${o.K}"/>
      <path d="M50 46a12 12 0 0 0-4 18" stroke="#fff" stroke-opacity=".7" stroke-width=".8" fill="none"/>
      ${spark(64, 50, 3, '#fff', -.5)}${spark(60, 68, 2, '#fff', -1.6)}
      <path d="M38 44a18 18 0 0 1 14-6" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M50 86c-2 3-3 5-3 7a3 3 0 0 0 6 0c0-2-1-4-3-7z" fill="${o.K}"/>`,
    hourglass: o => `
      <ellipse cx="50" cy="93" rx="26" ry="3" fill="#000" opacity=".35" filter="${o.B}"/>
      <path d="M24 82h52l2 6H22z" fill="${o.M}"/><ellipse cx="50" cy="88" rx="28" ry="3.5" fill="${o.MH}"/><ellipse cx="50" cy="82" rx="26" ry="3.2" fill="${o.M}"/>
      <path d="M33 18c0 18 14 24 14 32s-14 14-14 32h34c0-18-14-24-14-32s14-14 14-32z" fill="${o.GL}" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/>
      <path d="M37 30c1 9 9 13 12 18h2c3-5 11-9 12-18-6 2-20 2-26 0z" fill="${o.K}"/>
      <path d="M37 30c6 2 20 2 26 0" stroke="#fff" stroke-opacity=".7" stroke-width=".6" fill="none"/>
      <path d="M50 49v26" stroke="${o.L}" stroke-width="1.2" class="rl-fall" stroke-dasharray="2 3"/>
      <path d="M35 81c2-8 9-13 15-13s13 5 15 13z" fill="${o.K}"/>
      <circle cx="50" cy="74" r="10" fill="${o.c}" opacity=".35" filter="${o.BB}"/>
      <path d="M36 22c0 10 4 16 9 21" stroke="#fff" stroke-opacity=".8" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <path d="M36 80c0-8 3-13 7-17" stroke="#fff" stroke-opacity=".5" stroke-width="1" fill="none" stroke-linecap="round"/>
      ${[24, 76].map(x => `<rect x="${x - 2}" y="16" width="4" height="66" rx="2" fill="${o.MH}"/>${[22, 32, 42, 52, 62, 72].map(y => `<path d="M${x - 2} ${y + 3}l4 -3" stroke="#fff" stroke-opacity=".55" stroke-width=".7"/>`).join('')}<circle cx="${x}" cy="49" r="3" fill="${o.A}"/>`).join('')}
      <ellipse cx="50" cy="18" rx="26" ry="3.2" fill="${o.M}"/><path d="M22 12h56l-2 6H24z" fill="${o.MV}"/><ellipse cx="50" cy="12" rx="28" ry="3.5" fill="${o.MH}"/>
      <circle cx="50" cy="12" r="2.6" fill="${o.K}"/>${spark(42, 34, 2.4, '#fff', -1)}`,
    lantern: o => `
      <circle cx="50" cy="52" r="34" fill="${o.G}" class="rl-pulse"/>
      <path d="M42 12a8 8 0 0 1 16 0" stroke="${o.M}" stroke-width="2.6" fill="none"/>
      <path d="M50 12v4" stroke="${o.M}" stroke-width="2"/><circle cx="50" cy="17" r="2.2" fill="${o.A}"/>
      <path d="M30 30c2-8 10-12 20-12s18 4 20 12z" fill="${o.M}"/><path d="M34 28c4-5 9-7 16-7" stroke="#fff" stroke-opacity=".7" stroke-width=".8" fill="none"/>
      <rect x="29" y="29" width="42" height="4" rx="1.5" fill="${o.A}"/>
      <path d="M33 33h34v40H33z" fill="${o.c}" opacity=".12"/>
      <g class="flick"><ellipse cx="50" cy="54" rx="11" ry="15" fill="${o.c}" opacity=".7" filter="${o.B}"/>
      <path d="M50 40l6 10-6 16-6-16z" fill="${o.K}"/><path d="M50 40l6 10h-12z" fill="#fff" opacity=".8"/><path d="M50 66l6-16" stroke="#fff" stroke-opacity=".6" stroke-width=".6"/></g>
      <path d="M33 33h34v40H33z" fill="${o.GL}"/>
      ${[[33, 50], [50, 67]].map(([x1, x2]) => `<path d="M${x1 + 2} 72V44a${(x2 - x1 - 4) / 2} ${(x2 - x1 - 4) / 2} 0 0 1 ${x2 - x1 - 4} 0v28" stroke="${o.M}" stroke-width="1" fill="none" opacity=".9"/>`).join('')}
      <path d="M33 33v40M50 33v40M67 33v40" stroke="${o.MV}" stroke-width="2.4"/>
      <path d="M36 36v34" stroke="#fff" stroke-opacity=".7" stroke-width="1"/>
      <rect x="29" y="72" width="42" height="5" rx="1.5" fill="${o.M}"/>
      <path d="M31 77h38l-4 7H35z" fill="${o.MV}"/><path d="M34 84h6v4h-6zM60 84h6v4h-6z" fill="${o.A}"/>`,
    rose: o => `
      <ellipse cx="50" cy="94" rx="30" ry="3.5" fill="#000" opacity=".4" filter="${o.B}"/>
      <path d="M22 86h56l3 7H19z" fill="${o.MV}"/><ellipse cx="50" cy="86" rx="28" ry="4" fill="${o.M}"/>
      <path d="M26 86V40a24 24 0 0 1 48 0v46" fill="${o.c}" opacity=".06"/>
      <path d="M50 46c0 14-2 26 0 38" stroke="#5fa77f" stroke-width="2" fill="none"/>
      <path d="M50 68c-8-6-16-4-18 0 6 4 12 4 18 0z" fill="#7fd1a4"/><path d="M50 68c-6-1-12-1-17 0" stroke="#fff" stroke-opacity=".5" stroke-width=".5" fill="none"/>
      <path d="M51 58c7-5 14-4 16 0-5 3-11 3-16 0z" fill="#5fbf8e"/>
      <circle cx="50" cy="36" r="18" fill="${o.G}" class="rl-pulse"/>
      <path d="M34 38c-4-10 4-20 14-16-4 6-6 12-14 16z" fill="${o.K}"/><path d="M66 38c4-10-4-20-14-16 4 6 6 12 14 16z" fill="${o.K}"/>
      <path d="M34 36c0 12 8 18 16 18s16-6 16-18c-4 6-10 9-16 9s-12-3-16-9z" fill="${o.K}"/>
      <path d="M34 36c4 6 10 9 16 9s12-3 16-9" stroke="#fff" stroke-opacity=".75" stroke-width=".7" fill="none"/>
      <path d="M40 34c0-8 4-12 10-12s10 4 10 12c-3-4-6-5-10-5s-7 1-10 5z" fill="${o.L}"/>
      <path d="M42 38c2 4 5 5 8 5s6-1 8-5c-2-6-5-8-8-8s-6 2-8 8z" fill="${o.K}"/>
      <path d="M46 34c1-3 3-4 4-4 3 0 4 2 4 4s-2 3-4 3c-1 0-2-1-2-2" stroke="#fff" stroke-opacity=".85" stroke-width=".7" fill="none"/>
      <path d="M34 38c-4-10 4-20 14-16M66 38c4-10-4-20-14-16" stroke="#fff" stroke-opacity=".55" stroke-width=".6" fill="none"/>
      <path d="M58 82c2-2 6-2 7 0-2 2-5 2-7 0z" fill="${o.K}" opacity=".9"/>
      <path d="M26 86V40a24 24 0 0 1 48 0v46" fill="${o.GL}" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/>
      <path d="M30 80V42c0-10 6-18 14-20" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M70 60V44" stroke="#fff" stroke-opacity=".35" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="50" cy="15" r="3" fill="${o.M}"/><path d="M47 16h6v2h-6z" fill="${o.A}"/>
      ${spark(62, 26, 2.4, '#fff', -.7)}${spark(36, 58, 1.8, '#fff', -2.1)}`,
    compass: o => `
      <circle cx="50" cy="12" r="5" fill="none" stroke="${o.M}" stroke-width="2.4"/><rect x="45" y="16" width="10" height="7" rx="2" fill="${o.MH}"/>
      <circle cx="50" cy="58" r="34" fill="${o.M}"/><circle cx="50" cy="58" r="30.5" fill="${o.A}"/>
      <circle cx="50" cy="58" r="28.5" fill="${o.EN}"/>
      ${Array.from({ length: 48 }, (_, k) => `<path d="M50 ${k % 6 ? 31.5 : 30.5}V${k % 6 ? 33.5 : 35}" stroke="#fff" stroke-opacity="${k % 6 ? .35 : .8}" stroke-width="${k % 6 ? .5 : .9}" transform="rotate(${k * 7.5} 50 58)"/>`).join('')}
      <circle cx="50" cy="58" r="22" fill="none" stroke="${o.A}" stroke-opacity=".6" stroke-width=".5"/>
      ${[45, 135, 225, 315].map(r => `<g transform="rotate(${r} 50 58)"><path d="M50 44 52.6 58H47.4z" fill="${o.A}" opacity=".85"/><path d="M50 44 52.6 58H50z" fill="#000" opacity=".3"/></g>`).join('')}
      ${[0, 90, 180, 270].map(r => `<g transform="rotate(${r} 50 58)"><path d="M50 36 54 58H46z" fill="${o.M}"/><path d="M50 36 54 58H50z" fill="#000" opacity=".35"/></g>`).join('')}
      <g class="rl-needle"><path d="M50 32 54 58H46z" fill="${o.K}"/><path d="M50 32 54 58H50z" fill="${o.D}" opacity=".5"/><path d="M50 84 54 58H46z" fill="${o.M}"/></g>
      <circle cx="50" cy="32" r="5" fill="${o.G}"/>
      <circle cx="50" cy="58" r="3.4" fill="${o.A}"/><circle cx="50" cy="58" r="1.6" fill="${o.K}"/>
      <path d="M28 46a26 26 0 0 1 20-16" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M30 70a24 24 0 0 0 12 12" stroke="#fff" stroke-opacity=".2" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    vial: o => `
      <defs><clipPath id="vc${o.i}"><circle cx="50" cy="62" r="23"/></clipPath>
      <linearGradient id="vl${o.i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.L}"/><stop offset=".5" stop-color="${o.c}"/><stop offset="1" stop-color="${o.D}"/></linearGradient></defs>
      <ellipse cx="50" cy="90" rx="20" ry="2.6" fill="#000" opacity=".35" filter="${o.B}"/>
      <circle cx="50" cy="62" r="26" fill="${o.G}" class="rl-pulse"/>
      <rect x="44" y="22" width="12" height="20" fill="${o.GL}" stroke="#fff" stroke-opacity=".5" stroke-width=".7"/>
      <g clip-path="url(#vc${o.i})">
        <path d="M24 56c8-4 14 3 26 0s18-4 26 0v40H24z" fill="url(#vl${o.i})" class="rl-wave"/>
        <path d="M24 56c8-4 14 3 26 0s18-4 26 0" stroke="#fff" stroke-opacity=".8" stroke-width=".8" fill="none" class="rl-wave"/>
        ${Array.from({ length: 14 }, (_, k) => `<circle class="rl-tw" style="animation-delay:${f1(-k * .37)}s" cx="${f1(32 + hash(k + 40) * 36)}" cy="${f1(62 + hash(k + 50) * 20)}" r="${f1(.5 + hash(k + 60) * .9)}" fill="#fff"/>`).join('')}
        <circle cx="42" cy="74" r="2" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width=".5"/><circle cx="58" cy="70" r="1.3" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width=".5"/>
      </g>
      <circle cx="50" cy="62" r="23" fill="${o.GL}" stroke="#fff" stroke-opacity=".6" stroke-width=".8"/>
      <path d="M32 56a19 19 0 0 1 12-14" stroke="#fff" stroke-opacity=".85" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M33 80c4 6 10 8 17 8s13-2 17-8" stroke="${o.M}" stroke-width="1.4" fill="none"/>
      <path d="M30 74c6 10 14 14 20 14M70 74c-6 10-14 14-20 14M36 84l2-6M64 84l-2-6" stroke="${o.M}" stroke-width=".9" fill="none"/>
      <ellipse cx="50" cy="22" rx="8" ry="2.4" fill="${o.M}"/><path d="M43 14h14v8H43z" fill="${o.MH}"/><ellipse cx="50" cy="14" rx="7" ry="2" fill="${o.M}"/>
      <path d="M50 2c-4 4-5 7-5 9a5 5 0 0 0 10 0c0-2-1-5-5-9z" fill="${o.K}"/><path d="M48 6c-1 2-2 3-2 5" stroke="#fff" stroke-width=".8" fill="none"/>
      <path d="M44 32c-6 2-10 8-12 14" stroke="${o.A}" stroke-width="1" fill="none"/><path d="M28 44l6-2 2 8-7 2z" fill="#f4ecdc" stroke="${o.A}" stroke-width=".5"/>`,
    butterfly: o => {
      const wing = `<path d="M50 46C42 30 26 14 15 20 6 26 14 44 30 50c8 3 15 1 20-2z" fill="${o.K}"/>
        <path d="M50 46C42 30 26 14 15 20 6 26 14 44 30 50c8 3 15 1 20-2z" fill="url(#ir${o.i})" opacity=".35"/>
        <path d="M50 52c-10 2-22 6-25 16-2 10 8 12 15 6 6-6 9-14 10-22z" fill="${o.K}"/>
        <path d="M50 52c-10 2-22 6-25 16-2 10 8 12 15 6 6-6 9-14 10-22z" fill="url(#ir${o.i})" opacity=".3"/>
        <path d="M50 46C42 30 26 14 15 20 6 26 14 44 30 50c8 3 15 1 20-2zM50 52c-10 2-22 6-25 16-2 10 8 12 15 6 6-6 9-14 10-22z" stroke="${o.M}" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
        <path d="M48 46C38 38 26 28 18 26M48 47C38 44 28 42 20 40M48 54c-6 4-14 8-18 14" stroke="${o.M}" stroke-width=".8" fill="none"/>
        <path d="M18 24c4-2 10 0 14 4" stroke="#fff" stroke-opacity=".8" stroke-width="1" fill="none"/>
        <circle cx="26" cy="34" r="2.6" fill="${o.AU}"/><circle cx="26" cy="34" r="1.5" fill="#fff" opacity=".9"/>
        <circle cx="36" cy="42" r="1.6" fill="${o.PE}"/><circle cx="34" cy="64" r="2.2" fill="${o.AU}"/><circle cx="34" cy="64" r="1.1" fill="#fff"/>`;
      return `<ellipse cx="50" cy="52" rx="34" ry="26" fill="${o.G}" opacity=".7"/>
        <g class="rl-flap">${wing}</g>
        <g transform="translate(100 0) scale(-1 1)"><g class="rl-flap">${wing}</g></g>
        <path d="M49 36c-4-10-10-16-16-14M51 36c4-10 10-16 16-14" stroke="${o.M}" stroke-width="1" fill="none"/>
        <circle cx="33" cy="22" r="2" fill="${o.PE}"/><circle cx="67" cy="22" r="2" fill="${o.PE}"/>
        <ellipse cx="50" cy="38" rx="3.4" ry="3.6" fill="${o.M}"/>
        ${[44, 51, 58, 65].map((y, k) => `<ellipse cx="50" cy="${y}" rx="${3.2 - k * .5}" ry="${3.6 - k * .3}" fill="${o.M}"/><ellipse cx="50" cy="${y}" rx="${2.2 - k * .4}" ry="${2.6 - k * .3}" fill="${o.K}"/><circle cx="49.2" cy="${y - 1}" r=".7" fill="#fff"/>`).join('')}`;
    },
    chalice: o => `
      <ellipse cx="50" cy="94" rx="24" ry="3" fill="#000" opacity=".4" filter="${o.B}"/>
      <path d="M34 92c0-6 8-8 16-8s16 2 16 8z" fill="${o.MV}"/><ellipse cx="50" cy="92" rx="16" ry="2.4" fill="${o.M}"/>
      <path d="M46 84c0-6 2-12 2-20h4c0 8 2 14 2 20z" fill="${o.MH}"/>
      <ellipse cx="50" cy="66" rx="6" ry="4" fill="${o.M}"/><circle cx="50" cy="66" r="2" fill="${o.K}"/>
      <path d="M44 62c-2-3 0-5 6-5s8 2 6 5z" fill="${o.M}"/>
      <path d="M24 24c0 20 10 32 26 33 16-1 26-13 26-33z" fill="${o.MH}"/>
      <path d="M28 28c1 14 8 23 17 26" stroke="#fff" stroke-opacity=".8" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M26 36c8 4 40 4 48 0M27 42c8 4 38 4 46 0" stroke="${o.A}" stroke-width="1.6" fill="none"/>
      ${[32, 41, 50, 59, 68].map((x, k) => `<path d="M${x} ${37.6 + (k === 2 ? 1.6 : k % 4 ? 1.1 : 0)}l2.6 2.4-2.6 2.4-2.6-2.4z" fill="${o.K}" stroke="#fff" stroke-opacity=".5" stroke-width=".3"/>`).join('')}
      <ellipse cx="50" cy="24" rx="26" ry="6" fill="${o.M}"/>
      <ellipse cx="50" cy="24.4" rx="23" ry="4.6" fill="${o.K}"/>
      <ellipse cx="50" cy="24.4" rx="23" ry="4.6" fill="url(#ir${o.i})" opacity=".3" class="rl-pulse"/>
      <ellipse cx="46" cy="23.4" rx="10" ry="1.4" fill="#fff" opacity=".7"/>
      <ellipse cx="50" cy="16" rx="18" ry="12" fill="${o.G}" class="rl-pulse"/>
      ${[0, 1, 2, 3].map(k => `<circle class="rl-ember" style="animation-delay:${-k * 1.1}s" cx="${40 + k * 7}" cy="22" r="1" fill="${o.L}"/>`).join('')}`,
    ring: o => `
      <ellipse cx="50" cy="66" rx="29" ry="21" fill="none" stroke="${o.M}" stroke-width="6.5"/>
      <path d="M21 66a29 21 0 0 0 58 0" stroke="${o.MV}" stroke-width="7" fill="none"/>
      <path d="M24 70a27 18 0 0 0 52 0" stroke="#fff" stroke-opacity=".65" stroke-width=".9" fill="none"/>
      <path d="M22 62a28 20 0 0 1 12-15" stroke="#fff" stroke-opacity=".5" stroke-width=".8" fill="none"/>
      <ellipse cx="50" cy="38" rx="22" ry="20" fill="${o.G}" class="rl-pulse"/>
      <path d="M38 48l4-18M62 48l-4-18M44 50l2-20M56 50l-2-20" stroke="${o.M}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M36 47c6 3 22 3 28 0l-2 4c-6 2-18 2-24 0z" fill="${o.M}"/>
      <g transform="translate(31.3 15) scale(.375)">${gemBody(o.i + 'r', lt(o.c, .55), o.c, 'brilliant', 3)}</g>
      <g transform="translate(23 40) scale(.13)">${gemBody(o.i + 's', '#fff', '#c8d2e4', 'round', 0)}</g>
      <g transform="translate(64 40) scale(.13)">${gemBody(o.i + 't', '#fff', '#c8d2e4', 'round', 0)}</g>`,
    book: o => `<g transform="rotate(-7 50 54)">
      <ellipse cx="54" cy="92" rx="28" ry="3" fill="#000" opacity=".45" filter="${o.B}"/>
      <rect x="31" y="22" width="48" height="68" rx="3" fill="#120c1c"/>
      <defs><linearGradient id="pg${o.i}" x1="0" x2="1"><stop offset="0" stop-color="#f5ecd6"/><stop offset="1" stop-color="#c9b48a"/></linearGradient>
      <linearGradient id="cv${o.i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mix(o.c, '#3a2350', .55)}"/><stop offset=".55" stop-color="${mix(o.DD, '#1a0f28', .4)}"/><stop offset="1" stop-color="#0c0814"/></linearGradient></defs>
      <path d="M29 20h46v67H29z" fill="url(#pg${o.i})"/>
      ${[78, 80, 82, 84].map(y => `<path d="M30 ${y + 3}h45" stroke="${o.AU}" stroke-width=".5" opacity=".9"/>`).join('')}
      <path d="M74 21v65" stroke="${o.AU}" stroke-width="2"/>
      <rect x="24" y="17" width="49" height="68" rx="3" fill="url(#cv${o.i})"/>
      <rect x="24" y="17" width="49" height="68" rx="3" fill="none" stroke="${o.AU}" stroke-width="1"/>
      <rect x="28" y="21" width="41" height="60" rx="2" fill="none" stroke="${o.AU}" stroke-width=".5" stroke-dasharray="1.5 1.5"/>
      <rect x="21" y="16" width="7" height="70" rx="3" fill="${mix(o.DD, '#000', .3)}"/><path d="M21 28h7M21 42h7M21 60h7M21 74h7" stroke="${o.AU}" stroke-width="1.6"/>
      ${[[28, 21, 0], [69, 21, 90], [69, 81, 180], [28, 81, 270]].map(([x, y, r]) => `<path d="M${x} ${y}h9l-9 9z" fill="${o.AU}" transform="rotate(${r} ${x} ${y})"/>`).join('')}
      <circle cx="48.5" cy="50" r="15" fill="none" stroke="${o.AU}" stroke-width="1.6"/>
      ${Array.from({ length: 16 }, (_, k) => `<path d="M48.5 32.5l1.2 2.6h-2.4z" fill="${o.AU}" transform="rotate(${k * 22.5} 48.5 50)"/>`).join('')}
      <circle cx="48.5" cy="50" r="12" fill="${o.EN}"/>
      <path d="M54 42a10 10 0 1 0 0 16 8 8 0 1 1 0-16z" fill="${o.AU}"/>
      <circle cx="48.5" cy="50" r="4" fill="${o.K}"/><circle cx="47.4" cy="48.8" r="1.2" fill="#fff"/>
      <circle cx="48.5" cy="50" r="5" fill="${o.c}" opacity=".6" filter="${o.B}" class="rl-pulse"/>
      <path d="M66 46h12v8H66z" fill="${o.AUV}"/><circle cx="72" cy="50" r="2" fill="${o.K}"/>
      <path d="M26 20c10-2 30-2 44 0" stroke="#fff" stroke-opacity=".3" stroke-width=".8" fill="none"/>
    </g>
    ${spark(78, 22, 3, o.L, -.3)}${spark(20, 40, 2.2, '#fff', -1.4)}${spark(84, 70, 2, o.L, -2.2)}`,
    orb: o => `
      <ellipse cx="50" cy="94" rx="22" ry="3" fill="#000" opacity=".4" filter="${o.B}"/>
      <path d="M32 94c0-5 8-7 18-7s18 2 18 7z" fill="${o.MV}"/><ellipse cx="50" cy="94" rx="18" ry="2.2" fill="${o.M}"/>
      <path d="M46 88c0-6 1-10 2-14h4c1 4 2 8 2 14z" fill="${o.MH}"/><ellipse cx="50" cy="74" rx="7" ry="2.4" fill="${o.M}"/>
      <path d="M36 72c4 2 24 2 28 0" stroke="${o.M}" stroke-width="2" fill="none"/>
      <defs><radialGradient id="os${o.i}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="${lt(o.c, .7)}"/><stop offset=".35" stop-color="${o.c}"/><stop offset=".75" stop-color="${mix(o.DD, '#120a2a', .4)}"/><stop offset="1" stop-color="#05040c"/></radialGradient>
      <clipPath id="oc${o.i}"><circle cx="50" cy="42" r="19"/></clipPath></defs>
      <circle cx="50" cy="42" r="30" fill="${o.G}" class="rl-pulse"/>
      <path d="M20 42a30 30 0 0 1 60 0" stroke="${o.M}" stroke-width="2.4" fill="none" transform="rotate(-24 50 42)"/>
      <circle cx="50" cy="42" r="19" fill="url(#os${o.i})"/>
      <g clip-path="url(#oc${o.i})"><g class="rl-spin-slow" style="transform-origin:50px 42px">${Array.from({ length: 22 }, (_, k) => `<circle cx="${f1(32 + hash(k + 70) * 36)}" cy="${f1(24 + hash(k + 80) * 36)}" r="${f1(.3 + hash(k + 90) * .8)}" fill="#fff" opacity="${f1(.5 + hash(k) * .5)}"/>`).join('')}
        <path d="M34 36l8 4 6-6 8 6 10-4" stroke="#fff" stroke-opacity=".45" stroke-width=".4" fill="none"/></g>
        <ellipse cx="43" cy="34" rx="9" ry="6" fill="#fff" opacity=".35" filter="${o.B}"/></g>
      <circle cx="50" cy="42" r="19" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".6"/>
      <ellipse cx="50" cy="42" rx="30" ry="9" fill="none" stroke="${o.M}" stroke-width="2.4" transform="rotate(-18 50 42)"/>
      <ellipse cx="50" cy="42" rx="30" ry="9" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".5" stroke-dasharray="1 2.4" transform="rotate(-18 50 42)"/>
      <g class="rl-spin-slow r" style="transform-origin:50px 42px"><ellipse cx="50" cy="42" rx="11" ry="30" fill="none" stroke="${o.A}" stroke-width="1.6" transform="rotate(28 50 42)"/><circle cx="64" cy="16" r="2.2" fill="${o.K}"/></g>
      <circle cx="50" cy="11" r="2.4" fill="${o.M}"/><path d="M50 11v-4" stroke="${o.M}" stroke-width="1.4"/>
      ${spark(50, 5, 3.6, '#fff', -.4)}`,
    crown: o => `
      <path d="M22 62c4-6 52-6 56 0" fill="#2a1240"/>
      <ellipse cx="50" cy="62" rx="28" ry="6" fill="#1a0c2a"/>
      <path d="M20 70 13 32l15 16 6-24 9 22 7-30 7 30 9-22 6 24 15-16-7 38c-10 5-50 5-60 0z" fill="url(#ir${o.i})"/>
      <path d="M20 70 13 32l15 16 6-24 9 22 7-30 7 30 9-22 6 24 15-16-7 38c-10 5-50 5-60 0z" fill="${o.M}" opacity=".72"/>
      <path d="M20 70 13 32l15 16 6-24 9 22 7-30 7 30 9-22 6 24 15-16-7 38" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width=".7" stroke-linejoin="round"/>
      ${[[24, 56, 4], [37, 48, 4.5], [63, 48, 4.5], [76, 56, 4]].map(([x, y, r]) => `<path d="M${x} ${y - r * 2}c${r} ${r * 1.2} ${r} ${r * 2.4} 0 ${r * 3.4}c${-r} ${-r} ${-r} ${-r * 2.2} 0 ${-r * 3.4}z" fill="#1a0c2a" opacity=".85"/><circle cx="${x}" cy="${y}" r="${r * .62}" fill="${o.K}"/>`).join('')}
      <path d="M50 30c4 6 4 14 0 22-4-8-4-16 0-22z" fill="#1a0c2a" opacity=".8"/>
      ${[[13, 32, 3], [34, 24, 2.8], [50, 16, 3.6], [66, 24, 2.8], [87, 32, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y - r + .5}" r="${r}" fill="${o.PE}"/><circle cx="${x - r * .35}" cy="${y - r * 1.3 + .5}" r="${r * .3}" fill="#fff"/>`).join('')}
      <path d="M19 68c10 5 52 5 62 0l1 10c-12 6-52 6-64 0z" fill="${o.MV}"/>
      <path d="M19 68c10 5 52 5 62 0l1 10c-12 6-52 6-64 0z" fill="url(#ir${o.i})" opacity=".35"/>
      <path d="M20 70c10 5 50 5 60 0" stroke="#fff" stroke-opacity=".85" stroke-width=".7" fill="none"/>
      <path d="M20 77c10 5 50 5 61 0" stroke="#fff" stroke-opacity=".5" stroke-width=".5" fill="none"/>
      ${Array.from({ length: 15 }, (_, k) => { const x = 22 + k * 4, y = 73.6 + Math.sin(k / 14 * Math.PI) * 4; return `<path d="M${x} ${f1(y)}l2 -2.2 2 2.2 -2 2.2z" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".35"/>`; }).join('')}
      <path d="M50 58c-6-4-12-4-15 0M50 58c6-4 12-4 15 0" stroke="#fff" stroke-opacity=".6" stroke-width=".5" fill="none"/>
      ${[26, 34, 42, 58, 66, 74].map((x, k) => `<circle cx="${x}" cy="${74 + (k === 2 || k === 3 ? 1.8 : k === 1 || k === 4 ? 1.2 : 0)}" r="${k % 2 ? 1.8 : 1.4}" fill="${k % 2 ? o.K : o.PE}"/>`).join('')}
      <g transform="translate(43 63) scale(.14)">${gemBody(o.i + 'c', '#ffe1ee', '#c0396a', 'round', 2)}</g>
      <g transform="translate(41.5 37) scale(.17)">${gemBody(o.i + 'd', '#f6f8ff', '#b7c4ff', 'pear', 3)}</g>
      ${spark(50, 8, 4, '#fff', -.2)}${spark(14, 22, 2.6, '#fff', -1.3)}${spark(86, 22, 2.6, '#fff', -2.1)}`,
    star: o => `
      <defs><linearGradient id="tl${o.i}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${o.c}" stop-opacity="0"/><stop offset=".7" stop-color="${o.L}" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".95"/></linearGradient></defs>
      <path d="M6 96C24 82 40 64 52 46l6 6C44 66 28 82 6 96z" fill="url(#tl${o.i})" filter="${o.B}"/>
      <path d="M10 92C26 80 40 66 52 50" stroke="#fff" stroke-opacity=".6" stroke-width=".6" fill="none"/>
      ${Array.from({ length: 10 }, (_, k) => { const t = k / 10; return `<circle class="rl-tw" style="animation-delay:${f1(-k * .4)}s" cx="${f1(12 + t * 38 + (hash(k) - .5) * 8)}" cy="${f1(90 - t * 40 + (hash(k + 3) - .5) * 8)}" r="${f1(.6 + hash(k + 7))}" fill="${k % 3 ? '#fff' : o.L}"/>`; }).join('')}
      <circle cx="58" cy="42" r="26" fill="${o.GW}" class="rl-pulse"/>
      <g transform="translate(58 42)">
        ${[0, 90, 180, 270].map(r => `<g transform="rotate(${r})"><path d="M0 -36 6 -6 0 0z" fill="url(#ir${o.i})"/><path d="M0 -36 -6 -6 0 0z" fill="#fff"/><path d="M0 -36 6 -6 0 0z" fill="${o.c}" opacity=".35"/></g>`).join('')}
        ${[45, 135, 225, 315].map(r => `<g transform="rotate(${r})"><path d="M0 -20 4.5 -4.5 0 0z" fill="url(#ir${o.i})"/><path d="M0 -20 -4.5 -4.5 0 0z" fill="#fff" opacity=".85"/></g>`).join('')}
        <path d="M0-36 6-6 36 0 6 6 0 36-6 6-36 0-6-6z" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width=".5"/>
        <circle r="7" fill="#fff" filter="${o.B}"/><circle r="3.4" fill="#fff"/>
      </g>`,
  };

  // ---------- rarity aura ----------
  function auraBack(i, lvl) {
    let s = `<circle cx="50" cy="50" r="48" fill="url(#g${i})" opacity="${[.32, .45, .55, .7, .85][lvl]}"/>`;
    if (lvl >= 2) s += `<circle cx="50" cy="50" r="45" fill="none" stroke="url(#ry${i})" stroke-width=".7" stroke-dasharray="1 3.2" class="rl-spin-slow" style="transform-origin:50px 50px"/>`;
    if (lvl >= 3) {
      const rays = Array.from({ length: 16 }, (_, k) => { const a = k * 22.5 * Math.PI / 180, w = (k % 2 ? 2.2 : 4) * Math.PI / 180, R = k % 2 ? 42 : 50; return `M50 50L${f1(50 + R * Math.sin(a - w))} ${f1(50 - R * Math.cos(a - w))}L${f1(50 + R * Math.sin(a + w))} ${f1(50 - R * Math.cos(a + w))}Z`; }).join('');
      s += `<path d="${rays}" fill="url(#ry${i})" opacity="${lvl === 4 ? .32 : .3}" class="rl-spin" style="transform-origin:50px 50px"/>`;
    }
    if (lvl === 4) {
      const rays2 = Array.from({ length: 10 }, (_, k) => { const a = (k * 36 + 9) * Math.PI / 180, w = 1.6 * Math.PI / 180; return `M50 50L${f1(50 + 50 * Math.sin(a - w))} ${f1(50 - 50 * Math.cos(a - w))}L${f1(50 + 50 * Math.sin(a + w))} ${f1(50 - 50 * Math.cos(a + w))}Z`; }).join('');
      s += `<path d="${rays2}" fill="url(#ir${i})" opacity=".14" class="rl-spin r" style="transform-origin:50px 50px"/>`;
      s += `<circle cx="50" cy="50" r="41" fill="none" stroke="url(#ir${i})" stroke-width=".5" stroke-dasharray="14 5 1 5" opacity=".55" class="rl-spin-slow r" style="transform-origin:50px 50px"/>`;
    }
    return s;
  }
  const SPOTS = [[18, 20, 3.6], [82, 28, 3], [80, 80, 3.2], [20, 76, 2.6], [50, 5, 3], [92, 56, 2.4], [8, 50, 2.2]];
  function auraFront(i, lvl, c, sd = 0) {
    const off = sd % SPOTS.length, spots = SPOTS.slice(off).concat(SPOTS.slice(0, off));
    let s = spots.slice(0, [1, 2, 3, 5, 7][lvl]).map(([x, y, r], k) => spark(x, y, r, k % 2 ? lt(c, .5) : '#fff', -(k * .83 + (x % 3)))).join('');
    if (lvl === 4) {
      const dots = [0, 120, 240].map((a, k) => `<g transform="rotate(${a})"><circle cx="44" cy="0" r="${4 - k * .6}" fill="url(#gw${i})"/><circle cx="44" cy="0" r="${1 - k * .2}" fill="#fff"/></g>`).join('');
      s += `<g transform="translate(50 52) rotate(-16) scale(1 .34)"><g class="rl-orbit"><ellipse rx="44" ry="44" fill="none" stroke="url(#ir${i})" stroke-opacity=".35" stroke-width=".8"/>${dots}</g></g>`;
    }
    return s;
  }

  function relicSvg(it, size = 72, locked = false) {
    const i = 'r' + (++n);
    const lvl = RLV[it.r] || 0;
    let body, color;
    if (it.art) {
      const [art, metal] = String(it.art).split(':');
      color = it.color;
      const gold = metal ? metal === 'gold' : lvl >= 3;
      const o = ctx(i, color, gold);
      body = defs(i, color) + (ART[art] || ART.star)(o);
    } else {
      color = mix(it.a, it.b, .5);
      body = defs(i, color) + `<g>${gemBody(i, it.a, it.b, it.shape, lvl, it.id)}</g>`;
    }
    const back = locked ? '' : auraBack(i, lvl);
    const front = locked ? '' : auraFront(i, lvl, color, seedOf(it.id || ''));
    return H.svg(`<svg viewBox="0 0 100 100" width="${size}" height="${size}" class="relic-svg rl-${it.r}${locked ? ' locked' : ''}" overflow="visible">${back}<g class="rl-body">${body}</g>${front}</svg>`);
  }

  // ---------- showcase ----------
  // relic artwork is drawn only when its niche scrolls into view — the page opens instantly
  let io = null;
  function lazyRelic(it, size, locked) {
    const box = h('div.niche-relic');
    box._paint = () => { if (box._done) return; box._done = true; box.appendChild(relicSvg(it, size, locked)); };
    if (!('IntersectionObserver' in window)) { box._paint(); return box; }
    if (!io) io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); e.target._paint && e.target._paint(); } }), { rootMargin: '300px 0px' });
    requestAnimationFrame(() => io.observe(box));
    return box;
  }
  function showcase(host) {
    const g = H.store.get().game;
    const have = id => g.inventory.find(x => x.id === id);
    const ORDER = H.game.ORDER;
    const relics = Object.values(H.game.ITEMS).filter(it => it.relic).sort((a, b) => ORDER.indexOf(a.r) - ORDER.indexOf(b.r));
    const got = relics.filter(r => have(r.id)).length;
    const owned = () => relics.filter(x => have(x.id));
    const niche = (it, idx) => {
      const own = have(it.id);
      const r = H.game.RAR[it.r];
      const el = h('div.niche.n-' + it.r + (own ? '' : '.empty'), { style: { '--rc': r.color, animationDelay: (idx * 35) + 'ms' } },
        h('div.niche-arch'), h('div.niche-light'),
        lazyRelic(it, 118, !own),
        h('div.niche-pedestal'),
        h('div.niche-label', h('b', own ? it.name : '???'), h('span', r.name + (own && own.count > 1 ? ` · ×${own.count}` : ''))));
      el.addEventListener('pointermove', e => {
        const b = el.getBoundingClientRect();
        const x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
        el.style.setProperty('--rx', (-y * 12).toFixed(2) + 'deg'); el.style.setProperty('--ry', (x * 16).toFixed(2) + 'deg');
        el.style.setProperty('--lx', ((x + .5) * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
      if (own) el.addEventListener('click', () => inspect(owned(), it));
      return el;
    };
    const wrap = h('div.halls');
    let idx = 0;
    ORDER.slice().reverse().forEach(rk => {
      const list = relics.filter(x => x.r === rk);
      if (!list.length) return;
      const r = H.game.RAR[rk];
      const gotN = list.filter(x => have(x.id)).length;
      wrap.append(
        h('div.hall-head.hh-' + rk, { style: { '--rc': r.color } }, h('i'), h('b', r.name), h('span', `${gotN} / ${list.length}`), h('em')),
        h('div.hall', list.map(it => niche(it, idx++))));
    });
    host.appendChild(h('div.showcase',
      h('div.showcase-head', h('div', h('h2', 'Витрина реликвий'), h('div.sub', `Собрано ${got} из ${relics.length}. Нажми на реликвию, чтобы рассмотреть её ближе.`)),
        h('div.showcase-progress', h('i', { style: { width: (got / relics.length * 100) + '%' } }))),
      h('div.dust', Array.from({ length: 26 }, (_, k) => h('i', { style: { left: ((k * 41) % 100) + '%', animationDelay: (-(k * 1.3) % 12) + 's', animationDuration: (9 + (k % 5) * 2) + 's' } }))),
      wrap));
  }

  function inspect(list, it) {
    let idx = list.indexOf(it);
    if (idx < 0) idx = 0;
    const stage = h('div.inspect');
    const close = () => { stage.classList.add('out'); setTimeout(() => stage.remove(), 400); document.removeEventListener('keydown', key); };
    const key = e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
    const go = d => { idx = (idx + d + list.length) % list.length; draw(); };
    const draw = () => {
      H.clear(stage);
      const cur = list[idx];
      const r = H.game.RAR[cur.r];
      const own = H.store.get().game.inventory.find(x => x.id === cur.id);
      stage.className = 'inspect ins-' + cur.r;
      stage.style.setProperty('--rc', r.color);
      const lvl = RLV[cur.r] || 0;
      stage.append(
        h('div.inspect-bg'),
        h('div.inspect-rays'),
        h('div.inspect-relic', h('div.inspect-halo'), h('div.spin3d', relicSvg(cur, 300)), h('div.inspect-plinth')),
        h('div.inspect-info',
          h('div.inspect-r', h('span.inspect-stars', '✦'.repeat(lvl + 1)), r.name),
          h('h2', cur.name),
          h('p', cur.lore || ''),
          h('div.inspect-meta', h('span', `В коллекции: ${own ? own.count : 0}`), h('span', `${idx + 1} / ${list.length}`))),
        list.length > 1 ? h('button.inspect-nav.prev', { onclick: () => go(-1) }, H.icon('chevron', 26)) : null,
        list.length > 1 ? h('button.inspect-nav.next', { onclick: () => go(1) }, H.icon('chevron', 26)) : null,
        h('button.inspect-x', { onclick: close }, H.icon('x', 20)));
    };
    draw();
    document.body.appendChild(stage);
    document.addEventListener('keydown', key);
  }

  H.relics = { relicSvg, showcase, inspect, gemBody };
})(window.H);
