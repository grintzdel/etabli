export const buildPath = (template: string, params: Readonly<Record<string, string>> = {}): string =>
  template.replaceAll(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = params[key]
    if (value === undefined) throw new Error(`Missing path parameter ":${key}" in "${template}"`)
    return encodeURIComponent(value)
  })
