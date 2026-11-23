/* إنجليزي بالعربي — English for Arabic speakers (Tunisia).
 * Single-page app running inside an Android WebView. Native features come from window.Android
 * (see MainActivity.kt); in a normal browser it falls back to the Web Speech API / an online translator. */
(function () {
  'use strict';

  // ---------------------------------------------------------------- helpers
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Arabic text with English inside: keep each English run in its own left-to-right island.
  const MIX_RE = /[A-Za-z0-9][A-Za-z0-9'’ ,.?!\/+\-→·]*[A-Za-z0-9.?!]|[A-Za-z0-9]/g;
  const mixed = (t) => {
    t = String(t); let out = '', last = 0, m;
    MIX_RE.lastIndex = 0;
    while ((m = MIX_RE.exec(t))) { out += esc(t.slice(last, m.index)) + `<bdi dir="ltr" class="en-in">${esc(m[0])}</bdi>`; last = m.index + m[0].length; }
    return out + esc(t.slice(last));
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const DAY = 86400000;
  const COLORS = ['#0E7C66', '#E07A1F', '#5B6CD6', '#C2417A', '#1F78B4', '#7A4FBF', '#B5651D', '#2F6F4F'];

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
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 15l2.5 2.5L16 13" stroke-linejoin="round"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5C17 4 14 4.5 12 6z"/><path d="M12 6v14.5"/></svg>',
    mybooks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h4v16H4zM10 4h4v16h-4z"/><path d="M13.5 4.8l3.7-1 4 15.4-3.7 1z"/><path d="M19 2v4M17 4h4"/></svg>',
    cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="6" width="14" height="15" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
    rec: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="currentColor"/></svg>',
    stop: '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>',
    abc: '<svg viewBox="0 0 24 24"><text x="12" y="17.5" text-anchor="middle" font-size="15" font-weight="800" font-family="Roboto, Arial, sans-serif" fill="currentColor">Aa</text></svg>'
  };

  // ---------------------------------------------------------------- storage
  const store = {
    get(k, d) { try { const v = localStorage.getItem('ea_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('ea_' + k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } }
  };
  const settings = Object.assign({ rate: 0.8, showAr: true, accent: 'en-US', voice: '', timeGoal: 120, fontSize: 20, theme: 'auto', planOpen: true, pLevel: 'A1' }, store.get('settings', {}));
  const saveSettings = () => store.set('settings', settings);
  let saved = store.get('saved', {});            // word -> {en, ar, ex, box, due, added}
  let progress = store.get('progress', {});      // bookId -> {ch, pos, max, chDone:{}, done}
  let stats = Object.assign({ last: '', streak: 0, total: 0, lastBook: '', tday: '', tsec: 0, hist: {} }, store.get('stats', {}));
  let prog = store.get('program', { days: {} });  // 30-day program state
  let studioState = store.get('studio', {});     // "book:ch" -> {i, s:{idx:best}}
  let myMeta = store.get('mybooks', []);         // user's own books (bodies in IndexedDB)
  let trCache = store.get('trcache', {});
  const saveSaved = () => store.set('saved', saved);
  const saveStats = () => store.set('stats', stats);
  const saveProgress = () => store.set('progress', progress);
  const saveMeta = () => store.set('mybooks', myMeta);

  const dayStr = (t) => { const d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const today = () => dayStr(Date.now());
  const yesterday = () => dayStr(Date.now() - DAY);
  function touchDay() {
    const t = today();
    if (stats.last !== t) { stats.streak = stats.last === yesterday() ? (stats.streak || 0) + 1 : 1; stats.last = t; saveStats(); }
  }
  function addPoints(n) { touchDay(); stats.total = (stats.total || 0) + n; saveStats(); }
  const streakNow = () => (stats.last === today() || stats.last === yesterday()) ? (stats.streak || 0) : 0;
  const minutesToday = () => (stats.tday === today() ? Math.floor(stats.tsec / 60) : 0);

  function applyTheme() {
    const r = document.documentElement;
    if (settings.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', settings.theme);
    r.style.setProperty('--en-size', settings.fontSize + 'px');
  }

  // IndexedDB for big user books (localStorage is too small for whole novels)
  const DB = (() => {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      if (!window.indexedDB) { rej(new Error('no idb')); return; }
      const r = indexedDB.open('englishArabi', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('books', { keyPath: 'id' });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
    const tx = (mode, fn) => open().then((db) => new Promise((res, rej) => {
      const t = db.transaction('books', mode); const req = fn(t.objectStore('books'));
      t.oncomplete = () => res(req && req.result); t.onerror = () => rej(t.error);
    }));
    return {
      get: (id) => tx('readonly', (s) => s.get(id)).catch(() => store.get('book_' + id, null)),
      put: (obj) => tx('readwrite', (s) => s.put(obj)).catch(() => store.set('book_' + obj.id, obj)),
      del: (id) => tx('readwrite', (s) => s.delete(id)).catch(() => { try { localStorage.removeItem('ea_book_' + id); } catch (e) { /* ignore */ } })
    };
  })();

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
    const w = word.toLowerCase().replace(/[’]/g, "'").replace(/^[^a-z]+|[^a-z']+$/g, '').replace(/'s$/, '');
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

  // ---------------------------------------------------------------- speech (TTS)
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
      Rec.stopPlayback();
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

  // ---------------------------------------------------------------- voice recorder (record yourself & compare)
  const Rec = {
    active: false, mr: null, stream: null, chunks: [], audio: null, timer: null, onAutoStop: null,
    supported: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder),
    async start() {
      Speech.stop(); this.stopPlayback();
      if (!this.supported()) { toast('التسجيل غير متوفّر في هذا الجهاز'); return false; }
      try { this.stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch (e) { toast('لا يمكن الوصول إلى الميكروفون. اسمح للتطبيق باستعماله من الإعدادات.'); return false; }
      this.chunks = [];
      this.mr = new MediaRecorder(this.stream);
      this.mr.ondataavailable = (e) => { if (e.data && e.data.size) this.chunks.push(e.data); };
      this.mr.start();
      this.active = true;
      this.timer = setTimeout(() => { if (this.active && this.onAutoStop) this.onAutoStop(); }, 30000);
      return true;
    },
    stop() {
      clearTimeout(this.timer);
      return new Promise((res) => {
        if (!this.mr || !this.active) { res(null); return; }
        this.mr.onstop = () => {
          const blob = new Blob(this.chunks, { type: this.mr.mimeType || 'audio/webm' });
          if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
          this.active = false;
          res(blob.size ? URL.createObjectURL(blob) : null);
        };
        this.mr.stop();
      });
    },
    play(url) {
      Speech.stop(); this.stopPlayback();
      return new Promise((res) => {
        const a = new Audio(url); this.audio = a;
        a.onended = () => res('done'); a.onerror = () => res('error');
        a.play().catch(() => res('error'));
      });
    },
    stopPlayback() { if (this.audio) { try { this.audio.pause(); } catch (e) { /* ignore */ } this.audio = null; } }
  };

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

  // ---------------------------------------------------------------- downloads (free books)
  let dlSeq = 0; const dlPending = {};
  function downloadText(urls, name) {
    return new Promise((resolve, reject) => {
      if (Native && Native.download) {
        const cb = 'd' + (++dlSeq);
        dlPending[cb] = (path, err) => {
          if (!path) { reject(err || 'fail'); return; }
          fetch('/files/' + path).then((r) => r.text()).then((t) => { try { Native.deleteFile(path); } catch (e) { /* ignore */ } resolve(t); }).catch(reject);
        };
        Native.download(JSON.stringify(urls), name, cb);
        return;
      }
      (async () => {
        for (const u of urls) {
          try { const r = await fetch(u); if (r.ok) { const t = await r.text(); if (t.length > 500 && !/<html/i.test(t.slice(0, 400))) { resolve(t); return; } } } catch (e) { /* next */ }
        }
        reject('fail');
      })();
    });
  }
  function gutenbergUrls(id) {
    const s = String(id);
    const dirs = s.length === 1 ? '0/' + s : s.slice(0, -1).split('').join('/') + '/' + s;
    return [
      `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
      `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`,
      `https://ftp2.gwdg.de/pub/misc/gutenberg/${dirs}/${id}-0.txt`,
      `https://ftp2.gwdg.de/pub/misc/gutenberg/${dirs}/${id}.txt`,
      `https://gutenberg.pglaf.org/${dirs}/${id}-0.txt`,
      `https://gutenberg.pglaf.org/${dirs}/${id}.txt`
    ];
  }

  window.__native = {
    onReady() { if (current() && current().name === 'settings') render(); },
    onTts(id, type, s, e) { Speech._event(id, type, s, e); },
    onTranslate(cb, out, err) { const f = trPending[cb]; delete trPending[cb]; if (f) f(out, err); },
    onSpeech(cb, arr) { const f = spPending[cb]; delete spPending[cb]; if (f) f(arr && arr.length ? arr : null); },
    onDownload(cb, path, err) { const f = dlPending[cb]; delete dlPending[cb]; if (f) f(path, err); }
  };

  // ---------------------------------------------------------------- comparison (dictation / pronunciation)
  const normWords = (s) => s.toLowerCase().replace(/[’]/g, "'").replace(/-/g, ' ').replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
  function compare(target, input) {
    const a = normWords(target), b = normWords(input);
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    let i = 0, j = 0; const out = []; const missing = [];
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i] === b[j]) { out.push(`<span class="ok">${esc(a[i])}</span>`); i++; j++; }
      else if (j < b.length && (i >= a.length || dp[i][j + 1] >= dp[i + 1][j])) { out.push(`<span class="bad">${esc(b[j])}</span>`); j++; }
      else { out.push(`<span class="miss">${esc(a[i])}</span>`); missing.push(a[i]); i++; }
    }
    const score = a.length ? dp[0][0] / Math.max(a.length, b.length) : 0;
    return { score, missing, html: `<div class="en diff" style="font-size:18px;line-height:1.9">${out.join(' ')}</div>` };
  }
  async function checkPronunciation(target) {
    Speech.stop();
    const res = await listenSpeech();
    if (!res) return null;
    let best = null;
    res.forEach((alt) => { const c = compare(target, alt); if (!best || c.score > best.score) best = Object.assign(c, { said: alt }); });
    best.pct = Math.round(best.score * 100);
    best.msg = best.pct >= 90 ? 'ممتاز! نطق واضح جدًا 🌟' : best.pct >= 70 ? 'جيد جدًا! 👍' : best.pct >= 40 ? 'ليس سيئًا، استمع مرة أخرى وأعد المحاولة' : 'حاول مرة أخرى ببطء 💪';
    best.color = best.pct >= 70 ? 'var(--ok)' : best.pct >= 40 ? '#C98A00' : 'var(--danger)';
    if (best.pct >= 70) addPoints(3);
    return best;
  }
  const resultHtml = (r) => `<div class="center"><div style="font-size:40px;font-weight:800;color:${r.color}">${r.pct}%</div><b>${r.msg}</b></div>
    <div class="card" style="margin-top:10px"><div class="small muted">التصحيح: الأخضر = نطقته صحيحًا، الأحمر = ناقص أو غير واضح</div>${r.html}
    <div class="small muted" style="margin-top:8px">سمعتُ: <span class="en">"${esc(r.said)}"</span></div>
    ${r.missing.length ? `<button class="btn ghost block" style="margin-top:10px" data-act="sayMissing" data-w="${esc(r.missing.join('|'))}">🐢 اسمع الكلمات التي تحتاج تصحيحًا</button>` : ''}</div>`;

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
  // Normalised book: {id, title, titleAr, level, emoji, color, kind, day?, author?, chapters:[{t, paragraphs:[[[en, ar], ...], ...]}]}
  const BUILTIN = {};
  (window.BOOKS || []).forEach((b) => { BUILTIN[b.id] = Object.assign({ kind: 'builtin', chapters: [{ t: b.title, paragraphs: b.paragraphs }] }, b); });
  const PROGRAM = (window.PROGRAM || []).slice().sort((a, b) => a.day - b.day);
  PROGRAM.forEach((b) => { BUILTIN[b.id] = Object.assign({ kind: 'program', chapters: [{ t: b.title, paragraphs: b.paragraphs }] }, b); });
  const chunk = (a, n) => { const out = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out; };
  (window.GRAMMAR || []).forEach((g) => { BUILTIN['g_' + g.id] = { id: 'g_' + g.id, kind: 'lesson', title: g.title, titleAr: g.titleAr, level: g.level, emoji: g.emoji, color: '#5B6CD6', chapters: [{ t: g.title, paragraphs: chunk(g.ex.map((e) => [e[0], e[1]]), 4) }] }; });
  if (window.ALPHABET) BUILTIN.abc = { id: 'abc', kind: 'lesson', title: 'The Alphabet', titleAr: 'الحروف الإنجليزية', level: 'A1', emoji: '🔤', color: '#0E7C66', chapters: [{ t: 'A–Z', paragraphs: chunk(window.ALPHABET.map((a) => [a.say, `${a.L} «${a.ar}»: ${a.w[0][0]} = ${a.w[0][1]}`]), 6) }] };
  const bookCache = {};

  const flatten = (chapter) => { const out = []; chapter.paragraphs.forEach((p, pi) => p.forEach((s) => out.push({ p: pi, en: s[0], ar: s[1], ref: s }))); return out; };
  const countSents = (chapters) => chapters.reduce((a, c) => a + c.paragraphs.reduce((x, p) => x + p.length, 0), 0);
  const getBookSync = (id) => BUILTIN[id] || bookCache[id] || null;
  const findMeta = (id) => myMeta.find((m) => m.id === id);
  function loadBook(id) {
    const b = getBookSync(id);
    if (b) return Promise.resolve(b);
    const meta = findMeta(id);
    if (!meta) return Promise.reject(new Error('not found'));
    return DB.get(id).then((body) => {
      if (!body || !body.chapters) throw new Error('missing body');
      const book = Object.assign({ kind: 'mine' }, meta, { chapters: body.chapters });
      bookCache[id] = book; return book;
    });
  }
  // Light info used by lists (no need to load the whole book).
  function bookInfo(id) {
    const b = BUILTIN[id];
    if (b) return { id, title: b.title, titleAr: b.titleAr, emoji: b.emoji, color: b.color, level: b.level, kind: b.kind, day: b.day, chapters: 1, sents: countSents(b.chapters) };
    const m = findMeta(id);
    return m ? Object.assign({ kind: 'mine' }, m) : null;
  }
  async function saveMyBook(meta, chapters) {
    meta.chapters = chapters.length; meta.sents = countSents(chapters);
    await DB.put({ id: meta.id, chapters });
    myMeta = myMeta.filter((m) => m.id !== meta.id); myMeta.unshift(meta); saveMeta();
    bookCache[meta.id] = Object.assign({ kind: 'mine' }, meta, { chapters });
    return meta;
  }
  let persistTimer = null;
  function persistBook(book) {
    if (book.kind !== 'mine') return;
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => DB.put({ id: book.id, chapters: book.chapters }), 800);
  }
  async function deleteMyBook(id) {
    await DB.del(id); delete bookCache[id];
    myMeta = myMeta.filter((m) => m.id !== id); saveMeta();
    delete progress[id]; saveProgress();
  }

  // ---- text → chapters
  const ABBR = /(?:\b(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|Mt|Prof|Capt|Col|Gen|Lt|Sgt|Rev|Hon|No|Vol|vs|etc|Co|Ltd)|\b[A-Z])\.["'”’]?$/;
  function splitSentences(text) {
    text = text.replace(/\s+/g, ' ').trim();
    const raw = text.match(/[^.!?…]+(?:[.!?…]+["'”’)\]]*|$)/g) || [];
    const out = [];
    raw.forEach((part) => {
      const s = part.trim(); if (!s) return;
      const prev = out[out.length - 1];
      if (prev && (ABBR.test(prev) || /^["'“‘(]?[a-z,;:)]/.test(s) || prev.length < 3)) out[out.length - 1] = prev + ' ' + s;
      else out.push(s);
    });
    return out;
  }
  function cleanGutenberg(txt) {
    txt = txt.replace(/\r\n?/g, '\n').replace(/^﻿/, '');
    const s = txt.search(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG[^\n]*/i);
    if (s >= 0) txt = txt.slice(txt.indexOf('\n', s) + 1);
    const e = txt.search(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG/i);
    if (e >= 0) txt = txt.slice(0, e);
    const e2 = txt.search(/\n\s*End of (the )?Project Gutenberg/i);
    if (e2 >= 0) txt = txt.slice(0, e2);
    return txt;
  }
  const ROMAN_WORD = /^(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})[.:,]?$/;
  const titleCase = (t) => (t === t.toUpperCase() && /[A-Z]/.test(t))
    ? t.split(' ').map((w) => ROMAN_WORD.test(w) ? w : w.toLowerCase().replace(/(^|["“(-])([a-z])/g, (m, a, b) => a + b.toUpperCase())).join(' ')
    : t;
  const STRONG = /^(chapter|book|part|stave|canto|section|volume|letter|adventure)\s+([0-9]+|[ivxlcdm]+\b|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|[a-z]+teen|twenty|thirty|forty|fifty|the\b)/i;
  const ROMAN = /^[IVXLCDM]{1,7}\.?$/;
  const weakHeading = (b) => b.length <= 60 && b.split(/\s+/).length <= 9 && !/[.!?,;:"”’]$/.test(b) && /^[A-Z0-9"“']/.test(b) && /[A-Za-z]{2}/.test(b);

  function finalizeChapters(raw, fallbackTitle) {
    const firstStrong = raw.findIndex((x) => x.strong);
    const hasStrong = raw.filter((c) => c.strong).length >= 2;
    const chs = raw.filter((c, i) => c.n >= 1 && !(hasStrong && i < firstStrong));
    const merged = [];
    chs.forEach((c) => {
      const last = merged[merged.length - 1];
      if (last && (c.n < 8 || last.n < 8)) { last.paras.push([[c.t, '']]); last.paras.push(...c.paras); last.n += c.n; }
      else merged.push(c);
    });
    const MAX = 60; const out = [];
    merged.forEach((c) => {
      const paras = [];
      c.paras.forEach((p) => { for (let i = 0; i < p.length; i += MAX) paras.push(p.slice(i, i + MAX)); });
      if (c.n <= MAX * 1.3) { out.push({ t: c.t, paragraphs: paras }); return; }
      const parts = []; let cur = [], n = 0;
      paras.forEach((p) => { cur.push(p); n += p.length; if (n >= MAX) { parts.push(cur); cur = []; n = 0; } });
      if (cur.length) { if (n < 15 && parts.length) parts[parts.length - 1].push(...cur); else parts.push(cur); }
      parts.forEach((pp, i) => out.push({ t: `${c.t} (${i + 1}/${parts.length})`, paragraphs: pp }));
    });
    if (!out.length) out.push({ t: fallbackTitle || 'Text', paragraphs: [] });
    return out;
  }

  function textToChapters(text, fallbackTitle) {
    text = text.replace(/\r\n?/g, '\n').replace(/\[Illustration[^\]]*\]/gi, '').replace(/_([^_\n]+)_/g, '$1').replace(/\t/g, ' ');
    const blocks = text.split(/\n[ \t]*\n/).map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean)).filter((l) => l.length);
    const raw = []; let cur = null;
    const newCh = (t, strong) => { cur = { t, paras: [], n: 0, strong }; raw.push(cur); };
    const addPara = (t) => {
      if (!cur) newCh(fallbackTitle || 'Part 1', false);
      const ss = splitSentences(t);
      if (ss.length) { cur.paras.push(ss.map((s) => [s, ''])); cur.n += ss.length; }
    };
    for (const lines of blocks) {
      const joined = lines.join(' ').replace(/\s+/g, ' ').trim();
      if (/^(contents|table of contents)\b/i.test(joined) || (joined.match(/\bchapter\b/gi) || []).length >= 3) continue;
      const first = lines[0];
      if ((STRONG.test(first) && first.length < 90) || ROMAN.test(first)) {
        const rest = lines.length <= 3 && joined.length < 110 ? lines.slice(1).join(' ') : '';
        newCh(titleCase(first.replace(/\.$/, '')) + (rest ? '. ' + titleCase(rest) : ''), true);
        if (!rest && lines.length > 1) addPara(lines.slice(1).join(' '));
        continue;
      }
      if (lines.length <= 2 && weakHeading(joined)) {
        if (!cur || cur.n >= 25) newCh(titleCase(joined), false);
        else cur.paras.push([[titleCase(joined), '']]);
        continue;
      }
      addPara(joined);
    }
    return finalizeChapters(raw, fallbackTitle);
  }

  async function epubToBook(file) {
    if (!window.JSZip) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/jszip.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    const zip = await window.JSZip.loadAsync(file);
    const container = await zip.file('META-INF/container.xml').async('string');
    const opfPath = (/full-path="([^"]+)"/.exec(container) || [])[1];
    if (!opfPath) throw new Error('bad epub');
    const opf = new DOMParser().parseFromString(await zip.file(opfPath).async('string'), 'application/xml');
    const base = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
    const manifest = {};
    Array.from(opf.getElementsByTagNameNS('*', 'item')).forEach((i) => { manifest[i.getAttribute('id')] = i.getAttribute('href'); });
    const tEl = opf.getElementsByTagNameNS('*', 'title')[0];
    const aEl = opf.getElementsByTagNameNS('*', 'creator')[0];
    const raw = [];
    let n = 0;
    for (const ref of Array.from(opf.getElementsByTagNameNS('*', 'itemref'))) {
      const href = manifest[ref.getAttribute('idref')]; if (!href) continue;
      const f = zip.file(base + decodeURIComponent(href)) || zip.file(base + href); if (!f) continue;
      const doc = new DOMParser().parseFromString(await f.async('string'), 'text/html');
      const els = Array.from(doc.querySelectorAll('h1,h2,h3,h4,p,li,pre'));
      const ch = { t: '', paras: [], n: 0, strong: true };
      els.forEach((el) => {
        const t = el.textContent.replace(/\s+/g, ' ').trim(); if (!t) return;
        if (/^H[1-4]$/.test(el.tagName)) { if (!ch.t) ch.t = t; else ch.paras.push([[t, '']]); return; }
        const ss = splitSentences(t); if (ss.length) { ch.paras.push(ss.map((s) => [s, ''])); ch.n += ss.length; }
      });
      if (!ch.n) continue;
      ch.t = ch.t || `Part ${++n}`;
      raw.push(ch);
    }
    return { title: tEl ? tEl.textContent.trim() : file.name.replace(/\.epub$/i, ''), author: aEl ? aEl.textContent.trim() : '', chapters: finalizeChapters(raw, 'Part 1') };
  }

  // ---------------------------------------------------------------- 30-day program
  const TASKS = [
    { k: 'listen1', em: '🎧', t: 'استماع بطيء للنص الجديد', d: 'سرعة 0.6 بدون ترجمة. استمع مرّتين وركّز على الأصوات فقط.', min: 15 },
    { k: 'read', em: '📖', t: 'قراءة وفهم مع الترجمة', d: 'اقرأ مع العربية، واضغط على كل كلمة جديدة واحفظها ⭐', min: 20 },
    { k: 'shadow', em: '🗣️', t: 'الترديد وتصحيح النطق', d: 'استوديو النطق: استمع، سجّل صوتك، قارن، وصحّح كل جملة.', min: 25 },
    { k: 'listen2', em: '🚀', t: 'استماع بالسرعة العادية', d: 'سرعة 1.0 بدون ترجمة، 3 مرات. ستفهم أكثر مما تتوقّع!', min: 10 },
    { k: 'review', em: '🔁', t: 'مراجعة نص الأمس', d: 'أعد الاستماع إلى نص الأمس بالسرعة العادية وردّده.', min: 15 },
    { k: 'words', em: '🃏', t: 'كلمات اليوم', d: 'بطاقات موضوع اليوم، ثم المراجعة الذكية لكلماتك.', min: 15 },
    { k: 'dict', em: '✍️', t: 'إملاء 10 جمل', d: 'من نص اليوم: اسمع الجملة واكتبها.', min: 10 },
    { k: 'free', em: '📚', t: 'قراءة حرّة', d: 'فصل من كتاب كلاسيكي أو من كتبك الخاصة، مع الصوت.', min: 10 }
  ];
  const dayState = (d) => prog.days[d] || (prog.days[d] = { tasks: {} });
  const dayDoneCount = (d) => TASKS.filter((t) => (prog.days[d] && prog.days[d].tasks[t.k])).length;
  const currentDay = () => { for (let d = 1; d <= PROGRAM.length; d++) if (!(prog.days[d] && prog.days[d].done)) return d; return PROGRAM.length || 1; };
  const daysDone = () => Object.values(prog.days).filter((s) => s.done).length;
  let taskCtx = null; // {d, k, id}
  function completeTask(d, k, silent) {
    const s = dayState(d);
    if (s.tasks[k]) return;
    s.tasks[k] = true;
    const t = TASKS.find((x) => x.k === k);
    if (!s.done && TASKS.every((x) => s.tasks[x.k])) { s.done = true; s.doneAt = Date.now(); setTimeout(() => toast(`🏆 مبروك! أكملت اليوم ${d} من البرنامج`), 300); }
    else if (!silent && t) toast(`✅ تمّت المهمّة: ${t.t}`);
    store.set('program', prog);
  }
  const ctxDone = (k, id) => { if (taskCtx && taskCtx.k === k && (!id || !taskCtx.id || taskCtx.id === id)) completeTask(taskCtx.d, k); };

  // ---------------------------------------------------------------- study-time tracker
  let lastInteract = Date.now();
  let appPaused = false;
  ['click', 'input', 'touchstart', 'keydown', 'scroll'].forEach((ev) => document.addEventListener(ev, () => { lastInteract = Date.now(); }, { passive: true, capture: true }));
  setInterval(() => {
    if (appPaused || document.hidden) return;
    const busy = Speech.cur || (R && R.playing) || Rec.active || (Rec.audio && !Rec.audio.paused);
    if (!busy && Date.now() - lastInteract > 120000) return;
    const t = today();
    if (stats.tday !== t) { stats.tday = t; stats.tsec = 0; }
    const before = Math.floor(stats.tsec / 60);
    stats.tsec += 10;
    const mins = Math.floor(stats.tsec / 60);
    stats.hist[t] = mins;
    const keys = Object.keys(stats.hist); if (keys.length > 45) delete stats.hist[keys[0]];
    touchDay(); saveStats();
    if (before < settings.timeGoal && mins >= settings.timeGoal) toast(`🎉 رائع! درست ${settings.timeGoal} دقيقة اليوم`);
    $$('[data-live="minutes"]').forEach((e) => { e.textContent = mins; });
    $$('[data-live="minbar"]').forEach((e) => { e.style.width = Math.min(100, mins / settings.timeGoal * 100) + '%'; });
  }, 10000);

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
  const timeBar = () => {
    const m = minutesToday();
    return `<div class="row small" style="justify-content:space-between"><span>⏱️ وقت الدراسة اليوم</span><span><b data-live="minutes">${m}</b> / ${settings.timeGoal} دقيقة</span></div>
      <div class="progress" style="height:10px"><i data-live="minbar" style="width:${Math.min(100, m / settings.timeGoal * 100)}%;background:var(--accent)"></i></div>`;
  };

  // ---------------------------------------------------------------- router
  const TABS = [
    ['home', 'الرئيسية', I.home], ['program', '30 يومًا', I.cal], ['library', 'المكتبة', I.book],
    ['mybooks', 'كتبي', I.mybooks], ['basics', 'الأساسيات', I.abc], ['practice', 'تمارين', I.target]
  ];
  let stack = [{ name: 'home', params: {} }];
  let abcToken = 0;
  const current = () => stack[stack.length - 1];
  function go(name, params) { leaveView(); stack.push({ name, params: params || {} }); render(true); }
  function goTab(name) { leaveView(); taskCtx = null; stack = [{ name, params: {} }]; render(true); }
  function back() { leaveView(); if (stack.length > 1) stack.pop(); else stack = [{ name: 'home', params: {} }]; render(true); }
  function replaceTop(params) { leaveView(); stack[stack.length - 1].params = params; render(true); }
  function leaveView() {
    closeSheet();
    if (R) { stopReader(); R = null; }
    if (ST) { if (Rec.active) Rec.stop(); Object.values(ST.recs).forEach((u) => URL.revokeObjectURL(u)); ST = null; }
    Speech.stop(); Rec.stopPlayback(); quiz = null; abcToken++;
  }
  window.appBack = function () {
    if ($('.sheet')) { closeSheet(); return true; }
    if (stack.length > 1 || current().name !== 'home') { back(); return true; }
    return false;
  };
  window.onAppPause = function () { appPaused = true; if (R && R.playing) pauseReader(); if (Rec.active && ST) A.recToggle(); };
  window.onAppResume = function () { appPaused = false; lastInteract = Date.now(); };

  function render(scrollTop) {
    const v = current();
    const view = Views[v.name] || Views.home;
    const app = $('#app');
    app.className = '';
    $('#player-slot').innerHTML = '';
    app.innerHTML = view(v.params) || '';
    const tabName = ({ words: 'basics' })[stack[0].name] || stack[0].name;
    $('#nav').innerHTML = TABS.map(([n, label, icon]) => `<button class="${n === tabName ? 'on' : ''}" data-act="tab" data-t="${n}">${icon}<span>${label}</span></button>`).join('');
    if (scrollTop) window.scrollTo(0, 0);
    if (view.after) view.after(v.params);
  }
  const loadingView = (title) => `${topbar(title || '...')}<div class="empty"><div class="em">⏳</div>جارٍ التحميل...</div>`;
  function openBook(id, params) {
    loadBook(id).then(() => go('reader', Object.assign({ id }, params || {})))
      .catch(() => toast('تعذّر فتح الكتاب'));
  }

  // ---------------------------------------------------------------- views
  const Views = {};

  Views.home = function () {
    const due = dueWords().length;
    const lb = stats.lastBook && bookInfo(stats.lastBook);
    const wod = ALL_WORDS[Math.floor(Date.now() / DAY) % ALL_WORDS.length];
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'صباح الخير' : hour < 18 ? 'عسلامة' : 'مساء الخير';
    const cd = currentDay(); const day = PROGRAM[cd - 1];
    const m = minutesToday();
    return `${topbar('إنجليزي بالعربي', 'تعلّم الإنجليزية بالاستماع والقراءة والترديد', { back: false, right: `<button class="icon-btn" data-act="go" data-v="settings" aria-label="الإعدادات">${I.gear}</button>` })}
    <div class="page">
      <div class="hero">
        <h2>${greet} 👋</h2>
        <p>هدفك: ${settings.timeGoal >= 60 ? (settings.timeGoal / 60) + ' ساعة' : settings.timeGoal + ' دقيقة'} من الإنجليزية كل يوم.</p>
        <div class="stats">
          <div class="stat"><b>🔥 ${streakNow()}</b><span>أيام متتالية</span></div>
          <div class="stat"><b>⏱️ <span data-live="minutes">${m}</span></b><span>دقيقة / ${settings.timeGoal}</span></div>
          <div class="stat"><b>🧠 ${learnedCount()}</b><span>كلمات محفوظة</span></div>
        </div>
        <div class="goalbar"><i data-live="minbar" style="width:${Math.min(100, m / settings.timeGoal * 100)}%"></i></div>
      </div>

      ${day ? `<button class="book" data-act="go" data-v="day" data-d="${cd}" style="background:var(--primary-soft)">
        <div class="cover" style="background:${day.color}">${day.emoji}<span class="daybadge">${cd}</span></div>
        <div class="grow"><div class="small muted">📅 برنامج 30 يومًا · اليوم ${cd}</div>
          <h3 class="en" style="text-align:right">${esc(day.title)}</h3><div class="t-ar">${esc(day.titleAr)}</div>
          <div class="progress"><i style="width:${dayDoneCount(cd) / TASKS.length * 100}%"></i></div>
          <div class="small muted">${dayDoneCount(cd)} / ${TASKS.length} مهام · ساعتان تقريبًا</div></div></button>` : ''}

      ${lb ? `<div class="section-title">واصل من حيث توقّفت</div>${bookItem(lb)}` : ''}

      ${due ? `<div class="card row" style="background:var(--accent-soft)">
        <div class="grow"><b>🃏 ${due} كلمة تنتظر المراجعة</b><div class="small muted">المراجعة في الوقت المناسب تثبّت الكلمات في الذاكرة</div></div>
        <button class="btn accent" data-act="go" data-v="flash" data-src="due">راجع</button></div>` : ''}

      <div class="section-title">ابدأ بسرعة</div>
      <div class="quick">
        <button data-act="tab" data-t="program"><span class="em">📅</span><b>برنامج 30 يومًا</b><span>ساعتان يوميًا خطوة بخطوة</span></button>
        <button data-act="tab" data-t="mybooks"><span class="em">📚</span><b>كتبي</b><span>أضف كتبك واستمع إليها</span></button>
        <button data-act="studioLast"><span class="em">🎤</span><b>استوديو النطق</b><span>سجّل صوتك وصحّح نطقك</span></button>
        <button data-act="go" data-v="translate"><span class="em">🌐</span><b>ترجمة</b><span>إنجليزي ⇄ عربي</span></button>
        <button data-act="go" data-v="dictation"><span class="em">✍️</span><b>إملاء</b><span>اسمع واكتب</span></button>
        <button data-act="go" data-v="alphabet"><span class="em">🔤</span><b>الحروف A–Z</b><span>الاسم والصوت والتهجئة</span></button>
        <button data-act="go" data-v="sounds"><span class="em">🗣️</span><b>الأصوات الصعبة</b><span>P/B، V/F، ship/sheep...</span></button>
        <button data-act="go" data-v="grammar"><span class="em">📘</span><b>القواعد الأساسية</b><span>12 درسًا مع تمارين</span></button>
        <button data-act="go" data-v="method"><span class="em">💡</span><b>طريقة التعلّم</b><span>كيف تستعمل التطبيق</span></button>
      </div>

      <div class="section-title">كلمة اليوم</div>
      <div class="card">${wordRow(wod, true)}</div>
    </div>`;
  };

  function bookItem(info) {
    if (!info) return '';
    const pr = progress[info.id] || {};
    let pct;
    if (info.chapters > 1) pct = Math.round(Object.keys(pr.chDone || {}).length / info.chapters * 100);
    else pct = pr.done ? 100 : Math.round(((pr.max || 0) / (info.sents || 1)) * 100);
    const lvl = info.kind === 'mine' ? (info.level && info.level !== 'mine' ? info.level : 'MY BOOK') : info.level;
    return `<button class="book" data-act="openInfo" data-id="${esc(info.id)}">
      <div class="cover" style="background:${info.color || '#0E7C66'}">${info.emoji || '📘'}${info.day ? `<span class="daybadge">${info.day}</span>` : ''}</div>
      <div class="grow">
        <h3 class="en" style="text-align:right">${esc(info.title)}</h3>
        <div class="t-ar">${esc(info.titleAr || info.author || '')}</div>
        <div class="row small muted" style="margin-top:4px;flex-wrap:wrap;gap:6px"><span class="level">${esc(lvl)}</span>
          ${info.day ? `<span>📅 اليوم ${info.day}</span>` : ''}
          ${info.chapters > 1 ? `<span>${info.chapters} فصلًا</span>` : `<span>${info.sents} جملة</span>`}${pr.done ? '<span>✅ مكتمل</span>' : ''}</div>
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

  // ---- 30-day program
  Views.program = function () {
    const cd = currentDay();
    const last7 = Array.from({ length: 7 }, (_, i) => { const t = dayStr(Date.now() - (6 - i) * DAY); return { t, m: stats.hist[t] || 0, d: new Date(Date.now() - (6 - i) * DAY) }; });
    const maxM = Math.max(settings.timeGoal, ...last7.map((x) => x.m));
    const dn = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    return `${topbar('برنامج 30 يومًا', 'ساعتان من الإنجليزية كل يوم: استماع، قراءة، ترديد، كتابة', { back: false })}
    <div class="page">
      <div class="card">
        <div class="row"><div class="grow"><b>📅 اليوم ${cd} من ${PROGRAM.length}</b><div class="small muted">أكملت ${daysDone()} يومًا · المستوى يرتفع تدريجيًا من A1 إلى B2</div></div>
        <button class="btn" data-act="go" data-v="day" data-d="${cd}">ابدأ اليوم ${cd}</button></div>
        <div style="margin-top:12px">${timeBar()}</div>
      </div>
      <div class="section-title">أيام البرنامج</div>
      <div class="daygrid">${PROGRAM.map((p) => {
        const n = dayDoneCount(p.day); const done = prog.days[p.day] && prog.days[p.day].done;
        return `<button class="dcell ${done ? 'done' : ''} ${p.day === cd ? 'cur' : ''}" data-act="go" data-v="day" data-d="${p.day}">
          <b>${p.day}</b><span>${done ? '✅' : p.emoji}</span><i style="width:${n / TASKS.length * 100}%"></i></button>`;
      }).join('')}</div>
      <div class="section-title">وقت الدراسة (آخر 7 أيام)</div>
      <div class="card"><div class="bars">${last7.map((x) => `<div class="bar"><span class="v">${x.m}</span><i style="height:${Math.max(3, x.m / maxM * 100)}%;${x.m >= settings.timeGoal ? 'background:var(--ok)' : ''}"></i><span class="l">${dn[x.d.getDay()]}</span></div>`).join('')}</div>
        <div class="small muted center">العمود الأخضر = حقّقت هدف ${settings.timeGoal} دقيقة</div></div>
      <div class="card small">
        <b>🗓️ كيف تقسّم الساعتين؟</b>
        <ul class="method" style="margin:8px 0 0">${TASKS.map((t) => `<li>${t.em} ${t.t} — <b>${t.min} د</b></li>`).join('')}</ul>
        <div class="muted">يمكنك تقسيمها: ساعة صباحًا (استماع وقراءة) وساعة مساءً (ترديد ومراجعة وكتابة).</div>
      </div>
    </div>`;
  };

  Views.day = function (p) {
    const d = +p.d; const day = PROGRAM[d - 1];
    if (!day) return Views.program();
    const s = dayState(d);
    const prevId = d > 1 ? PROGRAM[d - 2].id : 'phrases';
    const prevTitle = (BUILTIN[prevId] || {}).title || '';
    const theme = (window.THEMES || []).find((t) => t.id === day.theme);
    const total = TASKS.reduce((a, t) => a + t.min, 0);
    return `${topbar(`اليوم ${d}: <span class="en">${esc(day.title)}</span>`, `${esc(day.titleAr)} · المستوى ${day.level} · ${total} دقيقة`)}
    <div class="page">
      <div class="card" style="background:var(--primary-soft)">
        <div class="row"><div class="cover-sm" style="background:${day.color}">${day.emoji}</div>
          <div class="grow"><b>${dayDoneCount(d)} / ${TASKS.length} مهام</b>
            <div class="progress"><i style="width:${dayDoneCount(d) / TASKS.length * 100}%"></i></div></div></div>
        <div style="margin-top:12px">${timeBar()}</div>
      </div>
      ${(() => { const b = BASICS_PATH[(d - 1) % BASICS_PATH.length]; const ps = b[0] === 'sound' ? `data-v="sound" data-id="${b[1]}"` : b[0] === 'lesson' ? `data-v="lesson" data-id="${b[1]}"` : `data-v="${b[0]}"`;
        return `<button class="bigcard" style="margin-top:12px" data-act="go" ${ps}><span class="em">📘</span><div class="grow"><b>أساس اليوم (10 د، ضمن وقت الكلمات)</b><small>${esc(b[2])}</small></div><span>←</span></button>`; })()}
      <div class="tasks">${TASKS.map((t, i) => {
        let extra = t.d;
        if (t.k === 'review') extra = `نصّ: <span class="en">${esc(prevTitle)}</span> — ${t.d}`;
        if (t.k === 'words' && theme) extra = `موضوع: ${theme.emoji} ${theme.nameAr} — ${t.d}`;
        return `<div class="task ${s.tasks[t.k] ? 'done' : ''}">
          <button class="tick" data-act="tick" data-d="${d}" data-k="${t.k}" aria-label="تمّ">${s.tasks[t.k] ? '✓' : ''}</button>
          <div class="grow"><b>${i + 1}. ${t.em} ${t.t}</b> <span class="mins">${t.min} د</span><div class="small muted">${extra}</div></div>
          <button class="btn ${s.tasks[t.k] ? 'ghost' : ''} sm" data-act="startTask" data-d="${d}" data-k="${t.k}">${s.tasks[t.k] ? 'أعد' : 'ابدأ'}</button>
        </div>`;
      }).join('')}</div>
      <p class="small muted">💡 تُعلَّم المهام تلقائيًا عند إنهائها، ويمكنك أيضًا الضغط على المربّع. أعد النصوص السابقة متى شئت: التكرار هو سرّ الطلاقة.</p>
      ${d < PROGRAM.length ? `<button class="btn ghost block" data-act="go" data-v="day" data-d="${d + 1}">اليوم التالي ←</button>` : ''}
    </div>`;
  };

  // ---- Library (built-in content)
  let libFilter = 'all';
  Views.library = function () {
    const filters = [['all', 'الكل'], ['program', '📅 البرنامج'], ['A1', 'A1 مبتدئ'], ['A2', 'A2 أساسي'], ['B1', 'B1 متوسط'], ['B2', 'B2 متقدّم']];
    const all = (window.BOOKS || []).map((b) => b.id).concat(PROGRAM.map((b) => b.id)).map(bookInfo);
    const list = all.filter((b) => libFilter === 'all' || (libFilter === 'program' ? b.kind === 'program' : b.level === libFilter));
    return `${topbar('المكتبة', `${all.length} نصًّا مع صوت وترجمة عربية`, { back: false })}
    <div class="page">
      <div class="chips">${filters.map(([k, l]) => `<button class="chip ${libFilter === k ? 'on' : ''}" data-act="lib" data-f="${k}">${l}</button>`).join('')}</div>
      <button class="card row" style="width:100%;margin:14px 0;text-align:right" data-act="tab" data-t="mybooks">
        <span style="font-size:30px">📚</span><div class="grow"><b>كتبي: أضف كتبك الخاصة</b><div class="small muted">الصق نصًّا، استورد ملف TXT أو EPUB، أو نزّل روايات كلاسيكية مجانية</div></div><span>←</span></button>
      ${list.map(bookItem).join('')}
    </div>`;
  };

  // ---- My books zone
  Views.mybooks = function () {
    return `${topbar('كتبي', 'منطقتك الخاصة: أضف أي كتاب واستمع إليه وردّده', { back: false })}
    <div class="page">
      <div class="addgrid">
        <button data-act="go" data-v="addtext"><span>✍️</span><b>الصق نصًّا</b><small>مقال، فصل، أغنية...</small></button>
        <button data-act="importFile"><span>📄</span><b>استورد ملفًا</b><small>TXT أو EPUB من هاتفك</small></button>
        <button data-act="go" data-v="classics"><span>🏛️</span><b>كتب كلاسيكية</b><small>${(window.CLASSICS || []).length} رواية مجانية</small></button>
        <button data-act="go" data-v="translate"><span>🌐</span><b>ترجم نصًّا</b><small>واجعله درسًا</small></button>
      </div>
      <input type="file" id="fileIn" accept=".txt,.epub,.text,text/plain,application/epub+zip" style="display:none">
      <div class="section-title">مكتبتي (${myMeta.length})</div>
      ${myMeta.length ? myMeta.map((m) => bookItem(Object.assign({ kind: 'mine' }, m))).join('')
        : '<div class="empty"><div class="em">📚</div>لم تضف أي كتاب بعد.<br>ابدأ بكتاب كلاسيكي سهل مثل <b>Aesop\'s Fables</b> أو الصق نصًّا تحبّه.</div>'}
      <div class="card small muted">💡 كل كتاب يُقسَّم إلى فصول قصيرة (حوالي 10 دقائق). في كل فصل: استماع بأي سرعة، ترجمة كل جملة إلى العربية، وزرّ 🎤 لاستوديو النطق حيث تسجّل صوتك وتصحّح نطقك.</div>
    </div>`;
  };
  Views.mybooks.after = function () {
    const inp = $('#fileIn');
    if (inp) inp.onchange = () => { const f = inp.files && inp.files[0]; inp.value = ''; if (f) importFile(f); };
  };

  async function importFile(f) {
    const name = f.name || 'book';
    if (/\.pdf$/i.test(name)) { toast('صيغة PDF غير مدعومة. استعمل ملف TXT أو EPUB.'); return; }
    toast('⏳ جارٍ تحضير الكتاب...');
    try {
      let title = name.replace(/\.(txt|epub|text)$/i, '').replace(/[_-]+/g, ' ');
      let author = ''; let chapters;
      if (/\.epub$/i.test(name)) {
        const r = await epubToBook(f); title = r.title || title; author = r.author; chapters = r.chapters;
      } else {
        let txt = await f.text();
        const tm = /^Title:\s*(.+)$/m.exec(txt); if (tm) title = tm[1].trim();
        const am = /^Author:\s*(.+)$/m.exec(txt); if (am) author = am[1].trim();
        txt = cleanGutenberg(txt);
        chapters = textToChapters(txt, title);
      }
      if (!countSents(chapters)) { toast('لم أجد نصًّا إنجليزيًا في هذا الملف'); return; }
      const meta = { id: 'm' + Date.now(), title, author, titleAr: author, emoji: '📗', color: pick(COLORS), level: 'mine', source: 'file', added: Date.now() };
      await saveMyBook(meta, chapters);
      toast(`✅ أُضيف: ${chapters.length} فصلًا`);
      go('bookinfo', { id: meta.id });
    } catch (e) { toast('تعذّرت قراءة الملف'); }
  }

  Views.bookinfo = function (p) {
    const b = getBookSync(p.id);
    if (!b) { loadBook(p.id).then(() => { if (current().name === 'bookinfo') render(); }).catch(() => back()); return loadingView(); }
    const pr = progress[b.id] || {};
    const chDone = pr.chDone || {};
    const nextCh = Math.min(b.chapters.length - 1, pr.ch || 0);
    return `${topbar(`<span class="en" style="display:block;text-align:right">${esc(b.title)}</span>`, esc(b.author || b.titleAr || ''), {
      right: b.kind === 'mine' ? `<button class="icon-btn" data-act="delBook" data-id="${esc(b.id)}" aria-label="حذف">🗑️</button>` : ''
    })}
    <div class="page">
      <div class="card row"><div class="cover-sm" style="background:${b.color}">${b.emoji || '📗'}</div>
        <div class="grow"><b>${b.chapters.length} فصلًا · ${countSents(b.chapters)} جملة</b>
          <div class="small muted">أنهيت ${Object.keys(chDone).length} فصلًا</div>
          <div class="progress"><i style="width:${Object.keys(chDone).length / b.chapters.length * 100}%"></i></div></div></div>
      <div class="row" style="gap:8px;margin-bottom:14px">
        <button class="btn grow" data-act="openCh" data-id="${esc(b.id)}" data-ch="${nextCh}">▶ ${pr.ch ? 'واصل' : 'ابدأ'}: الفصل ${nextCh + 1}</button>
        <button class="btn secondary" data-act="go" data-v="studio" data-id="${esc(b.id)}" data-ch="${nextCh}">🎤 ردّد</button>
      </div>
      <div class="wl">${b.chapters.map((c, i) => `<div class="wi">
        <span class="chn ${chDone[i] ? 'done' : ''}">${chDone[i] ? '✓' : i + 1}</span>
        <button class="grow chbtn en" data-act="openCh" data-id="${esc(b.id)}" data-ch="${i}">${esc(c.t)}<span class="small muted" style="display:block">${c.paragraphs.reduce((a, x) => a + x.length, 0)} sentences</span></button>
        <button class="sp-btn" data-act="go" data-v="studio" data-id="${esc(b.id)}" data-ch="${i}" aria-label="استوديو">${I.mic}</button>
      </div>`).join('')}</div>
    </div>`;
  };

  Views.classics = function () {
    const owned = {}; myMeta.forEach((m) => { if (m.gid) owned[m.gid] = m.id; });
    return `${topbar('كتب كلاسيكية مجانية', 'روايات إنجليزية أصلية من مكتبة Project Gutenberg')}
    <div class="page">
      <p class="small muted">الكتب في الملك العام ومجانية. يلزم الإنترنت للتنزيل مرة واحدة، ثم تُقرأ بدون إنترنت. ابدأ بالمستوى الأسهل.</p>
      ${(window.CLASSICS || []).map((c) => `<div class="book" style="cursor:default">
        <div class="cover" style="background:${COLORS[c.gid % COLORS.length]}">${c.emoji}</div>
        <div class="grow"><h3 class="en" style="text-align:right">${esc(c.title)}</h3>
          <div class="t-ar">${esc(c.titleAr)} · <span class="en">${esc(c.author)}</span></div>
          <div class="small muted">${esc(c.desc)}</div>
          <div class="row" style="margin-top:8px;justify-content:space-between"><span class="level">${c.level}</span>
          ${owned[c.gid] ? `<button class="btn secondary sm" data-act="openInfo" data-id="${owned[c.gid]}">📖 افتح</button>`
            : `<button class="btn sm" data-act="dlClassic" data-gid="${c.gid}">⬇️ نزّل</button>`}</div></div></div>`).join('')}
    </div>`;
  };

  // ---- Add own text
  Views.addtext = function () {
    return `${topbar('أضف نصًّا', 'الصق أي نص إنجليزي ليصبح درسًا بصوت وترجمة')}
    <div class="page">
      <label class="small muted">العنوان</label>
      <input class="input en" id="atTitle" placeholder="My text" style="margin-bottom:12px">
      <label class="small muted">النص الإنجليزي (اترك سطرًا فارغًا بين الفقرات)</label>
      <textarea class="input en" id="atText" rows="10" placeholder="Paste an English text here..."></textarea>
      <button class="btn block" style="margin-top:14px" data-act="saveText">💾 احفظ وافتح الدرس</button>
      <p class="small muted">يمكنك نسخ فصل من كتاب، مقال، كلمات أغنية أو رسالة عمل. سيُقسَّم النص إلى جمل وفصول قصيرة، ويمكنك الاستماع إليه بأي سرعة وترجمته وترديده.</p>
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
    const book = getBookSync(p.id);
    if (!book) { loadBook(p.id).then(() => { if (current().name === 'reader') render(); }).catch(() => back()); return loadingView(); }
    const pr = progress[book.id] || (progress[book.id] = {});
    let ch = p.ch != null ? +p.ch : (pr.ch || 0);
    ch = Math.max(0, Math.min(book.chapters.length - 1, ch));
    if ((pr.ch || 0) !== ch) { pr.ch = ch; pr.pos = 0; pr.max = 0; }
    const chapter = book.chapters[ch];
    const sents = flatten(chapter);
    R = { book, ch, sents, idx: Math.min(pr.pos || 0, Math.max(0, sents.length - 1)), playing: false, token: 0, repeat: false, shadow: false, hideAr: !settings.showAr, revealed: {} };
    stats.lastBook = book.id; saveStats(); saveProgress();
    let n = 0;
    const paras = chapter.paragraphs.map((para) => `<div class="para">${para.map(() => sentenceHtml(n++)).join('')}</div>`).join('');
    const multi = book.chapters.length > 1;
    const sub = book.day ? `📅 اليوم ${book.day} · ${esc(book.titleAr)}` : multi ? `<span class="en">${esc(chapter.t)}</span>` : esc(book.titleAr || book.author || '');
    return `${topbar(`<span class="en" style="text-align:right;display:block">${esc(book.title)}</span>`, sub, {
      right: `<button class="icon-btn" data-act="go" data-v="studio" data-id="${esc(book.id)}" data-ch="${ch}" aria-label="استوديو النطق">${I.mic}</button>`
    })}
    <div class="page">
      ${multi ? `<div class="chbar"><button class="btn ghost sm" data-act="chGo" data-ch="${ch - 1}" ${ch === 0 ? 'disabled' : ''}>→</button>
        <select class="input en" data-input="chapter">${book.chapters.map((c, i) => `<option value="${i}" ${i === ch ? 'selected' : ''}>${i + 1}. ${esc(c.t.slice(0, 50))}</option>`).join('')}</select>
        <button class="btn ghost sm" data-act="chGo" data-ch="${ch + 1}" ${ch >= book.chapters.length - 1 ? 'disabled' : ''}>←</button></div>` : ''}
      ${planHtml()}
      ${book.kind === 'mine' && sents.some((s) => !s.ar) ? `<button class="btn secondary block" style="margin-bottom:12px" data-act="trAll">🌐 ترجم كل جمل ${multi ? 'هذا الفصل' : 'النص'} إلى العربية</button>` : ''}
      <div id="paras">${paras || '<div class="empty">فصل فارغ</div>'}</div>
      <div class="center" style="margin:20px 0"><button class="btn" data-act="finishBook">✅ أنهيت ${multi ? 'هذا الفصل' : 'القراءة'}</button></div>
    </div>`;
  };
  Views.reader.after = function (p) {
    if (!R) return;
    $('#app').className = 'has-player';
    renderPlayer();
    setActive(R.idx, false);
    const el = $('#s' + R.idx); if (el && R.idx > 0) el.scrollIntoView({ block: 'center' });
    if (p.step) { const s = p.step; delete p.step; applyStep(s); }
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
    if (!R || !R.sents.length) return;
    $$('.sent.active').forEach((e) => { e.classList.remove('active'); const t = $('.tools', e); if (t) { t.classList.add('hidden'); t.innerHTML = ''; } });
    R.idx = i;
    const el = $('#s' + i); if (!el) return;
    el.classList.add('active');
    const t = $('.tools', el);
    t.classList.remove('hidden');
    t.innerHTML = `<button data-act="sayS" data-i="${i}" data-r="1">${I.speaker} عادي</button>
      <button data-act="sayS" data-i="${i}" data-r="0.55">🐢 ببطء</button>
      <button data-act="shadowS" data-i="${i}">${I.mic} ردّد وصحّح نطقك</button>`;
    if (scroll !== false) {
      const r = el.getBoundingClientRect();
      if (r.top < 70 || r.bottom > window.innerHeight - 220) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    const pr = progress[R.book.id] || (progress[R.book.id] = {});
    pr.ch = R.ch; pr.pos = i; pr.max = Math.max(pr.max || 0, i + 1);
    saveProgress();
  }

  function clearWordHl() { $$('.w.speaking').forEach((e) => e.classList.remove('speaking')); }
  function hlRange(sel, start, end) {
    clearWordHl();
    const el = $(sel); if (!el) return;
    for (const w of $$('.w', el)) { const o = +w.dataset.o; if (o >= start && o < Math.max(end, start + 1)) { w.classList.add('speaking'); break; } }
  }
  function speakSentence(i, rate) {
    return Speech.speak(R.sents[i].en, { rate, onRange: (s, e) => hlRange('#s' + i, s, e) }).then((r) => { clearWordHl(); return r; });
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
      if (i >= R.sents.length) finishBook();
    }
  }
  function pauseReader() { if (!R) return; R.playing = false; R.token++; Speech.stop(); clearWordHl(); updatePlayer(); }
  function stopReader() { if (!R) return; R.playing = false; R.token++; }
  function finishBook() {
    const b = R.book;
    const pr = progress[b.id] || (progress[b.id] = {});
    pr.chDone = pr.chDone || {};
    const first = !pr.chDone[R.ch];
    pr.chDone[R.ch] = true;
    if (Object.keys(pr.chDone).length >= b.chapters.length) pr.done = true;
    pr.max = R.sents.length; saveProgress();
    if (first) addPoints(5);
    if (taskCtx) {
      if (['listen1', 'read', 'listen2', 'review'].includes(taskCtx.k)) ctxDone(taskCtx.k, b.id);
      else if (taskCtx.k === 'free' && b.kind === 'mine') ctxDone('free');
    }
    const hasNext = R.ch < b.chapters.length - 1;
    sheet(`<div class="center"><div style="font-size:54px">🎉</div><h3>أحسنت! ${b.chapters.length > 1 ? `أكملت الفصل ${R.ch + 1}` : `أكملت "${esc(b.titleAr || b.title)}"`}</h3>
      <p class="muted">نصيحة: أعد الاستماع غدًا بالسرعة العادية بدون ترجمة، وردّد الجمل الصعبة في استوديو النطق 🎤.</p>
      <div class="actions">
        <button class="btn secondary" data-act="go" data-v="studio" data-id="${esc(b.id)}" data-ch="${R.ch}">🎤 ردّد الآن</button>
        ${hasNext ? `<button class="btn" data-act="chGo" data-ch="${R.ch + 1}">الفصل التالي ←</button>`
          : taskCtx ? `<button class="btn" data-act="go" data-v="day" data-d="${taskCtx.d}">↩ مهام اليوم</button>` : '<button class="btn" data-act="back">رجوع</button>'}
      </div></div>`);
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

  function applyStep(s) {
    if (!R) return;
    pauseReader();
    if (s === '1') { setRate(0.6); R.hideAr = true; R.shadow = false; }
    if (s === '2') { setRate(0.8); R.hideAr = false; R.shadow = false; }
    if (s === '3') { setRate(0.8); R.hideAr = false; R.shadow = true; }
    if (s === '4') { setRate(1); R.hideAr = true; R.shadow = false; }
    R.revealed = {}; R.repeat = false;
    $$('.ar-line[data-i]').forEach((e) => e.classList.toggle('masked', R.hideAr));
    $$('.steps button').forEach((b) => b.classList.toggle('on', b.dataset.s === s));
    renderPlayer();
    if (s === '2') { toast('📖 اقرأ مع الترجمة واضغط على أي كلمة لا تعرفها، ثم اضغط "أنهيت"'); setActive(0); }
    else { setActive(0); playReader(0); }
  }

  function wordSheet(word, ctx) {
    const info = lookup(word);
    const k = (info ? info.base : word).toLowerCase();
    const display = info ? info.base : word.toLowerCase();
    const s = sheet(`<div class="row"><div class="grow"><div class="word-big en">${esc(word)}</div>
        ${info && info.base !== word.toLowerCase() ? `<div class="small muted en">→ ${esc(info.base)}</div>` : ''}</div>
        <button class="sp-btn" data-act="say" data-text="${esc(word)}" data-r="1">${I.speaker}</button>
        <button class="sp-btn" data-act="say" data-text="${esc(word)}" data-r="0.45" style="font-size:18px">🐢</button></div>
      <div class="word-ar" id="wAr">${info ? esc(info.ar) : '<span class="muted small">... جارٍ الترجمة</span>'}</div>
      ${ctx ? `<div class="card" style="margin-bottom:12px"><div class="en small" style="font-size:15px">${esc(ctx.en)}</div>${ctx.ar ? `<div class="small muted">${esc(ctx.ar)}</div>` : ''}</div>` : ''}
      <div class="actions">
        <button class="btn ${saved[k] ? 'ghost' : 'accent'}" id="wSave">${saved[k] ? '✓ في كلماتي' : '⭐ احفظ الكلمة'}</button>
        <button class="btn secondary" id="wSayAr">🔊 اسمع بالعربية</button>
      </div>`);
    let ar = info ? info.ar : '';
    if (!info) translate(word.toLowerCase()).then((t) => { ar = t; const e = $('#wAr'); if (e) e.textContent = t; })
      .catch(() => { const e = $('#wAr'); if (e) e.innerHTML = '<span class="small muted">الترجمة غير متاحة الآن (تحتاج إلى الإنترنت أول مرة)</span>'; });
    $('#wSave', s).onclick = () => {
      if (saved[k]) toggleSave(display); else { saveWord(display, ar, ctx ? ctx.en : ''); toast('⭐ أُضيفت إلى كلماتي — ستراجعها في البطاقات'); }
      closeSheet();
      $$('.w').forEach((w) => { const b = lookup(w.dataset.w); const kk = (b ? b.base : w.dataset.w).toLowerCase(); w.classList.toggle('saved', !!saved[kk]); });
    };
    $('#wSayAr', s).onclick = () => { if (ar) sayAr(ar); };
    say(word, Math.min(settings.rate, 0.9));
  }

  async function pronounceSheet(target) {
    const r = await checkPronunciation(target);
    if (!r) { toast('لم أسمع شيئًا. حاول مرة أخرى.'); return; }
    sheet(resultHtml(r) + `<div class="actions"><button class="btn secondary" data-act="say" data-text="${esc(target)}" data-r="0.7">🐢 استمع</button><button class="btn" id="again">${I.mic} أعد المحاولة</button></div>`);
    $('#again').onclick = () => { closeSheet(); pronounceSheet(target); };
  }

  // ---- Pronunciation studio: listen → record yourself → compare → get corrected
  let ST = null;
  const stKey = (id, ch) => id + ':' + ch;
  Views.studio = function (p) {
    const b = getBookSync(p.id);
    if (!b) { loadBook(p.id).then(() => { if (current().name === 'studio') render(); }).catch(() => back()); return loadingView('استوديو النطق'); }
    const ch = Math.max(0, Math.min(b.chapters.length - 1, +(p.ch || 0)));
    const key = stKey(b.id, ch);
    if (!ST || ST.key !== key) {
      const saved0 = studioState[key] || {};
      ST = { key, book: b, ch, sents: flatten(b.chapters[ch]), i: saved0.i || 0, recs: {}, res: null, reveal: settings.showAr, recording: false, loop: 0 };
    }
    if (!ST.sents.length) return `${topbar('استوديو النطق')}<div class="empty">لا توجد جمل</div>`;
    ST.i = Math.max(0, Math.min(ST.sents.length - 1, ST.i));
    const s = ST.sents[ST.i];
    const sc = (studioState[key] && studioState[key].s) || {};
    const vals = Object.values(sc); const avg = vals.length ? Math.round(vals.reduce((a, x) => a + x, 0) / vals.length) : null;
    const rec = ST.recs[ST.i];
    const res = ST.res && ST.res.i === ST.i ? ST.res : null;
    return `${topbar('🎤 استوديو النطق', `<span class="en">${esc(b.title)}</span>${b.chapters.length > 1 ? ' · <span class="en">' + esc(b.chapters[ch].t) + '</span>' : ''}`)}
    <div class="page">
      <div class="row small muted" style="justify-content:space-between"><span>جملة ${ST.i + 1} / ${ST.sents.length}</span>
        <span>${vals.length ? `صحّحت ${vals.length} جملة · المعدّل <b>${avg}%</b>` : 'استمع ← سجّل ← قارن ← صحّح'}</span></div>
      <div class="dots">${ST.sents.map((_, i) => `<i class="${i === ST.i ? 'cur' : ''} ${sc[i] != null ? (sc[i] >= 70 ? 'good' : 'mid') : ''}"></i>`).join('')}</div>
      <div class="card studio-card" id="stS">
        <div class="en" style="font-size:calc(var(--en-size) + 3px);line-height:1.7">${tokenize(s.en)}</div>
        ${s.ar ? `<div class="ar-line ${ST.reveal ? '' : 'masked'}" style="margin:8px 0 0" data-act="stReveal">${esc(s.ar)}</div>`
          : `<button class="link" style="margin-top:8px" data-act="stTr">🌐 ترجم إلى العربية</button>`}
        ${sc[ST.i] != null ? `<div class="small" style="margin-top:6px">أفضل نتيجة لهذه الجملة: <b>${sc[ST.i]}%</b></div>` : ''}
      </div>
      ${speedChips(settings.rate, 'setRate')}
      <div class="sgrid">
        <button class="btn secondary" data-act="stListen" data-r="">${I.speaker} 1. استمع</button>
        <button class="btn secondary" data-act="stListen" data-r="0.55">🐢 ببطء</button>
        <button class="btn ghost" data-act="stLoop">🔁 ×3</button>
      </div>
      <div class="sgrid">
        <button class="btn ${ST.recording ? 'danger pulse' : 'accent'}" data-act="recToggle">${ST.recording ? I.stop + ' أوقف' : I.rec + ' 2. سجّل صوتك'}</button>
        <button class="btn ghost" data-act="recPlay" ${rec ? '' : 'disabled'}>▶ صوتي</button>
        <button class="btn ghost" data-act="recCompare" ${rec ? '' : 'disabled'}>⇄ قارن</button>
      </div>
      <button class="btn block" style="margin-top:10px;min-height:54px" data-act="stCheck">${I.mic} 3. صحّح نطقي</button>
      ${res ? `<div style="margin-top:12px">${resultHtml(res)}</div>` : ''}
      <div class="row" style="gap:10px;margin-top:14px">
        <button class="btn ghost grow" data-act="stMove" data-d="-1" ${ST.i === 0 ? 'disabled' : ''}>→ السابقة</button>
        <button class="btn grow" data-act="stMove" data-d="1">${ST.i === ST.sents.length - 1 ? '✅ إنهاء' : 'التالية ←'}</button>
      </div>
      <div class="card small muted" style="margin-top:14px">💡 الطريقة: استمع للجملة 3 مرات، سجّل صوتك، ثم اضغط "قارن" لتسمع النطق الصحيح ثم صوتك. بعدها "صحّح نطقي": الكلمات الحمراء هي التي تحتاج تدريبًا.</div>
    </div>`;
  };
  Views.studio.after = function () { Rec.onAutoStop = () => { if (ST && ST.recording) A.recToggle(); }; };
  function stSaveScore(pct) {
    const st = studioState[ST.key] || (studioState[ST.key] = { s: {} });
    st.s = st.s || {};
    st.s[ST.i] = Math.max(st.s[ST.i] || 0, pct);
    st.i = ST.i;
    store.set('studio', studioState);
    const n = Object.keys(st.s).length;
    if (taskCtx && taskCtx.k === 'shadow' && n >= Math.ceil(ST.sents.length * 0.6)) ctxDone('shadow');
  }

  // ---- Basics: alphabet, sounds, grammar
  const ALPHA = window.ALPHABET || [];
  const SOUNDS = window.SOUNDS || [];
  const GRAMMAR = window.GRAMMAR || [];
  let basicsProg = Object.assign({ alpha: null, spell: null, sounds: {}, speak: {}, grammar: {} }, store.get('basics', {}));
  const saveBasics = () => store.set('basics', basicsProg);
  const bestOf = (obj, k, v) => { obj[k] = Math.max(obj[k] || 0, v); saveBasics(); };
  const letterText = (L) => L + '.';
  const sayLetter = (L, rate) => Speech.speak(letterText(L), { rate: rate || Math.min(settings.rate, 0.85) });
  const spellText = (w) => w.toUpperCase().replace(/[^A-Z]/g, '').split('').map(letterText).join(' ');
  const hlLetter = (word, L) => esc(word).replace(new RegExp(L, 'gi'), (m) => `<b class="hlL">${m}</b>`);

  // A short "basics of the day" suggestion for each day of the 30-day program.
  const BASICS_PATH = (() => {
    const out = [['alphabet', '', '🔤 الحروف الإنجليزية: الاسم والصوت']];
    for (let i = 0; i < Math.max(SOUNDS.length, GRAMMAR.length); i++) {
      if (SOUNDS[i]) out.push(['sound', SOUNDS[i].id, `${SOUNDS[i].emoji} نطق: ${SOUNDS[i].title}`]);
      if (GRAMMAR[i]) out.push(['lesson', GRAMMAR[i].id, `${GRAMMAR[i].emoji} قواعد: ${GRAMMAR[i].titleAr}`]);
    }
    const fill = [['spelling', '', '✍️ لعبة التهجئة'], ['alphaquiz', '', '🎯 اختبار الحروف']];
    for (let k = 0; out.length < 30; k++) out.push(fill[k % 2]);
    return out;
  })();

  Views.basics = function () {
    const bp = basicsProg;
    const due = dueWords().length;
    return `${topbar('الأساسيات', 'ابدأ من الصفر: الحروف، النطق، القواعد، الكلمات', { back: false })}
    <div class="page">
      <div class="card" style="background:var(--accent-soft)"><b>🧭 مسار المبتدئ</b>
        <div class="small" style="margin-top:4px">1) تعلّم أسماء الحروف وأصواتها ← 2) تدرّب على الأصوات الصعبة على العرب ← 3) القواعد الأساسية ← 4) الكلمات اليومية. في برنامج 30 يومًا تجد «أساس اليوم» في صفحة كل يوم.</div></div>
      <button class="bigcard" data-act="go" data-v="alphabet"><span class="em">🔤</span><div class="grow"><b>الحروف الإنجليزية A–Z</b><small>اسم كل حرف، صوته، أمثلة، تهجئة الأسماء</small></div>${bp.alpha != null ? `<span class="badge">${bp.alpha}%</span>` : ''}</button>
      <button class="bigcard" data-act="go" data-v="sounds"><span class="em">🗣️</span><div class="grow"><b>النطق: الأصوات الصعبة</b><small>P/B، V/F، ship/sheep، th، نهاية ed، الحروف الصامتة...</small></div><span class="badge">${Object.keys(bp.sounds).length}/${SOUNDS.length}</span></button>
      <button class="bigcard" data-act="go" data-v="grammar"><span class="em">📘</span><div class="grow"><b>القواعد الأساسية</b><small>to be، have، المضارع، الماضي، المستقبل، الأسئلة...</small></div><span class="badge">${Object.keys(bp.grammar).length}/${GRAMMAR.length}</span></button>
      <button class="bigcard" data-act="go" data-v="words"><span class="em">🃏</span><div class="grow"><b>الكلمات اليومية</b><small>${ALL_WORDS.length} كلمة في ${(window.THEMES || []).length} موضوعًا${due ? ` · ${due} للمراجعة` : ''}</small></div></button>
      <div class="card small">
        <b>🎙️ كيف تتكلّم بثقة؟</b>
        <ul class="method" style="margin:6px 0 0">
          <li>استمع أولًا ثم قلّد: النطق يُتعلّم بالأذن قبل الفم.</li>
          <li>ابدأ بطيئًا (0.5×) ثم ارفع السرعة. ردّد بصوت عالٍ دائمًا، لا في رأسك.</li>
          <li>سجّل صوتك في استوديو النطق 🎤 وقارنه بالأصل: ستسمع الفرق بنفسك.</li>
          <li>ركّز على الأصوات غير الموجودة في العربية: P و V والحروف المتحرّكة القصيرة.</li>
          <li>الخطأ طبيعي: المهمّ أن يفهمك الآخرون، لا أن تكون لهجتك مثالية.</li>
        </ul></div>
    </div>`;
  };

  // ---- Alphabet
  Views.alphabet = function () {
    return `${topbar('الحروف الإنجليزية', '26 حرفًا · اضغط على أي حرف لتسمع اسمه وصوته')}
    <div class="page">
      <div class="card small">🔤 في الإنجليزية <b>26 حرفًا</b>: خمسة حروف متحرّكة (vowels) <b class="en">A E I O U</b> والباقي ساكنة (consonants).
        لكل حرف <b>اسم</b> نستعمله في التهجئة (A = «إيه») و<b>صوت</b> داخل الكلمات (apple = «أَ»). انتبه خاصّة إلى <b class="en">E</b> = «إي» و<b class="en">I</b> = «آي» و<b class="en">A</b> = «إيه».</div>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <button class="btn grow" data-act="abcPlay">▶ كل الحروف</button>
        <button class="btn secondary grow" data-act="go" data-v="alphaquiz">🎯 اختبار</button>
        <button class="btn secondary grow" data-act="go" data-v="spelling">✍️ التهجئة</button>
      </div>
      ${speedChips(settings.rate, 'setRate')}
      <div class="abc">${ALPHA.map((a, i) => `<button class="lt ${a.vowel ? 'vow' : ''} ${a.flag ? 'new' : ''}" id="lt${i}" data-act="letter" data-i="${i}"><b class="en">${a.L}${a.L.toLowerCase()}</b><span>${esc(a.ar)}</span></button>`).join('')}</div>
      <div class="small muted center" style="margin:8px 0">🟩 حرف متحرّك · 🟧 صوت غير موجود في العربية</div>
      <div class="card"><b>🔡 تهجئة اسمك أو أي كلمة</b>
        <div class="row" style="gap:8px;margin-top:8px"><input class="input en grow" id="spellIn" placeholder="Omar" autocapitalize="off" autocomplete="off"><button class="btn" data-act="spellIt">🔊 تهجئة</button></div>
        <div id="spellOut" class="en" style="margin-top:8px;font-weight:700;letter-spacing:1px"></div>
        <div class="small muted" style="margin-top:6px">مفيد جدًّا في الهاتف أو الفندق أو المطار: <span class="en">How do you spell your name? — O-M-A-R.</span></div></div>
      <button class="btn ghost block" data-act="go" data-v="studio" data-id="abc">🎤 تدرّب على النطق: <span class="en">A is for apple…</span></button>
    </div>`;
  };
  function letterSheet(i) {
    const a = ALPHA[i];
    sheet(`<div class="row"><div class="lt-big en">${a.L}${a.L.toLowerCase()}</div>
        <div class="grow"><div class="word-ar" style="margin:0">«${esc(a.ar)}»</div><div class="en muted">${esc(a.ipa)}</div>
          ${a.vowel ? '<span class="level">VOWEL · حرف متحرّك</span>' : ''}</div>
        <button class="sp-btn" data-act="sayLetter" data-l="${a.L}">${I.speaker}</button></div>
      <div class="card" style="margin-top:10px"><b>🔈 صوته داخل الكلمات</b><div style="margin-top:4px">${mixed(a.snd)}</div></div>
      <div class="wl">${a.w.map(([en, ar]) => `<div class="wi"><button class="sp-btn" data-act="say" data-text="${esc(en)}">${I.speaker}</button>
        <div class="grow"><div class="en" style="font-size:20px">${hlLetter(en, a.L)}</div><div class="arw" style="color:var(--primary)">${esc(ar)}</div></div>
        <button class="sp-btn" data-act="say" data-text="${esc(en)}" data-r="0.45">🐢</button></div>`).join('')}</div>
      <div class="actions" style="margin-top:12px">
        <button class="btn secondary" data-act="say" data-text="${esc(a.say)}"><span class="en">🔊 ${esc(a.say)}</span></button>
        <button class="btn" data-act="pronounce" data-text="${esc(a.say)}">${I.mic} قلها وصحّح</button></div>
      <div class="row" style="justify-content:space-between;margin-top:12px">
        <button class="btn ghost sm" data-act="letter" data-i="${(i + ALPHA.length - 1) % ALPHA.length}">→ ${ALPHA[(i + ALPHA.length - 1) % ALPHA.length].L}</button>
        <button class="btn ghost sm" data-act="letter" data-i="${(i + 1) % ALPHA.length}">${ALPHA[(i + 1) % ALPHA.length].L} ←</button></div>`);
    sayLetter(a.L);
  }

  // ---- Alphabet quiz: hear a letter name, pick it
  const CONFUSE = ['AEI', 'BPVD', 'GJZ', 'MN', 'QUW', 'CSX', 'KQC', 'RLH', 'TD', 'OU', 'FV', 'YIW'];
  let aq = null;
  Views.alphaquiz = function () {
    if (!aq) {
      const letters = shuffle(ALPHA.map((a) => a.L)).slice(0, 12);
      aq = { qs: letters.map((L) => {
        const near = shuffle(Array.from(new Set(CONFUSE.filter((g) => g.includes(L)).join('').replace(L, '').split('').filter((x) => x && x !== L))));
        const rest = shuffle(ALPHA.map((a) => a.L).filter((x) => x !== L && !near.includes(x)));
        return { L, opts: shuffle([L].concat(near.slice(0, 2), rest).slice(0, 4)) };
      }), i: 0, score: 0, ans: null };
    }
    if (aq.i >= aq.qs.length) {
      const pct = Math.round(aq.score / aq.qs.length * 100);
      return `${topbar('اختبار الحروف')}<div class="page"><div class="empty"><div class="em">${pct >= 80 ? '🏆' : '💪'}</div><h2>${aq.score} / ${aq.qs.length}</h2>
        <p>${pct >= 80 ? 'ممتاز! تعرف أسماء الحروف.' : 'راجع الحروف التي أخطأت فيها واستمع إليها مرّة أخرى.'}</p>
        <button class="btn" data-act="aqAgain">اختبار جديد</button></div></div>`;
    }
    const q = aq.qs[aq.i]; const a = ALPHA.find((x) => x.L === q.L);
    return `${topbar('اختبار الحروف', 'اسمع اسم الحرف واختره')}
    <div class="page">
      <div class="counter">${aq.i + 1} / ${aq.qs.length} · ✔ ${aq.score}</div>
      <div class="q-prompt"><button class="big-listen" data-act="sayLetter" data-l="${q.L}">${I.speaker}</button>
        <div style="margin-top:8px"><button class="link" data-act="sayLetter" data-l="${q.L}" data-r="0.5">🐢 ببطء</button></div></div>
      <div class="abc4">${q.opts.map((L) => {
        let cls = ''; if (aq.ans) { if (L === q.L) cls = 'right'; else if (L === aq.ans) cls = 'wrong'; }
        return `<button class="opt en ${cls}" style="font-size:34px;text-align:center" data-act="aqAnswer" data-l="${L}" ${aq.ans ? 'disabled' : ''}>${L}</button>`;
      }).join('')}</div>
      ${aq.ans ? `<div class="feedback ${aq.ans === q.L ? 'ok' : 'bad'}">${aq.ans === q.L ? '✅ صحيح!' : '❌'} الحرف <b class="en">${q.L}</b> = «${esc(a.ar)}» <span class="en">${esc(a.ipa)}</span></div>
        <button class="btn block" style="margin-top:12px" data-act="aqNext">التالي ←</button>` : ''}
    </div>`;
  };
  Views.alphaquiz.after = function () {
    if (!aq || aq.i >= aq.qs.length || aq.ans) return;
    const st = aq, i = st.i;
    setTimeout(() => { if (aq === st && st.i === i && !st.ans) sayLetter(st.qs[i].L); }, 250);
  };

  // ---- Spelling game: hear the letters, type the word
  let sp = null;
  Views.spelling = function () {
    if (!sp) { const pool = shuffle(window.SPELL_WORDS || []); sp = { pool, k: 0, w: pool[0], res: null, n: 0, ok: 0 }; }
    const [w, ar] = sp.w;
    return `${topbar('التهجئة', 'اسمع الحروف واكتب الكلمة')}
    <div class="page">
      <div class="counter">✔ ${sp.ok} / ${sp.n}</div>
      <div class="q-prompt"><button class="big-listen" data-act="spellPlay">${I.speaker}</button>
        <div class="small muted" style="margin-top:8px">ستسمع الكلمة حرفًا حرفًا: <span class="en">C - A - T</span></div></div>
      ${speedChips(settings.rate, 'setRate')}
      <input class="input en" id="spIn" style="margin-top:14px;font-size:22px;text-align:center" placeholder="..." autocapitalize="off" autocomplete="off" spellcheck="false" ${sp.res ? 'disabled' : ''} value="${esc(sp.res ? sp.res.input : '')}">
      ${sp.res ? `<div class="feedback ${sp.res.ok ? 'ok' : 'bad'}">${sp.res.ok ? '✅ صحيح!' : '❌ الكلمة الصحيحة:'} <b class="en">${esc(w)}</b> = ${esc(ar)}</div>
        <div class="card en center" style="margin-top:10px;font-size:20px;letter-spacing:2px">${w.toUpperCase().split('').join(' - ')}</div>
        <div class="row" style="gap:8px"><button class="btn ghost grow" data-act="say" data-text="${esc(w)}">🔊 الكلمة</button><button class="btn grow" data-act="spNext">كلمة أخرى ←</button></div>`
      : `<div class="row" style="gap:8px;margin-top:12px"><button class="btn grow" data-act="spCheck">تحقّق</button><button class="btn ghost" data-act="say" data-text="${esc(w)}">💡 اسمع الكلمة</button></div>`}
    </div>`;
  };
  Views.spelling.after = function () {
    if (!sp || sp.res) return;
    const st = sp, w = st.w;
    setTimeout(() => { if (sp === st && st.w === w && !st.res && current().name === 'spelling') A.spellPlay(); }, 300);
  };

  // ---- Difficult sounds
  Views.sounds = function () {
    return `${topbar('النطق: الأصوات الصعبة', 'الأصوات التي يخلط بينها المتكلّمون بالعربية')}
    <div class="page">
      <div class="card small">🎧 في كل درس: شرح بالعربية، أزواج كلمات يتغيّر معناها بتغيّر صوت واحد، اختبار استماع، وتمرين نطق مع تصحيح.</div>
      ${SOUNDS.map((s) => {
        const ex = s.kind === 'pairs' ? `${s.pairs[0][0]} / ${s.pairs[0][1]}` : s.kind === 'groups' ? s.groups.map((g) => g.words[0][0]).join(' · ') : s.words.slice(0, 3).map((w) => w[0]).join(' · ');
        const best = basicsProg.sounds[s.id];
        return `<button class="bigcard" data-act="go" data-v="sound" data-id="${s.id}"><span class="em">${s.emoji}</span>
          <div class="grow"><b class="en">${esc(s.title)}</b> <span class="small muted">${esc(s.titleAr)}</span><small class="en">${esc(ex)}</small></div>
          ${best != null ? `<span class="badge ${best >= 80 ? 'good' : ''}">${best}%</span>` : ''}</button>`;
      }).join('')}
    </div>`;
  };

  Views.sound = function (p) {
    const s = SOUNDS.find((x) => x.id === p.id); if (!s) return Views.sounds();
    let body = '';
    if (s.kind === 'pairs') {
      body = `<div class="pairs">${s.pairs.map(([a, b, aa, bb]) => `<div class="pair">
        <button class="pw" data-act="say" data-text="${esc(a)}"><b class="en">${esc(a)}</b><span>${esc(aa)}</span></button>
        <button class="vs" data-act="sayPair" data-a="${esc(a)}" data-b="${esc(b)}" aria-label="قارن">⇄</button>
        <button class="pw" data-act="say" data-text="${esc(b)}"><b class="en">${esc(b)}</b><span>${esc(bb)}</span></button></div>`).join('')}</div>`;
    } else if (s.kind === 'groups') {
      body = `<div class="groups">${s.groups.map((g) => `<div class="group"><div class="glabel en">${esc(g.label)}</div>
        ${g.words.map(([w, ar]) => `<button class="gw" data-act="say" data-text="${esc(w)}"><b class="en">${esc(w)}</b><span>${esc(ar)}</span></button>`).join('')}</div>`).join('')}</div>`;
    } else {
      body = `<div class="wl">${s.words.map(([w, ar, note]) => `<div class="wi"><button class="sp-btn" data-act="say" data-text="${esc(w)}">${I.speaker}</button>
        <div class="grow"><b class="en" style="font-size:19px">${esc(w)}</b> <span class="arw" style="color:var(--primary)">${esc(ar)}</span><div class="small muted">${mixed(note)}</div></div>
        <button class="sp-btn" data-act="say" data-text="${esc(w)}" data-r="0.45">🐢</button></div>`).join('')}</div>`;
    }
    return `${topbar(`<span class="en">${esc(s.title)}</span>`, esc(s.titleAr))}
    <div class="page">
      <div class="card"><div>${mixed(s.explain)}</div><div class="tipbox">💡 ${mixed(s.tip)}</div></div>
      <div class="row" style="gap:8px;margin-bottom:10px">
        ${s.kind !== 'list' ? `<button class="btn grow" data-act="go" data-v="soundquiz" data-id="${s.id}">🎧 اسمع واختر</button>` : ''}
        <button class="btn secondary grow" data-act="go" data-v="soundspeak" data-id="${s.id}">${I.mic} انطق وصحّح</button>
      </div>
      ${speedChips(settings.rate, 'setRate')}
      <div style="margin-top:12px">${body}</div>
      ${s.kind === 'pairs' ? '<p class="small muted center">اضغط على ⇄ لتسمع الكلمتين وراء بعضهما وتلاحظ الفرق.</p>' : ''}
    </div>`;
  };

  let sq = null;
  Views.soundquiz = function (p) {
    const s = SOUNDS.find((x) => x.id === p.id);
    if (!sq || sq.id !== s.id) {
      let qs;
      if (s.kind === 'pairs') qs = shuffle(s.pairs.flatMap((pr) => [0, 1].map((side) => ({ word: pr[side], opts: [[pr[0], pr[2]], [pr[1], pr[3]]] })))).slice(0, 10);
      else qs = shuffle(s.groups.flatMap((g) => g.words.map(([w, ar]) => ({ word: w, ar, label: g.label })))).slice(0, 10)
        .map((q) => Object.assign(q, { opts: s.groups.map((g) => [g.label, g.words[0][0]]) }));
      sq = { id: s.id, qs, i: 0, score: 0, ans: null };
    }
    if (sq.i >= sq.qs.length) {
      const pct = Math.round(sq.score / sq.qs.length * 100);
      return `${topbar('اختبار الاستماع', esc(s.title))}<div class="page"><div class="empty"><div class="em">${pct >= 80 ? '🏆' : '💪'}</div><h2>${sq.score} / ${sq.qs.length}</h2>
        <p>${pct >= 80 ? 'أذنك تميّز هذا الصوت جيّدًا!' : 'استمع إلى الأزواج مرّة أخرى ببطء، ثم أعد الاختبار.'}</p>
        <div class="row" style="gap:8px;justify-content:center"><button class="btn" data-act="sqAgain">أعد</button><button class="btn secondary" data-act="go" data-v="soundspeak" data-id="${s.id}">${I.mic} تمرين النطق</button></div></div></div>`;
    }
    const q = sq.qs[sq.i];
    const correct = s.kind === 'pairs' ? q.word : q.label;
    return `${topbar('اختبار الاستماع', esc(s.title))}
    <div class="page">
      <div class="counter">${sq.i + 1} / ${sq.qs.length} · ✔ ${sq.score}</div>
      <div class="q-prompt"><button class="big-listen" data-act="say" data-text="${esc(q.word)}">${I.speaker}</button>
        <div style="margin-top:8px"><button class="link" data-act="say" data-text="${esc(q.word)}" data-r="0.45">🐢 ببطء</button></div>
        <p class="muted small">${s.kind === 'pairs' ? 'أيّ كلمة سمعت؟' : 'كيف تُنطق نهاية هذا الفعل؟'}</p></div>
      <div class="options">${q.opts.map(([w, sub]) => {
        let cls = ''; if (sq.ans) { if (w === correct) cls = 'right'; else if (w === sq.ans) cls = 'wrong'; }
        return `<button class="opt ${cls}" data-act="sqAnswer" data-w="${esc(w)}" ${sq.ans ? 'disabled' : ''}><span class="en" style="font-size:22px">${esc(w)}</span><div class="small muted">${esc(sub)}</div></button>`;
      }).join('')}</div>
      ${sq.ans ? `<div class="feedback ${sq.ans === correct ? 'ok' : 'bad'}">${sq.ans === correct ? '✅ صحيح!' : `❌ الكلمة كانت <b class="en">${esc(q.word)}</b>`}</div>
        <div class="row" style="gap:8px;margin-top:10px">${s.kind === 'pairs' ? `<button class="btn ghost grow" data-act="sayPair" data-a="${esc(q.opts[0][0])}" data-b="${esc(q.opts[1][0])}">⇄ قارن</button>` : ''}<button class="btn grow" data-act="sqNext">التالي ←</button></div>` : ''}
    </div>`;
  };
  Views.soundquiz.after = function () {
    if (!sq || sq.i >= sq.qs.length || sq.ans) return;
    const st = sq, i = st.i;
    setTimeout(() => { if (sq === st && st.i === i && !st.ans) say(st.qs[i].word); }, 250);
  };

  let ss = null;
  Views.soundspeak = function (p) {
    const s = SOUNDS.find((x) => x.id === p.id);
    if (!ss || ss.id !== s.id) {
      let items;
      if (s.kind === 'pairs') items = s.pairs.flatMap(([a, b, aa, bb]) => [{ w: a, ar: aa, other: b }, { w: b, ar: bb, other: a }]);
      else if (s.kind === 'groups') items = s.groups.flatMap((g) => g.words.map(([w, ar]) => ({ w, ar, note: g.label })));
      else items = s.words.map(([w, ar, note]) => ({ w, ar, note }));
      ss = { id: s.id, items: shuffle(items), k: 0, res: null, n: 0, ok: 0 };
    }
    const it = ss.items[ss.k];
    return `${topbar('تمرين النطق', esc(s.title))}
    <div class="page">
      <div class="counter">✔ ${ss.ok} / ${ss.n}</div>
      <div class="card center studio-card">
        <div class="en" style="font-size:40px;font-weight:800">${esc(it.w)}</div>
        <div class="arw" style="color:var(--primary);font-size:18px">${esc(it.ar)}</div>
        ${it.note ? `<div class="small muted en">${esc(it.note)}</div>` : ''}
        ${it.other ? `<div class="small muted">لا تخلطها مع: <span class="en">${esc(it.other)}</span></div>` : ''}
      </div>
      ${speedChips(settings.rate, 'setRate')}
      <div class="row" style="gap:8px;margin-top:12px">
        <button class="btn secondary grow" data-act="say" data-text="${esc(it.w)}">${I.speaker} 1. استمع</button>
        <button class="btn secondary" data-act="say" data-text="${esc(it.w)}" data-r="0.45">🐢</button>
        <button class="btn grow" data-act="ssCheck">${I.mic} 2. قلها</button>
      </div>
      ${ss.res ? `<div class="feedback ${ss.res.ok ? 'ok' : 'bad'}" style="margin-top:12px">${ss.res.msg}</div>
        ${ss.res.ok ? '' : `<div class="tipbox">💡 ${mixed(s.tip)}</div>`}` : ''}
      <button class="btn ghost block" style="margin-top:12px" data-act="ssNext">الكلمة التالية ←</button>
    </div>`;
  };

  // ---- Grammar
  Views.grammar = function () {
    return `${topbar('القواعد الأساسية', `${GRAMMAR.length} درسًا قصيرًا مع أمثلة صوتية وتمارين`)}
    <div class="page">
      <div class="card small">📘 كل درس: شرح مختصر بالعربية، قاعدة، أمثلة تسمعها بأي سرعة، أخطاء شائعة عند العرب، اختبار، وتمرين نطق للأمثلة.</div>
      ${GRAMMAR.map((g, i) => {
        const best = basicsProg.grammar[g.id];
        return `<button class="bigcard" data-act="go" data-v="lesson" data-id="${g.id}"><span class="em">${g.emoji}</span>
          <div class="grow"><b>${i + 1}. ${esc(g.titleAr)}</b><small class="en">${esc(g.title)}</small></div>
          <span class="level">${g.level}</span>${best != null ? `<span class="badge ${best >= 80 ? 'good' : ''}">${best}%</span>` : ''}</button>`;
      }).join('')}
    </div>`;
  };

  Views.lesson = function (p) {
    const g = GRAMMAR.find((x) => x.id === p.id); if (!g) return Views.grammar();
    return `${topbar(`${g.emoji} ${esc(g.titleAr)}`, `<span class="en">${esc(g.title)}</span> · ${g.level}`)}
    <div class="page">
      <div class="card">${g.explain.map((t) => `<p style="margin:0 0 8px">${mixed(t)}</p>`).join('')}</div>
      <div class="formula" dir="auto">${esc(g.formula)}</div>
      <div class="row" style="gap:8px;margin:12px 0">
        <button class="btn grow" data-act="openCh" data-id="g_${g.id}" data-ch="0">▶ استمع</button>
        <button class="btn secondary grow" data-act="go" data-v="studio" data-id="g_${g.id}">${I.mic} انطق</button>
        <button class="btn accent grow" data-act="go" data-v="gquiz" data-id="${g.id}">🧩 اختبار</button>
      </div>
      <div class="section-title">أمثلة</div>
      <div class="wl">${g.ex.map(([en, ar]) => `<div class="wi"><button class="sp-btn" data-act="say" data-text="${esc(en)}">${I.speaker}</button>
        <div class="grow"><div class="en" style="font-size:17px">${esc(en)}</div><div class="small muted">${esc(ar)}</div></div>
        <button class="sp-btn" data-act="pronounce" data-text="${esc(en)}" aria-label="انطق">${I.mic}</button></div>`).join('')}</div>
      <div class="section-title">⚠️ أخطاء شائعة</div>
      <div class="wl">${g.mist.map(([w, r, n]) => `<div class="wi"><div class="grow">
        <div class="en"><s class="wrongtxt">${esc(w)}</s> → <b class="righttxt">${esc(r)}</b></div><div class="small muted">${mixed(n)}</div></div>
        <button class="sp-btn" data-act="say" data-text="${esc(r)}">${I.speaker}</button></div>`).join('')}</div>
    </div>`;
  };

  let gq = null;
  const fillBlank = (q, opt) => (opt === '—' ? q.replace(/___ ?/, '') : q.replace('___', opt)).replace(/^./, (c) => c.toUpperCase());
  Views.gquiz = function (p) {
    const g = GRAMMAR.find((x) => x.id === p.id);
    if (!gq || gq.id !== g.id) gq = { id: g.id, qs: shuffle(g.quiz), i: 0, score: 0, ans: null };
    if (gq.i >= gq.qs.length) {
      const pct = Math.round(gq.score / gq.qs.length * 100);
      return `${topbar('اختبار', esc(g.titleAr))}<div class="page"><div class="empty"><div class="em">${pct >= 80 ? '🏆' : '💪'}</div><h2>${gq.score} / ${gq.qs.length}</h2>
        <p>${pct >= 80 ? 'ممتاز! فهمت القاعدة.' : 'راجع الشرح والأمثلة ثم أعد الاختبار.'}</p>
        <div class="row" style="gap:8px;justify-content:center"><button class="btn" data-act="gqAgain">أعد</button><button class="btn secondary" data-act="go" data-v="studio" data-id="g_${g.id}">${I.mic} انطق الأمثلة</button></div></div></div>`;
    }
    const [q, opts, ans, why] = gq.qs[gq.i];
    const full = fillBlank(q, opts[ans]);
    return `${topbar('اختبار', esc(g.titleAr))}
    <div class="page">
      <div class="counter">${gq.i + 1} / ${gq.qs.length} · ✔ ${gq.score}</div>
      <div class="card en center" style="font-size:22px;padding:22px 12px">${esc(q).replace('___', '<span class="blank">____</span>')}</div>
      <div class="options">${opts.map((o, k) => {
        let cls = ''; if (gq.ans != null) { if (k === ans) cls = 'right'; else if (k === gq.ans) cls = 'wrong'; }
        return `<button class="opt en ${cls}" data-act="gqAnswer" data-k="${k}" ${gq.ans != null ? 'disabled' : ''}>${esc(o)}</button>`;
      }).join('')}</div>
      ${gq.ans != null ? `<div class="feedback ${gq.ans === ans ? 'ok' : 'bad'}">${gq.ans === ans ? '✅ صحيح!' : '❌ الجواب الصحيح:'} <span class="en">${esc(full)}</span><div class="small" style="margin-top:4px">${mixed(why)}</div></div>
        <div class="row" style="gap:8px;margin-top:10px"><button class="btn ghost grow" data-act="say" data-text="${esc(full)}">🔊 استمع</button><button class="btn grow" data-act="gqNext">التالي ←</button></div>` : ''}
    </div>`;
  };

  // ---- Words
  let wordsTab = 'themes';
  Views.words = function () {
    const due = dueWords().length;
    const mine = Object.values(saved).sort((a, b) => b.added - a.added);
    const head = `${topbar('الكلمات', `${ALL_WORDS.length} كلمة في ${window.THEMES.length} موضوعًا`, { back: stack.length > 1 ? undefined : false })}
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
      if (fc.done) ctxDone('words');
      const moreDue = p.src === 'theme' && dueWords().length;
      return `${topbar('البطاقات')}<div class="page"><div class="empty"><div class="em">${fc.done ? '🏆' : '✅'}</div>
        <h3>${fc.done ? `أحسنت! راجعت ${fc.done} بطاقة` : 'لا توجد كلمات للمراجعة الآن'}</h3>
        <p>${fc.done ? `عرفت ${fc.ok} منها. سنعيد لك الكلمات في الوقت المناسب قبل أن تنساها.` : 'احفظ كلمات جديدة أو اختر موضوعًا من قسم الكلمات.'}</p>
        ${moreDue ? `<button class="btn accent" data-act="go" data-v="flash" data-src="due">🃏 راجع ${moreDue} كلمة محفوظة</button><br><br>` : ''}
        ${taskCtx ? `<button class="btn" data-act="go" data-v="day" data-d="${taskCtx.d}">↩ مهام اليوم</button>` : '<button class="btn" data-act="tab" data-t="words">قسم الكلمات</button>'}</div></div>`;
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
      ['studioLast', '', '🎤', 'استوديو النطق', 'سجّل صوتك، قارنه بالنطق الصحيح، واحصل على تصحيح كلمة بكلمة'],
      ['quiz', 'listen', '🎧', 'اختبار الاستماع', 'تسمع كلمة إنجليزية وتختار معناها بالعربية'],
      ['quiz', 'meaning', '🔤', 'اختبار المعنى', 'كلمة إنجليزية ← اختر الترجمة الصحيحة (والعكس)'],
      ['dictation', '', '✍️', 'الإملاء', 'تسمع جملة وتكتبها: أفضل تمرين للأذن والكتابة'],
      ['builder', '', '🧩', 'رتّب الجملة', 'رتّب الكلمات لتكوين الجملة الصحيحة'],
      ['speak', '', '🗣️', 'النطق السريع', 'جملة عشوائية: استمع وردّد واحصل على تقييم'],
      ['translate', '', '🌐', 'الترجمة', 'ترجم أي كلمة أو نص واستمع إليه']
    ];
    return `${topbar('تمارين', 'تمرّن كل يوم', { back: false })}
    <div class="page">
      ${items.map(([v, mode, em, t, d]) => `<button class="book" ${v === 'studioLast' ? 'data-act="studioLast"' : `data-act="go" data-v="${v}" data-mode="${mode}"`}>
        <div class="cover" style="background:var(--primary-soft);width:56px;height:56px">${em}</div>
        <div class="grow"><h3>${t}</h3><div class="small muted">${d}</div></div></button>`).join('')}
      <div class="section-title">مستوى جمل التمارين</div>
      <div class="chips">${[['A1', 'A1'], ['A2', 'A2'], ['B1', 'B1'], ['B2', 'B2'], ['all', 'الكل']].map(([k, l]) =>
        `<button class="chip ${settings.pLevel === k ? 'on' : ''}" data-act="pLevel" data-l="${k}">${l}</button>`).join('')}</div>
    </div>`;
  };
  function practiceSentences(maxWords, bookId) {
    const out = [];
    const books = bookId && getBookSync(bookId) ? [getBookSync(bookId)] : Object.values(BUILTIN).filter((b) => settings.pLevel === 'all' || b.level === settings.pLevel);
    books.forEach((b) => b.chapters.forEach((c) => flatten(c).forEach((s) => {
      const n = normWords(s.en).length;
      if (n >= 3 && (!maxWords || n <= maxWords)) out.push(s);
    })));
    return out.length ? out : flatten(BUILTIN.omar.chapters[0]);
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
  Views.dictation = function (p) {
    const key = p.id || '';
    if (!dict || dict.key !== key) {
      const pool = shuffle(practiceSentences(16, p.id));
      dict = { key, pool, k: 0, s: pool[0], result: null, n: 0, ok: 0 };
    }
    const s = dict.s;
    return `${topbar('الإملاء', p.id ? `من نص اليوم · ${dict.n}/10` : 'اسمع الجملة واكتبها')}
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
  Views.dictation.after = function () {
    if (!dict || dict.result) return;
    const st = dict, s0 = st.s;
    setTimeout(() => { if (dict === st && st.s === s0 && !st.result && current().name === 'dictation') say(s0.en); }, 300);
  };

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

  // ---- Quick speaking
  let spk = null;
  Views.speak = function () {
    if (!spk) spk = { s: pick(practiceSentences(12)), best: null };
    const s = spk.s;
    return `${topbar('النطق السريع', 'تقنية الـ Shadowing: استمع ثم ردّد')}
    <div class="page">
      <div class="card"><div class="en" style="font-size:22px;line-height:1.6">${esc(s.en)}</div><div class="muted" style="margin-top:6px">${esc(s.ar || '')}</div></div>
      ${speedChips(settings.rate, 'setRate')}
      <div class="row" style="gap:10px;margin-top:16px">
        <button class="btn secondary grow" data-act="say" data-text="${esc(s.en)}">${I.speaker} 1. استمع</button>
        <button class="btn grow" data-act="speakNow">${I.mic} 2. ردّد</button>
      </div>
      ${spk.best != null ? `<p class="center">أفضل نتيجة: <b>${spk.best}%</b></p>` : ''}
      <button class="btn ghost block" style="margin-top:12px" data-act="speakNext">جملة أخرى ←</button>
      <div class="card small muted" style="margin-top:16px">💡 للتدريب الكامل مع تسجيل صوتك والمقارنة، استعمل <b>استوديو النطق</b> 🎤 من أي نص.</div>
    </div>`;
  };

  // ---- Translate tool
  let trState = { dir: 'en-ar', text: '', out: '' };
  Views.translate = function () {
    const en = trState.dir === 'en-ar';
    return `${topbar('ترجمة', 'ترجم أي كلمة أو جملة واستمع إليها')}
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
        ${short ? `<button class="btn accent" data-act="trSave">⭐ احفظ</button>` : `<button class="btn secondary" data-act="trLesson">📖 اجعله درسًا في كتبي</button>`}
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
        <div class="setting"><div class="grow"><b>هدف الدراسة اليومي</b><div class="small muted">البرنامج مصمّم لساعتين يوميًا</div></div>
          <div class="chips">${[30, 60, 90, 120].map((g) => `<button class="chip ${settings.timeGoal === g ? 'on' : ''}" data-act="tgoal" data-g="${g}">${g >= 60 ? g / 60 + ' س' : g + ' د'}</button>`).join('')}</div></div>
        <div class="setting"><div class="grow"><b>إظهار الترجمة العربية</b><div class="small muted">عند الإخفاء: اضغط على الجملة لكشفها</div></div>${sw(settings.showAr, 'tShowAr')}</div>
        <div class="setting"><div class="grow"><b>حجم الخط الإنجليزي</b></div>
          <div class="chips">${[[17, 'صغير'], [20, 'متوسط'], [24, 'كبير']].map(([s, l]) => `<button class="chip ${settings.fontSize === s ? 'on' : ''}" data-act="font" data-s="${s}">${l}</button>`).join('')}</div></div>
        <div class="setting"><div class="grow"><b>المظهر</b></div>
          <div class="chips">${[['auto', 'تلقائي'], ['light', 'فاتح'], ['dark', 'داكن']].map(([s, l]) => `<button class="chip ${settings.theme === s ? 'on' : ''}" data-act="themeSet" data-s="${s}">${l}</button>`).join('')}</div></div>
      </div>
      <div class="card">
        <div class="setting"><div class="grow"><b>إعادة البرنامج من البداية</b><div class="small muted">يحذف تقدّم برنامج 30 يومًا فقط</div></div><button class="btn ghost" data-act="resetProg">إعادة</button></div>
        <div class="setting"><div class="grow"><b>إعادة ضبط كل التقدّم</b><div class="small muted">يحذف الكلمات المحفوظة والتقدّم (لا يحذف كتبك)</div></div><button class="btn danger" data-act="reset">حذف</button></div>
      </div>
      <p class="center small muted">إنجليزي بالعربي · الإصدار 3.0</p>
    </div>`;
  };

  // ---- Method
  Views.method = function () {
    return `${topbar('طريقة التعلّم', 'كيف تستفيد من التطبيق إلى أقصى حد')}
    <div class="page">
      <div class="card"><b>الفكرة الأساسية</b><p>تتعلّم اللغة عندما تفهم رسائل فيها: أن تسمع وتقرأ نصوصًا تفهم معظمها (حوالي 90%) مع بعض الكلمات الجديدة، ثم تردّدها بصوتك حتى تصبح جزءًا منك. لهذا يجمع التطبيق بين <b>الصوت + النص + الترجمة العربية + الترديد والتصحيح</b>.</p></div>
      <div class="card"><b>📅 برنامج 30 يومًا · ساعتان يوميًا</b>
        <ol class="method">${TASKS.map((t) => `<li><b>${t.em} ${t.t} (${t.min} د):</b> ${t.d}</li>`).join('')}</ol>
        <div class="small muted">كل يوم نص جديد بمستوى أعلى قليلًا (من A1 إلى B2)، مع مراجعة نص الأمس.</div></div>
      <div class="card"><b>🔤 إذا كنت مبتدئًا تمامًا</b>
        <ol class="method">
          <li>ابدأ بقسم <b>الأساسيات</b>: الحروف الإنجليزية (اسم كل حرف وصوته) ولعبة التهجئة.</li>
          <li>تدرّب على الأصوات غير الموجودة في العربية: P و V والحروف المتحرّكة القصيرة (ship/sheep، bed/bad، cup/cap).</li>
          <li>تعلّم درسًا واحدًا من القواعد الأساسية كل يومين، وانطق أمثلته بصوت عالٍ.</li>
        </ol></div>
      <div class="card"><b>🎤 استوديو النطق</b>
        <ol class="method">
          <li>استمع للجملة 3 مرات (ببطء ثم بالسرعة العادية).</li>
          <li>سجّل صوتك وأنت تردّدها.</li>
          <li>اضغط "قارن": تسمع النطق الصحيح ثم صوتك مباشرة، فتلاحظ الفرق بنفسك.</li>
          <li>اضغط "صحّح نطقي": يعرض التطبيق الكلمات الصحيحة بالأخضر والتي تحتاج تدريبًا بالأحمر.</li>
        </ol></div>
      <div class="card"><b>✅ نصائح مهمة</b>
        <ul class="method">
          <li>الانتظام أهمّ من المدّة: كل يوم أفضل من يوم طويل في الأسبوع. قسّم الساعتين على الصباح والمساء.</li>
          <li>أعد الاستماع لنفس النص عدة أيام: التكرار يحوّل الفهم إلى طلاقة.</li>
          <li>بعد البرنامج: اقرأ روايات كلاسيكية حقيقية من "كتبي" فصلًا كل يوم.</li>
          <li>أضف نصوصك الخاصة (مجالك المهني، أغانيك المفضّلة، الأخبار).</li>
          <li>لا تخف من الأخطاء في النطق، المهم أن تتكلّم.</li>
        </ul></div>
      <button class="btn block" data-act="tab" data-t="program">ابدأ البرنامج 📅</button>
    </div>`;
  };

  // ---------------------------------------------------------------- actions
  const A = {
    tab: (el) => goTab(el.dataset.t),
    back: () => back(),
    go: (el) => {
      const d = Object.assign({}, el.dataset); delete d.act; const v = d.v; delete d.v;
      if (v === 'flash') fc = null;
      if (v === 'dictation') dict = null;
      if (v === 'builder') bld = null;
      if (v === 'speak') spk = null;
      if (v === 'alphaquiz') aq = null;
      if (v === 'spelling') sp = null;
      if (v === 'soundquiz') sq = null;
      if (v === 'soundspeak') ss = null;
      if (v === 'gquiz') gq = null;
      go(v, d);
    },
    openInfo: (el) => {
      const id = el.dataset.id; const info = bookInfo(id);
      if (info && info.kind === 'mine' && info.chapters > 1) go('bookinfo', { id });
      else openBook(id);
    },
    openCh: (el) => openBook(el.dataset.id, { ch: +el.dataset.ch }),
    chGo: (el) => { if (!R) return; const ch = +el.dataset.ch; if (ch < 0 || ch >= R.book.chapters.length) return; replaceTop({ id: R.book.id, ch }); },
    closeSheet: () => closeSheet(),
    say: (el) => say(el.dataset.text, el.dataset.r ? +el.dataset.r : undefined),
    sayAr: (el) => sayAr(el.dataset.text || ''),
    sayMissing: async (el) => {
      const words = el.dataset.w.split('|');
      for (const w of words) { const r = await say(w, 0.5); if (r === 'stopped') return; await sleep(500); }
    },
    installVoices: () => { if (Native) Native.installVoices(); },
    star: (el) => { const on = toggleSave(el.dataset.en, el.dataset.ar, el.dataset.ex); el.classList.toggle('on', on); },
    lib: (el) => { libFilter = el.dataset.f; render(); },
    wTab: (el) => { wordsTab = el.dataset.t; render(); },
    studioLast: () => {
      const id = stats.lastBook && bookInfo(stats.lastBook) ? stats.lastBook : PROGRAM[currentDay() - 1].id;
      const ch = (progress[id] && progress[id].ch) || 0;
      loadBook(id).then(() => go('studio', { id, ch })).catch(() => go('studio', { id: PROGRAM[0].id }));
    },

    // program
    tick: (el) => {
      const d = +el.dataset.d, k = el.dataset.k; const s = dayState(d);
      if (s.tasks[k]) { delete s.tasks[k]; s.done = false; store.set('program', prog); } else completeTask(d, k, true);
      render();
    },
    startTask: (el) => {
      const d = +el.dataset.d, k = el.dataset.k; const day = PROGRAM[d - 1];
      const prevId = d > 1 ? PROGRAM[d - 2].id : 'phrases';
      const ctx = { d, k, id: day.id };
      if (k === 'listen1') { go('reader', { id: day.id, ch: 0, step: '1' }); }
      else if (k === 'read') { go('reader', { id: day.id, ch: 0, step: '2' }); }
      else if (k === 'listen2') { go('reader', { id: day.id, ch: 0, step: '4' }); }
      else if (k === 'review') { ctx.id = prevId; go('reader', { id: prevId, ch: 0, step: '4' }); }
      else if (k === 'shadow') { go('studio', { id: day.id, ch: 0 }); }
      else if (k === 'words') { fc = null; go('flash', { src: 'theme', id: day.theme }); }
      else if (k === 'dict') { dict = null; go('dictation', { id: day.id }); }
      else if (k === 'free') {
        leaveView(); stack = [{ name: 'mybooks', params: {} }]; ctx.id = null; render(true);
        toast('📚 اختر كتابًا واقرأ فصلًا واحدًا مع الصوت');
      }
      taskCtx = ctx;
    },

    // reader
    word: (el) => {
      let ctx = null;
      const s = el.closest('.sent');
      if (s && R) ctx = R.sents[+s.dataset.i];
      else if (ST && el.closest('#stS')) ctx = ST.sents[ST.i];
      wordSheet(el.dataset.w, ctx);
    },
    playS: (el) => { const i = +el.dataset.i; const wasPlaying = R.playing; pauseReader(); if (wasPlaying && i === R.idx) return; setActive(i); playReader(i); },
    sayS: (el) => { pauseReader(); speakSentence(+el.dataset.i, +el.dataset.r); },
    shadowS: (el) => { pauseReader(); pronounceSheet(R.sents[+el.dataset.i].en); },
    reveal: (el) => { const i = +el.dataset.i; if (el.classList.contains('masked')) { R.revealed[i] = true; el.classList.remove('masked'); } else if (R.sents[i].ar) sayAr(R.sents[i].ar); },
    trSent: (el) => {
      const i = +el.dataset.i; el.textContent = '... جارٍ الترجمة';
      translate(R.sents[i].en).then((t) => { if (!R) return; R.sents[i].ref[1] = t; R.sents[i].ar = t; persistBook(R.book); refreshSentence(i); })
        .catch(() => { el.textContent = '⚠️ تعذّرت الترجمة، أعد المحاولة'; });
    },
    trAll: async (el) => {
      el.disabled = true;
      const r = R;
      for (let i = 0; i < r.sents.length; i++) {
        if (R !== r) return;
        if (r.sents[i].ar) continue;
        el.textContent = `... ترجمة ${i + 1}/${r.sents.length}`;
        try { const t = await translate(r.sents[i].en); r.sents[i].ref[1] = t; r.sents[i].ar = t; persistBook(r.book); if (R === r) refreshSentence(i); }
        catch (e) { toast('تعذّرت الترجمة. تحقّق من الإنترنت.'); el.disabled = false; el.textContent = '🌐 أعد المحاولة'; return; }
      }
      if (R === r) el.remove();
    },
    pPlay: () => { if (R.playing) pauseReader(); else playReader(R.idx); },
    pNext: () => { const p = R.playing; pauseReader(); const i = Math.min(R.sents.length - 1, R.idx + 1); setActive(i); if (p) playReader(i); },
    pPrev: () => { const p = R.playing; pauseReader(); const i = Math.max(0, R.idx - 1); setActive(i); if (p) playReader(i); },
    pRepeat: () => { R.repeat = !R.repeat; toast(R.repeat ? '🔁 تكرار الجملة الحالية' : 'إيقاف التكرار'); renderPlayer(); },
    pShadow: () => { R.shadow = !R.shadow; toast(R.shadow ? '🗣️ وقفة بعد كل جملة لتردّدها' : 'إيقاف الوقفة'); renderPlayer(); },
    pAr: () => { R.hideAr = !R.hideAr; R.revealed = {}; $$('.ar-line[data-i]').forEach((e) => e.classList.toggle('masked', R.hideAr)); renderPlayer(); },
    pRate: (el) => { setRate(+el.dataset.r); renderPlayer(); if (R.playing) playReader(R.idx); },
    togglePlan: () => { settings.planOpen = !settings.planOpen; saveSettings(); const pl = $('.plan'); if (pl) pl.outerHTML = planHtml(); },
    step: (el) => applyStep(el.dataset.s),
    finishBook: () => { pauseReader(); finishBook(); },
    delBook: async (el) => {
      if (!confirm('حذف هذا الكتاب من مكتبتك؟')) return;
      await deleteMyBook(el.dataset.id);
      leaveView(); stack = [{ name: 'mybooks', params: {} }]; render(true);
    },
    saveText: async () => {
      const title = $('#atTitle').value.trim() || 'My text';
      const text = $('#atText').value.trim();
      if (normWords(text).length < 2) { toast('الصق نصًّا إنجليزيًا أولًا'); return; }
      const chapters = textToChapters(text, title);
      const meta = { id: 'm' + Date.now(), title, titleAr: 'نصّي الخاص', emoji: '📝', color: pick(COLORS), level: 'mine', source: 'paste', added: Date.now() };
      await saveMyBook(meta, chapters);
      leaveView(); stack = [{ name: 'mybooks', params: {} }];
      openBook(meta.id);
    },
    importFile: () => { const i = $('#fileIn'); if (i) i.click(); },
    dlClassic: async (el) => {
      const gid = +el.dataset.gid; const c = window.CLASSICS.find((x) => x.gid === gid);
      el.disabled = true; el.textContent = '... جارٍ التنزيل';
      try {
        const raw = await downloadText(gutenbergUrls(gid), 'pg' + gid);
        el.textContent = '... جارٍ التحضير';
        await sleep(30);
        const chapters = textToChapters(cleanGutenberg(raw), c.title);
        if (countSents(chapters) < 10) throw new Error('empty');
        const meta = { id: 'g' + gid, gid, title: c.title, titleAr: c.titleAr, author: c.author, emoji: c.emoji, color: COLORS[gid % COLORS.length], level: c.level, source: 'gutenberg', added: Date.now() };
        await saveMyBook(meta, chapters);
        toast(`✅ تمّ التنزيل: ${chapters.length} فصلًا`);
        if (current().name === 'classics') go('bookinfo', { id: meta.id });
      } catch (e) {
        el.disabled = false; el.textContent = '⬇️ أعد المحاولة';
        toast('تعذّر التنزيل. تحقّق من الإنترنت أو أعد المحاولة لاحقًا (قد يكون الموقع تحت الصيانة).');
      }
    },

    // studio
    stListen: async (el) => {
      if (Rec.active) return;
      await Speech.speak(ST.sents[ST.i].en, { rate: el.dataset.r ? +el.dataset.r : undefined, onRange: (s, e) => hlRange('#stS', s, e) });
      clearWordHl();
    },
    stLoop: async () => {
      if (Rec.active) return;
      const st = ST; const token = (st.loop = (st.loop || 0) + 1);
      for (let k = 0; k < 3; k++) {
        if (ST !== st || st.loop !== token) return;
        const r = await Speech.speak(st.sents[st.i].en, { rate: k === 0 ? Math.min(settings.rate, 0.7) : settings.rate, onRange: (s, e) => hlRange('#stS', s, e) });
        clearWordHl();
        if (r === 'stopped') return;
        await sleep(900);
      }
    },
    stReveal: (el) => { if (el.classList.contains('masked')) { el.classList.remove('masked'); ST.reveal = true; } else sayAr(ST.sents[ST.i].ar); },
    stTr: (el) => {
      el.textContent = '... جارٍ الترجمة'; const st = ST; const i = st.i;
      translate(st.sents[i].en).then((t) => { st.sents[i].ref[1] = t; st.sents[i].ar = t; persistBook(st.book); if (ST === st) render(); })
        .catch(() => { el.textContent = '⚠️ تعذّرت الترجمة'; });
    },
    recToggle: async () => {
      if (!ST) return;
      if (!ST.recording) {
        const ok = await Rec.start();
        if (!ok || !ST) return;
        ST.recording = true; render();
      } else {
        const st = ST; const i = st.i;
        const url = await Rec.stop();
        st.recording = false;
        if (url) { if (st.recs[i]) URL.revokeObjectURL(st.recs[i]); st.recs[i] = url; addPoints(1); }
        if (ST === st) { render(); if (url) A.recCompare(); }
      }
    },
    recPlay: () => { const u = ST && ST.recs[ST.i]; if (u) Rec.play(u); },
    recCompare: async () => {
      const st = ST; const u = st && st.recs[st.i]; if (!u) return;
      toast('🔊 النطق الصحيح... ثم 🎙️ صوتك');
      const r = await Speech.speak(st.sents[st.i].en, { onRange: (s, e) => hlRange('#stS', s, e) });
      clearWordHl();
      if (r === 'stopped' || ST !== st) return;
      await sleep(400);
      Rec.play(u);
    },
    stCheck: async () => {
      if (Rec.active) await A.recToggle();
      const st = ST; const i = st.i;
      const r = await checkPronunciation(st.sents[i].en);
      if (!r) { toast('لم أسمع شيئًا. حاول مرة أخرى.'); return; }
      if (ST !== st) return;
      r.i = i; st.res = r; stSaveScore(r.pct); render();
      const el = $('.diff'); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    },
    stMove: async (el) => {
      const d = +el.dataset.d;
      if (Rec.active) { await Rec.stop(); if (ST) ST.recording = false; }
      Speech.stop(); Rec.stopPlayback();
      if (!ST) return;
      if (d > 0 && ST.i >= ST.sents.length - 1) {
        ctxDone('shadow');
        const sc = (studioState[ST.key] && studioState[ST.key].s) || {}; const vals = Object.values(sc);
        sheet(`<div class="center"><div style="font-size:50px">🏁</div><h3>أنهيت كل الجمل!</h3>
          <p>${vals.length ? `معدّل نطقك: <b>${Math.round(vals.reduce((a, x) => a + x, 0) / vals.length)}%</b> على ${vals.length} جملة.` : ''}</p>
          <p class="muted">أعد الجمل التي حصلت فيها على أقلّ من 70% (النقاط الصفراء).</p>
          <div class="actions"><button class="btn secondary" data-act="stRestart">↺ من البداية</button>
          ${taskCtx ? `<button class="btn" data-act="go" data-v="day" data-d="${taskCtx.d}">↩ مهام اليوم</button>` : '<button class="btn" data-act="back">رجوع</button>'}</div></div>`);
        return;
      }
      ST.i = Math.max(0, Math.min(ST.sents.length - 1, ST.i + d)); ST.res = null; ST.recording = false; ST.reveal = settings.showAr;
      const st = studioState[ST.key] || (studioState[ST.key] = { s: {} }); st.i = ST.i; store.set('studio', studioState);
      render(); say(ST.sents[ST.i].en);
    },
    stRestart: () => { closeSheet(); ST.i = 0; ST.res = null; render(); },

    // basics
    letter: (el) => letterSheet(+el.dataset.i),
    sayLetter: (el) => sayLetter(el.dataset.l, el.dataset.r ? +el.dataset.r : undefined),
    pronounce: (el) => { closeSheet(); pronounceSheet(el.dataset.text); },
    abcPlay: async () => {
      const token = ++abcToken;
      for (let i = 0; i < ALPHA.length; i++) {
        if (token !== abcToken || current().name !== 'alphabet') return;
        $$('.lt.on').forEach((e) => e.classList.remove('on'));
        const t = $('#lt' + i); if (t) { t.classList.add('on'); t.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
        const r = await Speech.speak(letterText(ALPHA[i].L), { rate: settings.rate });
        if (r === 'stopped') { $$('.lt.on').forEach((e) => e.classList.remove('on')); return; }
        await sleep(250);
      }
      $$('.lt.on').forEach((e) => e.classList.remove('on'));
    },
    spellIt: () => {
      const v = ($('#spellIn').value || '').trim(); if (!v) return;
      const letters = v.toUpperCase().replace(/[^A-Z ]/g, '');
      $('#spellOut').textContent = letters.split(' ').map((w) => w.split('').join('-')).join('   ');
      Speech.speak(spellText(letters), { rate: Math.min(settings.rate, 0.8) });
    },
    aqAnswer: (el) => { const q = aq.qs[aq.i]; aq.ans = el.dataset.l; if (aq.ans === q.L) { aq.score++; addPoints(1); } render(); sayLetter(q.L); },
    aqNext: () => {
      aq.i++; aq.ans = null;
      if (aq.i >= aq.qs.length) { basicsProg.alpha = Math.max(basicsProg.alpha || 0, Math.round(aq.score / aq.qs.length * 100)); saveBasics(); }
      render();
    },
    aqAgain: () => { aq = null; render(); },
    spellPlay: () => Speech.speak(spellText(sp.w[0]), { rate: Math.min(settings.rate, 0.8) }),
    spCheck: () => {
      const input = ($('#spIn').value || '').trim(); if (!input) { toast('اكتب الكلمة أولًا'); return; }
      const ok = input.toLowerCase() === sp.w[0].toLowerCase();
      sp.res = { ok, input }; sp.n++; if (ok) { sp.ok++; addPoints(2); }
      basicsProg.spell = Math.round(sp.ok / sp.n * 100); saveBasics();
      render(); say(sp.w[0]);
    },
    spNext: () => { sp.k = (sp.k + 1) % sp.pool.length; sp.w = sp.pool[sp.k]; sp.res = null; render(); },
    sayPair: async (el) => {
      const r1 = await say(el.dataset.a, Math.min(settings.rate, 0.8)); if (r1 === 'stopped') return;
      await sleep(450); say(el.dataset.b, Math.min(settings.rate, 0.8));
    },
    sqAnswer: (el) => {
      const q = sq.qs[sq.i]; const s = SOUNDS.find((x) => x.id === sq.id);
      const correct = s.kind === 'pairs' ? q.word : q.label;
      sq.ans = el.dataset.w; if (sq.ans === correct) { sq.score++; addPoints(1); }
      render();
    },
    sqNext: () => {
      sq.i++; sq.ans = null;
      if (sq.i >= sq.qs.length) bestOf(basicsProg.sounds, sq.id, Math.round(sq.score / sq.qs.length * 100));
      render();
    },
    sqAgain: () => { const id = sq.id; sq = null; replaceTop({ id }); },
    ssCheck: async () => {
      const st = ss; const it = st.items[st.k];
      Speech.stop();
      const alts = await listenSpeech();
      if (!alts) { toast('لم أسمع شيئًا. حاول مرة أخرى.'); return; }
      if (ss !== st) return;
      const heard = alts.map((a) => normWords(a));
      const target = normWords(it.w).join(' ');
      const ok = heard.some((ws) => ws.join(' ') === target || ws.includes(target));
      const said = alts[0];
      let msg;
      if (ok) msg = `✅ ممتاز! سمعتُ: <b class="en">${esc(said)}</b>`;
      else if (it.other && heard.some((ws) => ws.includes(normWords(it.other).join(' ')))) msg = `❌ سمعتُ <b class="en">${esc(it.other)}</b> بدل <b class="en">${esc(it.w)}</b>. استمع ببطء وأعد المحاولة.`;
      else msg = `❌ سمعتُ: <b class="en">${esc(said)}</b>. استمع ببطء وأعد المحاولة.`;
      st.res = { ok, msg }; st.n++; if (ok) { st.ok++; addPoints(2); }
      bestOf(basicsProg.speak, st.id, Math.round(st.ok / st.n * 100));
      render();
    },
    ssNext: () => { ss.k = (ss.k + 1) % ss.items.length; ss.res = null; render(); say(ss.items[ss.k].w); },
    gqAnswer: (el) => {
      const k = +el.dataset.k; const q = gq.qs[gq.i];
      gq.ans = k; if (k === q[2]) { gq.score++; addPoints(2); }
      render(); say(fillBlank(q[0], q[1][q[2]]));
    },
    gqNext: () => {
      gq.i++; gq.ans = null;
      if (gq.i >= gq.qs.length) bestOf(basicsProg.grammar, gq.id, Math.round(gq.score / gq.qs.length * 100));
      render();
    },
    gqAgain: () => { const id = gq.id; gq = null; replaceTop({ id }); },

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
      if (g === 0) fc.q.push(w);
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
      if (dict.key && dict.n >= 10) ctxDone('dict');
      render();
    },
    dictHint: () => { const w = dict.s.en.split(/\s+/); toast('أول كلمات: ' + w.slice(0, Math.ceil(w.length / 3)).join(' ') + ' ...'); },
    dictNext: () => {
      dict.k = (dict.k + 1) % dict.pool.length;
      if (dict.k === 0) dict.pool = shuffle(dict.pool);
      dict.s = dict.pool[dict.k]; dict.result = null; render();
    },

    // builder
    bIn: (el) => { const t = bld.pool.splice(+el.dataset.k, 1)[0]; bld.ans.push(t); say(t.w.replace(/[^A-Za-z0-9' -]/g, ''), 1); render(); },
    bOut: (el) => { if (bld.checked != null) return; const t = bld.ans.splice(+el.dataset.k, 1)[0]; bld.pool.push(t); render(); },
    bCheck: () => {
      bld.checked = bld.ans.map((t) => t.w).join(' ') === bld.words.join(' ');
      if (bld.checked) addPoints(3);
      render(); say(bld.s.en);
    },
    bNext: () => { bld = null; render(); },

    // quick speaking
    speakNow: async () => {
      const r = await checkPronunciation(spk.s.en);
      if (!r) { toast('لم أسمع شيئًا. حاول مرة أخرى.'); return; }
      spk.best = Math.max(spk.best || 0, r.pct);
      render();
      sheet(resultHtml(r) + `<div class="actions"><button class="btn secondary" data-act="say" data-text="${esc(spk.s.en)}" data-r="0.7">🐢 استمع</button><button class="btn" data-act="closeSheet">حسنًا</button></div>`);
    },
    speakNext: () => { spk = null; render(); },

    // translate
    trSwap: () => { trState = { dir: trState.dir === 'en-ar' ? 'ar-en' : 'en-ar', text: trState.out || '', out: trState.text || '' }; render(); },
    trGo: (el) => {
      const text = $('#trIn').value.trim(); if (!text) return;
      trState.text = text; el.disabled = true; el.textContent = '... جارٍ الترجمة';
      const dir = trState.dir;
      const local = dir === 'en-ar' && normWords(text).length <= 2 ? lookup(text) : null;
      (local ? Promise.resolve(local.ar) : translate(text, dir))
        .then((out) => { trState.out = out; addPoints(1); })
        .catch(() => toast('تعذّرت الترجمة. تحقّق من الاتصال بالإنترنت (مطلوب أول مرة فقط).'))
        .finally(() => { if (current().name === 'translate') render(); });
    },
    trListen: () => { const t = $('#trIn').value.trim(); if (t) say(t); },
    sayArOut: () => sayAr(trState.out),
    trSave: () => { const en = trState.dir === 'en-ar' ? trState.text : trState.out; const ar = trState.dir === 'en-ar' ? trState.out : trState.text; saveWord(en, ar, ''); toast('⭐ أُضيفت إلى كلماتي'); },
    trLesson: async () => {
      const en = trState.dir === 'en-ar' ? trState.text : trState.out;
      const ar = trState.dir === 'en-ar' ? trState.out : trState.text;
      const sents = splitSentences(en);
      const chapters = [{ t: en.slice(0, 40), paragraphs: [sents.length === 1 ? [[sents[0], ar]] : sents.map((s) => [s, ''])] }];
      const meta = { id: 'm' + Date.now(), title: en.slice(0, 40) + (en.length > 40 ? '…' : ''), titleAr: 'من الترجمة', emoji: '🌐', color: '#1F78B4', level: 'mine', source: 'translate', added: Date.now() };
      await saveMyBook(meta, chapters);
      leaveView(); stack = [{ name: 'mybooks', params: {} }]; openBook(meta.id);
    },

    // settings
    accent: (el) => { settings.accent = el.dataset.a; settings.voice = ''; saveSettings(); if (Native) Native.setVoice(''); render(); say('Hello, how are you today?'); },
    tShowAr: () => { settings.showAr = !settings.showAr; saveSettings(); render(); },
    font: (el) => { settings.fontSize = +el.dataset.s; saveSettings(); applyTheme(); render(); },
    themeSet: (el) => { settings.theme = el.dataset.s; saveSettings(); applyTheme(); render(); },
    tgoal: (el) => { settings.timeGoal = +el.dataset.g; saveSettings(); render(); },
    resetProg: () => { if (!confirm('إعادة برنامج 30 يومًا من البداية؟')) return; prog = { days: {} }; store.set('program', prog); toast('تمّ'); render(); },
    reset: () => {
      if (!confirm('هل أنت متأكد؟ سيتم حذف كل التقدّم والكلمات المحفوظة.')) return;
      saved = {}; progress = {}; prog = { days: {} }; studioState = {};
      stats = { last: '', streak: 0, total: 0, lastBook: '', tday: '', tsec: 0, hist: {} };
      saveSaved(); saveProgress(); saveStats(); store.set('program', prog); store.set('studio', studioState); toast('تمّ'); render();
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
    if (el.dataset.input === 'chapter' && R) replaceTop({ id: R.book.id, ch: +el.value });
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) lastInteract = Date.now(); });

  // ---------------------------------------------------------------- boot
  // Migrate texts saved by version 1 (stored inline in localStorage) into "My books".
  (function migrate() {
    const old = store.get('custom', []);
    if (!old.length) return;
    old.forEach((b) => {
      const meta = { id: b.id, title: b.title, titleAr: b.titleAr || 'نصّي الخاص', emoji: b.emoji || '📝', color: b.color || COLORS[0], level: 'mine', source: 'paste', added: Date.now() };
      saveMyBook(meta, [{ t: b.title, paragraphs: b.paragraphs }]);
    });
    store.set('custom', []);
  })();

  // Hooks for automated checks (harmless in the app).
  window.__ea = { textToChapters, cleanGutenberg, splitSentences, epubToBook, importFile, gutenbergUrls };

  applyTheme();
  if (Native && settings.voice) setTimeout(() => { try { Native.setVoice(settings.voice); } catch (e) { /* ignore */ } }, 1500);
  render();
})();
