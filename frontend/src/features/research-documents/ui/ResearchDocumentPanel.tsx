import { useRef } from 'react'
import type { ReactNode } from 'react'
import type {
  ResearchCategory,
  ResearchDocument,
  ResearchFile,
} from '../api/researchDocuments'
import type { ResearchDocumentPanelModel } from '../model/useResearchDocuments'

const CATEGORY_LABELS: Record<ResearchCategory, string> = {
  O: '공개 문서',
  S: '민감 문서',
  C: '기밀 문서',
}

function formatCount(value: number) {
  return value.toLocaleString('ko-KR')
}

function formatDate(value: string | null) {
  return value ? value.replaceAll('-', '.') : '—'
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={[
        'size-4 shrink-0 transition-transform duration-150 motion-reduce:transition-none',
        expanded ? 'rotate-180' : '',
      ].join(' ')}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m7 10 5 5 5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mt-0.5 size-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M7 3h7l4 4v14H7zM14 3v5h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function FileLink({ file }: { file: ResearchFile }) {
  return (
    <a
      className="flex min-w-0 items-start gap-1.5 break-all font-semibold text-brand no-underline hover:text-brand-strong hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      href={file.url}
      rel="noreferrer"
      target="_blank"
      title={file.name}
    >
      <FileIcon />
      <span>{file.name}</span>
    </a>
  )
}

function MetadataRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 py-1.5">
      <dt className="text-caption font-bold text-ink-muted">{label}</dt>
      <dd className="m-0 min-w-0 text-xs leading-5 text-ink-secondary">
        {children}
      </dd>
    </div>
  )
}

function DocumentMetadata({ document }: { document: ResearchDocument }) {
  return (
    <div
      className="border-t border-line-subtle bg-surface-subtle px-4 py-3"
      id={`research-document-${document.category}-${document.id}`}
    >
      <dl className="m-0">
        <MetadataRow label="문서 제목">
          {document.title || '—'}
        </MetadataRow>
        <MetadataRow label="주관 부처">
          {document.orderingAgency || '—'}
        </MetadataRow>
        <MetadataRow label="담당 부서">
          {document.department || '—'}
        </MetadataRow>
        <MetadataRow label="공개일">
          {formatDate(document.productionDate)}
        </MetadataRow>
        <MetadataRow label="본문 자료">
          {document.bodyFile ? (
            <FileLink file={document.bodyFile} />
          ) : (
            <span className="text-ink-muted">자료 없음</span>
          )}
        </MetadataRow>
        <MetadataRow label="기타 자료">
          {document.otherFiles.length > 0 ? (
            <span className="grid gap-1.5">
              {document.otherFiles.map((file) => (
                <FileLink file={file} key={file.url} />
              ))}
            </span>
          ) : (
            <span className="text-ink-muted">자료 없음</span>
          )}
        </MetadataRow>
      </dl>
    </div>
  )
}

function pageNumbers(currentPage: number, totalPages: number) {
  const firstPage = Math.max(
    1,
    Math.min(currentPage - 1, totalPages - 2),
  )
  return Array.from(
    { length: Math.min(3, totalPages) },
    (_, index) => firstPage + index,
  )
}

