import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import './App.css'

type Page = 'login' | 'signup'

type AuthUser = {
  id: number
  email: string
  nickname: string | null
}

type FormErrors = Record<string, string[]>

type CsrfResponse = {
  csrfToken: string
}

type SessionResponse = {
  authenticated: boolean
  user: AuthUser | null
}

type LoginResponse = SessionResponse & CsrfResponse

type SignupResponse = {
  detail: string
  user: AuthUser
}

type ApiErrorPayload = {
  detail?: string
  errors?: FormErrors
}

type LoginFields = {
  email: string
  password: string
}

type SignupFields = {
  email: string
  password: string
  password_confirm: string
  nickname: string
  phone: string
  company: string
}

const emptyLoginFields: LoginFields = {
  email: '',
  password: '',
}

const emptySignupFields: SignupFields = {
  email: '',
  password: '',
  password_confirm: '',
  nickname: '',
  phone: '',
  company: '',
}

class ApiError extends Error {
  status: number
  errors?: FormErrors

  constructor(status: number, message: string, errors?: FormErrors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...init,
  })
  const payload = (await response.json().catch(() => null)) as
    | ApiErrorPayload
    | null

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.detail ?? '요청을 처리하지 못했습니다.',
      payload?.errors,
    )
  }

  return payload as T
}

function fetchCsrfToken() {
  return apiRequest<CsrfResponse>('/api/auth/csrf/')
}

function postJson<T>(path: string, data: object, csrfToken: string) {
  return apiRequest<T>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify(data),
  })
}

function currentPage(): Page {
  return window.location.hash === '#/signup' ? 'signup' : 'login'
}

function ErrorMessages({
  id,
  messages,
  className,
}: {
  id?: string
  messages?: string[]
  className: string
}) {
  if (!messages?.length) {
    return null
  }

  return (
    <div id={id}>
      {messages.map((message, index) => (
        <p className={className} key={`${message}-${index}`}>
          {message}
        </p>
      ))}
    </div>
  )
}

