import { useEffect } from 'react'
import { AuthLayout, LoginForm } from '@features/auth'

export function LoginPage() {
  useEffect(() => {
    document.title = 'Necton RD 로그인'
  }, [])

  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
