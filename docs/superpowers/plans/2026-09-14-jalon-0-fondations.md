# Jalon 0 — Fondations · Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** monter le monorepo pnpm d'Établi — contract, shared, test-utils, squelette serveur Effect connecté à Neon avec migrator, application Next.js 16.3 aux couleurs du produit — jusqu'à ce que `pnpm check` passe et que la page d'accueil s'affiche avec la bonne direction artistique.

**Architecture:** un package pnpm par frontière (`packages/*`), l'application Next dans `apps/web`. Le serveur est une application Effect autonome exposant un `HttpApi` `@effect/platform`, câblée par Layers, migrée par des fichiers `.sql` numérotés joués au démarrage. Le front ne connaît du back que `@etabli/contract` — des types TypeScript purs, sans une ligne d'Effect. Aucun bounded context métier n'est créé dans ce jalon : on livre le socle sur lequel `bc-identity` sera posé au jalon 1.

**Tech Stack:** pnpm 10 · TypeScript 5.9 (project references) · Effect 3.22 · `@effect/platform` 0.97 · `@effect/sql-pg` 0.53 · PostgreSQL Neon · Next.js 16.3 · React 19.3 · Tailwind CSS 4.3 · Vitest 3.2 · Playwright 1.63 · oxlint · oxfmt · lefthook.

**Spec:** `docs/superpowers/specs/2026-09-14-etabli-design.md` — en particulier §7 (jalon 0), §8.2 (monorepo), §8.5 (contrat d'API), §8.6 (front), §8.10 (tests), §8.11 (déploiement), §8.12 (direction artistique), §9 (`domain_events`).

---

## Contraintes globales

Ces règles valent pour **toutes** les tâches ; elles ne sont pas répétées ensuite.

- **Langue.** Le produit et la documentation sont en français. Le code, les noms de symboles et les rares commentaires sont en anglais.
- **Zéro commentaire.** Un commentaire par fichier au maximum, et seulement s'il porte une information invisible depuis le fichier. Aucun commentaire dans un test.
- **Pas d'`enum`.** Objets `as const` + type dérivé.
- **Pas de `any`**, pas de `as` de confort. Les `no-unsafe-*` de oxlint sont en erreur.
- **Format.** Pas de point-virgule, quotes simples, 120 colonnes, virgule finale ES5, imports triés par oxfmt.
- **Nommage de fichiers.** kebab-case partout, suffixe métier obligatoire (`.command.ts`, `.query.ts`, `.repository.ts`, `.schema.ts`, `.port.ts`, `.page.tsx`, `.test.ts`, `.test.e2e.ts`). Seule exception : les composants React sont en PascalCase (`Button.tsx`).
- **TDD strict, non négociable.** Pour toute tranche : E2E Playwright rouge d'abord quand la tranche est visible par l'utilisateur, puis unitaires rouges couche par couche, puis l'implémentation. Un test écrit après le code est à réécrire.
- **Tests colocalisés** avec le code testé. E2E en `.test.e2e.ts`, colocalisés avec la page.
- **Import Effect namespacé** : `import * as Effect from 'effect/Effect'`, jamais `import { Effect } from 'effect'`.
- **Scope npm** : `@etabli/*`. Versions internes `workspace:*`.
- **Commit à chaque fin de tâche**, message en anglais, préfixe conventionnel (`chore:`, `feat:`, `test:`).
- **Versions exactes à utiliser** (relevées le 14/09/2026, toutes vérifiées compatibles entre elles) :

  | Paquet | Version |
  |---|---|
  | `typescript` | `^5.9.3` |
  | `effect` | `^3.22.2` |
  | `@effect/platform` | `^0.97.2` |
  | `@effect/platform-node` | `^0.108.2` |
  | `@effect/sql` | `^0.52.1` |
  | `@effect/sql-pg` | `^0.53.0` |
  | `@effect/experimental` | `^0.61.1` |
  | `@effect/vitest` | `^0.30.0` |
  | `vitest` | `^3.2.7` |
  | `@electric-sql/pglite` | `^0.5.8` |
  | `next` | `^16.3.5` |
  | `react` / `react-dom` | `^19.3.0` |
  | `tailwindcss` / `@tailwindcss/postcss` | `^4.3.3` |
  | `@playwright/test` | `^1.63.0` |
  | `oxlint` | `^1.82.0` |
  | `oxfmt` | `^0.67.0` |
  | `lefthook` | `^2.1.12` |
  | `tsdown` | `^0.23.0` |
  | `tsx` | `^4.22.0` |
  | `@testing-library/react` | `^16.3.3` |
  | `@testing-library/dom` | `^10.4.0` |
  | `@testing-library/jest-dom` | `^7.0.1` |
  | `jsdom` | `^30.0.1` |

  **Ne pas passer à Vitest 4 ou 5.** `@effect/vitest@0.30.0` déclare `vitest: ^3.2.0` en peer ; une montée de major casse l'installation. **Ne pas passer à TypeScript 7** (portage Go, non validé avec `tsdown` et les project references de ce dépôt).

---

## Écart assumé à la spec §8.2

La spec liste `contract`, `shared`, `bc-*` et `server`. Ce plan ajoute **`packages/test-utils`**, qui n'y figure pas. Raison : le client SQL pglite exigé par §8.10 doit être consommé par les `bc-*` *et* par `server`, donc il ne peut vivre dans aucun des deux ; et le mettre dans `shared` ferait de `@electric-sql/pglite` une dépendance de production de tous les contextes. C'est un package de test, pas une frontière métier — l'architecture de la spec est inchangée.

---

## Arborescence produite par ce jalon

```
etabli/
├── .env.example                        variables attendues, sans secret
├── .gitignore · .npmrc · .nvmrc
├── .oxlintrc.json · .oxfmtrc.json · .oxfmtignore
├── lefthook.yml
├── package.json                        scripts racine, dont `check`
├── pnpm-workspace.yaml
├── tsconfig.json                       project references
├── tsconfig.base.json                  options communes
├── tsconfig.pkg-base.json              packages compilés (composite)
├── tsconfig.app-base.json              applications (noEmit)
├── vitest.config.ts                    projets vitest du workspace
├── README.md
├── packages/
│   ├── contract/                       types purs + table de routes, ZÉRO dépendance
│   │   └── src/{index,routes,build-path,health}.ts
│   ├── shared/                         primitives Effect partagées
│   │   └── src/{schema,errors,auth-context,time,id,type-level,migrations}/
│   │       + src/infrastructure/migrations/0001_create_domain_events.sql
│   ├── test-utils/                     client SQL pglite + exécuteur de migrations
│   └── server/                         HttpApi, Layers, migrator, points d'entrée
│       ├── src/{config,http,layers,db}/ · src/main.ts
│       └── api/index.ts                point d'entrée Vercel
└── apps/web/
    ├── next.config.ts · postcss.config.mjs · playwright.config.ts
    └── src/
        ├── app/(marketing)/page.tsx · layout.tsx · globals.css · robots.ts · sitemap.ts
        ├── architecture/import-graph.ts + tests de frontières
        ├── features/marketing/home/home.page.tsx + home.test.e2e.ts
        ├── proxy.ts
        ├── testing/setup.ts
        └── ui/{Button,StatusBadge,Surface}.tsx
```

---

## Tâche 1 : Racine du monorepo et outillage qualité

**Files:**
- Create: `.gitignore`, `.npmrc`, `.nvmrc`, `.env.example`
- Create: `package.json`, `pnpm-workspace.yaml`
- Create: `tsconfig.json`, `tsconfig.base.json`, `tsconfig.pkg-base.json`, `tsconfig.app-base.json`
- Create: `.oxlintrc.json`, `.oxfmtrc.json`, `.oxfmtignore`
- Create: `vitest.config.ts`, `lefthook.yml`

**Interfaces:**
- Consumes: rien.
- Produces: les scripts racine `pnpm check`, `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` ; les trois tsconfig de base dont tous les packages héritent (`tsconfig.pkg-base.json` pour les packages compilés, `tsconfig.app-base.json` pour `apps/web`).

- [ ] **Step 1 : initialiser le dépôt et les fichiers d'environnement**

```bash
cd etabli
git init
```

`.gitignore` :

```gitignore
node_modules/
dist/
.next/
.turbo/
coverage/
*.tsbuildinfo
.DS_Store
test-results/
playwright-report/
.auth/
.env
.env.*
!.env.example
```

`.npmrc` :

```ini
auto-install-peers=true
strict-peer-dependencies=false
save-workspace-protocol=rolling
```

`.nvmrc` :

```
24
```

`.env.example` :

```dotenv
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.eu-central-1.aws.neon.tech/etabli?sslmode=require
JWT_SECRET=change-me-32-chars-minimum-for-hs256
PORT=3001
COOKIE_SECURE=false
COOKIE_DOMAIN=localhost
API_URL=http://localhost:3001
```

- [ ] **Step 2 : déclarer le workspace**

`pnpm-workspace.yaml` :

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

`package.json` :

```json
{
  "name": "etabli",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "format": "oxfmt --ignore-path .oxfmtignore .",
    "format:check": "oxfmt --ignore-path .oxfmtignore --check .",
    "typecheck": "tsc --build --verbose",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest",
    "check": "pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "concurrently": "^9.2.0",
    "lefthook": "^2.1.12",
    "oxfmt": "^0.67.0",
    "oxlint": "^1.82.0",
    "tsx": "^4.22.0",
    "typescript": "^5.9.3",
    "vitest": "^3.2.7"
  },
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=10.0.0"
  },
  "packageManager": "pnpm@10.32.1"
}
```

Le script `check` ne contient volontairement pas encore `build:packages` ni le typecheck de `apps/web` : il n'y a aucun package à construire. Les tâches 2 et 6 l'étendent.

- [ ] **Step 3 : poser les tsconfig**

`tsconfig.base.json` :

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "strict": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "useUnknownInCatchVariables": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true,
    "useDefineForClassFields": true
  },
  "exclude": ["node_modules", "dist", ".next"]
}
```

`tsconfig.pkg-base.json` :

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "${configDir}/dist",
    "rootDir": "${configDir}/src",
    "tsBuildInfoFile": "${configDir}/.tsbuildinfo"
  },
  "exclude": ["${configDir}/dist", "${configDir}/node_modules"]
}
```

`tsconfig.app-base.json` :

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "declaration": false,
    "declarationMap": false,
    "composite": false,
    "tsBuildInfoFile": "${configDir}/.tsbuildinfo"
  }
}
```

`tsconfig.json` :

```json
{
  "files": [],
  "references": []
}
```

- [ ] **Step 4 : configurer oxlint et oxfmt**

`.oxlintrc.json` :

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "unicorn", "react", "jsx-a11y", "import"],
  "categories": {
    "correctness": "error",
    "suspicious": "warn",
    "perf": "warn"
  },
  "rules": {
    "unicorn/filename-case": [
      "error",
      {
        "cases": { "kebabCase": true, "pascalCase": false },
        "ignore": ["\\.tsx$"]
      }
    ],
    "no-unused-vars": ["warn", { "varsIgnorePattern": "^(I[A-Z]|.*Port)" }],
    "no-underscore-dangle": "off",
    "import/no-unassigned-import": "off",
    "typescript/no-explicit-any": "error",
    "typescript/no-unsafe-argument": "error",
    "typescript/no-unsafe-assignment": "error",
    "typescript/no-unsafe-call": "error",
    "typescript/no-unsafe-member-access": "error",
    "typescript/no-unsafe-return": "error",
    "no-restricted-syntax": [
      "error",
      { "selector": "TSEnumDeclaration", "message": "Use a const object with 'as const' instead of an enum." }
    ]
  },
  "ignorePatterns": ["dist/", "node_modules/", ".next/", "*.json", "*.md", "*.css"],
  "overrides": [
    {
      "files": ["*.port.ts"],
      "rules": { "no-unused-vars": "off", "typescript/no-unused-vars": "off" }
    }
  ]
}
```

Les règles de frontières d'import (`ui/components` ↛ `core/store`, `routes` ↛ `repository`…) ne sont **pas** mises ici : `import/no-restricted-paths` n'est pas garanti supporté par oxlint, et un nom de règle inconnu rendrait la configuration fragile. Le repli prévu par les règles globales — un test qui parse le graphe d'imports — est la tâche 9.

`.oxfmtrc.json` :

```json
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "semi": false,
  "tabWidth": 2,
  "bracketSpacing": true,
  "singleQuote": true,
  "printWidth": 120,
  "trailingComma": "es5",
  "sortImports": {},
  "sortTailwindcss": { "functions": ["clsx", "cn", "cva"] },
  "sortPackageJson": true,
  "ignorePatterns": []
}
```

`.oxfmtignore` :

```
node_modules/
dist/
.next/
coverage/
pnpm-lock.yaml
*.tsbuildinfo
docs/
```

`docs/` est exclu parce que les specs et les plans contiennent des blocs de code que le formateur réécrirait.

- [ ] **Step 5 : configurer vitest et lefthook**

`vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {},
})
```

La clé `projects` est ajoutée en tâche 2, quand le premier package existe — un glob qui ne résout rien fait échouer vitest.

`lefthook.yml` :

```yaml
pre-commit:
  parallel: true
  commands:
    format:
      run: pnpm run format:check
    lint:
      run: pnpm run lint

pre-push:
  parallel: false
  commands:
    check:
      run: pnpm run check
```

- [ ] **Step 6 : installer et vérifier que la porte est verte sur un dépôt vide**

```bash
pnpm install
pnpm run check
```

Attendu : `format:check` OK, `lint` OK (aucun fichier à lint), `tsc --build` OK (aucune référence), `vitest run --passWithNoTests` OK.

Si `oxlint` sort en erreur « no files found », c'est acceptable ici uniquement si le code de sortie est 0 ; sinon ajouter un fichier `.gitkeep` sous `packages/` et relancer.

- [ ] **Step 7 : commit**

```bash
git add -A
git commit -m "chore: bootstrap pnpm monorepo with oxlint, oxfmt, vitest and lefthook"
```

---

## Tâche 2 : `packages/contract` — types purs et table de routes

