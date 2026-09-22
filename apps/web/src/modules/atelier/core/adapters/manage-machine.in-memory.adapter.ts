import type { AuthTokenProvider } from '@etabli/api-client'

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
    private readonly getAuthToken: AuthTokenProvider,
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

  private nextToken(): string {
    this.counter += 1
    return `qr-in-memory-${this.counter}`
  }

  private async owned(): Promise<ReadonlyArray<string> | undefined> {
    const token = await this.getAuthToken()
    return token === null || token === undefined ? undefined : this.managers.get(token)
  }

  private async manages(atelierId: string): Promise<boolean> {
    return (await this.owned())?.includes(atelierId) ?? false
  }

  async listParcs(): Promise<AtelierResult<ReadonlyArray<ManagedParc>>> {
    const owned = await this.owned()
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

  async create(input: CreateMachineInput): Promise<AtelierResult<ManagedMachine>> {
    if (!(await this.manages(input.atelierId))) return failure('FORBIDDEN')

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
      checkInToken: this.nextToken(),
      createdAt: now,
      updatedAt: now,
    }
    this.machines.set(machine.id, machine)
    return { ok: true, value: machine }
  }

  async update(id: string, input: UpdateMachineInput): Promise<AtelierResult<ManagedMachine>> {
    const current = this.machines.get(id)
    if (current === undefined) return failure('NOT_FOUND')
    if (!(await this.manages(current.atelierId))) return failure('NOT_FOUND')

    const next: ManagedMachine = {
      ...current,
      name: input.name ?? current.name,
      description: input.description ?? current.description,
      status: input.status ?? current.status,
      requiresCertification: input.requiresCertification ?? current.requiresCertification,
      slotDurationMinutes: input.slotDurationMinutes ?? current.slotDurationMinutes,
      updatedAt: new Date().toISOString(),
    }
    this.machines.set(id, next)
    return { ok: true, value: next }
  }

  async regenerateCheckInToken(id: string): Promise<AtelierResult<ManagedMachine>> {
    const current = this.machines.get(id)
    if (current === undefined) return failure('NOT_FOUND')
    if (!(await this.manages(current.atelierId))) return failure('NOT_FOUND')

    const next: ManagedMachine = {
      ...current,
      checkInToken: this.nextToken(),
      updatedAt: new Date().toISOString(),
    }
    this.machines.set(id, next)
    return { ok: true, value: next }
  }
}
