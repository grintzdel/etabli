import { MembershipRoleSchema, MembershipStatusSchema } from '@etabli/shared/auth-context'
import { AtelierId, MachineId, MembershipId, UserId } from '@etabli/shared/schema'
import * as Schema from 'effect/Schema'

import {
  AtelierStatus,
  DEFAULT_SLOT_MINUTES,
  DIRECTORY_MAX_PAGE_SIZE,
  DIRECTORY_PAGE_SIZE,
  MachineKind,
  MachineStatus,
  MAX_PRACTICES,
  MAX_SLOT_MINUTES,
  MIN_SLOT_MINUTES,
} from './atelier.constants'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const Slug = Schema.transform(Schema.String, Schema.String.pipe(Schema.pattern(SLUG_PATTERN)), {
  strict: true,
  decode: (raw) => raw.trim().toLowerCase(),
  encode: (normalized) => normalized,
})
  .pipe(Schema.brand('Slug'))
  .annotations({ message: () => 'Identifiant d’URL invalide' })
export type Slug = Schema.Schema.Type<typeof Slug>

export const Latitude = Schema.Number.pipe(Schema.between(-90, 90)).annotations({
  message: () => 'Latitude hors des bornes',
})

export const Longitude = Schema.Number.pipe(Schema.between(-180, 180)).annotations({
  message: () => 'Longitude hors des bornes',
})

export const AtelierStatusSchema = Schema.Literal(AtelierStatus.DRAFT, AtelierStatus.PUBLISHED, AtelierStatus.CLOSED)

export const MachineKindSchema = Schema.Literal(
  MachineKind.LASER_CUTTER,
  MachineKind.PRINTER_3D,
  MachineKind.CNC_MILL,
  MachineKind.WOOD_LATHE,
  MachineKind.SEWING,
  MachineKind.ELECTRONICS_BENCH
)

export const MachineStatusSchema = Schema.Literal(
  MachineStatus.AVAILABLE,
  MachineStatus.MAINTENANCE,
  MachineStatus.RETIRED
)

export const AtelierSchema = Schema.Struct({
  id: AtelierId,
  slug: Slug,
  name: Schema.String,
  description: Schema.String,
  street: Schema.String,
  postalCode: Schema.String,
  city: Schema.String,
  country: Schema.String,
  latitude: Latitude,
  longitude: Longitude,
  status: AtelierStatusSchema,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
})
export type Atelier = Schema.Schema.Type<typeof AtelierSchema>

export const MachineSchema = Schema.Struct({
  id: MachineId,
  atelierId: AtelierId,
  name: Schema.String,
  description: Schema.String,
  kind: MachineKindSchema,
  requiresCertification: Schema.Boolean,
  slotDurationMinutes: Schema.Int,
  status: MachineStatusSchema,
  nfcTagId: Schema.NullOr(Schema.String),
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
})
export type Machine = Schema.Schema.Type<typeof MachineSchema>

export const MembershipSchema = Schema.Struct({
  id: MembershipId,
  userId: UserId,
  atelierId: AtelierId,
  role: MembershipRoleSchema,
  status: MembershipStatusSchema,
  joinedAt: Schema.DateTimeUtc,
})
export type Membership = Schema.Schema.Type<typeof MembershipSchema>

export const AtelierSummarySchema = Schema.Struct({
  id: AtelierId,
  slug: Slug,
  name: Schema.String,
  description: Schema.String,
  city: Schema.String,
  country: Schema.String,
  latitude: Latitude,
  longitude: Longitude,
  machineCount: Schema.Int,
  machineKinds: Schema.Array(MachineKindSchema),
  distanceKm: Schema.NullOr(Schema.Number),
})
export type AtelierSummary = Schema.Schema.Type<typeof AtelierSummarySchema>

export const PublicMachineSchema = Schema.Struct({
  id: MachineId,
  name: Schema.String,
  description: Schema.String,
  kind: MachineKindSchema,
  requiresCertification: Schema.Boolean,
  slotDurationMinutes: Schema.Int,
  status: MachineStatusSchema,
})
export type PublicMachine = Schema.Schema.Type<typeof PublicMachineSchema>

export const AtelierDetailSchema = Schema.Struct({
  id: AtelierId,
  slug: Slug,
  name: Schema.String,
  description: Schema.String,
  street: Schema.String,
  postalCode: Schema.String,
  city: Schema.String,
  country: Schema.String,
  latitude: Latitude,
  longitude: Longitude,
  machines: Schema.Array(PublicMachineSchema),
})
export type AtelierDetail = Schema.Schema.Type<typeof AtelierDetailSchema>

export const ListAteliersParamsSchema = Schema.Struct({
  city: Schema.optional(Schema.Trim.pipe(Schema.minLength(1))),
  machineKind: Schema.optional(MachineKindSchema),
  lat: Schema.optional(Schema.NumberFromString.pipe(Schema.between(-90, 90))),
  lng: Schema.optional(Schema.NumberFromString.pipe(Schema.between(-180, 180))),
  radiusKm: Schema.optional(Schema.NumberFromString.pipe(Schema.positive())),
  limit: Schema.optionalWith(Schema.NumberFromString.pipe(Schema.int(), Schema.between(1, DIRECTORY_MAX_PAGE_SIZE)), {
    default: () => DIRECTORY_PAGE_SIZE,
  }),
  offset: Schema.optionalWith(Schema.NumberFromString.pipe(Schema.int(), Schema.nonNegative()), {
    default: () => 0,
  }),
}).pipe(
  Schema.filter((params) =>
    [params.lat, params.lng, params.radiusKm].filter((value) => value !== undefined).length % 3 === 0
      ? true
      : 'lat, lng et radiusKm vont ensemble'
  )
)
export type ListAteliersParams = Schema.Schema.Type<typeof ListAteliersParamsSchema>

