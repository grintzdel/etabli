import { ApiErrorCode } from '@etabli/contract'
import { ConflictException, NotFoundException } from '@nestjs/common'

export class UserUnknownError extends NotFoundException {
  constructor(userId: string) {
    super({ code: ApiErrorCode.USER_UNKNOWN, message: `Compte introuvable : ${userId}`, userId })
  }
}

export class AdminSelfLockoutError extends ConflictException {
  constructor() {
    super({
      code: ApiErrorCode.ADMIN_SELF_LOCKOUT,
      message: 'Un administrateur ne peut ni se retirer son rôle ni se suspendre',
    })
  }
}

export class PreferredAtelierNotJoinedError extends ConflictException {
  constructor(atelierId: string) {
    super({
      code: ApiErrorCode.PREFERRED_ATELIER_NOT_JOINED,
      message: 'Cet atelier ne fait pas partie de vos adhésions',
      atelierId,
    })
  }
}
