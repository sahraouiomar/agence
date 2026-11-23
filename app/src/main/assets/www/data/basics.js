// Basics: alphabet, difficult sounds for Arabic speakers, and core grammar.

// L: letter · ar: how the letter NAME sounds, written in Arabic · ipa: name in IPA
// snd: the sound(s) the letter makes inside words (explained in Arabic) · w: example words [en, ar]
// say: a short sentence to practise speaking · flag: "new" = sound that does not exist in Arabic
window.ALPHABET = [
  { L: "A", ar: "إيه", ipa: "/eɪ/", vowel: true, snd: "صوتان رئيسيان: /æ/ فتحة مفتوحة بين «آ» و«إ» كما في cat، و/eɪ/ «إيه» كما في cake.", w: [["apple", "تفاحة"], ["cat", "قطّ"], ["cake", "كعكة"]], say: "A is for apple." },
  { L: "B", ar: "بي", ipa: "/biː/", snd: "/b/ مثل الباء العربية تمامًا.", w: [["ball", "كرة"], ["bag", "حقيبة"], ["baby", "رضيع"]], say: "B is for ball." },
  { L: "C", ar: "سي", ipa: "/siː/", snd: "/k/ مثل الكاف قبل a وo وu (cat, cup)، و/s/ مثل السين قبل e وi وy (city, ice).", w: [["car", "سيارة"], ["cup", "كوب"], ["city", "مدينة"]], say: "C is for car." },
  { L: "D", ar: "دي", ipa: "/diː/", snd: "/d/ مثل الدال.", w: [["door", "باب"], ["dog", "كلب"], ["day", "يوم"]], say: "D is for door." },
  { L: "E", ar: "إي", ipa: "/iː/", vowel: true, snd: "/e/ كسرة مفتوحة كما في egg وbed، و/iː/ «إي» طويلة كما في he وme. انتبه: اسم الحرف E هو «إي» وليس «أُو».", w: [["egg", "بيضة"], ["bed", "سرير"], ["he", "هو"]], say: "E is for egg." },
  { L: "F", ar: "إف", ipa: "/ef/", snd: "/f/ مثل الفاء.", w: [["fish", "سمك"], ["five", "خمسة"], ["family", "عائلة"]], say: "F is for fish." },
  { L: "G", ar: "جي", ipa: "/dʒiː/", snd: "غالبًا /g/ مثل «ڨ» التونسية (go, bag)، وأحيانًا /dʒ/ مثل الجيم قبل e وi (orange, giraffe).", w: [["go", "يذهب"], ["girl", "بنت"], ["orange", "برتقالة"]], say: "G is for girl." },
  { L: "H", ar: "إيتش", ipa: "/eɪtʃ/", snd: "/h/ هاء خفيفة من الصدر، وليست حاءً (ح). أحيانًا لا تُنطق: hour, honest.", w: [["house", "منزل"], ["happy", "سعيد"], ["hour", "ساعة (h صامتة)"]], say: "H is for house." },
  { L: "I", ar: "آي", ipa: "/aɪ/", vowel: true, snd: "/ɪ/ كسرة قصيرة مرتخية كما في sit وbig، و/aɪ/ «آي» كما في ice وfive.", w: [["ice", "جليد"], ["sit", "يجلس"], ["big", "كبير"]], say: "I is for ice." },
  { L: "J", ar: "جاي", ipa: "/dʒeɪ/", snd: "/dʒ/ مثل الجيم «دج».", w: [["juice", "عصير"], ["job", "عمل"], ["July", "جويلية"]], say: "J is for juice." },
  { L: "K", ar: "كاي", ipa: "/keɪ/", snd: "/k/ مثل الكاف. لا تُنطق قبل n في بداية الكلمة: knife, know.", w: [["key", "مفتاح"], ["king", "ملك"], ["knife", "سكين (k صامتة)"]], say: "K is for key." },
  { L: "L", ar: "إل", ipa: "/el/", snd: "/l/ مثل اللام.", w: [["lemon", "ليمون"], ["love", "حبّ"], ["little", "صغير"]], say: "L is for lemon." },
  { L: "M", ar: "إم", ipa: "/em/", snd: "/m/ مثل الميم.", w: [["milk", "حليب"], ["mother", "أمّ"], ["moon", "قمر"]], say: "M is for milk." },
  { L: "N", ar: "إن", ipa: "/en/", snd: "/n/ مثل النون. ng في آخر الكلمة صوت أنفي واحد: sing, morning.", w: [["name", "اسم"], ["nine", "تسعة"], ["night", "ليل"]], say: "N is for name." },
  { L: "O", ar: "أو", ipa: "/əʊ/", vowel: true, snd: "/ɒ/ قصيرة مفتوحة كما في hot وdog، و/əʊ/ «أو» كما في go وhome.", w: [["orange", "برتقالة"], ["hot", "حارّ"], ["home", "بيت"]], say: "O is for orange." },
  { L: "P", ar: "پي", ipa: "/piː/", flag: "new", snd: "⚠️ غير موجود في العربية. مثل الباء لكن بدون اهتزاز الحنجرة ومع دفعة هواء من الشفتين. لا تقل «بِن» بل «پِن».", w: [["pen", "قلم"], ["park", "حديقة"], ["apple", "تفاحة"]], say: "P is for pen." },
  { L: "Q", ar: "كيو", ipa: "/kjuː/", snd: "يأتي دائمًا مع u، ويُنطق /kw/ «كو».", w: [["queen", "ملكة"], ["question", "سؤال"], ["quiet", "هادئ"]], say: "Q is for queen." },
  { L: "R", ar: "آر", ipa: "/ɑːr/", snd: "/r/ ليست راءً مكرّرة! اللسان لا يلمس سقف الفم، والشفتان مستديرتان قليلًا. في الإنجليزية البريطانية لا تُنطق r في آخر الكلمة (car).", w: [["red", "أحمر"], ["rain", "مطر"], ["river", "نهر"]], say: "R is for red." },
  { L: "S", ar: "إس", ipa: "/es/", snd: "/s/ مثل السين، وأحيانًا /z/ مثل الزاي (is, rose, music).", w: [["sun", "شمس"], ["six", "ستة"], ["music", "موسيقى (s = z)"]], say: "S is for sun." },
  { L: "T", ar: "تي", ipa: "/tiː/", snd: "/t/ مثل التاء، مع دفعة هواء خفيفة.", w: [["ten", "عشرة"], ["table", "طاولة"], ["tea", "شاي"]], say: "T is for tea." },
  { L: "U", ar: "يو", ipa: "/juː/", vowel: true, snd: "/ʌ/ صوت قصير مكتوم «أَ» كما في cup وsun، و/juː/ «يو» كما في use وmusic.", w: [["umbrella", "مظلّة"], ["cup", "كوب"], ["music", "موسيقى"]], say: "U is for umbrella." },
  { L: "V", ar: "ڤي", ipa: "/viː/", flag: "new", snd: "⚠️ غير موجود في العربية. مثل الفاء لكن مع اهتزاز الحنجرة: «ڤ». الأسنان العليا على الشفة السفلى.", w: [["van", "شاحنة صغيرة"], ["very", "جدًّا"], ["seven", "سبعة"]], say: "V is for van." },
  { L: "W", ar: "دابل يو", ipa: "/ˈdʌbəl juː/", snd: "/w/ مثل الواو: الشفتان مستديرتان ثم تنفتحان. لا تنطقها ڤ.", w: [["water", "ماء"], ["window", "نافذة"], ["week", "أسبوع"]], say: "W is for water." },
  { L: "X", ar: "إكس", ipa: "/eks/", snd: "/ks/ «كس» كما في box وsix.", w: [["box", "صندوق"], ["six", "ستة"], ["taxi", "تاكسي"]], say: "X is for box." },
  { L: "Y", ar: "واي", ipa: "/waɪ/", snd: "في أول الكلمة /j/ مثل الياء (yes)، وفي آخرها «آي» (my) أو «إي» (happy).", w: [["yes", "نعم"], ["yellow", "أصفر"], ["happy", "سعيد"]], say: "Y is for yellow." },
  { L: "Z", ar: "زي / زِد", ipa: "/ziː/ (US) · /zed/ (UK)", snd: "/z/ مثل الزاي. اسمه «زي» في أمريكا و«زِد» في بريطانيا.", w: [["zoo", "حديقة حيوانات"], ["zero", "صفر"], ["pizza", "بيتزا"]], say: "Z is for zoo." }
];

