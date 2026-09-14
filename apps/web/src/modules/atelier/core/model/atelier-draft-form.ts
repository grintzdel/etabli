import type { CreateAtelierInput } from './atelier'

export interface AtelierDraftValues {
  readonly slug: string
  readonly name: string
  readonly description: string
  readonly street: string
  readonly postalCode: string
  readonly city: string
  readonly latitude: string
  readonly longitude: string
}

export interface AtelierDraftFormState {
  readonly error: string | null
  readonly values: AtelierDraftValues
}

export const emptyAtelierDraftValues: AtelierDraftValues = {
  slug: '',
  name: '',
  description: '',
  street: '',
  postalCode: '',
  city: '',
  latitude: '',
  longitude: '',
}

export const emptyAtelierDraftFormState: AtelierDraftFormState = { error: null, values: emptyAtelierDraftValues }

export type AtelierDraftFormAction = (
  state: AtelierDraftFormState,
  formData: FormData
) => Promise<AtelierDraftFormState>

const text = (formData: FormData, key: string): string => {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export const atelierDraftValues = (formData: FormData): AtelierDraftValues => ({
  slug: text(formData, 'slug'),
  name: text(formData, 'name'),
  description: text(formData, 'description'),
  street: text(formData, 'street'),
  postalCode: text(formData, 'postalCode'),
  city: text(formData, 'city'),
  latitude: text(formData, 'latitude'),
  longitude: text(formData, 'longitude'),
})

export type AtelierDraftParse =
  | { readonly ok: true; readonly input: CreateAtelierInput }
  | { readonly ok: false; readonly error: string; readonly values: AtelierDraftValues }

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const parseAtelierDraft = (formData: FormData): AtelierDraftParse => {
  const values = atelierDraftValues(formData)
  const refuse = (error: string): AtelierDraftParse => ({ ok: false, error, values })

  if (values.name.length === 0) return refuse('Le nom est obligatoire.')
  if (values.city.length === 0) return refuse('La ville est obligatoire.')
  if (!SLUG_PATTERN.test(values.slug.toLowerCase())) {
    return refuse('L’identifiant d’URL n’accepte que des minuscules, des chiffres et des tirets.')
  }

  const latitude = Number(values.latitude)
  const longitude = Number(values.longitude)
  if (values.latitude.length === 0 || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return refuse('La latitude est hors des bornes.')
  }
  if (values.longitude.length === 0 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return refuse('La longitude est hors des bornes.')
  }

  return {
    ok: true,
    input: {
      slug: values.slug.toLowerCase(),
      name: values.name,
      description: values.description,
      street: values.street,
      postalCode: values.postalCode,
      city: values.city,
      latitude,
      longitude,
    },
  }
}
