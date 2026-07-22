export function AuthLoading() {
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
