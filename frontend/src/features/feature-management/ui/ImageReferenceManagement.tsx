import { useCallback, useEffect, useRef, useState } from 'react'
import type { UIEvent } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type {
  FeatureValue,
  ImageReference,
} from '@entities/document-feature'
import { Alert, Button } from '@shared/ui'
import { useImageReferences } from '../model/useImageReferences'
import { FeatureDeleteIcon } from './FeatureDeleteIcon'
import { FeatureEditIcon } from './FeatureEditIcon'
import { ImageReferenceDialog } from './ImageReferenceDialog'

const SCROLL_EDGE_EPSILON_PX = 4
const LOAD_MORE_THRESHOLD_PX = 180
const SCROLL_PAGE_RATIO = 0.8
const IMAGE_CARD_ESTIMATED_WIDTH_PX = 256
const IMAGE_CARD_GAP_PX = 12
const IMAGE_CARD_OVERSCAN = 3

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date)
}

function ImageCard({
  image,
  onEdit,
  onDeactivate,
}: {
  image: ImageReference
  onEdit: (image: ImageReference) => void
  onDeactivate: (image: ImageReference) => void
}) {
  return (
    <article className="w-full overflow-hidden rounded-panel border border-line bg-surface">
      <div className="grid h-36 place-items-center border-b border-line-subtle bg-surface-subtle p-4">
        <img
          alt={image.description}
          className="max-h-full w-full object-contain"
          loading="lazy"
          src={image.fileUrl}
        />
      </div>
      <div className="p-3.5">
        <p
          className="m-0 truncate text-label font-bold text-ink"
          title={image.originName}
        >
          {image.originName}
        </p>
        <p
          className="mt-1 mb-0 truncate text-caption text-ink-muted"
          title={image.description}
        >
          {image.description}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line-subtle pt-2.5">
          <span className="shrink-0 whitespace-nowrap text-caption text-ink-muted">
            {formatDate(image.registeredAt)}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <button
              aria-label={`${image.originName} 설명 수정`}
              className="inline-flex size-11 cursor-pointer items-center justify-center rounded-compact border border-line bg-surface text-brand hover:border-brand hover:bg-brand-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand md:size-8"
              onClick={() => onEdit(image)}
              title="설명 수정"
              type="button"
            >
              <FeatureEditIcon />
            </button>
            <button
              aria-label={`${image.originName} 비활성화`}
              className="inline-flex size-11 cursor-pointer items-center justify-center rounded-compact border border-line bg-surface text-danger hover:border-danger-line-strong hover:bg-danger-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand md:size-8"
              onClick={() => onDeactivate(image)}
              title="비활성화"
              type="button"
            >
              <FeatureDeleteIcon />
            </button>
          </span>
        </div>
      </div>
    </article>
  )
}

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'left' | 'right'
  disabled: boolean
  onClick: () => void
}) {
  const label =
    direction === 'left' ? '이전 이미지 보기' : '다음 이미지 보기'
  return (
    <button
      aria-label={label}
      className="hidden h-12 w-11 cursor-pointer items-center justify-center self-center rounded-control border border-line bg-surface text-2xl text-brand shadow-panel-subtle hover:border-brand disabled:cursor-not-allowed disabled:opacity-30 sm:inline-flex"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {direction === 'left' ? '‹' : '›'}
    </button>
  )
}

