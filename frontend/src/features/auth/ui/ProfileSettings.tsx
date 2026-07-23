import type { UserRole } from '@entities/user'
import { ErrorMessages } from '@shared/ui'
import { useProfileSettings } from '../model/useProfileSettings'
import { authInputClassName } from './authStyles'

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: '최고 관리자',
  ORG_ADMIN: '조직 관리자',
  ORG_USER: '조직 사용자',
  USER: '일반 사용자',
}

const cardClassName = [
  'rounded-xl border border-[var(--auth-border)] bg-[var(--auth-surface)]',
  'p-6 shadow-[0_2px_20px_rgb(32_39_52_/_5%)] sm:p-7',
].join(' ')

const labelClassName = 'text-[13px] font-semibold text-[#565b63]'
const errorClassName =
  'mt-1 mb-0 text-xs leading-[1.5] text-[var(--auth-error)]'
const noticeClassName =
  'mb-4 rounded-lg border border-[var(--auth-notice-border)] bg-[var(--auth-notice-background)] px-3.5 py-3 text-[13px] leading-[1.5] text-[var(--auth-primary-hover)]'
const submitClassName = [
  'mt-1 min-h-11 cursor-pointer rounded-lg border-0 px-5',
  'bg-[var(--auth-primary)] text-sm font-bold text-white',
  'transition-colors duration-150 hover:bg-[var(--auth-primary-hover)]',
  'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--auth-focus)]',
  'disabled:cursor-wait disabled:opacity-70',
].join(' ')

