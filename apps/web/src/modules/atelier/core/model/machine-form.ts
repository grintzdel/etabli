import type { CreateMachineInput, MachineKind } from './atelier'
import { isMachineKind } from './atelier'

export interface MachineFormValues {
  readonly atelierId: string
  readonly name: string
  readonly description: string
  readonly kind: string
  readonly slotDurationMinutes: string
  readonly requiresCertification: boolean
}

export interface MachineFormState {
  readonly error: string | null
  readonly values: MachineFormValues
}

export const emptyMachineFormValues: MachineFormValues = {
  atelierId: '',
  name: '',
  description: '',
  kind: 'LASER_CUTTER',
  slotDurationMinutes: '60',
  requiresCertification: true,
}

export const emptyMachineFormState: MachineFormState = { error: null, values: emptyMachineFormValues }

export type MachineFormAction = (state: MachineFormState, formData: FormData) => Promise<MachineFormState>

export const MIN_SLOT_MINUTES = 15
export const MAX_SLOT_MINUTES = 480

const text = (formData: FormData, key: string): string => {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export const machineFormValues = (formData: FormData): MachineFormValues => ({
  atelierId: text(formData, 'atelierId'),
  name: text(formData, 'name'),
  description: text(formData, 'description'),
  kind: text(formData, 'kind'),
  slotDurationMinutes: text(formData, 'slotDurationMinutes'),
  requiresCertification: formData.get('requiresCertification') !== null,
})

export type MachineFormParse =
  | { readonly ok: true; readonly input: CreateMachineInput }
  | { readonly ok: false; readonly error: string; readonly values: MachineFormValues }

export const parseMachineForm = (formData: FormData): MachineFormParse => {
  const values = machineFormValues(formData)
  const refuse = (error: string): MachineFormParse => ({ ok: false, error, values })

  if (values.atelierId.length === 0) return refuse('Choisissez un atelier.')
  if (values.name.length === 0) return refuse('Le nom de la machine est obligatoire.')
  if (!isMachineKind(values.kind)) return refuse('Ce type de machine n’existe pas.')

  const slot = Number(values.slotDurationMinutes)
  if (!Number.isInteger(slot) || slot < MIN_SLOT_MINUTES || slot > MAX_SLOT_MINUTES) {
    return refuse(`Le créneau va de ${MIN_SLOT_MINUTES} à ${MAX_SLOT_MINUTES} minutes.`)
  }

  const kind: MachineKind = values.kind

  return {
    ok: true,
    input: {
      atelierId: values.atelierId,
      name: values.name,
      description: values.description,
      kind,
      requiresCertification: values.requiresCertification,
      slotDurationMinutes: slot,
    },
  }
}
