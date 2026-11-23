// Built-in library. Each paragraph is a list of [English sentence, Arabic translation].
window.BOOKS = [
  {
    id: "omar", level: "A1", emoji: "👋", color: "#0E7C66",
    title: "My Name Is Omar", titleAr: "اسمي عمر",
    paragraphs: [
      [
        ["Hello! My name is Omar.", "مرحبًا! اسمي عمر."],
        ["I am twenty-five years old.", "عمري خمسة وعشرون عامًا."],
        ["I live in Tunis, the capital of Tunisia.", "أسكن في تونس، عاصمة الجمهورية التونسية."],
        ["I speak Arabic and French, and now I am learning English.", "أتكلم العربية والفرنسية، والآن أتعلم الإنجليزية."]
      ],
      [
        ["I have a small family.", "عندي عائلة صغيرة."],
        ["My father is a teacher and my mother is a nurse.", "أبي معلّم وأمي ممرّضة."],
        ["I have one sister. Her name is Salma.", "عندي أخت واحدة. اسمها سلمى."],
        ["She is a student at the university.", "هي طالبة في الجامعة."]
      ],
      [
        ["I work in a bank in the city center.", "أعمل في بنك في وسط المدينة."],
        ["I go to work by metro every morning.", "أذهب إلى العمل بالمترو كل صباح."],
        ["In my free time, I play football with my friends.", "في وقت فراغي، ألعب كرة القدم مع أصدقائي."],
        ["I want to speak English well because it is very useful.", "أريد أن أتكلم الإنجليزية جيدًا لأنها مفيدة جدًا."]
      ]
    ]
  },
  {
    id: "market", level: "A1", emoji: "🍊", color: "#E07A1F",
    title: "At the Market", titleAr: "في السوق",
    paragraphs: [
      [
        ["Today is Saturday.", "اليوم هو السبت."],
        ["Amira goes to the market with her mother.", "تذهب أميرة إلى السوق مع أمها."],
        ["The market is big and very busy.", "السوق كبير ومزدحم جدًا."],
        ["There are many fruits and vegetables.", "هناك الكثير من الفواكه والخضر."]
      ],
      [
        ["\"Good morning! How much are the oranges?\" asks Amira.", "\"صباح الخير! بكم البرتقال؟\" تسأل أميرة."],
        ["\"Two dinars a kilo,\" says the seller.", "\"بدينارين الكيلو\"، يقول البائع."],
        ["\"I want three kilos, please.\"", "\"أريد ثلاثة كيلوغرامات من فضلك.\""],
        ["\"Here you are. That is six dinars.\"", "\"تفضّلي. المجموع ستة دنانير.\""]
      ],
      [
        ["Her mother buys tomatoes, peppers and onions.", "تشتري أمها الطماطم والفلفل والبصل."],
        ["They also buy fresh bread and olive oil.", "يشتريان أيضًا خبزًا طازجًا وزيت زيتون."],
        ["Tonight they will cook couscous for the family.", "الليلة سيطبخان الكسكسي للعائلة."],
        ["Amira is happy because couscous is her favorite food.", "أميرة سعيدة لأن الكسكسي هو أكلتها المفضّلة."]
      ]
    ]
  },
  {
    id: "myday", level: "A1", emoji: "⏰", color: "#5B6CD6",
    title: "My Day", titleAr: "يومي",
    paragraphs: [
      [
        ["I wake up at six o'clock.", "أستيقظ على الساعة السادسة."],
        ["I wash my face and brush my teeth.", "أغسل وجهي وأنظّف أسناني."],
        ["Then I drink coffee and eat breakfast.", "ثم أشرب القهوة وأتناول فطور الصباح."],
        ["I usually eat bread with cheese and olives.", "عادةً آكل الخبز مع الجبن والزيتون."]
      ],
      [
        ["At half past seven, I leave the house.", "على الساعة السابعة والنصف، أخرج من المنزل."],
        ["I start work at eight o'clock.", "أبدأ العمل على الساعة الثامنة."],
        ["At one o'clock, I have lunch with my colleagues.", "على الساعة الواحدة، أتناول الغداء مع زملائي."],
        ["I finish work at five in the afternoon.", "أنهي العمل على الساعة الخامسة بعد الظهر."]
      ],
      [
        ["In the evening, I watch TV or read a book.", "في المساء، أشاهد التلفاز أو أقرأ كتابًا."],
        ["I have dinner with my family at eight.", "أتناول العشاء مع عائلتي على الساعة الثامنة."],
        ["Before I sleep, I study English for twenty minutes.", "قبل أن أنام، أدرس الإنجليزية لمدة عشرين دقيقة."],
        ["I go to bed at eleven o'clock.", "أذهب إلى الفراش على الساعة الحادية عشرة."]
      ]
    ]
  },
  {
    id: "phrases", level: "A1", emoji: "💬", color: "#C2417A",
    title: "Everyday Phrases", titleAr: "عبارات يومية",
    paragraphs: [
      [
        ["Good morning. How are you?", "صباح الخير. كيف حالك؟"],
        ["I'm fine, thank you. And you?", "أنا بخير، شكرًا. وأنت؟"],
        ["Nice to meet you.", "تشرّفت بمعرفتك."],
        ["See you later!", "أراك لاحقًا!"]
      ],
      [
        ["Excuse me, where is the train station?", "عفوًا، أين محطة القطار؟"],
        ["Go straight and turn left.", "امشِ مباشرةً ثم انعطف يسارًا."],
        ["Is it far from here?", "هل هي بعيدة من هنا؟"],
        ["No, it is about five minutes on foot.", "لا، حوالي خمس دقائق مشيًا."]
      ],
      [
        ["Can you speak more slowly, please?", "هل يمكنك أن تتكلم ببطء أكثر من فضلك؟"],
        ["I don't understand. Can you repeat that?", "لم أفهم. هل يمكنك أن تعيد ذلك؟"],
        ["What does this word mean?", "ماذا تعني هذه الكلمة؟"],
        ["How do you say this in English?", "كيف تقول هذا بالإنجليزية؟"]
      ],
      [
        ["I would like a glass of water, please.", "أريد كأس ماء من فضلك."],
        ["Can I have the bill, please?", "هل يمكنني الحصول على الفاتورة من فضلك؟"],
        ["How much does it cost?", "كم ثمنه؟"],
        ["Thank you very much. You're welcome.", "شكرًا جزيلًا. عفوًا."]
      ]
    ]
  },
  {
    id: "sidibousaid", level: "A2", emoji: "🏖️", color: "#1F78B4",
    title: "A Day in Sidi Bou Said", titleAr: "يوم في سيدي بوسعيد",
    paragraphs: [
      [
        ["Last Sunday, Youssef visited Sidi Bou Said with his friends.", "يوم الأحد الماضي، زار يوسف سيدي بوسعيد مع أصدقائه."],
        ["They took the train from Tunis early in the morning.", "أخذوا القطار من تونس في الصباح الباكر."],
        ["The weather was sunny and warm.", "كان الطقس مشمسًا ودافئًا."],
        ["The village was beautiful, with white walls and blue doors.", "كانت القرية جميلة، بجدرانها البيضاء وأبوابها الزرقاء."]
      ],
      [
        ["They walked up the narrow streets to the top of the hill.", "صعدوا الأزقّة الضيقة حتى قمة التلّة."],
        ["From there, they could see the sea and the boats.", "من هناك، استطاعوا رؤية البحر والقوارب."],
        ["Many tourists were taking photos.", "كان الكثير من السياح يلتقطون الصور."],
        ["Youssef helped an English couple find a café.", "ساعد يوسف زوجين إنجليزيين على إيجاد مقهى."]
      ],
      [
        ["\"Thank you so much! Your English is very good,\" said the woman.", "\"شكرًا جزيلًا! إنجليزيتك جيدة جدًا\"، قالت المرأة."],
        ["Youssef smiled. He felt proud.", "ابتسم يوسف. شعر بالفخر."],
        ["Then the friends drank mint tea with pine nuts and ate bambalouni.", "ثم شرب الأصدقاء الشاي بالنعناع والبندق وأكلوا البمبالوني."],
        ["It was a perfect day.", "كان يومًا رائعًا."]
      ]
    ]
  },
  {
    id: "phone", level: "A2", emoji: "📱", color: "#7A4FBF",
    title: "The Lost Phone", titleAr: "الهاتف الضائع",
    paragraphs: [
      [
        ["Sami was in a hurry this morning.", "كان سامي مستعجلًا هذا الصباح."],
        ["He jumped on the bus and sat near the window.", "قفز إلى الحافلة وجلس قرب النافذة."],
        ["When he arrived at his office, he looked for his phone.", "عندما وصل إلى مكتبه، بحث عن هاتفه."],
        ["It wasn't in his pocket or in his bag.", "لم يكن في جيبه ولا في حقيبته."]
      ],
      [
        ["Sami was very worried.", "كان سامي قلقًا جدًا."],
        ["All his photos and contacts were on that phone.", "كانت كل صوره وأرقام معارفه على ذلك الهاتف."],
        ["He borrowed his colleague's phone and called his own number.", "استعار هاتف زميله واتصل برقمه."],
        ["After a few rings, a woman answered.", "بعد بضع رنّات، أجابت امرأة."]
      ],
      [
        ["\"Hello, I found this phone on the bus,\" she said.", "\"ألو، وجدت هذا الهاتف في الحافلة\"، قالت."],
        ["\"Oh, thank you! It's mine,\" said Sami.", "\"آه، شكرًا! إنه هاتفي\"، قال سامي."],
        ["They met at a café one hour later, and she gave it back to him.", "التقيا في مقهى بعد ساعة، وأعادته إليه."],
        ["Sami learned a lesson: never be in a hurry!", "تعلّم سامي درسًا: لا تكن مستعجلًا أبدًا!"]
      ]
    ]
  },
  {
    id: "doctor", level: "A2", emoji: "🩺", color: "#D64545",
    title: "At the Doctor", titleAr: "عند الطبيب",
    paragraphs: [
      [
        ["Doctor: Good afternoon. What's the problem?", "الطبيب: مساء الخير. ما المشكلة؟"],
        ["Patient: I have a headache and a sore throat.", "المريض: عندي صداع وألم في الحلق."],
        ["Doctor: How long have you felt like this?", "الطبيب: منذ متى تشعر بهذا؟"],
        ["Patient: Since yesterday morning. I also feel very tired.", "المريض: منذ صباح الأمس. وأشعر أيضًا بتعب شديد."]
      ],
      [
        ["Doctor: Let me check your temperature.", "الطبيب: دعني أقيس حرارتك."],
        ["You have a small fever. It's probably the flu.", "عندك حمّى خفيفة. على الأرجح إنها نزلة برد (أنفلونزا)."],
        ["Take this medicine three times a day after meals.", "خذ هذا الدواء ثلاث مرات في اليوم بعد الأكل."],
        ["Drink a lot of water and stay in bed for two days.", "اشرب الكثير من الماء وابقَ في الفراش لمدة يومين."]
      ],
      [
        ["Patient: Can I go to work tomorrow?", "المريض: هل يمكنني الذهاب إلى العمل غدًا؟"],
        ["Doctor: No, you need to rest. I'll write you a sick note.", "الطبيب: لا، أنت بحاجة إلى الراحة. سأكتب لك شهادة طبية."],
        ["Patient: Thank you, doctor.", "المريض: شكرًا يا دكتور."],
        ["Doctor: You're welcome. Get well soon!", "الطبيب: عفوًا. شفاك الله!"]
      ]
    ]
  },
  {
    id: "fox", level: "B1", emoji: "🦊", color: "#B5651D",
    title: "The Fox and the Crow", titleAr: "الثعلب والغراب",
    paragraphs: [
      [
        ["One morning, a crow found a piece of cheese.", "في صباح أحد الأيام، وجد غراب قطعة جبن."],
        ["She flew up to the branch of a tall tree to enjoy her breakfast.", "طار إلى غصن شجرة عالية ليستمتع بفطوره."],
        ["A hungry fox was walking under the tree and saw the cheese.", "كان ثعلب جائع يمشي تحت الشجرة فرأى الجبن."],
        ["He wanted it, so he thought of a clever plan.", "أراده، ففكّر في خطّة ذكية."]
      ],
      [
        ["\"Good morning, beautiful bird!\" said the fox.", "\"صباح الخير أيها الطائر الجميل!\" قال الثعلب."],
        ["\"Your feathers are so shiny, and your eyes are so bright.\"", "\"ريشك لامع جدًا، وعيناك برّاقتان جدًا.\""],
        ["\"I am sure your voice is the most beautiful in the forest.\"", "\"أنا متأكد أن صوتك هو الأجمل في الغابة.\""],
        ["\"Please, sing a song for me!\"", "\"أرجوك، غنِّ لي أغنية!\""]
      ],
      [
        ["The crow felt very proud and opened her beak to sing.", "شعر الغراب بفخر كبير وفتح منقاره ليغنّي."],
        ["Immediately, the cheese fell to the ground.", "في الحال، سقطت قطعة الجبن على الأرض."],
        ["The fox caught it and ate it quickly.", "التقطها الثعلب وأكلها بسرعة."],
        ["\"Remember,\" said the fox, \"don't trust people who flatter you.\"", "\"تذكّر\"، قال الثعلب، \"لا تثق بمن يتملّقك.\""]
      ]
    ]
  },
  {
    id: "interview", level: "B1", emoji: "💼", color: "#2F6F4F",
    title: "A Job Interview", titleAr: "مقابلة عمل",
    paragraphs: [
      [
        ["Leila had a job interview at an international company.", "كانت لليلى مقابلة عمل في شركة دولية."],
        ["The interview was going to be in English, so she was nervous.", "كانت المقابلة ستجري بالإنجليزية، لذلك كانت متوترة."],
        ["For two weeks, she practised answering common questions out loud.", "لمدة أسبوعين، تدرّبت على الإجابة عن الأسئلة الشائعة بصوت عالٍ."],
        ["She also listened to English podcasts every day on her way to university.", "كما استمعت إلى بودكاست بالإنجليزية كل يوم في طريقها إلى الجامعة."]
      ],
      [
        ["\"Tell me about yourself,\" said the manager.", "\"حدّثيني عن نفسك\"، قال المدير."],
        ["\"I have a degree in computer science, and I have worked as a developer for three years,\" Leila answered.", "\"عندي شهادة في الإعلامية، وعملت مطوّرة لمدة ثلاث سنوات\"، أجابت ليلى."],
        ["\"Why do you want to work with us?\"", "\"لماذا تريدين العمل معنا؟\""],
        ["\"Because I want to grow, learn new skills and work in a team with people from different countries.\"", "\"لأنني أريد أن أتطوّر، وأتعلّم مهارات جديدة، وأعمل ضمن فريق مع أشخاص من بلدان مختلفة.\""]
      ],
      [
        ["The manager seemed impressed by her answers.", "بدا المدير معجبًا بإجاباتها."],
        ["A week later, Leila received an email.", "بعد أسبوع، تلقّت ليلى رسالة إلكترونية."],
        ["\"Congratulations! We are pleased to offer you the position.\"", "\"تهانينا! يسعدنا أن نعرض عليك الوظيفة.\""],
        ["Her hard work had paid off.", "لقد أثمر عملها الجادّ."]
      ]
    ]
  },
  {
    id: "wolf", level: "B1", emoji: "🐑", color: "#6B7B3A",
    title: "The Boy Who Cried Wolf", titleAr: "الراعي الكذّاب",
    paragraphs: [
      [
        ["There was once a young shepherd who looked after the sheep of his village.", "كان هناك راعٍ صغير يرعى أغنام قريته."],
        ["Every day he sat on the hill, and every day he felt bored.", "كل يوم كان يجلس على التلّة، وكل يوم كان يشعر بالملل."],
        ["One afternoon, he decided to play a trick on the villagers.", "في أحد الأيام بعد الظهر، قرّر أن يمازح أهل القرية بحيلة."],
        ["\"Wolf! Wolf! A wolf is attacking the sheep!\" he shouted.", "\"ذئب! ذئب! ذئب يهاجم الأغنام!\" صرخ."]
      ],
      [
        ["The villagers ran up the hill to help him, but there was no wolf.", "ركض أهل القرية إلى التلّة لمساعدته، لكن لم يكن هناك ذئب."],
        ["The boy laughed at their angry faces.", "ضحك الولد من وجوههم الغاضبة."],
        ["A few days later, he did the same thing again.", "بعد بضعة أيام، فعل الشيء نفسه مرة أخرى."],
        ["Once more, the villagers came, and once more they found nothing.", "مرة أخرى جاء أهل القرية، ومرة أخرى لم يجدوا شيئًا."]
      ],
      [
        ["Then one evening, a real wolf came out of the forest.", "ثم في إحدى الأمسيات، خرج ذئب حقيقي من الغابة."],
        ["The boy screamed for help, but nobody believed him this time.", "صرخ الولد طالبًا النجدة، لكن لم يصدّقه أحد هذه المرة."],
        ["The wolf frightened the sheep and they all ran away.", "أخاف الذئب الأغنام فهربت كلها."],
        ["Nobody believes a liar, even when he is telling the truth.", "لا أحد يصدّق الكذّاب، حتى عندما يقول الحقيقة."]
      ]
    ]
  },
  {
    id: "plane", level: "B2", emoji: "✈️", color: "#3A6EA5",
    title: "Travelling by Plane", titleAr: "السفر بالطائرة",
    paragraphs: [
      [
        ["Mehdi arrived at Tunis-Carthage Airport three hours before his flight to London.", "وصل مهدي إلى مطار تونس قرطاج قبل ثلاث ساعات من رحلته إلى لندن."],
        ["At the check-in desk, the airline employee asked for his passport and ticket.", "عند مكتب التسجيل، طلب موظف شركة الطيران جواز سفره وتذكرته."],
        ["\"Would you prefer a window seat or an aisle seat?\" she asked.", "\"هل تفضّل مقعدًا بجانب النافذة أم بجانب الممر؟\" سألت."],
        ["\"A window seat, please. It's my first time flying, and I'd like to see the view.\"", "\"مقعدًا بجانب النافذة من فضلك. إنها أول مرة أسافر فيها بالطائرة، وأودّ رؤية المنظر.\""]
      ],
      [
        ["After going through security, he waited at the gate and read his boarding pass carefully.", "بعد المرور بالتفتيش الأمني، انتظر عند البوابة وقرأ بطاقة الصعود بعناية."],
        ["Suddenly, an announcement said that the flight had been delayed by forty minutes.", "فجأة، أعلن مكبّر الصوت أن الرحلة تأخرت أربعين دقيقة."],
        ["Instead of getting annoyed, Mehdi used the time to review some useful English expressions.", "بدلًا من أن ينزعج، استغلّ مهدي الوقت لمراجعة بعض العبارات الإنجليزية المفيدة."],
        ["He knew that in London he would need to manage on his own.", "كان يعلم أنه في لندن سيحتاج إلى تدبّر أموره بنفسه."]
      ],
      [
        ["When the plane finally took off, he felt a mixture of excitement and fear.", "عندما أقلعت الطائرة أخيرًا، شعر بمزيج من الحماس والخوف."],
        ["The flight attendant offered him a drink and a light meal.", "قدّمت له المضيفة مشروبًا ووجبة خفيفة."],
        ["Three hours later, the pilot announced that they were about to land.", "بعد ثلاث ساعات، أعلن الطيار أنهم على وشك الهبوط."],
        ["Looking at the grey sky of London, Mehdi smiled: a new adventure was beginning.", "وهو ينظر إلى سماء لندن الرمادية، ابتسم مهدي: مغامرة جديدة كانت تبدأ."]
      ]
    ]
  },
  {
    id: "habits", level: "B2", emoji: "🧠", color: "#8E44AD",
    title: "How to Learn a Language", titleAr: "كيف تتعلّم لغة",
    paragraphs: [
      [
        ["Many people believe that learning a language requires a special talent, but research suggests otherwise.", "يعتقد الكثيرون أن تعلّم لغة يتطلّب موهبة خاصة، لكن الأبحاث تشير إلى عكس ذلك."],
        ["What matters most is regular exposure to the language and consistent practice.", "الأهم هو التعرّض المنتظم للغة والممارسة المستمرة."],
        ["Fifteen minutes a day is far more effective than three hours once a week.", "خمس عشرة دقيقة يوميًا أكثر فعالية بكثير من ثلاث ساعات مرة واحدة في الأسبوع."]
      ],
      [
        ["Listening is the foundation of everything.", "الاستماع هو أساس كل شيء."],
        ["If you listen to a text slowly at first, and then at normal speed, your ear gradually gets used to the sounds.", "إذا استمعت إلى نص ببطء في البداية، ثم بالسرعة العادية، فإن أذنك تتعوّد تدريجيًا على الأصوات."],
        ["Repeating sentences out loud immediately after the speaker, a technique called shadowing, improves your pronunciation and fluency.", "إن ترديد الجمل بصوت عالٍ مباشرة بعد المتكلّم، وهي تقنية تُسمّى المحاكاة (shadowing)، يحسّن نطقك وطلاقتك."]
      ],
      [
        ["Vocabulary should be reviewed at increasing intervals: after one day, then three days, then a week.", "يجب مراجعة المفردات على فترات متزايدة: بعد يوم، ثم ثلاثة أيام، ثم أسبوع."],
        ["This method, known as spaced repetition, helps move words into your long-term memory.", "هذه الطريقة، المعروفة بالتكرار المتباعد، تساعد على نقل الكلمات إلى ذاكرتك طويلة المدى."],
        ["Finally, don't be afraid of making mistakes; every mistake is a step towards fluency.", "وأخيرًا، لا تخف من ارتكاب الأخطاء؛ فكل خطأ هو خطوة نحو الطلاقة."]
      ]
    ]
  }
];
