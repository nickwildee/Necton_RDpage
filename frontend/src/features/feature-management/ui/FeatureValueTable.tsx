import type { ReactNode } from 'react'
import type {
  FeatureValue,
  FeatureValuePagination,
} from '@entities/document-feature'
import { Button } from '@shared/ui'
import { FeatureEditIcon } from './FeatureEditIcon'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

function Weight({ value }: { value: number | null }) {
  return (
    <span className="inline-flex h-[26px] min-w-[30px] items-center justify-center rounded-compact border border-line bg-surface-subtle px-1 text-caption font-bold text-ink-secondary tabular-nums">
      {value ?? '—'}
    </span>
  )
}

function DeleteIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M4.5 7h15M9 7V4.8h6V7m-8 0 .7 12h8.6L17 7M10 10.5v5M14 10.5v5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function ActionButton({
  label,
  tone,
  isMobile = false,
  onClick,
  children,
}: {
  label: string
  tone: 'edit' | 'delete'
  isMobile?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      aria-label={label}
      className={[
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-control border bg-surface transition-colors',
        isMobile ? 'size-11' : 'size-9',
        tone === 'edit'
          ? 'border-line text-brand hover:border-brand hover:bg-brand-soft'
          : 'border-line text-danger hover:border-danger-line-strong hover:bg-danger-soft',
      ].join(' ')}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  )
}

function ValueActions({
  value,
  isMobile = false,
  onEdit,
  onDelete,
}: {
  value: FeatureValue
  isMobile?: boolean
  onEdit: (value: FeatureValue) => void
  onDelete: (value: FeatureValue) => void
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <ActionButton
        isMobile={isMobile}
        label={`${value.feature} 수정`}
        onClick={() => onEdit(value)}
        tone="edit"
      >
        <FeatureEditIcon />
      </ActionButton>
      <ActionButton
        isMobile={isMobile}
        label={`${value.feature} 삭제`}
        onClick={() => onDelete(value)}
        tone="delete"
      >
        <DeleteIcon />
      </ActionButton>
    </span>
  )
}

