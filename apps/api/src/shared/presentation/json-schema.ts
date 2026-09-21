import type { ApiResponseOptions } from '@nestjs/swagger'
import { z, type ZodType } from 'zod'

type ResponseSchema = NonNullable<Extract<ApiResponseOptions, { schema?: unknown }>['schema']>

export const jsonSchema = (schema: ZodType): ResponseSchema => {
  const json = z.toJSONSchema(schema, { io: 'output', reused: 'inline', unrepresentable: 'any' })
  delete json['$schema']

  return json as ResponseSchema
}

export const jsonSchemaArray = (schema: ZodType): ResponseSchema => jsonSchema(z.array(schema))