Le package que le front et la future application mobile importent. **Aucune dépendance, aucun code exécuté au chargement** (§8.5). La table de routes de §10 y est déclarée en entier dès maintenant : ce sont des chaînes, elles sont validées par la spec, et les avoir toutes évite d'y revenir à chaque jalon.

**Files:**
- Create: `packages/contract/package.json`, `packages/contract/tsconfig.json`, `packages/contract/tsdown.config.ts`, `packages/contract/vitest.config.ts`
- Create: `packages/contract/src/index.ts`, `packages/contract/src/routes.ts`, `packages/contract/src/build-path.ts`, `packages/contract/src/health.ts`
- Test: `packages/contract/src/build-path.test.ts`, `packages/contract/src/routes.test.ts`, `packages/contract/src/zero-dependencies.test.ts`
- Modify: `package.json` (scripts `build`, `build:packages`, `check`), `tsconfig.json` (références), `vitest.config.ts` (projets)

**Interfaces:**
- Consumes: les tsconfig de base de la tâche 1.
- Produces:
  - `routes` — objet `as const` en lecture seule, arborescent, feuilles = chemins d'API.
  - `buildPath(template: string, params?: Record<string, string>): string` — substitue les segments `:param`, encode les valeurs, jette si un paramètre manque.
  - `type HealthResponse = { ok: boolean; version: string; uptimeMs: number }` — consommé par `packages/server` en tâche 5 pour l'assertion de parité de contrat.

- [ ] **Step 1 : écrire le test rouge de `buildPath`**

`packages/contract/src/build-path.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { buildPath } from './build-path'

describe('buildPath', () => {
  it('returns a literal path untouched', () => {
    expect(buildPath('/ateliers')).toBe('/ateliers')
  })

  it('substitutes a named segment', () => {
    expect(buildPath('/bookings/:id/cancel', { id: 'abc' })).toBe('/bookings/abc/cancel')
  })

  it('substitutes several named segments', () => {
    expect(buildPath('/:a/:b', { a: 'one', b: 'two' })).toBe('/one/two')
  })

  it('encodes the substituted value', () => {
    expect(buildPath('/ateliers/:slug', { slug: 'atelier de la butte' })).toBe('/ateliers/atelier%20de%20la%20butte')
  })

  it('throws when a parameter is missing', () => {
    expect(() => buildPath('/bookings/:id', {})).toThrow('Missing path parameter ":id"')
  })
})
```

- [ ] **Step 2 : créer le package et lancer le test pour le voir échouer**

`packages/contract/package.json` :

```json
{
  "name": "@etabli/contract",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.mts",
      "import": "./dist/index.mjs"
    }
  },
  "scripts": {
    "build": "tsdown",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "tsdown": "^0.23.0",
    "typescript": "^5.9.3",
    "vitest": "^3.2.7"
  }
}
```

Il n'y a **pas** de clé `dependencies`, et il ne doit jamais y en avoir.

`packages/contract/tsconfig.json` :

```json
{
  "extends": "../../tsconfig.pkg-base.json",
  "include": ["src/**/*"]
}
```

`packages/contract/tsdown.config.ts` :

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  clean: true,
})
```

`packages/contract/vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@etabli/contract',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
```

```bash
pnpm install
pnpm --filter @etabli/contract exec vitest run
```

Attendu : ÉCHEC, `Failed to resolve import "./build-path"`.

- [ ] **Step 3 : implémenter `buildPath`**

`packages/contract/src/build-path.ts` :

```ts
export const buildPath = (template: string, params: Readonly<Record<string, string>> = {}): string =>
  template.replaceAll(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = params[key]
    if (value === undefined) throw new Error(`Missing path parameter ":${key}" in "${template}"`)
    return encodeURIComponent(value)
  })
```

- [ ] **Step 4 : relancer le test**

```bash
pnpm --filter @etabli/contract exec vitest run src/build-path.test.ts
```

Attendu : 5 tests verts.

- [ ] **Step 5 : écrire le test rouge de la table de routes**

`packages/contract/src/routes.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { buildPath } from './build-path'
import { flattenRoutes, routes } from './routes'

describe('routes', () => {
  it('exposes every documented namespace', () => {
    expect(Object.keys(routes).toSorted()).toEqual(
      ['admin', 'ateliers', 'auth', 'bookings', 'certifications', 'health', 'machines', 'manage', 'me', 'onboarding'].toSorted()
    )
  })

  it('declares every path as an absolute path', () => {
    const offenders = flattenRoutes(routes).filter(([, path]) => !path.startsWith('/'))
    expect(offenders).toEqual([])
  })

  it('uses only well-formed named segments', () => {
    const offenders = flattenRoutes(routes).filter(([, path]) => /:(?![A-Za-z])/.test(path))
    expect(offenders).toEqual([])
  })

  it('resolves the parameterised booking check-in route', () => {
    expect(buildPath(routes.bookings.checkIn, { id: 'b-1' })).toBe('/bookings/b-1/check-in')
  })

  it('keeps the atelier public page addressable by slug', () => {
    expect(buildPath(routes.ateliers.getBySlug, { slug: 'montreuil' })).toBe('/ateliers/montreuil')
  })
})
```

- [ ] **Step 6 : lancer le test pour le voir échouer**

```bash
pnpm --filter @etabli/contract exec vitest run src/routes.test.ts
```

Attendu : ÉCHEC, `Failed to resolve import "./routes"`.

- [ ] **Step 7 : implémenter la table de routes**

`packages/contract/src/routes.ts` :

```ts
type RouteNode = string | { readonly [key: string]: RouteNode }

export const routes = {
  health: '/health',
  ateliers: {
    list: '/ateliers',
    getBySlug: '/ateliers/:slug',
  },
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    me: '/auth/me',
    password: '/auth/password',
  },
  onboarding: {
    complete: '/onboarding/complete',
  },
  me: {
    preferences: '/me/preferences',
  },
  machines: {
    list: '/machines',
    getById: '/machines/:id',
    availability: '/machines/:id/availability',
  },
  bookings: {
    create: '/bookings',
    list: '/bookings',
    getById: '/bookings/:id',
    cancel: '/bookings/:id/cancel',
    checkIn: '/bookings/:id/check-in',
  },
  certifications: {
    request: '/certifications',
    mine: '/certifications/mine',
  },
  manage: {
    certifications: '/manage/certifications',
    grantCertification: '/manage/certifications/:id/grant',
    revokeCertification: '/manage/certifications/:id/revoke',
    machines: '/manage/machines',
    machine: '/manage/machines/:id',
    bookings: '/manage/bookings',
    noShow: '/manage/bookings/:id/no-show',
    stats: '/manage/stats',
  },
  admin: {
    ateliers: '/admin/ateliers',
    atelier: '/admin/ateliers/:id',
    users: '/admin/users',
    userRole: '/admin/users/:id/role',
    stats: '/admin/stats',
  },
} as const satisfies RouteNode

export const flattenRoutes = (node: RouteNode, prefix = ''): ReadonlyArray<readonly [string, string]> => {
  if (typeof node === 'string') return [[prefix, node]]
  return Object.entries(node).flatMap(([key, child]) => flattenRoutes(child, prefix === '' ? key : `${prefix}.${key}`))
}
```

- [ ] **Step 8 : relancer le test**

```bash
pnpm --filter @etabli/contract exec vitest run src/routes.test.ts
```

Attendu : 5 tests verts.

- [ ] **Step 9 : écrire le test rouge de la contrainte « zéro dépendance »**

`packages/contract/src/zero-dependencies.test.ts` :

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const manifest = JSON.parse(readFileSync(join(import.meta.dirname, '../package.json'), 'utf8')) as Record<
  string,
  unknown
>

describe('@etabli/contract', () => {
  it('declares no runtime dependency', () => {
    expect(manifest['dependencies']).toBeUndefined()
  })

  it('declares no peer dependency', () => {
    expect(manifest['peerDependencies']).toBeUndefined()
  })
})
```

Ce test passe immédiatement, et c'est voulu : il n'existe pas pour être rouge aujourd'hui mais pour devenir rouge le jour où quelqu'un ajoutera Effect ou zod au contrat. Le vérifier rouge une fois demande d'ajouter temporairement `"dependencies": { "effect": "^3.22.2" }` au manifeste.

- [ ] **Step 10 : le voir échouer, puis passer**

```bash
cd packages/contract && npm pkg set dependencies.effect="^3.22.2" && cd ../..
pnpm --filter @etabli/contract exec vitest run src/zero-dependencies.test.ts
```

Attendu : ÉCHEC sur `expect(manifest['dependencies']).toBeUndefined()`.

```bash
cd packages/contract && npm pkg delete dependencies && cd ../..
pnpm --filter @etabli/contract exec vitest run src/zero-dependencies.test.ts
```

Attendu : 2 tests verts.

- [ ] **Step 11 : exposer le type `HealthResponse` et l'index**

`packages/contract/src/health.ts` :

```ts
export type HealthResponse = {
  readonly ok: boolean
  readonly version: string
  readonly uptimeMs: number
}
```

`packages/contract/src/index.ts` :

```ts
export * from './build-path'
export * from './health'
export * from './routes'
```

- [ ] **Step 12 : brancher le package sur la racine**

`tsconfig.json` :

```json
{
  "files": [],
  "references": [{ "path": "./packages/contract" }]
}
```

`vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: ['packages/*'],
  },
})
```

`package.json`, ajouter deux scripts et étendre `check` :

```json
{
  "scripts": {
    "build": "pnpm -r --if-present run build",
    "build:packages": "pnpm --filter \"./packages/**\" --if-present run build",
    "check": "pnpm run build:packages && pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test"
  }
}
```

`build:packages` précède le typecheck parce que les autres packages résoudront les types de `@etabli/contract` via `exports` → `dist/index.d.mts`, produit par `tsdown` et non par `tsc`.

- [ ] **Step 13 : vérifier la porte complète**

```bash
pnpm run check
```

Attendu : build, format, lint, typecheck et 12 tests verts.

- [ ] **Step 14 : commit**

```bash
git add -A
git commit -m "feat(contract): add dependency-free route table and path builder"
```

---

## Tâche 3 : `packages/shared` — primitives Effect partagées

Ce que tous les bounded contexts consommeront : identifiants brandés, erreurs techniques, `AuthContext` et ses prédicats d'autorisation, `Clock`, `IdGenerator`, l'assertion de parité de types, et le marcheur de migrations. La table `domain_events` de §9 y est posée, parce que c'est la seule table du modèle qui n'appartient à aucun contexte.

**Files:**
- Create: `packages/shared/package.json`, `tsconfig.json`, `tsdown.config.ts`, `vitest.config.ts`
- Create: `packages/shared/src/schema/branded-ids.ts`, `packages/shared/src/schema/index.ts`
- Create: `packages/shared/src/errors/repo-error.ts`, `packages/shared/src/errors/forbidden.error.ts`, `packages/shared/src/errors/index.ts`
- Create: `packages/shared/src/auth-context/roles.constant.ts`, `auth-context.ts`, `permissions.ts`, `index.ts`
- Create: `packages/shared/src/time/clock.ts`, `packages/shared/src/time/index.ts`
- Create: `packages/shared/src/id/id-generator.ts`, `packages/shared/src/id/index.ts`
- Create: `packages/shared/src/type-level/assert-equals.ts`, `packages/shared/src/type-level/index.ts`
- Create: `packages/shared/src/migrations/find-migrations.ts`, `packages/shared/src/migrations/index.ts`
- Create: `packages/shared/src/infrastructure/migrations/0001_create_domain_events.sql`
- Test: `branded-ids.test.ts`, `permissions.test.ts`, `clock.test.ts`, `id-generator.test.ts`, `find-migrations.test.ts`
- Modify: `tsconfig.json` racine (référence)

**Interfaces:**
- Consumes: rien de `@etabli/contract` (shared est en amont du contrat).
- Produces:
  - `UserId`, `AtelierId`, `MachineId`, `CertificationId`, `BookingId` — `Schema.UUID.pipe(Schema.brand(...))`, type et valeur homonymes.
  - `RepoError` (`Schema.TaggedError`, champs `cause: unknown`, `operation: string`), `ForbiddenError` (champ `reason: string`).
  - `PlatformRole` / `MembershipRole` — objets `as const` + types dérivés.
  - `AuthContext` — `Context.Tag<'@etabli/AuthContext'>` de `AuthContextService { userId, platformRole, memberships }`.
  - `isPlatformAdmin(auth)`, `isMemberOf(auth, atelierId)`, `isFabmanagerOf(auth, atelierId)` — prédicats purs, sans Effect.
  - `Clock` (Tag) + `ClockSystemLive` ; `IdGenerator` (Tag) + `IdGeneratorCryptoLive`.
  - `AssertEquals<A, B>` — `true` si A et B sont identiques, sinon un type non assignable.
  - `findMigrations(startPath?)` — `ReadonlyArray<{ id: number; name: string; filename: string; path: string }>`, trié par préfixe, jette sur doublon.

- [ ] **Step 1 : créer le squelette du package**

`packages/shared/package.json` :

```json
{
  "name": "@etabli/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.mts", "import": "./dist/index.mjs" },
    "./schema": { "types": "./dist/schema/index.d.mts", "import": "./dist/schema/index.mjs" },
    "./errors": { "types": "./dist/errors/index.d.mts", "import": "./dist/errors/index.mjs" },
    "./auth-context": { "types": "./dist/auth-context/index.d.mts", "import": "./dist/auth-context/index.mjs" },
    "./time": { "types": "./dist/time/index.d.mts", "import": "./dist/time/index.mjs" },
    "./id": { "types": "./dist/id/index.d.mts", "import": "./dist/id/index.mjs" },
    "./type-level": { "types": "./dist/type-level/index.d.mts", "import": "./dist/type-level/index.mjs" },
    "./migrations": { "types": "./dist/migrations/index.d.mts", "import": "./dist/migrations/index.mjs" }
  },
  "scripts": {
    "build": "tsdown",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "effect": "^3.22.2"
  },
  "devDependencies": {
    "@effect/vitest": "^0.30.0",
    "@types/node": "^22.10.2",
    "tsdown": "^0.23.0",
    "typescript": "^5.9.3",
    "vitest": "^3.2.7"
  }
}
```

`packages/shared/tsconfig.json` :

```json
{
  "extends": "../../tsconfig.pkg-base.json",
  "include": ["src/**/*"]
}
```

