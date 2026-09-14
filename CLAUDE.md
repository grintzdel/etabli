# Établi

Projet fil rouge M2 EEMI 2026 — Next.js 16.3. Plateforme d'un réseau d'ateliers
partagés : habilitations machine, réservation de créneaux, check-in NFC.

**Lire en premier** : `docs/superpowers/specs/2026-09-14-etabli-design.md`.
Produit, règles métier, modèle de données, surface d'API, roadmap et fiche
technique y sont complets. Ne pas reconcevoir : ce document a été validé.

Le sujet imposé est `../Projet fil rouge next js.pdf` (36 pages, lire par
plages avec le paramètre `pages`).

## État

Jalon 0 terminé et étiqueté `jalon-0`. Le monorepo tient : `contract`,
`shared`, `test-utils`, `server` et `apps/web`. `pnpm verify` est vert — 63
tests unitaires, `next build`, 9 E2E Playwright.

Neon est branché. `pnpm db:migrate` a appliqué `0001_create_domain_events`
contre la base réelle, et un second passage ne réapplique rien.
`pnpm dev:server` démarre contre Neon ; avec un mot de passe faux il refuse de
démarrer, donc la connexion est bien sur le chemin du boot et non différée.
Les chemins `@effect/sql-pg` et `PgMigrator.layer` ne sont donc plus couverts
par le seul pglite.

Sur une machine neuve : copier `.env.example` en `.env` et y mettre l'URL
*pooled* du projet Neon. `pg` émet un avertissement sur `sslmode=require`
traité comme `verify-full` — comportement voulu, à ignorer.

Le jalon 1 (`bc-identity`) est conçu :
`docs/superpowers/specs/2026-09-14-jalon-1-identite-design.md` fixe le périmètre, la
durée de vie du jeton, la sémantique de la déconnexion, le rôle exact de
`proxy.ts` et la base sur laquelle tournent les E2E.

L'outillage de test de la §10 est en place. `compose.yaml` lance un
`postgres:18-alpine` sur `:5433` — Neon est en 18.6. `pnpm verify` lève le
conteneur, joue les migrations, puis les E2E contre deux serveurs (`:3001`
l'API, `:3000` le web). Sur une machine neuve il n'y a rien à copier :
`db:test:up` crée `.env.test` depuis `.env.test.example` s'il manque.

Playwright ne réutilise jamais un serveur déjà sur `:3001` : un `pnpm dev`
qui traîne est branché sur Neon, et le réutiliser ferait tourner les E2E
contre la base de développement.

## Repos de référence

Deux repos locaux servent de modèle. Les consulter plutôt que d'inventer.

**Backend — `/Users/maoudin/Desktop/Developer/kairos-crm/monorepo`**
Un package pnpm par bounded context (`packages/bc-*`), agrégés par
`packages/server`. Lire `packages/bc-client/src/` en entier : c'est le gabarit.

- `domain/` — schemas Effect, ids brandés via `Schema.brand`, `errors.ts` en
  `Data.TaggedError`, constants en objets `as const`
- `application/commands/<action>/<action>.command.ts` — factory retournant un
  `Effect`, error channel explicite dans la signature
- `application/queries/<query>/` — read models ; les lookups cross-contexte sont
  un `Context.Tag` avec `.tag.ts` + `.live.ts`
- `infrastructure/` — `.repository.ts` (Tag + interface), `.repository.sql.ts`
  (`@effect/sql-pg`, SQL brut, aucun ORM), `.repository.memory.ts`,
  `migrations/NNNN_*.sql`
- `http/` — `<x>.api.ts` en `HttpApiGroup`/`HttpApiEndpoint` avec `.addError(E,
  { status })`, `<x>.handlers.ts`
- `packages/server/layers/` — composition des Layers ; `main.ts` lance via
  `NodeRuntime.runMain(Layer.launch(HttpLive))`

**Frontend — `/Users/maoudin/Desktop/Developer/Boonty/webapp`**
Système de modules à reproduire tel quel.

- `src/modules/<module>/core/{model,ports,adapters,lib}` — aucun import React
  ni Next dans `core/`
- `ports/<x>.port.ts` → `interface I<X>Port`
- `adapters/<x>.http.adapter.ts` → `class XHttpAdapter implements IXPort`,
  plus `<x>.in-memory.adapter.ts`
- `src/modules/<module>/react/{components,hooks}` — composants purs
- `src/features/<feature>/` — orchestrateurs de page, aucun composant dedans
- `src/architecture/import-cycles.test.ts` — test de graphe d'imports, à
  reprendre
- `src/proxy.ts` — l'ancien `middleware.ts`

Ne pas reprendre de Boonty : `modules/app/core/store/dependencies.ts` et son
`DependenciesProvider`. Voir la section 8.6 de la spec — les adapters ne
tournent que côté serveur, il n'y a pas de conteneur dans le navigateur.

## Conventions

Les règles globales de `~/.claude/*.md` s'appliquent : nommage et suffixes de
fichiers, `as const` au lieu d'`enum`, oxlint + oxfmt (pas de point-virgule,
quotes simples, 120 colonnes), colocalisation des tests, TDD strict, et la
règle du zéro commentaire.

Trois écarts assumés, détaillés en section 8.13 de la spec : pas de Redux, pas
de local-first hors ligne, pas de contexte React de dépendances.

Le français est la langue du produit et de la documentation. Le code, les noms
de symboles et les rares commentaires restent en anglais.

## TDD

Non négociable, confirmé par l'auteur. Pour chaque tranche : E2E Playwright
rouge d'abord, puis unitaires rouges couche par couche, puis implémentation.
