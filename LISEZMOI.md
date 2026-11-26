# Assistant IA pour Word — version LM Studio

Un panneau à droite de Word pour **reformuler, corriger, résumer, expliquer** le texte sélectionné, avec :

- **LM Studio** : l'IA tourne sur votre PC. C'est **gratuit** et **rien ne sort de l'ordinateur**, ce qui convient aux documents confidentiels.
- ou **Claude** (en option) : plus performant, mais payant à l'usage.

> **Vous n'avez aucun fichier à modifier.** L'adresse de LM Studio se règle dans le panneau, avec le bouton ⚙, et elle est déjà remplie par défaut.

---

## Étape 1 — Préparer LM Studio (10 min, une seule fois)

1. Ouvrez **LM Studio**.
2. Onglet **Discover** (la loupe) : téléchargez un modèle « Instruct » qui écrit bien en français, par exemple **Qwen3 8B**, **Mistral 7B Instruct** ou **Gemma 3**. Choisissez une taille adaptée à votre PC, LM Studio l'indique.
3. Allez dans l'onglet **Developer** (icône de terminal, à gauche).
4. En haut, cliquez sur **Select a model to load**, puis choisissez votre modèle.
   Dans les options de chargement, réglez **Context Length** sur **8192** ou plus (**16384** pour travailler sur des documents entiers). Cliquez sur **Load**.
5. Dans les réglages du serveur (**Settings**), activez **Enable CORS**.
   ⚠️ C'est indispensable : sans cette option, Word ne peut pas parler à LM Studio.
6. Passez le **Status** sur **Running** (démarrage du serveur).
   LM Studio affiche une adresse du type `http://127.0.0.1:1234`. Si le nombre à la fin n'est pas **1234**, notez-le.

👉 **LM Studio doit rester ouvert, serveur démarré, chaque fois que vous utilisez le panneau.**

## Étape 2 — Mettre le panneau en ligne sur GitHub (15 min, une seule fois)

*Pourquoi ? Un complément Word est une petite page web que Word affiche. Word va la chercher sur internet, à une adresse sécurisée (https). GitHub l'héberge gratuitement. Vos textes, eux, ne passent jamais par GitHub.*

À faire **sur l'ordinateur**, dans Chrome ou Edge :

1. Connectez-vous sur **github.com**.
2. En haut à droite, cliquez sur **+** → **New repository**.
3. **Repository name** : `assistant-ia-word`. Cochez **Public**, puis cliquez sur **Create repository**.
4. Sur la page suivante, cliquez sur le lien **uploading an existing file**.
5. Décompressez le zip. Ouvrez le dossier `assistant-ia-word`, sélectionnez **tout son contenu** (les fichiers et le dossier `assets`) et glissez-le dans la page GitHub. Cliquez sur **Commit changes**.
6. Onglet **Settings** → menu de gauche **Pages** :
   - Source : **Deploy from a branch**
   - Branch : **main** et **/ (root)** → **Save**
7. Patientez 1 à 2 minutes.

## Étape 3 — Tester dans le navigateur (5 min)

1. Ouvrez cette adresse dans Chrome ou Edge, en remplaçant `votre-pseudo` par votre pseudo GitHub, **en minuscules** :
   `https://votre-pseudo.github.io/assistant-ia-word/taskpane.html`
2. Les paramètres s'ouvrent tout seuls. **LM Studio** est déjà choisi et l'adresse est déjà remplie.
3. Cliquez sur **Tester la connexion**.
   - Si le navigateur demande d'**accéder aux appareils du réseau local**, cliquez sur **Autoriser**.
   - Un message **vert ✓ Connecté** doit s'afficher.
4. Cliquez sur **Enregistrer**, collez un paragraphe dans la zone de texte, puis cliquez sur **Reformuler**.

✅ Si vous obtenez une réponse, tout fonctionne.

## Étape 4 — Télécharger le manifeste (1 min)

Sur cette même page, cliquez sur **⬇ Télécharger le manifeste pour Word**.
Un fichier `manifest.xml` arrive dans vos Téléchargements, **déjà rempli avec la bonne adresse**. Vous n'avez rien à y modifier.

## Étape 5 — Installer dans Word sur le PC (10 min, une seule fois)

⚠️ Utilisez **Word installé sur le PC** : Word sur le web (office.com) ne peut pas se connecter à LM Studio, car le navigateur bloque cette connexion.

1. Créez un dossier `C:\ComplementsWord` et copiez-y le `manifest.xml` téléchargé.
2. Faites un clic droit sur ce dossier → **Propriétés** → onglet **Partage** → **Partager…** → **Partager**.
   Notez le **chemin réseau** affiché, du type `\\NOM-DU-PC\ComplementsWord`.
