# Établi — API v2 en NestJS

Conception d'une seconde implémentation du back d'Établi : NestJS, Drizzle, Zod, en clean
architecture port & adapter. Elle remplace fonctionnellement `packages/server` et les quatre
`packages/bc-*` de la v1, sans Effect.ts et sans bounded contexts.

Le produit ne change pas. Règles métier, modèle de données et surface d'API restent ceux des §5,
§9 et §10 de `2026-09-14-etabli-design.md`, qui reste le document de référence produit. Une seule
route change d'URL, documentée en §4.

## 1 · Périmètre

Dans le périmètre : l'API seule.

Hors périmètre, explicitement :

- le front — `apps/web` n'est pas touché, et ce qui consommera cette API se décide plus tard ;
- Playwright — « e2e » désigne ici du HTTP de bout en bout via supertest, pas un navigateur ;
- le déploiement ;
- la suppression des `packages/bc-*` et de `packages/server`, qui restent en place, inertes.

L'app vit dans `etabli/apps/api`, à côté de `apps/web`. Elle hérite du workspace pnpm, d'oxlint et
oxfmt, de Vitest, du `.env` et du CI existants.

## 2 · Les six décisions structurantes

Chacune a été tranchée avant conception, et le reste du document en découle.

| # | Décision | Conséquence principale |
|---|---|---|
| 1 | Un module NestJS **par ressource**, pas par contexte | 7 modules : `auth`, `user`, `atelier`, `membership`, `machine`, `certification`, `booking` |
| 2 | Entities dans le module, **schémas Drizzle centralisés** | `drizzle-kit` lit un seul barrel ; les `references()` croisées ne cassent rien |
| 3 | Un module importe le **repository** d'un autre, jamais son service | Graphe acyclique, aucun `forwardRef` dans le projet |
| 4 | `drizzle-kit` **repart de zéro** | Base neuve ; une migration manuelle pour `btree_gist` et la contrainte d'exclusion |
| 5 | **Vitest**, trois étages, PGlite | Pas de Docker pour les tests ; isolation réelle par suite |
| 6 | **Guards** pour le rôle, **use-case** pour le cloisonnement | 403 déclaratif sur la route, 404 calculé dans le domaine |

### 2.1 · Pourquoi la décision 3 n'est pas un compromis

Sans bounded contexts, `booking` a besoin de `machine`, `certification` et `membership`. Trois
façons de câbler ça : importer le module voisin et injecter son service (le patron Boonty),
importer son seul module d'infrastructure et injecter son token de repository, ou redéclarer des
ports locaux (le mécanisme de la v1 sous un autre nom).

Les huit ports croisés de la v1 tranchent la question sans avoir à arbitrer :

| Port v1 | Ce qu'il expose | Nature |
|---|---|---|
| `CertificationChecker` | `isCertified(userId, machineId) → boolean` | un `SELECT` |
| `MachineCatalog` | `find`, `findMany`, `listForAteliers`, `listAll` | des `SELECT` |
| `MachineDirectory` | `find`, `findMany`, `listForAteliers` | des `SELECT` |
| `MemberRoster` | `namesOf(userIds) → Map<id, nom>` | un `SELECT` |
| `MemberDirectory` | `namesOf(userIds) → Map<id, nom>` | un `SELECT` |
| `MembershipLookup` | `forUser(userId) → adhésions` | un `SELECT` |
| `MemberAteliers` | `forUser`, `forUsers` | des `SELECT` |
| `MemberProfile` | `markOnboarded(userId, practice, at)` | un `UPDATE` |

Sept lectures et une écriture d'une seule table. **Aucun n'appelle une règle du module voisin.**
Le cas qui justifierait d'injecter son service — avoir besoin de sa logique et pas de ses lignes —
n'existe pas dans ce domaine.

