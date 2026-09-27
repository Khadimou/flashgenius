# FlashGenius — Landing Page

Landing page de validation pour FlashGenius : transforme automatiquement des cours en flashcards.

## Stack
- **Next.js 14** (App Router) · **Tailwind CSS** · **TypeScript**
- **Vercel KV** (Redis) pour le stockage en production

## Demarrage

```bash
npm install
npm run dev
# -> http://localhost:3000
```

En developpement, les donnees sont stockees dans `data/subscribers.json`.

## Pages

| URL | Description |
|---|---|
| `/` | Landing page principale |
| `/merci` | Confirmation + questionnaire post-inscription |
| `/dashboard` | Dashboard admin (protege) |
| `/api/export` | Export CSV (UTF-8 BOM pour Excel FR) |

## Dashboard

Basic Auth sur `/dashboard` :
- **User** : `admin`
- **Password** : `flashgenius` (ou `DASHBOARD_PASSWORD` dans les env vars)

## Deploiement Vercel

```bash
# 1. Push sur GitHub
git init && git add . && git commit -m "feat: FlashGenius landing"
git remote add origin https://github.com/TON_USER/flashgenius-landing.git
git push -u origin main

# 2. Importer sur vercel.com/new

# 3. (Optionnel) Storage persistant
#    Vercel Dashboard -> Storage -> Create KV Database
vercel link && vercel env pull .env.local
```

## Variables d'environnement Vercel

| Variable | Description |
|---|---|
| `KV_REST_API_URL` | URL Vercel KV |
| `KV_REST_API_TOKEN` | Token Vercel KV |
| `DASHBOARD_PASSWORD` | Mot de passe dashboard (defaut: flashgenius) |

> Sans KV : donnees dans `data/subscribers.json` en dev, en memoire en prod.
> Configure KV pour la production.

## Metriques trackees

- Total inscrits + taux completion questionnaire
- Cas d'usage (universite, examens, langues, certifications, pro, autre)
- Frequence (1-2x/sem, 3-5x/sem, quotidien)
- Appareil cible (iPhone, Android, Ordinateur)
- Intention (gratuit, payant, juste suivre)
- Export CSV complet
