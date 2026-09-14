import { HttpApiBuilder } from '@effect/platform'
import { manageHandlers } from '@etabli/bc-atelier'

import { etabliApi } from './api'

export const ManageLive = HttpApiBuilder.group(etabliApi, 'manage', (handlers) =>
  handlers
    .handle('listParcs', manageHandlers.listParcs)
    .handle('createMachine', manageHandlers.createMachine)
    .handle('updateMachine', manageHandlers.updateMachine)
)