Trois observations le confirment. `MachineCatalog` et `MachineDirectory` sont la même lecture
déclarée deux fois, avec des champs à 80 % identiques ; `MemberRoster` et `MemberDirectory` sont
littéralement la même interface, `namesOf`, dupliquée. C'est le coût direct de l'isolation des
contextes, et il disparaît quand les modules projettent depuis le même repository. Et importer les
services créerait un cycle dès le deuxième module — `booking → machine → atelier → membership →
user`, plus `user → membership` pour l'auth — donc des `forwardRef` payés pour du `SELECT`.

D'où la règle, vérifiable en revue : *un module n'importe jamais le module d'un autre ; il importe
son `*InfrastructureModule` et injecte son token de repository.* Un `forwardRef` dans ce projet est
un signal d'erreur de conception, pas une commodité.

Corollaire assumé : `MACHINE_REPOSITORY` porte une jointure vers `ateliers`, puisque les lectures
croisées attendent `atelierName` et `atelierSlug` collés à la machine. Le repository `machine`
n'est donc pas un miroir strict de la table `machines`.

## 3 · Architecture

### 3.1 · Arborescence

```
apps/api/src/
  main.ts
  app.module.ts
  infrastructure/
    config/{config.module.ts, env.schema.ts}
    database/{database.module.ts, database.token.ts, schema/}
    decorators/{roles.decorator.ts, current-user.decorator.ts}
    swagger/swagger.ts
  shared/
    domain/{clock.interface.ts, clock.token.ts}
    infrastructure/{base.repository.ts, system.clock.ts}
    presentation/pipes/zod-validation.pipe.ts
    testing/{stub.ts, fixed.clock.ts}
  modules/<m>/
    <m>.module.ts
    domain/
      entities/<m>.entity.ts
      errors/<m>.errors.ts
      constants/<m>.constant.ts
      repositories/<m>.repository.interface.ts
      repositories/<m>.repository.token.ts
    application/
      services/<m>.service.ts
      use-cases/<action>-<m>.usecase.ts
    presentation/
      controllers/<m>.controller.ts
      dtos/<action>-<m>.request.dto.ts
      dtos/<m>.response.dto.ts
    infrastructure/
      <m>.infrastructure.module.ts
      repositories/<m>.repository.drizzle-pg.ts
```

### 3.2 · Les quatre couches

**`domain/`** — l'entity, ses erreurs, ses constantes (`as const`, jamais d'`enum`), l'interface du
repository et son token `Symbol`. Aucune dépendance à Drizzle. Les seules dépendances Nest tolérées
sont les classes d'exception HTTP, dont les erreurs de domaine héritent.

**`application/`** — le service et les use-cases. Le service est un **passe-plat strict** : une
méthode par use-case, dont le corps est un unique `return this.xUsecase.execute(...)`. Il existe
pour donner au controller un point d'entrée unique par module, pas pour porter de la logique. Toute
la logique métier vit dans les use-cases, un par fichier, exposant une seule méthode `execute`.

**`presentation/`** — controllers, DTO de requête (schéma Zod + type inféré) et DTO de réponse
(classe avec `fromEntity`). Le controller ne connaît que le service et les guards.

**`infrastructure/`** — le module qui lie le token à l'implémentation, et l'implémentation Drizzle.

### 3.3 · Les modules et le graphe de dépendances

```
user  atelier                    (feuilles)
  └──→ membership                (USER_REPOSITORY + ATELIER_REPOSITORY)
         └──→ machine            (ATELIER_REPOSITORY + MEMBERSHIP_REPOSITORY)
                └──→ certification  (MACHINE + USER + MEMBERSHIP)
                       └──→ booking (MACHINE + CERTIFICATION + MEMBERSHIP + USER)
auth ──→ user, membership
```

Acyclique par construction. Chaque flèche est un `imports: [XInfrastructureModule]` doublé d'un
`@Inject(X_REPOSITORY)`.

## 4 · Surface d'API

38 routes, réparties par module.

**`auth` — 4**

