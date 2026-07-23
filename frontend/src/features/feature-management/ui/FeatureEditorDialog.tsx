import type { FormEvent } from 'react'
import type { FormErrors } from '@shared/api'
import { ErrorMessages } from '@shared/ui'
import type {
  EditorFieldName,
  FeatureEditorState,
} from '../model/useFeatureManagement'

const fieldClassName = [
  'h-11 w-full rounded-lg border border-[var(--auth-border)]',
  'bg-[var(--auth-field-background)] px-3.5 text-sm text-[var(--auth-text)]',
  'transition-[border-color,box-shadow,background-color] duration-150',
  'focus:border-[var(--auth-primary)] focus:bg-[var(--auth-surface)]',
  'focus:shadow-[0_0_0_3px_var(--auth-focus)] focus:outline-none',
].join(' ')

const labelClassName = 'text-xs font-bold text-[#565b63]'
const errorClassName =
  'mt-1 mb-0 text-[11px] leading-4 text-[var(--auth-error)]'

const kindLabels = {
  group: '대분류',
  type: '중분류',
  value: '소분류',
} as const

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
      className="fixed inset-0 z-50 grid place-items-center bg-[rgb(32_39_52_/_42%)] px-5 py-8"
      role="dialog"
    >
      <form
        className="w-full max-w-[520px] overflow-hidden rounded-xl bg-[var(--auth-surface)] shadow-[0_18px_60px_rgb(32_39_52_/_22%)]"
        onSubmit={handleSubmit}
      >
        <header className="flex min-h-[72px] items-center justify-between border-b border-[var(--auth-border)] px-6">
          <div>
            <p className="m-0 text-[11px] font-bold tracking-[0.08em] text-[var(--auth-primary)]">
              {kindLabel.toUpperCase()}
            </p>
            <h2 className="mt-1 mb-0 text-xl font-bold tracking-[-0.01em]">
              {kindLabel} {isCreate ? '추가' : '수정'}
            </h2>
          </div>
          <button
            aria-label="닫기"
            className="h-10 w-10 cursor-pointer rounded-lg border-0 bg-transparent text-xl text-[var(--auth-muted)] hover:bg-[var(--auth-notice-background)]"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto p-6">
          {error && (
            <p
              className="m-0 rounded-lg border border-[#f0d0cc] bg-[#fff8f7] px-3.5 py-3 text-xs leading-5 text-[var(--auth-error)]"
              role="alert"
            >
              {error}
            </p>
          )}
          <ErrorMessages
            className={errorClassName}
            messages={errors.non_field_errors}
          />

          <label className="flex flex-col gap-2">
            <span className={labelClassName}>
              {kindLabel} 이름 <span className="text-[var(--auth-primary)]">*</span>
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
                <span className="text-[var(--auth-primary)]">*</span>
              )}
            </span>
            <textarea
              aria-describedby={
                errors.description?.length
                  ? 'description-errors'
                  : undefined
              }
              aria-invalid={Boolean(errors.description?.length)}
              className={`${fieldClassName} min-h-24 resize-y py-3`}
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
              {(
                [
                  ['cWeight', 'C'],
                  ['sWeight', 'S'],
                  ['oWeight', 'O'],
                ] as const
              ).map(([name, label]) => (
                <label className="flex flex-col gap-2" key={name}>
                  <span className={labelClassName}>{label}</span>
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

        <footer className="flex min-h-[72px] items-center justify-between gap-4 border-t border-[var(--auth-border)] bg-[#fafbfc] px-6">
          <div>
            {!isCreate && (
              <button
                className="min-h-10 cursor-pointer rounded-lg border border-[#e6c2bd] bg-[var(--auth-surface)] px-4 text-xs font-bold text-[var(--auth-error)] hover:bg-[#fff8f7] disabled:cursor-wait disabled:opacity-60"
                disabled={isSubmitting}
                onClick={() => void onDelete()}
                type="button"
              >
                삭제
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="min-h-10 cursor-pointer rounded-lg border border-[var(--auth-border)] bg-[var(--auth-surface)] px-4 text-xs font-bold text-[var(--auth-muted)] hover:bg-[var(--auth-notice-background)] disabled:cursor-wait disabled:opacity-60"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              취소
            </button>
            <button
              className="min-h-10 cursor-pointer rounded-lg border border-[var(--auth-primary)] bg-[var(--auth-primary)] px-5 text-xs font-bold text-white hover:bg-[var(--auth-primary-hover)] disabled:cursor-wait disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? '저장 중' : '저장'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  )
}
