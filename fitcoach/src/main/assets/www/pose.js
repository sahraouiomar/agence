// Exercise form analysis from body landmarks (33 points, ML Kit / BlazePose order).
// Works on live camera frames and on frames extracted from a recorded video.
(function () {
  const T = (fr, en, ar) => ({ fr, en, ar });
  const MSG = {
    not_visible: T('Placez tout votre corps dans le cadre (de profil, à 2–3 m).', 'Get your whole body in frame (side view, 2–3 m away).', 'اجعل جسمك كاملًا داخل الصورة (من الجانب، على بعد 2–3 م).'),
    good: T('Bonne répétition !', 'Good rep!', 'تكرار ممتاز!'),
    depth: T('Descendez plus bas : cuisses au moins parallèles au sol.', 'Go deeper: thighs at least parallel to the floor.', 'انزل أكثر: الفخذ موازٍ للأرض على الأقل.'),
    chest_up: T('Gardez la poitrine plus haute, le buste penche trop.', 'Keep your chest up, you lean too far forward.', 'ارفع صدرك، جذعك مائل كثيرًا للأمام.'),
    knees_in: T('Poussez les genoux vers l\'extérieur (dans l\'axe des pieds).', 'Push your knees out (in line with your toes).', 'ادفع ركبتيك للخارج (في اتجاه أصابع القدم).'),
    heels: T('Gardez les talons au sol.', 'Keep your heels down.', 'أبقِ الكعبين على الأرض.'),
    pushup_depth: T('Descendez plus : coudes à 90° ou moins.', 'Go lower: elbows to 90° or less.', 'انزل أكثر: المرفقان 90° أو أقل.'),
    hips_sag: T('Hanches trop basses : serrez abdos et fessiers.', 'Hips sagging: squeeze abs and glutes.', 'الحوض منخفض: شدّ البطن والمؤخرة.'),
    hips_high: T('Fesses trop hautes : alignez le corps.', 'Hips too high: straighten your body.', 'المؤخرة مرتفعة: اجعل جسمك مستقيمًا.'),
    lunge_depth: T('Descendez plus : genou avant à ~90°.', 'Go lower: front knee to ~90°.', 'انزل أكثر: الركبة الأمامية ~90°.'),
    torso_upright: T('Gardez le buste droit.', 'Keep your torso upright.', 'حافظ على استقامة الجذع.'),
    curl_top: T('Montez plus haut et serrez le biceps.', 'Curl higher and squeeze.', 'ارفع أكثر واعصر العضلة.'),
    curl_extend: T('Tendez complètement les bras en bas.', 'Fully straighten your arms at the bottom.', 'مدّ ذراعيك بالكامل في الأسفل.'),
    elbow_drift: T('Gardez les coudes collés au corps.', 'Keep your elbows pinned to your sides.', 'أبقِ المرفقين ملتصقين بالجسم.'),
    swing: T('Ne balancez pas le buste.', 'Don\'t swing your torso.', 'لا تؤرجح جذعك.'),
    press_lockout: T('Tendez complètement les bras au-dessus de la tête.', 'Lock out your arms fully overhead.', 'مدّ ذراعيك بالكامل فوق الرأس.'),
    press_arch: T('Ne cambrez pas le dos : serrez les abdos.', 'Don\'t arch your back: brace your abs.', 'لا تقوّس ظهرك: شدّ البطن.'),
    bridge_higher: T('Montez les hanches plus haut (ligne épaules-hanches-genoux).', 'Lift your hips higher (shoulders-hips-knees line).', 'ارفع الحوض أكثر (خط كتف-حوض-ركبة).'),
    hinge_knees: T('Moins de flexion des genoux : poussez les hanches en arrière.', 'Less knee bend: push your hips back.', 'قلّل ثني الركبتين: ادفع الحوض للخلف.'),
    hinge_depth: T('Basculez plus le buste (étirement arrière des cuisses).', 'Hinge further (feel the hamstring stretch).', 'أمِل الجذع أكثر (تمدد الفخذ الخلفي).'),
    plank_good: T('Position parfaite, tenez !', 'Perfect position, hold it!', 'وضعية ممتازة، اثبت!'),
    not_position: T('Mettez-vous en position de planche, de profil.', 'Get into plank position, side view.', 'اتخذ وضعية البلانك من الجانب.'),
  };

  // landmark indices
  const SIDE = {
    L: { sh: 11, el: 13, wr: 15, hip: 23, kn: 25, an: 27, heel: 29, toe: 31 },
    R: { sh: 12, el: 14, wr: 16, hip: 24, kn: 26, an: 28, heel: 30, toe: 32 },
  };
  const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 29], [29, 31], [27, 31], [28, 30], [30, 32], [28, 32], [0, 11], [0, 12]];

  function angle(a, b, c) { // angle ABC in degrees
    const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
    const d = Math.hypot(...v1) * Math.hypot(...v2);
    if (!d) return 180;
    return (Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / d))) * 180) / Math.PI;
  }
  const fromVertical = (a, b) => (Math.atan2(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) * 180) / Math.PI; // 0 = vertical
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  function joints(lm, w, h) {
    const P = lm.map((p) => [p[0] * w, p[1] * h, p[2]]);
    const vis = (s) => ['sh', 'el', 'wr', 'hip', 'kn', 'an'].reduce((n, k) => n + (P[SIDE[s][k]][2] || 0), 0);
    const side = vis('L') >= vis('R') ? 'L' : 'R';
    const J = {};
    for (const k in SIDE[side]) J[k] = P[SIDE[side][k]];
    const o = side === 'L' ? 'R' : 'L';
    for (const k in SIDE[o]) J['o_' + k] = P[SIDE[o][k]];
    J.vis = vis(side) / 6;
    J.P = P;
    return J;
  }

  // ---- analyser definitions -------------------------------------------------------------
  // metric(J) -> number used to count reps. type 'dip': rest high -> low -> high. 'rise': rest low -> high -> low.
  const A = {
    squat: {
      need: ['hip', 'kn', 'an', 'sh'], type: 'dip', lo: 125, hi: 155,
      metric: (J) => angle(J.hip, J.kn, J.an),
      track: (J, r) => {
        r.lean = Math.max(r.lean || 0, fromVertical(J.sh, J.hip));
        const shin = dist(J.kn, J.an);
        if (J.heel[2] > 0.5 && J.toe[2] > 0.5) r.heel = Math.max(r.heel || 0, (J.toe[1] - J.heel[1]) / shin);
        const frontal = J.o_sh[2] > 0.6 && J.o_kn[2] > 0.6 && J.o_an[2] > 0.6 && dist(J.sh, J.o_sh) > 0.6 * dist(J.sh, J.hip);
        if (frontal) r.valgus = Math.min(r.valgus ?? 9, dist(J.kn, J.o_kn) / Math.max(1, dist(J.an, J.o_an)));
      },
      judge: (r) => [r.min > 105 && 'depth', r.lean > 55 && 'chest_up', r.valgus != null && r.valgus < 0.75 && 'knees_in', r.heel > 0.25 && 'heels'],
    },
    pushup: {
      need: ['sh', 'el', 'wr', 'hip', 'an'], type: 'dip', lo: 130, hi: 150,
      metric: (J) => angle(J.sh, J.el, J.wr),
      track: (J, r) => {
        const body = angle(J.sh, J.hip, J.an);
        if (body < (r.body ?? 180)) {
          r.body = body;
          // hip below the shoulder-ankle line (image y grows downward) => sagging
          const t = (J.hip[0] - J.sh[0]) / ((J.an[0] - J.sh[0]) || 1);
          const lineY = J.sh[1] + t * (J.an[1] - J.sh[1]);
          r.sag = J.hip[1] > lineY;
        }
      },
      judge: (r) => [r.min > 100 && 'pushup_depth', r.body < 160 && (r.sag ? 'hips_sag' : 'hips_high')],
    },
    lunge: {
      need: ['hip', 'kn', 'an', 'sh'], type: 'dip', lo: 130, hi: 155,
      metric: (J) => Math.min(angle(J.hip, J.kn, J.an), J.o_kn[2] > 0.4 ? angle(J.o_hip, J.o_kn, J.o_an) : 180),
      track: (J, r) => { r.lean = Math.max(r.lean || 0, fromVertical(J.sh, J.hip)); },
      judge: (r) => [r.min > 110 && 'lunge_depth', r.lean > 30 && 'torso_upright'],
    },
    curl: {
      need: ['sh', 'el', 'wr', 'hip'], type: 'dip', lo: 110, hi: 145,
      metric: (J) => angle(J.sh, J.el, J.wr),
      track: (J, r) => {
        r.drift = Math.max(r.drift || 0, fromVertical(J.el, J.sh));
        const tl = fromVertical(J.sh, J.hip);
        r.tmin = Math.min(r.tmin ?? 99, tl); r.tmax = Math.max(r.tmax || 0, tl);
      },
      judge: (r) => [r.min > 75 && 'curl_top', r.startMax < 150 && 'curl_extend', r.drift > 35 && 'elbow_drift', r.tmax - r.tmin > 14 && 'swing'],
    },
    press: {
      need: ['sh', 'el', 'wr', 'hip'], type: 'rise', lo: 110, hi: 140,
      metric: (J) => angle(J.sh, J.el, J.wr),
      track: (J, r) => { r.lean = Math.max(r.lean || 0, fromVertical(J.sh, J.hip)); },
      judge: (r) => [r.max < 155 && 'press_lockout', r.lean > 15 && 'press_arch'],
    },
    bridge: {
      need: ['sh', 'hip', 'kn'], type: 'rise', lo: 140, hi: 150,
      metric: (J) => angle(J.sh, J.hip, J.kn),
      judge: (r) => [r.max < 162 && 'bridge_higher'],
    },
    hinge: {
      need: ['sh', 'hip', 'kn', 'an'], type: 'dip', lo: 140, hi: 160,
      metric: (J) => angle(J.sh, J.hip, J.kn),
      track: (J, r) => { r.knee = Math.min(r.knee ?? 180, angle(J.hip, J.kn, J.an)); },
      judge: (r) => [r.knee < 125 && 'hinge_knees', r.min > 120 && 'hinge_depth'],
    },
    plank: { need: ['sh', 'hip', 'an'], hold: true },
  };

  function create(id) {
    const def = A[id];
    const st = { reps: [], phase: 'rest', cur: null, ema: null, holdGood: 0, lastT: null, startMax: 0, last: null };

    function feed(lm, w, h, t) {
      const out = { reps: st.reps.length, msg: null, ok: null, done: null };
      if (!lm) { out.msg = 'not_visible'; return out; }
      const J = joints(lm, w, h);
      if (def.need.some((k) => (J[k][2] ?? 0) < 0.45)) { out.msg = 'not_visible'; out.J = J; return out; }
      out.J = J;

      if (def.hold) { // plank: judge every frame, count time in good position
        const dt = st.lastT == null ? 0 : Math.min(1000, t - st.lastT);
        st.lastT = t;
        const flat = fromVertical(J.sh, J.an) > 50;
        if (!flat) { out.msg = 'not_position'; return out; }
        const body = angle(J.sh, J.hip, J.an);
        const tt = (J.hip[0] - J.sh[0]) / ((J.an[0] - J.sh[0]) || 1);
        const sag = J.hip[1] > J.sh[1] + tt * (J.an[1] - J.sh[1]);
        if (body < 162) { out.msg = sag ? 'hips_sag' : 'hips_high'; out.ok = false; st.bad = (st.bad || 0) + dt; st.lastIssue = out.msg; } else { out.msg = 'plank_good'; out.ok = true; st.holdGood += dt; }
        out.hold = st.holdGood; out.bad = st.bad || 0;
        return out;
      }

      const raw = def.metric(J);
      st.ema = st.ema == null ? raw : st.ema * 0.5 + raw * 0.5;
      const m = st.ema;
      out.angle = Math.round(m);
      const inRep = def.type === 'dip' ? m < def.lo : m > def.hi;
      const atRest = def.type === 'dip' ? m > def.hi : m < def.lo;
      if (st.phase === 'rest') {
        st.startMax = Math.max(st.startMax, m);
        if (inRep) { st.phase = 'rep'; st.cur = { min: m, max: m, t0: t, tBottom: t, startMax: st.startMax }; }
      }
      if (st.phase === 'rep') {
        const r = st.cur;
        if (m < r.min) { r.min = m; if (def.type === 'dip') r.tBottom = t; }
        if (m > r.max) { r.max = m; if (def.type === 'rise') r.tBottom = t; }
        def.track && def.track(J, r);
        if (atRest) {
          st.phase = 'rest'; st.startMax = m;
          const issues = def.judge(r).filter(Boolean);
          const rep = { issues, t: r.tBottom, score: Math.max(0, 100 - 30 * issues.length) };
          st.reps.push(rep);
          out.done = rep; out.reps = st.reps.length;
          out.msg = issues[0] || 'good';
          out.ok = !issues.length;
        }
      }
      return out;
    }

    function summary() {
      if (def.hold) {
        const total = st.holdGood + (st.bad || 0);
        return { hold: true, good: st.holdGood, total, score: total ? Math.round((100 * st.holdGood) / total) : 0, issues: st.lastIssue ? [st.lastIssue] : [] };
      }
      const reps = st.reps;
      const count = {};
      reps.forEach((r) => r.issues.forEach((i) => (count[i] = (count[i] || 0) + 1)));
      const score = reps.length ? Math.round(reps.reduce((s, r) => s + r.score, 0) / reps.length) : 0;
      const worst = reps.slice().sort((a, b) => a.score - b.score)[0];
      return { reps, count, score, worst, issues: Object.keys(count).sort((a, b) => count[b] - count[a]) };
    }
    return { feed, summary };
  }

  function drawSkeleton(ctx, lm, w, h, color = '#22c55e') {
    if (!lm) return;
    ctx.lineWidth = Math.max(2, w / 160);
    ctx.strokeStyle = color; ctx.fillStyle = '#fff';
    for (const [a, b] of BONES) {
      const p = lm[a], q = lm[b];
      if (p[2] < 0.4 || q[2] < 0.4) continue;
      ctx.beginPath(); ctx.moveTo(p[0] * w, p[1] * h); ctx.lineTo(q[0] * w, q[1] * h); ctx.stroke();
    }
    for (let i = 11; i < 33; i++) {
      const p = lm[i];
      if (p[2] < 0.4) continue;
      ctx.beginPath(); ctx.arc(p[0] * w, p[1] * h, ctx.lineWidth * 1.2, 0, 7); ctx.fill();
    }
  }

  window.Pose = { create, drawSkeleton, MSG, has: (id) => !!A[id] };
})();
