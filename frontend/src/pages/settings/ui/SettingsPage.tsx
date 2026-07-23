import { useEffect } from 'react'
import { FeatureManagement } from '@features/feature-management'

export function SettingsPage() {
  useEffect(() => {
    document.title = 'Necton RD 문서 특성 관리'
  }, [])

  return (
    <section
      aria-labelledby="settings-title"
      className="px-6 pt-[42px] pb-14 lg:px-10"
    >
      <header className="mb-6">
        <p className="mt-0 mb-2 text-xs font-bold tracking-[0.08em] text-[var(--auth-primary)]">
          SETTINGS
        </p>
        <h1
          className="m-0 text-[28px] leading-[1.3] font-bold tracking-[-0.02em] text-[var(--auth-text)]"
          id="settings-title"
        >
          문서 특성 관리
        </h1>
        <p className="mt-2 mb-0 text-sm leading-[1.55] text-[var(--auth-muted)]">
          문서 특성을 대분류, 중분류, 소분류 순서로 선택하고
          관리합니다.
        </p>
      </header>

      <FeatureManagement />
    </section>
  )
}
