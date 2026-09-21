import type { InputHTMLAttributes } from 'react'

import { cn } from '../cn'
import type { TextFieldOwnProps } from './text-field.types'

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> &
  TextFieldOwnProps & {
    readonly name: string
  }

export const TextField = ({ label, name, invalid = false, className, ...props }: TextFieldProps) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={name} className="font-display text-graphite-200 text-sm font-semibold tracking-wide uppercase">
      {label}
    </label>
    <input
      id={name}
      name={name}
      aria-invalid={invalid || undefined}
      className={cn(
        'border-graphite-700 bg-graphite-900 text-graphite-50 placeholder:text-graphite-500 focus:border-signal-500 h-10 rounded-sm border px-3 outline-none',
        invalid && 'border-status-danger',
        className
      )}
      {...props}
    />
  </div>
)
