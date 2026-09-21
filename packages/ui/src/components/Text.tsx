import { cva } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'

import { cn } from '../cn'
import type { TextOwnProps, TextTone, TextVariant } from './text.types'

const textVariants = cva('', {
  variants: {
    variant: {
      title: 'font-display text-4xl font-bold tracking-tight uppercase',
      heading: 'font-display text-2xl font-semibold tracking-wide uppercase',
      label: 'font-display text-sm font-semibold tracking-wide uppercase',
      body: 'text-base',
      caption: 'text-sm',
    } satisfies Record<TextVariant, string>,
    tone: {
      default: 'text-graphite-50',
      muted: 'text-graphite-300',
      accent: 'text-signal-500',
      danger: 'text-status-danger',
    } satisfies Record<TextTone, string>,
  },
  defaultVariants: { variant: 'body', tone: 'default' },
})

export type TextProps = HTMLAttributes<HTMLElement> &
  TextOwnProps & {
    readonly as?: 'div' | 'h1' | 'h2' | 'h3' | 'p' | 'span'
  }

export const Text = ({ as: Component = 'span', variant, tone, className, ...props }: TextProps) => (
  <Component className={cn(textVariants({ variant, tone }), className)} {...props} />
)
