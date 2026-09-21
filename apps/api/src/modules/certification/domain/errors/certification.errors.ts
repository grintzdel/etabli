import { ApiErrorCode } from '@etabli/contract'
import { ConflictException, NotFoundException } from '@nestjs/common'

export class MachineNotCertifiableError extends NotFoundException {
  constructor(machineId: string) {
    super({
      code: ApiErrorCode.MACHINE_NOT_CERTIFIABLE,
      message: 'Cette machine ne demande pas d’habilitation, ou elle ne vous est pas accessible',
      machineId,
    })
  }
}

export class CertificationAlreadyRequestedError extends ConflictException {
  constructor(machineId: string) {
    super({
      code: ApiErrorCode.CERTIFICATION_ALREADY_REQUESTED,
      message: 'Une demande est déjà en cours pour cette machine',
      machineId,
    })
  }
}

export class CertificationUnknownError extends NotFoundException {
  constructor(certificationId: string) {
    super({ code: ApiErrorCode.CERTIFICATION_UNKNOWN, message: 'Demande d’habilitation introuvable', certificationId })
  }
}
