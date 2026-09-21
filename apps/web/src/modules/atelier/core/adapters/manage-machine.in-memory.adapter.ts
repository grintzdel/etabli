import type {
  AtelierResult,
  CreateMachineInput,
  ManagedMachine,
  ManagedParc,
  UpdateMachineInput,
} from '../model/atelier'
import { failure } from '../model/atelier'
import type { IManageMachinePort } from '../ports/manage-machine.port'

export class ManageMachineInMemoryAdapter implements IManageMachinePort {
  private readonly machines = new Map<string, ManagedMachine>()
  private counter = 0

  constructor(
    private readonly parcs: ReadonlyArray<ManagedParc['atelier']> = [],
    private readonly managers: ReadonlyMap<string, ReadonlyArray<string>> = new Map()
  ) {}

  seed(machine: ManagedMachine): void {
    this.machines.set(machine.id, machine)
  }

  private nextId(): string {
    this.counter += 1
    return `00000000-0000-4000-8000-${String(this.counter).padStart(12, '0')}`
  }

  private manages(token: string, atelierId: string): boolean {
    return (this.managers.get(token) ?? []).includes(atelierId)
  }

  private taken(nfcTagId: string | null | undefined, exceptId?: string): boolean {
    if (nfcTagId === null || nfcTagId === undefined) return false
    return [...this.machines.values()].some((machine) => machine.id !== exceptId && machine.nfcTagId === nfcTagId)
  }

  async listParcs(token: string): Promise<AtelierResult<ReadonlyArray<ManagedParc>>> {
    const owned = this.managers.get(token)
    if (owned === undefined) return failure('FORBIDDEN')

    return {
      ok: true,
      value: this.parcs
        .filter((atelier) => owned.includes(atelier.id))
        .map((atelier) => ({
          atelier,
          machines: [...this.machines.values()].filter((machine) => machine.atelierId === atelier.id),
        })),
    }
  }

  async create(token: string, input: CreateMachineInput): Promise<AtelierResult<ManagedMachine>> {
    if (!this.manages(token, input.atelierId)) return failure('FORBIDDEN')
    if (this.taken(input.nfcTagId)) return failure('NFC_TAG_TAKEN')

    const now = new Date().toISOString()
    const machine: ManagedMachine = {
      id: this.nextId(),
      atelierId: input.atelierId,
      name: input.name,
      description: input.description ?? '',
      kind: input.kind,
      requiresCertification: input.requiresCertification ?? true,
      slotDurationMinutes: input.slotDurationMinutes ?? 60,
      status: 'AVAILABLE',
      nfcTagId: input.nfcTagId ?? null,
      createdAt: now,
      updatedAt: now,
    }
    this.machines.set(machine.id, machine)
    return { ok: true, value: machine }
  }

  async update(token: string, id: string, input: UpdateMachineInput): Promise<AtelierResult<ManagedMachine>> {
    const current = this.machines.get(id)
    if (current === undefined) return failure('NOT_FOUND')
    if (!this.manages(token, current.atelierId)) return failure('NOT_FOUND')
    if (this.taken(input.nfcTagId, id)) return failure('NFC_TAG_TAKEN')

    const next: ManagedMachine = {
      ...current,
      name: input.name ?? current.name,
      description: input.description ?? current.description,
      status: input.status ?? current.status,
      requiresCertification: input.requiresCertification ?? current.requiresCertification,
      slotDurationMinutes: input.slotDurationMinutes ?? current.slotDurationMinutes,
      nfcTagId: input.nfcTagId === undefined ? current.nfcTagId : input.nfcTagId,
      updatedAt: new Date().toISOString(),
    }
    this.machines.set(id, next)
    return { ok: true, value: next }
  }
}
