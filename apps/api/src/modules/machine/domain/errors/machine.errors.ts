import { ApiErrorCode } from '@etabli/contract'
import { ForbiddenException, NotFoundException } from '@nestjs/common'

export class MachineUnknownError extends NotFoundException {
  constructor(machineId: string) {
    super({ code: ApiErrorCode.MACHINE_UNKNOWN, message: `Machine introuvable : ${machineId}`, machineId })
  }
}

export class NotYourAtelierError extends ForbiddenException {
  constructor(atelierId: string) {
    super({ code: ApiErrorCode.FORBIDDEN, message: 'Seul un fabmanager de cet atelier fait ce geste', atelierId })
  }
}
