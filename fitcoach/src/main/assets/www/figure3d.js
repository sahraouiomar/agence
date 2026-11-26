// Real-time 3D character (WebGL, three.js MIT) for the exercise page.
// It reuses the skeleton of figure.js (same key positions for every exercise) and draws a shaded,
// lit body with soft shadows, clothes, equipment and glowing target muscles. Falls back to SVG if
// WebGL is not available.
(function () {
  const GROUND = -3.5;

  function supported() {
    try {
      const c = document.createElement('canvas');
      return !!(window.THREE && window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }

  function create(canvas, ex, ctl = {}) {
    const THREE = window.THREE;
    const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
    const css = (n, d) => (getComputedStyle(document.documentElement).getPropertyValue(n) || d).trim() || d;
    const female = Figure.isFemale();

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 4 / 3, 1, 3000);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a93a6, 1.25));
    const sun = new THREE.DirectionalLight(0xffffff, 2.1);
    sun.position.set(90, 220, 140);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -160, right: 160, top: 160, bottom: -160, near: 10, far: 600 });
    sun.shadow.bias = -0.0008;
    scene.add(sun);
    scene.add(sun.target);

    // ---- materials
    const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.65, metalness: 0 }, o));
    const mat = {
      skin: M(0xd99a72, { roughness: 0.55 }),
      shirt: M(female ? 0x7c3aed : 0x1f2937, { roughness: 0.85 }),
      shorts: M(0xff5a1f, { roughness: 0.8 }),
      shoe: M(0xf1f5f9, { roughness: 0.5 }),
      sole: M(0xff2d77),
      hair: M(0x2b1d16, { roughness: 0.9 }),
      eye: M(0x111111, { roughness: 0.3 }),
      hl: M(0xff2d77, { emissive: 0xff2d77, emissiveIntensity: 0.55, transparent: true, opacity: 0.9 }),
      hl2: M(0xffb02e, { emissive: 0xffb02e, emissiveIntensity: 0.35, transparent: true, opacity: 0.75 }),
      frame: M(0x9aa5b4, { metalness: 0.6, roughness: 0.35 }),
      pad: M(0x334155, { roughness: 0.7 }),
      plate: M(0x111827, { metalness: 0.35, roughness: 0.45 }),
      hub: M(0xb8c0cc, { metalness: 0.8, roughness: 0.25 }),
      bar: M(0xb8c0cc, { metalness: 0.85, roughness: 0.25 }),
      stack: M(0x1e293b, { metalness: 0.3 }),
      mat: M(0x8b9cf7, { roughness: 0.95 }),
      wall: M(0xe5e7eb, { roughness: 1 }),
      cable: M(0x64748b, { metalness: 0.5 }),
      top: M(0x475569),
    };
    const ground = new THREE.Mesh(new THREE.CircleGeometry(150, 48), M(new THREE.Color(css('--bg2', '#e9ebf2')), { roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = GROUND - 0.05; ground.receiveShadow = true;
    scene.add(ground);

    const geo = { cyl: new THREE.CylinderGeometry(1, 1, 1, 18), sph: new THREE.SphereGeometry(1, 22, 16), box: new THREE.BoxGeometry(1, 1, 1) };
    const parts = [];
    function mesh(g, m, shadow = true) {
      const x = new THREE.Mesh(g, m);
      x.castShadow = shadow; x.receiveShadow = true; x.matrixAutoUpdate = false;
      scene.add(x); parts.push(x);
      return x;
    }
    // a tapered cylinder per segment (geometry per radius pair, cached)
    const cylCache = {};
    const tcyl = (r1, r2) => cylCache[r1 + '_' + r2] || (cylCache[r1 + '_' + r2] = new THREE.CylinderGeometry(r2, r1, 1, 20));
    const UP = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion(), m4 = new THREE.Matrix4(), sc = new THREE.Vector3();
    function placeSeg(x, a, b, extra = 1) {
      const A = V(a), B = V(b), d = B.clone().sub(A), L = d.length() || 0.001;
      q.setFromUnitVectors(UP, d.normalize());
      m4.compose(A.clone().add(B).multiplyScalar(0.5), q, sc.set(extra, L, extra));
      x.matrix.copy(m4); x.visible = true;
    }
    function placeSph(x, c, r) { m4.compose(V(c), q.identity(), sc.set(r, r, r)); x.matrix.copy(m4); x.visible = true; }
    function placeBasis(x, c, X, Y, Z, sx, sy, sz) {
      m4.makeBasis(X.clone().multiplyScalar(sx), Y.clone().multiplyScalar(sy), Z.clone().multiplyScalar(sz));
      m4.setPosition(V(c)); x.matrix.copy(m4); x.visible = true;
    }

    // ---- body
    const B = {};
    for (const s of ['N', 'F']) {
      B['thigh' + s] = mesh(tcyl(6.0, 4.4), mat.skin);
      B['shin' + s] = mesh(tcyl(4.3, 2.9), mat.skin);
      B['short' + s] = mesh(tcyl(6.6, 6.1), mat.shorts);
      B['knee' + s] = mesh(geo.sph, mat.skin);
      B['ankle' + s] = mesh(geo.sph, mat.skin);
      B['foot' + s] = mesh(geo.box, mat.shoe);
      B['sole' + s] = mesh(geo.box, mat.sole);
      B['uarm' + s] = mesh(tcyl(3.9, 3.1), mat.skin);
      B['farm' + s] = mesh(tcyl(3.1, 2.3), mat.skin);
      B['sleeve' + s] = mesh(tcyl(4.7, 4.3), mat.shirt);
      B['shoulder' + s] = mesh(geo.sph, mat.shirt);
      B['elbow' + s] = mesh(geo.sph, mat.skin);
      B['hand' + s] = mesh(geo.sph, mat.skin);
    }
    // torso: lathe profile (radius along the spine), scaled in width / depth
    const prof = [[0.0, 0.05], [0.72, 0.0], [0.86, 0.14], [0.8, 0.36], [0.92, 0.6], [1.0, 0.84], [0.82, 0.96], [0.4, 1.02], [0.05, 1.03]];
    const torsoGeo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28);
    B.torso = mesh(torsoGeo, mat.shirt);
    B.pelvis = mesh(geo.sph, mat.shorts);
    B.neck = mesh(tcyl(2.7, 2.6), mat.skin);
    B.head = mesh(geo.sph, mat.skin);
    B.hair = mesh(new THREE.SphereGeometry(1, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), mat.hair);
    B.eyeA = mesh(geo.sph, mat.eye, false); B.eyeB = mesh(geo.sph, mat.eye, false);
    B.nose = mesh(geo.sph, mat.skin, false);
    B.pony = mesh(geo.sph, mat.hair);
    B.pony.visible = female;

    // ---- muscle glow pool
    const glow = [];
    let glowN = 0;
    function glowAt(c, X, Y, Z, sx, sy, sz, primary) {
      let g = glow[glowN];
      if (!g) { g = mesh(geo.sph, mat.hl, false); glow.push(g); }
      g.material = primary ? mat.hl : mat.hl2;
      placeBasis(g, c, X, Y, Z, sx, sy, sz);
      glowN++;
    }

    // ---- equipment (static)
    for (const [b, c] of Figure.staticProps(ex)) {
      const [x1, x2, y1, y2, z1, z2] = b;
      const x = mesh(geo.box, mat[c] || mat.frame);
      m4.compose(new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2), q.identity(), sc.set(Math.max(0.5, x2 - x1), Math.max(0.5, y2 - y1), Math.max(0.5, z2 - z1)));
      x.matrix.copy(m4);
    }
    for (const l of Figure.staticLines(ex)) { const x = mesh(tcyl(1.3, 1.3), mat.bar); placeSeg(x, l[0], l[1]); }
    // dynamic equipment pool
    const dyn = [];
    let dynN = 0;
    function dynMesh(g, m) { let x = dyn[dynN]; if (!x) { x = mesh(g, m); dyn.push(x); } x.geometry = g; x.material = m; dynN++; return x; }
    const disc = (c, r, axis, m) => { const x = dynMesh(tcyl(r, r), m); const a = axis === 'x' ? [1.2, 0, 0] : [0, 0, 1.2]; placeSeg(x, [c[0] - a[0], c[1], c[2] - a[2]], [c[0] + a[0], c[1], c[2] + a[2]]); };

    // ---- per-frame pose
    const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
    const vlerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const prim = ex.group, sec = ex.second || [];
    const want = (g) => (g === prim ? 1 : sec.includes(g) ? 2 : 0);

    function pose(k, time) {
      const J = Figure.build(ex, k);
      glowN = 0; dynN = 0;
      const n = J.n, d = J.d;
      for (const s of ['N', 'F']) {
        const hip = J['hip' + s], kn = J['kn' + s], an = J['an' + s], toe = J['toe' + s];
        placeSeg(B['thigh' + s], hip, kn); placeSeg(B['shin' + s], kn, an);
        placeSeg(B['short' + s], hip, vlerp(hip, kn, 0.38));
        placeSph(B['knee' + s], kn, 4.4); placeSph(B['ankle' + s], an, 3);
        // shoe: box along ankle -> toe
        const fd = norm(vsub(toe, an));
        const side = norm(cross(fd, [0, 1, 0])[0] || cross(fd, [0, 1, 0])[2] ? cross(fd, [0, 1, 0]) : [0, 0, 1]);
        const up = norm(cross(side, fd));
        placeBasis(B['foot' + s], vadd(vlerp(an, toe, 0.45), vmul(up, -1.2)), V(side), V(up), V(fd), 5.6, 4.6, 12);
        placeBasis(B['sole' + s], vadd(vlerp(an, toe, 0.45), vmul(up, -3.6)), V(side), V(up), V(fd), 5.8, 1, 12.4);
        const sh = J['sh' + s], el = J['el' + s], wr = J['wr' + s];
        placeSeg(B['uarm' + s], sh, el); placeSeg(B['farm' + s], el, wr);
        placeSeg(B['sleeve' + s], sh, vlerp(sh, el, 0.38));
        placeSph(B['shoulder' + s], sh, 4.9); placeSph(B['elbow' + s], el, 3.2); placeSph(B['hand' + s], wr, 3.1);
        // glow on limbs
        const limbFront = (dir) => { const f = norm([-dir[1], dir[0], 0]); return ex.prone ? vmul(f, -1) : f; };
        const segGlow = (a, b, t, side2, r, g, len) => {
          const w = want(g); if (!w) return;
          const Y = norm(vsub(b, a)); const Z = vmul(limbFront(Y), side2); const X = norm(cross(Y, Z));
          const L = Math.hypot(...vsub(b, a));
          glowAt(vadd(vlerp(a, b, t), vmul(Z, r)), V(X), V(Y), V(Z), r * 0.85, L * len, r * 0.6, w === 1);
        };
        segGlow(hip, kn, 0.55, 1, 4.6, 'quads', 0.34); segGlow(hip, kn, 0.55, -1, 4.6, 'hamstrings', 0.34);
        segGlow(kn, an, 0.32, -1, 3.4, 'calves', 0.26);
        segGlow(sh, el, 0.55, 1, 3.1, 'biceps', 0.3); segGlow(sh, el, 0.55, -1, 3.1, 'triceps', 0.3);
        segGlow(el, wr, 0.4, 1, 2.6, 'forearms', 0.3);
        if (want('shoulders')) glowAt(sh, V([1, 0, 0]), V([0, 1, 0]), V([0, 0, 1]), 5.3, 5.3, 5.3, want('shoulders') === 1);
        // hand-held dumbbells
        if (ex.tool === 'db' && !(s === 'F' && ex.oneArm)) {
          const axis = ex.view === 'front' || ex.dbAxis === 'x' ? 'x' : 'z';
          const ax = axis === 'x' ? [1, 0, 0] : [0, 0, 1];
          placeSeg(dynMesh(tcyl(1.1, 1.1), mat.bar), vadd(wr, vmul(ax, -7)), vadd(wr, vmul(ax, 7)));
          disc(vadd(wr, vmul(ax, -5.5)), 4.8, axis, mat.plate); disc(vadd(wr, vmul(ax, 5.5)), 4.8, axis, mat.plate);
        }
        if (ex.handle === 'd') placeSeg(dynMesh(tcyl(1.2, 1.2), mat.bar), vadd(wr, [0, -3, 0]), vadd(wr, [0, 3, 0]));
      }
      // torso frame: Y = spine, Z = front, X = lateral
      const Y = d, Z = n, X = norm(cross(Y, Z));
      const tl = Math.hypot(...vsub(J.shC, J.hipC)) + 3;
      placeBasis(B.torso, vadd(J.hipC, vmul(Y, -3)), V(X), V(Y), V(Z), female ? 9.4 : 10.4, tl, female ? 6.6 : 6.9);
      placeBasis(B.pelvis, vadd(J.hipC, vmul(Y, 1)), V(X), V(Y), V(Z), female ? 9.6 : 8.9, 6.4, 6.6);
      placeSeg(B.neck, J.shC, J.neck);
      placeSph(B.head, J.head, 7.6);
      placeBasis(B.hair, vadd(vadd(J.head, vmul(Y, 0.6)), vmul(Z, -0.8)), V(X), V(norm(vadd(vmul(Y, 0.75), vmul(Z, -0.65)))), V(norm(vadd(vmul(Y, 0.65), vmul(Z, 0.75)))), 8, 8, 8);
      const eye = (sgn) => vadd(vadd(vadd(J.head, vmul(Z, 6.7)), vmul(Y, 1)), vmul(X, sgn * 2.6));
      placeSph(B.eyeA, eye(1), 0.95); placeSph(B.eyeB, eye(-1), 0.95);
      placeSph(B.nose, vadd(vadd(J.head, vmul(Z, 7.6)), vmul(Y, -0.8)), 1.3);
      if (female) placeSph(B.pony, vadd(vadd(J.head, vmul(Z, -8)), vmul(Y, 1.5)), 3.5);
      // torso glow
      for (const [g, t, dep, rx, ry, spread] of [['chest', 0.76, 6.8, 5.6, 4, 4.6], ['abs', 0.36, 5.6, 4.6, 7, 2.4], ['back', 0.6, -6.2, 6.5, 8, 4.8], ['lowerback', 0.2, -5.6, 3.8, 5, 2.6], ['traps', 0.95, -4.5, 4.8, 3.2, 4.2], ['glutes', -0.02, -5.6, 4.6, 4.4, 3.8]]) {
        const w = want(g); if (!w) continue;
        for (const sgn of [-1, 1]) {
          const c = vadd(vadd(vlerp(J.hipC, J.shC, t), vmul(Z, dep)), vmul(X, sgn * spread));
          glowAt(c, V(X), V(Y), V(Z), rx, ry, 1.6, w === 1);
        }
      }
      // barbell / bar handles across both hands
      if (ex.tool === 'bb' || ex.handle === 'bar' || ex.handle === 'rope') {
        const c = vlerp(J.wrN, J.wrF, 0.5);
        const half = ex.tool === 'bb' ? 36 : 14;
        placeSeg(dynMesh(tcyl(1.2, 1.2), mat.bar), [c[0], c[1], -half], [c[0], c[1], half]);
        if (ex.tool === 'bb') for (const sgn of [-1, 1]) { disc([c[0], c[1], sgn * 23], ex.plate || 11, 'z', mat.plate); disc([c[0], c[1], sgn * 26.5], ex.plate || 11, 'z', mat.plate); }
      }
      if (ex.cables) for (const cb of ex.cables) {
        const to = cb.to === 'C' ? vlerp(J.wrN, J.wrF, 0.5) : J['wr' + cb.to];
        if (cb.bar) { placeSeg(dynMesh(tcyl(1.3, 1.3), mat.bar), cb.from, to); continue; }
        placeSeg(dynMesh(tcyl(0.45, 0.45), mat.cable), cb.from, to);
        placeSph(dynMesh(geo.sph, mat.pad), cb.from, 3);
      }
      if (ex.plateAtHands) disc(vadd(vlerp(J.wrN, J.wrF, 0.5), [6, -2, 0]), ex.plateAtHands, 'x', mat.plate);
      if (ex.tool === 'pad') placeSeg(dynMesh(tcyl(3.3, 3.3), mat.pad), vadd(J.anN, [2, 3, -10]), vadd(J.anN, [2, 3, 10]));
      if (ex.jboxes) for (const j of ex.jboxes) {
        const base = j.at === 'C' ? vlerp(J.anN, J.anF, 0.5) : J[j.at];
        const c = vadd(base, [j.off?.[0] || 0, j.off?.[1] || 0, 0]);
        const a = ((j.ang || 0) * Math.PI) / 180;
        placeBasis(dynMesh(geo.box, mat[j.c] || mat.frame), [c[0], c[1], 0], V([Math.cos(a), Math.sin(a), 0]), V([-Math.sin(a), Math.cos(a), 0]), V([0, 0, 1]), j.size[0] * 2, j.size[1] * 2, j.size[2] * 2);
      }
      for (let i = glowN; i < glow.length; i++) glow[i].visible = false;
      for (let i = dynN; i < dyn.length; i++) dyn[i].visible = false;
      const pulse = 0.55 + 0.35 * Math.sin(time / 230);
      mat.hl.emissiveIntensity = pulse; mat.hl.opacity = 0.75 + 0.2 * Math.sin(time / 230);
    }

    // ---- camera framing: fit both key positions
    const J0 = Figure.build(ex, ex.frames[0]), J1 = Figure.build(ex, ex.frames[1] || ex.frames[0]);
    const ys = [], xs = [];
    for (const J of [J0, J1]) for (const k of ['head', 'anN', 'toeN', 'wrN', 'hipC', 'shC']) { ys.push(J[k][1]); xs.push(J[k][0]); }
    const target = new THREE.Vector3(Figure.pivot(ex), (Math.min(...ys, GROUND) + Math.max(...ys) + 8) / 2, 0);
    const span = Math.max(Math.max(...ys) - Math.min(...ys, GROUND) + 20, (Math.max(...xs) - Math.min(...xs)) * 0.75 + 30, 90);
    const R = span / (2 * Math.tan((15 * Math.PI) / 180)) * 1.08;
    sun.target.position.copy(target);

    function resize() {
      const w = canvas.clientWidth || 300, h = canvas.clientHeight || 225;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    resize();

    let raf = 0, last = performance.now(), ph = 0, stopped = false;
    const k1 = ex.frames[0], k2 = ex.frames[1] || ex.frames[0];
    function tick(now) {
      if (stopped || !canvas.isConnected) { dispose(); return; }
      const dt = now - last; last = now;
      if (!ctl.paused) ph = (ph + dt / (2800 / (ctl.speed || 1))) % 1;
      const x = 0.5 - 0.5 * Math.cos(ph * 2 * Math.PI);
      const t = Math.min(1, Math.max(0, (x - 0.08) / 0.84));
      pose(Figure.mix(k1, k2, t), now);
      const yaw = ((ctl.yaw ?? Figure.defaultYaw(ex)) * Math.PI) / 180, pitch = ((ctl.pitch3d ?? 14) * Math.PI) / 180;
      camera.position.set(target.x + R * Math.sin(yaw) * Math.cos(pitch), target.y + R * Math.sin(pitch), target.z + R * Math.cos(yaw) * Math.cos(pitch));
      camera.lookAt(target);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    function dispose() {
      cancelAnimationFrame(raf);
      try { renderer.dispose(); Object.values(cylCache).forEach((g) => g.dispose()); torsoGeo.dispose(); } catch (e) {}
    }
    return () => { stopped = true; dispose(); };
  }

  window.Figure3D = { supported, create };
})();
