import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestError, useAuth } from '@features/auth'

export function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Necton RD 로그인'
  }, [])

  const handleLogout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="account-title">
        <header className="auth-header">
          <h1 className="auth-title" id="account-title">
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
          <p className="auth-signed-in-email">{user?.email}</p>
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
