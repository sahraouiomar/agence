// Vocabulary by theme: [english, arabic, example sentence (optional)]
window.THEMES = [
  { id: "basics", emoji: "👋", name: "Basics", nameAr: "أساسيات", words: [
    ["hello", "مرحبًا", "Hello, how are you?"], ["goodbye", "مع السلامة", "Goodbye, see you tomorrow."],
    ["please", "من فضلك", "A coffee, please."], ["thank you", "شكرًا", "Thank you for your help."],
    ["sorry", "آسف", "Sorry, I am late."], ["excuse me", "عفوًا / لو سمحت", "Excuse me, where is the bank?"],
    ["yes", "نعم", "Yes, I understand."], ["no", "لا", "No, thank you."],
    ["maybe", "ربّما", "Maybe tomorrow."], ["welcome", "مرحبًا بك / أهلًا", "Welcome to Tunisia!"],
    ["good morning", "صباح الخير", "Good morning, teacher."], ["good evening", "مساء الخير", "Good evening, everyone."],
    ["good night", "تصبح على خير", "Good night, sleep well."], ["friend", "صديق", "He is my best friend."],
    ["name", "اسم", "What is your name?"], ["help", "مساعدة / يساعد", "Can you help me?"]
  ]},
  { id: "family", emoji: "👨‍👩‍👧", name: "Family", nameAr: "العائلة", words: [
    ["father", "أب", "My father is a teacher."], ["mother", "أم", "My mother cooks very well."],
    ["brother", "أخ", "I have two brothers."], ["sister", "أخت", "My sister is older than me."],
    ["son", "ابن", "Their son is five years old."], ["daughter", "ابنة", "She has one daughter."],
    ["grandfather", "جد", "My grandfather lives in Sfax."], ["grandmother", "جدّة", "My grandmother tells stories."],
    ["uncle", "عم / خال", "My uncle has a shop."], ["aunt", "عمّة / خالة", "My aunt lives in France."],
    ["cousin", "ابن العم / ابن الخال", "My cousin is my age."], ["husband", "زوج", "Her husband is a doctor."],
    ["wife", "زوجة", "His wife is an engineer."], ["child", "طفل", "The child is sleeping."],
    ["children", "أطفال", "They have three children."], ["parents", "الوالدان", "I live with my parents."]
  ]},
  { id: "numbers", emoji: "🔢", name: "Numbers", nameAr: "الأعداد", words: [
    ["one", "واحد"], ["two", "اثنان"], ["three", "ثلاثة"], ["four", "أربعة"], ["five", "خمسة"],
    ["six", "ستة"], ["seven", "سبعة"], ["eight", "ثمانية"], ["nine", "تسعة"], ["ten", "عشرة"],
    ["eleven", "أحد عشر"], ["twelve", "اثنا عشر"], ["twenty", "عشرون"], ["fifty", "خمسون"],
    ["one hundred", "مئة"], ["one thousand", "ألف"], ["first", "الأول"], ["second", "الثاني"]
  ]},
  { id: "colors", emoji: "🎨", name: "Colors", nameAr: "الألوان", words: [
    ["red", "أحمر", "The tomato is red."], ["blue", "أزرق", "The sea is blue."],
    ["green", "أخضر", "The olive tree is green."], ["yellow", "أصفر", "The sun is yellow."],
    ["white", "أبيض", "The houses are white."], ["black", "أسود", "I have a black cat."],
    ["orange", "برتقالي", "I like orange juice."], ["brown", "بنّي", "Her eyes are brown."],
    ["pink", "وردي", "She wears a pink dress."], ["grey", "رمادي", "The sky is grey today."],
    ["purple", "بنفسجي", "Purple is my favorite color."], ["gold", "ذهبي", "A gold ring."]
  ]},
  { id: "food", emoji: "🍲", name: "Food & Drinks", nameAr: "الأكل والمشروبات", words: [
    ["bread", "خبز", "I buy bread every morning."], ["water", "ماء", "Can I have some water?"],
    ["milk", "حليب", "The child drinks milk."], ["coffee", "قهوة", "I drink coffee in the morning."],
    ["tea", "شاي", "Mint tea is delicious."], ["meat", "لحم", "I don't eat a lot of meat."],
    ["chicken", "دجاج", "We have chicken for dinner."], ["fish", "سمك", "The fish is fresh."],
    ["egg", "بيضة", "I eat an egg for breakfast."], ["cheese", "جبن", "Bread and cheese."],
    ["rice", "أرز", "Rice with vegetables."], ["sugar", "سكر", "No sugar, please."],
    ["salt", "ملح", "Pass me the salt, please."], ["oil", "زيت", "Tunisian olive oil is famous."],
    ["apple", "تفاحة", "An apple a day."], ["orange", "برتقالة", "Oranges from Nabeul."],
    ["tomato", "طماطم", "Tomato salad."], ["potato", "بطاطا", "Fried potatoes."],
    ["onion", "بصل", "Cut the onion."], ["dates", "تمر", "Dates from Tozeur are sweet."],
    ["breakfast", "فطور الصباح", "Breakfast is ready."], ["lunch", "غداء", "Let's have lunch."],
    ["dinner", "عشاء", "Dinner is at eight."], ["hungry", "جائع", "I am hungry."], ["thirsty", "عطشان", "I am thirsty."]
  ]},
  { id: "house", emoji: "🏠", name: "House", nameAr: "المنزل", words: [
    ["house", "منزل", "Our house is near the sea."], ["room", "غرفة", "My room is small."],
    ["kitchen", "مطبخ", "Mom is in the kitchen."], ["bathroom", "حمّام", "Where is the bathroom?"],
    ["bedroom", "غرفة النوم", "The bedroom is upstairs."], ["door", "باب", "Close the door, please."],
    ["window", "نافذة", "Open the window."], ["table", "طاولة", "The keys are on the table."],
    ["chair", "كرسي", "Sit on the chair."], ["bed", "سرير", "The bed is comfortable."],
    ["key", "مفتاح", "I lost my key."], ["floor", "أرضية / طابق", "We live on the second floor."],
    ["wall", "جدار", "The wall is white."], ["garden", "حديقة", "There is a lemon tree in the garden."]
  ]},
  { id: "body", emoji: "🧍", name: "Body & Health", nameAr: "الجسم والصحة", words: [
    ["head", "رأس", "My head hurts."], ["eye", "عين", "Close your eyes."], ["ear", "أذن", "Listen with your ears."],
    ["mouth", "فم", "Open your mouth."], ["nose", "أنف", "My nose is cold."], ["hand", "يد", "Wash your hands."],
    ["foot", "قدم", "My foot hurts."], ["leg", "ساق", "He broke his leg."], ["back", "ظهر", "I have back pain."],
    ["heart", "قلب", "Your heart is strong."], ["tooth", "سنّ", "I have a toothache."],
    ["sick", "مريض", "I am sick today."], ["pain", "ألم", "Where is the pain?"],
    ["medicine", "دواء", "Take your medicine."], ["doctor", "طبيب", "I need a doctor."], ["hospital", "مستشفى", "He is in the hospital."]
  ]},
  { id: "time", emoji: "📅", name: "Time & Days", nameAr: "الوقت والأيام", words: [
    ["Monday", "الإثنين"], ["Tuesday", "الثلاثاء"], ["Wednesday", "الأربعاء"], ["Thursday", "الخميس"],
    ["Friday", "الجمعة"], ["Saturday", "السبت"], ["Sunday", "الأحد"],
    ["today", "اليوم", "Today is a good day."], ["tomorrow", "غدًا", "See you tomorrow."], ["yesterday", "أمس", "I was tired yesterday."],
    ["morning", "صباح", "I study in the morning."], ["afternoon", "بعد الظهر", "We meet in the afternoon."],
    ["evening", "مساء", "In the evening I read."], ["night", "ليل", "The night is quiet."],
    ["week", "أسبوع", "Next week I travel."], ["month", "شهر", "Ramadan is a holy month."],
    ["year", "سنة", "Happy new year!"], ["hour", "ساعة", "Wait one hour."], ["minute", "دقيقة", "Five minutes, please."],
    ["now", "الآن", "Come now!"], ["later", "لاحقًا", "Call me later."], ["always", "دائمًا", "I always drink tea."],
    ["never", "أبدًا", "I never smoke."], ["sometimes", "أحيانًا", "Sometimes I walk to work."]
  ]},
  { id: "verbs", emoji: "🏃", name: "Common Verbs", nameAr: "أفعال شائعة", words: [
    ["to be", "يكون", "I am happy."], ["to have", "يملك / عنده", "I have a car."], ["to go", "يذهب", "I go to school."],
    ["to come", "يأتي", "Come here!"], ["to eat", "يأكل", "We eat together."], ["to drink", "يشرب", "Drink water."],
    ["to sleep", "ينام", "I sleep at eleven."], ["to work", "يعمل", "She works in a bank."],
    ["to study", "يدرس", "I study English."], ["to read", "يقرأ", "I read every night."],
    ["to write", "يكتب", "Write your name."], ["to speak", "يتكلم", "Do you speak English?"],
    ["to listen", "يستمع", "Listen carefully."], ["to understand", "يفهم", "I don't understand."],
    ["to know", "يعرف", "I know the answer."], ["to want", "يريد", "I want to learn."],
    ["to like", "يحب", "I like music."], ["to buy", "يشتري", "I want to buy a shirt."],
    ["to open", "يفتح", "Open the book."], ["to close", "يغلق", "Close the door."],
    ["to see", "يرى", "I see the sea."], ["to look for", "يبحث عن", "I'm looking for my keys."],
    ["to find", "يجد", "I can't find my phone."], ["to give", "يعطي", "Give me the pen."],
    ["to take", "يأخذ", "Take an umbrella."], ["to wait", "ينتظر", "Wait for me!"],
    ["to learn", "يتعلّم", "We learn every day."], ["to forget", "ينسى", "Don't forget!"],
    ["to remember", "يتذكّر", "I remember your face."], ["to travel", "يسافر", "I want to travel to London."]
  ]},
  { id: "adjectives", emoji: "✨", name: "Adjectives", nameAr: "الصفات", words: [
    ["big", "كبير", "A big city."], ["small", "صغير", "A small car."], ["good", "جيد", "Good job!"],
    ["bad", "سيّئ", "Bad weather."], ["new", "جديد", "A new phone."], ["old", "قديم / كبير في السن", "An old man."],
    ["young", "شاب / صغير السن", "She is young."], ["beautiful", "جميل", "A beautiful view."],
    ["hot", "حار", "It's hot in summer."], ["cold", "بارد", "The water is cold."],
    ["easy", "سهل", "English is easy!"], ["difficult", "صعب", "This word is difficult."],
    ["fast", "سريع", "The train is fast."], ["slow", "بطيء", "Speak slowly."],
    ["cheap", "رخيص", "The market is cheap."], ["expensive", "غالٍ", "This hotel is expensive."],
    ["happy", "سعيد", "I am happy today."], ["sad", "حزين", "Why are you sad?"],
    ["tired", "متعب", "I am very tired."], ["busy", "مشغول / مزدحم", "I'm busy now."],
    ["clean", "نظيف", "The room is clean."], ["dirty", "متّسخ", "My shoes are dirty."],
    ["important", "مهم", "This is important."], ["useful", "مفيد", "A useful book."]
  ]},
  { id: "places", emoji: "🏙️", name: "City & Places", nameAr: "المدينة والأماكن", words: [
    ["city", "مدينة", "Tunis is a big city."], ["village", "قرية", "A small village."],
    ["street", "شارع", "The street is long."], ["school", "مدرسة", "The children go to school."],
    ["university", "جامعة", "I study at the university."], ["bank", "بنك", "The bank opens at eight."],
    ["shop", "دكّان / متجر", "The shop is closed."], ["market", "سوق", "Let's go to the market."],
    ["mosque", "جامع / مسجد", "The mosque is old."], ["restaurant", "مطعم", "A good restaurant."],
    ["café", "مقهى", "Meet me at the café."], ["pharmacy", "صيدلية", "Is there a pharmacy near here?"],
    ["post office", "مكتب البريد", "Where is the post office?"], ["beach", "شاطئ", "We go to the beach in summer."],
    ["station", "محطة", "The train station."], ["airport", "مطار", "Tunis-Carthage airport."]
  ]},
  { id: "travel", emoji: "🧳", name: "Travel", nameAr: "السفر", words: [
    ["passport", "جواز سفر", "Show your passport."], ["ticket", "تذكرة", "One ticket, please."],
    ["plane", "طائرة", "The plane is late."], ["train", "قطار", "Take the train."],
    ["bus", "حافلة", "The bus is full."], ["taxi", "سيارة أجرة / تاكسي", "Call a taxi."],
    ["car", "سيارة", "My car is red."], ["hotel", "فندق", "The hotel is near the beach."],
    ["luggage", "أمتعة", "My luggage is heavy."], ["map", "خريطة", "Look at the map."],
    ["left", "يسار", "Turn left."], ["right", "يمين", "Turn right."], ["straight", "مستقيم / مباشرة", "Go straight."],
    ["near", "قريب", "It's near here."], ["far", "بعيد", "It's far."], ["flight", "رحلة جوية", "Our flight is at nine."]
  ]},
  { id: "work", emoji: "💼", name: "Jobs & Work", nameAr: "المهن والعمل", words: [
    ["teacher", "معلّم / أستاذ"], ["student", "طالب / تلميذ"], ["engineer", "مهندس"], ["nurse", "ممرّض"],
    ["driver", "سائق"], ["cook", "طبّاخ"], ["farmer", "فلّاح"], ["police officer", "شرطي"],
    ["seller", "بائع"], ["manager", "مدير"], ["job", "وظيفة / عمل", "I am looking for a job."],
    ["office", "مكتب", "My office is on the third floor."], ["meeting", "اجتماع", "The meeting starts at ten."],
    ["salary", "راتب / شهرية", "A good salary."], ["company", "شركة", "A big company."], ["colleague", "زميل", "My colleague is kind."]
  ]},
  { id: "clothes", emoji: "👕", name: "Clothes", nameAr: "الملابس", words: [
    ["shirt", "قميص"], ["trousers", "سروال"], ["dress", "فستان"], ["shoes", "حذاء"], ["jacket", "سترة / جاكيت"],
    ["coat", "معطف"], ["hat", "قبّعة"], ["socks", "جوارب"], ["skirt", "تنّورة"], ["bag", "حقيبة"],
    ["glasses", "نظّارات"], ["scarf", "وشاح"], ["size", "مقاس", "What size are you?"], ["wear", "يلبس", "I wear a jacket in winter."]
  ]},
  { id: "weather", emoji: "☀️", name: "Weather & Nature", nameAr: "الطقس والطبيعة", words: [
    ["sun", "شمس"], ["rain", "مطر", "It's raining today."], ["wind", "ريح", "The wind is strong."], ["cloud", "سحابة"],
    ["snow", "ثلج", "Snow in Ain Draham."], ["summer", "صيف"], ["winter", "شتاء"], ["spring", "ربيع"], ["autumn", "خريف"],
    ["sea", "بحر"], ["mountain", "جبل"], ["desert", "صحراء", "The Sahara desert."], ["tree", "شجرة"], ["flower", "زهرة"],
    ["sunny", "مشمس", "A sunny day."], ["warm", "دافئ", "The weather is warm."]
  ]},
  { id: "feelings", emoji: "😊", name: "Feelings", nameAr: "المشاعر", words: [
    ["love", "حب / يحب"], ["fear", "خوف"], ["angry", "غاضب", "Don't be angry."], ["worried", "قلق", "I am worried about the exam."],
    ["proud", "فخور", "I am proud of you."], ["bored", "يشعر بالملل", "I am bored."], ["excited", "متحمّس", "I'm excited about the trip."],
    ["nervous", "متوتّر", "I'm nervous before the interview."], ["surprised", "متفاجئ"], ["calm", "هادئ", "Stay calm."],
    ["lonely", "وحيد"], ["afraid", "خائف", "Don't be afraid."]
  ]},
  { id: "questions", emoji: "❓", name: "Question Words", nameAr: "أدوات الاستفهام", words: [
    ["what", "ماذا / ما", "What is this?"], ["where", "أين", "Where do you live?"], ["when", "متى", "When do you start?"],
    ["who", "من", "Who is he?"], ["why", "لماذا", "Why are you late?"], ["how", "كيف", "How are you?"],
    ["how much", "بكم / كم الثمن", "How much is it?"], ["how many", "كم (عدد)", "How many brothers do you have?"],
    ["which", "أيّ", "Which color do you want?"], ["whose", "لمن", "Whose bag is this?"]
  ]}
];

