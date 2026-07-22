import { useEffect } from 'react'
import { Navigation } from '@widgets/navigation'

export function IntroPage() {
  useEffect(() => {
    document.title = 'Necton RD'
  }, [])

  return (
    <div className="flex min-h-screen min-h-svh flex-col bg-[var(--auth-background)]">
      <Navigation />
      <main
        aria-label="Necton RD 인트로"
        className="mx-auto w-full max-w-[1200px] flex-1"
      />
    </div>
  )
}
