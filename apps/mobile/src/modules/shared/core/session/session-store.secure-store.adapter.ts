import * as SecureStore from 'expo-secure-store'

import type { ISessionStorePort } from './session-store.port'

const KEY = 'etabli.session.token'

export class SessionStoreSecureStoreAdapter implements ISessionStorePort {
  async read(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEY)
    } catch {
      return null
    }
  }

  async write(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEY, token)
  }

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY)
  }
}