3. Dans Word : **Fichier** → **Options** → **Centre de gestion de la confidentialité** → **Paramètres du Centre de gestion de la confidentialité** → **Catalogues de compléments approuvés**.
4. Collez le chemin réseau dans **URL du catalogue** → **Ajouter un catalogue** → cochez **Afficher dans le menu** → **OK**.
5. **Fermez Word**, puis rouvrez-le.
6. **Accueil** → **Compléments** → **Avancé** → onglet **DOSSIER PARTAGÉ** → **Assistant IA** → **Ajouter**.

*Si ces options sont grisées, le service informatique bloque l'installation de compléments. Demandez-lui de déployer le `manifest.xml` depuis le Centre d'administration Microsoft 365, rubrique « Applications intégrées ».*

## Étape 6 — Premier lancement dans Word

1. **Accueil** → bouton **Assistant IA** : le panneau s'ouvre à droite.
2. Les paramètres s'ouvrent : cliquez sur **Tester la connexion** (et **Autoriser** si Word le demande), puis sur **Enregistrer**.
   *Les réglages de Word sont séparés de ceux du navigateur, c'est pourquoi on refait ce test une fois.*

C'est prêt ✅

---

## 📍 Où mettre l'adresse de LM Studio ?

Dans le panneau, bouton **⚙** → champ **Adresse du serveur**.

- Par défaut : `http://localhost:1234/v1`. Ne changez rien si LM Studio affiche le port **1234**.
- Si LM Studio affiche un autre port, par exemple `http://127.0.0.1:5678`, collez-le tel quel. Le panneau complète l'adresse tout seul.
- Le champ **Modèle** peut rester sur **Automatique** : le panneau utilise le modèle chargé. Après **Tester la connexion**, vous pouvez aussi choisir un modèle dans la liste.

---

## Utilisation

- **Sélectionnez** un passage dans Word : il apparaît en haut du panneau.
- Cliquez sur une **action** : Reformuler, Corriger, Plus concis, Style rapport, Développer, Résumer, Expliquer ou Traduire (EN).
- Choisissez où va le résultat : **Remplacer la sélection**, **Insérer après**, **En commentaire** ou **Copier**.
- Pour affiner, écrivez dans la zone du bas (« plus court », « plus technique »…), puis appuyez sur **Entrée**.
- La case **Tout le document** sert à résumer ou interroger le document entier (il faut une Context Length suffisante).
- **■** arrête une réponse en cours. **↺** repart d'une conversation vierge.

**Bon à savoir avec LM Studio :**
- La vitesse dépend de votre PC. Sans carte graphique, comptez quelques secondes à une minute par paragraphe.
- La première demande est plus lente, le temps que le modèle démarre.
- Les modèles locaux sont bons pour corriger et reformuler, mais moins fins que Claude sur des textes longs ou délicats.

## Passer à Claude (optionnel)

**⚙** → **Moteur IA** : choisissez **Claude**, collez votre clé API (créée sur console.anthropic.com), puis **Enregistrez**. Le badge en haut du panneau indique le moteur actif. Vous pouvez revenir à LM Studio à tout moment.

## Personnaliser les boutons (optionnel)

Au début du fichier `taskpane.js`, la liste `ACTIONS` contient les boutons. Pour en ajouter un sur GitHub : ouvrez `taskpane.js`, cliquez sur l'icône **crayon**, copiez une ligne, modifiez-la, puis **Commit changes**. Par exemple :

```js
  { label: "Mail client", mode: "texte",
    consigne: "Transforme ce texte en un e-mail clair et courtois destiné à un maître d'ouvrage." },
```

---

## Dépannage

| Message ou problème | Solution |
|---|---|
| « Impossible de joindre LM Studio » | Dans LM Studio, onglet Developer : Status sur **Running**, **Enable CORS** activé, un modèle chargé. |
| Demande d'accès au réseau local | Cliquez sur **Autoriser** : c'est le panneau qui demande à parler à LM Studio. |
| « Texte trop long pour le modèle » | Rechargez le modèle avec une **Context Length** plus grande (16384), ou sélectionnez moins de texte. |
| « Modèle introuvable » | ⚙ → **Tester la connexion**, puis choisissez un modèle dans la liste. |
| Réponses en anglais ou de mauvaise qualité | Essayez un autre modèle (Qwen3, Mistral, Gemma) ou un modèle plus grand si le PC le permet. |
| Le panneau reste blanc dans Word | Vérifiez que la page de l'étape 3 s'ouvre bien, puis retéléchargez le manifeste (étape 4). |
| Une modification sur GitHub n'apparaît pas | Fermez complètement Word, puis rouvrez-le. |
