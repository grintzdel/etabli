import { colors, radii } from '@etabli/ui/tokens'
import { StyleSheet, useColorScheme, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'

import { boundsOfRegion, regionFitting, type MapBounds } from '../../core/lib/map-region'
import type { AtelierSummary } from '../../core/model/atelier'

const MAP_HEIGHT = 280

export type AtelierMapProps = {
  readonly ateliers: ReadonlyArray<AtelierSummary>
  readonly showsUserLocation: boolean
  readonly onBoundsChange: (bounds: MapBounds) => void
  readonly onSelect: (slug: string) => void
}

export const AtelierMap = ({ ateliers, showsUserLocation, onBoundsChange, onSelect }: AtelierMapProps) => {
  const scheme = useColorScheme() === 'light' ? 'light' : 'dark'
  const palette = colors[scheme]

  return (
    <View
      accessibilityLabel="Carte des ateliers"
      style={[styles.frame, { backgroundColor: palette.graphite[900], borderColor: palette.graphite[800] }]}
    >
      <MapView
        style={styles.map}
        initialRegion={regionFitting(ateliers)}
        onRegionChangeComplete={(region) => onBoundsChange(boundsOfRegion(region))}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={showsUserLocation}
        toolbarEnabled={false}
        userInterfaceStyle={scheme}
      >
        {ateliers.map((atelier) => (
          <Marker
            key={atelier.id}
            coordinate={{ latitude: atelier.latitude, longitude: atelier.longitude }}
            title={atelier.name}
            description={atelier.city}
            pinColor={palette.signal[500]}
            onCalloutPress={() => onSelect(atelier.slug)}
          />
        ))}
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  frame: { borderRadius: radii.sm, borderWidth: StyleSheet.hairlineWidth, height: MAP_HEIGHT, overflow: 'hidden' },
  map: { flex: 1 },
})
