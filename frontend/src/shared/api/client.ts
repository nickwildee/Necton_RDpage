export type FormErrors = Record<string, string[]>

type ApiErrorPayload = {
  detail?: string
  errors?: FormErrors
}

export class ApiError extends Error {
  status: number
  errors?: FormErrors

  constructor(status: number, message: string, errors?: FormErrors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...init,
  })
  const payload = (await response.json().catch(() => null)) as
    | ApiErrorPayload
    | null

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.detail ?? '요청을 처리하지 못했습니다.',
      payload?.errors,
    )
  }

  return payload as T
}
