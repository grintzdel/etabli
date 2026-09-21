import { Injectable } from '@nestjs/common'

import type { IClock } from '../domain/clock.interface.ts'

@Injectable()
export class SystemClock implements IClock {
  now(): Date {
    return new Date()
  }
}
