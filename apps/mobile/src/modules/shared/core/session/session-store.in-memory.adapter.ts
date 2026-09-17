import type { ISessionStorePort } from './session-store.port'

export class SessionStoreInMemoryAdapter implements ISessionStorePort {
  private token: string | null = null

  constructor(initial: string | null = null) {
    this.token = initial
  }

  read(): Promise<string | null> {
    return Promise.resolve(this.token)
  }

  write(token: string): Promise<void> {
    this.token = token
    return Promise.resolve()
  }

  clear(): Promise<void> {
    this.token = null
    return Promise.resolve()
  }
}
