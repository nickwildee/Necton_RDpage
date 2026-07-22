import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { requestError, useAuth } from '@features/auth'

const navigationItems = [
  { label: '인트로', to: '/intro', end: true },
  { label: '연구 데이터', to: '/intro/research', end: false },
  { label: '분석 리포트', to: '/intro/reports', end: false },
] as const

function navigationLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'inline-flex min-h-11 shrink-0 items-center border-b-2 px-1 text-sm font-semibold no-underline transition-colors duration-150',
    'focus-visible:rounded-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--auth-primary)]',
    isActive
      ? 'border-[var(--auth-primary)] text-[var(--auth-primary-hover)]'
      : 'border-transparent text-[var(--auth-muted)] hover:border-[var(--auth-border)] hover:text-[var(--auth-text)]',
  ].join(' ')
}

export function Navigation() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const displayName = user?.nickname?.trim() || user?.email || '사용자'
  const isSuperUser = user?.role === 'SUPER_USER'

  const handleLogout = async () => {
    setIsSubmitting(true)
    setGlobalError(null)

    try {
      await logout()
      navigate('/login', {
        replace: true,
        state: { notice: '로그아웃되었습니다.' },
      })
    } catch (error) {
      setGlobalError(requestError(error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <header className="border-b border-[var(--auth-border)] bg-[var(--auth-surface)]">
        <div className="mx-auto grid min-h-[72px] max-w-[1200px] grid-cols-[auto_1fr_auto] items-center gap-x-10 px-6 max-md:grid-cols-[1fr_auto] max-md:gap-x-4 max-md:py-3 lg:px-10">
          <Link
            className="shrink-0 text-xl font-bold tracking-[-0.01em] text-[var(--auth-text)] no-underline focus-visible:rounded-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--auth-primary)]"
            to="/intro"
          >
            Necton RD
          </Link>

          <nav
            aria-label="주요 메뉴"
            className="flex min-w-0 items-stretch gap-7 max-md:order-3 max-md:col-span-2 max-md:mt-2 max-md:w-full max-md:overflow-x-auto max-md:overscroll-x-contain"
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
            {isSuperUser && (
              <NavLink
                className={navigationLinkClass}
                to="/intro/settings"
              >
                설정
              </NavLink>
            )}
          </nav>

          <div className="flex min-w-0 items-center justify-end gap-3">
            <span
              className="max-w-48 truncate text-sm font-medium text-[var(--auth-text)] max-sm:max-w-28"
              title={user?.email}
            >
              {displayName}
            </span>
            <button
              className="min-h-11 shrink-0 cursor-pointer rounded-lg border border-[var(--auth-border)] bg-[var(--auth-surface)] px-4 text-sm font-semibold text-[var(--auth-primary)] transition-colors duration-150 hover:border-[var(--auth-primary)] hover:bg-[var(--auth-notice-background)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--auth-primary)] disabled:cursor-wait disabled:opacity-60"
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
          className="mx-auto mt-4 max-w-[1200px] px-6 text-sm text-[var(--auth-error)] lg:px-10"
          role="alert"
        >
          {globalError}
        </div>
      )}
    </>
  )
}
