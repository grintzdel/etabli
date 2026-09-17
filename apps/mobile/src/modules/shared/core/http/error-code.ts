// The NestJS API names its refusals `code`; the Effect one it replaces names them `_tag`. Reading
// both keeps a refusal a refusal whichever server `pnpm dev` happens to boot.
export const errorCodeOf = (body: unknown): string | undefined => {
  if (typeof body !== 'object' || body === null) return undefined
  const { code, _tag: tag } = body as { readonly code?: unknown; readonly _tag?: unknown }
  if (typeof code === 'string') return code
  return typeof tag === 'string' ? tag : undefined
}
