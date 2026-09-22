import type { MachineKind } from '../model/atelier'

export const COVER_KEYS = ['COVER_1', 'COVER_2', 'COVER_3', 'COVER_4'] as const

export type CoverKey = (typeof COVER_KEYS)[number]

export type PhotoKey = MachineKind | CoverKey

// Same sum-of-codepoints as the web's machine-photo.ts and cover-art.ts: an atelier must wear the
// same photograph on both apps, and nothing but this arithmetic keeps them agreeing.
const slugSum = (slug: string): number => [...slug].reduce((total, character) => total + character.codePointAt(0)!, 0)

export const photoKeyFor = (slug: string, kinds: ReadonlyArray<MachineKind>): PhotoKey =>
  kinds.length === 0 ? COVER_KEYS[slugSum(slug) % COVER_KEYS.length]! : kinds[slugSum(slug) % kinds.length]!
