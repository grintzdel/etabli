import { describe, expect, it } from 'vitest'

import { qrCodeOf, qrSvgDataUri } from './qr-code'

describe('qrCodeOf', () => {
  it('lays the modules on a square grid', () => {
    const code = qrCodeOf('qr-forge-laser-01')

    expect(code.size).toBeGreaterThan(0)
    expect(code.path).not.toBe('')
  })

  it('keeps every square inside the grid', () => {
    const code = qrCodeOf('qr-forge-laser-01')
    const coordinates = [...code.path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)]

    expect(coordinates.length).toBeGreaterThan(0)
    for (const [, x, y] of coordinates) {
      expect(Number(x)).toBeLessThan(code.size)
      expect(Number(y)).toBeLessThan(code.size)
    }
  })

  it('draws a different code for a different token', () => {
    expect(qrCodeOf('qr-forge-laser-01').path).not.toBe(qrCodeOf('qr-forge-prusa-01').path)
  })

  it('is stable for the same token', () => {
    expect(qrCodeOf('qr-forge-laser-01')).toEqual(qrCodeOf('qr-forge-laser-01'))
  })
})

describe('qrSvgDataUri', () => {
  it('carries an svg the browser can render without a network call', () => {
    const uri = qrSvgDataUri('qr-forge-laser-01')

    expect(uri.startsWith('data:image/svg+xml,')).toBe(true)
    expect(decodeURIComponent(uri.slice('data:image/svg+xml,'.length))).toContain('<svg xmlns=')
  })

  it('surrounds the code with the quiet zone the spec asks for', () => {
    const svg = decodeURIComponent(qrSvgDataUri('qr-forge-laser-01').slice('data:image/svg+xml,'.length))
    const { size } = qrCodeOf('qr-forge-laser-01')

    expect(svg).toContain(`viewBox="0 0 ${size + 8} ${size + 8}"`)
    expect(svg).toContain('translate(4 4)')
  })

  it('escapes into a uri that carries no raw angle bracket', () => {
    expect(qrSvgDataUri('qr-forge-laser-01')).not.toContain('<')
  })
})
