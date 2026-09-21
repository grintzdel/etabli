import type { DirectoryPoint } from '../model/atelier'

const EARTH_RADIUS_KM = 6371

const toRad = (degrees: number): number => (degrees * Math.PI) / 180

export const distanceKm = (from: DirectoryPoint, to: DirectoryPoint): number => {
  const dLat = toRad(to.latitude - from.latitude)
  const dLng = toRad(to.longitude - from.longitude)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}
