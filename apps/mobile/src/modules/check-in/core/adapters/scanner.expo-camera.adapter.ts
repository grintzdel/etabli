import { Camera } from 'expo-camera'
import { isDevice } from 'expo-device'

import { failure, ScanFailureCode, type ScanResult } from '../model/scan'
import type { ICheckInScannerPort } from '../ports/check-in-scanner.port'

export class ScannerExpoCameraAdapter implements ICheckInScannerPort {
  constructor(private readonly ask: () => Promise<string | null>) {}

  // A simulator reports the permission as grantable and then hands back a dead camera, so ask the hardware first.
  async isAvailable(): Promise<boolean> {
    if (!isDevice) return false

    const current = await Camera.getCameraPermissionsAsync().catch(() => null)
    if (current === null) return false
    return current.granted || current.canAskAgain
  }

  async scan(): Promise<ScanResult<string>> {
    const permission = await Camera.requestCameraPermissionsAsync().catch(() => null)
    if (permission === null || !permission.granted) return failure(ScanFailureCode.PERMISSION_DENIED)

    const token = await this.ask()
    if (token === null) return failure(ScanFailureCode.CANCELLED)
    const trimmed = token.trim()
    return trimmed.length === 0 ? failure(ScanFailureCode.UNREADABLE) : { ok: true, value: trimmed }
  }
}
