export type AtelierStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'

export type MachineKind = 'LASER_CUTTER' | 'PRINTER_3D' | 'CNC_MILL' | 'WOOD_LATHE' | 'SEWING' | 'ELECTRONICS_BENCH'

export type MachineStatus = 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED'

export type AtelierSummary = {
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

export type PublicMachine = {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly kind: MachineKind
  readonly requiresCertification: boolean
  readonly slotDurationMinutes: number
  readonly status: MachineStatus
}

export type AtelierDetail = {
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

export type ListAteliersQuery = {
  readonly city?: string
  readonly machineKind?: MachineKind
  readonly lat?: string
  readonly lng?: string
  readonly radiusKm?: string
  readonly limit?: string
  readonly offset?: string
}

export type CompleteOnboardingInput = {
  readonly atelierId: string
  readonly practice: ReadonlyArray<string>
}

export type OnboardingResult = {
  readonly atelierId: string
  readonly atelierSlug: string
  readonly atelierName: string
  readonly role: 'MEMBER' | 'FABMANAGER'
  readonly practice: ReadonlyArray<string>
  readonly joinedAt: string
}

export type AdminAtelier = {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly city: string
  readonly status: AtelierStatus
  readonly machineCount: number
  readonly createdAt: string
}

export type CreateAtelierInput = {
  readonly slug: string
  readonly name: string
  readonly description?: string
  readonly street?: string
  readonly postalCode?: string
  readonly city: string
  readonly country?: string
  readonly latitude: number
  readonly longitude: number
}

export type SetAtelierStatusInput = {
  readonly status: AtelierStatus
}