export function FeatureValueTable({
  values,
  pagination,
  currentPage,
  pageSize,
  isLoading,
  addDisabled,
  typeName,
  onAdd,
  onEdit,
  onDelete,
  onPageChange,
  onPageSizeChange,
}: {
  values: FeatureValue[]
  pagination: FeatureValuePagination
  currentPage: number
  pageSize: number
  isLoading: boolean
  addDisabled: boolean
  typeName: string | null
  onAdd: () => void
  onEdit: (value: FeatureValue) => void
  onDelete: (value: FeatureValue) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  const firstItem =
    pagination.totalItems === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1
  const lastItem = Math.min(
    pagination.page * pagination.pageSize,
    pagination.totalItems,
  )
  const firstPage = Math.max(
    1,
    Math.min(currentPage - 2, pagination.totalPages - 4),
  )
  const pageNumbers = Array.from(
    { length: Math.min(5, pagination.totalPages) },
    (_, index) => firstPage + index,
  )
  const emptyText = typeName
    ? '등록된 소분류가 없습니다.'
    : '중분류를 선택하면 소분류가 표시됩니다.'

  return (
    <section className="flex min-w-0 flex-col bg-surface lg:min-h-[636px]">
      <header className="flex min-h-20 items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="m-0 line-clamp-2 text-base leading-5 font-bold tracking-heading text-ink">
              {typeName || '소분류'}
            </h2>
            <span className="text-caption font-bold text-ink-muted">
              소분류
            </span>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-soft px-1.5 text-caption font-bold text-brand">
              {pagination.totalItems}
            </span>
          </div>
          <p className="mt-1 mb-0 truncate text-caption text-ink-muted">
            {typeName
              ? `${typeName}에 속한 실제 데이터입니다.`
              : '중분류를 선택해 주세요.'}
          </p>
        </div>
        <Button
          className="shrink-0"
          disabled={addDisabled}
          onClick={onAdd}
          size="toolbar"
          type="button"
        >
          + 소분류 추가
        </Button>
      </header>

      <div className="hidden min-h-72 flex-1 overflow-x-auto px-5 md:block">
        <table className="w-full min-w-[590px] table-fixed border-collapse">
          <colgroup>
            <col className="w-[160px]" />
            <col />
            <col className="w-[62px]" />
            <col className="w-[62px]" />
            <col className="w-[62px]" />
            <col className="w-[160px]" />
          </colgroup>
          <thead>
            <tr className="h-12 border-b border-line text-left text-caption font-bold text-ink-muted">
              <th>항목</th>
              <th className="pr-3">설명</th>
              <th className="text-center">C</th>
              <th className="text-center">S</th>
              <th className="text-center">O</th>
              <th className="pr-4 text-right">
                <span className="inline-flex w-20 justify-center">
                  관리
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  className="h-48 text-center text-xs text-ink-muted"
                  colSpan={6}
                >
                  불러오는 중입니다.
                </td>
              </tr>
            )}
            {!isLoading && values.length === 0 && (
              <tr>
                <td
                  className="h-48 text-center text-xs leading-5 text-ink-muted"
                  colSpan={6}
                >
                  {emptyText}
                </td>
              </tr>
            )}
            {!isLoading &&
              values.map((value) => (
                <tr
                  className="h-16 border-b border-line-subtle text-xs"
                  key={value.id}
                >
                  <td>
                    <span className="block truncate font-bold text-ink">
                      {value.feature}
                    </span>
                  </td>
                  <td className="pr-3">
                    <span className="line-clamp-2 text-caption leading-[1.45] text-ink-muted">
                      {value.description || '—'}
                    </span>
                  </td>
                  <td className="text-center">
                    <Weight value={value.cWeight} />
                  </td>
                  <td className="text-center">
                    <Weight value={value.sWeight} />
                  </td>
                  <td className="text-center">
                    <Weight value={value.oWeight} />
                  </td>
                  <td className="pr-4 text-right">
                    <ValueActions
                      onDelete={onDelete}
                      onEdit={onEdit}
                      value={value}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="grid min-h-72 flex-1 gap-3 p-4 md:hidden">
        {isLoading && (
          <p className="m-0 py-16 text-center text-xs text-ink-muted">
            불러오는 중입니다.
          </p>
        )}
        {!isLoading && values.length === 0 && (
          <p className="m-0 py-16 text-center text-xs leading-5 text-ink-muted">
            {emptyText}
          </p>
        )}
        {!isLoading &&
          values.map((value) => (
            <article
              className="rounded-control border border-line bg-surface p-4"
              key={value.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 pt-1">
                  <h3 className="m-0 truncate text-label font-bold text-ink">
                    {value.feature}
                  </h3>
                  <p className="mt-1 mb-0 line-clamp-2 text-caption leading-5 text-ink-muted">
                    {value.description || '설명이 없습니다.'}
                  </p>
                </div>
                <ValueActions
                  isMobile
                  onDelete={onDelete}
                  onEdit={onEdit}
                  value={value}
                />
              </div>
              <dl className="mt-3 mb-0 flex items-center gap-3 border-t border-line-subtle pt-3">
                {[
                  ['C', value.cWeight],
                  ['S', value.sWeight],
                  ['O', value.oWeight],
                ].map(([label, weight]) => (
                  <div
                    className="flex items-center gap-1.5"
                    key={label}
                  >
                    <dt className="text-caption font-bold text-ink-muted">
                      {label}
                    </dt>
                    <dd className="m-0">
                      <Weight value={weight as number | null} />
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
      </div>

      <footer className="flex min-h-16 flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-caption text-ink-muted">
            총 {pagination.totalItems}개 · {firstItem}–{lastItem} 표시
          </span>
          <label className="hidden items-center gap-1.5 text-caption font-semibold text-ink-muted md:flex">
            페이지당
            <select
              aria-label="페이지당 소분류 표시 수"
              className="h-[30px] rounded-compact border border-line bg-surface-field px-2 text-caption font-bold text-ink focus:border-brand focus:outline-2 focus:outline-offset-1 focus:outline-focus-ring disabled:opacity-60"
              disabled={isLoading}
              onChange={(event) =>
                onPageSizeChange(Number(event.target.value))
              }
              value={pageSize}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}개
                </option>
              ))}
            </select>
          </label>
        </div>
        <nav
          aria-label="소분류 페이지 이동"
          className="ml-auto flex items-center gap-1"
        >
          <button
            className="h-11 cursor-pointer rounded-compact border-0 bg-transparent px-2 text-caption font-bold text-ink-muted disabled:cursor-not-allowed disabled:opacity-35 md:h-[30px]"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => onPageChange(currentPage - 1)}
            type="button"
          >
            이전
          </button>
          {pageNumbers.map((pageNumber) => (
            <button
              aria-current={
                currentPage === pageNumber ? 'page' : undefined
              }
              className={[
                'h-11 min-w-11 cursor-pointer rounded-compact border text-caption font-bold md:h-[30px] md:min-w-[30px]',
                currentPage === pageNumber
                  ? 'border-brand bg-brand text-on-brand'
                  : 'border-transparent bg-transparent text-ink-muted hover:border-line',
              ].join(' ')}
              disabled={isLoading}
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              type="button"
            >
              {pageNumber}
            </button>
          ))}
          <button
            className="h-11 cursor-pointer rounded-compact border-0 bg-transparent px-2 text-caption font-bold text-ink-muted disabled:cursor-not-allowed disabled:opacity-35 md:h-[30px]"
            disabled={
              currentPage >= pagination.totalPages || isLoading
            }
            onClick={() => onPageChange(currentPage + 1)}
            type="button"
          >
            다음
          </button>
        </nav>
      </footer>
    </section>
  )
}