| Route | Use-case |
|---|---|
| `POST /auth/register` | `RegisterUserUsecase` |
| `POST /auth/login` | `LoginUserUsecase` |
| `POST /auth/password` | `ChangePasswordUsecase` |
| `GET /auth/me` | `GetCurrentUserUsecase` |

**`user` — 5**

| Route | Use-case |
|---|---|
| `PATCH /me/profile` | `UpdateProfileUsecase` |
| `GET /me/preferences` | `GetPreferencesUsecase` |
| `PATCH /me/preferences` | `UpdatePreferencesUsecase` |
| `GET /admin/users` | `ListAdminUsersUsecase` |
| `PATCH /admin/users/:userId` | `UpdateAdminUserUsecase` |

**`atelier` — 5**

| Route | Use-case |
|---|---|
| `GET /ateliers` | `ListAteliersUsecase` |
| `GET /ateliers/:slug` | `GetAtelierBySlugUsecase` |
| `GET /admin/ateliers` | `ListAllAteliersUsecase` |
| `POST /admin/ateliers` | `CreateAtelierUsecase` |
| `PATCH /admin/ateliers/:atelierId` | `SetAtelierStatusUsecase` |

**`membership` — 3**

| Route | Use-case |
|---|---|
| `POST /onboarding/complete` | `CompleteOnboardingUsecase` |
| `GET /me/ateliers` | `ListMyAteliersUsecase` |
| `PATCH /admin/ateliers/:atelierId/members/:userId` | `SetMembershipRoleUsecase` |

**`machine` — 3**

| Route | Use-case |
|---|---|
| `GET /manage/machines` | `ListManagedParcsUsecase` |
| `POST /manage/machines` | `CreateMachineUsecase` |
| `PATCH /manage/machines/:machineId` | `UpdateMachineUsecase` |

**`certification` — 5**

| Route | Use-case |
|---|---|
| `POST /certifications/request` | `RequestCertificationUsecase` |
| `GET /certifications/mine` | `ListMyCertificationsUsecase` |
| `GET /manage/certifications` | `ListCertificationQueueUsecase` |
| `POST /manage/certifications/:certificationId/grant` | `GrantCertificationUsecase` |
| `POST /manage/certifications/:certificationId/revoke` | `RevokeCertificationUsecase` |

**`booking` — 12**

| Route | Use-case |
|---|---|
| `GET /machines/:machineId/availability` | `GetMachineAvailabilityUsecase` |
| `POST /bookings` | `CreateBookingUsecase` |
| `GET /bookings` | `ListMyBookingsUsecase` |
| `GET /bookings/:bookingId` | `GetBookingDetailUsecase` |
| `POST /bookings/:bookingId/cancel` | `CancelBookingUsecase` |
| `POST /bookings/:bookingId/check-in` | `CheckInBookingUsecase` |
| `GET /manage/bookings` | `ListAtelierBookingsUsecase` |
| `POST /manage/bookings/:bookingId/check-in` | `ManualCheckInBookingUsecase` |
| `POST /manage/bookings/:bookingId/cancel` | `CancelAtelierBookingUsecase` |
| `POST /manage/bookings/:bookingId/no-show` | `MarkNoShowUsecase` |
| `GET /manage/stats` | `GetAtelierStatsUsecase` |
| `GET /admin/stats` | `GetNetworkStatsUsecase` |

**`health` — 1** : `GET /health`, servi depuis `infrastructure/`.

### 4.1 · La seule route dont l'URL change

`PATCH /auth/me` devient **`PATCH /me/profile`**.

En v1, `GET /auth/me` et `PATCH /auth/me` partagent un chemin sans partager de responsabilité :
l'un lit la session, l'autre modifie le profil. Sous un module par ressource, ils tombent dans deux
modules différents et deux controllers se disputeraient `/auth/me`. Le déplacement range le profil
avec les préférences, là où il appartient.

## 5 · Validation — Zod

