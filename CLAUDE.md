# Établi

Projet fil rouge M2 EEMI 2026 — Next.js 16.3. Plateforme d'un réseau d'ateliers
partagés : habilitations machine, réservation de créneaux, pointage par QR code.

**Lire en premier** : `docs/superpowers/specs/2026-09-14-etabli-design.md`.
Produit, règles métier, modèle de données, surface d'API, roadmap et fiche
technique y sont complets. Ne pas reconcevoir : ce document a été validé.

Le sujet imposé est `../Projet fil rouge next js.pdf` (36 pages, lire par
plages avec le paramètre `pages`).

## État

Jalons 0 à 6 terminés et sur `main`. Le parcours membre est complet de bout en
bout, de l'atelier au créneau réservé ; le fabmanager tient le pointage, le
no-show, l'annulation, le QR de pointage et les statistiques de ses ateliers ;
l'administrateur plateforme tient les ateliers, les comptes, les rôles et le
tableau réseau. L'application mobile Expo porte le parcours membre jusqu'au
pointage par QR code.

**Le backend est `apps/api` (v2, NestJS).** `pnpm dev`, les seeds et les E2E
Playwright pointent tous dessus. `packages/server`, les quatre `packages/bc-*`
et `packages/test-utils` ont été supprimés avec Effect : il n'y a plus qu'une
implémentation du back, et plus une ligne d'Effect dans le dépôt.

`pnpm check` est vert : 675 tests unitaires, `next build`. Les 104 E2E
Playwright passent — **contre `apps/api`, depuis la bascule** — mais **ne
tournent pas dans `pnpm verify`, sur décision de l'auteur** — `pnpm db:test:up`
puis `pnpm test:e2e` pour les lancer.

**Le `globalSetup` de Playwright vide la base avant de la semer** : il enchaîne
`db:migrate:test`, `db:reset:test`, `db:seed:test`. Chaque campagne repart donc
du même état, et il n'y a plus de `db:test:down` à penser entre deux runs. Sans
ce `TRUNCATE`, la base **accumulait** d'un run à l'autre — comptes `e2e-*`,
créneaux pris, « Atelier E2E » — jusqu'à faire tomber des tests sans rapport sur
des créneaux épuisés ou un annuaire saturé.

La liste des tables vidées est **dérivée du schéma Drizzle** (`isTable` +
`getTableName`), jamais écrite à la main : une table neuve entre dans le reset
sans que personne ait à y penser, et `reset.spec.ts` fige la liste pour que
l'ajout soit vu. `assertResettable` refuse toute URL dont l'hôte n'est pas
local, **avant d'ouvrir la connexion** : `db:reset:test` ne peut pas partir sur
Neon.

Ce qui existe, domaine par domaine — les modules d'`apps/api` :

- `auth` / `user` — inscription, connexion, `GET /auth/me`, bcrypt, jose,
  garde d'authentification, cookie httpOnly posé par Next, `proxy.ts`. Et les
  paramètres : `PATCH /me/profile` (nom affiché, pratiques), `POST /auth/password`,
  `GET`/`PATCH /me/preferences`, `GET /me/ateliers`, et le
  back-office plateforme : `GET /admin/users`, `PATCH /admin/users/:id`
- `atelier` / `membership` / `machine` — ateliers, adhésions, machines ; annuaire public et fiche avec
  `use cache` / `cacheTag` ; `GET /machines/:id`, la fiche publique d'une
  machine ; onboarding persisté ; routes `/admin/ateliers` et
  `/manage/machines` ; `PATCH /admin/ateliers/:atelierId/members/:userId` pour
  nommer un fabmanager
- `certification` — demander, accorder, révoquer ; file de validation
  fabmanager ; l'habilitation porte sur **une machine**, pas sur un type — écart
  assumé au §9 de la spec
