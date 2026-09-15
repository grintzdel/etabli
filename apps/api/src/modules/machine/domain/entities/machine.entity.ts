import type { AtelierStatus } from '../../../atelier/domain/constants/atelier.constant.ts'
import type { MachineKind, MachineStatus } from '../constants/machine.constant.ts'

export interface MachineEntity {
  readonly id: string
  readonly atelierId: string
  readonly name: string
  readonly description: string
  readonly kind: MachineKind
  readonly requiresCertification: boolean
  readonly slotDurationMinutes: number
  readonly status: MachineStatus
  readonly nfcTagId: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface MachineWithAtelier extends MachineEntity {
  readonly atelierName: string
  readonly atelierSlug: string
}

export interface ParcAtelier {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly status: AtelierStatus
}

export interface ManagedParc {
  readonly atelier: ParcAtelier
  readonly machines: ReadonlyArray<MachineEntity>
}