Les DTO de requête sont des schémas Zod avec `.strict()`, et le type est inféré du schéma.

```ts
export const createBookingBodySchema = z
  .object({
    machineId: z.uuid(),
    startAt: z.iso.datetime({ offset: true }).transform((s) => new Date(s)),
  })
  .strict()

export type CreateBookingBody = z.infer<typeof createBookingBodySchema>
```

Le schéma est appliqué au paramètre du controller par un `ZodValidationPipe`, qui remplace la
valeur par la sortie parsée (donc des `Date` et non des chaînes ISO) et lève un
`BadRequestException` portant l'arbre d'erreurs aplati.

Le `ValidationPipe` intégré de NestJS ne traite que les métatypes décorés par `class-validator` :
pour un paramètre typé par Zod, il est un passe-plat. Un pipe explicite est donc nécessaire, et
celui de `Boonty/webapp-api/src/shared/presentation/pipes/zod-validation.pipe.ts` est repris tel
quel.

**À vérifier au moment d'installer** : si la version de NestJS réellement disponible offre un
support Zod natif, on l'utilise et ce pipe disparaît. Cette conception ne suppose pas qu'il existe.

## 6 · Un module de bout en bout — `booking`

Le plus riche : 12 routes, cinq refus sur la seule création, cinq prédicats temporels. Si le
gabarit tient ici, il tient partout.

### 6.1 · La chaîne

```
Controller  →  Service        →  Use-case              →  Repository
(guards,       (passe-plat,      (toute la logique)       (interface + token,
 pipes,         1 ligne)                                   impl Drizzle)
 DTO)
```

```ts
@Post()
@UseGuards(JwtAuthGuard)
@ApiResponse({ status: 201, type: BookingResponseDto })
async create(
  @CurrentUser() user: AuthUser,
  @Body(new ZodValidationPipe(createBookingBodySchema)) body: CreateBookingBody,
): Promise<BookingResponseDto> {
  const booking = await this.bookingService.create(user, body)
  return BookingResponseDto.fromEntity(booking)
}
```

```ts
public async create(user: AuthUser, body: CreateBookingBody): Promise<BookingEntity> {
  return this.createBookingUsecase.execute(user, body)
}
```

```ts
@Injectable()
export class CreateBookingUsecase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookingRepository: IBookingRepository,
    @Inject(MACHINE_REPOSITORY) private readonly machineRepository: IMachineRepository,
    @Inject(CERTIFICATION_REPOSITORY) private readonly certificationRepository: ICertificationRepository,
    @Inject(CLOCK) private readonly clock: IClock,
  ) {}

  async execute(user: AuthUser, body: CreateBookingBody): Promise<BookingEntity> {
    const machine = await this.machineRepository.findBookable(body.machineId)
    if (!machine || machine.status === MachineStatus.RETIRED || !isMemberOf(user, machine.atelierId)) {
      throw new MachineNotBookableError(body.machineId)
    }
    if (machine.status !== MachineStatus.AVAILABLE) {
      throw new MachineUnavailableError(body.machineId, machine.status)
    }

    const now = this.clock.now()
    if (body.startAt.getTime() <= now.getTime()) {
      throw new SlotInThePastError(body.machineId, body.startAt)
    }

    if (machine.requiresCertification) {
      const certified = await this.certificationRepository.isCertified(user.id, machine.id)
      if (!certified) throw new MissingCertificationError(body.machineId)
    }

    return this.bookingRepository.insert(
      BookingEntity.create({ user, machine, startAt: body.startAt, now }).toJSON(),
    )
  }
}
```

L'ordre des refus est celui de la v1 et n'est pas arbitraire : l'inaccessibilité (404) précède
l'indisponibilité (409), qui précède le passé, qui précède l'habilitation. Un statut ne doit jamais
révéler l'existence d'une ressource qu'on n'a pas le droit de voir.

