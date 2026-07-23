export const authStyles = {
  page: [
    'grid min-h-screen min-h-svh place-items-center bg-[var(--auth-background)] px-10 py-16',
    '[@media(max-width:560px)]:items-start [@media(max-width:560px)]:px-5',
    '[@media(max-width:560px)]:py-8',
  ].join(' '),
  card: [
    'w-full max-w-[440px] rounded-xl bg-[var(--auth-surface)] p-14',
    'shadow-[0_2px_20px_rgb(32_39_52_/_7%)]',
    '[@media(max-width:560px)]:px-7 [@media(max-width:560px)]:py-10',
  ].join(' '),
  header: 'mb-11 [@media(max-width:560px)]:mb-9',
  title: [
    'm-0 text-2xl leading-[1.3] font-bold tracking-[-0.01em]',
    'text-[var(--auth-text)]',
  ].join(' '),
  subtitle: [
    'mt-2.5 mb-0 text-[15px] leading-[1.5] font-normal',
    'text-[var(--auth-muted)]',
  ].join(' '),
  notice: [
    '-mt-5 mb-6 rounded-lg border border-[var(--auth-notice-border)]',
    'bg-[var(--auth-notice-background)] px-3.5 py-3 text-[13px]',
    'leading-[1.5] text-[var(--auth-primary-hover)]',
  ].join(' '),
  form: 'flex flex-col gap-5',
  signupForm: 'flex flex-col gap-[18px]',
  field: 'flex flex-col gap-2',
  label: 'text-[13px] font-semibold text-[#565b63]',
  required: 'text-[var(--auth-primary)]',
  formErrors: '-mt-5 mb-6',
  error: 'm-0 text-xs leading-[1.5] text-[var(--auth-error)]',
  submit: [
    'mt-1 h-[50px] cursor-pointer rounded-lg border-0',
    'bg-[var(--auth-primary)] text-[15px] font-bold tracking-[0.01em] text-white',
    '[transition:background-color_150ms_ease,transform_100ms_ease]',
    'hover:bg-[var(--auth-primary-hover)]',
    'focus-visible:outline-3 focus-visible:outline-offset-3',
    'focus-visible:outline-[var(--auth-focus)]',
    'active:translate-y-px',
    'disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none',
  ].join(' '),
  switchText:
    'm-0 text-center text-[13px] leading-[1.5] text-[var(--auth-muted)]',
  link: [
    'ml-1 rounded-xs font-semibold text-[var(--auth-primary)] no-underline',
    'hover:underline focus-visible:outline-3 focus-visible:outline-offset-3',
    'focus-visible:outline-[var(--auth-focus)]',
  ].join(' '),
} as const

const inputBaseClassName = [
  'h-12 w-full rounded-lg border bg-[var(--auth-field-background)] px-4',
  'text-[15px] text-[var(--auth-text)] placeholder:text-[#9a9ea5]',
  'transition-[border-color,box-shadow,background-color] duration-150 ease-[ease]',
  'hover:bg-[var(--auth-surface)] focus-visible:bg-[var(--auth-surface)]',
  'focus-visible:outline-none motion-reduce:transition-none',
].join(' ')

const inputDefaultClassName = [
  'border-[var(--auth-border)] hover:border-[#c8ccd3]',
  'focus-visible:border-[var(--auth-primary)]',
  'focus-visible:shadow-[0_0_0_3px_var(--auth-focus)]',
].join(' ')

const inputErrorClassName = [
  'border-[var(--auth-error)] hover:border-[#c8ccd3]',
  'focus-visible:border-[var(--auth-error)]',
  'focus-visible:shadow-[0_0_0_3px_var(--auth-error-focus)]',
].join(' ')

export function authInputClassName(hasError: boolean) {
  return [
    inputBaseClassName,
    hasError ? inputErrorClassName : inputDefaultClassName,
  ].join(' ')
}