// Words for the spelling game.
window.SPELL_WORDS = [
  ["cat", "قطّ"], ["dog", "كلب"], ["sun", "شمس"], ["pen", "قلم"], ["bus", "حافلة"], ["milk", "حليب"], ["fish", "سمك"],
  ["book", "كتاب"], ["tree", "شجرة"], ["house", "منزل"], ["water", "ماء"], ["apple", "تفاحة"], ["green", "أخضر"],
  ["happy", "سعيد"], ["seven", "سبعة"], ["chair", "كرسي"], ["table", "طاولة"], ["phone", "هاتف"], ["money", "مال"],
  ["friend", "صديق"], ["school", "مدرسة"], ["yellow", "أصفر"], ["orange", "برتقالة"], ["coffee", "قهوة"],
  ["family", "عائلة"], ["window", "نافذة"], ["kitchen", "مطبخ"], ["teacher", "معلّم"], ["English", "الإنجليزية"], ["Tunisia", "تونس"]
];

// Difficult sounds. kind: "pairs" (minimal pairs), "groups" (sort words by sound), "list" (words to practise)
window.SOUNDS = [
  {
    id: "p_b", kind: "pairs", title: "P ≠ B", titleAr: "پ و ب", emoji: "💨",
    explain: "حرف P غير موجود في العربية، لذلك ينطقه الكثيرون B فتصبح pen (قلم) مثل Ben (اسم). انطق B لكن بدون اهتزاز الحنجرة، مع دفعة هواء قوية من الشفتين.",
    tip: "ضع ورقة أمام فمك: مع P تتحرّك الورقة، ومع B لا تتحرّك.",
    pairs: [["pin", "bin", "دبّوس", "سلّة مهملات"], ["pack", "back", "يحزم", "ظهر"], ["pear", "bear", "إجّاصة", "دبّ"], ["park", "bark", "حديقة", "نباح"], ["cap", "cab", "قبّعة", "سيارة أجرة"], ["pie", "buy", "فطيرة", "يشتري"], ["pull", "bull", "يسحب", "ثور"], ["peach", "beach", "خوخة", "شاطئ"]]
  },
  {
    id: "v_f", kind: "pairs", title: "V ≠ F", titleAr: "ڤ و ف", emoji: "🐝",
    explain: "حرف V غير موجود في العربية. ضع الأسنان العليا على الشفة السفلى مثل الفاء، لكن شغّل صوتك (اهتزاز الحنجرة): «ڤ».",
    tip: "ضع يدك على حنجرتك: مع V تشعر بالاهتزاز، ومع F لا.",
    pairs: [["van", "fan", "شاحنة صغيرة", "مروحة"], ["very", "ferry", "جدًّا", "عبّارة"], ["vine", "fine", "كرمة", "بخير"], ["view", "few", "منظر", "قليل"], ["save", "safe", "يحفظ / يدّخر", "آمن"], ["leave", "leaf", "يغادر", "ورقة شجر"], ["vast", "fast", "شاسع", "سريع"]]
  },
  {
    id: "i_ee", kind: "pairs", title: "i ≠ ee", titleAr: "الكسرة القصيرة والطويلة", emoji: "🐑",
    explain: "/ɪ/ قصيرة ومرتخية، بين الكسرة والفتحة (sit). /iː/ طويلة ومشدودة مثل ياء المدّ «إيييي» مع ابتسامة (seat). الخلط بينهما يغيّر المعنى تمامًا!",
    tip: "مع ee ابتسم وشدّ الشفتين ومدّ الصوت. مع i أرخِ فمك واجعل الصوت قصيرًا جدًّا.",
    pairs: [["ship", "sheep", "سفينة", "خروف"], ["live", "leave", "يعيش", "يغادر"], ["sit", "seat", "يجلس", "مقعد"], ["fill", "feel", "يملأ", "يشعر"], ["chip", "cheap", "رقاقة", "رخيص"], ["hit", "heat", "يضرب", "حرارة"], ["it", "eat", "هو (لغير العاقل)", "يأكل"]]
  },
  {
    id: "e_a", kind: "pairs", title: "e ≠ a", titleAr: "bed و bad", emoji: "🛏️",
    explain: "/e/ في bed: الفم نصف مفتوح، مثل كسرة مفتوحة. /æ/ في bad: افتح فمك أكثر وأنزل فكّك، صوت بين الفتحة والكسرة.",
    tip: "مع a (bad) افتح فمك كأنك عند طبيب الأسنان.",
    pairs: [["bed", "bad", "سرير", "سيّئ"], ["pen", "pan", "قلم", "مقلاة"], ["men", "man", "رجال", "رجل"], ["said", "sad", "قال", "حزين"], ["set", "sat", "يضع", "جلس"], ["then", "than", "ثمّ", "من (للمقارنة)"]]
  },
  {
    id: "u_a", kind: "pairs", title: "u ≠ a", titleAr: "cup و cap", emoji: "☕",
    explain: "/ʌ/ في cup: صوت قصير من وسط الفم، «أَ» مكتومة والفم مرتخٍ. /æ/ في cap: الفم مفتوح أكثر والصوت أوضح.",
    tip: "قل «أَه» كأنك تفاجأت قليلًا: هذا هو صوت u في cup.",
    pairs: [["cup", "cap", "كوب", "قبّعة"], ["cut", "cat", "يقطع", "قطّ"], ["hut", "hat", "كوخ", "قبّعة"], ["fun", "fan", "متعة", "مروحة"], ["bug", "bag", "حشرة", "حقيبة"], ["much", "match", "كثير", "مباراة"]]
  },
  {
    id: "magic_e", kind: "pairs", title: "Magic E", titleAr: "حرف e السحري", emoji: "✨",
    explain: "حرف e في آخر الكلمة لا يُنطق، لكنه يجعل الحرف المتحرّك قبله يُنطق باسمه: a ← «إيه»، i ← «آي»، o ← «أو»، u ← «يو». قارن: cap (قبّعة) و cape (رداء).",
    tip: "إذا رأيت حرفًا متحرّكًا + حرفًا ساكنًا + e في آخر الكلمة، انطق الحرف المتحرّك باسمه.",
    pairs: [["cap", "cape", "قبّعة", "رداء"], ["kit", "kite", "عُدّة", "طائرة ورقية"], ["hop", "hope", "يقفز", "أمل"], ["cut", "cute", "يقطع", "لطيف"], ["tap", "tape", "حنفية", "شريط"], ["not", "note", "ليس", "ملاحظة"], ["hat", "hate", "قبّعة", "يكره"], ["fin", "fine", "زعنفة", "بخير"]]
  },
  {
    id: "th_t", kind: "pairs", title: "TH (ث) ≠ T / S", titleAr: "صوت الثاء", emoji: "👅",
    explain: "TH في think وthree مثل الثاء العربية (ث): طرف اللسان بين الأسنان ويخرج الهواء. في الدارجة نقول أحيانًا «تلاثة» بدل «ثلاثة»، فانتبه ألّا تقول tree بدل three!",
    tip: "أخرج طرف لسانك قليلًا بين أسنانك وانفخ: ثثثث.",
    pairs: [["think", "sink", "يفكّر", "يغرق / مغسلة"], ["three", "tree", "ثلاثة", "شجرة"], ["thank", "tank", "يشكر", "خزّان"], ["mouth", "mouse", "فم", "فأر"], ["thin", "tin", "نحيف", "قصدير"], ["path", "pass", "ممرّ", "يمرّ"]]
  },
  {
    id: "th_d", kind: "pairs", title: "TH (ذ) ≠ D / Z", titleAr: "صوت الذال", emoji: "👄",
    explain: "TH في this وthey وmother مثل الذال العربية (ذ): طرف اللسان بين الأسنان مع اهتزاز الحنجرة. لا تقل «دِس» بل «ذِس».",
    tip: "الكلمات الصغيرة الشائعة كلّها بالذال: the, this, that, they, there, then, mother, father.",
    pairs: [["they", "day", "هم", "يوم"], ["then", "den", "ثمّ", "عرين"], ["though", "dough", "رغم أنّ", "عجين"], ["breathe", "breeze", "يتنفّس", "نسيم"], ["those", "doze", "أولئك", "يغفو"]]
  },
  {
    id: "ch_sh", kind: "pairs", title: "CH ≠ SH", titleAr: "تش و ش", emoji: "🚢",
    explain: "CH = «تش» (تبدأ بانغلاق ثم انفجار صغير)، SH = «ش» (هواء مستمرّ).",
    tip: "CH صوت قصير كالعطسة الصغيرة «تش!»، وSH صوت طويل كأنك تطلب الهدوء «ششش».",
    pairs: [["chip", "ship", "رقاقة", "سفينة"], ["chair", "share", "كرسي", "يشارك"], ["cheap", "sheep", "رخيص", "خروف"], ["watch", "wash", "ساعة / يشاهد", "يغسل"], ["match", "mash", "مباراة", "يهرس"], ["cheese", "she's", "جبن", "هي"]]
  },
  {
    id: "w_v", kind: "pairs", title: "W ≠ V", titleAr: "و و ڤ", emoji: "🌬️",
    explain: "W مثل الواو: الشفتان مستديرتان ولا تلمس الأسنان الشفة. V: الأسنان العليا على الشفة السفلى.",
    tip: "قل «وو» كأنك ستُطفئ شمعة: هذا هو W.",
    pairs: [["west", "vest", "غرب", "صدرية"], ["wet", "vet", "مبلّل", "طبيب بيطري"], ["worse", "verse", "أسوأ", "بيت شعر"], ["wheel", "veal", "عجلة", "لحم عجل"], ["wary", "vary", "حذر", "يتنوّع"]]
  },
  {
    id: "ed", kind: "groups", title: "-ED endings", titleAr: "نطق نهاية الماضي ed", emoji: "⏮️",
    explain: "نهاية الماضي ed لها 3 نطقات: /t/ بعد الأصوات المهموسة (p, k, s, sh, ch, f): worked «ووركت». /d/ بعد الأصوات المجهورة والمتحرّكة: played «پليد». /ɪd/ فقط بعد t وd: wanted «وونتِد». لا تقل «وورْكِد»!",
    tip: "أضف مقطعًا جديدًا (ɪd) فقط إذا انتهى الفعل بـ t أو d.",
    groups: [
      { label: "/t/", words: [["worked", "عمل"], ["stopped", "توقّف"], ["washed", "غسل"], ["liked", "أحبّ"], ["watched", "شاهد"], ["laughed", "ضحك"]] },
      { label: "/d/", words: [["played", "لعب"], ["lived", "عاش"], ["opened", "فتح"], ["called", "اتّصل"], ["cleaned", "نظّف"], ["loved", "أحبّ"]] },
      { label: "/ɪd/", words: [["wanted", "أراد"], ["needed", "احتاج"], ["visited", "زار"], ["decided", "قرّر"], ["started", "بدأ"], ["ended", "انتهى"]] }
    ]
  },
  {
    id: "silent", kind: "list", title: "Silent letters", titleAr: "حروف لا تُنطق", emoji: "🤫",
    explain: "في الإنجليزية حروف تُكتب ولا تُنطق. تعلّم أشهرها لتنطق الكلمات بشكل صحيح.",
    tip: "استمع دائمًا للكلمة قبل أن تنطقها: الكتابة الإنجليزية لا تطابق النطق دائمًا.",
    words: [["knife", "سكين", "k صامتة"], ["know", "يعرف", "k صامتة"], ["write", "يكتب", "w صامتة"], ["wrong", "خطأ", "w صامتة"], ["hour", "ساعة", "h صامتة"], ["honest", "صادق", "h صامتة"], ["listen", "يستمع", "t صامتة"], ["castle", "قلعة", "t صامتة"], ["Wednesday", "الأربعاء", "d صامتة: «وِنزداي»"], ["island", "جزيرة", "s صامتة"], ["climb", "يتسلّق", "b صامتة"], ["half", "نصف", "l صامتة"], ["walk", "يمشي", "l صامتة"], ["could", "استطاع", "l صامتة"], ["daughter", "ابنة", "gh صامتة"], ["night", "ليل", "gh صامتة"]]
  }
];