`packages/shared/tsdown.config.ts` :

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/schema/index.ts',
    'src/errors/index.ts',
    'src/auth-context/index.ts',
    'src/time/index.ts',
    'src/id/index.ts',
    'src/type-level/index.ts',
    'src/migrations/index.ts',
  ],
  format: 'esm',
  dts: true,
  clean: true,
  deps: { neverBundle: ['effect'] },
})
```

`packages/shared/vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@etabli/shared',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
```

```bash
pnpm install
```

- [ ] **Step 2 : écrire le test rouge des identifiants brandés**

`packages/shared/src/schema/branded-ids.test.ts` :

```ts
import * as Either from 'effect/Either'
import * as Schema from 'effect/Schema'
import { describe, expect, it } from 'vitest'

import { AtelierId, BookingId, CertificationId, MachineId, UserId } from './branded-ids'

const VALID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'

describe('branded ids', () => {
  it('decodes a valid uuid', () => {
    expect(Either.isRight(Schema.decodeUnknownEither(UserId)(VALID))).toBe(true)
  })

  it('rejects a non-uuid', () => {
    expect(Either.isRight(Schema.decodeUnknownEither(UserId)('not-a-uuid'))).toBe(false)
  })

  it('rejects a number', () => {
    expect(Either.isRight(Schema.decodeUnknownEither(AtelierId)(42))).toBe(false)
  })

  it('exposes one brand per aggregate', () => {
    const decoders = [UserId, AtelierId, MachineId, CertificationId, BookingId]
    expect(decoders.every((schema) => Either.isRight(Schema.decodeUnknownEither(schema)(VALID)))).toBe(true)
  })
})
```

- [ ] **Step 3 : lancer le test pour le voir échouer**

```bash
pnpm --filter @etabli/shared exec vitest run src/schema/branded-ids.test.ts
```

Attendu : ÉCHEC, `Failed to resolve import "./branded-ids"`.

- [ ] **Step 4 : implémenter les identifiants**

`packages/shared/src/schema/branded-ids.ts` :

```ts
import * as Schema from 'effect/Schema'

export const UserId = Schema.UUID.pipe(Schema.brand('UserId'))
export type UserId = Schema.Schema.Type<typeof UserId>

export const AtelierId = Schema.UUID.pipe(Schema.brand('AtelierId'))
export type AtelierId = Schema.Schema.Type<typeof AtelierId>

export const MachineId = Schema.UUID.pipe(Schema.brand('MachineId'))
export type MachineId = Schema.Schema.Type<typeof MachineId>

export const CertificationId = Schema.UUID.pipe(Schema.brand('CertificationId'))
export type CertificationId = Schema.Schema.Type<typeof CertificationId>

export const BookingId = Schema.UUID.pipe(Schema.brand('BookingId'))
export type BookingId = Schema.Schema.Type<typeof BookingId>
```

`packages/shared/src/schema/index.ts` :

```ts
export * from './branded-ids'
```

- [ ] **Step 5 : relancer le test**

```bash
pnpm --filter @etabli/shared exec vitest run src/schema/branded-ids.test.ts
```

Attendu : 4 tests verts.

- [ ] **Step 6 : écrire le test rouge des prédicats d'autorisation**

C'est le fichier le plus important du package : §3 dit que le rôle `FABMANAGER` est porté par l'adhésion, pas par l'utilisateur, et §5 règle 4 en fait une erreur de refus.

`packages/shared/src/auth-context/permissions.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import type { AtelierId, UserId } from '../schema/branded-ids'
import type { AuthContextService } from './auth-context'
import { isFabmanagerOf, isMemberOf, isPlatformAdmin } from './permissions'
import { MembershipRole, PlatformRole } from './roles.constant'

const MONTREUIL = '3f2504e0-4f89-41d3-9a0c-0305e82c3301' as AtelierId
const LYON = '9c858901-8a57-4791-81fe-4c455b099bc9' as AtelierId

const auth = (over: Partial<AuthContextService> = {}): AuthContextService => ({
  userId: '11111111-1111-4111-8111-111111111111' as UserId,
  platformRole: PlatformRole.MEMBER,
  memberships: [],
  ...over,
})

describe('isPlatformAdmin', () => {
  it('is true for a platform admin', () => {
    expect(isPlatformAdmin(auth({ platformRole: PlatformRole.PLATFORM_ADMIN }))).toBe(true)
  })

  it('is false for a plain member', () => {
    expect(isPlatformAdmin(auth())).toBe(false)
  })
})

describe('isMemberOf', () => {
  it('is true for an atelier the user belongs to', () => {
    const context = auth({ memberships: [{ atelierId: MONTREUIL, role: MembershipRole.MEMBER }] })
    expect(isMemberOf(context, MONTREUIL)).toBe(true)
  })

  it('is false for another atelier', () => {
    const context = auth({ memberships: [{ atelierId: MONTREUIL, role: MembershipRole.MEMBER }] })
    expect(isMemberOf(context, LYON)).toBe(false)
  })

  it('is false for a platform admin with no membership', () => {
    expect(isMemberOf(auth({ platformRole: PlatformRole.PLATFORM_ADMIN }), MONTREUIL)).toBe(false)
  })
})

describe('isFabmanagerOf', () => {
  it('is true in the atelier where the membership carries the role', () => {
    const context = auth({ memberships: [{ atelierId: MONTREUIL, role: MembershipRole.FABMANAGER }] })
    expect(isFabmanagerOf(context, MONTREUIL)).toBe(true)
  })

  it('is false in another atelier of the same user', () => {
    const context = auth({
      memberships: [
        { atelierId: MONTREUIL, role: MembershipRole.FABMANAGER },
        { atelierId: LYON, role: MembershipRole.MEMBER },
      ],
    })
    expect(isFabmanagerOf(context, LYON)).toBe(false)
  })

  it('is false for a plain member of that atelier', () => {
    const context = auth({ memberships: [{ atelierId: MONTREUIL, role: MembershipRole.MEMBER }] })
    expect(isFabmanagerOf(context, MONTREUIL)).toBe(false)
  })

  it('is not granted by the platform role', () => {
    expect(isFabmanagerOf(auth({ platformRole: PlatformRole.PLATFORM_ADMIN }), MONTREUIL)).toBe(false)
  })
})
```

- [ ] **Step 7 : lancer le test pour le voir échouer**

```bash
pnpm --filter @etabli/shared exec vitest run src/auth-context/permissions.test.ts
```

Attendu : ÉCHEC sur la résolution de `./permissions`, `./roles.constant` et `./auth-context`.

- [ ] **Step 8 : implémenter rôles, contexte et prédicats**

`packages/shared/src/auth-context/roles.constant.ts` :

```ts
export const PlatformRole = {
  MEMBER: 'MEMBER',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
} as const
export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole]

export const MembershipRole = {
  MEMBER: 'MEMBER',
  FABMANAGER: 'FABMANAGER',
} as const
export type MembershipRole = (typeof MembershipRole)[keyof typeof MembershipRole]

export const MembershipStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus]
```

`packages/shared/src/auth-context/auth-context.ts` :

```ts
import * as Context from 'effect/Context'

import type { AtelierId, UserId } from '../schema/branded-ids'
import type { MembershipRole, PlatformRole } from './roles.constant'

export interface AuthMembership {
  readonly atelierId: AtelierId
  readonly role: MembershipRole
}

export interface AuthContextService {
  readonly userId: UserId
  readonly platformRole: PlatformRole
  readonly memberships: ReadonlyArray<AuthMembership>
}

export class AuthContext extends Context.Tag('@etabli/AuthContext')<AuthContext, AuthContextService>() {}
```

`packages/shared/src/auth-context/permissions.ts` :

```ts
import type { AtelierId } from '../schema/branded-ids'
import type { AuthContextService } from './auth-context'
import { MembershipRole, PlatformRole } from './roles.constant'

export const isPlatformAdmin = (auth: AuthContextService): boolean =>
  auth.platformRole === PlatformRole.PLATFORM_ADMIN

export const isMemberOf = (auth: AuthContextService, atelierId: AtelierId): boolean =>
  auth.memberships.some((membership) => membership.atelierId === atelierId)

export const isFabmanagerOf = (auth: AuthContextService, atelierId: AtelierId): boolean =>
  auth.memberships.some(
    (membership) => membership.atelierId === atelierId && membership.role === MembershipRole.FABMANAGER
  )
```

`packages/shared/src/auth-context/index.ts` :

```ts
export * from './auth-context'
export * from './permissions'
export * from './roles.constant'
```

- [ ] **Step 9 : relancer le test**

```bash
pnpm --filter @etabli/shared exec vitest run src/auth-context/permissions.test.ts
```

Attendu : 9 tests verts.

- [ ] **Step 10 : écrire les tests rouges de `Clock` et `IdGenerator`**

`packages/shared/src/time/clock.test.ts` :

```ts
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import { describe, expect, it } from 'vitest'

import { Clock, ClockSystemLive } from './clock'

describe('ClockSystemLive', () => {
  it('returns an instant close to the wall clock', async () => {
    const before = Date.now()
    const now = await Effect.runPromise(Effect.provide(Effect.flatMap(Clock, (clock) => clock.now), ClockSystemLive))
    const after = Date.now()
    const millis = DateTime.toEpochMillis(now)

    expect(millis).toBeGreaterThanOrEqual(before)
    expect(millis).toBeLessThanOrEqual(after)
  })
})
```

`packages/shared/src/id/id-generator.test.ts` :

```ts
import * as Effect from 'effect/Effect'
import { describe, expect, it } from 'vitest'

import { IdGenerator, IdGeneratorCryptoLive } from './id-generator'

const takeUuid = Effect.provide(
  Effect.flatMap(IdGenerator, (generator) => generator.uuid),
  IdGeneratorCryptoLive
)

