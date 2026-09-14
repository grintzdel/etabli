# Établi

[![CI](https://github.com/grintzdel/etabli/actions/workflows/ci.yml/badge.svg)](https://github.com/grintzdel/etabli/actions/workflows/ci.yml)

Plateforme d'un réseau d'ateliers partagés : habilitations machine, réservation de créneaux, check-in NFC.
Projet fil rouge M2 EEMI 2026 · Next.js 16.3.

La conception complète — produit, règles métier, modèle de données, surface d'API — est dans
`docs/superpowers/specs/2026-09-14-etabli-design.md`.

## Prérequis

- Node 22 ou plus (`.nvmrc` épingle 24)
- pnpm 10
- Une base PostgreSQL Neon, branche dédiée pour le développement

## Démarrer

```bash
pnpm install
cp .env.example .env          # y coller l'URL du pooler Neon et un JWT_SECRET
pnpm run db:migrate
pnpm run dev                  # API sur :3001, web sur :3000
```

## Vérifier

```bash
pnpm run check                # format, lint, typecheck, tests unitaires
pnpm run verify               # check + build + tests end-to-end
```

`pnpm run check` construit d'abord les packages : les types inter-packages sont résolus depuis
`dist/`, produit par tsdown et non par tsc.

## Organisation

| Chemin | Rôle |
|---|---|
| `packages/contract` | types TypeScript purs et table de routes — aucune dépendance |
| `packages/shared` | primitives Effect partagées : identifiants brandés, AuthContext, Clock, migrations |
| `packages/test-utils` | client SQL pglite pour les tests d'intégration |
| `packages/server` | HttpApi Effect, Layers, migrator, points d'entrée Node et Vercel |
| `apps/web` | application Next.js — App Router, Server Components, Server Actions |

Les migrations sont des fichiers `.sql` numérotés sous `packages/*/src/infrastructure/migrations/`.
Le préfixe à quatre chiffres porte l'ordre global, tous packages confondus : un doublon fait échouer
le démarrage.

## Tests

TDD strict : E2E Playwright rouge d'abord, unitaires rouges ensuite, implémentation enfin.
Les tests sont colocalisés avec le code ; les E2E portent l'extension `.test.e2e.ts` et vivent
à côté de la page qu'ils couvrent.
