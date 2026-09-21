import { failure, NfcFailureCode, type NfcResult } from '../model/nfc'
import type { INfcReaderPort } from '../ports/nfc-reader.port'

export class NfcReaderManualAdapter implements INfcReaderPort {
  constructor(private readonly ask: () => Promise<string | null>) {}

  isAvailable(): Promise<boolean> {
    return Promise.resolve(true)
  }

  async readTagId(): Promise<NfcResult<string>> {
    const tag = await this.ask()
    if (tag === null) return failure(NfcFailureCode.CANCELLED)
    const trimmed = tag.trim()
    return trimmed.length === 0 ? failure(NfcFailureCode.UNREADABLE) : { ok: true, value: trimmed }
  }
}