Le cinquième refus — le chevauchement — n'apparaît pas dans ce code. Il est garanti par la
contrainte d'exclusion en base, et le repository Drizzle traduit le code Postgres `23P01` en
`BookingOverlapError`. C'est délibéré : la règle 2 du §5 de la spec v1 demande qu'elle soit
garantie deux fois, et une vérification en amont dans le use-case serait de toute façon sujette à
une course entre deux requêtes concurrentes. La base est le seul arbitre qui ne peut pas se
tromper.

### 6.2 · Les erreurs

Les erreurs de domaine héritent des exceptions HTTP de Nest, ce qui remplace les
`HttpApiSchema.annotations({ status })` de la v1.

```ts
export class MachineNotBookableError extends NotFoundException {
  constructor(machineId: string) {
    super({ code: 'MACHINE_NOT_BOOKABLE', message: `Machine not bookable: ${machineId}`, machineId })
  }
}
```

Le `code` en clair dans le corps est délibéré : cinq refus de réservation se partagent le 409, et
tout client doit pouvoir les distinguer sans lire le texte. C'est ce que la v1 avait fini par
imposer avec son `_tag`, après que trois adapters web ont rendu un refus comme une panne.

Aucun filtre d'exception maison n'est nécessaire : les erreurs de domaine *sont* des
`HttpException`, Nest les sérialise déjà.

### 6.3 · L'entity porte les invariants

```ts
export class BookingEntity {
  isCancellable(now: Date): boolean
  isCancellableByAtelier(now: Date): boolean
  isCheckInOpen(now: Date): boolean
  isNoShowMarkable(now: Date): boolean
  isCompleted(now: Date): boolean
  effectiveStatus(now: Date): BookingStatus
  checkInWindow(): { opensAt: Date; closesAt: Date }
}
```

Les règles conservées telles quelles depuis la v1 :

- `COMPLETED` est **dérivé, jamais écrit** : aucune colonne, aucune migration, aucun ordonnanceur.
  `effectiveStatus(now)` le projette dans les réponses, et le filtre par état de `/manage/bookings`
  tourne sur la projection.
- L'annulation par l'atelier court jusqu'à la **fin** du créneau ; celle du membre ferme à son
  **départ**. Un créneau déjà pointé est hors d'atteinte des deux côtés.
- `isNoShowMarkable` se lit sur la fermeture de la fenêtre de pointage, pas sur la fin du créneau.
- La fenêtre de pointage est de 15 min avant à 30 min après le départ, et le check-in n'est **pas**
  idempotent.

### 6.4 · Le token `CLOCK`

Cinq prédicats et une projection dépendent de `now`. Des appels à `new Date()` dans les use-cases
les rendraient intestables sans manipuler l'horloge système. Un token `CLOCK` dans `shared/`
résout ça : `SystemClock` en production, `FixedClock` en test.

```ts
export interface IClock {
  now(): Date
}
export const CLOCK = Symbol('CLOCK')
```

## 7 · Auth et autorisation

### 7.1 · Deux questions, deux endroits

Le **rôle plateforme** est déclaratif et se lit sur la route : `@Roles(PlatformRole.ADMIN)` plus
`RolesGuard`, qui rend **403**.

Le **cloisonnement par atelier** dépend d'une lecture en base — cette réservation est-elle la
sienne, ce fabmanager tient-il cet atelier — et vit dans le use-case, qui rend **404**.

```ts
const booking = await this.bookingRepository.findById(bookingId)
const runsIt = await this.membershipRepository.isFabmanagerOf(user.id, booking.atelierId)
if (!runsIt) throw new BookingNotFoundError(bookingId)
```

C'est exactement la distinction que la v1 a fini par trancher au jalon 6 : 403 sur les routes
`/admin/*`, où le refus porte sur le rôle ; 404 sur une ressource d'un autre atelier, parce qu'un
403 avouerait qu'elle existe ; collection vide sur une liste.

