import { cache } from 'react'

import type { MemberAtelier, Theme, UserPreferences } from '@/modules/identity/core/model/preferences'
import { DEFAULT_THEME } from '@/modules/identity/core/model/preferences'

import { preferencesPort } from './container'
import { readSessionToken } from './session'

export const readPreferences = cache(async (): Promise<UserPreferences | null> => {
  const token = await readSessionToken()
  if (token === null) return null

  const result = await preferencesPort.get(token)
  return result.ok ? result.value : null
})

export const readMyAteliers = cache(async (): Promise<ReadonlyArray<MemberAtelier>> => {
  const token = await readSessionToken()
  if (token === null) return []

  const result = await preferencesPort.myAteliers(token)
  return result.ok ? result.value : []
})

export const readTheme = async (): Promise<Theme> => (await readPreferences())?.theme ?? DEFAULT_THEME
