export interface NfcManagerModule {
  isSupported(): Promise<boolean>
  start(): Promise<void>
  requestTechnology(tech: string): Promise<unknown>
  getTag(): Promise<{ readonly id?: string | null } | null>
  cancelTechnologyRequest(): Promise<void>
}

export interface NfcManagerPackage {
  readonly default: NfcManagerModule
  readonly NfcTech: { readonly Ndef: string }
}

// Expo Go ships no NFC native module, so the import itself is the availability probe.
export const loadNfcManager = (): NfcManagerPackage | null => {
  try {
    return require('react-native-nfc-manager') as NfcManagerPackage
  } catch {
    return null
  }
}
