import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
})

export type Env = z.infer<typeof envSchema>

export const readEnv = (source: NodeJS.ProcessEnv = process.env): Env => {
  const parsed = envSchema.safeParse(source)
  if (parsed.success) return parsed.data
  throw new Error(`Configuration invalide :\n${z.prettifyError(parsed.error)}`)
}
