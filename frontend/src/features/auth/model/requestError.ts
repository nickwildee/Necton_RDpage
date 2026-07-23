import { ApiError } from '@shared/api'
import type { FormErrors } from '@shared/api'

export function requestError(error: unknown): {
  errors: FormErrors
  message: string | null
} {
  if (error instanceof ApiError) {
    const errors = error.errors ?? {}
    return {
      errors,
      message: Object.keys(errors).length === 0 ? error.message : null,
    }
  }

  return {
    errors: {},
    message: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
  }
}
