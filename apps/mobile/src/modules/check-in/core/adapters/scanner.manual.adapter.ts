import { failure, ScanFailureCode, type ScanResult } from '../model/scan'
import type { ICheckInScannerPort } from '../ports/check-in-scanner.port'

export class ScannerManualAdapter implements ICheckInScannerPort {
  constructor(private readonly ask: () => Promise<string | null>) {}

  isAvailable(): Promise<boolean> {
    return Promise.resolve(true)
  }

  async scan(): Promise<ScanResult<string>> {
    const token = await this.ask()
    if (token === null) return failure(ScanFailureCode.CANCELLED)
    const trimmed = token.trim()
    return trimmed.length === 0 ? failure(ScanFailureCode.UNREADABLE) : { ok: true, value: trimmed }
  }
}
