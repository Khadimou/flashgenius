# ⚡ FlashGenius

> Génère des flashcards depuis n'importe quel texte, vidéo ou audio — avec répétition espacée (SM-2) et un espace enseignant/élève intégré.

**Production** → [flashgenius-rho.vercel.app](https://flashgenius-rho.vercel.app)  
**Stack** → Next.js 14 · TypeScript · Tailwind · Prisma · Neon · OpenAI · Vercel

---

## Sommaire

1. [Fonctionnalités](#fonctionnalités)
2. [Stack technique](#stack-technique)
3. [Installation locale](#installation-locale)
4. [Variables d'environnement](#variables-denvironnement)
5. [Schéma de données](#schéma-de-données)
6. [Référence API](#référence-api)
7. [Rôles utilisateurs](#rôles-utilisateurs)
8. [Limites d'utilisation](#limites-dutilisation)
9. [Fonctionnalités Premium](#fonctionnalités-premium)
10. [Déploiement Vercel](#déploiement-vercel)

---

## Fonctionnalités

### Génération de flashcards (IA)
- Coller du texte (cours, notes, articles) → l'IA génère des paires question/réponse catégorisées
- Import de fichier `.txt` / `.md` directement dans l'éditeur
- Import **vidéo/audio** (mp4, mp3, m4a, wav, webm…) → transcription Whisper → génération *(Premium)*
- Limite : 10 générations/mois pour les comptes gratuits, illimité pour Premium
- Modèle : `gpt-4o-mini` (génération) · `whisper-1` (transcription)

### Révision
- **Mode classique** (`/app/review/[id]`) — flip des cartes, score en fin de session
- **Répétition espacée SM-2** (`/app/sr/[id]`) — algorithme SuperMemo 2, priorité aux cartes dues
- Dashboard SR (`/app/sr`) — toutes les cartes dues de tous les decks

### Gestion des decks
- Créer, renommer, supprimer des decks
- Organisation par **dossiers**
- Ajout/édition/suppression de cartes individuelles
- Export **CSV** et **PDF** de chaque deck

### Espace enseignant / élève
- Un utilisateur peut passer en **mode enseignant** depuis son compte
- Le prof partage ses decks avec 3 statuts : `DRAFT` → `REVISION` → `EXAM`
- Un lien d'invitation `/join/[deckId]` permet à un élève de rejoindre un cours
- En mode **EXAM** : les cartes sont masquées pour les élèves inscrits
- Profil public enseignant : `/teacher/[slug]`

### Authentification
- Magic link (email sans mot de passe)
- Email + mot de passe (optionnel, défini depuis le compte)
- Sessions JWT 90 jours

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 14 (App Router, Server Components) |
| Langage | TypeScript |
| UI | Tailwind CSS, composants maison |
| ORM | Prisma 5.17 |
| Base de données | Neon (PostgreSQL serverless) |
| Auth | NextAuth v4 (JWT, magic link + credentials) |
| Email | Nodemailer / Gmail SMTP |
| IA génération | OpenAI `gpt-4o-mini` |
| IA transcription | OpenAI `whisper-1` |
| KV (waitlist) | Upstash Redis (via Vercel KV) |
| Déploiement | Vercel |

---

## Installation locale

```bash
# 1. Cloner le repo
git clone https://github.com/Khadimou/flashgenius.git
cd flashgenius

# 2. Installer les dépendances
npm install

# 3. Créer le fichier d'environnement
cp .env.example .env
# Remplir les variables (voir section suivante)

# 4. Synchroniser le schéma Prisma avec la DB
npx --package=prisma@5.17.0 prisma db push

# 5. Lancer le serveur de dev
npm run dev
# → http://localhost:3000
```

> En développement, le magic link est loggé dans le terminal (pas d'email envoyé).

---

## Variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
# ── Base de données (Neon) ──────────────────────────────────────────
# URL de connexion avec pooling (pour les queries Prisma)
POSTGRES_PRISMA_URL="postgresql://user:pass@host/neondb?pgbouncer=true&connect_timeout=15"

# URL directe sans pooling (pour les migrations Prisma)
POSTGRES_URL_NON_POOLING="postgresql://user:pass@host/neondb?connect_timeout=15"

# ── NextAuth ────────────────────────────────────────────────────────
# Clé secrète (générer avec: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-here"

# URL de l'app (http://localhost:3000 en dev, URL Vercel en prod)
NEXTAUTH_URL="http://localhost:3000"

# ── OpenAI ──────────────────────────────────────────────────────────
OPENAI_API_KEY="sk-..."

# ── Email (Gmail SMTP) ──────────────────────────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="ton.email@gmail.com"
# Mot de passe d'application Gmail (pas le mot de passe du compte)
SMTP_PASS="xxxx xxxx xxxx xxxx"
EMAIL_FROM="FlashGenius <ton.email@gmail.com>"

# ── Upstash / Vercel KV (landing page waitlist uniquement) ─────────
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
```

### Obtenir les credentials Neon

1. Créer un compte sur [neon.tech](https://neon.tech)
2. Nouveau projet → copier les deux URLs depuis "Connection Details"
3. Sélectionner "Prisma" comme framework pour obtenir le format exact

### Obtenir un mot de passe d'application Gmail

1. Activer la validation en deux étapes sur le compte Google
2. Compte Google → Sécurité → Mots de passe des applications
3. Générer un mot de passe pour "Mail"

---

## Schéma de données

```
User
├── id, email, name, password, emailVerified
├── isPremium (Boolean)          — accès Whisper + génération illimitée
├── generationsCount (Int)       — compteur mensuel
├── generationsResetAt (DateTime)— date de remise à zéro
├── role (Role)                  — STUDENT | TEACHER
├── bio, subject, slug           — profil enseignant public
├── decks[]                      — decks créés
└── enrollments[]                — cours rejoints (élève)

Deck
├── id, name, userId, folderId
├── shareStatus (DeckStatus)     — DRAFT | REVISION | EXAM
├── cards[]
└── enrollments[]                — élèves inscrits

Enrollment
├── studentId → User
└── deckId    → Deck

Card
├── question, answer, category
├── easeFactor, interval, repetitions — données SM-2
└── dueDate                            — prochaine révision

Folder
└── name, userId, decks[]
```

---

## Référence API

### Authentification
Toutes les routes `/api/*` (sauf `/api/join/[deckId]` GET et `/api/teacher/[slug]`) nécessitent une session valide.

### Compte

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/account/me` | Profil complet de l'utilisateur connecté |
| `POST` | `/api/account/password` | Définir ou changer le mot de passe |
| `PATCH` | `/api/account/profile` | Modifier nom, bio, matière, slug |
| `POST` | `/api/account/role` | Passer en mode enseignant (génère le slug) |

### Decks

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/decks` | Liste des decks de l'utilisateur |
| `POST` | `/api/decks` | Créer un deck avec ses cartes |
| `GET` | `/api/decks/[id]` | Détail d'un deck (propriétaire **ou** élève inscrit en REVISION) |
| `PUT` | `/api/decks/[id]` | Renommer ou déplacer dans un dossier |
| `DELETE` | `/api/decks/[id]` | Supprimer le deck et ses cartes |
| `POST` | `/api/decks/[id]/cards` | Ajouter une carte au deck |
| `PATCH` | `/api/decks/[id]/share` | Changer le statut de partage (enseignant uniquement) |

**Corps pour `/api/decks/[id]/share` :**
```json
{ "status": "DRAFT" | "REVISION" | "EXAM" }
```

### Cartes

| Méthode | Route | Description |
|---|---|---|
| `PUT` | `/api/cards/[id]` | Modifier question/réponse/catégorie |
| `DELETE` | `/api/cards/[id]` | Supprimer une carte |
| `POST` | `/api/sr/[cardId]` | Enregistrer le résultat d'une révision SR (met à jour SM-2) |

### Génération IA

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/generate` | Générer des flashcards depuis un texte (vérifie quota mensuel) |
| `POST` | `/api/transcribe` | Transcrire un fichier audio/vidéo avec Whisper *(Premium)* |

**Corps pour `/api/generate` :**
```json
{ "text": "contenu à mémoriser (20–30 000 caractères)" }
```

**Réponse `/api/generate` :**
```json
{
  "cards": [{ "question": "...", "answer": "...", "category": "..." }],
  "usage": { "used": 3, "limit": 10, "isPremium": false }
}
```

**Erreur quota (HTTP 429) :**
```json
{
  "error": "Limite atteinte — 10 générations gratuites par mois...",
  "limitReached": true,
  "limit": 10,
  "used": 10,
  "resetAt": "2026-11-01T00:00:00.000Z"
}
```

**Corps pour `/api/transcribe` :** `multipart/form-data` avec champ `file`  
Formats acceptés : `mp4, mp3, m4a, wav, webm, mpeg, mpga, ogg` — max **25 MB**

### Cours (espace enseignant/élève)

| Méthode | Route | Description | Auth |
|---|---|---|---|
| `GET` | `/api/courses` | Enseignant : decks partagés · Élève : cours rejoints | Oui |
| `GET` | `/api/join/[deckId]` | Infos publiques d'un cours (titre, prof, nb cartes) | Non |
| `POST` | `/api/join/[deckId]` | S'inscrire à un cours | Oui |
| `GET` | `/api/teacher/[slug]` | Profil public d'un enseignant + ses cours | Non |

### Export & Dossiers

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/export/deck/[id]` | Télécharger le deck en CSV |
| `GET` | `/api/export/deck/[id]/pdf` | Télécharger le deck en PDF |
| `GET` | `/api/folders` | Liste des dossiers |
| `POST` | `/api/folders` | Créer un dossier |
| `DELETE` | `/api/folders/[id]` | Supprimer un dossier |

---

## Rôles utilisateurs

### STUDENT (défaut)
- Générer des flashcards (quota 10/mois)
- Réviser ses propres decks
- Rejoindre les cours d'un enseignant via lien d'invitation
- Réviser les cartes des cours rejoints (bloqué en mode EXAM)

### TEACHER
Toutes les capacités STUDENT, plus :
- Partager ses decks avec un lien d'invitation
- Contrôler le statut : `DRAFT` (privé) → `REVISION` (visible) → `EXAM` (masqué)
- Voir le nombre d'élèves inscrits par cours
- Profil public accessible sur `/teacher/[slug]`

**Activation :** Compte → "Activer le mode enseignant" (irréversible via UI, modifiable en DB)

---

## Limites d'utilisation

| Tier | Générations IA/mois | Transcription Whisper | Decks/dossiers |
|---|---|---|---|
| Gratuit | 10 | ✗ | Illimités |
| Premium | Illimité | ✓ (max 25 MB/fichier) | Illimités |

**Reset mensuel :** automatique le 1er du mois, sans intervention.

**Activer Premium en DB (SQL) :**
```sql
UPDATE "User" SET "isPremium" = true WHERE email = 'user@example.com';
```

**Constante à modifier pour changer la limite gratuite :**  
Fichier `app/api/generate/route.ts`, ligne 1 :
```typescript
const FREE_MONTHLY_LIMIT = 10  // ← modifier ici
```

---

## Fonctionnalités Premium

### Transcription Whisper
1. Page `/app/generate` → bouton **"🎬 Vidéo / Audio"**
2. Sélectionner un fichier audio ou vidéo (max 25 MB)
3. Whisper transcrit → le texte apparaît dans la textarea
4. Cliquer **"Générer les flashcards"** comme d'habitude

Formats supportés : `mp4 · mp3 · m4a · wav · webm · mpeg · mpga · ogg`

---

## Déploiement Vercel

```bash
git push  # Vercel déploie automatiquement depuis main
```

**Variables à configurer sur Vercel** (Settings → Environment Variables) :

```
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
NEXTAUTH_SECRET
NEXTAUTH_URL           (URL de production, ex: https://flashgenius-rho.vercel.app)
OPENAI_API_KEY
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
EMAIL_FROM
KV_REST_API_URL        (si landing page avec waitlist)
KV_REST_API_TOKEN
```

**Build command Vercel** (pour que Prisma soit généré à chaque déploiement) :
```
npx prisma generate && npx prisma db push && next build
```

---

## Pages de l'application

| URL | Accès | Description |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Connexion (magic link ou email/mdp) |
| `/app` | Connecté | Tableau de bord |
| `/app/generate` | Connecté | Générer des flashcards (texte / fichier / vidéo) |
| `/app/library` | Connecté | Bibliothèque des decks et dossiers |
| `/app/deck/[id]` | Connecté | Détail d'un deck, édition des cartes, partage (enseignant) |
| `/app/review/[id]` | Connecté | Révision classique flip |
| `/app/sr` | Connecté | Dashboard répétition espacée |
| `/app/sr/[id]` | Connecté | Session SR pour un deck |
| `/app/courses` | Connecté | Enseignant : cours partagés · Élève : cours rejoints |
| `/app/account` | Connecté | Profil, mot de passe, mode enseignant |
| `/join/[deckId]` | Public | Rejoindre un cours via lien d'invitation |
| `/teacher/[slug]` | Public | Profil public d'un enseignant |
| `/dashboard` | Connecté | Admin waitlist |
