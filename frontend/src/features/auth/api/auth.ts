import { apiRequest } from '@shared/api'
import type {
  CsrfResponse,
  DetailResponse,
  LoginFields,
  LoginResponse,
  NicknameFields,
  PasswordChangeFields,
  ProfileResponse,
  SessionResponse,
  SignupFields,
  SignupResponse,
} from '../model/types'

export function fetchCsrfToken() {
  return apiRequest<CsrfResponse>('/api/auth/csrf/')
}

export function fetchSession() {
  return apiRequest<SessionResponse>('/api/auth/me/')
}

function postJson<T>(path: string, data: object, csrfToken: string) {
  return apiRequest<T>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify(data),
  })
}

export function login(fields: LoginFields, csrfToken: string) {
  return postJson<LoginResponse>('/api/auth/login/', fields, csrfToken)
}

export function signup(fields: SignupFields, csrfToken: string) {
  return postJson<SignupResponse>('/api/auth/signup/', fields, csrfToken)
}

export function logout(csrfToken: string) {
  return postJson<LoginResponse>('/api/auth/logout/', {}, csrfToken)
}

export function updateNickname(
  fields: NicknameFields,
  csrfToken: string,
) {
  return apiRequest<ProfileResponse>('/api/auth/profile/', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify(fields),
  })
}

export function changePassword(
  fields: PasswordChangeFields,
  csrfToken: string,
) {
  return postJson<DetailResponse>(
    '/api/auth/password/',
    fields,
    csrfToken,
  )
}
