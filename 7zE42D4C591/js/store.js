'use strict';
(function (H) {
  const DEFAULTS = () => ({
    version: 1,
    createdAt: Date.now(),
    settings: {
      theme: 'silver',
      accent: '#c8ced8',
      silhouette: 'chrome',
      themeChosen: true,
      glass: 60,           // 0..100 blur/transparency intensity
      animations: true,
      fontScale: 1,
      pinSidebar: false,
      hiddenBlocks: [],
      customSymptoms: [],  // [{id,name,z}]
      customEmotions: [],  // [{id,name,e,g,v}]
      collapsed: { lifestyle: true, vitals: true },
    },
    profile: {
      name: '', birth: '', height: '', blood: '',
      weightLog: [],       // [{date, kg}]
      conditions: [], allergies: [], notes: '',
      cycleLength: 28, periodLength: 5, lastPeriod: '',
      doctors: [],         // [{id,name,spec,contact,nextVisit,notes}]
    },
    meds: [],              // [{id,name,dose,unit:'мг',times,slots[],kind,start,active,notes,doseHistory[]}]
    labs: [],
    labPlans: [],          // [{id,date,names[],note,done}]              // [{id,key,name,unit,min,max,recheckWeeks,results:[{id,date,value}]}]
    days: {},              // 'YYYY-MM-DD' -> day record
    tests: [],             // [{id,test,date,answers,score}]
    game: { crystals: 0, earned: {}, inventory: [], freeCase: '', opened: 0, equipped: {} },
  });

  let data = null;
  let saveTimer = null;
  const listeners = new Set();
  const hasApi = !!window.api;

  function merge(def, obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(def)) return obj === undefined ? def : obj;
    const out = { ...def };
    for (const k in obj) out[k] = (k in def && def[k] && typeof def[k] === 'object' && !Array.isArray(def[k])) ? merge(def[k], obj[k]) : obj[k];
    return out;
  }

  async function load() {
    let raw = null;
    try {
      raw = hasApi ? await window.api.load() : JSON.parse(localStorage.getItem('healthDiary') || 'null');
    } catch (e) { raw = null; }
    data = merge(DEFAULTS(), raw || {});
    fixDates();
    syncCustomEmotions();
    return data;
  }

  function syncCustomEmotions() {
    (data.settings.customEmotions || []).forEach(ce => { const ex = H.EMOTIONS.find(e => e.id === ce.id); if (ex) ex.hidden = !!ce.hidden; else H.EMOTIONS.push({ ...ce, custom: true }); });
  }
  // repair implausible dates typed by mistake (e.g. year 2000 instead of 2026)
  function fixDates() {
    const p = data.profile, t = H.today();
    if (p.lastPeriod && (p.lastPeriod > t || H.diffDays(t, p.lastPeriod) > 200)) {
      const md = p.lastPeriod.slice(5);
      let cand = t.slice(0, 4) + '-' + md;
      if (cand > t) cand = (Number(t.slice(0, 4)) - 1) + '-' + md;
      p.lastPeriod = H.diffDays(t, cand) <= 120 ? cand : '';
    }
  }

  function persistNow() {
    clearTimeout(saveTimer); saveTimer = null;
    try {
      if (hasApi) return window.api.save(data);
      localStorage.setItem('healthDiary', JSON.stringify(data));
    } catch (e) { console.error(e); }
  }
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persistNow, 350);
    listeners.forEach(fn => fn());
  }
  window.addEventListener('beforeunload', () => { if (saveTimer) persistNow(); });

  function get() { return data; }
  function replace(obj) { data = merge(DEFAULTS(), obj); persistNow(); listeners.forEach(fn => fn()); }
  function reset() { data = DEFAULTS(); persistNow(); }
  function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  function emptyDay(date) {
    return {
      date, createdAt: Date.now(), updatedAt: null, edited: {},
      general: {},      // overall, energy, stress
      emotions: {},     // id -> {score, note, noteOpen}
      symptoms: {},     // id -> {score, note}
      sleep: {},        // bed, wake, quality, wakeups, nap
      cycle: {},        // period, flow, pain, pms, pmsSymptoms[]
      meds: {},         // medId -> {slots:[bool], dose}
      lifestyle: {},    // appetite, water, caffeine, ironFood, teaNearIron, alcohol, walk, activity, social
      vitals: {},       // pulse, sys, dia, weight, temp
      complaints: '', thoughts: '', activitiesText: '', activities: [], photos: [],
      report: null,
    };
  }
  function day(date, create) {
    let d = data.days[date];
    if (!d && create) { d = emptyDay(date); data.days[date] = d; }
    return d || null;
  }
  // mark a block of a day as edited now
  function touch(date, block) {
    const d = day(date, true);
    const now = Date.now();
    d.edited[block] = now;
    d.updatedAt = now;
    save();
  }

  // ---- custom symptoms & catalog helpers
  function allSymptoms() {
    return H.SYMPTOMS.concat((data.settings.customSymptoms || []).map(s => ({ ...s, g: 'custom' })));
  }
  function symptomById(id) { return allSymptoms().find(s => s.id === id); }

  Object.assign(H, { store: { syncCustomEmotions, load, save, get, replace, reset, onChange, day, touch, emptyDay, persistNow, allSymptoms, symptomById, hasApi } });
})(window.H);
