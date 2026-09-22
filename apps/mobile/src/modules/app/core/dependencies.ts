import { AtelierHttpAdapter } from '../../atelier/core/adapters/atelier.http.adapter'
import { BookingHttpAdapter } from '../../booking/core/adapters/booking.http.adapter'
import { requestCameraScan } from '../../check-in/core/adapters/camera-scan-request'
import { requestManualToken } from '../../check-in/core/adapters/manual-token-request'
import { ScannerExpoCameraAdapter } from '../../check-in/core/adapters/scanner.expo-camera.adapter'
import { ScannerManualAdapter } from '../../check-in/core/adapters/scanner.manual.adapter'
import type { ICheckInScannerPort } from '../../check-in/core/ports/check-in-scanner.port'
import { LocationExpoAdapter } from '../../geo/core/adapters/location.expo.adapter'
import { IdentityHttpAdapter } from '../../identity/core/adapters/identity.http.adapter'
import { SessionStoreSecureStoreAdapter } from '../../shared/core/session/session-store.secure-store.adapter'
import { SessionTokenHolder } from '../../shared/core/session/session-token-holder'
import { API_BASE_URL } from './env'

const camera = new ScannerExpoCameraAdapter(requestCameraScan)
const manual = new ScannerManualAdapter(requestManualToken)

const scanner: ICheckInScannerPort = {
  isAvailable: () => Promise.resolve(true),
  scan: async () => ((await camera.isAvailable()) ? camera.scan() : manual.scan()),
}

const sessionToken = new SessionTokenHolder()

export const dependencies = {
  atelier: new AtelierHttpAdapter(API_BASE_URL),
  booking: new BookingHttpAdapter(API_BASE_URL, sessionToken.read),
  identity: new IdentityHttpAdapter(API_BASE_URL, sessionToken.read),
  location: new LocationExpoAdapter(),
  scanner,
  sessionStore: new SessionStoreSecureStoreAdapter(),
  sessionToken,
} as const
