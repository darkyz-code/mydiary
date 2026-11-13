'use strict';
/* Thin-line icon set (24×24, stroke 1.5). H.icon(name, size) returns an <svg> element. */
(function (H) {
  const P = {
    home: '<path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5.5h4V20"/>',
    sun: '<circle cx="12" cy="12" r="3.6"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
    calendar: '<rect x="3.8" y="5.5" width="16.4" height="14.7" rx="3"/><path d="M3.8 10h16.4M8.3 3.5v3.6M15.7 3.5v3.6"/><circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none"/>',
    chart: '<path d="M4 19.5h16"/><path d="M5.5 15.5l4-4.2 3.2 2.8 5.8-6.6"/><path d="M15.5 7.5h3v3"/>',
    card: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.6"/><circle cx="9" cy="11" r="2"/><path d="M6 15.6c.6-1.5 1.7-2.2 3-2.2s2.4.7 3 2.2M14.5 10h3.5M14.5 13.2h2.5"/>',
    clipboard: '<rect x="5" y="4.8" width="14" height="16" rx="2.4"/><path d="M9 4.8V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v.8"/><path d="M8.6 11.5l2 2 4-4.2M8.6 17h6.8"/>',
    book: '<path d="M12 6.5C10.2 5 7.6 4.5 4.5 4.8v13.4c3.1-.3 5.7.2 7.5 1.7 1.8-1.5 4.4-2 7.5-1.7V4.8c-3.1-.3-5.7.2-7.5 1.7z"/><path d="M12 6.5v13.4"/>',
    file: '<path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z"/><path d="M14 3.5V8h4.5M9 13h6M9 16.5h4"/>',
    settings: '<circle cx="12" cy="12" r="2.8"/><path d="M12 3.2l1.4 2.3 2.6-.6.6 2.6 2.3 1.4-1.2 2.3 1.2 2.3-2.3 1.4-.6 2.6-2.6-.6L12 20.8l-1.4-2.3-2.6.6-.6-2.6L5.1 15l1.2-2.3L5.1 10.4l2.3-1.4.6-2.6 2.6.6z"/>',
    gem: '<path d="M7 4h10l4 5.2L12 20.5 3 9.2z"/><path d="M3 9.2h18M9.5 4 8 9.2l4 11.3 4-11.3L14.5 4"/>',
    sparkle: '<path d="M12 3.5c.6 3.9 2.3 5.6 6.2 6.2-3.9.6-5.6 2.3-6.2 6.2-.6-3.9-2.3-5.6-6.2-6.2 3.9-.6 5.6-2.3 6.2-6.2z"/><path d="M18.5 15.5c.2 1.4.9 2.1 2.3 2.3-1.4.2-2.1.9-2.3 2.3-.2-1.4-.9-2.1-2.3-2.3 1.4-.2 2.1-.9 2.3-2.3z"/>',
    mind: '<path d="M7.5 18.5c-2.5-.7-4-2.8-4-5.6C3.5 8.4 7.3 5 12 5s8.5 3.4 8.5 7.9-3.8 7.6-8.5 7.6c-.9 0-1.8-.1-2.6-.3L5.5 21.5z"/><path d="M8.5 12.5h.01M12 12.5h.01M15.5 12.5h.01" stroke-width="2.2"/>',
    body: '<circle cx="12" cy="4.8" r="2"/><path d="M8 9.2c2.6-.8 5.4-.8 8 0M12 8.8v6M9.6 21l2.4-6.2 2.4 6.2M7.5 9.4 6.4 15M16.5 9.4l1.1 5.6"/>',
    moon: '<path d="M19.5 14.2A7.8 7.8 0 0 1 9.8 4.5 7.8 7.8 0 1 0 19.5 14.2z"/>',
    flower: '<circle cx="12" cy="12" r="2.2"/><path d="M12 9.8c-1.7-1.8-1.7-4.3 0-6 1.7 1.7 1.7 4.2 0 6zM14.2 12c1.8-1.7 4.3-1.7 6 0-1.7 1.7-4.2 1.7-6 0zM12 14.2c1.7 1.8 1.7 4.3 0 6-1.7-1.7-1.7-4.2 0-6zM9.8 12c-1.8 1.7-4.3 1.7-6 0 1.7-1.7 4.2-1.7 6 0z"/>',
    pill: '<rect x="3.2" y="8.6" width="17.6" height="6.8" rx="3.4" transform="rotate(-40 12 12)"/><path d="M9.4 9.1l5.2 5.8"/>',
    leaf: '<path d="M5 19c0-8 5-13 14.5-13.5C19 15 14 20 6 19.5z"/><path d="M5 19c3.5-3.8 6.8-6.6 10-8.5"/>',
    pulse: '<path d="M3 12h3.8l2.2-5 3.8 10 2.4-5H21"/>',
    note: '<path d="M5 4.5h10.5L19 8v11.5H5z"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/>',
    feather: '<path d="M19.5 4.5C12 4.5 7 9.5 7 17v2.5"/><path d="M19.5 4.5c0 7.5-4.5 12-11.5 12.5M10.5 13.5h4.5"/>',
    list: '<path d="M9 7h11M9 12h11M9 17h11"/><circle cx="5" cy="7" r=".9" fill="currentColor"/><circle cx="5" cy="12" r=".9" fill="currentColor"/><circle cx="5" cy="17" r=".9" fill="currentColor"/>',
    camera: '<path d="M4 8.2h3.2l1.6-2.4h6.4l1.6 2.4H20v11H4z"/><circle cx="12" cy="13.4" r="3.4"/>',
    chevron: '<path d="M6.5 9.5 12 15l5.5-5.5"/>',
    arrow: '<path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5"/>',
    drop: '<path d="M12 3.5c3.2 4.2 5.8 7.6 5.8 10.6a5.8 5.8 0 0 1-11.6 0c0-3 2.6-6.4 5.8-10.6z"/>',
    flask: '<path d="M9.5 3.5h5M10.3 3.5v5.6L5.2 18a1.8 1.8 0 0 0 1.6 2.6h10.4a1.8 1.8 0 0 0 1.6-2.6l-5.1-8.9V3.5"/><path d="M7.4 14.5h9.2"/>',
    doctor: '<path d="M6 3.5v5a4.5 4.5 0 0 0 9 0v-5"/><path d="M10.5 13v2.5a5 5 0 0 0 10 0v-1.2"/><circle cx="20.5" cy="12.5" r="1.8"/>',
    scale: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 9a5.5 5.5 0 0 1 8 0l-2.2 2.3a2.5 2.5 0 0 0-3.6 0z"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.8 20c1-3.6 3.7-5.6 7.2-5.6s6.2 2 7.2 5.6"/>',
    heart: '<path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.3c0 5.6-7.5 10-7.5 10z"/>',
    star: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/>',
    pencil: '<path d="m15 4 5 5M4 20l4.5-1 12-12a2.1 2.1 0 0 0-5-5l-12 12L4 20Z"/>',
    eye: '<path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    wind: '<path d="M3.5 9h11a3 3 0 1 0-3-3M3.5 13h15a3 3 0 1 1-3 3M3.5 17h6"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11M12 9C10.5 5.5 6.5 5 7 7.5S12 9 12 9zm0 0c1.5-3.5 5.5-4 5-1.5S12 9 12 9z"/>',
    crown: '<path d="M4 17.5 3 7.5l5 4 4-6 4 6 5-4-1 10z"/><path d="M4.5 20.5h15"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    check: '<path d="M5 12.5 10 17.5 19.5 7"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"/>',
    bell: '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
    cloud: '<path d="M7.5 18.5h9.5a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 9.2a4.7 4.7 0 0 0 .5 9.3z"/><path d="M9.5 13.5l2.5-2.5 2.5 2.5M12 11v5"/>',
    reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
    brain: '<path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-1.5 5.3A3.2 3.2 0 0 0 7.5 18 3 3 0 0 0 12 19.5V5.6A2.8 2.8 0 0 0 9 4.5zM15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 1.5 5.3 3.2 3.2 0 0 1-3 5.2A3 3 0 0 1 12 19.5"/>',
    bolt: '<path d="M13 3 5 13.5h6L10.5 21 19 10.5h-6z"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/>',
    image: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4"/>',
    glass: '<path d="M7 3.5h10l-1.2 7a3.8 3.8 0 0 1-7.6 0zM12 14.5v6M8.5 20.5h7"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".9" fill="currentColor"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    fire: '<path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.4 2.6-5 3.4-8.4 1.9 1.3 2.6 3 2.6 4.6 1.2-.8 1.9-2.2 2-3.6C16.3 9.6 18 12.2 18 15.4 18 18.6 15.6 21 12 21z"/>',
  };
  function icon(name, size = 20, cls = '') {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('width', size); s.setAttribute('height', size);
    s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '1.5'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('class', 'ic' + (name === 'eye' ? ' privacy-eye' : name === 'check' ? ' removed-check' : '') + (cls ? ' ' + cls : ''));
    s.innerHTML = P[name] || P.sparkle;
    return s;
  }
  // glass squircle wrapper around an icon
  function gicon(name, size = 20, cls = '') { return H.h('span.gicon' + (cls ? '.' + cls : ''), icon(name, size)); }
  H.icon = icon; H.gicon = gicon; H.ICONS = P;
})(window.H);
