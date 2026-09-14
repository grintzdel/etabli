import { HttpApiBuilder } from '@effect/platform'
import { bookingHandlers } from '@etabli/bc-booking'

import { etabliApi } from './api'

export const BookingLive = HttpApiBuilder.group(etabliApi, 'booking', (handlers) =>
  handlers.handle('availability', bookingHandlers.availability)
)
