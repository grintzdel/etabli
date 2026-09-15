import type { IdentityResult } from '../model/session'
import { failure, IdentityFailureCode } from '../model/session'

const BY_TAG: Readonly<Record<string, IdentityFailureCode>> = {
  EmailAlreadyTakenError: IdentityFailureCode.EMAIL_TAKEN,
  InvalidCredentialsError: IdentityFailureCode.INVALID_CREDENTIALS,
  AccountSuspendedError: IdentityFailureCode.ACCOUNT_SUSPENDED,
  UnauthorizedError: IdentityFailureCode.UNAUTHORIZED,
  PreferredAtelierNotJoinedError: IdentityFailureCode.PREFERRED_ATELIER_NOT_JOINED,
  ForbiddenError: IdentityFailureCode.FORBIDDEN,
  UserUnknownError: IdentityFailureCode.USER_UNKNOWN,
  AdminSelfLockoutError: IdentityFailureCode.SELF_LOCKOUT,
}

const tagOf = (body: unknown): string | undefined => {
  if (typeof body !== 'object' || body === null) return undefined
  const tag = (body as { readonly _tag?: unknown })._tag
  return typeof tag === 'string' ? tag : undefined
}

export const codeOf = (status: number, body: unknown): IdentityFailureCode => {
  const tag = tagOf(body)
  const mapped = tag === undefined ? undefined : BY_TAG[tag]
  if (mapped !== undefined) return mapped
  if (status === 400) return IdentityFailureCode.INVALID_INPUT
  if (status === 401) return IdentityFailureCode.UNAUTHORIZED
  return IdentityFailureCode.UNREACHABLE
}

export const requestIdentity = async <A>(
  baseUrl: string,
  path: string,
  init: RequestInit
): Promise<IdentityResult<A>> => {
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, { ...init, cache: 'no-store' })
  } catch {
    return failure(IdentityFailureCode.UNREACHABLE)
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) return failure(codeOf(response.status, body))

  return { ok: true, value: body as A }
}
