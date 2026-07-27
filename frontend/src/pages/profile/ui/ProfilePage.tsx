import { useEffect } from 'react'
import { ProfileSettings } from '@features/auth'
import { PageHeader } from '@shared/ui'

export function ProfilePage() {
  useEffect(() => {
    document.title = 'Necton RD 마이페이지'
  }, [])

  return (
    <section
      aria-labelledby="profile-title"
      className="px-6 pt-[42px] pb-14 lg:px-10"
    >
      <PageHeader
        description="계정 정보를 확인하고 닉네임과 비밀번호를 변경합니다."
        eyebrow="MY PAGE"
        id="profile-title"
        title="마이페이지"
      />

      <ProfileSettings />
    </section>
  )
}