export function ProfileSettings() {
  const {
    user,
    nickname,
    passwordFields,
    nicknameErrors,
    passwordErrors,
    nicknameMessage,
    passwordMessage,
    nicknameError,
    passwordError,
    isNicknameSubmitting,
    isPasswordSubmitting,
    handleNicknameChange,
    handlePasswordChange,
    handleNicknameSubmit,
    handlePasswordSubmit,
  } = useProfileSettings()

  if (!user) {
    return null
  }

  const initial = (user.nickname || user.email).charAt(0).toUpperCase()

  return (
    <div className="grid gap-5">
      <section className={cardClassName} aria-labelledby="account-summary">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-[var(--auth-primary)] text-lg font-bold text-white"
          >
            {initial}
          </span>
          <div className="min-w-0">
            <h2
              className="m-0 truncate text-lg font-bold text-[var(--auth-text)]"
              id="account-summary"
            >
              {user.nickname || '닉네임 없음'}
            </h2>
            <p className="mt-1 mb-0 truncate text-sm text-[var(--auth-muted)]">
              {user.email}
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-[var(--auth-notice-background)] px-3 py-1.5 text-xs font-semibold text-[var(--auth-primary-hover)]">
            {roleLabels[user.role]}
          </span>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className={cardClassName} aria-labelledby="nickname-title">
          <header className="mb-6">
            <h2
              className="m-0 text-lg font-bold text-[var(--auth-text)]"
              id="nickname-title"
            >
              닉네임 변경
            </h2>
            <p className="mt-1.5 mb-0 text-sm leading-6 text-[var(--auth-muted)]">
              네비게이션과 계정 화면에 표시할 이름입니다.
            </p>
          </header>

          {nicknameMessage && (
            <p className={noticeClassName} role="status">
              {nicknameMessage}
            </p>
          )}
          {nicknameError && (
            <p className={errorClassName} role="alert">
              {nicknameError}
            </p>
          )}

          <form
            className="flex flex-col gap-4"
            onSubmit={handleNicknameSubmit}
          >
            <div className="flex flex-col gap-2">
              <label className={labelClassName} htmlFor="profile-nickname">
                닉네임
              </label>
              <input
                aria-describedby={
                  nicknameErrors.nickname
                    ? 'profile-nickname-error'
                    : undefined
                }
                aria-invalid={
                  nicknameErrors.nickname ? true : undefined
                }
                autoComplete="nickname"
                className={authInputClassName(
                  Boolean(nicknameErrors.nickname),
                )}
                id="profile-nickname"
                maxLength={255}
                name="nickname"
                onChange={handleNicknameChange}
                placeholder="닉네임을 입력하세요"
                type="text"
                value={nickname}
              />
              <ErrorMessages
                className={errorClassName}
                id="profile-nickname-error"
                messages={nicknameErrors.nickname}
              />
            </div>
            <div>
              <button
                className={submitClassName}
                disabled={isNicknameSubmitting}
                type="submit"
              >
                닉네임 저장
              </button>
            </div>
          </form>
        </section>

        <section className={cardClassName} aria-labelledby="password-title">
          <header className="mb-6">
            <h2
              className="m-0 text-lg font-bold text-[var(--auth-text)]"
              id="password-title"
            >
              비밀번호 변경
            </h2>
            <p className="mt-1.5 mb-0 text-sm leading-6 text-[var(--auth-muted)]">
              본인 확인을 위해 현재 비밀번호를 입력해 주세요.
            </p>
          </header>

          {passwordMessage && (
            <p className={noticeClassName} role="status">
              {passwordMessage}
            </p>
          )}
          {passwordError && (
            <p className={errorClassName} role="alert">
              {passwordError}
            </p>
          )}

          <form
            className="flex flex-col gap-4"
            onSubmit={handlePasswordSubmit}
          >
            <div className="flex flex-col gap-2">
              <label
                className={labelClassName}
                htmlFor="profile-current-password"
              >
                현재 비밀번호
              </label>
              <input
                aria-describedby={
                  passwordErrors.current_password
                    ? 'profile-current-password-error'
                    : undefined
                }
                aria-invalid={
                  passwordErrors.current_password ? true : undefined
                }
                autoComplete="current-password"
                className={authInputClassName(
                  Boolean(passwordErrors.current_password),
                )}
                id="profile-current-password"
                maxLength={255}
                name="current_password"
                onChange={handlePasswordChange}
                required
                type="password"
                value={passwordFields.current_password}
              />
              <ErrorMessages
                className={errorClassName}
                id="profile-current-password-error"
                messages={passwordErrors.current_password}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className={labelClassName}
                htmlFor="profile-new-password"
              >
                새 비밀번호
              </label>
              <input
                aria-describedby={
                  passwordErrors.new_password
                    ? 'profile-new-password-error'
                    : undefined
                }
                aria-invalid={
                  passwordErrors.new_password ? true : undefined
                }
                autoComplete="new-password"
                className={authInputClassName(
                  Boolean(passwordErrors.new_password),
                )}
                id="profile-new-password"
                maxLength={255}
                minLength={8}
                name="new_password"
                onChange={handlePasswordChange}
                placeholder="8자 이상 입력하세요"
                required
                type="password"
                value={passwordFields.new_password}
              />
              <ErrorMessages
                className={errorClassName}
                id="profile-new-password-error"
                messages={passwordErrors.new_password}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className={labelClassName}
                htmlFor="profile-new-password-confirm"
              >
                새 비밀번호 확인
              </label>
              <input
                aria-describedby={
                  passwordErrors.new_password_confirm
                    ? 'profile-new-password-confirm-error'
                    : undefined
                }
                aria-invalid={
                  passwordErrors.new_password_confirm ? true : undefined
                }
                autoComplete="new-password"
                className={authInputClassName(
                  Boolean(passwordErrors.new_password_confirm),
                )}
                id="profile-new-password-confirm"
                maxLength={255}
                minLength={8}
                name="new_password_confirm"
                onChange={handlePasswordChange}
                required
                type="password"
                value={passwordFields.new_password_confirm}
              />
              <ErrorMessages
                className={errorClassName}
                id="profile-new-password-confirm-error"
                messages={passwordErrors.new_password_confirm}
              />
            </div>

            <div>
              <button
                className={submitClassName}
                disabled={isPasswordSubmitting}
                type="submit"
              >
                비밀번호 변경
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
