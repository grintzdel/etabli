import { Body, Param, Query } from '@nestjs/common'
import type { ZodType } from 'zod'

import { uuidParamSchema } from '../pipes/uuid-param.schema.ts'
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.ts'

export const ZodBody = <A>(schema: ZodType<A>): ParameterDecorator => Body(new ZodValidationPipe(schema))

export const ZodQuery = <A>(schema: ZodType<A>): ParameterDecorator => Query(new ZodValidationPipe(schema))

export const UuidParam = (name: string): ParameterDecorator => Param(name, new ZodValidationPipe(uuidParamSchema))
