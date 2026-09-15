export const ATELIER_TIME_ZONE = 'Europe/Paris'

const day = new Intl.DateTimeFormat('fr-FR', {
  timeZone: ATELIER_TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const time = new Intl.DateTimeFormat('fr-FR', {
  timeZone: ATELIER_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
})

export const formatDay = (iso: string): string => day.format(new Date(iso))

export const formatTime = (iso: string): string => time.format(new Date(iso))

export const formatRange = (startAt: string, endAt: string): string => `${formatTime(startAt)} – ${formatTime(endAt)}`

export const formatMoment = (iso: string): string => `${formatDay(iso)} à ${formatTime(iso)}`
