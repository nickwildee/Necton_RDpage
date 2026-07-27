import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'neutral' | 'danger'
type ButtonSize =
  | 'compact'
  | 'control'
  | 'toolbar'
  | 'navigation'
  | 'large'

const baseClassName = [
  'inline-flex cursor-pointer items-center justify-center rounded-control border',
  'transition-[background-color,border-color,color,transform] duration-150',
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand',
  'active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60',
  'motion-reduce:transition-none',
].join(' ')

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    'border-brand bg-brand text-on-brand hover:bg-brand-strong',
  secondary:
    'border-line bg-surface text-brand hover:border-brand hover:bg-brand-soft',
  neutral:
    'border-line bg-surface text-ink-muted hover:bg-brand-soft',
  danger:
    'border-danger-line-strong bg-surface text-danger hover:bg-danger-soft',
}

const sizeClassNames: Record<ButtonSize, string> = {
  compact: 'min-h-10 px-4 text-xs font-bold',
  control: 'min-h-11 px-5 text-sm font-bold',
  toolbar: 'min-h-11 px-3.5 text-xs font-bold',
  navigation: 'min-h-11 px-3.5 text-sm font-semibold',
  large: 'h-[50px] px-5 text-control font-bold',
}

export function Button({
  className = '',
  fullWidth = false,
  size = 'control',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean
  size?: ButtonSize
  variant?: ButtonVariant
}) {
  return (
    <button
      className={[
        baseClassName,
        variantClassNames[variant],
        sizeClassNames[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      type={type}
      {...props}
    />
  )
}