export function ImageReferenceManagement({
  selectedValue,
}: {
  selectedValue: FeatureValue | null
}) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const selectedValueId = selectedValue?.id ?? null
  const [isExpanded, setIsExpanded] = useState(
    selectedValueId !== null,
  )
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const management = useImageReferences(selectedValueId)
  const {
    images,
    pagination,
    isLoading,
    isLoadingMore,
    error,
    editor,
    editorErrors,
    editorError,
    isSubmitting,
    loadMore,
    openCreate,
    openEdit,
    closeEditor,
    changeDescription,
    changeFile,
    submitEditor,
    deactivateEditorItem,
    deactivateItem,
  } = management
  const getVirtualItemKey = useCallback(
    (index: number) =>
      index < images.length ? images[index].id : 'loading-more',
    [images],
  )
  const virtualItemCount =
    images.length + (isLoadingMore ? 1 : 0)
  const imageVirtualizer = useVirtualizer({
    count: virtualItemCount,
    estimateSize: () => IMAGE_CARD_ESTIMATED_WIDTH_PX,
    gap: IMAGE_CARD_GAP_PX,
    getItemKey: getVirtualItemKey,
    getScrollElement: () => carouselRef.current,
    horizontal: true,
    overscan: IMAGE_CARD_OVERSCAN,
    useFlushSync: false,
  })
  const virtualItems = imageVirtualizer.getVirtualItems()
  const firstVirtualItem = virtualItems[0]
  const lastVirtualItem = virtualItems.at(-1)

  useEffect(() => {
    setIsExpanded(selectedValueId !== null)
  }, [selectedValueId])

  const syncScrollState = useCallback(() => {
    const carousel = carouselRef.current
    if (!carousel) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }
    setCanScrollLeft(carousel.scrollLeft > SCROLL_EDGE_EPSILON_PX)
    setCanScrollRight(
      carousel.scrollLeft + carousel.clientWidth
        < carousel.scrollWidth - SCROLL_EDGE_EPSILON_PX,
    )
  }, [])

  useEffect(() => {
    const carousel = carouselRef.current
    const frame = window.requestAnimationFrame(syncScrollState)
    const resizeObserver = carousel
      ? new ResizeObserver(syncScrollState)
      : null
    if (carousel) {
      resizeObserver?.observe(carousel)
    }
    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
    }
  }, [images, isExpanded, syncScrollState])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const carousel = event.currentTarget
    syncScrollState()
    if (
      carousel.scrollWidth -
        carousel.scrollLeft -
        carousel.clientWidth <
      LOAD_MORE_THRESHOLD_PX
    ) {
      void loadMore()
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    const carousel = carouselRef.current
    if (!carousel) {
      return
    }
    carousel.scrollBy({
      left:
        carousel.clientWidth
        * (direction === 'left'
          ? -SCROLL_PAGE_RATIO
          : SCROLL_PAGE_RATIO),
      behavior: 'smooth',
    })
    if (direction === 'right') {
      void loadMore()
    }
  }

  const loadedRatio =
    pagination.totalItems === 0
      ? 0
      : Math.min(100, (images.length / pagination.totalItems) * 100)

  return (
    <>
      <section className="border-t border-line bg-surface-muted">
        <header
          className={[
            'flex min-h-[76px] items-center justify-between gap-4 px-4 py-3 sm:px-6',
            isExpanded ? 'border-b border-line' : '',
          ].join(' ')}
        >
          <button
            aria-controls="image-reference-content"
            aria-expanded={isExpanded}
            aria-label={
              selectedValue
                ? `${selectedValue.feature} 이미지 ${isExpanded ? '접기' : '펼치기'}`
                : '등록 이미지'
            }
            className="group inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-line bg-surface p-0 text-brand transition-colors hover:border-brand focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-default disabled:text-ink-disabled"
            disabled={!selectedValue}
            onClick={() => setIsExpanded((current) => !current)}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d={isExpanded ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="m-0 truncate text-base font-bold tracking-heading text-ink">
                {selectedValue
                  ? `${selectedValue.feature} 이미지`
                  : '등록 이미지'}
              </h2>
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-soft px-1.5 text-caption font-bold text-brand">
                {pagination.totalItems}
              </span>
            </div>
            <p className="mt-1 mb-0 truncate text-caption text-ink-muted">
              {selectedValue
                ? isExpanded
                  ? '선택한 소분류에 등록된 참조 이미지입니다.'
                  : '눌러서 이미지 등록과 기존 목록을 펼칩니다.'
                : '소분류를 선택하면 등록 이미지를 확인할 수 있습니다.'}
            </p>
          </div>
          {selectedValue && isExpanded && (
            <Button
              className="shrink-0"
              onClick={openCreate}
              size="toolbar"
              type="button"
            >
              + 이미지 등록
            </Button>
          )}
        </header>

        {isExpanded && (
          <div id="image-reference-content">
            {error && (
              <Alert
                className="mx-4 mt-4 sm:mx-6"
                size="compact"
                tone="danger"
              >
                {error}
              </Alert>
            )}

            {selectedValue && isLoading && (
              <p className="m-0 px-6 py-16 text-center text-xs text-ink-muted">
                이미지를 불러오는 중입니다.
              </p>
            )}
            {selectedValue && !isLoading && images.length === 0 && (
              <p className="m-0 px-6 py-16 text-center text-xs text-ink-muted">
                등록된 이미지가 없습니다. 첫 이미지를 등록해 주세요.
              </p>
            )}

            {selectedValue && images.length > 0 && (
              <div className="px-3 py-4 sm:px-5">
                <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[44px_minmax(0,1fr)_44px]">
                  <ArrowButton
                    direction="left"
                    disabled={!canScrollLeft}
                    onClick={() => scroll('left')}
                  />
                  <div
                    aria-label={`${selectedValue.feature} 등록 이미지`}
                    className="min-w-0 snap-x snap-mandatory overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    onScroll={handleScroll}
                    ref={carouselRef}
                    tabIndex={0}
                  >
                    <div
                      className="relative"
                      style={{
                        width: `${imageVirtualizer.getTotalSize()}px`,
                      }}
                    >
                      <div
                        className="flex gap-3"
                        style={{
                          paddingLeft: `${firstVirtualItem?.start ?? 0}px`,
                          paddingRight: `${
                            lastVirtualItem
                              ? Math.max(
                                  0,
                                  imageVirtualizer.getTotalSize() -
                                    lastVirtualItem.end,
                                )
                              : 0
                          }px`,
                          width: `${imageVirtualizer.getTotalSize()}px`,
                        }}
                      >
                        {virtualItems.map((virtualItem) => {
                          const image = images[virtualItem.index]
                          if (!image) {
                            return (
                              <div
                                className="grid min-w-[180px] place-items-center text-caption text-ink-muted"
                                data-index={virtualItem.index}
                                key={virtualItem.key}
                                ref={imageVirtualizer.measureElement}
                              >
                                더 불러오는 중
                              </div>
                            )
                          }
                          return (
                            <div
                              className="w-60 shrink-0 snap-start sm:w-64"
                              data-image-reference-card={image.id}
                              data-index={virtualItem.index}
                              key={virtualItem.key}
                              ref={imageVirtualizer.measureElement}
                            >
                              <ImageCard
                                image={image}
                                onDeactivate={(item) =>
                                  void deactivateItem(item)
                                }
                                onEdit={openEdit}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <ArrowButton
                    direction="right"
                    disabled={
                      !canScrollRight &&
                      pagination.page >= pagination.totalPages
                    }
                    onClick={() => scroll('right')}
                  />
                </div>
                <div className="mx-auto mt-2 h-1 w-28 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-brand transition-[width]"
                    style={{ width: `${loadedRatio}%` }}
                  />
                </div>
                <p className="mt-1.5 mb-0 text-center text-caption text-ink-muted">
                  {images.length} / {pagination.totalItems}개 불러옴
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {editor && (
        <ImageReferenceDialog
          editor={editor}
          error={editorError}
          errors={editorErrors}
          isSubmitting={isSubmitting}
          onClose={closeEditor}
          onDeactivate={deactivateEditorItem}
          onDescriptionChange={changeDescription}
          onFileChange={changeFile}
          onSubmit={submitEditor}
        />
      )}
    </>
  )
}
