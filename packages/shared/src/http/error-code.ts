export const errorCodeOf = (body: unknown): string | undefined => {
  if (typeof body !== 'object' || body === null) return undefined
  const { code } = body as { readonly code?: unknown }
  return typeof code === 'string' ? code : undefined
}
