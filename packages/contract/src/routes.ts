type RouteNode = string | { readonly [key: string]: RouteNode }

export const routes = {
  health: '/health',
  ateliers: {
    list: '/ateliers',
    getBySlug: '/ateliers/:slug',
  },
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    me: '/auth/me',
    password: '/auth/password',
  },
  onboarding: {
    complete: '/onboarding/complete',
  },
  me: {
    preferences: '/me/preferences',
    ateliers: '/me/ateliers',
  },
  machines: {
    list: '/machines',
    getById: '/machines/:id',
    availability: '/machines/:id/availability',
  },
  bookings: {
    create: '/bookings',
    list: '/bookings',
    getById: '/bookings/:id',
    cancel: '/bookings/:id/cancel',
    checkIn: '/bookings/:id/check-in',
  },
  certifications: {
    request: '/certifications',
    mine: '/certifications/mine',
  },
  manage: {
    certifications: '/manage/certifications',
    grantCertification: '/manage/certifications/:id/grant',
    revokeCertification: '/manage/certifications/:id/revoke',
    machines: '/manage/machines',
    machine: '/manage/machines/:id',
    bookings: '/manage/bookings',
    checkInBooking: '/manage/bookings/:id/check-in',
    noShow: '/manage/bookings/:id/no-show',
    cancelBooking: '/manage/bookings/:id/cancel',
    stats: '/manage/stats',
  },
  admin: {
    ateliers: '/admin/ateliers',
    atelier: '/admin/ateliers/:id',
    atelierMember: '/admin/ateliers/:atelierId/members/:userId',
    users: '/admin/users',
    user: '/admin/users/:id',
    stats: '/admin/stats',
  },
} as const satisfies RouteNode

export const flattenRoutes = (node: RouteNode, prefix = ''): ReadonlyArray<readonly [string, string]> => {
  if (typeof node === 'string') return [[prefix, node]]
  return Object.entries(node).flatMap(([key, child]) => flattenRoutes(child, prefix === '' ? key : `${prefix}.${key}`))
}
