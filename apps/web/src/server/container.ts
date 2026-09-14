import { AdminAtelierHttpAdapter } from '@/modules/atelier/core/adapters/admin-atelier.http.adapter'
import { AtelierHttpAdapter } from '@/modules/atelier/core/adapters/atelier.http.adapter'
import { ManageMachineHttpAdapter } from '@/modules/atelier/core/adapters/manage-machine.http.adapter'
import type { IAdminAtelierPort } from '@/modules/atelier/core/ports/admin-atelier.port'
import type { IAtelierPort } from '@/modules/atelier/core/ports/atelier.port'
import type { IManageMachinePort } from '@/modules/atelier/core/ports/manage-machine.port'
import { CertificationHttpAdapter } from '@/modules/certification/core/adapters/certification.http.adapter'
import type { ICertificationPort } from '@/modules/certification/core/ports/certification.port'
import { IdentityHttpAdapter } from '@/modules/identity/core/adapters/identity.http.adapter'
import type { IIdentityPort } from '@/modules/identity/core/ports/identity.port'

const apiUrl = process.env.API_URL ?? 'http://localhost:3001'

export const identityPort: IIdentityPort = new IdentityHttpAdapter(apiUrl)
export const atelierPort: IAtelierPort = new AtelierHttpAdapter(apiUrl)
export const adminAtelierPort: IAdminAtelierPort = new AdminAtelierHttpAdapter(apiUrl)
export const manageMachinePort: IManageMachinePort = new ManageMachineHttpAdapter(apiUrl)
export const certificationPort: ICertificationPort = new CertificationHttpAdapter(apiUrl)
