export interface Failure {
  readonly code: string
  readonly message: string
}

export type Result<A, F extends Failure = Failure> =
  | { readonly ok: true; readonly value: A }
  | { readonly ok: false; readonly error: F }
