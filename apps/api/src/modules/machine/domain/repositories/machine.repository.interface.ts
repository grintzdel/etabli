import type { MachineKind, MachineStatus } from '../constants/machine.constant.ts'
import type { MachineEntity, MachineWithAtelier } from '../entities/machine.entity.ts'

export interface NewMachine {
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
}

export interface UpdateMachineInput {
  readonly name?: string
  readonly description?: string
  readonly status?: MachineStatus
  readonly requiresCertification?: boolean
  readonly slotDurationMinutes?: number
  readonly nfcTagId?: string | null
}

export interface IMachineRepository {
  findById(id: string): Promise<MachineWithAtelier | null>
  findPublicById(id: string): Promise<MachineWithAtelier | null>
  findMany(ids: ReadonlyArray<string>): Promise<ReadonlyArray<MachineWithAtelier>>
  findByNfcTag(nfcTagId: string): Promise<MachineEntity | null>
  listForAtelier(atelierId: string): Promise<ReadonlyArray<MachineEntity>>
  listForAteliers(atelierIds: ReadonlyArray<string>): Promise<ReadonlyArray<MachineWithAtelier>>
  listAll(): Promise<ReadonlyArray<MachineWithAtelier>>
  insert(machine: NewMachine): Promise<MachineEntity>
  update(id: string, patch: UpdateMachineInput, at: Date): Promise<MachineEntity | null>
}
