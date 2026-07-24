import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Navigation } from '@widgets/navigation'

export function IntroPage() {
  useEffect(() => {
    document.title = 'Necton RD'
  }, [])

  return (
    <div className="flex min-h-screen min-h-svh flex-col bg-canvas">
      <Navigation />
      <main
        aria-label="Necton RD 인트로"
        className="mx-auto w-full max-w-app flex-1"
      >
        <Outlet />
      </main>
    </div>
  )
}