describe('IdGeneratorCryptoLive', () => {
  it('produces a v4 uuid', async () => {
    const id = await Effect.runPromise(takeUuid)
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('produces distinct values', async () => {
    const [first, second] = await Effect.runPromise(Effect.all([takeUuid, takeUuid]))
    expect(first).not.toBe(second)
  })
})
```

- [ ] **Step 11 : les voir échouer, puis implémenter**

```bash
pnpm --filter @etabli/shared exec vitest run src/time src/id
```

Attendu : ÉCHEC sur la résolution des deux modules.

`packages/shared/src/time/clock.ts` :

```ts
import * as Context from 'effect/Context'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

export interface ClockService {
  readonly now: Effect.Effect<DateTime.Utc>
}

export class Clock extends Context.Tag('@etabli/Clock')<Clock, ClockService>() {}

export const ClockSystemLive = Layer.succeed(
  Clock,
  Clock.of({ now: Effect.sync(() => DateTime.unsafeNow()) })
)
```

`packages/shared/src/time/index.ts` :

```ts
export * from './clock'
```

`packages/shared/src/id/id-generator.ts` :

```ts
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

export interface IdGeneratorService {
  readonly uuid: Effect.Effect<string>
}

export class IdGenerator extends Context.Tag('@etabli/IdGenerator')<IdGenerator, IdGeneratorService>() {}

export const IdGeneratorCryptoLive = Layer.succeed(
  IdGenerator,
  IdGenerator.of({ uuid: Effect.sync(() => globalThis.crypto.randomUUID()) })
)
```

`packages/shared/src/id/index.ts` :

```ts
export * from './id-generator'
```

- [ ] **Step 12 : relancer**

```bash
pnpm --filter @etabli/shared exec vitest run src/time src/id
```

Attendu : 3 tests verts.

- [ ] **Step 13 : ajouter les erreurs et l'assertion de types (pas de test unitaire)**

`packages/shared/src/errors/repo-error.ts` :

```ts
import * as Schema from 'effect/Schema'

export class RepoError extends Schema.TaggedError<RepoError>()('RepoError', {
  cause: Schema.Unknown,
  operation: Schema.String,
}) {}
```

`packages/shared/src/errors/forbidden.error.ts` :

```ts
import * as Schema from 'effect/Schema'

export class ForbiddenError extends Schema.TaggedError<ForbiddenError>()('ForbiddenError', {
  reason: Schema.String,
}) {}
```

`packages/shared/src/errors/index.ts` :

```ts
export * from './forbidden.error'
export * from './repo-error'
```

`packages/shared/src/type-level/assert-equals.ts` :

```ts
export type AssertEquals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : { readonly error: 'types differ'; readonly expected: A; readonly received: B }
```

`packages/shared/src/type-level/index.ts` :

```ts
export * from './assert-equals'
```

Ces trois modules n'ont pas de test unitaire : `RepoError` et `ForbiddenError` n'ont aucun comportement à vérifier au-delà de ce que `tsc` prouve déjà, et `AssertEquals` est un type — sa preuve est la tâche 5, où une divergence entre le schéma Effect et le contrat fait échouer `tsc`.

- [ ] **Step 14 : écrire le test rouge du marcheur de migrations**

`packages/shared/src/migrations/find-migrations.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { findMigrations } from './find-migrations'

describe('findMigrations', () => {
  const files = findMigrations()

  it('finds the shared domain_events migration', () => {
    expect(files.map((file) => file.filename)).toContain('0001_create_domain_events.sql')
  })

  it('returns files sorted by numeric prefix', () => {
    const ids = files.map((file) => file.id)
    expect(ids).toEqual([...ids].toSorted((a, b) => a - b))
  })

  it('parses the id and the name out of the filename', () => {
    const first = files.find((file) => file.filename === '0001_create_domain_events.sql')
    expect(first?.id).toBe(1)
    expect(first?.name).toBe('create_domain_events')
  })

  it('returns absolute, readable paths', () => {
    expect(files.every((file) => file.path.endsWith(file.filename))).toBe(true)
  })
})
```

- [ ] **Step 15 : lancer le test pour le voir échouer**

```bash
pnpm --filter @etabli/shared exec vitest run src/migrations
```

Attendu : ÉCHEC, `Failed to resolve import "./find-migrations"`.

- [ ] **Step 16 : implémenter le marcheur et la première migration**

`packages/shared/src/infrastructure/migrations/0001_create_domain_events.sql` :

```sql
CREATE TABLE IF NOT EXISTS domain_events (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS domain_events_name_occurred_at_idx ON domain_events (name, occurred_at DESC);
```

`packages/shared/src/migrations/find-migrations.ts` :

```ts
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const MIGRATIONS_SUBPATH = 'src/infrastructure/migrations'
const FILENAME = /^(\d{4})_([^.]+)\.sql$/

export interface MigrationFile {
  readonly id: number
  readonly name: string
  readonly filename: string
  readonly path: string
}

const findWorkspaceRoot = (start: string): string => {
  let dir = start
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir
    const parent = dirname(dir)
    if (parent === dir) throw new Error(`Cannot find workspace root from ${start} (no pnpm-workspace.yaml)`)
    dir = parent
  }
}

const ownsMigrations = (pkg: string): boolean => pkg === 'shared' || pkg.startsWith('bc-')

export const findMigrations = (startPath?: string): ReadonlyArray<MigrationFile> => {
  const start = startPath ?? dirname(fileURLToPath(import.meta.url))
  const packagesDir = join(findWorkspaceRoot(start), 'packages')
  const files: Array<MigrationFile> = []
  const seen = new Map<number, string>()

  for (const pkg of readdirSync(packagesDir).toSorted()) {
    if (!ownsMigrations(pkg)) continue
    const dir = join(packagesDir, pkg, MIGRATIONS_SUBPATH)
    if (!existsSync(dir)) continue

    for (const filename of readdirSync(dir).toSorted()) {
      const match = FILENAME.exec(filename)
      if (!match) continue
      const id = Number(match[1])
      const source = `${pkg}/${filename}`
      const previous = seen.get(id)
      if (previous !== undefined) throw new Error(`Duplicate migration prefix ${match[1]}: ${previous} and ${source}`)
      seen.set(id, source)
      files.push({ id, name: match[2] ?? '', filename, path: join(dir, filename) })
    }
  }

  return files.toSorted((a, b) => a.id - b.id)
}
```

`packages/shared/src/migrations/index.ts` :

```ts
export * from './find-migrations'
```

Le préfixe à quatre chiffres porte l'ordre **global**, tous packages confondus — c'est pour cela qu'un doublon est une erreur dure et non un tri arbitraire.

- [ ] **Step 17 : relancer le test**

```bash
pnpm --filter @etabli/shared exec vitest run src/migrations
```

Attendu : 4 tests verts.

- [ ] **Step 18 : compléter l'index du package et le brancher sur la racine**

`packages/shared/src/index.ts` :

```ts
export * from './auth-context'
export * from './errors'
export * from './id'
export * from './migrations'
export * from './schema'
export * from './time'
export * from './type-level'
```

`tsconfig.json` racine :

```json
{
  "files": [],
  "references": [{ "path": "./packages/contract" }, { "path": "./packages/shared" }]
}
```

- [ ] **Step 19 : vérifier la porte**

```bash
pnpm run check
```

Attendu : tout vert, 32 tests.

- [ ] **Step 20 : commit**

```bash
git add -A
git commit -m "feat(shared): add branded ids, auth context, clock, id generator and migration walker"
```

---

## Tâche 4 : `packages/test-utils` — client SQL pglite

Sans ce package, aucun repository ne sera testable au jalon 1. `@effect/sql-pg` parle à un vrai Postgres ; pglite est un Postgres WASM en mémoire, qui n'a pas de driver `@effect/sql` officiel — il faut donc implémenter la `Connection` et le compilateur de `Statement`.

**Files:**
- Create: `packages/test-utils/package.json`, `tsconfig.json`, `tsdown.config.ts`, `vitest.config.ts`
- Create: `packages/test-utils/src/pglite-sql-client.layer.ts`, `packages/test-utils/src/run-migrations.ts`, `packages/test-utils/src/index.ts`
- Create: `packages/test-utils/test-fixtures/0001_create_widgets.sql`
- Test: `packages/test-utils/src/pglite-sql-client.layer.test.ts`
- Modify: `tsconfig.json` racine

**Interfaces:**
- Consumes: `findMigrations` de `@etabli/shared/migrations`.
- Produces:
  - `PgLiteSqlClientLayer(options?: { migrationsDir?: string; withAllMigrations?: boolean }): Layer.Layer<SqlClient.SqlClient, SqlError>` — instance pglite éphémère, fermée à la sortie du scope.
  - `runMigrationsFromDir(dir: string)` et `runAllMigrations()` — effets qui exécutent le SQL, instruction par instruction.

- [ ] **Step 1 : écrire le test rouge**

`packages/test-utils/src/pglite-sql-client.layer.test.ts` :

```ts
import { SqlClient } from '@effect/sql'
import * as Effect from 'effect/Effect'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { PgLiteSqlClientLayer } from './pglite-sql-client.layer'

const FIXTURES = join(import.meta.dirname, '../test-fixtures')

describe('PgLiteSqlClientLayer', () => {
  it('runs a query against an in-memory postgres', async () => {
    const program = Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      return yield* sql<{ answer: number }>`SELECT 42 AS answer`
    })

    const rows = await Effect.runPromise(Effect.scoped(Effect.provide(program, PgLiteSqlClientLayer())))
    expect(rows[0]?.answer).toBe(42)
  })

  it('applies the migrations of a directory before handing the client over', async () => {
    const program = Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      yield* sql`INSERT INTO widgets ${sql.insert({ id: 1, label: 'laser' })}`
      return yield* sql<{ label: string }>`SELECT label FROM widgets`
    })

    const rows = await Effect.runPromise(
      Effect.scoped(Effect.provide(program, PgLiteSqlClientLayer({ migrationsDir: FIXTURES })))
    )
    expect(rows.map((row) => row.label)).toEqual(['laser'])
  })

  it('applies every workspace migration when asked', async () => {
    const program = Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      return yield* sql<{ table_name: string }>`
        SELECT table_name FROM information_schema.tables WHERE table_name = 'domain_events'
      `
    })

    const rows = await Effect.runPromise(
      Effect.scoped(Effect.provide(program, PgLiteSqlClientLayer({ withAllMigrations: true })))
    )
    expect(rows).toHaveLength(1)
  })

  it('gives each layer instance its own isolated database', async () => {
    const insert = Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      yield* sql`INSERT INTO widgets ${sql.insert({ id: 1, label: 'cnc' })}`
    })
    const count = Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      return yield* sql<{ total: string }>`SELECT count(*)::text AS total FROM widgets`
    })

    await Effect.runPromise(
      Effect.scoped(Effect.provide(insert, PgLiteSqlClientLayer({ migrationsDir: FIXTURES })))
    )
    const rows = await Effect.runPromise(
      Effect.scoped(Effect.provide(count, PgLiteSqlClientLayer({ migrationsDir: FIXTURES })))
    )

    expect(rows[0]?.total).toBe('0')
  })
})
```

`packages/test-utils/test-fixtures/0001_create_widgets.sql` :

```sql
CREATE TABLE widgets (
  id integer PRIMARY KEY,
  label text NOT NULL
);
```

- [ ] **Step 2 : créer le package et lancer le test pour le voir échouer**

`packages/test-utils/package.json` :

```json
{
  "name": "@etabli/test-utils",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": { "types": "./dist/index.d.mts", "import": "./dist/index.mjs" }
  },
  "scripts": {
    "build": "tsdown",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@effect/experimental": "^0.61.1",
    "@effect/sql": "^0.52.1",
    "@electric-sql/pglite": "^0.5.8",
    "@etabli/shared": "workspace:*",
    "effect": "^3.22.2"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "tsdown": "^0.23.0",
    "typescript": "^5.9.3",
    "vitest": "^3.2.7"
  }
}
```

`packages/test-utils/tsconfig.json` :

```json
{
  "extends": "../../tsconfig.pkg-base.json",
  "include": ["src/**/*"],
  "references": [{ "path": "../shared" }]
}
```

`packages/test-utils/tsdown.config.ts` :

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  deps: { neverBundle: ['@etabli/shared', 'effect', '@effect/sql', '@effect/experimental', '@electric-sql/pglite'] },
})
```

`packages/test-utils/vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@etabli/test-utils',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
  },
})
```

Le `testTimeout` est relevé : le premier démarrage de pglite compile le WASM.

```bash
pnpm install
pnpm --filter @etabli/test-utils exec vitest run
```

Attendu : ÉCHEC sur la résolution de `./pglite-sql-client.layer`.

- [ ] **Step 3 : implémenter l'exécuteur de migrations**

`packages/test-utils/src/run-migrations.ts` :

```ts
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { SqlClient } from '@effect/sql'
import { findMigrations } from '@etabli/shared/migrations'
import * as Effect from 'effect/Effect'

const splitStatements = (body: string): ReadonlyArray<string> =>
  body
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)

const runFile = (path: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    for (const statement of splitStatements(readFileSync(path, 'utf8'))) {
      yield* sql.unsafe(statement)
    }
  })

export const runMigrationsFromDir = (dir: string) =>
  Effect.gen(function* () {
    for (const filename of readdirSync(dir).filter((file) => file.endsWith('.sql')).toSorted()) {
      yield* runFile(join(dir, filename))
    }
  })

export const runAllMigrations = () =>
  Effect.gen(function* () {
    for (const migration of findMigrations()) {
      yield* runFile(migration.path)
    }
  })
```

- [ ] **Step 4 : implémenter le client pglite**

`packages/test-utils/src/pglite-sql-client.layer.ts` :

```ts
import * as Reactivity from '@effect/experimental/Reactivity'
import { SqlClient } from '@effect/sql'
import type { Connection } from '@effect/sql/SqlConnection'
import { SqlError } from '@effect/sql/SqlError'
import * as Statement from '@effect/sql/Statement'
import { PGlite } from '@electric-sql/pglite'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'

import { runAllMigrations, runMigrationsFromDir } from './run-migrations'

export interface PgLiteSqlClientLayerOptions {
  readonly migrationsDir?: string
  readonly withAllMigrations?: boolean
}

const makeCompiler = (): Statement.Compiler =>
  Statement.makeCompiler({
    dialect: 'pg',
    placeholder: (index) => `$${index}`,
    onIdentifier: Statement.defaultEscape('"'),
    onRecordUpdate: (placeholders, valueAlias, valueColumns, values, returning) => [
      `(values ${placeholders}) AS ${valueAlias}${valueColumns}${returning ? ` RETURNING ${returning[0]}` : ''}`,
      returning ? values.flat().concat(returning[1]) : values.flat(),
    ],
    onCustom: () => ['', []],
  })

class PgliteConnection implements Connection {
  constructor(private readonly pg: PGlite) {}

  private run(sql: string, params: ReadonlyArray<unknown>) {
    return Effect.tryPromise({
      try: () => this.pg.query<Record<string, unknown>>(sql, params as Array<unknown>),
      catch: (cause) => new SqlError({ cause, message: 'PgliteConnection: query failed' }),
    }).pipe(Effect.map((result) => result.rows))
  }

  execute(
    sql: string,
    params: ReadonlyArray<unknown>,
    transformRows: (<A extends object>(rows: ReadonlyArray<A>) => ReadonlyArray<A>) | undefined
  ) {
    return transformRows ? Effect.map(this.run(sql, params), transformRows) : this.run(sql, params)
  }

  executeRaw(sql: string, params: ReadonlyArray<unknown>) {
    return Effect.tryPromise({
      try: () => this.pg.query<Record<string, unknown>>(sql, params as Array<unknown>),
      catch: (cause) => new SqlError({ cause, message: 'PgliteConnection: executeRaw failed' }),
    })
  }

  executeValues(sql: string, params: ReadonlyArray<unknown>) {
    return Effect.tryPromise({
      try: () => this.pg.query<Record<string, unknown>>(sql, params as Array<unknown>, { rowMode: 'array' }),
      catch: (cause) => new SqlError({ cause, message: 'PgliteConnection: executeValues failed' }),
    }).pipe(Effect.map((result) => result.rows as unknown as ReadonlyArray<ReadonlyArray<unknown>>))
  }

  executeUnprepared(
    sql: string,
    params: ReadonlyArray<unknown>,
    transformRows: (<A extends object>(rows: ReadonlyArray<A>) => ReadonlyArray<A>) | undefined
  ) {
    return transformRows ? Effect.map(this.run(sql, params), transformRows) : this.run(sql, params)
  }

  executeStream(
    sql: string,
    params: ReadonlyArray<unknown>,
    transformRows: (<A extends object>(rows: ReadonlyArray<A>) => ReadonlyArray<A>) | undefined
  ) {
    const rows = transformRows ? Effect.map(this.run(sql, params), transformRows) : this.run(sql, params)
    return Stream.fromIterableEffect(rows)
  }
}

export const PgLiteSqlClientLayer = (
  options: PgLiteSqlClientLayerOptions = {}
): Layer.Layer<SqlClient.SqlClient, SqlError> =>
  Layer.scopedContext(
    Effect.gen(function* () {
      const pg = yield* Effect.acquireRelease(
        Effect.tryPromise({
          try: async () => {
            const db = new PGlite()
            await db.waitReady
            return db
          },
          catch: (cause) => new SqlError({ cause, message: 'PgLiteSqlClientLayer: failed to start PGlite' }),
        }),
        (db) => Effect.promise(() => db.close())
      )

      const client = yield* SqlClient.make({
        acquirer: Effect.succeed(new PgliteConnection(pg)),
        compiler: makeCompiler(),
        spanAttributes: [['db.system.name', 'postgresql']],
        transformRows: undefined,
      })

      if (options.withAllMigrations === true) {
        yield* runAllMigrations().pipe(Effect.provideService(SqlClient.SqlClient, client))
      } else if (options.migrationsDir !== undefined) {
        yield* runMigrationsFromDir(options.migrationsDir).pipe(Effect.provideService(SqlClient.SqlClient, client))
      }

      return Context.make(SqlClient.SqlClient, client)
    })
  ).pipe(Layer.provide(Reactivity.layer))
```

`packages/test-utils/src/index.ts` :

```ts
export * from './pglite-sql-client.layer'
export * from './run-migrations'
```

- [ ] **Step 5 : relancer le test**

```bash
pnpm --filter @etabli/test-utils exec vitest run
```

Attendu : 4 tests verts.

