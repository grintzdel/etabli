import { HttpApi } from '@effect/platform'
import { adminApiGroup, atelierApiGroup, manageApiGroup, onboardingApiGroup } from '@etabli/bc-atelier'
import { bookingApiGroup, bookingManagementApiGroup, networkStatsApiGroup } from '@etabli/bc-booking'
import { certificationApiGroup, certificationReviewApiGroup } from '@etabli/bc-certification'
import { adminUsersApiGroup, identityApiGroup } from '@etabli/bc-identity'

import { healthApiGroup } from './health.api'

export const etabliApi = HttpApi.make('etabli')
  .add(healthApiGroup)
  .add(identityApiGroup)
  .add(atelierApiGroup)
  .add(onboardingApiGroup)
  .add(adminApiGroup)
  .add(adminUsersApiGroup)
  .add(manageApiGroup)
  .add(certificationApiGroup)
  .add(certificationReviewApiGroup)
  .add(bookingApiGroup)
  .add(bookingManagementApiGroup)
  .add(networkStatsApiGroup)
