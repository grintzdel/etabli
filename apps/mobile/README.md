# @etabli/mobile

L'application Expo / React Native d'Établi. Elle n'est pas le web en petit : elle existe pour les
deux gestes que le navigateur ne sait pas faire — **scanner le QR code collé sur une machine** et
**savoir où l'on est**. Elle parle à la même API que le web (`apps/api`) et partage ses comptes, ses
ateliers et ses réservations. Conception : `docs/superpowers/specs/2026-09-17-etabli-mobile-design.md`.

```
annuaire trié par distance → un atelier → une machine → la semaine → un créneau
→ connexion (modale, le créneau survit) → mes réservations → Pointer → scan du QR → CHECKED_IN
```

## Lancer — Expo Go sur téléphone réel

**Expo Go suffit, aucun development build n'est requis** : `expo-camera`, `expo-location`,
`expo-secure-store` et `react-native-maps` tournent tous dans Expo Go.

1. Installer **Expo Go** sur le téléphone (App Store / Play Store).
2. Mettre le téléphone et l'ordinateur sur **le même réseau wifi**.
3. Depuis la racine du dépôt :

   ```bash
   pnpm install
   pnpm build:packages      # @etabli/contract et @etabli/api-client sont consommés compilés
   pnpm dev                 # API :3001 + web :3000 en fond, Expo au premier plan
   ```

   ou, si l'API tourne déjà (par exemple `docker compose up`) : `pnpm dev:mobile`.
4. Scanner le QR code affiché par Expo avec l'appareil photo (iOS) ou depuis Expo Go (Android).

**L'URL de l'API est déduite toute seule** de l'adresse du serveur Expo
(`Constants.expoConfig.hostUri`), port 3001 : le téléphone joint déjà cette machine pour charger le
bundle. Rien à configurer quand l'adresse wifi change.

| Variable | Obligatoire | Rôle |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | non | forçage, pour un tunnel (`expo start --tunnel`) ou une API distante |

Copier `.env.example` en `.env` seulement pour ce cas. Derrière un tunnel sans elle, l'app retombe
sur `localhost`, que le téléphone ne joint pas.

> **Hôte, conteneur, téléphone.** Avec `docker compose up`, l'API est publiée sur le port 3001 **de
> l'ordinateur** : c'est cette adresse-là, sur le wifi, que le téléphone appelle — jamais le nom
> `api` du réseau compose, qui n'existe qu'entre conteneurs.

Simulateur : `pnpm --filter @etabli/mobile ios` ou `android`. Le simulateur n'a pas de caméra : le
scan retombe sur la saisie manuelle du jeton (voir plus bas).

## Comptes de démonstration

