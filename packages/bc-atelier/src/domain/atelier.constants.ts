export const AtelierStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CLOSED: 'CLOSED',
} as const
export type AtelierStatus = (typeof AtelierStatus)[keyof typeof AtelierStatus]

export const MachineKind = {
  LASER_CUTTER: 'LASER_CUTTER',
  PRINTER_3D: 'PRINTER_3D',
  CNC_MILL: 'CNC_MILL',
  WOOD_LATHE: 'WOOD_LATHE',
  SEWING: 'SEWING',
  ELECTRONICS_BENCH: 'ELECTRONICS_BENCH',
} as const
export type MachineKind = (typeof MachineKind)[keyof typeof MachineKind]

export const MachineStatus = {
  AVAILABLE: 'AVAILABLE',
  MAINTENANCE: 'MAINTENANCE',
  RETIRED: 'RETIRED',
} as const
export type MachineStatus = (typeof MachineStatus)[keyof typeof MachineStatus]

export const DIRECTORY_PAGE_SIZE = 20
export const DIRECTORY_MAX_PAGE_SIZE = 100
export const EARTH_RADIUS_KM = 6371
export const MAX_PRACTICES = 12

export const DEFAULT_SLOT_MINUTES = 60
export const MIN_SLOT_MINUTES = 15
export const MAX_SLOT_MINUTES = 480
