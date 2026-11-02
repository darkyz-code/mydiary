'use strict';
(function (H) {
  const mem = {}; // browser fallback
  function readImage(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { res(img); setTimeout(() => URL.revokeObjectURL(url), 1000); };
      img.onerror = rej;
      img.src = url;
    });
  }
  function scale(img, maxSide, q, cover) {
    const c = document.createElement('canvas');
    let w = img.naturalWidth, hh = img.naturalHeight;
    if (cover) {
      c.width = c.height = maxSide;
      const s = Math.min(w, hh);
      c.getContext('2d').drawImage(img, (w - s) / 2, (hh - s) / 2, s, s, 0, 0, maxSide, maxSide);
    } else {
      const k = Math.min(1, maxSide / Math.max(w, hh));
      c.width = Math.round(w * k); c.height = Math.round(hh * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    }
    return c.toDataURL('image/jpeg', q);
  }
  async function add(file) {
    const img = await readImage(file);
    const id = 'p_' + H.uid();
    const full = scale(img, 1800, .86);
    const thumb = scale(img, 160, .72, true);
    if (window.api && window.api.photoSave) await window.api.photoSave(id, full);
    else mem[id] = full;
    return { id, thumb, ts: Date.now() };
  }
  async function load(id) {
    if (window.api && window.api.photoLoad) return window.api.photoLoad(id);
    return mem[id] || null;
  }
  function remove(id) {
    if (window.api && window.api.photoRemove) window.api.photoRemove(id);
    delete mem[id];
  }
  function view(p, onDelete) {
    const img = H.h('img.photo-full', { src: p.thumb, alt: '' });
    load(p.id).then(full => { if (full) img.src = full; });
    const m = H.ui.modal('Фото дня', img, {
      wide: true, cls: 'photo-modal',
      actions: [
        H.h('button.btn.ghost', { style: { marginRight: 'auto', color: '#e5484d' }, onclick: async () => { if (await H.ui.confirm('Удалить это фото?', 'Удалить', true)) { m.close(); onDelete && onDelete(); } } }, H.icon('trash', 16), 'Удалить'),
        H.h('button.btn.primary', { onclick: () => m.close() }, 'Закрыть'),
      ],
    });
  }
  H.photos = { add, load, remove, view };
})(window.H);
