import { useEffect } from 'react'
import { Navigation } from '@widgets/navigation'

export function IntroPage() {
  useEffect(() => {
    document.title = 'Necton RD'
  }, [])

  return (
    <div className="min-h-screen min-h-svh bg-[var(--auth-background)]">
      <Navigation />
      <main
        aria-label="Necton RD 인트로"
        className="mx-auto min-h-[calc(100svh-73px)] max-w-[1200px]"
      />
    </div>
  )
}
