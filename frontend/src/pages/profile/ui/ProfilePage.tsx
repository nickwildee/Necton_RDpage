import { useEffect } from 'react'
import { ProfileSettings } from '@features/auth'

export function ProfilePage() {
  useEffect(() => {
    document.title = 'Necton RD 마이페이지'
  }, [])

  return (
    <section
      aria-labelledby="profile-title"
      className="px-6 pt-[42px] pb-14 lg:px-10"
    >
      <header className="mb-6">
        <p className="mt-0 mb-2 text-xs font-bold tracking-[0.08em] text-brand">
          MY PAGE
        </p>
        <h1
          className="m-0 text-page-title font-bold tracking-[-0.02em] text-ink"
          id="profile-title"
        >
          마이페이지
        </h1>
        <p className="mt-2 mb-0 text-sm leading-[1.55] text-ink-muted">
          계정 정보를 확인하고 닉네임과 비밀번호를 변경합니다.
        </p>
      </header>

      <ProfileSettings />
    </section>
  )
}
