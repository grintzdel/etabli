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

### Membre

- Inscription, connexion, déconnexion ; session serveur en cookie `httpOnly`
- **Onboarding** (`/bienvenue`) — rejoindre un atelier et déclarer ses pratiques ; sans lui, rien n'est réservable
- `/tableau-de-bord` — prochain créneau, compteurs, habilitations en attente
- `/habilitations` — demander l'accès à une machine, suivre la décision
- `/machines/[id]` — calendrier de la semaine, réservation d'un créneau
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

## Comptes de démonstration

`pnpm db:seed` insère ces comptes de façon idempotente. **Mot de passe commun : `etabli-2026`.**

Le seed pose aussi 10 habilitations et 13 réservations — à venir, pointées, non honorée, annulée —
pour que le tableau de bord, les files de validation et les statistiques ouvrent sur des chiffres.
**Les créneaux sont datés relativement à maintenant** : un `db:seed` les réécrit pour que le
« prochain créneau » soit toujours devant. C'est la seule partie du seed qui remplace au lieu
d'ignorer les conflits.

| E-mail | Rôle | À quoi il sert |
|---|---|---|
| `admin@etabli.test` | Administrateur plateforme | Tout `/admin/*` |
| `fabmanager.forge@etabli.test` | Fabmanager — La Forge | Tout `/manage/*` sur un atelier |
| `fabmanager.lyon@etabli.test` | Fabmanager — deux ateliers | Vérifier le cloisonnement multi-atelier |
| `membre@etabli.test` | Membre habilité, 2 ateliers | Parcours complet : créneaux à venir, historique, 1 demande en attente |
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
pnpm run dev                  # API sur :3001, web sur :3000
```

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | URL *pooled* PostgreSQL |
| `JWT_SECRET` | 32 caractères minimum, HS256 |
| `API_URL` | Où le web joint l'API (`http://localhost:3001` en dev) |
| `COOKIE_SECURE` | `true` en production |
| `NEXT_PUBLIC_SITE_URL` | Base des URLs canoniques, du sitemap et de l'Open Graph |

### Les deux implémentations de l'API

`pnpm run dev` lance l'API Effect (`packages/server`). La v2 NestJS tient les mêmes 38 routes et
se lance à sa place :

```bash
pnpm run db:migrate:api
pnpm run db:seed:api
pnpm run dev:api        # sur le même port, avec pnpm run dev:web à côté
```

Sa conception est dans `docs/superpowers/specs/2026-09-15-etabli-api-nestjs-design.md`. Deux routes
y changent de nom — `PATCH /me/profile` au lieu de `PATCH /auth/me`, et `POST /certifications/request`
au lieu de `POST /certifications`. **Le web est câblé sur la v1** : le basculer demande d'ajuster
ces deux chemins dans `packages/contract`.

### Vérifier

```bash
pnpm run check      # build des packages, format, lint, typecheck, 830 tests unitaires
pnpm run verify     # check + next build
```

Les E2E Playwright tournent à part, contre le Postgres de test :

```bash
pnpm run db:test:up     # postgres:18-alpine sur :5433, tmpfs
pnpm run test:e2e       # 95 scénarios
pnpm run db:test:down
```

> Le conteneur de test tourne sur un `tmpfs` : un `db:test:down` puis `db:test:up` repart d'une base
> vierge. **Sans cette remise à zéro la base accumule d'un run à l'autre** et des tests sans rapport
> tombent sur des créneaux épuisés. Défaut d'isolation connu, voir [Limites](#limites-connues).

## Organisation

| Chemin | Rôle |
|---|---|
| `packages/contract` | types TypeScript purs et table de routes — aucune dépendance |
| `packages/shared` | primitives Effect : identifiants brandés, `AuthContext`, `Clock`, migrations |
| `packages/bc-identity` | comptes, session, préférences, back-office utilisateurs |
| `packages/bc-atelier` | ateliers, adhésions, machines, onboarding |
| `packages/bc-certification` | demande, octroi, révocation d'habilitation |
| `packages/bc-booking` | disponibilités, réservation, check-in, no-show, statistiques |
| `packages/server` | `HttpApi` Effect, Layers, migrator, serveur Node (`src/main.ts`) |
| `packages/test-utils` | client SQL pglite pour les tests d'intégration |
| `apps/web` | application Next.js — App Router, Server Components, Server Actions |
| `apps/api` | seconde implémentation de l'API, en NestJS, Drizzle et Zod (voir ci-dessous) |
| `scripts/` | `generate-cover-art.py` — les planches de l'annuaire |

