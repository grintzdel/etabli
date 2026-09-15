import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'

export class MachineUnknownError extends NotFoundException {
  constructor(machineId: string) {
    super({ code: 'MACHINE_UNKNOWN', message: `Machine introuvable : ${machineId}`, machineId })
  }
}

export class MachineNfcTagTakenError extends ConflictException {
  constructor(nfcTagId: string) {
    super({ code: 'MACHINE_NFC_TAG_TAKEN', message: 'Ce tag NFC est déjà porté par une autre machine', nfcTagId })
  }
}

export class NotYourAtelierError extends ForbiddenException {
  constructor(atelierId: string) {
    super({ code: 'FORBIDDEN', message: 'Seul un fabmanager de cet atelier fait ce geste', atelierId })
  }
}
