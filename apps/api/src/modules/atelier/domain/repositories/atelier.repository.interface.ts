import type { MachineKind } from '../../../machine/domain/constants/machine.constant.ts'
import type { AtelierStatus } from '../constants/atelier.constant.ts'
import type { AdminAtelier, AtelierEntity, AtelierSummary, PublicMachine } from '../entities/atelier.entity.ts'

export interface DirectoryFilter {
  readonly city?: string
  readonly machineKind?: MachineKind
  readonly lat?: number
  readonly lng?: number
  readonly radiusKm?: number
  readonly limit: number
  readonly offset: number
}

export type NewAtelier = Omit<AtelierEntity, 'updatedAt'>

export interface IAtelierRepository {
  listPublished(filter: DirectoryFilter): Promise<ReadonlyArray<AtelierSummary>>
  findPublishedBySlug(slug: string): Promise<AtelierEntity | null>
  findPublishedById(id: string): Promise<AtelierEntity | null>
  findAnyById(id: string): Promise<AtelierEntity | null>
  findAnyBySlug(slug: string): Promise<AtelierEntity | null>
  listPublicMachines(atelierId: string): Promise<ReadonlyArray<PublicMachine>>
  listAll(): Promise<ReadonlyArray<AdminAtelier>>
  insert(atelier: NewAtelier): Promise<AtelierEntity>
  updateStatus(id: string, status: AtelierStatus, at: Date): Promise<AdminAtelier | null>
}
