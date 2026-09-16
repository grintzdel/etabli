import type {
  AtelierDetail,
  AtelierResult,
  AtelierSummary,
  CompleteOnboardingInput,
  DirectoryFilters,
  MachineDetail,
  OnboardingResult,
} from '../model/atelier'

export interface IAtelierPort {
  list(filters: DirectoryFilters): Promise<AtelierResult<ReadonlyArray<AtelierSummary>>>
  getBySlug(slug: string): Promise<AtelierResult<AtelierDetail>>
  getMachineById(id: string): Promise<AtelierResult<MachineDetail>>
  completeOnboarding(token: string, input: CompleteOnboardingInput): Promise<AtelierResult<OnboardingResult>>
}
