'use client'

import 'leaflet/dist/leaflet.css'
import type { LatLngBounds, LatLngBoundsExpression } from 'leaflet'
import Link from 'next/link'
import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMapEvents } from 'react-leaflet'

import type { MapBounds } from '@/modules/atelier/core/lib/map-bounds'
import { boundsOf } from '@/modules/atelier/core/lib/map-bounds'
import type { AtelierSummary } from '@/modules/atelier/core/model/atelier'

export type AtelierMapProps = {
  readonly ateliers: ReadonlyArray<AtelierSummary>
  readonly onBoundsChange: (bounds: MapBounds) => void
}

const FRANCE_CENTER: [number, number] = [46.6, 2.4]

const toMapBounds = (bounds: LatLngBounds): MapBounds => ({
  south: bounds.getSouth(),
  west: bounds.getWest(),
  north: bounds.getNorth(),
  east: bounds.getEast(),
})

const ViewportReporter = ({ onBoundsChange }: Pick<AtelierMapProps, 'onBoundsChange'>) => {
  const map = useMapEvents({ moveend: () => onBoundsChange(toMapBounds(map.getBounds())) })

  useEffect(() => {
    onBoundsChange(toMapBounds(map.getBounds()))
  }, [map, onBoundsChange])

  return null
}

export const AtelierMap = ({ ateliers, onBoundsChange }: AtelierMapProps) => {
  const box = boundsOf(ateliers)
  const initialView: { bounds: LatLngBoundsExpression } | { center: [number, number]; zoom: number } =
    box === null
      ? { center: FRANCE_CENTER, zoom: 5 }
      : {
          bounds: [
            [box.south, box.west],
            [box.north, box.east],
          ],
        }

  return (
    <MapContainer
      {...initialView}
      boundsOptions={{ padding: [40, 40], maxZoom: 13 }}
      minZoom={3}
      scrollWheelZoom
      className="atelier-map h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ViewportReporter onBoundsChange={onBoundsChange} />
      {ateliers.map((atelier) => (
        <CircleMarker
          key={atelier.id}
          center={[atelier.latitude, atelier.longitude]}
          radius={8}
          pathOptions={{ className: 'atelier-marker' }}
        >
          <Popup>
            <Link href={`/ateliers/${atelier.slug}`} className="font-display font-semibold tracking-wide uppercase">
              {atelier.name}
            </Link>
            <br />
            {atelier.city}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
