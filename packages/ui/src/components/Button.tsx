import type { ButtonHTMLAttributes } from 'react'

import { cn } from '../cn'
import { buttonVariants } from './button-variants'
import type { ButtonOwnProps } from './button.types'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonOwnProps

export const Button = ({ className, variant, size, type = 'button', ...props }: ButtonProps) => (
  <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
)
