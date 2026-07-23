import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'

type FeatureListItem = {
  id: number
  feature: string
  description: string
}

export function FeatureListPanel<T extends FeatureListItem>({
  title,
  items,
  selectedId,
  isLoading,
  addDisabled,
  emptyText,
  footerText,
  onAdd,
  onSelect,
  onEdit,
  autoFocusSelected = false,
  hasLeadingDivider = false,
}: {
  title: string
  items: T[]
  selectedId: number | null
  isLoading: boolean
  addDisabled?: boolean
  emptyText: string
  footerText: string
  onAdd: () => void
  onSelect: (id: number) => void
  onEdit: (item: T) => void
  autoFocusSelected?: boolean
  hasLeadingDivider?: boolean
}) {
  const itemRefs = useRef(new Map<number, HTMLButtonElement>())
  const hasAutoFocused = useRef(false)

  useEffect(() => {
    if (
      !autoFocusSelected ||
      hasAutoFocused.current ||
      selectedId === null
    ) {
      return
    }

    const selectedElement = itemRefs.current.get(selectedId)
    const activeElement = document.activeElement
    const canAutoFocus =
      activeElement === null || activeElement === document.body

    if (selectedElement && canAutoFocus) {
      selectedElement.focus({ preventScroll: true })
    }
    hasAutoFocused.current = true
  }, [autoFocusSelected, selectedId])

  const selectAndFocus = (item: T) => {
    onSelect(item.id)
    itemRefs.current.get(item.id)?.focus({ preventScroll: true })
  }

  const handleItemKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const navigationKeys = [
      'ArrowDown',
      'ArrowUp',
      'Home',
      'End',
    ]
    if (!navigationKeys.includes(event.key)) {
      return
    }

    event.preventDefault()
    let nextIndex: number | null = null

    if (event.key === 'ArrowDown') {
      nextIndex = Math.min(index + 1, items.length - 1)
    }
    if (event.key === 'ArrowUp') {
      nextIndex = Math.max(index - 1, 0)
    }
    if (event.key === 'Home') {
      nextIndex = 0
    }
    if (event.key === 'End') {
      nextIndex = items.length - 1
    }

    if (nextIndex === null || nextIndex === index) {
      return
    }

    selectAndFocus(items[nextIndex])
  }

  return (
    <section
      className={[
        'flex min-w-0 flex-col bg-[var(--auth-surface)] xl:min-h-[636px]',
        hasLeadingDivider
          ? 'border-t border-[var(--auth-border)] lg:border-t-0 lg:border-l'
          : '',
      ].join(' ')}
    >
      <header className="flex min-h-[76px] items-center justify-between gap-3 border-b border-[var(--auth-border)] px-5">
        <div className="flex items-center gap-2">
          <h2 className="m-0 text-base font-bold tracking-[-0.01em]">
            {title}
          </h2>
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--auth-notice-background)] px-1.5 text-[11px] font-bold text-[var(--auth-primary)]">
            {items.length}
          </span>
        </div>
        <button
          className="min-h-9 cursor-pointer rounded-lg border border-[var(--auth-border)] bg-[var(--auth-surface)] px-3 text-xs font-bold text-[var(--auth-primary)] transition-colors hover:border-[var(--auth-primary)] hover:bg-[var(--auth-notice-background)] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={addDisabled}
          onClick={onAdd}
          type="button"
        >
          + 추가
        </button>
      </header>

      <ul className="m-0 flex min-h-32 flex-1 list-none flex-col gap-1 overflow-y-auto p-3">
        {isLoading && (
          <li className="px-3.5 py-6 text-center text-xs text-[var(--auth-muted)]">
            불러오는 중입니다.
          </li>
        )}
        {!isLoading && items.length === 0 && (
          <li className="px-3.5 py-6 text-center text-xs leading-5 text-[var(--auth-muted)]">
            {emptyText}
          </li>
        )}
        {!isLoading &&
          items.map((item, index) => {
            const isSelected = selectedId === item.id
            return (
              <li
                className={[
                  'relative min-h-[76px] rounded-lg border',
                  isSelected
                    ? 'border-[var(--auth-notice-border)] bg-[var(--auth-notice-background)] before:absolute before:top-3 before:bottom-3 before:left-[-1px] before:w-[3px] before:rounded-r-sm before:bg-[var(--auth-primary)]'
                    : 'border-transparent hover:bg-[#f8f9fb]',
                ].join(' ')}
                key={item.id}
              >
                <button
                  aria-current={isSelected ? 'true' : undefined}
                  className="flex min-h-[74px] w-full cursor-pointer flex-col justify-center border-0 bg-transparent px-3.5 py-3 pr-14 text-left focus-visible:rounded-lg focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--auth-primary)]"
                  onClick={() => onSelect(item.id)}
                  onKeyDown={(event) =>
                    handleItemKeyDown(event, index)
                  }
                  ref={(element) => {
                    if (element) {
                      itemRefs.current.set(item.id, element)
                    } else {
                      itemRefs.current.delete(item.id)
                    }
                  }}
                  type="button"
                >
                  <span className="w-full truncate text-[13px] leading-[1.35] font-bold text-[var(--auth-text)]">
                    {item.feature}
                  </span>
                  <span className="mt-1 line-clamp-2 text-[11px] leading-[1.45] text-[var(--auth-muted)]">
                    {item.description}
                  </span>
                </button>
                <button
                  aria-label={`${item.feature} 수정`}
                  className="absolute top-3 right-2.5 cursor-pointer border-0 bg-transparent px-1 py-1 text-[11px] font-bold text-[var(--auth-primary)] hover:underline"
                  onClick={() => onEdit(item)}
                  type="button"
                >
                  수정
                </button>
              </li>
            )
          })}
      </ul>

      <footer className="min-h-12 border-t border-[var(--auth-border)] px-5 text-[11px] leading-12 text-[var(--auth-muted)]">
        {footerText}
      </footer>
    </section>
  )
}
