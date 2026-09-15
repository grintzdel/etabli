import { ConflictException, NotFoundException } from '@nestjs/common'

export class UserUnknownError extends NotFoundException {
  constructor(userId: string) {
    super({ code: 'USER_UNKNOWN', message: `Compte introuvable : ${userId}`, userId })
  }
}

export class AdminSelfLockoutError extends ConflictException {
  constructor() {
    super({
      code: 'ADMIN_SELF_LOCKOUT',
      message: 'Un administrateur ne peut ni se retirer son rôle ni se suspendre',
    })
  }
}

export class PreferredAtelierNotJoinedError extends ConflictException {
  constructor(atelierId: string) {
    super({
      code: 'PREFERRED_ATELIER_NOT_JOINED',
      message: 'Cet atelier ne fait pas partie de vos adhésions',
      atelierId,
    })
  }
}
