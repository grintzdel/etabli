import { HttpApiBuilder } from '@effect/platform'
import { adminUsersHandlers } from '@etabli/bc-identity'

import { etabliApi } from './api'

export const AdminUsersLive = HttpApiBuilder.group(etabliApi, 'adminUsers', (handlers) =>
  handlers.handle('listUsers', adminUsersHandlers.listUsers).handle('updateUser', adminUsersHandlers.updateUser)
)
