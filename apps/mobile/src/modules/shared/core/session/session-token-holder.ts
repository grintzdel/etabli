export class SessionTokenHolder {
  private token: string | null = null

  read = (): string | null => this.token

  write(token: string | null): void {
    this.token = token
  }
}
