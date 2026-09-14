import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from './cn'

export const buttonVariants = cva(
  'font-display inline-flex items-center justify-center rounded-sm font-semibold tracking-wide uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-signal-500 text-graphite-950 hover:bg-signal-400',
        ghost: 'border-graphite-700 text-graphite-200 hover:border-graphite-600 hover:text-graphite-50 border',
        danger: 'bg-status-danger text-graphite-50 hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-5 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export const Button = ({ className, variant, size, type = 'button', ...props }: ButtonProps) => (
  <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
)
