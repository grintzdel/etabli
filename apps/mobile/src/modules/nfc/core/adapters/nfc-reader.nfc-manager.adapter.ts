import { failure, NfcFailureCode, type NfcResult } from '../model/nfc'
import type { INfcReaderPort } from '../ports/nfc-reader.port'

interface NfcManagerModule {
  isSupported(): Promise<boolean>
  start(): Promise<void>
  requestTechnology(tech: string): Promise<unknown>
  getTag(): Promise<{ readonly id?: string | null } | null>
  cancelTechnologyRequest(): Promise<void>
}

interface NfcManagerPackage {
  readonly default: NfcManagerModule
  readonly NfcTech: { readonly Ndef: string }
}

// Expo Go ships no NFC native module, so the import itself is the availability probe.
const load = (): NfcManagerPackage | null => {
  try {
    return require('react-native-nfc-manager') as NfcManagerPackage
  } catch {
    return null
  }
}

export class NfcReaderNfcManagerAdapter implements INfcReaderPort {
  async isAvailable(): Promise<boolean> {
    const loaded = load()
    if (loaded === null) return false
    try {
      return await loaded.default.isSupported()
    } catch {
      return false
    }
  }

  async readTagId(): Promise<NfcResult<string>> {
    const loaded = load()
    if (loaded === null) return failure(NfcFailureCode.UNAVAILABLE)

    try {
      await loaded.default.start()
      await loaded.default.requestTechnology(loaded.NfcTech.Ndef)
      const tag = await loaded.default.getTag()
      const id = tag?.id
      return id === undefined || id === null || id.length === 0
        ? failure(NfcFailureCode.UNREADABLE)
        : { ok: true, value: id }
    } catch {
      return failure(NfcFailureCode.CANCELLED)
    } finally {
      await loaded.default.cancelTechnologyRequest().catch(() => undefined)
    }
  }
}
