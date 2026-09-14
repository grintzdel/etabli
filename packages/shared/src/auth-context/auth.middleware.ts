import { HttpApiMiddleware } from '@effect/platform'
import * as Schema from 'effect/Schema'

import { AccountSuspendedError, UnauthorizedError } from '../errors'
import { AuthContext } from './auth-context'

export class AuthMiddleware extends HttpApiMiddleware.Tag<AuthMiddleware>()('@etabli/AuthMiddleware', {
  failure: Schema.Union(UnauthorizedError, AccountSuspendedError),
  provides: AuthContext,
}) {}
