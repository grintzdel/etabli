import type {
  AtelierDetail,
  AtelierResult,
  AtelierSummary,
  CompleteOnboardingInput,
  DirectoryPoint,
  MachineDetail,
  OnboardingResult,
} from '../model/atelier'

export interface IAtelierPort {
  list(point: DirectoryPoint | null): Promise<AtelierResult<ReadonlyArray<AtelierSummary>>>
  getBySlug(slug: string): Promise<AtelierResult<AtelierDetail>>
  getMachineById(id: string): Promise<AtelierResult<MachineDetail>>
  completeOnboarding(input: CompleteOnboardingInput): Promise<AtelierResult<OnboardingResult>>
}
