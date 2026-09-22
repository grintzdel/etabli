import { queryString, type QueryParams } from './query'
import { makeFailure, type Result } from './result'

export const UNREACHABLE_STATUS = 0

export type HttpMethod = 'GET' | 'POST' | 'PATCH'

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export type AuthTokenProvider = () => string | null | undefined | Promise<string | null | undefined>

export interface ApiRequest {
  readonly method?: HttpMethod
  readonly token?: string
  readonly body?: unknown
  readonly query?: QueryParams
  readonly cache?: RequestCache
  readonly signal?: AbortSignal
  readonly timeoutMs?: number
}

export type BodylessRequest = Omit<ApiRequest, 'method' | 'body'>

export interface ApiClientConfig<C extends string> {
  readonly baseUrl: string
  readonly messages: Readonly<Record<C, string>>
  readonly failureOf: (status: number, body: unknown) => C
  readonly cache?: RequestCache
  readonly getAuthToken?: AuthTokenProvider
  readonly timeoutMs?: number
  readonly fetch?: FetchLike
}

export interface ApiClient<C extends string> {
  readonly call: <A>(path: string, request?: ApiRequest) => Promise<Result<A, C>>
  readonly get: <A>(path: string, request?: BodylessRequest) => Promise<Result<A, C>>
  readonly post: <A>(path: string, body?: unknown, request?: BodylessRequest) => Promise<Result<A, C>>
  readonly patch: <A>(path: string, body?: unknown, request?: BodylessRequest) => Promise<Result<A, C>>
}

const EMPTY_STATUSES: ReadonlySet<number> = new Set([204, 205])

const carriesNoBody = (response: Response): boolean =>
  EMPTY_STATUSES.has(response.status) || response.headers.get('content-length') === '0'

const headersOf = (request: ApiRequest, token: string | null | undefined): Record<string, string> => ({
  accept: 'application/json',
  ...(request.body === undefined ? {} : { 'content-type': 'application/json' }),
  ...(token === undefined || token === null || token === '' ? {} : { authorization: `Bearer ${token}` }),
})

interface Deadline {
  readonly signal: AbortSignal | undefined
  readonly release: () => void
}

/** AbortSignal.any is absent from Hermes, so the caller signal is forwarded by hand. */
const deadlineOf = (callerSignal: AbortSignal | undefined, timeoutMs: number | undefined): Deadline => {
  if (timeoutMs === undefined || timeoutMs <= 0) return { signal: callerSignal, release: () => {} }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const forward = () => controller.abort()

  if (callerSignal?.aborted === true) controller.abort()
  else callerSignal?.addEventListener('abort', forward)

  return {
    signal: controller.signal,
    release: () => {
      clearTimeout(timer)
      callerSignal?.removeEventListener('abort', forward)
    },
  }
}

export const createApiClient = <C extends string>(config: ApiClientConfig<C>): ApiClient<C> => {
  const failure = makeFailure(config.messages)
  const unreachable = (): Result<never, C> => failure(config.failureOf(UNREACHABLE_STATUS, null))
  const transport: FetchLike = config.fetch ?? ((url, init) => fetch(url, init))

  const call = async <A>(path: string, request: ApiRequest = {}): Promise<Result<A, C>> => {
    const token = request.token ?? (await config.getAuthToken?.())
    const cache = request.cache ?? config.cache
    const { signal, release } = deadlineOf(request.signal, request.timeoutMs ?? config.timeoutMs)

    let response: Response
    try {
      response = await transport(`${config.baseUrl}${path}${queryString(request.query)}`, {
        method: request.method ?? 'GET',
        headers: headersOf(request, token),
        ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
        ...(cache === undefined ? {} : { cache }),
        ...(signal === undefined ? {} : { signal }),
      })
    } catch {
      return unreachable()
    } finally {
      release()
    }

    const body: unknown = carriesNoBody(response) ? undefined : await response.json().catch(() => null)
    if (!response.ok) return failure(config.failureOf(response.status, body ?? null))
    if (body === null) return unreachable()

    return { ok: true, value: body as A }
  }

  return {
    call,
    get: <A>(path: string, request?: BodylessRequest) => call<A>(path, { ...request, method: 'GET' }),
    post: <A>(path: string, body?: unknown, request?: BodylessRequest) =>
      call<A>(path, { ...request, method: 'POST', body }),
    patch: <A>(path: string, body?: unknown, request?: BodylessRequest) =>
      call<A>(path, { ...request, method: 'PATCH', body }),
  }
}
