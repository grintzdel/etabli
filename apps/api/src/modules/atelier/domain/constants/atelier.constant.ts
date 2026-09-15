export const AtelierStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CLOSED: 'CLOSED',
} as const
export type AtelierStatus = (typeof AtelierStatus)[keyof typeof AtelierStatus]

export const ATELIER_STATUSES = [AtelierStatus.DRAFT, AtelierStatus.PUBLISHED, AtelierStatus.CLOSED] as const

export const DIRECTORY_PAGE_SIZE = 20
export const DIRECTORY_MAX_PAGE_SIZE = 100
export const EARTH_RADIUS_KM = 6371
