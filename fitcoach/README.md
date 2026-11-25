# FitCoach — coach sportif et nutrition personnel (FR / EN / عربي)

Application Android : **entraînement musculaire guidé**, **correction de posture par caméra (IA)**, **calories par photo** et **conseils santé**, en **français, anglais ou arabe**.

📥 **APK : [`apk/FitCoach.apk`](../apk/FitCoach.apk)** (version 2.0, Android 8.0+, ~81 Mo, fonctionne hors-ligne sauf code-barres, IA avancée et vidéos YouTube)

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
| 🔐 **Comptes** | Chaque utilisateur crée un login + mot de passe (haché PBKDF2-SHA256). Les données de chacun sont séparées et restent sur le téléphone. |
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
- L'IA avancée nécessite Internet et une clé API Anthropic payante ; la photo est alors envoyée à Anthropic. La clé est stockée uniquement sur le téléphone.
- L'analyse de posture fonctionne mieux **de profil, corps entier visible, à 2–3 m**. Elle ne voit pas la courbure fine du dos.
- Les « vidéos explicatives » intégrées sont des animations ; le bouton YouTube ouvre des vidéos réelles (Internet nécessaire).
- Les comptes sont locaux au téléphone (pas de serveur, pas de synchronisation entre appareils).

## Architecture

- `src/main/java/tn/fitcoach/MainActivity.kt` : WebView + pont `window.Android` : photo (caméra/galerie) → ML Kit Image Labeling + **Object Detection** (éléments de l'assiette) + **Barcode Scanning** ; requêtes Open Food Facts ; vidéo → extraction d'images → ML Kit Pose Detection ; images caméra en direct → Pose Detection ; synthèse vocale.
- `src/main/assets/www/` : interface HTML/CSS/JS
  - `app.js` (comptes, planificateur, nutrition, assiette, code-barres, IA, coach caméra, profil), `pose.js` (analyse des angles et règles de correction), `figure.js` (mannequin animé), `bodymap.js` (carte du corps), `i18n.js` (textes FR/EN/AR et conseils)
  - `vendor/anthropic-sdk.min.js` : SDK officiel Anthropic (TypeScript, licence MIT) empaqueté pour le navigateur, chargé seulement quand l'IA est utilisée
  - `data/exercises.js` + `data/exercises2.js` (exercices, muscles, principes scientifiques), `data/foods.js` (base nutritionnelle).

```bash
./gradlew :fitcoach:assembleRelease   # → fitcoach/build/outputs/apk/release/fitcoach-release.apk
```
Pour tester l'interface dans un navigateur : ouvrir `src/main/assets/www/index.html` (les fonctions IA nécessitent l'APK).