export function ResearchDocumentPanel({
  count,
  model,
}: {
  count: number
  model: ResearchDocumentPanelModel
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const {
    category,
    documents,
    pagination,
    page,
    expandedId,
    isLoading,
    error,
    changePage,
    toggleDocument,
    retry,
  } = model
  const firstItem =
    pagination.totalItems === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1
  const lastItem = Math.min(
    pagination.page * pagination.pageSize,
    pagination.totalItems,
  )

  const handlePageChange = (nextPage: number) => {
    changePage(nextPage)
    listRef.current?.scrollTo({ top: 0 })
  }

  return (
    <section className="flex min-w-0 flex-col border-b border-line bg-surface last:border-b-0 xl:border-r xl:border-b-0 xl:last:border-r-0">
      <header className="flex min-h-20 items-center gap-2 border-b border-line px-5">
        <span
          aria-hidden="true"
          className="text-xl font-bold text-ink"
        >
          {category}
        </span>
        <h2 className="m-0 text-base font-bold tracking-heading text-ink">
          {CATEGORY_LABELS[category]}
        </h2>
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-soft px-2 text-caption font-bold text-brand tabular-nums">
          {formatCount(count)}
        </span>
      </header>

      <div
        className="h-[520px] min-h-72 overflow-y-auto overscroll-contain"
        ref={listRef}
      >
        {isLoading && (
          <p
            className="m-0 px-5 py-20 text-center text-xs text-ink-muted"
            role="status"
          >
            {category} 문서를 불러오는 중입니다.
          </p>
        )}
        {!isLoading && error && (
          <div
            className="grid justify-items-center gap-3 px-5 py-16 text-center"
            role="alert"
          >
            <p className="m-0 text-xs leading-5 text-danger">{error}</p>
            <button
              className="min-h-11 cursor-pointer rounded-control border border-line bg-surface px-3 text-caption font-bold text-brand hover:border-brand hover:bg-brand-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand md:min-h-9"
              onClick={retry}
              type="button"
            >
              다시 시도
            </button>
          </div>
        )}
        {!isLoading && !error && documents.length === 0 && (
          <p className="m-0 px-5 py-20 text-center text-xs text-ink-muted">
            등록된 {CATEGORY_LABELS[category]}가 없습니다.
          </p>
        )}
        {!isLoading && !error && documents.length > 0 && (
          <ul className="m-0 list-none p-0">
            {documents.map((document) => {
              const expanded = document.id === expandedId
              const title = document.title || '제목 없음'
              return (
                <li
                  className="border-b border-line-subtle last:border-b-0"
                  key={document.id}
                >
                  <button
                    aria-controls={`research-document-${category}-${document.id}`}
                    aria-expanded={expanded}
                    className={[
                      'grid min-h-14 w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-0 px-5 py-3 text-left transition-colors focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-brand',
                      expanded
                        ? 'bg-brand-soft text-brand-strong'
                        : 'bg-surface text-ink hover:bg-surface-subtle',
                    ].join(' ')}
                    onClick={() => toggleDocument(document.id)}
                    type="button"
                  >
                    <span className="line-clamp-2 text-xs leading-5 font-bold">
                      {title}
                    </span>
                    <span className="whitespace-nowrap text-caption text-ink-muted tabular-nums">
                      {formatDate(document.productionDate)}
                    </span>
                    <Chevron expanded={expanded} />
                  </button>
                  {expanded && <DocumentMetadata document={document} />}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <footer className="flex min-h-16 flex-wrap items-center justify-between gap-1 border-t border-line px-4 py-2">
        <span className="text-caption text-ink-muted tabular-nums">
          총 {formatCount(pagination.totalItems)}건 · {firstItem}–{lastItem}{' '}
          표시
        </span>
        <nav
          aria-label={`${category} 문서 페이지 이동`}
          className="ml-auto flex items-center gap-0.5"
        >
          <button
            className="h-11 min-w-11 cursor-pointer rounded-compact border-0 bg-transparent px-1.5 text-caption font-bold text-ink-muted disabled:cursor-not-allowed disabled:opacity-35 md:h-[30px] md:min-w-0"
            disabled={page <= 1 || isLoading}
            onClick={() => handlePageChange(page - 1)}
            type="button"
          >
            이전
          </button>
          {pageNumbers(page, pagination.totalPages).map((pageNumber) => (
            <button
              aria-current={page === pageNumber ? 'page' : undefined}
              className={[
                'h-11 min-w-11 cursor-pointer rounded-compact border text-caption font-bold md:h-[30px] md:min-w-[30px]',
                page === pageNumber
                  ? 'border-brand bg-brand text-on-brand'
                  : 'border-transparent bg-transparent text-ink-muted hover:border-line',
              ].join(' ')}
              disabled={isLoading}
              key={pageNumber}
              onClick={() => handlePageChange(pageNumber)}
              type="button"
            >
              {pageNumber}
            </button>
          ))}
          <button
            className="h-11 min-w-11 cursor-pointer rounded-compact border-0 bg-transparent px-1.5 text-caption font-bold text-ink-muted disabled:cursor-not-allowed disabled:opacity-35 md:h-[30px] md:min-w-0"
            disabled={page >= pagination.totalPages || isLoading}
            onClick={() => handlePageChange(page + 1)}
            type="button"
          >
            다음
          </button>
        </nav>
      </footer>
    </section>
  )
}
