import { BadRequestException, type PipeTransform } from '@nestjs/common'
import type { ZodType } from 'zod'

export class ZodValidationPipe<A> implements PipeTransform<unknown, A> {
  constructor(private readonly schema: ZodType<A>) {}

  transform(value: unknown): A {
    const result = this.schema.safeParse(value)
    if (result.success) return result.data

    throw new BadRequestException({
      code: 'VALIDATION_FAILED',
      message: 'Requête invalide',
      errors: result.error.flatten().fieldErrors,
    })
  }
}
