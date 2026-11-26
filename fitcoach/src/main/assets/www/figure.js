// FitCoach 3D mannequin: an exercise is described by 2 key positions (joint angles) and rendered
// in 3D with an orbiting camera (profile, 3/4, front, back), depth sorting, shading, equipment and
// glowing target muscles.
//
// Key positions (sagittal exercises): angles in degrees, math convention in the side plane
//   t torso, a/f upper arm & forearm, l/s thigh & shin (near side), a2/f2/l2/s2 far side,
//   ah / ah2: arm rotated outward around the vertical axis (0 = in the side plane, 90 = to the side),
//   lh / lh2: same for the legs, ft foot angle, up shoulder shrug, lift (jump).
// Frontal exercises (ex.view === 'front') use a/f/l/s in the frontal plane instead.
(function () {
  const L = { T: 34, HEAD: 11, R: 7.6, UA: 18, FA: 17, TH: 24, SH: 23, FT: 8 };
  const FLOOR = 132; // svg y of world y = 0
  const GROUND = -3.5; // world y of the ground (soles)
  const rad = (d) => (d * Math.PI) / 180;
  const go2 = (p, ang, len) => [p[0] + len * Math.cos(rad(ang)), p[1] + len * Math.sin(rad(ang))];
  const v3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
    norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  };
  const s2 = {
    sub: (a, b) => [a[0] - b[0], a[1] - b[1]], add: (a, b) => [a[0] + b[0], a[1] + b[1]], mul: (a, k) => [a[0] * k, a[1] * k],
    len: (a) => Math.hypot(a[0], a[1]) || 1e-6, dot: (a, b) => a[0] * b[0] + a[1] * b[1],
  };
  const unit2 = (a) => s2.mul(a, 1 / s2.len(a));
  const f1 = (n) => n.toFixed(1);

  let sex = 'm';
  function setSex(s) { sex = s === 'f' ? 'f' : 'm'; }
  const footAng = (s) => (s > -150 && s < -30 ? 0 : s + 90);

  // ------------------------------------------------------------------ skeleton (world, y up)
  function side2D(k) {
    const P = {};
    P.hip = [0, 0];
    P.sh = go2(P.hip, k.t, L.T + (k.up || 0));
    P.neck = go2(P.hip, k.t, L.T + 3);
    P.head = go2(P.hip, k.t, L.T + L.HEAD);
    P.el = go2(P.sh, k.a, L.UA); P.wr = go2(P.el, k.f, L.FA);
    P.el2 = go2(P.sh, k.a2 ?? k.a, L.UA); P.wr2 = go2(P.el2, k.f2 ?? k.f, L.FA);
    P.kn = go2(P.hip, k.l, L.TH); P.an = go2(P.kn, k.s, L.SH); P.toe = go2(P.an, k.ft ?? footAng(k.s), L.FT);
    P.kn2 = go2(P.hip, k.l2 ?? k.l, L.TH); P.an2 = go2(P.kn2, k.s2 ?? k.s, L.SH);
    P.toe2 = go2(P.an2, k.ft2 ?? k.ft ?? footAng(k.s2 ?? k.s), L.FT);
    return P;
  }

  // rotate a chain point (relative to its root) outward around the vertical axis
  const outward = (root, p, ang, side, zRoot) => {
    const dx = p[0] - root[0], dy = p[1] - root[1];
    return [root[0] + dx * Math.cos(rad(ang || 0)), p[1], zRoot + side * dx * Math.sin(rad(ang || 0))];
  };

  function build(ex, k) {
    const J = {};
    const SW = sex === 'f' ? 9.5 : 10.5; // shoulder joint half-width
    const HW = sex === 'f' ? 7.2 : 6.5; // hip joint half-width
    if (ex.view === 'front') {
      const m = (ang) => 180 - ang;
      const w = SW;
      const P = {};
      P.shR = [-w, L.T - 2]; P.shL = [w, L.T - 2]; P.hipR = [-HW, 0]; P.hipL = [HW, 0];
      P.elR = go2(P.shR, m(k.a), L.UA); P.wrR = go2(P.elR, m(k.f), L.FA);
      P.elL = go2(P.shL, k.a, L.UA); P.wrL = go2(P.elL, k.f, L.FA);
      P.knR = go2(P.hipR, m(k.l), L.TH); P.anR = go2(P.knR, m(k.s), L.SH);
      P.knL = go2(P.hipL, k.l, L.TH); P.anL = go2(P.knL, k.s, L.SH);
      const dy = -Math.min(P.anR[1], P.anL[1]) + (k.lift || 0);
      const to3 = (p) => [100, p[1] + dy, -p[0]];
      J.hipC = [100, dy, 0]; J.shC = [100, L.T - 2 + dy, 0]; J.neck = [100, L.T + 2 + dy, 0]; J.head = [100, L.T + L.HEAD + dy, 0];
      J.shN = to3(P.shR); J.elN = to3(P.elR); J.wrN = to3(P.wrR); J.hipN = to3(P.hipR); J.knN = to3(P.knR); J.anN = to3(P.anR);
      J.shF = to3(P.shL); J.elF = to3(P.elL); J.wrF = to3(P.wrL); J.hipF = to3(P.hipL); J.knF = to3(P.knL); J.anF = to3(P.anL);
      J.toeN = v3.add(J.anN, [L.FT, 0, 0]); J.toeF = v3.add(J.anF, [L.FT, 0, 0]);
      J.n = [1, 0, 0]; J.d = [0, 1, 0];
      return J;
    }
    const P = side2D(k);
    const an = ex.anchor || { p: 'ankle', x: 100, y: 0 };
    const key = { ankle: 'an', wrist: 'wr', hip: 'hip', toe: 'toe', knee: 'kn', sh: 'sh' }[an.p];
    const dx = an.x - P[key][0], dy = an.y - P[key][1] + (k.lift || 0);
    const W = (p, z) => [p[0] + dx, p[1] + dy, z];
    J.hipC = W(P.hip, 0); J.shC = W(P.sh, 0); J.neck = W(P.neck, 0); J.head = W(P.head, 0);
    // arms (outward rotation around the shoulder) and legs (around the hip)
    for (const [side, sfx, el, wr, ah] of [[1, 'N', P.el, P.wr, k.ah], [-1, 'F', P.el2, P.wr2, k.ah2 ?? k.ah]]) {
      J['sh' + sfx] = W(P.sh, side * SW);
      const e = outward(P.sh, el, ah, side, side * SW), w = outward(P.sh, wr, ah, side, side * SW);
      J['el' + sfx] = [e[0] + dx, e[1] + dy, e[2]]; J['wr' + sfx] = [w[0] + dx, w[1] + dy, w[2]];
    }
    for (const [side, sfx, kn, a, toe, lh] of [[1, 'N', P.kn, P.an, P.toe, k.lh], [-1, 'F', P.kn2, P.an2, P.toe2, k.lh2 ?? k.lh]]) {
      J['hip' + sfx] = W(P.hip, side * HW);
      for (const [nm, p] of [['kn', kn], ['an', a], ['toe', toe]]) {
        const q = outward(P.hip, p, lh, side, side * HW);
        J[nm + sfx] = [q[0] + dx, q[1] + dy, q[2]];
      }
    }
    const d = v3.norm(v3.sub(J.shC, J.hipC));
    J.d = d; J.n = [d[1], -d[0], 0]; // front of the body (torso axis rotated -90° in the side plane)
    if (ex.prone) J.n = [-J.n[0], -J.n[1], 0]; // lying face down
    return J;
  }

  const lerp = (a, b, t) => (a == null || b == null ? a ?? b : a + (b - a) * t);
  function mix(k1, k2, t) {
    const o = {};
    for (const key of new Set([...Object.keys(k1), ...Object.keys(k2)])) o[key] = lerp(k1[key], k2[key], t);
    return o;
  }

  // ------------------------------------------------------------------ camera
  function camera(yaw, pitch, px) {
    const cy = Math.cos(rad(yaw)), sy = Math.sin(rad(yaw)), cp = Math.cos(rad(pitch)), sp = Math.sin(rad(pitch));
    const P = (p) => {
      const x = p[0] - px, z = p[2];
      const d = x * sy + z * cy; // towards the camera
      return [100 + x * cy - z * sy, FLOOR - (p[1] * cp - d * sp), d * cp + p[1] * sp];
    };
    P.dir = [sy * cp, sp, cy * cp]; // world vector pointing to the camera
    P.sp = sp;
    return P;
  }
  const facing = (P, n) => n[0] * P.dir[0] + n[1] * P.dir[1] + n[2] * P.dir[2];

  // ------------------------------------------------------------------ 2D drawing (svg coords)
  function capsule(a, b, w1, w2, cls) {
    let d = s2.sub(b, a);
    if (s2.len(d) < 0.01) d = [0, 1];
    d = unit2(d);
    const n = [-d[1], d[0]];
    const a1 = s2.add(a, s2.mul(n, w1 / 2)), a2 = s2.add(a, s2.mul(n, -w1 / 2));
    const b1 = s2.add(b, s2.mul(n, w2 / 2)), b2 = s2.add(b, s2.mul(n, -w2 / 2));
    const r1 = f1(w1 / 2), r2 = f1(w2 / 2);
    return `<path class="${cls}" d="M${f1(a1[0])},${f1(a1[1])} L${f1(b1[0])},${f1(b1[1])} A${r2},${r2} 0 0 0 ${f1(b2[0])},${f1(b2[1])} L${f1(a2[0])},${f1(a2[1])} A${r1},${r1} 0 0 0 ${f1(a1[0])},${f1(a1[1])} Z"/>`;
  }
  // limb with a soft highlight on the lit (upper) side for volume
  function limb(a, b, w1, w2, cls) {
    let s = capsule(a, b, w1, w2, cls);
    if (!/mk-skin|mk-shirt|mk-shorts/.test(cls)) return s;
    let d = s2.sub(b, a);
    if (s2.len(d) < 0.5) return s;
    d = unit2(d);
    let n = [-d[1], d[0]];
    if (n[1] > 0) n = [-n[0], -n[1]];
    const off = s2.mul(n, Math.min(w1, w2) * 0.2);
    return s + capsule(s2.add(a, off), s2.add(b, off), w1 * 0.4, w2 * 0.4, 'mk-shine');
  }
  const circ = (c, r, cls) => `<circle class="${cls}" cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(r)}"/>`;
  function ell(c, dir, rx, ry, cls) {
    const ang = (Math.atan2(dir[1], dir[0]) * 180) / Math.PI;
    return `<ellipse class="${cls}" cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(Math.max(0.6, rx))}" ry="${f1(Math.max(0.6, ry))}" transform="rotate(${f1(ang)} ${f1(c[0])} ${f1(c[1])})"/>`;
  }
  const poly = (pts, cls) => `<path class="${cls}" d="M${pts.map((p) => f1(p[0]) + ',' + f1(p[1])).join(' L')} Z"/>`;
  function hull(pts) { // convex hull (monotone chain) of 2D points
    const p = pts.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  // 3D box -> silhouette + lit top face
  function box(P, b, cls) {
    const [x1, x2, y1, y2, z1, z2] = b;
    const c = [];
    for (const x of [x1, x2]) for (const y of [y1, y2]) for (const z of [z1, z2]) c.push(P([x, y, z]));
    const top = [P([x1, y2, z1]), P([x2, y2, z1]), P([x2, y2, z2]), P([x1, y2, z2])];
    return poly(hull(c), 'eq-' + cls) + poly(top, 'eq-' + cls + ' eq-top');
  }
  // box oriented along a direction in the side plane, centred on a 3D point
  function obox(P, c, ang, hu, hv, hw, cls) {
    const u = [Math.cos(rad(ang)), Math.sin(rad(ang)), 0], v = [-u[1], u[0], 0], w = [0, 0, 1];
    const pts = [];
    for (const a of [-hu, hu]) for (const b of [-hv, hv]) for (const z of [-hw, hw]) pts.push(P(v3.add(c, v3.add(v3.mul(u, a), v3.add(v3.mul(v, b), v3.mul(w, z))))));
    return poly(hull(pts), 'eq-' + cls);
  }
  // disc of radius r centred on c with normal along `axis` ('x' | 'z')
  function disc(P, c, r, axis, cls) {
    const pts = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * 2 * Math.PI, u = r * Math.cos(a), v = r * Math.sin(a);
      pts.push(P(axis === 'z' ? [c[0] + u, c[1] + v, c[2]] : [c[0], c[1] + v, c[2] + u]));
    }
    return poly(pts, cls);
  }

  // ------------------------------------------------------------------ equipment
  function staticProps(ex) {
    const B = [];
    if (ex.bench) { const [x1, x2, h] = ex.bench; B.push([[x1, x2, h - 5, h + 1, -10, 10], 'pad'], [[x1 + 3, x1 + 7, GROUND, h - 5, -8, 8], 'frame'], [[x2 - 7, x2 - 3, GROUND, h - 5, -8, 8], 'frame']); }
    if (ex.seat) {
      const [x1, x2, h] = ex.seat; const m = (x1 + x2) / 2;
      B.push([[m - 3, m + 3, GROUND, h - 5, -3, 3], 'frame'], [[m - 12, m + 12, GROUND, GROUND + 2, -12, 12], 'frame'], [[x1, x2, h - 5, h + 1, -11, 11], 'pad']);
      if (ex.seatBack) B.push([[x1 - 5, x1 + 1, h, h + 36, -10, 10], 'pad']);
    }
    if (ex.wall) B.push([[ex.wall - 5, ex.wall, GROUND, 128, -45, 45], 'wall']);
    if (ex.mat) B.push([[ex.mat[0], ex.mat[1], GROUND, GROUND + 0.8, -14, 14], 'mat']);
    if (ex.props) for (const p of ex.props) if (p.b) B.push([p.b, p.c || 'frame']);
    const a = ex.anchor || {};
    if (ex.tool === 'bar') {
      const x = a.x ?? 100;
      for (const s of [-1, 1]) B.push([[x - 20, x - 16, GROUND, 137, s * 40, s * 44], 'frame'], [[x - 20, x + 2, 134, 137, s * 40, s * 44], 'frame']);
    }
    if (ex.tool === 'lowbar') for (const s of [-1, 1]) B.push([[a.x - 2, a.x + 2, GROUND, a.y, s * 34, s * 38], 'frame']);
    if (ex.tool === 'dipbar') for (const s of [-1, 1]) for (const x of [a.x - 22, a.x + 18]) B.push([[x, x + 4, GROUND, a.y - 1, s * 14 - 2, s * 14 + 2], 'frame']);
    return B;
  }
  function staticLines(ex) {
    const a = ex.anchor || {};
    const Ls = [];
    if (ex.tool === 'bar') Ls.push([[a.x ?? 100, 135, -44], [a.x ?? 100, 135, 44]]);
    if (ex.tool === 'lowbar') Ls.push([[a.x, a.y, -38], [a.x, a.y, 38]]);
    if (ex.tool === 'dipbar') for (const s of [-1, 1]) Ls.push([[a.x - 22, a.y, s * 14], [a.x + 22, a.y, s * 14]]);
    if (ex.props) for (const p of ex.props) if (p.l) Ls.push(p.l);
    return Ls;
  }

  // ------------------------------------------------------------------ figure
  function draw(ex, k, opts = {}) {
    const J = build(ex, k);
    const yaw = opts.yaw ?? defaultYaw(ex), pitch = opts.pitch ?? 12;
    const P = camera(yaw, pitch, pivot(ex));
    const f = sex === 'f';
    const prim = [ex.group], sec = ex.second || [];
    const want = (g) => (prim.includes(g) ? 'mk-hl' : sec.includes(g) ? 'mk-hl2' : null);
    const items = []; // [depth, svg]

    // ground
    const g0 = P([pivot(ex), GROUND, 0]);
    let back = ell(g0, [1, 0], 84, 84 * P.sp + 1, 'fig-ground');
    const foot = P(v3.lerp(J.anN, J.anF, 0.5)), hipG = P([J.hipC[0], GROUND, J.hipC[2]]);
    const sh0 = [(foot[0] + hipG[0]) / 2, Math.max(foot[1], hipG[1]) + 0.5];
    back += ell(sh0, [1, 0], 30, 30 * P.sp + 2.5, 'fig-shadow');
    for (const [b, c] of staticProps(ex)) back += box(P, b, c);
    for (const l of staticLines(ex)) back += capsule(P(l[0]), P(l[1]), 2.6, 2.6, 'eq-bar');
    // cables (pulley -> hands)
    if (ex.cables) for (const c of ex.cables) {
      const to = c.to === 'C' ? v3.lerp(J.wrN, J.wrF, 0.5) : J['wr' + c.to];
      back += c.bar ? capsule(P(c.from), P(to), 2.6, 2.6, 'eq-bar') : `<line class="eq-cable" x1="${f1(P(c.from)[0])}" y1="${f1(P(c.from)[1])}" x2="${f1(P(to)[0])}" y2="${f1(P(to)[1])}"/>` + circ(P(c.from), 3, 'eq-pulley');
    }

    const Pd = (p) => P(p)[2];
    // ---- legs
    for (const sd of ['F', 'N']) {
      const hip = J['hip' + sd], kn = J['kn' + sd], an = J['an' + sd], toe = J['toe' + sd];
      const ph = P(hip), pk = P(kn), pa = P(an), pt = P(toe);
      let s = limb(ph, pk, 11.5, 8.5, 'mk-skin') + limb(pk, pa, 8.5, 5.6, 'mk-skin');
      s += capsule(pa, pt, 6.2, 4.4, 'mk-shoe') + capsule(s2.add(pa, s2.mul(unit2(s2.sub(pt, pa)), -1.5)), pt, 2, 2, 'mk-sole');
      s += limb(ph, P(v3.lerp(hip, kn, 0.32)), 12.6, 11.8, 'mk-shorts');
      // muscle glow on the legs
      const ld = v3.norm(v3.sub(kn, hip)), sd3 = v3.norm(v3.sub(an, kn));
      const front = (dir) => v3.mul(v3.norm([-dir[1], dir[0], 0]), ex.prone ? -1 : 1);
      for (const [g, a, b, t, side, rx] of [['quads', hip, kn, 0.55, 1, 0.36], ['hamstrings', hip, kn, 0.55, -1, 0.36], ['calves', kn, an, 0.33, -1, 0.27], ['glutes', hip, kn, 0.08, -1, 0.18]]) {
        const cls = want(g); if (!cls) continue;
        const dir = g === 'calves' ? sd3 : ld;
        const n = v3.mul(front(dir), side);
        const vis = facing(P, n);
        if (vis < -0.55) continue;
        const c = v3.add(v3.lerp(a, b, t), v3.mul(n, 2.6));
        const pa2 = P(a), pb2 = P(b);
        s += ell(P(c), s2.sub(pb2, pa2), s2.len(s2.sub(pb2, pa2)) * rx, 3.2 * (0.55 + 0.45 * Math.abs(vis)) + (g === 'glutes' ? 2.5 : 0), cls);
      }
      items.push([(Pd(hip) + Pd(kn) + Pd(an)) / 3 + (sd === 'N' ? 0.01 : 0), sd === 'F' ? `<g class="mk-far">${s}</g>` : s]);
    }

    // ---- torso
    const n3 = J.n, d3 = J.d, z3 = [0, 0, 1];
    const pH = P(J.hipC), pS = P(J.shC);
    let u = s2.sub(pS, pH); if (s2.len(u) < 0.5) u = [0, -1];
    u = unit2(u);
    const perp = [-u[1], u[0]];
    const ns = s2.sub(P(v3.add(J.hipC, n3)), pH), zs = s2.sub(P(v3.add(J.hipC, z3)), pH);
    const sections = f
      ? [[-0.07, 6.4, 9.6, 0], [0.32, 5.8, 7.2, 0.2], [0.62, 6.8, 8.4, 2.6], [0.86, 6.6, 9.4, 1.4], [1.0, 4.6, 8.6, 0]]
      : [[-0.07, 6.2, 8.6, 0], [0.32, 6.3, 8.2, 0.4], [0.62, 7.4, 9.8, 1.3], [0.86, 7.2, 11, 1], [1.0, 4.8, 9.8, 0]];
    const left = [], right = [];
    for (const [t, a, b, off] of sections) {
      const c = s2.add(s2.add(pH, s2.mul(s2.sub(pS, pH), t)), s2.mul(ns, off));
      const w = Math.hypot(a * s2.dot(ns, perp), b * s2.dot(zs, perp));
      left.push(s2.add(c, s2.mul(perp, w))); right.push(s2.add(c, s2.mul(perp, -w)));
    }
    let ts = poly(left.concat(right.reverse()), 'mk-shirt');
    // pelvis / shorts
    {
      const lft = [], rgt = [];
      for (const [t, a, b] of [[-0.09, 6.4, f ? 9.8 : 8.8], [0.24, 6.3, f ? 7.8 : 8.4]]) {
        const c = s2.add(pH, s2.mul(s2.sub(pS, pH), t));
        const w = Math.hypot(a * s2.dot(ns, perp), b * s2.dot(zs, perp)) + 0.3;
        lft.push(s2.add(c, s2.mul(perp, w))); rgt.push(s2.add(c, s2.mul(perp, -w)));
      }
      ts += poly(lft.concat(rgt.reverse()), 'mk-shorts');
    }
    // torso muscle glow
    for (const [g, t, depth, rx, ry, spread] of [['chest', 0.76, 7, 6.5, 3.4, 5], ['abs', 0.38, 6, 7.5, 2.6, 2.6], ['back', 0.62, -7, 8.5, 3.2, 5.5], ['lowerback', 0.2, -6, 5.5, 2.4, 2.8], ['traps', 0.95, -5, 4.5, 2.6, 4.5]]) {
      const cls = want(g); if (!cls) continue;
      const n = v3.mul(n3, Math.sign(depth));
      const vis = facing(P, n);
      if (vis < -0.45) continue;
      for (const sdz of [-1, 1]) {
        const c = v3.add(v3.add(v3.lerp(J.hipC, J.shC, t), v3.mul(n3, depth * 0.72)), [0, 0, sdz * spread]);
        ts += ell(P(c), u, rx, ry * (0.5 + 0.5 * Math.abs(vis)) + 0.6, cls);
      }
    }
    if (want('glutes')) {
      for (const sdz of [-1, 1]) {
        const n = v3.mul(n3, -1), vis = facing(P, n);
        if (vis > -0.45) ts += ell(P(v3.add(v3.add(J.hipC, v3.mul(n3, -4.5)), [0, -1.5, sdz * 4])), u, 5, 4 * (0.6 + 0.4 * Math.abs(vis)), want('glutes'));
      }
    }
    ts += limb(pS, P(J.neck), 5.6, 5.6, 'mk-skin');
    items.push([(Pd(J.hipC) + Pd(J.shC)) / 2, ts]);

    // ---- head
    {
      const up = d3;
      const fv = facing(P, n3);
      let hs = '';
      const ph = P(J.head);
      if (fv > -0.35) {
        hs += circ(P(v3.add(v3.add(J.head, v3.mul(n3, -1.2)), v3.mul(up, 0.9))), L.R + 0.5, 'mk-hair');
        hs += circ(P(v3.add(v3.add(J.head, v3.mul(n3, 1.2)), v3.mul(up, -0.8))), L.R - 0.3, 'mk-skin');
        for (const ez of [-2.6, 2.6]) {
          const e = v3.add(v3.add(v3.add(J.head, v3.mul(n3, 6)), v3.mul(up, 0.6)), [0, 0, ez]);
          if (Pd(e) > Pd(J.head) - 1) hs += circ(P(e), 0.95, 'mk-eye');
        }
      } else {
        hs += circ(ph, L.R - 0.2, 'mk-skin') + circ(P(v3.add(v3.add(J.head, v3.mul(n3, -1)), v3.mul(up, 0.5))), L.R + 0.1, 'mk-hair');
      }
      if (f) hs = circ(P(v3.add(v3.add(J.head, v3.mul(n3, -7.6)), v3.mul(up, 1.8))), 3.4, 'mk-hair') + hs;
      items.push([Pd(J.head) + 0.2, hs]);
    }

    // ---- arms
    for (const sd of ['F', 'N']) {
      if (sd === 'F' && ex.oneArmHidden) continue;
      const sh = J['sh' + sd], el = J['el' + sd], wr = J['wr' + sd];
      const ps = P(sh), pe = P(el), pw = P(wr);
      let s = limb(ps, pe, 7.6, 6.2, 'mk-skin') + limb(pe, pw, 6.2, 4.6, 'mk-skin') + circ(pw, 3.3, 'mk-skin');
      s += limb(ps, P(v3.lerp(sh, el, 0.36)), 9.2, 8.2, 'mk-shirt');
      // glow
      const ad = v3.norm(v3.sub(el, sh)), fd = v3.norm(v3.sub(wr, el));
      const nfront = (dir) => v3.norm([-dir[1], dir[0], 0]);
      if (want('shoulders')) s += circ(ps, 4.6, want('shoulders'));
      for (const [g, a, b, dir, side, t] of [['biceps', sh, el, ad, 1, 0.55], ['triceps', sh, el, ad, -1, 0.55], ['forearms', el, wr, fd, 1, 0.4]]) {
        const cls = want(g); if (!cls) continue;
        const n = v3.mul(nfront(dir), side);
        const vis = facing(P, n);
        if (vis < -0.55 && g !== 'forearms') continue;
        const pa2 = P(a), pb2 = P(b);
        s += ell(P(v3.add(v3.lerp(a, b, t), v3.mul(n, 1.6))), s2.sub(pb2, pa2), s2.len(s2.sub(pb2, pa2)) * 0.3, 2.3, cls);
      }
      // hand-held tools
      if (ex.tool === 'db' && !(sd === 'F' && ex.oneArm)) {
        const ax = ex.view === 'front' || ex.dbAxis === 'x' ? [1, 0, 0] : [0, 0, 1];
        const axn = ex.view === 'front' || ex.dbAxis === 'x' ? 'x' : 'z';
        s += capsule(P(v3.add(wr, v3.mul(ax, -6.5))), P(v3.add(wr, v3.mul(ax, 6.5))), 2.2, 2.2, 'eq-handle');
        for (const o of [-5.5, 5.5]) s += disc(P, v3.add(wr, v3.mul(ax, o)), 4.8, axn, 'eq-plate');
      }
      if (ex.handle === 'd') s += capsule(P(v3.add(wr, [0, -2.5, 0])), P(v3.add(wr, [0, 2.5, 0])), 2.4, 2.4, 'eq-handle');
      items.push([(Pd(sh) + Pd(el) + Pd(wr)) / 3 + 1.5 + (sd === 'N' ? 0.01 : 0), sd === 'F' ? `<g class="mk-far">${s}</g>` : s]);
    }

    // ---- barbell / bar handle across both hands (split in two halves for correct overlap)
    if (ex.tool === 'bb' || ex.handle === 'bar' || ex.handle === 'rope') {
      const c = v3.lerp(J.wrN, J.wrF, 0.5);
      const mid = [c[0], c[1], 0];
      const half = ex.tool === 'bb' ? 34 : 14;
      for (const sgn of [-1, 1]) {
        const end = [c[0], c[1], sgn * half];
        let s = capsule(P(mid), P(end), ex.tool === 'bb' ? 2.4 : 2.2, ex.tool === 'bb' ? 2.4 : 2.2, 'eq-bar');
        if (ex.tool === 'bb') {
          const r = ex.plate || 11;
          s += disc(P, [c[0], c[1], sgn * 23], r, 'z', 'eq-plate') + disc(P, [c[0], c[1], sgn * 26], r, 'z', 'eq-plate') + disc(P, [c[0], c[1], sgn * 26], 2.4, 'z', 'eq-hub');
        }
        items.push([Pd(v3.lerp(mid, end, 0.6)) + 0.5, s]);
      }
    }
    if (ex.plateAtHands) { const c = v3.add(v3.lerp(J.wrN, J.wrF, 0.5), [6, -2, 0]); items.push([Pd(c) + 0.6, disc(P, c, ex.plateAtHands, 'x', 'eq-plate')]); }
    // pads / foot plates attached to joints
    if (ex.tool === 'pad') items.push([Pd(J.anN) + 2, capsule(P(v3.add(J.anN, [2, 3, -10])), P(v3.add(J.anN, [2, 3, 10])), 6.5, 6.5, 'eq-pad')]);
    if (ex.jboxes) for (const j of ex.jboxes) {
      const base = j.at === 'C' ? v3.lerp(J.anN, J.anF, 0.5) : J[j.at];
      const c = v3.add(base, [j.off?.[0] || 0, j.off?.[1] || 0, 0]);
      items.push([j.front ? 999 : Pd(c) - 2, obox(P, [c[0], c[1], 0], j.ang || 0, j.size[0], j.size[1], j.size[2], j.c || 'frame')]);
    }

    items.sort((a, b) => a[0] - b[0]);
    return back + items.map((i) => i[1]).join('');
  }

  // centre of rotation of an exercise (middle of the body over both key positions)
  const pivots = new WeakMap();
  function pivot(ex) {
    if (pivots.has(ex)) return pivots.get(ex);
    let sx = 0, n = 0;
    for (const k of ex.frames) {
      const J = build(ex, k);
      for (const p of [J.hipC, J.shC, J.anN, J.wrN]) { sx += p[0]; n++; }
    }
    const v = n ? sx / n : 100;
    pivots.set(ex, v);
    return v;
  }
  const defaultYaw = (ex) => (ex.view === 'front' ? 90 : ex.yaw ?? 22);

  /**
   * Animate between the 2 key positions. ctl = { yaw, pitch, speed, paused } can be changed live.
   * Returns stop().
   */
  function animate(svg, ex, ctl = {}, period = 2800) {
    let raf = 0, last = performance.now(), ph = 0, stopped = false;
    const k1 = ex.frames[0], k2 = ex.frames[1] || ex.frames[0];
    const tick = (now) => {
      if (stopped || !svg.isConnected) return;
      const dt = now - last; last = now;
      if (!ctl.paused) ph = (ph + dt / (period / (ctl.speed || 1))) % 1;
      const x = 0.5 - 0.5 * Math.cos(ph * 2 * Math.PI);
      const t = Math.min(1, Math.max(0, (x - 0.08) / 0.84));
      svg.innerHTML = draw(ex, mix(k1, k2, t), ctl);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; cancelAnimationFrame(raf); };
  }

  const VB = 'viewBox="0 0 200 150"';
  function still(ex, i = 1, opts) {
    return `<svg class="fig" ${VB} aria-hidden="true">${draw(ex, ex.frames[i] || ex.frames[0], opts)}</svg>`;
  }
  // start / middle / end positions for step-by-step learning
  function steps(ex, opts) {
    const k1 = ex.frames[0], k2 = ex.frames[1] || ex.frames[0];
    return [k1, mix(k1, k2, 0.5), k2].map((k) => `<svg class="fig" ${VB} aria-hidden="true">${draw(ex, k, opts)}</svg>`);
  }

  window.Figure = { draw, animate, still, steps, setSex, defaultYaw, build, mix, staticProps, staticLines, pivot, GROUND, isFemale: () => sex === 'f' };
})();
