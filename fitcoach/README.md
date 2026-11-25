# FitCoach — coach sportif, nutrition et santé (FR / EN / عربي)

Application Android : **programme d'entraînement de 4 mois**, **exercices en 3D**, **correction de posture par caméra (IA)**, **calories par photo**, **code-barres**, **suivi santé** et **conseils**, en **français, anglais ou arabe**.

📥 **APK (version 3.0, Android 8.0+)** :
- [`apk/FitCoach.apk`](../apk/FitCoach.apk) — téléphones récents (processeur 64 bits, ~76 Mo) ← **à prendre en priorité**
- [`apk/FitCoach-armv7.apk`](../apk/FitCoach-armv7.apk) — anciens téléphones 32 bits (~65 Mo)

> Installation : copier l'APK sur le téléphone → l'ouvrir → autoriser « Installer des applications inconnues ».

## Nouveautés de la version 3.0

- 📅 **Programme de 4 mois (16 semaines)**, au choix :
  - 🧠 **Scientifique (automatique)** : 4 phases — *Adaptation* (12–15 reps, 3 en réserve) → *Hypertrophie* (8–12 reps) → *Force* (4–6 reps sur les exercices de base) → *Pic selon l'objectif* — avec **semaines de décharge** (8, 12, 16), tempo, repos, RIR, cardio adapté (zone 2 / HIIT pour la perte de gras), **tests de départ et de fin** (pompes, squats, gainage, poids, tour de taille) et **bilan hebdomadaire** : l'application réduit ou augmente le volume selon votre fatigue, vos courbatures, votre sommeil et les séances faites.
  - ✍️ **Manuel** : vous créez vos jours, exercices, séries et répétitions ; répété 16 semaines avec décharge automatique optionnelle.
