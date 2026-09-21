import { ApiErrorCode } from '@etabli/contract'
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common'

export class InvalidCredentialsError extends UnauthorizedException {
  constructor() {
    super({ code: ApiErrorCode.INVALID_CREDENTIALS, message: 'Adresse e-mail ou mot de passe incorrect' })
  }
}

export class EmailAlreadyTakenError extends ConflictException {
  constructor(email: string) {
    super({ code: ApiErrorCode.EMAIL_ALREADY_TAKEN, message: 'Cette adresse e-mail est déjà utilisée', email })
  }
}

export class AccountSuspendedError extends ForbiddenException {
  constructor() {
    super({ code: ApiErrorCode.ACCOUNT_SUSPENDED, message: 'Ce compte est suspendu' })
  }
}

export class SessionExpiredError extends UnauthorizedException {
  constructor(reason: string) {
    super({ code: ApiErrorCode.UNAUTHORIZED, message: 'Session invalide', reason })
  }
}
