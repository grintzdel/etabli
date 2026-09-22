import type { MachineEntity, MachineWithAtelier } from '../entities/machine.entity.ts'

export type NewMachine = Omit<MachineEntity, 'updatedAt'>

export type UpdateMachineInput = Partial<
  Pick<
    MachineEntity,
    'name' | 'description' | 'status' | 'requiresCertification' | 'slotDurationMinutes' | 'checkInToken'
  >
>

export interface IMachineRepository {
  findById(id: string): Promise<MachineWithAtelier | null>
  findPublicById(id: string): Promise<MachineWithAtelier | null>
  findMany(ids: ReadonlyArray<string>): Promise<ReadonlyArray<MachineWithAtelier>>
  listForAtelier(atelierId: string): Promise<ReadonlyArray<MachineEntity>>
  listForAteliers(atelierIds: ReadonlyArray<string>): Promise<ReadonlyArray<MachineWithAtelier>>
  listAll(): Promise<ReadonlyArray<MachineWithAtelier>>
  insert(machine: NewMachine): Promise<MachineEntity>
  update(id: string, patch: UpdateMachineInput, at: Date): Promise<MachineEntity | null>
}
