import { describe, expect, it } from 'vitest'

import { colors, withAlpha } from './colors'
import { letterSpacing, text, tracking } from './typography'

const lightness = (hex: string): number =>
  [1, 3, 5].reduce((total, start) => total + Number.parseInt(hex.slice(start, start + 2), 16), 0)

describe('colors', () => {
  it('runs graphite from ground to ink, and flips that direction in the light scheme', () => {
    expect(lightness(colors.dark.graphite[950])).toBeLessThan(lightness(colors.dark.graphite[50]))
    expect(lightness(colors.light.graphite[950])).toBeGreaterThan(lightness(colors.light.graphite[50]))
  })

  it('defines the same rungs in both schemes', () => {
    expect(Object.keys(colors.light.graphite)).toStrictEqual(Object.keys(colors.dark.graphite))
    expect(Object.keys(colors.light.signal)).toStrictEqual(Object.keys(colors.dark.signal))
    expect(Object.keys(colors.light.status)).toStrictEqual(Object.keys(colors.dark.status))
  })
})

describe('withAlpha', () => {
  it('turns a hex token into an rgba string', () => {
    expect(withAlpha('#ff6a00', 0.4)).toBe('rgba(255, 106, 0, 0.4)')
  })
})

describe('letterSpacing', () => {
  it('resolves the em-based tracking against the scale size', () => {
    expect(letterSpacing('base', 'wide')).toBe(text.base.size * tracking.wide)
  })

  it('is flat at the normal tracking', () => {
    expect(letterSpacing('4xl', 'normal')).toBe(0)
  })
})