Si `Statement.makeCompiler` refuse un des champs (`onCustom`, `onRecordUpdate`), c'est que la signature a bougé entre `@effect/sql` 0.51 — d'où ce code est repris — et 0.52. Lire alors `node_modules/.pnpm/@effect+sql@*/node_modules/@effect/sql/dist/dts/Statement.d.ts`, chercher `interface Compiler` et aligner les champs ; la logique reste identique.

- [ ] **Step 6 : brancher sur la racine et vérifier la porte**

`tsconfig.json` racine :

```json
{
  "files": [],
  "references": [
    { "path": "./packages/contract" },
    { "path": "./packages/shared" },
    { "path": "./packages/test-utils" }
  ]
}
```

```bash
pnpm run check
```

Attendu : tout vert, 36 tests.

- [ ] **Step 7 : commit**

```bash
git add -A
git commit -m "feat(test-utils): add pglite-backed SqlClient layer and migration runner"
```

---

## Tâche 5 : `packages/server` — squelette HTTP, Neon et migrator

Le serveur démarre, se connecte à Neon, joue les migrations, expose `GET /health` et le prouve par un test qui n'ouvre aucun port. C'est aussi ici qu'on installe le mécanisme de §8.5 : une assertion de type qui casse `tsc` si le schéma Effect diverge du contrat.

**Files:**
- Create: `packages/server/package.json`, `tsconfig.json`, `tsdown.config.ts`, `vitest.config.ts`
- Create: `packages/server/src/config/config.ts`
- Create: `packages/server/src/http/health.api.ts`, `packages/server/src/http/api.ts`, `packages/server/src/http/health.handlers.ts`
- Create: `packages/server/src/layers/api-live.ts`, `packages/server/src/layers/sql-client.layer.ts`, `packages/server/src/layers/migrator.layer.ts`, `packages/server/src/layers/http-live.ts`
- Create: `packages/server/src/db/migrate.ts`, `packages/server/src/main.ts`, `packages/server/api/index.ts`
- Test: `packages/server/src/http/health.test.ts`, `packages/server/src/db/migrations.integration.test.ts`
- Modify: `tsconfig.json` racine, `package.json` racine (scripts `dev:server`, `db:migrate`)

**Interfaces:**
- Consumes: `HealthResponse` et `routes` de `@etabli/contract` ; `AssertEquals` de `@etabli/shared/type-level` ; `findMigrations` de `@etabli/shared/migrations` ; `PgLiteSqlClientLayer` de `@etabli/test-utils`.
- Produces:
  - `AppConfig` — `Config.all({ port, env, databaseUrl, jwtSecret, cookieSecure, cookieDomain })`.
  - `etabliApi` — `HttpApi.make('etabli')` portant le groupe `health`.
  - `makeHttpLive({ port, infrastructure, withMigrator })` — `Layer` complet du serveur, réutilisé par le test.
  - `ApiLive` — couche `HttpApiBuilder.api` seule, sans serveur HTTP, consommée par `toWebHandler` en test et par Vercel.
  - `SqlClientLive` — `PgClient.layerConfig({ url: Config.redacted('DATABASE_URL') })`.
  - `MigratorLive` — joue les migrations découvertes au démarrage.

- [ ] **Step 1 : écrire le test rouge de `GET /health`**

`packages/server/src/http/health.test.ts` :

```ts
import { HttpApiBuilder, HttpServer } from '@effect/platform'
import * as Layer from 'effect/Layer'
import { afterAll, describe, expect, it } from 'vitest'

import { ApiLive } from '../layers/api-live'

const { dispose, handler } = HttpApiBuilder.toWebHandler(Layer.mergeAll(ApiLive, HttpServer.layerContext))

afterAll(() => dispose())

describe('GET /health', () => {
  it('answers 200', async () => {
    const response = await handler(new Request('http://localhost/health'))
    expect(response.status).toBe(200)
  })

  it('answers the contract shape', async () => {
    const response = await handler(new Request('http://localhost/health'))
    const body = (await response.json()) as Record<string, unknown>

    expect(body['ok']).toBe(true)
    expect(typeof body['version']).toBe('string')
    expect(typeof body['uptimeMs']).toBe('number')
  })

  it('answers 404 on an unknown path', async () => {
    const response = await handler(new Request('http://localhost/nope'))
    expect(response.status).toBe(404)
  })
})
```

- [ ] **Step 2 : créer le package et lancer le test pour le voir échouer**

`packages/server/package.json` :

```json
{
  "name": "@etabli/server",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsdown",
    "dev": "tsx --env-file-if-exists=../../.env --watch src/main.ts",
    "db:migrate": "tsx --env-file-if-exists=../../.env src/db/migrate.ts",
    "start": "node dist/main.mjs",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@effect/experimental": "^0.61.1",
    "@effect/platform": "^0.97.2",
    "@effect/platform-node": "^0.108.2",
    "@effect/sql": "^0.52.1",
    "@effect/sql-pg": "^0.53.0",
    "@etabli/contract": "workspace:*",
    "@etabli/shared": "workspace:*",
    "effect": "^3.22.2"
  },
  "devDependencies": {
    "@etabli/test-utils": "workspace:*",
    "@types/node": "^22.10.2",
    "tsdown": "^0.23.0",
    "tsx": "^4.22.0",
    "typescript": "^5.9.3",
    "vitest": "^3.2.7"
  }
}
```

`packages/server/tsconfig.json` :

```json
{
  "extends": "../../tsconfig.pkg-base.json",
  "compilerOptions": {
    "rootDir": "${configDir}"
  },
  "include": ["src/**/*", "api/**/*"],
  "references": [{ "path": "../contract" }, { "path": "../shared" }, { "path": "../test-utils" }]
}
```

`rootDir` est élargi au package entier parce que `api/index.ts` — le point d'entrée exigé par Vercel (§8.11) — vit hors de `src/`.

`packages/server/tsdown.config.ts` :

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/main.ts', 'api/index.ts'],
  format: 'esm',
  dts: false,
  clean: true,
  deps: {
    neverBundle: [
      '@etabli/contract',
      '@etabli/shared',
      'effect',
      '@effect/platform',
      '@effect/platform-node',
      '@effect/sql',
      '@effect/sql-pg',
    ],
  },
})
```

`packages/server/vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@etabli/server',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
  },
})
```

```bash
pnpm install
pnpm --filter @etabli/server exec vitest run
```

Attendu : ÉCHEC sur la résolution de `../layers/api-live`.

- [ ] **Step 3 : déclarer l'API et son assertion de parité de contrat**

`packages/server/src/http/health.api.ts` :

```ts
import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import type { HealthResponse } from '@etabli/contract'
import { routes } from '@etabli/contract'
import type { AssertEquals } from '@etabli/shared/type-level'
import * as Schema from 'effect/Schema'

export const HealthResponseSchema = Schema.Struct({
  ok: Schema.Boolean,
  version: Schema.String,
  uptimeMs: Schema.Number,
})

export const healthContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof HealthResponseSchema>,
  HealthResponse
> = true

export const healthApiGroup = HttpApiGroup.make('health').add(
  HttpApiEndpoint.get('check', routes.health).addSuccess(HealthResponseSchema)
)
```

L'assertion porte sur `Encoded`, pas sur `Type` : c'est la forme qui transite sur le réseau. Si quelqu'un ajoute un champ au schéma sans toucher au contrat, `tsc` refuse d'assigner `true` et le build casse côté serveur, pas en production.

`packages/server/src/http/api.ts` :

```ts
import { HttpApi } from '@effect/platform'

import { healthApiGroup } from './health.api'

export const etabliApi = HttpApi.make('etabli').add(healthApiGroup)
```

- [ ] **Step 4 : implémenter le handler et la couche d'API**

`packages/server/src/http/health.handlers.ts` :

```ts
import { HttpApiBuilder } from '@effect/platform'
import * as Effect from 'effect/Effect'

import { etabliApi } from './api'

const BOOT_TIME = Date.now()
const VERSION = process.env['npm_package_version'] ?? '0.0.0'

export const HealthLive = HttpApiBuilder.group(etabliApi, 'health', (handlers) =>
  handlers.handle('check', () =>
    Effect.succeed({ ok: true, version: VERSION, uptimeMs: Date.now() - BOOT_TIME })
  )
)
```

`packages/server/src/layers/api-live.ts` :

```ts
import { HttpApiBuilder } from '@effect/platform'
import * as Layer from 'effect/Layer'

import { etabliApi } from '../http/api'
import { HealthLive } from '../http/health.handlers'

export const ApiLive = HttpApiBuilder.api(etabliApi).pipe(Layer.provide(HealthLive))
```

`ApiLive` est isolé du serveur HTTP : c'est ce qui permet de le tester par `toWebHandler` sans ouvrir de port, et c'est aussi ce que consomme le point d'entrée Vercel en step 9.

- [ ] **Step 5 : relancer le test**

```bash
pnpm --filter @etabli/server exec vitest run src/http/health.test.ts
```

Attendu : 3 tests verts.

- [ ] **Step 6 : écrire le test rouge des migrations**

`packages/server/src/db/migrations.integration.test.ts` :

```ts
import { SqlClient } from '@effect/sql'
import { PgLiteSqlClientLayer } from '@etabli/test-utils'
import * as Effect from 'effect/Effect'
import { describe, expect, it } from 'vitest'

const columnsOf = (table: string) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    return yield* sql<{ column_name: string }>`
      SELECT column_name FROM information_schema.columns WHERE table_name = ${table}
    `
  })

describe('workspace migrations', () => {
  it('creates domain_events with the documented columns', async () => {
    const rows = await Effect.runPromise(
      Effect.scoped(Effect.provide(columnsOf('domain_events'), PgLiteSqlClientLayer({ withAllMigrations: true })))
    )

    expect(rows.map((row) => row.column_name).toSorted()).toEqual(['id', 'name', 'occurred_at', 'payload'])
  })

  it('is idempotent when replayed', async () => {
    const program = Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      yield* sql.unsafe('CREATE TABLE IF NOT EXISTS domain_events (id uuid PRIMARY KEY)')
      return yield* sql<{ total: string }>`SELECT count(*)::text AS total FROM domain_events`
    })

    const rows = await Effect.runPromise(
      Effect.scoped(Effect.provide(program, PgLiteSqlClientLayer({ withAllMigrations: true })))
    )
    expect(rows[0]?.total).toBe('0')
  })
})
```

- [ ] **Step 7 : lancer le test**

```bash
pnpm --filter @etabli/server exec vitest run src/db
```

Attendu : 2 tests verts d'emblée — les migrations et le client pglite existent déjà. Ce test est un test de **régression du modèle de données** : il deviendra rouge le jour où une migration mal écrite cassera `domain_events`.

- [ ] **Step 8 : implémenter configuration, client SQL et migrator**

`packages/server/src/config/config.ts` :

```ts
import * as Config from 'effect/Config'

export const AppConfig = Config.all({
  port: Config.integer('PORT').pipe(Config.withDefault(3001)),
  env: Config.literal('development', 'test', 'production')('NODE_ENV').pipe(
    Config.withDefault('development' as const)
  ),
  databaseUrl: Config.redacted('DATABASE_URL'),
  jwtSecret: Config.redacted('JWT_SECRET'),
  cookieSecure: Config.boolean('COOKIE_SECURE').pipe(Config.withDefault(false)),
  cookieDomain: Config.string('COOKIE_DOMAIN').pipe(Config.withDefault('localhost')),
})

export type AppConfig = Config.Config.Success<typeof AppConfig>
```

`packages/server/src/layers/sql-client.layer.ts` :

```ts
import { PgClient } from '@effect/sql-pg'
import * as Config from 'effect/Config'

export const SqlClientLive = PgClient.layerConfig({
  url: Config.redacted('DATABASE_URL'),
})
```

L'URL de Neon doit pointer le *pooler* et porter `?sslmode=require` (§8.11) ; c'est la chaîne fournie par la console Neon, aucune option supplémentaire à passer ici.

`packages/server/src/layers/migrator.layer.ts` :

```ts
import { FileSystem } from '@effect/platform'
import { NodeContext } from '@effect/platform-node'
import * as PgMigrator from '@effect/sql-pg/PgMigrator'
import { MigrationError } from '@effect/sql/Migrator'
import * as SqlClient from '@effect/sql/SqlClient'
import { findMigrations } from '@etabli/shared/migrations'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

const loader = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const files = yield* Effect.try({
    try: () => findMigrations(),
    catch: (cause) =>
      new MigrationError({ reason: 'failed', message: `Cannot discover migrations: ${String(cause)}` }),
  })

  return files.map(({ id, name, filename, path }) => {
    const load = Effect.gen(function* () {
      const content = yield* fs
        .readFileString(path)
        .pipe(
          Effect.mapError(
            (error) =>
              new MigrationError({ reason: 'failed', message: `Cannot read ${filename}: ${error.message}` })
          )
        )

      return Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        return yield* sql
          .unsafe(content)
          .pipe(
            Effect.mapError(
              (error) =>
                new MigrationError({ reason: 'failed', message: `Migration ${filename} failed: ${String(error)}` })
            )
          )
      })
    })

    return [id, name, load] as [number, string, typeof load]
  })
})

export const MigratorLive = PgMigrator.layer({ loader }).pipe(Layer.provide(NodeContext.layer))
```

`PgMigrator` attend un `loadMigration` de type `Effect<Effect<unknown>>` : l'effet externe lit le fichier, l'effet interne l'exécute.

- [ ] **Step 9 : composer la couche HTTP et les points d'entrée**

`packages/server/src/layers/http-live.ts` :

```ts
import { createServer } from 'node:http'

import { HttpApiBuilder, HttpServer } from '@effect/platform'
import { NodeHttpServer } from '@effect/platform-node'
import * as Layer from 'effect/Layer'

import { ApiLive } from './api-live'
import { MigratorLive } from './migrator.layer'
import { SqlClientLive } from './sql-client.layer'

export interface MakeHttpLiveOptions {
  readonly port: number
  readonly infrastructure: Layer.Layer<never, unknown, never>
  readonly withMigrator?: boolean
}

export const ServerInfrastructureLayer = Layer.mergeAll(SqlClientLive)

