# @etabli/ui

Les primitives partagées entre `apps/web` (Next + Tailwind) et `apps/mobile` (Expo + React Native).

## Ce qui est réellement partagé

Les **tokens** (`src/tokens/`) et le **contrat de props** (`*.types.ts`). Pas le rendu : `<button>`
n'existe pas en React Native et les classes Tailwind n'y sont pas interprétées.

Chaque primitive existe donc en deux fichiers :

| Fichier | Cible | Résolu par |
| --- | --- | --- |
| `Button.tsx` | DOM + Tailwind | Next, TypeScript par défaut |
| `Button.native.tsx` | `Pressable` + `StyleSheet` | Metro, TypeScript via `moduleSuffixes` |

Les deux importent les mêmes variantes depuis `button.types.ts`, de sorte qu'ajouter une variante
sans l'implémenter des deux côtés est une erreur de typage.

## Les trois réglages sans lesquels rien ne marche

- `apps/mobile/tsconfig.json` porte `"moduleSuffixes": [".native", ""]`. Sans lui, TypeScript
  typecheck l'app mobile contre les props DOM.
- `apps/mobile/metro.config.js` force `react`, `react-dom` et `react-native` sur la copie de l'app.
  Sans lui, pnpm en livre une seconde et tous les hooks explosent.
- `apps/web/src/app/globals.css` déclare `@source '../../../../packages/ui/src'`. Sans lui, Tailwind
  ne voit pas les classes de ce package et les composants sortent sans style.

## Tokens

`src/tokens/colors.ts` est la source unique. `src/tokens/theme.css` en est **généré** :

```sh
pnpm --filter @etabli/ui run generate:theme
```

`theme-css.test.ts` régénère et compare, donc une édition manuelle du CSS fait tomber la CI.

## Limite connue

`expo start --web` résout `Button.tsx` (la variante Tailwind) sans feuille Tailwind chargée : le
rendu sort non stylé. Ajouter des `*.web.tsx` réexportant la variante native si ce mode devient utile.
