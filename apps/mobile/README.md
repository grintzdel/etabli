# Établi mobile

Application Expo / React Native du projet fil rouge. Elle existe pour les deux
gestes que le navigateur ne sait pas faire : **approcher un téléphone d'une
machine** et **savoir où l'on est**. La conception est décrite par
`docs/superpowers/specs/2026-09-17-etabli-mobile-design.md`.

## Lancer

Le mobile parle à l'API. Depuis la racine du dépôt :

```sh
pnpm build:packages   # @etabli/contract est consommé compilé
pnpm dev:api          # l'API NestJS sur :3001
pnpm dev:mobile       # Expo
```

`pnpm dev` lance l'autre implémentation du back (`packages/server`, v1) sur le
même port. Les deux servent les mêmes routes, et les adapters lisent les deux
formes d'erreur (`code` côté NestJS, `_tag` côté Effect), donc le parcours tient
dans les deux cas.

**Un téléphone sur le wifi ne joint pas `localhost`.** Copier `.env.example` en
`.env` et y mettre l'adresse IP de la machine sur le réseau
(`ipconfig getifaddr en0`) :

```
EXPO_PUBLIC_API_URL=http://192.168.1.10:3001
```

Comptes de démonstration : ceux du seed, mot de passe `etabli-2026`.
`membre@etabli.test` a des adhésions, des habilitations et des créneaux.

## NFC

**Le NFC ne tourne pas dans Expo Go.** Il faut un *development build*, et sur
iOS la capability « Near Field Communication Tag Reading », que seule une équipe
de développeur Apple payante peut ajouter :

```sh
npx expo prebuild --platform ios
```

`app.json` porte déjà `NFCReaderUsageDescription` et l'entitlement
`com.apple.developer.nfc.readersession.formats`.

**Le repli.** `dependencies.ts` interroge le lecteur natif ; s'il est absent,
c'est l'adapter `manual` qui répond, et le tag se saisit à la main dans une
feuille modale. L'écran ne sait pas laquelle des deux implémentations il tient.
Le geste n'est alors plus prouvé, mais la démonstration tient.

## Ce que l'application fait

```
connexion → l'annuaire se trie sur ma position → un atelier → ses machines
→ une machine → la semaine → je prends un créneau → mes réservations
→ Pointer → j'approche le tag → CHECKED_IN
```

## Structure

`src/app/` ne contient que des coquilles : chaque fichier importe une page de
`src/features/` et la rend. Toute la logique vit dans `src/modules/` :

| Module | Contenu |
|---|---|
| `shared/core/http` | client `fetch`, `Result`, lecture du code d'erreur |
| `shared/core/session` | le token — port + adapter `expo-secure-store` |
| `app/core` | l'URL de l'API, et le câblage des adapters |
| `identity` | connexion, `GET /auth/me`, contexte de session |
| `atelier` | annuaire, fiche atelier, fiche machine |
| `booking` | semaine, réservation, liste, détail, pointage |
| `nfc` | `INfcReaderPort` + `nfc-manager` et `manual` |
| `geo` | `ILocationPort` + `expo-location` |

## Tests

```sh
pnpm --filter @etabli/mobile test
```

Le `core/` est testé au vitest : adapters HTTP sur `fetch` mocké, table de
traduction des refus, port NFC et port position sur leurs implémentations de
test. **Les écrans ne sont pas testés** — réduction assumée, détaillée au §9 de
la conception.
