import { loadNfcManager } from '../lib/nfc-manager-module'
import { failure, NfcFailureCode, type NfcResult } from '../model/nfc'
import type { INfcReaderPort } from '../ports/nfc-reader.port'

export class NfcReaderNfcManagerAdapter implements INfcReaderPort {
  async isAvailable(): Promise<boolean> {
    const loaded = loadNfcManager()
    if (loaded === null) return false
    try {
      return await loaded.default.isSupported()
    } catch {
      return false
    }
  }

  async readTagId(): Promise<NfcResult<string>> {
    const loaded = loadNfcManager()
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
