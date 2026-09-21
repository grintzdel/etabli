import type { GeoPoint, LocationResult } from '../model/location'
import type { ILocationPort } from '../ports/location.port'

export class LocationInMemoryAdapter implements ILocationPort {
  constructor(private readonly outcome: LocationResult<GeoPoint>) {}

  current(): Promise<LocationResult<GeoPoint>> {
    return Promise.resolve(this.outcome)
  }
}
