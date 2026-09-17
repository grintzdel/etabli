import { describe, expect, it, vi } from 'vitest'

import { NfcFailureCode } from '../model/nfc'
import { NfcReaderManualAdapter } from './nfc-reader.manual.adapter'

describe('NfcReaderManualAdapter', () => {
  it('stands in for a reader on a phone that has none', async () => {
    await expect(new NfcReaderManualAdapter(() => Promise.resolve(null)).isAvailable()).resolves.toBe(true)
  })

  it('hands back the tag that was typed, trimmed', async () => {
    const result = await new NfcReaderManualAdapter(() => Promise.resolve('  04:A2:24:B1 ')).readTagId()

    expect(result).toEqual({ ok: true, value: '04:A2:24:B1' })
  })

  it('refuses a cancelled prompt without raising', async () => {
    const result = await new NfcReaderManualAdapter(() => Promise.resolve(null)).readTagId()

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(NfcFailureCode.CANCELLED)
  })

  it('refuses an empty tag', async () => {
    const result = await new NfcReaderManualAdapter(() => Promise.resolve('   ')).readTagId()

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(NfcFailureCode.UNREADABLE)
  })

  it('asks once per read', async () => {
    const ask = vi.fn().mockResolvedValue('04')
    await new NfcReaderManualAdapter(ask).readTagId()

    expect(ask).toHaveBeenCalledOnce()
  })
})
