export interface IPasswordHasher {
  hash(plain: string): Promise<string>
  verify(plain: string, digest: string): Promise<boolean>
}
