import type {
  AtelierDetail,
  AtelierResult,
  AtelierSummary,
  CompleteOnboardingInput,
  DirectoryFilters,
  DirectoryPoint,
  MachineDetail,
  OnboardingResult,
} from '../model/atelier'

export interface IAtelierPort {
  list(point: DirectoryPoint | null, filters: DirectoryFilters): Promise<AtelierResult<ReadonlyArray<AtelierSummary>>>
  getBySlug(slug: string): Promise<AtelierResult<AtelierDetail>>
  getMachineById(id: string): Promise<AtelierResult<MachineDetail>>
  completeOnboarding(input: CompleteOnboardingInput): Promise<AtelierResult<OnboardingResult>>
}
