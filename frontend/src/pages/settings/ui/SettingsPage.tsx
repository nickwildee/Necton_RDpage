import { useEffect } from 'react'
import { FeatureManagement } from '@features/feature-management'
import { PageHeader } from '@shared/ui'

export function SettingsPage() {
  useEffect(() => {
    document.title = 'Necton RD 문서 특성 관리'
  }, [])

  return (
    <section
      aria-labelledby="settings-title"
      className="px-6 pt-[42px] pb-14 lg:px-10"
    >
      <PageHeader
        description="문서 특성을 대분류, 중분류, 소분류 순서로 선택하고 관리합니다."
        eyebrow="SETTINGS"
        id="settings-title"
        title="문서 특성 관리"
      />

      <FeatureManagement />
    </section>
  )
}
