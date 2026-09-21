import { distanceKm } from '../lib/distance'
import type {
  AtelierDetail,
  AtelierResult,
  AtelierSummary,
  DirectoryPoint,
  MachineDetail,
  MachineKind,
} from '../model/atelier'
import { failure } from '../model/atelier'
import type { IAtelierPort } from '../ports/atelier.port'

export class AtelierInMemoryAdapter implements IAtelierPort {
  private readonly sheets = new Map<string, AtelierDetail>()

  constructor(seed: ReadonlyArray<AtelierDetail> = []) {
    for (const sheet of seed) this.sheets.set(sheet.slug, sheet)
  }

  seed(sheet: AtelierDetail): void {
    this.sheets.set(sheet.slug, sheet)
  }

  private summaryOf(sheet: AtelierDetail, point: DirectoryPoint | null): AtelierSummary {
    const live = sheet.machines.filter((machine) => machine.status !== 'RETIRED')
    const kinds = new Set<MachineKind>(live.map((machine) => machine.kind))

    return {
      id: sheet.id,
      slug: sheet.slug,
      name: sheet.name,
      description: sheet.description,
      city: sheet.city,
      country: sheet.country,
      latitude: sheet.latitude,
      longitude: sheet.longitude,
      machineCount: live.length,
      machineKinds: [...kinds],
      distanceKm: point === null ? null : distanceKm(point, sheet),
    }
  }

  async list(point: DirectoryPoint | null): Promise<AtelierResult<ReadonlyArray<AtelierSummary>>> {
    const summaries = [...this.sheets.values()].map((sheet) => this.summaryOf(sheet, point))
    if (point === null) return { ok: true, value: summaries }

    return { ok: true, value: summaries.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0)) }
  }

  async getBySlug(slug: string): Promise<AtelierResult<AtelierDetail>> {
    const sheet = this.sheets.get(slug)
    if (sheet === undefined) return failure('NOT_FOUND')
    return { ok: true, value: sheet }
  }

  async getMachineById(id: string): Promise<AtelierResult<MachineDetail>> {
    for (const sheet of this.sheets.values()) {
      const machine = sheet.machines.find((candidate) => candidate.id === id)
      if (machine === undefined) continue
      if (machine.status === 'RETIRED') return failure('NOT_FOUND')

      return {
        ok: true,
        value: {
          id: machine.id,
          atelierId: sheet.id,
          atelierName: sheet.name,
          atelierSlug: sheet.slug,
          name: machine.name,
          description: machine.description,
          kind: machine.kind,
          requiresCertification: machine.requiresCertification,
          slotDurationMinutes: machine.slotDurationMinutes,
          status: machine.status,
        },
      }
    }

    return failure('NOT_FOUND')
  }
}
