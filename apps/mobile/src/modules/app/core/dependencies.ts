import { AtelierHttpAdapter } from '../../atelier/core/adapters/atelier.http.adapter'
import { BookingHttpAdapter } from '../../booking/core/adapters/booking.http.adapter'
import { LocationExpoAdapter } from '../../geo/core/adapters/location.expo.adapter'
import { IdentityHttpAdapter } from '../../identity/core/adapters/identity.http.adapter'
import { requestManualTag } from '../../nfc/core/adapters/manual-tag-request'
import { NfcReaderManualAdapter } from '../../nfc/core/adapters/nfc-reader.manual.adapter'
import { NfcReaderNfcManagerAdapter } from '../../nfc/core/adapters/nfc-reader.nfc-manager.adapter'
import type { INfcReaderPort } from '../../nfc/core/ports/nfc-reader.port'
import { SessionStoreSecureStoreAdapter } from '../../shared/core/session/session-store.secure-store.adapter'
import { API_BASE_URL } from './env'

const nfcManager = new NfcReaderNfcManagerAdapter()
const manualTag = new NfcReaderManualAdapter(requestManualTag)

const nfc: INfcReaderPort = {
  isAvailable: () => Promise.resolve(true),
  readTagId: async () => ((await nfcManager.isAvailable()) ? nfcManager.readTagId() : manualTag.readTagId()),
}

export const dependencies = {
  atelier: new AtelierHttpAdapter(API_BASE_URL),
  booking: new BookingHttpAdapter(API_BASE_URL),
  identity: new IdentityHttpAdapter(API_BASE_URL),
  location: new LocationExpoAdapter(),
  nfc,
  sessionStore: new SessionStoreSecureStoreAdapter(),
} as const
