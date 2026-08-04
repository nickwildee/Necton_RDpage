import { useEffect } from 'react'
import { ResearchDocuments } from '@features/research-documents'
import { PageHeader } from '@shared/ui'

export function ResearchPage() {
  useEffect(() => {
    document.title = 'Necton RD 연구 데이터'
  }, [])

  return (
    <section
      aria-labelledby="research-title"
      className="px-6 pt-[42px] pb-14 lg:px-10"
    >
      <PageHeader
        description="RDS에 수집된 문서를 유형별로 확인하고 메타데이터를 조회합니다."
        eyebrow="RESEARCH DATA"
        id="research-title"
        title="연구 데이터"
      />

      <ResearchDocuments />
    </section>
  )
}
