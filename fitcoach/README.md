# FitCoach — coach sportif et nutrition personnel (FR / EN / عربي)

Application Android : **entraînement musculaire guidé**, **correction de posture par caméra (IA)**, **calories par photo** et **conseils santé**, en **français, anglais ou arabe**.

📥 **APK : [`apk/FitCoach.apk`](../apk/FitCoach.apk)** (version 1.0, Android 8.0+, ~69 Mo, fonctionne hors-ligne sauf les vidéos YouTube)

> Installation : copier l'APK sur le téléphone → l'ouvrir → autoriser « Installer des applications inconnues ».

## Fonctionnalités

| Module | Ce qu'il fait |
|---|---|
| 🔐 **Comptes** | Chaque utilisateur crée un login + mot de passe (haché PBKDF2-SHA256). Les données de chacun sont séparées et restent sur le téléphone. |
| 🌐 **3 langues** | Français, English, العربية (interface en RTL pour l'arabe), changeable à tout moment. |
| 🧍 **Corps idéal** | Selon sexe, âge, taille, poids, tour de taille : IMC et catégorie, **poids santé pour votre taille**, poids idéal, % de graisse estimé et cible, rapport taille/hauteur, métabolisme de base, dépense journalière, **calories, protéines, glucides, lipides, fibres, sucre max et eau par jour**, conseil selon l'âge. |
| 🏋️ **28 exercices** pour 10 groupes musculaires | Pectoraux, dos, épaules, biceps, triceps, abdos, fessiers, quadriceps, ischios, mollets — **avec et sans matériel**. Pour chacun : démonstration animée, étapes de la bonne position, erreurs fréquentes, astuce, séries/répétitions/repos adaptés à votre objectif, lien vers des vidéos. |
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

- La reconnaissance photo propose des aliments (étiquettes générales comme « fruit », « pain », « pizza ») : **l'utilisateur confirme toujours l'aliment et la quantité**. Une estimation précise du poids d'une assiette n'est pas possible avec une seule photo.
- L'analyse de posture fonctionne mieux **de profil, corps entier visible, à 2–3 m**. Elle ne voit pas la courbure fine du dos.
- Les « vidéos explicatives » intégrées sont des animations ; le bouton YouTube ouvre des vidéos réelles (Internet nécessaire).
- Les comptes sont locaux au téléphone (pas de serveur, pas de synchronisation entre appareils).

## Architecture

- `src/main/java/tn/fitcoach/MainActivity.kt` : WebView + pont `window.Android` : photo (caméra/galerie) → ML Kit Image Labeling ; vidéo → extraction d'images → ML Kit Pose Detection ; images caméra en direct → Pose Detection ; synthèse vocale.
- `src/main/assets/www/` : interface HTML/CSS/JS
  - `app.js` (comptes, planificateur, nutrition, coach caméra, profil), `pose.js` (analyse des angles articulaires et règles de correction), `figure.js` (animations des exercices), `i18n.js` (textes FR/EN/AR et conseils)
  - `data/exercises.js` (exercices, muscles, principes scientifiques), `data/foods.js` (base nutritionnelle).

```bash
./gradlew :fitcoach:assembleRelease   # → fitcoach/build/outputs/apk/release/fitcoach-release.apk
```
Pour tester l'interface dans un navigateur : ouvrir `src/main/assets/www/index.html` (les fonctions IA nécessitent l'APK).
