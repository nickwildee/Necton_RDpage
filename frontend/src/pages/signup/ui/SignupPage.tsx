import { useEffect } from 'react'
import { SignupForm } from '@features/auth'

export function SignupPage() {
  useEffect(() => {
    document.title = 'Necton RD 회원가입'
  }, [])

  return (
    <main className="signup-page">
      <SignupForm />
    </main>
  )
}
