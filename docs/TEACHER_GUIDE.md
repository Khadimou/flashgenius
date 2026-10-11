# Guide Enseignant — FlashGenius

Ce guide explique comment utiliser l'espace enseignant pour partager des cours et gérer l'accès de tes élèves.

---

## 1. Activer le mode enseignant

1. Connecte-toi à ton compte
2. Va dans **Mon compte** (`/app/account`)
3. Clique sur **"Activer le mode enseignant"**
4. Un slug est automatiquement généré pour ton profil public (ex: `dupont-svt`)
5. Tu peux personnaliser le slug, ta matière et ta bio dans la même page

---

## 2. Préparer un cours

Un cours dans FlashGenius, c'est un **deck de flashcards**.

### Option A — Générer depuis ton cours
1. Va dans **Générer** (`/app/generate`)
2. Colle le contenu de ton cours (jusqu'à 30 000 caractères)
3. Clique **"Générer les flashcards"** → l'IA crée les Q/R
4. Révise, modifie, supprime les cartes avant de sauvegarder
5. Donne un nom clair au deck (ex: "SVT — La mitose — Terminale")

### Option B — Créer manuellement
1. Va dans **Bibliothèque** (`/app/library`)
2. Crée un nouveau deck
3. Ajoute les cartes une par une

### Option C — Importer un fichier
Sur la page Générer, le bouton **"Importer un fichier (.txt, .md)"** charge automatiquement le contenu dans la zone de texte.

---

## 3. Partager le cours avec les élèves

1. Ouvre le deck depuis **Bibliothèque** ou **Mes cours** (`/app/courses`)
2. Clique sur **"▷ Publier pour les élèves"**  
   → Le deck passe en statut **REVISION** (visible par les élèves inscrits)
3. Clique sur **"🔗 Lien invitation"**  
   → L'URL `/join/[deckId]` est copiée dans ton presse-papier
4. Envoie ce lien à tes élèves (email, ENT, Pronote, etc.)

---

## 4. Les 3 statuts d'un cours

| Statut | Icône | Ce que voient les élèves |
|---|---|---|
| `DRAFT` | Brouillon | Rien (cours privé) |
| `REVISION` | 🟢 En révision | Les cartes sont accessibles, révision et SR disponibles |
| `EXAM` | 🟡 Mode examen | Message "Révisions masquées par votre professeur" |

**Cycle :** DRAFT → REVISION → EXAM → DRAFT  
Un clic sur le bouton de statut avance au statut suivant.

**Quand activer le mode EXAM ?**  
La veille ou le jour d'un contrôle : les élèves ne peuvent plus consulter les cartes, ce qui les pousse à travailler depuis leur mémoire plutôt que de relire les réponses.

---

## 5. Suivre les inscriptions

Dans **Mes cours** (`/app/courses`), chaque deck affiché montre :
- Le nombre de cartes
- Le nombre d'élèves inscrits
- Le statut actuel

---

## 6. Ton profil public

Ton profil est accessible sur :
```
https://flashgenius-rho.vercel.app/teacher/[ton-slug]
```

Il affiche :
- Ton nom et ta matière
- Ta bio (si renseignée)
- Tous tes cours en statut REVISION

Les élèves peuvent s'inscrire directement depuis cette page sans avoir besoin d'un lien d'invitation individuel.

---

## 7. Bonnes pratiques pédagogiques

**Nommer les decks clairement** — inclure le chapitre, le niveau et la notion principale.  
Exemple : `Biologie — Terminale — La photosynthèse`

**Catégories** — l'IA génère des catégories thématiques. Lors de la révision, les élèves voient le thème de chaque carte, ce qui les aide à structurer leurs connaissances.

**Rythme REVISION / EXAM** — publier en REVISION dès le début du chapitre, passer en EXAM la veille du contrôle. Revenir en REVISION après pour la révision du bac/trimestre.

**Plusieurs decks par chapitre** — tu peux créer un deck par notion (plus ciblé) plutôt qu'un seul gros deck. Les élèves peuvent s'inscrire aux deux.
