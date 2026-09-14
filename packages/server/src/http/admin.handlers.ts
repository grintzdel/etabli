import { HttpApiBuilder } from '@effect/platform'
import { adminHandlers } from '@etabli/bc-atelier'

import { etabliApi } from './api'

export const AdminLive = HttpApiBuilder.group(etabliApi, 'admin', (handlers) =>
  handlers
    .handle('listAteliers', adminHandlers.listAteliers)
    .handle('createAtelier', adminHandlers.createAtelier)
    .handle('setAtelierStatus', adminHandlers.setAtelierStatus)
)
