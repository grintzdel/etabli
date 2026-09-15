export const MachineKind = {
  LASER_CUTTER: 'LASER_CUTTER',
  PRINTER_3D: 'PRINTER_3D',
  CNC_MILL: 'CNC_MILL',
  WOOD_LATHE: 'WOOD_LATHE',
  SEWING: 'SEWING',
  ELECTRONICS_BENCH: 'ELECTRONICS_BENCH',
} as const
export type MachineKind = (typeof MachineKind)[keyof typeof MachineKind]

export const MACHINE_KINDS = [
  MachineKind.LASER_CUTTER,
  MachineKind.PRINTER_3D,
  MachineKind.CNC_MILL,
  MachineKind.WOOD_LATHE,
  MachineKind.SEWING,
  MachineKind.ELECTRONICS_BENCH,
] as const

export const MachineStatus = {
  AVAILABLE: 'AVAILABLE',
  MAINTENANCE: 'MAINTENANCE',
  RETIRED: 'RETIRED',
} as const
export type MachineStatus = (typeof MachineStatus)[keyof typeof MachineStatus]

export const MACHINE_STATUSES = [MachineStatus.AVAILABLE, MachineStatus.MAINTENANCE, MachineStatus.RETIRED] as const

export const DEFAULT_SLOT_MINUTES = 60
export const MIN_SLOT_MINUTES = 15
export const MAX_SLOT_MINUTES = 480
