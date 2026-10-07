export type MapBounds = {
  readonly south: number
  readonly west: number
  readonly north: number
  readonly east: number
}

export type MapRegion = {
  readonly latitude: number
  readonly longitude: number
  readonly latitudeDelta: number
  readonly longitudeDelta: number
}

export type Located = {
  readonly latitude: number
  readonly longitude: number
}

export const FRANCE_REGION: MapRegion = { latitude: 46.6, longitude: 2.4, latitudeDelta: 10, longitudeDelta: 10 }

const MIN_DELTA = 0.05
const PADDING = 1.3

export const isWithinBounds = (point: Located, bounds: MapBounds): boolean => {
  if (point.latitude < bounds.south || point.latitude > bounds.north) return false
  if (bounds.east - bounds.west >= 360) return true

  return point.longitude >= bounds.west && point.longitude <= bounds.east
}

export const visibleIn = <A extends Located>(items: ReadonlyArray<A>, bounds: MapBounds | null): ReadonlyArray<A> =>
  bounds === null ? items : items.filter((item) => isWithinBounds(item, bounds))

export const boundsOf = (items: ReadonlyArray<Located>): MapBounds | null => {
  if (items.length === 0) return null

  const latitudes = items.map((item) => item.latitude)
  const longitudes = items.map((item) => item.longitude)

  return {
    south: Math.min(...latitudes),
    west: Math.min(...longitudes),
    north: Math.max(...latitudes),
    east: Math.max(...longitudes),
  }
}

export const boundsOfRegion = (region: MapRegion): MapBounds => ({
  south: region.latitude - region.latitudeDelta / 2,
  west: region.longitude - region.longitudeDelta / 2,
  north: region.latitude + region.latitudeDelta / 2,
  east: region.longitude + region.longitudeDelta / 2,
})

export const regionFitting = (items: ReadonlyArray<Located>): MapRegion => {
  const box = boundsOf(items)
  if (box === null) return FRANCE_REGION

  return {
    latitude: (box.south + box.north) / 2,
    longitude: (box.west + box.east) / 2,
    latitudeDelta: Math.max((box.north - box.south) * PADDING, MIN_DELTA),
    longitudeDelta: Math.max((box.east - box.west) * PADDING, MIN_DELTA),
  }
}
