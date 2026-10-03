# FlashGenius

Landing page de validation + application web de flashcards generees par IA.

## Stack
- **Next.js 14** (App Router) · **TypeScript** · **Tailwind CSS**
- **Prisma** + **Neon PostgreSQL** (app data)
- **NextAuth v4** + **Resend** (magic link auth)
- **OpenAI gpt-4o-mini** (generation flashcards)
- **Vercel KV / Upstash** (waitlist landing page)

## Demarrage

```bash
npm install
npx prisma db push        # Cree les tables (DATABASE_URL requis)
npm run dev
# → http://localhost:3000
```

En dev, le magic link est logue dans le terminal (pas d'email envoye).

## Pages

| URL | Description |
|---|---|
| `/` | Landing page |
| `/login` | Connexion magic link |
| `/app` | Dashboard flashcards |
| `/app/generate` | Generer des flashcards depuis un texte |
| `/app/library` | Bibliotheque des decks |
| `/app/deck/[id]` | Detail d'un deck (grille + edition) |
| `/app/review/[id]` | Revision classique |
| `/app/sr` | Dashboard revision espacee (SM-2) |
| `/app/sr/[id]` | Session SR pour un deck |
| `/dashboard` | Dashboard waitlist admin |

## Configuration

Copie `.env.local.example` en `.env.local` et remplis :

1. **Neon** : cree un projet sur neon.tech, copie `DATABASE_URL` et `DIRECT_URL`
2. **NEXTAUTH_SECRET** : `openssl rand -base64 32`
3. **OpenAI** : cle API sur platform.openai.com
4. **Resend** (prod uniquement) : cle API sur resend.com

## Deploiement Vercel

```bash
git add . && git commit -m "feat: app flashcards" && git push
```

Variables a ajouter sur Vercel (Settings → Environment Variables) :
`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`,
`OPENAI_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`

Pour les migrations Vercel : ajoute en build command :
`prisma generate && prisma db push && next build`
