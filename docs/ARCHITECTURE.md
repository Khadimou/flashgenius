# Architecture — FlashGenius

## Structure du projet

```
flashgenius/
├── app/                     # Next.js App Router
│   ├── api/                 # Routes API (server-side)
│   │   ├── account/         # Profil, mot de passe, rôle
│   │   ├── cards/           # CRUD cartes
│   │   ├── courses/         # Cours enseignant/élève
│   │   ├── decks/           # CRUD decks + partage
│   │   ├── export/          # Export CSV et PDF
│   │   ├── folders/         # CRUD dossiers
│   │   ├── generate/        # Génération IA (quota)
│   │   ├── join/            # Inscription cours
│   │   ├── sr/              # Résultats révision espacée
│   │   ├── teacher/         # Profil public enseignant
│   │   └── transcribe/      # Transcription Whisper
│   ├── app/                 # Pages de l'app (auth requise)
│   │   ├── account/         # Mon compte
│   │   ├── courses/         # Cours enseignant/élève
│   │   ├── deck/[id]/       # Détail deck
│   │   ├── generate/        # Génération flashcards
│   │   ├── library/         # Bibliothèque
│   │   ├── review/[id]/     # Révision classique
│   │   └── sr/              # Révision espacée
│   ├── join/[deckId]/       # Page d'invitation (public)
│   ├── teacher/[slug]/      # Profil enseignant (public)
│   ├── login/               # Page de connexion
│   └── page.tsx             # Landing page
├── components/
│   ├── app/                 # Composants de l'app
│   │   ├── Sidebar.tsx      # Navigation
│   │   ├── FlashCard.tsx    # Composant carte
│   │   ├── CardEditor.tsx   # Éditeur de carte
│   │   ├── AccountForm.tsx  # Formulaire compte/profil
│   │   └── ...
│   └── ...
├── lib/
│   ├── auth.ts              # Configuration NextAuth
│   ├── prisma.ts            # Client Prisma singleton
│   └── openai.ts            # Client OpenAI + prompt génération
├── prisma/
│   └── schema.prisma        # Schéma de données
└── docs/                    # Documentation
```

## Flux de données principaux

### Génération de flashcards
```
Client (page.tsx)
  → POST /api/generate { text }
  → Vérification session (NextAuth JWT)
  → Vérification quota mensuel (Prisma → User.generationsCount)
  → OpenAI gpt-4o-mini (lib/openai.ts)
  → Incrément du compteur (Prisma)
  → Retour { cards[], usage{} }
```

### Transcription Whisper (Premium)
```
Client (page.tsx)
  → POST /api/transcribe (multipart/form-data, max 26MB)
  → Vérification session + isPremium
  → Buffer → toFile (openai)
  → OpenAI whisper-1 { language: 'fr' }
  → Retour { transcript }
```

### Inscription à un cours
```
Élève ouvre /join/[deckId]
  → GET /api/join/[deckId] (public)
    → Prisma: deck où shareStatus = REVISION
  → Affiche infos cours
  → POST /api/join/[deckId] (auth requise)
    → Prisma: Enrollment.upsert({ studentId, deckId })
  → Redirect vers /app/courses
```

### Contrôle accès cours
```
Élève ouvre /app/review/[id]
  → GET /api/decks/[id]
    → Prisma: deck où userId = currentUser (propriétaire)
    → OU: Enrollment existe + shareStatus = REVISION
    → Si shareStatus = EXAM → 404 (pas de cartes)
  → Révision normale
```

## Sécurité

- **Sessions JWT** : signées avec `NEXTAUTH_SECRET`, durée 90 jours
- **Vérification d'appartenance** : toutes les mutations (PUT/DELETE deck, PATCH share) vérifient `userId === session.user.id`
- **Rôle enseignant** : le PATCH `/api/decks/[id]/share` vérifie `user.role === 'TEACHER'`
- **Premium gate** : `/api/transcribe` vérifie `user.isPremium` en DB (pas dans le token JWT — mis à jour en temps réel)
- **Quota** : vérifié en DB avant chaque appel OpenAI, reset automatique mensuel

## Modèles OpenAI utilisés

| Fonctionnalité | Modèle | Coût approximatif |
|---|---|---|
| Génération flashcards | `gpt-4o-mini` | ~$0.001 par génération |
| Transcription audio/vidéo | `whisper-1` | $0.006 / minute d'audio |