Ce partage est délibéré et se justifie en deux points. Un guard qui résoudrait le cloisonnement
referait la requête que le use-case fait de toute façon. Et un use-case appelé autrement que par
HTTP resterait alors sans protection, alors qu'ici il est sûr quel que soit son appelant.

### 7.2 · Le JWT

HS256, sept jours. Les claims ne portent que `userId` ; le rôle plateforme et les adhésions sont
relus en base à chaque requête. C'est ce qui fait que `auth` dépend de `user` et `membership`.

`JwtAuthGuard` vérifie la signature, charge l'utilisateur et ses adhésions, et pose un `AuthUser`
sur la requête, que `@CurrentUser()` récupère :

```ts
interface AuthUser {
  readonly id: string
  readonly platformRole: PlatformRole
  readonly memberships: ReadonlyArray<{ atelierId: string; role: MembershipRole }>
}
```

Un compte `SUSPENDED` est refusé **là**, une fois, plutôt que dans 38 use-cases.

Conséquence assumée, identique à la limite n°1 du §12 de la spec v1 : un rôle retiré ou une
suspension prennent effet à la requête suivante, et il n'y a pas de liste de révocation.

## 8 · Persistance

### 8.1 · Schémas Drizzle

Les sept tables sont déclarées dans `infrastructure/database/schema/`, et un `index.ts` les
ré-exporte — c'est ce barrel que `drizzle-kit` lit. Elles vivent ensemble parce que `drizzle-kit
generate` doit toutes les voir d'un coup et que les `references()` traversent les modules.

Tables : `users`, `user_preferences`, `ateliers`, `memberships`, `machines`, `certifications`,
`bookings`.

`domain_events` de la v1 n'est pas reprise : rien ne l'écrit ni ne la lit, elle avait été posée
pour un envoi d'e-mail qui n'existe pas (limite n°5 du §12). Elle reviendra avec le premier envoi.

### 8.2 · Migrations

`drizzle-kit generate` produit les migrations des sept tables. Deux objets n'ont pas d'équivalent
déclaratif en Drizzle et partent dans une migration écrite à la main, **ordonnée avant** la table
`bookings` :

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
  machine_id WITH =,
  tstzrange(start_at, end_at) WITH &&
) WHERE (status IN ('CONFIRMED', 'CHECKED_IN'));
```

La contrainte `bookings_ends_after_it_starts` (`CHECK (end_at > start_at)`) suit le même chemin.

### 8.3 · Repositories

Un `BaseRepository` générique dans `shared/infrastructure/` porte le CRUD commun ; chaque
repository l'étend et implémente son interface. Pas d'ORM par-dessus Drizzle : du query builder, et
du SQL brut quand il est plus lisible.

### 8.4 · Transactions

Le driver est `pg` en TCP : `db.transaction(async (tx) => …)` est disponible, et la limite « pas
de transaction » du driver `neon-http` ne s'applique pas. Dans le callback, `tx` doit être utilisé
partout — un appel au `db` racine sortirait le statement de la transaction.

**Un seul use-case de toute l'API écrit dans deux tables**, et il traverse deux repositories :
`CompleteOnboardingUsecase` insère une ligne dans `memberships` puis met à jour `users`
(`onboarding_completed`, `practice`).

En v1, ces deux écritures **ne sont pas dans une transaction** : la command `completeOnboarding`
appelle `repository.insertMembership` puis `profile.markOnboarded`, chacun sur son propre accès
SQL. Un échec entre les deux laisse un compte membre d'un atelier mais jamais marqué comme ayant
terminé son onboarding — et l'interface le renverra indéfiniment vers `/bienvenue`. L'isolation
des contextes rendait la transaction coûteuse, donc elle n'a pas été écrite. C'est un défaut à ne
pas reconduire.

En v2, les deux repositories partagent le même `DATABASE_CONNECTION`, donc la transaction est
possible. Le câblage retenu : **les méthodes qui participent à une écriture multi-tables prennent
un `tx` optionnel en dernier paramètre**, et le use-case ouvre la transaction.

