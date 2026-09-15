import { HttpApiBuilder } from '@effect/platform'
import { identityHandlers } from '@etabli/bc-identity'

import { etabliApi } from './api'

export const IdentityLive = HttpApiBuilder.group(etabliApi, 'identity', (handlers) =>
  handlers
    .handle('register', identityHandlers.register)
    .handle('login', identityHandlers.login)
    .handle('me', identityHandlers.me)
    .handle('preferences', identityHandlers.preferences)
    .handle('myAteliers', identityHandlers.myAteliers)
    .handle('updatePreferences', identityHandlers.updatePreferences)
)
