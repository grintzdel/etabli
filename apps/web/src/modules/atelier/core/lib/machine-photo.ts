import type { MachineKind } from '../model/atelier'

const MACHINE_PHOTOS: Readonly<Record<MachineKind, string>> = {
  LASER_CUTTER: '/marketing/kind-laser-cutter.webp',
  PRINTER_3D: '/marketing/kind-printer-3d.webp',
  CNC_MILL: '/marketing/kind-cnc-mill.webp',
  WOOD_LATHE: '/marketing/kind-wood-lathe.webp',
  SEWING: '/marketing/kind-sewing.webp',
  ELECTRONICS_BENCH: '/marketing/kind-electronics-bench.webp',
}

export const machinePhotoFor = (kind: MachineKind): string => MACHINE_PHOTOS[kind]

export const atelierPhotoFor = (slug: string, kinds: ReadonlyArray<MachineKind>): string | null => {
  if (kinds.length === 0) return null

  const sum = [...slug].reduce((total, character) => total + character.codePointAt(0)!, 0)
  return MACHINE_PHOTOS[kinds[sum % kinds.length]!]
}