```ts
async execute(user: AuthUser, body: CompleteOnboardingBody): Promise<OnboardingResult> {
  const atelier = await this.atelierRepository.findPublishedById(body.atelierId)
  if (!atelier) throw new AtelierNotJoinableError(body.atelierId)

  const now = this.clock.now()
  return this.db.transaction(async (tx) => {
    const membership =
      (await this.membershipRepository.find(user.id, atelier.id, tx)) ??
      (await this.membershipRepository.insert({ /* … */ }, tx))
    await this.userRepository.markOnboarded(user.id, body.practice, now, tx)
    return toOnboardingResult(atelier, membership, body.practice)
  })
}
```

Deux méthodes de repository portent ce paramètre, pas quarante. L'alternative — un
`TransactionManager` sur `AsyncLocalStorage` qui rend le `tx` ambiant et invisible — est écartée :
elle rend la transaction implicite partout pour servir un seul appelant, et un `tx` invisible est
exactement le genre de chose qu'on ne retrouve pas quand il manque.

## 9 · Tests

### 9.1 · Trois étages

| Étage | Suffixe | Cible | Dépendances |
|---|---|---|---|
| Unitaire | `.spec.ts` | use-cases, entities, prédicats | stubs `vi.fn()`, `FixedClock` |
| Intégration | `.integration.spec.ts` | repositories Drizzle | PGlite |
| Bout en bout | `.e2e.spec.ts` | l'app Nest complète | supertest + PGlite |

Les tests sont colocalisés avec le code qu'ils couvrent.

### 9.2 · Unitaire — sans conteneur Nest

Le gain net de l'injection par constructeur : un use-case se teste sans monter NestJS. Pas de
`Test.createTestingModule`, pas de décorateur à résoudre, juste un `new`.

```ts
const usecase = new CreateBookingUsecase(
  stub<IBookingRepository>({ insert: vi.fn() }),
  stub<IMachineRepository>({ findBookable: vi.fn().mockResolvedValue(availableMachine) }),
  stub<ICertificationRepository>({ isCertified: vi.fn().mockResolvedValue(false) }),
  new FixedClock('2026-09-15T10:00:00Z'),
)

await expect(usecase.execute(member, { machineId, startAt: tomorrow }))
  .rejects.toThrow(MissingCertificationError)
```

**Il n'y a pas d'implémentation en mémoire des repositories.** La v1 en avait ; elles
réimplémentaient du filtrage et du tri que rien ne testait, et une implémentation en mémoire qui
diverge du SQL donne des tests verts sur un produit cassé. Le prix assumé : l'étage 2 devient le
seul endroit où le comportement d'un repository est vérifié — ce qui est acceptable précisément
parce qu'il tourne contre un vrai Postgres.

Le `stub<T>()` est un helper de `shared/testing/` :

```ts
export const stub = <T extends object>(partial: Partial<T>): T =>
  new Proxy(partial, {
    get: (target, prop) =>
      prop in target
        ? Reflect.get(target, prop)
        : () => {
            throw new Error(`Unstubbed ${String(prop)}`)
          },
  }) as T
```

Il achète deux choses qu'un `as unknown as I…` ne donne pas : le typage au point d'appel, donc une
méthode renommée dans l'interface casse la compilation du test ; et une méthode non stubbée qui
**lève**, au lieu de rendre `undefined` et de laisser passer un test devenu vide de sens.

### 9.3 · Intégration — PGlite

Une instance PGlite par suite, migrations appliquées, `btree_gist` chargé via
`@electric-sql/pglite/contrib/btree_gist`. La v1 le fait déjà dans `packages/test-utils`, donc la
contrainte d'exclusion est réellement vérifiable en mémoire, sans Docker.

C'est ici que se teste ce qu'aucun stub ne prouve : que `bookings_no_overlap` rejette le second
créneau, que le `23P01` devient bien `BookingOverlapError`, que la jointure `machines × ateliers`
rend `atelierSlug`.

