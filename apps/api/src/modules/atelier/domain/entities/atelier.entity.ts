import type { MachineKind, MachineStatus } from '../../../machine/domain/constants/machine.constant.ts'
import type { AtelierStatus } from '../constants/atelier.constant.ts'

export interface AtelierEntity {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly description: string
  readonly street: string
  readonly postalCode: string
  readonly city: string
  readonly country: string
  readonly latitude: number
  readonly longitude: number
  readonly status: AtelierStatus
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface AtelierSummary {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly description: string
  readonly city: string
  readonly country: string
  readonly latitude: number
  readonly longitude: number
  readonly machineCount: number
  readonly machineKinds: ReadonlyArray<MachineKind>
  readonly distanceKm: number | null
}

export interface PublicMachine {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly kind: MachineKind
  readonly requiresCertification: boolean
  readonly slotDurationMinutes: number
  readonly status: MachineStatus
}

export interface AtelierDetail {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly description: string
  readonly street: string
  readonly postalCode: string
  readonly city: string
  readonly country: string
  readonly latitude: number
  readonly longitude: number
  readonly machines: ReadonlyArray<PublicMachine>
}

export interface AdminAtelier {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly city: string
  readonly status: AtelierStatus
  readonly machineCount: number
  readonly createdAt: Date
}

export const toAtelierDetail = (atelier: AtelierEntity, machines: ReadonlyArray<PublicMachine>): AtelierDetail => ({
  id: atelier.id,
  slug: atelier.slug,
  name: atelier.name,
  description: atelier.description,
  street: atelier.street,
  postalCode: atelier.postalCode,
  city: atelier.city,
  country: atelier.country,
  latitude: atelier.latitude,
  longitude: atelier.longitude,
  machines,
})

export const toAdminAtelier = (atelier: AtelierEntity, machineCount: number): AdminAtelier => ({
  id: atelier.id,
  slug: atelier.slug,
  name: atelier.name,
  city: atelier.city,
  status: atelier.status,
  machineCount,
  createdAt: atelier.createdAt,
})
