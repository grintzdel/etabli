import { makeFailure, type Result } from './result'

export const UNREACHABLE_STATUS = 0

export interface ApiRequest {
  readonly method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  readonly token?: string
  readonly body?: unknown
  readonly query?: Readonly<Record<string, string | undefined>>
  readonly cache?: RequestCache
}

export interface ApiClientConfig<C extends string> {
  readonly baseUrl: string
  readonly messages: Readonly<Record<C, string>>
  readonly failureOf: (status: number, body: unknown) => C
  readonly cache?: RequestCache
}

export interface ApiClient<C extends string> {
  readonly call: <A>(path: string, request?: ApiRequest) => Promise<Result<A, C>>
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

export const createApiClient = <C extends string>(config: ApiClientConfig<C>): ApiClient<C> => {
  const failure = makeFailure(config.messages)
  // Status 0 is not an HTTP status: it stands for a request that never got an answer.
  const unreachable = (): Result<never, C> => failure(config.failureOf(UNREACHABLE_STATUS, null))

  return {
    call: async <A>(path: string, request: ApiRequest = {}): Promise<Result<A, C>> => {
      const cache = request.cache ?? config.cache
      let response: Response
      try {
        response = await fetch(`${config.baseUrl}${path}${queryString(request.query)}`, {
          method: request.method ?? 'GET',
          headers: headersOf(request),
          ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
          ...(cache === undefined ? {} : { cache }),
        })
      } catch {
        return unreachable()
      }

      const body: unknown = await response.json().catch(() => null)
      if (!response.ok) return failure(config.failureOf(response.status, body))
      if (body === null) return unreachable()

      return { ok: true, value: body as A }
    },
  }
}
