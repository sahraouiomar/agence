/* FitCoach — personal training & nutrition coach (offline, fr / en / ar). */
(function () {
  'use strict';
  const t = (k, v) => I18N.t(k, v);
  const L = (o) => I18N.L(o);
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NATIVE = typeof window.Android !== 'undefined';
  const DAY = 86400000;
  const todayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const round = (x, n = 0) => { const k = 10 ** n; return Math.round(x * k) / k; };
  const EX = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
  const MU = Object.fromEntries(MUSCLES.map((m) => [m.id, m]));
  // free-exercise-db library (876 exercises, public domain): real photos, English instructions
  const LIB_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
  const LIB = (window.LIBRARY || []).map(([id, en, fr, ar, group, second, equip, level, cat, mech, instr, imgs]) => ({
    id: 'lib:' + id, lib: true, name: { fr: fr || en, en, ar: ar || fr || en }, nameEN: en, group, second, equip: [equip], level, category: cat, mechanic: mech,
    steps: instr.map((x) => ({ fr: x, en: x, ar: x })), mistakes: [], tip: null, hold: cat === 'stretching', cardio: cat === 'cardio', frames: null,
    photos: imgs.map((b, i) => (b ? `lib/${id}_${i}.jpg` : `${LIB_URL}${id}/${i}.jpg`)),
  }));
  LIB.forEach((e) => { EX[e.id] = e; });
  const exName = (e) => L(e.name);
  const FOOD = Object.fromEntries(FOODS.map((f) => [f.id, f]));
  FOOD_CATS.packaged = { fr: 'Produits emballés', en: 'Packaged', ar: 'منتجات معلّبة', icon: '📦' };
  // foods learned from barcodes (Open Food Facts) and AI analyses, shared by all accounts on this phone
  function registerFood(f) { if (!FOOD[f.id]) FOODS.push(f); else Object.assign(FOOD[f.id], f); FOOD[f.id] = FOOD[f.id] || f; }
  function rememberFood(f) {
    registerFood(f);
    try { const all = JSON.parse(localStorage.getItem('fc_products') || '{}'); all[f.id] = f; localStorage.setItem('fc_products', JSON.stringify(all)); } catch (e) {}
  }
  try { Object.values(JSON.parse(localStorage.getItem('fc_products') || '{}')).forEach(registerFood); } catch (e) {}

  // ------------------------------------------------------------------ storage & auth
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  let user = null; // account key
  let D = null; // decrypted user data (memory only)
  let DEK = null; // AES-GCM key of this account (non-extractable)
  let saveTimer = 0;

  function blankData() { return { profile: null, workouts: [], food: {}, prefs: { swaps: {} }, health: [], program: null }; }
  const users = () => store.get('fc_users', {});
  const setUsers = (u) => store.set('fc_users', u);
  // encrypted, debounced save
  function saveData(now) {
    if (!user || !DEK) return;
    clearTimeout(saveTimer);
    const u = user, key = DEK;
    const run = async () => { if (u !== user) return; try { localStorage.setItem('fc_u_' + u, await Sec.encryptJSON(key, D)); } catch (e) {} };
    if (now) run(); else saveTimer = setTimeout(run, 200);
  }

  // ---- legacy (v1/v2) password hash, only used once to migrate old accounts
  async function legacyHash(pass, salt) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
    return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  const saltHex = () => [...Sec.rand(16)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const keyOf = (name) => String(name || '').trim().toLowerCase();
  function validName(name) {
    const n = String(name || '').trim();
    if (n.includes('@')) return Sec.EMAIL.test(n);
    return /^[\p{L}\p{N}._-]{3,30}$/u.test(n);
  }

  // brute-force protection: after 5 failures, wait 30 s, doubling up to 15 min
  function guardCheck() {
    const g = store.get('fc_guard', { fails: 0, until: 0 });
    if (g.until > Date.now()) throw t('err_locked', { n: Math.ceil((g.until - Date.now()) / 1000) });
  }
  function guardFail() {
    const g = store.get('fc_guard', { fails: 0, until: 0 });
    g.fails++;
    if (g.fails >= 5) g.until = Date.now() + Math.min(900, 30 * 2 ** (g.fails - 5)) * 1000;
    store.set('fc_guard', g);
  }
  const guardOk = () => store.set('fc_guard', { fails: 0, until: 0 });

  async function wrapWithSecret(rawDek, secret) {
    const salt = saltHex();
    const { verifier, kek } = await Sec.fromSecret(secret, salt);
    return { salt, verifier, wrap: await Sec.seal(kek, rawDek) };
  }

  // open an account once its data key is known
  async function openAccount(k, rawDek, remember = true) {
    DEK = await Sec.aesKey(rawDek);
    const blob = localStorage.getItem('fc_u_' + k);
    let data = null;
    if (blob && blob.startsWith('v2:')) data = await Sec.decryptJSON(DEK, blob);
    else if (blob) { try { data = JSON.parse(blob); } catch (e) { data = null; } } // legacy clear-text data -> encrypted below
    user = k;
    D = Object.assign(blankData(), data || {});
    D.prefs = Object.assign({ swaps: {} }, D.prefs);
    saveData(true);
    if (remember) {
      const b = Sec.b64(rawDek);
      if (NATIVE && Android.wrapKey) { const w = Android.wrapKey(b); if (w) store.set('fc_session', { k, w }); }
      else try { sessionStorage.setItem('fc_s', JSON.stringify({ k, raw: b })); } catch (e) {}
    }
    const u = users()[k];
    if (NATIVE && Android.setSecure) Android.setSecure(!!(u && u.secure));
  }

  async function signup(name, pass) {
    const all = users();
    const k = keyOf(name);
    if (all[k]) throw t('err_exists');
    const dek = Sec.rand(32);
    const code = Sec.recoveryCode();
    const p = await wrapWithSecret(dek, pass);
    const r = await wrapWithSecret(dek, Sec.normCode(code));
    all[k] = { v: 3, kind: 'password', display: name.trim(), email: name.includes('@') ? k : null, created: Date.now(), salt: p.salt, verifier: p.verifier, wrapP: p.wrap, recSalt: r.salt, wrapR: r.wrap };
    setUsers(all);
    await openAccount(k, dek);
    return code;
  }

  async function login(name, pass) {
    guardCheck();
    const all = users();
    const k = keyOf(name);
    const u = all[k];
    if (!u || u.kind === 'google') { guardFail(); throw t('err_login'); }
    if (!u.v) { // migrate an account created by FitCoach 1.x / 2.x
      if (!Sec.same(await legacyHash(pass, u.salt), u.hash)) { guardFail(); throw t('err_login'); }
      guardOk();
      const dek = Sec.rand(32);
      const code = Sec.recoveryCode();
      const p = await wrapWithSecret(dek, pass), r = await wrapWithSecret(dek, Sec.normCode(code));
      all[k] = { v: 3, kind: 'password', display: u.display || name, email: k.includes('@') ? k : null, created: Date.now(), salt: p.salt, verifier: p.verifier, wrapP: p.wrap, recSalt: r.salt, wrapR: r.wrap };
      setUsers(all);
      await openAccount(k, dek);
      return code; // show the new recovery code once
    }
    const { verifier, kek } = await Sec.fromSecret(pass, u.salt);
    if (!Sec.same(verifier, u.verifier)) { guardFail(); throw t('err_login'); }
    guardOk();
    await openAccount(k, await Sec.open(kek, u.wrapP));
    return null;
  }

  async function recoverAccount(name, code, newPass) {
    guardCheck();
    const all = users();
    const k = keyOf(name);
    const u = all[k];
    if (!u || !u.wrapR) { guardFail(); throw t('err_recovery'); }
    let dek;
    try { const { kek } = await Sec.fromSecret(Sec.normCode(code), u.recSalt); dek = await Sec.open(kek, u.wrapR); } catch (e) { guardFail(); throw t('err_recovery'); }
    guardOk();
    const p = await wrapWithSecret(dek, newPass);
    Object.assign(u, { salt: p.salt, verifier: p.verifier, wrapP: p.wrap });
    setUsers(all);
    await openAccount(k, dek);
  }

  async function changePassword(oldPass, newPass) {
    const all = users(), u = all[user];
    const { verifier, kek } = await Sec.fromSecret(oldPass, u.salt);
    if (!Sec.same(verifier, u.verifier)) throw t('err_login');
    const dek = await Sec.open(kek, u.wrapP);
    const p = await wrapWithSecret(dek, newPass);
    Object.assign(u, { salt: p.salt, verifier: p.verifier, wrapP: p.wrap });
    setUsers(all);
  }

  // Google (Gmail) account chosen with Android's account picker; the data key lives in the Keystore.
  const nativeAsk = (fn, ...args) => new Promise((res) => fn(...args, reg({ done: res })));
  async function biometricGate(k) {
    const u = users()[k];
    if (!u || !u.lock || !NATIVE || !Android.biometricAvailable || !Android.biometricAvailable()) return true;
    return nativeAsk((cb) => Android.authenticate(t('unlock_title'), cb));
  }
  async function googleLogin() {
    if (!NATIVE || !Android.chooseGoogleAccount) throw t('needs_app');
    const email = await nativeAsk((cb) => Android.chooseGoogleAccount(cb));
    if (!email) return false;
    const k = 'g:' + keyOf(email);
    const all = users();
    if (all[k]) {
      if (!(await biometricGate(k))) throw t('err_unlock');
      const raw = Android.unwrapKey(all[k].wrapK);
      if (!raw) throw t('err_keystore');
      await openAccount(k, Sec.unb64(raw));
      return true;
    }
    const dek = Sec.rand(32);
    const w = Android.wrapKey(Sec.b64(dek));
    if (!w) throw t('err_keystore');
    all[k] = { v: 3, kind: 'google', display: email.split('@')[0], email: keyOf(email), created: Date.now(), wrapK: w };
    setUsers(all);
    await openAccount(k, dek);
    return true;
  }

  async function resumeSession() {
    let s = store.get('fc_session', null);
    let raw = null;
    if (s && users()[s.k] && NATIVE && Android.unwrapKey) {
      if (!(await biometricGate(s.k))) return false;
      raw = Android.unwrapKey(s.w);
    } else {
      try { s = JSON.parse(sessionStorage.getItem('fc_s') || 'null'); raw = s && s.raw; } catch (e) { s = null; }
    }
    if (!s || !raw || !users()[s.k]) return false;
    try { await openAccount(s.k, Sec.unb64(raw), false); return true; } catch (e) { return false; }
  }

  function logout() {
    saveData(true);
    store.del('fc_session');
    try { sessionStorage.removeItem('fc_s'); } catch (e) {}
    user = null; D = null; DEK = null; W = null;
    if (NATIVE && Android.setSecure) Android.setSecure(false);
  }
  async function deleteAccount(pass) {
    const all = users(), u = all[user];
    if (u.kind === 'password') {
      const { verifier } = await Sec.fromSecret(pass, u.salt);
      if (!Sec.same(verifier, u.verifier)) throw t('err_login');
    }
    const k = user;
    logout();
    delete all[k]; setUsers(all);
    store.del('fc_u_' + k);
  }
  const displayName = () => (users()[user] || {}).display || user;

  // ------------------------------------------------------------------ body calculations
  function body(p = D.profile) {
    if (!p || !p.weight || !p.height || !p.age) return null;
    const male = p.sex !== 'f';
    const h = p.height / 100;
    const bmi = p.weight / (h * h);
    const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (male ? 5 : -161);
    const tdee = bmr * [1.2, 1.375, 1.55, 1.725][p.activity ?? 1];
    const goal = p.goal || 'fit';
    let kcal = tdee;
    if (goal === 'lose') kcal = tdee - Math.min(500, tdee * 0.2);
    if (goal === 'muscle') kcal = tdee + 250;
    if (goal === 'strength') kcal = tdee + 150;
    kcal = Math.max(kcal, male ? 1500 : 1200);
    const protPerKg = { lose: 2.0, muscle: 1.8, strength: 1.8, fit: 1.4 }[goal];
    const refW = bmi > 30 ? 24.9 * h * h : p.weight; // use a healthy reference weight for obese users
    const protein = protPerKg * refW;
    const fat = (kcal * 0.27) / 9;
    const carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
    const ideal = (male ? 50 : 45.5) + 0.91 * (p.height - 152.4);
    const bf = 1.2 * bmi + 0.23 * p.age - 10.8 * (male ? 1 : 0) - 5.4;
    return {
      bmi, bmr, tdee, kcal, protein, fat, carbs, ideal, bf, male,
      bmiCat: bmi < 18.5 ? 'bmi_under' : bmi < 25 ? 'bmi_ok' : bmi < 30 ? 'bmi_over' : 'bmi_obese',
      wMin: 18.5 * h * h, wMax: 24.9 * h * h,
      bfTarget: male ? [10, 20] : [18, 28],
      water: (p.weight * 35) / 1000,
      fiber: Math.max(25, (kcal / 1000) * 14),
      sugarMax: (kcal * 0.1) / 4,
      whtr: p.waist ? p.waist / p.height : null,
    };
  }

  // ------------------------------------------------------------------ smart planner
  const LEVEL = () => (D.profile ? +D.profile.level || 0 : 0);
  function allowedEquip() {
    const place = D.profile?.place || 'home';
    if (place === 'gym') return ['none', 'dumbbell', 'barbell', 'bar', 'bench', 'machine', 'cable', 'kettlebell', 'band', 'ball', 'other'];
    if (place === 'home_db') return ['none', 'dumbbell', 'bench', 'kettlebell', 'band', 'ball'];
    return ['none', 'bench'];
  }
  const canDo = (ex) => ex.equip.some((e) => allowedEquip().includes(e)); // equip lists alternatives

  function avoid(ex) {
    const c = D.profile?.conditions || [];
    if (c.includes('knee') && ['lunge', 'bulgarian', 'jumping_jack'].includes(ex.id)) return true;
    if (c.includes('back') && ['rdl', 'good_morning', 'bench_press'].includes(ex.id)) return true;
    return false;
  }

  function weekTarget(m) {
    const base = [10, 14, 18][LEVEL()];
    if (['traps', 'forearms', 'lowerback'].includes(m)) return Math.round(base * 0.5);
    return ['biceps', 'triceps', 'calves', 'abs'].includes(m) ? Math.round(base * 0.7) : base;
  }

  function muscleState(now = Date.now()) {
    const st = {};
    for (const m of MUSCLES) st[m.id] = { last: 0, sets: 0 };
    for (const w of D.workouts) {
      for (const e of w.ex) {
        const ex = EX[e.id]; if (!ex) continue;
        const n = e.sets.length;
        if (!n) continue;
        const s = st[ex.group];
        s.last = Math.max(s.last, w.time);
        if (now - w.time < 7 * DAY) s.sets += n;
        for (const m2 of ex.second) if (now - w.time < 7 * DAY) st[m2].sets += n * 0.5;
      }
    }
    for (const m of MUSCLES) {
      const s = st[m.id];
      s.hours = s.last ? (now - s.last) / 3600000 : Infinity;
      s.recovery = s.last ? Math.min(1, s.hours / (m.recovery * (LEVEL() === 0 ? 1 : 0.85))) : 1;
      s.target = weekTarget(m.id);
      s.need = Math.max(0, 1 - s.sets / s.target);
    }
    return st;
  }

  function splitFor() {
    const days = +(D.profile?.days || 3);
    return days <= 3 ? 'full' : days === 4 ? 'upperlower' : 'ppl';
  }

  function pickFocus(st) {
    const days = SPLITS[splitFor()];
    let best = null;
    for (const g of days) {
      let score = 0;
      for (const m of g) score += st[m].recovery >= 0.95 ? 0.4 + st[m].need : -1.2 * (1 - st[m].recovery);
      score /= g.length;
      if (!best || score > best.score) best = { muscles: g, score };
    }
    if (best && splitFor() === 'full') best.muscles = best.muscles.filter((m) => st[m].recovery >= 0.9);
    if (!best || best.score < 0 || !best.muscles.length) return null;
    return best.muscles;
  }

  function sessionsThisWeek() {
    const now = new Date(); const day = (now.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day).getTime();
    return new Set(D.workouts.filter((w) => w.time >= monday).map((w) => todayKey(new Date(w.time)))).size;
  }
  const trainedToday = () => D.workouts.some((w) => todayKey(new Date(w.time)) === todayKey());

  function lastDone(exId) {
    for (let i = D.workouts.length - 1; i >= 0; i--) {
      const e = D.workouts[i].ex.find((x) => x.id === exId && x.sets.length);
      if (e) return { time: D.workouts[i].time, sets: e.sets };
    }
    return null;
  }

  function chooseExercises(muscles, exclude = []) {
    const out = [];
    const big = ['chest', 'back', 'quads'];
    for (const m of muscles) {
      const n = big.includes(m) && muscles.length <= 4 ? 2 : 1;
      const pool = EXERCISES.filter((e) => e.group === m && canDo(e) && !avoid(e) && !exclude.includes(e.id) && e.level <= LEVEL() + 1 && !e.cardio)
        .map((e) => {
          const ld = lastDone(e.id);
          const swaps = D.prefs.swaps[e.id] || 0;
          // prefer: right level, not done recently (variety), not repeatedly swapped away (learned dislikes)
          const score = (e.level <= LEVEL() ? 2 : 0) + (ld ? Math.min(3, (Date.now() - ld.time) / (3 * DAY)) : 2.5) - swaps * 1.5 + (e.analyzer ? 0.3 : 0);
          return { e, score };
        })
        .sort((a, b) => b.score - a.score);
      pool.slice(0, n).forEach((p) => out.push(p.e.id));
    }
    return out;
  }

  function prescription(ex) {
    const goal = D.profile?.goal || 'fit';
    const lv = LEVEL();
    if (ex.minutes) return { sets: 1, hold: ex.minutes * 60, min: ex.minutes, rest: 0 };
    if (ex.cardio) return { sets: 3, hold: 40, rest: 30 };
    if (ex.hold) return { sets: lv ? 3 : 2, hold: [20, 35, 50][lv], rest: 45 };
    const P = {
      strength: { sets: 4, reps: [4, 6], rest: 150 },
      muscle: { sets: 3, reps: [8, 12], rest: 90 },
      lose: { sets: 3, reps: [12, 15], rest: 50 },
      fit: { sets: 3, reps: [10, 15], rest: 60 },
    }[goal];
    const sets = Math.max(2, P.sets - (lv === 0 ? 1 : 0) + (lv === 2 ? 1 : 0));
    let reps = P.reps;
    if (ex.id === 'calf_raise') reps = [15, 20];
    if (ex.equip.includes('none') && ex.equip.length === 1 && goal === 'strength') reps = [8, 12];
    return { sets, reps, rest: P.rest };
  }
  const rxText = (rx) => rx.min ? `${rx.min} min · ${t('cardio_zone2')}` : rx.hold ? `${rx.sets} × ${rx.hold}${t('seconds')} · ${t('rest')} ${rx.rest}${t('seconds')}` : `${rx.sets} × ${rx.reps[0]}–${rx.reps[1]} ${t('reps')} · ${t('rest')} ${rx.rest}${t('seconds')}`;

  function plan() {
    const st = muscleState();
    const done = trainedToday();
    const enough = sessionsThisWeek() >= +(D.profile?.days || 3);
    let muscles = done || enough ? null : pickFocus(st);
    // tomorrow: pretend today's focus has been trained now
    const tomorrowState = muscleState(Date.now() + DAY);
    if (muscles) for (const m of muscles) { tomorrowState[m].recovery = 24 / MU[m].recovery; tomorrowState[m].sets += 3; }
    const tomorrow = pickFocus(tomorrowState);
    return { st, muscles, done, enough, tomorrow, ex: muscles ? chooseExercises(muscles) : [] };
  }

  // ------------------------------------------------------------------ nutrition
  const NUTRI_SCORE = { A: 85, B: 68, C: 52, D: 37, E: 20 };
  function grade(f) {
    if (f.nutri && NUTRI_SCORE[f.nutri]) return { score: NUTRI_SCORE[f.nutri], g: f.nutri, off: true };
    let s = 50;
    s += f.kcal < 60 ? 15 : f.kcal < 150 ? 8 : f.kcal < 250 ? 0 : f.kcal < 400 ? -8 : -15;
    s += f.sugar > 22.5 ? -20 : f.sugar > 12 ? -10 : f.sugar > 5 ? -3 : 0;
    if (f.f > 20 && !['nuts', 'fat'].includes(f.cat)) s -= 10;
    if (f.flags.includes('p')) s -= 15;
    if (f.flags.includes('s')) s -= 5;
    s += f.fiber >= 6 ? 15 : f.fiber >= 3 ? 8 : f.fiber >= 1.5 ? 3 : 0;
    s += f.p >= 15 ? 10 : f.p >= 8 ? 5 : 0;
    if (['fruit', 'veg', 'legume'].includes(f.cat)) s += 15;
    if (f.cat === 'nuts' || f.id === 'olive_oil') s += 12;
    if (f.id === 'water') s = 100;
    s = Math.max(0, Math.min(100, s));
    const g = s >= 75 ? 'A' : s >= 60 ? 'B' : s >= 45 ? 'C' : s >= 30 ? 'D' : 'E';
    return { score: s, g };
  }

  function remarks(f, grams) {
    const r = [];
    const c = D.profile?.conditions || [];
    if (f.fiber >= 3 && !f.flags.includes('p')) r.push(['ok', 'r_fiber']);
    if (f.p >= 12) r.push(['ok', 'r_protein']);
    if (['fruit', 'veg'].includes(f.cat)) r.push(['ok', 'r_veg']);
    if (['nuts'].includes(f.cat) || f.id === 'olive_oil' || f.id === 'avocado') r.push(['info', 'r_healthy_fat']);
    if (f.sugar > 15) r.push(['warn', 'r_sugar']);
    if (f.f > 20 && !['nuts', 'fat'].includes(f.cat)) r.push(['warn', 'r_fat']);
    if (f.flags.includes('p')) r.push(['warn', 'r_fried']);
    if (f.kcal > 400 && !['nuts', 'fat'].includes(f.cat)) r.push(['warn', 'r_dense']);
    if (f.flags.includes('s') && !c.includes('hyper')) r.push(['info', 'r_salt']);
    if (c.includes('diabetes') && (f.flags.includes('g') || f.sugar > 12)) r.push(['bad', 'r_diabetes']);
    if (c.includes('hyper') && f.flags.includes('s')) r.push(['bad', 'r_hyper']);
    if (c.includes('chol') && (f.flags.includes('p') || (f.f > 15 && !['nuts', 'fat'].includes(f.cat)) || f.id === 'butter')) r.push(['bad', 'r_chol']);
    const b = body();
    if (b) {
      const left = b.kcal - dayTotals().kcal;
      if ((f.kcal * grams) / 100 > left && left > 0) r.push(['warn', 'r_over_budget']);
      if (D.profile.goal === 'lose' && grade(f).score < 45) r.push(['info', 'r_lose']);
    }
    return r;
  }

  function dayTotals(k = todayKey()) {
    const list = D.food[k] || [];
    const tot = { kcal: 0, p: 0, c: 0, f: 0, fiber: 0, sugar: 0 };
    for (const it of list) {
      const f = FOOD[it.id]; if (!f) continue;
      const q = it.g / 100;
      tot.kcal += f.kcal * q; tot.p += f.p * q; tot.c += f.c * q; tot.f += f.f * q; tot.fiber += f.fiber * q; tot.sugar += f.sugar * q;
    }
    return tot;
  }

  const dayBurn = (k = todayKey()) => D.workouts.filter((w) => todayKey(new Date(w.time)) === k).reduce((n, w) => n + (w.kcal || 0), 0);

  // generic labels must not partially match food names ("food" ⊂ "seafood")
  const GENERIC = new Set(['food', 'dish', 'meal', 'cuisine', 'recipe', 'ingredient', 'tableware', 'plate', 'produce', 'lunch', 'dinner', 'breakfast', 'fast food', 'junk food', 'natural foods', 'staple food', 'baked goods', 'drink', 'beverage']);
  function matchLabels(labels) {
    const scores = {};
    const cats = {};
    for (const lb of labels) {
      const txt = lb.text.toLowerCase();
      for (const f of FOODS) {
        for (const k of f.keys) {
          if (k === txt) scores[f.id] = (scores[f.id] || 0) + lb.conf * 2;
          else if (k.length > 3 && txt.length > 3 && !GENERIC.has(txt) && (txt.includes(k) || k.includes(txt))) scores[f.id] = (scores[f.id] || 0) + lb.conf * 0.8;
        }
      }
      for (const c in LABEL_CATS) if (LABEL_CATS[c].includes(txt)) cats[c] = (cats[c] || 0) + lb.conf;
    }
    const foods = Object.keys(scores).filter((id) => !/^(off|ai)_/.test(id)).sort((a, b) => scores[b] - scores[a]).slice(0, 8);
    return { foods, cats: Object.keys(cats).sort((a, b) => cats[b] - cats[a]) };
  }

  // ------------------------------------------------------------------ native bridge
  const callbacks = {};
  let cbN = 0;
  const reg = (fns) => { const id = 'cb' + ++cbN; callbacks[id] = fns; return id; };
  window.__native = {
    onImage(id, res, err) { const c = callbacks[id]; delete callbacks[id]; c && c.done(res, err); },
    onVideoProgress(id, pct) { const c = callbacks[id]; c && c.progress && c.progress(pct); },
    onVideo(id, res, err) { const c = callbacks[id]; delete callbacks[id]; c && c.done(res, err); },
    onHttp(id, txt, err) { const c = callbacks[id]; delete callbacks[id]; c && c.done(txt, err); },
    onBack() { if (modalOpen()) { closeModal(); return true; } if (stack.length > 1) { goBack(); return true; } return false; },
    onPause() { stopLive(); pausedAt = Date.now(); saveData(true); },
    onResume() { lockIfNeeded(); },
    onAccount(id, email) { const c = callbacks[id]; delete callbacks[id]; c && c.done(email); },
    onWear(o) { try { onWear(o); } catch (e) {} },
    onAuth(id, ok) { const c = callbacks[id]; delete callbacks[id]; c && c.done(!!ok); },
  };
  const speak = (s) => { if (NATIVE && voiceOn) try { Android.speak(s, I18N.lang); } catch (e) {} };
  let voiceOn = store.get('fc_voice', true);
  const openUrl = (u) => (NATIVE ? Android.openUrl(u) : window.open(u, '_blank'));

  // ------------------------------------------------------------------ router
  const app = () => $('#app');
  let stack = [];
  let current = null;
  function go(view, arg, replace) {
    stopLive();
    if (replace) stack.pop();
    stack.push([view, arg]);
    render();
  }
  function goBack() { stopLive(); stack.pop(); if (!stack.length) stack.push(['home']); render(); }
  function tab(view) { stopLive(); stack = [[view]]; render(); }
  function render() {
    const [view, arg] = stack[stack.length - 1];
    current = view;
    document.documentElement.lang = I18N.lang;
    document.documentElement.dir = I18N.lang === 'ar' ? 'rtl' : 'ltr';
    if (!user) { app().innerHTML = viewLogin(); bindLogin(); $('#nav').hidden = true; return; }
    $('#nav').hidden = view === 'mode';
    document.body.dataset.mode = mode();
    Figure.setSex(D.profile?.sex);
    renderNav();
    const V = { home: viewHome, train: viewTrain, exercise: viewExercise, workout: viewWorkout, food: viewFood, coach: viewCoach, me: viewMe, history: viewHistory, science: viewScience, mode: viewMode, program: viewProgram, progEdit: viewProgEdit, health: viewHealth, devices: viewDevices, reports: viewReports };
    app().innerHTML = (V[view] || viewHome)(arg);
    window.scrollTo(0, 0);
    after(view, arg);
  }
  function renderNav() {
    const root = stack[0][0];
    const item = ([v, i, k]) => `<button data-tab="${v}" class="${root === v ? 'on' : ''}"><span class="ni">${i}</span><span class="nl">${t(k)}</span></button>`;
    const fab = (act, ic, label, on) => `<button ${act} class="fab ${on ? 'on' : ''}" aria-label="${label}"><span>${ic}</span></button>`;
    let left, right, mid;
    if (mode() === 'healthy') { left = [['home', '🏠', 't_home'], ['food', '🥗', 't_food']]; mid = fab('data-act="photo" data-src="camera"', '📸', t('scan_food'), false); right = [['health', '🩺', 't_health'], ['me', '👤', 't_me']]; }
    else if (mode() === 'pro') { left = [['home', '🏠', 't_home'], ['train', '🏋️', 't_train']]; mid = fab('data-tab="coach"', '📷', t('t_coach'), root === 'coach'); right = [['food', '🥗', 't_food'], ['health', '🩺', 't_health']]; }
    else { left = [['home', '🏠', 't_home'], ['train', '🏋️', 't_train']]; mid = fab('data-tab="coach"', '📷', t('t_coach'), root === 'coach'); right = [['food', '🥗', 't_food'], ['me', '👤', 't_me']]; }
    $('#nav').innerHTML = left.map(item).join('') + mid + right.map(item).join('');
  }
  const header = (title, back = true) => `<header class="top">${back && stack.length > 1 ? `<button class="icon" data-act="back" aria-label="${t('back')}">${I18N.lang === 'ar' ? '→' : '←'}</button>` : ''}<h1>${esc(title)}</h1></header>`;

  // ------------------------------------------------------------------ views: login
  let loginMode = 'login'; // login | signup | recover
  function langPicker() {
    return `<div class="langs">${['fr', 'en', 'ar'].map((l) => `<button data-lang="${l}" class="${I18N.lang === l ? 'on' : ''}">${{ fr: 'Français', en: 'English', ar: 'العربية' }[l]}</button>`).join('')}</div>`;
  }
  function viewLogin() {
    const m = loginMode;
    const google = NATIVE && Android.chooseGoogleAccount ? `<div class="or"><span>${t('or')}</span></div><button class="btn google full" type="button" data-act="google"><span class="g-logo">G</span> ${t('google_login')}</button><p class="small muted center">${t('google_note')}</p>` : '';
    return `<div class="login">
      ${langPicker()}
      <div class="logo">🏋️‍♂️</div>
      <h1>${t('app')}</h1><p class="muted">${t('tagline')}</p>
      <form id="authForm" class="card" autocomplete="off" novalidate>
        ${m === 'recover' ? `<h2>🔑 ${t('forgot')}</h2><p class="small muted">${t('recover_info')}</p>` : `<div class="seg"><button type="button" data-act="authMode" data-m="login" class="${m === 'login' ? 'on' : ''}">${t('login')}</button><button type="button" data-act="authMode" data-m="signup" class="${m === 'signup' ? 'on' : ''}">${t('signup')}</button></div>`}
        <label>${t('user_or_email')}<input name="u" required autocapitalize="none" autocomplete="username" maxlength="80" inputmode="email"></label>
        ${m === 'recover' ? `<label>${t('recovery_code')}<input name="code" required autocapitalize="characters" placeholder="XXXX-XXXX-XXXX-XXXX"></label>` : ''}
        <label>${t(m === 'recover' ? 'new_password' : 'password')}<input name="p" type="password" required autocomplete="${m === 'login' ? 'current-password' : 'new-password'}"></label>
        ${m !== 'login' ? `<div class="pw-meter"><i id="pwBar"></i></div><p class="small muted" id="pwHint">${t('pw_rules')}</p><label>${t('password2')}<input name="p2" type="password" required autocomplete="new-password"></label>` : ''}
        <p class="err" id="authErr" role="alert"></p>
        <button class="btn primary big full" type="submit">${t(m === 'signup' ? 'signup' : m === 'recover' ? 'reset_pw' : 'login')}</button>
        ${m === 'login' ? `<button class="link center-link" type="button" data-act="authMode" data-m="recover">${t('forgot')}</button>` : ''}
        ${m === 'recover' ? `<button class="link center-link" type="button" data-act="authMode" data-m="login">← ${t('login')}</button>` : ''}
        ${m !== 'recover' ? google : ''}
        <p class="small muted sec-note">🔒 ${t('local_note_v3')}</p>
      </form></div>`;
  }
  function bindLogin() {
    const f = $('#authForm');
    const pw = f.querySelector('[name=p]');
    if (loginMode !== 'login') pw.oninput = () => {
      const st = Sec.strength(pw.value, f.querySelector('[name=u]').value);
      $('#pwBar').style.width = (st.score + 1) * 20 + '%';
      $('#pwBar').className = 's' + st.score;
      $('#pwHint').textContent = st.issues.length ? st.issues.map((i) => t(i)).join(' ') : t('pw_ok');
    };
    f.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      const u = String(fd.get('u') || '').trim(), p = String(fd.get('p') || '');
      const err = $('#authErr');
      const btn = f.querySelector('button[type=submit]');
      btn.disabled = true; err.textContent = '';
      try {
        let code = null;
        if (loginMode === 'login') {
          if (!u || !p) throw t('err_login');
          code = await login(u, p);
        } else {
          if (!validName(u)) throw t(u.includes('@') ? 'err_email' : 'err_user');
          const st = Sec.strength(p, u);
          if (st.issues.length) throw st.issues.map((i) => t(i)).join(' ');
          if (p !== fd.get('p2')) throw t('err_match');
          if (loginMode === 'signup') code = await signup(u, p);
          else await recoverAccount(u, fd.get('code'), p);
        }
        afterLogin(code);
      } catch (x) { err.textContent = typeof x === 'string' ? x : t('err_generic'); btn.disabled = false; }
    };
  }
  function autoSync() { if (user && D.wear && D.wear.hc && Date.now() - (D.wear.lastSync || 0) > 3 * 3600e3) hcSync(30, true); }
  function afterLogin(recoveryCode) {
    setTimeout(autoSync, 1500);
    loginMode = 'login';
    W = D.activeW || null;
    stack = [[!D.prefs.mode ? 'mode' : D.profile ? 'home' : 'me']];
    render();
    if (recoveryCode) showRecoveryCode(recoveryCode);
  }
  function showRecoveryCode(code) {
    openModal(`<div class="sheet-handle"></div><h2>🔑 ${t('recovery_title')}</h2><p>${t('recovery_save')}</p>
      <div class="rec-code" dir="ltr">${esc(code)}</div>
      <div class="row"><button class="btn" data-act="copy" data-v="${esc(code)}">📋 ${t('copy')}</button></div>
      <p class="small muted">${t('recovery_why')}</p>
      <button class="btn primary big full" data-act="closeModal">${t('recovery_done')}</button>`);
  }

  // ---- app lock when coming back after a while (biometric / PIN)
  let pausedAt = 0;
  async function lockIfNeeded() {
    if (!user || !pausedAt || Date.now() - pausedAt < 60000) return;
    const u = users()[user];
    if (!u || !u.lock || !NATIVE || !Android.biometricAvailable || !Android.biometricAvailable()) return;
    $('#lock').hidden = false;
    const ok = await nativeAsk((cb) => Android.authenticate(t('unlock_title'), cb));
    if (ok) $('#lock').hidden = true; else { logout(); $('#lock').hidden = true; stack = [['home']]; render(); }
  }

  // ------------------------------------------------------------------ views: home
  const ago = (h) => (h === Infinity ? t('never') : h < 48 ? t('hours_ago', { n: Math.round(h) }) : t('days_ago', { n: Math.round(h / 24) }));
  function streak() {
    const days = new Set([...D.workouts.map((w) => todayKey(new Date(w.time))), ...Object.keys(D.food).filter((k) => (D.food[k] || []).length)]);
    let n = 0; let d = new Date();
    if (!days.has(todayKey(d))) d = new Date(Date.now() - DAY);
    while (days.has(todayKey(d))) { n++; d = new Date(d.getTime() - DAY); }
    return n;
  }
  function recoveryGrid(st) {
    return `<div class="rec-grid">${MUSCLES.map((m) => {
      const s = st[m.id];
      const pct = Math.round(s.recovery * 100);
      const cls = pct >= 95 ? 'ok' : pct >= 60 ? 'mid' : 'low';
      return `<button class="rec ${cls}" data-act="muscle" data-id="${m.id}">
        <div class="rec-top"><span>${m.icon} ${esc(L(m.name).split(' (')[0])}</span><b>${pct}%</b></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <div class="small muted">${ago(s.hours)} · ${round(s.sets, 1)}/${s.target} ${t('sets_week')}</div></button>`;
    }).join('')}</div>`;
  }
  const recColor = (s) => (s.recovery >= 0.95 ? 'var(--rec-ok)' : s.recovery >= 0.6 ? 'var(--rec-mid)' : 'var(--rec-low)');
  function ring(val, max, label) {
    const pct = Math.min(1, max ? val / max : 0);
    const C = 2 * Math.PI * 42;
    return `<svg class="ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="ring-bg"/><circle cx="50" cy="50" r="42" class="ring-fg ${val > max ? 'over' : ''}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" transform="rotate(-90 50 50)"/><text x="50" y="48" class="ring-n">${Math.round(Math.max(0, max - val))}</text><text x="50" y="64" class="ring-l">${esc(label)}</text></svg>`;
  }
  function viewHome() {
    const b = body();
    const P = plan();
    const tip = ADVICE[Math.floor(Date.now() / DAY) % ADVICE.length];
    const tot = dayTotals();
    let planHtml;
    if (!D.profile) planHtml = `<p>${t('fill_profile')}</p><button class="btn primary" data-tab="me">${t('profile')}</button>`;
    else if (P.muscles) {
      planHtml = `<div class="chips">${P.muscles.map((m) => `<span class="chip">${MU[m].icon} ${esc(L(MU[m].name).split(' (')[0])}</span>`).join('')}</div>
        <ol class="plan-list">${P.ex.map((id) => `<li><button class="link" data-act="ex" data-id="${id}">${esc(L(EX[id].name))}</button> <span class="small muted">${rxText(prescription(EX[id]))}</span></li>`).join('')}</ol>
        <details class="small"><summary>${t('why_today')}</summary><p class="muted">${t('why_text')}</p></details>
        <div class="row"><button class="btn primary big" data-act="startPlan">▶ ${t('start_workout')}</button><button class="btn" data-tab="train">${t('change_focus')}</button></div>`;
    } else planHtml = `<p>${P.done ? '✅ ' + t('done_today') : '🧘 ' + t('rest_day')}</p><button class="btn" data-tab="train">${t('change_focus')}</button>`;
    const tomorrow = P.tomorrow ? P.tomorrow.map((m) => esc(L(MU[m].name).split(' (')[0])).join(I18N.lang === 'ar' ? '، ' : ', ') : t('rest_day');
    const progCard = (() => {
      if (!D.profile || mode() === 'healthy') return '';
      if (!D.program) return `<button class="card linkcard prog-cta" data-act="openProgram">📅 <b>${t('prog_cta')}</b><br><small class="muted">${t('prog_cta_d')}</small></button>`;
      const nx = progNext();
      const ph = Program.PHASES[nx.week.phase - 1];
      return `<section class="card hero"><div class="hero-bg"></div><small>📅 ${t('program')} · ${t('week')} ${nx.week.w}/16 · ${esc(L(ph.name))}${nx.week.deload ? ' · ' + t('deload') : ''}</small>
        ${nx.session ? `<h2>${esc(L(nx.session.name) || nx.session.name)}</h2><ol class="plan-list">${nx.session.items.map((it) => `<li><button class="link" data-act="ex" data-id="${it.id}">${esc(L(EX[it.id].name))}</button> <span class="small muted">${repsTxt(it)}</span></li>`).join('')}</ol>
          ${(nx.session.cardio || []).map((c) => `<p class="small">🏃 ${esc(L(Program.CARDIO[c.kind]))} — ${c.min} min</p>`).join('')}
          <div class="row"><button class="btn primary big" data-act="startProg" data-w="${nx.week.w}" data-key="${nx.session.key}">▶ ${t('start_workout')}</button><button class="btn" data-act="openProgram">${t('see_program')}</button></div>`
        : `<p>✅ ${t('week_done')}</p><button class="btn" data-act="openProgram">${t('see_program')}</button>`}</section>`;
    })();
    const healthCard = (() => {
      if (mode() === 'coach') return '';
      const log = (D.health || []).slice().sort((a, b) => b.t - a.t);
      const latest = {}; for (const e of log) if (!latest[e.type]) latest[e.type] = e;
      const r = Health.readiness(log);
      return `<button class="card linkcard health-cta" data-tab="health"><b>🩺 ${t('health')}</b>${r ? ` · ${{ go: '🟢', light: '🟡', rest: '🔴' }[r]} ${t('ready_' + r)}` : ''}
        <div class="mini-vitals">${['bp', 'hr', 'glucose', 'sleep'].map((k) => `<span>${Health.TYPES[k].icon} ${latest[k] ? esc(hValue(latest[k])) : '—'}</span>`).join('')}</div><small class="muted">${t('add_measure')} →</small></button>`;
    })();
    const trainCard = D.program && mode() !== 'healthy' ? '' : `<section class="card ${mode() === 'healthy' ? '' : 'hero'}">${mode() === 'healthy' ? '' : '<div class="hero-bg"></div>'}<h2>${t(mode() === 'healthy' ? 'move_today' : 'today_plan')}</h2>${planHtml}<p class="small muted">📅 ${t('tomorrow')} : ${tomorrow}</p></section>`;
    const foodCard = `<section class="card ${mode() === 'healthy' ? 'hero food-hero' : ''}">${mode() === 'healthy' ? '<div class="hero-bg"></div>' : ''}<h2>${t('today_food')}</h2>
        ${b ? `<div class="food-sum">${ring(tot.kcal, b.kcal + dayBurn(), t('kcal_left'))}<div class="macros">${macroBar('protein', tot.p, b.protein)}${macroBar('carbs', tot.c, b.carbs)}${macroBar('fat', tot.f, b.fat)}${macroBar('fiber', tot.fiber, b.fiber)}</div></div>${dayBurn() ? `<p class="small burn">🔥 +${dayBurn()} ${t('burned')}</p>` : ''}` : `<p>${t('fill_profile')}</p>`}
        <div class="row"><button class="btn primary" data-act="photo" data-src="camera">📸 ${t('scan_food')}</button></div></section>`;
    const today = D.wear && D.wear.days[todayKey()];
    const yest = D.wear && D.wear.days[todayKey(new Date(Date.now() - DAY))];
    const watchCard = D.wear && D.wear.hc ? `<button class="card linkcard watch-card" data-act="openReports"><b>⌚ ${t('watch_today')}</b>
        <div class="mini-vitals"><span>👣 ${fmt(today?.steps)}</span><span>❤️ ${today?.rhr ?? yest?.rhr ?? '—'}</span><span>😴 ${hm(today?.sleepMin != null ? today.sleepMin / 60 : yest?.sleepMin != null ? yest.sleepMin / 60 : null)}</span><span>🔥 ${fmt(today?.active)}</span></div><small class="muted">${t('reports')} →</small></button>` : '';
    const order0 = mode() === 'healthy' ? [foodCard, healthCard, trainCard] : mode() === 'pro' ? [progCard, trainCard, healthCard, foodCard] : [progCard, trainCard, foodCard];
    const order = watchCard ? [order0[0], watchCard, ...order0.slice(1)] : order0;
    return `<header class="top home-top"><h1>${t('hello')}, ${esc(displayName())} 👋</h1><button class="avatar" data-tab="me" aria-label="${t('profile')}">${esc(String(displayName()).slice(0, 1).toUpperCase())}</button></header>
      <p class="mode-pill">${MODES.find((m) => m[0] === mode())[1]} ${t(MODES.find((m) => m[0] === mode())[2])}</p>
      <div class="stats">
        <div class="stat"><b>${streak()}</b><span>🔥 ${t('streak')}</span></div>
        <div class="stat"><b>${sessionsThisWeek()}/${D.profile?.days || 3}</b><span>🏋️ ${t('this_week')}</span></div>
      </div>
      ${order.join('')}
      ${mode() === 'healthy' ? '' : `<section class="card"><h2>${t('recovery')}</h2>
        ${BodyMap.render({ fill: (g) => recColor(P.st[g]), front: t('front'), back: t('back_side') })}
        <p class="small muted center">${t('heatmap_hint')}</p>
        <details><summary class="small">${t('weekly_volume')}</summary>${recoveryGrid(P.st)}</details></section>`}
      <section class="card tip"><h2>💡 ${t('tip_day')}</h2><p>${esc(L(tip))}</p></section>`;
  }
  const macroBar = (k, v, max) => `<div class="mb"><div class="mb-top"><span>${t(k)}</span><span dir="ltr">${Math.round(v)} / ${Math.round(max)} g</span></div><div class="bar"><i style="width:${Math.min(100, (100 * v) / (max || 1))}%"></i></div></div>`;

  // ------------------------------------------------------------------ views: exercises
  let filter = { muscle: 'all', equip: 'mine', q: '' };
  const short = (m) => L(MU[m].name).split(' (')[0];
  const thumb = (e) => (e.lib ? `<span class="fig lib-thumb"><img src="${esc(e.photos[1] || e.photos[0] || '')}" alt="" loading="lazy"></span>` : Figure.still(e));
  function exCard(e) {
    const rx = prescription(e);
    return `<button class="ex-card" data-act="ex" data-id="${e.id}">${thumb(e)}<div class="ex-txt"><b>${esc(L(e.name))}</b>
      <div class="small muted">${MU[e.group].icon} ${esc(short(e.group))} · ${e.equip.map((q) => esc(L(EQUIP[q]))).join(' / ')}</div>
      <div class="small">${rxText(rx)}</div>${e.analyzer ? '<span class="badge">📷 IA</span>' : ''}${e.machine || e.equip.some((q) => q === 'machine' || q === 'cable') ? `<span class="badge m">🏋️ ${t('machine_b')}</span>` : ''}${e.lib ? `<span class="badge p">📸 ${t('photos_b')}</span>` : '<span class="badge d">🧍 3D</span>'}</div></button>`;
  }
  function exList() {
    const q = filter.q.trim().toLowerCase();
    const src = filter.src || 'all';
    const pool = src === '3d' ? EXERCISES : src === 'lib' ? LIB : EXERCISES.concat(LIB);
    const list = pool.filter((e) => (filter.muscle === 'all' || e.group === filter.muscle || (q && e.second.includes(filter.muscle))) &&
      (filter.equip === 'all' || canDo(e)) && (!filter.kind || filter.kind === 'all' || e.equip.includes(filter.kind) || (filter.kind === 'machine' && e.machine)) &&
      (!q || [e.name.fr, e.name.en, e.name.ar, e.nameEN || ''].some((n) => n.toLowerCase().includes(q))));
    const lim = filter.limit || 30;
    if (list.length > lim) {
      const shown = list.slice(0, lim);
      const none = shown.filter((e) => e.equip.includes('none')), eq = shown.filter((e) => !e.equip.includes('none'));
      const sec = (title, arr) => (arr.length ? `<h3 class="sec-title">${title}</h3><div class="ex-list">${arr.map(exCard).join('')}</div>` : '');
      return `<p class="small muted">${t('n_ex', { n: list.length })}</p>` + sec('🏠 ' + t('sec_none'), none) + sec('🏋️ ' + t('sec_equip'), eq) + `<button class="btn full" data-act="moreEx">＋ ${t('show_more')} (${list.length - lim})</button>`;
    }
    const none = list.filter((e) => e.equip.includes('none')), eq = list.filter((e) => !e.equip.includes('none'));
    const sec = (title, arr) => (arr.length ? `<h3 class="sec-title">${title} <span class="muted small">${t('n_ex', { n: arr.length })}</span></h3><div class="ex-list">${arr.map(exCard).join('')}</div>` : '');
    return sec('🏠 ' + t('sec_none'), none) + sec('🏋️ ' + t('sec_equip'), eq) || `<p class="muted">—</p>`;
  }
  function muscleCard(m) {
    const st = muscleState()[m];
    const pct = Math.round(st.recovery * 100);
    return `<section class="card muscle-card"><div class="row between"><h2>${MU[m].icon} ${esc(L(MU[m].name))}</h2><button class="chip" data-act="fmuscle" data-id="all">✕ ${t('all_muscles')}</button></div>
      <div class="kpis"><div><b>${pct}%</b><span>${t('recovery')}</span></div><div><b>${round(st.sets, 1)}/${st.target}</b><span>${t('sets_week')}</span></div><div><b>${esc(ago(st.hours))}</b><span>${t('history')}</span></div></div>
      <button class="btn primary big full" data-act="startMuscle" data-id="${m}">▶ ${t('train_this')}</button></section>`;
  }
  function viewTrain(arg) {
    if (arg && arg.muscle) filter.muscle = arg.muscle;
    const sel = filter.muscle;
    return `${header(t('t_train'), false)}
      <section class="card bm-card">${BodyMap.render({ fill: (g) => (g === sel ? 'var(--bm-sel)' : 'var(--bm-idle)'), front: t('front'), back: t('back_side') })}
        <p class="small muted center">👆 ${t('body_hint')}</p></section>
      <div class="chips scroll">${[['all', '✨', t('all')], ...MUSCLES.map((m) => [m.id, m.icon, short(m.id)])].map(([id, i, n]) => `<button class="chip ${sel === id ? 'on' : ''}" data-act="fmuscle" data-id="${id}">${i} ${esc(n)}</button>`).join('')}</div>
      ${sel !== 'all' ? muscleCard(sel) : ''}
      <input id="exSearch" class="search" type="search" placeholder="${t('search_ex')}" value="${esc(filter.q)}">
      <div class="seg">${[['all', 'src_all', EXERCISES.length + LIB.length], ['3d', 'src_3d', EXERCISES.length], ['lib', 'src_lib', LIB.length]].map(([v, k, n]) => `<button data-act="fsrc" data-id="${v}" class="${(filter.src || 'all') === v ? 'on' : ''}">${t(k)} <small>${n}</small></button>`).join('')}</div>
      <div class="chips scroll">${[['all', '✨'], ['machine', '🏋️'], ['cable', '🪢'], ['barbell', '🏋️‍♂️'], ['dumbbell', '💪'], ['kettlebell', '🔔'], ['band', '➰'], ['none', '🏠']].map(([k, ic]) => `<button class="chip ${(filter.kind || 'all') === k ? 'on' : ''}" data-act="fkind" data-id="${k}">${ic} ${esc(k === 'all' ? t('all') : L(EQUIP[k]) || k)}</button>`).join('')}</div>
      <div class="seg"><button class="${filter.equip === 'mine' ? 'on' : ''}" data-act="fequip" data-id="mine">${esc(t(D.profile?.place === 'gym' ? 'gym' : D.profile?.place === 'home_db' ? 'home_db' : 'home_place'))}</button><button class="${filter.equip === 'all' ? 'on' : ''}" data-act="fequip" data-id="all">${t('all')} (${EXERCISES.length})</button></div>
      <div id="exList">${exList()}</div>
      <button class="card linkcard" data-act="science">🔬 ${t('science')} →</button>`;
  }

  let stopAnim = null;
  const anim = { yaw: 22, pitch: 12, speed: 1, paused: false, steps: false, ex: null };
  function renderSteps() {
    const box = $('#stepsBox'); if (!box || !anim.ex) return;
    const labels = [t('step_start'), t('step_mid'), t('step_end')];
    box.innerHTML = Figure.steps(EX[anim.ex], anim).map((svg, i) => `<figure><b>${i + 1}</b>${svg}<figcaption>${labels[i]}</figcaption></figure>`).join('');
  }
  function viewExercise(id) {
    const e = EX[id];
    const rx = prescription(e);
    const ld = lastDone(id);
    const q = encodeURIComponent(L(e.name) + ' ' + ({ fr: 'exécution correcte', en: 'proper form', ar: 'الطريقة الصحيحة' }[I18N.lang]));
    if (e.lib) return viewLibExercise(e);
    const use3d = D.prefs.view3d !== false && window.Figure3D && Figure3D.supported();
    return `${header(L(e.name))}
      <div class="card demo">${use3d ? '<canvas id="anim3d" class="fig3d"></canvas>' : '<svg id="anim" class="fig big" viewBox="0 0 200 150"></svg>'}
        <div class="row ctl-row r3d"><button class="btn sm" data-act="toggle3d">${use3d ? '✏️ ' + t('view_2d') : '🧊 ' + t('view_3d')}</button></div>
        <div class="seg view-seg">${[[0, 'view_profile'], [35, 'view_34'], [90, 'view_front'], [-90, 'view_back']].map(([v, k]) => `<button data-act="yaw" data-v="${v}" class="${Math.round(anim.yaw) === v ? 'on' : ''}">${t(k)}</button>`).join('')}</div>
        <div class="row ctl-row"><button class="btn sm" data-act="animPause">${anim.paused ? '▶ ' + t('play') : '⏸ ' + t('pause')}</button><button class="btn sm" data-act="animSpeed">${anim.speed < 1 ? '🐢 0.4×' : '1×'}</button><button class="btn sm" data-act="animSteps">👣 ${t('steps_view')}</button></div>
        <p class="small muted center">↔️ ${t('drag_hint')}</p>
        <div id="stepsBox" class="steps-box" ${anim.steps ? '' : 'hidden'}></div></div>
      <section class="card"><h2>🎯 ${t('targets')}</h2>
        <div class="chips"><span class="chip on">${MU[e.group].icon} ${esc(L(MU[e.group].name))}</span>${e.second.map((m) => `<span class="chip sec">${esc(short(m))}</span>`).join('')}</div>
        <div class="mini-map">${BodyMap.render({ fill: (g) => (g === e.group ? 'var(--bm-sel)' : e.second.includes(g) ? 'var(--bm-sec)' : 'var(--bm-idle)') })}</div></section>
      <section class="card"><h2>📋 ${t('prescription')}</h2><p class="big-txt">${rxText(rx)}</p>${ld ? `<p class="small muted">${t('history')} : ${ld.sets.map((s) => (s.kg ? s.kg + 'kg×' : '') + s.reps).join(', ')}</p>` : ''}</section>
      <section class="card"><h2>✅ ${t('how_to')}</h2><ol class="steps">${e.steps.map((s) => `<li>${esc(L(s))}</li>`).join('')}</ol></section>
      <section class="card warn"><h2>⚠️ ${t('mistakes')}</h2><ul>${e.mistakes.map((s) => `<li>${esc(L(s))}</li>`).join('')}</ul></section>
      <section class="card tip"><h2>💡 ${t('tip')}</h2><p>${esc(L(e.tip))}</p></section>
      <div class="col">
        ${e.analyzer ? `<button class="btn primary big" data-act="coachEx" data-id="${id}">📷 ${t('check_form')}</button>` : ''}
        <button class="btn" data-act="url" data-url="https://www.youtube.com/results?search_query=${q}">▶️ ${t('watch_video')} <span class="small muted">(${t('video_need_net')})</span></button>
        <button class="btn" data-act="startEx" data-id="${id}">📝 ${t('log_set')}</button>
      </div>`;
  }

  function viewLibExercise(e) {
    const rx = prescription(e);
    const q = encodeURIComponent(e.nameEN + ' proper form');
    const tr = libTranslations()[e.id];
    return `${header(L(e.name))}
      <div class="card demo photo-demo"><div class="photo-anim">${e.photos.map((p, i) => `<img src="${esc(p)}" alt="${i ? t('step_end') : t('step_start')}" class="ph${i}">`).join('')}<p class="noimg-msg">📶 ${t('photos_need_net')}</p></div>
        <div class="row ctl-row"><span class="chip">1 · ${t('step_start')}</span><span class="chip">2 · ${t('step_end')}</span></div>
        <p class="small muted center">📸 ${t('lib_credit')}</p></div>
      <section class="card"><h2>🎯 ${t('targets')}</h2>
        <div class="chips"><span class="chip on">${MU[e.group].icon} ${esc(L(MU[e.group].name))}</span>${e.second.map((m) => `<span class="chip sec">${esc(short(m))}</span>`).join('')}<span class="chip">${esc(L(EQUIP[e.equip[0]]) || e.equip[0])}</span><span class="chip">${t('lv' + e.level)}</span></div>
        <div class="mini-map">${BodyMap.render({ fill: (g) => (g === e.group ? 'var(--bm-sel)' : e.second.includes(g) ? 'var(--bm-sec)' : 'var(--bm-idle)') })}</div></section>
      <section class="card"><h2>📋 ${t('prescription')}</h2><p class="big-txt">${rxText(rx)}</p></section>
      <section class="card"><h2>✅ ${t('how_to')}</h2>
        ${tr ? `<ol class="steps">${tr.map((s) => `<li>${esc(s)}</li>`).join('')}</ol><p class="small muted">✨ ${t('translated_ai')}</p>`
          : `<ol class="steps" dir="ltr" lang="en">${e.steps.map((s) => `<li>${esc(s.en)}</li>`).join('')}</ol>
          ${I18N.lang !== 'en' ? (D.prefs.aiKey ? `<button class="btn ai full" data-act="aiTranslate" data-id="${e.id}">✨ ${t('ai_translate')}</button>` : `<p class="small muted">🇬🇧 ${t('lib_english')}</p>`) : ''}`}</section>
      <div class="col">
        <button class="btn" data-act="url" data-url="https://www.youtube.com/results?search_query=${q}">▶️ ${t('watch_video')} <span class="small muted">(${t('video_need_net')})</span></button>
        <button class="btn primary" data-act="startEx" data-id="${e.id}">📝 ${t('log_set')}</button>
      </div>`;
  }
  const libTranslations = () => store.get('fc_tr_' + I18N.lang, {});
  async function aiTranslate(id) {
    const e = EX[id];
    if (!D.prefs.aiKey) return;
    toast(t('ai_running'));
    try {
      if (!window.AnthropicSDK) await new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'vendor/anthropic-sdk.min.js'; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });
      const client = new AnthropicSDK({ apiKey: D.prefs.aiKey, dangerouslyAllowBrowser: true });
      const lang = { fr: 'French', en: 'English', ar: 'Arabic' }[I18N.lang];
      const resp = await client.beta.messages.create({
        model: 'claude-opus-5-5', max_tokens: 16000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: { type: 'object', additionalProperties: false, required: ['steps'], properties: { steps: { type: 'array', items: { type: 'string' } } } } } },
        system: 'You translate gym exercise instructions for a fitness app. Keep every step, keep the meaning exact, use natural gym vocabulary.',
        messages: [{ role: 'user', content: `Translate these steps of the exercise "${e.nameEN}" into ${lang}:\n` + e.steps.map((s, i) => `${i + 1}. ${s.en}`).join('\n') }],
      });
      if (resp.stop_reason === 'refusal') throw new Error(t('ai_refused'));
      const out = JSON.parse((resp.content.find((b) => b.type === 'text') || {}).text);
      const all = libTranslations(); all[id] = out.steps.map(String); store.set('fc_tr_' + I18N.lang, all);
      if (current === 'exercise') render();
    } catch (x) { toast(t('ai_error') + ' : ' + ((x && x.message) || x)); }
  }

  // ------------------------------------------------------------------ views: workout
  let W = null; // active workout {ex:[{id, sets:[{kg,reps,done}]}]}
  function newWorkout(ids, prog) {
    // ids: exercise ids, or programme items {id, sets, reps|hold, rest, rir}
    W = { start: Date.now(), prog: prog || null, ex: ids.map((x) => {
      const it = typeof x === 'string' ? null : x;
      const id = it ? it.id : x;
      const rx = it ? { sets: it.sets, reps: it.reps, hold: it.hold, rest: it.rest || 60, rir: it.rir } : prescription(EX[id]);
      const ld = lastDone(id);
      return { id, rx: it ? rx : null, sets: Array.from({ length: rx.sets }, (_, i) => ({ kg: ld?.sets[i]?.kg ?? ld?.sets[0]?.kg ?? '', reps: '', done: false })) };
    }) };
    D.activeW = W; saveData();
    go('workout');
  }
  const rxOf = (x) => x.rx || prescription(EX[x.id]);
  function overloadHint(id) {
    const ld = lastDone(id); if (!ld) return '';
    const rx = prescription(EX[id]);
    const txt = ld.sets.map((s) => (s.kg ? s.kg + 'kg×' : '') + s.reps + (EX[id].hold ? t('seconds') : '')).join(', ');
    const top = !rx.hold && ld.sets.length >= rx.sets && ld.sets.every((s) => +s.reps >= rx.reps[1]);
    return `<p class="small hint">📈 ${t('progress_hint', { x: esc(txt) })}${top ? '<br>⬆️ ' + t('increase_load') : ''}</p>`;
  }
  function viewWorkout() {
    if (!W) W = D.activeW || null;
    if (!W) return `${header(t('workout'))}<p>—</p>`;
    return `${header(t('workout'))}
      <div id="liveHr" class="live-hr">${hrBadge()}</div>
      <p class="card small">🔥 ${t('warmup')}</p>
      ${W.ex.map((x, i) => {
        const e = EX[x.id]; const rx = rxOf(x);
        return `<section class="card wex"><div class="wex-head">${thumb(e)}<div><button class="link" data-act="ex" data-id="${x.id}"><b>${esc(L(e.name))}</b></button><div class="small muted">${rxText(rx)}${rx.rir != null ? ` · RIR ${rx.rir}` : ''}</div></div></div>
          ${overloadHint(x.id)}
          <table class="sets"><tr><th>#</th>${e.hold ? '' : `<th>${t('weight_kg')}</th>`}<th>${e.hold ? t('seconds') : t('reps_done')}</th><th>✓</th></tr>
          ${x.sets.map((s, j) => `<tr class="${s.done ? 'done' : ''}"><td>${j + 1}</td>${e.hold ? '' : `<td><input inputmode="decimal" data-w="${i}" data-s="${j}" data-k="kg" value="${esc(s.kg)}" placeholder="0"></td>`}<td><input inputmode="numeric" data-w="${i}" data-s="${j}" data-k="reps" value="${esc(s.reps)}" placeholder="${rx.hold ? rx.hold : rx.reps[0] + '-' + rx.reps[1]}"></td><td><button class="check ${s.done ? 'on' : ''}" data-act="setDone" data-w="${i}" data-s="${j}">✓</button></td></tr>`).join('')}
          </table>
          <div class="row small"><button class="btn sm" data-act="addSet" data-w="${i}">${t('add_set')}</button><button class="btn sm" data-act="swap" data-w="${i}">🔄 ${t('swap')}</button>${e.analyzer ? `<button class="btn sm" data-act="coachEx" data-id="${x.id}">📷</button>` : ''}</div></section>`;
      }).join('')}
      <button class="btn primary big full" data-act="finish">🏁 ${t('finish')}</button>
      <button class="btn full" data-act="cancelW">${t('cancel')}</button>`;
  }
  let restTimer = null;
  function startRest(sec) {
    clearInterval(restTimer);
    let left = sec;
    const el = $('#rest');
    el.hidden = false;
    const upd = () => { el.innerHTML = `<span>⏱ ${t('rest_timer')} <b>${left}</b>${t('seconds')}</span><button data-act="skipRest">${t('skip')}</button>`; };
    upd();
    restTimer = setInterval(() => { left--; if (left <= 0) { clearInterval(restTimer); el.hidden = true; if (navigator.vibrate) navigator.vibrate(300); speak('Go!'); } else upd(); }, 1000);
  }
  function finishWorkout() {
    const ex = W.ex.map((x) => ({ id: x.id, sets: x.sets.filter((s) => s.done || +s.reps > 0).map((s) => ({ kg: +s.kg || 0, reps: +s.reps || (prescription(EX[x.id]).hold || prescription(EX[x.id]).reps?.[0] || 0) })) })).filter((x) => x.sets.length);
    if (ex.length) {
      // calories burned: MET 5 (resistance training) x body weight x duration
      const sets = ex.reduce((n, x) => n + x.sets.length, 0);
      let min = (Date.now() - W.start) / 60000;
      if (min > 180 || min < 5) min = sets * 2.5;
      const kcalMet = Math.round(5 * (D.profile?.weight || 70) * Math.min(150, min) / 60);
      const kHr = hrKcal(W.hr);
      const hrs = (W.hr || []).map((x) => x[1]);
      D.workouts.push({ time: Date.now(), start: W.start, ex, kcal: kHr || kcalMet, min: Math.round(min), hr: hrs.length ? { avg: Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length), max: Math.max(...hrs) } : null });
      saveData();
    }
    if (W.prog && D.program) { D.program.done = D.program.done || {}; D.program.done[W.prog] = Date.now(); }
    W = null; D.activeW = null; saveData();
    clearInterval(restTimer); $('#rest').hidden = true;
    toast(t('workout_saved'));
    tab('home');
  }

  // ------------------------------------------------------------------ views: food
  let foodState = { q: '', cat: null, photo: null, product: null, productMsg: '', ai: null, plate: [] };
  const fname = (f) => L(f.name) + (f.brand ? ' · ' + f.brand : '');
  function foodRow(f, act = 'foodDetail') {
    const g = grade(f);
    return `<button class="food-row" data-act="${act}" data-id="${f.id}">${f.img ? `<img class="fr-img" src="${esc(f.img)}" alt="" loading="lazy">` : `<span class="fr-ic">${(FOOD_CATS[f.cat] || {}).icon || '🍽️'}</span>`}<span class="fr-name">${esc(fname(f))}<small class="muted">${f.kcal} kcal ${t('per100')} · ${f.portion} g ≈ ${Math.round((f.kcal * f.portion) / 100)} kcal</small></span><span class="grade g${g.g}">${g.g}</span></button>`;
  }
  const searchFoods = (q) => FOODS.filter((f) => [f.name.fr, f.name.en, f.name.ar, ...f.keys].some((n) => String(n).toLowerCase().includes(q)));

  // ---- barcode -> Open Food Facts
  function httpGet(url) {
    return new Promise((resolve, reject) => {
      if (NATIVE && Android.get) Android.get(url, reg({ done: (txt, err) => (err ? reject(new Error(err)) : resolve(txt)) }));
      else fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status)))).then(resolve, reject);
    });
  }
  function offToFood(code, p) {
    const n = p.nutriments || {};
    let kcal = n['energy-kcal_100g'];
    if (kcal == null && n.energy_100g != null) kcal = n.energy_100g / 4.184;
    if (kcal == null) return null;
    const nm = p['product_name_' + I18N.lang] || p.product_name || p.product_name_fr || p.product_name_en || p.product_name_ar || code;
    const tags = (p.categories_tags || []).join(' ');
    const cat = /beverage|drink|water|juice|soda/.test(tags) ? 'drink' : /dair|milk|yogurt|cheese/.test(tags) ? 'dairy' : /snack|sweet|chocolate|biscuit|confection|dessert|candy/.test(tags) ? 'sweet' : 'packaged';
    const ns = String(p.nutriscore_grade || '').toUpperCase();
    return {
      id: 'off_' + code, code, name: { fr: nm, en: nm, ar: nm }, brand: String(p.brands || '').split(',')[0].trim(), cat,
      kcal: Math.round(kcal), p: round(+n.proteins_100g || 0, 1), c: round(+n.carbohydrates_100g || 0, 1), f: round(+n.fat_100g || 0, 1),
      fiber: round(+n.fiber_100g || 0, 1), sugar: round(+n.sugars_100g || 0, 1), salt: round(+n.salt_100g || 0, 2),
      portion: Math.round(+p.serving_quantity || (cat === 'drink' ? 250 : 100)),
      flags: (+p.nova_group === 4 ? 'p' : '') + ((+n.salt_100g || 0) > 1.5 ? 's' : '') + ((+n.sugars_100g || 0) > 22 ? 'g' : ''),
      keys: [nm.toLowerCase(), code], nutri: 'ABCDE'.includes(ns) && ns ? ns : null, nova: +p.nova_group || null, img: p.image_front_small_url || null,
    };
  }
  async function lookupBarcode(code) {
    code = String(code).replace(/\D/g, '');
    if (code.length < 6) return;
    if (FOOD['off_' + code]) { foodState.product = 'off_' + code; foodState.productMsg = ''; render(); return; }
    foodState.product = null; foodState.productMsg = t('looking'); render();
    const fields = 'product_name,product_name_fr,product_name_en,product_name_ar,brands,nutriments,nutriscore_grade,nova_group,image_front_small_url,serving_quantity,categories_tags';
    try {
      const j = JSON.parse(await httpGet(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${fields}`));
      const f = j && j.status === 1 && j.product ? offToFood(code, j.product) : null;
      if (!f) { foodState.productMsg = t('product_not_found') + ' (' + code + ')'; render(); return; }
      rememberFood(f);
      foodState.product = f.id; foodState.productMsg = '';
    } catch (e) { foodState.productMsg = t('net_error'); }
    if (current === 'food') render();
  }
  function productCard(f) {
    const g = grade(f);
    return `<section class="card product"><div class="prod-head">${f.img ? `<img src="${esc(f.img)}" alt="">` : '<span class="fr-ic big">📦</span>'}<div><small class="muted">${t('packaged')} · ${esc(f.code)}</small><h2>${esc(L(f.name))}</h2>${f.brand ? `<p class="muted">${esc(f.brand)}</p>` : ''}</div></div>
      <div class="prod-badges">${f.nutri ? `<span class="ns">${t('nutriscore')} ${['A', 'B', 'C', 'D', 'E'].map((x) => `<i class="g${x} ${x === f.nutri ? 'on' : ''}">${x}</i>`).join('')}</span>` : `<span class="grade g${g.g}">${g.g}</span>`}
        ${f.nova ? `<span class="nova n${f.nova}">NOVA ${f.nova} · ${t('nova_' + f.nova)}</span>` : ''}</div>
      <p><b>${f.kcal} kcal</b> ${t('per100')} · ${t('protein')} ${f.p} g · ${t('sugar')} ${f.sugar} g · ${t('fat')} ${f.f} g</p>
      <div class="row"><button class="btn primary" data-act="foodDetail" data-id="${f.id}">${t('portion')} / ${t('add_meal')}</button><button class="btn" data-act="plateAdd" data-id="${f.id}">🍽️ ${t('add_plate')}</button></div>
      <p class="small muted">${t('source_off')}</p></section>`;
  }

  // ---- plate (several foods in one meal)
  function plateStats() {
    const tot = { kcal: 0, p: 0, c: 0, f: 0, fiber: 0, sugar: 0, g: 0, veg: 0, starch: 0, score: 0 };
    for (const it of foodState.plate) {
      const f = FOOD[it.id]; if (!f) continue;
      const q = it.g / 100, kc = f.kcal * q;
      tot.kcal += kc; tot.p += f.p * q; tot.c += f.c * q; tot.f += f.f * q; tot.fiber += f.fiber * q; tot.sugar += f.sugar * q;
      if (f.cat !== 'drink') tot.g += it.g;
      if (['fruit', 'veg', 'legume'].includes(f.cat)) tot.veg += it.g;
      if (['grain', 'sweet', 'fastfood'].includes(f.cat)) tot.starch += it.g;
      tot.score += grade(f).score * Math.max(kc, 1);
    }
    tot.score = tot.kcal ? Math.round(tot.score / Math.max(tot.kcal, 1)) : 0;
    const g = tot.score >= 75 ? 'A' : tot.score >= 60 ? 'B' : tot.score >= 45 ? 'C' : tot.score >= 30 ? 'D' : 'E';
    const notes = [];
    if (tot.g) {
      notes.push(tot.veg / tot.g >= 0.35 ? ['ok', 'plate_veg_ok'] : ['warn', 'plate_veg_low']);
      notes.push(tot.p >= 20 || (tot.kcal && (tot.p * 4) / tot.kcal >= 0.18) ? ['ok', 'plate_prot_ok'] : ['warn', 'plate_prot_low']);
      if (tot.starch / tot.g > 0.5) notes.push(['warn', 'plate_starch_high']);
    }
    return { tot, g, notes };
  }
  function plateCard() {
    if (!foodState.plate.length) return '';
    const { tot, g, notes } = plateStats();
    const b = body();
    return `<section class="card plate"><h2>🍽️ ${t('plate')}</h2>
      <ul class="plate-list">${foodState.plate.map((it, i) => { const f = FOOD[it.id]; return f ? `<li><span class="grade sm g${grade(f).g}">${grade(f).g}</span><span class="pl-name">${esc(fname(f))}</span><input class="pl-g" type="number" inputmode="numeric" data-plate="${i}" value="${it.g}" min="1" max="3000"><span class="small">g</span><b>${Math.round((f.kcal * it.g) / 100)}</b><button class="icon sm" data-act="plateDel" data-i="${i}" aria-label="${t('remove')}">✕</button></li>` : ''; }).join('')}</ul>
      <div class="verdict ${{ A: 'ok', B: 'ok', C: 'mid', D: 'warn', E: 'bad' }[g]}"><span class="grade big g${g}">${g}</span><div><b>${t('plate_total')} : ${Math.round(tot.kcal)} kcal</b><div class="small">${t('protein')} ${Math.round(tot.p)} g · ${t('carbs')} ${Math.round(tot.c)} g · ${t('fat')} ${Math.round(tot.f)} g · ${t('fiber')} ${Math.round(tot.fiber)} g${b ? ` · ${Math.round((100 * tot.kcal) / b.kcal)}% ${t('of_day')}` : ''}</div></div></div>
      <ul class="remarks">${notes.map(([c, k]) => `<li class="${c}">${t(k)}</li>`).join('')}</ul>
      <div class="row"><button class="btn primary" data-act="plateDiary">➕ ${t('plate_to_diary')}</button><button class="btn" data-act="plateClear">${t('clear')}</button></div></section>`;
  }
  function plateAdd(id, grams) {
    const f = FOOD[id]; if (!f) return;
    foodState.plate.push({ id, g: grams || f.portion });
    toast('🍽️ ' + L(f.name));
    if (current === 'food') render();
  }

  // ---- AI analysis (Claude, optional, user's own API key)
  const AI_CATS = ['fruit', 'veg', 'legume', 'grain', 'protein', 'dairy', 'nuts', 'fat', 'dish', 'fastfood', 'sweet', 'drink', 'packaged'];
  const AI_SCHEMA = {
    type: 'object', additionalProperties: false, required: ['items', 'advice'],
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['name', 'grams', 'kcal', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'category', 'processed', 'salty'],
          properties: {
            name: { type: 'string' }, grams: { type: 'number' }, kcal: { type: 'number' }, protein: { type: 'number' }, carbs: { type: 'number' },
            fat: { type: 'number' }, fiber: { type: 'number' }, sugar: { type: 'number' }, category: { type: 'string', enum: AI_CATS },
            processed: { type: 'boolean' }, salty: { type: 'boolean' },
          },
        },
      },
      advice: { type: 'string' },
    },
  };
  async function aiAnalyse() {
    const key = D.prefs.aiKey;
    const ph = foodState.photo;
    if (!key || !ph) return;
    foodState.ai = { loading: true }; render();
    if (!window.AnthropicSDK) { // load the SDK only when the AI is used
      await new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'vendor/anthropic-sdk.min.js'; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); }).catch(() => {});
    }
    const lang = { fr: 'French', en: 'English', ar: 'Arabic' }[I18N.lang];
    const p = D.profile || {};
    const goal = { lose: 'lose fat', muscle: 'build muscle', strength: 'get stronger', fit: 'stay fit and healthy' }[p.goal || 'fit'];
    const conds = (p.conditions || []).filter((c) => ['diabetes', 'hyper', 'chol'].includes(c)).map((c) => ({ diabetes: 'diabetes', hyper: 'high blood pressure', chol: 'high cholesterol' }[c])).join(', ') || 'none';
    try {
      const client = new AnthropicSDK({ apiKey: key, dangerouslyAllowBrowser: true });
      const resp = await client.beta.messages.create({
        model: 'claude-opus-5-5',
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: AI_SCHEMA } },
        system: 'You are the nutrition assistant of a fitness app used mostly in Tunisia and the Maghreb. Identify every distinct food, drink or packaged product visible in the photo, listing each component of a mixed plate separately (e.g. couscous grain, meat, vegetables, sauce, bread). Estimate each portion in grams from visual cues (a dinner plate is about 26 cm, a glass about 250 ml) and give the nutrition values for that portion from standard food composition tables. If the photo contains no food, return an empty items list.',
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: ph.img.split(',')[1] } },
            { type: 'text', text: `Write food names and the advice in ${lang}. The advice is 1–2 short sentences on how healthy this meal is for someone whose goal is to ${goal} (health conditions: ${conds}).` },
          ],
        }],
      });
      if (resp.stop_reason === 'refusal') throw new Error(t('ai_refused'));
      const txt = (resp.content.find((b) => b.type === 'text') || {}).text;
      const out = JSON.parse(txt);
      const stamp = Date.now().toString(36);
      out.items.forEach((it, i) => {
        const g = Math.max(1, +it.grams || 100), k = 100 / g;
        const f = {
          id: `ai_${stamp}_${i}`, name: { fr: it.name, en: it.name, ar: it.name }, cat: AI_CATS.includes(it.category) ? it.category : 'dish', ai: true,
          kcal: Math.round(it.kcal * k), p: round(it.protein * k, 1), c: round(it.carbs * k, 1), f: round(it.fat * k, 1), fiber: round(it.fiber * k, 1), sugar: round(it.sugar * k, 1),
          portion: Math.round(g), flags: (it.processed ? 'p' : '') + (it.salty ? 's' : ''), keys: [String(it.name).toLowerCase()],
        };
        rememberFood(f);
        foodState.plate.push({ id: f.id, g: f.portion });
      });
      foodState.ai = { advice: out.advice, n: out.items.length };
    } catch (e) {
      foodState.ai = { error: (e && e.message) || String(e) };
    }
    if (current === 'food') render();
  }

  function photoCard() {
    const ph = foodState.photo;
    if (!ph) return '';
    const items = ph.items || [];
    const both = (x) => [...(x.foods || []).map((f) => ({ text: f.text, conf: f.conf + 0.5 })), ...(x.labels || [])];
    const whole = matchLabels(both(ph));
    // dishes recognised by the offline food model (Google AIY Food V1)
    const dishes = (x) => (x.foods || []).filter((f) => f.conf >= 0.12).slice(0, 3).map((f) => `<button class="chip dish" data-act="dishSearch" data-v="${esc(f.text)}">🍽️ ${esc(f.text)} <small>${Math.round(f.conf * 100)}%</small></button>`).join('');
    const boxes = items.map((it, i) => `<span class="box" style="left:${it.box[0] * 100}%;top:${it.box[1] * 100}%;width:${it.box[2] * 100}%;height:${it.box[3] * 100}%"><b>${i + 1}</b></span>`).join('');
    const chips = (m) => m.foods.slice(0, 5).map((id) => `<button class="chip" data-act="plateAdd" data-id="${id}">＋ ${esc(L(FOOD[id].name))}</button>`).join('') +
      m.cats.slice(0, 2).map((c) => `<button class="chip ghost" data-act="fcat" data-id="${c}">${FOOD_CATS[c].icon} ${esc(L(FOOD_CATS[c]))}…</button>`).join('');
    const ai = foodState.ai;
    let aiHtml = '';
    if (D.prefs.aiKey) {
      aiHtml = ai && ai.loading ? `<div class="ai-box loading"><span class="spinner"></span> ${t('ai_running')}</div>`
        : ai && ai.error ? `<div class="ai-box err">⚠️ ${t('ai_error')} : ${esc(ai.error)}</div><button class="btn ai full" data-act="aiAnalyse">✨ ${t('ai_analyse')}</button>`
        : ai && ai.advice ? `<div class="ai-box"><b>✨ ${t('ai_result')}</b><p>${esc(ai.advice)}</p><p class="small muted">${t('ai_added')}</p></div>`
        : `<button class="btn ai big full" data-act="aiAnalyse">✨ ${t('ai_analyse')}</button>`;
    } else aiHtml = `<p class="small muted">💡 ${t('ai_hint')}</p>`;
    return `<section class="card photo-card"><h2>📸 ${t('detected')}</h2>
      <div class="photo-wrap"><img src="${ph.img}" alt="">${boxes}</div>
      ${aiHtml}
      ${items.length ? `<p class="small">${t('items_found', { n: items.length })}</p>` : ''}
      ${items.map((it, i) => { const m = matchLabels(both(it)); return `<div class="item-row"><img src="${it.thumb}" alt=""><div><b>${t('item')} ${i + 1}</b> <span class="small muted">${(it.labels || []).slice(0, 3).map((l) => esc(l.text)).join(', ')}</span><div class="chips">${dishes(it)}</div><div class="chips">${chips(m) || `<span class="small muted">${t('not_found')}</span>`}</div></div></div>`; }).join('')}
      <div class="item-row"><span class="fr-ic">🖼️</span><div><b>${t('whole_photo')}</b> <span class="small muted">${(ph.labels || []).slice(0, 4).map((l) => esc(l.text)).join(', ')}</span><div class="chips">${dishes(ph)}</div><div class="chips">${chips(whole) || `<span class="small muted">${t('not_found')}</span>`}</div></div></div>
      ${(ph.foods || []).length ? `<p class="small muted">🧠 ${t('food_model_note')}</p>` : ''}
      <p class="small muted">${t('photo_note')}</p></section>`;
  }

  function viewFood() {
    const b = body();
    const tot = dayTotals();
    const list = D.food[todayKey()] || [];
    const q = foodState.q.trim().toLowerCase();
    let results = [];
    if (q) results = searchFoods(q);
    else if (foodState.cat) results = FOODS.filter((f) => f.cat === foodState.cat);
    const target = b ? b.kcal + dayBurn() : 0;
    return `${header(t('t_food'), false)}
      <section class="card scan"><div class="scan-btns"><button class="scan-btn primary" data-act="photo" data-src="camera"><span>📸</span>${t('scan_food')}</button><button class="scan-btn" data-act="photo" data-src="gallery"><span>🖼️</span>${t('from_gallery')}</button></div>
        <p class="small muted">▮▯▮▮ ${t('barcode_hint')}</p>
        <form id="bcForm" class="bc-row"><input id="bcIn" inputmode="numeric" placeholder="${t('enter_barcode')}" autocomplete="off"><button class="btn" type="submit">${t('lookup')}</button></form>
        ${foodState.productMsg ? `<p class="small">${esc(foodState.productMsg)}</p>` : ''}</section>
      ${foodState.product && FOOD[foodState.product] ? productCard(FOOD[foodState.product]) : ''}
      ${photoCard()}
      ${plateCard()}
      <input id="foodSearch" class="search" type="search" placeholder="${t('search_food')}" value="${esc(foodState.q)}">
      <div class="chips scroll">${Object.keys(FOOD_CATS).filter((c) => FOODS.some((f) => f.cat === c)).map((c) => `<button class="chip ${foodState.cat === c ? 'on' : ''}" data-act="fcat" data-id="${c}">${FOOD_CATS[c].icon} ${esc(L(FOOD_CATS[c]))}</button>`).join('')}</div>
      <div id="foodResults" class="food-list">${results.slice(0, 40).map((f) => foodRow(f)).join('')}</div>
      <section class="card"><h2>📒 ${t('diary')}</h2>
        ${b ? `<div class="food-sum">${ring(tot.kcal, target, t('kcal_left'))}<div class="macros">${macroBar('protein', tot.p, b.protein)}${macroBar('carbs', tot.c, b.carbs)}${macroBar('fat', tot.f, b.fat)}${macroBar('fiber', tot.fiber, b.fiber)}${macroBar('sugar', tot.sugar, b.sugarMax)}</div></div>${dayBurn() ? `<p class="small burn">🔥 +${dayBurn()} ${t('burned')}</p>` : ''}` : ''}
        ${list.length ? `<ul class="diary">${list.map((it, i) => { const f = FOOD[it.id]; return f ? `<li><span class="grade sm g${grade(f).g}">${grade(f).g}</span><span>${esc(fname(f))} · ${it.g} g</span><b>${Math.round((f.kcal * it.g) / 100)} kcal</b><button class="icon sm" data-act="delFood" data-i="${i}" aria-label="${t('remove')}">✕</button></li>` : ''; }).join('')}</ul><p class="right"><b>${Math.round(tot.kcal)} kcal</b></p>` : `<p class="muted">${t('empty_diary')}</p>`}
      </section>
      <section class="card tip"><h2>🩺 ${t('advice')}</h2><ul>${ADVICE.slice(0, 6).map((a) => `<li>${esc(L(a))}</li>`).join('')}</ul></section>`;
  }

  function foodDetail(id, grams) {
    const f = FOOD[id];
    grams = grams || f.portion;
    const g = grade(f);
    const q = grams / 100;
    const b = body();
    const kc = f.kcal * q;
    const rm = remarks(f, grams);
    const verdictCls = { A: 'ok', B: 'ok', C: 'mid', D: 'warn', E: 'bad' }[g.g];
    openModal(`<div class="sheet-handle"></div>${f.img ? `<img class="sheet-img" src="${esc(f.img)}" alt="">` : ''}<h2>${esc(fname(f))}</h2>
      <div class="verdict ${verdictCls}"><span class="grade big g${g.g}">${g.g}</span><div><b>${t('v_' + g.g)}</b><div class="small">${g.off ? t('nutriscore') : t('health_verdict') + ' · ' + g.score + '/100'}${f.nova ? ' · NOVA ' + f.nova : ''}</div></div></div>
      <label class="small">${t('portion')}</label>
      <div class="seg">${[['small', 0.6], ['medium', 1], ['large', 1.5]].map(([k, m]) => `<button class="${Math.round(f.portion * m) === grams ? 'on' : ''}" data-act="portion" data-id="${id}" data-g="${Math.round(f.portion * m)}">${t(k)}<br><small>${Math.round(f.portion * m)} g</small></button>`).join('')}</div>
      <label class="inline">${t('grams')} <input id="gramsIn" type="number" inputmode="numeric" value="${grams}" min="1" max="3000"></label>
      <div class="kcal-big">${Math.round(kc)} <small>kcal</small></div>
      ${b ? `<p class="center small muted">${Math.round((100 * kc) / b.kcal)}% ${t('of_day')}</p>` : ''}
      <table class="nut"><tr><td>${t('protein')}</td><td>${round(f.p * q, 1)} g</td><td>${t('carbs')}</td><td>${round(f.c * q, 1)} g</td></tr>
      <tr><td>${t('fat')}</td><td>${round(f.f * q, 1)} g</td><td>${t('fiber')}</td><td>${round(f.fiber * q, 1)} g</td></tr>
      <tr><td>${t('sugar')}</td><td>${round(f.sugar * q, 1)} g</td><td>${t('per100')}</td><td>${f.kcal} kcal</td></tr></table>
      <ul class="remarks">${rm.map(([c, k]) => `<li class="${c}">${t(k)}</li>`).join('')}</ul>
      <div class="row"><button class="btn primary big" data-act="addFood" data-id="${id}">➕ ${t('add_meal')}</button><button class="btn big" data-act="plateAddG" data-id="${id}">🍽️ ${t('add_plate')}</button></div>
      <button class="btn full" data-act="closeModal">${t('close')}</button>
      ${f.code ? `<p class="small muted center">${t('source_off')}</p>` : ''}`);
    const gi = $('#gramsIn');
    gi.onchange = () => foodDetail(id, Math.max(1, Math.min(3000, +gi.value || f.portion)));
  }

  function takePhoto(src) {
    if (current !== 'food') tab('food');
    const show = (res) => {
      foodState.photo = res; foodState.q = ''; foodState.cat = null; foodState.ai = null; foodState.product = null; foodState.productMsg = '';
      if (current === 'food') render(); else tab('food');
      if (res.barcodes && res.barcodes.length) lookupBarcode(res.barcodes[0]);
    };
    if (NATIVE) {
      toast(t('analysing'));
      Android.pickImage(src, reg({ done(res, err) {
        if (!res) { if (err && err !== 'cancel') toast(err); return; }
        show(res);
      } }));
      return;
    }
    // browser fallback: show the picture (no on-device recognition here, the AI analysis still works)
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; if (src === 'camera') inp.capture = 'environment';
    inp.onchange = () => {
      const file = inp.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, 1024 / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k;
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          show({ img: c.toDataURL('image/jpeg', 0.8), labels: [], items: [], barcodes: [] });
          if (!D.prefs.aiKey) toast(t('needs_app'));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    };
    inp.click();
  }

  // ------------------------------------------------------------------ views: camera coach
  let coachEx = 'squat';
  let live = null;
  function viewCoach(arg) {
    if (arg) coachEx = arg;
    const list = EXERCISES.filter((e) => e.analyzer);
    if (!EX[coachEx]?.analyzer) coachEx = 'squat';
    return `${header(t('coach_title'), stack.length > 1)}
      <p class="muted">${t('coach_intro')}</p>
      <label>${t('analysable')}<select id="coachSel">${list.map((e) => `<option value="${e.id}" ${e.id === coachEx ? 'selected' : ''}>${esc(L(e.name))}</option>`).join('')}</select></label>
      <div class="row"><button class="btn primary big" data-act="live">🎥 ${t('live')}</button><button class="btn big" data-act="video">📁 ${t('upload_video')}</button></div>
      <div id="liveBox" hidden><div class="cam"><video id="camV" playsinline muted></video><canvas id="camC"></canvas>
        <div class="hud"><div><small>${t('reps_count')}</small><b id="hudReps">0</b></div><div id="hudMsg"></div></div></div>
        <div class="row"><button class="btn" data-act="flip">🔄 ${t('switch_cam')}</button><button class="btn" data-act="voice">${voiceOn ? '🔊' : '🔇'} ${t('voice')}</button><button class="btn primary" data-act="stopLive">⏹ ${t('stop')}</button></div></div>
      <div id="vidBox"></div>
      <section class="card small"><h2>💡</h2><p>${esc(L(EX[coachEx].tip))}</p><ul>${EX[coachEx].mistakes.map((m) => `<li>${esc(L(m))}</li>`).join('')}</ul></section>`;
  }
  const msgTxt = (k) => (k ? L(Pose.MSG[k]) : '');

  async function startLive(facing = 'user') {
    if (!NATIVE) { toast(t('needs_app')); return; }
    stopLive();
    const box = $('#liveBox'); box.hidden = false;
    const v = $('#camV'), c = $('#camC');
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }); }
    catch (e) { toast(t('cam_error')); box.hidden = true; return; }
    v.srcObject = stream; await v.play();
    const mirror = facing === 'user';
    v.style.transform = c.style.transform = mirror ? 'scaleX(-1)' : '';
    const an = Pose.create(EX[coachEx].analyzer);
    const off = document.createElement('canvas');
    live = { stream, facing, timer: 0, an, lastSpeak: 0 };
    const t0 = performance.now();
    let lastMsg = '';
    const loop = () => {
      if (!live) return;
      const w = v.videoWidth, h = v.videoHeight;
      if (w) {
        const sw = 360, sh = Math.round((h * sw) / w);
        off.width = sw; off.height = sh;
        off.getContext('2d').drawImage(v, 0, 0, sw, sh);
        let lm = null;
        try { lm = JSON.parse(Android.poseFrame(off.toDataURL('image/jpeg', 0.7))); } catch (e) {}
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        const r = an.feed(lm, w, h, performance.now() - t0);
        Pose.drawSkeleton(ctx, lm, w, h, r.ok === false ? '#ef4444' : '#22c55e');
        $('#hudReps').textContent = r.hold != null ? Math.round(r.hold / 1000) + t('seconds') : r.reps;
        if (r.msg) {
          const el = $('#hudMsg');
          el.textContent = msgTxt(r.msg);
          el.className = r.ok === false || (r.done && !r.ok) ? 'bad' : r.ok ? 'good' : '';
          const now = Date.now();
          if ((r.done || (r.hold != null && r.msg !== lastMsg)) && now - live.lastSpeak > 2500) {
            speak(r.done ? (r.ok ? String(r.reps) : msgTxt(r.msg)) : msgTxt(r.msg));
            live.lastSpeak = now;
          }
          lastMsg = r.msg;
        }
      }
      live.timer = setTimeout(loop, 60);
    };
    loop();
  }
  function stopLive() {
    if (!live) return;
    clearTimeout(live.timer);
    live.stream.getTracks().forEach((tr) => tr.stop());
    const s = live.an.summary();
    live = null;
    const box = $('#liveBox'); if (box) box.hidden = true;
    if ((s.reps && s.reps.length) || s.hold) { const vb = $('#vidBox'); if (vb) vb.innerHTML = resultCard(s); }
    if (NATIVE) try { Android.stopSpeak(); } catch (e) {}
  }

  function resultCard(s, imgHtml = '') {
    const n = s.hold ? `${Math.round(s.good / 1000)} ${t('seconds_good')}` : `${s.reps.length} ${t('reps')}`;
    if (!s.hold && !s.reps.length) return `<section class="card warn"><p>${t('no_reps')}</p></section>`;
    const cls = s.score >= 80 ? 'ok' : s.score >= 55 ? 'mid' : 'bad';
    return `<section class="card"><h2>📊 ${t('result')}</h2>
      <div class="verdict ${cls}"><span class="grade big">${s.score}</span><div><b>${t('form_score')}</b><div class="small">${n}</div></div></div>
      ${s.reps ? `<div class="reps-strip">${s.reps.map((r, i) => `<span class="${r.issues.length ? 'bad' : 'good'}" title="${r.issues.map(msgTxt).join(' ')}">${i + 1}</span>`).join('')}</div>` : ''}
      <h3>${t('corrections')}</h3>
      ${s.issues.length ? `<ul class="remarks">${s.issues.map((k) => `<li class="warn">${esc(msgTxt(k))}${s.count ? ` <b>×${s.count[k]}</b>` : ''}</li>`).join('')}</ul>` : `<p class="ok-txt">✅ ${t('all_good')}</p>`}
      ${imgHtml}</section>`;
  }

  function analyseVideo() {
    if (!NATIVE) { toast(t('needs_app')); return; }
    stopLive();
    const vb = $('#vidBox');
    const exId = coachEx;
    Android.pickVideo(reg({
      progress(p) { vb.innerHTML = `<div class="card"><p>${t('analysing')} ${p}%</p><div class="bar"><i style="width:${p}%"></i></div></div>`; },
      done(res, err) {
        if (!res) { vb.innerHTML = err && err !== 'cancel' ? `<p class="err">${esc(err)}</p>` : ''; return; }
        const an = Pose.create(EX[exId].analyzer);
        for (const fr of res.frames) an.feed(fr.lm, res.w, res.h, fr.t);
        const s = an.summary();
        let tm = s.worst && s.worst.issues.length ? s.worst.t : null;
        if (s.hold && s.issues.length) tm = res.frames[Math.floor(res.frames.length / 2)]?.t ?? null;
        vb.innerHTML = resultCard(s, tm != null ? `<h3>${t('worst_moment')}</h3><canvas id="worstC" class="worst"></canvas>` : '');
        if (tm != null) {
          const src = Android.videoFrame(tm);
          const fr = res.frames.find((f) => f.t === tm);
          if (src) {
            const img = new Image();
            img.onload = () => {
              const c = $('#worstC'); if (!c) return;
              c.width = img.width; c.height = img.height;
              const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
              Pose.drawSkeleton(ctx, fr && fr.lm, img.width, img.height, '#ef4444');
            };
            img.src = src;
          }
        }
      },
    }));
  }

  // ------------------------------------------------------------------ views: profile / me
  function viewMe() {
    const p = D.profile || { sex: 'm', activity: 1, goal: 'fit', level: 0, days: 3, place: 'home', conditions: [] };
    const b = body();
    const opt = (name, val, items) => items.map(([v, k]) => `<option value="${v}" ${String(val) === String(v) ? 'selected' : ''}>${t(k)}</option>`).join('');
    const conds = [['diabetes', 'c_diabetes'], ['hyper', 'c_hyper'], ['chol', 'c_chol'], ['knee', 'c_knee'], ['back', 'c_back']];
    return `${header(t('profile'), stack.length > 1)}
      <div class="row between"><span>👤 <b>${esc(displayName())}</b></span><button class="btn sm" data-act="logout">${t('logout')}</button></div>
      <div class="quick-links"><button class="card linkcard" data-act="openProgram">📅 ${t('program')}</button><button class="card linkcard" data-tab="health">🩺 ${t('health')}</button><button class="card linkcard" data-act="openDevices">⌚ ${t('devices')}</button><button class="card linkcard" data-act="openReports">📊 ${t('reports')}</button></div>
      <section class="card"><h2>🌐 ${t('language')}</h2>${langPicker()}</section>
      ${b ? bodyReport(b, p) : ''}
      <form id="profForm" class="card form"><h2>📝 ${t('profile')}</h2><p class="small muted">${t('profile_intro')}</p>
        <div class="grid2">
          <label>${t('sex')}<select name="sex">${opt('sex', p.sex, [['m', 'male'], ['f', 'female']])}</select></label>
          <label>${t('age')}<input name="age" type="number" inputmode="numeric" min="10" max="100" value="${p.age || ''}" required></label>
          <label>${t('height')}<input name="height" type="number" inputmode="numeric" min="120" max="230" value="${p.height || ''}" required></label>
          <label>${t('weight')}<input name="weight" type="number" inputmode="decimal" step="0.1" min="30" max="300" value="${p.weight || ''}" required></label>
        </div>
        <label>${t('waist')}<input name="waist" type="number" inputmode="numeric" min="40" max="200" value="${p.waist || ''}"></label>
        <label>${t('activity')}<select name="activity">${opt('activity', p.activity, [[0, 'act1'], [1, 'act2'], [2, 'act3'], [3, 'act4']])}</select></label>
        <label>${t('goal')}<select name="goal">${opt('goal', p.goal, [['lose', 'g_lose'], ['muscle', 'g_muscle'], ['fit', 'g_fit'], ['strength', 'g_strength']])}</select></label>
        <div class="grid2">
          <label>${t('level')}<select name="level">${opt('level', p.level, [[0, 'lv0'], [1, 'lv1'], [2, 'lv2']])}</select></label>
          <label>${t('days')}<select name="days">${[2, 3, 4, 5, 6].map((n) => `<option ${+p.days === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        </div>
        <label>${t('place')}<select name="place">${opt('place', p.place, [['home', 'home_place'], ['home_db', 'home_db'], ['gym', 'gym']])}</select></label>
        <fieldset><legend>${t('conditions')}</legend>${conds.map(([v, k]) => `<label class="check-l"><input type="checkbox" name="cond" value="${v}" ${(p.conditions || []).includes(v) ? 'checked' : ''}> ${t(k)}</label>`).join('')}</fieldset>
        <button class="btn primary big full" type="submit">💾 ${t('save')}</button>
      </form>
      <section class="card ai-card"><h2>✨ ${t('ai_title')}</h2><p class="small muted">${t('ai_desc')}</p>
        ${D.prefs.aiKey ? `<div class="row between"><span class="ok-txt">${t('ai_on')} (…${esc(D.prefs.aiKey.slice(-4))})</span><button class="btn sm" data-act="aiKeyDel">${t('ai_remove')}</button></div>`
          : `<form id="aiForm" class="bc-row"><input id="aiKeyIn" type="password" autocomplete="off" placeholder="sk-ant-…"><button class="btn primary" type="submit">${t('save')}</button></form>`}</section>
      ${settingsCard()}
      <button class="card linkcard" data-act="history">📜 ${t('history')} →</button>
      <button class="card linkcard" data-act="science">🔬 ${t('science')} →</button>
      <section class="card tip"><h2>🩺 ${t('advice')}</h2><ul>${ADVICE.map((a) => `<li>${esc(L(a))}</li>`).join('')}</ul></section>
      <p class="small muted disclaimer">⚕️ ${t('disclaimer')}</p>`;
  }
  function bodyReport(b, p) {
    const pos = Math.max(0, Math.min(100, ((b.bmi - 15) / (40 - 15)) * 100));
    const notes = [];
    if ((p.conditions || []).includes('knee')) notes.push(t('knee_note'));
    if ((p.conditions || []).includes('back')) notes.push(t('back_note'));
    return `<section class="card"><h2>🧍 ${t('body')}</h2>
      <div class="bmi"><div class="bmi-top"><span>${t('bmi')} <b>${round(b.bmi, 1)}</b></span><span class="tag ${b.bmiCat}">${t(b.bmiCat)}</span></div>
        <div class="bmi-scale"><i style="left:${pos}%"></i></div><div class="bmi-legend small"><span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span></div></div>
      <table class="kv">
        <tr><td>${t('healthy_range')}</td><td><b>${round(b.wMin)}–${round(b.wMax)} kg</b></td></tr>
        <tr><td>${t('ideal_weight')}</td><td><b>${round(b.ideal)} kg</b></td></tr>
        <tr><td>${t('bodyfat')}</td><td><b>${round(b.bf)} %</b> <span class="small muted">(${t('bodyfat_target')} ${b.bfTarget[0]}–${b.bfTarget[1]} %)</span></td></tr>
        ${b.whtr ? `<tr><td>${t('whtr')}</td><td><b>${round(b.whtr, 2)}</b> <span class="small">${t(b.whtr < 0.5 ? 'whtr_ok' : 'whtr_bad')}</span></td></tr>` : ''}
        <tr><td>${t('bmr')}</td><td>${Math.round(b.bmr)} kcal</td></tr>
        <tr><td>${t('tdee')}</td><td>${Math.round(b.tdee)} kcal</td></tr>
        <tr class="hl"><td>${t('target_kcal')}</td><td><b>${Math.round(b.kcal)} kcal</b></td></tr>
        <tr><td>${t('protein')}</td><td>${Math.round(b.protein)} g ${t('per_day')}</td></tr>
        <tr><td>${t('carbs')}</td><td>${Math.round(b.carbs)} g</td></tr>
        <tr><td>${t('fat')}</td><td>${Math.round(b.fat)} g</td></tr>
        <tr><td>${t('fiber')}</td><td>≥ ${Math.round(b.fiber)} g</td></tr>
        <tr><td>${t('sugar')}</td><td>≤ ${Math.round(b.sugarMax)} g</td></tr>
        <tr><td>${t('water')}</td><td>${round(b.water, 1)} L</td></tr>
      </table>
      <p class="tip-line">🎂 <b>${t('age_advice')} :</b> ${esc(L(AGE_ADVICE(p.age)))}</p>
      ${notes.map((n) => `<p class="tip-line">🩹 ${esc(n)}</p>`).join('')}
      <p class="small muted">${t('formulas')}</p></section>`;
  }

  function viewHistory() {
    const ws = D.workouts.slice().reverse();
    const st = muscleState();
    return `${header(t('history'))}
      <section class="card"><h2>${t('weekly_volume')}</h2>${MUSCLES.map((m) => macroBarRaw(m.icon + ' ' + L(m.name).split(' (')[0], st[m.id].sets, st[m.id].target, t('sets'))).join('')}</section>
      ${ws.length ? ws.map((w) => `<section class="card"><h3>${new Date(w.time).toLocaleString(I18N.lang === 'ar' ? 'ar-TN' : I18N.lang)}</h3><ul>${w.ex.map((x) => `<li><b>${esc(L(EX[x.id]?.name))}</b> — ${x.sets.map((s) => (s.kg ? s.kg + 'kg×' : '') + s.reps).join(', ')}</li>`).join('')}</ul></section>`).join('') : `<p class="muted">${t('no_history')}</p>`}`;
  }
  const macroBarRaw = (label, v, max, unit) => `<div class="mb"><div class="mb-top"><span>${esc(label)}</span><span><bdi>${round(v, 1)} / ${max}</bdi> ${unit}</span></div><div class="bar"><i style="width:${Math.min(100, (100 * v) / (max || 1))}%"></i></div></div>`;

  function viewScience() {
    return `${header(t('science'))}${SCIENCE.map((s) => `<section class="card"><h2>${esc(L(s.title))}</h2><p>${esc(L(s.text))}</p></section>`).join('')}<p class="small muted disclaimer">⚕️ ${t('disclaimer')}</p>`;
  }

  // ------------------------------------------------------------------ theme & app modes
  function applyTheme() {
    const th = store.get('fc_theme', 'auto');
    if (th === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = th;
  }
  const MODES = [
    ['healthy', '🥗', 'mode_healthy', 'mode_healthy_d'],
    ['coach', '🏋️', 'mode_coach', 'mode_coach_d'],
    ['pro', '⭐', 'mode_pro', 'mode_pro_d'],
  ];
  const mode = () => (D && D.prefs.mode) || 'coach';
  function viewMode() {
    return `${header(t('choose_mode'), false)}<p class="muted">${t('choose_mode_d')}</p>
      <div class="mode-list">${MODES.map(([id, ic, n, d]) => `<button class="mode-card ${mode() === id && D.prefs.mode ? 'on' : ''} m-${id}" data-act="setMode" data-id="${id}"><span class="mode-ic">${ic}</span><span><b>${t(n)}</b><small>${t(d)}</small></span></button>`).join('')}</div>`;
  }

  // ------------------------------------------------------------------ 4-month programme
  const SLOT_OK = (id) => EX[id] && canDo(EX[id]) && !avoid(EX[id]);
  function progCtx() {
    return {
      level: LEVEL(),
      ex: (id) => EX[id],
      pick(slot, variant, phase, used) {
        const pool = Program.SLOTS[slot].filter((id) => SLOT_OK(id) && !used.has(id) && (EX[id].level <= LEVEL() + (phase >= 3 ? 1 : 0)) && !(D.prefs.swaps[id] >= 3));
        if (!pool.length) return null;
        return EX[pool[(variant + Math.floor((phase - 1) / 2)) % pool.length]];
      },
    };
  }
  const progWeek = (w) => Program.week(D.program, w, progCtx());
  function progCurrentWeek() {
    const p = D.program; if (!p) return 0;
    return Math.max(1, Math.min(Program.WEEKS, Math.floor((Date.now() - p.start) / (7 * DAY)) + 1));
  }
  const progDone = (key) => !!(D.program && D.program.done && D.program.done[key]);
  function progNext() {
    if (!D.program) return null;
    const w = progCurrentWeek();
    const wk = progWeek(w);
    const s = wk.sessions.find((x) => !progDone(x.key));
    return { week: wk, session: s || null };
  }
  function mondayOf(d = new Date()) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime(); }
  function createProgram(type) {
    const p = D.profile || {};
    D.program = { type, start: mondayOf(), goal: p.goal || 'fit', days: +(p.days || 3), volume: 1, done: {}, checkins: {}, tests: {}, manual: type === 'manual' ? defaultManual() : null, deload: true };
    saveData();
  }
  function defaultManual() {
    return [{ name: t('day') + ' 1', items: [] }, { name: t('day') + ' 2', items: [] }, { name: t('day') + ' 3', items: [] }];
  }
  const repsTxt = (it) => (it.hold ? `${it.sets} × ${it.hold}${t('seconds')}` : `${it.sets} × ${it.reps[0]}–${it.reps[1]}`);
  function sessionHtml(s, w, open) {
    const done = progDone(s.key);
    return `<details class="sess ${done ? 'done' : ''}" ${open ? 'open' : ''}><summary><span class="sess-st">${done ? '✅' : '▶'}</span><b>${esc(L(s.name) || s.name)}</b><span class="small muted">${s.items.length} ${t('exercises_short')}</span></summary>
      <ol class="sess-list">${s.items.map((it) => `<li><button class="link" data-act="ex" data-id="${it.id}">${esc(L(EX[it.id].name))}</button><span class="small muted"> ${repsTxt(it)}${it.rir != null ? ` · RIR ${it.rir}` : ''}${it.rest ? ` · ${t('rest')} ${it.rest}${t('seconds')}` : ''}${it.tempo ? ` · tempo ${it.tempo}` : ''}</span></li>`).join('')}
      ${(s.cardio || []).map((c) => `<li class="cardio">🏃 ${esc(L(Program.CARDIO[c.kind]))} — ${c.min} min</li>`).join('')}</ol>
      ${s.items.length ? `<button class="btn ${done ? '' : 'primary'} full" data-act="startProg" data-w="${w}" data-key="${s.key}">${done ? '↻ ' + t('redo') : '▶ ' + t('start_workout')}</button>` : ''}</details>`;
  }
  let progView = 0; // week shown in the programme page (0 = current)
  function viewProgram() {
    const p = D.program;
    if (!p) {
      return `${header(t('program'), stack.length > 1)}
        <p class="muted">${t('program_intro')}</p>
        <button class="choice-card" data-act="progCreate" data-type="auto"><span class="ch-ic">🧠</span><span><b>${t('prog_auto')}</b><small>${t('prog_auto_d')}</small></span></button>
        <button class="choice-card" data-act="progCreate" data-type="manual"><span class="ch-ic">✍️</span><span><b>${t('prog_manual')}</b><small>${t('prog_manual_d')}</small></span></button>
        <section class="card tip"><h2>🔬 ${t('prog_science')}</h2><ul>${Program.PHASES.map((ph, i) => `<li><b>${t('weeks')} ${i * 4 + 1}–${i * 4 + 4} · ${esc(L(ph.name))}</b> — ${esc(L(ph.info))}</li>`).join('')}</ul></section>`;
    }
    const cw = progCurrentWeek();
    const w = progView || cw;
    const wk = progWeek(w);
    const ph = Program.PHASES[wk.phase - 1];
    const nDone = Object.keys(p.done || {}).length;
    const total = Array.from({ length: Program.WEEKS }, (_, i) => progWeek(i + 1).sessions.filter((s) => s.items.length).length).reduce((a, b) => a + b, 0);
    const ci = p.checkins[cw - 1];
    return `${header(t('program'), stack.length > 1)}
      <section class="card hero"><div class="hero-bg"></div><small>${p.type === 'auto' ? '🧠 ' + t('prog_auto') : '✍️ ' + t('prog_manual')}</small>
        <h2>${t('week')} ${cw} / ${Program.WEEKS}</h2><div class="bar light"><i style="width:${(100 * nDone) / Math.max(1, total)}%"></i></div>
        <p class="small">${nDone} / ${total} ${t('sessions_done')}${p.volume !== 1 ? ` · ${t('volume')} ${Math.round(p.volume * 100)}%` : ''}</p></section>
      ${cw > 1 && !ci && p.type === 'auto' ? `<section class="card checkin"><h2>📝 ${t('checkin')}</h2><p class="small muted">${t('checkin_d')}</p>
        <form id="ciForm">${[['fatigue', 'ci_fatigue'], ['soreness', 'ci_soreness'], ['sleepq', 'ci_sleep']].map(([n, k]) => `<label>${t(k)}<div class="scale">${[1, 2, 3, 4, 5].map((v) => `<label class="sc"><input type="radio" name="${n}" value="${v}" ${v === 3 ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div></label>`).join('')}
        <label>${t('weight')}<input name="weight" type="number" step="0.1" inputmode="decimal" value="${D.profile?.weight || ''}"></label>
        <button class="btn primary full" type="submit">${t('save')}</button></form></section>` : ''}
      ${ci && ci.msg ? `<p class="card small adjust">🤖 ${esc(ci.msg)}</p>` : ''}
      <div class="week-nav"><button class="icon" data-act="progWeek" data-d="-1" ${w <= 1 ? 'disabled' : ''}>‹</button><div><b>${t('week')} ${w}</b>${w === cw ? ` <span class="badge">${t('this_week_b')}</span>` : ''}<div class="small muted">${esc(L(ph.name))}${wk.deload ? ' · 🧘 ' + t('deload') : ''}</div></div><button class="icon" data-act="progWeek" data-d="1" ${w >= Program.WEEKS ? 'disabled' : ''}>›</button></div>
      <p class="small muted">${esc(L(ph.info))}</p>
      <div class="phase-strip">${Array.from({ length: Program.WEEKS }, (_, i) => `<button data-act="progGoto" data-w="${i + 1}" class="ps ph${Program.phaseOf(i + 1)} ${i + 1 === w ? 'on' : ''} ${i + 1 < cw ? 'past' : ''} ${Program.isDeload(i + 1) ? 'dl' : ''}">${i + 1}</button>`).join('')}</div>
      ${wk.sessions.map((s, i) => sessionHtml(s, w, w === cw && i === wk.sessions.findIndex((x) => !progDone(x.key)))).join('')}
      ${wk.test ? testCard(w) : ''}
      <div class="row">${p.type === 'manual' ? `<button class="btn" data-act="progEdit">✏️ ${t('edit_program')}</button>` : ''}<button class="btn" data-act="progReset">🔄 ${t('change_program')}</button></div>`;
  }
  function testCard(w) {
    const r = (D.program.tests || {})[w] || {};
    const base = (D.program.tests || {})[1] || {};
    return `<section class="card"><h2>📊 ${t(w === 1 ? 'test_start' : 'test_end')}</h2><form id="testForm" data-w="${w}">${Program.TESTS.map((x) => `<label class="test-row"><span>${esc(L(x.name))}${w === 16 && base[x.id] ? ` <small class="muted">(${t('before')} : ${base[x.id]})</small>` : ''}</span><input name="${x.id}" type="number" inputmode="decimal" step="0.1" value="${r[x.id] ?? ''}"></label>`).join('')}
      <button class="btn primary full" type="submit">${t('save')}</button></form></section>`;
  }
  function viewProgEdit() {
    const m = D.program.manual;
    return `${header(t('edit_program'))}<p class="small muted">${t('manual_hint')}</p>
      ${m.map((d, i) => `<section class="card"><div class="row between"><input class="day-name" data-day="${i}" value="${esc(d.name)}"><button class="icon sm" data-act="dayDel" data-i="${i}">✕</button></div>
        <ul class="man-list">${d.items.map((it, j) => `<li><span>${esc(L(EX[it.id].name))}</span><input type="number" inputmode="numeric" data-man="${i}:${j}:sets" value="${it.sets}" min="1" max="10"><span>×</span>${it.hold ? `<input type="number" data-man="${i}:${j}:hold" value="${it.hold}"><span>${t('seconds')}</span>` : `<input type="number" data-man="${i}:${j}:r0" value="${it.reps[0]}"><span>–</span><input type="number" data-man="${i}:${j}:r1" value="${it.reps[1]}">`}<button class="icon sm" data-act="manDel" data-i="${i}" data-j="${j}">✕</button></li>`).join('')}</ul>
        <button class="btn sm" data-act="manAdd" data-i="${i}">＋ ${t('add_exercise')}</button></section>`).join('')}
      <button class="btn full" data-act="dayAdd">＋ ${t('add_day')}</button>
      <label class="check-l"><input type="checkbox" id="manDeload" ${D.program.deload !== false ? 'checked' : ''}> ${t('auto_deload')}</label>
      <button class="btn primary big full" data-act="progSave">💾 ${t('save')}</button>`;
  }
  function pickExercise(day) {
    const list = EXERCISES.concat(LIB).filter(canDo);
    const rows = (q) => list.filter((e) => !q || [e.name.fr, e.name.en, e.name.ar, e.nameEN || '', L(MU[e.group].name)].some((n) => n.toLowerCase().includes(q))).slice(0, 60)
      .map((e) => `<button class="food-row" data-act="manPick" data-i="${day}" data-id="${e.id}"><span class="fr-ic">${e.lib ? '📸' : MU[e.group].icon}</span><span class="fr-name">${esc(L(e.name))}<small class="muted">${esc(short(e.group))} · ${esc(L(EQUIP[e.equip[0]]) || e.equip[0])}</small></span></button>`).join('');
    openModal(`<div class="sheet-handle"></div><h2>${t('add_exercise')}</h2><input id="pickQ" class="search" placeholder="${t('search_ex')}"><div id="pickList" class="food-list">${rows('')}</div>`);
    $('#pickQ').oninput = (ev) => { $('#pickList').innerHTML = rows(ev.target.value.trim().toLowerCase()); };
  }
  function checkinAdjust(ci) {
    // fatigue / soreness high or poor sleep -> less volume ; everything done + fresh -> a bit more
    const p = D.program;
    const prevW = progCurrentWeek() - 1;
    const prev = progWeek(prevW).sessions.filter((s) => s.items.length);
    const completion = prev.length ? prev.filter((s) => progDone(s.key)).length / prev.length : 1;
    let v = p.volume || 1, msg;
    if (ci.fatigue >= 4 || ci.soreness >= 4 || ci.sleepq <= 2) { v = Math.max(0.7, v - 0.15); msg = t('adj_down'); }
    else if (completion >= 0.99 && ci.fatigue <= 2 && ci.soreness <= 3) { v = Math.min(1.3, v + 0.1); msg = t('adj_up'); }
    else if (completion < 0.6) { v = Math.max(0.8, v - 0.1); msg = t('adj_missed'); }
    else msg = t('adj_keep');
    p.volume = Math.round(v * 100) / 100;
    ci.msg = msg + ` (${t('volume')} ${Math.round(p.volume * 100)}%)`;
  }

  // ------------------------------------------------------------------ health (doctor mode)
  const HFORMS = {
    bp: [['sys', 'h_sys', 'mmHg'], ['dia', 'h_dia', 'mmHg']], hr: [['val', 'h_bpm', 'bpm']], glucose: [['val', 'h_glu', 'g/L']],
    spo2: [['val', 'h_spo2', '%']], weight: [['val', 'weight', 'kg']], waist: [['val', 'waist', 'cm']], sleep: [['val', 'h_sleep', 'h']], temp: [['val', 'h_temp', '°C']],
  };
  let hType = 'bp';
  function hValue(e) {
    if (e.type === 'bp') return `${e.v.sys}/${e.v.dia}`;
    return String(e.v.val);
  }
  function hInterp(e) { return Health.interpret(e, D.profile); }
  function viewHealth() {
    const log = (D.health || []).slice().sort((a, b) => b.t - a.t);
    const latest = {};
    for (const e of log) if (!latest[e.type]) latest[e.type] = e;
    const ready = Health.readiness(log);
    const intake = {};
    for (const k of Object.keys(D.food)) intake[k] = dayTotals(k).kcal;
    const ad = Health.adaptiveTdee(log.filter((e) => e.type === 'weight'), intake);
    const parq = D.prefs.parq;
    return `${header(t('health'), stack.length > 1)}
      <div class="quick-links"><button class="card linkcard" data-act="openDevices">⌚ ${t('devices')}</button><button class="card linkcard" data-act="openReports">📊 ${t('reports')}</button></div>
      ${ready ? `<section class="card ready r-${ready}"><h2>${{ go: '🟢', light: '🟡', rest: '🔴' }[ready]} ${t('ready_' + ready)}</h2><p class="small">${t('ready_' + ready + '_d')}</p></section>` : ''}
      <section class="card"><h2>🩺 ${t('my_measures')}</h2><div class="vitals">${Object.keys(Health.TYPES).map((k) => { const e = latest[k]; const it = e ? hInterp(e) : null; return `<button class="vital ${it ? 'lv-' + it[0] : ''}" data-act="hType" data-id="${k}"><span>${Health.TYPES[k].icon}</span><b>${e ? esc(hValue(e)) : '—'}</b><small>${esc(L(Health.TYPES[k].name))}</small></button>`; }).join('')}</div></section>
      <section class="card"><h2>➕ ${t('add_measure')}</h2>
        <div class="chips scroll">${Object.keys(Health.TYPES).map((k) => `<button class="chip ${hType === k ? 'on' : ''}" data-act="hType" data-id="${k}">${Health.TYPES[k].icon} ${esc(L(Health.TYPES[k].name))}</button>`).join('')}</div>
        <form id="hForm" class="h-form">${HFORMS[hType].map(([n, k, u]) => `<label>${t(k)} <small class="muted">(${u})</small><input name="${n}" type="number" step="0.01" inputmode="decimal" required></label>`).join('')}
          ${hType === 'glucose' ? `<label>${t('h_when')}<select name="ctx"><option value="fasting">${t('h_fasting')}</option><option value="after">${t('h_after')}</option></select></label>` : ''}
          <button class="btn primary full" type="submit">${t('save')}</button></form>
        ${latest[hType] ? (() => { const it = hInterp(latest[hType]); return it[1] ? `<p class="remark lv-${it[0]}">${esc(L(it[1]))}</p>` : ''; })() : ''}
        <ul class="h-hist">${log.filter((e) => e.type === hType).slice(0, 8).map((e) => { const it = hInterp(e); return `<li><span class="dot lv-${it[0]}"></span><b>${esc(hValue(e))}</b><span class="small muted">${new Date(e.t).toLocaleDateString(I18N.lang === 'ar' ? 'ar-TN' : I18N.lang)}${e.v.ctx === 'after' ? ' · ' + t('h_after') : ''}</span></li>`; }).join('')}</ul></section>
      ${ad ? `<section class="card"><h2>🔥 ${t('real_metabolism')}</h2><p class="big-txt">${ad.tdee} kcal / ${t('per_day')}</p><p class="small muted">${t('real_metabolism_d', { i: ad.intake, s: ad.slopeWeek, n: ad.days })}</p></section>` : `<p class="small muted card">🔥 ${t('real_metabolism_need')}</p>`}
      <section class="card"><h2>📋 ${t('parq_title')}</h2>${parq ? `<p class="${parq.yes ? 'remark lv-warn' : 'remark lv-ok'}">${t(parq.yes ? 'parq_yes' : 'parq_no')}</p><button class="btn sm" data-act="parqRedo">${t('redo')}</button>` : `<p class="small muted">${t('parq_d')}</p>
        <form id="parqForm">${Health.PARQ.map((q, i) => `<div class="parq-q"><p>${i + 1}. ${esc(L(q))}</p><div class="seg"><label><input type="radio" name="q${i}" value="1" required> ${t('yes')}</label><label><input type="radio" name="q${i}" value="0"> ${t('no')}</label></div></div>`).join('')}<button class="btn primary full" type="submit">${t('save')}</button></form>`}</section>
      <section class="card warn"><h2>🚨 ${t('red_flags')}</h2><ul>${Health.RED_FLAGS.map((r) => `<li>${esc(L(r))}</li>`).join('')}</ul><p><b>${t('red_flags_do')}</b></p></section>
      <button class="btn full" data-act="healthReport">📄 ${t('health_report')}</button>
      <p class="small muted disclaimer">⚕️ ${t('disclaimer')}</p>`;
  }
  function healthReport() {
    const b = body();
    const now = Date.now();
    const last30 = (D.health || []).filter((e) => now - e.t < 30 * DAY);
    const avg = (type, f) => { const xs = last30.filter((e) => e.type === type).map(f); return xs.length ? Math.round((xs.reduce((a, c) => a + c, 0) / xs.length) * 10) / 10 : null; };
    const days = Object.keys(D.food).filter((k) => now - new Date(k).getTime() < 30 * DAY && (D.food[k] || []).length);
    const kcal = days.length ? Math.round(days.reduce((a, k) => a + dayTotals(k).kcal, 0) / days.length) : null;
    const prot = days.length ? Math.round(days.reduce((a, k) => a + dayTotals(k).p, 0) / days.length) : null;
    const wk = D.workouts.filter((w) => now - w.time < 30 * DAY).length;
    const lines = [
      `FitCoach — ${t('health_report')} (${new Date().toLocaleDateString()})`,
      `${t('profile')}: ${D.profile ? `${D.profile.age} ${t('years')}, ${D.profile.height} cm, ${D.profile.weight} kg` : '—'}`,
      b ? `${t('bmi')}: ${round(b.bmi, 1)} (${t(b.bmiCat)})` : '',
      avg('bp', (e) => e.v.sys) ? `${L(Health.TYPES.bp.name)}: ${avg('bp', (e) => e.v.sys)}/${avg('bp', (e) => e.v.dia)} mmHg (${t('avg30')})` : '',
      avg('hr', (e) => e.v.val) ? `${L(Health.TYPES.hr.name)}: ${avg('hr', (e) => e.v.val)} bpm` : '',
      avg('glucose', (e) => e.v.val) ? `${L(Health.TYPES.glucose.name)}: ${avg('glucose', (e) => e.v.val)} g/L` : '',
      avg('sleep', (e) => e.v.val) ? `${L(Health.TYPES.sleep.name)}: ${avg('sleep', (e) => e.v.val)} h` : '',
      `${t('workouts_30')}: ${wk}`,
      kcal ? `${t('avg_intake')}: ${kcal} kcal, ${t('protein')} ${prot} g` : '',
      D.prefs.parq ? `PAR-Q: ${D.prefs.parq.yes ? t('parq_yes_short') : 'OK'}` : '',
    ].filter(Boolean).join('\n');
    openModal(`<div class="sheet-handle"></div><h2>📄 ${t('health_report')}</h2><pre class="report">${esc(lines)}</pre>
      <div class="row"><button class="btn primary" data-act="shareReport">📤 ${t('share')}</button><button class="btn" data-act="copy" data-v="${esc(lines)}">📋 ${t('copy')}</button></div>
      <button class="btn full" data-act="closeModal">${t('close')}</button>`);
    window.__report = lines;
  }

  // ------------------------------------------------------------------ settings (security, theme, mode)
  function settingsCard() {
    const u = users()[user] || {};
    const th = store.get('fc_theme', 'auto');
    const bio = NATIVE && Android.biometricAvailable && Android.biometricAvailable();
    return `<section class="card"><h2>⚙️ ${t('settings')}</h2>
      <label>${t('app_mode')}</label><div class="seg">${MODES.map(([id, ic, n]) => `<button data-act="setMode" data-id="${id}" data-stay="1" class="${mode() === id ? 'on' : ''}">${ic} ${t(n)}</button>`).join('')}</div>
      <label>${t('theme')}</label><div class="seg">${[['auto', '🌗', 'theme_auto'], ['light', '☀️', 'theme_light'], ['dark', '🌙', 'theme_dark']].map(([v, ic, k]) => `<button data-act="theme" data-v="${v}" class="${th === v ? 'on' : ''}">${ic} ${t(k)}</button>`).join('')}</div></section>
      <section class="card sec-card"><h2>🛡️ ${t('security')}</h2>
        <p class="small muted">${t('security_d')}</p>
        <ul class="sec-list"><li>✅ ${t('sec_enc')}</li><li>✅ ${t('sec_lockout')}</li><li>✅ ${t('sec_backup')}</li><li>✅ ${t('sec_https')}</li></ul>
        <p class="small"><b>${t('account')} :</b> ${esc(u.email || displayName())} · ${u.kind === 'google' ? 'Google' : t('password')}</p>
        ${bio ? `<label class="check-l"><input type="checkbox" data-act="secLock" ${u.lock ? 'checked' : ''}> 🔐 ${t('sec_bio')}</label>` : `<p class="small muted">🔐 ${t('sec_bio_na')}</p>`}
        ${NATIVE ? `<label class="check-l"><input type="checkbox" data-act="secScreen" ${u.secure ? 'checked' : ''}> 🙈 ${t('sec_screen')}</label>` : ''}
        ${u.kind === 'password' ? `<details><summary>${t('change_pw')}</summary><form id="pwForm"><label>${t('password')}<input name="old" type="password" required></label><label>${t('new_password')}<input name="n1" type="password" required></label><label>${t('password2')}<input name="n2" type="password" required></label><p class="err" id="pwErr"></p><button class="btn primary full" type="submit">${t('save')}</button></form></details>` : ''}
        <details><summary class="danger">${t('delete_account')}</summary><p class="small">${t('delete_d')}</p><form id="delForm">${u.kind === 'password' ? `<label>${t('password')}<input name="p" type="password" required></label>` : ''}<p class="err" id="delErr"></p><button class="btn danger-btn full" type="submit">🗑️ ${t('delete_account')}</button></form></details>
      </section>`;
  }

  // ------------------------------------------------------------------ smartwatches & sensors
  const liveWear = { devices: {}, scanning: false, state: null, devId: null, hr: null, hrT: 0, last: {} };
  const WATCH_APPS = [
    ['⌚', 'Samsung Galaxy Watch', 'Samsung Health'], ['⌚', 'Google Pixel Watch / Fitbit', 'Fitbit'], ['⌚', 'Wear OS (Mobvoi, Fossil…)', 'Google Fit / Health Connect'],
    ['⌚', 'Garmin', 'Garmin Connect'], ['⌚', 'Xiaomi / Redmi', 'Mi Fitness'], ['⌚', 'Amazfit', 'Zepp'], ['⌚', 'Huawei / Honor', 'Huawei Health + Health Sync'],
    ['⌚', 'Withings', 'Withings Health Mate'], ['⌚', 'Polar', 'Polar Flow'], ['💍', 'Oura', 'Oura'],
  ];
  const hasHC = () => NATIVE && Android.hcStatus;
  const nativeHttp = (fn) => new Promise((res, rej) => fn(reg({ done: (txt, err) => (err ? rej(new Error(err)) : res(txt)) })));
  async function hcSync(days = 400, silent = false) {
    if (!hasHC() || Android.hcStatus() !== 'available') { if (!silent) toast(t('hc_unavailable')); return; }
    if (!silent) toast(t('syncing'));
    try {
      const j = JSON.parse(await nativeHttp((cb) => Android.hcRead(days, cb)));
      D.wear = D.wear || { days: {} };
      for (const d of j.days) D.wear.days[d.date] = Object.assign(D.wear.days[d.date] || {}, d);
      const seen = new Set((D.health || []).map((e) => e.type + '@' + e.t));
      let n = 0;
      for (const m of j.measures) if (!seen.has(m.type + '@' + m.t)) { D.health.push(Object.assign(m, { src: 'watch' })); n++; }
      D.wear.lastSync = Date.now(); D.wear.hc = true; D.wear.granted = j.granted;
      saveData();
      if (!silent) toast(t('synced', { d: j.days.length, m: n }));
      if (['devices', 'reports', 'home', 'health'].includes(current)) render();
    } catch (e) { if (!silent) toast(t('sync_error') + ' ' + e.message); }
  }
  function onWear(o) {
    if (o.type === 'device') { liveWear.devices[o.id] = o; if (current === 'devices') renderDevList(); }
    else if (o.type === 'scanEnd') { liveWear.scanning = false; if (current === 'devices') render(); }
    else if (o.type === 'state') {
      liveWear.state = o.state; liveWear.devId = o.id;
      if (o.state === 'connected') { const dv = liveWear.devices[o.id]; D.wear = D.wear || { days: {} }; D.wear.ble = { id: o.id, name: dv ? dv.name : o.id }; saveData(); toast('🔗 ' + t('connected')); }
      if (current === 'devices') render();
    } else if (o.type === 'hr') {
      liveWear.hr = o.bpm; liveWear.hrT = Date.now();
      if (W) { W.hr = W.hr || []; if (W.hr.length < 5000) W.hr.push([Date.now(), o.bpm]); }
      const el = $('#liveHr'); if (el) el.innerHTML = hrBadge();
      const el2 = $('#devHr'); if (el2) el2.innerHTML = hrBig();
    } else if (o.type === 'bp' || o.type === 'spo2' || o.type === 'weight') {
      liveWear.last[o.type] = o;
      const v = o.type === 'bp' ? { sys: o.sys, dia: o.dia } : { val: o.type === 'weight' ? o.kg : o.val };
      D.health.push({ t: o.t, type: o.type, v, src: 'ble' });
      if (o.type === 'bp' && o.pulse) D.health.push({ t: o.t, type: 'hr', v: { val: o.pulse }, src: 'ble' });
      if (o.type === 'weight' && D.profile) D.profile.weight = o.kg;
      saveData(); toast('✅ ' + L(Health.TYPES[o.type].name) + ' : ' + (o.type === 'bp' ? `${o.sys}/${o.dia}` : v.val));
      if (current === 'devices' || current === 'health') render();
    } else if (o.type === 'error') toast(t('ble_error') + ' (' + o.msg + ')');
  }
  const hrMax = () => Math.round(208 - 0.7 * (D.profile?.age || 30)); // Tanaka 2001
  function hrZone(bpm) {
    const p = bpm / hrMax();
    return p < 0.6 ? 1 : p < 0.7 ? 2 : p < 0.8 ? 3 : p < 0.9 ? 4 : 5;
  }
  const hrFresh = () => liveWear.hr && Date.now() - liveWear.hrT < 10000;
  const hrBadge = () => (hrFresh() ? `<span class="hr-badge z${hrZone(liveWear.hr)}">❤️ ${liveWear.hr} <small>bpm · Z${hrZone(liveWear.hr)}</small></span>` : '');
  const hrBig = () => (hrFresh() ? `<div class="hr-big z${hrZone(liveWear.hr)}"><b>${liveWear.hr}</b><span>bpm</span><small>${t('zone')} ${hrZone(liveWear.hr)} · ${t('zone' + hrZone(liveWear.hr))}</small></div>` : `<p class="small muted">${t('no_live_hr')}</p>`);
  // calories from heart rate (Keytel et al. 2005)
  function hrKcal(samples) {
    if (!samples || samples.length < 10 || !D.profile) return null;
    const p = D.profile, male = p.sex !== 'f';
    let kcal = 0;
    for (let i = 1; i < samples.length; i++) {
      const dtMin = Math.min(1, (samples[i][0] - samples[i - 1][0]) / 60000);
      const h = samples[i][1];
      const perMin = male ? (-55.0969 + 0.6309 * h + 0.1988 * p.weight + 0.2017 * p.age) / 4.184 : (-20.4022 + 0.4472 * h - 0.1263 * p.weight + 0.074 * p.age) / 4.184;
      kcal += Math.max(0, perMin) * dtMin;
    }
    return Math.round(kcal);
  }
  function renderDevList() {
    const box = $('#devList'); if (!box) return;
    const list = Object.values(liveWear.devices).sort((a, b) => b.rssi - a.rssi);
    const ic = { hr: '❤️', bp: '🩸', spo2: '🫁', weight: '⚖️' };
    box.innerHTML = list.map((d) => `<button class="food-row" data-act="bleConnect" data-id="${esc(d.id)}"><span class="fr-ic">${d.kinds.map((k) => ic[k]).join('') || '📶'}</span><span class="fr-name">${esc(d.name)}<small class="muted">${d.kinds.length ? d.kinds.map((k) => t('kind_' + k)).join(', ') : t('kind_unknown')} · ${d.rssi} dBm</small></span>${liveWear.devId === d.id && liveWear.state === 'connected' ? '<span class="badge p">✓</span>' : ''}</button>`).join('') || (liveWear.scanning ? `<p class="small muted"><span class="spinner"></span> ${t('scanning')}</p>` : '');
  }
  function viewDevices() {
    const st = hasHC() ? Android.hcStatus() : 'web';
    const w = D.wear || {};
    const last = w.lastSync ? new Date(w.lastSync).toLocaleString(I18N.lang === 'ar' ? 'ar-TN' : I18N.lang) : '—';
    return `${header(t('devices'))}
      <p class="muted">${t('devices_intro')}</p>
      <section class="card"><h2>🔄 ${t('hc_title')}</h2><p class="small muted">${t('hc_desc')}</p>
        <p class="small"><b>${t('status')} :</b> ${t('hc_' + st)}${w.hc ? ` · ${t('last_sync')} : ${esc(last)}` : ''}</p>
        ${st === 'available' ? `<div class="row"><button class="btn primary" data-act="hcConnect">⌚ ${t(w.hc ? 'sync_now' : 'hc_connect')}</button><button class="btn" data-act="hcOpen">⚙️ Health Connect</button></div>`
          : st === 'web' ? '' : `<button class="btn primary full" data-act="hcOpen">⬇️ ${t('hc_install')}</button>`}
        <details><summary>${t('compatible_watches')}</summary><ul class="watch-list">${WATCH_APPS.map(([i, b, a]) => `<li>${i} <b>${esc(b)}</b> <span class="muted">— ${esc(a)}</span></li>`).join('')}</ul><p class="small muted">${t('hc_howto')}</p></details></section>
      <section class="card"><h2>📶 ${t('ble_title')}</h2><p class="small muted">${t('ble_desc')}</p>
        <div id="devHr">${hrBig()}</div>
        ${liveWear.state === 'connected' ? `<p class="small">🔗 ${t('connected')} : <b>${esc((liveWear.devices[liveWear.devId] || {}).name || w.ble?.name || '')}</b></p><button class="btn full" data-act="bleDisconnect">${t('disconnect')}</button>` : ''}
        ${NATIVE ? `<button class="btn primary full" data-act="bleScan">${liveWear.scanning ? '…' : '🔍 ' + t('ble_scan')}</button>` : `<p class="small muted">${t('needs_app')}</p>`}
        <div id="devList" class="food-list"></div>
        <details><summary>${t('ble_howto_t')}</summary><ul class="small"><li>${t('ble_howto1')}</li><li>${t('ble_howto2')}</li><li>${t('ble_howto3')}</li><li>${t('ble_howto4')}</li></ul></details></section>
      <button class="card linkcard" data-act="openReports">📊 ${t('reports')} →</button>
      <p class="small muted">🔒 ${t('wear_privacy')}</p>`;
  }

  // ------------------------------------------------------------------ reports (day / week / month / year)
  let rep = { period: 'week', anchor: null };
  const dkey = (d) => todayKey(d);
  function rangeOf(period, anchor) {
    const a = new Date(anchor);
    if (period === 'day') return [new Date(a.getFullYear(), a.getMonth(), a.getDate()), 1];
    if (period === 'week') { const m = new Date(mondayOf(a)); return [m, 7]; }
    if (period === 'month') { const m = new Date(a.getFullYear(), a.getMonth(), 1); return [m, new Date(a.getFullYear(), a.getMonth() + 1, 0).getDate()]; }
    const y = new Date(a.getFullYear(), 0, 1); return [y, (new Date(a.getFullYear() + 1, 0, 1) - y) / DAY];
  }
  function dayData(k) {
    const w = (D.wear && D.wear.days[k]) || {};
    const ws = D.workouts.filter((x) => dkey(new Date(x.time)) === k);
    const tot = dayTotals(k);
    const meas = (D.health || []).filter((e) => dkey(new Date(e.t)) === k);
    const last = (type) => { const xs = meas.filter((e) => e.type === type); return xs.length ? xs[xs.length - 1] : null; };
    return {
      k, steps: w.steps ?? null, km: w.km ?? null, active: w.active ?? null, total: w.total ?? null, rhr: w.rhr ?? (last('hr') ? last('hr').v.val : null), hrAvg: w.hrAvg ?? null, hrMax: w.hrMax ?? null,
      sleep: w.sleepMin != null ? w.sleepMin / 60 : (last('sleep') ? last('sleep').v.val : null), exMin: Math.max(w.exMin || 0, ws.reduce((a, x) => a + (x.min || 0), 0)) || null,
      workouts: ws.length, wkKcal: ws.reduce((a, x) => a + (x.kcal || 0), 0), kcalIn: tot.kcal || null, protein: tot.p || null,
      weight: last('weight') ? last('weight').v.val : null, sys: last('bp') ? last('bp').v.sys : null, dia: last('bp') ? last('bp').v.dia : null,
      glucose: last('glucose') ? last('glucose').v.val : null, spo2: last('spo2') ? last('spo2').v.val : null,
    };
  }
  function seriesFor(period, anchor) {
    const [start, n] = rangeOf(period, anchor);
    const days = Array.from({ length: n }, (_, i) => dayData(dkey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))));
    if (period !== 'year') return { days, buckets: days.map((d) => ({ label: period === 'month' ? String(new Date(d.k).getDate()) : new Date(d.k).toLocaleDateString(I18N.lang === 'ar' ? 'ar-TN' : I18N.lang, { weekday: 'short' }), d })) };
    const months = Array.from({ length: 12 }, (_, m) => days.filter((d) => new Date(d.k).getMonth() === m));
    const avgOf = (arr, f) => { const xs = arr.map(f).filter((v) => v != null); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; };
    const sumOf = (arr, f) => arr.reduce((a, d) => a + (f(d) || 0), 0);
    return {
      days,
      buckets: months.map((arr, m) => ({
        label: new Date(2026, m, 1).toLocaleDateString(I18N.lang === 'ar' ? 'ar-TN' : I18N.lang, { month: 'short' }),
        d: { steps: avgOf(arr, (d) => d.steps), sleep: avgOf(arr, (d) => d.sleep), rhr: avgOf(arr, (d) => d.rhr), weight: avgOf(arr, (d) => d.weight), sys: avgOf(arr, (d) => d.sys), dia: avgOf(arr, (d) => d.dia), kcalIn: avgOf(arr, (d) => d.kcalIn), active: avgOf(arr, (d) => d.active), exMin: sumOf(arr, (d) => d.exMin), workouts: sumOf(arr, (d) => d.workouts) },
      })),
    };
  }
  function stats(days) {
    const avg = (f) => { const xs = days.map(f).filter((v) => v != null && !Number.isNaN(v)); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; };
    const first = (f) => { const d = days.find((x) => f(x) != null); return d ? f(d) : null; };
    const lastv = (f) => { const d = days.slice().reverse().find((x) => f(x) != null); return d ? f(d) : null; };
    return {
      steps: avg((d) => d.steps), sleep: avg((d) => d.sleep), rhr: avg((d) => d.rhr), active: avg((d) => d.active), kcalIn: avg((d) => d.kcalIn), protein: avg((d) => d.protein),
      sys: avg((d) => d.sys), dia: avg((d) => d.dia), glucose: avg((d) => d.glucose), spo2: avg((d) => d.spo2),
      exMin: days.reduce((a, d) => a + (d.exMin || 0), 0), workouts: days.reduce((a, d) => a + d.workouts, 0),
      wFirst: first((d) => d.weight), wLast: lastv((d) => d.weight),
    };
  }
  function barChart(buckets, f, opts = {}) {
    const vals = buckets.map((b) => f(b.d));
    const max = Math.max(opts.goal || 0, ...vals.map((v) => v || 0)) || 1;
    const n = buckets.length, W = 320, H = 120, bw = W / n;
    const bars = vals.map((v, i) => v == null ? '' : `<rect x="${(i * bw + bw * 0.15).toFixed(1)}" y="${(H - (H * v) / max).toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${((H * v) / max).toFixed(1)}" rx="2" class="${opts.goal && v >= opts.goal ? 'ok' : ''}"/>`).join('');
    const goal = opts.goal ? `<line x1="0" x2="${W}" y1="${(H - (H * opts.goal) / max).toFixed(1)}" y2="${(H - (H * opts.goal) / max).toFixed(1)}" class="goal"/>` : '';
    const step = Math.ceil(n / 8);
    const labels = buckets.map((b, i) => (i % step === 0 ? `<text x="${(i * bw + bw / 2).toFixed(1)}" y="${H + 12}">${esc(b.label)}</text>` : '')).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H + 16}" preserveAspectRatio="none">${goal}${bars}${labels}</svg>`;
  }
  function lineChart(buckets, fs, opts = {}) {
    const series = fs.map((f) => buckets.map((b) => f(b.d)));
    const all = series.flat().filter((v) => v != null);
    if (all.length < 1) return `<p class="small muted">${t('no_data')}</p>`;
    let lo = Math.min(...all), hi = Math.max(...all);
    if (hi - lo < 4) { lo -= 2; hi += 2; }
    const n = buckets.length, W = 320, H = 110;
    const x = (i) => (n === 1 ? W / 2 : (i * W) / (n - 1)), y = (v) => H - ((v - lo) / (hi - lo)) * (H - 10) - 5;
    const paths = series.map((s, si) => {
      const pts = s.map((v, i) => (v == null ? null : [x(i), y(v)])).filter(Boolean);
      return `<polyline class="ln l${si}" points="${pts.map((p) => p.map((q) => q.toFixed(1)).join(',')).join(' ')}"/>` + pts.map((p) => `<circle class="dt l${si}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.4"/>`).join('');
    }).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H + 16}" preserveAspectRatio="none"><text x="2" y="10" class="ax">${Math.round(hi)}</text><text x="2" y="${H}" class="ax">${Math.round(lo)}</text>${paths}</svg>`;
  }
  const fmt = (v, d = 0) => (v == null ? '—' : Number(v).toLocaleString(I18N.lang === 'ar' ? 'ar-TN' : I18N.lang, { maximumFractionDigits: d }));
  const hm = (h) => (h == null ? '—' : `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, '0')}`);
  function trend(cur, prev, good = 'up') {
    if (cur == null || prev == null || !prev) return '';
    const pct = Math.round(((cur - prev) / Math.abs(prev)) * 100);
    if (!pct) return '<span class="tr">=</span>';
    const better = (pct > 0) === (good === 'up');
    return `<span class="tr ${better ? 'good' : 'bad'}">${pct > 0 ? '▲' : '▼'} ${Math.abs(pct)}%</span>`;
  }
  function insights(s, period) {
    const out = [];
    const b = body();
    if (s.steps != null) out.push(s.steps >= 8000 ? ['ok', t('in_steps_ok', { n: fmt(s.steps) })] : ['warn', t('in_steps_low', { n: fmt(s.steps) })]);
    if (s.sleep != null) out.push(s.sleep >= 7 && s.sleep <= 9 ? ['ok', t('in_sleep_ok', { h: hm(s.sleep) })] : ['warn', t('in_sleep_bad', { h: hm(s.sleep) })]);
    const weeks = { day: 1 / 7, week: 1, month: 4.3, year: 52 }[period];
    if (period !== 'day') { const perWeek = s.exMin / weeks; out.push(perWeek >= 150 ? ['ok', t('in_active_ok', { n: Math.round(perWeek) })] : ['warn', t('in_active_low', { n: Math.round(perWeek) })]); }
    if (s.rhr != null) out.push(s.rhr <= 70 ? ['ok', t('in_rhr_ok', { n: Math.round(s.rhr) })] : s.rhr > 90 ? ['bad', t('in_rhr_high', { n: Math.round(s.rhr) })] : ['info', t('in_rhr_mid', { n: Math.round(s.rhr) })]);
    if (s.sys != null) { const it = Health.interpret({ type: 'bp', v: { sys: Math.round(s.sys), dia: Math.round(s.dia) } }); out.push([it[0] === 'ok' ? 'ok' : it[0] === 'info' ? 'info' : 'warn', `${t('avg_bp')} ${Math.round(s.sys)}/${Math.round(s.dia)} — ${L(it[1])}`]); }
    if (s.wFirst != null && s.wLast != null && s.wFirst !== s.wLast) { const dw = Math.round((s.wLast - s.wFirst) * 10) / 10; out.push(['info', t('in_weight', { d: (dw > 0 ? '+' : '') + dw })]); }
    if (b && s.protein != null) out.push(s.protein >= b.protein * 0.9 ? ['ok', t('in_prot_ok', { n: Math.round(s.protein) })] : ['warn', t('in_prot_low', { n: Math.round(s.protein), g: Math.round(b.protein) })]);
    if (b && s.kcalIn != null && period !== 'day') { const diff = Math.round(s.kcalIn - b.kcal); out.push(['info', t('in_kcal', { n: Math.round(s.kcalIn), d: (diff > 0 ? '+' : '') + diff })]); }
    return out;
  }
  function viewReports() {
    const anchor = rep.anchor || Date.now();
    const per = rep.period;
    const ser = seriesFor(per, anchor);
    const s = stats(ser.days);
    const prevAnchor = (() => { const a = new Date(anchor); if (per === 'day') a.setDate(a.getDate() - 1); else if (per === 'week') a.setDate(a.getDate() - 7); else if (per === 'month') a.setMonth(a.getMonth() - 1); else a.setFullYear(a.getFullYear() - 1); return a.getTime(); })();
    const ps = stats(seriesFor(per, prevAnchor).days);
    const [start, n] = rangeOf(per, anchor);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + n - 1);
    const fmtD = (d, o) => d.toLocaleDateString(I18N.lang === 'ar' ? 'ar-TN' : I18N.lang, o);
    const title = per === 'day' ? fmtD(start, { weekday: 'long', day: 'numeric', month: 'long' }) : per === 'week' ? `${fmtD(start, { day: 'numeric', month: 'short' })} – ${fmtD(end, { day: 'numeric', month: 'short' })}` : per === 'month' ? fmtD(start, { month: 'long', year: 'numeric' }) : String(start.getFullYear());
    const kpi = (ic, label, val, tr) => `<div class="kpi"><span>${ic}</span><b>${val}</b><small>${label}</small>${tr || ''}</div>`;
    const d0 = per === 'day' ? ser.days[0] : null;
    window.__reportText = [`FitCoach — ${t('report_' + per)} : ${title}`, `${t('steps')}: ${fmt(s.steps)}`, `${t('sleep')}: ${hm(s.sleep)}`, `${t('rhr')}: ${fmt(s.rhr)} bpm`, `${t('activity_min')}: ${fmt(s.exMin)} min`, `${t('workouts_n')}: ${s.workouts}`, s.sys != null ? `${t('avg_bp')}: ${Math.round(s.sys)}/${Math.round(s.dia)} mmHg` : '', s.kcalIn != null ? `${t('kcal_in')}: ${fmt(s.kcalIn)} kcal` : '', s.wLast != null ? `${t('weight')}: ${fmt(s.wLast, 1)} kg` : '', '', ...insights(s, per).map((i) => '• ' + i[1])].filter((x) => x !== '').join('\n');
    return `${header(t('reports'))}
      <div class="seg rep-seg">${['day', 'week', 'month', 'year'].map((p) => `<button data-act="repPeriod" data-id="${p}" class="${per === p ? 'on' : ''}">${t('p_' + p)}</button>`).join('')}</div>
      <div class="week-nav"><button class="icon" data-act="repNav" data-d="-1">‹</button><div><b>${esc(title)}</b><div class="small muted">${t('report_' + per)}</div></div><button class="icon" data-act="repNav" data-d="1" ${rangeOf(per, anchor)[0].getTime() + n * DAY > Date.now() ? 'disabled' : ''}>›</button></div>
      ${!D.wear || !D.wear.hc ? `<button class="card linkcard prog-cta" data-act="openDevices">⌚ ${t('connect_watch_cta')}</button>` : ''}
      <section class="card"><div class="kpis4">
        ${kpi('👣', t('steps') + (per === 'day' ? '' : ' / ' + t('per_day_s')), fmt(s.steps), trend(s.steps, ps.steps))}
        ${kpi('😴', t('sleep'), hm(s.sleep), trend(s.sleep, ps.sleep))}
        ${kpi('❤️', t('rhr'), s.rhr == null ? '—' : fmt(s.rhr) + ' bpm', trend(s.rhr, ps.rhr, 'down'))}
        ${kpi('🔥', t('activity_min'), fmt(s.exMin) + ' min', trend(s.exMin, ps.exMin))}
        ${kpi('🏋️', t('workouts_n'), String(s.workouts), trend(s.workouts, ps.workouts))}
        ${kpi('🍽️', t('kcal_in'), s.kcalIn == null ? '—' : fmt(s.kcalIn), '')}
      </div></section>
      ${per === 'day' ? `<section class="card"><h2>📋 ${t('day_detail')}</h2><table class="kv">
          <tr><td>👣 ${t('steps')}</td><td>${fmt(d0.steps)}${d0.km ? ` · ${fmt(d0.km, 1)} km` : ''}</td></tr>
          <tr><td>🔥 ${t('active_kcal')}</td><td>${fmt(d0.active)} kcal</td></tr>
          <tr><td>❤️ ${t('hr_day')}</td><td>${d0.hrAvg ? `${d0.hrAvg} (${d0.hrMin ?? '—'}–${d0.hrMax ?? '—'})` : '—'}</td></tr>
          <tr><td>🩸 ${L(Health.TYPES.bp.name)}</td><td>${d0.sys ? `${d0.sys}/${d0.dia}` : '—'}</td></tr>
          <tr><td>🍬 ${L(Health.TYPES.glucose.name)}</td><td>${d0.glucose ?? '—'}</td></tr>
          <tr><td>🫁 SpO2</td><td>${d0.spo2 ? d0.spo2 + ' %' : '—'}</td></tr>
          <tr><td>⚖️ ${t('weight')}</td><td>${d0.weight ? d0.weight + ' kg' : '—'}</td></tr>
          <tr><td>🍽️ ${t('kcal_in')}</td><td>${fmt(d0.kcalIn)} kcal · ${t('protein')} ${fmt(d0.protein)} g</td></tr></table></section>`
        : `<section class="card"><h2>👣 ${t('steps')}</h2>${barChart(ser.buckets, (d) => d.steps, { goal: 8000 })}</section>
      <section class="card"><h2>😴 ${t('sleep')} (h)</h2>${barChart(ser.buckets, (d) => d.sleep, { goal: 7 })}</section>
      <section class="card"><h2>❤️ ${t('rhr')}</h2>${lineChart(ser.buckets, [(d) => d.rhr])}</section>
      <section class="card"><h2>🔥 ${t('activity_min')}</h2>${barChart(ser.buckets, (d) => d.exMin)}</section>
      <section class="card"><h2>🩸 ${L(Health.TYPES.bp.name)}</h2>${lineChart(ser.buckets, [(d) => d.sys, (d) => d.dia])}</section>
      <section class="card"><h2>⚖️ ${t('weight')}</h2>${lineChart(ser.buckets, [(d) => d.weight])}</section>
      <section class="card"><h2>🍽️ ${t('kcal_in')}</h2>${barChart(ser.buckets, (d) => d.kcalIn, { goal: body() ? body().kcal : 0 })}</section>`}
      <section class="card"><h2>🧠 ${t('analysis')}</h2><ul class="remarks">${insights(s, per).map(([c, x]) => `<li class="${c}">${esc(x)}</li>`).join('') || `<li class="info">${t('no_data')}</li>`}</ul></section>
      <div class="row no-print"><button class="btn primary" data-act="repShare">📤 ${t('share')}</button><button class="btn" data-act="repPrint">🖨️ ${t('pdf')}</button></div>
      <p class="small muted">⚕️ ${t('disclaimer')}</p>`;
  }

  // ------------------------------------------------------------------ after-render hooks
  function after(view, arg) {
    if (stopAnim) { stopAnim(); stopAnim = null; }
    if (view === 'exercise' && EX[arg].lib) return;
    if (view === 'exercise' && $('#anim3d')) {
      const cv = $('#anim3d');
      try { stopAnim = Figure3D.create(cv, EX[arg], anim); } catch (err) { D.prefs.view3d = false; return render(); }
      if (anim.steps) renderSteps();
      let dragX = null;
      cv.addEventListener('pointerdown', (e) => { dragX = e.clientX; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', (e) => { if (dragX == null) return; anim.yaw = ((anim.yaw + (e.clientX - dragX) * 0.8 + 540) % 360) - 180; dragX = e.clientX; });
      const end = () => { if (dragX != null) { dragX = null; app().querySelectorAll('.view-seg button').forEach((b) => b.classList.toggle('on', +b.dataset.v === Math.round(anim.yaw))); if (anim.steps) renderSteps(); } };
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    } else if (view === 'exercise') {
      const svg = $('#anim');
      stopAnim = Figure.animate(svg, EX[arg], anim);
      if (anim.steps) renderSteps();
      // drag horizontally to orbit around the mannequin
      let dragX = null;
      svg.addEventListener('pointerdown', (e) => { dragX = e.clientX; svg.setPointerCapture(e.pointerId); });
      svg.addEventListener('pointermove', (e) => {
        if (dragX == null) return;
        anim.yaw = ((anim.yaw + (e.clientX - dragX) * 0.8 + 540) % 360) - 180; dragX = e.clientX;
      });
      const end = () => { if (dragX != null) { dragX = null; app().querySelectorAll('.view-seg button').forEach((b) => b.classList.toggle('on', +b.dataset.v === Math.round(anim.yaw))); if (anim.steps) renderSteps(); } };
      svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    }
    if (view === 'food') {
      const s = $('#foodSearch');
      s.oninput = () => {
        foodState.q = s.value; foodState.cat = null;
        const q = s.value.trim().toLowerCase();
        $('#foodResults').innerHTML = (q ? searchFoods(q) : []).slice(0, 40).map((f) => foodRow(f)).join('');
      };
      $('#bcForm').onsubmit = (e) => { e.preventDefault(); lookupBarcode($('#bcIn').value); };
      app().querySelectorAll('input[data-plate]').forEach((inp) => {
        inp.onchange = () => { foodState.plate[+inp.dataset.plate].g = Math.max(1, Math.min(3000, +inp.value || 1)); render(); };
      });
    }
    if (view === 'train') {
      const s = $('#exSearch');
      s.oninput = () => { filter.q = s.value; $('#exList').innerHTML = exList(); };
    }
    if (view === 'coach') { const sel = $('#coachSel'); sel.onchange = () => { coachEx = sel.value; render(); }; }
    if (view === 'workout') {
      app().querySelectorAll('input[data-w]').forEach((inp) => {
        inp.onchange = () => { W.ex[inp.dataset.w].sets[inp.dataset.s][inp.dataset.k] = inp.value; D.activeW = W; saveData(); };
      });
    }
    if (view === 'program') {
      const ci = $('#ciForm');
      if (ci) ci.onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(ci);
        const c = { fatigue: +fd.get('fatigue'), soreness: +fd.get('soreness'), sleepq: +fd.get('sleepq'), weight: +fd.get('weight') || null, t: Date.now() };
        checkinAdjust(c);
        D.program.checkins[progCurrentWeek() - 1] = c;
        if (c.weight) { D.health.push({ t: Date.now(), type: 'weight', v: { val: c.weight } }); if (D.profile) D.profile.weight = c.weight; }
        saveData(); render();
      };
      const tf = $('#testForm');
      if (tf) tf.onsubmit = (e) => {
        e.preventDefault();
        const r = {};
        for (const [k, v] of new FormData(tf)) if (v !== '') r[k] = +v;
        D.program.tests[tf.dataset.w] = r; saveData(); toast(t('saved'));
      };
    }
    if (view === 'progEdit') {
      app().querySelectorAll('[data-man]').forEach((inp) => {
        inp.onchange = () => {
          const [i, j, k] = inp.dataset.man.split(':');
          const it = D.program.manual[+i].items[+j];
          const v = Math.max(1, Math.min(300, +inp.value || 1));
          if (k === 'sets') it.sets = Math.min(10, v); else if (k === 'hold') it.hold = v; else it.reps[k === 'r0' ? 0 : 1] = v;
        };
      });
      app().querySelectorAll('.day-name').forEach((inp) => { inp.onchange = () => { D.program.manual[+inp.dataset.day].name = inp.value.slice(0, 40); }; });
    }
    if (view === 'health') {
      const hf = $('#hForm');
      hf.onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(hf);
        const v = {};
        for (const [k, val] of fd) v[k] = k === 'ctx' ? val : +val;
        if (hType === 'bp' && (v.sys < 60 || v.sys > 260 || v.dia < 30 || v.dia > 180)) return toast(t('err_value'));
        D.health.push({ t: Date.now(), type: hType, v });
        if (hType === 'weight' && D.profile) D.profile.weight = v.val;
        if (hType === 'waist' && D.profile) D.profile.waist = v.val;
        saveData(); render();
        const it = Health.interpret({ type: hType, v }, D.profile);
        if (it[0] === 'urgent') openModal(`<div class="sheet-handle"></div><h2>🚨 ${t('urgent')}</h2><p class="remark lv-urgent">${esc(L(it[1]))}</p><button class="btn primary full" data-act="closeModal">${t('close')}</button>`);
      };
      const pq = $('#parqForm');
      if (pq) pq.onsubmit = (e) => {
        e.preventDefault();
        const yes = [...new FormData(pq).values()].some((v) => v === '1');
        D.prefs.parq = { yes, t: Date.now() }; saveData(); render();
      };
    }
    if (view === 'me') {
      const pf = $('#pwForm');
      if (pf) pf.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(pf);
        const st = Sec.strength(fd.get('n1'), user);
        try {
          if (st.issues.length) throw st.issues.map((i) => t(i)).join(' ');
          if (fd.get('n1') !== fd.get('n2')) throw t('err_match');
          await changePassword(fd.get('old'), fd.get('n1'));
          toast(t('saved')); render();
        } catch (x) { $('#pwErr').textContent = typeof x === 'string' ? x : t('err_generic'); }
      };
      const df = $('#delForm');
      if (df) df.onsubmit = async (e) => {
        e.preventDefault();
        if (!confirm(t('delete_confirm'))) return;
        try { await deleteAccount(new FormData(df).get('p')); stack = [['home']]; render(); toast(t('deleted')); }
        catch (x) { $('#delErr').textContent = typeof x === 'string' ? x : t('err_generic'); }
      };
      const af = $('#aiForm');
      if (af) af.onsubmit = (e) => {
        e.preventDefault();
        const k = $('#aiKeyIn').value.trim();
        if (k.length < 20) return;
        D.prefs.aiKey = k; saveData(); toast(t('ai_on')); render();
      };
      $('#profForm').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        D.profile = {
          sex: fd.get('sex'), age: +fd.get('age'), height: +fd.get('height'), weight: +fd.get('weight'), waist: +fd.get('waist') || null,
          activity: +fd.get('activity'), goal: fd.get('goal'), level: +fd.get('level'), days: +fd.get('days'), place: fd.get('place'), conditions: fd.getAll('cond'),
        };
        saveData(); toast(t('saved')); render();
      };
    }
  }

  // ------------------------------------------------------------------ modal / toast
  const modalOpen = () => !$('#modal').hidden;
  function openModal(html) { $('#modalBody').innerHTML = html; $('#modal').hidden = false; }
  function closeModal() { $('#modal').hidden = true; }
  let toastT = 0;
  function toast(s) { const el = $('#toast'); el.textContent = s; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (el.hidden = true), 2600); }

  // ------------------------------------------------------------------ events
  // broken remote photos (offline): hide them (inline handlers are blocked by the CSP)
  document.addEventListener('error', (e) => {
    const el = e.target;
    if (!el || el.tagName !== 'IMG') return;
    const box = el.closest('.photo-anim');
    if (box) box.classList.add('noimg'); else el.style.visibility = 'hidden';
  }, true);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act],[data-tab],[data-lang]');
    if (!b) { if (e.target.id === 'modal') closeModal(); return; }
    if (b.dataset.tab) { tab(b.dataset.tab); return; }
    if (b.dataset.lang) { I18N.set(b.dataset.lang); render(); return; }
    const d = b.dataset;
    switch (d.act) {
      case 'back': goBack(); break;
      case 'authMode': loginMode = d.m; render(); break;
      case 'google':
        googleLogin().then((ok) => { if (ok) afterLogin(null); }).catch((x) => { const el = $('#authErr'); if (el) el.textContent = typeof x === 'string' ? x : t('err_generic'); });
        break;
      case 'copy':
        try { navigator.clipboard.writeText(d.v).then(() => toast(t('copied')), () => {}); } catch (e) {}
        break;
      case 'setMode':
        D.prefs.mode = d.id; saveData();
        if (d.stay) render(); else { stack = [[D.profile ? 'home' : 'me']]; render(); }
        break;
      case 'theme': store.set('fc_theme', d.v); applyTheme(); render(); break;
      case 'openProgram': progView = 0; go('program'); break;
      case 'progCreate':
        createProgram(d.type);
        if (d.type === 'manual') go('progEdit', null, true); else render();
        break;
      case 'progWeek': progView = Math.max(1, Math.min(Program.WEEKS, (progView || progCurrentWeek()) + +d.d)); render(); break;
      case 'progGoto': progView = +d.w; render(); break;
      case 'startProg': {
        const wk = progWeek(+d.w);
        const sess = wk.sessions.find((x) => x.key === d.key);
        if (sess && sess.items.length) newWorkout(sess.items, sess.key);
        break;
      }
      case 'progEdit': go('progEdit'); break;
      case 'progReset': if (confirm(t('reset_confirm'))) { D.program = null; saveData(); render(); } break;
      case 'progSave':
        D.program.manual = D.program.manual.filter((x) => x.items.length);
        if (!D.program.manual.length) { toast(t('add_exercise')); D.program.manual = defaultManual(); break; }
        D.program.deload = $('#manDeload').checked; saveData(); toast(t('saved')); goBack();
        break;
      case 'dayAdd': D.program.manual.push({ name: t('day') + ' ' + (D.program.manual.length + 1), items: [] }); render(); break;
      case 'dayDel': D.program.manual.splice(+d.i, 1); render(); break;
      case 'manAdd': pickExercise(+d.i); break;
      case 'manPick': {
        const e = EX[d.id];
        D.program.manual[+d.i].items.push(e.hold || e.cardio ? { id: e.id, sets: 3, hold: 30, rest: 45 } : { id: e.id, sets: 3, reps: [8, 12], rest: 90 });
        closeModal(); render();
        break;
      }
      case 'manDel': D.program.manual[+d.i].items.splice(+d.j, 1); render(); break;
      case 'hType': hType = d.id; render(); break;
      case 'openDevices': go('devices'); break;
      case 'openReports': rep.anchor = null; go('reports'); break;
      case 'hcConnect':
        nativeHttp((cb) => Android.hcRequest(cb)).then((n) => { if (+n > 0) hcSync(400); else toast(t('hc_denied')); }).catch((e) => toast(e.message));
        break;
      case 'hcOpen': if (NATIVE) Android.hcOpen(); break;
      case 'bleScan': liveWear.devices = {}; liveWear.scanning = true; Android.bleScan(); render(); renderDevList(); break;
      case 'bleConnect': Android.bleConnect(d.id); break;
      case 'bleDisconnect': Android.bleDisconnect(); liveWear.state = null; render(); break;
      case 'repPeriod': rep.period = d.id; render(); break;
      case 'repNav': {
        const a = new Date(rep.anchor || Date.now()); const k = +d.d;
        if (rep.period === 'day') a.setDate(a.getDate() + k); else if (rep.period === 'week') a.setDate(a.getDate() + 7 * k); else if (rep.period === 'month') a.setMonth(a.getMonth() + k); else a.setFullYear(a.getFullYear() + k);
        rep.anchor = Math.min(Date.now(), a.getTime()); render(); break;
      }
      case 'repShare':
        if (navigator.share) navigator.share({ title: 'FitCoach', text: window.__reportText }).catch(() => {});
        else try { navigator.clipboard.writeText(window.__reportText); toast(t('copied')); } catch (e) {}
        break;
      case 'repPrint': if (NATIVE && Android.printPage) Android.printPage('FitCoach ' + t('reports')); else window.print(); break;
      case 'parqRedo': delete D.prefs.parq; saveData(); render(); break;
      case 'healthReport': healthReport(); break;
      case 'shareReport':
        if (navigator.share) navigator.share({ title: 'FitCoach', text: window.__report }).catch(() => {});
        else try { navigator.clipboard.writeText(window.__report); toast(t('copied')); } catch (e) {}
        break;
      case 'secLock': case 'secScreen': {
        const all = users();
        const u = all[user];
        const key = d.act === 'secLock' ? 'lock' : 'secure';
        const turnOn = b.checked;
        const apply = () => { u[key] = turnOn; setUsers(all); if (key === 'secure' && NATIVE) Android.setSecure(turnOn); toast(t('saved')); };
        if (key === 'lock' && turnOn) nativeAsk((cb) => Android.authenticate(t('unlock_title'), cb)).then((ok) => { if (ok) apply(); else b.checked = false; });
        else apply();
        break;
      }
      case 'toggleAuth': loginMode = loginMode === 'login' ? 'signup' : 'login'; render(); break;
      case 'logout': logout(); stack = [['home']]; render(); break;
      case 'ex': anim.ex = d.id; anim.yaw = Figure.defaultYaw(EX[d.id]); anim.paused = false; go('exercise', d.id); break;
      case 'yaw':
        anim.yaw = +d.v;
        app().querySelectorAll('.view-seg button').forEach((x) => x.classList.toggle('on', x === b));
        if (anim.steps) renderSteps();
        break;
      case 'animPause': anim.paused = !anim.paused; b.textContent = anim.paused ? '▶ ' + t('play') : '⏸ ' + t('pause'); break;
      case 'animSpeed': anim.speed = anim.speed < 1 ? 1 : 0.4; b.textContent = anim.speed < 1 ? '🐢 0.4×' : '1×'; break;
      case 'animSteps': anim.steps = !anim.steps; $('#stepsBox').hidden = !anim.steps; renderSteps(); break;
      case 'muscle': filter.muscle = d.id; tab('train'); break;
      case 'fmuscle': filter.muscle = d.id; filter.limit = 30; render(); break;
      case 'fsrc': filter.src = d.id; filter.limit = 30; render(); break;
      case 'fkind': filter.kind = d.id; filter.limit = 30; render(); break;
      case 'moreEx': filter.limit = (filter.limit || 30) + 40; { const y = window.scrollY; $('#exList').innerHTML = exList(); window.scrollTo(0, y); } break;
      case 'toggle3d': D.prefs.view3d = D.prefs.view3d === false; saveData(); render(); break;
      case 'aiTranslate': aiTranslate(d.id); break;
      case 'bodyMuscle':
        if (current === 'train') { filter.muscle = filter.muscle === d.group ? 'all' : d.group; render(); }
        else { filter.muscle = d.group; tab('train'); }
        break;
      case 'plateAdd': plateAdd(d.id); break;
      case 'plateAddG': { const g = +$('#gramsIn').value || FOOD[d.id].portion; closeModal(); plateAdd(d.id, g); break; }
      case 'plateDel': foodState.plate.splice(+d.i, 1); render(); break;
      case 'plateClear': foodState.plate = []; render(); break;
      case 'plateDiary': {
        const k = todayKey();
        D.food[k] = D.food[k] || [];
        foodState.plate.forEach((it) => D.food[k].push({ id: it.id, g: it.g, time: Date.now() }));
        foodState.plate = []; foodState.photo = null; foodState.ai = null;
        saveData(); toast(t('added')); render();
        break;
      }
      case 'aiAnalyse': aiAnalyse(); break;
      case 'dishSearch': {
        const q = d.v.toLowerCase();
        const hits = searchFoods(q);
        const words = q.split(/[\s,-]+/).filter((w) => w.length > 3);
        const res = hits.length ? hits : FOODS.filter((f) => words.some((w) => f.keys.some((k) => String(k).includes(w)) || L(f.name).toLowerCase().includes(w)));
        foodState.q = d.v; foodState.cat = null; render();
        const r = $('#foodResults');
        if (r) { r.innerHTML = res.slice(0, 20).map((f) => foodRow(f)).join('') || `<p class="small muted">${t('not_found')}${D.prefs.aiKey ? '' : ' ' + t('ai_hint')}</p>`; r.scrollIntoView({ block: 'center' }); }
        break;
      }
      case 'aiKeyDel': delete D.prefs.aiKey; saveData(); render(); break;
      case 'fequip': filter.equip = d.id; render(); break;
      case 'science': go('science'); break;
      case 'history': go('history'); break;
      case 'startPlan': newWorkout(plan().ex); break;
      case 'startMuscle': newWorkout(chooseExercises([d.id])); break;
      case 'startEx': newWorkout([d.id]); break;
      case 'coachEx': go('coach', d.id); break;
      case 'url': openUrl(d.url); break;
      case 'setDone': {
        const s = W.ex[d.w].sets[d.s];
        s.done = !s.done;
        D.activeW = W; saveData(); render();
        if (s.done) startRest(rxOf(W.ex[d.w]).rest);
        break;
      }
      case 'addSet': { const x = W.ex[d.w]; x.sets.push({ kg: x.sets[x.sets.length - 1]?.kg || '', reps: '', done: false }); D.activeW = W; saveData(); render(); break; }
      case 'swap': {
        const x = W.ex[d.w];
        D.prefs.swaps[x.id] = (D.prefs.swaps[x.id] || 0) + 1; saveData(); // learn: user doesn't like this one
        const alt = chooseExercises([EX[x.id].group], W.ex.map((y) => y.id))[0];
        if (alt) { const rx = prescription(EX[alt]); W.ex[d.w] = { id: alt, sets: Array.from({ length: rx.sets }, () => ({ kg: '', reps: '', done: false })) }; D.activeW = W; saveData(); render(); }
        break;
      }
      case 'skipRest': clearInterval(restTimer); $('#rest').hidden = true; break;
      case 'finish': finishWorkout(); break;
      case 'cancelW': clearInterval(restTimer); $('#rest').hidden = true; W = null; D.activeW = null; saveData(); tab('home'); break;
      case 'photo': takePhoto(d.src); break;
      case 'fcat': foodState.cat = foodState.cat === d.id ? null : d.id; foodState.q = ''; render(); { const r = $('#foodSearch'); if (r) r.scrollIntoView({ block: 'start', behavior: 'smooth' }); } break;
      case 'foodDetail': foodDetail(d.id); break;
      case 'portion': foodDetail(d.id, +d.g); break;
      case 'addFood': {
        const g = +$('#gramsIn').value || FOOD[d.id].portion;
        const k = todayKey();
        (D.food[k] = D.food[k] || []).push({ id: d.id, g, time: Date.now() });
        saveData(); closeModal(); toast(t('added')); if (current === 'food' || current === 'home') render();
        break;
      }
      case 'delFood': D.food[todayKey()].splice(+d.i, 1); saveData(); render(); break;
      case 'closeModal': closeModal(); break;
      case 'live': startLive(); break;
      case 'flip': startLive(live && live.facing === 'user' ? 'environment' : 'user'); break;
      case 'stopLive': stopLive(); break;
      case 'voice': voiceOn = !voiceOn; store.set('fc_voice', voiceOn); b.innerHTML = `${voiceOn ? '🔊' : '🔇'} ${t('voice')}`; break;
      case 'video': analyseVideo(); break;
    }
  });

  // ------------------------------------------------------------------ boot
  applyTheme();
  (async () => {
    stack = [['home']];
    if (await resumeSession()) { W = D.activeW || null; stack = [[!D.prefs.mode ? 'mode' : D.profile ? 'home' : 'me']]; }
    render();
    autoSync();
  })();
})();
