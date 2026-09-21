# Établi mobile — document de conception

**Projet fil rouge M2 EEMI 2026 · Expo / React Native**
Auteur : Mathis · Document créé le 17 septembre 2026

---

## Sommaire

1. [Pourquoi une application mobile](#1--pourquoi-une-application-mobile)
2. [Périmètre](#2--périmètre)
3. [Parcours de démonstration](#3--parcours-de-démonstration)
4. [Architecture](#4--architecture)
5. [Session et token](#5--session-et-token)
6. [Le lecteur NFC](#6--le-lecteur-nfc)
7. [La position](#7--la-position)
8. [Les refus et leurs phrases](#8--les-refus-et-leurs-phrases)
9. [Tests](#9--tests)
10. [Mise en route iOS — le point critique](#10--mise-en-route-ios--le-point-critique)
11. [Écarts assumés](#11--écarts-assumés)
12. [Limites connues](#12--limites-connues)

---

## 1 · Pourquoi une application mobile

Le §6 de la spec produit répond déjà, et il faut le prendre au mot :

> Sans NFC, le check-in est déclaratif — donc faux, donc inutile pour mesurer
> l'occupation réelle ou objecter un no-show. Le téléphone apporte ici une
> preuve de présence physique que le web ne peut structurellement pas produire.

L'application mobile n'est donc pas une réduction du site à un petit écran.
Elle existe pour deux gestes que le navigateur ne sait pas faire : **approcher
un téléphone d'une machine**, et **savoir où l'on est**. Tout le reste n'est là
que pour amener le membre jusqu'à ces deux gestes.

Le corollaire tient en une phrase : le jour où l'application mobile ne ferait
que redire le web, elle n'aurait plus de raison d'être.

## 2 · Périmètre

**Dedans.** Connexion, annuaire trié sur la position réelle, fiche atelier,
fiche machine, semaine de créneaux, réservation, liste et détail des
réservations, pointage NFC.

**Dehors.** Inscription, habilitations, écrans fabmanager et administrateur,
paramètres, notifications, consultation hors ligne. Le §7 de la spec produit
les date, et aucun n'est sur le chemin du pointage.

Réserver est **dedans** alors que le web le fait déjà. C'est une exception
assumée : sans elle, la démonstration impose d'ouvrir un navigateur au milieu
du parcours pour créer le créneau qu'on va ensuite biper.

## 3 · Parcours de démonstration

```
connexion
  → l'annuaire se trie sur ma position
  → un atelier          → ses machines
  → une machine         → la semaine
  → je prends 14 h      → mes réservations
  → Pointer             → j'approche le tag
  → CHECKED_IN
```

Sept écrans et deux layouts, aucun détour par le navigateur.

| Fichier | Écran |
|---|---|
| `app/_layout.tsx` | polices, providers, redirection sans session |
| `app/(auth)/login.tsx` | connexion |
| `app/(tabs)/_layout.tsx` | les trois onglets |
| `app/(tabs)/index.tsx` | annuaire géolocalisé |
| `app/(tabs)/bookings.tsx` | mes réservations |
| `app/(tabs)/account.tsx` | compte, déconnexion |
| `app/ateliers/[slug].tsx` | fiche atelier |
| `app/machines/[id].tsx` | fiche machine, semaine, réserver |
| `app/bookings/[id].tsx` | détail, et le bouton Pointer |

## 4 · Architecture

Le mobile parle à **`apps/api`**, l'implémentation NestJS. La v1
(`packages/server`) est promise au retrait : écrire un client neuf contre elle
serait du travail à refaire.

Les fichiers de `app/` sont des **coquilles**, exactement comme les routes du
web : ils importent une page de `src/features/` et la rendent. Rien d'autre.
Toute la logique vit dans `src/modules/`.

```
src/modules/
├── shared/core/http/      client fetch, Result, traduction des erreurs
├── shared/core/session/   le token — port + adapter expo-secure-store
├── identity/  core/{model,ports,adapters} · ui/
├── atelier/   core/{model,ports,adapters} · ui/
├── booking/   core/{model,ports,adapters} · ui/
├── nfc/       core/ports/nfc-reader.port.ts · adapters/{nfc-manager, manual}
└── geo/       core/ports/location.port.ts  · adapters/expo-location
```

Routes et types viennent de **`@etabli/contract`**, les composants de
**`@etabli/ui`**. Le contrat porte déjà tout ce qui compte : `AtelierSummary`
expose `distanceKm`, et `BookingDetail` expose `canCheckIn`. Le mobile ne
redérive aucune règle — il lit ce que le serveur a décidé.

### Ce qu'on ne partage pas, et pourquoi

La spec produit anticipait ce moment au §8 :

> `core/` n'important ni React ni Next, ces modules seront déplaçables tels
> quels dans un package partagé avec l'application mobile le jour venu.

Le consommateur existe maintenant, et on ne le fait quand même pas. Ce qui
serait partageable — modèles et routes — vit **déjà** dans `@etabli/contract`.
Ce qui reste dans `apps/web/src/modules/*/core/` est le wrapper `fetch`, et il
ne dit pas la même chose des deux côtés : le web lit un cookie httpOnly que
Next a posé, le mobile lit un token qu'il a rangé lui-même. Extraire cent
lignes de différence en rouvrant soixante fichiers d'un web vert serait un
mauvais échange.

Cette décision se révise si un troisième consommateur apparaît.

### L'état

Pas de Redux — le §8.13 de la spec produit l'exclut déjà pour le web. Les
données serveur passent par **TanStack Query**, qui tient le cache, le
rafraîchissement et l'état de chargement. C'est le second consommateur que
`CLAUDE.md` annonçait : sur le web le `QueryClient` vit dans `MachineWeek` et
n'en sort pas ; ici tous les écrans lisent le réseau, donc il vit à la racine.

## 5 · Session et token

`POST /auth/login` rend le token dans le corps de la réponse. Le mobile le
range dans **`expo-secure-store`** — le trousseau du système — et non dans
`AsyncStorage`, qui écrit en clair sur le disque. Chaque requête le porte en
`Authorization: Bearer`.

Le token est lu une fois au démarrage : présent, on entre dans les onglets ;
absent ou refusé par `GET /auth/me`, on va sur la connexion. Un **401** en
cours de route efface le token et ramène à la connexion, sans message
d'erreur — une session expirée n'est pas une panne.

Pas de rafraîchissement de token : l'API n'en émet pas, et la durée de vie
couvre largement une démonstration.

## 6 · Le lecteur NFC

Un port, une méthode utile :

```ts
export interface INfcReaderPort {
  isAvailable(): Promise<boolean>
  readTagId(): Promise<NfcResult<string>>
}
```

`NfcResult<T>` est le même patron que le `BookingResult<T>` du web : un
succès porteur de valeur ou un échec porteur de code — jamais une exception
qui remonte jusqu'à l'écran.

Deux implémentations :

- **`nfc-manager`** — `react-native-nfc-manager`, la vraie, sur appareil ;
- **`manual`** — une saisie du tag à la main, pour développer au simulateur.

L'écran ne sait pas laquelle il tient. C'est ce qui permet trois choses : de
développer sans matériel, de tester le pointage sans téléphone, et de ne pas
perdre la démonstration si l'appareil n'est pas celui qu'on croyait.

Le tag lu part tel quel à `POST /bookings/:id/check-in`, qui vérifie qu'il est
bien celui de la machine réservée — règle 6 du §5, `NfcTagMismatchError`, 409.
Le téléphone ne vérifie rien : il lit et transmet.

## 7 · La position

`expo-location`, derrière un port lui aussi.

Refuser la permission n'est pas une erreur. Sans position, l'annuaire appelle
`GET /ateliers` sans `lat`, `lng` ni `radiusKm` ; `distanceKm` vaut `null`, la
liste n'est pas triée par distance, et l'écran le dit en une phrase avec un
bouton pour réessayer. Le contrat prévoit déjà ce cas — `distanceKm` est
nullable par construction.

Les trois paramètres voyagent ensemble ou pas du tout : le schema de l'API
refuse un `lat` sans `radiusKm`.

## 8 · Les refus et leurs phrases

Cinq règles métier distinctes répondent **409** au pointage et à la
réservation. Le status ne suffit donc pas à écrire un message : l'adapter lit
le `_tag` du corps d'abord, et ne retombe sur le status que faute de mieux.

C'est la leçon que les adapters web ont apprise à leurs dépens — trois d'entre
eux rendaient un refus comme une panne. **Quand une route porte une erreur
typée, l'adapter qui l'appelle doit porter son code.**

La table `code → phrase française` vit dans `booking/core/model/`. Elle est
testable sans écran et sans réseau, et c'est là que les messages du §11 de la
spec produit prennent leur forme définitive.

## 9 · Tests

Le `core/` est testé au vitest, dans la suite existante :

| Cible | Comment |
|---|---|
| Adapters HTTP | `fetch` mocké, une assertion par code d'erreur |
| Traduction des refus | table pure, aucune dépendance |
| Port NFC | implémentation de test, aucun matériel |
| Port position | implémentation de test, permission accordée et refusée |

**Les écrans ne sont pas testés.** Monter React Native sous vitest demande un
preset et des mocks natifs, pour un parcours qui se vérifie à la main en trente
secondes. C'est une réduction assumée, pas un oubli — elle est ici pour qu'on
puisse la reprocher.

## 10 · Mise en route iOS — le point critique

**Le NFC ne tourne pas dans Expo Go.** Il faut un *development build*.

Sur iOS, Core NFC exige la capability « Near Field Communication Tag Reading ».
Une équipe personnelle gratuite **ne peut pas** l'ajouter : il faut le programme
développeur Apple, 99 $ par an, et le provisioning prend des jours plutôt que
des heures.

C'est la seule chose qui peut faire capoter la démonstration, et elle ne se
règle pas la veille.

Ce qu'il faut, dans l'ordre :

1. le compte développeur Apple, actif ;
2. `npx expo prebuild --platform ios` ;
3. `NFCReaderUsageDescription` dans l'`Info.plist` et l'entitlement
   `com.apple.developer.nfc.readersession.formats` ;
4. une compilation EAS ou Xcode, installée sur l'appareil.

**Le repli, si le compte n'arrive pas à temps.** Le port rend l'échange
indolore côté code : l'adapter `manual` est câblé, le tag se saisit à la main,
et le reste du parcours est intact. Le geste n'est alors plus prouvé — c'est
précisément ce que le NFC apportait — mais la démonstration tient. Un appareil
Android emprunté est la meilleure sortie : gratuit, et le geste redevient vrai.

Cette décision se prend **maintenant**, pas à l'écriture du dernier écran.

## 11 · Écarts assumés

**Le mobile réserve, alors que le web réserve déjà.** Pour que la démonstration
ne quitte pas le téléphone. C'est le seul endroit où l'application redit le web.

**Les écrans ne sont pas testés.** Détaillé au §9.

**On ne partage pas le `core/` du web.** Détaillé au §4, contre la lettre du §8
de la spec produit. Le contrat porte déjà la part non duplicable.

## 12 · Limites connues

L'API tourne en local. Un téléphone sur le wifi ne joint pas `localhost` : il
faut l'adresse IP de la machine sur le réseau, dans `EXPO_PUBLIC_API_URL`. Le
wifi d'une salle de cours isole souvent ses clients les uns des autres — à
vérifier avant le jour J, ou à contourner par un partage de connexion depuis le
téléphone.

Pas de hors-ligne. Ouvrir l'application sans réseau montre des écrans vides
avec un message, pas les dernières réservations connues. Le §7 de la spec
produit le date en v2.

Le pointage n'est pas idempotent, côté serveur comme côté écran : un second
appui répond 409 et le dit. C'est voulu — la première empreinte doit rester
opposable à un no-show.
