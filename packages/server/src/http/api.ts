import { HttpApi } from '@effect/platform'
import { identityApiGroup } from '@etabli/bc-identity'

import { healthApiGroup } from './health.api'

export const etabliApi = HttpApi.make('etabli').add(healthApiGroup).add(identityApiGroup)