// Extra dictionary for tap-to-translate (function words and story words).
window.EXTRA_DICT = {
  "i": "أنا", "you": "أنت / أنتم", "he": "هو", "she": "هي", "it": "هو / هي (لغير العاقل)", "we": "نحن", "they": "هم",
  "me": "ني / لي (ضمير المتكلم)", "him": "ـه (هو)", "her": "ـها (هي)", "us": "نا (نحن)", "them": "هم",
  "my": "ـي (لي)", "your": "ـك (لك)", "his": "ـه (له)", "our": "ـنا (لنا)", "their": "ـهم (لهم)", "its": "ـه / ـها",
  "mine": "لي / ملكي", "the": "الـ (أداة تعريف)", "a": "أداة نكرة (واحد)", "an": "أداة نكرة (قبل حرف علّة)",
  "and": "و", "or": "أو", "but": "لكن", "because": "لأنّ", "so": "لذلك / جدًا", "if": "إذا", "then": "ثم / إذن",
  "in": "في", "on": "على", "at": "عند / في", "to": "إلى", "from": "من", "with": "مع", "without": "بدون",
  "for": "لـ / من أجل / لمدة", "of": "من / لـ", "by": "بواسطة / بـ", "about": "حول / تقريبًا", "under": "تحت",
  "up": "فوق / إلى الأعلى", "down": "تحت / إلى الأسفل", "before": "قبل", "after": "بعد", "since": "منذ",
  "is": "يكون (هو/هي)", "are": "يكونون", "am": "أكون", "was": "كان", "were": "كانوا", "be": "يكون", "been": "كان (تام)",
  "do": "يفعل", "does": "يفعل (هو)", "did": "فعل", "don't": "لا (نفي)", "doesn't": "لا (نفي)", "didn't": "لم",
  "can": "يستطيع", "can't": "لا يستطيع", "will": "سوف", "would": "سوف (شرطي) / أودّ", "could": "استطاع / يمكن",
  "should": "يجب / ينبغي", "must": "يجب", "not": "لا / ليس", "very": "جدًا", "too": "أيضًا / أكثر من اللازم",
  "also": "أيضًا", "more": "أكثر", "most": "الأكثر", "much": "كثير", "many": "كثير (معدود)", "a lot": "كثيرًا",
  "some": "بعض", "every": "كل", "all": "كل / جميع", "this": "هذا / هذه", "that": "ذلك / تلك / أنّ",
  "these": "هؤلاء / هذه", "those": "أولئك", "here": "هنا", "there": "هناك", "there is": "يوجد",
  "again": "مرة أخرى", "only": "فقط", "well": "جيدًا", "now": "الآن", "still": "لا يزال", "already": "بالفعل",
  "really": "حقًا", "one": "واحد", "nothing": "لا شيء", "nobody": "لا أحد", "everyone": "الجميع",
  "thing": "شيء", "people": "ناس / أشخاص", "man": "رجل", "woman": "امرأة", "boy": "ولد", "girl": "بنت",
  "capital": "عاصمة", "learning": "يتعلّم", "english": "الإنجليزية", "arabic": "العربية", "french": "الفرنسية",
  "family": "عائلة", "free": "حرّ / مجاني / فارغ", "football": "كرة القدم", "every morning": "كل صباح",
  "metro": "مترو", "center": "وسط / مركز", "years": "سنوات", "live": "يسكن / يعيش", "work": "يعمل / عمل",
  "fruits": "فواكه", "vegetables": "خضر", "seller": "بائع", "kilo": "كيلوغرام", "buys": "يشتري",
  "fresh": "طازج", "olive": "زيتون", "cook": "يطبخ", "favorite": "المفضّل", "wake": "يستيقظ", "wash": "يغسل",
  "face": "وجه", "brush": "يفرك / يُنظّف بالفرشاة", "teeth": "أسنان", "usually": "عادةً", "leave": "يغادر",
  "start": "يبدأ", "finish": "يُنهي", "watch": "يشاهد", "visited": "زار", "took": "أخذ", "early": "باكرًا",
  "weather": "الطقس", "walls": "جدران", "doors": "أبواب", "narrow": "ضيّق", "streets": "شوارع", "top": "قمّة",
  "hill": "تلّة", "boats": "قوارب", "tourists": "سيّاح", "photos": "صور", "couple": "زوجان", "smiled": "ابتسم",
  "felt": "شعر", "perfect": "مثالي", "hurry": "عجلة", "jumped": "قفز", "arrived": "وصل", "looked": "نظر",
  "pocket": "جيب", "contacts": "جهات الاتصال", "borrowed": "استعار", "called": "اتصل / سُمّي", "answered": "أجاب",
  "found": "وجد", "met": "التقى", "lesson": "درس", "problem": "مشكلة", "headache": "صداع", "sore throat": "ألم في الحلق",
  "since": "منذ", "temperature": "درجة الحرارة", "fever": "حمّى", "probably": "على الأرجح", "flu": "أنفلونزا",
  "rest": "راحة", "crow": "غراب", "piece": "قطعة", "flew": "طار", "branch": "غصن", "tall": "طويل / عالٍ",
  "enjoy": "يستمتع", "fox": "ثعلب", "clever": "ذكي", "plan": "خطة", "feathers": "ريش", "shiny": "لامع",
  "bright": "برّاق", "voice": "صوت", "forest": "غابة", "sing": "يغنّي", "song": "أغنية", "beak": "منقار",
  "immediately": "فورًا", "fell": "سقط", "ground": "أرض", "caught": "أمسك", "quickly": "بسرعة", "trust": "يثق",
  "flatter": "يتملّق", "interview": "مقابلة", "international": "دولي", "practised": "تدرّب", "answering": "الإجابة",
  "common": "شائع", "questions": "أسئلة", "loud": "عالٍ", "out loud": "بصوت عالٍ", "degree": "شهادة جامعية",
  "computer science": "الإعلامية", "developer": "مطوّر", "grow": "ينمو / يتطوّر", "skills": "مهارات",
  "team": "فريق", "countries": "بلدان", "different": "مختلف", "seemed": "بدا", "impressed": "معجب / منبهر",
  "received": "تلقّى", "email": "بريد إلكتروني", "congratulations": "تهانينا", "pleased": "مسرور", "offer": "يعرض",
  "position": "منصب / وظيفة", "hard": "صعب / بجدّ", "paid off": "أثمر", "shepherd": "راعٍ", "sheep": "خِراف / أغنام",
  "decided": "قرّر", "trick": "خدعة / حيلة", "villagers": "أهل القرية", "wolf": "ذئب", "attacking": "يهاجم",
  "shouted": "صرخ", "ran": "ركض", "laughed": "ضحك", "real": "حقيقي", "screamed": "صرخ", "believed": "صدّق",
  "frightened": "أخاف", "liar": "كذّاب", "truth": "الحقيقة", "check-in": "تسجيل الوصول", "employee": "موظّف",
  "seat": "مقعد", "aisle": "ممرّ", "view": "منظر", "security": "الأمن / التفتيش", "gate": "بوابة",
  "boarding pass": "بطاقة الصعود", "carefully": "بعناية", "suddenly": "فجأة", "announcement": "إعلان",
  "delayed": "متأخّر", "instead": "بدلًا من ذلك", "annoyed": "منزعج", "review": "يراجع", "expressions": "عبارات",
  "manage": "يتدبّر", "finally": "أخيرًا", "took off": "أقلعت", "mixture": "مزيج", "excitement": "حماس",
  "flight attendant": "مضيف(ة) طيران", "meal": "وجبة", "pilot": "طيّار", "land": "يهبط / أرض",
  "adventure": "مغامرة", "believe": "يعتقد / يصدّق", "requires": "يتطلّب", "talent": "موهبة",
  "research": "بحث", "suggests": "يقترح / يشير", "otherwise": "خلاف ذلك", "matters": "يهمّ", "regular": "منتظم",
  "exposure": "تعرّض", "consistent": "مستمر / ثابت", "practice": "تدريب / ممارسة", "effective": "فعّال",
  "foundation": "أساس", "gradually": "تدريجيًا", "sounds": "أصوات", "repeating": "تكرار / ترديد",
  "sentences": "جمل", "speaker": "متكلّم", "technique": "تقنية", "improves": "يحسّن", "pronunciation": "النطق",
  "fluency": "الطلاقة", "vocabulary": "المفردات", "intervals": "فترات", "increasing": "متزايد", "memory": "ذاكرة",
  "mistakes": "أخطاء", "step": "خطوة", "towards": "نحو"
};