// Core grammar. ex: examples [en, ar] · mist: common mistakes [wrong, right, Arabic note] · quiz: [sentence with ___, options, answer index, Arabic explanation]
window.GRAMMAR = [
  {
    id: "be", emoji: "🙋", level: "A1", title: "I am, you are, he is", titleAr: "الضمائر وفعل الكينونة to be",
    explain: [
      "في العربية نقول «أنا طالب» بدون فعل. في الإنجليزية لا بدّ من فعل to be: I am a student.",
      "مع I نستعمل am · مع he / she / it نستعمل is · مع you / we / they نستعمل are.",
      "النفي: أضف not بعد الفعل: I am not tired. · السؤال: ضع الفعل في البداية: Are you tired?"
    ],
    formula: "I am · You are · He / She / It is · We / They are",
    ex: [["I am a student.", "أنا طالب."], ["You are very kind.", "أنت لطيف جدًّا."], ["She is my sister.", "هي أختي."], ["It is cold today.", "الجوّ بارد اليوم."], ["We are from Tunisia.", "نحن من تونس."], ["They are at home.", "هم في البيت."], ["I'm not tired.", "لست متعبًا."], ["Is he a doctor?", "هل هو طبيب؟"]],
    mist: [["I student.", "I am a student.", "لا تنسَ الفعل am وأداة النكرة a."], ["She are happy.", "She is happy.", "مع she نستعمل is."], ["Are you are ready?", "Are you ready?", "في السؤال لا نكرّر الفعل."]],
    quiz: [["She ___ a nurse.", ["is", "am", "are"], 0, "مع she نستعمل is."], ["I ___ from Sfax.", ["is", "am", "are"], 1, "مع I نستعمل am."], ["They ___ my friends.", ["is", "am", "are"], 2, "مع they نستعمل are."], ["___ you hungry?", ["Is", "Am", "Are"], 2, "السؤال مع you يبدأ بـ Are."], ["It ___ not expensive.", ["is", "are", "am"], 0, "مع it نستعمل is."]]
  },
  {
    id: "have", emoji: "🎒", level: "A1", title: "have / has · there is / there are", titleAr: "الملكية والوجود",
    explain: [
      "«عندي» = I have. مع he / she / it نقول has: She has a car.",
      "«يوجد» = there is (للمفرد) و there are (للجمع): There is a bank near here. There are two cafés.",
      "النفي والسؤال مع have يكونان بـ do / does: I don't have time. Does she have a brother?"
    ],
    formula: "I / you / we / they have · he / she / it has · there is + مفرد · there are + جمع",
    ex: [["I have two brothers.", "عندي أخوان."], ["She has a new phone.", "عندها هاتف جديد."], ["We have a big garden.", "عندنا حديقة كبيرة."], ["There is a pharmacy on this street.", "توجد صيدلية في هذا الشارع."], ["There are many tourists in summer.", "يوجد الكثير من السيّاح في الصيف."], ["I don't have a car.", "ليس عندي سيارة."], ["Does he have a job?", "هل عنده عمل؟"], ["Is there a café near here?", "هل يوجد مقهى قريب من هنا؟"]],
    mist: [["He have a car.", "He has a car.", "مع he نستعمل has."], ["There is many people.", "There are many people.", "people جمع، إذن there are."], ["I have 25 years.", "I am 25 years old.", "العمر بفعل be وليس have!"]],
    quiz: [["My father ___ a shop.", ["has", "have", "is"], 0, "مع he (my father) نستعمل has."], ["There ___ three bedrooms.", ["is", "are", "has"], 1, "three bedrooms جمع."], ["I ___ 30 years old.", ["have", "am", "has"], 1, "العمر: I am ... years old."], ["___ there a bus to Sousse?", ["Is", "Are", "Has"], 0, "a bus مفرد: Is there."], ["She doesn't ___ any children.", ["has", "have", "having"], 1, "بعد doesn't يأتي الفعل الأصلي have."]]
  },
  {
    id: "articles", emoji: "🍎", level: "A1", title: "a / an / the · plurals · this / that", titleAr: "أدوات التعريف والجمع وأسماء الإشارة",
    explain: [
      "a قبل الكلمة التي تبدأ بصوت ساكن: a book. an قبل الصوت المتحرّك: an apple, an hour (h صامتة).",
      "the = «الـ» للشيء المعروف أو المذكور سابقًا: I bought a book. The book is great.",
      "الجمع غالبًا بإضافة s: book → books. جموع شاذّة مهمّة: man → men, woman → women, child → children.",
      "this (هذا، قريب) / that (ذلك، بعيد) · these (هؤلاء، قريب، جمع) / those (أولئك، بعيد، جمع)."
    ],
    formula: "a + صوت ساكن · an + صوت متحرّك · the = الـ",
    ex: [["I want an apple and a banana.", "أريد تفاحة وموزة."], ["The bus is late again.", "الحافلة متأخّرة مرّة أخرى."], ["She is an engineer.", "هي مهندسة."], ["This is my car.", "هذه سيارتي."], ["That house is very old.", "ذلك المنزل قديم جدًّا."], ["These shoes are comfortable.", "هذا الحذاء مريح."], ["Three children are playing.", "ثلاثة أطفال يلعبون."], ["I need two boxes.", "أحتاج إلى صندوقين."]],
    mist: [["She is teacher.", "She is a teacher.", "المهن تحتاج a / an."], ["a apple", "an apple", "قبل الصوت المتحرّك نستعمل an."], ["The life is beautiful.", "Life is beautiful.", "لا نستعمل the مع الأشياء العامّة."]],
    quiz: [["I have ___ idea.", ["a", "an", "the"], 1, "idea تبدأ بصوت متحرّك."], ["He is ___ doctor.", ["a", "an", "—"], 0, "المهنة تحتاج a."], ["___ books on the table are mine.", ["This", "These", "That"], 1, "books جمع وقريبة: These."], ["Two ___ are waiting outside.", ["mans", "men", "man"], 1, "جمع man هو men."], ["Close ___ door, please.", ["a", "an", "the"], 2, "باب معروف: the door."]]
  },
  {
    id: "present", emoji: "🔁", level: "A1", title: "Present simple", titleAr: "المضارع البسيط (العادات)",
    explain: [
      "نستعمله للعادات والحقائق: I drink coffee every morning.",
      "مع he / she / it نضيف s للفعل: she works, he goes, it rains.",
      "النفي: don't / doesn't + الفعل بدون s: He doesn't work on Sunday.",
      "السؤال: Do / Does + الفاعل + الفعل: Do you speak English? Does she live here?"
    ],
    formula: "I work · he works · I don't work · he doesn't work · Do you work?",
    ex: [["I drink tea every morning.", "أشرب الشاي كل صباح."], ["My brother works in a hotel.", "أخي يعمل في فندق."], ["She goes to the gym on Mondays.", "تذهب إلى قاعة الرياضة أيام الإثنين."], ["We don't eat meat on Fridays.", "لا نأكل اللحم أيام الجمعة."], ["He doesn't like coffee.", "لا يحبّ القهوة."], ["Do you speak French?", "هل تتكلّم الفرنسية؟"], ["Does it rain a lot in Tabarka?", "هل تمطر كثيرًا في طبرقة؟"], ["The sun rises in the east.", "تشرق الشمس من الشرق."]],
    mist: [["She work in a bank.", "She works in a bank.", "مع she أضف s."], ["He doesn't works.", "He doesn't work.", "بعد doesn't لا نضيف s."], ["You speak English?", "Do you speak English?", "السؤال يحتاج Do."]],
    quiz: [["She ___ in Bizerte.", ["live", "lives", "living"], 1, "مع she نضيف s."], ["I ___ like fish.", ["doesn't", "don't", "not"], 1, "مع I نستعمل don't."], ["___ he play football?", ["Do", "Does", "Is"], 1, "مع he: Does."], ["They ___ to school by bus.", ["go", "goes", "going"], 0, "مع they لا نضيف s."], ["My mother ___ TV in the evening.", ["watch", "watches", "watching"], 1, "watch + es مع she."]]
  },
  {
    id: "continuous", emoji: "⏳", level: "A2", title: "Present continuous", titleAr: "المضارع المستمر (الآن)",
    explain: [
      "نستعمله لما يحدث الآن، في هذه اللحظة: I am reading now.",
      "التركيب: am / is / are + الفعل + ing.",
      "قارن: I work in a bank (عادة) · I am working from home today (الآن / مؤقّت)."
    ],
    formula: "I am + verb-ing · he is + verb-ing · they are + verb-ing",
    ex: [["I am studying English now.", "أدرس الإنجليزية الآن."], ["She is cooking dinner.", "هي تطبخ العشاء."], ["The children are playing in the garden.", "الأطفال يلعبون في الحديقة."], ["It is raining outside.", "إنها تمطر في الخارج."], ["We are waiting for the bus.", "نحن ننتظر الحافلة."], ["He isn't sleeping; he is watching a film.", "هو لا ينام؛ إنه يشاهد فيلمًا."], ["What are you doing?", "ماذا تفعل؟"], ["Are you listening to me?", "هل تستمع إليّ؟"]],
    mist: [["I reading now.", "I am reading now.", "لا تنسَ am / is / are."], ["She is cook.", "She is cooking.", "أضف ing للفعل."], ["I am knowing the answer.", "I know the answer.", "أفعال مثل know, like, want لا تأتي عادةً بـ ing."]],
    quiz: [["Look! It ___ snowing.", ["is", "are", "am"], 0, "it + is."], ["They are ___ football now.", ["play", "plays", "playing"], 2, "بعد are يأتي الفعل + ing."], ["I ___ working today.", ["am not", "not", "don't"], 0, "النفي: am not + ing."], ["What ___ she doing?", ["is", "does", "are"], 0, "السؤال: What is she doing?"], ["He usually ___ the bus, but today he is walking.", ["takes", "is taking", "take"], 0, "usually = عادة ← المضارع البسيط."]]
  },
  {
    id: "questions", emoji: "❓", level: "A1", title: "Asking questions", titleAr: "طرح الأسئلة",
    explain: [
      "أدوات الاستفهام: what (ماذا)، where (أين)، when (متى)، who (من)، why (لماذا)، how (كيف)، how much / how many (كم).",
      "الترتيب: أداة الاستفهام + do / does / is / are + الفاعل + الفعل: Where do you live?",
      "مع be: أداة الاستفهام + is / are + الفاعل: Where is the station?"
    ],
    formula: "Wh- + do/does + subject + verb ? · Wh- + is/are + subject ?",
    ex: [["What is your name?", "ما اسمك؟"], ["Where do you live?", "أين تسكن؟"], ["When does the shop open?", "متى يفتح المحلّ؟"], ["Who is that man?", "من ذلك الرجل؟"], ["Why are you sad?", "لماذا أنت حزين؟"], ["How do you go to work?", "كيف تذهب إلى العمل؟"], ["How much is this bag?", "بكم هذه الحقيبة؟"], ["How many languages do you speak?", "كم لغة تتكلّم؟"]],
    mist: [["Where you live?", "Where do you live?", "لا تنسَ do."], ["What time it is?", "What time is it?", "في السؤال يأتي is قبل it."], ["How many money?", "How much money?", "money غير معدود: how much."]],
    quiz: [["___ do you live? — In Nabeul.", ["Where", "When", "Who"], 0, "الجواب مكان: Where."], ["___ is your birthday? — In May.", ["What", "When", "Why"], 1, "الجواب زمن: When."], ["Where ___ she work?", ["do", "does", "is"], 1, "مع she: does."], ["How ___ brothers do you have?", ["much", "many", "old"], 1, "brothers معدود: how many."], ["___ are you late? — Because of the traffic.", ["Why", "How", "What"], 0, "الجواب سبب: Why."]]
  },
  {
    id: "past", emoji: "⏪", level: "A2", title: "Past simple", titleAr: "الماضي البسيط",
    explain: [
      "للأحداث المنتهية في الماضي: I visited Djerba last summer.",
      "الأفعال المنتظمة: أضف ed (work → worked). أفعال شاذّة مهمّة يجب حفظها: go → went, see → saw, eat → ate, have → had, make → made, buy → bought.",
      "الماضي من be: I / he / she / it was · you / we / they were.",
      "النفي والسؤال: didn't / Did + الفعل الأصلي: I didn't go. Did you see him?"
    ],
    formula: "I worked · I went · I didn't go · Did you go?",
    ex: [["I visited my grandmother yesterday.", "زرت جدّتي أمس."], ["We went to the beach last Sunday.", "ذهبنا إلى الشاطئ يوم الأحد الماضي."], ["She bought a new dress.", "اشترت فستانًا جديدًا."], ["The film was very good.", "كان الفيلم جيّدًا جدًّا."], ["They were tired after the trip.", "كانوا متعبين بعد الرحلة."], ["I didn't see your message.", "لم أرَ رسالتك."], ["Did you eat breakfast?", "هل تناولت فطور الصباح؟"], ["He made couscous for everyone.", "حضّر الكسكسي للجميع."]],
    mist: [["I goed to school.", "I went to school.", "go فعل شاذّ: went."], ["I didn't went.", "I didn't go.", "بعد didn't يأتي الفعل الأصلي."], ["Yesterday I am tired.", "Yesterday I was tired.", "yesterday ← الماضي: was."]],
    quiz: [["Last week I ___ to Tunis.", ["go", "went", "goed"], 1, "go ← went."], ["She ___ at home yesterday.", ["was", "were", "is"], 0, "she ← was."], ["Did you ___ the news?", ["saw", "see", "seen"], 1, "بعد Did: الفعل الأصلي."], ["We ___ a great time.", ["have", "had", "haved"], 1, "have ← had."], ["They ___ come to the party.", ["didn't", "don't", "wasn't"], 0, "النفي في الماضي: didn't."]]
  },
  {
    id: "future", emoji: "🔮", level: "A2", title: "will / going to", titleAr: "المستقبل",
    explain: [
      "going to للخطط والنيّات المقرّرة: I am going to visit London next month.",
      "will للقرارات السريعة والوعود والتوقّعات: I'll help you. It will rain tomorrow.",
      "النفي: won't (= will not) · I'm not going to."
    ],
    formula: "I will + verb · I am going to + verb",
    ex: [["I am going to study medicine.", "سأدرس الطبّ (خطّة)."], ["We are going to travel this summer.", "سنسافر هذا الصيف."], ["I'll call you tomorrow.", "سأتّصل بك غدًا."], ["It will be hot this weekend.", "سيكون الطقس حارًّا في نهاية هذا الأسبوع."], ["Don't worry, I won't forget.", "لا تقلق، لن أنسى."], ["Will you help me, please?", "هل ستساعدني من فضلك؟"], ["She isn't going to come.", "لن تأتي."], ["What are you going to do tonight?", "ماذا ستفعل الليلة؟"]],
    mist: [["I will to go.", "I will go.", "بعد will لا نضع to."], ["I going to travel.", "I am going to travel.", "لا تنسَ am / is / are."], ["She wills come.", "She will come.", "will لا تتغيّر مع she."]],
    quiz: [["Tomorrow I ___ visit my aunt.", ["will", "wills", "am"], 0, "will + الفعل."], ["Look at those clouds! It's ___ rain.", ["will", "going to", "go"], 1, "دليل واضح ← going to."], ["I ___ forget your birthday.", ["won't", "don't", "not will"], 0, "won't = will not."], ["They are going ___ buy a house.", ["—", "to", "for"], 1, "going to + فعل."], ["___ you come with us?", ["Will", "Are", "Do"], 0, "سؤال المستقبل: Will you ...?"]]
  },
  {
    id: "modals", emoji: "💪", level: "A2", title: "can / must / should", titleAr: "القدرة والوجوب والنصيحة",
    explain: [
      "can = يستطيع (I can swim) · can't = لا يستطيع.",
      "must = يجب (قاعدة أو ضرورة قوية): You must wear a seatbelt. mustn't = ممنوع.",
      "should = ينبغي (نصيحة): You should drink more water.",
      "بعد can / must / should يأتي الفعل الأصلي بدون to وبدون s."
    ],
    formula: "can / must / should + verb",
    ex: [["I can speak three languages.", "أستطيع أن أتكلّم ثلاث لغات."], ["Can you help me, please?", "هل يمكنك مساعدتي من فضلك؟"], ["She can't come today.", "لا تستطيع أن تأتي اليوم."], ["You must stop at a red light.", "يجب أن تتوقّف عند الضوء الأحمر."], ["You mustn't smoke here.", "ممنوع التدخين هنا."], ["You should see a doctor.", "ينبغي أن ترى طبيبًا."], ["We should practise every day.", "ينبغي أن نتدرّب كل يوم."], ["Could you repeat that, please?", "هل يمكنك أن تعيد ذلك من فضلك؟ (بأدب)"]],
    mist: [["I can to swim.", "I can swim.", "لا نضع to بعد can."], ["He cans drive.", "He can drive.", "can لا تأخذ s."], ["You should to rest.", "You should rest.", "لا نضع to بعد should."]],
    quiz: [["I ___ play the guitar.", ["can", "cans", "can to"], 0, "can + الفعل."], ["You ___ drive without a licence. It's illegal.", ["should", "mustn't", "can"], 1, "ممنوع: mustn't."], ["You look tired. You ___ go to bed.", ["should", "can't", "mustn't"], 0, "نصيحة: should."], ["___ you open the window, please?", ["Must", "Can", "Should"], 1, "طلب: Can you ...?"], ["She can ___ very well.", ["sings", "to sing", "sing"], 2, "بعد can: الفعل الأصلي."]]
  },
  {
    id: "prepositions", emoji: "📍", level: "A2", title: "in / on / at", titleAr: "حروف الجرّ للمكان والزمان",
    explain: [
      "الزمان: at + ساعة (at 8 o'clock) · on + يوم أو تاريخ (on Monday, on 5 May) · in + شهر، سنة، فصل، جزء من اليوم (in July, in 2025, in summer, in the morning).",
      "المكان: in = داخل (in the room, in Tunis) · on = على سطح (on the table) · at = عند نقطة معيّنة (at the door, at school, at home).",
      "أخرى مفيدة: under (تحت)، next to (بجانب)، between (بين)، in front of (أمام)، behind (خلف)."
    ],
    formula: "at 8:00 · on Monday · in July · in the box · on the table · at home",
    ex: [["The meeting is at ten o'clock.", "الاجتماع على الساعة العاشرة."], ["I was born in 1995.", "وُلدت سنة 1995."], ["We have English on Tuesday.", "عندنا الإنجليزية يوم الثلاثاء."], ["She lives in Monastir.", "تسكن في المنستير."], ["Your keys are on the table.", "مفاتيحك على الطاولة."], ["I'll meet you at the station.", "سأقابلك في المحطة."], ["The cat is under the bed.", "القطّ تحت السرير."], ["The pharmacy is next to the bank.", "الصيدلية بجانب البنك."]],
    mist: [["in Monday", "on Monday", "الأيام مع on."], ["at the morning", "in the morning", "أجزاء اليوم مع in (لكن at night)."], ["I am in home.", "I am at home.", "نقول at home."]],
    quiz: [["My birthday is ___ June.", ["in", "on", "at"], 0, "الشهر مع in."], ["The train leaves ___ 7:30.", ["in", "on", "at"], 2, "الساعة مع at."], ["The book is ___ the table.", ["in", "on", "at"], 1, "على سطح: on."], ["I'll see you ___ Friday.", ["in", "on", "at"], 1, "اليوم مع on."], ["He works ___ a hospital.", ["in", "on", "at"], 0, "داخل مبنى: in (أو at)."]]
  },
  {
    id: "possessive", emoji: "🔑", level: "A1", title: "my, your, his, her · 's", titleAr: "الملكية",
    explain: [
      "صفات الملكية تأتي قبل الاسم: my (ـي)، your (ـك)، his (ـه للمذكر)، her (ـها)، its (لغير العاقل)، our (ـنا)، their (ـهم).",
      "انتبه: his لصاحب مذكّر و her لصاحبة مؤنّثة، مهما كان الشيء المملوك: Ali and his mother · Sara and her father.",
      "ملكية الأشخاص بـ 's: Sami's car = سيارة سامي. my parents' house = بيت والديّ."
    ],
    formula: "my · your · his · her · its · our · their · Sami's",
    ex: [["This is my brother.", "هذا أخي."], ["What is your phone number?", "ما رقم هاتفك؟"], ["Karim loves his job.", "كريم يحبّ عمله."], ["Salma lost her keys.", "أضاعت سلمى مفاتيحها."], ["Our teacher is very patient.", "معلّمنا صبور جدًّا."], ["Their house is near the sea.", "بيتهم قريب من البحر."], ["This is Amira's bag.", "هذه حقيبة أميرة."], ["My parents' car is white.", "سيارة والديّ بيضاء."]],
    mist: [["Ali and her mother", "Ali and his mother", "الصاحب مذكّر (Ali) ← his."], ["the car of Sami", "Sami's car", "الأفضل استعمال 's مع الأشخاص."], ["This is the my book.", "This is my book.", "لا نجمع the مع my."]],
    quiz: [["Sara is with ___ father.", ["his", "her", "their"], 1, "الصاحبة مؤنّثة: her."], ["Omar is washing ___ car.", ["his", "her", "its"], 0, "الصاحب مذكّر: his."], ["We love ___ city.", ["their", "our", "my"], 1, "we ← our."], ["This is ___ phone. (Mona)", ["Mona", "Mona's", "Monas"], 1, "الملكية: Mona's."], ["Is this ___ pen? — Yes, it's mine.", ["you", "your", "yours"], 1, "قبل الاسم: your."]]
  },
  {
    id: "comparatives", emoji: "📏", level: "A2", title: "bigger, more beautiful, the best", titleAr: "المقارنة والتفضيل",
    explain: [
      "الصفات القصيرة: أضف er للمقارنة و est للتفضيل: big → bigger → the biggest · cheap → cheaper → the cheapest.",
      "الصفات الطويلة: more / the most: beautiful → more beautiful → the most beautiful.",
      "شاذّة: good → better → the best · bad → worse → the worst.",
      "للمقارنة نستعمل than (من): Tunis is bigger than Sousse."
    ],
    formula: "A is bigger than B · A is more expensive than B · the biggest · the best",
    ex: [["Tunis is bigger than Sousse.", "تونس أكبر من سوسة."], ["Summer is hotter than spring.", "الصيف أحرّ من الربيع."], ["This hotel is more expensive than that one.", "هذا الفندق أغلى من ذلك."], ["English is easier than I thought.", "الإنجليزية أسهل ممّا ظننت."], ["My mother's couscous is the best.", "كسكسي أمّي هو الأفضل."], ["It was the worst day of my life.", "كان أسوأ يوم في حياتي."], ["Djerba is the largest island in North Africa.", "جربة أكبر جزيرة في شمال إفريقيا."], ["Walking is slower but healthier.", "المشي أبطأ لكنه أفضل للصحّة."]],
    mist: [["more big", "bigger", "الصفات القصيرة بـ er."], ["better than me than", "better than me", "than مرّة واحدة."], ["the most good", "the best", "good شاذّة: the best."]],
    quiz: [["A car is ___ than a bike.", ["fast", "faster", "fastest"], 1, "مقارنة بين اثنين: faster than."], ["This is the ___ film I have ever seen!", ["good", "better", "best"], 2, "التفضيل: the best."], ["Gold is ___ than silver.", ["more expensive", "expensiver", "most expensive"], 0, "صفة طويلة: more expensive."], ["Today is ___ than yesterday.", ["cold", "colder", "the coldest"], 1, "colder than."], ["My English is ___ now than last year.", ["good", "better", "best"], 1, "good ← better."]]
  }
];
