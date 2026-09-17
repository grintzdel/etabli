export const UNREACHABLE = 0

export interface ApiRequest {
  readonly method?: 'GET' | 'POST' | 'PATCH'
  readonly token?: string
  readonly body?: unknown
  readonly query?: Readonly<Record<string, string | undefined>>
}

export interface ApiResponse {
  readonly status: number
  readonly body: unknown
}

const queryString = (query: ApiRequest['query']): string => {
  if (query === undefined) return ''
  const pairs = Object.entries(query).filter((entry): entry is [string, string] => entry[1] !== undefined)
  return pairs.length === 0 ? '' : `?${new URLSearchParams(pairs).toString()}`
}

const headersOf = (request: ApiRequest): Record<string, string> => ({
  accept: 'application/json',
  ...(request.body === undefined ? {} : { 'content-type': 'application/json' }),
  ...(request.token === undefined ? {} : { authorization: `Bearer ${request.token}` }),
})

export const sendApiRequest = async (baseUrl: string, path: string, request: ApiRequest = {}): Promise<ApiResponse> => {
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}${queryString(request.query)}`, {
      method: request.method ?? 'GET',
      headers: headersOf(request),
      ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
    })
  } catch {
    return { status: UNREACHABLE, body: null }
  }

  const body: unknown = await response.json().catch(() => null)
  return { status: response.status, body }
}
