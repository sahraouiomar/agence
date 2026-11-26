// More gym machines (v4): cardio machines and selectorised strength machines, drawn in 3D.
(function () {
  const T = (fr, en, ar) => ({ fr, en, ar });
  const S = T;
  const G = -3.5;
  const stack = (x, z = 0) => [{ b: [x - 7, x + 7, G, 122, z - 7, z + 7], c: 'frame' }, { b: [x - 5, x + 5, 0, 36, z - 5.5, z + 5.5], c: 'stack' }];
  const add = (list) => list.forEach((e) => window.EXERCISES.push(Object.assign({ machine: true }, e)));
  const cardioTips = {
    zone: S('Zone 2 : vous pouvez parler mais pas chanter (~60–70 % de la FC max). C\'est la meilleure zone pour le cœur et la perte de gras.', 'Zone 2: you can talk but not sing (~60–70% of max HR). The best zone for heart health and fat loss.', 'المنطقة 2: يمكنك الكلام لكن ليس الغناء (~60–70% من أقصى نبض). أفضل منطقة للقلب وحرق الدهون.'),
  };

  add([
    // ---------------- CARDIO MACHINES ----------------
    {
      id: 'treadmill', group: 'quads', second: ['calves', 'glutes'], equip: ['machine'], level: 0, cardio: true, minutes: 25, yaw: 35,
      name: T('Tapis de course (marche / course)', 'Treadmill (walk / run)', 'جهاز المشي (مشي / جري)'),
      steps: [
        S('Montez à l\'arrêt, attachez la clé de sécurité, démarrez lentement.', 'Step on while stopped, clip the safety key, start slowly.', 'اصعد والجهاز متوقف، ثبّت مفتاح الأمان وابدأ ببطء.'),
        S('Buste droit, regard devant, bras qui balancent naturellement.', 'Torso upright, eyes forward, arms swinging naturally.', 'الجذع مستقيم والنظر للأمام والذراعان تتأرجحان طبيعيًا.'),
        S('Augmentez la vitesse ou la pente progressivement (une pente de 5–10 % en marche = très efficace).', 'Increase speed or incline gradually (a 5–10% incline walk is very effective).', 'زِد السرعة أو الميل تدريجيًا (المشي بميل 5–10% فعّال جدًا).'),
      ],
      mistakes: [S('Se tenir aux barres (moins de calories, mauvaise posture).', 'Holding the rails (fewer calories, poor posture).', 'الإمساك بالمقابض (سعرات أقل ووضعية سيئة).')],
      tip: cardioTips.zone,
      anchor: { p: 'hip', x: 100, y: 50.5 },
      props: [{ b: [66, 138, G, 3.5, -15, 15], c: 'pad' }, { b: [134, 140, G, 72, -15, -11], c: 'frame' }, { b: [134, 140, G, 72, 11, 15], c: 'frame' }, { b: [128, 142, 68, 78, -15, 15], c: 'frame' }],
      frames: [{ t: 90, l: -72, s: -96, l2: -108, s2: -78, a: -110, f: -85, a2: -70, f2: -60 }, { t: 90, l: -108, s: -78, l2: -72, s2: -96, a: -70, f: -60, a2: -110, f2: -85 }],
    },
    {
      id: 'stationary_bike', group: 'quads', second: ['hamstrings', 'calves', 'glutes'], equip: ['machine'], level: 0, cardio: true, minutes: 25, yaw: 30,
      name: T('Vélo d\'appartement', 'Stationary bike', 'الدراجة الثابتة'),
      steps: [
        S('Réglez la selle : jambe presque tendue quand la pédale est en bas.', 'Set the saddle: leg almost straight when the pedal is at the bottom.', 'اضبط المقعد: الساق شبه مستقيمة عندما تكون الدواسة في الأسفل.'),
        S('Pédalez à 70–90 tours/min, buste stable.', 'Pedal at 70–90 rpm, torso steady.', 'دوّس بسرعة 70–90 دورة في الدقيقة والجذع ثابت.'),
        S('Augmentez la résistance pour travailler plus fort.', 'Add resistance to work harder.', 'زِد المقاومة لتعمل أكثر.'),
      ],
      mistakes: [S('Selle trop basse (genoux qui souffrent).', 'Saddle too low (knee pain).', 'المقعد منخفض جدًا (ألم الركبتين).')],
      tip: S('Idéal si vous avez mal aux genoux : pas d\'impact.', 'Ideal with sore knees: no impact.', 'مثالي إذا كانت ركبتاك تؤلمانك: بدون صدمات.'),
      anchor: { p: 'hip', x: 92, y: 50 },
      props: [{ b: [86, 100, 45, 48, -5, 5], c: 'pad' }, { b: [91, 95, G, 45, -2, 2], c: 'frame' }, { b: [118, 122, G, 62, -2, 2], c: 'frame' }, { b: [114, 126, 60, 64, -13, 13], c: 'frame' }, { b: [80, 132, G, G + 2.5, -16, 16], c: 'frame' }, { b: [106, 124, 2, 22, -4, 4], c: 'stack' }],
      frames: [{ t: 66, l: -30, s: -105, l2: -75, s2: -60, a: -12, f: -8 }, { t: 66, l: -75, s: -60, l2: -30, s2: -105, a: -12, f: -8 }],
    },
    {
      id: 'rowing_machine', group: 'back', second: ['quads', 'hamstrings', 'biceps', 'abs'], equip: ['machine'], level: 1, cardio: true, minutes: 15, yaw: 30,
      name: T('Rameur', 'Rowing machine', 'جهاز التجديف'),
      steps: [
        S('Pieds sanglés, bras tendus, genoux pliés (position « attrape »).', 'Feet strapped, arms straight, knees bent (the "catch").', 'القدمان مثبتتان والذراعان مستقيمتان والركبتان مثنيتان.'),
        S('Poussez d\'abord avec les jambes, puis basculez le buste, puis tirez la poignée au nombril.', 'Push with the legs first, then lean back, then pull the handle to your belly.', 'ادفع بالساقين أولًا ثم أمِل الجذع للخلف ثم اسحب المقبض إلى البطن.'),
        S('Revenez dans l\'ordre inverse : bras, buste, jambes.', 'Return in reverse order: arms, torso, legs.', 'ارجع بالترتيب العكسي: الذراعان ثم الجذع ثم الساقان.'),
      ],
      mistakes: [S('Tirer avec les bras avant de pousser avec les jambes.', 'Pulling with the arms before pushing with the legs.', 'السحب بالذراعين قبل الدفع بالساقين.'), S('Dos rond.', 'Rounded back.', 'تقوس الظهر.')],
      tip: S('60 % jambes, 20 % buste, 20 % bras : un des cardios les plus complets.', '60% legs, 20% torso, 20% arms: one of the most complete cardio machines.', '60% أرجل و20% جذع و20% ذراعان: من أكمل أجهزة الكارديو.'),
      anchor: { p: 'ankle', x: 125, y: 8 },
      props: [{ b: [40, 140, G, 4, -4, 4], c: 'frame' }, { b: [126, 131, 0, 18, -10, 10], c: 'frame' }, { b: [132, 152, G, 22, -9, 9], c: 'stack' }],
      jboxes: [{ at: 'hipC', off: [0, -4.5], ang: 0, size: [6, 1.5, 7], c: 'pad' }],
      cables: [{ from: [136, 16, 0], to: 'C' }], handle: 'bar',
      frames: [{ t: 68, l: 59, s: -80, a: -15, f: -15 }, { t: 112, l: -2, s: -3, a: -165, f: -5 }],
    },
    {
      id: 'elliptical', group: 'glutes', second: ['quads', 'hamstrings', 'shoulders'], equip: ['machine'], level: 0, cardio: true, minutes: 25, yaw: 35,
      name: T('Vélo elliptique', 'Elliptical trainer', 'جهاز الإهليلجي'),
      steps: [
        S('Pieds à plat sur les pédales, mains sur les poignées mobiles.', 'Feet flat on the pedals, hands on the moving handles.', 'القدمان على الدواسات واليدان على المقابض المتحركة.'),
        S('Poussez et tirez avec les bras pendant que les jambes tournent.', 'Push and pull with the arms while the legs go round.', 'ادفع واسحب بالذراعين بينما تدور الساقان.'),
        S('Gardez le buste droit, sans vous affaler.', 'Keep your torso upright, don\'t slouch.', 'حافظ على استقامة الجذع.'),
      ],
      mistakes: [S('Se pencher sur la machine.', 'Leaning on the machine.', 'الاتكاء على الجهاز.')],
      tip: cardioTips.zone,
      anchor: { p: 'hip', x: 100, y: 64 },
      props: [{ b: [70, 140, G, 6, -16, 16], c: 'frame' }, { b: [132, 138, G, 84, -5, 5], c: 'frame' }],
      frames: [{ t: 88, l: -70, s: -100, l2: -100, s2: -80, a: -40, f: 10, a2: -75, f2: -20 }, { t: 88, l: -100, s: -80, l2: -70, s2: -100, a: -75, f: -20, a2: -40, f2: 10 }],
    },
    {
      id: 'stair_climber', group: 'glutes', second: ['quads', 'calves'], equip: ['machine'], level: 1, cardio: true, minutes: 15, yaw: 35,
      name: T('Simulateur d\'escalier', 'Stair climber', 'جهاز صعود الدرج'),
      steps: [
        S('Montez sur les marches, mains légèrement posées sur les rampes.', 'Step on, hands lightly on the rails.', 'اصعد على الدرج واليدان على المقابض بخفة.'),
        S('Montez une marche entière à chaque pas, en poussant sur le talon.', 'Take full steps, pushing through the heel.', 'اصعد درجة كاملة في كل خطوة مع الدفع بالكعب.'),
        S('Buste presque droit, rythme régulier.', 'Torso almost upright, steady pace.', 'الجذع شبه مستقيم والإيقاع منتظم.'),
      ],
      mistakes: [S('Se suspendre aux rampes.', 'Hanging on the rails.', 'التعلق بالمقابض.')],
      tip: S('Excellent pour les fessiers et le cœur en peu de temps.', 'Great for glutes and heart in little time.', 'ممتاز للمؤخرة والقلب في وقت قصير.'),
      anchor: { p: 'hip', x: 98, y: 62 },
      props: [{ b: [92, 132, G, 10, -15, 15], c: 'frame' }, { b: [104, 132, 10, 22, -15, 15], c: 'frame' }, { b: [116, 132, 22, 34, -15, 15], c: 'frame' }, { b: [114, 120, G, 80, -16, -12], c: 'frame' }, { b: [114, 120, G, 80, 12, 16], c: 'frame' }],
      frames: [{ t: 84, l: -45, s: -100, l2: -92, s2: -92, a: -45, f: -5 }, { t: 84, l: -92, s: -92, l2: -45, s2: -100, a: -45, f: -5 }],
    },
    // ---------------- STRENGTH MACHINES ----------------
    {
      id: 'hack_squat', group: 'quads', second: ['glutes', 'hamstrings'], equip: ['machine'], level: 1, yaw: 35,
      name: T('Hack squat (machine)', 'Hack squat machine', 'آلة الهاك سكوات'),
      steps: [
        S('Dos et épaules contre les coussins, pieds au milieu de la plateforme.', 'Back and shoulders against the pads, feet mid-platform.', 'الظهر والكتفان على الوسائد والقدمان في وسط المنصة.'),
        S('Déverrouillez et descendez jusqu\'aux cuisses parallèles.', 'Unlock and lower until thighs are parallel.', 'حرر القفل وانزل حتى يوازي الفخذ المنصة.'),
        S('Remontez en poussant sur tout le pied, sans verrouiller les genoux.', 'Drive up through the whole foot without locking the knees.', 'اصعد بدفع القدم كاملة دون قفل الركبتين.'),
      ],
      mistakes: [S('Talons qui décollent.', 'Heels lifting.', 'ارتفاع الكعبين.'), S('Genoux qui rentrent.', 'Knees caving in.', 'دخول الركبتين.')],
      tip: S('Très efficace pour les quadriceps avec un dos soutenu.', 'Very effective for quads with a supported back.', 'فعّال جدًا للفخذ الأمامي مع دعم الظهر.'),
      anchor: { p: 'ankle', x: 104, y: 6 },
      props: [{ b: [92, 122, G, 4, -16, 16], c: 'frame' }, { l: [[70, G, -14], [104, 128, -14]] }, { l: [[70, G, 14], [104, 128, 14]] }],
      jboxes: [{ at: 'hipC', off: [-9.3, 15.6], ang: 100, size: [17, 2.5, 11], c: 'pad' }, { at: 'shC', off: [-1, 4.5], ang: 0, size: [6, 2, 15], c: 'pad' }],
      frames: [{ t: 100, l: -95, s: -82 }, { t: 100, l: -18, s: -122 }].map((k) => Object.assign(k, { a: -100, f: -40 })),
    },
    {
      id: 'tbar_row', group: 'back', second: ['biceps', 'traps', 'lowerback'], equip: ['machine', 'barbell'], level: 1, yaw: 35,
      name: T('Rowing T-bar', 'T-bar row', 'تجديف تي بار'),
      steps: [
        S('Pieds de chaque côté de la barre, genoux fléchis, dos plat à ~45°.', 'Feet on each side of the bar, knees bent, flat back at ~45°.', 'القدمان على جانبي البار والركبتان مثنيتان والظهر مستقيم بزاوية ~45°.'),
        S('Tirez la poignée vers la poitrine en serrant les omoplates.', 'Row the handle to your chest, squeezing your shoulder blades.', 'اسحب المقبض نحو الصدر مع ضم لوحي الكتف.'),
        S('Redescendez lentement bras tendus.', 'Lower slowly to straight arms.', 'انزل ببطء حتى تستقيم الذراعان.'),
      ],
      mistakes: [S('Arrondir le dos.', 'Rounding the back.', 'تقويس الظهر.'), S('Se relever pour tricher.', 'Standing up to cheat.', 'الوقوف للغش.')],
      tip: S('Permet de charger lourd le milieu du dos.', 'Lets you load the mid-back heavy.', 'يسمح بتحميل منتصف الظهر بوزن ثقيل.'),
      anchor: { p: 'ankle', x: 96, y: 0 },
      cables: [{ from: [40, 0, 0], to: 'C', bar: true }], handle: 'bar', plateAtHands: 10,
      frames: [{ t: 32, l: -72, s: -102, a: -90, f: -90 }, { t: 32, l: -72, s: -102, a: 168, f: -95 }],
    },
    {
      id: 'reverse_pec_deck', group: 'shoulders', second: ['traps', 'back'], equip: ['machine'], level: 0, yaw: 60,
      name: T('Pec deck inversé (deltoïdes arrière)', 'Reverse pec deck (rear delts)', 'الفراشة العكسية (الكتف الخلفي)'),
      steps: [
        S('Assis face à la machine, poitrine contre le dossier.', 'Sit facing the machine, chest against the pad.', 'اجلس مقابل الآلة والصدر على المسند.'),
        S('Bras presque tendus devant, ouvrez-les sur les côtés jusqu\'à l\'alignement des épaules.', 'Arms almost straight in front, open them out to shoulder level.', 'الذراعان شبه مستقيمتين للأمام، افتحهما جانبيًا حتى مستوى الكتفين.'),
        S('Revenez lentement.', 'Return slowly.', 'ارجع ببطء.'),
      ],
      mistakes: [S('Hausser les épaules.', 'Shrugging.', 'رفع الكتفين.')],
      tip: S('Améliore la posture (épaules enroulées).', 'Improves posture (rounded shoulders).', 'يحسن القوام (الكتفين المنحنيين).'),
      anchor: { p: 'hip', x: 92, y: 30 }, seat: [80, 106, 27], props: [{ b: [101, 105, 30, 62, -8, 8], c: 'pad' }, ...stack(128, -30)], handle: 'd',
      frames: [{ t: 90, l: 0, s: -90, a: 0, f: 0, ah: 8 }, { t: 90, l: 0, s: -90, a: 0, f: 0, ah: 92 }],
    },
    {
      id: 'glute_kickback_machine', group: 'glutes', second: ['hamstrings'], equip: ['machine'], level: 0, yaw: 40,
      name: T('Kickback fessier (machine)', 'Glute kickback machine', 'آلة ركلة المؤخرة'),
      steps: [
        S('Avant-bras sur les appuis, un pied contre le rouleau.', 'Forearms on the supports, one foot against the roller.', 'الساعدان على المساند وقدم على الوسادة.'),
        S('Poussez la jambe vers l\'arrière et le haut en serrant le fessier.', 'Push the leg back and up, squeezing the glute.', 'ادفع الساق للخلف وللأعلى مع عصر المؤخرة.'),
        S('Revenez lentement sans cambrer le dos.', 'Return slowly without arching your back.', 'ارجع ببطء دون تقويس الظهر.'),
      ],
      mistakes: [S('Cambrer le bas du dos.', 'Arching the lower back.', 'تقويس أسفل الظهر.')],
      tip: S('Contrôlez la descente : c\'est là que le fessier travaille le plus.', 'Control the return: that\'s where the glute works most.', 'تحكم في العودة: هنا تعمل المؤخرة أكثر.'),
      anchor: { p: 'ankle', x: 104, y: 0 },
      props: [{ b: [116, 128, 50, 54, -12, 12], c: 'pad' }, { b: [120, 126, G, 50, -4, 4], c: 'frame' }, ...stack(146, -32)],
      frames: [{ t: 55, l: -85, s: -95, l2: -100, s2: -110, a: -40, f: 0 }, { t: 55, l: -85, s: -95, l2: -165, s2: -150, a: -40, f: 0 }].map((k) => Object.assign(k, { ah: 0 })),
    },
    {
      id: 'machine_preacher_curl', group: 'biceps', second: ['forearms'], equip: ['machine'], level: 0, yaw: 30,
      name: T('Curl pupitre à la machine', 'Machine preacher curl', 'كيرل الواعظ على الآلة'),
      steps: [
        S('Assis, aisselles calées en haut du pupitre, bras posés dessus.', 'Seated, armpits on top of the pad, arms resting on it.', 'اجلس والإبطان على أعلى المسند والذراعان عليه.'),
        S('Montez les poignées sans décoller les coudes.', 'Curl the handles up without lifting the elbows.', 'ارفع المقابض دون رفع المرفقين.'),
        S('Redescendez lentement, presque bras tendus.', 'Lower slowly, almost to straight arms.', 'انزل ببطء حتى تكاد الذراعان تستقيمان.'),
      ],
      mistakes: [S('Tendre brutalement les coudes en bas.', 'Snapping the elbows straight at the bottom.', 'مد المرفقين بعنف في الأسفل.')],
      tip: S('Isole parfaitement le biceps, impossible de tricher avec le dos.', 'Isolates the biceps perfectly; no cheating with the back.', 'يعزل الباي تمامًا، لا يمكن الغش بالظهر.'),
      anchor: { p: 'hip', x: 88, y: 30 }, seat: [74, 100, 27], handle: 'd',
      jboxes: [{ at: 'shC', off: [10, -9], ang: -35, size: [10, 2, 12], c: 'pad' }],
      frames: [{ t: 82, l: 0, s: -90, a: -35, f: -15 }, { t: 82, l: 0, s: -90, a: -35, f: 105 }],
    },
    {
      id: 'dip_machine', group: 'triceps', second: ['chest', 'shoulders'], equip: ['machine'], level: 0, yaw: 35,
      name: T('Dips à la machine (assis)', 'Seated dip machine', 'آلة الغطس جالسًا'),
      steps: [
        S('Assis, poignées de chaque côté, coudes pliés vers l\'arrière.', 'Seated, handles at your sides, elbows bent back.', 'اجلس والمقابض على جانبيك والمرفقان مثنيان للخلف.'),
        S('Poussez vers le bas jusqu\'aux bras tendus.', 'Press down to straight arms.', 'ادفع للأسفل حتى تستقيم الذراعان.'),
        S('Remontez lentement.', 'Come back up slowly.', 'ارجع ببطء.'),
      ],
      mistakes: [S('Épaules qui montent.', 'Shoulders rising.', 'ارتفاع الكتفين.')],
      tip: S('Alternative sûre aux dips aux barres.', 'A safe alternative to bar dips.', 'بديل آمن للغطس على المتوازي.'),
      anchor: { p: 'hip', x: 92, y: 30 }, seat: [80, 110, 27], seatBack: true, handle: 'd', props: stack(64),
      frames: [{ t: 95, l: 0, s: -90, a: -150, f: -55, ah: 18 }, { t: 95, l: 0, s: -90, a: -96, f: -95, ah: 18 }],
    },
    {
      id: 'ab_crunch_machine', group: 'abs', second: [], equip: ['machine'], level: 0, yaw: 30,
      name: T('Crunch à la machine', 'Ab crunch machine', 'آلة الكرنش للبطن'),
      steps: [
        S('Assis, pieds calés, mains sur les poignées près des épaules.', 'Seated, feet hooked, hands on the handles by your shoulders.', 'اجلس والقدمان مثبتتان واليدان على المقابض قرب الكتفين.'),
        S('Enroulez le buste vers les genoux en contractant les abdos.', 'Curl your torso toward your knees, contracting the abs.', 'لفّ جذعك نحو الركبتين مع شد البطن.'),
        S('Revenez lentement sans relâcher complètement.', 'Return slowly without fully relaxing.', 'ارجع ببطء دون ارتخاء كامل.'),
      ],
      mistakes: [S('Tirer avec les bras.', 'Pulling with the arms.', 'السحب بالذراعين.')],
      tip: S('Permet de progresser en charge, comme pour les autres muscles.', 'Lets you progress the load, like any other muscle.', 'يسمح بزيادة الوزن تدريجيًا مثل باقي العضلات.'),
      anchor: { p: 'hip', x: 92, y: 30 }, seat: [80, 110, 27], seatBack: true, props: stack(60),
      frames: [{ t: 95, l: 0, s: -90, a: -25, f: 165 }, { t: 55, l: 0, s: -90, a: -65, f: 125 }],
    },
  ]);
})();