- `booking` — domaine, repository, et le parcours membre
  complet : `GET /machines/:id/availability`, `POST /bookings`, `GET /bookings`,
  `GET /bookings/:id`, `POST /bookings/:id/cancel`, `POST /bookings/:id/check-in`.
  Côté fabmanager, `GET /manage/bookings`, `POST /manage/bookings/:id/check-in`
  et `POST /manage/bookings/:id/no-show`.
  `POST /manage/bookings/:id/cancel`, `GET /manage/stats` et `GET /admin/stats`.
  Côté web, `/machines/:id` porte la fiche publique et n'ouvre la semaine
  qu'au membre de l'atelier, `/reservations` et `/reservations/:id` listent,
  détaillent et annulent, `/manage/bookings`
  tient le pointage, le no-show et l'annulation de la journée, et `/manage/stats`
  comme `/admin/stats` mesurent l'occupation.

## L'API — `apps/api` (NestJS)

Le back, sur la branche `feat/api-nestjs`, décrit par
`docs/superpowers/specs/2026-09-15-etabli-api-nestjs-design.md`. Il a remplacé
`packages/server` et les quatre `packages/bc-*`, supprimés depuis. NestJS 12,
Drizzle, Zod, clean architecture port & adapter, sans Effect.ts ni bounded
contexts. Sept modules — `auth`, `user`, `atelier`,
`membership`, `machine`, `certification`, `booking` — plus `health`, pour les
39 routes de la surface.

`pnpm --filter @etabli/api test` : 277 tests, trois étages (unitaires sur stubs
et `FixedClock`, intégration des repositories sur PGlite, bout en bout HTTP via
supertest). Pas de Docker : chaque suite monte sa propre base en mémoire, donc
l'isolation y est structurelle, là où les E2E Playwright la tiennent d'un
`TRUNCATE` au `globalSetup`.

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

