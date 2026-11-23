/* إنجليزي بالعربي — English for Arabic speakers (Tunisia).
 * Single-page app running inside an Android WebView. Native features come from window.Android
 * (see MainActivity.kt); in a normal browser it falls back to the Web Speech API / an online translator. */
(function () {
  'use strict';

  // ---------------------------------------------------------------- helpers
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const DAY = 86400000;

  const I = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 6.5v11a1 1 0 0 0 1.6.8l7.4-5.5a1 1 0 0 0 0-1.6L6.6 5.7A1 1 0 0 0 5 6.5z"/><rect x="16" y="5" width="3" height="14" rx="1"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.5v11a1 1 0 0 1-1.6.8L10 12.8a1 1 0 0 1 0-1.6l7.4-5.5A1 1 0 0 1 19 6.5z"/><rect x="5" y="5" width="3" height="14" rx="1"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5C17 4 14 4.5 12 6z"/><path d="M12 6v14.5"/></svg>',
    cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="6" width="14" height="15" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5h8M8 3v2M10.5 5c-.8 3.5-3 6.5-6.5 8M6 9c1.2 2 3 3.5 5 4.5"/><path d="M13 21l4-10 4 10M14.5 17.5h5"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/></svg>'
  };

  // ---------------------------------------------------------------- storage
  const store = {
    get(k, d) { try { const v = localStorage.getItem('ea_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('ea_' + k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } }
  };
  const settings = Object.assign({ rate: 0.8, showAr: true, accent: 'en-US', voice: '', goal: 30, fontSize: 20, theme: 'auto', planOpen: true }, store.get('settings', {}));
  const saveSettings = () => store.set('settings', settings);
  let saved = store.get('saved', {});            // word -> {ar, ex, box, due, added}
  let progress = store.get('progress', {});      // bookId -> {pos, max, done}
  let stats = store.get('stats', { last: '', today: 0, streak: 0, total: 0, lastBook: '' });
  let customBooks = store.get('custom', []);
  let trCache = store.get('trcache', {});
  const saveSaved = () => store.set('saved', saved);
  const saveStats = () => store.set('stats', stats);

  const dayStr = (t) => { const d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const today = () => dayStr(Date.now());
  const yesterday = () => dayStr(Date.now() - DAY);
  function addPoints(n) {
    const t = today();
    if (stats.last !== t) {
      stats.streak = stats.last === yesterday() ? (stats.streak || 0) + 1 : 1;
      stats.last = t; stats.today = 0;
    }
    const before = stats.today;
    stats.today += n; stats.total = (stats.total || 0) + n;
    saveStats();
    if (before < settings.goal && stats.today >= settings.goal) toast('🎉 أحسنت! حقّقت هدف اليوم');
  }
  const streakNow = () => (stats.last === today() || stats.last === yesterday()) ? (stats.streak || 0) : 0;
  const todayPts = () => stats.last === today() ? stats.today : 0;

  function applyTheme() {
    const r = document.documentElement;
    if (settings.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', settings.theme);
    r.style.setProperty('--en-size', settings.fontSize + 'px');
  }

  // ---------------------------------------------------------------- dictionary
  const ALL_WORDS = [];
  const DICT = {};
  (window.THEMES || []).forEach((t) => t.words.forEach(([en, ar, ex]) => {
    ALL_WORDS.push({ en, ar, ex, theme: t.id });
    const k = en.toLowerCase();
    if (!DICT[k]) DICT[k] = { ar, ex };
    const k2 = k.replace(/^to /, '');
    if (!DICT[k2]) DICT[k2] = { ar, ex };
  }));
  Object.keys(window.EXTRA_DICT || {}).forEach((k) => { if (!DICT[k]) DICT[k] = { ar: window.EXTRA_DICT[k] }; });

  function lookup(word) {
    let w = word.toLowerCase().replace(/[’]/g, "'").replace(/^[^a-z]+|[^a-z']+$/g, '').replace(/'s$/, '');
    if (!w) return null;
    const c = [w];
    if (w.endsWith('ies')) c.push(w.slice(0, -3) + 'y');
    if (w.endsWith('es')) c.push(w.slice(0, -2));
    if (w.endsWith('s')) c.push(w.slice(0, -1));
    if (w.endsWith('ied')) c.push(w.slice(0, -3) + 'y');
    if (w.endsWith('ed')) { c.push(w.slice(0, -2), w.slice(0, -1)); if (/(.)\1ed$/.test(w)) c.push(w.slice(0, -3)); }
    if (w.endsWith('ing')) { c.push(w.slice(0, -3), w.slice(0, -3) + 'e'); if (/(.)\1ing$/.test(w)) c.push(w.slice(0, -4)); }
    if (w.endsWith('ly')) c.push(w.slice(0, -2));
    if (w.endsWith('er')) c.push(w.slice(0, -2), w.slice(0, -1));
    if (w.endsWith('est')) c.push(w.slice(0, -3), w.slice(0, -2));
    for (const k of c) if (DICT[k]) return Object.assign({ base: k }, DICT[k]);
    return null;
  }

  // ---------------------------------------------------------------- speech
  const Native = window.Android || null;
  let webVoices = [];
  if (!Native && window.speechSynthesis) {
    const lv = () => { webVoices = speechSynthesis.getVoices(); };
    lv(); speechSynthesis.onvoiceschanged = lv;
  }

  const Speech = {
    seq: 0, cur: null,
    speak(text, opt) {
      opt = opt || {};
      this.stop();
      const id = 'u' + (++this.seq);
      const lang = opt.lang || settings.accent;
      const rate = opt.rate || settings.rate;
      return new Promise((resolve) => {
        this.cur = { id, resolve, onRange: opt.onRange };
        if (Native) {
          try { Native.speak(text, lang, rate, id); } catch (e) { this._event(id, 'error'); }
        } else if (window.speechSynthesis && webVoices.length) {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = lang === 'ar' ? 'ar-SA' : lang;
          u.rate = rate;
          const v = webVoices.find((x) => x.lang.replace('_', '-') === u.lang) || webVoices.find((x) => x.lang.startsWith(u.lang.slice(0, 2)));
          if (v) u.voice = v; else if (lang === 'ar') { this._event(id, 'nolang'); return; }
          u.onboundary = (e) => { if (e.name === 'word' || e.name == null) { const len = e.charLength || ((text.slice(e.charIndex).match(/^\S+/) || [''])[0].length); this._event(id, 'range', e.charIndex, e.charIndex + len); } };
          u.onend = () => this._event(id, 'done');
          u.onerror = () => this._event(id, 'error');
          speechSynthesis.speak(u);
        } else {
          this._simulate(text, rate, id);
        }
      });
    },
    // Used when no voice exists (e.g. desktop preview): walks through the words with timers.
    _simulate(text, rate, id) {
      const re = /\S+/g; let m; const words = [];
      while ((m = re.exec(text))) words.push([m.index, m.index + m[0].length]);
      let i = 0;
      const step = () => {
        if (!this.cur || this.cur.id !== id) return;
        if (i >= words.length) return this._event(id, 'done');
        this._event(id, 'range', words[i][0], words[i][1]); i++;
        setTimeout(step, 330 / rate);
      };
      step();
    },
    stop() {
      const c = this.cur; this.cur = null;
      if (c) c.resolve('stopped');
      if (Native) { try { Native.stop(); } catch (e) { /* ignore */ } } else if (window.speechSynthesis) speechSynthesis.cancel();
    },
    _event(id, type, s, e) {
      const c = this.cur;
      if (!c || c.id !== id) return;
      if (type === 'range') { if (c.onRange) c.onRange(s, e); return; }
      if (type === 'start') return;
      this.cur = null;
      if (type === 'nolang') noVoice();
      c.resolve(type);
    }
  };
  const say = (text, rate) => Speech.speak(text, { rate });
  const sayAr = (text) => Speech.speak(text, { lang: 'ar', rate: 0.9 });

  function noVoice() {
    sheet(`<h3 style="margin-top:0">🔈 صوت العربية غير مثبّت</h3>
      <p class="muted">لسماع النطق العربي، ثبّت الصوت العربي من إعدادات "تحويل النص إلى كلام" في هاتفك (Google Speech Services).</p>
      ${Native ? '<button class="btn block" data-act="installVoices">تثبيت الأصوات</button>' : ''}`);
  }

  // ---------------------------------------------------------------- translation
  let trSeq = 0; const trPending = {};
  function onlineTranslate(text, dir) {
    const [s, t] = dir.split('-');
    return fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=' + s + '|' + t)
      .then((r) => r.json())
      .then((j) => { const o = j && j.responseData && j.responseData.translatedText; if (!o || /MYMEMORY WARNING|INVALID/i.test(o)) throw new Error('fail'); return o; });
  }
  function translate(text, dir) {
    dir = dir || 'en-ar';
    const key = dir + '|' + text.trim().toLowerCase();
    if (trCache[key]) return Promise.resolve(trCache[key]);
    return new Promise((resolve, reject) => {
      const finish = (out) => {
        trCache[key] = out;
        const keys = Object.keys(trCache); if (keys.length > 800) delete trCache[keys[0]];
        store.set('trcache', trCache); resolve(out);
      };
      const viaWeb = (err) => onlineTranslate(text, dir).then(finish).catch(() => reject(err || 'fail'));
      if (Native && Native.translate) {
        const cb = 't' + (++trSeq);
        const slow = setTimeout(() => toast('⏳ تنزيل نموذج الترجمة لأول مرة (حوالي 30 ميغا)... بعدها تعمل الترجمة بدون إنترنت'), 2500);
        trPending[cb] = (out, err) => { clearTimeout(slow); if (out) finish(out); else viaWeb(err); };
        Native.translate(text, dir, cb);
      } else viaWeb();
    });
  }

  // ---------------------------------------------------------------- speech recognition
  let spSeq = 0; const spPending = {};
  function listenSpeech() {
    return new Promise((resolve) => {
      if (Native && Native.listen) {
        const cb = 's' + (++spSeq); spPending[cb] = resolve; Native.listen('en-US', cb); return;
      }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { toast('التعرّف على الصوت غير متوفّر في هذا الجهاز'); resolve(null); return; }
      const r = new SR(); r.lang = 'en-US'; r.maxAlternatives = 5;
      r.onresult = (e) => resolve(Array.from(e.results[0]).map((x) => x.transcript));
      r.onerror = () => resolve(null);
      r.start(); toast('🎤 تكلّم الآن...');
    });
  }

  window.__native = {
    onReady() { if (current() && current().name === 'settings') render(); },
    onTts(id, type, s, e) { Speech._event(id, type, s, e); },
    onTranslate(cb, out, err) { const f = trPending[cb]; delete trPending[cb]; if (f) f(out, err); },
    onSpeech(cb, arr) { const f = spPending[cb]; delete spPending[cb]; if (f) f(arr && arr.length ? arr : null); }
  };

  // ---------------------------------------------------------------- comparison (dictation / pronunciation)
  const normWords = (s) => s.toLowerCase().replace(/[’]/g, "'").replace(/-/g, ' ').replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
  function compare(target, input) {
    const a = normWords(target), b = normWords(input);
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    let i = 0, j = 0; const out = [];
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i] === b[j]) { out.push(`<span class="ok">${esc(a[i])}</span>`); i++; j++; }
      else if (j < b.length && (i >= a.length || dp[i][j + 1] >= dp[i + 1][j])) { out.push(`<span class="bad">${esc(b[j])}</span>`); j++; }
      else { out.push(`<span class="miss">${esc(a[i])}</span>`); i++; }
    }
    const score = a.length ? dp[0][0] / Math.max(a.length, b.length) : 0;
    return { score, html: `<div class="en diff" style="font-size:18px;line-height:1.9">${out.join(' ')}</div>` };
  }

  // ---------------------------------------------------------------- spaced repetition
  const INTERVALS = [0, 1, 2, 4, 8, 16, 32, 64];
  function saveWord(en, ar, ex) {
    const k = en.toLowerCase();
    if (!saved[k]) { saved[k] = { en, ar: ar || '', ex: ex || '', box: 0, due: Date.now(), added: Date.now() }; saveSaved(); }
  }
  function toggleSave(en, ar, ex) {
    const k = en.toLowerCase();
    if (saved[k]) { delete saved[k]; saveSaved(); toast('حُذفت من كلماتي'); return false; }
    saveWord(en, ar, ex); toast('⭐ أُضيفت إلى كلماتي'); return true;
  }
  function grade(k, g) {
    const w = saved[k]; if (!w) return;
    if (g === 0) { w.box = 0; w.due = Date.now() + 60000; }
    else if (g === 1) { w.box = Math.max(1, w.box); w.due = Date.now() + Math.max(0.5, INTERVALS[w.box] / 2) * DAY; }
    else { w.box = Math.min(INTERVALS.length - 1, w.box + 1); w.due = Date.now() + INTERVALS[w.box] * DAY - 3600000; }
    saveSaved();
  }
  const dueWords = () => Object.keys(saved).filter((k) => saved[k].due <= Date.now());
  const learnedCount = () => Object.values(saved).filter((w) => w.box >= 4).length;

  // ---------------------------------------------------------------- books
  const allBooks = () => window.BOOKS.concat(customBooks);
  const findBook = (id) => allBooks().find((b) => b.id === id);
  const flatten = (book) => { const out = []; book.paragraphs.forEach((p, pi) => p.forEach((s) => out.push({ p: pi, en: s[0], ar: s[1], ref: s }))); return out; };
  function splitSentences(text) {
    return (text.match(/[^.!?]+[.!?]+["'”’)\]]*|[^.!?]+$/g) || []).map((s) => s.trim()).filter(Boolean);
  }

  // ---------------------------------------------------------------- UI primitives
  let toastTimer;
  function toast(msg) {
    let t = $('.toast'); if (t) t.remove();
    t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), 2800);
  }
  function sheet(html) {
    closeSheet();
    const b = document.createElement('div'); b.className = 'backdrop'; b.dataset.act = 'closeSheet';
    const s = document.createElement('div'); s.className = 'sheet'; s.innerHTML = '<div class="grab"></div>' + html;
    document.body.append(b, s);
    return s;
  }
  function closeSheet() { $$('.backdrop,.sheet').forEach((e) => e.remove()); }
  const topbar = (title, sub, opts) => {
    opts = opts || {};
    return `<header class="topbar">${opts.back === false ? '' : `<button class="icon-btn" data-act="back" aria-label="رجوع">${I.back}</button>`}
      <h1>${title}${sub ? `<span class="sub">${sub}</span>` : ''}</h1>${opts.right || ''}</header>`;
  };
  const speedChips = (rate, act) => `<div class="speeds">${[0.5, 0.75, 1, 1.25, 1.5].map((r) =>
    `<button dir="ltr" class="${Math.abs(rate - r) < 0.01 ? 'on' : ''}" data-act="${act}" data-r="${r}">${r}×</button>`).join('')}</div>`;

  // ---------------------------------------------------------------- router
  const TABS = [
    ['home', 'الرئيسية', I.home], ['library', 'المكتبة', I.book], ['words', 'الكلمات', I.cards],
    ['practice', 'تمارين', I.target], ['translate', 'ترجمة', I.globe]
  ];
  let stack = [{ name: 'home', params: {} }];
  const current = () => stack[stack.length - 1];
  function go(name, params) { leaveView(); stack.push({ name, params: params || {} }); render(true); }
  function goTab(name) { leaveView(); stack = [{ name, params: {} }]; render(true); }
  function back() { leaveView(); if (stack.length > 1) stack.pop(); else stack = [{ name: 'home', params: {} }]; render(true); }
  function leaveView() { closeSheet(); if (R) { stopReader(); R = null; } Speech.stop(); quiz = null; }
  window.appBack = function () {
    if ($('.sheet')) { closeSheet(); return true; }
    if (stack.length > 1 || current().name !== 'home') { back(); return true; }
    return false;
  };
  window.onAppPause = function () { if (R && R.playing) pauseReader(); };

  function render(scrollTop) {
    const v = current();
    const view = Views[v.name] || Views.home;
    const app = $('#app');
    app.className = '';
    $('#player-slot').innerHTML = '';
    app.innerHTML = view(v.params) || '';
    const tabName = stack[0].name;
    $('#nav').innerHTML = TABS.map(([n, label, icon]) => `<button class="${n === tabName ? 'on' : ''}" data-act="tab" data-t="${n}">${icon}<span>${label}</span></button>`).join('');
    if (scrollTop) window.scrollTo(0, 0);
    if (view.after) view.after(v.params);
  }

  // ---------------------------------------------------------------- views
  const Views = {};

  Views.home = function () {
    const due = dueWords().length;
    const pts = todayPts();
    const lb = stats.lastBook && findBook(stats.lastBook);
    const wod = ALL_WORDS[Math.floor(Date.now() / DAY) % ALL_WORDS.length];
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'صباح الخير' : hour < 18 ? 'عسلامة' : 'مساء الخير';
    return `${topbar('إنجليزي بالعربي', 'تعلّم الإنجليزية بالاستماع والقراءة', { back: false, right: `<button class="icon-btn" data-act="go" data-v="settings" aria-label="الإعدادات">${I.gear}</button>` })}
    <div class="page">
      <div class="hero">
        <h2>${greet} 👋</h2>
        <p>15 دقيقة كل يوم أفضل من 3 ساعات مرة في الأسبوع.</p>
        <div class="stats">
          <div class="stat"><b>🔥 ${streakNow()}</b><span>أيام متتالية</span></div>
          <div class="stat"><b>⭐ ${pts}/${settings.goal}</b><span>نقاط اليوم</span></div>
          <div class="stat"><b>🧠 ${learnedCount()}</b><span>كلمات محفوظة</span></div>
        </div>
        <div class="goalbar"><i style="width:${Math.min(100, pts / settings.goal * 100)}%"></i></div>
      </div>

      ${lb ? `<div class="section-title">واصل من حيث توقّفت</div>${bookItem(lb)}` : ''}

      ${due ? `<div class="card row" style="background:var(--accent-soft)">
        <div class="grow"><b>🃏 ${due} كلمة تنتظر المراجعة</b><div class="small muted">المراجعة في الوقت المناسب تثبّت الكلمات في الذاكرة</div></div>
        <button class="btn accent" data-act="go" data-v="flash" data-src="due">راجع</button></div>` : ''}

      <div class="section-title">ابدأ بسرعة</div>
      <div class="quick">
        <button data-act="tab" data-t="library"><span class="em">📖</span><b>اقرأ واستمع</b><span>قصص مع ترجمة وصوت</span></button>
        <button data-act="go" data-v="flash" data-src="due"><span class="em">🃏</span><b>بطاقات الكلمات</b><span>تكرار متباعد ذكي</span></button>
        <button data-act="go" data-v="quiz" data-mode="listen"><span class="em">🎧</span><b>اختبار الاستماع</b><span>اسمع واختر المعنى</span></button>
        <button data-act="go" data-v="dictation"><span class="em">✍️</span><b>إملاء</b><span>اسمع واكتب</span></button>
        <button data-act="go" data-v="speak"><span class="em">🎤</span><b>النطق</b><span>ردّد وقيّم نطقك</span></button>
        <button data-act="go" data-v="method"><span class="em">💡</span><b>طريقة التعلّم</b><span>كيف تستعمل التطبيق</span></button>
      </div>

      <div class="section-title">كلمة اليوم</div>
      <div class="card">${wordRow(wod, true)}</div>
    </div>`;
  };

  function bookItem(b) {
    const pr = progress[b.id] || {};
    const total = flatten(b).length || 1;
    const pct = pr.done ? 100 : Math.round(((pr.max || 0) / total) * 100);
    return `<button class="book" data-act="open" data-id="${esc(b.id)}">
      <div class="cover" style="background:${b.color || '#0E7C66'}">${b.emoji || '📘'}</div>
      <div class="grow">
        <h3 class="en" style="text-align:right">${esc(b.title)}</h3>
        <div class="t-ar">${esc(b.titleAr || '')}</div>
        <div class="row small muted" style="margin-top:4px"><span class="level">${b.custom ? 'MY TEXT' : b.level}</span>
          <span>${total} جملة</span>${pr.done ? '<span>✅ مكتمل</span>' : ''}</div>
        <div class="progress"><i style="width:${pct}%"></i></div>
      </div></button>`;
  }

  function wordRow(w, big) {
    const k = w.en.toLowerCase();
    return `<div class="row">
      <button class="sp-btn" data-act="say" data-text="${esc(w.en)}" aria-label="استمع">${I.speaker}</button>
      <div class="grow">
        <div class="en" style="font-weight:700;font-size:${big ? 22 : 17}px">${esc(w.en)}</div>
        <div class="arw" style="color:var(--primary)">${esc(w.ar)}</div>
        ${w.ex ? `<div class="en small muted" data-act="say" data-text="${esc(w.ex)}">🔉 ${esc(w.ex)}</div>` : ''}
      </div>
      <button class="star ${saved[k] ? 'on' : ''}" data-act="star" data-en="${esc(w.en)}" data-ar="${esc(w.ar)}" data-ex="${esc(w.ex || '')}" aria-label="احفظ">★</button>
    </div>`;
  }

  // ---- Library
  let libFilter = 'all';
  Views.library = function () {
    const levels = [['all', 'الكل'], ['A1', 'A1 مبتدئ'], ['A2', 'A2 أساسي'], ['B1', 'B1 متوسط'], ['B2', 'B2 متقدّم'], ['mine', 'نصوصي']];
    const list = allBooks().filter((b) => libFilter === 'all' || (libFilter === 'mine' ? b.custom : b.level === libFilter));
    return `${topbar('المكتبة', 'قصص وحوارات مرتّبة حسب المستوى', { back: false })}
    <div class="page">
      <div class="chips">${levels.map(([k, l]) => `<button class="chip ${libFilter === k ? 'on' : ''}" data-act="lib" data-f="${k}">${l}</button>`).join('')}</div>
      <button class="btn secondary block" style="margin:14px 0" data-act="go" data-v="addtext">＋ أضف نصًّا إنجليزيًا خاصًّا بك (كتاب، مقال، أغنية...)</button>
      ${list.length ? list.map(bookItem).join('') : '<div class="empty"><div class="em">📝</div>لا توجد نصوص بعد. أضف نصًّا من الزر أعلاه.</div>'}
    </div>`;
  };

  // ---- Reader
  let R = null;
  function tokenize(sentence) {
    let html = '', last = 0, m;
    const re = /[A-Za-z0-9][A-Za-z0-9'’-]*/g;
    while ((m = re.exec(sentence))) {
      html += esc(sentence.slice(last, m.index));
      const w = m[0].replace(/[’']s$/, '');
      html += `<span class="w${saved[w.toLowerCase()] ? ' saved' : ''}" data-act="word" data-w="${esc(m[0])}" data-o="${m.index}">${esc(m[0])}</span>`;
      last = m.index + m[0].length;
    }
    return html + esc(sentence.slice(last));
  }

  Views.reader = function (p) {
    const book = findBook(p.id);
    if (!book) return Views.library();
    const sents = flatten(book);
    const pr = progress[book.id] || {};
    R = { book, sents, idx: Math.min(pr.pos || 0, sents.length - 1), playing: false, token: 0, repeat: false, shadow: false, hideAr: !settings.showAr, revealed: {} };
    stats.lastBook = book.id; saveStats();
    let n = 0;
    const paras = book.paragraphs.map((para) => `<div class="para">${para.map(() => sentenceHtml(n++)).join('')}</div>`).join('');
    return `${topbar(`<span class="en" style="text-align:right;display:block">${esc(book.title)}</span>`, esc(book.titleAr || ''), {
      right: book.custom ? `<button class="icon-btn" data-act="delBook" aria-label="حذف">🗑️</button>` : ''
    })}
    <div class="page">
      ${planHtml()}
      ${book.custom && sents.some((s) => !s.ar) ? `<button class="btn secondary block" style="margin-bottom:12px" data-act="trAll">🌐 ترجم كل الجمل إلى العربية</button>` : ''}
      <div id="paras">${paras}</div>
      <div class="center" style="margin:20px 0"><button class="btn" data-act="finishBook">✅ أنهيت القراءة</button></div>
    </div>`;
  };
  Views.reader.after = function () {
    $('#app').className = 'has-player';
    renderPlayer();
    setActive(R.idx, false);
    const el = $('#s' + R.idx); if (el && R.idx > 0) el.scrollIntoView({ block: 'center' });
  };

  function planHtml() {
    const steps = [
      ['1', '🎧 استمع ببطء', 'سرعة 0.6 بدون ترجمة: ركّز على الأصوات'],
      ['2', '📖 افهم', 'اقرأ مع الترجمة واضغط على الكلمات الجديدة'],
      ['3', '🗣️ ردّد', 'وقفة بعد كل جملة لتعيدها بصوتك'],
      ['4', '🚀 بالسرعة العادية', 'سرعة 1.0 بدون ترجمة: هل تفهم كل شيء؟']
    ];
    return `<div class="plan">
      <h4 class="row" data-act="togglePlan" style="cursor:pointer"><span class="grow">💡 خطة الدرس (4 خطوات)</span><span class="small muted">${settings.planOpen ? 'إخفاء ▲' : 'إظهار ▼'}</span></h4>
      ${settings.planOpen ? `<div class="steps">${steps.map(([k, t, d]) => `<button data-act="step" data-s="${k}"><b>${t}</b>${d}</button>`).join('')}</div>` : ''}
    </div>`;
  }

  function sentenceHtml(i) {
    const s = R.sents[i];
    const masked = R.hideAr && !R.revealed[i];
    const ar = s.ar
      ? `<div class="ar-line ${masked ? 'masked' : ''}" data-act="reveal" data-i="${i}">${esc(s.ar)}</div>`
      : `<div class="ar-line"><button class="tr-btn" data-act="trSent" data-i="${i}">🌐 ترجم هذه الجملة</button></div>`;
    return `<div class="sent" id="s${i}" data-i="${i}">
      <div class="en-line en"><button class="play-s" data-act="playS" data-i="${i}" aria-label="استمع">${I.play}</button><span class="txt">${tokenize(s.en)}</span></div>
      ${ar}
      <div class="tools hidden"></div>
    </div>`;
  }
  function refreshSentence(i) { const el = $('#s' + i); if (!el) return; const wasActive = el.classList.contains('active'); el.outerHTML = sentenceHtml(i); if (wasActive) setActive(i, false); }

  function setActive(i, scroll) {
    if (!R) return;
    $$('.sent.active').forEach((e) => { e.classList.remove('active'); const t = $('.tools', e); if (t) { t.classList.add('hidden'); t.innerHTML = ''; } });
    R.idx = i;
    const el = $('#s' + i); if (!el) return;
    el.classList.add('active');
    const t = $('.tools', el);
    t.classList.remove('hidden');
    t.innerHTML = `<button data-act="sayS" data-i="${i}" data-r="1">${I.speaker} عادي</button>
      <button data-act="sayS" data-i="${i}" data-r="0.55">🐢 ببطء</button>
      <button data-act="shadowS" data-i="${i}">${I.mic} ردّد وقيّم نطقك</button>`;
    if (scroll !== false) {
      const r = el.getBoundingClientRect();
      if (r.top < 70 || r.bottom > window.innerHeight - 220) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    const pr = progress[R.book.id] || (progress[R.book.id] = {});
    pr.pos = i; pr.max = Math.max(pr.max || 0, i + 1);
    store.set('progress', progress);
  }

  function clearWordHl() { $$('.w.speaking').forEach((e) => e.classList.remove('speaking')); }
  function hlRange(i, start, end) {
    clearWordHl();
    const el = $('#s' + i); if (!el) return;
    for (const w of $$('.w', el)) { const o = +w.dataset.o; if (o >= start && o < Math.max(end, start + 1)) { w.classList.add('speaking'); break; } }
  }
  function speakSentence(i, rate) {
    return Speech.speak(R.sents[i].en, { rate, onRange: (s, e) => hlRange(i, s, e) }).then((r) => { clearWordHl(); return r; });
  }

  async function playReader(from) {
    if (!R) return;
    const token = ++R.token;
    R.playing = true; updatePlayer();
    let i = from;
    while (R && R.playing && token === R.token && i < R.sents.length) {
      setActive(i);
      const t0 = Date.now();
      const res = await speakSentence(i);
      if (!R || token !== R.token || !R.playing) return;
      if (res === 'error' || res === 'nolang') { if (res === 'error') toast('تعذّر تشغيل الصوت. تأكّد من محرّك تحويل النص إلى كلام.'); break; }
      addPoints(1);
      if (R.shadow) { await sleep(Math.max(1500, (Date.now() - t0) * 1.15)); if (!R || token !== R.token) return; }
      else await sleep(250);
      if (!R || token !== R.token) return;
      if (!R.repeat) i++;
    }
    if (R && token === R.token) {
      R.playing = false; updatePlayer();
      if (i >= R.sents.length) { finishBook(); }
    }
  }
  function pauseReader() { if (!R) return; R.playing = false; R.token++; Speech.stop(); clearWordHl(); updatePlayer(); }
  function stopReader() { if (!R) return; R.playing = false; R.token++; }
  function finishBook() {
    const pr = progress[R.book.id] || (progress[R.book.id] = {});
    if (!pr.done) { pr.done = true; pr.max = R.sents.length; store.set('progress', progress); addPoints(5); }
    sheet(`<div class="center"><div style="font-size:54px">🎉</div><h3>أحسنت! أكملت "${esc(R.book.titleAr || R.book.title)}"</h3>
      <p class="muted">نصيحة: أعد الاستماع غدًا بالسرعة العادية بدون ترجمة، وراجع الكلمات التي حفظتها.</p>
      <div class="actions"><button class="btn secondary" data-act="closeSheet">البقاء هنا</button><button class="btn" data-act="tab" data-t="library">نص آخر</button></div></div>`);
  }

  function renderPlayer() {
    if (!R) return;
    const r = settings.rate;
    $('#player-slot').innerHTML = `<div class="player"><div class="inner">
      <div class="ctrls">
        <button class="tog ${R.repeat ? 'on' : ''}" data-act="pRepeat" title="تكرار الجملة">🔁 تكرار</button>
        <button class="icon-btn" data-act="pPrev" aria-label="السابق">${I.prev}</button>
        <button class="big" data-act="pPlay" aria-label="تشغيل">${R.playing ? I.pause : I.play}</button>
        <button class="icon-btn" data-act="pNext" aria-label="التالي">${I.next}</button>
        <button class="tog ${R.shadow ? 'on' : ''}" data-act="pShadow" title="وقفة للترديد">🗣️ وقفة</button>
        <button class="tog ${R.hideAr ? '' : 'on'}" data-act="pAr" title="الترجمة">ع</button>
      </div>
      ${speedChips(r, 'pRate')}
      <div class="speed-row"><span class="small">🐢</span><input type="range" min="0.3" max="2" step="0.05" value="${r}" data-input="rate"><span class="small">🐇</span><output dir="ltr">${r.toFixed(2)}×</output></div>
    </div></div>`;
  }
  const updatePlayer = renderPlayer;

  function wordSheet(word, sentIdx) {
    const info = lookup(word);
    const k = (info ? info.base : word).toLowerCase();
    const display = info ? info.base : word.toLowerCase();
    const ctx = sentIdx != null && R ? R.sents[sentIdx] : null;
    const s = sheet(`<div class="row"><div class="grow"><div class="word-big en">${esc(word)}</div>
        ${info && info.base !== word.toLowerCase() ? `<div class="small muted en">→ ${esc(info.base)}</div>` : ''}</div>
        <button class="sp-btn" data-act="say" data-text="${esc(word)}" data-r="1">${I.speaker}</button>
        <button class="sp-btn" data-act="say" data-text="${esc(word)}" data-r="0.45" style="font-size:18px">🐢</button></div>
      <div class="word-ar" id="wAr">${info ? esc(info.ar) : '<span class="muted small">... جارٍ الترجمة</span>'}</div>
      ${ctx ? `<div class="card" style="margin-bottom:12px"><div class="en small" style="font-size:15px">${esc(ctx.en)}</div>${ctx.ar ? `<div class="small muted">${esc(ctx.ar)}</div>` : ''}</div>` : ''}
      <div class="actions">
        <button class="btn ${saved[k] ? 'ghost' : 'accent'}" id="wSave">${saved[k] ? '✓ في كلماتي' : '⭐ احفظ الكلمة'}</button>
        <button class="btn secondary" data-act="sayAr" id="wSayAr">🔊 اسمع بالعربية</button>
      </div>`);
    let ar = info ? info.ar : '';
    if (!info) translate(word.toLowerCase()).then((t) => { ar = t; const e = $('#wAr'); if (e) e.textContent = t; })
      .catch(() => { const e = $('#wAr'); if (e) e.innerHTML = '<span class="small muted">الترجمة غير متاحة الآن (تحتاج إلى الإنترنت أول مرة)</span>'; });
    $('#wSave', s).onclick = () => {
      if (saved[k]) { toggleSave(display); } else { saveWord(display, ar, ctx ? ctx.en : ''); toast('⭐ أُضيفت إلى كلماتي — ستراجعها في البطاقات'); }
      closeSheet();
      if (sentIdx != null) $$('.w').forEach((w) => { const b = lookup(w.dataset.w); const kk = (b ? b.base : w.dataset.w).toLowerCase(); w.classList.toggle('saved', !!saved[kk]); });
    };
    $('#wSayAr', s).onclick = () => { if (ar) sayAr(ar); };
    say(word, Math.min(settings.rate, 0.9));
  }

  async function pronounce(target, onScore) {
    Speech.stop();
    const res = await listenSpeech();
    if (!res) { toast('لم أسمع شيئًا. حاول مرة أخرى.'); return; }
    let best = null;
    res.forEach((alt) => { const c = compare(target, alt); if (!best || c.score > best.score) best = Object.assign(c, { said: alt }); });
    const pct = Math.round(best.score * 100);
    const msg = pct >= 90 ? 'ممتاز! نطق واضح جدًا 🌟' : pct >= 70 ? 'جيد جدًا! 👍' : pct >= 40 ? 'ليس سيئًا، استمع مرة أخرى وأعد المحاولة' : 'حاول مرة أخرى ببطء 💪';
    if (pct >= 70) addPoints(3);
    sheet(`<div class="center"><div style="font-size:42px;font-weight:800;color:${pct >= 70 ? 'var(--ok)' : pct >= 40 ? '#C98A00' : 'var(--danger)'}">${pct}%</div><b>${msg}</b></div>
      <div class="card" style="margin-top:12px"><div class="small muted">الجملة الصحيحة (الأخضر = نطقته صحيحًا، الأحمر = ناقص):</div>${best.html}
      <div class="small muted" style="margin-top:8px">سمعتُ: <span class="en">"${esc(best.said)}"</span></div></div>
      <div class="actions"><button class="btn secondary" data-act="say" data-text="${esc(target)}" data-r="0.7">🐢 استمع</button><button class="btn" id="again">${I.mic} أعد المحاولة</button></div>`);
    $('#again').onclick = () => { closeSheet(); pronounce(target, onScore); };
    if (onScore) onScore(pct);
  }

  // ---- Add own text
  Views.addtext = function () {
    return `${topbar('أضف نصًّا', 'الصق أي نص إنجليزي ليصبح درسًا بصوت وترجمة')}
    <div class="page">
      <label class="small muted">العنوان</label>
      <input class="input en" id="atTitle" placeholder="My text" style="margin-bottom:12px">
      <label class="small muted">النص الإنجليزي (فقرة أو أكثر، اترك سطرًا فارغًا بين الفقرات)</label>
      <textarea class="input en" id="atText" rows="10" placeholder="Paste an English text here..."></textarea>
      <button class="btn block" style="margin-top:14px" data-act="saveText">💾 احفظ وافتح الدرس</button>
      <p class="small muted">يمكنك نسخ فصل من كتاب، مقال، كلمات أغنية أو رسالة عمل. سيُقسَّم النص إلى جمل، ويمكنك الاستماع إليه بأي سرعة وترجمته إلى العربية.</p>
    </div>`;
  };

  // ---- Words
  let wordsTab = 'themes';
  Views.words = function () {
    const due = dueWords().length;
    const mine = Object.values(saved).sort((a, b) => b.added - a.added);
    const head = `${topbar('الكلمات', `${ALL_WORDS.length} كلمة في ${window.THEMES.length} موضوعًا`, { back: false })}
    <div class="page">
      <div class="card row" style="background:var(--primary-soft)">
        <div class="grow"><b>🃏 المراجعة الذكية</b><div class="small muted">${due ? `${due} كلمة للمراجعة الآن` : (mine.length ? 'لا مراجعة الآن، عُد لاحقًا 👌' : 'احفظ كلمات ⭐ لتبدأ المراجعة')}</div></div>
        <button class="btn" data-act="go" data-v="flash" data-src="due" ${due ? '' : 'disabled'}>ابدأ</button>
      </div>
      <div class="chips" style="margin:6px 0 14px">
        <button class="chip ${wordsTab === 'themes' ? 'on' : ''}" data-act="wTab" data-t="themes">المواضيع</button>
        <button class="chip ${wordsTab === 'mine' ? 'on' : ''}" data-act="wTab" data-t="mine">⭐ كلماتي (${mine.length})</button>
      </div>`;
    if (wordsTab === 'mine') {
      if (!mine.length) return head + '<div class="empty"><div class="em">⭐</div>اضغط على أي كلمة أثناء القراءة أو على النجمة لحفظها هنا.</div></div>';
      return head + `<div class="wl">${mine.map((w) => `<div class="wi">${wordRow(w)}<span class="small muted" title="المستوى">${'●'.repeat(Math.min(w.box, 5))}${'○'.repeat(Math.max(0, 5 - w.box))}</span></div>`).join('')}</div></div>`;
    }
    return head + `<div class="themes">${window.THEMES.map((t) => `<button class="theme" data-act="go" data-v="theme" data-id="${t.id}">
      <div class="em">${t.emoji}</div><b>${t.nameAr}</b><span class="en" style="display:block;text-align:right">${t.name} · ${t.words.length}</span></button>`).join('')}</div></div>`;
  };

  Views.theme = function (p) {
    const t = window.THEMES.find((x) => x.id === p.id);
    const words = t.words.map(([en, ar, ex]) => ({ en, ar, ex }));
    return `${topbar(`${t.emoji} ${t.nameAr}`, t.name)}
    <div class="page">
      <div class="row" style="gap:8px;margin-bottom:12px">
        <button class="btn grow" data-act="go" data-v="flash" data-src="theme" data-id="${t.id}">🃏 بطاقات</button>
        <button class="btn secondary grow" data-act="go" data-v="quiz" data-mode="listen" data-id="${t.id}">🎧 اختبار</button>
        <button class="btn ghost" data-act="listenAll" data-id="${t.id}" aria-label="استمع للكل">▶ الكل</button>
      </div>
      ${speedChips(settings.rate, 'setRate')}
      <div class="wl" style="margin-top:12px">${words.map((w) => `<div class="wi">${wordRow(w)}</div>`).join('')}</div>
    </div>`;
  };

  // ---- Flashcards
  let fc = null;
  Views.flash = function (p) {
    if (!fc || fc.key !== JSON.stringify(p)) {
      let q;
      if (p.src === 'theme') {
        const t = window.THEMES.find((x) => x.id === p.id);
        q = shuffle(t.words.map(([en, ar, ex]) => ({ en, ar, ex })));
      } else {
        q = shuffle(dueWords()).slice(0, 20).map((k) => saved[k]);
      }
      fc = { key: JSON.stringify(p), q, i: 0, flipped: false, done: 0, ok: 0 };
    }
    if (fc.i >= fc.q.length) {
      return `${topbar('البطاقات')}<div class="page"><div class="empty"><div class="em">${fc.done ? '🏆' : '✅'}</div>
        <h3>${fc.done ? `أحسنت! راجعت ${fc.done} بطاقة` : 'لا توجد كلمات للمراجعة الآن'}</h3>
        <p>${fc.done ? `عرفت ${fc.ok} منها. سنعيد لك الكلمات في الوقت المناسب قبل أن تنساها.` : 'احفظ كلمات جديدة أو اختر موضوعًا من قسم الكلمات.'}</p>
        <button class="btn" data-act="tab" data-t="words">قسم الكلمات</button></div></div>`;
    }
    const w = fc.q[fc.i];
    return `${topbar('البطاقات', p.src === 'theme' ? 'موضوع' : 'المراجعة الذكية')}
    <div class="page">
      <div class="counter">${fc.i + 1} / ${fc.q.length}</div>
      <div class="flash" data-act="flip">
        <button class="sp-btn" data-act="say" data-text="${esc(w.en)}">${I.speaker}</button>
        <div class="front en" style="text-align:center">${esc(w.en)}</div>
        ${fc.flipped ? `<div class="back">${esc(w.ar)}</div>${w.ex ? `<div class="ex en" style="text-align:center" data-act="say" data-text="${esc(w.ex)}">🔉 ${esc(w.ex)}</div>` : ''}`
          : '<div class="muted small">حاول أن تتذكّر المعنى، ثم اضغط على البطاقة</div>'}
      </div>
      ${fc.flipped ? `<div class="grade">
        <button class="g0" data-act="grade" data-g="0">😕 نسيتها</button>
        <button class="g1" data-act="grade" data-g="1">🤔 صعبة</button>
        <button class="g2" data-act="grade" data-g="2">😄 عرفتها</button></div>`
        : '<button class="btn block" style="margin-top:14px" data-act="flip">اكشف المعنى</button>'}
    </div>`;
  };
  Views.flash.after = function () { if (fc && fc.i < fc.q.length && !fc.flipped) say(fc.q[fc.i].en); };

  // ---- Practice hub
  Views.practice = function () {
    const items = [
      ['quiz', 'listen', '🎧', 'اختبار الاستماع', 'تسمع كلمة إنجليزية وتختار معناها بالعربية'],
      ['quiz', 'meaning', '🔤', 'اختبار المعنى', 'كلمة إنجليزية ← اختر الترجمة الصحيحة (والعكس)'],
      ['dictation', '', '✍️', 'الإملاء', 'تسمع جملة وتكتبها: أفضل تمرين للأذن والكتابة'],
      ['builder', '', '🧩', 'رتّب الجملة', 'رتّب الكلمات لتكوين الجملة الصحيحة'],
      ['speak', '', '🎤', 'النطق (Shadowing)', 'استمع، ردّد، واحصل على تقييم لنطقك']
    ];
    return `${topbar('تمارين', 'تمرّن 5 دقائق كل يوم', { back: false })}
    <div class="page">
      ${items.map(([v, mode, em, t, d]) => `<button class="book" data-act="go" data-v="${v}" data-mode="${mode}">
        <div class="cover" style="background:var(--primary-soft);width:56px;height:56px">${em}</div>
        <div class="grow"><h3>${t}</h3><div class="small muted">${d}</div></div></button>`).join('')}
      <div class="section-title">مستوى جمل التمارين</div>
      <div class="chips">${[['A1', 'A1'], ['A2', 'A2'], ['B1', 'B1'], ['B2', 'B2'], ['all', 'الكل']].map(([k, l]) =>
        `<button class="chip ${(settings.pLevel || 'A1') === k ? 'on' : ''}" data-act="pLevel" data-l="${k}">${l}</button>`).join('')}</div>
    </div>`;
  };
  function practiceSentences(maxWords) {
    const lvl = settings.pLevel || 'A1';
    const out = [];
    window.BOOKS.filter((b) => lvl === 'all' || b.level === lvl).forEach((b) => flatten(b).forEach((s) => {
      const n = normWords(s.en).length;
      if (n >= 3 && (!maxWords || n <= maxWords)) out.push(s);
    }));
    return out.length ? out : flatten(window.BOOKS[0]);
  }

  // ---- Quiz (listening / meaning)
  let quiz = null;
  Views.quiz = function (p) {
    if (!quiz) {
      let pool = ALL_WORDS;
      if (p.id) pool = ALL_WORDS.filter((w) => w.theme === p.id);
      const mine = Object.values(saved).filter((w) => w.ar);
      if (!p.id && mine.length >= 6 && Math.random() < 0.5) pool = mine.map((w) => ({ en: w.en, ar: w.ar }));
      const qs = shuffle(pool).slice(0, 10).map((w) => {
        const reverse = p.mode === 'meaning' && Math.random() < 0.35;
        const others = shuffle(ALL_WORDS.filter((x) => x.ar !== w.ar && x.en !== w.en)).slice(0, 3);
        return { w, reverse, opts: shuffle([w].concat(others)) };
      });
      quiz = { p, qs, i: 0, score: 0, answered: null };
    }
    const title = p.mode === 'listen' ? 'اختبار الاستماع' : 'اختبار المعنى';
    if (quiz.i >= quiz.qs.length) {
      const pct = Math.round(quiz.score / quiz.qs.length * 100);
      return `${topbar(title)}<div class="page"><div class="empty"><div class="em">${pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪'}</div>
        <h2>${quiz.score} / ${quiz.qs.length}</h2><p>${pct >= 80 ? 'ممتاز!' : 'استمر، التكرار هو المفتاح.'}</p>
        <button class="btn" data-act="quizAgain">اختبار جديد</button></div></div>`;
    }
    const q = quiz.qs[quiz.i];
    const ans = quiz.answered;
    const prompt = p.mode === 'listen'
      ? `<button class="big-listen" data-act="say" data-text="${esc(q.w.en)}">${I.speaker}</button>
         <div style="margin-top:10px"><button class="link" data-act="say" data-text="${esc(q.w.en)}" data-r="0.5">🐢 استمع ببطء</button></div>
         ${ans ? `<div class="big en" style="text-align:center;margin-top:10px">${esc(q.w.en)}</div>` : '<p class="muted small">ماذا تعني هذه الكلمة؟</p>'}`
      : q.reverse ? `<div class="big">${esc(q.w.ar)}</div><p class="muted small">اختر الكلمة الإنجليزية</p>`
        : `<div class="big en" style="text-align:center">${esc(q.w.en)}</div><button class="link" data-act="say" data-text="${esc(q.w.en)}">🔉 استمع</button>`;
    const optLabel = (o) => q.reverse ? `<span class="en">${esc(o.en)}</span>` : esc(o.ar);
    return `${topbar(title)}
    <div class="page">
      <div class="counter">${quiz.i + 1} / ${quiz.qs.length} · ✔ ${quiz.score}</div>
      <div class="q-prompt">${prompt}</div>
      <div class="options">${q.opts.map((o, k) => {
        let cls = ''; if (ans) { if (o === q.w) cls = 'right'; else if (k === ans.k) cls = 'wrong'; }
        return `<button class="opt ${cls}" data-act="answer" data-k="${k}" ${ans ? 'disabled' : ''}>${optLabel(o)}</button>`;
      }).join('')}</div>
      ${ans ? `<button class="btn block" style="margin-top:14px" data-act="quizNext">التالي ←</button>` : ''}
    </div>`;
  };
  Views.quiz.after = function (p) { if (quiz && quiz.i < quiz.qs.length && !quiz.answered && p.mode === 'listen') say(quiz.qs[quiz.i].w.en); };

  // ---- Dictation
  let dict = null;
  Views.dictation = function () {
    if (!dict) dict = { s: pick(practiceSentences(14)), result: null, n: 0, ok: 0 };
    const s = dict.s;
    return `${topbar('الإملاء', 'اسمع الجملة واكتبها')}
    <div class="page">
      <div class="counter">✔ ${dict.ok} / ${dict.n}</div>
      <div class="q-prompt"><button class="big-listen" data-act="say" data-text="${esc(s.en)}">${I.speaker}</button></div>
      ${speedChips(settings.rate, 'setRate')}
      <textarea class="input en" id="dictIn" rows="3" style="margin-top:14px" placeholder="Type what you hear..." autocapitalize="off" autocomplete="off" spellcheck="false" ${dict.result ? 'disabled' : ''}>${esc(dict.result ? dict.result.input : '')}</textarea>
      ${dict.result ? `<div class="feedback ${dict.result.score >= 0.9 ? 'ok' : 'bad'}">${dict.result.score >= 0.9 ? '✅ ممتاز!' : `النتيجة: ${Math.round(dict.result.score * 100)}%`}</div>
        <div class="card" style="margin-top:10px">${dict.result.html}<div class="en" style="margin-top:8px;font-weight:600">${esc(s.en)}</div><div class="muted">${esc(s.ar || '')}</div></div>
        <button class="btn block" data-act="dictNext">جملة أخرى ←</button>`
      : `<div class="row" style="margin-top:12px;gap:8px"><button class="btn grow" data-act="dictCheck">تحقّق</button><button class="btn ghost" data-act="dictHint">💡 تلميح</button></div>`}
    </div>`;
  };
  Views.dictation.after = function () { if (dict && !dict.result) setTimeout(() => say(dict.s.en), 300); };

  // ---- Sentence builder
  let bld = null;
  Views.builder = function () {
    if (!bld) {
      const s = pick(practiceSentences(10));
      const words = s.en.match(/["“]?[A-Za-z0-9'’-]+[.,!?;:"”]*/g) || [];
      bld = { s, words, pool: shuffle(words.map((w, i) => ({ w, i }))), ans: [], checked: null };
    }
    const s = bld.s;
    return `${topbar('رتّب الجملة', 'كوّن الجملة الإنجليزية')}
    <div class="page">
      <div class="card"><div class="small muted">المعنى:</div><div style="font-size:18px;font-weight:600">${esc(s.ar || '')}</div></div>
      <div class="answer-zone"><div class="tiles">${bld.ans.map((t, k) => `<button class="tile" data-act="bOut" data-k="${k}">${esc(t.w)}</button>`).join('')}</div></div>
      <div class="tiles">${bld.pool.map((t, k) => `<button class="tile" data-act="bIn" data-k="${k}">${esc(t.w)}</button>`).join('')}</div>
      ${bld.checked == null ? `<button class="btn block" style="margin-top:18px" data-act="bCheck" ${bld.pool.length ? 'disabled' : ''}>تحقّق</button>`
        : `<div class="feedback ${bld.checked ? 'ok' : 'bad'}">${bld.checked ? '✅ صحيح! أحسنت' : '❌ ليس تمامًا. الجملة الصحيحة:'}</div>
           ${bld.checked ? '' : `<div class="card en" style="margin-top:8px">${esc(s.en)}</div>`}
           <div class="row" style="gap:8px;margin-top:10px"><button class="btn ghost grow" data-act="say" data-text="${esc(s.en)}">🔉 استمع</button><button class="btn grow" data-act="bNext">التالي ←</button></div>`}
    </div>`;
  };

  // ---- Speaking
  let spk = null;
  Views.speak = function () {
    if (!spk) spk = { s: pick(practiceSentences(12)), best: null };
    const s = spk.s;
    return `${topbar('النطق', 'تقنية الـ Shadowing: استمع ثم ردّد')}
    <div class="page">
      <div class="card"><div class="en" style="font-size:22px;line-height:1.6">${tokenizePlain(s.en)}</div><div class="muted" style="margin-top:6px">${esc(s.ar || '')}</div></div>
      ${speedChips(settings.rate, 'setRate')}
      <div class="row" style="gap:10px;margin-top:16px">
        <button class="btn secondary grow" data-act="say" data-text="${esc(s.en)}">${I.speaker} 1. استمع</button>
        <button class="btn grow" data-act="speakNow">${I.mic} 2. ردّد</button>
      </div>
      ${spk.best != null ? `<p class="center">أفضل نتيجة: <b>${spk.best}%</b></p>` : ''}
      <button class="btn ghost block" style="margin-top:12px" data-act="speakNext">جملة أخرى ←</button>
      <div class="card small muted" style="margin-top:16px">💡 استمع للجملة مرّتين ببطء، ثم بالسرعة العادية، وحاول تقليد اللحن والإيقاع وليس الكلمات فقط.</div>
    </div>`;
  };
  const tokenizePlain = (t) => esc(t);

  // ---- Translate tool
  let trState = { dir: 'en-ar', text: '', out: '' };
  Views.translate = function () {
    const en = trState.dir === 'en-ar';
    return `${topbar('ترجمة', 'ترجم أي كلمة أو جملة واستمع إليها', { back: false })}
    <div class="page">
      <div class="row" style="justify-content:center;gap:10px;margin-bottom:12px">
        <b>${en ? 'English' : 'العربية'}</b>
        <button class="btn ghost" data-act="trSwap" aria-label="عكس">⇄</button>
        <b>${en ? 'العربية' : 'English'}</b>
      </div>
      <textarea class="input ${en ? 'en' : ''}" id="trIn" rows="5" placeholder="${en ? 'Type or paste English text...' : 'اكتب نصًّا بالعربية...'}">${esc(trState.text)}</textarea>
      <div class="row" style="gap:8px;margin-top:10px">
        <button class="btn grow" data-act="trGo">🌐 ترجم</button>
        ${en ? `<button class="btn secondary" data-act="trListen">${I.speaker} استمع</button>` : ''}
      </div>
      ${en ? speedChips(settings.rate, 'setRate') : ''}
      <div id="trOut">${trOutHtml()}</div>
      <p class="small muted" style="margin-top:16px">الترجمة تتم على الهاتف (Google ML Kit). أول مرة يتم تنزيل نموذج اللغة العربية (~30MB)، بعدها تعمل بدون إنترنت.</p>
    </div>`;
  };
  function trOutHtml() {
    if (!trState.out) return '';
    const en = trState.dir === 'en-ar';
    const eng = en ? trState.text : trState.out;
    const short = normWords(eng).length <= 3;
    return `<div class="card" style="margin-top:14px">
      <div class="${en ? '' : 'en'}" style="font-size:19px;font-weight:600">${esc(trState.out)}</div>
      <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap">
        ${en ? `<button class="btn ghost" data-act="sayArOut">🔊 بالعربية</button>` : `<button class="btn ghost" data-act="say" data-text="${esc(trState.out)}">${I.speaker} استمع</button>`}
        ${short ? `<button class="btn accent" data-act="trSave">⭐ احفظ</button>` : ''}
        ${!short ? `<button class="btn secondary" data-act="trLesson">📖 اجعله درسًا</button>` : ''}
      </div></div>`;
  }

  // ---- Settings
  Views.settings = function () {
    let voices = [];
    try { voices = Native ? JSON.parse(Native.voices()) : webVoices.filter((v) => v.lang.startsWith('en')).map((v) => v.lang + '|' + v.name); } catch (e) { voices = []; }
    const sw = (on, act) => `<button class="switch ${on ? 'on' : ''}" data-act="${act}" aria-pressed="${on}"></button>`;
    return `${topbar('الإعدادات')}
    <div class="page">
      <div class="card">
        <div class="setting"><div class="grow"><b>سرعة الصوت الافتراضية</b><div class="small muted">ابدأ بـ 0.75 ثم ارفعها تدريجيًا</div></div></div>
        ${speedChips(settings.rate, 'setRate')}
        <div class="speed-row"><span>🐢</span><input type="range" min="0.3" max="2" step="0.05" value="${settings.rate}" data-input="rate"><span>🐇</span><output dir="ltr">${settings.rate.toFixed(2)}×</output></div>
        <div class="setting" style="margin-top:8px"><div class="grow"><b>اللهجة</b></div>
          <div class="chips"><button class="chip ${settings.accent === 'en-US' ? 'on' : ''}" data-act="accent" data-a="en-US">🇺🇸 أمريكية</button><button class="chip ${settings.accent === 'en-GB' ? 'on' : ''}" data-act="accent" data-a="en-GB">🇬🇧 بريطانية</button></div></div>
        ${voices.length ? `<div class="setting"><div class="grow"><b>الصوت</b></div>
          <select class="input en" style="max-width:60%" data-input="voice"><option value="">Default</option>${voices.map((v) => { const [l, n] = v.split('|'); return `<option value="${esc(n)}" ${settings.voice === n ? 'selected' : ''}>${esc(l)} · ${esc(n.slice(0, 28))}</option>`; }).join('')}</select></div>` : ''}
        <div class="setting"><div class="grow"><b>جرّب الصوت</b></div><button class="btn secondary" data-act="say" data-text="Hello! Welcome to your English lesson.">${I.speaker}</button></div>
        <div class="setting"><div class="grow"><b>صوت العربية</b><div class="small muted">${Native ? (Native.hasLanguage('ar') ? '✅ مثبّت' : '⚠️ غير مثبّت') : ''}</div></div>
          <button class="btn ghost" data-act="sayAr" data-text="مرحبًا بك">🔊</button>${Native ? '<button class="btn ghost" data-act="installVoices">تثبيت</button>' : ''}</div>
      </div>
      <div class="card">
        <div class="setting"><div class="grow"><b>إظهار الترجمة العربية</b><div class="small muted">عند الإخفاء: اضغط على الجملة لكشفها</div></div>${sw(settings.showAr, 'tShowAr')}</div>
        <div class="setting"><div class="grow"><b>حجم الخط الإنجليزي</b></div>
          <div class="chips">${[[17, 'صغير'], [20, 'متوسط'], [24, 'كبير']].map(([s, l]) => `<button class="chip ${settings.fontSize === s ? 'on' : ''}" data-act="font" data-s="${s}">${l}</button>`).join('')}</div></div>
        <div class="setting"><div class="grow"><b>المظهر</b></div>
          <div class="chips">${[['auto', 'تلقائي'], ['light', 'فاتح'], ['dark', 'داكن']].map(([s, l]) => `<button class="chip ${settings.theme === s ? 'on' : ''}" data-act="themeSet" data-s="${s}">${l}</button>`).join('')}</div></div>
        <div class="setting"><div class="grow"><b>هدف اليوم (نقاط)</b></div>
          <div class="chips">${[15, 30, 60].map((g) => `<button class="chip ${settings.goal === g ? 'on' : ''}" data-act="goal" data-g="${g}">${g}</button>`).join('')}</div></div>
      </div>
      <div class="card">
        <div class="setting"><div class="grow"><b>إعادة ضبط التقدّم</b><div class="small muted">يحذف الكلمات المحفوظة والتقدّم</div></div><button class="btn danger" data-act="reset">حذف</button></div>
      </div>
      <p class="center small muted">إنجليزي بالعربي · الإصدار 1.0</p>
    </div>`;
  };

  // ---- Method
  Views.method = function () {
    return `${topbar('طريقة التعلّم', 'كيف تستفيد من التطبيق إلى أقصى حد')}
    <div class="page">
      <div class="card"><b>الفكرة الأساسية</b><p>تتعلّم اللغة عندما تفهم رسائل فيها، أي عندما تسمع وتقرأ نصوصًا تفهم معظمها (حوالي 90%) مع بعض الكلمات الجديدة. لهذا يجمع التطبيق بين <b>الصوت + النص + الترجمة العربية</b>.</p></div>
      <div class="card"><b>📅 روتين يومي من 15–20 دقيقة</b>
        <ol class="method">
          <li><b>🎧 استماع بطيء (3 د):</b> شغّل الدرس بسرعة 0.6–0.75 بدون ترجمة. لا بأس إن لم تفهم كل شيء.</li>
          <li><b>📖 فهم (5 د):</b> أظهر الترجمة العربية، واضغط على الكلمات الجديدة واحفظها ⭐.</li>
          <li><b>🗣️ ترديد Shadowing (4 د):</b> فعّل "وقفة" وردّد كل جملة بصوت عالٍ، واستعمل 🎤 لتقييم نطقك.</li>
          <li><b>🚀 استماع عادي (2 د):</b> سرعة 1.0 بدون ترجمة. ستلاحظ أنك تفهم أكثر!</li>
          <li><b>🃏 مراجعة (3 د):</b> راجع البطاقات اليومية: التكرار المتباعد يرجع لك الكلمة قبل أن تنساها.</li>
          <li><b>✍️ تمرين (3 د):</b> إملاء أو ترتيب جملة لتثبيت ما تعلّمته.</li>
        </ol></div>
      <div class="card"><b>✅ نصائح مهمة</b>
        <ul class="method">
          <li>الانتظام أهمّ من المدّة: كل يوم أفضل من يوم طويل في الأسبوع.</li>
          <li>أعد الاستماع لنفس النص عدة أيام: التكرار يحوّل الفهم إلى طلاقة.</li>
          <li>اختر مستوى مناسبًا: إذا كانت أكثر من كلمة جديدة في كل جملة، ارجع مستوى.</li>
          <li>أضف نصوصك الخاصة (مجالك المهني، أغانيك المفضّلة) من المكتبة ← "أضف نصًّا".</li>
          <li>لا تخف من الأخطاء في النطق، المهم أن تتكلّم.</li>
        </ul></div>
      <button class="btn block" data-act="tab" data-t="library">ابدأ الآن 📖</button>
    </div>`;
  };

  // ---------------------------------------------------------------- actions
  const A = {
    tab: (el) => goTab(el.dataset.t),
    back: () => back(),
    go: (el) => { const d = Object.assign({}, el.dataset); delete d.act; const v = d.v; delete d.v; if (v === 'flash') fc = null; if (v === 'dictation') dict = null; if (v === 'builder') bld = null; if (v === 'speak') spk = null; go(v, d); },
    open: (el) => go('reader', { id: el.dataset.id }),
    closeSheet: () => closeSheet(),
    say: (el) => say(el.dataset.text, el.dataset.r ? +el.dataset.r : undefined),
    sayAr: (el) => sayAr(el.dataset.text || ''),
    installVoices: () => { if (Native) Native.installVoices(); },
    star: (el) => { const on = toggleSave(el.dataset.en, el.dataset.ar, el.dataset.ex); el.classList.toggle('on', on); },
    lib: (el) => { libFilter = el.dataset.f; render(); },
    wTab: (el) => { wordsTab = el.dataset.t; render(); },

    // reader
    word: (el) => { const s = el.closest('.sent'); wordSheet(el.dataset.w, s ? +s.dataset.i : null); },
    playS: (el) => { const i = +el.dataset.i; const wasPlaying = R.playing; pauseReader(); if (wasPlaying && i === R.idx) return; setActive(i); playReader(i); },
    sayS: (el) => { pauseReader(); speakSentence(+el.dataset.i, +el.dataset.r); },
    shadowS: (el) => { pauseReader(); pronounce(R.sents[+el.dataset.i].en); },
    reveal: (el) => { const i = +el.dataset.i; if (el.classList.contains('masked')) { R.revealed[i] = true; el.classList.remove('masked'); } else if (R.sents[i].ar) sayAr(R.sents[i].ar); },
    trSent: (el) => {
      const i = +el.dataset.i; el.textContent = '... جارٍ الترجمة';
      translate(R.sents[i].en).then((t) => { R.sents[i].ref[1] = t; R.sents[i].ar = t; store.set('custom', customBooks); refreshSentence(i); })
        .catch(() => { el.textContent = '⚠️ تعذّرت الترجمة، أعد المحاولة'; });
    },
    trAll: async (el) => {
      el.disabled = true;
      for (let i = 0; i < R.sents.length; i++) {
        if (!R || R.sents[i].ar) continue;
        el.textContent = `... ترجمة ${i + 1}/${R.sents.length}`;
        try { const t = await translate(R.sents[i].en); R.sents[i].ref[1] = t; R.sents[i].ar = t; store.set('custom', customBooks); refreshSentence(i); }
        catch (e) { toast('تعذّرت الترجمة. تحقّق من الإنترنت.'); break; }
      }
      if (R) el.remove();
    },
    pPlay: () => { if (R.playing) pauseReader(); else playReader(R.idx); },
    pNext: () => { const p = R.playing; pauseReader(); const i = Math.min(R.sents.length - 1, R.idx + 1); setActive(i); if (p) playReader(i); },
    pPrev: () => { const p = R.playing; pauseReader(); const i = Math.max(0, R.idx - 1); setActive(i); if (p) playReader(i); },
    pRepeat: () => { R.repeat = !R.repeat; toast(R.repeat ? '🔁 تكرار الجملة الحالية' : 'إيقاف التكرار'); renderPlayer(); },
    pShadow: () => { R.shadow = !R.shadow; toast(R.shadow ? '🗣️ وقفة بعد كل جملة لتردّدها' : 'إيقاف الوقفة'); renderPlayer(); },
    pAr: () => { R.hideAr = !R.hideAr; R.revealed = {}; $$('.ar-line[data-i]').forEach((e) => e.classList.toggle('masked', R.hideAr)); renderPlayer(); },
    pRate: (el) => { setRate(+el.dataset.r); renderPlayer(); if (R.playing) playReader(R.idx); },
    togglePlan: () => { settings.planOpen = !settings.planOpen; saveSettings(); const pl = $('.plan'); if (pl) pl.outerHTML = planHtml(); },
    step: (el) => {
      const s = el.dataset.s;
      pauseReader();
      if (s === '1') { setRate(0.6); R.hideAr = true; R.shadow = false; }
      if (s === '2') { setRate(0.8); R.hideAr = false; R.shadow = false; }
      if (s === '3') { setRate(0.8); R.hideAr = false; R.shadow = true; }
      if (s === '4') { setRate(1); R.hideAr = true; R.shadow = false; }
      R.revealed = {}; R.repeat = false;
      $$('.ar-line[data-i]').forEach((e) => e.classList.toggle('masked', R.hideAr));
      $$('.steps button').forEach((b) => b.classList.toggle('on', b === el));
      renderPlayer();
      if (s === '2') { toast('📖 اقرأ مع الترجمة واضغط على أي كلمة لا تعرفها'); setActive(0); }
      else { setActive(0); playReader(0); }
    },
    finishBook: () => { pauseReader(); finishBook(); },
    delBook: () => {
      if (!confirm('حذف هذا النص؟')) return;
      customBooks = customBooks.filter((b) => b.id !== R.book.id); store.set('custom', customBooks); back();
    },
    saveText: () => {
      const title = $('#atTitle').value.trim() || 'My text';
      const text = $('#atText').value.trim();
      if (normWords(text).length < 2) { toast('الصق نصًّا إنجليزيًا أولًا'); return; }
      const paragraphs = text.split(/\n\s*\n|\n/).map((p) => splitSentences(p).map((s) => [s, ''])).filter((p) => p.length);
      const colors = ['#0E7C66', '#E07A1F', '#5B6CD6', '#C2417A', '#1F78B4', '#7A4FBF'];
      const b = { id: 'c' + Date.now(), custom: true, level: 'mine', emoji: '📝', color: pick(colors), title, titleAr: 'نصّي الخاص', paragraphs };
      customBooks.unshift(b); store.set('custom', customBooks);
      stack = [{ name: 'library', params: {} }]; libFilter = 'all';
      go('reader', { id: b.id });
    },

    // theme words
    listenAll: async (el) => {
      const t = window.THEMES.find((x) => x.id === el.dataset.id);
      const token = (A._la = (A._la || 0) + 1);
      for (const [en] of t.words) {
        if (A._la !== token || current().name !== 'theme') return;
        const r = await say(en); if (r === 'stopped') return; await sleep(700);
      }
    },
    setRate: (el) => { setRate(+el.dataset.r); $$('.speeds button').forEach((b) => b.classList.toggle('on', Math.abs(+b.dataset.r - settings.rate) < 0.01)); syncRange(); },

    // flashcards
    flip: () => { if (!fc.flipped) { fc.flipped = true; render(); } },
    grade: (el) => {
      const g = +el.dataset.g; const w = fc.q[fc.i]; const k = w.en.toLowerCase();
      if (!saved[k]) saveWord(w.en, w.ar, w.ex);
      grade(k, g); addPoints(1); fc.done++;
      if (g === 2) fc.ok++;
      if (g === 0) fc.q.push(w); // see it again this session
      fc.i++; fc.flipped = false; render();
    },

    // quiz
    answer: (el) => {
      const k = +el.dataset.k; const q = quiz.qs[quiz.i];
      const ok = q.opts[k] === q.w;
      quiz.answered = { k, ok };
      if (ok) { quiz.score++; addPoints(2); } else saveWord(q.w.en, q.w.ar, q.w.ex);
      render();
      if (!ok || quiz.p.mode !== 'listen') say(q.w.en);
    },
    quizNext: () => { quiz.i++; quiz.answered = null; render(); },
    quizAgain: () => { const p = quiz.p; quiz = null; stack[stack.length - 1] = { name: 'quiz', params: p }; render(true); },
    pLevel: (el) => { settings.pLevel = el.dataset.l; saveSettings(); render(); },

    // dictation
    dictCheck: () => {
      const input = $('#dictIn').value;
      if (!input.trim()) { toast('اكتب ما سمعته أولًا'); return; }
      const c = compare(dict.s.en, input);
      dict.result = Object.assign(c, { input });
      dict.n++; if (c.score >= 0.9) { dict.ok++; addPoints(3); }
      render();
    },
    dictHint: () => { const w = dict.s.en.split(/\s+/); toast('أول كلمات: ' + w.slice(0, Math.ceil(w.length / 3)).join(' ') + ' ...'); },
    dictNext: () => { dict.s = pick(practiceSentences(14)); dict.result = null; render(); },

    // builder
    bIn: (el) => { const t = bld.pool.splice(+el.dataset.k, 1)[0]; bld.ans.push(t); say(t.w.replace(/[^A-Za-z0-9' -]/g, ''), 1); render(); },
    bOut: (el) => { if (bld.checked != null) return; const t = bld.ans.splice(+el.dataset.k, 1)[0]; bld.pool.push(t); render(); },
    bCheck: () => {
      bld.checked = bld.ans.map((t) => t.w).join(' ') === bld.words.join(' ');
      if (bld.checked) addPoints(3);
      render(); say(bld.s.en);
    },
    bNext: () => { bld = null; render(); },

    // speaking
    speakNow: () => pronounce(spk.s.en, (pct) => { spk.best = Math.max(spk.best || 0, pct); const p = $('#app .page'); if (p) render(); }),
    speakNext: () => { spk = null; render(); },

    // translate
    trSwap: () => { trState = { dir: trState.dir === 'en-ar' ? 'ar-en' : 'en-ar', text: trState.out || '', out: trState.text || '' }; render(); },
    trGo: (el) => {
      const text = $('#trIn').value.trim(); if (!text) return;
      trState.text = text; el.disabled = true; el.textContent = '... جارٍ الترجمة';
      const dir = trState.dir;
      // single word EN->AR: try the built-in dictionary first
      const local = dir === 'en-ar' && normWords(text).length <= 2 ? lookup(text) : null;
      (local ? Promise.resolve(local.ar) : translate(text, dir))
        .then((out) => { trState.out = out; addPoints(1); })
        .catch(() => toast('تعذّرت الترجمة. تحقّق من الاتصال بالإنترنت (مطلوب أول مرة فقط).'))
        .finally(() => { if (current().name === 'translate') render(); });
    },
    trListen: () => { const t = $('#trIn').value.trim(); if (t) say(t); },
    sayArOut: () => sayAr(trState.out),
    trSave: () => { const en = trState.dir === 'en-ar' ? trState.text : trState.out; const ar = trState.dir === 'en-ar' ? trState.out : trState.text; saveWord(en, ar, ''); toast('⭐ أُضيفت إلى كلماتي'); },
    trLesson: () => {
      const en = trState.dir === 'en-ar' ? trState.text : trState.out;
      const ar = trState.dir === 'en-ar' ? trState.out : trState.text;
      const sents = splitSentences(en);
      const paragraphs = [sents.length === 1 ? [[sents[0], ar]] : sents.map((s) => [s, ''])];
      const b = { id: 'c' + Date.now(), custom: true, level: 'mine', emoji: '🌐', color: '#1F78B4', title: en.slice(0, 40) + (en.length > 40 ? '…' : ''), titleAr: 'من الترجمة', paragraphs };
      customBooks.unshift(b); store.set('custom', customBooks);
      stack = [{ name: 'library', params: {} }]; go('reader', { id: b.id });
    },

    // settings
    accent: (el) => { settings.accent = el.dataset.a; settings.voice = ''; saveSettings(); if (Native) Native.setVoice(''); render(); say('Hello, how are you today?'); },
    tShowAr: () => { settings.showAr = !settings.showAr; saveSettings(); render(); },
    font: (el) => { settings.fontSize = +el.dataset.s; saveSettings(); applyTheme(); render(); },
    themeSet: (el) => { settings.theme = el.dataset.s; saveSettings(); applyTheme(); render(); },
    goal: (el) => { settings.goal = +el.dataset.g; saveSettings(); render(); },
    reset: () => {
      if (!confirm('هل أنت متأكد؟ سيتم حذف كل التقدّم والكلمات المحفوظة.')) return;
      saved = {}; progress = {}; stats = { last: '', today: 0, streak: 0, total: 0, lastBook: '' };
      saveSaved(); store.set('progress', progress); saveStats(); toast('تمّ'); render();
    }
  };

  function setRate(r) { settings.rate = Math.round(r * 100) / 100; saveSettings(); }
  function syncRange() { $$('input[data-input="rate"]').forEach((i) => { i.value = settings.rate; const o = i.parentNode.querySelector('output'); if (o) o.textContent = settings.rate.toFixed(2) + '×'; }); }

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const f = A[el.dataset.act];
    if (f) { ev.stopPropagation(); f(el, ev); }
  });
  document.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.dataset.input === 'rate') {
      setRate(+el.value);
      const o = el.parentNode.querySelector('output'); if (o) o.textContent = settings.rate.toFixed(2) + '×';
      $$('.speeds button').forEach((b) => b.classList.toggle('on', Math.abs(+b.dataset.r - settings.rate) < 0.01));
    }
  });
  document.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.dataset.input === 'rate' && R && R.playing) playReader(R.idx);
    if (el.dataset.input === 'voice') { settings.voice = el.value; saveSettings(); if (Native) Native.setVoice(el.value); say('This is my new voice.'); }
  });

  // ---------------------------------------------------------------- boot
  applyTheme();
  if (Native && settings.voice) setTimeout(() => { try { Native.setVoice(settings.voice); } catch (e) { /* ignore */ } }, 1500);
  render();
})();
