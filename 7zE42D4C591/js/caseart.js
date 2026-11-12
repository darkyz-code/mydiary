'use strict';
/* Case illustrations v1.7 — a distinct, premium design per case id */
(function (H) {
  let n = 0;
  const f1 = v => (+v).toFixed(1);
  const hash = k => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const P = pts => 'M' + pts.map(p => p.join(' ')).join('L') + 'Z';
  function spark(x, y, r, col = '#fff', d = 0) {
    const k = r * .14;
    return `<g class="rl-tw" style="animation-delay:${d}s"><path d="M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z" fill="${col}"/><circle cx="${x}" cy="${y}" r="${f1(r * .22)}" fill="#fff"/></g>`;
  }
  const lin = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
  const rad = (id, stops, cx = .5, cy = .5, r = .5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;
  const CHROME = [[0, '#ffffff'], [.22, '#d7dce4'], [.45, '#727987'], [.55, '#434955'], [.72, '#eef1f6'], [.88, '#9aa1ad'], [1, '#f6f8fb']];
  const ROSEGOLD = [[0, '#fff3ee'], [.25, '#f6c6b6'], [.5, '#b9786a'], [.7, '#ffe0d4'], [1, '#d99a8a']];
  const common = u => `<filter id="${u}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="${u}bb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    ${lin(u + 'ch', CHROME, 0, 0, 1, 1)}${lin(u + 'chv', CHROME)}${lin(u + 'chh', CHROME, 0, 0, 1, 0)}`;
  const shadow = (u, rx = 50) => `<ellipse cx="70" cy="110" rx="${rx}" ry="6" fill="#000" opacity=".5" filter="url(#${u}bb)"/>`;

  // ---------- daily: pearl & chrome casket, dawn emblem ----------
  function daily(u, c) {
    const F = [[30, 58], [98, 58], [98, 100], [30, 100]], T = [[30, 58], [98, 58], [112, 47], [44, 47]], S = [[98, 58], [112, 47], [112, 89], [98, 100]];
    const rays = Array.from({ length: 13 }, (_, k) => { const a = (-90 + (k - 6) * 13) * Math.PI / 180, w = .045; return `M70 56L${f1(70 + 70 * Math.cos(a - w))} ${f1(56 + 70 * Math.sin(a - w))}L${f1(70 + 70 * Math.cos(a + w))} ${f1(56 + 70 * Math.sin(a + w))}Z`; }).join('');
    return `<defs>${common(u)}
      ${rad(u + 'g', [[0, c, .85], [.5, c, .25], [1, c, 0]])}
      ${rad(u + 'r', [[0, '#ffffff', .9], [.4, c, .35], [1, c, 0]], .5, .8, .6)}
      ${lin(u + 'f', [[0, '#f7fafd'], [.55, '#c4ccd8'], [1, '#e9eef4']])}
      ${lin(u + 't', [[0, '#ffffff'], [1, '#dde4ec']], 0, 0, 1, 0)}
      ${lin(u + 's', [[0, '#9aa4b3'], [1, '#5c6573']])}
      ${rad(u + 'e', [[0, '#2a4466'], [1, '#0b1322']], .4, .35, .7)}
      ${rad(u + 'sun', [[0, '#ffffff'], [.45, '#e4f8ff'], [1, c]], .5, .9, .9)}
    </defs>
    <ellipse cx="70" cy="62" rx="68" ry="54" fill="url(#${u}g)" class="rl-pulse"/>
    <g filter="url(#${u}b)"><path d="${rays}" fill="url(#${u}r)" opacity=".5" class="cs-rays"/></g>
    ${shadow(u)}
    <path d="${P(F)}" fill="url(#${u}f)"/><path d="${P(T)}" fill="url(#${u}t)"/><path d="${P(S)}" fill="url(#${u}s)"/>
    <path d="M35 74h58v22H35z" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".6"/><path d="M35.6 96.4h58V74.6" stroke="#7d8796" stroke-opacity=".5" stroke-width=".6" fill="none"/>
    <path d="M30 66h68v4H30z" fill="url(#${u}chv)"/><path d="M98 66l14-11v4l-14 11z" fill="url(#${u}chv)"/>
    <path d="M30 68.2h68" stroke="${c}" stroke-width="1" class="rl-pulse"/><path d="M30 68.2h68" stroke="${c}" stroke-width="3" opacity=".5" filter="url(#${u}b)"/>
    <path d="M30 58h68l14-11M98 58v42" stroke="#fff" stroke-width=".9" stroke-opacity=".9" fill="none"/>
    <path d="M30 58v42h68l14-11V47H44L30 58z" stroke="url(#${u}ch)" stroke-width="1.4" fill="none" stroke-linejoin="round"/>
    ${[[30, 58], [98, 58], [30, 100], [98, 100]].map(([x, y], k) => `<path d="M${x} ${y}h${k % 2 ? -7 : 7}M${x} ${y}v${k > 1 ? -7 : 7}" stroke="url(#${u}chh)" stroke-width="3" stroke-linecap="round"/>`).join('')}
    <path d="M62 52c-1-8 6-11 10-11s11 2 10 9" stroke="url(#${u}ch)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M63 51c0-6 5-8 9-8" stroke="#fff" stroke-width=".7" fill="none" stroke-opacity=".9"/>
    <circle cx="64" cy="84" r="12.5" fill="url(#${u}ch)"/><circle cx="64" cy="84" r="10.5" fill="url(#${u}e)"/>
    <clipPath id="${u}k"><circle cx="64" cy="84" r="10.5"/></clipPath>
    <g clip-path="url(#${u}k)">
      ${Array.from({ length: 9 }, (_, k) => `<path d="M64 88L${f1(64 + 13 * Math.cos(Math.PI + k * Math.PI / 8))} ${f1(88 + 13 * Math.sin(Math.PI + k * Math.PI / 8))}" stroke="${c}" stroke-width=".8" opacity=".8"/>`).join('')}
      <circle cx="64" cy="88" r="5.6" fill="url(#${u}sun)"/><circle cx="64" cy="88" r="8" fill="${c}" opacity=".5" filter="url(#${u}b)"/>
      <path d="M52 88h24" stroke="#fff" stroke-width=".8" opacity=".9"/><path d="M52 91h24" stroke="#fff" stroke-width=".4" opacity=".4"/>
    </g>
    <path d="M57 77a10 10 0 0 1 9-3" stroke="#fff" stroke-width=".8" fill="none" stroke-opacity=".7"/>
    <path d="M33 62v34" stroke="#fff" stroke-width="1.4" stroke-opacity=".8"/>
    <path class="cs-sheen" d="M30 58h14l-14 42z" fill="#fff" opacity=".35"/>
    ${spark(114, 38, 4, '#fff', -.4)}${spark(24, 50, 2.6, c, -1.6)}${spark(104, 96, 2.4, '#fff', -2.4)}`;
  }

  // ---------- care: satin gift box, heart charm ----------
  function care(u, c) {
    const heart = (x, y, s) => `M${x} ${y + s * .9}C${x - s * 1.4} ${y} ${x - s * 1.1} ${y - s * 1.1} ${x} ${y - s * .35}C${x + s * 1.1} ${y - s * 1.1} ${x + s * 1.4} ${y} ${x} ${y + s * .9}Z`;
    return `<defs>${common(u)}
      ${rad(u + 'g', [[0, '#ffd2c2', .9], [.5, c, .35], [1, c, 0]])}
      ${lin(u + 'f', [[0, '#ffefe8'], [1, '#f2b3ad']])}${lin(u + 's', [[0, '#e9a7a2'], [1, '#c98080']])}
      ${lin(u + 'lf', [[0, '#fff6f2'], [1, '#ffd2ca']])}${lin(u + 'lt', [[0, '#fffaf8'], [1, '#ffe6df']], 0, 0, 1, 0)}${lin(u + 'ls', [[0, '#f6c0b7'], [1, '#e19e97']])}
      ${lin(u + 'rb', [[0, '#ffb3cc'], [.45, '#ff7aa6'], [.55, '#ff9cbd'], [1, '#e2518a']], 0, 0, 1, 0)}
      ${lin(u + 'rv', [[0, '#ffc4d6'], [.5, '#ff7aa6'], [1, '#d94882']])}
      ${lin(u + 'rg', ROSEGOLD, 0, 0, 1, 1)}
      ${rad(u + 'pk', [[0, '#ffffff'], [.3, '#ffd0e0'], [1, '#e2457f']], .35, .3, .8)}
      <pattern id="${u}dot" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".7" fill="#fff" opacity=".55"/></pattern>
    </defs>
    <ellipse cx="70" cy="64" rx="66" ry="52" fill="url(#${u}g)" class="rl-pulse"/>
    ${shadow(u, 46)}
    <path d="${P([[34, 62], [94, 62], [94, 102], [34, 102]])}" fill="url(#${u}f)"/>
    <path d="${P([[34, 62], [94, 62], [94, 102], [34, 102]])}" fill="url(#${u}dot)"/>
    <path d="${P([[94, 62], [108, 51], [108, 91], [94, 102]])}" fill="url(#${u}s)"/>
    <path d="M60 62h8v40h-8z" fill="url(#${u}rb)"/>
    <path d="M94 80l14-11v6l-14 11z" fill="url(#${u}rv)"/>
    <path d="M37 64v36" stroke="#fff" stroke-opacity=".8" stroke-width="1.2"/>
    <path d="${P([[31, 52], [97, 52], [97, 64], [31, 64]])}" fill="url(#${u}lf)"/>
    <path d="${P([[31, 52], [97, 52], [111, 41], [45, 41]])}" fill="url(#${u}lt)"/>
    <path d="${P([[97, 52], [111, 41], [111, 53], [97, 64]])}" fill="url(#${u}ls)"/>
    <path d="M31 64h66l14-11" stroke="#c98080" stroke-opacity=".5" stroke-width=".8" fill="none"/>
    <path d="M31 52h66l14-11M97 52v12" stroke="#fff" stroke-width=".9" fill="none"/>
    <path d="M60 52h8v12h-8z" fill="url(#${u}rb)"/>
    <path d="${P([[60, 52], [68, 52], [82, 41], [74, 41]])}" fill="url(#${u}rv)"/>
    <path d="${P([[37, 49], [103, 49], [107, 45.6], [41, 45.6]])}" fill="url(#${u}rv)"/>
    <path d="M97 47l14-11v4l-14 11z" fill="url(#${u}rv)" opacity="0"/>
    <g class="cs-bow">
      <path d="M71 46C62 30 46 32 52 44c3 5 12 5 19 2z" fill="url(#${u}rv)"/><path d="M71 46C80 30 96 32 90 44c-3 5-12 5-19 2z" fill="url(#${u}rv)"/>
      <path d="M70 46c-6-6-12-10-15-8M72 46c6-6 12-10 15-8" stroke="#ffd9e6" stroke-width=".9" fill="none"/>
      <path d="M69 47 60 64l4-1 2 4 6-19zM73 47l9 16-4 0-1 4-6-19z" fill="url(#${u}rb)"/>
      <ellipse cx="71" cy="46.5" rx="4" ry="3.4" fill="url(#${u}rb)"/><ellipse cx="70" cy="45.6" rx="1.6" ry="1" fill="#fff" opacity=".8"/>
    </g>
    <path d="M73 49c4 6 8 10 9 18" stroke="url(#${u}rg)" stroke-width=".9" fill="none" stroke-dasharray="1.4 .8"/>
    <g class="cs-swing" style="transform-origin:82px 67px">
      <path d="${heart(82, 74, 7)}" fill="url(#${u}rg)"/><path d="${heart(82, 74.4, 5)}" fill="url(#${u}pk)"/>
      <circle cx="79.5" cy="71.5" r="1.1" fill="#fff"/><circle cx="82" cy="67" r="1.4" fill="none" stroke="url(#${u}rg)" stroke-width=".8"/>
    </g>
    ${[[22, 40, 4, 0], [118, 30, 3, -1.4], [112, 84, 2.6, -2.6], [26, 82, 2.4, -3.4]].map(([x, y, s, d]) => `<path class="cs-float" style="animation-delay:${d}s" d="${heart(x, y, s)}" fill="url(#${u}pk)" opacity=".85"/>`).join('')}
    <path class="cs-sheen" d="M34 62h12l-12 40z" fill="#fff" opacity=".4"/>
    ${spark(100, 30, 3, '#fff', -.8)}${spark(40, 34, 2.4, '#fff', -2)}`;
  }

  // ---------- crystal: glass vitrine with ice crystals ----------
  function crystal(u, c) {
    const prism = (x, y, w, h, rot, k) => {
      const hw = w / 2, tip = h * .28;
      return `<g transform="translate(${x} ${y}) rotate(${rot})">
        <path d="M${-hw} 0V${-h + tip}L0 ${-h}L${hw} ${-h + tip}V0z" fill="url(#${u}ic)"/>
        <path d="M${-hw} 0V${-h + tip}L${-hw * .25} ${-h + tip + 2}V2z" fill="#fff" opacity=".45"/>
        <path d="M${hw * .3} 2V${-h + tip + 2}L${hw} ${-h + tip}V0z" fill="#2a7fc0" opacity=".35"/>
        <path d="M${-hw} ${-h + tip}L0 ${-h}L${-hw * .25} ${-h + tip + 2}z" fill="#fff" opacity=".85"/>
        <path d="M${hw * .3} ${-h + tip + 2}L0 ${-h}L${hw} ${-h + tip}z" fill="#9fdcff" opacity=".7"/>
        <path d="M${-hw} 0V${-h + tip}L0 ${-h}L${hw} ${-h + tip}V0M${-hw * .25} 2V${-h + tip + 2}L0 ${-h}M${hw * .3} 2V${-h + tip + 2}" stroke="#fff" stroke-opacity=".7" stroke-width=".5" fill="none"/>
        <path d="M${-hw + 1} -3V${-h + tip + 2}" stroke="#fff" stroke-width=".8"/>
        ${k ? spark(-hw * .2, -h + tip + 4, 2.6, '#fff', -k) : ''}
      </g>`;
    };
    const F = [[36, 60], [96, 60], [96, 94], [36, 94]], T = [[36, 60], [96, 60], [108, 50], [48, 50]], S = [[96, 60], [108, 50], [108, 84], [96, 94]];
    return `<defs>${common(u)}
      ${rad(u + 'g', [[0, '#e9fbff', .9], [.45, c, .45], [1, '#9fdcff', 0]])}
      ${lin(u + 'ic', [[0, '#ffffff'], [.35, '#d8f3ff'], [.75, '#7cc6ef'], [1, '#3d8fc8']], 0, 0, 1, 1)}
      ${lin(u + 'gf', [[0, '#ffffff', .22], [.5, '#cfefff', .06], [1, '#ffffff', .3]], 0, 0, 1, 1)}
      ${lin(u + 'fr', [[0, '#ffffff', 0], [.7, '#ffffff', .12], [1, '#ffffff', .55]])}
      ${lin(u + 'pr', [[0, '#ff8ad8'], [.2, '#ffd27a'], [.4, '#fffb9a'], [.6, '#8affc2'], [.8, '#7ad0ff'], [1, '#b18aff']], 0, 0, 1, 1)}
    </defs>
    <ellipse cx="70" cy="58" rx="68" ry="56" fill="url(#${u}g)" class="rl-pulse"/>
    <g opacity=".55" filter="url(#${u}b)"><path d="M46 46 0 70l2 6z" fill="#ff9ad6"/><path d="M46 46 2 76l3 5z" fill="#fff59a"/><path d="M46 46 5 81l3 4z" fill="#8affd0"/><path d="M46 46 8 85l4 3z" fill="#8ab8ff"/></g>
    ${shadow(u, 52)}
    <path d="${P([[26, 96], [104, 96], [104, 106], [26, 106]])}" fill="url(#${u}chv)"/>
    <path d="${P([[26, 96], [104, 96], [118, 85], [40, 85]])}" fill="url(#${u}ch)"/>
    <path d="${P([[104, 96], [118, 85], [118, 95], [104, 106]])}" fill="#5d6573"/>
    <path d="M26 96h78l14-11" stroke="#fff" stroke-width=".8" fill="none"/>
    <path d="${P(S)}" fill="#bfe6ff" opacity=".1"/><path d="${P(T)}" fill="#e6f7ff" opacity=".12"/>
    ${prism(84, 90, 9, 44, 20, 0)}${prism(56, 92, 9, 52, -22, 0)}${prism(98, 88, 6, 26, 34, 0)}
    ${prism(72, 92, 15, 82, 2, 1.2)}${prism(60, 94, 8, 36, -8, 0)}${prism(86, 94, 9, 40, 10, 2.4)}${prism(44, 94, 6, 20, -38, 0)}
    <path d="${P(F)}" fill="url(#${u}gf)"/><path d="${P(F)}" fill="url(#${u}fr)"/>
    ${Array.from({ length: 26 }, (_, k) => `<circle cx="${f1(38 + hash(k) * 56)}" cy="${f1(86 + hash(k + 9) * 7)}" r="${f1(.3 + hash(k + 3) * .8)}" fill="#fff" opacity="${f1(.4 + hash(k + 5) * .6)}"/>`).join('')}
    <path d="M36 60h60l12-10H48z" stroke="url(#${u}pr)" stroke-width="1.1" fill="none" stroke-linejoin="round"/>
    <path d="M36 60v34h60V60M96 94l12-10V50" stroke="url(#${u}pr)" stroke-width="1" fill="none" opacity=".85"/>
    <path d="M36 60v34h60V60M96 94l12-10V50" stroke="#fff" stroke-width=".4" fill="none"/>
    <path d="M40 64v26" stroke="#fff" stroke-width="1.6" stroke-opacity=".8" stroke-linecap="round"/>
    <path d="M100 60v22" stroke="#fff" stroke-width="1" stroke-opacity=".4"/>
    <path class="cs-sheen" d="M36 60h12l-12 34z" fill="#fff" opacity=".45"/>
    ${spark(73, 6, 4.4, '#fff', -.3)}${spark(30, 34, 2.6, '#cfefff', -1.7)}${spark(116, 44, 3, '#fff', -2.5)}${spark(112, 70, 2, '#ffd6f5', -3.2)}`;
  }

  // ---------- gothic «Лунный кейс»: violet reliquary under the moon ----------
  function gothic(u, c) {
    const chest = 'M22 66V50C22 31 44 22 70 22S118 31 118 50V66H116V104Q116 106 114 106H26Q24 106 24 104V66z';
    const curl = (x, s) => `M${x} 56c${s * 2}-8 ${s * 12}-9 ${s * 13}-2s${-s * 6} 7 ${-s * 8} 2 ${s * 1}-4 ${s * 4}-3`;
    return `<defs>${common(u)}
      ${rad(u + 'g', [[0, '#8f63ff', .75], [.5, '#4b2a9a', .35], [1, '#24124d', 0]])}
      ${rad(u + 'm', [[0, '#ffffff'], [.55, '#e3e6f5'], [.85, '#b9bfdc'], [1, '#9198bd']], .38, .35, .7)}
      ${rad(u + 'mh', [[0, '#e7e0ff', .7], [.5, '#b9a6ff', .25], [1, '#b9a6ff', 0]])}
      ${lin(u + 'lid', [[0, '#4a2a80'], [.6, '#24134a'], [1, '#150b2e']])}
      ${lin(u + 'bd', [[0, '#2c1857'], [1, '#0d0720']])}
      ${rad(u + 'en', [[0, '#2a1e52'], [1, '#07040f']], .4, .35, .7)}
      ${rad(u + 'ms', [[0, '#ffffff'], [.4, '#e9ecff'], [1, '#a9b4ff']], .3, .3, .8)}
      ${rad(u + 'gm', [[0, '#ffffff'], [.3, '#e6c9ff'], [1, '#7a2fd0']], .35, .3, .8)}
      ${lin(u + 'ns', [[0, '#f2f4fb'], [.3, '#a7adc4'], [.55, '#4a4f68'], [.8, '#d4d8e8'], [1, '#8d93ad']], 0, 0, 1, 0)}
      ${lin(u + 'nsv', [[0, '#f2f4fb'], [.35, '#9da3bc'], [.6, '#454a62'], [1, '#c7cce0']])}
      ${rad(u + 'seam', [[0, '#ffffff', 1], [.3, '#d9c8ff', .8], [1, '#8f63ff', 0]])}
      ${lin(u + 'sh', [[0, '#ffffff', 0], [.45, '#ffffff', 0], [.5, '#e9dcff', .5], [.55, '#ffffff', 0], [1, '#ffffff', 0]], 0, 0, 1, 0)}
      <clipPath id="${u}k"><path d="${chest}"/></clipPath>
    </defs>
    <ellipse cx="70" cy="58" rx="70" ry="58" fill="url(#${u}g)" class="rl-pulse"/>
    <circle cx="104" cy="30" r="34" fill="url(#${u}mh)"/>
    <circle cx="104" cy="30" r="22" fill="url(#${u}m)"/>
    <circle cx="97" cy="24" r="4" fill="#9aa0c0" opacity=".25"/><circle cx="110" cy="36" r="5.5" fill="#9aa0c0" opacity=".2"/><circle cx="108" cy="20" r="2.4" fill="#9aa0c0" opacity=".25"/><circle cx="96" cy="38" r="2" fill="#9aa0c0" opacity=".22"/>
    ${Array.from({ length: 14 }, (_, k) => { const x = f1(4 + hash(k + 11) * 132), y = f1(4 + hash(k + 23) * 46); return hash(k + 2) > .6 ? spark(+x, +y, 1.6 + hash(k) * 2, '#fff', -(k * .6)) : `<circle class="rl-tw" style="animation-delay:${f1(-k * .5)}s" cx="${x}" cy="${y}" r="${f1(.5 + hash(k) * .7)}" fill="#fff"/>`; }).join('')}
    ${shadow(u, 54)}
    <path d="${chest}" fill="url(#${u}bd)"/>
    <path d="M22 66V50C22 31 44 22 70 22S118 31 118 50V66z" fill="url(#${u}lid)"/>
    <g clip-path="url(#${u}k)">
      <path d="M37 0h4v110h-4zM99 0h4v110h-4z" fill="url(#${u}ns)"/>
      <path d="M37.6 0v110M99.6 0v110" stroke="#fff" stroke-opacity=".6" stroke-width=".4"/>
      <path d="M20 62.5h100v4H20zM20 101h100v6H20z" fill="url(#${u}nsv)"/>
      <path d="M27 60V50c0-15 18-23 43-23s43 8 43 23v10" stroke="url(#${u}ns)" stroke-width=".7" fill="none" opacity=".8"/>
      <path d="M28 71h84v27H28z" fill="none" stroke="url(#${u}ns)" stroke-width=".6" opacity=".6"/>
      <path d="${curl(46, 1)}M${70 + 24} 56" stroke="url(#${u}ch)" stroke-width=".9" fill="none"/>
      <path d="${curl(94, -1)}" stroke="url(#${u}ch)" stroke-width=".9" fill="none"/>
      <path d="M46 92c4-8 8-10 12-10M94 92c-4-8-8-10-12-10M46 78c3-3 6-4 9-4M94 78c-3-3-6-4-9-4" stroke="url(#${u}ch)" stroke-width=".8" fill="none" opacity=".8"/>
      <rect class="cs-sweep" x="-40" y="0" width="60" height="110" fill="url(#${u}sh)"/>
    </g>
    <path d="M22 66V50C22 31 44 22 70 22S118 31 118 50V66" stroke="url(#${u}ns)" stroke-width="1.4" fill="none"/>
    <ellipse cx="70" cy="68.4" rx="44" ry="2.2" fill="url(#${u}seam)" class="rl-pulse"/><path d="M26 68.4h88" stroke="#efe6ff" stroke-width=".5" opacity=".9"/>
    <path d="M26 46c4-14 22-20 44-20" stroke="#fff" stroke-opacity=".5" stroke-width=".8" fill="none"/>
    <path d="M24 66v38q0 2 2 2h88q2 0 2-2V66" stroke="url(#${u}ns)" stroke-width="1.1" fill="none"/>
    ${[[39, 66], [101, 66], [39, 103], [101, 103]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="url(#${u}gm)" stroke="url(#${u}ch)" stroke-width=".7"/>`).join('')}
    ${[30, 50, 60, 80, 90, 110].map(x => `<circle cx="${x}" cy="66" r=".9" fill="#fff" opacity=".85"/><circle cx="${x}" cy="104" r=".9" fill="#fff" opacity=".7"/>`).join('')}
    ${[[23, 52, 1], [117, 52, -1]].map(([x, y]) => `<path d="M${x - 3.4} ${y}h6.8l-1 -3h-4.8z" fill="url(#${u}nsv)"/><path d="M${x - 2.4} ${y - 3}c0-4 1.6-7 2.4-12 .8 5 2.4 8 2.4 12z" fill="url(#${u}ns)"/><path d="M${x} ${y - 15}c-1.2 1.4-1.2 2.6 0 3.6 1.2-1 1.2-2.2 0-3.6z" fill="url(#${u}ms)"/>`).join('')}
    <path d="M64 25h12l-2-3h-8z" fill="url(#${u}nsv)"/><path d="M67.4 22c0-5 1.6-8 2.6-13 1 5 2.6 8 2.6 13z" fill="url(#${u}ns)"/>
    <path d="M58 26c4-3 8-3 12-3s8 0 12 3" stroke="url(#${u}ns)" stroke-width=".8" fill="none"/>
    <circle cx="70" cy="44" r="13" fill="url(#${u}ns)"/>
    ${Array.from({ length: 16 }, (_, k) => `<path d="M70 29.4l1.2 2.4h-2.4z" fill="url(#${u}ns)" transform="rotate(${k * 22.5} 70 44)"/>`).join('')}
    <circle cx="70" cy="44" r="10.6" fill="url(#${u}en)"/>
    <circle cx="70" cy="44" r="8" fill="#c9b8ff" opacity=".45" filter="url(#${u}b)" class="rl-pulse"/>
    <path d="M73 36.5a8 8 0 1 0 0 15 6.2 6.2 0 1 1 0-15z" fill="url(#${u}ms)"/>
    ${spark(75, 41, 2.2, '#fff', -.6)}
    <path d="M60 104V84c0-8 5-12 10-16 5 4 10 8 10 16v20z" fill="url(#${u}nsv)"/>
    <path d="M63 104V85c0-6 3-9 7-12.6 4 3.6 7 6.6 7 12.6v19z" fill="url(#${u}en)"/>
    <circle cx="70" cy="84" r="3.4" fill="url(#${u}gm)"/><circle cx="69" cy="83" r="1" fill="#fff"/>
    <path d="M70 92a2 2 0 0 1 1.2 3.6l.8 4.4h-4l.8-4.4A2 2 0 0 1 70 92z" fill="#cfd4e6"/>
    ${spark(70, 9, 4.6, '#fff', -.2)}${spark(16, 30, 2.6, '#e6dcff', -1.8)}${spark(126, 74, 2.8, '#fff', -2.6)}`;
  }

  const DESIGNS = { daily, care, crystal, gothic };
  H.caseArt = function (cs, size = 130) {
    const u = 'cz' + (++n) + '_';
    const fn = DESIGNS[cs.id] || daily;
    return H.svg(`<svg viewBox="0 0 140 120" width="${size}" height="${f1(size * 120 / 140)}" class="case-svg cs-${cs.id}" overflow="visible">${fn(u, cs.color || '#9fe6ff')}</svg>`);
  };
})(window.H);