export const makeHttpLive = ({ port, infrastructure, withMigrator = true }: MakeHttpLiveOptions) => {
  const base = HttpApiBuilder.serve().pipe(
    Layer.provide(ApiLive),
    HttpServer.withLogAddress,
    Layer.provide(NodeHttpServer.layer(() => createServer(), { port }))
  )

  const migrated = withMigrator ? base.pipe(Layer.provide(MigratorLive)) : base

  return migrated.pipe(Layer.provide(infrastructure))
}
```

`packages/server/src/main.ts` :

```ts
import { NodeRuntime } from '@effect/platform-node'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { AppConfig } from './config/config'
import { ServerInfrastructureLayer, makeHttpLive } from './layers/http-live'

const port = Number(process.env['PORT'] ?? 3001)

const HttpLive = makeHttpLive({ port, infrastructure: ServerInfrastructureLayer })

const program = Effect.gen(function* () {
  const config = yield* AppConfig
  yield* Effect.log(`Etabli server starting (env=${config.env}, port=${port})`)
}).pipe(Effect.zipRight(Layer.launch(HttpLive))) as unknown as Effect.Effect<void, unknown, never>

NodeRuntime.runMain(program)
```

`packages/server/api/index.ts` :

```ts
import { HttpApiBuilder, HttpServer } from '@effect/platform'
import * as Layer from 'effect/Layer'

import { ApiLive } from '../src/layers/api-live'
import { ServerInfrastructureLayer } from '../src/layers/http-live'

const { handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLive, HttpServer.layerContext).pipe(Layer.provide(ServerInfrastructureLayer))
)

export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler
```

Le `ServerLayer` est construit **une fois au chargement du module**, jamais par requête (§8.11).

`packages/server/src/db/migrate.ts` :

```ts
import { NodeRuntime } from '@effect/platform-node'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { MigratorLive } from '../layers/migrator.layer'
import { SqlClientLive } from '../layers/sql-client.layer'

const program = Effect.log('Migrations applied').pipe(
  Effect.provide(MigratorLive.pipe(Layer.provide(SqlClientLive)))
) as unknown as Effect.Effect<void, unknown, never>

NodeRuntime.runMain(program)
```

- [ ] **Step 10 : brancher la racine**

`tsconfig.json` racine, ajouter `{ "path": "./packages/server" }` après `test-utils`.

`package.json` racine, ajouter :

```json
{
  "scripts": {
    "dev:server": "pnpm --filter @etabli/server run dev",
    "db:migrate": "pnpm --filter @etabli/server run db:migrate"
  }
}
```

- [ ] **Step 11 : vérifier la porte, puis la connexion Neon réelle**

```bash
pnpm run check
```

Attendu : tout vert, 41 tests.

Créer ensuite une branche Neon `dev`, copier `.env.example` en `.env`, y coller l'URL du pooler, puis :

```bash
pnpm run db:migrate
pnpm run dev:server
curl -s http://localhost:3001/health
```

Attendu : `Migrations applied` au premier, un log d'adresse au second, et `{"ok":true,"version":"0.0.0","uptimeMs":…}` au troisième. Vérifier dans la console Neon que la table `domain_events` et la table de suivi des migrations existent.

- [ ] **Step 12 : commit**

```bash
git add -A
git commit -m "feat(server): add health api, neon sql client, migrator and both entry points"
```

---

## Tâche 6 : `apps/web` — squelette Next.js, direction artistique, harnais Playwright

L'application, ses jetons de design « industriel sombre », et les deux harnais de test. La page d'accueil reste un placeholder : elle est écrite en tâche 8, après son E2E.

**Files:**
- Create: `apps/web/package.json`, `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`
- Create: `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/app/(marketing)/page.tsx`
- Create: `apps/web/src/proxy.ts`, `apps/web/src/testing/setup.ts`
- Create: `apps/web/src/e2e/smoke/app-boots.test.e2e.ts`
- Modify: `package.json` racine (`dev`, `dev:web`, `typecheck`, `test:e2e`), `vitest.config.ts` racine

**Interfaces:**
- Consumes: rien de `packages/` pour l'instant — `@etabli/contract` entre en scène au jalon 1.
- Produces: les jetons Tailwind `--color-graphite-*`, `--color-signal-*`, `--color-status-*`, les familles `--font-display` et `--font-sans` ; l'alias TypeScript `@/*` → `apps/web/src/*` ; le script `pnpm test:e2e`.

- [ ] **Step 1 : écrire l'E2E rouge de démarrage**

`apps/web/src/e2e/smoke/app-boots.test.e2e.ts` :

```ts
import { expect, test } from '@playwright/test'

test('the application boots on the marketing home', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
})

test('the page is served in French', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
})

test('the page paints the graphite background', async ({ page }) => {
  await page.goto('/')
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(background).toBe('rgb(11, 12, 14)')
})
```

- [ ] **Step 2 : créer l'application**

`apps/web/package.json` :

```json
{
  "name": "@etabli/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "next build",
    "dev": "next dev --port 3000",
    "start": "next start --port 3000",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^16.3.5",
    "react": "^19.3.0",
    "react-dom": "^19.3.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.63.0",
    "@tailwindcss/postcss": "^4.3.3",
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.3",
    "@types/node": "^22.10.2",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "jsdom": "^30.0.1",
    "tailwindcss": "^4.3.3",
    "typescript": "^5.9.3",
    "vitest": "^3.2.7"
  }
}
```

`apps/web/next.config.ts` :

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

`typedRoutes` n'est délibérément **pas** activé au jalon 0 : la page d'accueil pointe vers `/ateliers` et `/inscription`, qui n'existent pas encore, et le typage des routes ferait échouer `tsc` sur ces deux liens. Le drapeau est ajouté au jalon 2, quand les routes cibles existent.

`cacheComponents: true` est le drapeau de Next 16 qui active `use cache`, `cacheLife`, `cacheTag` et fait du PPR le comportement par défaut. Il remplace `experimental.dynamicIO` et `experimental.ppr`. Il est posé dès maintenant parce que §8.8 en dépend au jalon 2 ; si `next build` échoue à ce stade sur un accès dynamique non caché, la correction est d'envelopper la zone concernée dans un `<Suspense>`, pas de retirer le drapeau.

`apps/web/postcss.config.mjs` :

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

`apps/web/tsconfig.json` :

```json
{
  "extends": "../../tsconfig.app-base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "allowJs": true,
    "moduleResolution": "Bundler",
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*", "next-env.d.ts", ".next/types/**/*", "next.config.ts"],
  "exclude": ["node_modules", ".next"]
}
```

- [ ] **Step 3 : poser les jetons de design**

`apps/web/src/app/globals.css` :

```css
@import 'tailwindcss';

@theme {
  --color-graphite-950: #0b0c0e;
  --color-graphite-900: #131518;
  --color-graphite-800: #1c1f24;
  --color-graphite-700: #2a2e35;
  --color-graphite-600: #3d434c;
  --color-graphite-400: #7b828d;
  --color-graphite-200: #c3c8d0;
  --color-graphite-50: #f4f6f8;

  --color-signal-600: #d14f00;
  --color-signal-500: #ff6a00;
  --color-signal-400: #ff8534;

  --color-status-ok: #3fbf6f;
  --color-status-warn: #f5a524;
  --color-status-danger: #e5484d;

  --font-display: var(--font-barlow-condensed), ui-sans-serif, system-ui, sans-serif;
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}

:root {
  color-scheme: dark;
}

body {
  background-color: var(--color-graphite-950);
  color: var(--color-graphite-50);
  font-family: var(--font-sans);
}

:focus-visible {
  outline: 2px solid var(--color-signal-500);
  outline-offset: 2px;
}
```

Les deux couples porteurs ont été vérifiés : `--color-signal-500` sur `--color-graphite-950` donne un contraste de 6,8:1 et `--color-graphite-50` sur le même fond 18:1 — au-dessus du 4,5:1 exigé pour du texte. Le `:focus-visible` global tient l'exigence d'accessibilité de §8.9, pas une préférence esthétique.

- [ ] **Step 4 : écrire le layout et une page provisoire**

`apps/web/src/app/layout.tsx` :

```tsx
import type { Metadata } from 'next'
import { Barlow_Condensed, Inter } from 'next/font/google'
import type { ReactNode } from 'react'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-barlow-condensed',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Établi', template: '%s · Établi' },
  description: "Le réseau d'ateliers partagés où l'habilitation conditionne la réservation.",
}

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="fr" className={`${inter.variable} ${barlowCondensed.variable}`}>
    <body>{children}</body>
  </html>
)

export default RootLayout
```

`apps/web/src/app/(marketing)/page.tsx` :

```tsx
const MarketingHome = () => <main className="p-8 font-display text-3xl">Établi</main>

export default MarketingHome
```

`apps/web/src/proxy.ts` :

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const proxy = (_request: NextRequest) => NextResponse.next()

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
```

Le fichier est volontairement inerte : c'est au jalon 1 qu'il redirigera les sessions absentes. Le poser maintenant fige son emplacement (`src/proxy.ts`, au même niveau que `app/`) et son matcher.

- [ ] **Step 5 : configurer les deux harnais de test**

`apps/web/src/testing/setup.ts` :

```ts
import '@testing-library/jest-dom/vitest'
```

`apps/web/vitest.config.ts` :

```ts
import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  esbuild: { jsx: 'automatic' },
  test: {
    name: '@etabli/web',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['**/*.test.e2e.ts', 'node_modules', '.next'],
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    globals: false,
  },
})
```

`esbuild.jsx: 'automatic'` évite d'ajouter `@vitejs/plugin-react` : le transform JSX de React 19 n'a besoin de rien d'autre pour Testing Library.

`apps/web/playwright.config.ts` :

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src',
  testMatch: '**/*.test.e2e.ts',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://localhost:3000',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

- [ ] **Step 6 : brancher la racine**

`package.json` racine :

```json
{
  "scripts": {
    "dev": "concurrently -k -n api,web -c yellow,cyan \"pnpm run dev:server\" \"pnpm run dev:web\"",
    "dev:web": "pnpm --filter @etabli/web run dev",
    "typecheck": "tsc --build --verbose && pnpm --filter @etabli/web run typecheck",
    "test:e2e": "pnpm --filter @etabli/web run test:e2e"
  }
}
```

`vitest.config.ts` racine :

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/web'],
  },
})
```

Le typecheck de `apps/web` suppose que `next-env.d.ts` a été généré au moins une fois : c'est `next build` ou `next dev` qui l'écrit. Le step 8 construit avant de lancer la porte, dans cet ordre-là.

`apps/web` n'entre pas dans les `references` du `tsconfig.json` racine : son tsconfig a `composite: false` et `noEmit: true`, ce qui le rend inéligible comme cible de référence. C'est pour cela que `typecheck` l'appelle séparément.

- [ ] **Step 7 : installer Playwright et faire passer l'E2E**

```bash
pnpm install
pnpm --filter @etabli/web exec playwright install chromium
pnpm run test:e2e
```

Attendu : 3 tests verts. Si le troisième échoue, comparer la valeur reçue à `rgb(11, 12, 14)` : elle trahit soit un `globals.css` non importé par le layout, soit une valeur de `--color-graphite-950` différente.

- [ ] **Step 8 : vérifier la construction et la porte**

```bash
pnpm --filter @etabli/web run build
pnpm run check
```

Attendu : `next build` réussit, puis tout vert.

- [ ] **Step 9 : commit**

```bash
git add -A
git commit -m "feat(web): scaffold next.js app with industrial dark tokens and playwright harness"
```

---

## Tâche 7 : primitives d'interface

Trois composants purs, sur les jetons de la tâche 6, testés à Testing Library. Ils portent le vocabulaire visuel de la signalétique d'atelier annoncé en §8.12.

**Files:**
- Create: `apps/web/src/ui/cn.ts`, `apps/web/src/ui/Button.tsx`, `apps/web/src/ui/StatusBadge.tsx`, `apps/web/src/ui/Surface.tsx`
- Test: `apps/web/src/ui/Button.test.tsx`, `apps/web/src/ui/StatusBadge.test.tsx`
- Modify: `apps/web/package.json` (ajout de `clsx`, `tailwind-merge`, `class-variance-authority`)

**Interfaces:**
- Consumes: les jetons CSS de la tâche 6.
- Produces:
  - `cn(...inputs: ClassValue[]): string` — fusion de classes Tailwind.
  - `buttonVariants({ variant?, size? }): string` — les classes seules, pour qu'un `<Link>` porte l'apparence d'un bouton.
  - `Button` — props `{ variant?: 'primary' | 'ghost' | 'danger'; size?: 'sm' | 'md'; className?: string }` plus toutes les props natives de `button`, `ref` inclus (prop normale en React 19).
  - `StatusBadge` — props `{ tone: 'ok' | 'warn' | 'danger' | 'neutral'; label: string; className?: string }`.
  - `Surface` — conteneur `{ children, className? }`.

`StatusBadge` prend un ton et un libellé plutôt qu'un statut métier : les constantes `MachineStatus` et `CertificationStatus` appartiennent à `bc-atelier` et `bc-certification`, qui n'existent pas encore. Le couplage se fera au jalon 2 par une fonction de projection, pas en remontant le domaine dans le design system.

- [ ] **Step 1 : écrire les tests rouges**

`apps/web/src/ui/Button.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './Button'

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Réserver</Button>)
    expect(screen.getByRole('button', { name: /réserver/i })).toBeInTheDocument()
  })

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Réserver</Button>)

    await userEvent.click(screen.getByRole('button', { name: /réserver/i }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Réserver
      </Button>
    )

    await userEvent.click(screen.getByRole('button', { name: /réserver/i }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('carries the signal accent on the primary variant', () => {
    render(<Button>Réserver</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-signal-500')
  })

  it('does not carry the signal accent on the ghost variant', () => {
    render(<Button variant="ghost">Annuler</Button>)
    expect(screen.getByRole('button')).not.toHaveClass('bg-signal-500')
  })

  it('merges a caller className', () => {
    render(<Button className="w-full">Réserver</Button>)
    expect(screen.getByRole('button')).toHaveClass('w-full')
  })

  it('defaults to type button', () => {
    render(<Button>Réserver</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })
})
```

`apps/web/src/ui/StatusBadge.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders its label', () => {
    render(<StatusBadge tone="ok" label="Disponible" />)
    expect(screen.getByText('Disponible')).toBeInTheDocument()
  })

  it('exposes the status to assistive technology', () => {
    render(<StatusBadge tone="warn" label="En maintenance" />)
    expect(screen.getByRole('status')).toHaveTextContent('En maintenance')
  })

  it('uses a distinct class per tone', () => {
    const { rerender } = render(<StatusBadge tone="ok" label="Disponible" />)
    const ok = screen.getByRole('status').className

    rerender(<StatusBadge tone="danger" label="Retirée" />)
    const danger = screen.getByRole('status').className

    expect(ok).not.toBe(danger)
  })
})
```

- [ ] **Step 2 : installer les dépendances et lancer les tests**

```bash
pnpm --filter @etabli/web add clsx tailwind-merge class-variance-authority
pnpm --filter @etabli/web add -D @testing-library/user-event
pnpm --filter @etabli/web exec vitest run src/ui
```

Attendu : ÉCHEC sur la résolution de `./Button` et `./StatusBadge`.

- [ ] **Step 3 : implémenter les primitives**

`apps/web/src/ui/cn.ts` :

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ReadonlyArray<ClassValue>): string => twMerge(clsx(inputs))
```

