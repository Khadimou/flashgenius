# Guide Élève — FlashGenius

Comment utiliser FlashGenius pour réviser efficacement avec les cours de ton professeur.

---

## 1. Créer un compte

1. Va sur [flashgenius-rho.vercel.app](https://flashgenius-rho.vercel.app)
2. Entre ton email → reçois un lien de connexion
3. (Optionnel) Définis un mot de passe depuis **Mon compte** pour te connecter directement la prochaine fois

---

## 2. Rejoindre un cours

Ton professeur t'envoie un lien du type :
```
https://flashgenius-rho.vercel.app/join/[identifiant]
```

1. Ouvre ce lien
2. Tu vois le nom du cours, le professeur et le nombre de cartes
3. Clique **"Rejoindre ce cours"**
4. Tu es redirigé vers tes cours (`/app/courses`)

Tu peux aussi rejoindre depuis le profil public du prof : `/teacher/[slug]`

---

## 3. Réviser un cours

Dans **Mes cours** (`/app/courses`), chaque cours affiche son statut :

### ✅ En révision — Accès libre
Deux modes de révision disponibles :

**Révision classique**
- Les cartes défilent une par une
- Tu te notes si tu savais ou non
- Score et récapitulatif à la fin

**Révision SR (Répétition Espacée)**
- Algorithme SM-2 : les cartes difficiles reviennent plus souvent
- Chaque réponse "Facile / Bien / À revoir" ajuste l'intervalle de révision
- Le badge orange sur la carte indique combien de cartes sont dues aujourd'hui

### 🔒 Mode examen — Accès bloqué
Le professeur a masqué les cartes pour te pousser à travailler de mémoire. Tu vois :
> "Révisions masquées par votre professeur jusqu'à l'examen"

Les cartes redeviennent accessibles quand le prof repasse en mode révision.

---

## 4. Créer tes propres flashcards

Tu n'es pas limité aux cours partagés : tu peux créer tes propres decks.

1. Va dans **Générer** (`/app/generate`)
2. Colle n'importe quel texte (cours, Wikipedia, tes notes...)
3. L'IA génère les questions/réponses automatiquement
4. Modifie les cartes à ta convenance
5. Sauvegarde dans ta bibliothèque

**Limite gratuite :** 10 générations par mois.

---

## 5. La répétition espacée — comment ça marche ?

L'algorithme SM-2 calcule automatiquement quand chaque carte doit être revue :
- Si tu réponds **"Facile"** → la carte revient dans longtemps (plusieurs semaines)
- Si tu réponds **"À revoir"** → la carte revient dès la prochaine session
- Plus tu réponds correctement, plus l'intervalle s'allonge

**Conseil :** fais une courte session SR tous les jours plutôt qu'une longue révision la veille de l'examen. C'est la méthode la plus efficace scientifiquement prouvée pour la mémorisation à long terme.
