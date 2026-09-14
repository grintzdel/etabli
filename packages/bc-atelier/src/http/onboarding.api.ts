import { HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import type { OnboardingResult as OnboardingResultContract } from '@etabli/contract'
import { routes } from '@etabli/contract'
import { AuthMiddleware } from '@etabli/shared/auth-context'
import type { AssertEquals } from '@etabli/shared/type-level'
import * as Schema from 'effect/Schema'

import { CompleteOnboardingSchema, OnboardingResultSchema } from '../domain/atelier.schema'
import { AtelierNotJoinableError } from '../domain/errors'

export const onboardingResultContractParity: AssertEquals<
  Schema.Schema.Encoded<typeof OnboardingResultSchema>,
  OnboardingResultContract
> = true

export const onboardingApiGroup = HttpApiGroup.make('onboarding')
  .add(
    HttpApiEndpoint.post('complete', routes.onboarding.complete)
      .setPayload(CompleteOnboardingSchema)
      .addSuccess(OnboardingResultSchema, { status: 201 })
      .addError(AtelierNotJoinableError)
  )
  .middleware(AuthMiddleware)
