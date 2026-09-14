export interface OnboardingFormState {
  readonly error: string | null
  readonly practice: ReadonlyArray<string>
}

export const emptyOnboardingFormState: OnboardingFormState = { error: null, practice: [] }

export type OnboardingFormAction = (state: OnboardingFormState, formData: FormData) => Promise<OnboardingFormState>
