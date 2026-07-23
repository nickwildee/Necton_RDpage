import { createContext } from 'react'
import type { AuthUser } from '@entities/user'
import type {
  DetailResponse,
  LoginFields,
  NicknameFields,
  PasswordChangeFields,
  ProfileResponse,
  SignupFields,
  SignupResponse,
} from './types'

export type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  initialError: string | null
  requestWithCsrf: <T>(
    request: (token: string) => Promise<T>,
  ) => Promise<T>
  login: (fields: LoginFields) => Promise<AuthUser>
  signup: (fields: SignupFields) => Promise<SignupResponse>
  logout: () => Promise<void>
  updateNickname: (fields: NicknameFields) => Promise<ProfileResponse>
  changePassword: (
    fields: PasswordChangeFields,
  ) => Promise<DetailResponse>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
