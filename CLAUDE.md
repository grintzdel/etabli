# Établi

Projet fil rouge M2 EEMI 2026 — Next.js 16.3. Plateforme d'un réseau d'ateliers
partagés : habilitations machine, réservation de créneaux, check-in NFC.

**Lire en premier** : `docs/superpowers/specs/2026-09-14-etabli-design.md`.
Produit, règles métier, modèle de données, surface d'API, roadmap et fiche
technique y sont complets. Ne pas reconcevoir : ce document a été validé.

Le sujet imposé est `../Projet fil rouge next js.pdf` (36 pages, lire par
plages avec le paramètre `pages`).

## État

Jalons 0 à 3 terminés et sur `main`. Jalon 4 (réservation) commencé.

`pnpm check` est vert : 455 tests unitaires, `next build`. Les 56 E2E
Playwright passent mais **ne tournent plus dans `pnpm verify`, sur décision de
l'auteur** — `pnpm db:test:up` puis `pnpm test:e2e` pour les lancer.

Ce qui existe, package par package :

- `bc-identity` — inscription, connexion, `GET /auth/me`, bcrypt, jose,
  `AuthMiddleware`, cookie httpOnly posé par Next, `proxy.ts`
- `bc-atelier` — ateliers, adhésions, machines ; annuaire public et fiche avec
  `use cache` / `cacheTag` ; onboarding persisté ; routes `/admin/ateliers` et
  `/manage/machines`
- `bc-certification` — demander, accorder, révoquer ; file de validation
  fabmanager ; l'habilitation porte sur **une machine**, pas sur un type — écart
  assumé au §9 de la spec
- `bc-booking` — domaine, migration `0005`, repository, et le parcours membre
  complet : `GET /machines/:id/availability`, `POST /bookings`, `GET /bookings`,
  `GET /bookings/:id`, `POST /bookings/:id/cancel`, `POST /bookings/:id/check-in`.
  Côté web, `/reservations` et `/reservations/:id` — liste, détail, annulation.
  La semaine d'une machine et la création viennent ensuite.

Neon est branché et à jour des cinq migrations. Sur une machine neuve : copier
`.env.example` en `.env` et y mettre l'URL *pooled* du projet Neon. `pg` émet un
avertissement sur `sslmode=require` traité comme `verify-full` — comportement
voulu, à ignorer.

`pnpm db:seed:test` insère trois ateliers de démonstration de façon idempotente ;
le `globalSetup` de Playwright l'appelle. `E2E_SKIP_SEED=1` le désactive.
`compose.yaml` lance un `postgres:18-alpine` sur `:5433`. Playwright ne réutilise
jamais un serveur déjà sur `:3001` : un `pnpm dev` qui traîne est branché sur
Neon, et le réutiliser ferait tourner les E2E contre la base de développement.

Les contextes ne se dépendent pas. Chacun déclare un port pour ce qu'il attend
d'un autre — `MembershipLookup`, `MemberProfile`, `MachineDirectory`,
`MemberDirectory`, `MachineCatalog` — et `packages/server/src/layers/` les
branche. Le Tag `AuthMiddleware` et `AccountSuspendedError` vivent dans `shared`.

### Réservation — ce qui est tranché

La contrainte d'exclusion `bookings_no_overlap` est en base, sous
`btree_gist` : la règle 2 est donc garantie deux fois, comme le veut le §5 de la
spec. Le repository SQL traduit la violation `23P01` en `BookingOverlapError`.

`@effect/sql-pg` tourne sur `pg` en TCP et `SqlClient.withTransaction` est
disponible : **aucun changement de driver n'est nécessaire** pour les écritures
multi-instructions. La limite « pas de transaction » de `neon-http` vient des
règles Drizzle globales et ne s'applique pas ici.

Les horaires d'ouverture sont des constantes (`8h`–`22h`, `Europe/Paris`) tant
que le §7 les garde en v1.1. Les créneaux sont calculés en heure locale de
l'atelier, transition d'heure d'été comprise.

La règle 1 porte sur **la machine**, pas sur son type : c'est ce que le jalon 3
a mis en base, et toute l'interface d'habilitation nomme une machine. Élargir au
type plus tard est additif ; resserrer ne l'est pas. Le §5 de la spec a été
corrigé en ce sens.

Le payload de `POST /bookings` ne porte que `machineId` et `startAt` : la fin du
créneau vient du `slotDurationMinutes` de la machine, jamais du client.

`SlotInThePastError` (409) ne figure pas dans les sept règles du §5 — aucune
n'interdisait de réserver dans le passé. Ajoutée, et inscrite au §5.

Une réservation qui n'appartient pas à l'appelant répond 404, pas 403 : le
statut ne doit pas révéler qu'elle existe.

Une machine `RETIRED` répond 404 partout — availability comme `POST /bookings`.
Elle est sortie du parc, donc indiscernable d'une machine inconnue. Seul
`MAINTENANCE` vaut un 409 : la machine existe et reviendra.

Le check-in est NFC et rien d'autre : la charge ne porte qu'un `nfcTagId`, et
une machine sans tag ne peut pas être pointée. `CheckInMethod.MANUAL` reste dans
le modèle pour un pointage de secours fabmanager, pas encore écrit. Le check-in
n'est pas idempotent — `BookingNotCheckInableError` (409, règle 9 du §5) refuse
le second, pour que la première empreinte reste opposable à un no-show.

`isCheckInOpen(booking, now)` est un prédicat pur, jumeau d'`isCancellable` :
la command et la projection du read model le partagent, et le front lit
`canCheckIn` au lieu de redériver la fenêtre de 15 min avant / 30 min après.

`PATCH /manage/machines/:id` associe, remplace ou retire un tag NFC :
`nfcTagId` absent laisse le tag en place, `null` le décolle, une chaîne le pose.
Le tag est unique sur tout le réseau — `nfc_tag_id` porte la contrainte en base
depuis la migration `0003`, et `MachineNfcTagTakenError` (409) la double à la
création comme à la modification, pour ne pas rendre un 500 sur un doublon.
Reposer sur une machine le tag qu'elle porte déjà passe. Aucun écran ne s'en
sert encore : le formulaire de `/manage/machines` ne crée que.

Le `BookingHttpAdapter` lit le `_tag` du corps d'erreur, pas seulement le
status : cinq refus se partagent le 409, et le §11 demande que chaque règle
porte son propre message. Le status ne sert plus que de repli.

L'annulation passe par `useActionState` et non par le `refresh()` aveugle des
jalons 2 et 3 : un créneau qui vient de commencer répond 409, et le membre doit
lire pourquoi. C'est aussi le patron que réclame le §8.9.

Le détail dit que le pointage est ouvert, sans l'offrir : le check-in demande un
tag NFC que le navigateur ne sait pas lire — §12.8.

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

La règle d'origine — E2E rouge, puis unitaires rouges, puis implémentation —
a été levée par l'auteur au jalon 1 : le code a été écrit d'abord, les tests
ensuite. Les E2E ont ensuite été sorties de `pnpm verify`. Redemander avant
de rétablir l'un ou l'autre.
