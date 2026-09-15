# Établi

Projet fil rouge M2 EEMI 2026 — Next.js 16.3. Plateforme d'un réseau d'ateliers
partagés : habilitations machine, réservation de créneaux, check-in NFC.

**Lire en premier** : `docs/superpowers/specs/2026-09-14-etabli-design.md`.
Produit, règles métier, modèle de données, surface d'API, roadmap et fiche
technique y sont complets. Ne pas reconcevoir : ce document a été validé.

Le sujet imposé est `../Projet fil rouge next js.pdf` (36 pages, lire par
plages avec le paramètre `pages`).

## État

Jalons 0 à 6 terminés et sur `main`. Le parcours membre est complet de bout en
bout, de l'atelier au créneau réservé ; le fabmanager tient le pointage, le
no-show, l'annulation, le tag NFC et les statistiques de ses ateliers ;
l'administrateur plateforme tient les ateliers, les comptes, les rôles et le
tableau réseau. Prochaine étape : le jalon 7, la production.

`pnpm check` est vert : 813 tests unitaires, `next build`. Les 95 E2E
Playwright passent mais **ne tournent plus dans `pnpm verify`, sur décision de
l'auteur** — `pnpm db:test:up` puis `pnpm test:e2e` pour les lancer. Le
conteneur de test tourne sur un `tmpfs` : `pnpm db:test:down` puis `db:test:up`
suffit à repartir d'une base vierge, il n'y a pas de volume à supprimer. Sans
cette remise à zéro la base **accumule** d'un run à l'autre, et des tests sans
rapport tombent sur des créneaux épuisés ou un annuaire saturé d'« Atelier
E2E ». Défaut d'isolation connu, non corrigé.

Ce qui existe, package par package :

- `bc-identity` — inscription, connexion, `GET /auth/me`, bcrypt, jose,
  `AuthMiddleware`, cookie httpOnly posé par Next, `proxy.ts`. Et les paramètres :
  `PATCH /auth/me` (nom affiché, pratiques), `POST /auth/password`,
  `GET`/`PATCH /me/preferences`, `GET /me/ateliers`, migration `0006`, et le
  back-office plateforme : `GET /admin/users`, `PATCH /admin/users/:id`
- `bc-atelier` — ateliers, adhésions, machines ; annuaire public et fiche avec
  `use cache` / `cacheTag` ; onboarding persisté ; routes `/admin/ateliers` et
  `/manage/machines` ; `PATCH /admin/ateliers/:atelierId/members/:userId` pour
  nommer un fabmanager
- `bc-certification` — demander, accorder, révoquer ; file de validation
  fabmanager ; l'habilitation porte sur **une machine**, pas sur un type — écart
  assumé au §9 de la spec
- `bc-booking` — domaine, migration `0005`, repository, et le parcours membre
  complet : `GET /machines/:id/availability`, `POST /bookings`, `GET /bookings`,
  `GET /bookings/:id`, `POST /bookings/:id/cancel`, `POST /bookings/:id/check-in`.
  Côté fabmanager, `GET /manage/bookings`, `POST /manage/bookings/:id/check-in`
  et `POST /manage/bookings/:id/no-show`.
  `POST /manage/bookings/:id/cancel`, `GET /manage/stats` et `GET /admin/stats`.
  Côté web, `/machines/:id` ouvre la semaine et réserve, `/reservations` et
  `/reservations/:id` listent, détaillent et annulent, `/manage/bookings`
  tient le pointage, le no-show et l'annulation de la journée, et `/manage/stats`
  comme `/admin/stats` mesurent l'occupation.

## API v2 — `apps/api` (NestJS)

Seconde implémentation du back, sur la branche `feat/api-nestjs`, décrite par
`docs/superpowers/specs/2026-09-15-etabli-api-nestjs-design.md`. Elle remplace
fonctionnellement `packages/server` et les quatre `packages/bc-*`, qui restent
en place et inertes. NestJS 12, Drizzle, Zod, clean architecture port & adapter,
sans Effect.ts ni bounded contexts. Sept modules — `auth`, `user`, `atelier`,
`membership`, `machine`, `certification`, `booking` — plus `health`, pour les
38 routes du §4 de la spec.