Scripts : `pnpm dev:api`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:generate`
(et leurs variantes `:test`) — ils portaient un suffixe `:api` tant que la v1
occupait les noms courts. Le seed v1 est porté à l'identique — neuf ateliers,
sept comptes, mot de passe `etabli-2026`.

Neon est branché et à jour des six migrations. Sur une machine neuve : copier
`.env.example` en `.env` et y mettre l'URL *pooled* du projet Neon. `pg` émet un
avertissement sur `sslmode=require` traité comme `verify-full` — comportement
voulu, à ignorer.

`pnpm db:seed:test` insère trois ateliers de démonstration de façon idempotente ;
le `globalSetup` de Playwright l'appelle. `E2E_SKIP_SEED=1` le désactive.
`compose.yaml` lance un `postgres:18-alpine` sur `:5433`. Playwright ne réutilise
jamais un serveur déjà sur `:3001` : un `pnpm dev` qui traîne est branché sur
Neon, et le réutiliser ferait tourner les E2E contre la base de développement.

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
`apps/api/src/tenancy.e2e.spec.ts` : **404** sur une ressource d'un
autre atelier, collection vide sur une liste, **403** sur les routes `/admin/*`.
Le §7 disait « 403 » partout ; la lettre a été corrigée, pas l'intention — 403
sur une ressource avouerait qu'elle existe.

Trois adapters web rendaient un refus comme une panne, faute d'un code
d'échec : le 403 côté réservation, le 409 d'un slug d'atelier déjà pris, le 404 d'une
demande d'habilitation qui n'est pas la sienne. Tous trois lisent maintenant le
code du corps avant le statut. **Quand une route gagne une erreur typée,
l'adapter qui l'appelle doit gagner son code** — sans quoi le message affiché
parle d'indisponibilité.

### Fiche machine — ce qui est tranché

`/machines/:id` est **publique**. L'annuaire `/ateliers/:slug` lie chaque
machine en service, et il est public : gardée derrière la session, la fiche
rendait un lien mort pour tout visiteur, et un 404 sec pour un membre d'un
autre atelier. `/machines` est donc sorti de `PRIVATE_PREFIXES` — donc aussi du
`Disallow` de `robots.txt`, et la page s'indexe.

La fiche et la semaine sont deux choses. La fiche vient de `GET /machines/:id`,
anonyme, `use cache` sous le tag `ateliers` — que `manage.actions.ts` invalide
déjà quand un fabmanager touche au parc. La semaine vient d'`availability`, qui
reste réservée aux membres. Qui n'y a pas droit lit `MachineAccessNotice` : le
visiteur un lien de connexion qui revient sur la machine, le membre d'un autre
atelier un lien vers l'atelier à rejoindre.

D'où le découpage du fichier : la fiche est attendue dans le corps de la page,
pas dans un `Suspense`, pour qu'une machine retirée rende un **vrai 404** et
non un 200 portant un corps 404 ; seule la semaine, qui lit le cookie, est
derrière une frontière. La page passe de `ƒ` à `◐`.

Le `checkInToken` ne sort pas : la fiche publique a son propre DTO, et un test le
fige des deux côtés.

### Photographies marketing — ce qui est tranché

Les plaques dessinées ne racontaient rien : quatre variantes d'un même motif,
la même sur la home et sur une carte d'atelier. `/` et `/fonctionnalites`
portent maintenant une photographie, et l'annuaire montre une machine que
l'atelier publie vraiment.

**Pexels, pas Unsplash.** Unsplash 401 sur ses pages de recherche dès qu'un
script les lit, et ses résultats mêlent des photos de contributeurs à des Getty
premium que sa licence ne couvre pas. La licence Pexels donne l'usage
commercial sans attribution ; `public/marketing/LICENSES.md` crédite quand même.

**Le voile est en CSS, pas cuit dans le fichier.** `PhotoHero` empile la photo,
un dégradé `from-graphite-950` et le contenu. La rampe étant sémantique, le
voile s'éclaircit tout seul en mode clair, où l'encre devient sombre — un
duotone cuit aurait demandé un second jeu de fichiers.

**Les plaques restent.** Un atelier sans machine publiée n'a pas de type à
photographier : `atelierPhotoFor` rend `null` et la carte retombe sur
`coverArtFor`. Le générateur n'est pas supprimé, il devient le repli.

La photo d'une carte est tirée du slug parmi les **types que l'atelier publie**
— pas le premier de la liste, qui aurait donné la même fraiseuse à presque
toutes les cartes, `array_agg(DISTINCT)` triant par valeur. Elle reste donc
vraie, et l'annuaire reste varié.

La FAQ n'a rien reçu : c'est une page de texte, une photo n'y serait que du
remplissage.

### Réservation — ce qui est tranché

La contrainte d'exclusion `bookings_no_overlap` est en base, sous
`btree_gist` : la règle 2 est donc garantie deux fois, comme le veut le §5 de la
spec. Le repository SQL traduit la violation `23P01` en `BookingOverlapError`.

Drizzle tourne sur `pg` en TCP, donc `db.transaction()` est disponible pour les
écritures multi-instructions. La limite « pas de transaction » de `neon-http`
vient des règles Drizzle globales et ne s'applique pas ici.

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

Le check-in d'un membre est un QR code et rien d'autre : la charge ne porte qu'un
`checkInToken`. Toute machine en porte un, généré à sa création. Le pointage de
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

**Le jeton de pointage est généré par le serveur, jamais saisi.**
`CreateMachineUsecase` pose un `randomUUID()` dans `check_in_token`, colonne
`NOT NULL` unique sur tout le réseau depuis la migration `0002`. Le `PATCH` de
la machine ne l'accepte pas — `updateMachineBodySchema` est `.strict()`, donc
l'écrire à la main rend 400. Seul `POST /manage/machines/:id/check-in-token` le
fait tourner, pour un autocollant perdu ou photographié. Une collision étant
impossible par construction, `MachineNfcTagTakenError` et le code
`MACHINE_NFC_TAG_TAKEN` ont disparu.

Le fabmanager imprime le QR depuis `/manage/machines/:id/qr`, une page du
quatrième route group, `(print)` : pas d'`AppShell`, fond blanc, et le jeton
écrit en clair sous le code pour la ressaisie de secours. Le SVG est calculé
côté serveur (`core/lib/qr-code.ts`, `qrcode` en dépendance) et rendu en data
URI dans un `<img>` — aucun octet de JavaScript client, et la page reste `◐`.

Le `BookingHttpAdapter` lit le `code` du corps d'erreur, pas seulement le
status : cinq refus se partagent le 409, et le §11 demande que chaque règle
porte son propre message. Le status ne sert plus que de repli.

L'annulation passe par `useActionState` et non par le `refresh()` aveugle des
jalons 2 et 3 : un créneau qui vient de commencer répond 409, et le membre doit
lire pourquoi. C'est aussi le patron que réclame le §8.9.

Le détail dit au membre que le pointage est ouvert, sans le lui offrir : le
check-in demande un QR code que le navigateur n'ouvre pas la caméra pour lire — §12.8. C'est le
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

## Mobile — `apps/mobile` (Expo)

Application Expo / React Native décrite par
`docs/superpowers/specs/2026-09-17-etabli-mobile-design.md`. Elle n'est pas le
web en petit : elle existe pour la caméra et pour la position. Sept écrans, deux
layouts, de la connexion au `CHECKED_IN`.

Elle parle à **`apps/api`**. `pnpm build:packages`, puis `pnpm dev:api` et
`pnpm dev:mobile` — ou `pnpm dev`, qui lance les trois.

`src/app/` ne porte que des coquilles, comme les routes du web : un import de
`src/features/`, et rien d'autre. Tout vit dans `src/modules/<module>/{core,ui}`.

### Ce qui est tranché

**Le refus se lit dans le corps, pas dans le statut.** L'API nomme ses erreurs
`code` (`CHECK_IN_TOKEN_MISMATCH`). `errorCodeOf` — désormais dans
`@etabli/api-client` — le lit et ne retombe sur le statut que faute de mieux :
cinq règles métier se partagent le 409, le statut ne suffit donc pas à écrire
une phrase. La v1 nommait ses erreurs `_tag` (`NfcTagMismatchError`) ; cette
branche et les clés `*Error` des tables `BY_CODE` sont **supprimées** — plus
aucun serveur n'émet cette forme, et les captures d'écran de la spec mobile la
montrent encore à tort.

**Le token vit dans `expo-secure-store`**, le trousseau du système, jamais dans
`AsyncStorage` qui écrit en clair. Lu une fois au démarrage : présent, on entre
dans les onglets ; absent ou refusé par `GET /auth/me`, on va sur la connexion.
Un 401 en cours de route efface le token et ramène à la connexion sans message —
une session expirée n'est pas une panne. `useApiQuery` tient cette règle en un
seul endroit. Le jeton lu au démarrage est ensuite relayé par
`SessionTokenHolder` — cf. « Adapters » : les adapters le lisent là, jamais dans
le trousseau.

**Refuser la position n'est pas une erreur.** Sans elle, l'annuaire appelle
`GET /ateliers` sans `lat`, `lng` ni `radiusKm` ; `distanceKm` vaut `null`, la
liste n'est plus triée par distance, et l'écran le dit avec un bouton pour
réessayer. Les trois paramètres voyagent ensemble ou pas du tout — le schema de
l'API refuse un `lat` sans `radiusKm`. Le rayon vaut 1000 km : il est un clip
dur côté SQL, et le but est de **trier**, pas de filtrer.

**Le port de scan a deux implémentations, et l'écran ignore laquelle il tient.**
`expo-camera` quand la permission caméra est accordée, `manual` — une saisie du
jeton dans une feuille modale — partout ailleurs. Le module `check-in` a
remplacé `nfc` : `react-native-nfc-manager` et l'entitlement
`com.apple.developer.nfc.readersession.formats` sont partis. **C'est le gain du
QR** : `expo-camera` tourne dans Expo Go, sans compte développeur Apple, là où
le NFC ne s'exerçait jamais hors d'un development build et retombait en réalité
sur la saisie manuelle.

**TanStack Query vit à la racine.** C'est le second consommateur annoncé : sur
le web le `QueryClient` ne sort pas de `MachineWeek`, ici tous les écrans lisent
le réseau. Pas de Redux, pas de hors-ligne.

**La navigation de semaine n'arithmétise aucune date**, comme sur le web : la
réponse porte son `to`, qui devient le `from` de la semaine suivante, empilé
dans un `useState`.

**On ne partage pas le `core/` du web**, contre la lettre du §8 de la spec
produit. Ce qui serait partageable — modèles et routes — vit déjà dans
`@etabli/contract` ; ce qui reste est un wrapper `fetch` qui ne dit pas la même
chose des deux côtés (cookie httpOnly posé par Next d'un côté, `Bearer` rangé
par le téléphone de l'autre).

**Hermes s'arrête à l'ES2022.** `toSorted` et le reste de la famille
change-by-copy compilent, passent les tests sous Node, et lèvent
`undefined is not a function` sur l'appareil. D'où `lib: ["DOM", "ES2022"]` dans
les tsconfig d'`apps/mobile` et du `tsconfig.native.json` de `@etabli/ui` : le
crash redevient une erreur de type. `unicorn/no-array-sort` est éteint sur
`apps/mobile` pour la même raison — il conseille exactement ce qui casse. Un
`.sort()` sur le retour d'un `.filter()` ne mute rien de partagé.

**Les écrans ne sont pas testés.** Monter React Native sous vitest demande un
preset et des mocks natifs pour un parcours qui se vérifie à la main. Le `core/`
ne l'est plus non plus depuis le balayage des adapters : restent 11 tests dans
`apps/mobile`, sur les modèles et sur `slots`.

## Adapters — `@etabli/api-client`

Le web et le mobile ne parlent plus à `fetch` directement. `@etabli/api-client`
est un package **sans aucune dépendance**, exporté par `tsdown` et consommé par
les deux apps. Il s'appelait `@etabli/shared` et portait huit sous-chemins ;
sept d'entre eux — `schema`, `errors`, `auth-context`, `time`, `id`,
`type-level`, `migrations` — sont partis avec la v1, qui en était le seul
consommateur. Ne restait que `http`, c'est-à-dire le client d'API : le package
porte donc son nom, et son unique export est la racine.

`createApiClient({ baseUrl, messages, failureOf, cache?, getAuthToken?, timeoutMs?, fetch? })`
rend un **transport** : `call<A>(path, request?)`, plus les trois verbes que
l'API sert réellement — `get`, `post`, `patch` (18 `@Get`, 16 `@Post`,
6 `@Patch`). Pas de `put` ni de `delete` : ç'aurait été de la spéculation.
Chacun retourne un `Result<A, C>`. Le client tient l'URL, la query string (les
`undefined` et les `null` tombent, les tableaux se répètent), `accept`, le
`content-type` conditionnel, le `Bearer`, et la traduction d'un échec en
`{ code, message }`. Un 204 devient un succès sans valeur, pas un `UNREACHABLE`.

`timeoutMs` et `signal` existent mais sont **éteints par défaut** : rien ne les
utilise, et le `RequestInit` reste ainsi identique pour que le cache de Next ne
bouge pas. À allumer sur les clients `no-store` uniquement — jamais sur le
client public de l'annuaire, tant que l'interaction `signal` × cache de Next
n'est pas vérifiée sur une vraie build.

**Le jeton est une propriété du client, pas un argument d'appel.** `getAuthToken`
est un provider sync ou async ; le `token` d'un appel le court-circuite. C'est
ce qui a fait tomber `token: string` des 35 signatures de méthode des neuf ports
web et des deux ports mobile : un appelant ne relaie plus une chaîne qu'il ne
lit jamais.

**D'où deux clients par adapter** dès qu'un module sert du public et du privé :
un client anonyme et cachable, un client authentifié en `no-store`. La
distinction est une propriété de la **route**, pas du site d'appel — un drapeau
par appel l'aurait répétée à chaque ligne. C'est aussi ce qui **tient le
prerender** : `getMachineById` tourne dans un `use cache`, où lire un cookie
casserait la build. `AtelierHttpAdapter` et `IdentityHttpAdapter` se coupent
ainsi des deux côtés — `register` et `login` ne doivent pas partir avec un
Bearer périmé. Les sept autres adapters web, entièrement authentifiés, n'ont
qu'un client ; l'`AtelierHttpAdapter` mobile, entièrement public, non plus.

`cache` se règle par client et s'écrase par appel — la stratégie de prerender du
web en dépend : les GET publics de l'annuaire restent cachables, seul
l'onboarding force `no-store`.

**Le provider n'est pas le même des deux côtés.** Côté web c'est
`readSessionToken` : il lit le cookie httpOnly, `cookies()` est request-scoped,
il n'y a donc rien à tenir. Côté mobile il n'y a pas d'équivalent — les adapters
sont construits à l'import dans `dependencies.ts`, le jeton vit dans le state de
`SessionProvider`. D'où `SessionTokenHolder`, le pont entre les deux, écrit à la
restauration, à la connexion et à la déconnexion. C'est lui qui fait que
`getAuthToken` **ne tape jamais `expo-secure-store`** : le trousseau est lu une
fois au boot. À la restauration, le porteur est écrit **avant** l'appel à
`me()`, sinon la première requête authentifiée partirait nue.

Côté web, le garde que les appelants voulaient vraiment a deux noms :
`requireSession(next)` pour le court-circuit qui redirige, `hasSession()` pour
ceux qui branchent au lieu de rediriger — les deux navs de session, les lecteurs
de préférences, le Route Handler d'availability, la semaine de la fiche machine.

**Le client ne connaît aucun code métier.** Chaque adapter lui passe son
`failureOf(status, body)` et sa table de messages ; le vocabulaire d'échec reste
la propriété du module. `Result<A, C>` est paramétré par le **code**, et chaque
modèle dérive le sien : `export const failure = makeFailure(FAILURE_MESSAGES)`.

Un réseau qui ne répond pas est un statut `0` : `failureOf(0, null)` retombe sur
`UNREACHABLE` dans tous les modules. Un 2xx dont le corps n'est pas du JSON est
traité comme injoignable lui aussi.

**Chaque port a exactement deux adapters** : `<x>.http.adapter.ts` et
`<x>.in-memory.adapter.ts`, construits de la même façon — le jumeau in-memory
reçoit le même `AuthTokenProvider` que le jumeau HTTP. Plus de
`*.adapter.test.ts` — les 117 tests d'adapters ont été supprimés sur décision de
l'auteur, et seul le client générique est testé (45 tests, dans
`api-client.test.ts` et `query.test.ts`). Les tables `BY_CODE`, elles, sont
couvertes — cf. « Codes d'erreur » ci-dessous.

**La plomberie du jeton n'a donc aucune couverture unitaire.** Les 104 E2E
Playwright sont son seul filet côté web ; côté mobile, rien — le parcours se
rejoue à la main sur Expo Go, et la branche qui compte est la restauration
(tuer l'app, la rouvrir).

### Codes d'erreur — ce qui est tranché

**`ApiErrorCode` vit dans `@etabli/contract`**, et les trois côtés le lisent :
l'API l'émet, le web et le mobile le traduisent. Un code n'est plus une chaîne
répétée en trois exemplaires sans lien, donc **un renommage côté API casse la
compilation des deux clients** au lieu de les laisser retomber en silence sur
`UNREACHABLE`. C'est ce que `apps/api` gagne en dépendant du contract.

Deux garde-fous dans `apps/api/src/api-error-code.spec.ts` : aucun fichier de
`src/` ne nomme un `code:` en dur hors du contract — sinon une erreur neuve
échappe aux clients ; et chaque membre d'`ApiErrorCode` est bien émis quelque
part — sinon une entrée morte survit à la suppression de son erreur.

Les tables `BY_CODE` sont typées `Partial<Record<ApiErrorCode, …>>` : la clé est
vérifiée, la valeur reste le vocabulaire du module. Chacune a son test colocalisé
(`<module>-failure.test.ts`) qui fige la traduction, la précédence du code sur le
statut, l'échelle de repli par statut, et le `0` du réseau injoignable.

**Reste ouvert :** un code *ajouté* au contract n'oblige aucun client à le
traiter — le `Partial` l'autorise, et l'écran retombe sur le statut. C'est le
comportement voulu la plupart du temps ; exiger l'exhaustivité coûterait
210 lignes d'`undefined` pour des codes qui ne concernent pas le module.

Les in-memory adapters n'ont **aucun consommateur** aujourd'hui : les tests qui
restent portent sur les modèles et sur des composants purs. Ils ne sont pas
câblés dans `container.ts` ni dans `dependencies.ts` — l'in-memory ne vit pas
dans le code de prod.

**Un fichier d'adapter ne contient que sa classe d'adapter.** Le `failureOf` et
sa table `BY_CODE` vivent dans `core/lib/<module>-failure.ts`, partagés ou non —
quand un module en a plusieurs, le fichier exporte plusieurs fonctions
(`atelierFailureOf`, `adminAtelierFailureOf`, `manageMachineFailureOf`). Ce qui
est du calcul pur part aussi en `core/lib/` (`distance.ts` pour le haversine de
l'annuaire mobile). Ce qui
ne sert qu'à une seule classe et n'a pas de sens hors d'elle devient un membre
privé — `onDate`, `matches`, la clé du trousseau. La règle n'a plus d'exception :
l'`interface Account` des deux in-memory adapters d'identity est descendue dans
`core/model/session.ts`, où vivent déjà `CurrentUser` et `LoginInput` — qui porte
lui aussi un mot de passe. `core/lib/` ne prend que du calcul, or un type n'en
est pas.

## Bascule v1 → v2 — ce qui est tranché

Le web et les E2E parlent à `apps/api`. `scripts/dev.sh` lance `dev:api`, le
`globalSetup` de Playwright appelle `db:migrate:test` puis `db:seed:test`,
et `playwright.config.ts` boote `@etabli/api`.

**Deux routes ont bougé, dans le contract, donc des deux côtés à la fois.**
`routes.me.profile` (`/me/profile`) remplace le `PATCH /auth/me` — v1 comme v2 le
servent désormais là — et `routes.certifications.request` vaut
`/certifications/request`. `GET /auth/me` n'a pas bougé. La v1 dérivant sa table de
routes du contract, la constante suffit à déplacer les deux serveurs.

**Le seed v2 n'était pas le portage à l'identique annoncé.** Il lui manquait
trois comptes (`lea`, `theo`, `manon`), cinq adhésions, et **les deux tables
entières** : 16 habilitations et 20 réservations. Un E2E le prouvait — celui qui
demande à Théo de se heurter à une machine qu'il n'est pas habilité à prendre.
Tout est porté.

**Le seed est en deux temps.** `seed(db)` pose les ateliers, machines, comptes et
adhésions ; `seedDemo(db)` pose les habilitations et les créneaux. La CLI appelle
les deux ; `seeded-app.harness.ts` n'appelle que `seed`, parce que les specs de
l'API ont été écrites contre une base sans état métier préexistant et qu'un
créneau déjà pris y ferait répondre 409 là où elles attendent 201.

**Les créneaux du seed sont relatifs à `now`**, donc `seedDemo` les supprime et
les réinsère à chaque passage au lieu de garder la démo d'hier.

**La v1 est supprimée** : `packages/server`, les quatre `packages/bc-*` et
`packages/test-utils` — 266 fichiers, 15 976 lignes, 548 tests. `effect` et
`@effect/platform` ne sont plus dans aucun `package.json`. Les scripts racine
`db:migrate`, `db:seed`, `db:seed:test`, `db:generate` reprennent les noms
courts que la v1 occupait, et `dev:server` n'existe plus.

L'ordre comptait : la bascule d'abord, la suppression ensuite. C'est ce qui a
fait tomber le trou du seed — avec la v1 encore là pour servir de comparaison.
Supprimer d'abord aurait rendu les 103 E2E rouges sans rien à confronter.

## Repos de référence

Deux repos locaux servent de modèle. Les consulter plutôt que d'inventer.

**Backend — `/Users/maoudin/Desktop/Developer/kairos-crm/monorepo`**
Un package pnpm par bounded context (`packages/bc-*`), agrégés par
`packages/server`. Lire `packages/bc-client/src/` en entier : c'était le gabarit
de la v1. **Il ne l'est plus** — le back d'Établi est `apps/api`, en NestJS et
sans Effect. Ce qui suit décrit kairos, pas ce dépôt.

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
