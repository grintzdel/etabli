import { Image } from 'expo-image'
import { StyleSheet } from 'react-native'

import cover1 from '@/assets/ateliers/cover-1.png'
import cover2 from '@/assets/ateliers/cover-2.png'
import cover3 from '@/assets/ateliers/cover-3.png'
import cover4 from '@/assets/ateliers/cover-4.png'
import cnc from '@/assets/ateliers/kind-cnc-mill.webp'
import electronics from '@/assets/ateliers/kind-electronics-bench.webp'
import laser from '@/assets/ateliers/kind-laser-cutter.webp'
import printer from '@/assets/ateliers/kind-printer-3d.webp'
import sewing from '@/assets/ateliers/kind-sewing.webp'
import lathe from '@/assets/ateliers/kind-wood-lathe.webp'

import { photoKeyFor, type PhotoKey } from '../../core/lib/atelier-photo'
import type { MachineKind } from '../../core/model/atelier'

const PHOTOS: Readonly<Record<PhotoKey, number>> = {
  LASER_CUTTER: laser,
  PRINTER_3D: printer,
  CNC_MILL: cnc,
  WOOD_LATHE: lathe,
  SEWING: sewing,
  ELECTRONICS_BENCH: electronics,
  COVER_1: cover1,
  COVER_2: cover2,
  COVER_3: cover3,
  COVER_4: cover4,
}

export type AtelierPhotoProps = {
  readonly slug: string
  readonly kinds: ReadonlyArray<MachineKind>
  readonly height: number
}

export const AtelierPhoto = ({ slug, kinds, height }: AtelierPhotoProps) => (
  <Image source={PHOTOS[photoKeyFor(slug, kinds)]} style={[styles.photo, { height }]} contentFit="cover" />
)

const styles = StyleSheet.create({
  photo: { width: '100%' },
})
