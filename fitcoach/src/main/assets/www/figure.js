// Animated human mannequin demonstrating an exercise (offline "video").
// Skeleton: absolute angles in degrees, math convention (0 = right, 90 = up). Figure faces right.
// The target muscle glows on the body; equipment is drawn around the figure.
(function () {
  const L = { T: 34, HEAD: 11, R: 7.6, UA: 18, FA: 17, TH: 24, SH: 23, FT: 8 };
  const FLOOR = 140; // svg y of world y = 0 (the visible floor line is 3.5 lower, under the shoes)
  const GROUND = FLOOR + 3.5;
  const rad = (d) => (d * Math.PI) / 180;
  const go = (p, ang, len) => [p[0] + len * Math.cos(rad(ang)), p[1] + len * Math.sin(rad(ang))];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]) || 1;
  const unit = (a) => mul(a, 1 / len(a));
  const rotL = (a) => [-a[1], a[0]]; // +90° (counter-clockwise, world coords)
  const rotR = (a) => [a[1], -a[0]]; // -90°
  const lerpP = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  let sex = 'm';
  function setSex(s) { sex = s === 'f' ? 'f' : 'm'; }

  // ---------------------------------------------------------------- skeletons
  // feet flat on the floor when the shin points down, otherwise perpendicular to the shin (toes)
  const footAng = (s) => (s > -150 && s < -30 ? 0 : s + 90);

  function sidePoints(k) {
    const P = {};
    P.hip = [0, 0];
    P.sh = go(P.hip, k.t, L.T + (k.up || 0));
    P.neck = go(P.hip, k.t, L.T + 3);
    P.head = go(P.hip, k.t, L.T + L.HEAD);
    P.el = go(P.sh, k.a, L.UA);
    P.wr = go(P.el, k.f, L.FA);
    P.el2 = go(P.sh, k.a2 ?? k.a, L.UA);
    P.wr2 = go(P.el2, k.f2 ?? k.f, L.FA);
    P.kn = go(P.hip, k.l, L.TH);
    P.an = go(P.kn, k.s, L.SH);
    P.toe = go(P.an, k.ft ?? footAng(k.s), L.FT);
    P.kn2 = go(P.hip, k.l2 ?? k.l, L.TH);
    P.an2 = go(P.kn2, k.s2 ?? k.s, L.SH);
    P.toe2 = go(P.an2, k.ft2 ?? k.ft ?? footAng(k.s2 ?? k.s), L.FT);
    return P;
  }

  function frontPoints(k) {
    const m = (ang) => 180 - ang; // mirror for the other side
    const w = sex === 'f' ? 9.5 : 11;
    const P = {};
    P.hip = [0, 0];
    P.neck = [0, L.T + 2];
    P.head = [0, L.T + L.HEAD];
    P.shR = [-w, L.T - 2]; P.shL = [w, L.T - 2];
    P.waR = [-8, 12]; P.waL = [8, 12];
    P.hipR = [-7, 0]; P.hipL = [7, 0];
    P.elR = go(P.shR, m(k.a), L.UA); P.wrR = go(P.elR, m(k.f), L.FA);
    P.elL = go(P.shL, k.a, L.UA); P.wrL = go(P.elL, k.f, L.FA);
    P.knR = go(P.hipR, m(k.l), L.TH); P.anR = go(P.knR, m(k.s), L.SH);
    P.knL = go(P.hipL, k.l, L.TH); P.anL = go(P.knL, k.s, L.SH);
    return P;
  }

  const lerp = (a, b, t) => (a == null || b == null ? a ?? b : a + (b - a) * t);
  function mix(k1, k2, t) {
    const o = {};
    for (const key of new Set([...Object.keys(k1), ...Object.keys(k2)])) o[key] = lerp(k1[key], k2[key], t);
    return o;
  }

  // world (y up, relative) -> svg coords
  function place(ex, k) {
    const front = ex.view === 'front';
    const P = front ? frontPoints(k) : sidePoints(k);
    let dx, dy;
    if (front) {
      dx = 100; dy = -Math.min(P.anR[1], P.anL[1]) + 3;
    } else {
      const an = ex.anchor || { p: 'ankle', x: 100, y: 0 };
      const key = { ankle: 'an', wrist: 'wr', hip: 'hip', toe: 'toe', knee: 'kn', sh: 'sh' }[an.p];
      dx = an.x - P[key][0]; dy = an.y - P[key][1];
    }
    dy += k.lift || 0;
    const W = {};
    for (const n in P) W[n] = [P[n][0] + dx, P[n][1] + dy];
    return W;
  }

  // ---------------------------------------------------------------- drawing helpers (world coords)
  const sv = (p) => `${p[0].toFixed(1)},${(FLOOR - p[1]).toFixed(1)}`;
  // tapered limb with round ends
  function limb(a, b, w1, w2, cls) {
    const d = unit(sub(b, a)), n = rotL(d);
    const a1 = add(a, mul(n, w1 / 2)), a2 = add(a, mul(n, -w1 / 2));
    const b1 = add(b, mul(n, w2 / 2)), b2 = add(b, mul(n, -w2 / 2));
    return `<path class="${cls}" d="M${sv(a1)} L${sv(b1)} A${(w2 / 2).toFixed(1)},${(w2 / 2).toFixed(1)} 0 0 1 ${sv(b2)} L${sv(a2)} A${(w1 / 2).toFixed(1)},${(w1 / 2).toFixed(1)} 0 0 1 ${sv(a1)} Z"/>`;
  }
  const circ = (c, r, cls) => `<circle class="${cls}" cx="${c[0].toFixed(1)}" cy="${(FLOOR - c[1]).toFixed(1)}" r="${r}"/>`;
  function ell(c, dir, rx, ry, cls) {
    const ang = (-Math.atan2(dir[1], dir[0]) * 180) / Math.PI;
    return `<ellipse class="${cls}" cx="${c[0].toFixed(1)}" cy="${(FLOOR - c[1]).toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${ang.toFixed(1)} ${c[0].toFixed(1)} ${(FLOOR - c[1]).toFixed(1)})"/>`;
  }
  const poly = (pts, cls) => `<path class="${cls}" d="M${pts.map(sv).join(' L')} Z"/>`;

  function torsoSide(P) {
    const d = unit(sub(P.sh, P.hip)), n = rotR(d); // n = front of the body
    const f = sex === 'f';
    const at = (t, off) => add(add(P.hip, mul(d, L.T * t)), mul(n, off));
    const pts = [at(-0.08, -6.5), at(0.3, -6), at(0.62, -7.5), at(0.92, -6.2), at(1.02, -3), at(1.02, 3.5), at(0.85, f ? 8.6 : 8.2), at(0.62, f ? 7 : 8), at(0.32, 6.4), at(-0.05, 6.2)];
    return { d, n, pts };
  }

  // ---------------------------------------------------------------- muscle highlight
  function highlights(P, groups, cls) {
    let s = '';
    const T = torsoSide(P);
    const seg = (a, b) => ({ d: unit(sub(b, a)), l: len(sub(b, a)) });
    for (const g of groups) {
      const at = (t, off) => add(add(P.hip, mul(T.d, L.T * t)), mul(T.n, off));
      if (g === 'chest') s += ell(at(0.76, 5), T.d, 7, 3.6, cls);
      if (g === 'abs') s += ell(at(0.36, 4.4), T.d, 8.5, 2.6, cls);
      if (g === 'back') s += ell(at(0.6, -4.6), T.d, 9, 3.2, cls);
      if (g === 'lowerback') s += ell(at(0.2, -4.2), T.d, 5.5, 2.6, cls);
      if (g === 'traps') s += ell(at(0.98, -3), T.d, 4.5, 3, cls);
      if (g === 'shoulders') s += circ(P.sh, 4.6, cls);
      if (g === 'glutes') s += circ(add(at(-0.04, -4.2), mul(T.d, -1)), 5.6, cls);
      if (g === 'biceps' || g === 'triceps' || g === 'forearms') {
        const [a, b] = g === 'forearms' ? [P.el, P.wr] : [P.sh, P.el];
        const S = seg(a, b), n = rotL(S.d), side = g === 'triceps' ? -1 : 1;
        s += ell(add(lerpP(a, b, g === 'forearms' ? 0.38 : 0.55), mul(n, side * 1.6)), S.d, S.l * 0.3, 2.2, cls);
      }
      if (g === 'quads' || g === 'hamstrings') {
        const S = seg(P.hip, P.kn), n = rotL(S.d), side = g === 'quads' ? 1 : -1;
        s += ell(add(lerpP(P.hip, P.kn, 0.55), mul(n, side * 2.4)), S.d, S.l * 0.36, 3.2, cls);
      }
      if (g === 'calves') {
        const S = seg(P.kn, P.an), n = rotL(S.d);
        s += ell(add(lerpP(P.kn, P.an, 0.33), mul(n, -2)), S.d, S.l * 0.27, 2.6, cls);
      }
    }
    return s;
  }

  function highlightsFront(P, groups, cls) {
    let s = '';
    for (const g of groups) {
      if (g === 'shoulders') s += circ(P.shR, 4.6, cls) + circ(P.shL, 4.6, cls);
      if (g === 'traps') s += ell([P.shR[0] + 5, P.shR[1] + 2], [1, 0.4], 4, 2, cls) + ell([P.shL[0] - 5, P.shL[1] + 2], [1, -0.4], 4, 2, cls);
      if (g === 'chest') s += ell([P.hip[0] - 5, L.T - 8 + P.hip[1]], [1, 0], 5, 3.4, cls) + ell([P.hip[0] + 5, L.T - 8 + P.hip[1]], [1, 0], 5, 3.4, cls);
      if (g === 'abs') s += ell([P.hip[0], P.hip[1] + 13], [0, 1], 8, 4, cls);
      if (g === 'quads' || g === 'glutes') {
        s += ell(lerpP(P.hipR, P.knR, 0.5), sub(P.knR, P.hipR), 9, 4, cls) + ell(lerpP(P.hipL, P.knL, 0.5), sub(P.knL, P.hipL), 9, 4, cls);
      }
      if (g === 'calves') s += ell(lerpP(P.knR, P.anR, 0.35), sub(P.anR, P.knR), 6, 2.6, cls) + ell(lerpP(P.knL, P.anL, 0.35), sub(P.anL, P.knL), 6, 2.6, cls);
      if (g === 'biceps' || g === 'triceps') s += ell(lerpP(P.shR, P.elR, 0.55), sub(P.elR, P.shR), 5.5, 2.4, cls) + ell(lerpP(P.shL, P.elL, 0.55), sub(P.elL, P.shL), 5.5, 2.4, cls);
    }
    return s;
  }

  // ---------------------------------------------------------------- equipment
  function equipBack(ex, P) {
    let s = '';
    if (ex.wall) s += `<rect class="eq-wall" x="${ex.wall - 4}" y="10" width="6" height="${GROUND - 10}" rx="1"/>`;
    if (ex.bench) {
      const [x1, x2, h] = ex.bench;
      s += `<rect class="eq-frame" x="${x1 + 4}" y="${FLOOR - h + 4}" width="4" height="${h - 0.5}"/><rect class="eq-frame" x="${x2 - 8}" y="${FLOOR - h + 4}" width="4" height="${h - 0.5}"/>` +
        `<rect class="eq-pad" x="${x1}" y="${FLOOR - h - 1}" width="${x2 - x1}" height="6" rx="3"/>`;
    }
    if (ex.tool === 'bar') s += `<rect class="eq-frame" x="56" y="2" width="4" height="${GROUND - 2}"/><rect class="eq-frame" x="148" y="2" width="4" height="${GROUND - 2}"/><line class="eq-bar" x1="56" y1="${FLOOR - 135}" x2="152" y2="${FLOOR - 135}"/>`;
    if (ex.tool === 'dipbar' || ex.tool === 'lowbar') {
      const y = FLOOR - P.wr[1] + (ex.tool === 'dipbar' ? 2 : -1);
      const x = P.wr[0];
      s += `<rect class="eq-frame" x="${(x + 14).toFixed(1)}" y="${y.toFixed(1)}" width="4" height="${(GROUND - y).toFixed(1)}"/>` + (ex.tool === 'lowbar' ? `<rect class="eq-frame" x="${(x - 18).toFixed(1)}" y="${y.toFixed(1)}" width="4" height="${(GROUND - y).toFixed(1)}"/>` : '');
    }
    if (ex.tool === 'cable') s += `<rect class="eq-frame" x="${(P.wr[0] + 22).toFixed(1)}" y="4" width="6" height="${GROUND - 4}"/><circle class="eq-plate" cx="${P.wr[0].toFixed(1)}" cy="8" r="4"/>`;
    if (ex.seat) {
      const [x1, x2, h] = ex.seat;
      s += `<rect class="eq-frame" x="${(x1 + x2) / 2 - 3}" y="${FLOOR - h}" width="6" height="${h + 3.5}"/><rect class="eq-pad" x="${x1}" y="${FLOOR - h - 2}" width="${x2 - x1}" height="6" rx="3"/>`;
      if (ex.seatBack) s += `<rect class="eq-pad" x="${x1 - 3}" y="${FLOOR - h - 34}" width="6" height="34" rx="3"/>`;
    }
    if (ex.mat) s += `<rect class="eq-mat" x="${ex.mat[0]}" y="${GROUND - 2.5}" width="${ex.mat[1] - ex.mat[0]}" height="3" rx="1.5"/>`;
    return s;
  }
  function equipFront(ex, P, k) {
    let s = '';
    const dbAt = (p, dir) => { const d = unit(dir), n = rotL(d); return limb(add(p, mul(n, -6)), add(p, mul(n, 6)), 2, 2, 'eq-handle') + limb(add(p, mul(n, -7)), add(p, mul(n, -4)), 7, 7, 'eq-plate') + limb(add(p, mul(n, 4)), add(p, mul(n, 7)), 7, 7, 'eq-plate'); };
    if (ex.tool === 'db') {
      if (ex.view === 'front') s += dbAt(P.wrR, sub(P.wrR, P.elR)) + dbAt(P.wrL, sub(P.wrL, P.elL));
      else s += `<polygon class="eq-plate" points="${hex(P.wr, 5)}"/><polygon class="eq-hub" points="${hex(P.wr, 2.2)}"/>`;
    }
    if (ex.tool === 'bb') s += circ(P.wr, ex.plate || 11, 'eq-plate') + circ(P.wr, 3, 'eq-hub');
    if (ex.tool === 'dipbar' || ex.tool === 'lowbar') s += `<line class="eq-bar" x1="${(P.wr[0] - 20).toFixed(1)}" y1="${(FLOOR - P.wr[1] + 1).toFixed(1)}" x2="${(P.wr[0] + 20).toFixed(1)}" y2="${(FLOOR - P.wr[1] + 1).toFixed(1)}"/>`;
    if (ex.tool === 'cable') s += `<line class="eq-cable" x1="${P.wr[0].toFixed(1)}" y1="8" x2="${P.wr[0].toFixed(1)}" y2="${(FLOOR - P.wr[1]).toFixed(1)}"/><line class="eq-bar" x1="${(P.wr[0] - 12).toFixed(1)}" y1="${(FLOOR - P.wr[1]).toFixed(1)}" x2="${(P.wr[0] + 12).toFixed(1)}" y2="${(FLOOR - P.wr[1]).toFixed(1)}"/>`;
    if (ex.tool === 'pad') s += circ(add(P.an, [2, 2]), 4, 'eq-pad');
    return s;
  }
  function hex(c, r) {
    const p = [];
    for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i; p.push(sv([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)])); }
    return p.join(' ');
  }

  // ---------------------------------------------------------------- figure
  function draw(ex, k, opts = {}) {
    const P = place(ex, k);
    const prim = [ex.group].filter((g) => g !== 'cardio');
    const sec = ex.second || [];
    const f = sex === 'f';
    let s = `<line class="fig-floor" x1="0" y1="${FLOOR + 3.5}" x2="200" y2="${FLOOR + 3.5}"/>`;
    // soft shadow
    const cx = ex.view === 'front' ? P.hip[0] : (P.an[0] + P.hip[0] + P.sh[0]) / 3;
    s += `<ellipse class="fig-shadow" cx="${cx.toFixed(1)}" cy="${FLOOR + 3.5}" rx="34" ry="3"/>`;
    s += equipBack(ex, P);

    if (ex.view === 'front') {
      const w = f ? 9.5 : 11;
      s += limb(P.hipR, P.knR, 11, 8.5, 'mk-skin') + limb(P.knR, P.anR, 8.5, 5.5, 'mk-skin') + limb(P.hipL, P.knL, 11, 8.5, 'mk-skin') + limb(P.knL, P.anL, 8.5, 5.5, 'mk-skin');
      s += limb(P.anR, add(P.anR, [-3, -2]), 6, 6, 'mk-shoe') + limb(P.anL, add(P.anL, [3, -2]), 6, 6, 'mk-shoe');
      s += limb(P.hipR, lerpP(P.hipR, P.knR, 0.42), 12, 11, 'mk-shorts') + limb(P.hipL, lerpP(P.hipL, P.knL, 0.42), 12, 11, 'mk-shorts');
      s += poly([[P.hipR[0] - 2, P.hipR[1] - 2], [P.hipL[0] + 2, P.hipL[1] - 2], [P.waL[0] + 1, P.waL[1]], [P.waR[0] - 1, P.waR[1]]], 'mk-shorts');
      s += limb(P.neck, add(P.neck, [0, 4]), 6, 6, 'mk-skin');
      s += poly([P.waR, P.waL, [P.shL[0] + 2.5, P.shL[1] + 1], [P.shL[0] - 3, P.shL[1] + 4], [P.shR[0] + 3, P.shR[1] + 4], [P.shR[0] - 2.5, P.shR[1] + 1]], 'mk-shirt');
      s += limb(P.shR, P.elR, 7, 6, 'mk-skin') + limb(P.elR, P.wrR, 6, 4.5, 'mk-skin') + circ(P.wrR, 3.2, 'mk-skin') + limb(P.shR, lerpP(P.shR, P.elR, 0.38), 8, 7.5, 'mk-shirt');
      s += limb(P.shL, P.elL, 7, 6, 'mk-skin') + limb(P.elL, P.wrL, 6, 4.5, 'mk-skin') + circ(P.wrL, 3.2, 'mk-skin') + limb(P.shL, lerpP(P.shL, P.elL, 0.38), 8, 7.5, 'mk-shirt');
      s += highlightsFront(P, sec, 'mk-hl2') + highlightsFront(P, prim, 'mk-hl');
      s += circ(P.head, L.R + 0.6, 'mk-hair') + circ([P.head[0], P.head[1] - 1.3], L.R - 0.4, 'mk-skin');
      if (f) s += circ([P.head[0] + 6, P.head[1] + 3], 3, 'mk-hair') + circ([P.head[0] - 6, P.head[1] + 3], 3, 'mk-hair');
      s += equipFront(ex, P, k);
      void w;
      return s;
    }

    const T = torsoSide(P);
    const dl = sub(P.toe, P.an);
    // far side (behind the body)
    s += `<g class="mk-far">`;
    s += limb(P.hip, P.kn2, 11, 8.5, 'mk-skin') + limb(P.kn2, P.an2, 8.5, 5.5, 'mk-skin') + limb(P.an2, P.toe2, 5.5, 4, 'mk-shoe');
    s += limb(P.hip, lerpP(P.hip, P.kn2, 0.38), 12.5, 11.5, 'mk-shorts');
    s += limb(P.sh, P.el2, 7, 6, 'mk-skin') + limb(P.el2, P.wr2, 6, 4.5, 'mk-skin') + circ(P.wr2, 3.2, 'mk-skin');
    if (ex.tool === 'db' && !ex.oneArm) s += `<polygon class="eq-plate" points="${hex(P.wr2, 5)}"/>`;
    s += `</g>`;
    // torso, shorts, neck, head
    s += poly(T.pts, 'mk-shirt');
    s += poly([add(P.hip, mul(T.n, -7)), add(P.hip, mul(T.n, 6.6)), add(add(P.hip, mul(T.d, 9)), mul(T.n, 6.6)), add(add(P.hip, mul(T.d, 9)), mul(T.n, -6.8))], 'mk-shorts');
    if (f) s += circ(add(add(P.sh, mul(T.d, -6)), mul(T.n, 4)), 0.01, 'mk-skin'); // (kept for symmetry)
    // near leg
    s += limb(P.hip, P.kn, 11.5, 8.5, 'mk-skin') + limb(P.kn, P.an, 8.5, 5.5, 'mk-skin');
    s += limb(P.an, P.toe, 6, 4.2, 'mk-shoe') + limb(add(P.an, mul(unit(dl), -1.5)), P.toe, 2, 2, 'mk-sole');
    s += limb(P.hip, lerpP(P.hip, P.kn, 0.38), 13, 12, 'mk-shorts');
    s += highlights(P, sec, 'mk-hl2') + highlights(P, prim, 'mk-hl');
    s += limb(P.sh, P.neck, 5.5, 5.5, 'mk-skin');
    // head: hair circle, face circle shifted to the front
    const hd = T.d, hn = T.n;
    s += circ(P.head, L.R + 0.5, 'mk-hair');
    s += circ(add(add(P.head, mul(hn, 1.1)), mul(hd, -1.2)), L.R - 0.3, 'mk-skin');
    if (f) s += circ(add(add(P.head, mul(hn, -7.5)), mul(hd, 1.5)), 3.4, 'mk-hair');
    s += circ(add(add(P.head, mul(hn, 4.6)), mul(hd, 0.8)), 0.9, 'mk-eye');
    // near arm (in front of the torso)
    s += limb(P.sh, P.el, 7.5, 6, 'mk-skin') + limb(P.el, P.wr, 6, 4.5, 'mk-skin') + circ(P.wr, 3.3, 'mk-skin');
    s += limb(P.sh, lerpP(P.sh, P.el, 0.36), 9, 8, 'mk-shirt');
    s += highlights(P, prim.filter((g) => ['biceps', 'triceps', 'forearms', 'shoulders'].includes(g)), 'mk-hl');
    s += equipFront(ex, P, k);
    return s;
  }

  // Animate between the 2 key positions; returns a stop() function.
  function animate(svg, ex, period = 2800) {
    let raf = 0, start = performance.now(), stopped = false;
    const k1 = ex.frames[0], k2 = ex.frames[1] || ex.frames[0];
    const tick = (now) => {
      if (stopped || !svg.isConnected) return;
      const ph = ((now - start) % period) / period;
      const x = 0.5 - 0.5 * Math.cos(ph * 2 * Math.PI);
      const t = Math.min(1, Math.max(0, (x - 0.08) / 0.84));
      svg.innerHTML = draw(ex, mix(k1, k2, t));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; cancelAnimationFrame(raf); };
  }

  function still(ex, i = 1) {
    return `<svg class="fig" viewBox="0 0 200 150" aria-hidden="true">${draw(ex, ex.frames[i] || ex.frames[0])}</svg>`;
  }

  window.Figure = { draw, animate, still, setSex };
})();
