import type { IClock } from '../domain/clock.interface.ts'

export class FixedClock implements IClock {
  private current: Date

  constructor(at: Date | string) {
    this.current = typeof at === 'string' ? new Date(at) : at
  }

  now(): Date {
    return new Date(this.current)
  }

  set(at: Date | string): void {
    this.current = typeof at === 'string' ? new Date(at) : at
  }
}
