import type { ScanResult } from '../model/scan'

export interface ICheckInScannerPort {
  isAvailable(): Promise<boolean>
  scan(): Promise<ScanResult<string>>
}
