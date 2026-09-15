# Établi — document de conception

**Projet fil rouge M2 EEMI 2026 · Next.js 16.3**
Auteur : Mathis · Document créé le 14 septembre 2026

---

## Sommaire

1. [Présentation](#1--présentation)
2. [Vision](#2--vision)
3. [Utilisateurs et rôles](#3--utilisateurs-et-rôles)
4. [Fonctionnalités](#4--fonctionnalités)
5. [Règles métier](#5--règles-métier)
6. [Continuité mobile : NFC et géolocalisation](#6--continuité-mobile--nfc-et-géolocalisation)
7. [Roadmap produit](#7--roadmap-produit)
8. [Fiche technique](#8--fiche-technique)
9. [Modèle de données](#9--modèle-de-données)
10. [Surface d'API](#10--surface-dapi)
11. [Conformité au barème](#11--conformité-au-barème)
12. [Limites connues](#12--limites-connues)
13. [Usage de l'IA](#13--usage-de-lia)

---

## 1 · Présentation

**Établi** est la plateforme d'un réseau d'ateliers partagés — fablabs, ateliers bois, métal, électronique. Les ateliers y publient leur parc de machines ; les membres y passent leurs habilitations puis réservent des créneaux machine.

La phrase qui résume le produit :

> On ne réserve pas une découpeuse laser parce qu'elle est libre. On la réserve parce qu'on a le droit de s'en servir.

Cette nuance est le produit. Un calendrier de réservation est un CRUD ; un calendrier qui refuse une réservation parce que le membre n'est pas habilité, que la machine est en maintenance, ou que le créneau chevauche celui d'un autre, est un système métier.

### Ce que le produit n'est pas

Un site vitrine, un portfolio, une landing page avec un faux tableau de bord. Le cœur du produit vit derrière l'authentification, s'appuie sur une base Postgres réelle, et survit à un rechargement de page.

---

## 2 · Vision

### Le problème

Un atelier partagé jongle aujourd'hui entre un groupe de messagerie pour les demandes de créneau, un tableur pour savoir qui est habilité à quoi, et un cahier posé à côté de la machine pour la présence. Trois sources de vérité qui divergent, et un fabmanager qui arbitre à la main.

Les conséquences sont concrètes : des machines réservées par des gens qui ne savent pas s'en servir, des créneaux réservés puis jamais honorés pendant qu'une file d'attente existe, et aucune trace exploitable de l'usage réel du parc.

### La proposition

Une seule source de vérité qui relie trois objets que personne ne relie aujourd'hui : **l'habilitation**, **le créneau** et **la présence physique**.

- L'habilitation conditionne la réservation. Le système refuse, il n'alerte pas.
- Le créneau est exclusif et vérifié jusque dans la base.
- La présence est prouvée par un tag NFC sur la machine, pas déclarée.

### Pour qui

Le réseau, pas l'atelier isolé. Un membre déménage, voyage, veut une machine que son atelier n'a pas — la valeur naît quand les ateliers sont plusieurs et que la question devient « où, autour de moi, puis-je faire ça maintenant ? ».

### Ce qu'on refuse de construire

Pas de messagerie interne. Pas de réseau social de makers. Pas de marketplace de projets. Pas de paiement réel. Chacune de ces briques est un produit à part entière ; les ajouter diluerait le seul flux qui doit être irréprochable.

---

## 3 · Utilisateurs et rôles

### Les personae

**Sarah, membre.** Designer produit, fréquente l'atelier deux soirs par semaine. Veut savoir en trente secondes si la découpeuse laser est libre jeudi soir et si elle a le droit de la prendre. N'a aucune envie de lire un règlement intérieur.

**Karim, fabmanager.** Gère l'atelier de Montreuil. Passe trop de temps à répondre « tu n'es pas habilité » et à retrouver qui a laissé la CNC dans cet état. Veut que le système dise non à sa place, et savoir qui était devant la machine à 19 h.

**Léa, administratrice plateforme.** Ouvre de nouveaux ateliers sur le réseau, suit l'usage global, arbitre les comptes. Ne doit jamais avoir à ouvrir un client SQL.

### Les trois rôles

| Rôle | Portée | Peut |
|---|---|---|
| `MEMBER` | Ses adhésions | Réserver, annuler, pointer, demander une habilitation, gérer son profil |
| `FABMANAGER` | **Son** atelier uniquement | Gérer les machines, accorder et révoquer les habilitations, voir et annuler les réservations de son atelier |
| `PLATFORM_ADMIN` | Le réseau | Créer et publier des ateliers, nommer les fabmanagers, consulter les utilisateurs et les statistiques réseau |

Le rôle plateforme est porté par l'utilisateur ; le rôle `FABMANAGER` est porté par **l'adhésion**, pas par l'utilisateur. Un même compte peut être membre à Lyon et fabmanager à Montreuil. C'est cette distinction qui rend l'autorisation intéressante — et c'est elle qu'un correcteur cherchera à mettre en défaut.

**Point d'attention permanent** : un fabmanager ne doit rien pouvoir lire d'un atelier qui n'est pas le sien. Vérifié dans chaque command et chaque query côté serveur, jamais par masquage d'un bouton.

---

## 4 · Fonctionnalités

Les six expériences imposées par le brief, plus le back-office transversal.

### 4.1 · Présence publique — `(marketing)`

Accessible sans compte, indexable.

- Accueil : proposition de valeur, fonctionnement en trois temps, réassurance
- `/ateliers` — annuaire du réseau, recherche par ville et par type de machine
- `/ateliers/[slug]` — **page publique dynamique** : présentation de l'atelier, parc de machines avec leur statut, adresse et carte
- FAQ, pages légales
- `generateMetadata` par page, Open Graph, `sitemap.ts`, `robots.ts`, images via `next/image`

La page atelier est le poumon SEO : une page par atelier du réseau, du contenu réel, aucune authentification.

### 4.2 · Authentification — `(auth)`

Inscription, connexion, déconnexion. Session récupérée côté serveur. Routes privées réellement privées.

### 4.3 · Onboarding — `(onboarding)`

Créer un compte ne suffit pas : à la première connexion, l'utilisateur n'est pas encore membre d'un atelier, donc ne peut rien réserver. L'onboarding transforme le compte en usager du produit.

1. Choisir son atelier principal — par ville sur le web, par géolocalisation sur mobile
2. Déclarer sa pratique — bois, métal, électronique, textile, impression 3D
3. Demander ses premières habilitations sur les machines correspondantes

Il en résulte une **adhésion** persistée et des **demandes d'habilitation** en attente de validation. L'onboarding produit de la donnée métier, ce n'est pas un tunnel décoratif.

### 4.4 · Espace membre — `(app)`

- **Tableau de bord** — prochaines réservations, habilitations et leur statut, heures d'atelier du mois, machines de son atelier disponibles maintenant
- **Machines** — liste filtrable par atelier, type, disponibilité et habilitation détenue ; pagination
- **Détail machine** — description, statut, calendrier des créneaux
- **Mes réservations** — liste et détail, annulation, historique

### 4.5 · Module métier — la réservation

Le parcours complet, celui qui persiste réellement :

```
recherche d'atelier  →  machine  →  créneau  →  réservation
        →  confirmation  →  check-in  →  historique et heures cumulées
```

Le calendrier de disponibilité est la seule zone franchement interactive du produit : navigation de semaine, sélection de créneau, affichage immédiat des indisponibilités.

### 4.6 · Paramètres — `(app)/parametres`

- **Profil** — nom affiché, pratique déclarée
- **Préférences** — thème, atelier par défaut, notifications par e-mail
- **Sécurité** — changement de mot de passe

Chaque champ est persisté en base et relu au rechargement. Une page de réglages qui ne modifie rien n'est pas une page de réglages.

### 4.7 · Back-office — `(admin)`

Le back-office n'est pas le tableau de bord recoloré : on y fait des actions que le membre ne peut pas faire.

**Fabmanager, sur son atelier**

- **Habilitations à valider** — la file d'attente, accorder ou révoquer avec motif
- **Machines** — créer, modifier, passer en maintenance, associer un tag NFC
- **Réservations** — consulter, filtrer, annuler, marquer un no-show
- **Statistiques** — taux d'occupation par machine, no-shows, heures consommées

**Administrateur plateforme**

- **Ateliers** — créer, publier, fermer
- **Utilisateurs** — consulter, nommer un fabmanager, suspendre
- **Statistiques réseau**

---

## 5 · Règles métier

Le cœur. Ce sont des règles de **refus** : le système dit non, avec une erreur typée distincte, et le front affiche un message précis.

| # | Règle | Erreur | HTTP |
|---|---|---|---|
| 1 | Une machine `requiresCertification` n'est réservable qu'avec une habilitation `GRANTED` **sur cette machine** | `MissingCertificationError` | 403 |
| 2 | Deux réservations ne peuvent se chevaucher sur la même machine | `BookingOverlapError` | 409 |
| 3 | Une machine en `MAINTENANCE` ou `RETIRED` n'est pas réservable | `MachineUnavailableError` | 409 |
| 4 | Un fabmanager n'agit que dans son atelier | `ForbiddenError` | 403 |
| 5 | Le check-in n'est possible qu'entre 15 min avant et 30 min après le début du créneau | `CheckInWindowClosedError` | 409 |
| 6 | Le tag NFC présenté doit être celui de la machine réservée | `NfcTagMismatchError` | 409 |
| 7 | Seul le propriétaire d'une réservation peut l'annuler, et pas après le début | `BookingNotCancellableError` | 409 |
| 8 | Un créneau déjà passé n'est pas réservable | `SlotInThePastError` | 409 |

Reportées en v1.1 : le créneau doit tomber dans les horaires d'ouverture de l'atelier ; un membre ne peut dépasser un quota d'heures sur une fenêtre glissante de sept jours.

La règle 1 disait d'abord « pour ce type de machine, dans cet atelier », et parlait d'une habilitation « non expirée ». Le jalon 3 a posé l'habilitation sur une machine, sans date d'expiration, et toute l'interface de validation nomme une machine ; la règle a été resserrée pour dire ce que le code garantit. Élargir au type plus tard n'invalide aucune habilitation déjà accordée — l'inverse retirerait des accès.

La règle 8 ne figurait pas dans le brief. Aucune des sept autres n'interdisait de réserver un créneau révolu.

Une réservation qui n'appartient pas à l'appelant répond `404`, jamais `403` : le statut ne doit pas révéler son existence.

### La règle 2 est garantie deux fois

Elle est vérifiée dans la command — pour produire une erreur lisible — **et** dans la base, par une contrainte d'exclusion Postgres :

```sql
EXCLUDE USING gist (
  machine_id WITH =,
  tstzrange(start_at, end_at) WITH &&
) WHERE (status IN ('CONFIRMED', 'CHECKED_IN'))
```

La vérification applicative peut perdre la course entre deux requêtes simultanées ; la contrainte de base, non. La command est là pour la qualité du message, la base pour la correction.

---

## 6 · Continuité mobile : NFC et géolocalisation

Le brief pose deux questions de validation avant de retenir un concept. Voici les réponses, et elles ne sont pas artificielles.

### À quoi servira concrètement le NFC ?

Chaque machine porte un tag NFC collé sur son bâti. Le membre approche son téléphone, l'application lit le tag et appelle `POST /bookings/:id/check-in` en transmettant l'identifiant du tag. Le serveur vérifie que le tag correspond bien à la machine réservée et que l'heure tombe dans la fenêtre autorisée.

**Conséquence : on ne peut pas pointer depuis chez soi.** Sans NFC, le check-in est déclaratif — donc faux, donc inutile pour mesurer l'occupation réelle ou objecter un no-show. Le téléphone apporte ici une preuve de présence physique que le web ne peut structurellement pas produire.

Bénéfice dérivé pour le fabmanager : savoir qui était devant la CNC à 19 h quand on la retrouve abîmée.

### Pourquoi la géolocalisation améliore-t-elle réellement l'expérience ?

La question du membre en mobilité est : « quel atelier **autour de moi** a une découpeuse laser libre dans l'heure ? »

Sur le web, c'est un champ « ville », forcément approximatif et saisi à la main. Sur mobile, c'est la position réelle, en déplacement, sans saisie — et le tri par distance devient l'ordre naturel de la liste.

Même question, réponse d'une autre nature. La future application React Native ne sera donc pas une copie responsive du site : c'est le téléphone qui apporte la position et la preuve de présence.

L'API est conçue pour ça dès maintenant : `GET /ateliers?lat=&lng=&radiusKm=&machineKind=&availableWithinMinutes=` existe côté serveur, et le web s'en sert avec les coordonnées d'une ville là où le mobile passera le GPS.

---

## 7 · Roadmap produit

Principe directeur : **construire le produit d'abord, le polir ensuite**. Chaque jalon est livrable, testé et démontrable. On ne commence pas un jalon avant que le précédent soit vert.

### Jalon 0 · Fondations

Monorepo pnpm, `packages/contract`, `packages/shared`, squelette `packages/server`, connexion Neon, migrator, oxlint et oxfmt, vitest, Playwright, lefthook. Tokens de design « industriel sombre » et premières primitives d'interface.

*Terminé quand* : `pnpm check` passe sur un dépôt vide de métier, et la page d'accueil s'affiche avec la bonne direction artistique.

### Jalon 1 · Identité

`bc-identity` : inscription, connexion, déconnexion, hachage de mot de passe, émission du JWT. Cookie httpOnly posé par Next. `proxy.ts`. Routes privées réellement privées. Rôle plateforme.

*Terminé quand* : une route `(app)` visitée sans session redirige vers la connexion, et un appel direct à l'API sans jeton répond 401.

### Jalon 2 · Ateliers, machines et onboarding

`bc-atelier` : ateliers, adhésions, machines. Pages publiques `/ateliers` et `/ateliers/[slug]` avec cache balisé et métadonnées. Onboarding complet produisant une adhésion.

*Terminé quand* : un nouveau compte traverse l'onboarding, devient membre d'un atelier, et la page publique de cet atelier est indexable et rapide.

### Jalon 3 · Habilitations

`bc-certification` : demander, accorder, révoquer, expirer. File de validation côté fabmanager. Affichage du statut d'habilitation sur chaque machine côté membre.

*Terminé quand* : un fabmanager accorde une habilitation et le membre voit immédiatement la machine passer de « non habilité » à réservable.

### Jalon 4 · Réservation — le module métier

`bc-booking` : calcul de disponibilité, création avec les sept règles de refus, annulation, check-in, no-show. Calendrier de créneaux interactif. Contrainte d'exclusion en base.

*Terminé quand* : le parcours complet, de la recherche d'atelier au check-in, fonctionne et persiste ; et chacune des sept règles est démontrable avec son message d'erreur propre.

### Jalon 5 · Paramètres

Profil, préférences persistantes, changement de mot de passe, retours de succès et d'erreur.

*Terminé quand* : une préférence modifiée survit à une déconnexion et à un rechargement.

### Jalon 6 · Back-office

Espace fabmanager et espace administrateur plateforme, avec filtres et statistiques simples. Cloisonnement par atelier vérifié côté serveur.

*Terminé quand* : un fabmanager authentifié qui forge une requête vers un autre atelier reçoit 403, et non des données.

### Jalon 7 · Production

Les six états d'interface partout, stratégie de cache et d'invalidation démontrable, audit Lighthouse interprété, accessibilité des formulaires, focus visible, seed de démonstration, comptes de test, README de reprise, déploiement.

*Terminé quand* : la checklist du brief est intégralement cochée.

### Au-delà du rendu

| Version | Contenu |
|---|---|
| **v1.1** | Horaires d'ouverture par atelier, quota d'heures glissant, relance e-mail avant créneau |
| **v1.2** | Maintenance planifiée, historique d'incidents par machine, export CSV des heures |
| **v2 — mobile** | Application React Native : check-in NFC, recherche géolocalisée, notifications, consultation hors ligne de ses réservations |
| **v2.1** | Crédits d'atelier et facturation simulée |

---

## 8 · Fiche technique

### 8.1 · Vue d'ensemble

| Couche | Choix |
|---|---|
| Front | Next.js 16.3, App Router, React 19, TypeScript strict |
| Style | Tailwind CSS v4, primitives shadcn/ui reposées sur des tokens propres |
| Données client | Server Components et Server Actions ; React Query uniquement sur les zones interactives |
| API | Serveur Effect.ts autonome, `@effect/platform` HttpApi |
| Base | PostgreSQL sur Neon, SQL écrit à la main via `@effect/sql-pg` — **aucun ORM** |
| Auth | JWT `jose` + bcryptjs, cookie httpOnly posé côté Next |
| Tests | Vitest, `@effect/vitest`, pglite, Playwright |
| Qualité | oxlint, oxfmt, TypeScript project references, lefthook |
| Déploiement | Web et API en projets Vercel distincts, base Neon |

### 8.2 · Le monorepo

```
etabli/
├── apps/
│   ├── web/                    Next.js 16.3
│   └── mobile/                 v2 — Expo / React Native
├── packages/
│   ├── contract/               types TS purs + table de routes — ZÉRO dépendance
│   ├── shared/                 Effect : AuthContext, errors, Clock, IdGenerator, helpers schema
│   ├── bc-identity/            utilisateurs, mots de passe, sessions, rôles, préférences
│   ├── bc-atelier/             ateliers, adhésions, machines
│   ├── bc-certification/       habilitations
│   ├── bc-booking/             réservations, check-in, no-show
│   └── server/                 HttpApi, Layers, migrations, seed, points d'entrée
├── pnpm-workspace.yaml
└── .oxlintrc.json · .oxfmtrc.json · lefthook.yml
```

**Pourquoi des packages et non des dossiers.** Une frontière de package est la seule qui ne se contourne pas : `bc-booking` ne peut pas importer le repository de `bc-atelier` parce que ce package n'est pas dans ses dépendances — pas parce qu'une règle de lint le gronde. L'architecture est garantie par l'outil de build, pas par la discipline.

### 8.3 · Anatomie d'un bounded context

```
packages/bc-booking/src/
├── domain/
│   ├── booking.schema.ts            schemas Effect, types dérivés, identifiants brandés
│   ├── booking.constants.ts         objets as const — jamais d'enum
│   └── errors.ts                    TaggedError
├── application/
│   ├── commands/
│   │   ├── create-booking/          create-booking.command.ts + .test.ts
│   │   ├── cancel-booking/
│   │   └── check-in-booking/
│   └── queries/
│       ├── list-my-bookings/
│       └── get-machine-availability/
├── infrastructure/
│   ├── booking.repository.ts        Context.Tag + interface
│   ├── booking.repository.sql.ts    implémentation @effect/sql-pg
│   ├── booking.repository.memory.ts implémentation de test
│   └── migrations/0004_create_bookings.sql
└── http/
    ├── booking.api.ts               HttpApiGroup + HttpApiEndpoint
    └── booking.handlers.ts
```

**CQRS physique** : les écritures et les lectures vivent dans des dossiers distincts. Une command retourne un identifiant ou une entité courte ; une query retourne un read model taillé pour son écran, pas l'entité riche.

Une command lit comme la règle de gestion elle-même :

```
parse du payload  →  AuthContext  →  charger la machine  →  refuser si indisponible
  →  exiger l'habilitation si la machine l'impose  →  refuser si chevauchement
  →  insérer  →  publier BookingCreated
```

**Entités TypeScript pures, aucun ORM.** Le schéma Effect est la source de vérité des types et de la validation ; le repository écrit le SQL ; les migrations sont des fichiers `.sql` numérotés, joués au démarrage par un `MigratorLayer`.

### 8.4 · Communication entre contextes

`bc-booking` doit savoir si un membre est habilité, sans avoir le droit de lire la base de `bc-certification`.

Il déclare donc un `Context.Tag` de lookup :

```ts
export class CertificationLookup extends Context.Tag('@etabli/CertificationLookup')<
  CertificationLookup,
  { readonly isCertified: (u: UserId, a: AtelierId, k: MachineKind) => Effect.Effect<boolean, RepoError> }
>() {}
```

`packages/server` câble ce tag sur l'implémentation réelle fournie par `bc-certification`. Le contexte reste testable seul avec un lookup en mémoire, et le couplage est une interface, pas une jointure SQL.

### 8.5 · Le contrat d'API

`packages/contract` ne contient **aucune dépendance et aucun code exécuté** : des types TypeScript et la table des routes.

```ts
export type Booking = { id: string; machineId: string; startAt: string; status: BookingStatus }
export const routes = { bookings: { create: '/bookings', checkIn: '/bookings/:id/check-in' } } as const
```

Le lien avec le domaine Effect est verrouillé au niveau type, côté back :

```ts
type _BookingContractIsUpToDate = AssertEquals<Schema.Schema.Encoded<typeof BookingSchema>, Contract.Booking>
```

L'assertion porte sur `Encoded` et non sur `Type` : c'est la forme qui transite réellement sur le réseau — les dates y sont des chaînes ISO, pas des `DateTime`. Si le schéma Effect dérive d'un champ, `tsc` casse dans le back, pas en production.

**Pourquoi pas OpenAPI.** Un schéma JSON intermédiaire et une étape de génération à ne jamais oublier de relancer, pour un monorepo dont les deux moitiés compilent ensemble de toute façon. Ici, TypeScript est déjà le contrat. Coût assumé : la forme est écrite deux fois — mais l'assertion transforme cette duplication en duplication vérifiée.

Et surtout : le front et la future application mobile importent un package qui ignore jusqu'à l'existence d'Effect.

### 8.6 · Le front — ports et adapters

```
apps/web/src/
├── app/                    (marketing) (auth) (onboarding) (app) (admin) api/
├── features/               orchestrateurs de page — aucun composant
├── modules/<module>/
│   ├── core/               aucune ligne de React ni de Next
│   │   ├── model/          DTO et mappers, adossés à @etabli/contract
│   │   ├── ports/          IBookingPort
│   │   ├── adapters/       booking.http.adapter.ts · booking.in-memory.adapter.ts
│   │   └── lib/
│   └── react/
│       ├── components/     purs — props entrantes, événements sortants
│       └── hooks/
├── ui/                     design system
└── proxy.ts
```

`IBookingPort` décrit toutes les requêtes possibles du domaine. `BookingHttpAdapter implements IBookingPort` tape l'API Effect. `BookingInMemoryAdapter` sert les tests et permet de développer un écran avant que l'endpoint existe.

**Les adapters ne tournent que côté serveur.** C'est le choix qui simplifie tout le reste :

- un **Server Component** appelle le port directement, via un conteneur construit à partir du cookie de session ;
- une **Server Action** fait de même pour les mutations, puis invalide le cache ;
- une **zone client interactive** n'a pas d'adapter : elle interroge en React Query un **Route Handler** de Next, qui appelle le port côté serveur.

Deux conséquences. D'abord, aucun conteneur d'injection dans le navigateur — donc pas de contexte React de dépendances. Ensuite, le Route Handler a la justification que le brief réclame : c'est le BFF des zones client, le seul endroit qui détient le cookie httpOnly.

`core/` n'important ni React ni Next, ces modules seront déplaçables tels quels dans un package partagé avec l'application mobile le jour venu. On ne le fait pas maintenant : ce serait de l'abstraction pour un consommateur qui n'existe pas encore.

### 8.7 · Authentification et autorisation

`bc-identity` détient les mots de passe (bcryptjs) et émet un JWT signé (`jose`). Le navigateur ne voit jamais ce jeton : la Server Action de connexion le reçoit et le pose en **cookie httpOnly, SameSite=Lax, Secure**. Les lectures serveur le rejouent en en-tête `Authorization: Bearer` vers l'API.

L'application React Native stockera le même JWT dans le trousseau du système. Le backend n'a rien à changer.

**Deux barrières, jamais une seule.**

1. `proxy.ts` redirige grossièrement — pas de session vers la connexion, onboarding inachevé vers l'onboarding. C'est de l'ergonomie, pas de la sécurité.
2. **Chaque command et chaque query revérifie l'`AuthContext` côté serveur.** L'`AuthContext` porte `userId`, `platformRole` et les adhésions avec leur rôle. C'est la seule barrière qui compte.

Masquer un bouton n'est pas une autorisation. Le back-office est protégé parce que l'API refuse, pas parce que le lien n'est pas affiché.

### 8.8 · Cache et stratégie de rendu

Trois choix de rendu, trois raisons différentes.

| Zone | Rendu | Justification |
|---|---|---|
| `/ateliers/[slug]` | Server Component **caché** — `use cache` + `cacheTag('atelier:<slug>')` | Public, identique pour tous les visiteurs, doit être indexable et rapide |
| Calendrier de créneaux | **Client Component** + React Query sur Route Handler | Navigation de semaine, sélection, disponibilité qui bouge sous l'utilisateur |
| Tableau de bord | **Dynamique explicite**, jamais caché | Données propres à l'utilisateur ; la lecture du cookie rend la page dynamique de toute façon |

**L'invalidation est réelle et démontrable.** Quand un fabmanager passe une machine en maintenance, la Server Action appelle `revalidateTag('atelier:<slug>')` : la page publique de l'atelier reflète le changement au chargement suivant, sans redéploiement ni attente d'expiration. C'est la donnée pertinente sur laquelle porte la stratégie de cache exigée par le brief.

### 8.9 · Gestion des erreurs et états d'interface

Côté serveur, chaque échec est un `TaggedError` distinct, déclaré dans le groupe d'API avec son status HTTP. Le front ne devine jamais ce qui a échoué.

Côté interface, les six situations du brief sont couvertes :

| Situation | Traitement |
|---|---|
| Chargement | `loading.tsx` et `Suspense` sur chaque liste |
| Ressource inexistante | `notFound()` et `not-found.tsx` |
| Accès interdit | Page 403 dédiée, déclenchée par le refus de l'API |
| Erreur de requête | `error.tsx` par route group, avec action de reprise |
| Formulaire invalide | Erreurs de champ inline via `useActionState`, alimentées par les erreurs typées du back |
| Liste vide | États vides dessinés, avec l'action qui en sort — jamais un tableau blanc |

### 8.10 · Tests — TDD strict

Pour chaque tranche de travail, dans cet ordre :

1. **Test E2E Playwright rouge** — le parcours vu par l'utilisateur
2. **Tests unitaires rouges**, couche par couche — schéma, command sur un Layer de test en mémoire, repository contre **pglite**, port front contre son adapter en mémoire, composants purs
3. **Implémentation** jusqu'au vert

| Cible | Type | Dépendances |
|---|---|---|
| Schemas, TaggedError | Unitaire | Aucune |
| Commands, queries | Unitaire | Layer de test, repositories en mémoire |
| Repositories SQL | Intégration | pglite |
| Adapters HTTP front | Unitaire | `fetch` intercepté |
| Composants, hooks | Unitaire | Testing Library |
| Parcours utilisateur | E2E | Playwright, branche Neon dédiée |

Les tests sont colocalisés avec le code testé. Les tests E2E sont colocalisés avec la page qu'ils couvrent, en `.test.e2e.ts`. Playwright pointe une **branche Neon dédiée** — jamais la base de développement.

### 8.11 · Déploiement

| Élément | Cible |
|---|---|
| `apps/web` | Projet Vercel |
| `packages/server` | Projet Vercel distinct, via le web handler de `@effect/platform` |
| Base | Neon Postgres, endpoint *pooler* |

Le serveur conserve **deux points d'entrée** : `api/index.ts` pour Vercel, et `main.ts` pour un serveur Node long-running. Basculer sur un VPS devient un changement de commande de déploiement, pas une refonte. Le `ServerLayer` est construit une seule fois au chargement du module, jamais par requête.

Deux projets séparés, donc deux déploiements indépendants — et une API déjà publique et versionnée pour l'application React Native.

### 8.12 · Direction artistique

**Industriel sombre.** Fond graphite, accent orange signal — celui des machines-outils et des consignes de sécurité. Typographie condensée technique pour les titres, très lisible pour les données. Les statuts d'habilitation et de machine reprennent le vocabulaire visuel de la signalétique d'atelier.

Les primitives viennent de shadcn/ui, mais reposées sur des tokens propres : l'objectif est un produit qui ne se reconnaisse pas au premier coup d'œil comme un shadcn par défaut. Contraste et focus visible vérifiés au titre de l'accessibilité, pas de l'esthétique.

### 8.13 · Écarts assumés aux règles d'architecture habituelles

Ces règles ont été écrites pour une application monopage TanStack Router. Next.js App Router avec Server Components rend une partie sans objet. Les écarts sont explicites, pas silencieux.

1. **Pas de Redux, pas de thunks, pas de redux-persist.** Les données serveur vivent dans les Server Components et le cache de Next. Une couche Redux au-dessus n'ajouterait qu'une copie à resynchroniser. Si un état client réellement global apparaît, il sera tranché à ce moment-là.
2. **Pas de local-first ni d'outbox hors ligne.** Cela appartient à l'application React Native, où c'est réellement utile pour quelqu'un dans un atelier. Hors périmètre web.
3. **Pas de contexte React de dépendances**, conformément aux règles — mais remplacé par un conteneur serveur plutôt que par l'`extraArgument` de Redux, puisqu'il n'y a pas de Redux.

Sont conservées intégralement : la nomenclature des fichiers et des suffixes, l'interdiction des `enum` au profit d'objets `as const`, oxlint et oxfmt avec la configuration habituelle, la colocalisation des tests, les factories de test, et la règle du zéro commentaire.

---

## 9 · Modèle de données

Huit tables, réparties par bounded context. Identifiants `uuid`, horodatages `timestamptz`, suppressions logiques par statut plutôt que par effacement.

### `users` — bc-identity

| Colonne | Type | Note |
|---|---|---|
| `id` | uuid | clé primaire |
| `email` | citext | unique |
| `password_hash` | text | bcrypt |
| `display_name` | text | |
| `platform_role` | text | `MEMBER` · `PLATFORM_ADMIN` |
| `practice` | text[] | pratiques déclarées à l'onboarding |
| `onboarding_completed_at` | timestamptz | nul tant que l'onboarding n'est pas terminé |
| `status` | text | `ACTIVE` · `SUSPENDED` |
| `created_at`, `updated_at` | timestamptz | |

### `user_preferences` — bc-identity

| Colonne | Type | Note |
|---|---|---|
| `user_id` | uuid | clé primaire, référence `users` |
| `theme` | text | `dark` · `light` · `system` |
| `default_atelier_id` | uuid | nul possible |
| `email_notifications` | boolean | |
| `updated_at` | timestamptz | |

### `ateliers` — bc-atelier

| Colonne | Type | Note |
|---|---|---|
| `id` | uuid | clé primaire |
| `slug` | text | unique — segment d'URL publique |
| `name`, `description` | text | |
| `street`, `postal_code`, `city`, `country` | text | |
| `latitude`, `longitude` | numeric(9,6) | recherche par proximité |
| `status` | text | `DRAFT` · `PUBLISHED` · `CLOSED` |
| `created_at`, `updated_at` | timestamptz | |

Index sur `(latitude, longitude)` pour la recherche par rayon ; index sur `status` pour l'annuaire public.

### `memberships` — bc-atelier

| Colonne | Type | Note |
|---|---|---|
| `id` | uuid | clé primaire |
| `user_id`, `atelier_id` | uuid | unique ensemble |
| `role` | text | `MEMBER` · `FABMANAGER` |
| `status` | text | `ACTIVE` · `SUSPENDED` |
| `joined_at` | timestamptz | |

C'est **ici** que vit le rôle `FABMANAGER`, pas sur l'utilisateur. Un même compte peut être membre à Lyon et fabmanager à Montreuil.

### `machines` — bc-atelier

| Colonne | Type | Note |
|---|---|---|
| `id` | uuid | clé primaire |
| `atelier_id` | uuid | référence `ateliers` |
| `name`, `description` | text | |
| `kind` | text | `LASER_CUTTER` · `PRINTER_3D` · `CNC_MILL` · `WOOD_LATHE` · `SEWING` · `ELECTRONICS_BENCH` |
| `requires_certification` | boolean | |
| `slot_duration_minutes` | int | granularité du calendrier |
| `status` | text | `AVAILABLE` · `MAINTENANCE` · `RETIRED` |
| `nfc_tag_id` | text | unique, nul possible — le tag collé sur le bâti |
| `created_at`, `updated_at` | timestamptz | |

### `certifications` — bc-certification

| Colonne | Type | Note |
|---|---|---|
| `id` | uuid | clé primaire |
| `user_id`, `atelier_id` | uuid | |
| `machine_kind` | text | l'habilitation porte sur un **type**, pas sur un exemplaire |
| `status` | text | `REQUESTED` · `GRANTED` · `REVOKED` |
| `requested_at` | timestamptz | |
| `decided_at`, `decided_by` | timestamptz, uuid | nuls tant qu'en attente |
| `expires_at` | timestamptz | nul = sans expiration |
| `revocation_reason` | text | nul possible |

Unicité sur `(user_id, atelier_id, machine_kind)`. L'habilitation est portée par le couple membre-atelier : être habilité à la laser de Montreuil ne donne aucun droit à Lyon.

### `bookings` — bc-booking

| Colonne | Type | Note |
|---|---|---|
| `id` | uuid | clé primaire |
| `machine_id`, `atelier_id`, `user_id` | uuid | |
| `start_at`, `end_at` | timestamptz | |
| `status` | text | `CONFIRMED` · `CHECKED_IN` · `COMPLETED` · `CANCELLED` · `NO_SHOW` |
| `checked_in_at` | timestamptz | nul possible |
| `checked_in_via` | text | `NFC` · `MANUAL`, nul possible |
| `cancelled_at`, `cancelled_by` | timestamptz, uuid | nuls possibles |
| `created_at`, `updated_at` | timestamptz | |

Contrainte d'exclusion garantissant le non-chevauchement, décrite en [section 5](#la-règle-2-est-garantie-deux-fois). Index sur `(user_id, start_at desc)` pour l'historique, sur `(machine_id, start_at)` pour le calendrier.

### `domain_events` — shared

Journal des événements métier publiés par les commands : `BookingCreated`, `CertificationGranted`, `MachineStatusChanged`. Sert la traçabilité et les statistiques du back-office, et prépare les notifications de la v1.1.

---

## 10 · Surface d'API

Toutes les routes sont décrites en `HttpApiEndpoint`, avec leurs schémas d'entrée, de sortie et leurs erreurs typées. Le tableau donne l'intention, pas la signature complète.

### Public — sans authentification

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/ateliers` | Annuaire — filtres `city`, `machineKind`, et `lat` `lng` `radiusKm` pour le mobile |
| `GET` | `/ateliers/:slug` | Fiche publique avec le parc de machines |

### Identité

| Méthode | Route | Rôle |
|---|---|---|
| `POST` | `/auth/register` | Inscription |
| `POST` | `/auth/login` | Connexion, retourne le JWT |
| `GET` | `/auth/me` | Session courante, adhésions et rôles |
| `POST` | `/auth/password` | Changement de mot de passe |
| `POST` | `/onboarding/complete` | Adhésion, pratique, premières demandes d'habilitation |
| `GET` · `PATCH` | `/me/preferences` | Préférences persistantes |

### Membre

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/machines` | Liste filtrable et paginée |
| `GET` | `/machines/:id` | Détail |
| `GET` | `/machines/:id/availability` | Créneaux d'une semaine — alimente le calendrier |
| `POST` | `/bookings` | **Création — les sept règles de refus** |
| `GET` | `/bookings` | Mes réservations |
| `GET` | `/bookings/:id` | Détail |
| `POST` | `/bookings/:id/cancel` | Annulation |
| `POST` | `/bookings/:id/check-in` | Check-in — accepte un `nfcTagId` |
| `POST` | `/certifications` | Demande d'habilitation |
| `GET` | `/certifications/mine` | Mes habilitations et leur statut |

### Fabmanager — portée limitée à son atelier

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/manage/certifications` | File de validation |
| `POST` | `/manage/certifications/:id/grant` | Accorder |
| `POST` | `/manage/certifications/:id/revoke` | Révoquer, avec motif |
| `POST` · `PATCH` | `/manage/machines` · `/manage/machines/:id` | Créer, modifier, changer de statut, associer un tag NFC |
| `GET` | `/manage/bookings` | Réservations de l'atelier, filtrables |
| `POST` | `/manage/bookings/:id/no-show` | Marquer un no-show |
| `GET` | `/manage/stats` | Occupation, no-shows, heures |

### Administrateur plateforme

| Méthode | Route | Rôle |
|---|---|---|
| `POST` · `PATCH` | `/admin/ateliers` · `/admin/ateliers/:id` | Créer, publier, fermer |
| `GET` | `/admin/users` | Consulter, filtrer |
| `POST` | `/admin/users/:id/role` | Nommer un fabmanager, suspendre |
| `GET` | `/admin/stats` | Statistiques réseau |

---

## 11 · Conformité au barème

Le brief note sur 14 points le projet livré. Correspondance explicite.

| Critère | Points | Où cela se joue |
|---|---|---|
| Architecture App Router et organisation | 2 | Cinq route groups aux responsabilités séparées, layouts imbriqués, `proxy.ts`, modules port & adapter, bounded contexts en packages |
| Fonctionnalités et parcours métier | 2,5 | Le parcours de réservation complet, persisté, plus les sept règles de refus |
| Data, Server Components, Server Actions, Route Handlers | 2,5 | Lectures en Server Components, mutations en Server Actions, Route Handlers comme BFF des zones client — avec la justification du choix |
| Authentification, autorisation, sécurité | 2 | JWT en cookie httpOnly, trois rôles, rôle d'atelier porté par l'adhésion, revérification serveur dans chaque command et query |
| UX/UI, responsive, états d'interface | 2 | Direction artistique assumée, les six états couverts, accessibilité des formulaires, focus visible |
| Performance, cache, SEO, optimisation | 1,5 | `use cache` et `cacheTag` sur les pages publiques, `revalidateTag` sur mutation, `generateMetadata`, `sitemap.ts`, `next/image` |
| Qualité du code, tests, README, déploiement | 1,5 | TDD strict, colocalisation, oxlint et oxfmt, README de reprise, deux projets Vercel |

Et pour la checklist « avant de dire j'ai fini » : `pnpm build`, `pnpm lint`, `pnpm typecheck` et `pnpm test` doivent passer ; le parcours principal fonctionne ; une route privée l'est réellement ; l'admin est protégé côté serveur ; les données persistent ; des comptes de démonstration sont fournis ; aucune clé secrète n'est exposée.

### Ce que la soutenance exigera

Le live coding se fait **sans agent IA**. Les zones à connaître par cœur, parce que ce sont celles qu'on demandera de modifier :

- où ajouter un champ et le faire persister — schéma Effect, migration, repository, contrat, formulaire ;
- où ajouter un filtre par `searchParams` — query serveur, page, composant ;
- où protéger une route de plus — command ou query, jamais l'interface ;
- où invalider un cache — la Server Action qui mute, et le tag qu'elle porte ;
- pourquoi tel composant est serveur et tel autre client.

---

## 12 · Limites connues

À énoncer soi-même plutôt que se les faire trouver.

1. **Pas de refresh token.** Le JWT vit sept jours ; à son expiration, il faut se reconnecter. Un mécanisme de rotation est du travail de sécurité à part entière, hors périmètre d'un rendu.
2. **Pas de paiement réel.** Les crédits d'atelier et la facturation sont repoussés en v2.1 et seraient simulés.
3. **Recherche par proximité approchée.** Le calcul de distance se fait en SQL sur latitude et longitude, sans PostGIS. Suffisant à l'échelle d'un réseau de quelques dizaines d'ateliers, à revoir au-delà.
4. **Horaires d'ouverture et quotas absents de la v1.** Deux règles de refus identifiées mais reportées ; le modèle de données les accueille sans migration destructrice.
5. **Pas d'envoi d'e-mail.** Aucune confirmation ni relance en v1 ; le journal d'événements est en place pour les brancher.
6. **Le no-show n'est pas automatique.** Une réservation non honorée est marquée par le fabmanager. La bascule automatique demande un travail planifié, incompatible avec un déploiement sans processus long.
7. **Français uniquement.** Aucune internationalisation ; les messages de validation sont en français dans les schémas.
8. **Le NFC n'existe pas encore.** L'API l'accepte et le vérifie, l'application qui le lit arrive en v2. Sur le web, le check-in est manuel — et c'est précisément ce que le mobile viendra corriger.

---

## 13 · Usage de l'IA

Section obligatoire du rendu. À compléter au fil de la construction ; l'objectif du brief est d'évaluer le recul critique, pas de sanctionner l'usage.

### Outils utilisés

Claude Code, en session longue, pour le cadrage puis l'implémentation.

### Types de tâches confiées

Cadrage et conception, rédaction de ce document, génération de code sous test préalable, revue de code, rédaction des migrations.

### Une décision proposée par l'IA, corrigée ou refusée

*À compléter pendant la construction.* Première entrée : la génération du contrat d'API par OpenAPI avait été proposée en option par défaut ; elle a été écartée au profit d'un package de types purs assorti d'une assertion d'égalité au niveau type — moins de machinerie pour une garantie équivalente, et un front totalement libre d'Effect.

### Une partie du projet explicable intégralement

`createBookingCommand` et sa chaîne complète : le schéma du payload, l'ordre des vérifications, chaque erreur typée et son status HTTP, la contrainte d'exclusion qui double la règle de non-chevauchement, le lookup vers `bc-certification`, et le chemin jusqu'au formulaire côté Next.

---

*Fin du document.*