`pnpm --filter @etabli/api test` : 255 tests, trois étages (unitaires sur stubs
et `FixedClock`, intégration des repositories sur PGlite, bout en bout HTTP via
supertest). Pas de Docker : chaque suite monte sa propre base en mémoire, ce qui
supprime structurellement le défaut d'isolation des 95 E2E de la v1.

**NestJS 12 est ESM-only.** `apps/api` est donc en `"type": "module"`, en
`module: NodeNext`, et les imports relatifs portent leur extension. On les écrit
en `.ts` — `rewriteRelativeImportExtensions` les réécrit en `.js` à l'émission.
`unplugin-swc` est requis pour Vitest : esbuild n'émet pas
`emitDecoratorMetadata`, sans quoi l'injection Nest ne résout rien.

**Zod est le seul langage de schéma**, entrée comme sortie — écart assumé au
§3.2 de la spec, qui demandait des classes `@ApiProperty` pour les réponses.
Les DTO de requête sont validés par `ZodValidationPipe` via `@ZodBody`,
`@ZodQuery` et `@UuidParam` ; les DTO de réponse sont des schémas Zod plus un
mapper, et Swagger est alimenté par `z.toJSONSchema()`. `response-contract.e2e.spec.ts`
parse la réponse de chaque route contre son schéma, clés en trop comprises.

Deux écarts de plus : `PATCH /auth/me` devient `PATCH /me/profile` (§4.1), et
`POST /certifications` devient `POST /certifications/request` — la table du §4 de
la spec l'écrit ainsi, là où son §1 annonce une seule URL changée. La colonne
`email` est en `text` et non en `citext` : l'adresse est normalisée en minuscules
par le schema Zod, donc l'extension ne sert plus.

La contrainte d'exclusion `bookings_no_overlap` et `btree_gist` vivent dans une
migration écrite à la main, `0001`, que `drizzle-kit generate --custom` a
ordonnée après les sept tables. `domain_events` n'est pas reprise.

Scripts : `pnpm dev:api`, `pnpm db:migrate:api`, `pnpm db:seed:api`,
`pnpm db:generate:api` (et leurs variantes `:test:api`). Le seed v1 est porté à
l'identique — neuf ateliers, sept comptes, mot de passe `etabli-2026`.

Neon est branché et à jour des six migrations. Sur une machine neuve : copier
`.env.example` en `.env` et y mettre l'URL *pooled* du projet Neon. `pg` émet un
avertissement sur `sslmode=require` traité comme `verify-full` — comportement
voulu, à ignorer.

`pnpm db:seed:test` insère trois ateliers de démonstration de façon idempotente ;
le `globalSetup` de Playwright l'appelle. `E2E_SKIP_SEED=1` le désactive.
`compose.yaml` lance un `postgres:18-alpine` sur `:5433`. Playwright ne réutilise
jamais un serveur déjà sur `:3001` : un `pnpm dev` qui traîne est branché sur
Neon, et le réutiliser ferait tourner les E2E contre la base de développement.

Les contextes ne se dépendent pas. Chacun déclare un port pour ce qu'il attend
d'un autre — `MembershipLookup`, `MemberProfile`, `MemberAteliers`,
`MachineDirectory`, `MemberDirectory`, `MachineCatalog` — et
`packages/server/src/layers/` les branche. Le Tag `AuthMiddleware` et `AccountSuspendedError` vivent dans `shared`.

### Paramètres — ce qui est tranché

Deux préférences, pas trois. La colonne `email_notifications` du §9 n'existe
pas : rien n'envoie d'e-mail, la relance est datée v1.1 au §7, et le §4.6
condamne le réglage qui ne modifie rien. Elle reviendra avec le premier envoi.

La rampe `graphite` est **sémantique** — 950 est le fond, 50 est l'encre — donc
le mode clair inverse les onze barreaux sous `[data-theme="light"]` au lieu de
recolorer les utilitaires. `[data-theme="system"]` reprend la même rampe sous
`prefers-color-scheme`. Les teintes `signal` et `status` descendent pour un fond
clair : `#ff6a00` tient 2,9:1 sur blanc et ne peut pas porter de texte.

