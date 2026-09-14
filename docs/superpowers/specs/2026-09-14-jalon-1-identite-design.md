# Jalon 1 — Identité · document de conception

**Établi · `bc-identity`**
Auteur : Mathis · Document créé le 14 septembre 2026

---

## Sommaire

1. [Objet](#1--objet)
2. [Périmètre](#2--périmètre)
3. [Décisions](#3--décisions)
4. [Frontières et arborescence](#4--frontières-et-arborescence)
5. [Domaine](#5--domaine)
6. [Application](#6--application)
7. [Infrastructure](#7--infrastructure)
8. [HTTP et session](#8--http-et-session)
9. [Front](#9--front)
10. [Outillage de test](#10--outillage-de-test)
11. [Écarts assumés](#11--écarts-assumés)
12. [Définition de terminé](#12--définition-de-terminé)
13. [Hors périmètre](#13--hors-périmètre)

---

## 1 · Objet

Ce document ne reconçoit rien. La conception d'Établi est validée dans
`docs/superpowers/specs/2026-09-14-etabli-design.md`, et ce jalon s'y conforme : §7 pour la
définition du jalon 1, §8.3 pour l'anatomie d'un bounded context, §8.7 pour l'authentification,
§9 pour la table `users`, §10 pour la surface d'API.

Il consigne ce que la spec maîtresse ne tranche pas. « JWT `jose` + bcryptjs, cookie httpOnly posé
côté Next » décrit un mécanisme sans en fixer les paramètres : durée de vie du jeton, sémantique de
la déconnexion, comportement exact du proxy, base sur laquelle tournent les tests de bout en bout.
Ces décisions engagent tous les jalons suivants, puisque tout endpoint privé passera par la barrière
posée ici.

---

## 2 · Périmètre

Le strict nécessaire à la définition de terminé du jalon, et rien de plus.

| Dans le jalon | Hors du jalon |
|---|---|
| Table `users` | Table `user_preferences` — jalon 5 |
| `POST /auth/register` | `POST /auth/password` — jalon 5, avec l'écran qui l'appelle |
| `POST /auth/login` | `GET` · `PATCH /me/preferences` — jalon 5 |
| `GET /auth/me` | `POST /onboarding/complete` — jalon 2 |
| Déconnexion côté Next | Adhésions et rôles d'atelier — jalon 2 |
| `proxy.ts` et routes `(app)` privées | |
| Rôle plateforme | |

La table `user_preferences` attend le jalon 5 pour une raison mécanique : sa colonne
`default_atelier_id` référence une table `ateliers` qui n'existe qu'au jalon 2.

Chacune des routes reportées le sera avec l'écran qui la consomme. Une route d'API sans interface
qui l'appelle est du code non couvert par un parcours utilisateur, donc du code que le TDD de ce
projet ne sait pas justifier.

---

## 3 · Décisions

### 3.1 · Le jeton est sans état

Le jeton est valable **sept jours**, sans jeton de rafraîchissement et sans table de sessions.

Le modèle de données validé compte huit tables et n'en prévoit pas pour les sessions. En ajouter une
contredirait la §9 sans qu'aucun besoin du jalon ne l'exige.

Conséquence assumée : suspendre un compte n'invalide pas instantanément son jeton. Mais le
middleware d'authentification recharge l'utilisateur à chaque requête et refuse un statut
`SUSPENDED`, donc le premier appel API qui suit la suspension échoue. La fenêtre réelle est d'une
requête, pas de sept jours.

Cette décision sera réexaminée si le produit gagne un besoin de révocation immédiate — verrouillage
d'urgence d'un compte, déconnexion de tous les appareils. Aucun des jalons planifiés ne l'introduit.

### 3.2 · La déconnexion efface le cookie

Il n'y a pas de route `POST /auth/logout`, parce qu'un jeton sans état ne se révoque pas : il n'y a
rien à appeler côté serveur. La Server Action de déconnexion efface le cookie et redirige.

### 3.3 · L'inscription connecte immédiatement

Une seule Server Action crée le compte, reçoit le jeton et pose le cookie. L'utilisateur atterrit
dans l'espace privé.

Demander de se connecter juste après s'être inscrit est une friction sans contrepartie : le mot de
passe vient d'être saisi deux fois, l'identité est établie.

### 3.4 · Le proxy ne regarde que la présence du cookie

`proxy.ts` ne décode rien et ne vérifie aucune signature. Pas de cookie sur une route `(app)` →
redirection vers la connexion.

Deux raisons. D'abord, **`apps/web` n'a alors jamais besoin de `JWT_SECRET`** : seul le serveur signe
et vérifie, et les deux projets Vercel étant distincts, le secret ne vit qu'à un endroit.

Ensuite, le chemin « l'API répond 401 → retour à la connexion » doit exister de toute façon : un
compte suspendu, un jeton expiré, un utilisateur supprimé produisent tous un 401 qu'aucune
vérification de proxy ne peut anticiper. Vérifier le jeton dans le proxy ajouterait une seconde voie
de sortie sans supprimer la première.

C'est exactement ce que dit la §8.7 : le proxy est de l'ergonomie, pas de la sécurité. La barrière
qui compte est le middleware serveur, qui revérifie tout.

### 3.5 · Le cookie

| Attribut | Valeur |
|---|---|
| Nom | `etabli_session` |
| `httpOnly` | oui — le navigateur ne lit jamais le jeton |
| `SameSite` | `Lax` |
| `Secure` | piloté par `COOKIE_SECURE` |
| `Path` | `/` |
| `Max-Age` | aligné sur la durée de vie du jeton |

Les Server Actions sont le **seul** endroit du code qui écrit ou efface ce cookie.

### 3.6 · Identifiants invalides : une seule erreur

`InvalidCredentialsError` est renvoyée aussi bien pour un e-mail inconnu que pour un mot de passe
faux.

Distinguer les deux transforme le formulaire de connexion en oracle : il suffit d'essayer une adresse
pour savoir si elle a un compte sur la plateforme.

### 3.7 · Ce que montre l'espace privé

`(app)/compte` affiche ce que `GET /auth/me` retourne réellement — nom affiché, e-mail, rôle
plateforme, date de création — et le bouton de déconnexion.

Aucun champ n'est inventé. La page prouve la chaîne complète : cookie lu côté serveur, rejoué en
en-tête `Authorization: Bearer`, API qui vérifie et répond, rendu. Et elle reste pertinente aux
jalons suivants au lieu d'être jetée, contrairement à un tableau de bord dont les sections seraient
vides parce que leurs données n'existent pas encore.

---

## 4 · Frontières et arborescence

Un package `packages/bc-identity`, conforme à la §8.3.

```
packages/bc-identity/src/
├── domain/
│   ├── user.schema.ts
│   ├── user.constants.ts
│   └── errors.ts
├── application/
│   ├── ports/
│   │   ├── password-hasher.ts
│   │   └── token-issuer.ts
│   ├── commands/
│   │   ├── register-user/
│   │   └── login-user/
│   └── queries/
│       └── get-current-user/
├── infrastructure/
│   ├── user.repository.ts
│   ├── user.repository.sql.ts
│   ├── user.repository.memory.ts
│   ├── password-hasher.bcrypt.ts
│   ├── token-issuer.jose.ts
│   └── migrations/0002_create_users.sql
└── http/
    ├── identity.api.ts
    ├── identity.handlers.ts
    └── auth.middleware.ts
```

Le socle du jalon 0 anticipait ce jalon et rien n'est à reprendre :

- `findMigrations()` scanne déjà `packages/bc-*/src/infrastructure/migrations` ;
- `AuthContext`, `PlatformRole` et `permissions.ts` vivent déjà dans `@etabli/shared/auth-context` ;
- `UserId` est déjà brandé dans `@etabli/shared/schema` ;
- la table des routes de `@etabli/contract` déclare déjà `auth.register`, `auth.login`, `auth.me` ;
- `health.api.ts` donne le gabarit exact d'un groupe d'API avec son assertion de parité de contrat.

**Ce que les autres packages gagnent.**

`@etabli/contract` : les types `User`, `Session`, `RegisterInput`, `LoginInput`, `LoginResponse`.
Toujours aucune dépendance, toujours aucun code exécuté — le test `zero-dependencies.test.ts` le
garde.

`@etabli/shared/errors` : `UnauthorizedError`, à côté de `ForbiddenError` et `RepoError`.

`packages/server` : `@etabli/bc-identity` en dépendance, le groupe monté sur `etabliApi`, les Layers
câblés.

---

## 5 · Domaine

`user.schema.ts` porte `UserSchema` et les schemas d'entrée. `Email` est un type brandé qui normalise
en minuscules et supprime les espaces de bord au décodage — la normalisation est une règle de
domaine, pas une précaution de formulaire.

`user.constants.ts` porte `UserStatus` (`ACTIVE` · `SUSPENDED`) en objet `as const`. `PlatformRole`
reste dans `shared`, puisque `AuthContext` en dépend déjà et que le dupliquer créerait deux sources
de vérité pour le même vocabulaire.

`errors.ts` déclare trois `Data.TaggedError` :

| Erreur | HTTP | Levée quand |
|---|---|---|
| `EmailAlreadyTakenError` | 409 | l'adresse a déjà un compte |
| `InvalidCredentialsError` | 401 | e-mail inconnu **ou** mot de passe faux |
| `AccountSuspendedError` | 403 | le compte existe mais son statut est `SUSPENDED` |

Pas de `UserNotFoundError` dans ce jalon. Un jeton valide dont l'utilisateur n'existe plus est un
échec d'authentification, pas une ressource absente : le middleware répond `UnauthorizedError` en
401, indistinguable d'un jeton invalide. Un 404 sur `/auth/me` dirait à un porteur de jeton périmé
que son compte a été supprimé — une information qu'il n'a pas à obtenir. Une erreur d'entité absente
apparaîtra au jalon 6, quand le back-office lira des utilisateurs par identifiant.

La parité avec `@etabli/contract` est verrouillée au niveau type, côté back, par une assertion sur
`Schema.Schema.Encoded` — la forme qui transite réellement sur le réseau. Le gabarit est
`healthContractParity` dans `health.api.ts`.

---

## 6 · Application

Deux commands — `register-user/`, `login-user/` — et une query, `get-current-user/`. Un dossier par
opération, test colocalisé.

Deux dépendances passent par un `Context.Tag` plutôt que par un import direct.

**`PasswordHasher`** — `hash` et `verify`. Implémentation bcryptjs en production, implémentation
triviale dans les tests. Sans ce tag, chaque test de command paie le coût délibéré de bcrypt, et une
suite de commands devient lente pour une raison qui n'a rien à voir avec ce qu'elle teste.

**`TokenIssuer`** — `issue` et `verify`, implémentation `jose`. Les tests de command n'ont alors
besoin d'aucun secret, et le jeton produit est déterministe, donc assertable.

`Clock` et `IdGenerator` existent dans `shared` et sont utilisés tels quels.

Les commands lisent comme leur règle de gestion :

```
register  parse du payload → refuser si l'e-mail existe → hacher → insérer → émettre le jeton
login     parse du payload → charger par e-mail → vérifier le hachage → refuser si suspendu
          → émettre le jeton
me        AuthContext → charger par identifiant → projeter en read model
```

---

## 7 · Infrastructure

`user.repository.ts` déclare le `Context.Tag` et l'interface : `findByEmail`, `findById`, `insert`.
`user.repository.sql.ts` l'implémente en SQL écrit à la main via `@effect/sql-pg`, sans ORM.
`user.repository.memory.ts` sert les tests de command.

`migrations/0002_create_users.sql` crée l'extension `citext` puis la table de la §9 — `email citext
UNIQUE`, `password_hash`, `display_name`, `platform_role`, `practice text[]`,
`onboarding_completed_at`, `status`, `created_at`, `updated_at`.

**Les colonnes que le jalon n'utilise pas encore existent quand même.** `practice` et
`onboarding_completed_at` sont dans le modèle validé ; les créer nulles aujourd'hui coûte moins
qu'une migration d'ajout de colonne au jalon 2.

**pglite charge les bundles contrib.** `citext` et `btree_gist` ne sont pas dans pglite nu, mais le
paquet les fournit en imports séparés. Vérifié :

| | pglite nu | pglite avec le bundle |
|---|---|---|
| `citext`, unicité insensible à la casse | absent | ✓ |
| `btree_gist`, `EXCLUDE USING gist` sur `tstzrange` | absent | ✓ |

`PgLiteSqlClientLayer` les enregistre donc à la création. Sans quoi la migration de ce jalon
échouerait en test, et la contrainte d'exclusion de la règle 2 — §5 de la spec maîtresse, jalon 4 —
ne serait pas testable en local.

---

## 8 · HTTP et session

`identity.api.ts` déclare le groupe `identity` en `HttpApiGroup` / `HttpApiEndpoint`, chaque erreur
attachée par `.addError(E, { status })`. `identity.handlers.ts` les implémente.

`auth.middleware.ts` déclare un `HttpApiMiddleware.Tag` qui, pour chaque requête d'un endpoint
protégé :

1. lit l'en-tête `Authorization: Bearer`, et refuse en 401 s'il manque ou est malformé ;
2. vérifie le jeton via `TokenIssuer`, et refuse en 401 s'il est invalide ou expiré ;
3. recharge l'utilisateur, et refuse en 401 s'il n'existe plus ;
4. refuse en 403 si son statut est `SUSPENDED` ;
5. fournit `AuthContext`.

Il protège `GET /auth/me` aujourd'hui et tout endpoint privé des jalons suivants. C'est la deuxième
barrière de la §8.7 — la seule qui compte.

L'étape 3 mérite d'être notée : le middleware recharge l'utilisateur plutôt que de faire confiance
aux claims du jeton. C'est ce qui ramène à une requête la fenêtre de révocation de la §3.1.

---

## 9 · Front

```
apps/web/src/
├── modules/identity/core/          aucun React, aucun Next
│   ├── model/
│   ├── ports/identity.port.ts
│   └── adapters/
│       ├── identity.http.adapter.ts
│       └── identity.in-memory.adapter.ts
├── server/                         conteneur — lit cookies() de next/headers
└── app/
    ├── (auth)/inscription
    ├── (auth)/connexion
    └── (app)/compte
```

`core/` n'importe ni React ni Next : `boundaries.test.ts` le vérifie déjà et ce jalon est le premier
à le mettre à l'épreuve.

Le conteneur serveur vit dans `apps/web/src/server/`, **hors de tout `core/`**, parce qu'il lit
`cookies()`. Il construit l'adapter HTTP avec le jeton du cookie et le passe aux Server Components et
aux Server Actions. C'est le remplacement du contexte React de dépendances écarté en §8.13 de la spec
maîtresse.

Trois Server Actions — `register`, `login`, `logout`.

`proxy.ts` a **une seule règle** : pas de cookie sur une route `(app)` → redirection vers
`/connexion`, l'URL demandée en paramètre pour y revenir après connexion.

La règle symétrique — cookie présent sur une route `(auth)` → redirection vers `(app)/compte` — est
écartée, et la raison mérite d'être écrite parce qu'elle n'est pas visible à la lecture.

Le proxy ne regarde que la présence du cookie (§3.4). Avec un cookie périmé, la symétrie boucle :
`(app)/compte` passe le proxy, l'API répond 401, la page redirige vers `/connexion`, le proxy y voit
le cookie et renvoie vers `(app)/compte`. Et la boucle ne se casse pas en effaçant le cookie sur le
chemin du 401, parce que **ce chemin part d'un Server Component, qui n'a pas le droit d'écrire un
cookie** — seuls une Server Action et un Route Handler l'ont.

Réinstaurer la symétrie coûterait donc un Route Handler dédié à l'effacement du cookie, traversé par
tous les 401. Le jalon n'en a pas besoin : un utilisateur connecté qui visite `/connexion` voit un
formulaire, ce qui est inesthétique et sans conséquence. Le cookie périmé reste en place jusqu'à ce
que la connexion suivante l'écrase.

Les erreurs de champ remontent par `useActionState`, alimentées par les erreurs typées du back —
§8.9 de la spec maîtresse.

---

## 10 · Outillage de test

### Les deux serveurs

Les E2E de ce jalon traversent l'API. Le `webServer` de Playwright devient un tableau à deux
entrées — l'API sur `:3001`, le web sur `:3000` — pour que Playwright attende les deux et qu'un échec
de démarrage de l'API se lise comme tel, au lieu de se manifester en 500 dans un test d'interface.

### La base

Un `compose.yaml` à la racine lance un Postgres à la même version majeure que Neon, sur un port
dédié. Neon est en 18.6, donc l'image est `postgres:18-alpine`. Un `.env.test` non versionné le
pointe ; un `.env.test.example` est versionné. `pnpm verify` lève le conteneur puis joue les
migrations avant les E2E, et la CI n'a rien de plus à déclarer — voir l'écart 11.3.

Détail qui coûterait une demi-heure s'il n'était pas écrit : le `.gitignore` ignore `.env.*` avec une
seule exception, `!.env.example`. Il faut y ajouter `!.env.test.example`, faute de quoi le fichier
d'exemple est silencieusement non versionné.

### La pyramide

| Cible | Type | Dépendances |
|---|---|---|
| Schemas, `TaggedError` | Unitaire | aucune |
| Commands, query | Unitaire | repository en mémoire, hacheur et émetteur de test |
| `user.repository.sql.ts` | Intégration | pglite avec le bundle `citext` |
| `identity.http.adapter.ts` | Unitaire | `fetch` intercepté |
| Server Actions | Unitaire | adapter en mémoire, `cookies()` simulé |
| Composants purs | Unitaire | Testing Library |
| Parcours | E2E | Playwright, Postgres conteneurisé |

### L'ordre d'écriture

E2E rouges d'abord :

1. l'inscription crée un compte et fait atterrir sur `(app)/compte` ;
2. la déconnexion ramène à `/connexion`, et `(app)/compte` n'est plus accessible ;
3. `(app)/compte` visité sans session redirige vers `/connexion` ;
4. des identifiants faux affichent une erreur de champ sans révéler si l'adresse existe.

Puis les unitaires rouges couche par couche. Puis l'implémentation.

**Un test s'ajoute hors interface** : un appel direct à `GET /auth/me` sans en-tête `Authorization`
doit répondre 401. C'est la moitié de la définition de terminé du jalon, et aucun test d'interface ne
la couvre — un navigateur passe toujours par le cookie.

---

## 11 · Écarts assumés

### 11.1 · La base de test n'est pas une branche Neon

La §8.10 de la spec maîtresse dit : « Playwright pointe une branche Neon dédiée — jamais la base de
développement ». L'intention — ne jamais toucher la base de développement — est respectée. Le moyen
change : un Postgres conteneurisé, en local comme en CI.

La raison est l'isolation entre exécutions concurrentes. Une branche Neon unique partagée par toutes
les runs de CI signifie que deux pull requests ouvertes en même temps écrivent dans la même base :
un compte créé par l'une fait échouer une assertion d'unicité de l'autre, et l'échec n'est pas
reproductible. Les contournements sont de sérialiser la CI, ou de créer une branche Neon par
exécution via leur API — une clé d'API de plus et de la tuyauterie à maintenir.

Un conteneur donne une base neuve par exécution, sans secret dans le workflow et sans coût. La même
image tourne en local, donc les deux environnements ne divergent pas.

Neon reste la base de développement et la base de production. Le moteur est le même Postgres ; la
version majeure du conteneur est épinglée sur celle de Neon.

### 11.2 · Pas de route de déconnexion

La §10 de la spec maîtresse ne liste pas `POST /auth/logout`, et ce jalon n'en ajoute pas. Ce n'est
pas un oubli : avec un jeton sans état, il n'y a rien à révoquer. La note existe pour que l'absence
se lise comme une décision.

### 11.3 · La CI utilise compose, pas `services:`

La §10 de ce document disait d'abord que le workflow CI gagnerait un bloc `services: postgres`. Il
n'en gagne aucun : `pnpm verify` appelle `docker compose up -d --wait`, en local comme en CI.

Un bloc `services:` redéclare l'image, les identifiants et le port que `compose.yaml` déclare déjà.
Deux déclarations de la même chose dérivent — la version se bumpe d'un côté et pas de l'autre, et
l'écart n'est visible dans aucun diff. Avec compose des deux côtés, `image: postgres:18-alpine` ne
s'écrit qu'une fois, et `pnpm verify` est littéralement la même commande sur les deux machines.

Ce que `services:` aurait donné en plus : un démarrage en parallèle du checkout et de
`pnpm install`. Quelques secondes sur un job plafonné à vingt minutes.

`.env.test` étant non versionné, la CI ne l'a pas. `db:test:up` le crée depuis `.env.test.example`
s'il manque, donc ni le workflow ni une machine neuve n'ont d'étape de copie à faire.

---

## 12 · Définition de terminé

Reprise mot pour mot de la §7 de la spec maîtresse, augmentée de ce que ce document a tranché.

- Une route `(app)` visitée sans session redirige vers la connexion.
- `GET /auth/me` sans en-tête `Authorization` répond 401.
- Un compte s'inscrit, atterrit dans l'espace privé, se déconnecte, se reconnecte.
- Des identifiants faux affichent une erreur de champ qui ne révèle pas si l'adresse a un compte.
- `pnpm verify` est vert, E2E comprises, contre le Postgres conteneurisé.

---

## 13 · Hors périmètre

Explicitement repoussé, pour qu'aucune de ces absences ne se lise comme un oubli.

- Mot de passe oublié et réinitialisation par e-mail. Aucun envoi d'e-mail n'existe dans le produit
  à ce stade, et le brief ne l'exige pas.
- Vérification de l'adresse e-mail à l'inscription. Même raison.
- Authentification à deux facteurs, connexion par fournisseur tiers.
- Limitation de débit sur la connexion. Elle appartient au jalon 7, avec le reste du durcissement de
  production.
- Journal des connexions.
