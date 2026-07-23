import { AuthLayout } from './AuthLayout'
import { authStyles } from './authStyles'

export function AuthLoading() {
  return (
    <AuthLayout>
      <section className={authStyles.card} aria-labelledby="loading-title">
        <header>
          <h1 className={authStyles.title} id="loading-title">
            Necton RD
          </h1>
          <p className={authStyles.subtitle}>
            로그인 상태를 확인하고 있습니다
          </p>
        </header>
      </section>
    </AuthLayout>
  )
}
