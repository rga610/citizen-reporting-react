import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { wuTypography } from '@/theme/wu'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--wu-primary)] text-white hover:bg-[var(--wu-primary-dark)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--wu-primary)] shadow-soft',
  secondary:
    'bg-white text-[var(--wu-primary)] border border-[var(--wu-primary)] hover:bg-[var(--wu-muted)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--wu-primary)]',
  outline:
    'border border-[var(--wu-primary)] text-[var(--wu-primary)] bg-transparent hover:bg-[var(--wu-muted)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--wu-primary)]',
  ghost:
    'bg-transparent text-[var(--wu-primary)] hover:bg-[var(--wu-muted)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--wu-primary)]',
  destructive:
    'border border-[var(--wu-danger)] text-[var(--wu-danger)] hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--wu-danger)]',
}

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-12 px-6 text-sm',
  sm: 'h-10 px-4 text-xs',
  lg: 'h-14 px-8 text-base',
  icon: 'h-12 w-12 p-0 flex items-center justify-center',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl transition-all duration-200 ease-out select-none disabled:opacity-60 disabled:pointer-events-none',
          wuTypography.button,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

