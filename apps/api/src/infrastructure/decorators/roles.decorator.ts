import { SetMetadata } from '@nestjs/common'

import type { PlatformRole } from '../../shared/domain/roles.constant.ts'

export const ROLES_KEY = 'etabli:roles'

export const Roles = (...roles: ReadonlyArray<PlatformRole>) => SetMetadata(ROLES_KEY, roles)
