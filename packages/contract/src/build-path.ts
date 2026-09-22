import type { PathTemplate } from './path-template'

export const buildPath = <K extends string>(template: PathTemplate<K>, params: Readonly<Record<K, string>>): string => {
  const raw = template as unknown as string
  const values = params as Readonly<Record<string, string>>

  return raw.replaceAll(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = values[key]
    if (value === undefined) throw new Error(`Missing path parameter ":${key}" in "${raw}"`)
    return encodeURIComponent(value)
  })
}
