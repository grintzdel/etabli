export const errorCodeOf = (body: unknown): string | undefined => {
  if (typeof body !== 'object' || body === null) return undefined
  const { code, _tag: tag } = body as { readonly code?: unknown; readonly _tag?: unknown }
  if (typeof code === 'string') return code
  return typeof tag === 'string' ? tag : undefined
}
