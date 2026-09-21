import type {
  AdminAtelier,
  AtelierMembership,
  AtelierResult,
  CreateAtelierInput,
  SetAtelierStatusInput,
  SetMembershipRoleInput,
} from '../model/atelier'
import { failure } from '../model/atelier'
import type { IAdminAtelierPort } from '../ports/admin-atelier.port'

export class AdminAtelierInMemoryAdapter implements IAdminAtelierPort {
  private readonly ateliers = new Map<string, AdminAtelier>()
  private readonly memberships = new Map<string, AtelierMembership>()
  private counter = 0

  constructor(
    seed: ReadonlyArray<AdminAtelier> = [],
    private readonly admins: ReadonlySet<string> = new Set()
  ) {
    for (const atelier of seed) this.ateliers.set(atelier.id, atelier)
  }

  seedMembership(membership: AtelierMembership): void {
    this.memberships.set(`${membership.atelierId}:${membership.userId}`, membership)
  }

  private nextId(): string {
    this.counter += 1
    return `00000000-0000-4000-8000-${String(this.counter).padStart(12, '0')}`
  }

  async list(token: string): Promise<AtelierResult<ReadonlyArray<AdminAtelier>>> {
    if (!this.admins.has(token)) return failure('FORBIDDEN')
    return { ok: true, value: [...this.ateliers.values()] }
  }

  async create(token: string, input: CreateAtelierInput): Promise<AtelierResult<AdminAtelier>> {
    if (!this.admins.has(token)) return failure('FORBIDDEN')
    if ([...this.ateliers.values()].some((atelier) => atelier.slug === input.slug)) return failure('SLUG_TAKEN')

    const atelier: AdminAtelier = {
      id: this.nextId(),
      slug: input.slug,
      name: input.name,
      city: input.city,
      status: 'DRAFT',
      machineCount: 0,
      createdAt: new Date().toISOString(),
    }
    this.ateliers.set(atelier.id, atelier)
    return { ok: true, value: atelier }
  }

  async setStatus(token: string, id: string, input: SetAtelierStatusInput): Promise<AtelierResult<AdminAtelier>> {
    if (!this.admins.has(token)) return failure('FORBIDDEN')

    const current = this.ateliers.get(id)
    if (current === undefined) return failure('NOT_FOUND')

    const next: AdminAtelier = { ...current, status: input.status }
    this.ateliers.set(id, next)
    return { ok: true, value: next }
  }

  async setMembershipRole(
    token: string,
    atelierId: string,
    userId: string,
    input: SetMembershipRoleInput
  ): Promise<AtelierResult<AtelierMembership>> {
    if (!this.admins.has(token)) return failure('FORBIDDEN')

    const current = this.memberships.get(`${atelierId}:${userId}`)
    if (current === undefined) return failure('NOT_FOUND')

    const next: AtelierMembership = { ...current, role: input.role }
    this.memberships.set(`${atelierId}:${userId}`, next)
    return { ok: true, value: next }
  }
}
