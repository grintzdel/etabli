import type {
  AtelierDetail,
  AtelierResult,
  AtelierSummary,
  CompleteOnboardingInput,
  DirectoryFilters,
  MachineDetail,
  OnboardingResult,
} from '../model/atelier'
import { AtelierFailureCode, failure } from '../model/atelier'
import type { IAtelierPort } from '../ports/atelier.port'

export class AtelierInMemoryAdapter implements IAtelierPort {
  private readonly sheets = new Map<string, AtelierDetail>()

  seed(sheet: AtelierDetail): void {
    this.sheets.set(sheet.slug, sheet)
  }

  private summaryOf(sheet: AtelierDetail): AtelierSummary {
    const live = sheet.machines.filter((machine) => machine.status !== 'RETIRED')
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
      machineKinds: [...new Set(live.map((machine) => machine.kind))].toSorted(),
      distanceKm: null,
    }
  }

  async list(filters: DirectoryFilters): Promise<AtelierResult<ReadonlyArray<AtelierSummary>>> {
    const value = [...this.sheets.values()]
      .filter((sheet) => filters.city === undefined || sheet.city.toLowerCase() === filters.city.toLowerCase())
      .filter(
        (sheet) =>
          filters.machineKind === undefined ||
          sheet.machines.some((machine) => machine.kind === filters.machineKind && machine.status !== 'RETIRED')
      )
      .map((sheet) => this.summaryOf(sheet))
      .toSorted((a, b) => a.name.localeCompare(b.name))

    return { ok: true, value }
  }

  async getBySlug(slug: string): Promise<AtelierResult<AtelierDetail>> {
    const sheet = this.sheets.get(slug)
    if (sheet === undefined) return failure(AtelierFailureCode.NOT_FOUND)
    return { ok: true, value: sheet }
  }

  async getMachineById(id: string): Promise<AtelierResult<MachineDetail>> {
    for (const sheet of this.sheets.values()) {
      const machine = sheet.machines.find((candidate) => candidate.id === id && candidate.status !== 'RETIRED')
      if (machine === undefined) continue

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

    return failure(AtelierFailureCode.NOT_FOUND)
  }

  async completeOnboarding(_token: string, input: CompleteOnboardingInput): Promise<AtelierResult<OnboardingResult>> {
    const sheet = [...this.sheets.values()].find((candidate) => candidate.id === input.atelierId)
    if (sheet === undefined) return failure(AtelierFailureCode.NOT_FOUND)

    return {
      ok: true,
      value: {
        atelierId: sheet.id,
        atelierSlug: sheet.slug,
        atelierName: sheet.name,
        role: 'MEMBER',
        practice: input.practice,
        joinedAt: new Date().toISOString(),
      },
    }
  }
}
