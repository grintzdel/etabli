# @etabli/api-client

Le client HTTP que partagent `apps/web` et `apps/mobile`. **Aucune dépendance**, aucun code métier :
chaque module lui passe son propre vocabulaire d'échec.

## API

```ts
import { createApiClient, makeFailure, type Result } from '@etabli/api-client'

const client = createApiClient({
  baseUrl: 'http://localhost:3001',
  messages: FAILURE_MESSAGES,
  failureOf: bookingFailureOf,
  getAuthToken: () => readSessionToken(),
  cache: 'no-store',
})

const result: Result<Booking, BookingFailureCode> = await client.post(routes.bookings.create, { machineId, startAt })
```

| Export | Rôle |
|---|---|
| `createApiClient(config)` | rend `call`, `get`, `post`, `patch` — chacun retourne un `Result<A, C>` |
| `Result`, `Failure`, `makeFailure` | succès ou `{ code, message }` ; `makeFailure(messages)` fabrique le constructeur d'échec d'un module |
| `errorCodeOf(body)` | lit le `code` du corps d'erreur de l'API |
| `queryString(params)` | `undefined` et `null` tombent, les tableaux se répètent |
| `UNREACHABLE_STATUS` | `0` — un réseau qui ne répond pas, ou un 2xx dont le corps n'est pas du JSON |

## Choix

- **Le jeton est une propriété du client**, via `getAuthToken` (sync ou async). Côté web, il lit le
  cookie `httpOnly` ; côté mobile, `SessionTokenHolder`. D'où deux clients par adapter dès qu'un
  module sert du public et du privé : un anonyme cachable, un authentifié en `no-store`.
- **Le code prime sur le statut.** `failureOf(status, body)` lit le `code` d'abord ; cinq règles
  métier partagent le 409, le statut seul ne permet pas d'écrire la bonne phrase.
- **Pas de `put` ni de `delete`** : l'API n'en sert aucun.
- `timeoutMs` et `signal` existent mais sont éteints par défaut, pour que le `RequestInit` — et donc
  le cache de Next — ne bouge pas.

## Commandes

```bash
pnpm --filter @etabli/api-client build    # tsdown → dist/
pnpm --filter @etabli/api-client test     # 45 tests
```
