import { ApiErrorCode } from '@etabli/contract'
import { NotFoundException } from '@nestjs/common'

export class AtelierNotJoinableError extends NotFoundException {
  constructor(atelierId: string) {
    super({
      code: ApiErrorCode.ATELIER_NOT_JOINABLE,
      message: 'Cet atelier n’accueille pas de nouveaux membres',
      atelierId,
    })
  }
}

export class MembershipUnknownError extends NotFoundException {
  constructor(atelierId: string, userId: string) {
    super({ code: ApiErrorCode.MEMBERSHIP_UNKNOWN, message: 'Cette adhésion n’existe pas', atelierId, userId })
  }
}
