'use strict';
(function (H) {
  // Left half of the outline (viewer's left), from the neck down around the arm and leg to the crotch.
  const LEFT = [
    [112, 58], [111.5, 72], [110, 82], [103, 87], [92, 90], [82, 93], [75, 99], [71.5, 109],
    [70, 124], [68.5, 146], [66.5, 166], [64.5, 184], [62, 204], [59.5, 224], [57.5, 242], [56, 255],
    [53.5, 266], [52.5, 279], [54, 291], [58, 297], [62, 293], [63.5, 282], [64.5, 268], [66, 256],
    [69, 238], [72, 218], [75, 198], [77.5, 180], [79.5, 158], [81, 138], [82.5, 122],
    [83.5, 134], [86, 152], [90.5, 170], [93, 184], [91.5, 200], [86, 216], [80.5, 232], [79, 248],
    [80.5, 270], [84, 300], [88, 332], [91, 362], [92.5, 386], [91, 408], [91, 432], [94, 462],
    [97.5, 490], [99.5, 506], [98.5, 520], [100.5, 531], [106, 535], [110.5, 531], [111.5, 518],
    [111.5, 504], [113.5, 478], [114.5, 448], [113.5, 418], [113, 392], [114.5, 360], [116, 322],
    [117.5, 288], [118.5, 270], [120, 262],
  ];
  const W = 240;
  function outlinePoints() {
    const right = LEFT.slice(0, -1).reverse().map(([x, y]) => [W - x, y]);
    return LEFT.concat(right);
  }
  // closed Catmull-Rom spline -> cubic bezier path
  function smoothPath(pts, t = 0.5) {
    const n = pts.length;
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * t * 2, p1[1] + (p2[1] - p0[1]) / 6 * t * 2];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * t * 2, p2[1] - (p3[1] - p1[1]) / 6 * t * 2];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
    }
    return d + 'Z';
  }
  const BODY = smoothPath(outlinePoints());
  const HAIR_BACK = 'M97,34 C97,6 143,6 143,34 C146,58 147,84 144,112 C141,124 133,126 130,116 C132,100 132,86 128,78 L112,78 C108,86 108,100 110,116 C107,126 99,124 96,112 C93,84 94,58 97,34Z';
  const HAIR_FRONT = 'M98,36 C98,14 118,8 132,14 C140,18 144,28 143,38 C136,28 126,22 114,24 C106,26 100,30 98,36Z';

  const ZONES = [
    { z: 'head', shapes: [[120, 40, 28, 34]] },
    { z: 'chest', shapes: [[120, 122, 34, 26]] },
    { z: 'stomach', shapes: [[120, 186, 26, 20]] },
    { z: 'pelvis', shapes: [[120, 236, 38, 20]] },
    { z: 'hands', shapes: [[64, 200, 13, 100], [176, 200, 13, 100]] },
    { z: 'legs', shapes: [[103, 400, 15, 132], [137, 400, 15, 132]] },
  ];
  const HEAD = 'cx="120" cy="38" rx="21.5" ry="28"';
  // fine contour lines that give the figure definition (collarbones, bust, waist, knees)
  const DETAIL = 'M104,92 Q112,96 118,94 M136,92 Q128,96 122,94 M97,132 Q106,144 117,138 M143,132 Q134,144 123,138 M119,206 q1,2 2,0 M103,382 q4,4 8,0 M137,382 q-4,4 -8,0';

  function figure(style) {
    const acc = 'var(--accent)';
    if (style === 'abstract') {
      return `
        <defs><linearGradient id="sgA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${acc}" stop-opacity=".6"/><stop offset="1" stop-color="var(--accent-2)" stop-opacity=".35"/></linearGradient></defs>
        <ellipse ${HEAD} fill="url(#sgA)"/>
        <rect x="112" y="62" width="16" height="26" rx="7" fill="url(#sgA)" opacity=".8"/>
        <path d="M80,94 Q120,84 160,94 L148,180 Q120,190 92,180Z" fill="url(#sgA)"/>
        <path d="M93,188 Q120,196 147,188 L161,250 Q120,268 79,250Z" fill="url(#sgA)" opacity=".9"/>
        <rect x="61" y="96" width="14" height="200" rx="7" fill="url(#sgA)" opacity=".75" transform="rotate(5 68 196)"/>
        <rect x="165" y="96" width="14" height="200" rx="7" fill="url(#sgA)" opacity=".75" transform="rotate(-5 172 196)"/>
        <path d="M82,262 L118,262 L112,520 Q104,530 98,520Z" fill="url(#sgA)" opacity=".8"/>
        <path d="M158,262 L122,262 L128,520 Q136,530 142,520Z" fill="url(#sgA)" opacity=".8"/>`;
    }
    if (style === 'chrome') {
      return `
        <defs>
          <linearGradient id="chB" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#2d3138"/><stop offset=".16" stop-color="#cfd4dc"/><stop offset=".3" stop-color="#5f656f"/>
            <stop offset=".47" stop-color="#f6f8fa"/><stop offset=".6" stop-color="#7d838d"/><stop offset=".8" stop-color="#d4d8df"/><stop offset="1" stop-color="#30343b"/>
          </linearGradient>
          <linearGradient id="chV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".45"/>
          </linearGradient>
          <linearGradient id="chI" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#ffc8e0"/><stop offset=".25" stop-color="#bff0ff"/><stop offset=".5" stop-color="#dcffcf"/><stop offset=".75" stop-color="#fff0b8"/><stop offset="1" stop-color="#dcccff"/>
          </linearGradient>
          <linearGradient id="chH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6c727c"/><stop offset=".35" stop-color="#c3c8d0"/><stop offset=".5" stop-color="#f1f3f6"/><stop offset=".68" stop-color="#9aa0aa"/><stop offset="1" stop-color="#5d636d"/></linearGradient>
          <radialGradient id="chHead" cx=".4" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#d7dbe2"/><stop offset=".75" stop-color="#7c828c"/><stop offset="1" stop-color="#3a3e45"/></radialGradient>
          <filter id="chGlow"><feGaussianBlur stdDeviation="10"/></filter>
        </defs>
        <path d="${BODY}" fill="#cfd8e6" opacity=".12" filter="url(#chGlow)"/>
        <path d="${HAIR_BACK}" fill="url(#chH)"/>
        <path d="${BODY}" fill="url(#chB)"/>
        <path d="${BODY}" fill="url(#chV)"/>
        <path d="${BODY}" fill="url(#chI)" opacity=".16" style="mix-blend-mode:color"/>
        <ellipse ${HEAD} fill="url(#chHead)"/>
        <path d="${HAIR_FRONT}" fill="url(#chH)" opacity=".9"/>
        <path d="${BODY}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.3"/>
        <ellipse ${HEAD} fill="none" stroke="#fff" stroke-opacity=".65" stroke-width=".9"/>
        <path d="${DETAIL}" fill="none" stroke="#1a1d22" stroke-opacity=".35" stroke-width="1" stroke-linecap="round"/>`;
    }
    if (style === 'soft') {
      return `
        <defs>
          <linearGradient id="sgS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${acc}" stop-opacity=".42"/><stop offset=".55" stop-color="var(--accent-2)" stop-opacity=".28"/><stop offset="1" stop-color="${acc}" stop-opacity=".16"/></linearGradient>
          <linearGradient id="sgH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${acc}" stop-opacity=".75"/><stop offset="1" stop-color="${acc}" stop-opacity=".35"/></linearGradient>
          <filter id="sgBlur"><feGaussianBlur stdDeviation="8"/></filter>
        </defs>
        <path d="${BODY}" fill="${acc}" opacity=".18" filter="url(#sgBlur)" transform="translate(0,6)"/>
        <path d="${HAIR_BACK}" fill="url(#sgH)"/>
        <path d="${BODY}" fill="url(#sgS)" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/>
        <ellipse ${HEAD} fill="url(#sgS)" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/>
        <path d="${HAIR_FRONT}" fill="url(#sgH)"/>
        <path d="${DETAIL}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1" stroke-linecap="round"/>`;
    }
    // line
    return `
      <path d="${HAIR_BACK}" fill="none" stroke="var(--text)" stroke-opacity=".28" stroke-width="1.4"/>
      <path d="${BODY}" fill="${acc}" fill-opacity=".07" stroke="var(--text)" stroke-opacity=".7" stroke-width="1.8" stroke-linejoin="round"/>
      <ellipse ${HEAD} fill="var(--surface-solid)" fill-opacity=".5" stroke="var(--text)" stroke-opacity=".5" stroke-width="1.6"/>
      <path d="${HAIR_FRONT}" fill="var(--text)" fill-opacity=".14" stroke="var(--text)" stroke-opacity=".4" stroke-width="1.2"/>
      <path d="${DETAIL}" fill="none" stroke="var(--text)" stroke-opacity=".28" stroke-width="1.1" stroke-linecap="round"/>`;
  }

  // active: {zone: maxScore}
  function silhouette(style, active, onZone) {
    let glows = '';
    ZONES.forEach(({ z, shapes }) => {
      const v = active[z];
      if (v == null) return;
      shapes.forEach(([cx, cy, rx, ry]) => {
        glows += `<ellipse class="zone-glow" cx="${cx}" cy="${cy}" rx="${rx * 1.05}" ry="${ry * 1.05}" fill="${H.scoreColor(v, 1)}" filter="url(#zgBlur)" style="opacity:${0.35 + v / 18}"/>`;
      });
    });
    let hits = '';
    ZONES.forEach(({ z, shapes }) => {
      shapes.forEach(([cx, cy, rx, ry]) => {
        hits += `<ellipse class="zone-hit" data-zone="${z}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"><title>${H.ZONES[z]}</title></ellipse>`;
      });
    });
    const svgEl = H.svg(`<svg class="silhouette sil-${style}" viewBox="40 0 160 545" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="zgBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter></defs>
      ${figure(style)}
      <g class="glows">${glows}</g>
      <g class="hits">${hits}</g>
    </svg>`);
    svgEl.querySelectorAll('.zone-hit').forEach(el => {
      el.addEventListener('click', () => onZone && onZone(el.dataset.zone, el.getBoundingClientRect()));
      el.addEventListener('mouseenter', () => svgEl.querySelectorAll(`.zone-hit[data-zone="${el.dataset.zone}"]`).forEach(x => x.classList.add('hover')));
      el.addEventListener('mouseleave', () => svgEl.querySelectorAll('.zone-hit.hover').forEach(x => x.classList.remove('hover')));
    });
    return svgEl;
  }

  // small static preview for settings
  function silhouettePreview(style) {
    return H.svg(`<svg class="silhouette sil-${style}" viewBox="40 0 160 545">${figure(style)}</svg>`);
  }

  H.silhouette = silhouette;
  H.silhouettePreview = silhouettePreview;
})(window.H);
