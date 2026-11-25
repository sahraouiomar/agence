// Muscle groups and exercise library (FR / EN / AR).
// Each exercise: muscle group, equipment, how-to steps, common mistakes, tip,
// 2 key positions for the animated demo (see figure.js) and, when possible,
// a pose analyser id (see pose.js) for camera / video form correction.
(function () {
  const T = (fr, en, ar) => ({ fr, en, ar });

  // recovery = hours a muscle needs between hard sessions; big muscles need more.
  window.MUSCLES = [
    { id: 'chest', icon: '🫁', recovery: 72, name: T('Pectoraux', 'Chest', 'الصدر') },
    { id: 'back', icon: '🔙', recovery: 72, name: T('Dos', 'Back', 'الظهر') },
    { id: 'shoulders', icon: '🏔️', recovery: 48, name: T('Épaules', 'Shoulders', 'الأكتاف') },
    { id: 'biceps', icon: '💪', recovery: 48, name: T('Biceps', 'Biceps', 'الباي (العضلة ذات الرأسين)') },
    { id: 'triceps', icon: '🦾', recovery: 48, name: T('Triceps', 'Triceps', 'الترايسبس (ذات الثلاثة رؤوس)') },
    { id: 'abs', icon: '🧱', recovery: 48, name: T('Abdominaux / gainage', 'Abs / core', 'البطن / الجذع') },
    { id: 'glutes', icon: '🍑', recovery: 72, name: T('Fessiers', 'Glutes', 'المؤخرة (الأرداف)') },
    { id: 'quads', icon: '🦵', recovery: 72, name: T('Quadriceps (cuisses avant)', 'Quads (front thighs)', 'الفخذ الأمامي') },
    { id: 'hamstrings', icon: '🦿', recovery: 72, name: T('Ischio-jambiers (arrière cuisse)', 'Hamstrings', 'الفخذ الخلفي') },
    { id: 'calves', icon: '🦶', recovery: 48, name: T('Mollets', 'Calves', 'السمانة (بطة الساق)') },
    { id: 'traps', icon: '🔺', recovery: 48, name: T('Trapèzes', 'Traps', 'عضلة الترابيس (الرقبة)') },
    { id: 'forearms', icon: '✊', recovery: 48, name: T('Avant-bras', 'Forearms', 'الساعد') },
    { id: 'lowerback', icon: '🧘', recovery: 72, name: T('Bas du dos (lombaires)', 'Lower back', 'أسفل الظهر') },
  ];

  // Which muscles each day of a split trains (used by the smart planner).
  window.SPLITS = {
    full: [['chest', 'back', 'quads', 'shoulders', 'abs', 'hamstrings']],
    upperlower: [['chest', 'back', 'shoulders', 'biceps', 'triceps'], ['quads', 'hamstrings', 'glutes', 'calves', 'abs']],
    ppl: [['chest', 'shoulders', 'triceps'], ['back', 'biceps', 'abs'], ['quads', 'hamstrings', 'glutes', 'calves']],
  };

  window.EQUIP = {
    none: T('Sans matériel', 'No equipment', 'بدون معدات'),
    dumbbell: T('Haltères', 'Dumbbells', 'دمبل'),
    barbell: T('Barre', 'Barbell', 'بار (عمود حديد)'),
    bar: T('Barre de traction', 'Pull-up bar', 'عقلة'),
    bench: T('Banc / chaise', 'Bench / chair', 'بنك / كرسي'),
    machine: T('Machine (salle)', 'Machine (gym)', 'آلة (قاعة رياضة)'),
  };

  const S = (fr, en, ar) => T(fr, en, ar);

  window.EXERCISES = [
    // ---------------- CHEST ----------------
    {
      id: 'pushup', group: 'chest', second: ['triceps', 'shoulders', 'abs'], equip: ['none'], level: 1, analyzer: 'pushup',
      name: T('Pompes', 'Push-up', 'تمرين الضغط'),
      steps: [
        S('Mains au sol un peu plus larges que les épaules, doigts vers l\'avant.', 'Hands slightly wider than shoulders, fingers forward.', 'ضع اليدين على الأرض أوسع قليلًا من الكتفين والأصابع للأمام.'),
        S('Corps gainé en ligne droite de la tête aux talons (serrer fessiers et abdos).', 'Brace: body in a straight line from head to heels (squeeze glutes and abs).', 'شدّ البطن والمؤخرة ليكون الجسم خطًا مستقيمًا من الرأس إلى الكعبين.'),
        S('Descendre la poitrine presque au sol, coudes à ~45° du corps.', 'Lower your chest almost to the floor, elbows ~45° from your body.', 'انزل بصدرك حتى يقترب من الأرض والمرفقان بزاوية ~45° عن الجسم.'),
        S('Pousser fort pour remonter en expirant, bras tendus en haut.', 'Push back up while breathing out, arms straight at the top.', 'ادفع للأعلى مع الزفير حتى تستقيم الذراعان.'),
      ],
      mistakes: [
        S('Hanches qui s\'affaissent (douleur lombaire).', 'Sagging hips (lower-back pain).', 'هبوط الحوض للأسفل (يؤلم أسفل الظهر).'),
        S('Coudes écartés à 90° (stress sur les épaules).', 'Elbows flared to 90° (shoulder stress).', 'فتح المرفقين بزاوية 90° (ضغط على الكتف).'),
        S('Amplitude trop courte.', 'Half reps.', 'نزول ناقص (حركة قصيرة).'),
      ],
      tip: S('Trop dur ? Faites-les sur les genoux ou les mains sur un banc.', 'Too hard? Do them on your knees or with hands on a bench.', 'صعب؟ ابدأ على الركبتين أو باليدين على كرسي.'),
      anchor: { p: 'ankle', x: 40, y: 3 },
      frames: [{ t: 23, l: -157, s: -157, a: -90, f: -90 }, { t: 7, l: -173, s: -173, a: 164, f: -90 }],
    },
    {
      id: 'incline_pushup', group: 'chest', second: ['triceps', 'shoulders'], equip: ['bench'], level: 0,
      name: T('Pompes inclinées (mains sur banc)', 'Incline push-up', 'ضغط مائل (اليدان على كرسي)'),
      steps: [
        S('Mains sur un banc/chaise stable, largeur d\'épaules.', 'Hands on a stable bench/chair, shoulder width.', 'اليدان على كرسي ثابت بعرض الكتفين.'),
        S('Corps droit, abdos serrés.', 'Body straight, abs tight.', 'الجسم مستقيم والبطن مشدود.'),
        S('Descendre la poitrine vers le bord, puis pousser.', 'Lower your chest to the edge, then push.', 'أنزل صدرك نحو حافة الكرسي ثم ادفع.'),
      ],
      mistakes: [S('Tête qui avance vers le banc.', 'Poking the head forward.', 'مدّ الرأس للأمام.'), S('Fesses en l\'air.', 'Hips piked up.', 'رفع المؤخرة للأعلى.')],
      tip: S('Parfait pour débuter : plus le support est haut, plus c\'est facile.', 'Great for beginners: the higher the support, the easier.', 'ممتاز للمبتدئ: كلما ارتفع السند كان أسهل.'),
      anchor: { p: 'ankle', x: 30, y: 3 }, bench: [78, 112, 25],
      frames: [{ t: 44.7, l: -135.3, s: -135.3, a: -90, f: -90 }, { t: 25.6, l: -154.4, s: -154.4, a: 164, f: -90 }],
    },
    {
      id: 'bench_press', group: 'chest', second: ['triceps', 'shoulders'], equip: ['barbell'], level: 2,
      name: T('Développé couché', 'Bench press', 'ضغط البنش (الصدر بالبار)'),
      steps: [
        S('Allongé, yeux sous la barre, pieds à plat au sol.', 'Lie down, eyes under the bar, feet flat on the floor.', 'استلقِ وعيناك تحت البار والقدمان على الأرض.'),
        S('Omoplates serrées et basses, léger arc naturel du dos.', 'Squeeze shoulder blades together and down, natural slight arch.', 'اضمم لوحي الكتف للخلف وللأسفل مع تقوس طبيعي خفيف.'),
        S('Descendre la barre contrôlée jusqu\'au bas des pectoraux.', 'Lower the bar under control to your lower chest.', 'أنزل البار ببطء حتى أسفل الصدر.'),
        S('Pousser la barre vers le haut et légèrement vers l\'arrière.', 'Press up and slightly back.', 'ادفع البار للأعلى ولِلخلف قليلًا.'),
      ],
      mistakes: [S('Faire rebondir la barre sur la poitrine.', 'Bouncing the bar off the chest.', 'ارتداد البار على الصدر.'), S('Fesses qui décollent du banc.', 'Hips lifting off the bench.', 'رفع المؤخرة عن البنك.'), S('Poignets cassés vers l\'arrière.', 'Bent-back wrists.', 'ثني المعصم للخلف.')],
      tip: S('Utilisez toujours un partenaire (pareur) pour les charges lourdes.', 'Always use a spotter for heavy sets.', 'استعمل دائمًا شريكًا يساعدك في الأوزان الثقيلة.'),
      anchor: { p: 'hip', x: 95, y: 30 }, bench: [40, 110, 26], tool: 'bb',
      frames: [{ t: 180, l: -20, s: -90, a: 90, f: 90 }, { t: 180, l: -20, s: -90, a: -100, f: 80 }],
    },
    // ---------------- BACK ----------------
    {
      id: 'pullup', group: 'back', second: ['biceps', 'abs'], equip: ['bar'], level: 2,
      name: T('Tractions', 'Pull-up', 'العقلة (السحب للأعلى)'),
      steps: [
        S('Suspendu, mains en pronation un peu plus larges que les épaules.', 'Hang with an overhand grip slightly wider than shoulders.', 'تعلّق بقبضة علوية أوسع قليلًا من الكتفين.'),
        S('Abaisser les épaules (loin des oreilles) avant de tirer.', 'Pull shoulders down (away from ears) before pulling.', 'أنزل الكتفين بعيدًا عن الأذنين قبل السحب.'),
        S('Tirer les coudes vers les hanches jusqu\'au menton au-dessus de la barre.', 'Drive elbows toward hips until chin clears the bar.', 'اسحب المرفقين نحو الخصر حتى يتجاوز الذقن العقلة.'),
        S('Redescendre lentement bras tendus.', 'Lower slowly to straight arms.', 'انزل ببطء حتى تستقيم الذراعان.'),
      ],
      mistakes: [S('Se balancer (kipping) pour tricher.', 'Swinging (kipping) to cheat.', 'التأرجح بالجسم للغش.'), S('Demi-répétitions.', 'Half reps.', 'حركات ناقصة.')],
      tip: S('Débutant : commencez par des tractions négatives (descente lente 5 s) ou avec un élastique.', 'Beginner: start with slow negatives (5 s down) or a band.', 'للمبتدئ: ابدأ بالنزول البطيء (5 ثوانٍ) أو باستعمال مطاط مساعد.'),
      anchor: { p: 'wrist', x: 100, y: 135 }, tool: 'bar',
      frames: [{ t: 90, l: -95, s: -85, a: 90, f: 90 }, { t: 90, l: -95, s: -85, a: -45, f: 120 }],
    },
    {
      id: 'db_row', group: 'back', second: ['biceps', 'shoulders'], equip: ['dumbbell'], level: 1,
      name: T('Rowing haltères buste penché', 'Bent-over dumbbell row', 'تجديف بالدمبل منحنيًا'),
      steps: [
        S('Pieds largeur de hanches, genoux légèrement fléchis.', 'Feet hip-width, knees slightly bent.', 'القدمان بعرض الحوض والركبتان مثنيتان قليلًا.'),
        S('Pencher le buste (~45°) en gardant le dos plat.', 'Hinge forward (~45°) keeping a flat back.', 'انحنِ بالجذع (~45°) مع ظهر مستقيم.'),
        S('Tirer les haltères vers les hanches en serrant les omoplates.', 'Row the dumbbells to your hips, squeezing shoulder blades.', 'اسحب الدمبل نحو الخصر مع ضم لوحي الكتف.'),
        S('Redescendre lentement.', 'Lower slowly.', 'أنزل ببطء.'),
      ],
      mistakes: [S('Dos rond.', 'Rounded back.', 'تقوّس الظهر.'), S('Tirer avec l\'élan du buste.', 'Jerking with the torso.', 'السحب بقوة دفع الجذع.')],
      tip: S('Pensez « coudes dans les poches arrière ».', 'Think "elbows into back pockets".', 'تخيّل أنك تُدخل المرفقين في جيوبك الخلفية.'),
      anchor: { p: 'ankle', x: 95, y: 0 }, tool: 'db',
      frames: [{ t: 25, l: -80, s: -100, a: -90, f: -90 }, { t: 25, l: -80, s: -100, a: 165, f: -95 }],
    },
    {
      id: 'superman', group: 'lowerback', second: ['back', 'glutes'], equip: ['none'], level: 0, prone: true,
      name: T('Superman', 'Superman', 'تمرين سوبرمان'),
      steps: [
        S('Allongé sur le ventre, bras tendus devant.', 'Lie face down, arms stretched forward.', 'استلقِ على بطنك والذراعان ممدودتان للأمام.'),
        S('Lever bras, poitrine et jambes ensemble, regard vers le sol.', 'Lift arms, chest and legs together, eyes to the floor.', 'ارفع الذراعين والصدر والساقين معًا والنظر للأرض.'),
        S('Tenir 2 s en haut puis redescendre.', 'Hold 2 s at the top then lower.', 'اثبت ثانيتين في الأعلى ثم انزل.'),
      ],
      mistakes: [S('Relever la tête (cou cassé).', 'Cranking the neck up.', 'رفع الرأس بقوة (ثني الرقبة).'), S('Mouvement trop rapide.', 'Moving too fast.', 'الحركة بسرعة.')],
      tip: S('Excellent pour la posture et la prévention du mal de dos.', 'Great for posture and back-pain prevention.', 'ممتاز للقوام والوقاية من آلام الظهر.'),
      anchor: { p: 'hip', x: 100, y: 4 },
      frames: [{ t: 180, l: 0, s: 0, a: 180, f: 180 }, { t: 168, l: 10, s: 12, a: 168, f: 166 }],
    },
    // ---------------- SHOULDERS ----------------
    {
      id: 'overhead_press', group: 'shoulders', second: ['triceps', 'abs'], equip: ['dumbbell'], level: 1, analyzer: 'press',
      name: T('Développé militaire haltères', 'Dumbbell overhead press', 'ضغط الكتف بالدمبل'),
      steps: [
        S('Debout, haltères à hauteur d\'épaules, abdos et fessiers serrés.', 'Stand, dumbbells at shoulder height, abs and glutes tight.', 'قف والدمبل عند الكتفين مع شد البطن والمؤخرة.'),
        S('Pousser au-dessus de la tête jusqu\'aux bras tendus.', 'Press overhead to straight arms.', 'ادفع فوق الرأس حتى تستقيم الذراعان.'),
        S('Redescendre contrôlé aux épaules.', 'Lower under control to the shoulders.', 'أنزل بتحكم حتى الكتفين.'),
      ],
      mistakes: [S('Cambrer le bas du dos.', 'Arching the lower back.', 'تقويس أسفل الظهر.'), S('Ne pas tendre les bras en haut.', 'Not locking out at the top.', 'عدم مد الذراعين كاملًا في الأعلى.')],
      tip: S('Assis avec dossier si votre dos se cambre trop.', 'Do it seated with back support if your back arches.', 'نفّذه جالسًا مع مسند ظهر إذا كان ظهرك يتقوّس.'),
      anchor: { p: 'ankle', x: 100, y: 0 }, tool: 'db',
      frames: [{ t: 90, l: -90, s: -90, a: -80, f: 95 }, { t: 90, l: -90, s: -90, a: 90, f: 90 }],
    },
    {
      id: 'lateral_raise', group: 'shoulders', second: [], equip: ['dumbbell'], level: 1, view: 'front',
      name: T('Élévations latérales', 'Lateral raise', 'رفرفة جانبية بالدمبل'),
      steps: [
        S('Debout, haltères légers le long du corps, coudes légèrement fléchis.', 'Stand, light dumbbells at your sides, elbows slightly bent.', 'قف والدمبل الخفيف بجانبك والمرفقان مثنيان قليلًا.'),
        S('Monter les bras sur les côtés jusqu\'à hauteur d\'épaules.', 'Raise arms out to the sides up to shoulder height.', 'ارفع الذراعين جانبيًا حتى مستوى الكتفين.'),
        S('Redescendre lentement (2–3 s).', 'Lower slowly (2–3 s).', 'انزل ببطء (2–3 ثوانٍ).'),
      ],
      mistakes: [S('Hausser les épaules (trapèzes).', 'Shrugging (traps take over).', 'رفع الكتفين نحو الأذنين.'), S('Charge trop lourde avec élan.', 'Too heavy, swinging.', 'وزن ثقيل مع تأرجح.')],
      tip: S('Léger et strict : 12–20 répétitions marchent très bien.', 'Light and strict: 12–20 reps work very well.', 'وزن خفيف وأداء صارم: 12–20 تكرارًا ممتازة.'),
      tool: 'db', frames: [{ a: -95, f: -97, l: -92, s: -92 }, { a: -5, f: -2, l: -92, s: -92 }],
    },
    {
      id: 'pike_pushup', group: 'shoulders', second: ['triceps'], equip: ['none'], level: 2,
      name: T('Pompes piquées (pike)', 'Pike push-up', 'ضغط بايك (للأكتاف)'),
      steps: [
        S('Position en V inversé, hanches hautes, mains largeur d\'épaules.', 'Inverted V position, hips high, hands shoulder width.', 'وضعية V مقلوبة والحوض مرتفع واليدان بعرض الكتفين.'),
        S('Fléchir les coudes pour amener la tête vers le sol devant les mains.', 'Bend elbows to bring your head toward the floor in front of the hands.', 'اثنِ المرفقين لتقريب الرأس من الأرض أمام اليدين.'),
        S('Pousser pour remonter.', 'Push back up.', 'ادفع للعودة.'),
      ],
      mistakes: [S('Hanches qui descendent (devient une pompe).', 'Hips dropping (turns into a push-up).', 'نزول الحوض (يصبح ضغطًا عاديًا).')],
      tip: S('Version sans matériel du développé épaules.', 'The no-equipment version of the shoulder press.', 'بديل ضغط الكتف بدون معدات.'),
      anchor: { p: 'ankle', x: 50, y: 0 },
      frames: [{ t: -40, l: -110, s: -110, a: -40, f: -40 }, { t: -60, l: -110, s: -110, a: -160, f: -30 }],
    },
    // ---------------- BICEPS ----------------
    {
      id: 'db_curl', group: 'biceps', second: [], equip: ['dumbbell'], level: 0, analyzer: 'curl',
      name: T('Curl biceps haltères', 'Dumbbell biceps curl', 'تمرين الباي بالدمبل'),
      steps: [
        S('Debout, haltères en main, paumes vers l\'avant.', 'Stand holding dumbbells, palms forward.', 'قف والدمبل في يديك وراحتا اليدين للأمام.'),
        S('Coudes collés au corps, monter les haltères vers les épaules.', 'Elbows pinned to your sides, curl up to the shoulders.', 'المرفقان ملتصقان بالجسم، ارفع الدمبل نحو الكتفين.'),
        S('Serrer 1 s en haut, redescendre lentement bras tendus.', 'Squeeze 1 s at the top, lower slowly to straight arms.', 'اعصر ثانية في الأعلى ثم انزل ببطء حتى تستقيم الذراع.'),
      ],
      mistakes: [S('Balancer le buste.', 'Swinging the torso.', 'تأرجح الجذع.'), S('Coudes qui avancent.', 'Elbows drifting forward.', 'تقدّم المرفقين للأمام.')],
      tip: S('La descente lente (2–3 s) est aussi importante que la montée.', 'The slow lowering (2–3 s) matters as much as the lift.', 'النزول البطيء (2–3 ثوانٍ) مهم مثل الصعود.'),
      anchor: { p: 'ankle', x: 100, y: 0 }, tool: 'db',
      frames: [{ t: 90, l: -90, s: -90, a: -90, f: -88 }, { t: 90, l: -90, s: -90, a: -95, f: 95 }],
    },
    {
      id: 'hammer_curl', group: 'biceps', second: [], equip: ['dumbbell'], level: 0, analyzer: 'curl',
      name: T('Curl marteau', 'Hammer curl', 'تمرين المطرقة (هامر)'),
      steps: [
        S('Haltères en prise neutre (paumes face à face).', 'Neutral grip (palms facing each other).', 'قبضة محايدة (الراحتان متقابلتان).'),
        S('Monter sans bouger les coudes.', 'Curl up without moving the elbows.', 'ارفع دون تحريك المرفقين.'),
        S('Redescendre contrôlé.', 'Lower under control.', 'انزل بتحكم.'),
      ],
      mistakes: [S('Élan du dos.', 'Using back momentum.', 'استعمال دفع الظهر.')],
      tip: S('Travaille aussi l\'avant-bras (brachioradial).', 'Also trains the forearm (brachioradialis).', 'يقوّي الساعد أيضًا.'),
      anchor: { p: 'ankle', x: 100, y: 0 }, tool: 'db',
      frames: [{ t: 90, l: -90, s: -90, a: -90, f: -88 }, { t: 90, l: -90, s: -90, a: -95, f: 95 }],
    },
    // ---------------- TRICEPS ----------------
    {
      id: 'bench_dips', group: 'triceps', second: ['chest', 'shoulders'], equip: ['bench'], level: 1,
      name: T('Dips sur banc', 'Bench dips', 'غطس على الكرسي (ديبس)'),
      steps: [
        S('Mains sur le bord d\'un banc derrière vous, jambes devant.', 'Hands on the edge of a bench behind you, legs in front.', 'اليدان على حافة كرسي خلفك والساقان أمامك.'),
        S('Fléchir les coudes vers l\'arrière jusqu\'à ~90°.', 'Bend elbows straight back to ~90°.', 'اثنِ المرفقين للخلف حتى ~90°.'),
        S('Pousser pour tendre les bras.', 'Push up to straight arms.', 'ادفع حتى تستقيم الذراعان.'),
      ],
      mistakes: [S('Descendre trop bas (épaules).', 'Going too deep (shoulder strain).', 'النزول كثيرًا (يضر الكتف).'), S('Coudes qui s\'écartent.', 'Elbows flaring out.', 'تباعد المرفقين.')],
      tip: S('Jambes fléchies = plus facile ; tendues = plus dur.', 'Bent legs = easier; straight legs = harder.', 'الركبتان مثنيتان = أسهل، ممدودتان = أصعب.'),
      anchor: { p: 'wrist', x: 70, y: 25 }, bench: [38, 74, 25],
      frames: [{ t: 90, l: -20, s: -60, a: -90, f: -90 }, { t: 90, l: 12, s: -55, a: -170, f: -52 }],
    },
    {
      id: 'triceps_ext', group: 'triceps', second: [], equip: ['dumbbell'], level: 1,
      name: T('Extension triceps au-dessus de la tête', 'Overhead triceps extension', 'تمديد الترايسبس فوق الرأس'),
      steps: [
        S('Tenir un haltère à deux mains au-dessus de la tête.', 'Hold one dumbbell with both hands overhead.', 'أمسك دمبل بكلتا اليدين فوق الرأس.'),
        S('Descendre derrière la tête en gardant les coudes pointés vers le haut.', 'Lower behind your head, elbows pointing up.', 'أنزله خلف الرأس مع بقاء المرفقين للأعلى.'),
        S('Tendre les bras.', 'Extend the arms.', 'مدّ الذراعين.'),
      ],
      mistakes: [S('Coudes qui s\'ouvrent.', 'Elbows flaring.', 'تباعد المرفقين.'), S('Dos cambré.', 'Arched back.', 'تقوس الظهر.')],
      tip: S('L\'étirement en bas développe bien le long chef du triceps.', 'The deep stretch builds the long head of the triceps.', 'التمدد في الأسفل يبني الرأس الطويل للترايسبس.'),
      anchor: { p: 'ankle', x: 100, y: 0 }, tool: 'db',
      frames: [{ t: 90, l: -90, s: -90, a: 90, f: 90 }, { t: 90, l: -90, s: -90, a: 100, f: -100 }],
    },
    {
      id: 'diamond_pushup', group: 'triceps', second: ['chest'], equip: ['none'], level: 2, analyzer: 'pushup',
      name: T('Pompes diamant', 'Diamond push-up', 'ضغط الماسة'),
      steps: [
        S('Mains rapprochées sous la poitrine (pouces et index forment un losange).', 'Hands together under the chest (thumbs and index fingers form a diamond).', 'اليدان متقاربتان تحت الصدر (الإبهام والسبابة على شكل ماسة).'),
        S('Corps gainé, descendre en gardant les coudes près du corps.', 'Body braced, lower with elbows close to the body.', 'الجسم مشدود وانزل والمرفقان قريبان من الجسم.'),
        S('Pousser jusqu\'aux bras tendus.', 'Push to straight arms.', 'ادفع حتى تستقيم الذراعان.'),
      ],
      mistakes: [S('Hanches affaissées.', 'Sagging hips.', 'هبوط الحوض.')],
      tip: S('Sur les genoux si besoin.', 'On your knees if needed.', 'على الركبتين عند الحاجة.'),
      anchor: { p: 'ankle', x: 40, y: 3 },
      frames: [{ t: 23, l: -157, s: -157, a: -90, f: -90 }, { t: 7, l: -173, s: -173, a: 164, f: -90 }],
    },
    // ---------------- ABS ----------------
    {
      id: 'plank', group: 'abs', second: ['shoulders', 'glutes'], equip: ['none'], level: 0, analyzer: 'plank', hold: true,
      name: T('Gainage (planche)', 'Plank', 'تمرين البلانك (الثبات)'),
      steps: [
        S('Avant-bras au sol, coudes sous les épaules.', 'Forearms on the floor, elbows under shoulders.', 'الساعدان على الأرض والمرفقان تحت الكتفين.'),
        S('Corps en ligne droite, serrer abdos et fessiers.', 'Body in a straight line, squeeze abs and glutes.', 'الجسم خط مستقيم مع شد البطن والمؤخرة.'),
        S('Respirer normalement et tenir.', 'Breathe normally and hold.', 'تنفّس بشكل طبيعي واثبت.'),
      ],
      mistakes: [S('Bassin trop bas (creuse le dos).', 'Hips too low (back arches).', 'الحوض منخفض (يتقوّس الظهر).'), S('Fesses trop hautes.', 'Hips too high.', 'المؤخرة مرتفعة جدًا.'), S('Bloquer la respiration.', 'Holding your breath.', 'حبس النفس.')],
      tip: S('Mieux vaut 3 × 30 s parfaites que 2 min mal faites.', '3 × 30 s perfect beats 2 min sloppy.', '3 × 30 ثانية صحيحة أفضل من دقيقتين بشكل خاطئ.'),
      anchor: { p: 'ankle', x: 40, y: 3 },
      frames: [{ t: 10.7, l: -169.3, s: -169.3, a: -90, f: 0 }, { t: 11.5, l: -168.5, s: -168.5, a: -90, f: 0 }],
    },
    {
      id: 'crunch', group: 'abs', second: [], equip: ['none'], level: 0,
      name: T('Crunch', 'Crunch', 'تمرين الكرنش'),
      steps: [
        S('Sur le dos, genoux fléchis, pieds au sol.', 'On your back, knees bent, feet on the floor.', 'على ظهرك والركبتان مثنيتان والقدمان على الأرض.'),
        S('Enrouler le haut du dos en rapprochant les côtes du bassin.', 'Curl your upper back, bringing ribs toward pelvis.', 'لفّ أعلى الظهر بتقريب الأضلاع من الحوض.'),
        S('Expirer en montant, redescendre lentement.', 'Exhale going up, lower slowly.', 'ازفر عند الصعود وانزل ببطء.'),
      ],
      mistakes: [S('Tirer sur la nuque avec les mains.', 'Pulling on your neck.', 'شد الرقبة باليدين.'), S('Monter tout le dos (fléchisseurs de hanche).', 'Sitting all the way up (hip flexors).', 'الصعود بكامل الظهر.')],
      tip: S('Petite amplitude mais contraction maximale.', 'Small range, maximum squeeze.', 'حركة صغيرة مع انقباض قوي.'),
      anchor: { p: 'hip', x: 100, y: 4 },
      frames: [{ t: 180, l: 60, s: -60, a: 0, f: 0 }, { t: 150, l: 60, s: -60, a: -5, f: -5 }],
    },
    {
      id: 'leg_raise', group: 'abs', second: [], equip: ['none'], level: 1,
      name: T('Relevés de jambes', 'Lying leg raise', 'رفع الساقين مستلقيًا'),
      steps: [
        S('Sur le dos, mains sous les fesses, bas du dos plaqué.', 'On your back, hands under hips, lower back pressed down.', 'على ظهرك واليدان تحت المؤخرة وأسفل الظهر ملتصق بالأرض.'),
        S('Monter les jambes tendues à la verticale.', 'Raise straight legs to vertical.', 'ارفع الساقين مستقيمتين حتى الوضع العمودي.'),
        S('Redescendre lentement sans toucher le sol.', 'Lower slowly without touching the floor.', 'انزل ببطء دون لمس الأرض.'),
      ],
      mistakes: [S('Bas du dos qui se décolle.', 'Lower back lifting off.', 'ارتفاع أسفل الظهر عن الأرض.')],
      tip: S('Genoux fléchis pour simplifier.', 'Bend your knees to make it easier.', 'اثنِ الركبتين لتسهيله.'),
      anchor: { p: 'hip', x: 85, y: 4 },
      frames: [{ t: 180, l: 4, s: 4, a: 0, f: 0 }, { t: 180, l: 85, s: 85, a: 0, f: 0 }],
    },
    {
      id: 'mountain_climber', group: 'abs', second: ['shoulders', 'quads'], equip: ['none'], level: 1,
      name: T('Mountain climbers', 'Mountain climbers', 'متسلق الجبال'),
      steps: [
        S('Position haute de pompe, mains sous les épaules.', 'High push-up position, hands under shoulders.', 'وضعية الضغط العالية واليدان تحت الكتفين.'),
        S('Ramener un genou vers la poitrine puis alterner rapidement.', 'Drive one knee to the chest, then alternate fast.', 'اسحب ركبة نحو الصدر ثم بدّل بسرعة.'),
        S('Garder le bassin bas et stable.', 'Keep hips low and steady.', 'حافظ على الحوض منخفضًا وثابتًا.'),
      ],
      mistakes: [S('Fesses qui montent.', 'Hips bouncing up.', 'ارتفاع المؤخرة.')],
      tip: S('Cardio + gainage : idéal en circuit.', 'Cardio + core: perfect in circuits.', 'كارديو + جذع: مثالي في الدوائر التدريبية.'),
      anchor: { p: 'wrist', x: 118, y: 0 },
      frames: [{ t: 23, l: -157, s: -157, l2: -35, s2: -150, a: -90, f: -90 }, { t: 23, l: -35, s: -150, l2: -157, s2: -157, a: -90, f: -90 }],
    },
    // ---------------- GLUTES ----------------
    {
      id: 'glute_bridge', group: 'glutes', second: ['hamstrings', 'abs'], equip: ['none'], level: 0, analyzer: 'bridge',
      name: T('Pont fessier', 'Glute bridge', 'جسر المؤخرة'),
      steps: [
        S('Sur le dos, genoux fléchis, pieds à plat largeur de hanches.', 'On your back, knees bent, feet flat hip-width.', 'على ظهرك والركبتان مثنيتان والقدمان مسطحتان بعرض الحوض.'),
        S('Pousser dans les talons et monter les hanches.', 'Drive through your heels and lift the hips.', 'ادفع بالكعبين وارفع الحوض.'),
        S('En haut : ligne droite épaules-hanches-genoux, serrer les fessiers 2 s.', 'At the top: straight line shoulders-hips-knees, squeeze 2 s.', 'في الأعلى: خط مستقيم كتف-حوض-ركبة واعصر المؤخرة ثانيتين.'),
      ],
      mistakes: [S('Cambrer le dos au lieu de serrer les fessiers.', 'Arching the back instead of squeezing glutes.', 'تقويس الظهر بدل عصر المؤخرة.'), S('Pieds trop loin (ischios qui crampent).', 'Feet too far (hamstrings cramp).', 'القدمان بعيدتان (تشنج الفخذ الخلفي).')],
      tip: S('Ajoutez un poids sur les hanches pour progresser.', 'Add weight on your hips to progress.', 'ضع وزنًا على الحوض للتقدم.'),
      anchor: { p: 'ankle', x: 125, y: 0 },
      frames: [{ t: 180, l: 40, s: -75, a: 0, f: 0 }, { t: 192, l: 20, s: -88, a: -12, f: -12 }],
    },
    {
      id: 'hip_thrust', group: 'glutes', second: ['hamstrings', 'quads'], equip: ['bench'], level: 1, analyzer: 'bridge',
      name: T('Hip thrust', 'Hip thrust', 'دفع الحوض (هيب ثراست)'),
      steps: [
        S('Haut du dos appuyé sur un banc, pieds au sol.', 'Upper back on a bench, feet on the floor.', 'أعلى الظهر على كرسي والقدمان على الأرض.'),
        S('Monter les hanches jusqu\'à l\'horizontale, menton rentré.', 'Lift hips until level, chin tucked.', 'ارفع الحوض حتى يصبح الجسم أفقيًا مع إدخال الذقن.'),
        S('Tibias verticaux en haut, serrer fort les fessiers.', 'Shins vertical at the top, squeeze hard.', 'الساق عمودية في الأعلى واعصر المؤخرة بقوة.'),
      ],
      mistakes: [S('Hyper-extension du bas du dos.', 'Over-arching the lower back.', 'تقويس مفرط لأسفل الظهر.')],
      tip: S('Le meilleur exercice d\'isolation pour les fessiers.', 'One of the best glute builders.', 'من أفضل التمارين لبناء المؤخرة.'),
      anchor: { p: 'ankle', x: 128, y: 0 }, bench: [30, 78, 20],
      frames: [{ t: 150, l: 40, s: -80, a: -30, f: -30 }, { t: 180, l: 0, s: -90, a: 0, f: 0 }],
    },
    // ---------------- QUADS ----------------
    {
      id: 'squat', group: 'quads', second: ['glutes', 'hamstrings', 'abs'], equip: ['none'], level: 0, analyzer: 'squat',
      name: T('Squat', 'Squat', 'القرفصاء (سكوات)'),
      steps: [
        S('Pieds largeur d\'épaules, pointes légèrement ouvertes.', 'Feet shoulder-width, toes slightly out.', 'القدمان بعرض الكتفين والأصابع مفتوحة قليلًا.'),
        S('Pousser les hanches en arrière et fléchir les genoux comme pour s\'asseoir.', 'Push hips back and bend knees as if sitting down.', 'ادفع الحوض للخلف واثنِ الركبتين كأنك تجلس.'),
        S('Descendre cuisses au moins parallèles au sol, poitrine fière, talons au sol.', 'Go down to at least thighs parallel, chest proud, heels down.', 'انزل حتى يصبح الفخذ موازيًا للأرض على الأقل مع رفع الصدر والكعبان على الأرض.'),
        S('Genoux dans l\'axe des pieds, remonter en poussant le sol.', 'Knees track over toes, stand up pushing the floor away.', 'الركبتان في اتجاه القدمين، واصعد بدفع الأرض.'),
      ],
      mistakes: [S('Genoux qui rentrent vers l\'intérieur.', 'Knees caving in.', 'دخول الركبتين للداخل.'), S('Talons qui décollent.', 'Heels lifting.', 'ارتفاع الكعبين.'), S('Dos qui s\'arrondit / buste trop penché.', 'Rounding back / leaning too far forward.', 'تقوّس الظهر أو ميل الجذع كثيرًا.')],
      tip: S('Filmez-vous de profil : l\'application vérifie la profondeur et l\'inclinaison du buste.', 'Film yourself from the side: the app checks depth and torso lean.', 'صوّر نفسك من الجانب: التطبيق يتحقق من العمق وميل الجذع.'),
      anchor: { p: 'ankle', x: 100, y: 0 },
      frames: [{ t: 90, l: -90, s: -90, a: 0, f: 0 }, { t: 55, l: -10, s: -133, a: 0, f: 0 }],
    },
    {
      id: 'lunge', group: 'quads', second: ['glutes', 'hamstrings'], equip: ['none'], level: 0, analyzer: 'lunge',
      name: T('Fentes', 'Lunge', 'الطعنات (لانج)'),
      steps: [
        S('Grand pas en avant, buste droit.', 'Take a big step forward, torso upright.', 'خطوة كبيرة للأمام والجذع مستقيم.'),
        S('Descendre le genou arrière vers le sol (2 genoux à ~90°).', 'Lower the back knee toward the floor (both knees ~90°).', 'أنزل الركبة الخلفية نحو الأرض (الركبتان ~90°).'),
        S('Pousser sur le talon avant pour remonter.', 'Push through the front heel to come up.', 'ادفع بالكعب الأمامي للصعود.'),
      ],
      mistakes: [S('Genou avant qui dépasse beaucoup et rentre.', 'Front knee shooting far forward and caving in.', 'تقدم الركبة الأمامية كثيرًا ودخولها للداخل.'), S('Pas trop court.', 'Step too short.', 'خطوة قصيرة جدًا.')],
      tip: S('Gardez le poids sur la jambe avant.', 'Keep your weight on the front leg.', 'اجعل الوزن على الساق الأمامية.'),
      anchor: { p: 'ankle', x: 118, y: 0 },
      frames: [{ t: 90, l: -75, s: -100, l2: -115, s2: -120, a: -90, f: -90 }, { t: 90, l: -5, s: -95, l2: -100, s2: 180, a: -90, f: -90 }],
    },
    {
      id: 'bulgarian', group: 'quads', second: ['glutes'], equip: ['bench'], level: 2, analyzer: 'lunge',
      name: T('Squat bulgare', 'Bulgarian split squat', 'السكوات البلغاري'),
      steps: [
        S('Pied arrière posé sur un banc, pied avant un grand pas devant.', 'Rear foot on a bench, front foot a big step ahead.', 'القدم الخلفية على كرسي والأمامية متقدمة بخطوة كبيرة.'),
        S('Descendre droit jusqu\'à cuisse avant parallèle.', 'Lower straight down until the front thigh is parallel.', 'انزل عموديًا حتى يوازي الفخذ الأمامي الأرض.'),
        S('Remonter en poussant sur le pied avant.', 'Drive up through the front foot.', 'اصعد بالدفع على القدم الأمامية.'),
      ],
      mistakes: [S('Pied avant trop proche du banc.', 'Front foot too close to the bench.', 'القدم الأمامية قريبة جدًا من الكرسي.')],
      tip: S('Un des meilleurs exercices sans barre pour les cuisses.', 'One of the best barbell-free leg exercises.', 'من أفضل تمارين الأرجل بدون بار.'),
      anchor: { p: 'ankle', x: 125, y: 0 }, bench: [40, 82, 14],
      frames: [{ t: 90, l: -80, s: -95, l2: -125, s2: -160, a: -90, f: -90 }, { t: 85, l: -5, s: -95, l2: -100, s2: 150, a: -90, f: -90 }],
    },
    {
      id: 'wall_sit', group: 'quads', second: ['glutes'], equip: ['none'], level: 0, hold: true,
      name: T('Chaise contre le mur', 'Wall sit', 'الجلوس على الحائط'),
      steps: [
        S('Dos contre un mur, glisser jusqu\'à cuisses parallèles au sol.', 'Back against a wall, slide down to thighs parallel.', 'ظهرك على الحائط وانزل حتى يوازي الفخذ الأرض.'),
        S('Genoux à 90° au-dessus des chevilles.', 'Knees at 90° above the ankles.', 'الركبتان بزاوية 90° فوق الكاحلين.'),
        S('Tenir en respirant.', 'Hold and breathe.', 'اثبت مع التنفس.'),
      ],
      mistakes: [S('Mains qui poussent sur les cuisses.', 'Pushing hands on thighs.', 'الضغط باليدين على الفخذين.')],
      tip: S('Bon pour les genoux sensibles (pas d\'impact).', 'Knee-friendly (no impact).', 'لطيف على الركبتين (بدون صدمات).'),
      anchor: { p: 'ankle', x: 122, y: 0 }, wall: 95,
      frames: [{ t: 90, l: 0, s: -90, a: -90, f: -90 }, { t: 90, l: 0, s: -90, a: -88, f: -88 }],
    },
    // ---------------- HAMSTRINGS ----------------
    {
      id: 'rdl', group: 'hamstrings', second: ['glutes', 'back'], equip: ['dumbbell', 'barbell'], level: 1, analyzer: 'hinge',
      name: T('Soulevé de terre jambes tendues (roumain)', 'Romanian deadlift', 'الرفعة الرومانية'),
      steps: [
        S('Debout, charge devant les cuisses, genoux légèrement fléchis.', 'Stand, weight in front of thighs, knees soft.', 'قف والوزن أمام الفخذين والركبتان مثنيتان قليلًا.'),
        S('Pousser les fesses en arrière, dos plat, la charge glisse le long des jambes.', 'Push hips back, flat back, weight slides down the legs.', 'ادفع المؤخرة للخلف بظهر مستقيم والوزن ينزلق على الساقين.'),
        S('Descendre jusqu\'à l\'étirement des ischios (mi-tibia).', 'Lower until you feel the hamstring stretch (mid-shin).', 'انزل حتى تشعر بتمدد الفخذ الخلفي (منتصف الساق).'),
        S('Remonter en poussant les hanches vers l\'avant.', 'Stand up by driving the hips forward.', 'اصعد بدفع الحوض للأمام.'),
      ],
      mistakes: [S('Dos rond (danger lombaire).', 'Rounded back (lower-back risk).', 'تقوس الظهر (خطر على أسفل الظهر).'), S('Plier trop les genoux (devient un squat).', 'Bending knees too much (turns into a squat).', 'ثني الركبتين كثيرًا (يصبح سكوات).')],
      tip: S('Imaginez fermer une porte avec les fesses.', 'Imagine closing a door with your butt.', 'تخيل أنك تغلق بابًا بمؤخرتك.'),
      anchor: { p: 'ankle', x: 105, y: 0 }, tool: 'db',
      frames: [{ t: 90, l: -88, s: -92, a: -90, f: -90 }, { t: 20, l: -78, s: -98, a: -90, f: -90 }],
    },
    {
      id: 'good_morning', group: 'hamstrings', second: ['glutes', 'back'], equip: ['none'], level: 0, analyzer: 'hinge',
      name: T('Good morning (poids du corps)', 'Bodyweight good morning', 'تمرين صباح الخير'),
      steps: [
        S('Mains derrière la tête, pieds largeur de hanches.', 'Hands behind the head, feet hip-width.', 'اليدان خلف الرأس والقدمان بعرض الحوض.'),
        S('Basculer le buste vers l\'avant en poussant les hanches en arrière, dos plat.', 'Hinge forward pushing hips back, flat back.', 'أمِل الجذع للأمام بدفع الحوض للخلف وظهر مستقيم.'),
        S('Remonter en serrant les fessiers.', 'Come back up squeezing the glutes.', 'اصعد مع عصر المؤخرة.'),
      ],
      mistakes: [S('Arrondir le dos.', 'Rounding the back.', 'تقوس الظهر.')],
      tip: S('Apprend le mouvement de charnière de hanche, base du soulevé de terre.', 'Teaches the hip hinge, the base of the deadlift.', 'يعلّم حركة مفصل الحوض، أساس الرفعة الميتة.'),
      anchor: { p: 'ankle', x: 105, y: 0 },
      frames: [{ t: 90, l: -88, s: -92, a: 60, f: -150 }, { t: 15, l: -80, s: -96, a: -15, f: 135 }],
    },
    // ---------------- CALVES ----------------
    {
      id: 'calf_raise', group: 'calves', second: [], equip: ['none'], level: 0,
      name: T('Extensions mollets', 'Calf raise', 'رفع الكعبين (السمانة)'),
      steps: [
        S('Debout, avant des pieds sur une marche si possible.', 'Stand, balls of the feet on a step if possible.', 'قف ومقدمة القدمين على درجة إن أمكن.'),
        S('Monter sur la pointe des pieds le plus haut possible, tenir 1 s.', 'Rise onto your toes as high as possible, hold 1 s.', 'اصعد على أطراف أصابعك لأعلى نقطة واثبت ثانية.'),
        S('Redescendre lentement talons sous la marche.', 'Lower slowly, heels below the step.', 'انزل ببطء حتى ينزل الكعب تحت الدرجة.'),
      ],
      mistakes: [S('Rebondir vite sans amplitude.', 'Bouncing fast with no range.', 'الارتداد السريع بدون مدى كامل.')],
      tip: S('Les mollets aiment les répétitions lentes et nombreuses (15–25).', 'Calves love slow, high reps (15–25).', 'السمانة تحب التكرارات البطيئة والكثيرة (15–25).'),
      anchor: { p: 'toe', x: 108, y: 0 },
      frames: [{ t: 90, l: -90, s: -90, ft: 0, a: -90, f: -90 }, { t: 90, l: -90, s: -90, ft: -40, a: -90, f: -90 }],
    },
    {
      id: 'jumping_jack', group: 'calves', second: ['shoulders', 'quads'], equip: ['none'], level: 0, view: 'front', cardio: true,
      name: T('Jumping jacks (échauffement / cardio)', 'Jumping jacks (warm-up / cardio)', 'القفز مع فتح الذراعين (إحماء / كارديو)'),
      steps: [
        S('Sauter en écartant les jambes et en levant les bras au-dessus de la tête.', 'Jump feet apart while raising arms overhead.', 'اقفز مع فتح الساقين ورفع الذراعين فوق الرأس.'),
        S('Revenir pieds joints, bras le long du corps.', 'Jump back feet together, arms down.', 'عد بضم القدمين وإنزال الذراعين.'),
        S('Rythme régulier, atterrir sur l\'avant du pied.', 'Steady rhythm, land on the balls of the feet.', 'إيقاع منتظم مع الهبوط على مقدمة القدم.'),
      ],
      mistakes: [S('Atterrir talons tendus.', 'Landing stiff on the heels.', 'الهبوط على الكعبين بقوة.')],
      tip: S('2–3 minutes pour bien s\'échauffer avant chaque séance.', '2–3 minutes is a great warm-up before every session.', '2–3 دقائق إحماء ممتاز قبل كل حصة.'),
      frames: [{ a: -95, f: -96, l: -92, s: -92 }, { a: 55, f: 70, l: -72, s: -72 }],
    },
  ];

  // Evidence-based training principles shown in the "Science" page.
  window.SCIENCE = [
    {
      title: T('Volume : 10 à 20 séries par muscle et par semaine', 'Volume: 10–20 sets per muscle per week', 'الحجم: 10 إلى 20 مجموعة لكل عضلة أسبوعيًا'),
      text: T('Les méta-analyses (Schoenfeld et al., 2017) montrent que la prise de muscle augmente avec le nombre de séries hebdomadaires ; ≥10 séries/semaine par muscle donnent de meilleurs résultats. Débutant : commencez vers 8–10.',
        'Meta-analyses (Schoenfeld et al., 2017) show muscle growth rises with weekly sets; ≥10 sets per muscle per week work better. Beginners: start around 8–10.',
        'تُظهر الدراسات (شونفيلد 2017) أن نمو العضلات يزيد مع عدد المجموعات الأسبوعية؛ 10 مجموعات أو أكثر لكل عضلة أفضل. المبتدئ يبدأ بـ 8–10.'),
    },
    {
      title: T('Fréquence : chaque muscle 2 fois par semaine', 'Frequency: train each muscle twice a week', 'التكرار: درّب كل عضلة مرتين في الأسبوع'),
      text: T('À volume égal, entraîner un muscle 2×/semaine est au moins aussi efficace que 1× (Schoenfeld 2016). Laissez 48–72 h de récupération entre deux séances dures du même muscle.',
        'At equal volume, training a muscle 2×/week is at least as effective as 1× (Schoenfeld 2016). Allow 48–72 h between hard sessions for the same muscle.',
        'بنفس الحجم، تدريب العضلة مرتين أسبوعيًا فعّال مثل مرة أو أكثر. اترك 48–72 ساعة راحة بين حصتين قويتين لنفس العضلة.'),
    },
    {
      title: T('Répétitions : de 6 à 30 si on va près de l\'échec', 'Reps: 6 to 30 work if you train close to failure', 'التكرارات: من 6 إلى 30 تنجح إذا اقتربت من الفشل العضلي'),
      text: T('Charges lourdes et légères font grossir le muscle si les séries finissent à 1–3 répétitions de l\'échec. Force : 3–6 reps ; muscle : 6–12 ; endurance : 15+.',
        'Heavy and light loads both build muscle when sets end 1–3 reps from failure. Strength: 3–6 reps; muscle: 6–12; endurance: 15+.',
        'الأوزان الثقيلة والخفيفة تبني العضلة إذا انتهت المجموعة قبل الفشل بـ 1–3 تكرارات. القوة: 3–6، الضخامة: 6–12، التحمل: 15+.'),
    },
    {
      title: T('Surcharge progressive', 'Progressive overload', 'التحميل التدريجي'),
      text: T('Ajoutez un peu de charge, de répétitions ou de séries au fil des semaines. Quand vous réussissez le haut de la fourchette sur toutes les séries, augmentez la charge de 2,5–5 %.',
        'Add a little load, reps or sets over the weeks. When you hit the top of the rep range on every set, add 2.5–5% load.',
        'زِد الوزن أو التكرارات أو المجموعات تدريجيًا. عندما تصل لأعلى عدد تكرارات في كل المجموعات، زِد الوزن 2.5–5%.'),
    },
    {
      title: T('Protéines : 1,6 à 2,2 g/kg/jour', 'Protein: 1.6–2.2 g/kg/day', 'البروتين: 1.6 إلى 2.2 غ لكل كغ يوميًا'),
      text: T('Position de l\'ISSN (2017) et méta-analyse de Morton (2018) : ~1,6 g/kg/jour maximise la prise de muscle chez la plupart des gens, réparti en 3–5 repas de 20–40 g.',
        'ISSN position (2017) and Morton\'s meta-analysis (2018): ~1.6 g/kg/day maximises muscle gain for most people, spread over 3–5 meals of 20–40 g.',
        'حسب الجمعية الدولية للتغذية الرياضية (2017): ~1.6 غ/كغ يوميًا تكفي معظم الناس، موزعة على 3–5 وجبات من 20–40 غ.'),
    },
    {
      title: T('Activité recommandée par l\'OMS', 'WHO activity guidelines', 'توصيات منظمة الصحة العالمية'),
      text: T('Adultes : 150–300 min/semaine d\'activité modérée (ou 75–150 min intense) + renforcement musculaire ≥ 2 jours/semaine (OMS 2020).',
        'Adults: 150–300 min/week of moderate activity (or 75–150 min vigorous) + muscle strengthening ≥ 2 days/week (WHO 2020).',
        'البالغون: 150–300 دقيقة أسبوعيًا من نشاط معتدل (أو 75–150 دقيقة قوي) + تقوية العضلات يومين أو أكثر أسبوعيًا (2020).'),
    },
    {
      title: T('Sommeil : 7 à 9 h', 'Sleep: 7–9 h', 'النوم: 7 إلى 9 ساعات'),
      text: T('Le manque de sommeil réduit la récupération, la force et augmente l\'appétit. C\'est pendant le repos que le muscle se reconstruit.',
        'Lack of sleep lowers recovery and strength and raises appetite. Muscle rebuilds while you rest.',
        'قلة النوم تقلل الاستشفاء والقوة وتزيد الشهية. العضلة تُبنى أثناء الراحة.'),
    },
    {
      title: T('Technique avant la charge', 'Technique before load', 'الأداء الصحيح قبل الوزن'),
      text: T('Échauffez-vous 5–10 min, maîtrisez le mouvement avec une charge légère, et filmez-vous : l\'application analyse votre posture.',
        'Warm up 5–10 min, master the movement with a light load, and film yourself: the app analyses your form.',
        'سخّن 5–10 دقائق، أتقن الحركة بوزن خفيف، وصوّر نفسك: التطبيق يحلل وضعيتك.'),
    },
  ];
})();
