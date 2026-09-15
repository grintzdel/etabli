export interface IssuedToken {
  readonly token: string
  readonly expiresAt: Date
}

export interface TokenClaims {
  readonly userId: string
}

export interface ITokenIssuer {
  issue(userId: string): Promise<IssuedToken>
  verify(token: string): Promise<TokenClaims>
}
