import { NotFoundException } from '@nestjs/common'

export class AtelierNotJoinableError extends NotFoundException {
  constructor(atelierId: string) {
    super({ code: 'ATELIER_NOT_JOINABLE', message: 'Cet atelier n’accueille pas de nouveaux membres', atelierId })
  }
}

export class MembershipUnknownError extends NotFoundException {
  constructor(atelierId: string, userId: string) {
    super({ code: 'MEMBERSHIP_UNKNOWN', message: 'Cette adhésion n’existe pas', atelierId, userId })
  }
}
