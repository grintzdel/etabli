# @etabli/api

L'API d'Établi : NestJS 12, Drizzle sur PostgreSQL, Zod, clean architecture port & adapter. C'est
le seul backend du dépôt — le web et le mobile ne parlent qu'à lui.

## Lancer

Depuis la racine du dépôt, avec un `.env` rempli (`cp .env.example .env`) :

```bash
pnpm install
pnpm build:packages      # @etabli/contract est consommé compilé
pnpm db:migrate          # applique les migrations
pnpm db:seed             # ateliers, comptes et créneaux de démonstration
pnpm dev:api             # nest start --watch sur :3001
```

Swagger est servi sur [http://localhost:3001/docs](http://localhost:3001/docs), la sonde de santé
sur `GET /health`.

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | oui | URL PostgreSQL (Neon *pooled* en dev, `db` dans le compose) |
| `JWT_SECRET` | oui | 32 caractères minimum — signature HS256 des jetons de session |
| `PORT` | non | `3001` par défaut |
| `NODE_ENV` | non | `development`, `test` ou `production` |

L'environnement est validé au démarrage par un schéma Zod (`infrastructure/config/env.schema.ts`) :
une variable manquante arrête le processus avec un message, au lieu d'échouer à la première requête.

## Scripts

| Script | Effet |
|---|---|
| `pnpm --filter @etabli/api dev` | serveur en watch, lit `../../.env` |
| `pnpm --filter @etabli/api build` | `nest build` vers `dist/` |
| `pnpm --filter @etabli/api start` | `node dist/main.js` |
| `pnpm --filter @etabli/api test` | les trois étages de tests |
| `pnpm --filter @etabli/api db:generate` | génère une migration depuis le schéma Drizzle |
| `db:migrate:test`, `db:seed:test`, `db:reset:test` | mêmes gestes contre `.env.test` (Postgres local `:5433`) |

`db:reset:test` refuse toute URL dont l'hôte n'est pas local, avant d'ouvrir la connexion.

## Organisation

```
src/
├── main.ts, app.module.ts
├── infrastructure/       config, database (schéma, migrations, seed), swagger, health
├── shared/               pipes et décorateurs Zod (@ZodBody, @ZodQuery, @UuidParam), intercepteurs, horloge
└── modules/
    ├── auth, user, atelier, membership, machine, certification, booking
    └── <module>/
        ├── domain/           entités, erreurs, interface de repository, constantes
        ├── application/      un use-case par opération
        ├── infrastructure/   repository Drizzle
        └── presentation/     contrôleur, DTO Zod de requête et de réponse
```

Le domaine ne connaît que l'interface de son repository ; Nest injecte l'implémentation Drizzle sur
un token. Aucune règle métier ne vit dans un contrôleur.

**Zod est le seul langage de schéma**, en entrée comme en sortie. Les réponses sont un schéma plus un
mapper, et Swagger en est alimenté par `z.toJSONSchema()`.

**Les erreurs portent un `code`** tiré d'`ApiErrorCode` (`@etabli/contract`). Cinq règles métier
partagent le statut 409 : c'est le code, pas le statut, que les clients traduisent.

## Base de données

Trois migrations dans `src/infrastructure/database/migrations/`. `0001` est écrite à la main : la
contrainte d'exclusion `bookings_no_overlap` (sous `btree_gist`) interdit en base deux créneaux qui
se chevauchent sur une même machine. Le repository traduit sa violation (`23P01`) en
`BookingOverlapError`.

Le seed est en deux temps : `seed()` pose ateliers, machines, comptes et adhésions de façon
idempotente ; `seedDemo()` réécrit habilitations et réservations, **datées relativement à
maintenant** — dont deux créneaux dont la fenêtre de pointage est ouverte au moment du seed.

## Tests

```bash
pnpm --filter @etabli/api test     # 282 tests
```

Trois étages, sans Docker : unitaires sur stubs et `FixedClock`, intégration des repositories sur
PGlite (Postgres WASM en mémoire), bout en bout HTTP via supertest. Trois specs transverses à la
racine de `src/` :

- `tenancy.e2e.spec.ts` — 404 sur une ressource d'un autre atelier, 403 sur `/admin/*` ;
- `response-contract.e2e.spec.ts` — chaque réponse parsée contre son schéma, clés en trop comprises ;
- `api-error-code.spec.ts` — aucun `code:` écrit en dur hors du contract, aucun code mort.

## Docker

`apps/api/Dockerfile` — multi-stage sur `node:24-alpine`, un stage `prod-deps` pour ne livrer que
les dépendances de production, exécuté sous l'utilisateur `node`. Le `compose.yaml` racine enchaîne
migration, seed et serveur. Voir la section Docker du [README racine](../../README.md#docker).

## Notes techniques

- **NestJS 12 est ESM-only** : `"type": "module"`, `module: NodeNext`, imports relatifs écrits en
  `.ts` et réécrits en `.js` à l'émission (`rewriteRelativeImportExtensions`).
- **Vitest passe par `unplugin-swc`** : esbuild n'émet pas `emitDecoratorMetadata`, sans quoi
  l'injection Nest ne résout rien.
- Drizzle tourne sur `pg` en TCP : `db.transaction()` est disponible.
