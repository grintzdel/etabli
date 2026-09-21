# Établi

[![CI](https://github.com/grintzdel/etabli/actions/workflows/ci.yml/badge.svg)](https://github.com/grintzdel/etabli/actions/workflows/ci.yml)

Plateforme d'un réseau d'ateliers partagés : habilitations machine, réservation de créneaux, check-in NFC.
Projet fil rouge M2 EEMI 2026 · Next.js 16.3.

> **Application déployée** : _à renseigner_ · **API** : _à renseigner_
> Voir [Déploiement](#déploiement) pour la marche à suivre.

La conception complète — produit, règles métier, modèle de données, surface d'API — est dans
`docs/superpowers/specs/2026-09-14-etabli-design.md`.

---

## Le problème

Un atelier partagé se gère aujourd'hui avec un groupe de messagerie, un tableur et un cahier posé
près de la machine. Les trois se contredisent. Personne ne sait qui est habilité sur quoi, deux
personnes réservent le même créneau, et rien ne prouve qu'une réservation a été honorée.

Établi tient une seule source : **l'habilitation conditionne la réservation, le créneau est
exclusif, la présence est prouvée par NFC.**

## Fonctionnalités

### Public — sans compte

- Page d'accueil, `/fonctionnalites`, `/faq` — prérendues, `sitemap.xml` et `robots.txt`
- `/ateliers` — annuaire filtrable par ville et par type de machine
- `/ateliers/[slug]` — fiche d'un atelier et parc publié
- `/machines/[id]` — fiche d'une machine ; la semaine réservable n'ouvre qu'aux membres de l'atelier

### Membre

- Inscription, connexion, déconnexion ; session serveur en cookie `httpOnly`
- **Onboarding** (`/bienvenue`) — rejoindre un atelier et déclarer ses pratiques ; sans lui, rien n'est réservable
- `/tableau-de-bord` — prochain créneau, compteurs, habilitations en attente
- `/habilitations` — demander l'accès à une machine, suivre la décision
- Sur `/machines/[id]`, le calendrier de la semaine et la réservation d'un créneau
- `/reservations` et `/reservations/[id]` — liste, détail, annulation
- `/compte` et `/parametres` — nom affiché, pratiques, mot de passe, thème, atelier par défaut

### Fabmanager — par atelier

- `/manage/certifications` — file des demandes, accorder ou révoquer
- `/manage/machines` — parc, création, état, tag NFC
- `/manage/bookings` — pointage de secours, no-show, annulation, filtres jour et état
- `/manage/stats` — occupation, heures réservées, heures consommées, no-shows

### Administrateur plateforme

- `/admin/ateliers` — ouvrir, publier, refermer un atelier ; nommer un fabmanager
- `/admin/utilisateurs` — rôles plateforme, suspension, filtres
- `/admin/stats` — tableau réseau, atelier le plus chargé en tête

### Mobile — le parcours membre

Trois onglets et trois écrans de détail : l'annuaire trié par distance, les réservations, le compte ;
puis la fiche d'un atelier, la semaine d'une machine, et le détail d'un créneau — où le **pointage
NFC** se fait. Voir [L'application mobile](#lapplication-mobile--nfc-et-position).

## Comptes de démonstration

`pnpm db:seed` insère ces comptes de façon idempotente. **Mot de passe commun : `etabli-2026`.**

Le seed pose aussi 16 habilitations et 20 réservations — à venir, pointées, non honorée, annulée —
pour que le tableau de bord, les files de validation et les statistiques ouvrent sur des chiffres.
Chaque compte actif a de quoi montrer quelque chose, l'administrateur comme les fabmanagers.

**Les créneaux sont datés relativement à maintenant** : un `db:seed` les réécrit pour que le
« prochain créneau » soit toujours devant. C'est la seule partie du seed qui remplace au lieu
d'ignorer les conflits.

Deux créneaux sont ancrés sur l'horloge et non sur la grille, pour que le **pointage** soit
réellement ouvert au moment de la démonstration : la fenêtre court de 15 minutes avant le créneau à
30 minutes après son début. Reséedez juste avant de démontrer.

| E-mail | Rôle | À quoi il sert |
|---|---|---|
| `admin@etabli.test` | Administrateur plateforme, 2 ateliers | Tout `/admin/*`, et un tableau de bord garni : créneaux à venir, **pointage ouvert**, 1 demande en attente |
| `fabmanager.forge@etabli.test` | Fabmanager — La Forge | Tout `/manage/*` sur un atelier, 3 demandes dans sa file |
| `fabmanager.lyon@etabli.test` | Fabmanager — deux ateliers | Vérifier le cloisonnement multi-atelier |
| `membre@etabli.test` | Membre habilité, 2 ateliers | Parcours complet : créneaux à venir, **pointage ouvert**, historique, 1 demande en attente |
| `lea@etabli.test` | Membre — La Forge | Une habilitation accordée, une en attente, une révoquée |
| `theo@etabli.test` | Membre — 2 ateliers | Membre sans habilitation sur la découpe laser |
| `manon@etabli.test` | Membre — Copeaux & Cie | Alimente la file de son fabmanager |
| `nouveau@etabli.test` | Membre sans onboarding | Voir la redirection vers `/bienvenue` |
| `suspendu@etabli.test` | Compte suspendu | Voir le refus de connexion |

## Démarrer

**Prérequis** : Node 22+ (`.nvmrc` épingle 24), pnpm 10, une base PostgreSQL (Neon, branche dédiée).

```bash
pnpm install
cp .env.example .env          # URL du pooler Neon + JWT_SECRET
pnpm run db:migrate
pnpm run db:seed              # comptes et ateliers de démonstration
pnpm run dev                  # API :3001, web :3000, et Expo au premier plan
```

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | URL *pooled* PostgreSQL |
| `JWT_SECRET` | 32 caractères minimum, HS256 |
| `API_URL` | Où le web joint l'API (`http://localhost:3001` en dev) |
| `COOKIE_SECURE` | `true` en production |
| `NEXT_PUBLIC_SITE_URL` | Base des URLs canoniques, du sitemap et de l'Open Graph |

Seules `DATABASE_URL` et `JWT_SECRET` sont obligatoires côté API ; les autres ont une valeur par
défaut de développement.

### L'application mobile

`pnpm run dev` lance les trois — Expo reste au premier plan, parce qu'il n'imprime son QR code que
s'il tient un TTY. Un téléphone sur le wifi ne joint pas `localhost` : copier
`apps/mobile/.env.example` en `apps/mobile/.env` et y mettre l'adresse IP de la machine
(`ipconfig getifaddr en0` sur macOS).

| Variable | Rôle |
|---|---|
| `EXPO_PUBLIC_API_URL` | Où le téléphone joint l'API — une IP du réseau local, pas `localhost` |

### Vérifier

```bash
pnpm run check      # build des packages, format, lint, typecheck, 664 tests unitaires
pnpm run verify     # check + next build
```

Les E2E Playwright tournent à part, contre le Postgres de test :

```bash
pnpm run db:test:up     # postgres:18-alpine sur :5433, tmpfs
pnpm run test:e2e       # 103 scénarios
pnpm run db:test:down
```

> Le `globalSetup` de Playwright enchaîne `db:migrate:test`, `db:reset:test` et `db:seed:test` :
> chaque campagne repart du même état, sans `db:test:down` à penser entre deux runs. La liste des
> tables vidées est dérivée du schéma Drizzle, et `db:reset:test` refuse toute base dont l'hôte
> n'est pas local.

## Organisation

| Chemin | Rôle |
|---|---|
| `packages/contract` | types TypeScript purs, table de routes et `ApiErrorCode` — aucune dépendance |
| `packages/api-client` | le client HTTP des deux apps : `createApiClient`, `Result`, `errorCodeOf` — aucune dépendance |
| `packages/ui` | design system partagé web et natif — composants, tokens, thème |
| `apps/api` | l'API : NestJS, Drizzle, Zod, clean architecture port & adapter |
| `apps/web` | application Next.js — App Router, Server Components, Server Actions |
| `apps/mobile` | application Expo / React Native — le NFC et la position |
| `scripts/` | `dev.sh`, et les deux scripts Python des visuels de l'annuaire |

Les migrations vivent dans `apps/api/src/infrastructure/database/migrations/` et sont numérotées par
`drizzle-kit`. `0001` est écrite à la main : `drizzle-kit generate --custom` l'a ordonnée après les
sept tables, parce qu'une contrainte d'exclusion ne se déduit pas du schéma TypeScript.

## Choix d'architecture

### Un module par domaine, quatre couches chacun

`apps/api` est un NestJS de sept modules — `auth`, `user`, `atelier`, `membership`, `machine`,
`certification`, `booking` — qui portent les 38 routes de la spec, plus `health`. Chaque module est coupé en
`domain/` (entités, erreurs, interface de repository), `application/` (un use-case par opération),
`infrastructure/` (l'implémentation Drizzle) et `presentation/` (contrôleur et DTO). Le domaine ne
connaît que son interface ; l'injection Nest branche l'implémentation sur un token. Une règle métier
ne vit jamais dans un contrôleur.

### Zod est le seul langage de schéma

Entrée comme sortie. Les DTO de requête sont validés par `ZodValidationPipe` via `@ZodBody`,
`@ZodQuery` et `@UuidParam` ; les DTO de réponse sont un schéma plus un mapper, et Swagger est
alimenté par `z.toJSONSchema()`. `apps/api/src/response-contract.e2e.spec.ts` parse la réponse de
chaque route contre son schéma, **clés en trop comprises** : une fuite de champ fait rougir la CI.

### Un code d'erreur, trois côtés

`ApiErrorCode` vit dans `packages/contract` : l'API l'émet dans le corps, le web et le mobile le
traduisent en français. Un renommage casse donc la compilation des deux clients au lieu de les
laisser retomber en silence sur « service indisponible ». Deux garde-fous
(`apps/api/src/api-error-code.spec.ts`) interdisent un `code:` écrit en dur hors du contract, et
une entrée du contract que plus rien n'émet.

### Le web ne contient aucune logique métier

`apps/web` parle à l'API par des adapters HTTP (`core/adapters/*.http.adapter.ts`) derrière des
ports (`core/ports/*.port.ts`). Les composants de `react/components/` sont purs ; les pages de
`features/` orchestrent. Un test de graphe d'imports (`src/architecture/boundaries.test.ts`)
interdit React et Next dans `core/`, les composants dans `features/`, et tout cycle.

### Server Components par défaut

17 fichiers sur 100 portent `'use client'` — les formulaires, le calendrier, et les deux error
boundaries que React impose côté client. **Le calendrier est la seule zone interactive du produit, et
la seule justification du seul Route Handler** :
`/api/machines/[id]/availability` est le BFF qui détient le cookie `httpOnly`, que React Query
interroge au fil de la navigation de semaine. Toutes les autres mutations sont des Server Actions.

### Cache et invalidation

L'annuaire public et la fiche d'atelier sont sous `'use cache'` avec `cacheTag('ateliers')` et
`cacheLife('minutes')`. Publier ou refermer un atelier depuis `/admin/ateliers` appelle
`updateTag('ateliers')` : la donnée cachée est invalidée par l'écriture qui la périme, pas par un
délai. `cacheComponents: true` dans `next.config.ts` — les routes publiques sont en PPR (`◐`).

### Le thème vit en base, donc le serveur rend l'attribut

Pas de flash, pas de `localStorage`, pas de script client. **Le prix est le prerender** : avec
`cacheComponents`, un `cookies()` non suspendu dans un layout casse la build. D'où le découpage —
`<html>` et `<body>` dans un layout racine sans session, et le chrome descendu dans les layouts de
groupe. `(app)` déclare `instant = false` et passe en `ƒ` ; `(marketing)` et `(auth)` gardent leur
coquille prérendue.

### Trois route groups, trois responsabilités

| Groupe | Coquille | Rendu |
|---|---|---|
| `(marketing)` | `SiteShell` — navigation publique, pied de page | `◐` PPR |
| `(auth)` | mot-logo seul, aucune session lue | `○` statique, sauf `/connexion` qui lit `?next=` |
| `(app)` | `AppShell` — navigation membre selon le rôle | `ƒ` dynamique |

Deux pages d'`(app)` échappent au `ƒ` et restent en `◐` : `/machines/[id]` et `/reservations/[id]`
gardent une coquille prérendue et ne mettent derrière un `Suspense` que la part qui lit la session.
C'est ce qui permet à la fiche machine, publique, de rendre un **vrai 404** quand la machine est
retirée — et non un 200 portant un corps 404.

### L'autorisation est serveur, jamais un bouton masqué

`proxy.ts` redirige les préfixes privés sans cookie — c'est du confort, pas de la sécurité. La
vraie barrière est dans l'API : `JwtAuthGuard` et `RolesGuard` devant les routes, et le cloisonnement
par atelier vérifié dans chaque use-case. Un balayage route par route
(`apps/api/src/tenancy.e2e.spec.ts`) assert **404** sur une ressource d'un autre atelier — un 403
avouerait qu'elle existe — et **403** sur `/admin/*`.

## Modèle de données

Deux migrations, PostgreSQL.

```
users ──────┬── memberships ──── ateliers ──── machines
            │        (role: MEMBER | FABMANAGER)    │
            ├── user_preferences                    │
            ├── certifications ─────────────────────┤
            └── bookings ───────────────────────────┘
```

| Table | Colonnes notables | Contraintes |
|---|---|---|
| `users` | `email text`, `password_hash`, `platform_role`, `practice text[]`, `onboarding_completed_at`, `status` | `email` unique — normalisé en minuscules par le schéma Zod, d'où `text` et non `citext` |
| `ateliers` | `slug`, `city`, `latitude`/`longitude numeric(9,6)`, `status` | `slug` unique, index sur les coordonnées |
| `memberships` | `user_id`, `atelier_id`, `role`, `status` | unique `(user_id, atelier_id)` |
| `machines` | `kind`, `requires_certification`, `slot_duration_minutes`, `status`, `nfc_tag_id` | `nfc_tag_id` unique **sur tout le réseau** |
| `certifications` | `user_id`, `machine_id`, `status`, `decided_by` | unique `(user_id, machine_id)` |
| `bookings` | `start_at`, `end_at`, `status`, `checked_in_at`, `checked_in_via` | voir ci-dessous |
| `user_preferences` | `theme`, `default_atelier_id` | `theme IN ('dark','light','system')` |

La règle « deux créneaux ne se chevauchent jamais » est tenue **en base**, pas seulement par le code
qui la précède :

```sql
CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
  machine_id WITH =,
  tstzrange(start_at, end_at) WITH &&
) WHERE (status IN ('CONFIRMED', 'CHECKED_IN'))
```

`COMPLETED` n'est **jamais écrit** : c'est un prédicat dérivé — pointée, et sa fin passée — projeté
dans les read models. Aucun ordonnanceur, aucun `GET` qui écrit.

## L'application mobile — NFC et position

`apps/mobile` n'est pas le web en petit : elle existe pour les deux capacités que le navigateur n'a
pas. Sept écrans et deux layouts, de la connexion au créneau pointé. Sa conception est dans
`docs/superpowers/specs/2026-09-17-etabli-mobile-design.md`.

- **NFC** — `machines.nfc_tag_id` est unique sur tout le réseau, et le check-in membre n'accepte
  qu'un `nfcTagId` : une machine sans tag ne peut pas être pointée. Le navigateur ne lit pas un tag,
  donc sur le web c'est le fabmanager qui pointe depuis `/manage/bookings` ; **le téléphone lit le
  tag directement.** Le port a deux implémentations et l'écran ignore laquelle il tient :
  `nfc-manager` sur appareil, une saisie manuelle du tag partout ailleurs — Expo Go n'embarque pas le
  module natif, et la démonstration ne doit pas dépendre d'un compte développeur Apple.
- **Position** — `ateliers.latitude`/`longitude` portent un index, et l'annuaire trie par distance
  quand la requête porte une position. **La refuser n'est pas une erreur** : sans elle, l'annuaire
  appelle `GET /ateliers` sans coordonnées, la liste n'est simplement plus triée, et l'écran le dit
  avec un bouton pour réessayer.

Le token vit dans `expo-secure-store` — le trousseau du système — jamais dans `AsyncStorage`, qui
écrit en clair.

## Usage de l'IA

> Section demandée par le sujet (slide 27). **À relire et ajuster avant le rendu** : la soutenance
> porte sur le recul critique, et les exemples ci-dessous doivent être les vôtres.

**Outils** — Claude Code (Opus) en agent de développement, sur toute la durée du projet. Aucun
assistant pendant le live coding, conformément à la règle.

**Tâches confiées** — conception initiale (spec produit et modèle de données, relue puis figée dans
`docs/superpowers/specs/`), écriture des modules de l'API, des migrations, des composants, des
tests. Revue de conformité du repo au sujet. Le pilotage — quoi construire, dans
quel ordre, avec quels arbitrages — est resté humain.

**Décisions de l'IA corrigées ou refusées** :

1. **403 partout sur les ressources d'un autre atelier.** La spec générée disait 403. Refusé : un
   403 avoue que la ressource existe. Corrigé en **404 sur une ressource, 403 sur `/admin/*`**, et
   la spec a été réécrite en ce sens. C'est un choix de sécurité, pas de style.
2. **Une colonne `email_notifications` dans les préférences.** Refusée : rien n'envoie d'e-mail
   aujourd'hui, et le sujet condamne explicitement le réglage qui ne modifie rien. Elle reviendra avec le
   premier envoi.
3. **Le `DependenciesProvider` React repris du repo de référence.** Refusé : les adapters ne tournent
   que côté serveur ici, il n'y a pas de conteneur d'injection à porter dans le navigateur.
4. **Le TDD strict (E2E rouge d'abord).** Levé après le jalon 1, décision assumée : le coût de
   maintenir une centaine d'E2E rouges en parallèle de la conception ne se payait pas. Les E2E ont
   ensuite été sorties de `pnpm verify` — elles tournent à la demande.

**Partie que j'explique intégralement** — le parcours de réservation, de `GET /machines/:id/availability`
au créneau en base : le calcul des créneaux en heure locale de l'atelier, les sept règles métier du
refus, la contrainte d'exclusion `gist` qui double la règle 2, la traduction du code SQL `23P01` en
`BookingOverlapError`, et pourquoi le calendrier est la seule zone client du produit.

## Limites connues

- **Pas de révocation de session.** Changer de mot de passe réémet le jeton de l'auteur du
  changement, mais les jetons des autres appareils restent valides jusqu'à expiration. Dit à
  l'écran, figé par un test.
- **Le check-in membre n'est pas faisable depuis le web.** Le navigateur ne lit pas le NFC ; sur le
  web, le pointage passe par le fabmanager. C'est l'application mobile qui lit le tag.
- **Horaires d'ouverture constants** (8h–22h, `Europe/Paris`) pour tous les ateliers. Par atelier en v1.1.
- **Aucun e-mail.** Pas de confirmation de réservation, pas de relance, pas de réinitialisation de
  mot de passe. C'est aussi pourquoi il n'y a pas de préférence de notification : un réglage qui ne
  modifie rien n'a pas à exister.
- **Les écrans mobiles ne sont pas testés.** Monter React Native sous vitest demande un preset et des
  mocks natifs pour un parcours qui se vérifie à la main ; seuls les modèles et le calcul des
  créneaux le sont.
- **Les visuels sont sous licence Pexels** (usage commercial, sans attribution obligatoire ;
  `apps/web/public/marketing/LICENSES.md` crédite quand même). Un atelier qui ne publie aucune
  machine n'a pas de type à photographier : sa carte retombe sur une planche dessinée par
  `scripts/generate-cover-art.py`.
- **Pas de pagination** sur l'annuaire ni sur les listes d'administration : filtres et plafond
  seulement. Suffisant à l'échelle de la démonstration.

## Déploiement

Le monorepo se déploie en deux cibles.

1. **API** — `apps/api` est un serveur Node long-running (`pnpm --filter @etabli/api run build`
   puis `node apps/api/dist/main.js`). Il n'a pas d'adaptateur serverless : viser Railway, Render,
   Fly ou un conteneur, pas les Functions Vercel. Variables requises : `DATABASE_URL` et
   `JWT_SECRET` ; `PORT` vaut 3001 par défaut.
2. **Web** — `apps/web`, projet Vercel, racine `apps/web`. Variables requises : `API_URL`
   (l'URL publique de l'API), `NEXT_PUBLIC_SITE_URL`, `COOKIE_SECURE=true`.

Le cookie de session est posé par Next sur son propre domaine, sans option `domain` : il ne quitte
jamais le web. C'est le serveur Next qui lit le jeton et le passe à l'API en `Bearer`, donc l'API
peut vivre sur un autre domaine sans rien partager. `COOKIE_DOMAIN` est encore validée par le schéma
d'environnement de l'API mais n'est lue nulle part — à retirer.

Les migrations tournent hors du build : `pnpm run db:migrate` avec le `DATABASE_URL` de production,
puis `pnpm run db:seed` pour les comptes de démonstration.

Une fois déployé, reporter les deux URLs en tête de ce README.

## Tests

664 tests unitaires et d'intégration dans `pnpm check`, 103 E2E Playwright à la demande. Les tests
sont colocalisés ; les E2E portent l'extension `.test.e2e.ts` et vivent à côté de la page couverte.

`apps/api` en porte 275, sur trois étages : unitaires sur stubs et horloge figée, intégration des
repositories sur PGlite, bout en bout HTTP via supertest. Pas de Docker — chaque suite monte sa
propre base en mémoire, donc l'isolation y est structurelle, là où les E2E Playwright la tiennent
d'un `TRUNCATE` au `globalSetup`.
