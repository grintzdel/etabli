import type { GeoPoint, LocationResult } from '../model/location'

export interface ILocationPort {
  current(): Promise<LocationResult<GeoPoint>>
}
