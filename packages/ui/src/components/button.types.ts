export const buttonVariant = {
  primary: 'primary',
  ghost: 'ghost',
  danger: 'danger',
} as const

export type ButtonVariant = (typeof buttonVariant)[keyof typeof buttonVariant]

export const buttonSize = {
  sm: 'sm',
  md: 'md',
} as const

export type ButtonSize = (typeof buttonSize)[keyof typeof buttonSize]

export type ButtonOwnProps = {
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
}
