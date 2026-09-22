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

## Le scan du QR code

**`expo-camera` tourne dans Expo Go.** Pas de *development build*, pas
d'entitlement, pas de compte développeur Apple payant : c'est ce que le passage
du NFC au QR code a acheté. `app.json` déclare la permission caméra par le
plugin `expo-camera` ; iOS la demande au premier scan.

**Le repli.** `dependencies.ts` interroge l'adapter caméra ; si la permission
est refusée ou impossible à demander, c'est l'adapter `manual` qui répond, et le
jeton se saisit à la main dans une feuille modale — il est écrit en clair sous
le QR imprimé. L'écran ne sait pas laquelle des deux implémentations il tient.

Le QR lui-même s'imprime depuis le web, sur `/manage/machines/:id/qr`.

## Ce que l'application fait

```
connexion → l'annuaire se trie sur ma position → un atelier → ses machines
→ une machine → la semaine → je prends un créneau → mes réservations
→ Pointer → je scanne le QR → CHECKED_IN
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
| `check-in` | `ICheckInScannerPort` + `expo-camera` et `manual` |
| `geo` | `ILocationPort` + `expo-location` |

## Tests

```sh
pnpm --filter @etabli/mobile test
```

Le `core/` est testé au vitest : adapters HTTP sur `fetch` mocké, table de
traduction des refus, port de scan et port position sur leurs implémentations de
test. **Les écrans ne sont pas testés** — réduction assumée, détaillée au §9 de
la conception.
