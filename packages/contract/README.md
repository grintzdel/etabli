# @etabli/contract

Ce que l'API, le web et le mobile doivent dire de la même façon : les types des modèles échangés,
la table des routes et les codes d'erreur. **Aucune dépendance** — `zero-dependencies.test.ts` le
vérifie.

## Contenu

| Fichier | Rôle |
|---|---|
| `routes.ts` | la table des routes de l'API (`routes.bookings.checkIn`, `routes.me.profile`…) |
| `build-path.ts`, `path-template.ts` | remplir `/machines/:id` avec des paramètres typés |
| `error-code.ts` | `ApiErrorCode` — tous les codes que l'API peut émettre |
| `booking-eligibility.ts` | `bookingEligibilityOf` — ce qui manque pour réserver (`ANONYMOUS`, `NOT_MEMBER`, `CERTIFICATION_REQUIRED`, `CERTIFICATION_PENDING`, `READY`) |
| `atelier.ts`, `booking.ts`, `certification.ts`, `identity.ts`, `health.ts` | types des DTO échangés |

## Pourquoi un package

Un code d'erreur ou une route n'est plus une chaîne recopiée en trois exemplaires : **un renommage
côté API casse la compilation des deux clients** au lieu de les laisser retomber en silence sur
« service indisponible ». `bookingEligibilityOf` est ici parce que le web et le mobile la lisent
tous deux ; le serveur reste l'autorité, la fonction ne sert qu'à ne pas proposer un bouton voué au
refus.

## Commandes

```bash
pnpm --filter @etabli/contract build      # tsdown → dist/, consommé par les trois apps
pnpm --filter @etabli/contract test
```

Le package est consommé **compilé** : après une modification, `pnpm build:packages` (ou le
`tsdown --watch` que lance le compose de développement).
