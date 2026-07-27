import { useEffect, useRef } from 'react'
import type { KeyboardEvent, RefObject } from 'react'
import type {
  FeatureGroup,
  FeatureType,
} from '@entities/document-feature'
import { FeatureEditIcon } from './FeatureEditIcon'

type NavigableItem = {
  id: number
}

function handleListKeyDown<T extends NavigableItem>(
  event: KeyboardEvent<HTMLButtonElement>,
  index: number,
  items: T[],
  onSelect: (id: number) => void,
  itemRefs: RefObject<Map<number, HTMLButtonElement>>,
) {
  if (
    !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)
  ) {
    return
  }

  event.preventDefault()
  let nextIndex = index

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

  if (nextIndex === index) {
    return
  }

  const nextItem = items[nextIndex]
  onSelect(nextItem.id)
  itemRefs.current.get(nextItem.id)?.focus({ preventScroll: true })
}

const compactButtonClassName =
  'inline-flex min-h-9 items-center justify-center rounded-control border border-line bg-surface px-2.5 text-caption font-bold text-brand transition-colors hover:border-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-45'

export function FeatureHierarchyPanel({
  groups,
  types,
  selectedGroup,
  selectedType,
  selectedGroupId,
  selectedTypeId,
  isLoadingGroups,
  isLoadingTypes,
  onAddGroup,
  onAddType,
  onSelectGroup,
  onSelectType,
  onEditGroup,
  onEditType,
}: {
  groups: FeatureGroup[]
  types: FeatureType[]
  selectedGroup: FeatureGroup | null
  selectedType: FeatureType | null
  selectedGroupId: number | null
  selectedTypeId: number | null
  isLoadingGroups: boolean
  isLoadingTypes: boolean
  onAddGroup: () => void
  onAddType: () => void
  onSelectGroup: (id: number) => void
  onSelectType: (id: number) => void
  onEditGroup: (group: FeatureGroup) => void
  onEditType: (type: FeatureType) => void
}) {
  const groupRefs = useRef(new Map<number, HTMLButtonElement>())
  const typeRefs = useRef(new Map<number, HTMLButtonElement>())
  const hasAutoFocused = useRef(false)

  useEffect(() => {
    if (
      hasAutoFocused.current ||
      selectedGroupId === null
    ) {
      return
    }

    const selectedElement = groupRefs.current.get(selectedGroupId)
    const activeElement = document.activeElement
    const canAutoFocus =
      activeElement === null || activeElement === document.body

    if (selectedElement && canAutoFocus) {
      selectedElement.focus({ preventScroll: true })
    }
    hasAutoFocused.current = true
  }, [selectedGroupId])

  return (
    <section className="min-w-0 border-b border-line bg-surface lg:min-h-[636px] lg:border-r lg:border-b-0">
      <div className="grid gap-4 p-4 lg:hidden">
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <label
              className="text-label font-bold text-ink-secondary"
              htmlFor="feature-group-select"
            >
              대분류
            </label>
            <div className="flex items-center gap-1.5">
              <button
                className={compactButtonClassName}
                onClick={onAddGroup}
                type="button"
              >
                + 추가
              </button>
              <button
                aria-label="선택한 대분류 수정"
                className="inline-flex size-9 items-center justify-center rounded-control border border-line bg-surface text-brand transition-colors hover:border-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!selectedGroup}
                onClick={() =>
                  selectedGroup && onEditGroup(selectedGroup)
                }
                title="선택한 대분류 수정"
                type="button"
              >
                <FeatureEditIcon />
              </button>
            </div>
          </div>
          <select
            className="min-h-11 w-full rounded-control border border-line bg-surface-field px-3 text-sm text-ink focus:border-brand focus:outline-3 focus:outline-offset-2 focus:outline-focus-ring disabled:opacity-60"
            disabled={isLoadingGroups || groups.length === 0}
            id="feature-group-select"
            onChange={(event) =>
              onSelectGroup(Number(event.target.value))
            }
            value={selectedGroupId ?? ''}
          >
            {groups.length === 0 && (
              <option value="">등록된 대분류가 없습니다.</option>
            )}
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.feature}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <label
              className="text-label font-bold text-ink-secondary"
              htmlFor="feature-type-select"
            >
              중분류
            </label>
            <div className="flex items-center gap-1.5">
              <button
                className={compactButtonClassName}
                disabled={!selectedGroup}
                onClick={onAddType}
                type="button"
              >
                + 추가
              </button>
              <button
                aria-label="선택한 중분류 수정"
                className="inline-flex size-9 items-center justify-center rounded-control border border-line bg-surface text-brand transition-colors hover:border-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!selectedType}
                onClick={() =>
                  selectedType && onEditType(selectedType)
                }
                title="선택한 중분류 수정"
                type="button"
              >
                <FeatureEditIcon />
              </button>
            </div>
          </div>
          <select
            className="min-h-11 w-full rounded-control border border-line bg-surface-field px-3 text-sm text-ink focus:border-brand focus:outline-3 focus:outline-offset-2 focus:outline-focus-ring disabled:opacity-60"
            disabled={isLoadingTypes || types.length === 0}
            id="feature-type-select"
            onChange={(event) =>
              onSelectType(Number(event.target.value))
            }
            value={selectedTypeId ?? ''}
          >
            {types.length === 0 && (
              <option value="">
                {selectedGroup
                  ? '등록된 중분류가 없습니다.'
                  : '대분류를 선택해 주세요.'}
              </option>
            )}
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.feature}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="hidden h-full min-h-[636px] flex-col lg:flex">
        <header className="flex min-h-[76px] items-center justify-between gap-3 border-b border-line px-5">
          <div className="flex items-center gap-2">
            <h2 className="m-0 text-base font-bold text-ink">
              분류 탐색
            </h2>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-soft px-1.5 text-caption font-bold text-brand">
              {groups.length}
            </span>
          </div>
          <button
            className={compactButtonClassName}
            onClick={onAddGroup}
            type="button"
          >
            + 대분류
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {isLoadingGroups && (
            <p className="m-0 px-3 py-8 text-center text-xs text-ink-muted">
              불러오는 중입니다.
            </p>
          )}
          {!isLoadingGroups && groups.length === 0 && (
            <p className="m-0 px-3 py-8 text-center text-xs text-ink-muted">
              등록된 대분류가 없습니다.
            </p>
          )}
          {!isLoadingGroups && groups.length > 0 && (
            <ul
              aria-label="대분류"
              className="m-0 list-none p-0"
            >
              {groups.map((group, groupIndex) => {
                const isSelected = selectedGroupId === group.id

                return (
                  <li className="mb-1" key={group.id}>
                    <div
                      className={[
                        'group/group-row relative flex min-h-12 items-center rounded-control border',
                        isSelected
                          ? 'border-brand-line bg-brand-soft before:absolute before:top-2 before:bottom-2 before:left-[-1px] before:w-[3px] before:rounded-r-sm before:bg-brand'
                          : 'border-transparent hover:bg-surface-subtle',
                      ].join(' ')}
                    >
                      <button
                        aria-current={isSelected ? 'true' : undefined}
                        className="min-h-11 min-w-0 flex-1 cursor-pointer border-0 bg-transparent px-3.5 text-left text-label font-bold text-ink focus-visible:rounded-control focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-brand"
                        onClick={() => onSelectGroup(group.id)}
                        onKeyDown={(event) =>
                          handleListKeyDown(
                            event,
                            groupIndex,
                            groups,
                            onSelectGroup,
                            groupRefs,
                          )
                        }
                        ref={(element) => {
                          if (element) {
                            groupRefs.current.set(group.id, element)
                          } else {
                            groupRefs.current.delete(group.id)
                          }
                        }}
                        type="button"
                      >
                        <span className="block truncate">
                          {group.feature}
                        </span>
                      </button>
                      <button
                        aria-label={`${group.feature} 수정`}
                        className={[
                          'mr-1.5 inline-flex size-9 shrink-0 items-center justify-center rounded-control border-0 bg-transparent text-brand transition-[opacity,background-color] hover:bg-surface',
                          isSelected
                            ? 'opacity-100'
                            : 'opacity-0 group-hover/group-row:opacity-100 group-focus-within/group-row:opacity-100',
                        ].join(' ')}
                        onClick={() => onEditGroup(group)}
                        title={`${group.feature} 수정`}
                        type="button"
                      >
                        <FeatureEditIcon />
                      </button>
                    </div>

                    {isSelected && (
                      <div className="mt-1 ml-5 border-l border-brand-line pl-3">
                        <div className="mb-1 flex min-h-10 items-center justify-between gap-2 px-1">
                          <span className="text-caption font-bold text-ink-muted">
                            중분류 {types.length}
                          </span>
                          <button
                            className="min-h-8 rounded-control border-0 bg-transparent px-2 text-caption font-bold text-brand transition-colors hover:bg-brand-soft"
                            disabled={!selectedGroup}
                            onClick={onAddType}
                            type="button"
                          >
                            + 중분류
                          </button>
                        </div>

                        {isLoadingTypes && (
                          <p className="m-0 px-2 py-5 text-center text-caption text-ink-muted">
                            불러오는 중입니다.
                          </p>
                        )}
                        {!isLoadingTypes && types.length === 0 && (
                          <p className="m-0 px-2 py-5 text-center text-caption text-ink-muted">
                            등록된 중분류가 없습니다.
                          </p>
                        )}
                        {!isLoadingTypes && types.length > 0 && (
                          <ul
                            aria-label={`${group.feature} 중분류`}
                            className="m-0 list-none p-0"
                          >
                            {types.map((type, typeIndex) => {
                              const isTypeSelected =
                                selectedTypeId === type.id

                              return (
                                <li className="mb-1" key={type.id}>
                                  <div
                                    className={[
                                      'group/type-row flex min-h-11 items-center rounded-control',
                                      isTypeSelected
                                        ? 'bg-brand-soft text-brand-strong'
                                        : 'hover:bg-surface-subtle',
                                    ].join(' ')}
                                  >
                                    <button
                                      aria-current={
                                        isTypeSelected
                                          ? 'true'
                                          : undefined
                                      }
                                      className="min-h-11 min-w-0 flex-1 cursor-pointer border-0 bg-transparent px-3 text-left text-caption font-semibold text-inherit focus-visible:rounded-control focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-brand"
                                      onClick={() =>
                                        onSelectType(type.id)
                                      }
                                      onKeyDown={(event) =>
                                        handleListKeyDown(
                                          event,
                                          typeIndex,
                                          types,
                                          onSelectType,
                                          typeRefs,
                                        )
                                      }
                                      ref={(element) => {
                                        if (element) {
                                          typeRefs.current.set(
                                            type.id,
                                            element,
                                          )
                                        } else {
                                          typeRefs.current.delete(type.id)
                                        }
                                      }}
                                      type="button"
                                    >
                                      <span className="block truncate">
                                        {type.feature}
                                      </span>
                                    </button>
                                    <button
                                      aria-label={`${type.feature} 수정`}
                                      className={[
                                        'mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-control border-0 bg-transparent text-brand transition-[opacity,background-color] hover:bg-surface',
                                        isTypeSelected
                                          ? 'opacity-100'
                                          : 'opacity-0 group-hover/type-row:opacity-100 group-focus-within/type-row:opacity-100',
                                      ].join(' ')}
                                      onClick={() => onEditType(type)}
                                      title={`${type.feature} 수정`}
                                      type="button"
                                    >
                                      <FeatureEditIcon />
                                    </button>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
