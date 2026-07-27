import type { HTMLAttributes } from 'react'

type AlertTone = 'notice' | 'danger'
type AlertSize = 'default' | 'compact'

const toneClassNames: Record<AlertTone, string> = {
  notice: 'border-brand-line bg-brand-soft text-brand-strong',
  danger: 'border-danger-line bg-danger-soft text-danger',
}

const sizeClassNames: Record<AlertSize, string> = {
  default: 'text-label leading-normal',
  compact: 'text-xs leading-5',
}

export function Alert({
  className = '',
  role,
  size = 'default',
  tone = 'notice',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  size?: AlertSize
  tone?: AlertTone
}) {
  return (
    <div
      className={[
        'rounded-control border px-3.5 py-3',
        toneClassNames[tone],
        sizeClassNames[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role={role ?? (tone === 'danger' ? 'alert' : 'status')}
      {...props}
    />
  )
}
