import type { NfcResult } from '../model/nfc'

export interface INfcReaderPort {
  isAvailable(): Promise<boolean>
  readTagId(): Promise<NfcResult<string>>
}
