export const textVariant = {
  title: 'title',
  heading: 'heading',
  label: 'label',
  body: 'body',
  caption: 'caption',
} as const

export type TextVariant = (typeof textVariant)[keyof typeof textVariant]

export const textTone = {
  default: 'default',
  muted: 'muted',
  accent: 'accent',
  danger: 'danger',
} as const

export type TextTone = (typeof textTone)[keyof typeof textTone]

export type TextOwnProps = {
  readonly variant?: TextVariant
  readonly tone?: TextTone
}
