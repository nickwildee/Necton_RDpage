import type { DragEvent, FormEvent } from 'react'
import type { FormErrors } from '@shared/api'
import { Alert, Button, ErrorMessages } from '@shared/ui'
import type { ImageReferenceEditor } from '../model/useImageReferences'

const fieldClassName = [
  'w-full rounded-control border border-line bg-surface-field',
  'px-3.5 text-sm text-ink',
  'transition-[border-color,box-shadow,background-color] duration-150',
  'focus:border-brand focus:bg-surface focus:shadow-focus focus:outline-none',
].join(' ')

const labelClassName = 'text-xs font-bold text-ink-secondary'
const errorClassName =
  'mt-1 mb-0 text-caption leading-4 text-danger'

export function ImageReferenceDialog({
  editor,
  errors,
  error,
  isSubmitting,
  onClose,
  onDescriptionChange,
  onFileChange,
  onSubmit,
  onDeactivate,
}: {
  editor: ImageReferenceEditor
  errors: FormErrors
  error: string | null
  isSubmitting: boolean
  onClose: () => void
  onDescriptionChange: (description: string) => void
  onFileChange: (file: File | null) => void
  onSubmit: () => Promise<void>
  onDeactivate: () => Promise<void>
}) {
  const isCreate = editor.mode === 'create'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void onSubmit()
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!isSubmitting && isCreate) {
      onFileChange(event.dataTransfer.files[0] ?? null)
    }
  }

  return (
    <div
      aria-label={isCreate ? '이미지 등록' : '이미지 설명 수정'}
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-overlay px-5 py-8"
      role="dialog"
    >
      <form
        className="w-full max-w-dialog overflow-hidden rounded-panel bg-surface shadow-dialog"
        onSubmit={handleSubmit}
      >
        <header className="flex min-h-[76px] items-center justify-between border-b border-line px-6">
          <div>
            <p className="m-0 text-caption font-bold tracking-eyebrow text-brand">
              IMAGE REFERENCE
            </p>
            <h2 className="mt-1 mb-0 text-xl font-bold tracking-heading text-ink">
              {isCreate ? '이미지 등록' : '이미지 설명 수정'}
            </h2>
          </div>
          <button
            aria-label="닫기"
            className="size-10 cursor-pointer rounded-control border-0 bg-transparent text-xl text-ink-muted hover:bg-brand-soft"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="flex max-h-[72vh] flex-col gap-5 overflow-y-auto p-6">
          {error && (
            <Alert className="m-0" size="compact" tone="danger">
              {error}
            </Alert>
          )}

          {isCreate ? (
            <div className="grid gap-2">
              <span className={labelClassName}>
                이미지 파일 <span className="text-brand">*</span>
              </span>
              <div
                className="grid min-h-44 place-items-center rounded-panel border border-dashed border-brand-line bg-brand-soft px-5 py-6 text-center"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                <div>
                  <span className="mx-auto grid size-12 place-items-center rounded-full bg-surface text-2xl text-brand shadow-panel-subtle">
                    ↑
                  </span>
                  <p className="mt-3 mb-0 text-sm font-bold text-ink">
                    파일을 끌어놓거나 선택해 주세요
                  </p>
                  <p className="mt-1.5 mb-0 text-caption text-ink-muted">
                    JPEG · PNG · 정지 GIF · 정지 WebP
                  </p>
                  <label className="mt-3 inline-flex min-h-9 cursor-pointer items-center rounded-control border border-brand-line bg-surface px-3 text-caption font-bold text-brand hover:border-brand focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-brand">
                    파일 선택
                    <input
                      accept=".jpg,.jpeg,.png,.gif,.webp"
                      className="sr-only"
                      disabled={isSubmitting}
                      onChange={(event) =>
                        onFileChange(event.target.files?.[0] ?? null)
                      }
                      type="file"
                    />
                  </label>
                  {editor.file && (
                    <p
                      className="mt-3 mb-0 max-w-[360px] truncate text-caption font-bold text-brand-strong"
                      title={editor.file.name}
                    >
                      선택됨 · {editor.file.name}
                    </p>
                  )}
                </div>
              </div>
              <ErrorMessages
                className={errorClassName}
                messages={errors.image}
              />
            </div>
          ) : (
            <div className="grid min-h-36 overflow-hidden rounded-panel border border-line sm:grid-cols-[170px_minmax(0,1fr)]">
              <div className="grid min-h-36 place-items-center border-b border-line bg-surface-subtle p-3 sm:border-r sm:border-b-0">
                <img
                  alt={editor.item.description}
                  className="max-h-32 w-full object-contain"
                  src={editor.item.fileUrl}
                />
              </div>
              <div className="min-w-0 p-5">
                <span className="text-caption font-bold text-ink-muted">
                  원본 파일명
                </span>
                <p
                  className="mt-1.5 mb-0 truncate text-sm font-bold text-ink"
                  title={editor.item.originName}
                >
                  {editor.item.originName}
                </p>
                <p
                  className="mt-3 mb-0 truncate text-caption text-ink-muted"
                  title={editor.item.storedName}
                >
                  {editor.item.storedName}
                </p>
              </div>
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className={labelClassName}>
              설명 <span className="text-brand">*</span>
            </span>
            <textarea
              aria-describedby={
                errors.description?.length
                  ? 'image-description-errors'
                  : undefined
              }
              aria-invalid={Boolean(errors.description?.length)}
              className={`${fieldClassName} min-h-24 resize-none py-3`}
              maxLength={255}
              onChange={(event) =>
                onDescriptionChange(event.target.value)
              }
              placeholder="이미지의 의미와 사용처를 입력해 주세요."
              required
              value={editor.description}
            />
            <ErrorMessages
              className={errorClassName}
              id="image-description-errors"
              messages={errors.description}
            />
            <p className="m-0 text-caption leading-5 text-ink-muted">
              {isCreate
                ? '원본 파일명은 보존하고 저장 파일명은 SHA-256으로 생성합니다.'
                : '파일과 최초 등록자 정보는 수정되지 않습니다.'}
            </p>
          </label>
        </div>

        <footer
          className={[
            'flex min-h-[72px] items-center gap-3 border-t border-line bg-surface-muted px-6',
            isCreate ? 'justify-end' : 'justify-between',
          ].join(' ')}
        >
          {!isCreate && (
            <Button
              disabled={isSubmitting}
              onClick={() => void onDeactivate()}
              size="compact"
              type="button"
              variant="danger"
            >
              비활성화
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Button
              disabled={isSubmitting}
              onClick={onClose}
              size="compact"
              type="button"
              variant="neutral"
            >
              취소
            </Button>
            <Button
              disabled={isSubmitting}
              size="compact"
              type="submit"
            >
              {isSubmitting
                ? isCreate
                  ? '등록 중'
                  : '저장 중'
                : isCreate
                  ? '등록'
                  : '저장'}
            </Button>
          </div>
        </footer>
      </form>
    </div>
  )
}
