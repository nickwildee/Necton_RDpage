import type { FormEvent } from 'react'
import type { FormErrors } from '@shared/api'
import { Alert, Button, ErrorMessages } from '@shared/ui'
import type {
  EditorFieldName,
  FeatureEditorState,
} from '../model/useFeatureManagement'

const fieldClassName = [
  'h-11 w-full rounded-control border border-line',
  'bg-surface-field px-3.5 text-sm text-ink',
  'transition-[border-color,box-shadow,background-color] duration-150',
  'focus:border-brand focus:bg-surface',
  'focus:shadow-focus focus:outline-none',
].join(' ')

const labelClassName = 'text-xs font-bold text-ink-secondary'
const errorClassName =
  'mt-1 mb-0 text-caption leading-4 text-danger'

const kindLabels = {
  group: '대분류',
  type: '중분류',
  value: '소분류',
} as const

const weightFields = [
  { name: 'cWeight', code: 'C', label: '기밀' },
  { name: 'sWeight', code: 'S', label: '민감' },
  { name: 'oWeight', code: 'O', label: '공개' },
] as const

export function FeatureEditorDialog({
  editor,
  errors,
  error,
  isSubmitting,
  onFieldChange,
  onClose,
  onSubmit,
  onDelete,
}: {
  editor: FeatureEditorState
  errors: FormErrors
  error: string | null
  isSubmitting: boolean
  onFieldChange: (name: EditorFieldName, value: string) => void
  onClose: () => void
  onSubmit: () => Promise<void>
  onDelete: () => Promise<void>
}) {
  const kindLabel = kindLabels[editor.kind]
  const isCreate = editor.mode === 'create'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void onSubmit()
  }

  return (
    <div
      aria-label={`${kindLabel} ${isCreate ? '추가' : '수정'}`}
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-overlay px-5 py-8"
      role="dialog"
    >
      <form
        className="w-full max-w-dialog overflow-hidden rounded-panel bg-surface shadow-dialog"
        onSubmit={handleSubmit}
      >
        <header className="flex min-h-[72px] items-center justify-between border-b border-line px-6">
          <div>
            <p className="m-0 text-caption font-bold tracking-eyebrow text-brand">
              {kindLabel.toUpperCase()}
            </p>
            <h2 className="mt-1 mb-0 text-xl font-bold tracking-heading">
              {kindLabel} {isCreate ? '추가' : '수정'}
            </h2>
          </div>
          <button
            aria-label="닫기"
            className="h-10 w-10 cursor-pointer rounded-control border-0 bg-transparent text-xl text-ink-muted hover:bg-brand-soft"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto p-6">
          {error && (
            <Alert className="m-0" size="compact" tone="danger">
              {error}
            </Alert>
          )}
          <ErrorMessages
            className={errorClassName}
            messages={errors.non_field_errors}
          />

          <label className="flex flex-col gap-2">
            <span className={labelClassName}>
              {kindLabel} 이름 <span className="text-brand">*</span>
            </span>
            <input
              aria-describedby={
                errors.feature?.length ? 'feature-errors' : undefined
              }
              aria-invalid={Boolean(errors.feature?.length)}
              autoFocus
              className={fieldClassName}
              maxLength={editor.kind === 'group' ? 100 : 255}
              onChange={(event) =>
                onFieldChange('feature', event.target.value)
              }
              required
              value={editor.fields.feature}
            />
            <ErrorMessages
              className={errorClassName}
              id="feature-errors"
              messages={errors.feature}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className={labelClassName}>
              설명{' '}
              {editor.kind !== 'value' && (
                <span className="text-brand">*</span>
              )}
            </span>
            <textarea
              aria-describedby={
                errors.description?.length
                  ? 'description-errors'
                  : undefined
              }
              aria-invalid={Boolean(errors.description?.length)}
              className={`${fieldClassName} min-h-24 resize-none py-3`}
              maxLength={editor.kind === 'group' ? 500 : 255}
              onChange={(event) =>
                onFieldChange('description', event.target.value)
              }
              required={editor.kind !== 'value'}
              value={editor.fields.description}
            />
            <ErrorMessages
              className={errorClassName}
              id="description-errors"
              messages={errors.description}
            />
          </label>

          {editor.kind === 'type' && (
            <label className="flex flex-col gap-2">
              <span className={labelClassName}>메모</span>
              <input
                aria-describedby={
                  errors.note?.length ? 'note-errors' : undefined
                }
                aria-invalid={Boolean(errors.note?.length)}
                className={fieldClassName}
                maxLength={100}
                onChange={(event) =>
                  onFieldChange('note', event.target.value)
                }
                value={editor.fields.note}
              />
              <ErrorMessages
                className={errorClassName}
                id="note-errors"
                messages={errors.note}
              />
            </label>
          )}

          {editor.kind === 'value' && (
            <fieldset className="m-0 grid grid-cols-3 gap-3 border-0 p-0">
              <legend className={`${labelClassName} mb-2`}>
                가중치
              </legend>
              {weightFields.map(({ name, code, label }) => (
                <label className="flex flex-col gap-2" key={name}>
                  <span className={labelClassName}>
                    {label}{' '}
                    <span className="text-caption text-ink-muted">
                      ({code})
                    </span>
                  </span>
                  <input
                    aria-invalid={Boolean(errors[name]?.length)}
                    className={fieldClassName}
                    max={127}
                    min={-128}
                    onChange={(event) =>
                      onFieldChange(name, event.target.value)
                    }
                    step={1}
                    type="number"
                    value={editor.fields[name]}
                  />
                  <ErrorMessages
                    className={errorClassName}
                    messages={errors[name]}
                  />
                </label>
              ))}
            </fieldset>
          )}
        </div>

        <footer className="flex min-h-[72px] items-center justify-between gap-4 border-t border-line bg-surface-muted px-6">
          <div>
            {!isCreate && (
              <Button
                disabled={isSubmitting}
                onClick={() => void onDelete()}
                size="compact"
                type="button"
                variant="danger"
              >
                삭제
              </Button>
            )}
          </div>
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
              {isSubmitting ? '저장 중' : '저장'}
            </Button>
          </div>
        </footer>
      </form>
    </div>
  )
}