Le thème vit en base, donc le serveur rend l'attribut : pas de flash, pas de
`localStorage`, pas de script client. **Le prix est le prerender.** Avec
`cacheComponents: true`, un `cookies()` non suspendu dans un layout n'est pas
« dynamique », il casse la build. Le thème étant porté par le chrome, le chrome
est par-membre et ne peut appartenir à une coquille prérendue. D'où le
découpage : `<html>` et `<body>` dans un layout racine **sans session**,
en-tête et pied descendus dans trois layouts de groupe (`SiteShell`), et
`(app)/layout.tsx` qui enveloppe dans `<div data-theme>` et déclare
`instant = false`. Huit routes `(app)` sont passées de `◐` à `ƒ` ;
`(marketing)` et `(auth)` gardent leur coquille, ce qui était l'enjeu du §8.
`color-scheme` est sur l'enveloppe et non sur la racine : la barre de
défilement du document reste sombre.

L'annuaire public **ne peut pas** nommer les ateliers d'un membre : il est
filtré et plafonné, et rien ne garantit qu'un atelier du membre y figure. D'où
`GET /me/ateliers`. Un E2E contre une base chargée l'a prouvé en rendant un
select vide.

Les `PATCH` sont de vrais patch : clé absente = valeur stockée intacte, `null`
explicite sur `defaultAtelierId` = effacement. Porté de bout en bout, jusqu'au
`COALESCE` / `CASE` d'un seul upsert SQL.

Les refus de formulaire sont **écrits côté action**, pas remontés de l'API : un
échec de schema répond `HttpApiDecodeError`, dont le corps porte des messages
internes en anglais et perd le `Schema.annotations({ message })` du domaine. Le
serveur reste l'autorité — les tests HTTP assertent les 400 — mais la phrase
que lit le membre est écrite en français là où elle s'affiche, comme le §11 le
demande.

Changer de mot de passe réémet un jeton et réécrit le cookie, pour ne pas
déconnecter l'auteur du changement. **Les jetons des autres appareils restent
valides** jusqu'à expiration : pas de liste de révocation. C'est dit à l'écran
et figé par un test.

L'état d'action est `{ status, message }` et non `{ error }` : le jalon demande
des retours de succès autant que de refus.

Après une action, React 19 **réinitialise le formulaire**. Un test qui enchaîne
deux tentatives doit resaisir tous les champs, pas seulement celui qu'il change.

### Back-office — ce qui est tranché

`COMPLETED` est **dérivé, jamais écrit**. `isCompleted` est le quatrième
prédicat pur de la famille : pointée, et sa fin passée. `effectiveStatus` le
projette dans les read models, la colonne garde le fait brut, et le filtre par
état de `/manage/bookings` tourne sur la projection — sinon `COMPLETED` serait
le seul choix du select à ne jamais rien trouver. Aucune migration, aucun
ordonnanceur, aucun `GET` qui écrit.

La fenêtre des statistiques porte sur des **journées entières d'ouverture** —
du premier minuit local au minuit suivant — et non sur `[now − N jours, now]`.
Deux raisons : un créneau réservé pour plus tard aujourd'hui compte dans
l'occupation, ce qu'un fabmanager attend du mot ; et les heures d'ouverture
d'une période valent exactement `jours × 14`, au lieu de dériver à la
milliseconde entre deux chargements. Les heures **consommées** restent passées
par construction : seul un créneau `COMPLETED` y entre, et `COMPLETED` regarde
le vrai `now`, pas la borne de la fenêtre.

Un créneau annulé rend la machine et ne compte aucune heure ; un no-show l'a
tenue et compte comme réservé, jamais comme consommé ; une machine retirée sort
des deux côtés du ratio ; un atelier sans machine n'a pas de dénominateur, donc
pas de bloc. L'agrégation tourne en mémoire sur les lignes que
`listForAteliersBetween` rend déjà : un `GROUP BY` SQL aurait dupliqué la règle
de complétion dans un dialecte où rien ne peut la confronter au prédicat.

`FABMANAGER` est un `MembershipRole` : il n'existe qu'attaché à un atelier.
D'où deux routes là où le §10 n'en listait qu'une — `PATCH /admin/users/:id`
pour le rôle plateforme et la suspension, `PATCH /admin/ateliers/:atelierId/members/:userId`
pour la gestion d'un atelier. Un administrateur ne peut ni se retirer son rôle
ni se suspendre : c'est le seul geste qu'aucun autre administrateur n'est
garanti d'être là pour défaire.

