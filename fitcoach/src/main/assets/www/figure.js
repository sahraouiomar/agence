// Animated stick-figure demo of an exercise (offline "video").
// Angles are absolute, in degrees, math convention (0 = right, 90 = up). Figure faces right.
(function () {
  const L = { T: 34, HEAD: 10, R: 7, UA: 18, FA: 17, TH: 24, SH: 23, FT: 8 };
  const FLOOR = 140; // svg y of the floor
  const rad = (d) => (d * Math.PI) / 180;
  const go = (p, ang, len) => [p[0] + len * Math.cos(rad(ang)), p[1] + len * Math.sin(rad(ang))];

  function sidePoints(k) {
    const P = {};
    P.hip = [0, 0];
    P.sh = go(P.hip, k.t, L.T);
    P.head = go(P.sh, k.t, L.HEAD);
    P.el = go(P.sh, k.a, L.UA);
    P.wr = go(P.el, k.f, L.FA);
    P.el2 = go(P.sh, k.a2 ?? k.a, L.UA);
    P.wr2 = go(P.el2, k.f2 ?? k.f, L.FA);
    P.kn = go(P.hip, k.l, L.TH);
    P.an = go(P.kn, k.s, L.SH);
    P.toe = go(P.an, k.ft ?? (k.s + 90), L.FT);
    P.kn2 = go(P.hip, k.l2 ?? k.l, L.TH);
    P.an2 = go(P.kn2, k.s2 ?? k.s, L.SH);
    P.toe2 = go(P.an2, k.ft2 ?? k.ft ?? ((k.s2 ?? k.s) + 90), L.FT);
    return P;
  }

  function frontPoints(k) {
    // a / f / l / s are for the figure's right side (viewer's left), mirrored for the other side.
    const m = (ang) => 180 - ang;
    const P = {};
    P.hip = [0, 0];
    P.neck = [0, L.T];
    P.head = [0, L.T + L.HEAD];
    P.shR = [-10, L.T - 2]; P.shL = [10, L.T - 2];
    P.hipR = [-6, 0]; P.hipL = [6, 0];
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

  function place(ex, k) {
    const front = ex.view === 'front';
    const P = front ? frontPoints(k) : sidePoints(k);
    let dx, dy;
    if (front) {
      const minY = Math.min(P.anR[1], P.anL[1]);
      dx = 100; dy = -minY;
    } else {
      const an = ex.anchor || { p: 'ankle', x: 100, y: 0 };
      const key = { ankle: 'an', wrist: 'wr', hip: 'hip', toe: 'toe', knee: 'kn' }[an.p];
      dx = an.x - P[key][0]; dy = an.y - P[key][1];
    }
    const out = {};
    for (const n in P) out[n] = [P[n][0] + dx, FLOOR - (P[n][1] + dy)];
    return out;
  }

  const line = (a, b, cls) => `<line class="${cls}" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`;
  const poly = (pts, cls) => `<polyline class="${cls}" points="${pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}"/>`;
  const dumbbell = (p) => `<g class="fig-tool"><rect x="${(p[0] - 6).toFixed(1)}" y="${(p[1] - 2).toFixed(1)}" width="12" height="4" rx="1"/><rect x="${(p[0] - 8).toFixed(1)}" y="${(p[1] - 4.5).toFixed(1)}" width="4" height="9" rx="1"/><rect x="${(p[0] + 4).toFixed(1)}" y="${(p[1] - 4.5).toFixed(1)}" width="4" height="9" rx="1"/></g>`;

  function draw(ex, k) {
    const P = place(ex, k);
    let s = `<line class="fig-floor" x1="0" y1="${FLOOR}" x2="200" y2="${FLOOR}"/>`;
    if (ex.wall) s += `<line class="fig-floor" x1="${ex.wall}" y1="20" x2="${ex.wall}" y2="${FLOOR}"/>`;
    if (ex.bench) {
      const [x1, x2, h] = ex.bench;
      s += `<rect class="fig-bench" x="${x1}" y="${FLOOR - h}" width="${x2 - x1}" height="5" rx="2"/>` +
        `<line class="fig-floor" x1="${x1 + 5}" y1="${FLOOR - h + 5}" x2="${x1 + 5}" y2="${FLOOR}"/><line class="fig-floor" x1="${x2 - 5}" y1="${FLOOR - h + 5}" x2="${x2 - 5}" y2="${FLOOR}"/>`;
    }
    if (ex.tool === 'bar') s += `<line class="fig-bar" x1="60" y1="${FLOOR - 135}" x2="150" y2="${FLOOR - 135}"/>`;
    if (ex.view === 'front') {
      s += poly([P.anR, P.knR, P.hipR, P.hipL, P.knL, P.anL], 'fig-limb');
      s += line(P.hip, P.neck, 'fig-limb');
      s += poly([P.wrR, P.elR, P.shR, P.shL, P.elL, P.wrL], 'fig-limb');
      s += `<circle class="fig-head" cx="${P.head[0].toFixed(1)}" cy="${P.head[1].toFixed(1)}" r="${L.R}"/>`;
      if (ex.tool === 'db') s += dumbbell(P.wrR) + dumbbell(P.wrL);
      return s;
    }
    // far side first (lighter)
    s += poly([P.toe2, P.an2, P.kn2, P.hip], 'fig-limb fig-far');
    s += poly([P.sh, P.el2, P.wr2], 'fig-limb fig-far');
    s += line(P.hip, P.sh, 'fig-limb fig-torso');
    s += poly([P.toe, P.an, P.kn, P.hip], 'fig-limb');
    s += `<circle class="fig-head" cx="${P.head[0].toFixed(1)}" cy="${P.head[1].toFixed(1)}" r="${L.R}"/>`;
    s += poly([P.sh, P.el, P.wr], 'fig-limb fig-arm');
    s += `<circle class="fig-joint" cx="${P.kn[0].toFixed(1)}" cy="${P.kn[1].toFixed(1)}" r="2"/><circle class="fig-joint" cx="${P.el[0].toFixed(1)}" cy="${P.el[1].toFixed(1)}" r="2"/>`;
    if (ex.tool === 'db') s += dumbbell(P.wr);
    if (ex.tool === 'bb') s += `<g class="fig-tool"><line x1="${P.wr[0] - 2}" y1="${P.wr[1]}" x2="${P.wr[0] + 2}" y2="${P.wr[1]}"/><circle cx="${P.wr[0].toFixed(1)}" cy="${P.wr[1].toFixed(1)}" r="8" class="fig-plate"/></g>`;
    return s;
  }

  // Animate between the 2 key positions; returns a stop() function.
  function animate(svg, ex, period = 2600) {
    let raf = 0, start = performance.now(), stopped = false;
    const k1 = ex.frames[0], k2 = ex.frames[1] || ex.frames[0];
    const tick = (now) => {
      if (stopped || !svg.isConnected) return;
      const ph = ((now - start) % period) / period; // 0..1
      // ease: hold a little at each end
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

  window.Figure = { draw, animate, still };
})();
