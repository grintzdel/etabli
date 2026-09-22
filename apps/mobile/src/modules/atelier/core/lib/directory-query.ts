import type { QueryParams } from '@etabli/api-client'

import { DIRECTORY_RADIUS_KM, type DirectoryFilters, type DirectoryPoint } from '../model/atelier'

// lat, lng and radiusKm travel together or not at all: the api schema refuses a lat without a
// radiusKm, and reading them off one nullable point is what keeps the trio whole.
export const directoryQuery = (point: DirectoryPoint | null, filters: DirectoryFilters): QueryParams => ({
  city: filters.city,
  machineKind: filters.machineKind,
  lat: point?.latitude,
  lng: point?.longitude,
  radiusKm: point === null ? undefined : DIRECTORY_RADIUS_KM,
})
