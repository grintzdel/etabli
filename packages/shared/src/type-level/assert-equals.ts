export type AssertEquals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : { readonly error: 'types differ'; readonly expected: A; readonly received: B }