**Cela corrige le défaut d'isolation connu de la v1.** Ses 95 E2E s'accumulent d'un run à l'autre
dans un Postgres Docker partagé, et des tests sans rapport tombent sur un annuaire saturé. Une base
en mémoire par suite rend le problème structurellement impossible : il n'y a rien à remettre à
zéro.

### 9.4 · Bout en bout — supertest

`Test.createTestingModule({ imports: [AppModule] })` avec `DATABASE_CONNECTION` surchargé vers un
Drizzle adossé à PGlite et `CLOCK` vers un `FixedClock`. On traverse HTTP → `JwtAuthGuard` →
`RolesGuard` → `ZodValidationPipe` → controller → service → use-case → Drizzle.

C'est là que se vérifie le cloisonnement route par route, comme `tenancy.test.ts` en v1 : 404 sur
la ressource d'un autre atelier, collection vide sur une liste, 403 sur `/admin/*`.

### 9.5 · Deux contraintes d'outillage

**`unplugin-swc` est requis.** esbuild, que Vitest utilise par défaut, n'émet pas
`emitDecoratorMetadata` ; sans lui, l'injection Nest par type ne résout rien. C'est la raison pour
laquelle Boonty tourne sur `@swc/jest`. Une ligne de configuration, mais elle bloque tout tant
qu'elle n'est pas là : elle est en tête du plan d'implémentation.

**Pas de Playwright.** Le front est hors périmètre.

### 9.6 · Ordre d'écriture

Code d'abord, tests dans la foulée de chaque tranche, jamais reportés à plus tard. C'est l'état en
vigueur depuis le jalon 1 de la v1, où la règle TDD stricte a été levée par l'auteur. Une décision
explicite suffit à rétablir le TDD strict.

## 10 · Transverse

**Configuration.** `ConfigModule` avec l'environnement validé par un schéma Zod au démarrage : une
clé manquante tue le process au boot, elle ne produit pas un 500 trois jours plus tard.

**Swagger.** Monté depuis les DTO de réponse et les décorateurs `@ApiResponse`. Les `@Roles()` sur
les routes documentent qui a le droit d'appeler quoi.

**Seed.** Le seed v1 est porté sur Drizzle à l'identique : trois ateliers de démonstration, sept
comptes couvrant tous les rôles et l'état suspendu, mot de passe `etabli-2026`, insertion
idempotente.

## 11 · Ce qui est conservé de la v1, et ce qui ne l'est pas

**Conservé** : les sept règles de refus et leur ordre, les quatre prédicats temporels, `COMPLETED`
dérivé, la contrainte d'exclusion en base, les deux fenêtres d'annulation, le 404 qui ne révèle
rien, le calcul des statistiques sur des journées entières d'ouverture, les horaires `8h`–`22h` en
`Europe/Paris`, le seed.

**Non conservé** : Effect.ts, les bounded contexts en packages, les ports croisés, les
implémentations de repository en mémoire, la table `domain_events`, `PATCH /auth/me`, Playwright.

## 12 · Limites connues

Celles du §12 de la spec v1 restent valables — pas de refresh token, pas d'e-mail, pas de no-show
automatique, français uniquement, NFC côté client absent. S'y ajoutent deux limites propres à cette
conception :

1. **Un stub n'est pas un contrat.** Sans implémentation en mémoire, rien ne garantit au niveau du
   type qu'un stub de test reflète le comportement du repository réel. Le `stub<T>()` attrape le
   renommage et l'appel non prévu ; il n'attrape pas une sémantique qui dérive. L'étage
   d'intégration est la seule contre-mesure.
2. **Le rôle et la suspension ont une latence d'une requête**, puisque le JWT ne porte que
   `userId` et que les droits sont relus par requête sans cache — ce qui est aussi ce qui rend la
   latence bornée à une requête plutôt qu'à sept jours.