Le préfixe à quatre chiffres des migrations porte l'ordre global, tous packages confondus : un
doublon fait échouer le démarrage.

## Choix d'architecture

### Un package par bounded context

Les contextes ne se dépendent pas. Chacun déclare un port pour ce qu'il attend d'un autre —
`MembershipLookup`, `MemberProfile`, `MemberAteliers`, `MachineDirectory`, `MachineCatalog` — et
`packages/server/src/layers/` les branche. Ajouter un contexte ne modifie aucun des autres.

### Effect.ts de bout en bout côté serveur

Commands et queries retournent un `Effect` dont le canal d'erreur est explicite dans la signature :
les refus métier sont dans le type, pas dans un `throw`. `HttpApiEndpoint.addError(E, { status })`
projette chaque `TaggedError` sur son statut HTTP, une seule fois, à l'endroit où la route est
déclarée. SQL brut via `@effect/sql-pg`, aucun ORM.

### Le web ne contient aucune logique métier

`apps/web` parle à l'API par des adapters HTTP (`core/adapters/*.http.adapter.ts`) derrière des
ports (`core/ports/*.port.ts`). Les composants de `react/components/` sont purs ; les pages de
`features/` orchestrent. Un test de graphe d'imports (`src/architecture/boundaries.test.ts`)
interdit React et Next dans `core/`, les composants dans `features/`, et tout cycle.

### Server Components par défaut

17 fichiers sur 102 portent `'use client'` — les formulaires, le calendrier, et les quatre error
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
| `(auth)` | mot-logo seul, aucune session lue | `○` statique |
| `(app)` | `AppShell` — navigation membre selon le rôle | `ƒ` dynamique |

### L'autorisation est serveur, jamais un bouton masqué

`proxy.ts` redirige les préfixes privés sans cookie — c'est du confort, pas de la sécurité. La
vraie barrière est dans les commands et queries : `ForbiddenError` levé sur l'`AuthContext`, et un
balayage route par route (`packages/server/src/http/tenancy.test.ts`) qui assert **404** sur une
ressource d'un autre atelier — un 403 avouerait qu'elle existe — et **403** sur `/admin/*`.

## Modèle de données

Six migrations, ordre global, PostgreSQL.

```
users ──────┬── memberships ──── ateliers ──── machines
            │        (role: MEMBER | FABMANAGER)    │
            ├── user_preferences                    │
            ├── certifications ─────────────────────┤
            └── bookings ───────────────────────────┘
```

| Table | Colonnes notables | Contraintes |
|---|---|---|
| `users` | `email citext`, `password_hash`, `platform_role`, `practice text[]`, `onboarding_completed_at`, `status` | `email` unique |
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

## La suite mobile — NFC et géolocalisation

Le web prépare l'application React Native ; les deux capacités natives sont déjà en base.

- **NFC** — `machines.nfc_tag_id` est unique sur tout le réseau. Le check-in membre n'accepte qu'un
  `nfcTagId` : une machine sans tag ne peut pas être pointée. Aujourd'hui le navigateur ne sait pas
  lire un tag, donc c'est le fabmanager qui pointe à la place du membre depuis `/manage/bookings`.
  **L'application mobile lira le tag directement** — c'est exactement le trou qu'elle comble.
