import * as Schema from 'effect/Schema'

export const UserId = Schema.UUID.pipe(Schema.brand('UserId'))
export type UserId = Schema.Schema.Type<typeof UserId>

export const AtelierId = Schema.UUID.pipe(Schema.brand('AtelierId'))
export type AtelierId = Schema.Schema.Type<typeof AtelierId>

export const MachineId = Schema.UUID.pipe(Schema.brand('MachineId'))
export type MachineId = Schema.Schema.Type<typeof MachineId>

export const CertificationId = Schema.UUID.pipe(Schema.brand('CertificationId'))
export type CertificationId = Schema.Schema.Type<typeof CertificationId>

export const BookingId = Schema.UUID.pipe(Schema.brand('BookingId'))
export type BookingId = Schema.Schema.Type<typeof BookingId>
