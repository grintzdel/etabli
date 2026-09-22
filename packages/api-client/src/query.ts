export type QueryParamValue = string | number | boolean | null | undefined

export type QueryParams = Readonly<Record<string, QueryParamValue | ReadonlyArray<QueryParamValue>>>

const isList = (value: QueryParamValue | ReadonlyArray<QueryParamValue>): value is ReadonlyArray<QueryParamValue> =>
  Array.isArray(value)

export const queryString = (query: QueryParams | undefined): string => {
  if (query === undefined) return ''

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    for (const entry of isList(value) ? value : [value]) {
      if (entry !== undefined && entry !== null) params.append(key, String(entry))
    }
  }

  const serialized = params.toString()
  return serialized === '' ? '' : `?${serialized}`
}
