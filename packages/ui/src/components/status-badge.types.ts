export const statusTone = {
  ok: 'ok',
  warn: 'warn',
  danger: 'danger',
  neutral: 'neutral',
} as const

export type StatusTone = (typeof statusTone)[keyof typeof statusTone]

export type StatusBadgeOwnProps = {
  readonly tone?: StatusTone
  readonly label: string
}
