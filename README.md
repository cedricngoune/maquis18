# Maquis 18

Site vitrine d'un restaurant de cuisine africaine pour particulier.
## Stacks techniques

- `apps/api` — API NestJS + Prisma + PostgreSQL (documentation Swagger sur `/docs`)
- `apps/web` — site Next.js (App Router)
- `packages/shared` — types et utilitaires partagés entre le front et l'API

## Prérequis

- Node.js 20+ et Yarn 1 (`npm i -g yarn`)
- Docker Desktop (pour PostgreSQL)

## Démarrage

```bash
yarn install                              # 1. dépendances de tout le monorepo
cp apps/api/.env.example apps/api/.env    # 2. variables d'environnement
cp apps/web/.env.example apps/web/.env
yarn db:up                                # 3. lance PostgreSQL dans Docker
yarn db:migrate --name init               # 4. crée les tables
yarn db:seed                              # 5. remplit la carte et les horaires
yarn dev                                  # 6. lance l'API (3001) et le site (3000)
```

- Site : http://localhost:3000
- API : http://localhost:5000/menu
- Swagger : http://localhost:5000/docs

## Feuille de route

1. ✅ Monorepo, PostgreSQL, schéma Prisma, seed, module `menu`
2. Intégration de la maquette (page d'accueil complète)
3. Réservations (API + formulaire)
4. Authentification admin + back-office
5. Déploiement (Vercel + Railway/Render)