function App() {
  const [page, setPage] = useState<Page>(currentPage)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loginFields, setLoginFields] =
    useState<LoginFields>(emptyLoginFields)
  const [signupFields, setSignupFields] =
    useState<SignupFields>(emptySignupFields)
  const [loginErrors, setLoginErrors] = useState<FormErrors>({})
  const [signupErrors, setSignupErrors] = useState<FormErrors>({})
  const [notice, setNotice] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)

  useEffect(() => {
    const handleHashChange = () => setPage(currentPage())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    document.title =
      page === 'signup' && !user ? 'Necton RD 회원가입' : 'Necton RD 로그인'
  }, [page, user])

  useEffect(() => {
    let active = true

    Promise.allSettled([
      fetchCsrfToken(),
      apiRequest<SessionResponse>('/api/auth/me/'),
    ]).then(([csrfResult, sessionResult]) => {
      if (!active) {
        return
      }

      if (csrfResult.status === 'fulfilled') {
        setCsrfToken(csrfResult.value.csrfToken)
      }
      if (sessionResult.status === 'fulfilled') {
        setUser(sessionResult.value.user)
      }
      if (
        csrfResult.status === 'rejected' ||
        sessionResult.status === 'rejected'
      ) {
        setGlobalError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
      }

      setIsLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const requireCsrfToken = async () => {
    if (csrfToken) {
      return csrfToken
    }

    const response = await fetchCsrfToken()
    setCsrfToken(response.csrfToken)
    return response.csrfToken
  }

  const postWithCsrf = async <T,>(path: string, data: object) => {
    const token = await requireCsrfToken()

    try {
      return await postJson<T>(path, data, token)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 403) {
        throw error
      }

      const refreshed = await fetchCsrfToken()
      setCsrfToken(refreshed.csrfToken)
      return postJson<T>(path, data, refreshed.csrfToken)
    }
  }

  const showRequestError = (
    error: unknown,
    setErrors: (errors: FormErrors) => void,
  ) => {
    if (error instanceof ApiError) {
      const errors = error.errors ?? {}
      setErrors(errors)
      if (Object.keys(errors).length === 0) {
        setGlobalError(error.message)
      }
      return
    }

    setGlobalError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
  }

  const handleLoginChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setLoginFields((fields) => ({ ...fields, [name]: value }))
  }

  const handleSignupChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setSignupFields((fields) => ({ ...fields, [name]: value }))
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setLoginErrors({})
    setGlobalError(null)
    setNotice(null)

    try {
      const response = await postWithCsrf<LoginResponse>(
        '/api/auth/login/',
        loginFields,
      )
      setUser(response.user)
      setCsrfToken(response.csrfToken)
      setLoginFields((fields) => ({ ...fields, password: '' }))
    } catch (error) {
      setLoginFields((fields) => ({ ...fields, password: '' }))
      showRequestError(error, setLoginErrors)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSignupErrors({})
    setGlobalError(null)

    try {
      const response = await postWithCsrf<SignupResponse>(
        '/api/auth/signup/',
        signupFields,
      )
      setLoginFields({ email: signupFields.email, password: '' })
      setSignupFields(emptySignupFields)
      setNotice(response.detail)
      window.location.hash = '#/login'
      setPage('login')
    } catch (error) {
      setSignupFields((fields) => ({
        ...fields,
        password: '',
        password_confirm: '',
      }))
      showRequestError(error, setSignupErrors)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setGlobalError(null)

    try {
      const response = await postWithCsrf<LoginResponse>(
        '/api/auth/logout/',
        {},
      )
      setUser(null)
      setCsrfToken(response.csrfToken)
      setLoginFields(emptyLoginFields)
      setNotice('로그아웃되었습니다.')
      window.location.hash = '#/login'
      setPage('login')
    } catch (error) {
      showRequestError(error, setLoginErrors)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="auth-page">
        <section className="auth-card" aria-labelledby="loading-title">
          <header className="auth-header auth-header--loading">
            <h1 className="auth-title" id="loading-title">
              Necton RD
            </h1>
            <p className="auth-subtitle">로그인 상태를 확인하고 있습니다</p>
          </header>
        </section>
      </main>
    )
  }

  if (user) {
    return (
      <main className="auth-page">
        <section className="auth-card" aria-labelledby="login-title">
          <header className="auth-header">
            <h1 className="auth-title" id="login-title">
              Necton RD
            </h1>
            <p className="auth-subtitle">로그인이 완료되었습니다</p>
          </header>

          {globalError && (
            <div className="auth-form-errors" role="alert">
              <p>{globalError}</p>
            </div>
          )}

          <div className="auth-signed-in">
            <p className="auth-signed-in-label">로그인한 계정</p>
            <p className="auth-signed-in-email">{user.email}</p>
            <form onSubmit={handleLogout}>
              <button className="auth-submit" type="submit" disabled={isSubmitting}>
                로그아웃
              </button>
            </form>
          </div>
        </section>
      </main>
    )
  }

  if (page === 'signup') {
    return (
      <main className="signup-page">
        <section className="signup-card" aria-labelledby="signup-title">
          <header className="signup-header">
            <h1 className="signup-title" id="signup-title">
              Necton RD
            </h1>
            <p className="signup-subtitle">새 계정을 생성해 주세요</p>
          </header>

          {globalError && (
            <div className="signup-form-errors" role="alert">
              <p>{globalError}</p>
            </div>
          )}

          {signupErrors.non_field_errors && (
            <div className="signup-form-errors" role="alert">
              <ErrorMessages
                messages={signupErrors.non_field_errors}
                className="signup-error"
              />
            </div>
          )}

          <form className="signup-form" onSubmit={handleSignup}>
            <div className="signup-field">
              <label className="signup-label" htmlFor="signup-email">
                이메일 <span className="signup-required" aria-hidden="true">*</span>
              </label>
              <input
                className={`signup-input${signupErrors.email ? ' signup-input--error' : ''}`}
                id="signup-email"
                name="email"
                type="email"
                value={signupFields.email}
                onChange={handleSignupChange}
                placeholder="name@company.com"
                autoComplete="email"
                maxLength={255}
                aria-invalid={signupErrors.email ? true : undefined}
                aria-describedby={signupErrors.email ? 'signup-email-error' : undefined}
                required
                autoFocus
              />
              <ErrorMessages
                id="signup-email-error"
                messages={signupErrors.email}
                className="signup-error"
              />
            </div>

            <div className="signup-field">
              <label className="signup-label" htmlFor="signup-password">
                비밀번호 <span className="signup-required" aria-hidden="true">*</span>
              </label>
              <input
                className={`signup-input${signupErrors.password ? ' signup-input--error' : ''}`}
                id="signup-password"
                name="password"
                type="password"
                value={signupFields.password}
                onChange={handleSignupChange}
                placeholder="8자 이상 입력하세요"
                autoComplete="new-password"
                minLength={8}
                maxLength={255}
                aria-invalid={signupErrors.password ? true : undefined}
                aria-describedby={signupErrors.password ? 'signup-password-error' : undefined}
                required
              />
              <ErrorMessages
                id="signup-password-error"
                messages={signupErrors.password}
                className="signup-error"
              />
            </div>

            <div className="signup-field">
              <label className="signup-label" htmlFor="signup-password-confirm">
                비밀번호 확인{' '}
                <span className="signup-required" aria-hidden="true">*</span>
              </label>
              <input
                className={`signup-input${signupErrors.password_confirm ? ' signup-input--error' : ''}`}
                id="signup-password-confirm"
                name="password_confirm"
                type="password"
                value={signupFields.password_confirm}
                onChange={handleSignupChange}
                placeholder="비밀번호를 한 번 더 입력하세요"
                autoComplete="new-password"
                minLength={8}
                maxLength={255}
                aria-invalid={signupErrors.password_confirm ? true : undefined}
                aria-describedby={
                  signupErrors.password_confirm
                    ? 'signup-password-confirm-error'
                    : undefined
                }
                required
              />
              <ErrorMessages
                id="signup-password-confirm-error"
                messages={signupErrors.password_confirm}
                className="signup-error"
              />
            </div>

            <div className="signup-field">
              <label className="signup-label" htmlFor="signup-nickname">
                닉네임
              </label>
              <input
                className={`signup-input${signupErrors.nickname ? ' signup-input--error' : ''}`}
                id="signup-nickname"
                name="nickname"
                type="text"
                value={signupFields.nickname}
                onChange={handleSignupChange}
                placeholder="닉네임을 입력하세요"
                autoComplete="nickname"
                maxLength={255}
                aria-invalid={signupErrors.nickname ? true : undefined}
                aria-describedby={signupErrors.nickname ? 'signup-nickname-error' : undefined}
              />
              <ErrorMessages
                id="signup-nickname-error"
                messages={signupErrors.nickname}
                className="signup-error"
              />
            </div>

            <div className="signup-field">
              <label className="signup-label" htmlFor="signup-phone">
                핸드폰 번호
              </label>
              <input
                className={`signup-input${signupErrors.phone ? ' signup-input--error' : ''}`}
                id="signup-phone"
                name="phone"
                type="tel"
                value={signupFields.phone}
                onChange={handleSignupChange}
                placeholder="01012345678"
                autoComplete="tel"
                inputMode="numeric"
                pattern="[0-9]{11}"
                minLength={11}
                maxLength={11}
                aria-invalid={signupErrors.phone ? true : undefined}
                aria-describedby={signupErrors.phone ? 'signup-phone-error' : undefined}
              />
              <ErrorMessages
                id="signup-phone-error"
                messages={signupErrors.phone}
                className="signup-error"
              />
            </div>

            <div className="signup-field">
              <label className="signup-label" htmlFor="signup-company">
                회사명
              </label>
              <input
                className={`signup-input${signupErrors.company ? ' signup-input--error' : ''}`}
                id="signup-company"
                name="company"
                type="text"
                value={signupFields.company}
                onChange={handleSignupChange}
                placeholder="회사명을 입력하세요"
                autoComplete="organization"
                maxLength={255}
                required
                aria-invalid={signupErrors.company ? true : undefined}
                aria-describedby={signupErrors.company ? 'signup-company-error' : undefined}
              />
              <ErrorMessages
                id="signup-company-error"
                messages={signupErrors.company}
                className="signup-error"
              />
            </div>

            <button className="signup-submit" type="submit" disabled={isSubmitting}>
              가입하기
            </button>

            <p className="signup-switch">
              이미 계정이 있으신가요?
              <a
                className="signup-link"
                href="#/login"
                onClick={() => {
                  setSignupErrors({})
                  setGlobalError(null)
                }}
              >
                로그인
              </a>
            </p>
          </form>
        </section>
      </main>
    )
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

        {notice && (
          <p className="auth-notice" role="status">
            {notice}
          </p>
        )}

        {globalError && (
          <div className="auth-form-errors" role="alert">
            <p>{globalError}</p>
          </div>
        )}

        {loginErrors.non_field_errors && (
          <div className="auth-form-errors" role="alert">
            <ErrorMessages
              messages={loginErrors.non_field_errors}
              className="auth-error"
            />
          </div>
        )}

        <form className="auth-form" onSubmit={handleLogin} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">
              이메일
            </label>
            <input
              className={`auth-input${loginErrors.email ? ' auth-input--error' : ''}`}
              id="login-email"
              name="email"
              type="email"
              value={loginFields.email}
              onChange={handleLoginChange}
              placeholder="name@company.com"
              autoComplete="username"
              maxLength={255}
              aria-invalid={loginErrors.email ? true : undefined}
              aria-describedby={loginErrors.email ? 'login-email-error' : undefined}
              required
              autoFocus
            />
            <ErrorMessages
              id="login-email-error"
              messages={loginErrors.email}
              className="auth-error"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">
              비밀번호
            </label>
            <input
              className={`auth-input${loginErrors.password ? ' auth-input--error' : ''}`}
              id="login-password"
              name="password"
              type="password"
              value={loginFields.password}
              onChange={handleLoginChange}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              maxLength={255}
              aria-invalid={loginErrors.password ? true : undefined}
              aria-describedby={loginErrors.password ? 'login-password-error' : undefined}
              required
            />
            <ErrorMessages
              id="login-password-error"
              messages={loginErrors.password}
              className="auth-error"
            />
          </div>

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            로그인
          </button>

          <p className="auth-switch">
            계정이 없으신가요?
            <a
              className="auth-link"
              href="#/signup"
              onClick={() => {
                setLoginErrors({})
                setGlobalError(null)
                setNotice(null)
              }}
            >
              회원가입
            </a>
          </p>
        </form>
      </section>
    </main>
  )
}

export default App