- 🧍‍♂️ **Personnage en 3D** : rotation à 360° (glisser le doigt), vues **profil / 3-4 / face / dos**, **ralenti**, **pause** et **étapes** (départ / milieu / arrivée), ombrage, matériel en 3D (bancs, barres, poulies, piles de poids, machines), muscles travaillés qui s'allument, homme ou femme.
- 🏋️ **84 exercices**, dont **19 machines et poulies de salle** : presse pectoraux, pec deck, vis-à-vis, presse épaules, rowing poulie, presse à cuisses 45°, Smith machine, leg curl allongé/assis, abducteurs, adducteurs, triceps poulie, curl poulie, face pull, élévation latérale poulie, tractions assistées, mollets machine, extensions lombaires, crunch poulie.
- ⭐ **3 versions** (changeables à tout moment) : **Healthy** (nutrition et santé), **Coaching** (entraînement), **Pro : coach + docteur** (tout, plus le suivi santé).
- 🩺 **Mode docteur** : tension artérielle (catégories ACC/AHA), pouls, **glycémie en g/L** (à jeun / après repas), SpO2, température, sommeil, poids, tour de taille — chaque mesure est **interprétée** (normal / à surveiller / consultez / urgence) ; **état de forme du jour** (entraînement normal, léger ou repos) ; **questionnaire médical avant le sport (PAR-Q)** ; **signes d'alerte** et numéros d'urgence (SAMU 190, 112) ; **rapport santé** à partager avec son médecin ; **métabolisme réel** appris de votre poids et de vos repas.
- 🍽️ **Reconnaissance de 2 023 plats hors-ligne** (modèle Google AIY Food V1, trouvé sur GitHub, licence Apache 2.0) sur la photo entière et sur chaque élément de l'assiette (couscous, lablabi, makroudh, bambalouni, tajine, merguez, pizza…), + **46 plats ajoutés** à la base (185 aliments).
- 🔐 **Comptes et sécurité** :
  - inscription avec **nom d'utilisateur ou e-mail (Gmail…)** et mot de passe solide (8 caractères, lettres + chiffres, mots de passe trop courants refusés, jauge de force) ;
  - **« Continuer avec Google »** : choix d'un compte Gmail du téléphone, sans mot de passe (clé gardée par la puce de sécurité Android) ;
  - **toutes les données chiffrées** (AES-256-GCM, clé dérivée du mot de passe par PBKDF2-SHA256 310 000 itérations) ;
  - **code de récupération** en cas d'oubli du mot de passe ; changement de mot de passe ; suppression du compte ;
  - **blocage progressif** après 5 essais ratés (30 s, puis 1 min, 2 min… jusqu'à 15 min) ;
  - **verrouillage par empreinte / visage / code** du téléphone (aussi au retour dans l'app) ; option pour **masquer l'app** dans les apps récentes et bloquer les captures d'écran ;
  - durcissement Android : pas de sauvegarde cloud des données, HTTPS seulement, politique de sécurité du contenu (CSP), pont JavaScript limité aux pages de l'app, liste fermée de serveurs (Open Food Facts, Anthropic).
- 🌙 **Mode sombre** au choix : automatique, clair ou sombre.

### Recherche GitHub (applications de nutrition)

- `second-state/wasm-learning` contient le modèle **Google AIY Food V1** (2 023 plats) et sa liste de plats → **intégré** (reconnaissance hors-ligne).
- `tfandkusu/food101-tflite` : seulement des scripts d'entraînement Food-101 (~60 % de précision, pas de modèle prêt) → non retenu.
- Applications de suivi calorique open source (ex. calculateurs adaptatifs de type *satiago*) → idée reprise : **métabolisme adaptatif** calculé à partir de l'évolution du poids et des calories notées (1 kg ≈ 7 700 kcal), au lieu d'une simple formule.

## Nouveautés de la version 2.0

- 🧍 **Carte du corps interactive** (face + dos) : touchez un muscle → ses exercices, son état de récupération et un bouton « entraîner ce muscle ». Sur l'accueil, la carte devient une **carte de chaleur** de récupération (vert / orange / rouge).
- 🏃 **Mannequin humain réaliste** à la place du bonhomme en bâtons : corps volumique, tenue de sport, matériel dessiné (barre, haltères, banc, barre de traction, poulie, machine) et **muscle travaillé qui s'allume** (principal en rose, secondaires en orange). Homme ou femme selon le profil.
- 💪 **65 exercices** (au lieu de 28) et **13 groupes musculaires** (+ trapèzes, avant-bras, lombaires) : soulevé de terre, squat barre, goblet squat, dips, tirage vertical, rowing inversé, Arnold press, skull crusher, nordic curl, hip thrust, bird dog, dead bug, burpee… classés « sans matériel » / « avec matériel », avec recherche.
- 🍽️ **Assiette à plusieurs aliments** : une seule photo → l'application repère chaque élément de l'assiette (cadres numérotés), propose des aliments pour chacun ; on règle les grammes et on obtient le total, une note A–E et une analyse (assez de légumes ? de protéines ? trop de féculents ?).
- ▮▯▮ **Code-barres** : photographier (ou saisir) le code-barres d'un produit emballé → produit exact via **Open Food Facts** (plus de 3 millions de produits) avec **Nutri-Score**, degré de transformation **NOVA**, calories et nutriments ; les produits scannés sont mémorisés.
- ✨ **IA avancée (optionnelle, Claude d'Anthropic)** : avec votre propre clé API, l'IA reconnaît **n'importe quel plat ou produit** sur une photo, estime chaque portion en grammes et ajoute tout à l'assiette, avec un conseil personnalisé (objectif, diabète, tension…).
- 🔥 **Nutrition reliée à l'entraînement** : les calories brûlées pendant la séance (MET × poids × durée) s'ajoutent au budget du jour.
- 🎨 **Nouveau design** : dégradés, cartes arrondies, barre de navigation flottante avec bouton caméra central, mode sombre soigné.

> Installation : copier l'APK sur le téléphone → l'ouvrir → autoriser « Installer des applications inconnues ».

## Fonctionnalités

| Module | Ce qu'il fait |
|---|---|
| 🔐 **Comptes** | Login par nom d'utilisateur, e-mail ou compte Google du téléphone ; données de chacun séparées, **chiffrées** et gardées sur le téléphone. |
| 🌐 **3 langues** | Français, English, العربية (interface en RTL pour l'arabe), changeable à tout moment. |
| 🧍 **Corps idéal** | Selon sexe, âge, taille, poids, tour de taille : IMC et catégorie, **poids santé pour votre taille**, poids idéal, % de graisse estimé et cible, rapport taille/hauteur, métabolisme de base, dépense journalière, **calories, protéines, glucides, lipides, fibres, sucre max et eau par jour**, conseil selon l'âge. |
| 🏋️ **65 exercices** pour 13 groupes musculaires | Pectoraux, dos, épaules, biceps, triceps, abdos, fessiers, quadriceps, ischios, mollets, trapèzes, avant-bras, lombaires — **avec et sans matériel**. Pour chacun : démonstration animée, étapes de la bonne position, erreurs fréquentes, astuce, séries/répétitions/repos adaptés à votre objectif, lien vers des vidéos. |
| 🧠 **Planificateur intelligent** | Choisit chaque jour **les muscles à travailler** (ex. aujourd'hui jambes, demain épaules) selon leur récupération (48–72 h), le volume fait dans la semaine (10–20 séries/muscle) et votre nombre de séances. **Il apprend** : il évite les exercices que vous remplacez souvent, varie les exercices et propose d'augmenter la charge quand vous atteignez le haut de la fourchette (surcharge progressive). |
| 📷 **Coach caméra (IA)** | En direct ou sur une vidéo filmée : détection du corps (33 points, Google ML Kit, sur le téléphone), **comptage des répétitions**, **score de posture** et **corrections** à l'écran et à voix haute : profondeur du squat, buste trop penché, genoux qui rentrent, talons, hanches qui s'affaissent en pompe/planche, coudes qui bougent en curl, dos cambré au développé, hauteur du pont fessier, charnière de hanche… Pour les vidéos : image du moment à corriger avec le squelette. |
| 🥗 **Calories par photo** | Photographier un aliment → reconnaissance sur le téléphone (ML Kit) → propositions d'aliments → choix de la quantité → **calories, protéines, glucides, lipides, fibres, sucre**, **note santé A–E** (« bon pour la santé » ou non) et remarques personnalisées (diabète, tension, cholestérol, objectif, calories restantes). |
| 🍎 **139 aliments** | Fruits, légumes, légumineuses, féculents, viandes/poissons, laitages, fruits secs, **plats tunisiens** (couscous, lablabi, ojja, brik, kafteji, mloukhia, fricassé, makroudh…), fast-food, boissons. Journal du jour avec anneau de calories. |
| 🩺 **Conseils santé (نصائح)** | Conseil du jour, 18 conseils nutrition/hydratation/sommeil, page « science de l'entraînement » (Schoenfeld, ISSN, OMS), adaptations genoux / dos. |

## La science utilisée

- **Volume** : 10–20 séries par muscle et par semaine (méta-analyse Schoenfeld 2017).
- **Fréquence** : chaque muscle ~2×/semaine, 48–72 h de récupération.
- **Répétitions** : force 4–6, muscle 8–12, perte de gras 12–15, près de l'échec.
- **Protéines** : 1,4–2,2 g/kg/jour selon l'objectif (ISSN 2017, Morton 2018).
- **Énergie** : Mifflin-St Jeor × niveau d'activité ; −20 % (max −500 kcal) pour perdre, +250 kcal pour prendre du muscle.
- **OMS** : 150–300 min d'activité/semaine + renforcement 2 j/semaine ; sucres < 10 % des calories ; sel < 5 g/jour.

⚕️ FitCoach donne des conseils généraux ; il ne remplace pas un médecin.

## Limites honnêtes

- Sans IA avancée, la reconnaissance photo hors-ligne (ML Kit) donne des étiquettes générales (« fruit », « pain », « pizza ») : elle **propose** des aliments, **l'utilisateur confirme** l'aliment et la quantité. Le code-barres donne le produit exact. L'IA avancée (Claude) reconnaît beaucoup plus de plats, mais les grammes restent des estimations.
- Les comptes restent sur le téléphone (pas de serveur) : pas de synchronisation entre appareils ni de vérification d'e-mail. Un compte « Google » est lié au téléphone où il a été créé.
- Le mode docteur donne des repères généraux (OMS, ACC/AHA, ADA) : il ne remplace pas un médecin.
- L'IA avancée nécessite Internet et une clé API Anthropic payante ; la photo est alors envoyée à Anthropic. La clé est stockée uniquement sur le téléphone.
- L'analyse de posture fonctionne mieux **de profil, corps entier visible, à 2–3 m**. Elle ne voit pas la courbure fine du dos.
- Les « vidéos explicatives » intégrées sont des animations ; le bouton YouTube ouvre des vidéos réelles (Internet nécessaire).
- Les comptes sont locaux au téléphone (pas de serveur, pas de synchronisation entre appareils).

## Architecture

- `src/main/java/tn/fitcoach/MainActivity.kt` : WebView + pont `window.Android` (Keystore Android, empreinte/visage, sélecteur de compte Google, écran privé, modèle de plats AIY Food V1) : photo (caméra/galerie) → ML Kit Image Labeling + **Object Detection** (éléments de l'assiette) + **Barcode Scanning** ; requêtes Open Food Facts ; vidéo → extraction d'images → ML Kit Pose Detection ; images caméra en direct → Pose Detection ; synthèse vocale.
- `src/main/assets/www/` : interface HTML/CSS/JS
  - `app.js` (comptes, planificateur, programme, santé, nutrition, assiette, code-barres, IA, coach caméra, profil), `secure.js` (chiffrement), `program.js` (programme 16 semaines), `health.js` (mode docteur), `pose.js` (analyse des angles et règles de correction), `figure.js` (personnage 3D animé), `bodymap.js` (carte du corps), `i18n.js` (textes FR/EN/AR et conseils)
  - `vendor/anthropic-sdk.min.js` : SDK officiel Anthropic (TypeScript, licence Apache 2.0) empaqueté pour le navigateur, chargé seulement quand l'IA est utilisée
  - `data/exercises.js` + `exercises2.js` + `exercises3.js` (machines) (exercices, muscles, principes scientifiques), `data/foods.js` (base nutritionnelle).

```bash
./gradlew :fitcoach:assembleRelease   # → fitcoach/build/outputs/apk/release/fitcoach-{arm64-v8a,armeabi-v7a}-release.apk
```
Pour tester l'interface dans un navigateur : ouvrir `src/main/assets/www/index.html` (les fonctions IA nécessitent l'APK).
