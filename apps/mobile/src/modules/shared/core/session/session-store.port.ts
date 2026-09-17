export interface ISessionStorePort {
  read(): Promise<string | null>
  write(token: string): Promise<void>
  clear(): Promise<void>
}