`apps/web/src/ui/Button.tsx` :

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from './cn'

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-sm font-display font-semibold tracking-wide uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-signal-500 text-graphite-950 hover:bg-signal-400',
        ghost: 'border border-graphite-700 text-graphite-200 hover:border-graphite-600 hover:text-graphite-50',
        danger: 'bg-status-danger text-graphite-50 hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-5 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export const Button = ({ className, variant, size, type = 'button', ...props }: ButtonProps) => (
  <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
)
```

`buttonVariants` est exporté pour qu'un `<Link>` puisse porter l'apparence d'un bouton sans qu'on imbrique un `<button>` dans un `<a>` — deux éléments interactifs l'un dans l'autre sont invalides et brouillent la navigation au clavier.

`apps/web/src/ui/StatusBadge.tsx` :

```tsx
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from './cn'

const badge = cva(
  'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-display text-xs font-semibold tracking-wider uppercase',
  {
    variants: {
      tone: {
        ok: 'border-status-ok/40 bg-status-ok/10 text-status-ok',
        warn: 'border-status-warn/40 bg-status-warn/10 text-status-warn',
        danger: 'border-status-danger/40 bg-status-danger/10 text-status-danger',
        neutral: 'border-graphite-700 bg-graphite-800 text-graphite-200',
      },
    },
    defaultVariants: { tone: 'neutral' },
  }
)

export type StatusBadgeProps = VariantProps<typeof badge> & {
  readonly label: string
  readonly className?: string
}

export const StatusBadge = ({ tone, label, className }: StatusBadgeProps) => (
  <span role="status" className={cn(badge({ tone }), className)}>
    {label}
  </span>
)
```

`apps/web/src/ui/Surface.tsx` :

```tsx
import type { ReactNode } from 'react'

import { cn } from './cn'

export type SurfaceProps = {
  readonly children: ReactNode
  readonly className?: string
}

export const Surface = ({ children, className }: SurfaceProps) => (
  <div className={cn('rounded-sm border border-graphite-800 bg-graphite-900 p-6', className)}>{children}</div>
)
```

- [ ] **Step 4 : relancer les tests**

```bash
pnpm --filter @etabli/web exec vitest run src/ui
```

Attendu : 10 tests verts.

- [ ] **Step 5 : commit**

```bash
git add -A
git commit -m "feat(web): add button, status badge and surface primitives on project tokens"
```

---

## Tâche 8 : page d'accueil, métadonnées et fichiers d'indexation

La porte du jalon : « la page d'accueil s'affiche avec la bonne direction artistique ». Contenu imposé par §4.1 — proposition de valeur, fonctionnement en trois temps, réassurance — plus `generateMetadata`, Open Graph, `sitemap.ts` et `robots.ts`.

**Files:**
- Create: `apps/web/src/features/marketing/home/home.page.tsx`
- Test: `apps/web/src/features/marketing/home/home.test.e2e.ts`
- Create: `apps/web/src/app/robots.ts`, `apps/web/src/app/sitemap.ts`
- Modify: `apps/web/src/app/(marketing)/page.tsx`

**Interfaces:**
- Consumes: `buttonVariants`, `StatusBadge`, `Surface` de `@/ui`.
- Produces: `HomePage` — composant serveur sans props, exporté nommément ; la route `app/(marketing)/page.tsx` n'est qu'une coquille qui le rend.

- [ ] **Step 1 : écrire l'E2E rouge**

`apps/web/src/features/marketing/home/home.test.e2e.ts` :

```ts
import { expect, test } from '@playwright/test'

test('states the promise in a single heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/droit de s'en servir/i)
})

test('explains the product in three steps', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('listitem').filter({ hasText: /habilit/i })).toHaveCount(1)
  await expect(page.getByRole('list', { name: /fonctionnement/i }).getByRole('listitem')).toHaveCount(3)
})

test('offers a way into the atelier directory', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: /découvrir les ateliers/i })).toHaveAttribute('href', '/ateliers')
})

test('carries a title and a description for search engines', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Établi/)
  const description = await page.locator('meta[name="description"]').getAttribute('content')
  expect(description).toMatch(/habilitation/i)
})

test('serves robots.txt pointing at the sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt')
  expect(response.status()).toBe(200)
  expect(await response.text()).toContain('Sitemap:')
})

test('serves a sitemap containing the home page', async ({ request }) => {
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
  expect(await response.text()).toContain('<loc>')
})
```

- [ ] **Step 2 : lancer l'E2E pour le voir échouer**

```bash
pnpm run test:e2e -- src/features/marketing
```

Attendu : ÉCHEC sur les six tests — la page ne contient que « Établi », et ni `robots.txt` ni `sitemap.xml` n'existent.

- [ ] **Step 3 : écrire la page**

`apps/web/src/features/marketing/home/home.page.tsx` :

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { buttonVariants } from '@/ui/Button'
import { StatusBadge } from '@/ui/StatusBadge'
import { Surface } from '@/ui/Surface'

export const metadata: Metadata = {
  title: 'Réservez la machine que vous avez le droit d’utiliser',
  description:
    "Établi relie l'habilitation, le créneau et la présence physique dans les ateliers partagés. Le système refuse une réservation sans habilitation, il n'alerte pas.",
  openGraph: {
    type: 'website',
    siteName: 'Établi',
    title: 'Établi — le réseau des ateliers partagés',
    description:
      "L'habilitation conditionne la réservation. Le créneau est exclusif. La présence est prouvée par NFC.",
  },
}

const steps = [
  {
    title: 'Passez votre habilitation',
    body: "Vous demandez l'accès à un type de machine dans votre atelier. Le fabmanager accorde, ou non.",
  },
  {
    title: 'Réservez un créneau',
    body: 'Le calendrier ne vous propose que ce que vous avez le droit de prendre, et refuse tout chevauchement.',
  },
  {
    title: 'Pointez sur la machine',
    body: 'Le tag NFC collé sur le bâti prouve votre présence. Le check-in ne se fait pas depuis le canapé.',
  },
]

export const HomePage = () => (
  <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-20">
    <section className="flex flex-col gap-6">
      <StatusBadge tone="warn" label="Réseau d'ateliers partagés" />
      <h1 className="font-display text-4xl leading-tight font-bold tracking-tight uppercase sm:text-6xl">
        On ne réserve pas une découpeuse laser parce qu'elle est libre. On la réserve parce qu'on a le droit de s'en
        servir.
      </h1>
      <p className="max-w-2xl text-lg text-graphite-200">
        Établi relie l'habilitation, le créneau et la présence physique. Une seule source de vérité, à la place du
        groupe de messagerie, du tableur et du cahier posé près de la machine.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link href="/ateliers" className={buttonVariants()}>
          Découvrir les ateliers
        </Link>
        <Link href="/inscription" className={buttonVariants({ variant: 'ghost' })}>
          Créer un compte
        </Link>
      </div>
    </section>

    <section className="flex flex-col gap-6">
      <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Comment ça marche</h2>
      <ul aria-label="Fonctionnement en trois temps" className="grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Surface className="flex h-full flex-col gap-3">
              <span className="font-display text-3xl font-bold text-signal-500">{`0${index + 1}`}</span>
              <h3 className="font-display text-lg font-semibold tracking-wide uppercase">{step.title}</h3>
              <p className="text-graphite-400">{step.body}</p>
            </Surface>
          </li>
        ))}
      </ul>
    </section>

    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl font-semibold tracking-wide uppercase">Ce que le système garantit</h2>
      <Surface className="flex flex-col gap-3 text-graphite-200">
        <p>Une machine qui exige une habilitation refuse la réservation à qui ne l'a pas.</p>
        <p>Deux réservations ne peuvent jamais se chevaucher sur la même machine.</p>
        <p>Un fabmanager n'agit que dans son atelier, vérifié côté serveur et non par un bouton masqué.</p>
      </Surface>
    </section>
  </main>
)
```

`apps/web/src/app/(marketing)/page.tsx` :

```tsx
import { HomePage, metadata } from '@/features/marketing/home/home.page'

export { metadata }

export default HomePage
```

- [ ] **Step 4 : écrire `robots.ts` et `sitemap.ts`**

`apps/web/src/app/robots.ts` :

```ts
import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const robots = (): MetadataRoute.Robots => ({
  rules: [{ userAgent: '*', allow: '/', disallow: ['/tableau-de-bord', '/administration', '/api'] }],
  sitemap: `${siteUrl}/sitemap.xml`,
})

export default robots
```

`apps/web/src/app/sitemap.ts` :

```ts
import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const sitemap = (): MetadataRoute.Sitemap => [
  { url: siteUrl, changeFrequency: 'monthly', priority: 1 },
  { url: `${siteUrl}/ateliers`, changeFrequency: 'daily', priority: 0.8 },
]

export default sitemap
```

Le sitemap est statique au jalon 0. Il devient dynamique au jalon 2, quand les ateliers publiés existent en base.

- [ ] **Step 5 : relancer l'E2E**

```bash
pnpm run test:e2e
```

Attendu : 9 tests verts — les 3 de démarrage plus les 6 de la page d'accueil.

Le deuxième test suppose deux choses qui doivent rester vraies : qu'un seul `<li>` de toute la page contient « habilit », et que la liste des trois temps porte `aria-label="Fonctionnement en trois temps"`. Si un jour un autre `<li>` mentionne l'habilitation, resserrer le sélecteur sur la liste nommée plutôt que relâcher l'assertion.

- [ ] **Step 6 : vérifier la construction et la porte**

```bash
pnpm --filter @etabli/web run build
pnpm run check
```

Attendu : `next build` réussit, tout vert.

- [ ] **Step 7 : commit**

```bash
git add -A
git commit -m "feat(web): add marketing home page with metadata, robots and sitemap"
```

---

## Tâche 9 : garde d'architecture

Le repli documenté par les règles globales quand `import/no-restricted-paths` n'est pas disponible : un graphe d'imports résolus, et des assertions dessus. Repris de `src/architecture/import-graph.ts` du dépôt Boonty, réduit à ce dont Établi a besoin et augmenté de la règle qui compte ici — `core/` n'importe ni React ni Next (§8.6).

**Files:**
- Create: `apps/web/src/architecture/import-graph.ts`
- Test: `apps/web/src/architecture/import-graph.test.ts`, `apps/web/src/architecture/boundaries.test.ts`

**Interfaces:**
- Consumes: `git ls-files`, donc les fichiers doivent être suivis par git pour entrer dans le graphe.
- Produces:
  - `buildImportGraph(cwd): { files, edges, edgeCount, typeOnlyEdgeCount }`
  - `resolveSpecifier(specifier, importer, known): string | null`
  - `isProduction(path): boolean`
  - `bareSpecifiersOf(cwd, file): ReadonlyArray<string>`
  - `findCycles(graph): string[][]`

- [ ] **Step 1 : écrire les tests rouges du graphe**

`apps/web/src/architecture/import-graph.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { buildImportGraph, isProduction, resolveSpecifier } from './import-graph'

const graph = buildImportGraph(process.cwd())

describe('import graph', () => {
  it('is actually populated', () => {
    expect(graph.files.length).toBeGreaterThan(5)
    expect(graph.edgeCount).toBeGreaterThan(3)
  })

  it('counts production files only', () => {
    expect(graph.files.some((file) => file.endsWith('.test.ts'))).toBe(false)
    expect(graph.files.some((file) => file.endsWith('.test.tsx'))).toBe(false)
    expect(graph.files.some((file) => file.endsWith('.test.e2e.ts'))).toBe(false)
    expect(graph.files.some((file) => file.startsWith('src/e2e/'))).toBe(false)
  })
})

describe('resolveSpecifier', () => {
  const known = new Set(graph.files)
  const importer = 'src/features/marketing/home/home.page.tsx'

  it('resolves the alias form', () => {
    expect(resolveSpecifier('@/ui/Button', importer, known)).toBe('src/ui/Button.tsx')
  })

  it('resolves the relative form to the same file as the alias form', () => {
    expect(resolveSpecifier('../../../ui/Button', importer, known)).toBe(resolveSpecifier('@/ui/Button', importer, known))
  })

  it('returns null for a bare package specifier', () => {
    expect(resolveSpecifier('next/link', importer, known)).toBeNull()
    expect(resolveSpecifier('react', importer, known)).toBeNull()
  })
})

describe('isProduction', () => {
  it('accepts a component', () => {
    expect(isProduction('src/ui/Button.tsx')).toBe(true)
  })

  it('rejects a unit test, an e2e test and an ambient declaration', () => {
    expect(isProduction('src/ui/Button.test.tsx')).toBe(false)
    expect(isProduction('src/features/marketing/home/home.test.e2e.ts')).toBe(false)
    expect(isProduction('next-env.d.ts')).toBe(false)
  })
})
```

- [ ] **Step 2 : lancer pour voir échouer**

```bash
pnpm --filter @etabli/web exec vitest run src/architecture
```

Attendu : ÉCHEC, `Failed to resolve import "./import-graph"`.

- [ ] **Step 3 : implémenter le graphe**

`apps/web/src/architecture/import-graph.ts` :