Ceux du seed, mot de passe **`etabli-2026`**. Pour le pointage : `membre@etabli.test` (déjà habilité),
ou `demo@etabli.test` pour le parcours complet depuis la demande d'habilitation — voir le
[parcours de démonstration](../../README.md#parcours-de-démonstration).
Liste complète dans le [README racine](../../README.md#comptes-de-démonstration).

## Tester le scan QR

Le QR code porte le `checkInToken` de la machine — un jeton généré par le serveur, unique sur tout
le réseau. Le scan déclenche `POST /bookings/:id/check-in` ; l'API vérifie que le jeton est celui de
la machine réservée et que la fenêtre de pointage est ouverte (15 min avant le début, 30 min après).

**Préparer le QR**

1. `pnpm db:demo:docker` (ou `pnpm db:demo` sur la base de `.env`) **juste avant la démo** : le seed place un créneau de `membre@etabli.test` sur la
   **Shapeoko 4 XXL** de La Forge, commencé il y a 10 minutes — sa fenêtre est donc ouverte pendant
   ~40 minutes.
2. Sur le web, se connecter en `fabmanager.forge@etabli.test`, ouvrir `/manage/machines`, puis
   « QR de pointage » de la Shapeoko — ou directement
   `http://localhost:3000/manage/machines/0a7e1f00-0000-4000-8000-000000000104/qr`.
   Imprimer, ou laisser la page à l'écran. Le jeton (`qr-forge-cnc-01`) est écrit en clair dessous.

**Scénario nominal**

1. Sur le téléphone, onglet Réservations → se connecter en `membre@etabli.test`.
2. Ouvrir le créneau Shapeoko du jour → **Pointer**.
3. Au premier scan, iOS/Android demande l'accès à l'appareil photo → accepter.
4. Cadrer le QR → l'app envoie le jeton → le créneau passe à **Pointée** (`CHECKED_IN`), l'heure du
   pointage s'affiche et le bouton disparaît.
5. Côté web, `/manage/bookings` (fabmanager) montre la ligne pointée par `QR`.

**Cas d'erreur à montrer**

| Geste | Retour attendu |
|---|---|
| Scanner le QR d'une **autre** machine (ex. `/manage/machines/0a7e1f00-0000-4000-8000-000000000101/qr`, la Trotec) | « Ce QR code n'est pas celui de la machine réservée. » (`CHECK_IN_TOKEN_MISMATCH`) |
| Scanner un QR quelconque (un QR qui n'est pas d'Établi) | même refus : le serveur ne reconnaît pas le jeton |
| Pointer une seconde fois | impossible depuis l'app — le bouton disparaît ; l'API refuse de toute façon (`BOOKING_NOT_CHECK_INABLE`) pour que le premier pointage reste seul opposable |
| Pointer hors fenêtre | le bouton n'est pas proposé ; l'API répond `CHECK_IN_WINDOW_CLOSED` |
| **Refuser** la permission caméra | « Sans accès à l'appareil photo, le QR code ne peut pas être scanné. » ; au tap suivant, la permission ne pouvant plus être redemandée, une feuille de saisie manuelle du jeton s'ouvre |
| Fermer la caméra sans scanner | « Scan interrompu. », le créneau reste confirmé |

La saisie manuelle est le repli voulu, pas un contournement : le jeton est imprimé sous le QR pour
le cas d'une caméra refusée ou absente. Le serveur applique exactement les mêmes vérifications.

## Tester la géolocalisation

L'annuaire (premier onglet) demande la position au premier affichage
(`expo-location`, permission « pendant l'utilisation »).

| Cas | Comportement |
|---|---|
| Permission **accordée** | `GET /ateliers?lat=…&lng=…&radiusKm=1000` ; chaque carte d'atelier affiche sa distance, la liste est triée de la plus proche à la plus lointaine |
| Permission **refusée** | pas d'erreur bloquante : l'annuaire appelle `GET /ateliers` sans coordonnées, n'affiche aucune distance et le dit — « Sans votre position, l'annuaire n'est pas trié par distance. » — avec un bouton **Réessayer** |
| Position illisible (GPS coupé, délai) | même repli, avec « Votre position n'a pas pu être lue. » |

Pour vérifier le tri : les ateliers du seed sont répartis entre Montreuil, Paris, Lyon, Toulouse,
Nantes, Marseille, Lille et Bordeaux. Depuis l'Île-de-France, Montreuil et Paris sortent en tête ;
un simulateur iOS réglé sur Lyon (*Features → Location → Custom Location*, 45.76 / 4.83) fait
remonter les ateliers lyonnais.

Pour rejouer le refus : Réglages du téléphone → Expo Go → Position → Jamais, puis revenir dans
l'app.

## Organisation

`src/app/` ne porte que des coquilles Expo Router : un import de `src/features/`, et rien d'autre.

```
src/
├── app/                 _layout (Stack + Stack.Protected), (tabs) annuaire/réservations/compte,
│                        (auth)/login en modale, ateliers/[slug], machines/[id], bookings/[id],
│                        habilitations, onboarding
├── features/            orchestrateurs d'écran
└── modules/
    ├── app/core         URL de l'API, câblage des adapters (dependencies.ts)
    ├── shared/core      session : port + adapter expo-secure-store, SessionTokenHolder
    ├── identity         connexion, inscription, GET /auth/me, SessionProvider
    ├── atelier          annuaire, carte, fiche atelier, fiche machine, onboarding
    ├── booking          semaine, réservation, liste, détail, pointage
    ├── certification    mes habilitations, demande
    ├── check-in         ICheckInScannerPort — adapters expo-camera et saisie manuelle
    └── geo              ILocationPort — adapter expo-location
```

Chaque module suit `core/{model,ports,adapters,lib}` + `ui/{components,hooks}` ; `core/` n'importe
ni React ni React Native.

## Choix techniques

- **Le jeton vit dans `expo-secure-store`** (trousseau du système), jamais dans `AsyncStorage`. Il
  est lu une fois au démarrage ; un 401 en cours de route l'efface et repasse en anonyme.
- **L'app s'ouvre sans compte.** Seuls le détail d'une réservation, les habilitations et
  l'onboarding sont derrière `Stack.Protected`.
- **Le refus se lit dans le `code` du corps**, pas dans le statut : cinq règles partagent le 409.
- **TanStack Query à la racine** pour tous les écrans ; états loading / error / empty / success
  rendus par chaque écran.
- **Hermes s'arrête à l'ES2022** : `lib: ["DOM", "ES2022"]` dans le tsconfig pour que `toSorted` &
  co. soient une erreur de type plutôt qu'un crash sur l'appareil.

## Tests

```bash
pnpm --filter @etabli/mobile test        # 92 tests Vitest
pnpm --filter @etabli/mobile typecheck
```

Modèles, tables de traduction des refus, calcul des créneaux, construction de la requête de
l'annuaire, URL de l'API. **Les écrans ne sont pas testés** : monter React Native sous Vitest demande
un preset et des mocks natifs pour un parcours qui se vérifie à la main, sur téléphone.

## Build de production

Non préparé : la soutenance se fait sur Expo Go. `app.json` porte déjà `bundleIdentifier` et
`package` (`org.etabli.mobile`) ; une build EAS demanderait `eas build:configure` et, pour Android,
une clé Google Maps.
