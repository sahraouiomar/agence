// Health coach ("doctor" mode): measurement interpretation with published reference ranges,
// pre-exercise screening (PAR-Q style), red-flag symptoms and an adaptive metabolism estimate.
// This gives general information only and never replaces a medical consultation.
(function () {
  const T = (fr, en, ar) => ({ fr, en, ar });
  const LV = { ok: 'ok', info: 'info', warn: 'warn', bad: 'bad', urgent: 'urgent' };

  const TYPES = {
    bp: { icon: '🩸', name: T('Tension artérielle', 'Blood pressure', 'ضغط الدم'), unit: 'mmHg' },
    hr: { icon: '❤️', name: T('Pouls au repos', 'Resting heart rate', 'نبض القلب في الراحة'), unit: 'bpm' },
    glucose: { icon: '🍬', name: T('Glycémie', 'Blood sugar', 'سكر الدم'), unit: 'g/L' },
    spo2: { icon: '🫁', name: T('Saturation en oxygène (SpO2)', 'Oxygen saturation (SpO2)', 'تشبع الأكسجين'), unit: '%' },
    weight: { icon: '⚖️', name: T('Poids', 'Weight', 'الوزن'), unit: 'kg' },
    waist: { icon: '📏', name: T('Tour de taille', 'Waist', 'محيط الخصر'), unit: 'cm' },
    sleep: { icon: '😴', name: T('Sommeil', 'Sleep', 'النوم'), unit: 'h' },
    temp: { icon: '🌡️', name: T('Température', 'Temperature', 'الحرارة'), unit: '°C' },
  };

  // --- interpretation -------------------------------------------------------------------
  // Blood pressure: ACC/AHA 2017 categories; crisis >= 180/120.
  function bp(sys, dia) {
    if (sys >= 180 || dia >= 120) return [LV.urgent, T('Crise hypertensive : mesurez à nouveau dans 5 min ; si c\'est toujours aussi haut ou avec douleur thoracique, maux de tête violents ou troubles de la vision → urgences (SAMU 190 / 112).', 'Hypertensive crisis: re-measure in 5 min; if still this high or with chest pain, severe headache or vision problems → emergency (112).', 'أزمة ارتفاع ضغط: أعد القياس بعد 5 دقائق؛ إذا بقي مرتفعًا أو مع ألم في الصدر أو صداع شديد أو اضطراب الرؤية → الطوارئ (190 / 112).')];
    if (sys >= 140 || dia >= 90) return [LV.bad, T('Hypertension stade 2 : consultez un médecin. Évitez les efforts très intenses et les blocages de respiration en attendant.', 'Stage 2 hypertension: see a doctor. Avoid very hard efforts and breath-holding meanwhile.', 'ارتفاع ضغط من الدرجة 2: استشر طبيبًا. تجنب المجهود العنيف وحبس النفس.')];
    if (sys >= 130 || dia >= 80) return [LV.warn, T('Hypertension stade 1 : moins de sel, activité régulière, surveillez ; avis médical conseillé.', 'Stage 1 hypertension: less salt, regular activity, keep monitoring; medical advice recommended.', 'ارتفاع ضغط من الدرجة 1: ملح أقل ونشاط منتظم ومتابعة؛ يُنصح باستشارة طبية.')];
    if (sys >= 120) return [LV.info, T('Tension légèrement élevée : sel < 5 g/j, sport, sommeil.', 'Elevated blood pressure: salt < 5 g/day, exercise, sleep.', 'ضغط مرتفع قليلًا: ملح أقل من 5 غ يوميًا، رياضة ونوم.')];
    if (sys < 90 || dia < 60) return [LV.info, T('Tension basse : buvez suffisamment ; consultez en cas de malaises.', 'Low blood pressure: drink enough; see a doctor if you feel faint.', 'ضغط منخفض: اشرب ما يكفي واستشر طبيبًا عند الدوخة.')];
    return [LV.ok, T('Tension normale.', 'Normal blood pressure.', 'ضغط طبيعي.')];
  }
  function hr(v, athlete) {
    if (v > 120) return [LV.bad, T('Pouls au repos très élevé : consultez, surtout avec palpitations ou essoufflement.', 'Very high resting pulse: see a doctor, especially with palpitations or breathlessness.', 'نبض مرتفع جدًا في الراحة: استشر طبيبًا خاصة مع خفقان أو ضيق تنفس.')];
    if (v > 100) return [LV.warn, T('Pouls au repos élevé (> 100) : fièvre, stress, café, déshydratation ? À recontrôler ; avis médical si persistant.', 'High resting pulse (> 100): fever, stress, coffee, dehydration? Re-check; see a doctor if it persists.', 'نبض مرتفع (> 100): حمّى، توتر، قهوة، جفاف؟ أعد القياس واستشر طبيبًا إذا استمر.')];
    if (v < 40 || (v < 50 && !athlete)) return [LV.warn, T('Pouls bas : normal chez les sportifs, sinon avis médical (surtout si fatigue ou vertiges).', 'Low pulse: normal for athletes, otherwise get medical advice (especially with fatigue or dizziness).', 'نبض منخفض: طبيعي عند الرياضيين وإلا استشر طبيبًا (خاصة مع تعب أو دوخة).')];
    if (v <= 70) return [LV.ok, T('Très bon pouls de repos (signe de bonne forme).', 'Very good resting pulse (sign of fitness).', 'نبض راحة ممتاز (علامة لياقة).')];
    return [LV.ok, T('Pouls normal (60–100).', 'Normal pulse (60–100).', 'نبض طبيعي (60–100).')];
  }
  // glucose in g/L (Tunisia/France); fasting thresholds WHO/ADA: 1.00 / 1.26 ; 2 h after meal 1.40 / 2.00
  function glucose(gl, ctx) {
    if (gl < 0.7) return [LV.urgent, T('Hypoglycémie : prenez 15 g de sucre rapide (jus, 3 morceaux de sucre), recontrôlez dans 15 min. Pas de sport maintenant.', 'Hypoglycaemia: take 15 g of fast sugar (juice, 3 sugar cubes), re-check in 15 min. No exercise now.', 'هبوط السكر: تناول 15 غ سكر سريع (عصير، 3 قطع سكر) وأعد القياس بعد 15 دقيقة. لا رياضة الآن.')];
    if (ctx === 'after') {
      if (gl >= 2) return [LV.bad, T('Glycémie après repas ≥ 2 g/L : compatible avec un diabète → consultez.', 'After-meal glucose ≥ 2 g/L: consistent with diabetes → see a doctor.', 'سكر بعد الأكل ≥ 2 غ/ل: قد يدل على السكري → استشر طبيبًا.')];
      if (gl >= 1.4) return [LV.warn, T('Glycémie après repas élevée (1,40–1,99 g/L) : intolérance au glucose possible ; marchez 10–15 min après les repas.', 'High after-meal glucose (1.40–1.99 g/L): possible glucose intolerance; walk 10–15 min after meals.', 'سكر مرتفع بعد الأكل: احتمال عدم تحمل الجلوكوز؛ امشِ 10–15 دقيقة بعد الوجبات.')];
      return [LV.ok, T('Glycémie après repas normale (< 1,40 g/L).', 'Normal after-meal glucose (< 1.40 g/L).', 'سكر بعد الأكل طبيعي.')];
    }
    if (gl >= 1.26) return [LV.bad, T('Glycémie à jeun ≥ 1,26 g/L : à confirmer par une prise de sang (diabète possible) → médecin.', 'Fasting glucose ≥ 1.26 g/L: confirm with a blood test (possible diabetes) → doctor.', 'سكر صائم ≥ 1.26 غ/ل: يجب التأكيد بتحليل دم (احتمال السكري) → الطبيب.')];
    if (gl >= 1.0) return [LV.warn, T('Glycémie à jeun 1,00–1,25 g/L : prédiabète possible. Le sport et la perte de 5–7 % du poids réduisent fortement le risque.', 'Fasting glucose 1.00–1.25 g/L: possible prediabetes. Exercise and losing 5–7% of weight greatly cut the risk.', 'سكر صائم 1.00–1.25: احتمال ما قبل السكري. الرياضة وإنقاص 5–7% من الوزن تقلل الخطر كثيرًا.')];
    return [LV.ok, T('Glycémie à jeun normale.', 'Normal fasting glucose.', 'سكر صائم طبيعي.')];
  }
  function spo2(v) {
    if (v < 90) return [LV.urgent, T('Saturation < 90 % : avis médical urgent, surtout si essoufflement.', 'Saturation < 90%: urgent medical advice, especially if breathless.', 'تشبع أقل من 90%: استشارة طبية عاجلة خاصة مع ضيق التنفس.')];
    if (v < 95) return [LV.warn, T('Saturation un peu basse (90–94 %) : recontrôlez au repos ; consultez si elle reste basse.', 'Slightly low saturation (90–94%): re-check at rest; see a doctor if it stays low.', 'تشبع منخفض قليلًا: أعد القياس في الراحة واستشر طبيبًا إذا بقي منخفضًا.')];
    return [LV.ok, T('Saturation normale.', 'Normal saturation.', 'تشبع طبيعي.')];
  }
  function sleep(h) {
    if (h < 6) return [LV.warn, T('Moins de 6 h : la récupération et la perte de gras sont freinées. Visez 7–9 h.', 'Under 6 h: recovery and fat loss suffer. Aim for 7–9 h.', 'أقل من 6 ساعات: يتأثر الاستشفاء وحرق الدهون. استهدف 7–9 ساعات.')];
    if (h < 7) return [LV.info, T('Un peu court : essayez de gagner 30 min.', 'A bit short: try to gain 30 min.', 'قصير قليلًا: حاول زيادة 30 دقيقة.')];
    if (h > 10) return [LV.info, T('Sommeil très long : fatigue inhabituelle ? Parlez-en si cela dure.', 'Very long sleep: unusual tiredness? Mention it if it lasts.', 'نوم طويل جدًا: تعب غير معتاد؟ تحدث مع طبيب إذا استمر.')];
    return [LV.ok, T('Bonne durée de sommeil.', 'Good sleep duration.', 'مدة نوم جيدة.')];
  }
  function temp(c) {
    if (c >= 39) return [LV.bad, T('Forte fièvre : pas de sport, hydratation, consultez si elle persiste > 48 h.', 'High fever: no exercise, hydrate, see a doctor if it lasts > 48 h.', 'حمّى قوية: لا رياضة، اشرب كثيرًا واستشر طبيبًا إذا استمرت أكثر من 48 ساعة.')];
    if (c >= 38) return [LV.warn, T('Fièvre : repos complet, pas d\'entraînement (risque pour le cœur).', 'Fever: full rest, no training (risk for the heart).', 'حمّى: راحة تامة ولا تمرين (خطر على القلب).')];
    if (c < 35.5) return [LV.warn, T('Température basse : recontrôlez ; consultez si malaise.', 'Low temperature: re-check; see a doctor if unwell.', 'حرارة منخفضة: أعد القياس واستشر طبيبًا عند التوعك.')];
    return [LV.ok, T('Température normale.', 'Normal temperature.', 'حرارة طبيعية.')];
  }
  function waist(cm, male) {
    const hi = male ? 102 : 88, mid = male ? 94 : 80;
    if (cm >= hi) return [LV.warn, T('Tour de taille élevé : risque cardio-métabolique augmenté (OMS).', 'High waist: increased cardio-metabolic risk (WHO).', 'محيط خصر مرتفع: خطر قلبي واستقلابي أعلى.')];
    if (cm >= mid) return [LV.info, T('Tour de taille à surveiller.', 'Waist worth monitoring.', 'محيط خصر يستحق المتابعة.')];
    return [LV.ok, T('Tour de taille sain.', 'Healthy waist.', 'محيط خصر صحي.')];
  }

  function interpret(e, profile) {
    const v = e.v;
    switch (e.type) {
      case 'bp': return bp(v.sys, v.dia);
      case 'hr': return hr(v.val, (profile?.level || 0) >= 2);
      case 'glucose': return glucose(v.val, v.ctx);
      case 'spo2': return spo2(v.val);
      case 'sleep': return sleep(v.val);
      case 'temp': return temp(v.val);
      case 'waist': return waist(v.val, profile?.sex !== 'f');
      default: return [LV.info, null];
    }
  }

  // Training readiness for today from the latest measurements (same day).
  function readiness(entries) {
    const today = new Date().toDateString();
    const day = entries.filter((e) => new Date(e.t).toDateString() === today);
    const worst = day.map((e) => interpret(e)[0]);
    if (worst.includes('urgent') || worst.includes('bad')) return 'rest';
    if (worst.includes('warn')) return 'light';
    return day.length ? 'go' : null;
  }

  // --- pre-exercise screening (adapted from the PAR-Q+ 2023 general questions) -----------------
  const PARQ = [
    T('Un médecin vous a-t-il déjà dit que vous aviez un problème cardiaque ou une hypertension ?', 'Has a doctor ever said you have a heart condition or high blood pressure?', 'هل قال لك طبيب إن لديك مشكلة في القلب أو ضغطًا مرتفعًا؟'),
    T('Ressentez-vous une douleur dans la poitrine au repos, au quotidien ou pendant l\'effort ?', 'Do you feel chest pain at rest, in daily life or during exercise?', 'هل تشعر بألم في الصدر في الراحة أو أثناء المجهود؟'),
    T('Avez-vous perdu l\'équilibre à cause d\'un vertige ou perdu connaissance ces 12 derniers mois ?', 'Have you lost balance from dizziness or lost consciousness in the last 12 months?', 'هل فقدت توازنك بسبب دوخة أو فقدت الوعي خلال 12 شهرًا الماضية؟'),
    T('Avez-vous une autre maladie chronique (diabète, asthme, maladie rénale…) ?', 'Do you have another chronic condition (diabetes, asthma, kidney disease…)?', 'هل لديك مرض مزمن آخر (سكري، ربو، كلى…)؟'),
    T('Prenez-vous des médicaments pour une maladie chronique ?', 'Do you take medication for a chronic condition?', 'هل تتناول أدوية لمرض مزمن؟'),
    T('Avez-vous un problème d\'os, d\'articulation ou de muscle qui pourrait s\'aggraver avec le sport ?', 'Do you have a bone, joint or muscle problem that exercise could worsen?', 'هل لديك مشكلة في العظام أو المفاصل أو العضلات قد تسوء مع الرياضة؟'),
    T('Un médecin vous a-t-il dit de ne faire du sport que sous surveillance médicale ?', 'Has a doctor said you should only exercise under medical supervision?', 'هل قال لك طبيب أن تمارس الرياضة تحت إشراف طبي فقط؟'),
  ];

  const RED_FLAGS = [
    T('Douleur ou oppression dans la poitrine', 'Chest pain or tightness', 'ألم أو ضغط في الصدر'),
    T('Essoufflement anormal, même au repos', 'Unusual breathlessness, even at rest', 'ضيق تنفس غير عادي حتى في الراحة'),
    T('Malaise, vertige fort ou perte de connaissance', 'Fainting, severe dizziness or blackout', 'إغماء أو دوخة شديدة'),
    T('Palpitations / cœur très irrégulier', 'Palpitations / very irregular heartbeat', 'خفقان أو نبض غير منتظم'),
    T('Faiblesse ou engourdissement d\'un côté du corps, trouble de la parole', 'Weakness or numbness on one side, trouble speaking', 'ضعف أو تنميل في جهة واحدة من الجسم أو صعوبة في الكلام'),
    T('Douleur articulaire aiguë, gonflement, craquement avec douleur', 'Sharp joint pain, swelling, a painful pop', 'ألم حاد في المفصل أو تورم أو طقطقة مؤلمة'),
  ];

  // --- adaptive metabolism (energy balance: 1 kg of body mass change ≈ 7700 kcal) --------------
  function adaptiveTdee(weights, intakeByDay) {
    if (!weights || weights.length < 3) return null;
    const now = Date.now(), span = 28 * 864e5;
    const w = weights.filter((e) => now - e.t <= span).sort((a, b) => a.t - b.t);
    if (w.length < 3 || w[w.length - 1].t - w[0].t < 14 * 864e5) return null;
    // least-squares slope (kg/day)
    const x0 = w[0].t;
    const xs = w.map((e) => (e.t - x0) / 864e5), ys = w.map((e) => e.v.val);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
    let num = 0, den = 0;
    for (let i = 0; i < xs.length; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
    const slope = den ? num / den : 0;
    const days = Object.entries(intakeByDay).filter(([k, v]) => v > 400 && now - new Date(k).getTime() <= span);
    if (days.length < 10) return null;
    const intake = days.reduce((a, [, v]) => a + v, 0) / days.length;
    return { tdee: Math.round(intake - slope * 7700), intake: Math.round(intake), slopeWeek: Math.round(slope * 7 * 100) / 100, days: days.length };
  }

  window.Health = { TYPES, interpret, readiness, PARQ, RED_FLAGS, adaptiveTdee, LV };
})();
