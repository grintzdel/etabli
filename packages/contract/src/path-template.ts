declare const parameters: unique symbol

/** Deliberately not a string: the value is one at runtime, but the transport must refuse it unresolved. */
export type PathTemplate<K extends string> = { readonly [parameters]: K }

export type PathParams<T extends string> = T extends `${string}:${infer P}/${infer Rest}`
  ? P | PathParams<`/${Rest}`>
  : T extends `${string}:${infer P}`
    ? P
    : never
