import { useEffect } from 'react'
import { LoginForm } from '@features/auth'

export function LoginPage() {
  useEffect(() => {
    document.title = 'Necton RD 로그인'
  }, [])

  return (
    <main className="auth-page">
      <LoginForm />
    </main>
  )
}
