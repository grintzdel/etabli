import type {
  AtelierDetail,
  AtelierResult,
  AtelierSummary,
  CompleteOnboardingInput,
  DirectoryFilters,
  OnboardingResult,
} from '../model/atelier'

export interface IAtelierPort {
  list(filters: DirectoryFilters): Promise<AtelierResult<ReadonlyArray<AtelierSummary>>>
  getBySlug(slug: string): Promise<AtelierResult<AtelierDetail>>
  completeOnboarding(token: string, input: CompleteOnboardingInput): Promise<AtelierResult<OnboardingResult>>
}
