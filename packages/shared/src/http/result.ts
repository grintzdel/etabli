export interface Failure<C extends string> {
  readonly code: C
  readonly message: string
}

export type Result<A, C extends string> =
  | { readonly ok: true; readonly value: A }
  | { readonly ok: false; readonly error: Failure<C> }

export const makeFailure =
  <C extends string>(messages: Readonly<Record<C, string>>) =>
  (code: C): Result<never, C> => ({ ok: false, error: { code, message: messages[code] } })
