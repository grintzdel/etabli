import { IdentityHttpAdapter } from '@/modules/identity/core/adapters/identity.http.adapter'
import type { IIdentityPort } from '@/modules/identity/core/ports/identity.port'

export const identityPort: IIdentityPort = new IdentityHttpAdapter(process.env.API_URL ?? 'http://localhost:3001')
