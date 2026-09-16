import { HttpApiBuilder } from '@effect/platform'
import { atelierHandlers } from '@etabli/bc-atelier'

import { etabliApi } from './api'

export const AtelierLive = HttpApiBuilder.group(etabliApi, 'atelier', (handlers) =>
  handlers
    .handle('list', atelierHandlers.list)
    .handle('getBySlug', atelierHandlers.getBySlug)
    .handle('getMachineById', atelierHandlers.getMachineById)
)
