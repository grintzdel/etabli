import { AdminAtelierHttpAdapter } from '@/modules/atelier/core/adapters/admin-atelier.http.adapter'
import { AtelierHttpAdapter } from '@/modules/atelier/core/adapters/atelier.http.adapter'
import { ManageMachineHttpAdapter } from '@/modules/atelier/core/adapters/manage-machine.http.adapter'
import type { IAdminAtelierPort } from '@/modules/atelier/core/ports/admin-atelier.port'
import type { IAtelierPort } from '@/modules/atelier/core/ports/atelier.port'
import type { IManageMachinePort } from '@/modules/atelier/core/ports/manage-machine.port'
import { BookingHttpAdapter } from '@/modules/booking/core/adapters/booking.http.adapter'
import { ManageBookingHttpAdapter } from '@/modules/booking/core/adapters/manage-booking.http.adapter'
import type { IBookingPort } from '@/modules/booking/core/ports/booking.port'
import type { IManageBookingPort } from '@/modules/booking/core/ports/manage-booking.port'
import { CertificationHttpAdapter } from '@/modules/certification/core/adapters/certification.http.adapter'
import type { ICertificationPort } from '@/modules/certification/core/ports/certification.port'
import { AdminUserHttpAdapter } from '@/modules/identity/core/adapters/admin-user.http.adapter'
import { IdentityHttpAdapter } from '@/modules/identity/core/adapters/identity.http.adapter'
import { PreferencesHttpAdapter } from '@/modules/identity/core/adapters/preferences.http.adapter'
import type { IAdminUserPort } from '@/modules/identity/core/ports/admin-user.port'
import type { IIdentityPort } from '@/modules/identity/core/ports/identity.port'
import type { IPreferencesPort } from '@/modules/identity/core/ports/preferences.port'

const apiUrl = process.env.API_URL ?? 'http://localhost:3001'

export const identityPort: IIdentityPort = new IdentityHttpAdapter(apiUrl)
export const preferencesPort: IPreferencesPort = new PreferencesHttpAdapter(apiUrl)
export const atelierPort: IAtelierPort = new AtelierHttpAdapter(apiUrl)
export const adminAtelierPort: IAdminAtelierPort = new AdminAtelierHttpAdapter(apiUrl)
export const adminUserPort: IAdminUserPort = new AdminUserHttpAdapter(apiUrl)
export const manageMachinePort: IManageMachinePort = new ManageMachineHttpAdapter(apiUrl)
export const certificationPort: ICertificationPort = new CertificationHttpAdapter(apiUrl)
export const bookingPort: IBookingPort = new BookingHttpAdapter(apiUrl)
export const manageBookingPort: IManageBookingPort = new ManageBookingHttpAdapter(apiUrl)
