export const safeNext = (candidate: string | null | undefined, fallback: string): string =>
  typeof candidate === 'string' && candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : fallback
