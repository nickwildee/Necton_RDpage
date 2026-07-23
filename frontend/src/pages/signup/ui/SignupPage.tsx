import { useEffect } from 'react'
import { AuthLayout, SignupForm } from '@features/auth'

export function SignupPage() {
  useEffect(() => {
    document.title = 'Necton RD 회원가입'
  }, [])

  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  )
}
