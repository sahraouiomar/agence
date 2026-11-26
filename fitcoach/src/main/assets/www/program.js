// 4-month (16-week) periodised training programme.
// Automatic ("scientific"): 4 blocks of 4 weeks with deloads, adapted to goal, frequency, level and equipment.
//   Block 1 Adaptation (technique, 12–15 reps, RIR 3) — Block 2 Hypertrophy (8–12, RIR 2→1, deload wk 8)
//   Block 3 Strength (compounds 4–6, accessories 8–10, deload wk 12) — Block 4 goal peak + re-test (wk 16)
// Manual: the user's own weekly plan, repeated, with an optional deload every 4th week.
(function () {
  const T = (fr, en, ar) => ({ fr, en, ar });

  const PHASES = [
    { name: T('Adaptation & technique', 'Adaptation & technique', 'التكيّف وإتقان الحركة'), info: T('Apprendre les mouvements, renforcer tendons et articulations. Charges modérées, 12–15 répétitions, garder 3 répétitions en réserve.', 'Learn the movements, strengthen tendons and joints. Moderate loads, 12–15 reps, keep 3 reps in reserve.', 'تعلّم الحركات وتقوية الأوتار والمفاصل. أوزان معتدلة، 12–15 تكرارًا، مع ترك 3 تكرارات احتياط.') },
    { name: T('Hypertrophie (masse musculaire)', 'Hypertrophy (muscle growth)', 'التضخيم (بناء العضلات)'), info: T('Plus de volume : 8–12 répétitions proches de l\'échec (1–2 en réserve). Semaine 8 = décharge pour récupérer.', 'More volume: 8–12 reps close to failure (1–2 in reserve). Week 8 = deload to recover.', 'حجم أكبر: 8–12 تكرارًا قريبًا من الفشل. الأسبوع 8 = تخفيف للاستشفاء.') },
    { name: T('Force', 'Strength', 'القوة'), info: T('Exercices de base lourds (4–6 reps, repos 2–3 min) + accessoires 8–10 reps. Semaine 12 = décharge.', 'Heavy compound lifts (4–6 reps, 2–3 min rest) + accessories 8–10 reps. Week 12 = deload.', 'تمارين أساسية ثقيلة (4–6 تكرارات وراحة 2–3 دقائق) + تمارين مساعدة 8–10. الأسبوع 12 = تخفيف.') },
    { name: T('Pic & bilan', 'Peak & re-test', 'الذروة والتقييم'), info: T('Bloc adapté à votre objectif, puis semaine 16 : décharge et tests pour mesurer vos progrès.', 'A block tailored to your goal, then week 16: deload and tests to measure your progress.', 'مرحلة حسب هدفك ثم الأسبوع 16: تخفيف واختبارات لقياس تقدمك.') },
  ];

  // movement slots -> exercise ids in order of preference (filtered by equipment / level at run time)
  const SLOTS = {
    squat: ['back_squat', 'smith_squat', 'goblet_squat', 'leg_press', 'squat', 'bulgarian'],
    hinge: ['deadlift', 'rdl', 'single_leg_rdl', 'good_morning', 'back_extension'],
    lunge: ['bulgarian', 'lunge', 'step_up'],
    hpush: ['bench_press', 'db_bench_press', 'chest_press_machine', 'pushup', 'incline_pushup', 'decline_pushup', 'dips'],
    vpush: ['overhead_press', 'shoulder_press_machine', 'arnold_press', 'pike_pushup'],
    hpull: ['db_row', 'seated_cable_row', 'inverted_row'],
    vpull: ['pullup', 'lat_pulldown', 'assisted_pullup', 'chin_up', 'inverted_row'],
    glute: ['hip_thrust', 'glute_bridge', 'single_leg_bridge', 'hip_abduction', 'donkey_kick'],
    hamcurl: ['lying_leg_curl', 'seated_leg_curl', 'nordic_curl', 'slider_curl'],
    quadiso: ['leg_extension', 'wall_sit', 'step_up'],
    chestiso: ['pec_deck', 'cable_crossover', 'incline_pushup'],
    lateral: ['lateral_raise', 'cable_lateral_raise', 'upright_row', 'front_raise'],
    rear: ['face_pull', 'inverted_row', 'superman'],
    biceps: ['db_curl', 'barbell_curl', 'cable_curl', 'hammer_curl'],
    triceps: ['triceps_pushdown', 'skull_crusher', 'triceps_ext', 'bench_dips', 'diamond_pushup', 'kickback'],
    calves: ['calf_machine', 'calf_raise', 'single_calf_raise', 'seated_calf_raise'],
    core: ['plank', 'dead_bug', 'cable_crunch', 'bicycle_crunch', 'side_plank', 'hollow_hold', 'leg_raise', 'bird_dog'],
    carry: ['farmer_walk', 'dead_hang'],
  };
  const COMPOUND = new Set(['squat', 'hinge', 'lunge', 'hpush', 'vpush', 'hpull', 'vpull', 'glute']);

  const TEMPLATES = {
    full: [
      { name: T('Corps entier A', 'Full body A', 'كامل الجسم A'), slots: [['squat', 0], ['hpush', 0], ['hpull', 0], ['glute', 0], ['lateral', 0], ['core', 0]] },
      { name: T('Corps entier B', 'Full body B', 'كامل الجسم B'), slots: [['hinge', 0], ['vpush', 0], ['vpull', 0], ['lunge', 0], ['calves', 0], ['core', 1]] },
      { name: T('Corps entier C', 'Full body C', 'كامل الجسم C'), slots: [['squat', 1], ['hpush', 1], ['hpull', 1], ['hamcurl', 0], ['biceps', 0], ['triceps', 0]] },
    ],
    upperlower: [
      { name: T('Haut du corps 1', 'Upper body 1', 'الجزء العلوي 1'), slots: [['hpush', 0], ['vpull', 0], ['vpush', 0], ['hpull', 0], ['biceps', 0], ['triceps', 0]] },
      { name: T('Bas du corps 1', 'Lower body 1', 'الجزء السفلي 1'), slots: [['squat', 0], ['hinge', 0], ['lunge', 0], ['hamcurl', 0], ['calves', 0], ['core', 0]] },
      { name: T('Haut du corps 2', 'Upper body 2', 'الجزء العلوي 2'), slots: [['vpush', 1], ['hpull', 1], ['hpush', 1], ['lateral', 0], ['triceps', 1], ['biceps', 1]] },
      { name: T('Bas du corps 2', 'Lower body 2', 'الجزء السفلي 2'), slots: [['hinge', 1], ['squat', 1], ['glute', 0], ['quadiso', 0], ['calves', 1], ['core', 1]] },
    ],
    ppl: [
      { name: T('Poussée (pecs, épaules, triceps)', 'Push (chest, shoulders, triceps)', 'دفع (صدر، أكتاف، ترايسبس)'), slots: [['hpush', 0], ['vpush', 0], ['chestiso', 0], ['lateral', 0], ['triceps', 0]] },
      { name: T('Tirage (dos, biceps)', 'Pull (back, biceps)', 'سحب (ظهر، باي)'), slots: [['vpull', 0], ['hpull', 0], ['rear', 0], ['biceps', 0], ['carry', 0]] },
      { name: T('Jambes', 'Legs', 'الأرجل'), slots: [['squat', 0], ['hinge', 0], ['lunge', 0], ['hamcurl', 0], ['calves', 0], ['core', 0]] },
      { name: T('Poussée 2', 'Push 2', 'دفع 2'), slots: [['vpush', 1], ['hpush', 1], ['chestiso', 1], ['lateral', 1], ['triceps', 1]] },
      { name: T('Tirage 2', 'Pull 2', 'سحب 2'), slots: [['hpull', 1], ['vpull', 1], ['rear', 1], ['biceps', 1], ['core', 1]] },
      { name: T('Jambes 2', 'Legs 2', 'الأرجل 2'), slots: [['hinge', 1], ['squat', 1], ['glute', 0], ['quadiso', 0], ['calves', 1], ['core', 2]] },
    ],
  };

  function sessionsFor(days, phase) {
    if (phase === 1 || days <= 3) return TEMPLATES.full.slice(0, Math.max(2, Math.min(3, days)));
    if (days === 4) return TEMPLATES.upperlower;
    if (days === 5) return [TEMPLATES.ppl[0], TEMPLATES.ppl[1], TEMPLATES.ppl[2], TEMPLATES.upperlower[0], TEMPLATES.upperlower[1]];
    return TEMPLATES.ppl;
  }

  const phaseOf = (w) => Math.min(4, Math.ceil(w / 4));
  const isDeload = (w) => w === 8 || w === 12 || w === 16;

  // dosage for one exercise
  function dose(ex, slot, w, goal, level) {
    const phase = phaseOf(w);
    const comp = COMPOUND.has(slot);
    let sets, reps, rir, rest, tempo = '2-0-1';
    if (phase === 1) { sets = w <= 2 ? 2 : 3; reps = [12, 15]; rir = 3; rest = 60; tempo = '3-1-1'; }
    else if (phase === 2) { sets = w === 7 ? 4 : 3; reps = [8, 12]; rir = w <= 6 ? 2 : 1; rest = 90; }
    else if (phase === 3) { if (comp) { sets = 4; reps = [4, 6]; rir = 2; rest = 150; } else { sets = 3; reps = [8, 10]; rir = 2; rest = 75; } }
    else if (goal === 'strength') { if (comp) { sets = w === 15 ? 5 : 4; reps = w === 15 ? [2, 4] : [3, 5]; rir = 1; rest = 180; } else { sets = 3; reps = [6, 8]; rir = 2; rest = 90; } }
    else if (goal === 'lose') { sets = 3; reps = [12, 15]; rir = 2; rest = 40; tempo = '2-0-1'; }
    else if (goal === 'muscle') { sets = w === 15 && comp ? 5 : 4; reps = comp ? [6, 10] : [10, 12]; rir = 1; rest = 90; }
    else { sets = 3; reps = [10, 12]; rir = 2; rest = 60; }
    if (level === 0 && sets > 3) sets = 3;
    if (isDeload(w)) { sets = Math.max(1, Math.round(sets / 2)); rir = 4; }
    const o = { id: ex.id, sets, rest, rir, tempo };
    if (ex.hold || ex.cardio) o.hold = Math.min(60, [20, 30, 40, 45][phase - 1] + level * 5);
    else o.reps = ex.id.includes('calf') ? [15, 20] : reps;
    return o;
  }

  function cardioFor(goal, w, si, nSessions) {
    const phase = phaseOf(w);
    const c = [];
    if (goal === 'lose') {
      c.push({ kind: 'zone2', min: [20, 25, 30, 30][phase - 1] });
      if (phase >= 3 && si === nSessions - 1 && !isDeload(w)) c.push({ kind: 'hiit', min: 10 });
    } else if (goal === 'fit' && si % 2 === 0) c.push({ kind: 'zone2', min: 20 });
    else if (si === 0) c.push({ kind: 'zone2', min: 15 });
    return c;
  }

  /**
   * Week w (1..16) of a programme.
   * ctx.pick(slot, variant, phase) -> exercise object or null ; ctx.level ; prog.goal ; prog.days ; prog.volume
   */
  function week(prog, w, ctx) {
    const phase = phaseOf(w);
    const out = { w, phase, deload: isDeload(w), test: w === 1 || w === 16, sessions: [] };
    const vol = isDeload(w) ? 1 : prog.volume || 1;
    if (prog.type === 'manual') {
      (prog.manual || []).forEach((s, i) => {
        const items = s.items.filter((it) => ctx.ex(it.id)).map((it) => {
          const o = Object.assign({}, it);
          if (prog.deload !== false && w % 4 === 0) o.sets = Math.max(1, Math.round(o.sets / 2));
          return o;
        });
        out.sessions.push({ key: `${w}-${i}`, name: s.name, items, cardio: [] });
      });
      out.deload = prog.deload !== false && w % 4 === 0;
      return out;
    }
    const tpl = sessionsFor(prog.days || 3, phase);
    tpl.forEach((s, i) => {
      const used = new Set();
      const items = [];
      for (const [slot, v] of s.slots) {
        const ex = ctx.pick(slot, v, phase, used);
        if (!ex) continue;
        used.add(ex.id);
        const o = dose(ex, slot, w, prog.goal, ctx.level);
        o.sets = Math.max(1, Math.round(o.sets * vol));
        items.push(o);
      }
      out.sessions.push({ key: `${w}-${i}`, name: s.name, items, cardio: cardioFor(prog.goal, w, i, tpl.length) });
    });
    return out;
  }

  const CARDIO = {
    zone2: T('Cardio zone 2 (marche rapide, vélo, natation : vous pouvez encore parler)', 'Zone 2 cardio (brisk walk, bike, swim: you can still talk)', 'كارديو المنطقة 2 (مشي سريع، دراجة، سباحة: يمكنك التكلم)'),
    hiit: T('HIIT : 10 × (30 s rapide / 30 s lent)', 'HIIT: 10 × (30 s hard / 30 s easy)', 'تمرين متقطع: 10 × (30 ث سريع / 30 ث بطيء)'),
  };
  const TESTS = [
    { id: 'pushups', name: T('Pompes max (sans pause)', 'Max push-ups (no rest)', 'أقصى عدد ضغط (بدون توقف)'), unit: 'reps' },
    { id: 'squats', name: T('Squats en 60 secondes', 'Squats in 60 seconds', 'سكوات في 60 ثانية'), unit: 'reps' },
    { id: 'plank', name: T('Gainage max (secondes)', 'Max plank (seconds)', 'أقصى ثبات بلانك (ثانية)'), unit: 's' },
    { id: 'weight', name: T('Poids (kg)', 'Weight (kg)', 'الوزن (كغ)'), unit: 'kg' },
    { id: 'waist', name: T('Tour de taille (cm)', 'Waist (cm)', 'محيط الخصر (سم)'), unit: 'cm' },
  ];

  window.Program = { PHASES, SLOTS, week, phaseOf, isDeload, CARDIO, TESTS, WEEKS: 16 };
})();
