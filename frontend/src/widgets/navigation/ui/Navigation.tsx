import { Link, NavLink } from 'react-router-dom'
import { useNavigation } from '../model/useNavigation'

const navigationItems = [
  { label: '인트로', to: '/intro', end: true },
  { label: '연구 데이터', to: '/intro/research', end: false },
  { label: '분석 리포트', to: '/intro/reports', end: false },
] as const

function navigationLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center border-b-2 px-1 text-sm font-semibold no-underline transition-colors duration-150',
    'focus-visible:rounded-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brand',
    isActive
      ? 'border-brand text-brand-strong'
      : 'border-transparent text-ink-muted hover:border-line hover:text-ink',
  ].join(' ')
}

export function Navigation() {
  const {
    nickname,
    email,
    isSuperAdmin,
    globalError,
    isSubmitting,
    handleLogout,
  } = useNavigation()

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto grid min-h-[72px] max-w-app grid-cols-[auto_1fr_auto] items-center gap-x-10 px-6 max-md:grid-cols-[1fr_auto] max-md:gap-x-4 max-md:py-3 max-sm:grid-cols-1 max-sm:gap-y-2 lg:px-10">
          <Link
            className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap text-xl font-bold tracking-[-0.01em] text-ink no-underline focus-visible:rounded-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brand"
            to="/intro"
          >
            Necton RD
          </Link>

          <nav
            aria-label="주요 메뉴"
            className="flex min-w-0 items-stretch gap-7 max-md:order-3 max-md:col-span-2 max-md:mt-2 max-md:w-full max-md:overflow-x-auto max-md:overscroll-x-contain max-sm:col-span-1 max-sm:mt-1"
          >
            {navigationItems.map((item) => (
              <NavLink
                className={navigationLinkClass}
                end={item.end}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
            {isSuperAdmin && (
              <NavLink
                className={navigationLinkClass}
                to="/intro/settings"
              >
                설정
              </NavLink>
            )}
          </nav>

          <div className="flex min-w-0 items-center justify-end gap-2 max-sm:w-full max-sm:justify-between">
            <NavLink
              aria-label="마이페이지"
              className={({ isActive }) =>
                [
                  'flex min-h-11 min-w-0 max-w-72 items-center gap-2 rounded-control px-2.5 py-1.5 text-left no-underline transition-colors duration-150 max-sm:max-w-[calc(100%-92px)]',
                  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand',
                  isActive
                    ? 'bg-brand-soft'
                    : 'hover:bg-canvas',
                ].join(' ')
              }
              to="/intro/profile"
              title={email}
            >
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white"
              >
                {(nickname || email || 'U').charAt(0).toUpperCase()}
              </span>
              <span className="flex min-w-0 flex-col">
                <strong className="truncate text-label leading-4.5 font-semibold text-ink">
                  {nickname || '내 계정'}
                </strong>
                <span className="truncate text-caption leading-4 text-ink-muted">
                  {email}
                </span>
              </span>
            </NavLink>
            <button
              className="min-h-11 shrink-0 cursor-pointer rounded-control border border-line bg-surface px-3.5 text-sm font-semibold text-brand transition-colors duration-150 hover:border-brand hover:bg-brand-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60"
              disabled={isSubmitting}
              onClick={handleLogout}
              type="button"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {globalError && (
        <div
          className="mx-auto mt-4 max-w-app px-6 text-sm text-danger lg:px-10"
          role="alert"
        >
          {globalError}
        </div>
      )}
    </>
  )
}
