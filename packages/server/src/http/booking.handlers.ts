import { HttpApiBuilder } from '@effect/platform'
import { bookingHandlers, bookingManagementHandlers } from '@etabli/bc-booking'

import { etabliApi } from './api'

export const BookingLive = HttpApiBuilder.group(etabliApi, 'booking', (handlers) =>
  handlers
    .handle('availability', bookingHandlers.availability)
    .handle('create', bookingHandlers.create)
    .handle('list', bookingHandlers.list)
    .handle('getById', bookingHandlers.getById)
    .handle('cancel', bookingHandlers.cancel)
    .handle('checkIn', bookingHandlers.checkIn)
)

export const BookingManagementLive = HttpApiBuilder.group(etabliApi, 'bookingManagement', (handlers) =>
  handlers.handle('list', bookingManagementHandlers.list).handle('checkIn', bookingManagementHandlers.checkIn)
)