L'annulation par l'atelier (règle 11) est **plus large** que celle du membre :
elle court jusqu'à la fin du créneau, là où celle du membre ferme à son départ.
Annuler est une rétractation pour celui qui a réservé, une intervention pour
celui qui tient la machine. Un créneau déjà pointé reste hors d'atteinte des
deux côtés.

Le cloisonnement est balayé route par route par
`packages/server/src/http/tenancy.test.ts` : **404** sur une ressource d'un
autre atelier, collection vide sur une liste, **403** sur les routes `/admin/*`.
Le §7 disait « 403 » partout ; la lettre a été corrigée, pas l'intention — 403
sur une ressource avouerait qu'elle existe.

Trois adapters web rendaient un refus comme une panne, faute d'un code
d'échec : le 403 côté réservation, le 409 d'un tag NFC déjà porté, le 404 d'une
demande d'habilitation qui n'est pas la sienne. Tous trois lisent maintenant le
`_tag` du corps avant le statut. **Quand une route gagne une erreur typée,
l'adapter qui l'appelle doit gagner son code** — sans quoi le message affiché
parle d'indisponibilité.

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

Le check-in d'un membre est NFC et rien d'autre : la charge ne porte qu'un
`nfcTagId`, et une machine sans tag ne peut pas être pointée. Le pointage de
secours vit ailleurs — `POST /manage/bookings/:id/check-in`, réservé au
fabmanager de l'atelier, sans charge utile, `CheckInMethod.MANUAL`. Il obéit à
la même fenêtre et au même prédicat `isCheckInOpen` ; ce qui change, c'est qui
pointe, pas quand. Une réservation qu'un fabmanager ne tient pas répond 404,
comme pour un membre qui n'est pas le sien. Le check-in n'est pas idempotent —
`BookingNotCheckInableError` (409, règle 9 du §5) refuse le second, pour que la
première empreinte reste opposable à un no-show.

`isCheckInOpen(booking, now)` est un prédicat pur, jumeau d'`isCancellable` :
la command et la projection du read model le partagent, et le front lit
`canCheckIn` au lieu de redériver la fenêtre de 15 min avant / 30 min après.
`isNoShowMarkable` est le troisième du genre, et il se lit sur la fermeture de
cette même fenêtre — pas sur la fin du créneau. Avant elle, le membre peut
encore arriver ; après, l'absence est acquise. Règle 10 du §5.

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

Le détail dit au membre que le pointage est ouvert, sans le lui offrir : le
check-in demande un tag NFC que le navigateur ne sait pas lire — §12.8. C'est le
fabmanager qui pointe à sa place, depuis `/manage/bookings`.

Le pointage se filtre par jour et par état. Le jour voyage en `YYYY-MM-DD` dans
l'URL et part à l'API en midi UTC : quel que soit le décalage de Paris, midi
tombe toujours dans le bon jour local. La query, elle, recalcule la journée
locale de l'atelier à partir de cet instant.

`/manage/bookings` est le seul écran où une ligne porte un `id` HTML — l'id de
la réservation. Le fabmanager n'a pas de lien vers `/reservations/:id`, qui ne
lui appartient pas ; sans cet ancrage, deux membres sur le même créneau d'une
machine rendent deux lignes indiscernables.

Le calendrier est la seule zone client du produit, et le seul Route Handler :
`/api/machines/:id/availability` est le BFF qui détient le cookie httpOnly, et
React Query interroge lui. Le tableau du §8.8 le demandait ainsi.

La navigation de semaine n'arithmétise aucune date côté client : la réponse
porte son `to`, qui devient le `from` de la semaine suivante, empilé dans un
`useState`. Reculer dépile. On ne peut donc pas remonter avant aujourd'hui, ce
que l'API refuserait de toute façon, et aucun passage à l'heure d'été ne peut
décaler la fenêtre d'un jour.

Le `QueryClient` vit dans `MachineWeek`, pas dans un provider racine : un seul
écran interroge React Query. Le jour où un deuxième arrive, il remontera.

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