export const toAtelierDetail = (atelier: Atelier, machines: ReadonlyArray<Machine>): AtelierDetail => ({
  id: atelier.id,
  slug: atelier.slug,
  name: atelier.name,
  description: atelier.description,
  street: atelier.street,
  postalCode: atelier.postalCode,
  city: atelier.city,
  country: atelier.country,
  latitude: atelier.latitude,
  longitude: atelier.longitude,
  machines: machines
    .filter((machine) => machine.status !== MachineStatus.RETIRED)
    .map((machine) => ({
      id: machine.id,
      name: machine.name,
      description: machine.description,
      kind: machine.kind,
      requiresCertification: machine.requiresCertification,
      slotDurationMinutes: machine.slotDurationMinutes,
      status: machine.status,
    })),
})

export const Practice = Schema.Array(Schema.Trim.pipe(Schema.minLength(1)))
  .pipe(Schema.minItems(1), Schema.maxItems(MAX_PRACTICES))
  .annotations({ message: () => 'Déclarez au moins une pratique' })

export const CompleteOnboardingSchema = Schema.Struct({
  atelierId: AtelierId,
  practice: Practice,
})
export type CompleteOnboarding = Schema.Schema.Type<typeof CompleteOnboardingSchema>

export const OnboardingResultSchema = Schema.Struct({
  atelierId: AtelierId,
  atelierSlug: Slug,
  atelierName: Schema.String,
  role: MembershipRoleSchema,
  practice: Schema.Array(Schema.String),
  joinedAt: Schema.DateTimeUtc,
})
export type OnboardingResult = Schema.Schema.Type<typeof OnboardingResultSchema>

export const CreateAtelierSchema = Schema.Struct({
  slug: Slug,
  name: Schema.Trim.pipe(Schema.minLength(1)).annotations({ message: () => 'Le nom est obligatoire' }),
  description: Schema.optionalWith(Schema.Trim, { default: () => '' }),
  street: Schema.optionalWith(Schema.Trim, { default: () => '' }),
  postalCode: Schema.optionalWith(Schema.Trim, { default: () => '' }),
  city: Schema.Trim.pipe(Schema.minLength(1)).annotations({ message: () => 'La ville est obligatoire' }),
  country: Schema.optionalWith(Schema.Trim.pipe(Schema.minLength(1)), { default: () => 'FR' }),
  latitude: Latitude,
  longitude: Longitude,
})
export type CreateAtelier = Schema.Schema.Type<typeof CreateAtelierSchema>

export const SetAtelierStatusSchema = Schema.Struct({ status: AtelierStatusSchema })
export type SetAtelierStatus = Schema.Schema.Type<typeof SetAtelierStatusSchema>

export const AdminAtelierSchema = Schema.Struct({
  id: AtelierId,
  slug: Slug,
  name: Schema.String,
  city: Schema.String,
  status: AtelierStatusSchema,
  machineCount: Schema.Int,
  createdAt: Schema.DateTimeUtc,
})
export type AdminAtelier = Schema.Schema.Type<typeof AdminAtelierSchema>

export const toAdminAtelier = (atelier: Atelier, machineCount: number): AdminAtelier => ({
  id: atelier.id,
  slug: atelier.slug,
  name: atelier.name,
  city: atelier.city,
  status: atelier.status,
  machineCount,
  createdAt: atelier.createdAt,
})

export const CreateMachineSchema = Schema.Struct({
  atelierId: AtelierId,
  name: Schema.Trim.pipe(Schema.minLength(1)).annotations({ message: () => 'Le nom de la machine est obligatoire' }),
  description: Schema.optionalWith(Schema.Trim, { default: () => '' }),
  kind: MachineKindSchema,
  requiresCertification: Schema.optionalWith(Schema.Boolean, { default: () => true }),
  slotDurationMinutes: Schema.optionalWith(Schema.Int.pipe(Schema.between(MIN_SLOT_MINUTES, MAX_SLOT_MINUTES)), {
    default: () => DEFAULT_SLOT_MINUTES,
  }),
  nfcTagId: Schema.optionalWith(Schema.NullOr(Schema.Trim.pipe(Schema.minLength(1))), { default: () => null }),
})
export type CreateMachine = Schema.Schema.Type<typeof CreateMachineSchema>

export const UpdateMachineSchema = Schema.Struct({
  name: Schema.optional(Schema.Trim.pipe(Schema.minLength(1))),
  description: Schema.optional(Schema.Trim),
  status: Schema.optional(MachineStatusSchema),
  requiresCertification: Schema.optional(Schema.Boolean),
  slotDurationMinutes: Schema.optional(Schema.Int.pipe(Schema.between(MIN_SLOT_MINUTES, MAX_SLOT_MINUTES))),
})
export type UpdateMachine = Schema.Schema.Type<typeof UpdateMachineSchema>

export const ManagedAtelierSchema = Schema.Struct({
  id: AtelierId,
  slug: Slug,
  name: Schema.String,
  status: AtelierStatusSchema,
})

export const ManagedParcSchema = Schema.Struct({
  atelier: ManagedAtelierSchema,
  machines: Schema.Array(MachineSchema),
})
export type ManagedParc = Schema.Schema.Type<typeof ManagedParcSchema>

export const toManagedParc = (atelier: Atelier, machines: ReadonlyArray<Machine>): ManagedParc => ({
  atelier: { id: atelier.id, slug: atelier.slug, name: atelier.name, status: atelier.status },
  machines,
})
