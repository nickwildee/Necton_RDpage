import {
  useResearchDocumentPanel,
  useResearchSummary,
} from '../model/useResearchDocuments'
import { ResearchDocumentPanel } from './ResearchDocumentPanel'

function formatCount(value: number) {
  return value.toLocaleString('ko-KR')
}

export function ResearchDocuments() {
  const summaryModel = useResearchSummary()
  const openPanel = useResearchDocumentPanel('O')
  const sensitivePanel = useResearchDocumentPanel('S')
  const confidentialPanel = useResearchDocumentPanel('C')
  const panels = [openPanel, sensitivePanel, confidentialPanel]
  const fallbackTotal = panels.reduce(
    (total, panel) => total + panel.pagination.totalItems,
    0,
  )
  const totalItems = summaryModel.summary?.totalItems ?? fallbackTotal

  return (
    <div>
      <div className="mb-4 flex min-h-6 flex-wrap items-center gap-3 text-label text-ink-muted">
        <p className="m-0">
          전체 문서{' '}
          <strong className="font-bold text-brand-strong tabular-nums">
            {summaryModel.isLoading && !summaryModel.summary
              ? '불러오는 중'
              : `${formatCount(totalItems)}건`}
          </strong>
        </p>
        {summaryModel.error && (
          <span className="inline-flex items-center gap-2 text-caption text-danger">
            전체 건수를 불러오지 못했습니다.
            <button
              className="min-h-11 cursor-pointer rounded-compact border border-danger-line bg-danger-soft px-2 py-1 font-bold text-danger hover:border-danger hover:bg-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand md:min-h-8"
              onClick={summaryModel.retry}
              type="button"
            >
              다시 시도
            </button>
          </span>
        )}
      </div>

      <div className="grid min-h-[664px] overflow-hidden rounded-panel border border-line bg-surface shadow-panel xl:grid-cols-3">
        {panels.map((panel) => (
          <ResearchDocumentPanel
            count={
              summaryModel.summary?.counts[panel.category] ??
              panel.pagination.totalItems
            }
            key={panel.category}
            model={panel}
          />
        ))}
      </div>
    </div>
  )
}
