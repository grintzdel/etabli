import { ApiErrorCode } from '@etabli/contract'
import { ConflictException, NotFoundException } from '@nestjs/common'

export class AtelierNotFoundError extends NotFoundException {
  constructor(slug: string) {
    super({ code: ApiErrorCode.ATELIER_NOT_FOUND, message: `Atelier introuvable : ${slug}`, slug })
  }
}

export class AtelierUnknownError extends NotFoundException {
  constructor(atelierId: string) {
    super({ code: ApiErrorCode.ATELIER_UNKNOWN, message: `Atelier introuvable : ${atelierId}`, atelierId })
  }
}

export class AtelierSlugTakenError extends ConflictException {
  constructor(slug: string) {
    super({ code: ApiErrorCode.ATELIER_SLUG_TAKEN, message: `Cet identifiant d’URL est déjà pris : ${slug}`, slug })
  }
}
