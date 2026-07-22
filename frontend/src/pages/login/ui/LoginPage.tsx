import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { requestError, useAuth } from '@features/auth'
import type { LoginFields } from '@features/auth'
import type { FormErrors } from '@shared/api'
import { ErrorMessages } from '@shared/ui'

type LoginLocationState = {
  email?: string
  notice?: string
}

export function LoginPage() {
  const { initialError, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const locationState = location.state as LoginLocationState | null
  const [fields, setFields] = useState<LoginFields>({
    email: locationState?.email ?? '',
    password: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [globalError, setGlobalError] = useState<string | null>(initialError)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Necton RD 로그인'
  }, [])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFields((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrors({})
    setGlobalError(null)

    try {
      await login(fields)
      setFields((current) => ({ ...current, password: '' }))
      navigate('/account', { replace: true })
    } catch (error) {
      setFields((current) => ({ ...current, password: '' }))
      const result = requestError(error)
      setErrors(result.errors)
      setGlobalError(result.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <header className="auth-header">
          <h1 className="auth-title" id="login-title">
            Necton RD
          </h1>
          <p className="auth-subtitle">등록된 계정으로 로그인해 주세요</p>
        </header>

        {locationState?.notice && (
          <p className="auth-notice" role="status">
            {locationState.notice}
          </p>
        )}

        {globalError && (
          <div className="auth-form-errors" role="alert">
            <p>{globalError}</p>
          </div>
        )}

        {errors.non_field_errors && (
          <div className="auth-form-errors" role="alert">
            <ErrorMessages
              messages={errors.non_field_errors}
              className="auth-error"
            />
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">
              이메일
            </label>
            <input
              className={`auth-input${errors.email ? ' auth-input--error' : ''}`}
              id="login-email"
              name="email"
              type="email"
              value={fields.email}
              onChange={handleChange}
              placeholder="name@company.com"
              autoComplete="username"
              maxLength={255}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              required
              autoFocus
            />
            <ErrorMessages
              id="login-email-error"
              messages={errors.email}
              className="auth-error"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">
              비밀번호
            </label>
            <input
              className={`auth-input${errors.password ? ' auth-input--error' : ''}`}
              id="login-password"
              name="password"
              type="password"
              value={fields.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              maxLength={255}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={
                errors.password ? 'login-password-error' : undefined
              }
              required
            />
            <ErrorMessages
              id="login-password-error"
              messages={errors.password}
              className="auth-error"
            />
          </div>

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            로그인
          </button>

          <p className="auth-switch">
            계정이 없으신가요?
            <Link className="auth-link" to="/signup">
              회원가입
            </Link>
          </p>
        </form>
      </section>
    </main>
  )
}
