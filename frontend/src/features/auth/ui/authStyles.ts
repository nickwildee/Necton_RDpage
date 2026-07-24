export const authStyles = {
  page: [
    'grid min-h-screen min-h-svh place-items-center bg-canvas px-10 py-16',
    '[@media(max-width:560px)]:items-start [@media(max-width:560px)]:px-5',
    '[@media(max-width:560px)]:py-8',
  ].join(' '),
  card: [
    'w-full max-w-auth rounded-panel bg-surface p-14',
    'shadow-panel',
    '[@media(max-width:560px)]:px-7 [@media(max-width:560px)]:py-10',
  ].join(' '),
  header: 'mb-11 [@media(max-width:560px)]:mb-9',
  title: [
    'm-0 text-2xl leading-[1.3] font-bold tracking-[-0.01em]',
    'text-ink',
  ].join(' '),
  subtitle: [
    'mt-2.5 mb-0 text-control leading-[1.5] font-normal',
    'text-ink-muted',
  ].join(' '),
  notice: [
    '-mt-5 mb-6 rounded-control border border-brand-line',
    'bg-brand-soft px-3.5 py-3 text-label',
    'leading-[1.5] text-brand-strong',
  ].join(' '),
  form: 'flex flex-col gap-5',
  signupForm: 'flex flex-col gap-[18px]',
  field: 'flex flex-col gap-2',
  label: 'text-label font-semibold text-ink-secondary',
  required: 'text-brand',
  formErrors: '-mt-5 mb-6',
  error: 'm-0 text-xs leading-[1.5] text-danger',
  submit: [
    'mt-1 h-[50px] cursor-pointer rounded-control border-0',
    'bg-brand text-control font-bold tracking-[0.01em] text-white',
    '[transition:background-color_150ms_ease,transform_100ms_ease]',
    'hover:bg-brand-strong',
    'focus-visible:outline-3 focus-visible:outline-offset-3',
    'focus-visible:outline-focus-ring',
    'active:translate-y-px',
    'disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none',
  ].join(' '),
  switchText:
    'm-0 text-center text-label leading-[1.5] text-ink-muted',
  link: [
    'ml-1 rounded-xs font-semibold text-brand no-underline',
    'hover:underline focus-visible:outline-3 focus-visible:outline-offset-3',
    'focus-visible:outline-focus-ring',
  ].join(' '),
} as const

const inputBaseClassName = [
  'h-12 w-full rounded-control border bg-surface-field px-4',
  'text-control text-ink placeholder:text-ink-subtle',
  'transition-[border-color,box-shadow,background-color] duration-150 ease-[ease]',
  'hover:bg-surface focus-visible:bg-surface',
  'focus-visible:outline-none motion-reduce:transition-none',
].join(' ')

const inputDefaultClassName = [
  'border-line hover:border-line-strong',
  'focus-visible:border-brand',
  'focus-visible:shadow-focus',
].join(' ')

const inputErrorClassName = [
  'border-danger hover:border-line-strong',
  'focus-visible:border-danger',
  'focus-visible:shadow-danger-focus',
].join(' ')

export function authInputClassName(hasError: boolean) {
  return [
    inputBaseClassName,
    hasError ? inputErrorClassName : inputDefaultClassName,
  ].join(' ')
}