```ts
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'

const ALIAS = '@/'

const IMPORT = new RegExp(
  String.raw`(?:^|[\s;(=])(import|export|require)\s*(type\s+)?([\s\S]*?)?['"]([^'"]+)['"]`,
  'gm'
)

export const stripComments = (source: string): string =>
  source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/(^|[^:])\/\/[^\n]*/g, '$1')

export const listSourceFiles = (cwd: string): ReadonlyArray<string> =>
  execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd, encoding: 'utf8' }).split('\n').filter(Boolean)

const candidatesFor = (base: string): ReadonlyArray<string> => [
  `${base}.ts`,
  `${base}.tsx`,
  join(base, 'index.ts'),
  join(base, 'index.tsx'),
  base,
]

export const resolveSpecifier = (
  specifier: string,
  importer: string,
  known: ReadonlySet<string>
): string | null => {
  let base: string
  if (specifier.startsWith(ALIAS)) base = join('src', specifier.slice(ALIAS.length))
  else if (specifier.startsWith('.')) base = normalize(join(dirname(importer), specifier))
  else return null

  return candidatesFor(base).find((candidate) => known.has(candidate)) ?? null
}

export const isProduction = (path: string): boolean =>
  !/\.test\.(e2e\.)?tsx?$/.test(path) && !path.startsWith('src/e2e/') && !path.endsWith('.d.ts')

const typeExportsOf = (source: string): ReadonlySet<string> =>
  new Set([...source.matchAll(/export\s+(?:type|interface)\s+([A-Za-z0-9_$]+)/g)].map(([, name]) => name ?? ''))

const bindingsOf = (clause: string): { names: ReadonlyArray<string>; allInlineType: boolean } => {
  const braced = /\{([\s\S]*)\}/.exec(clause)
  if (!braced) {
    const plain = /([A-Za-z0-9_$]+)/.exec(clause.replaceAll(/\bfrom\b/g, ''))
    return { names: plain?.[1] === undefined ? [] : [plain[1]], allInlineType: false }
  }

  const parts = (braced[1] ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  return {
    names: parts.map((part) => part.replace(/^type\s+/, '').split(/\s+as\s+/)[0]?.trim() ?? '').filter(Boolean),
    allInlineType: parts.length > 0 && parts.every((part) => /^type\s/.test(part)),
  }
}

export interface ImportGraph {
  readonly files: ReadonlyArray<string>
  readonly edges: ReadonlyMap<string, ReadonlySet<string>>
  readonly edgeCount: number
  readonly typeOnlyEdgeCount: number
}

export const buildImportGraph = (cwd: string): ImportGraph => {
  const tracked = listSourceFiles(cwd)
  const known = new Set(tracked)
  const files = tracked.filter(isProduction)

  const cache = new Map<string, string>()
  const readSource = (path: string): string => {
    const cached = cache.get(path)
    if (cached !== undefined) return cached
    const full = join(cwd, path)
    const text = existsSync(full) ? readFileSync(full, 'utf8') : ''
    cache.set(path, text)
    return text
  }

  const edges = new Map<string, Set<string>>()
  let edgeCount = 0
  let typeOnlyEdgeCount = 0

  for (const file of files) {
    const source = stripComments(readSource(file))
    const targets = new Set<string>()

    for (const [, keyword, typeKeyword, clause, specifier] of source.matchAll(IMPORT)) {
      const target = resolveSpecifier(specifier ?? '', file, known)
      if (target === null || target === file || !isProduction(target)) continue

      if (typeKeyword !== undefined) {
        typeOnlyEdgeCount += 1
        continue
      }

      const { names, allInlineType } = bindingsOf(clause ?? '')
      if (allInlineType) {
        typeOnlyEdgeCount += 1
        continue
      }

      if (keyword !== 'require' && names.length > 0) {
        const typeExports = typeExportsOf(stripComments(readSource(target)))
        if (names.every((name) => typeExports.has(name))) {
          typeOnlyEdgeCount += 1
          continue
        }
      }

      targets.add(target)
    }

    edgeCount += targets.size
    edges.set(file, targets)
  }

  return { files, edges, edgeCount, typeOnlyEdgeCount }
}

export const bareSpecifiersOf = (cwd: string, file: string): ReadonlyArray<string> => {
  const source = stripComments(readFileSync(join(cwd, file), 'utf8'))
  return [...source.matchAll(IMPORT)]
    .map(([, , , , specifier]) => specifier ?? '')
    .filter((specifier) => !specifier.startsWith('.') && !specifier.startsWith(ALIAS))
}

export const findCycles = ({ files, edges }: ImportGraph): ReadonlyArray<ReadonlyArray<string>> => {
  const index = new Map<string, number>()
  const low = new Map<string, number>()
  const onStack = new Set<string>()
  const stack: Array<string> = []
  const cycles: Array<Array<string>> = []
  let counter = 0

  for (const root of files) {
    if (index.has(root)) continue
    const work: Array<{ node: string; next: number; succs: Array<string> }> = [
      { node: root, next: 0, succs: [...(edges.get(root) ?? [])].toSorted() },
    ]
    index.set(root, counter)
    low.set(root, counter)
    counter += 1
    stack.push(root)
    onStack.add(root)

    while (work.length > 0) {
      const frame = work.at(-1)
      if (frame === undefined) break

      if (frame.next < frame.succs.length) {
        const child = frame.succs[frame.next] ?? ''
        frame.next += 1
        if (!index.has(child)) {
          index.set(child, counter)
          low.set(child, counter)
          counter += 1
          stack.push(child)
          onStack.add(child)
          work.push({ node: child, next: 0, succs: [...(edges.get(child) ?? [])].toSorted() })
        } else if (onStack.has(child)) {
          low.set(frame.node, Math.min(low.get(frame.node) ?? 0, index.get(child) ?? 0))
        }
        continue
      }

      work.pop()
      if (low.get(frame.node) === index.get(frame.node)) {
        const component: Array<string> = []
        for (;;) {
          const popped = stack.pop()
          if (popped === undefined) break
          onStack.delete(popped)
          component.push(popped)
          if (popped === frame.node) break
        }
        if (component.length > 1) cycles.push(component.toSorted())
      }

      const parent = work.at(-1)
      if (parent !== undefined) {
        low.set(parent.node, Math.min(low.get(parent.node) ?? 0, low.get(frame.node) ?? 0))
      }
    }
  }

  return cycles
}
```

Les arêtes de type sont écartées : `import type` est effacé par le compilateur, et les compter ferait échouer la garde de cycles sur une boucle qui ne peut pas exister à l'exécution.

- [ ] **Step 4 : relancer les tests du graphe**

```bash
pnpm --filter @etabli/web exec vitest run src/architecture/import-graph.test.ts
```

Attendu : 7 tests verts.

- [ ] **Step 5 : écrire les tests de frontières**

`apps/web/src/architecture/boundaries.test.ts` :

```ts
import { describe, expect, it } from 'vitest'

import { bareSpecifiersOf, buildImportGraph, findCycles } from './import-graph'

const cwd = process.cwd()
const graph = buildImportGraph(cwd)

const isFrameworkImport = (specifier: string): boolean =>
  specifier === 'react' ||
  specifier.startsWith('react/') ||
  specifier.startsWith('react-dom') ||
  specifier === 'next' ||
  specifier.startsWith('next/')

describe('module boundaries', () => {
  it('keeps React and Next out of every core/', () => {
    const offenders = graph.files
      .filter((file) => /^src\/modules\/[^/]+\/core\//.test(file))
      .flatMap((file) => bareSpecifiersOf(cwd, file).filter(isFrameworkImport).map((spec) => `${file} -> ${spec}`))

    expect(offenders).toEqual([])
  })

  it('keeps components out of features/', () => {
    const offenders = graph.files.filter(
      (file) => file.startsWith('src/features/') && file.endsWith('.tsx') && !file.endsWith('.page.tsx')
    )

    expect(offenders).toEqual([])
  })

  it('keeps production code out of src/testing/', () => {
    const offenders = [...graph.edges].flatMap(([importer, targets]) =>
      [...targets].filter((target) => target.startsWith('src/testing/')).map((target) => `${importer} -> ${target}`)
    )

    expect(offenders).toEqual([])
  })

  it('has no import cycle', () => {
    expect(findCycles(graph)).toEqual([])
  })
})
```

Le premier test ne trouve aucun fichier à inspecter au jalon 0 — `src/modules/` n'existe pas encore — et passe donc trivialement. C'est voulu : il est en place **avant** le premier module, de sorte que la règle s'applique dès la première ligne du jalon 1 au lieu d'être rétro-appliquée à un code déjà écrit.

- [ ] **Step 6 : lancer les tests de frontières**

```bash
pnpm --filter @etabli/web exec vitest run src/architecture
```

Attendu : 11 tests verts.

Si « keeps components out of features/ » échoue, c'est que `home.page.tsx` a été scindé en composants : les déplacer sous `src/modules/<module>/ui/components/`, pas relâcher la règle.

- [ ] **Step 7 : vérifier la porte et commit**

```bash
pnpm run check
```

```bash
git add -A
git commit -m "test(web): guard module boundaries with a resolved import graph"
```

---

## Tâche 10 : fermeture du jalon — hooks git, README, vérification complète

**Files:**
- Create: `README.md`
- Modify: `package.json` racine (script `verify`)

**Interfaces:**
- Consumes: tout ce qui précède.
- Produces: `pnpm verify` — la porte complète du jalon, `check` plus la construction de l'application et les E2E.

- [ ] **Step 1 : activer lefthook**

```bash
pnpm exec lefthook install
```

Vérifier que les hooks sont posés :

```bash
ls .git/hooks/pre-commit .git/hooks/pre-push
```

Attendu : les deux fichiers existent.

- [ ] **Step 2 : ajouter le script de vérification complète**

`package.json` racine :

```json
{
  "scripts": {
    "verify": "pnpm run check && pnpm --filter @etabli/web run build && pnpm run test:e2e"
  }
}
```

- [ ] **Step 3 : écrire le README de reprise**

`README.md` :

````markdown
# Établi

Plateforme d'un réseau d'ateliers partagés : habilitations machine, réservation de créneaux, check-in NFC.
Projet fil rouge M2 EEMI 2026 · Next.js 16.3.

La conception complète — produit, règles métier, modèle de données, surface d'API — est dans
`docs/superpowers/specs/2026-09-14-etabli-design.md`.

## Prérequis

- Node 22 ou plus (`.nvmrc` épingle 24)
- pnpm 10
- Une base PostgreSQL Neon, branche dédiée pour le développement

## Démarrer

```bash
pnpm install
cp .env.example .env          # y coller l'URL du pooler Neon et un JWT_SECRET
pnpm run db:migrate
pnpm run dev                  # API sur :3001, web sur :3000
```

## Vérifier

```bash
pnpm run check                # format, lint, typecheck, tests unitaires
pnpm run verify               # check + build + tests end-to-end
```

`pnpm run check` construit d'abord les packages : les types inter-packages sont résolus depuis
`dist/`, produit par tsdown et non par tsc.

## Organisation

| Chemin | Rôle |
|---|---|
| `packages/contract` | types TypeScript purs et table de routes — aucune dépendance |
| `packages/shared` | primitives Effect partagées : identifiants brandés, AuthContext, Clock, migrations |
| `packages/test-utils` | client SQL pglite pour les tests d'intégration |
| `packages/server` | HttpApi Effect, Layers, migrator, points d'entrée Node et Vercel |
| `apps/web` | application Next.js — App Router, Server Components, Server Actions |

Les migrations sont des fichiers `.sql` numérotés sous `packages/*/src/infrastructure/migrations/`.
Le préfixe à quatre chiffres porte l'ordre global, tous packages confondus : un doublon fait échouer
le démarrage.

## Tests

TDD strict : E2E Playwright rouge d'abord, unitaires rouges ensuite, implémentation enfin.
Les tests sont colocalisés avec le code ; les E2E portent l'extension `.test.e2e.ts` et vivent
à côté de la page qu'ils couvrent.
````

- [ ] **Step 4 : lancer la porte complète du jalon**

```bash
pnpm run verify
```

Attendu : format, lint, typecheck, 62 tests unitaires, `next build` réussi, 9 tests Playwright verts.

- [ ] **Step 5 : vérifier à l'œil la direction artistique**

```bash
pnpm run dev
```

Ouvrir `http://localhost:3000` et contrôler :
- fond graphite très sombre, texte clair, aucun blanc pur ;
- titre en capitales condensées, corps de texte lisible et distinct du titre ;
- accent orange signal sur le bouton principal et sur les numéros des trois temps ;
- tabulation au clavier : chaque élément focusable porte un contour orange visible ;
- rendu correct à 375 px de large comme à 1440 px.

- [ ] **Step 6 : commit et étiquette**

```bash
git add -A
git commit -m "chore: close milestone 0 with git hooks, readme and full verification gate"
git tag jalon-0
```

---

## Vérification de la porte du jalon

La spec définit le jalon 0 comme terminé quand « `pnpm check` passe sur un dépôt vide de métier, et la page d'accueil s'affiche avec la bonne direction artistique ». Correspondance :

| Exigence de §7 | Où elle est satisfaite |
|---|---|
| Monorepo pnpm | Tâche 1 |
| `packages/contract` | Tâche 2 |
| `packages/shared` | Tâche 3 |
| Squelette `packages/server` | Tâche 5 |
| Connexion Neon | Tâche 5, step 11 |
| Migrator | Tâche 5, steps 8 et 11 |
| oxlint et oxfmt | Tâche 1, step 4 |
| Vitest | Tâches 1, 2, 6 |
| Playwright | Tâche 6 |
| lefthook | Tâches 1 et 10 |
| Tokens « industriel sombre » | Tâche 6, step 3 |
| Premières primitives d'interface | Tâche 7 |
| `pnpm check` vert | Tâche 10, step 4 |
| Page d'accueil à la bonne direction artistique | Tâches 8 et 10, step 5 |

Hors périmètre du jalon, et c'est normal : aucun `bc-*`, aucune authentification, aucun `use cache` en usage réel, aucun déploiement. Le drapeau `cacheComponents` est posé mais n'est exploité qu'au jalon 2, sur `/ateliers/[slug]`.
