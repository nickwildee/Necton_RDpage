import type { AuthUser } from '@entities/user'

export type CsrfResponse = {
  csrfToken: string
}

export type SessionResponse = {
  authenticated: boolean
  user: AuthUser | null
}

export type LoginResponse = SessionResponse & CsrfResponse

export type SignupResponse = {
  detail: string
  user: AuthUser
}

export type LoginFields = {
  email: string
  password: string
}

export type SignupFields = {
  email: string
  password: string
  password_confirm: string
  nickname: string
  phone: string
  company: string
}
