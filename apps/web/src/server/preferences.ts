import { cache } from 'react'

import type { MemberAtelier, Theme, UserPreferences } from '@/modules/identity/core/model/preferences'
import { DEFAULT_THEME } from '@/modules/identity/core/model/preferences'

import { preferencesPort } from './container'
import { hasSession } from './session'

export const readPreferences = cache(async (): Promise<UserPreferences | null> => {
  if (!(await hasSession())) return null

  const result = await preferencesPort.get()
  return result.ok ? result.value : null
})

export const readMyAteliers = cache(async (): Promise<ReadonlyArray<MemberAtelier>> => {
  if (!(await hasSession())) return []

  const result = await preferencesPort.myAteliers()
  return result.ok ? result.value : []
})

export const readTheme = async (): Promise<Theme> => (await readPreferences())?.theme ?? DEFAULT_THEME
