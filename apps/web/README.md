# @etabli/web

L'application Next.js 16.3 d'Établi : App Router, Server Components par défaut, Server Actions pour
toutes les mutations, `cacheComponents` (PPR). Elle ne contient aucune logique métier — elle parle à
`apps/api` par des adapters HTTP.

## Lancer

Depuis la racine du dépôt, l'API étant lancée (voir [`apps/api`](../api/README.md)) :

```bash
pnpm build:packages      # contract, api-client
pnpm dev:web             # next dev sur :3000
```

Ou tout d'un coup : `pnpm dev` (API, web et Expo), ou `docker compose up --build` sans rien
installer.

| Variable | Moment | Rôle |
|---|---|---|
| `API_URL` | runtime | où le serveur Next joint l'API — `http://localhost:3001` en dev |
| `COOKIE_SECURE` | runtime | `true` derrière HTTPS ; pose le cookie de session en `Secure` |
| `NEXT_PUBLIC_SITE_URL` | build | URLs canoniques, `sitemap.xml`, `robots.txt`, Open Graph |

## Scripts

| Script | Effet |
|---|---|
| `pnpm --filter @etabli/web dev` | serveur de développement |
| `pnpm --filter @etabli/web build` | `next build` en `output: 'standalone'` |
| `pnpm --filter @etabli/web start` | sert la build |
| `pnpm --filter @etabli/web test` | 315 tests Vitest (modèles, composants, graphe d'imports) |
| `pnpm --filter @etabli/web test:e2e` | E2E Playwright — `pnpm db:test:up` d'abord |

## Organisation

```
src/
├── app/                  routes seulement — coquilles qui rendent une page de features/
│   ├── (marketing)/      accueil, fonctionnalités, FAQ, annuaire — PPR
│   ├── (auth)/           connexion, inscription — statiques
│   ├── (app)/            espace membre, /manage, /admin — dynamique, chrome par membre
│   ├── (print)/          QR de pointage imprimable — sans AppShell
│   └── api/machines/[id]/availability   le seul Route Handler (BFF du calendrier)
├── features/             orchestrateurs de page : hooks + composants, aucun composant défini ici
├── modules/<module>/
│   ├── core/             model, ports, adapters (http + in-memory), lib — ni React ni Next
│   └── react/            composants purs, hooks
├── server/               Server Actions, container des adapters, session, shells
├── proxy.ts              redirection des préfixes privés sans cookie (confort, pas sécurité)
└── architecture/         test du graphe d'imports
```

Modules : `atelier`, `booking`, `certification`, `identity`, `overview`.

## Choix techniques

- **Server Components par défaut.** `'use client'` ne sert qu'aux formulaires (`useActionState`), au
  calendrier, à la carte de l'annuaire et aux error boundaries.
- **Un seul Route Handler.** `/api/machines/[id]/availability` détient le cookie `httpOnly` et sert
  la semaine que React Query pagine. Toutes les autres écritures sont des Server Actions.
- **Cache.** L'annuaire et les fiches sont sous `'use cache'` + `cacheTag('ateliers')` ; les actions
  d'administration et de gestion du parc appellent `updateTag('ateliers')`.
- **Session.** Cookie `httpOnly` posé par Next ; le serveur lit le jeton et le passe à l'API en
  `Bearer`. Le navigateur ne voit jamais le JWT.
- **Autorisation.** `proxy.ts` redirige, mais la barrière est l'API (gardes JWT et rôles,
  cloisonnement par atelier). Une page `/admin/*` ou `/manage/*` n'obtient ses données qu'à travers
  l'API, avec le jeton du membre : sans le rôle, l'API refuse et rien ne fuit.
- **Thème en base**, rendu par le serveur en `data-theme` : pas de flash, pas de `localStorage`.

Le détail de ces arbitrages est dans le [README racine](../../README.md#choix-darchitecture).

## Docker

Le `Dockerfile` **racine** est celui de cette application (stages `deps` → `builder` → `runner`,
standalone, utilisateur `node`). Voir la section [Docker](../../README.md#docker) du README racine.
