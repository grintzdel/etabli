import * as SecureStore from 'expo-secure-store'

import type { ISessionStorePort } from './session-store.port'

export class SessionStoreSecureStoreAdapter implements ISessionStorePort {
  private readonly key = 'etabli.session.token'

  async read(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.key)
    } catch {
      return null
    }
  }

  async write(token: string): Promise<void> {
    await SecureStore.setItemAsync(this.key, token)
  }

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(this.key)
  }
}
