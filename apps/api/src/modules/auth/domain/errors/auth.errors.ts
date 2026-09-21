import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common'

export class InvalidCredentialsError extends UnauthorizedException {
  constructor() {
    super({ code: 'INVALID_CREDENTIALS', message: 'Adresse e-mail ou mot de passe incorrect' })
  }
}

export class EmailAlreadyTakenError extends ConflictException {
  constructor(email: string) {
    super({ code: 'EMAIL_ALREADY_TAKEN', message: 'Cette adresse e-mail est déjà utilisée', email })
  }
}

export class AccountSuspendedError extends ForbiddenException {
  constructor() {
    super({ code: 'ACCOUNT_SUSPENDED', message: 'Ce compte est suspendu' })
  }
}

export class SessionExpiredError extends UnauthorizedException {
  constructor(reason: string) {
    super({ code: 'UNAUTHORIZED', message: 'Session invalide', reason })
  }
}
