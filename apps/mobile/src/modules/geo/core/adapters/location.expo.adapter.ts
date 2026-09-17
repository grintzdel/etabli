import * as Location from 'expo-location'

import { failure, LocationFailureCode, type GeoPoint, type LocationResult } from '../model/location'
import type { ILocationPort } from '../ports/location.port'

export class LocationExpoAdapter implements ILocationPort {
  async current(): Promise<LocationResult<GeoPoint>> {
    try {
      const permission = await Location.requestForegroundPermissionsAsync()
      if (!permission.granted) return failure(LocationFailureCode.PERMISSION_DENIED)

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      return { ok: true, value: { latitude: position.coords.latitude, longitude: position.coords.longitude } }
    } catch {
      return failure(LocationFailureCode.UNAVAILABLE)
    }
  }
}
