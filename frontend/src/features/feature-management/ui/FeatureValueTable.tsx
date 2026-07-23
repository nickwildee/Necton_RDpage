import type {
  FeatureValue,
  FeatureValuePagination,
} from '@entities/document-feature'

function Weight({ value }: { value: number | null }) {
  return (
    <span className="inline-flex h-[26px] min-w-[30px] items-center justify-center rounded-md border border-[var(--auth-border)] bg-[#f8f9fb] px-1 text-[11px] font-bold text-[#565b63] tabular-nums">
      {value ?? '—'}
    </span>
  )
}

export function FeatureValueTable({
  values,
  pagination,
  currentPage,
  isLoading,
  addDisabled,
  typeName,
  onAdd,
  onEdit,
  onDelete,
  onPageChange,
}: {
  values: FeatureValue[]
  pagination: FeatureValuePagination
  currentPage: number
  isLoading: boolean
  addDisabled: boolean
  typeName: string | null
  onAdd: () => void
  onEdit: (value: FeatureValue) => void
  onDelete: (value: FeatureValue) => void
  onPageChange: (page: number) => void
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

  return (
    <section className="flex min-w-0 flex-col bg-[var(--auth-surface)] lg:min-h-[636px] lg:border-l lg:border-[var(--auth-border)] max-lg:border-t max-lg:border-[var(--auth-border)]">
      <header className="flex min-h-[76px] items-center justify-between gap-3 border-b border-[var(--auth-border)] px-[18px]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="m-0 text-base font-bold tracking-[-0.01em]">
              소분류
            </h2>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--auth-notice-background)] px-1.5 text-[11px] font-bold text-[var(--auth-primary)]">
              {pagination.totalItems}
            </span>
          </div>
          <p className="mt-1 mb-0 truncate text-[11px] text-[var(--auth-muted)]">
            {typeName
              ? `${typeName}에 속한 실제 데이터`
              : '중분류를 선택해 주세요.'}
          </p>
        </div>
        <button
          className="min-h-9 shrink-0 cursor-pointer rounded-lg border border-[var(--auth-primary)] bg-[var(--auth-primary)] px-3 text-xs font-bold text-white transition-colors hover:bg-[var(--auth-primary-hover)] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={addDisabled}
          onClick={onAdd}
          type="button"
        >
          + 소분류 추가
        </button>
      </header>

      <div className="min-h-72 flex-1 overflow-x-auto px-[18px]">
        <table className="w-full min-w-[590px] table-fixed border-collapse">
          <thead>
            <tr className="h-[46px] border-b border-[var(--auth-border)] text-left text-[11px] font-bold text-[var(--auth-muted)]">
              <th className="w-[27%]">항목</th>
              <th className="w-[34%] pr-3">설명</th>
              <th className="w-[7%] text-center">C</th>
              <th className="w-[7%] text-center">S</th>
              <th className="w-[7%] text-center">O</th>
              <th className="w-[18%] text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  className="h-48 text-center text-xs text-[var(--auth-muted)]"
                  colSpan={6}
                >
                  불러오는 중입니다.
                </td>
              </tr>
            )}
            {!isLoading && values.length === 0 && (
              <tr>
                <td
                  className="h-48 text-center text-xs leading-5 text-[var(--auth-muted)]"
                  colSpan={6}
                >
                  {typeName
                    ? '등록된 소분류가 없습니다.'
                    : '중분류를 선택하면 소분류가 표시됩니다.'}
                </td>
              </tr>
            )}
            {!isLoading &&
              values.map((value) => (
                <tr
                  className="h-[78px] border-b border-[#eceef1] text-xs"
                  key={value.id}
                >
                  <td>
                    <span className="block truncate font-bold">
                      {value.feature}
                    </span>
                  </td>
                  <td className="pr-3">
                    <span className="line-clamp-2 text-[11px] leading-[1.45] text-[var(--auth-muted)]">
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
                  <td className="text-right">
                    <span className="inline-flex items-center gap-2">
                      <button
                        className="cursor-pointer border-0 bg-transparent p-0 text-[11px] font-bold text-[var(--auth-primary)] hover:underline"
                        onClick={() => onEdit(value)}
                        type="button"
                      >
                        수정
                      </button>
                      <button
                        className="cursor-pointer border-0 bg-transparent p-0 text-[11px] font-bold text-[var(--auth-error)] hover:underline"
                        onClick={() => onDelete(value)}
                        type="button"
                      >
                        삭제
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <footer className="flex min-h-16 items-center justify-between gap-4 border-t border-[var(--auth-border)] px-[18px]">
        <span className="text-[11px] text-[var(--auth-muted)]">
          총 {pagination.totalItems}개 · {firstItem}–{lastItem} 표시
        </span>
        <nav
          aria-label="소분류 페이지 이동"
          className="flex items-center gap-1"
        >
          <button
            className="h-[30px] cursor-pointer rounded-md border-0 bg-transparent px-2 text-[11px] font-bold text-[var(--auth-muted)] disabled:cursor-not-allowed disabled:opacity-35"
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
                'h-[30px] min-w-[30px] cursor-pointer rounded-md border text-[11px] font-bold',
                currentPage === pageNumber
                  ? 'border-[var(--auth-primary)] bg-[var(--auth-primary)] text-white'
                  : 'border-transparent bg-transparent text-[var(--auth-muted)] hover:border-[var(--auth-border)]',
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
            className="h-[30px] cursor-pointer rounded-md border-0 bg-transparent px-2 text-[11px] font-bold text-[var(--auth-muted)] disabled:cursor-not-allowed disabled:opacity-35"
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