- **Géolocalisation** — `ateliers.latitude`/`longitude` portent un index, et l'annuaire calcule déjà
  une distance quand la requête porte une position (`AtelierCard` l'affiche). Sur mobile, l'annuaire
  ouvrira sur les ateliers autour de soi plutôt que sur une liste.

## Usage de l'IA

> Section demandée par le sujet (slide 27). **À relire et ajuster avant le rendu** : la soutenance
> porte sur le recul critique, et les exemples ci-dessous doivent être les vôtres.

**Outils** — Claude Code (Opus) en agent de développement, sur toute la durée du projet. Aucun
assistant pendant le live coding, conformément à la règle.

**Tâches confiées** — conception initiale (spec produit et modèle de données, relue puis figée dans
`docs/superpowers/specs/`), écriture des packages de bounded context, des migrations, des
composants, des tests. Revue de conformité du repo au sujet. Le pilotage — quoi construire, dans
quel ordre, avec quels arbitrages — est resté humain.

**Décisions de l'IA corrigées ou refusées** :

1. **403 partout sur les ressources d'un autre atelier.** La spec générée disait 403. Refusé : un
   403 avoue que la ressource existe. Corrigé en **404 sur une ressource, 403 sur `/admin/*`**, et
   la spec a été réécrite en ce sens. C'est un choix de sécurité, pas de style.
2. **Une colonne `email_notifications` dans les préférences.** Refusée : rien n'envoie d'e-mail dans
   la v1, et le sujet condamne explicitement le réglage qui ne modifie rien. Elle reviendra avec le
   premier envoi.
3. **Le `DependenciesProvider` React repris du repo de référence.** Refusé : les adapters ne tournent
   que côté serveur ici, il n'y a pas de conteneur d'injection à porter dans le navigateur.
4. **Le TDD strict (E2E rouge d'abord).** Levé après le jalon 1, décision assumée : le coût de
   maintenir 95 E2E rouges en parallèle de la conception ne se payait pas. Les E2E ont ensuite été
   sorties de `pnpm verify` — elles tournent à la demande.

**Partie que j'explique intégralement** — le parcours de réservation, de `GET /machines/:id/availability`
au créneau en base : le calcul des créneaux en heure locale de l'atelier, les sept règles métier du
refus, la contrainte d'exclusion `gist` qui double la règle 2, la traduction du code SQL `23P01` en
`BookingOverlapError`, et pourquoi le calendrier est la seule zone client du produit.

## Limites connues

- **Deux implémentations de l'API coexistent.** `packages/server` (Effect) est celle que le web
  interroge ; `apps/api` (NestJS, Drizzle, Zod) tient les mêmes routes et ses propres 255 tests, mais
  aucun écran ne s'y branche encore. Deux back-ends à maintenir pour un seul produit : à trancher
  avant le rendu, et à savoir défendre en soutenance si les deux restent.
- **Isolation des E2E.** Le Postgres de test accumule d'un run à l'autre ; il faut `db:test:down`
  puis `db:test:up` entre deux campagnes. Non corrigé.
- **Pas de révocation de session.** Changer de mot de passe réémet le jeton de l'auteur du
  changement, mais les jetons des autres appareils restent valides jusqu'à expiration. Dit à
  l'écran, figé par un test.
- **Le check-in membre n'est pas faisable depuis le web.** Le navigateur ne lit pas le NFC ; le
  pointage passe par le fabmanager en attendant l'application mobile.
- **Horaires d'ouverture constants** (8h–22h, `Europe/Paris`) pour tous les ateliers. Par atelier en v1.1.
- **Aucun e-mail.** Pas de confirmation de réservation, pas de relance, pas de réinitialisation de
  mot de passe.
- **Les planches de l'annuaire sont générées**, pas photographiées : aucune image n'est sous licence
  pour ce projet. `scripts/generate-cover-art.py` les redessine à l'identique.
- **Pas de pagination** sur l'annuaire ni sur les listes d'administration : filtres et plafond
  seulement. Suffisant à l'échelle de la démonstration.

## Déploiement

Le monorepo se déploie en deux cibles.

1. **API** — `packages/server` est un serveur Node long-running (`pnpm --filter @etabli/server run build`
   puis `node dist/src/main.mjs`). Il n'a pas d'adaptateur serverless : viser Railway, Render, Fly ou
   un conteneur, pas les Functions Vercel. Variables requises : `DATABASE_URL`, `JWT_SECRET`,
   `COOKIE_SECURE=true`, `COOKIE_DOMAIN`, `PORT`.
2. **Web** — `apps/web`, projet Vercel, racine `apps/web`. Variables requises : `API_URL`
   (l'URL publique de l'API), `NEXT_PUBLIC_SITE_URL`, `COOKIE_SECURE=true`.

Le cookie de session est posé par Next sur son propre domaine : si l'API est sur un autre domaine,
`COOKIE_DOMAIN` doit couvrir les deux, ou l'API doit être servie derrière le même domaine.

Les migrations tournent hors du build : `pnpm run db:migrate` avec le `DATABASE_URL` de production,
puis `pnpm run db:seed` pour les comptes de démonstration.

Une fois déployé, reporter les deux URLs en tête de ce README.

## Tests

830 tests unitaires et d'intégration dans `pnpm check`, 95 E2E Playwright à la demande. Les tests
sont colocalisés ; les E2E portent l'extension `.test.e2e.ts` et vivent à côté de la page couverte.
Les repositories sont testés sur pglite, les routes HTTP sur un Postgres réel.
