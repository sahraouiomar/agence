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
  const FOOD = Object.fromEntries(FOODS.map((f) => [f.id, f]));

  // ------------------------------------------------------------------ storage & auth
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  let user = null; // username
  let D = null; // user data

  function blankData() { return { profile: null, workouts: [], food: {}, prefs: { swaps: {} } }; }
  const saveData = () => store.set('fc_u_' + user, D);

  async function hashPass(pass, salt) {
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
      return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { // very old WebView fallback
      let h = 2166136261;
      for (const c of salt + pass + salt) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
      return 'f' + (h >>> 0).toString(16);
    }
  }
  const randSalt = () => [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');

  async function signup(name, pass) {
    const users = store.get('fc_users', {});
    const k = name.trim().toLowerCase();
    if (users[k]) throw t('err_exists');
    const salt = randSalt();
    users[k] = { salt, hash: await hashPass(pass, salt), display: name.trim() };
    store.set('fc_users', users);
    store.set('fc_u_' + k, blankData());
    return k;
  }
  async function login(name, pass) {
    const users = store.get('fc_users', {});
    const k = name.trim().toLowerCase();
    const u = users[k];
    if (!u || (await hashPass(pass, u.salt)) !== u.hash) throw t('err_login');
    return k;
  }
  function openSession(k) {
    user = k;
    D = Object.assign(blankData(), store.get('fc_u_' + k, {}));
    store.set('fc_session', k);
  }
  const displayName = () => (store.get('fc_users', {})[user] || {}).display || user;

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
    if (place === 'gym') return ['none', 'dumbbell', 'barbell', 'bar', 'bench'];
    if (place === 'home_db') return ['none', 'dumbbell', 'bench'];
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
  const rxText = (rx) => rx.hold ? `${rx.sets} × ${rx.hold}${t('seconds')} · ${t('rest')} ${rx.rest}${t('seconds')}` : `${rx.sets} × ${rx.reps[0]}–${rx.reps[1]} ${t('reps')} · ${t('rest')} ${rx.rest}${t('seconds')}`;

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
  function grade(f) {
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

  function matchLabels(labels) {
    const scores = {};
    const cats = {};
    for (const lb of labels) {
      const txt = lb.text.toLowerCase();
      for (const f of FOODS) {
        for (const k of f.keys) {
          if (k === txt) scores[f.id] = (scores[f.id] || 0) + lb.conf * 2;
          else if (k.length > 3 && txt.length > 3 && (txt.includes(k) || k.includes(txt))) scores[f.id] = (scores[f.id] || 0) + lb.conf * 0.8;
        }
      }
      for (const c in LABEL_CATS) if (LABEL_CATS[c].includes(txt)) cats[c] = (cats[c] || 0) + lb.conf;
    }
    const foods = Object.keys(scores).sort((a, b) => scores[b] - scores[a]).slice(0, 8);
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
    onBack() { if (modalOpen()) { closeModal(); return true; } if (stack.length > 1) { goBack(); return true; } return false; },
    onPause() { stopLive(); },
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
    $('#nav').hidden = false;
    renderNav();
    const V = { home: viewHome, train: viewTrain, exercise: viewExercise, workout: viewWorkout, food: viewFood, coach: viewCoach, me: viewMe, history: viewHistory, science: viewScience };
    app().innerHTML = (V[view] || viewHome)(arg);
    window.scrollTo(0, 0);
    after(view, arg);
  }
  function renderNav() {
    const root = stack[0][0];
    const items = [['home', '🏠', 't_home'], ['train', '🏋️', 't_train'], ['coach', '📷', 't_coach'], ['food', '🥗', 't_food'], ['me', '👤', 't_me']];
    $('#nav').innerHTML = items.map(([v, i, k]) => `<button data-tab="${v}" class="${root === v ? 'on' : ''}"><span>${i}</span>${t(k)}</button>`).join('');
  }

  const header = (title, back = true) => `<header class="top">${back && stack.length > 1 ? `<button class="icon" data-act="back" aria-label="${t('back')}">${I18N.lang === 'ar' ? '→' : '←'}</button>` : ''}<h1>${esc(title)}</h1></header>`;

  // ------------------------------------------------------------------ views: login
  let loginMode = 'login';
  function langPicker() {
    return `<div class="langs">${['fr', 'en', 'ar'].map((l) => `<button data-lang="${l}" class="${I18N.lang === l ? 'on' : ''}">${{ fr: 'Français', en: 'English', ar: 'العربية' }[l]}</button>`).join('')}</div>`;
  }
  function viewLogin() {
    const su = loginMode === 'signup';
    return `<div class="login">
      ${langPicker()}
      <div class="logo">🏋️‍♂️</div>
      <h1>${t('app')}</h1><p class="muted">${t('tagline')}</p>
      <form id="authForm" class="card" autocomplete="off">
        <h2>${t(su ? 'signup' : 'login')}</h2>
        <label>${t('username')}<input name="u" required autocapitalize="none" maxlength="30"></label>
        <label>${t('password')}<input name="p" type="password" required></label>
        ${su ? `<label>${t('password2')}<input name="p2" type="password" required></label>` : ''}
        <p class="err" id="authErr"></p>
        <button class="btn primary big" type="submit">${t(su ? 'signup' : 'login')}</button>
        <button class="link" type="button" data-act="toggleAuth">${t(su ? 'have_account' : 'no_account')}</button>
        <p class="small muted">🔒 ${t('local_note')}</p>
      </form></div>`;
  }
  function bindLogin() {
    $('#authForm').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const u = fd.get('u').trim(), p = fd.get('p');
      const err = $('#authErr');
      try {
        if (u.length < 3) throw t('err_user');
        if (p.length < 6) throw t('err_pass');
        let k;
        if (loginMode === 'signup') {
          if (p !== fd.get('p2')) throw t('err_match');
          k = await signup(u, p);
        } else k = await login(u, p);
        openSession(k);
        stack = [[D.profile ? 'home' : 'me']];
        render();
      } catch (x) { err.textContent = typeof x === 'string' ? x : x.message; }
    };
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
    return `${header(t('hello') + ', ' + displayName() + ' 👋', false)}
      <div class="stats">
        <div class="stat"><b>${streak()}</b><span>🔥 ${t('streak')}</span></div>
        <div class="stat"><b>${sessionsThisWeek()}/${D.profile?.days || 3}</b><span>🏋️ ${t('this_week')}</span></div>
      </div>
      <section class="card hero"><h2>${t('today_plan')}</h2>${planHtml}<p class="small muted">📅 ${t('tomorrow')} : ${tomorrow}</p></section>
      <section class="card"><h2>${t('today_food')}</h2>
        ${b ? `<div class="food-sum">${ring(tot.kcal, b.kcal, t('kcal_left'))}<div class="macros">${macroBar('protein', tot.p, b.protein)}${macroBar('carbs', tot.c, b.carbs)}${macroBar('fat', tot.f, b.fat)}${macroBar('fiber', tot.fiber, b.fiber)}</div></div>` : `<p>${t('fill_profile')}</p>`}
        <div class="row"><button class="btn primary" data-act="photo" data-src="camera">📸 ${t('scan_food')}</button></div></section>
      <section class="card"><h2>${t('recovery')}</h2>${recoveryGrid(P.st)}</section>
      <section class="card tip"><h2>💡 ${t('tip_day')}</h2><p>${esc(L(tip))}</p></section>`;
  }
  const macroBar = (k, v, max) => `<div class="mb"><div class="mb-top"><span>${t(k)}</span><span dir="ltr">${Math.round(v)} / ${Math.round(max)} g</span></div><div class="bar"><i style="width:${Math.min(100, (100 * v) / (max || 1))}%"></i></div></div>`;

  // ------------------------------------------------------------------ views: exercises
  let filter = { muscle: 'all', equip: 'mine' };
  function exCard(e) {
    const rx = prescription(e);
    return `<button class="ex-card" data-act="ex" data-id="${e.id}">${Figure.still(e)}<div><b>${esc(L(e.name))}</b>
      <div class="small muted">${MU[e.group].icon} ${esc(L(MU[e.group].name).split(' (')[0])} · ${e.equip.map((q) => esc(L(EQUIP[q]))).join(' / ')}</div>
      <div class="small">${rxText(rx)} ${e.analyzer ? '· 📷 AI' : ''}</div></div></button>`;
  }
  function viewTrain(arg) {
    if (arg && arg.muscle) filter.muscle = arg.muscle;
    const list = EXERCISES.filter((e) => (filter.muscle === 'all' || e.group === filter.muscle) && (filter.equip === 'all' || canDo(e)));
    return `${header(t('t_train'), false)}
      <div class="chips scroll">${[['all', '✨', t('all')], ...MUSCLES.map((m) => [m.id, m.icon, L(m.name).split(' (')[0]])].map(([id, i, n]) => `<button class="chip ${filter.muscle === id ? 'on' : ''}" data-act="fmuscle" data-id="${id}">${i} ${esc(n)}</button>`).join('')}</div>
      <div class="seg"><button class="${filter.equip === 'mine' ? 'on' : ''}" data-act="fequip" data-id="mine">${esc(t(D.profile?.place === 'gym' ? 'gym' : D.profile?.place === 'home_db' ? 'home_db' : 'home_place'))}</button><button class="${filter.equip === 'all' ? 'on' : ''}" data-act="fequip" data-id="all">${t('all')}</button></div>
      ${filter.muscle !== 'all' ? `<div class="row"><button class="btn primary" data-act="startMuscle" data-id="${filter.muscle}">▶ ${t('start_workout')} : ${esc(L(MU[filter.muscle].name).split(' (')[0])}</button></div>` : ''}
      <div class="ex-list">${list.map(exCard).join('')}</div>
      <button class="card linkcard" data-act="science">🔬 ${t('science')} →</button>`;
  }

  let stopAnim = null;
  function viewExercise(id) {
    const e = EX[id];
    const rx = prescription(e);
    const ld = lastDone(id);
    const q = encodeURIComponent(L(e.name) + ' ' + ({ fr: 'exécution correcte', en: 'proper form', ar: 'الطريقة الصحيحة' }[I18N.lang]));
    return `${header(L(e.name))}
      <div class="card demo"><svg id="anim" class="fig big" viewBox="0 0 200 150"></svg><p class="small muted center">${t('demo')}</p></div>
      <div class="chips"><span class="chip on">${MU[e.group].icon} ${esc(L(MU[e.group].name))}</span>${e.second.map((m) => `<span class="chip">${esc(L(MU[m].name).split(' (')[0])}</span>`).join('')}</div>
      <section class="card"><h2>🎯 ${t('prescription')}</h2><p class="big-txt">${rxText(rx)}</p>${ld ? `<p class="small muted">${t('history')} : ${ld.sets.map((s) => (s.kg ? s.kg + 'kg×' : '') + s.reps).join(', ')}</p>` : ''}</section>
      <section class="card"><h2>✅ ${t('how_to')}</h2><ol class="steps">${e.steps.map((s) => `<li>${esc(L(s))}</li>`).join('')}</ol></section>
      <section class="card warn"><h2>⚠️ ${t('mistakes')}</h2><ul>${e.mistakes.map((s) => `<li>${esc(L(s))}</li>`).join('')}</ul></section>
      <section class="card tip"><h2>💡 ${t('tip')}</h2><p>${esc(L(e.tip))}</p></section>
      <div class="col">
        ${e.analyzer ? `<button class="btn primary big" data-act="coachEx" data-id="${id}">📷 ${t('check_form')}</button>` : ''}
        <button class="btn" data-act="url" data-url="https://www.youtube.com/results?search_query=${q}">▶️ ${t('watch_video')} <span class="small muted">(${t('video_need_net')})</span></button>
        <button class="btn" data-act="startEx" data-id="${id}">📝 ${t('log_set')}</button>
      </div>`;
  }

  // ------------------------------------------------------------------ views: workout
  let W = null; // active workout {ex:[{id, sets:[{kg,reps,done}]}]}
  function newWorkout(ids) {
    W = { start: Date.now(), ex: ids.map((id) => {
      const rx = prescription(EX[id]);
      const ld = lastDone(id);
      return { id, sets: Array.from({ length: rx.sets }, (_, i) => ({ kg: ld?.sets[i]?.kg ?? ld?.sets[0]?.kg ?? '', reps: '', done: false })) };
    }) };
    store.set('fc_w_' + user, W);
    go('workout');
  }
  function overloadHint(id) {
    const ld = lastDone(id); if (!ld) return '';
    const rx = prescription(EX[id]);
    const txt = ld.sets.map((s) => (s.kg ? s.kg + 'kg×' : '') + s.reps + (EX[id].hold ? t('seconds') : '')).join(', ');
    const top = !rx.hold && ld.sets.length >= rx.sets && ld.sets.every((s) => +s.reps >= rx.reps[1]);
    return `<p class="small hint">📈 ${t('progress_hint', { x: esc(txt) })}${top ? '<br>⬆️ ' + t('increase_load') : ''}</p>`;
  }
  function viewWorkout() {
    if (!W) W = store.get('fc_w_' + user, null);
    if (!W) return `${header(t('workout'))}<p>—</p>`;
    return `${header(t('workout'))}
      <p class="card small">🔥 ${t('warmup')}</p>
      ${W.ex.map((x, i) => {
        const e = EX[x.id]; const rx = prescription(e);
        return `<section class="card wex"><div class="wex-head">${Figure.still(e)}<div><button class="link" data-act="ex" data-id="${x.id}"><b>${esc(L(e.name))}</b></button><div class="small muted">${rxText(rx)}</div></div></div>
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
    if (ex.length) { D.workouts.push({ time: Date.now(), start: W.start, ex }); saveData(); }
    W = null; store.del('fc_w_' + user);
    clearInterval(restTimer); $('#rest').hidden = true;
    toast(t('workout_saved'));
    tab('home');
  }

  // ------------------------------------------------------------------ views: food
  let foodState = { q: '', cat: null, photo: null };
  function foodRow(f) {
    const g = grade(f);
    return `<button class="food-row" data-act="foodDetail" data-id="${f.id}"><span class="grade g${g.g}">${g.g}</span><span class="fr-name">${esc(L(f.name))}<small class="muted">${f.kcal} kcal ${t('per100')} · ${t('portion')} ${f.portion} g ≈ ${Math.round((f.kcal * f.portion) / 100)} kcal</small></span></button>`;
  }
  function viewFood() {
    const b = body();
    const tot = dayTotals();
    const list = D.food[todayKey()] || [];
    const q = foodState.q.trim().toLowerCase();
    let results = [];
    if (q) results = FOODS.filter((f) => [f.name.fr, f.name.en, f.name.ar, ...f.keys].some((n) => n.toLowerCase().includes(q)));
    else if (foodState.cat) results = FOODS.filter((f) => f.cat === foodState.cat);
    const ph = foodState.photo;
    let photoHtml = '';
    if (ph) {
      const m = ph.labels ? matchLabels(ph.labels) : { foods: [], cats: [] };
      photoHtml = `<section class="card"><h2>📸 ${t('detected')}</h2><div class="photo-wrap"><img src="${ph.img}" alt=""></div>
        ${ph.labels && ph.labels.length ? `<div class="chips">${ph.labels.slice(0, 6).map((l) => `<span class="chip">${esc(l.text)} ${Math.round(l.conf * 100)}%</span>`).join('')}</div>` : ''}
        ${m.foods.length ? `<p>${t('pick_food')}</p><div class="food-list">${m.foods.map((id) => foodRow(FOOD[id])).join('')}</div>` : ''}
        ${m.cats.length ? `<div class="chips">${m.cats.map((c) => `<button class="chip" data-act="fcat" data-id="${c}">${FOOD_CATS[c].icon} ${esc(L(FOOD_CATS[c]))}</button>`).join('')}</div>` : ''}
        <p class="small muted">${m.foods.length ? '' : t('not_found') + ' '}${t('photo_note')}</p></section>`;
    }
    return `${header(t('t_food'), false)}
      <div class="row"><button class="btn primary big" data-act="photo" data-src="camera">📸 ${t('scan_food')}</button><button class="btn big" data-act="photo" data-src="gallery">🖼️ ${t('from_gallery')}</button></div>
      ${photoHtml}
      <input id="foodSearch" class="search" type="search" placeholder="${t('search_food')}" value="${esc(foodState.q)}">
      <div class="chips scroll">${Object.keys(FOOD_CATS).map((c) => `<button class="chip ${foodState.cat === c ? 'on' : ''}" data-act="fcat" data-id="${c}">${FOOD_CATS[c].icon} ${esc(L(FOOD_CATS[c]))}</button>`).join('')}</div>
      <div id="foodResults" class="food-list">${results.slice(0, 40).map(foodRow).join('')}</div>
      <section class="card"><h2>📒 ${t('diary')}</h2>
        ${b ? `<div class="food-sum">${ring(tot.kcal, b.kcal, t('kcal_left'))}<div class="macros">${macroBar('protein', tot.p, b.protein)}${macroBar('carbs', tot.c, b.carbs)}${macroBar('fat', tot.f, b.fat)}${macroBar('fiber', tot.fiber, b.fiber)}${macroBar('sugar', tot.sugar, b.sugarMax)}</div></div>` : ''}
        ${list.length ? `<ul class="diary">${list.map((it, i) => { const f = FOOD[it.id]; return f ? `<li><span>${esc(L(f.name))} · ${it.g} g</span><b>${Math.round((f.kcal * it.g) / 100)} kcal</b><button class="icon sm" data-act="delFood" data-i="${i}" aria-label="${t('remove')}">✕</button></li>` : ''; }).join('')}</ul><p class="right"><b>${Math.round(tot.kcal)} kcal</b></p>` : `<p class="muted">${t('empty_diary')}</p>`}
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
    openModal(`<h2>${esc(L(f.name))}</h2>
      <div class="verdict ${verdictCls}"><span class="grade big g${g.g}">${g.g}</span><div><b>${t('v_' + g.g)}</b><div class="small">${t('health_verdict')} · ${g.score}/100</div></div></div>
      <label class="small">${t('portion')}</label>
      <div class="seg">${[['small', 0.6], ['medium', 1], ['large', 1.5]].map(([k, m]) => `<button class="${Math.round(f.portion * m) === grams ? 'on' : ''}" data-act="portion" data-id="${id}" data-g="${Math.round(f.portion * m)}">${t(k)}<br><small>${Math.round(f.portion * m)} g</small></button>`).join('')}</div>
      <label class="inline">${t('grams')} <input id="gramsIn" type="number" inputmode="numeric" value="${grams}" min="1" max="2000"></label>
      <div class="kcal-big">${Math.round(kc)} <small>kcal</small></div>
      ${b ? `<p class="center small muted">${Math.round((100 * kc) / b.kcal)}% ${t('of_day')}</p>` : ''}
      <table class="nut"><tr><td>${t('protein')}</td><td>${round(f.p * q, 1)} g</td><td>${t('carbs')}</td><td>${round(f.c * q, 1)} g</td></tr>
      <tr><td>${t('fat')}</td><td>${round(f.f * q, 1)} g</td><td>${t('fiber')}</td><td>${round(f.fiber * q, 1)} g</td></tr>
      <tr><td>${t('sugar')}</td><td>${round(f.sugar * q, 1)} g</td><td>${t('per100')}</td><td>${f.kcal} kcal</td></tr></table>
      <ul class="remarks">${rm.map(([c, k]) => `<li class="${c}">${t(k)}</li>`).join('')}</ul>
      <button class="btn primary big full" data-act="addFood" data-id="${id}">➕ ${t('add_meal')}</button>
      <button class="btn full" data-act="closeModal">${t('close')}</button>`);
    const gi = $('#gramsIn');
    gi.onchange = () => foodDetail(id, Math.max(1, Math.min(2000, +gi.value || f.portion)));
  }

  function takePhoto(src) {
    if (current !== 'food') tab('food');
    if (NATIVE) {
      toast(t('analysing'));
      Android.pickImage(src, reg({ done(res, err) {
        if (!res) { if (err && err !== 'cancel') toast(err); return; }
        foodState.photo = res; foodState.q = ''; foodState.cat = null;
        if (current === 'food') render(); else tab('food');
      } }));
      return;
    }
    // browser fallback: show the picture, let the user search (no on-device AI here)
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; if (src === 'camera') inp.capture = 'environment';
    inp.onchange = () => {
      const file = inp.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = () => { foodState.photo = { img: r.result, labels: [] }; render(); toast(t('needs_app')); };
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
    return `${header(t('profile'), false)}
      <div class="row between"><span>👤 <b>${esc(displayName())}</b></span><button class="btn sm" data-act="logout">${t('logout')}</button></div>
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

  // ------------------------------------------------------------------ after-render hooks
  function after(view, arg) {
    if (stopAnim) { stopAnim(); stopAnim = null; }
    if (view === 'exercise') stopAnim = Figure.animate($('#anim'), EX[arg]);
    if (view === 'food') {
      const s = $('#foodSearch');
      s.oninput = () => {
        foodState.q = s.value; foodState.cat = null;
        const q = s.value.trim().toLowerCase();
        const res = q ? FOODS.filter((f) => [f.name.fr, f.name.en, f.name.ar, ...f.keys].some((n) => n.toLowerCase().includes(q))) : [];
        $('#foodResults').innerHTML = res.slice(0, 40).map(foodRow).join('');
      };
    }
    if (view === 'coach') { const sel = $('#coachSel'); sel.onchange = () => { coachEx = sel.value; render(); }; }
    if (view === 'workout') {
      app().querySelectorAll('input[data-w]').forEach((inp) => {
        inp.onchange = () => { W.ex[inp.dataset.w].sets[inp.dataset.s][inp.dataset.k] = inp.value; store.set('fc_w_' + user, W); };
      });
    }
    if (view === 'me') {
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
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act],[data-tab],[data-lang]');
    if (!b) { if (e.target.id === 'modal') closeModal(); return; }
    if (b.dataset.tab) { tab(b.dataset.tab); return; }
    if (b.dataset.lang) { I18N.set(b.dataset.lang); render(); return; }
    const d = b.dataset;
    switch (d.act) {
      case 'back': goBack(); break;
      case 'toggleAuth': loginMode = loginMode === 'login' ? 'signup' : 'login'; render(); break;
      case 'logout': store.del('fc_session'); user = null; D = null; W = null; stack = [['home']]; render(); break;
      case 'ex': go('exercise', d.id); break;
      case 'muscle': filter.muscle = d.id; tab('train'); break;
      case 'fmuscle': filter.muscle = d.id; render(); break;
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
        store.set('fc_w_' + user, W); render();
        if (s.done) startRest(prescription(EX[W.ex[d.w].id]).rest);
        break;
      }
      case 'addSet': { const x = W.ex[d.w]; x.sets.push({ kg: x.sets[x.sets.length - 1]?.kg || '', reps: '', done: false }); store.set('fc_w_' + user, W); render(); break; }
      case 'swap': {
        const x = W.ex[d.w];
        D.prefs.swaps[x.id] = (D.prefs.swaps[x.id] || 0) + 1; saveData(); // learn: user doesn't like this one
        const alt = chooseExercises([EX[x.id].group], W.ex.map((y) => y.id))[0];
        if (alt) { const rx = prescription(EX[alt]); W.ex[d.w] = { id: alt, sets: Array.from({ length: rx.sets }, () => ({ kg: '', reps: '', done: false })) }; store.set('fc_w_' + user, W); render(); }
        break;
      }
      case 'skipRest': clearInterval(restTimer); $('#rest').hidden = true; break;
      case 'finish': finishWorkout(); break;
      case 'cancelW': clearInterval(restTimer); $('#rest').hidden = true; W = null; store.del('fc_w_' + user); tab('home'); break;
      case 'photo': takePhoto(d.src); break;
      case 'fcat': foodState.cat = foodState.cat === d.id ? null : d.id; foodState.q = ''; render(); break;
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
  const s = store.get('fc_session', null);
  if (s && store.get('fc_users', {})[s]) openSession(s);
  stack = [[user && !D.profile ? 'me' : 'home']];
  if (user && store.get('fc_w_' + user, null)) W = store.get('fc_w_' + user, null);
  render();
  window.FC = { body, plan, grade, matchLabels, muscleState }; // for debugging / tests
})();
