export type MapBounds = {
  readonly south: number
  readonly west: number
  readonly north: number
  readonly east: number
}

export type Located = {
  readonly latitude: number
  readonly longitude: number
}

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
